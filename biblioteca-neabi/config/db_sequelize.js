require('./loadEnv');
const { Sequelize } = require('sequelize');

const commonOptions = {
  dialect: 'postgres',
  logging: process.env.SQL_LOG === 'true' ? console.log : false,
  dialectOptions: {
    connectTimeout: Number(process.env.PG_CONNECT_TIMEOUT || 5000),
  },
  define: {
    underscored: true,
  },
};

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, commonOptions)
  : new Sequelize(
    process.env.PG_DATABASE || 'biblioteca_neabi',
    process.env.PG_USER || 'postgres',
    process.env.PG_PASSWORD || 'postgres',
    {
      ...commonOptions,
      host: process.env.PG_HOST || '127.0.0.1',
      port: Number(process.env.PG_PORT || 5432),
    },
  );

let connectionStatus = 'disconnected';

async function connectPostgres({ sync = false } = {}) {
  connectionStatus = 'connecting';
  try {
    await sequelize.authenticate();
    if (sync) await sequelize.sync();
    connectionStatus = 'connected';
    return sequelize;
  } catch (error) {
    connectionStatus = 'error';
    throw error;
  }
}

async function disconnectPostgres() {
  await sequelize.close();
  connectionStatus = 'disconnected';
}

function getPostgresStatus() {
  return connectionStatus;
}

module.exports = {
  sequelize,
  connectPostgres,
  disconnectPostgres,
  getPostgresStatus,
};
