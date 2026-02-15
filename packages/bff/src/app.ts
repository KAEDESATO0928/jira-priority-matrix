/**
 * Express App Setup
 * Expressアプリケーションの構成
 */
import express, { type Express } from 'express';
import session from 'express-session';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import { authRouter } from './routes/auth.js';
import { ticketsRouter } from './routes/tickets.js';
import { projectsRouter } from './routes/projects.js';
import { sprintsRouter } from './routes/sprints.js';
import { myselfRouter } from './routes/myself.js';
import { debugRouter } from './routes/debug.js';
import { setupRouter } from './routes/setup.js';
import { errorHandler } from './middleware/errorHandler.js';

export const app: Express = express();

// セキュリティヘッダー
app.use(helmet());

// CORS設定
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true, // cookieを含むリクエストを許可
  })
);

// JSONパーサー
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// セッション設定
app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: config.isProduction, // 本番環境ではHTTPSのみ
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7日間
    },
  })
);

// APIレスポンスのキャッシュ無効化（410等のキャッシュ防止）
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// ルーティング
app.use('/auth', authRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/sprints', sprintsRouter);
app.use('/api/myself', myselfRouter);
app.use('/api/debug', debugRouter);
app.use('/api/setup', setupRouter);

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// グローバルエラーハンドラー（最後に配置）
app.use(errorHandler);
