import nodemailer from "nodemailer";
import { env } from "../config/env.js";

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey?: string;
}

export interface SendMailResult {
  provider: "resend" | "smtp" | "console";
  messageId?: string;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveProvider(): "resend" | "smtp" | "console" {
  if (env.EMAIL_PROVIDER === "resend") return "resend";
  if (env.EMAIL_PROVIDER === "smtp") return "smtp";
  if (env.EMAIL_PROVIDER === "console") return "console";

  // Mode auto
  if (env.RESEND_API_KEY && env.RESEND_API_KEY.trim().length > 0) return "resend";
  if (env.SMTP_HOST && env.SMTP_HOST.trim().length > 0) return "smtp";
  return "console";
}

async function sendViaResend(options: SendMailOptions): Promise<SendMailResult> {
  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY belum dikonfigurasi");
  }

  const maxAttempts = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      };
      if (options.idempotencyKey) {
        headers["Idempotency-Key"] = options.idempotencyKey;
      }

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers,
        body: JSON.stringify({
          from: env.EMAIL_FROM,
          to: [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
        signal: AbortSignal.timeout(10_000),
      });

      if (res.ok) {
        const data = (await res.json().catch(() => ({}))) as { id?: string };
        return { provider: "resend", messageId: data.id };
      }

      const errText = await res.text().catch(() => "");
      const retryable = res.status === 429 || res.status >= 500;
      if (!retryable || attempt === maxAttempts) {
        throw new Error(`Gagal mengirim email via Resend (${res.status}): ${errText}`);
      }

      const retryAfterSec = Number(res.headers.get("retry-after"));
      const delayMs =
        Number.isFinite(retryAfterSec) && retryAfterSec > 0
          ? Math.min(retryAfterSec * 1000, 10_000)
          : 400 * Math.pow(2, attempt - 1);
      await sleep(delayMs);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const isNonRetryableHttp = lastError.message.startsWith("Gagal mengirim email via Resend (4");
      if (isNonRetryableHttp || attempt === maxAttempts) {
        throw lastError;
      }
      await sleep(400 * Math.pow(2, attempt - 1));
    }
  }

  throw lastError ?? new Error("Gagal mengirim email via Resend");
}

export async function sendMail(options: SendMailOptions): Promise<SendMailResult> {
  const provider = resolveProvider();

  if (provider === "resend") {
    return sendViaResend(options);
  }

  if (provider === "smtp") {
    if (!env.SMTP_HOST) {
      throw new Error("SMTP_HOST belum dikonfigurasi");
    }
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE || env.SMTP_PORT === 465,
      ...(env.SMTP_USER
        ? {
            auth: {
              user: env.SMTP_USER,
              pass: env.SMTP_PASS ?? "",
            },
          }
        : {}),
    });

    const info = await transporter.sendMail({
      from: env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    return { provider: "smtp", messageId: info.messageId };
  }

  // Fallback dev/console mode
  console.log("\n============================================================");
  console.log("[TUMPU MAILER · CONSOLE MODE]");
  console.log(`To      : ${options.to}`);
  console.log(`From    : ${env.EMAIL_FROM}`);
  console.log(`Subject : ${options.subject}`);
  console.log("------------------------------------------------------------");
  console.log(options.text);
  console.log("============================================================\n");
  return { provider: "console" };
}

export async function sendVerificationEmail(params: {
  to: string;
  ownerName: string;
  businessName: string;
  verifyUrl: string;
  idempotencyKey?: string;
}) {
  const { to, ownerName, businessName, verifyUrl, idempotencyKey } = params;
  const safeName = ownerName.replace(/[<>]/g, "");
  const safeBiz = businessName.replace(/[<>]/g, "");

  const subject = `Konfirmasi Email Akun Tumpu — ${safeBiz}`;
  const text = [
    `Halo ${safeName},`,
    "",
    `Terima kasih telah mendaftarkan ${safeBiz} di Tumpu POS.`,
    "Silakan klik tautan berikut untuk mengonfirmasi alamat email Anda (berlaku 24 jam):",
    "",
    verifyUrl,
    "",
    "Jika Anda tidak merasa mendaftar di Tumpu, abaikan email ini.",
    "",
    "— Tim Tumpu (tumpu.biz.id)",
  ].join("\n");

  const html = `
<!DOCTYPE html>
<html lang="id">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:28px 32px 16px;">
              <div style="display:inline-block;background:#0f172a;color:#ffffff;font-weight:800;font-size:16px;width:36px;height:36px;line-height:36px;text-align:center;border-radius:10px;">K</div>
              <span style="margin-left:10px;font-size:18px;font-weight:700;vertical-align:middle;">Tumpu POS</span>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;">
              <h1 style="margin:0 0 12px;font-size:20px;line-height:1.35;color:#0f172a;">Konfirmasi Alamat Email Anda</h1>
              <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#475569;">
                Halo <strong>${safeName}</strong>, terima kasih telah mendaftarkan <strong>${safeBiz}</strong> di Tumpu.
                Klik tombol di bawah ini untuk mengaktifkan akun dan melanjutkan setup outlet Anda.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0;">
                <tr>
                  <td style="border-radius:12px;background:#4f46e5;">
                    <a href="${verifyUrl}" target="_blank" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">
                      Konfirmasi Email Sekarang
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;font-size:12px;color:#64748b;">
                Atau salin dan tempel tautan berikut di browser Anda (berlaku selama 24 jam):
              </p>
              <p style="margin:0 0 20px;font-size:12px;word-break:break-all;color:#4f46e5;">
                <a href="${verifyUrl}" style="color:#4f46e5;">${verifyUrl}</a>
              </p>
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;" />
              <p style="margin:0;font-size:11px;color:#94a3b8;">
                Jika Anda tidak merasa membuat akun di Tumpu, silakan abaikan email ini.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return sendMail({ to, subject, html, text, idempotencyKey });
}
