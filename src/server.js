'use strict';

const cluster = require('node:cluster');
const os = require('node:os');
const env = require('./config/env');

function workerCount() {
  if (env.CLUSTER_WORKERS === 'max') return os.availableParallelism();
  const n = Number.parseInt(env.CLUSTER_WORKERS, 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

async function startServer() {
  const { connectDatabase, sequelize } = require('./config/database');
  require('./models'); // register models before sync
  const { createApp } = require('./app');
  const { closeQueue } = require('./services/queue.service');

  await connectDatabase();
  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`[m63m] listening on ${env.APP_URL} (pid ${process.pid}, ${env.NODE_ENV})`);
  });

  let closing = false;
  async function shutdown(signal) {
    if (closing) return;
    closing = true;
    console.log(`[m63m] ${signal} received, shutting down gracefully...`);
    const force = setTimeout(() => {
      console.error('[m63m] forced exit after timeout');
      process.exit(1);
    }, 10000);
    force.unref();

    server.close(async () => {
      try {
        await closeQueue();
        await sequelize.close();
      } finally {
        process.exit(0);
      }
    });
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('unhandledRejection', (err) => console.error('[m63m] unhandled rejection:', err));
}

const workers = workerCount();

if (workers > 1 && cluster.isPrimary) {
  console.log(`[m63m] primary ${process.pid} starting ${workers} workers`);
  for (let i = 0; i < workers; i += 1) cluster.fork();
  cluster.on('exit', (worker, code, signal) => {
    if (signal === 'SIGTERM' || signal === 'SIGINT' || code === 0) return;
    console.warn(`[m63m] worker ${worker.process.pid} died (${signal || code}), restarting`);
    cluster.fork();
  });
} else {
  startServer().catch((err) => {
    console.error('[m63m] failed to start:', err.message);
    process.exit(1);
  });
}
