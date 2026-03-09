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

const formatLeaveDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1)

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
      
        href="${inviteLink}"
        style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-bottom: 20px;"
      >
        Accept Invite
      </a>
      <p style="color: #94a3b8; font-size: 13px;">This invite link expires in 24 hours. If you did not expect this email, you can ignore it.</p>
    `),
  })
}

// ─── Remark Created Email ─────────────────────────────────────────────────────
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

// ─── Remark Resolved Email ────────────────────────────────────────────────────
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

// ─── Leave Request Email ──────────────────────────────────────────────────────
const sendLeaveRequestEmail = async ({ toEmail, toName, employeeName, leaveType, startDate, endDate, reason }) => {
  await sendEmail({
    to: toEmail,
    toName,
    subject: `${employeeName} submitted a leave request`,
    html: emailWrapper(`
      <h2 style="margin: 0 0 8px;">New Leave Request</h2>
      <p>Hi ${toName},</p>
      <p><strong>${employeeName}</strong> has submitted a leave request that requires your review.</p>
      <div style="background: #fff; border: 1px solid #e2e8f0; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px; width: 120px;">Type</td>
            <td style="padding: 6px 0; font-weight: 600;">${capitalize(leaveType)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">From</td>
            <td style="padding: 6px 0; font-weight: 600;">${formatLeaveDate(startDate)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">To</td>
            <td style="padding: 6px 0; font-weight: 600;">${formatLeaveDate(endDate)}</td>
          </tr>
          ${reason ? `
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px; vertical-align: top;">Reason</td>
            <td style="padding: 6px 0;">${reason}</td>
          </tr>` : ''}
        </table>
      </div>
      <p>Log in to ShiftSync to approve or reject this request.</p>
    `),
  })
}

// ─── Leave Reviewed Email ─────────────────────────────────────────────────────
const sendLeaveReviewedEmail = async ({ toEmail, toName, adminName, leaveType, startDate, endDate, status, adminNote }) => {
  const isApproved = status === 'approved'
  const statusColor = isApproved ? '#22c55e' : '#ef4444'
  const statusLabel = isApproved ? 'Approved ✓' : 'Rejected'

  await sendEmail({
    to: toEmail,
    toName,
    subject: `Your leave request has been ${status}`,
    html: emailWrapper(`
      <h2 style="margin: 0 0 8px;">Leave Request ${statusLabel}</h2>
      <p>Hi ${toName},</p>
      <p><strong>${adminName}</strong> has <strong style="color: ${statusColor};">${status}</strong> your ${capitalize(leaveType)} leave request.</p>
      <div style="background: #fff; border: 1px solid #e2e8f0; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px; width: 120px;">Type</td>
            <td style="padding: 6px 0; font-weight: 600;">${capitalize(leaveType)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">From</td>
            <td style="padding: 6px 0; font-weight: 600;">${formatLeaveDate(startDate)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">To</td>
            <td style="padding: 6px 0; font-weight: 600;">${formatLeaveDate(endDate)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Status</td>
            <td style="padding: 6px 0; font-weight: 600; color: ${statusColor};">${statusLabel}</td>
          </tr>
          ${adminNote ? `
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px; vertical-align: top;">Note</td>
            <td style="padding: 6px 0;">${adminNote}</td>
          </tr>` : ''}
        </table>
      </div>
      ${isApproved
        ? '<p>Your leave has been approved. Enjoy your time off!</p>'
        : '<p>If you have questions, please reach out to your admin.</p>'
      }
    `),
  })
}

// ─── Digest Email ─────────────────────────────────────────────────────────────
const sendDigestEmail = async ({ toEmail, toName, companyName, digestType, dateLabel, stats, employeeRows }) => {
  const statBox = (label, value, color) => `
    <td style="text-align: center; padding: 0 12px;">
      <p style="font-size: 28px; font-weight: 700; color: ${color}; margin: 0;">${value}</p>
      <p style="font-size: 12px; color: #64748b; margin: 4px 0 0;">${label}</p>
    </td>
  `

  const tableRows = employeeRows.map((row) => `
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="padding: 10px 12px; font-size: 13px; font-weight: 500;">${row.name}</td>
      <td style="padding: 10px 12px; font-size: 12px; color: #64748b;">${row.department}</td>
      <td style="padding: 10px 12px; text-align: center; font-size: 13px; color: #22c55e; font-weight: 600;">${row.present}</td>
      <td style="padding: 10px 12px; text-align: center; font-size: 13px; color: #ef4444; font-weight: 600;">${row.absent}</td>
      <td style="padding: 10px 12px; text-align: center; font-size: 13px; color: #f59e0b; font-weight: 600;">${row.late}</td>
      <td style="padding: 10px 12px; text-align: center; font-size: 13px; color: #6366f1; font-weight: 600;">${row.avgHours}h</td>
    </tr>
  `).join('')

  await sendEmail({
    to: toEmail,
    toName,
    subject: `${companyName} — ${digestType === 'daily' ? 'Daily' : 'Weekly'} Attendance Digest`,
    html: emailWrapper(`
      <h2 style="margin: 0 0 4px;">${digestType === 'daily' ? 'Daily' : 'Weekly'} Attendance Digest</h2>
      <p style="color: #64748b; font-size: 13px; margin: 0 0 24px;">${companyName} · ${dateLabel}</p>

      <!-- Summary stats -->
      <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            ${statBox('Present', stats.totalPresent, '#22c55e')}
            ${statBox('Absent', stats.totalAbsent, '#ef4444')}
            ${statBox('Late', stats.totalLate, '#f59e0b')}
            ${statBox('Avg Hours', stats.avgWorkedHours + 'h', '#6366f1')}
            ${statBox('Overtime', stats.overtimeDays, '#f97316')}
          </tr>
        </table>
      </div>

      <!-- Employee breakdown -->
      ${employeeRows.length > 0 ? `
      <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 16px;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
              <th style="padding: 10px 12px; text-align: left; font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Employee</th>
              <th style="padding: 10px 12px; text-align: left; font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Dept</th>
              <th style="padding: 10px 12px; text-align: center; font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Present</th>
              <th style="padding: 10px 12px; text-align: center; font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Absent</th>
              <th style="padding: 10px 12px; text-align: center; font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Late</th>
              <th style="padding: 10px 12px; text-align: center; font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Avg Hrs</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
      ` : '<p style="color: #94a3b8; font-size: 13px;">No activity recorded for this period.</p>'}

      <p style="color: #94a3b8; font-size: 12px; margin-top: 8px;">
        Log in to ShiftSync to view the full report.
      </p>
    `),
  })
}

module.exports = {
  sendInviteEmail,
  sendRemarkCreatedEmail,
  sendRemarkReplyEmail,
  sendRemarkResolvedEmail,
  sendLeaveRequestEmail,
  sendLeaveReviewedEmail,
  sendDigestEmail,
}