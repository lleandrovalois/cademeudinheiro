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
}): Promise<NotificationResult> {
  await ensureDbInitialized();
  const db = getDb();

  // Get current date string and day in Brasília time (America/Sao_Paulo)
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now); // format: YYYY-MM-DD

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
  let usersQuery = 'SELECT id, email, name, email_notifications_enabled FROM users WHERE email_notifications_enabled != 0';
  let usersArgs: any[] = [];

  if (options?.targetUserId) {
    usersQuery = 'SELECT id, email, name, email_notifications_enabled FROM users WHERE id = ?';
    usersArgs = [options.targetUserId];
  }

  const usersRes = await db.execute({
    sql: usersQuery,
    args: usersArgs,
  });

  for (const userRow of usersRes.rows) {
    result.processedUsers++;
    const userId = String(userRow.id);
    const userEmail = String(userRow.email);
    const userName = String(userRow.name || userEmail.split('@')[0]);

    // Check if already sent today (unless forceSend is true)
    if (!options?.forceSend) {
      const sentTodayRes = await db.execute({
        sql: 'SELECT id FROM email_notifications WHERE user_id = ? AND sent_date = ? LIMIT 1',
        args: [userId, parts],
      });

      if (sentTodayRes.rows.length > 0) {
        result.skippedAlreadySent++;
        continue;
      }
    }

    const dueBills: DueBillItem[] = [];

    // 1. Check Recurring Bills due today
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

      // If not paid for this month, it's due today
      if (!paidMonths.includes(currentYearMonth)) {
        dueBills.push({
          title: String(r.title),
          category: String(r.category),
          amount: Number(r.amount),
          type: 'recurring',
        });
      }
    }

    // 2. Check pending expense transactions with date = today
    const txRes = await db.execute({
      sql: 'SELECT id, description, amount, category FROM transactions WHERE user_id = ? AND type = "expense" AND status = "pending" AND date = ?',
      args: [userId, parts],
    });

    for (const tx of txRes.rows) {
      // avoid duplicating if it already matches a recurring bill with same title
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

    // 3. Check active installment purchases due today
    const instRes = await db.execute({
      sql: 'SELECT id, description, installment_amount, total_installments, paid_installments, start_date, category, payment_card FROM installment_purchases WHERE user_id = ? AND paid_installments < total_installments',
      args: [userId],
    });

    for (const inst of instRes.rows) {
      const startDateStr = String(inst.start_date || '');
      if (!startDateStr || !startDateStr.includes('-')) continue;

      const [sYear, sMonth, sDay] = startDateStr.split('-').map(Number);
      const instDueDay = sDay || 1;

      // Check if today matches the installment due day
      if (instDueDay === currentDayNumber) {
        const [cYear, cMonth] = parts.split('-').map(Number);
        const monthDiff = (cYear - sYear) * 12 + (cMonth - sMonth);
        const totalInst = Number(inst.total_installments);
        const paidInst = Number(inst.paid_installments);

        // Check if the purchase is in its active monthly window
        if (monthDiff >= 0 && monthDiff < totalInst) {
          // If this month's installment has not been paid yet
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

      // Log notification in DB to prevent duplicate sends today
      await db.execute({
        sql: 'INSERT INTO email_notifications (id, user_id, email, sent_date, bill_count, total_amount, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [
          `notif-${crypto.randomUUID()}`,
          userId,
          userEmail,
          parts,
          dueBills.length,
          totalAmount,
          new Date().toISOString(),
        ],
      });
    } else {
      result.errors.push(`Falha para ${userEmail}: ${sendRes.error}`);
    }
  }

  return result;
}
