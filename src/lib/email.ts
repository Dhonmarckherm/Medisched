import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS = "MEDISCHED CERT <onboarding@resend.dev>";

/* ── HTML Templates ── */

function baseLayout(title: string, content: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 20px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
<tr>
<td style="background:#84B179;padding:28px 36px;text-align:center">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="text-align:center">
<div style="display:inline-block;background:rgba(255,255,255,0.2);border-radius:8px;padding:6px 10px;margin-bottom:8px">
<span style="color:#fff;font-size:18px;font-weight:700;letter-spacing:-0.3px">MEDISCHED <span style="opacity:0.8">CERT</span></span>
</div>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding:36px">
${content}
</td>
</tr>
<tr>
<td style="padding:20px 36px;background:#f9fafb;text-align:center;border-top:1px solid #eee">
<p style="margin:0;font-size:12px;color:#999">Philippine Standard University &middot; Clinic Management System</p>
<p style="margin:4px 0 0;font-size:11px;color:#bbb">This is an automated message. Please do not reply to this email.</p>
</td>
</tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function welcomeEmail(name: string) {
  return baseLayout("Welcome to MEDISCHED CERT", `
<h1 style="margin:0 0 8px;font-size:22px;color:#1a1a2e">Welcome, ${name}!</h1>
<p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.6">
Your account has been created successfully. You can now book appointments and request certificates from the university clinic.
</p>
<table cellpadding="0" cellspacing="0" style="margin:24px 0">
<tr>
<td style="padding:12px 16px;background:#f0faf0;border-radius:8px;font-size:14px;color:#333">
<strong>What you can do:</strong>
<ul style="margin:8px 0 0;padding-left:20px;color:#555;line-height:1.8">
<li>Book clinic appointments</li>
<li>Request medical certificates</li>
<li>Track your request status in real-time</li>
<li>Download approved certificates as PDF</li>
</ul>
</td>
</tr>
</table>
<p style="margin:0;font-size:14px;color:#555">
Log in to your dashboard to get started.
</p>
  `);
}

function statusEmail(name: string, type: "appointment" | "certificate", status: "Approved" | "Rejected", details: { date?: string; purpose?: string }) {
  const isApproved = status === "Approved";
  const accentColor = isApproved ? "#22c55e" : "#ef4444";
  const bgLight = isApproved ? "#f0faf0" : "#fef2f2";
  const statusText = isApproved ? "has been approved" : "has been rejected";
  const icon = isApproved ? "✓" : "✕";

  return baseLayout(`${type === "appointment" ? "Appointment" : "Certificate"} ${status}`, `
<h1 style="margin:0 0 8px;font-size:22px;color:#1a1a2e">Hi ${name},</h1>
<p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6">
Your ${type} request ${statusText}.
</p>
<table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 24px">
<tr>
<td style="padding:20px;background:${bgLight};border-radius:10px;text-align:center">
<div style="display:inline-block;width:48px;height:48px;border-radius:50%;background:${accentColor};color:#fff;font-size:24px;line-height:48px;text-align:center;font-weight:bold;margin-bottom:8px">${icon}</div>
<p style="margin:0;font-size:18px;font-weight:700;color:${accentColor}">${status}</p>
</td>
</tr>
</table>
<table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 24px;border:1px solid #eee;border-radius:8px;overflow:hidden">
${details.date ? `<tr>
<td style="padding:12px 16px;border-bottom:1px solid #eee;font-size:13px;color:#888;width:120px">${type === "appointment" ? "Date" : "Date Needed"}</td>
<td style="padding:12px 16px;font-size:14px;color:#333;font-weight:500">${details.date}</td>
</tr>` : ""}
${details.purpose ? `<tr>
<td style="padding:12px 16px;font-size:13px;color:#888;width:120px">Purpose</td>
<td style="padding:12px 16px;font-size:14px;color:#333;font-weight:500">${details.purpose}</td>
</tr>` : ""}
</table>
${isApproved && type === "certificate" ? `
<p style="margin:0 0 8px;font-size:14px;color:#555;line-height:1.6">
You can now download your certificate from the <strong>Certificates</strong> page in your dashboard.
</p>` : ""}
${!isApproved ? `
<p style="margin:0 0 8px;font-size:14px;color:#555;line-height:1.6">
If you have questions, please visit the clinic or contact the admin.
</p>` : ""}
  `);
}

/* ── Send Functions ── */

export async function sendWelcomeEmail(to: string, name: string) {
  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: "Welcome to MEDISCHED CERT",
      html: welcomeEmail(name),
    });
    if (error) console.error("Resend welcome error:", error);
    return !error;
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
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `${type === "appointment" ? "Appointment" : "Certificate"} ${status} — MEDISCHED CERT`,
      html: statusEmail(name, type, status, details),
    });
    if (error) console.error("Resend status error:", error);
    return !error;
  } catch (err) {
    console.error("Failed to send status email:", err);
    return false;
  }
}
