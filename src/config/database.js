'use strict';

const { Sequelize } = require('sequelize');
const env = require('./env');

const sequelize = new Sequelize(env.DATABASE_URL, {
  dialect: 'postgres',
  logging: env.DB_LOG_SQL ? console.log : false,
  dialectOptions: env.DB_SSL ? { ssl: { require: true, rejectUnauthorized: false } } : {},
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
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
