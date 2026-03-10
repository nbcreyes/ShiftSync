require('dotenv').config()
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const connectDB = require('./config/db')
const seedSuperuser = require('./scripts/seedSuperuser')
const { startDigestJobs } = require('./jobs/digestJob')

const app = express()

connectDB().then(() => {
  seedSuperuser()
  startDigestJobs()
})

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.use('/api/auth', require('./routes/auth'))
app.use('/api/invite', require('./routes/invite'))
app.use('/api/timelog', require('./routes/timelog'))
app.use('/api/remark', require('./routes/remark'))
app.use('/api/admin', require('./routes/admin'))
app.use('/api/superuser', require('./routes/superuser'))
app.use('/api/notification', require('./routes/notification'))
app.use('/api/manual-log', require('./routes/manualLog'))
app.use('/api/shift', require('./routes/shift'))
app.use('/api/leave', require('./routes/leave'))
app.use('/api/leave-balance', require('./routes/leaveBalance'))
app.use('/api/audit', require('./routes/audit'))
app.use('/api/announcement', require('./routes/announcement'))

app.get('/api/health', (req, res) => res.json({ status: 'ok', project: 'ShiftSync' }))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))