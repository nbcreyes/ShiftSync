const cron = require('node-cron')
const Tenant = require('../models/Tenant')
const User = require('../models/User')
const { generateDigestData, getYesterday, getLastWeek } = require('../utils/digest')
const { sendDigestEmail } = require('../utils/email')
const { toZonedTime, format } = require('date-fns-tz')

// ─── Format date label for email subject ──────────────────────────────────────
const formatDateLabel = (dateStr) => {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

const formatRangeLabel = (startDate, endDate) => {
  return `${formatDateLabel(startDate)} — ${formatDateLabel(endDate)}`
}

// ─── Send digest for a single tenant ─────────────────────────────────────────
const sendTenantDigest = async ({ tenant, digestType, startDate, endDate }) => {
  try {
    const admins = await User.find({
      tenantId: tenant._id,
      role: { $in: ['admin', 'owner'] },
      isActive: true,
    }).select('name email')

    if (admins.length === 0) return

    const stats = await generateDigestData({
      tenantId: tenant._id,
      startDate,
      endDate,
      timezone: tenant.timezone || 'UTC',
    })

    const dateLabel = digestType === 'daily'
      ? formatDateLabel(startDate)
      : formatRangeLabel(startDate, endDate)

    await Promise.all(
      admins.map(async (admin) => {
        try {
          await sendDigestEmail({
            toEmail: admin.email,
            toName: admin.name,
            companyName: tenant.companyName,
            digestType,
            dateLabel,
            stats,
            employeeRows: stats.employeeRows,
          })
          console.log(`[digest] ${digestType} sent to ${admin.email} (${tenant.companyName})`)
        } catch (err) {
          console.error(`[digest] failed for ${admin.email}:`, err.message)
        }
      })
    )
  } catch (err) {
    console.error(`[digest] tenant ${tenant._id} error:`, err.message)
  }
}

// ─── Run digest across all tenants ───────────────────────────────────────────
const runDigest = async (digestType) => {
  try {
    const tenants = await Tenant.find({})

    await Promise.all(
      tenants.map(async (tenant) => {
        const timezone = tenant.timezone || 'UTC'

        let startDate, endDate

        if (digestType === 'daily') {
          startDate = getYesterday(timezone)
          endDate = startDate
        } else {
          const range = getLastWeek(timezone)
          startDate = range.startDate
          endDate = range.endDate
        }

        await sendTenantDigest({ tenant, digestType, startDate, endDate })
      })
    )

    console.log(`[digest] ${digestType} run complete — ${tenants.length} tenant(s) processed`)
  } catch (err) {
    console.error('[digest] run failed:', err.message)
  }
}

// ─── Schedule jobs ────────────────────────────────────────────────────────────
const startDigestJobs = () => {
  // Daily digest — every day at 8:00 AM UTC
  cron.schedule('0 8 * * *', () => {
    console.log('[digest] running daily digest...')
    runDigest('daily')
  }, {
    timezone: 'UTC',
  })

  // Weekly digest — every Monday at 8:00 AM UTC
  cron.schedule('0 8 * * 1', () => {
    console.log('[digest] running weekly digest...')
    runDigest('weekly')
  }, {
    timezone: 'UTC',
  })

  console.log('[digest] jobs scheduled — daily at 08:00 UTC, weekly on Monday at 08:00 UTC')
}

module.exports = { startDigestJobs, runDigest }