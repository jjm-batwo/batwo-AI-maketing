import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app: Express = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes placeholder
app.get('/api', (_req, res) => {
  res.json({ message: '바투 API 서버', version: '0.1.0' });
});

app.listen(PORT, () => {
  console.warn(`🚀 바투 API 서버가 포트 ${PORT}에서 실행 중입니다.`);
});

export default app;
