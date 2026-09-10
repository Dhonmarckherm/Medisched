import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = `"${process.env.SMTP_FROM_NAME || "MEDISCHED CERT"}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`;

/* ── Plain text fallback (prevents spam flag for HTML-only) ── */
function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/* ── HTML Templates ── */

function baseLayout(title: string, content: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f8faf9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',sans-serif;-webkit-font-smoothing:antialiased">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8faf9;padding:48px 20px">
<tr><td align="center">
<table width="640" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden">

<!-- Logo Bar -->
<tr>
<td style="padding:36px 48px 32px;text-align:center;background:linear-gradient(135deg,#84B179 0%,#5a9a6e 100%)">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="text-align:center">
<div style="display:inline-block;width:48px;height:48px;background:rgba(255,255,255,0.2);border-radius:12px;line-height:48px;text-align:center;margin-bottom:14px">
<span style="color:#fff;font-size:24px">&#9764;</span>
</div>
<div style="color:#fff;font-size:22px;font-weight:700;letter-spacing:0.5px;margin:0">ISPSC CLINIC CANDON CAMPUS</div>
<div style="color:rgba(255,255,255,0.8);font-size:13px;margin:6px 0 0;letter-spacing:0.3px">Medical Clinic Management System</div>
</td></tr>
</table>
</td>
</tr>

<!-- Content -->
<tr>
<td style="padding:44px 48px">
${content}
</td>
</tr>

<!-- Footer -->
<tr>
<td style="padding:28px 48px;background:#fafbfc;text-align:center;border-top:1px solid #f0f0f0">
<p style="margin:0;font-size:13px;color:#888;letter-spacing:0.2px;font-weight:500">ISPSC Clinic Candon Campus</p>
<p style="margin:8px 0 0;font-size:12px;color:#aaa">This is an automated message. For concerns, please visit the clinic directly.</p>
</td>
</tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function welcomeEmail(name: string) {
  return baseLayout("Welcome to ISPSC Clinic", `
<div style="margin-bottom:32px">
<h1 style="margin:0 0 12px;font-size:26px;color:#111;font-weight:700;letter-spacing:-0.3px">Hello, ${name}!</h1>
<p style="margin:0;font-size:16px;color:#555;line-height:1.8">
Welcome to the ISPSC Clinic Candon Campus! &#127891;<br>
Your account has been successfully created. You can now book appointments, request medical certificates, and track your requests — all in one place.
</p>
</div>

<!-- Feature Cards -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px">
<tr>
<td style="padding:16px 20px;background:#f8faf9;border-radius:12px;border:1px solid #f0f0f0">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="width:36px;vertical-align:top;padding-right:14px">
<div style="width:36px;height:36px;background:#e8f5e9;border-radius:10px;line-height:36px;text-align:center;font-size:16px">&#128197;</div>
</td>
<td>
<p style="margin:0;font-size:14px;font-weight:600;color:#111">Book Appointments</p>
<p style="margin:3px 0 0;font-size:13px;color:#888;line-height:1.5">Schedule visits to the university clinic</p>
</td>
</tr>
</table>
</td>
</tr>
<tr><td style="height:10px"></td></tr>
<tr>
<td style="padding:16px 20px;background:#f8faf9;border-radius:12px;border:1px solid #f0f0f0">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="width:36px;vertical-align:top;padding-right:14px">
<div style="width:36px;height:36px;background:#f3e5f5;border-radius:10px;line-height:36px;text-align:center;font-size:16px">&#128196;</div>
</td>
<td>
<p style="margin:0;font-size:14px;font-weight:600;color:#111">Request Certificates</p>
<p style="margin:3px 0 0;font-size:13px;color:#888;line-height:1.5">Get medical certificates as PDF</p>
</td>
</tr>
</table>
</td>
</tr>
<tr><td style="height:10px"></td></tr>
<tr>
<td style="padding:16px 20px;background:#f8faf9;border-radius:12px;border:1px solid #f0f0f0">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="width:36px;vertical-align:top;padding-right:14px">
<div style="width:36px;height:36px;background:#e3f2fd;border-radius:10px;line-height:36px;text-align:center;font-size:16px">&#128269;</div>
</td>
<td>
<p style="margin:0;font-size:14px;font-weight:600;color:#111">Track in Real-Time</p>
<p style="margin:3px 0 0;font-size:13px;color:#888;line-height:1.5">Monitor your request status anytime</p>
</td>
</tr>
</table>
</td>
</tr>
</table>

<p style="margin:0;font-size:15px;color:#555;line-height:1.7">
Log in to your dashboard to get started. If you have any questions or need assistance, feel free to visit us at the clinic. We're here to help!
</p>

<p style="margin:24px 0 0;font-size:14px;color:#84B179;font-weight:600">
&#128154; Your health is our priority!
</p>
  `);
}

function statusEmail(name: string, type: "appointment" | "certificate", status: "Approved" | "Rejected", details: { date?: string; purpose?: string }) {
  const isApproved = status === "Approved";
  const accent = isApproved ? "#22c55e" : "#ef4444";
  const accentBg = isApproved ? "#f0fdf4" : "#fef2f2";
  const accentBorder = isApproved ? "#bbf7d0" : "#fecaca";
  const verb = isApproved ? "has been approved" : "has been rejected";
  const symbol = isApproved ? "&#10003;" : "&#10007;";
  const typeLabel = type === "appointment" ? "Appointment" : "Certificate";

  return baseLayout(`${typeLabel} ${status}`, `
<div style="margin-bottom:32px">
<h1 style="margin:0 0 12px;font-size:26px;color:#111;font-weight:700;letter-spacing:-0.3px">Hi ${name}, &#128075;</h1>
<p style="margin:0;font-size:16px;color:#555;line-height:1.8">
Good day! We'd like to inform you that your ${type.toLowerCase()} request has been <strong style="color:${accent}">${verb.replace("has been ", "")}</strong>. Here are the details:
</p>
</div>

<!-- Status Card -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px">
<tr>
<td style="padding:28px;background:${accentBg};border-radius:14px;text-align:center;border:1px solid ${accentBorder}">
<div style="display:inline-block;width:52px;height:52px;border-radius:50%;background:${accent};color:#fff;font-size:26px;line-height:52px;text-align:center;font-weight:bold;margin-bottom:10px">${symbol}</div>
<p style="margin:0;font-size:20px;font-weight:700;color:${accent};letter-spacing:-0.3px">${status}</p>
<p style="margin:4px 0 0;font-size:13px;color:#888">${typeLabel} request</p>
</td>
</tr>
</table>

<!-- Details -->
${(details.date || details.purpose) ? `
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border:1px solid #f0f0f0;border-radius:12px;overflow:hidden">
${details.date ? `<tr>
<td style="padding:14px 18px;border-bottom:1px solid #f5f5f5;font-size:12px;color:#999;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;width:110px;vertical-align:top">${type === "appointment" ? "Date" : "Needed By"}</td>
<td style="padding:14px 18px;border-bottom:1px solid #f5f5f5;font-size:14px;color:#111;font-weight:500">${details.date}</td>
</tr>` : ""}
${details.purpose ? `<tr>
<td style="padding:14px 18px;font-size:12px;color:#999;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;width:110px;vertical-align:top">Purpose</td>
<td style="padding:14px 18px;font-size:14px;color:#111;font-weight:500">${details.purpose}</td>
</tr>` : ""}
</table>
` : ""}

${isApproved && type === "certificate" ? `
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px">
<tr>
<td style="padding:16px 20px;background:#f0fdf4;border-radius:12px;border:1px solid #bbf7d0">
<p style="margin:0;font-size:14px;color:#166534;line-height:1.6">
<strong>Your certificate is ready!</strong><br>
<span style="color:#666">Download it from the <strong>Certificates</strong> page in your dashboard.</span>
</p>
</td>
</tr>
</table>
` : ""}

${!isApproved ? `
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px">
<tr>
<td style="padding:16px 20px;background:#fef2f2;border-radius:12px;border:1px solid #fecaca">
<p style="margin:0;font-size:14px;color:#991b1b;line-height:1.6">
If you believe this is a mistake, please visit the clinic or contact the admin for assistance.
</p>
</td>
</tr>
</table>
` : ""}

<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0">
<tr><td style="padding:20px 24px;background:#f8faf9;border-radius:12px">
<p style="margin:0;font-size:14px;color:#555;line-height:1.7">
Thank you for using the ISPSC Clinic system. ${isApproved ? "We hope you are doing well!" : "If you have questions, please visit us at the clinic."}
</p>
<p style="margin:12px 0 0;font-size:13px;color:#84B179;font-weight:600">
&#128154; Take care and stay healthy!
</p>
</td></tr>
</table>
  `);
}

/* ── Send Functions ── */

export async function sendWelcomeEmail(to: string, name: string) {
  try {
    const html = welcomeEmail(name);
    await transporter.sendMail({
      from: FROM,
      to,
      subject: "Welcome to MEDISCHED CERT",
      html,
      text: htmlToText(html),
    });
    return true;
  } catch (err) {
    console.error("Failed to send welcome email:", err);
    return false;
  }
}

export async function sendStatusNotification(
  to: string,
  name: string,
  type: "appointment" | "certificate",
  status: "Approved" | "Rejected",
  details: { date?: string; purpose?: string } = {}
) {
  try {
    const html = statusEmail(name, type, status, details);
    await transporter.sendMail({
      from: FROM,
      to,
      subject: `${type === "appointment" ? "Appointment" : "Certificate"} ${status} — MEDISCHED CERT`,
      html,
      text: htmlToText(html),
    });
    return true;
  } catch (err) {
    console.error("Failed to send status email:", err);
    return false;
  }
}

/* ── Password Reset Email ── */

function passwordResetEmail(name: string, resetUrl: string) {
  return baseLayout("Reset Your Password", `
<div style="margin-bottom:32px">
<h1 style="margin:0 0 12px;font-size:26px;color:#111;font-weight:700;letter-spacing:-0.3px">Hi ${name},</h1>
<p style="margin:0;font-size:16px;color:#555;line-height:1.8">
We received a request to reset your password. Click the button below to choose a new password:
</p>
</div>

<!-- Reset Button -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px">
<tr><td align="center">
<a href="${resetUrl}" style="display:inline-block;padding:16px 48px;background:#84B179;color:#fff;text-decoration:none;border-radius:12px;font-size:16px;font-weight:600;letter-spacing:0.3px">Reset My Password</a>
</td></tr>
</table>

<!-- Alternative link -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px">
<tr><td style="padding:20px 24px;background:#f8faf9;border-radius:12px">
<p style="margin:0;font-size:13px;color:#888;line-height:1.7">
If the button doesn't work, copy and paste this link into your browser:
</p>
<p style="margin:10px 0 0;font-size:12px;color:#84B179;word-break:break-all;line-height:1.6">
${resetUrl}
</p>
</td></tr>
</table>

<!-- Security notice -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px">
<tr>
<td style="padding:16px 20px;background:#fffbeb;border-radius:12px;border:1px solid #fef3c7">
<p style="margin:0;font-size:13px;color:#92400e;line-height:1.6">
&#128274; <strong>Security note:</strong> This link will expire in 24 hours. If you didn't request a password reset, you can safely ignore this email.
</p>
</td>
</tr>
</table>
  `);
}

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
  try {
    const html = passwordResetEmail(name, resetUrl);
    await transporter.sendMail({
      from: FROM,
      to,
      subject: "Reset Your Password — ISPSC Clinic",
      html,
      text: htmlToText(html),
    });
    return true;
  } catch (err) {
    console.error("Failed to send password reset email:", err);
    return false;
  }
}
