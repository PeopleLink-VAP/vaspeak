/**
 * Resend email sender for VASpeak.
 * Wraps the Resend REST API — no SDK needed (lighter bundle).
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? '';
const FROM_ADDRESS   = 'VASpeak <hello@virtualassistantpro.vn>';
const RESEND_URL     = 'https://api.resend.com/emails';

export interface SendEmailOpts {
	to: string;
	subject: string;
	html: string;
	text?: string;
}

export async function sendEmail(opts: SendEmailOpts): Promise<boolean> {
	if (!RESEND_API_KEY) {
		console.warn('[email] RESEND_API_KEY not set — email not sent');
		return false;
	}

	try {
		const res = await fetch(RESEND_URL, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${RESEND_API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				from: FROM_ADDRESS,
				to:   [opts.to],
				subject: opts.subject,
				html: opts.html,
				text: opts.text ?? stripHtml(opts.html)
			})
		});

		if (!res.ok) {
			const err = await res.text();
			console.error('[email] Resend error:', res.status, err);
			return false;
		}

		return true;
	} catch (err) {
		console.error('[email] Network error:', err);
		return false;
	}
}

/** Minimal HTML stripper for plain-text fallback */
function stripHtml(html: string): string {
	return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// ── Email templates ─────────────────────────────────────────────────────────

export function magicLinkEmail(opts: { to: string; link: string; expiryMinutes: number }) {
	const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Đăng nhập VASpeak</title>
</head>
<body style="margin:0;padding:0;background:#FFFBF1;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBF1;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;background:#fff;border-radius:16px;border:1px solid rgba(27,54,93,0.08);box-shadow:0 8px 40px rgba(27,54,93,0.1);overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:#1B365D;padding:28px 32px;text-align:center;">
              <div style="display:inline-flex;align-items:center;gap:10px;">
                <div style="width:36px;height:36px;background:#F2A906;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;">
                  <span style="color:#1B365D;font-weight:900;font-size:13px;">VS</span>
                </div>
                <span style="color:#fff;font-size:20px;font-weight:700;">VASpeak</span>
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 32px;">
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#1B365D;">
                ⚡ Link Đăng Nhập Của Bạn
              </h1>
              <p style="margin:0 0 24px;color:rgba(27,54,93,0.65);font-size:15px;line-height:1.6;">
                Nhấp vào nút bên dưới để đăng nhập vào VASpeak. Link này chỉ có hiệu lực trong <strong>${opts.expiryMinutes} phút</strong> và chỉ dùng được một lần.
              </p>

              <div style="text-align:center;margin:32px 0;">
                <a href="${opts.link}"
                   style="display:inline-block;background:#F2A906;color:#1B365D;font-weight:700;font-size:15px;padding:14px 36px;border-radius:10px;text-decoration:none;letter-spacing:0.01em;">
                  Đăng Nhập Ngay →
                </a>
              </div>

              <p style="margin:0 0 8px;color:rgba(27,54,93,0.45);font-size:12px;line-height:1.5;">
                Nếu nút không hoạt động, hãy copy và dán link sau vào trình duyệt:
              </p>
              <p style="margin:0;font-size:11px;word-break:break-all;color:rgba(27,54,93,0.4);">
                ${opts.link}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#FFFBF1;padding:20px 32px;border-top:1px solid rgba(27,54,93,0.06);">
              <p style="margin:0;font-size:11px;color:rgba(27,54,93,0.35);text-align:center;">
                Bạn nhận được email này vì ai đó đã yêu cầu đăng nhập với địa chỉ <strong>${opts.to}</strong>.<br/>
                Nếu không phải bạn, hãy bỏ qua email này — tài khoản của bạn vẫn an toàn.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

	return {
		to:      opts.to,
		subject: '⚡ Link đăng nhập VASpeak của bạn',
		html
	};
}
