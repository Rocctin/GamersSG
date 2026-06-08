export function magicLinkTemplate(magicLink: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login to Gamers.SG</title>
</head>
<body style="font-family: Arial, Helvetica, sans-serif; background-color: #0f172a; color: #e2e8f0; padding: 40px 0; margin: 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; margin: 0 auto;">
    <tr>
      <td style="text-align: center; padding-bottom: 32px;">
        <h1 style="color: #f97316; font-size: 28px; margin: 0;">🎮 Gamers.SG</h1>
        <p style="color: #94a3b8; font-size: 14px; margin: 4px 0 0 0;">Singapore's Gaming Identity Platform</p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #1e293b; border-radius: 12px; padding: 32px 24px; border: 1px solid #334155;">
        <h2 style="color: #f1f5f9; font-size: 20px; margin: 0 0 16px 0;">Your Login Link</h2>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
          Click the button below to sign in to your Gamers.SG account. This link is valid for 30 minutes and can only be used once.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="text-align: center;">
              <a href="${magicLink}" style="display: inline-block; background-color: #f97316; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                Sign In
              </a>
            </td>
          </tr>
        </table>
        <p style="color: #94a3b8; font-size: 12px; margin: 24px 0 0 0; line-height: 1.5;">
          If you didn't request this email, you can safely ignore it.
          <br>
          If the button doesn't work, copy and paste this URL:
        </p>
        <p style="color: #64748b; font-size: 11px; word-break: break-all; margin: 4px 0 0 0;">
          ${magicLink}
        </p>
      </td>
    </tr>
    <tr>
      <td style="text-align: center; padding-top: 24px;">
        <p style="color: #475569; font-size: 12px; margin: 0;">
          &copy; ${new Date().getFullYear()} Gamers.SG — Powered by SCOGA
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
