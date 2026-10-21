'use strict';

/**
 * Creates the platform admin, or resets its password if the email already exists.
 * Usage: ADMIN_EMAIL=... ADMIN_PHONE=... [ADMIN_PASSWORD=...] node scripts/create-admin.js
 * Without ADMIN_PASSWORD a strong random password is generated and printed once.
 */
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const env = require('../src/config/env');
const { sequelize, User } = require('../src/models');

const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const phone = (process.env.ADMIN_PHONE || '').trim();
const password = process.env.ADMIN_PASSWORD || crypto.randomBytes(12).toString('base64url');

if (!email || !phone) {
  console.error('[admin] ADMIN_EMAIL and ADMIN_PHONE are required');
  process.exit(1);
}
if (password.length < 12) {
  console.error('[admin] ADMIN_PASSWORD must be at least 12 characters');
  process.exit(1);
}

(async () => {
  try {
    await sequelize.authenticate();
    const password_hash = await bcrypt.hash(password, env.BCRYPT_COST);
    const [user, created] = await User.findOrCreate({
      where: { email },
      defaults: { email, phone, full_name: 'إدارة المنصة', role: 'ADMIN', is_verified: true, password_hash },
    });
    if (!created) await user.update({ role: 'ADMIN', is_verified: true, password_hash });
    console.log(`[admin] ${created ? 'created' : 'updated'} ${email}`);
    if (!process.env.ADMIN_PASSWORD) console.log(`[admin] generated password: ${password}`);
  } catch (err) {
    console.error('[admin] failed:', err.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();
