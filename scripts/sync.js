'use strict';

/** Creates missing tables (no destructive changes). Usage: npm run db:sync */
const { sequelize } = require('../src/models');

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log('[db] tables are in place:', Object.keys(sequelize.models).join(', '));
  } catch (err) {
    console.error('[db] sync failed:', err.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();
