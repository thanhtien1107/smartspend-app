const tls = require('tls');

/**
 * @interface IEmailService
 * @description Provides email sending capabilities for SmartSpend.
 *
 * Methods:
 *   sendOtpEmail(to, code)
 *     — Send a 6-digit OTP verification code to the given email address.
 *     @param {string} to    — Recipient email address.
 *     @param {string} code  — 6-digit OTP code.
 *     @returns {Promise<{success: boolean, devMode: boolean, error?: string}>}
 *
 *   isConfigured()
 *     — Returns true when GMAIL_USER and GMAIL_APP_PASSWORD are properly set.
 *     @returns {boolean}
 */

// ─── Email HTML template ─────────────────────────────────────────────────────

function buildOtpEmailHtml(code) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Mã xác minh SmartSpend</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0"
          style="background:#1e293b;border-radius:20px;border:1px solid #334155;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
              <div style="font-size:28px;font-weight:900;color:#fff;">💰 SmartSpend</div>
              <div style="color:rgba(255,255,255,0.8);font-size:13px;margin-top:6px;">Chi tiêu thông minh, tương lai vững vàng</div>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px 24px;">
              <h2 style="color:#f1f5f9;font-size:20px;font-weight:700;margin:0 0 10px;">Đặt lại mật khẩu</h2>
              <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 24px;">
                Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản SmartSpend của bạn.
                Sử dụng mã xác minh dưới đây:
              </p>
              <div style="background:#0f172a;border:2px solid #6366f1;border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
                <div style="color:#94a3b8;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">MÃ XÁC MINH</div>
                <div style="font-size:44px;font-weight:900;letter-spacing:10px;color:#a78bfa;">${code}</div>
                <div style="color:#64748b;font-size:12px;margin-top:10px;">⏱ Có hiệu lực trong <strong style="color:#f59e0b;">10 phút</strong></div>
              </div>
              <p style="color:#64748b;font-size:12px;line-height:1.6;margin:0;">
                Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 40px 28px;border-top:1px solid #1e293b;">
              <p style="color:#475569;font-size:11px;text-align:center;margin:0;">
                © 2024 SmartSpend · Email này được gửi tự động, vui lòng không trả lời.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildOtpEmailText(code) {
  return [
    'SmartSpend - Mã xác minh đặt lại mật khẩu',
    '',
    `Mã xác minh của bạn: ${code}`,
    '',
    'Mã có hiệu lực trong 10 phút.',
    'Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.',
  ].join('\n');
}

// ─── MIME builder ─────────────────────────────────────────────────────────────

function toBase64(str) {
  return Buffer.from(str, 'utf8').toString('base64');
}

