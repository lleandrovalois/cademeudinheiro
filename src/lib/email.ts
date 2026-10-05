import nodemailer from 'nodemailer';

export interface DueBillItem {
  title: string;
  category: string;
  amount: number;
  type: 'recurring' | 'transaction' | 'installment';
}

export function getEmailTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 465;
  const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

export async function sendDueBillsReminderEmail(params: {
  to: string;
  userName: string;
  bills: DueBillItem[];
  dateStr: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const transporter = getEmailTransporter();
  if (!transporter) {
    return {
      success: false,
      error: 'Servidor SMTP não configurado. Defina SMTP_HOST, SMTP_USER e SMTP_PASS nas variáveis de ambiente.',
    };
  }

  const from = process.env.SMTP_FROM || `"Cadê Meu Dinheiro?" <${process.env.SMTP_USER}>`;
  const appUrl = process.env.APP_URL || 'https://financeiro.klynner.com.br';

  const totalAmount = params.bills.reduce((sum, b) => sum + b.amount, 0);
  const formattedTotal = totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const billsHtml = params.bills
    .map(
      (b) => `
      <tr style="border-bottom: 1px solid #334155;">
        <td style="padding: 12px 8px; color: #f8fafc; font-size: 14px; font-weight: 600;">
          ${b.title}
          <div style="font-size: 12px; color: #94a3b8; font-weight: 400; margin-top: 2px;">
            ${b.category} • ${b.type === 'recurring' ? 'Conta Fixa' : b.type === 'installment' ? 'Parcela' : 'Despesa'}
          </div>
        </td>
        <td style="padding: 12px 8px; text-align: right; color: #f43f5e; font-size: 15px; font-weight: 700;">
          ${b.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </td>
      </tr>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8">
      <title>Lembrete de Vencimento • Cadê Meu Dinheiro?</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 30px 15px;">
        <tr>
          <td align="center">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background: #131b2e; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);">
              <!-- Top Banner -->
              <tr>
                <td style="padding: 28px 24px; background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%); text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                    Cadê Meu Dinheiro?
                  </h1>
                  <p style="margin: 6px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 13px; font-weight: 500;">
                    Lembrete Inteligente de Vencimento
                  </p>
                </td>
              </tr>

              <!-- Content Body -->
              <tr>
                <td style="padding: 28px 24px;">
                  <p style="margin: 0 0 16px 0; color: #f8fafc; font-size: 16px;">
                    Olá, <strong>${params.userName}</strong>! 👋
                  </p>
                  
                  <div style="background: rgba(244, 63, 94, 0.1); border-left: 4px solid #f43f5e; padding: 14px 16px; border-radius: 8px; margin-bottom: 24px;">
                    <p style="margin: 0; color: #fda4af; font-size: 14px; font-weight: 600;">
                      ⚠️ Atenção: Você possui <strong>${params.bills.length} conta(s)</strong> que vencem <strong>HOJE (${params.dateStr})</strong>!
                    </p>
                  </div>

                  <!-- Bills Table -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px; border-collapse: collapse;">
                    <thead>
                      <tr style="border-bottom: 2px solid #334155;">
                        <th style="padding: 8px; text-align: left; color: #94a3b8; font-size: 12px; text-transform: uppercase; font-weight: 600;">Descrição</th>
                        <th style="padding: 8px; text-align: right; color: #94a3b8; font-size: 12px; text-transform: uppercase; font-weight: 600;">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${billsHtml}
                      <tr>
                        <td style="padding: 16px 8px; color: #ffffff; font-size: 15px; font-weight: 700;">
                          Total a Pagar Hoje:
                        </td>
                        <td style="padding: 16px 8px; text-align: right; color: #f43f5e; font-size: 18px; font-weight: 800;">
                          ${formattedTotal}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <!-- CTA Button -->
                  <div style="text-align: center; margin: 32px 0 20px 0;">
                    <a href="${appUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 15px rgba(79, 70, 229, 0.4);">
                      Acessar Cadê Meu Dinheiro & Quitar Contas
                    </a>
                  </div>

                  <p style="margin: 0; text-align: center; color: #64748b; font-size: 12px;">
                    Dica: Ao realizar o pagamento, marque a conta como paga no aplicativo para manter suas finanças em dia!
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background: #0f172a; padding: 20px 24px; text-align: center; border-top: 1px solid #1e293b;">
                  <p style="margin: 0; color: #64748b; font-size: 11px;">
                    Este é um aviso automático gerado pelo seu sistema pessoal <strong>Cadê Meu Dinheiro?</strong> na sua VPS Hostinger.<br>
                    Para gerenciar seus alertas, acesse o painel de configurações da sua conta.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `
    Cadê Meu Dinheiro? • Lembrete de Vencimento
    
    Olá, ${params.userName}!
    
    Você possui ${params.bills.length} conta(s) com vencimento para HOJE (${params.dateStr}):
    
    ${params.bills.map((b) => `- ${b.title} (${b.category}): ${b.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`).join('\n')}
    
    Total a Pagar Hoje: ${formattedTotal}
    
    Acesse o aplicativo para registrar o pagamento: ${appUrl}
  `;

  try {
    const info = await transporter.sendMail({
      from,
      to: params.to,
      subject: `⚠️ Lembrete: ${params.bills.length} conta(s) vencendo hoje (${formattedTotal}) - Cadê Meu Dinheiro?`,
      text,
      html,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido ao enviar e-mail';
    console.error('Erro ao enviar e-mail de lembrete:', error);
    return { success: false, error: errorMsg };
  }
}
