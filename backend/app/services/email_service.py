import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings


def send_welcome_email(
    *,
    to_email: str,
    full_name: str,
    external_driver_id: str,
    temp_password: str,
) -> None:
    """Send the driver welcome email containing login credentials."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Welcome to GXS Delivery — Your Driver Account Is Active"
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = to_email

    login_url = settings.APP_LOGIN_URL

    plain = (
        f"Hello {full_name},\n\n"
        "Your GXS Delivery driver account has been approved and is now active.\n\n"
        f"Login Email:        {to_email}\n"
        f"Temporary Password: {temp_password}\n"
        f"Your Driver ID:     {external_driver_id}\n\n"
        f"Log in here: {login_url}\n\n"
        "IMPORTANT: You must change your password the first time you log in.\n\n"
        "Welcome to the team,\n"
        "GXS Delivery"
    )

    html = f"""<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:sans-serif;">
<div style="max-width:520px;margin:40px auto;padding:0 16px 40px;">

  <div style="background:#0D1B2E;border-radius:12px 12px 0 0;padding:24px 28px;">
    <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">GXS Delivery</h1>
    <p style="color:#94a3b8;margin:4px 0 0;font-size:13px;">Driver Account Activation</p>
  </div>

  <div style="background:#fff;padding:28px;border-radius:0 0 12px 12px;
              box-shadow:0 2px 8px rgba(0,0,0,.08);">

    <p style="color:#111827;font-size:16px;margin:0 0 8px;">
      Hello <strong>{full_name}</strong>,
    </p>
    <p style="color:#374151;font-size:14px;margin:0 0 24px;">
      Your GXS Delivery driver account has been approved and is now
      <strong style="color:#16a34a;">active</strong>.
      Use the credentials below to log in.
    </p>

    <!-- Login email -->
    <div style="margin-bottom:12px;">
      <p style="color:#6b7280;font-size:11px;font-weight:600;text-transform:uppercase;
                letter-spacing:.06em;margin:0 0 4px;">Login Email</p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;
                  padding:10px 14px;color:#111827;font-size:15px;">
        {to_email}
      </div>
    </div>

    <!-- Temporary password -->
    <div style="margin-bottom:12px;">
      <p style="color:#6b7280;font-size:11px;font-weight:600;text-transform:uppercase;
                letter-spacing:.06em;margin:0 0 4px;">Temporary Password</p>
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;
                  padding:10px 14px;color:#c2410c;font-size:18px;font-weight:700;
                  letter-spacing:2px;">
        {temp_password}
      </div>
    </div>

    <!-- Driver ID -->
    <div style="margin-bottom:24px;">
      <p style="color:#6b7280;font-size:11px;font-weight:600;text-transform:uppercase;
                letter-spacing:.06em;margin:0 0 4px;">Your Driver ID</p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;
                  padding:10px 14px;color:#111827;font-size:15px;">
        {external_driver_id}
      </div>
    </div>

    <!-- Warning -->
    <div style="background:#fef9c3;border:1px solid #fde047;border-radius:8px;
                padding:12px 16px;margin-bottom:24px;">
      <p style="color:#713f12;margin:0;font-size:13px;">
        <strong>Important:</strong> You will be asked to set a new password the
        first time you log in. Keep your credentials private.
      </p>
    </div>

    <a href="{login_url}"
       style="display:inline-block;background:#FF6500;color:#fff;text-decoration:none;
              padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px;">
      Open GXS Delivery App
    </a>

    <p style="color:#9ca3af;font-size:12px;margin:24px 0 0;">
      If you did not expect this email, please contact your administrator.
    </p>
  </div>
</div>
</body>
</html>"""

    msg.attach(MIMEText(plain, "plain"))
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.ehlo()
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD.replace(" ", ""))
        server.send_message(msg)
