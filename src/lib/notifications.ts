import { getDb, ensureDbInitialized } from './db';
import { sendDueBillsReminderEmail, DueBillItem } from './email';

export interface NotificationResult {
  processedUsers: number;
  emailsSent: number;
  skippedAlreadySent: number;
  noBillsFound: number;
  errors: string[];
}

export async function processDueBillsReminders(options?: {
  targetUserId?: string;
  forceSend?: boolean;
  targetDate?: string;
}): Promise<NotificationResult> {
  await ensureDbInitialized();
  const db = getDb();

  // Get current date string and day in Brasília time (America/Sao_Paulo) or simulated targetDate
  let parts: string;
  if (options?.targetDate && /^\d{4}-\d{2}-\d{2}$/.test(options.targetDate)) {
    parts = options.targetDate;
  } else {
    const now = new Date();
    parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now); // format: YYYY-MM-DD
  }

  const [year, month, day] = parts.split('-');
  const currentYearMonth = `${year}-${month}`;
  const currentDayNumber = parseInt(day, 10);
  const datePtBr = `${day}/${month}/${year}`;

  const result: NotificationResult = {
    processedUsers: 0,
    emailsSent: 0,
    skippedAlreadySent: 0,
    noBillsFound: 0,
    errors: [],
  };

  // Fetch users to process
  let usersRes;
  try {
    let usersQuery = 'SELECT id, email, name, email_notifications_enabled FROM users WHERE email_notifications_enabled != 0';
    let usersArgs: any[] = [];
    if (options?.targetUserId) {
      usersQuery = 'SELECT id, email, name, email_notifications_enabled FROM users WHERE id = ?';
      usersArgs = [options.targetUserId];
    }
    usersRes = await db.execute({ sql: usersQuery, args: usersArgs });
  } catch {
    // Fallback if column email_notifications_enabled doesn't exist yet
    let fallbackQuery = 'SELECT id, email, name FROM users';
    let fallbackArgs: any[] = [];
    if (options?.targetUserId) {
      fallbackQuery = 'SELECT id, email, name FROM users WHERE id = ?';
      fallbackArgs = [options.targetUserId];
    }
    usersRes = await db.execute({ sql: fallbackQuery, args: fallbackArgs });
  }

  for (const userRow of usersRes.rows) {
    try {
      result.processedUsers++;
      const userId = String(userRow.id);
      const userEmail = String(userRow.email);
      const userName = String(userRow.name || userEmail.split('@')[0]);

      // Check if already sent today (unless forceSend is true)
      if (!options?.forceSend) {
        try {
          const sentTodayRes = await db.execute({
            sql: 'SELECT id FROM email_notifications WHERE user_id = ? AND sent_date = ? LIMIT 1',
            args: [userId, parts],
          });

          if (sentTodayRes.rows.length > 0) {
            result.skippedAlreadySent++;
            continue;
          }
        } catch {
          // email_notifications table might not exist yet; safe to proceed
        }
      }

      const dueBills: DueBillItem[] = [];

      // 1. Check Recurring Bills due today
      try {
        const recRes = await db.execute({
          sql: 'SELECT id, title, amount, category, due_day, paid_months FROM recurring_bills WHERE user_id = ? AND active = 1 AND due_day = ?',
          args: [userId, currentDayNumber],
        });

        for (const r of recRes.rows) {
          let paidMonths: string[] = [];
          if (r.paid_months) {
            try {
              paidMonths = JSON.parse(String(r.paid_months));
            } catch {
              paidMonths = [];
            }
          }

          if (!paidMonths.includes(currentYearMonth)) {
            dueBills.push({
              title: String(r.title),
              category: String(r.category),
              amount: Number(r.amount),
              type: 'recurring',
            });
          }
        }
      } catch (err) {
        console.error(`Erro ao buscar contas fixas para ${userId}:`, err);
      }

      // 2. Check pending expense transactions with date = today
      try {
        const txRes = await db.execute({
          sql: 'SELECT id, description, amount, category FROM transactions WHERE user_id = ? AND type = ? AND status = ? AND date = ?',
          args: [userId, 'expense', 'pending', parts],
        });

        for (const tx of txRes.rows) {
          const alreadyInList = dueBills.some(
            (b) => b.title.toLowerCase() === String(tx.description).toLowerCase()
          );
          if (!alreadyInList) {
            dueBills.push({
              title: String(tx.description),
              category: String(tx.category),
              amount: Number(tx.amount),
              type: 'transaction',
            });
          }
        }
      } catch (err) {
        console.error(`Erro ao buscar transações pendentes para ${userId}:`, err);
      }

      // 3. Check active installment purchases due today
      try {
        const instRes = await db.execute({
          sql: 'SELECT id, description, installment_amount, total_installments, paid_installments, start_date, category, payment_card FROM installment_purchases WHERE user_id = ? AND paid_installments < total_installments',
          args: [userId],
        });

        for (const inst of instRes.rows) {
          const startDateStr = String(inst.start_date || '');
          if (!startDateStr || !startDateStr.includes('-')) continue;

          const [sYear, sMonth, sDay] = startDateStr.split('-').map(Number);
          const instDueDay = sDay || 1;

          if (instDueDay === currentDayNumber) {
            const [cYear, cMonth] = parts.split('-').map(Number);
            const monthDiff = (cYear - sYear) * 12 + (cMonth - sMonth);
            const totalInst = Number(inst.total_installments);
            const paidInst = Number(inst.paid_installments);

            if (monthDiff >= 0 && monthDiff < totalInst) {
              if (paidInst <= monthDiff) {
                const currentParcelNumber = monthDiff + 1;
                const cardInfo = inst.payment_card ? ` (${inst.payment_card})` : '';
                dueBills.push({
                  title: `${inst.description} - Parcela ${currentParcelNumber}/${totalInst}${cardInfo}`,
                  category: String(inst.category || 'Compras Parceladas'),
                  amount: Number(inst.installment_amount),
                  type: 'installment',
                });
              }
            }
          }
        }
      } catch (err) {
        console.error(`Erro ao buscar parcelamentos para ${userId}:`, err);
      }

      if (dueBills.length === 0) {
        result.noBillsFound++;
        continue;
      }

      // Send email
      const sendRes = await sendDueBillsReminderEmail({
        to: userEmail,
        userName,
        bills: dueBills,
        dateStr: datePtBr,
      });

      if (sendRes.success) {
        result.emailsSent++;
        const totalAmount = dueBills.reduce((s, b) => s + b.amount, 0);

        try {
          await db.execute({
            sql: 'INSERT INTO email_notifications (id, user_id, email, sent_date, bill_count, total_amount, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            args: [
              `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              userId,
              userEmail,
              parts,
              dueBills.length,
              totalAmount,
              new Date().toISOString(),
            ],
          });
        } catch {
          // ignore log insert if table isn't ready
        }
      } else {
        result.errors.push(`Falha para ${userEmail}: ${sendRes.error}`);
      }
    } catch (userErr: unknown) {
      const msg = userErr instanceof Error ? userErr.message : String(userErr);
      console.error(`Erro ao processar lembretes para usuário:`, userErr);
      result.errors.push(msg);
    }
  }

  return result;
}
