/**
 * Express application setup.
 *
 * This module only assembles the app — it never listens on a port. `server.js`
 * owns the process lifecycle, which keeps the app importable by tests.
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { env, isProduction } from './config/env.js';

const app = express();

// Trust the proxy in production so client IPs and protocol are read correctly
// from X-Forwarded-* headers.
if (isProduction) {
  app.set('trust proxy', 1);
}

// --- Security & parsing -----------------------------------------------------

app.use(helmet());

app.use(
  cors({
    origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(',').map((o) => o.trim()),
    credentials: true,
  }),
);

// A 1mb cap is far above anything this API accepts and keeps oversized bodies
// from being buffered.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// --- Logging ----------------------------------------------------------------

app.use(morgan(isProduction ? 'combined' : 'dev'));

// --- Routes -----------------------------------------------------------------

app.use('/api', routes);

// --- Error handling ---------------------------------------------------------
// Registered last: `notFoundHandler` catches unmatched routes and `errorHandler`
// converts everything into the standard error envelope.

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
