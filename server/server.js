require('dotenv').config()
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const connectDB = require('./config/db')
const seedSuperuser = require('./scripts/seedSuperuser')

const app = express()

// Connect to MongoDB then seed superuser
connectDB().then(() => seedSuperuser())

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

// Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/invite', require('./routes/invite'))
app.use('/api/timelog', require('./routes/timelog'))
app.use('/api/remark', require('./routes/remark'))
app.use('/api/admin', require('./routes/admin'))
app.use('/api/superuser', require('./routes/superuser'))
app.use('/api/notification', require('./routes/notification'))
app.use('/api/manual-log', require('./routes/manualLog'))
app.use('/api/shift', require('./routes/shift'))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', project: 'ShiftSync' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})