const Brevo = require('@getbrevo/brevo')

const client = new Brevo.TransactionalEmailsApi()
client.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY)

const sendEmail = async ({ to, toName, subject, html }) => {
  const email = new Brevo.SendSmtpEmail()

  email.sender = {
    email: process.env.EMAIL_FROM,
    name: 'ShiftSync',
  }
  email.to = [{ email: to, name: toName }]
  email.subject = subject
  email.htmlContent = html

  try {
    const result = await client.sendTransacEmail(email)
    console.log('[email] sent successfully:', result)
  } catch (err) {
    console.error('[email] full error:', JSON.stringify(err, null, 2))
    throw err
  }
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const emailWrapper = (content) => `
  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
    <div style="background: #4f46e5; padding: 20px 24px; border-radius: 12px 12px 0 0;">
      <span style="color: white; font-size: 18px; font-weight: bold;">ShiftSync</span>
    </div>
    <div style="background: #f8fafc; padding: 28px 24px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
      ${content}
    </div>
    <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 16px;">
      You're receiving this because you're a member of a ShiftSync workspace.
    </p>
  </div>
`

const formatLogDate = (date) =>
  date
    ? new Date(date).toLocaleDateString([], { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
    : 'your log'

// ─── Invite Email ─────────────────────────────────────────────────────────────
const sendInviteEmail = async ({ toEmail, toName, workspaceName, inviteLink, tempPassword }) => {
  await sendEmail({
    to: toEmail,
    toName,
    subject: `You have been invited to join ${workspaceName} on ShiftSync`,
    html: emailWrapper(`
      <h2 style="margin: 0 0 8px;">You've been invited to ${workspaceName}</h2>
      <p>Hi ${toName},</p>
      <p>You have been invited to join <strong>${workspaceName}</strong> on ShiftSync.</p>
      <p>Use the temporary password below to log in. You will be asked to change it immediately after.</p>
      <div style="background: #fff; border: 1px solid #e2e8f0; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
        <strong style="font-size: 13px; color: #64748b;">Temporary Password</strong>
        <p style="font-size: 20px; letter-spacing: 3px; margin: 8px 0 0; font-weight: bold;">${tempPassword}</p>
      </div>
      <a
        href="${inviteLink}"
        style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-bottom: 20px;"
      >
        Accept Invite
      </a>
      <p style="color: #94a3b8; font-size: 13px;">This invite link expires in 24 hours. If you did not expect this email, you can ignore it.</p>
    `),
  })
}

// ─── Remark Created Email (notify employee) ───────────────────────────────────
const sendRemarkCreatedEmail = async ({ toEmail, toName, adminName, logDate, adminNote }) => {
  await sendEmail({
    to: toEmail,
    toName,
    subject: `${adminName} flagged your log on ShiftSync`,
    html: emailWrapper(`
      <h2 style="margin: 0 0 8px;">A remark was added to your log</h2>
      <p>Hi ${toName},</p>
      <p><strong>${adminName}</strong> flagged your time log for <strong>${formatLogDate(logDate)}</strong>.</p>
      <div style="background: #fff; border-left: 4px solid #f59e0b; padding: 14px 18px; border-radius: 0 8px 8px 0; margin: 20px 0;">
        <strong style="font-size: 13px; color: #64748b;">Admin's note</strong>
        <p style="margin: 8px 0 0; color: #1e293b;">${adminNote}</p>
      </div>
      <p>Log in to ShiftSync to view the full thread and respond.</p>
    `),
  })
}

// ─── Remark Reply Email ───────────────────────────────────────────────────────
const sendRemarkReplyEmail = async ({ toEmail, toName, replierName, message, logDate }) => {
  await sendEmail({
    to: toEmail,
    toName,
    subject: `${replierName} replied to a remark thread`,
    html: emailWrapper(`
      <h2 style="margin: 0 0 8px;">New reply in remark thread</h2>
      <p>Hi ${toName},</p>
      <p><strong>${replierName}</strong> replied to the remark thread for the log on <strong>${formatLogDate(logDate)}</strong>.</p>
      <div style="background: #fff; border: 1px solid #e2e8f0; padding: 14px 18px; border-radius: 8px; margin: 20px 0;">
        <strong style="font-size: 13px; color: #64748b;">${replierName} said</strong>
        <p style="margin: 8px 0 0; color: #1e293b;">${message}</p>
      </div>
      <p>Log in to ShiftSync to continue the conversation.</p>
    `),
  })
}

// ─── Remark Resolved Email (notify employee) ──────────────────────────────────
const sendRemarkResolvedEmail = async ({ toEmail, toName, adminName, logDate }) => {
  await sendEmail({
    to: toEmail,
    toName,
    subject: `Your remark has been resolved on ShiftSync`,
    html: emailWrapper(`
      <h2 style="margin: 0 0 8px;">Remark resolved ✓</h2>
      <p>Hi ${toName},</p>
      <p><strong>${adminName}</strong> resolved the remark on your log for <strong>${formatLogDate(logDate)}</strong>.</p>
      <p>No further action is needed. Your log status has been updated to <strong>resolved</strong>.</p>
    `),
  })
}

module.exports = {
  sendInviteEmail,
  sendRemarkCreatedEmail,
  sendRemarkReplyEmail,
  sendRemarkResolvedEmail,
}