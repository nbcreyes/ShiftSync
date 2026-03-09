const bcrypt = require('bcryptjs')
const User = require('../models/User')

const seedSuperuser = async () => {
  try {
    const existing = await User.findOne({ role: 'superuser' })

    if (existing) {
      console.log('Superuser already exists, skipping seed.')
      return
    }

    const { SUPERUSER_EMAIL, SUPERUSER_PASSWORD } = process.env

    if (!SUPERUSER_EMAIL || !SUPERUSER_PASSWORD) {
      console.error('SUPERUSER_EMAIL and SUPERUSER_PASSWORD must be set in .env')
      process.exit(1)
    }

    const passwordHash = await bcrypt.hash(SUPERUSER_PASSWORD, 12)

    await User.create({
      name: 'Superuser',
      email: SUPERUSER_EMAIL,
      passwordHash,
      role: 'superuser',
      tenantId: null,
      isActive: true,
      mustChangePassword: false,
    })

    console.log(`Superuser seeded: ${SUPERUSER_EMAIL}`)
  } catch (error) {
    console.error(`Superuser seeding failed: ${error.message}`)
    process.exit(1)
  }
}

module.exports = seedSuperuser