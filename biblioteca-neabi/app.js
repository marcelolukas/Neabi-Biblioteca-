const express = require('express');
const path = require('path');
const apiRoutes = require('./routes');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./utils/logger');
const {
  connectPostgres,
  disconnectPostgres,
  getPostgresStatus,
} = require('./config/db_sequelize');
const {
  connectMongo,
  disconnectMongo,
  getMongoStatus,
} = require('./config/db_mongoose');

require('./models');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const publicDirectory = path.join(__dirname, 'public');

app.disable('x-powered-by');

app.use((request, response, next) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

app.get('/api/config', (request, response) => {
  response.json({
    siteMaeUrl: process.env.SITE_MAE_URL?.trim() || null,
  });
});

app.get('/api/health', (request, response) => {
  const databases = {
    postgresql: getPostgresStatus(),
    mongodb: getMongoStatus(),
  };
  const status = Object.values(databases).every((value) => value === 'connected') ? 'ok' : 'degraded';
  response.status(status === 'ok' ? 200 : 503).json({
    status,
    service: 'biblioteca-neabi',
    databases,
  });
});

app.use('/api', apiRoutes);
app.use('/api', notFound);
app.use(express.static(publicDirectory));

app.get('*path', (request, response, next) => {
  if (!request.accepts('html')) return next();
  return response.sendFile(path.join(publicDirectory, 'index.html'));
});

app.use(notFound);
app.use(errorHandler);

async function connectDatabases() {
  const results = await Promise.allSettled([
    connectPostgres({ sync: process.env.DB_SYNC === 'true' }),
    connectMongo(),
  ]);

  results.filter((result) => result.status === 'rejected').forEach((result) => {
    logger.error(result.reason, { operation: 'database_startup' });
    console.error(`Banco indisponível: ${result.reason.message}`);
  });

  if (process.env.REQUIRE_DATABASES === 'true' && results.some((result) => result.status === 'rejected')) {
    throw new Error('Não foi possível conectar aos dois bancos obrigatórios.');
  }
}

async function startServer() {
  await connectDatabases();
  return new Promise((resolve) => {
    const server = app.listen(PORT, () => {
      console.log(`Biblioteca NEABI disponível em http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

async function shutdown(server) {
  await Promise.allSettled([disconnectPostgres(), disconnectMongo()]);
  if (server) await new Promise((resolve) => server.close(resolve));
}

if (require.main === module) {
  let runningServer;
  startServer()
    .then((server) => { runningServer = server; })
    .catch((error) => {
      logger.error(error, { operation: 'server_startup' });
      console.error(error.message);
      process.exitCode = 1;
    });

  const handleSignal = async () => {
    await shutdown(runningServer);
    process.exit(0);
  };
  process.once('SIGINT', handleSignal);
  process.once('SIGTERM', handleSignal);
}

module.exports = app;
module.exports.startServer = startServer;
module.exports.shutdown = shutdown;
