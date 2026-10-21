'use strict';

const { Sequelize } = require('sequelize');
const env = require('./env');

// Serverless instances each hold their own pool, so keep it small there.
const serverless = Boolean(process.env.VERCEL);

const sequelize = new Sequelize(env.DATABASE_URL, {
  dialect: 'postgres',
  // Explicit driver so bundlers (Vercel file tracing) include pg; Sequelize loads it dynamically otherwise.
  dialectModule: require('pg'),
  logging: env.DB_LOG_SQL ? console.log : false,
  dialectOptions: env.DB_SSL ? { ssl: { require: true, rejectUnauthorized: false } } : {},
  pool: serverless ? { max: 3, min: 0, acquire: 20000, idle: 5000, evict: 5000 } : { max: 10, min: 0, acquire: 30000, idle: 10000 },
  define: {
    underscored: true,
    freezeTableName: true,
    // Keep attribute names identical to the SWET columns (otherwise Sequelize exposes createdAt).
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
});

async function connectDatabase() {
  await sequelize.authenticate();
  if (env.DB_SYNC) {
    // Creates missing tables only. Schema changes on existing tables need migrations.
    await sequelize.sync();
  }
}

module.exports = { sequelize, connectDatabase };