function buildMimeMessage(from, to, subject, textBody, htmlBody) {
  const boundary = `smartspend_${Date.now()}`;
  return [
    `From: SmartSpend <${from}>`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${toBase64(subject)}?=`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: 8bit`,
    ``,
    textBody,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: 8bit`,
    ``,
    htmlBody,
    ``,
    `--${boundary}--`,
  ].join('\r\n');
}

// ─── Robust SMTP client (handles multi-line responses) ────────────────────────

/**
 * Read SMTP responses line-by-line from the socket.
 * Gmail EHLO returns multi-line responses like:
 *   250-smtp.gmail.com at your service
 *   250-SIZE 35882577
 *   250 AUTH LOGIN PLAIN
 * Only the final line (4th char = space) matters.
 *
 * @param {tls.TLSSocket} socket
 * @returns {{ waitFor: (code: string) => Promise<string>, writeLine: (cmd: string) => void, writeData: (data: string) => void }}
 */
function createSmtpSession(socket) {
  let buffer = '';
  /** @type {Array<{code: string, resolve: Function, reject: Function}>} */
  const queue = [];

  socket.on('data', (chunk) => {
    buffer += chunk.toString('ascii');
    let idx;
    // Process all complete CRLF-terminated lines in the buffer
    while ((idx = buffer.indexOf('\r\n')) !== -1) {
      const line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);

      if (!line) continue;

      const code = line.slice(0, 3);
      const separator = line[3]; // '-' = continuation, ' ' = final

      // Skip multi-line continuation lines (e.g. "250-SIZE 35882577")
      if (separator === '-') continue;

      // Final response line — dispatch to waiting caller
      const pending = queue.shift();
      if (!pending) continue;

      if (line.startsWith(pending.code)) {
        pending.resolve(line);
      } else {
        pending.reject(new Error(`SMTP ${pending.code} expected, got: ${line}`));
      }
    }
  });

  /**
   * Wait until a response line starting with `code` arrives.
   * @param {string} code - e.g. '220', '250', '354', '235'
   * @returns {Promise<string>}
   */
  function waitFor(code) {
    return new Promise((resolve, reject) => {
      queue.push({ code, resolve, reject });
    });
  }

  /** Send a command followed by CRLF */
  function writeLine(cmd) {
    socket.write(cmd + '\r\n');
  }

  /** Send raw data (for DATA body) */
  function writeData(data) {
    socket.write(data);
  }

  return { waitFor, writeLine, writeData };
}

/**
 * Send an email via Gmail SMTP (port 465 SSL) using Node.js built-in `tls`.
 * No npm packages required.
 *
 * @param {{ user: string, password: string, to: string, subject: string, text: string, html: string }} opts
 * @returns {Promise<void>}
 */
function sendViaGmailSmtp({ user, password, to, subject, text, html }) {
  // Gmail App Password displayed as "abcd efgh ijkl mnop" — remove spaces for SMTP AUTH
  const cleanPassword = password.replace(/\s/g, '');

  return new Promise((resolve, reject) => {
    console.log(`[SMTP] Connecting to smtp.gmail.com:465 ...`);

    const socket = tls.connect(
      { host: 'smtp.gmail.com', port: 465, servername: 'smtp.gmail.com' },
      async () => {
        console.log('[SMTP] TLS connected');
        const smtp = createSmtpSession(socket);
        try {
          // 1. Server greeting
          await smtp.waitFor('220');
          console.log('[SMTP] 220 greeting OK');

          // 2. EHLO
          smtp.writeLine('EHLO smartspend');
          await smtp.waitFor('250');
          console.log('[SMTP] EHLO OK');

          // 3. AUTH LOGIN
          smtp.writeLine('AUTH LOGIN');
          await smtp.waitFor('334');
          console.log('[SMTP] AUTH LOGIN: sending username');

          smtp.writeLine(toBase64(user));
          await smtp.waitFor('334');
          console.log('[SMTP] AUTH LOGIN: sending password');

          smtp.writeLine(toBase64(cleanPassword));
          await smtp.waitFor('235');
          console.log('[SMTP] AUTH OK — authenticated');

          // 4. Envelope
          smtp.writeLine(`MAIL FROM:<${user}>`);
          await smtp.waitFor('250');
          console.log('[SMTP] MAIL FROM OK');

          smtp.writeLine(`RCPT TO:<${to}>`);
          await smtp.waitFor('250');
          console.log('[SMTP] RCPT TO OK');

          // 5. DATA
          smtp.writeLine('DATA');
          await smtp.waitFor('354');
          console.log('[SMTP] DATA OK — sending message body');

          // 6. Message body
          const message = buildMimeMessage(user, to, subject, text, html);
          smtp.writeData(message + '\r\n.\r\n');
          await smtp.waitFor('250');
          console.log('[SMTP] Message accepted by Gmail');

          // 7. QUIT
          smtp.writeLine('QUIT');
          socket.end();
          resolve();
        } catch (err) {
          console.error('[SMTP] FAILED at step:', err.message);
          socket.destroy();
          reject(err);
        }
      }
    );

    socket.setTimeout(15000, () => {
      socket.destroy();
      reject(new Error('SMTP connection timed out after 15s'));
    });

    socket.on('error', (err) => {
      console.error('[SMTP] Socket error:', err.message);
      reject(err);
    });
  });
}

// ─── Public factory ───────────────────────────────────────────────────────────

/**
 * Creates an EmailService instance.
 * @param {{ gmailUser?: string, gmailAppPassword?: string }} config
 * @returns {IEmailService}
 */
function createEmailService(config = {}) {
  const { gmailUser, gmailAppPassword } = config;

  /**
   * Returns true when Gmail credentials are properly configured.
   * @returns {boolean}
   */
  function isConfigured() {
    return Boolean(
      gmailUser &&
      gmailUser.trim() &&
      gmailUser.trim() !== 'your_gmail@gmail.com' &&
      gmailAppPassword &&
      gmailAppPassword.trim() &&
      gmailAppPassword.trim() !== 'your_gmail_app_password'
    );
  }

  /**
   * Sends an OTP email to `to`.
   * In dev mode (Gmail not configured), logs OTP to console instead.
   *
   * @param {string} to   - Recipient email
   * @param {string} code - 6-digit OTP
   * @returns {Promise<{success: boolean, devMode: boolean, error?: string}>}
   */
  async function sendOtpEmail(to, code) {
    const subject = 'SmartSpend - Mã xác minh đặt lại mật khẩu';
    const text = buildOtpEmailText(code);
    const html = buildOtpEmailHtml(code);

    if (!isConfigured()) {
      console.log(`\n[EmailService DEV] OTP for <${to}>: ${code}\n`);
      return { success: true, devMode: true };
    }

    try {
      await sendViaGmailSmtp({
        user: gmailUser.trim(),
        password: gmailAppPassword.trim(),
        to,
        subject,
        text,
        html,
      });
      console.log(`[EmailService] OTP sent to ${to}`);
      return { success: true, devMode: false };
    } catch (err) {
      console.error(`[EmailService] Failed to send to ${to}:`, err.message);
      return { success: false, devMode: false, error: err.message };
    }
  }

  return { isConfigured, sendOtpEmail };
}

module.exports = { createEmailService };
