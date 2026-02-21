// src/lib/prisma.ts
import { env } from '@/_env';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

// 優化連接池配置，避免冷啟動問題
// 構建帶有連接池參數的 DATABASE_URL
const buildDatabaseUrlWithPool = (): string => {
  const baseUrl = env.DATABASE_URL;

  try {
    // 解析 URL
    const url = new URL(baseUrl);

    // 設置連接池參數（會覆蓋已存在的同名參數）
    url.searchParams.set('connection_limit', env.DB_CONNECTION_LIMIT.toString());
    url.searchParams.set('pool_timeout', env.DB_POOL_TIMEOUT.toString());
    url.searchParams.set('connect_timeout', env.DB_CONNECT_TIMEOUT.toString());
    // 禁用語句緩存，避免內存問題
    url.searchParams.set('statement_cache_size', '0');

    return url.toString();
  } catch (error) {
    // 如果 URL 解析失敗，手動添加參數
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}connection_limit=${env.DB_CONNECTION_LIMIT}&pool_timeout=${env.DB_POOL_TIMEOUT}&connect_timeout=${env.DB_CONNECT_TIMEOUT}&statement_cache_size=0`;
  }
};

const databaseUrl = buildDatabaseUrlWithPool();
const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({
  adapter,
  // 開發環境啟用查詢日誌，幫助診斷性能問題
  log:
    process.env.NODE_ENV === 'development'
      ? [
          {
            emit: 'event',
            level: 'query',
          },
        ]
      : [],
});

// 應用啟動時預熱連接，避免第一次請求慢
// 這會在應用啟動時建立一個連接，保持連接池活躍
prisma.$connect().catch((err) => {
  console.error('Failed to connect to database:', err);
});

// 開發環境：記錄所有查詢
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query' as never, (e: any) => {
    const duration = e.duration;
    // 用不同圖標標記查詢速度
    const icon = duration > 100 ? '⚠️' : duration > 50 ? '🐌' : '✓';
    const level = duration > 100 ? 'SLOW' : duration > 50 ? 'MEDIUM' : 'FAST';

    // 簡化查詢顯示（只顯示前 150 個字符）
    const queryPreview = e.query.length > 150 ? e.query.substring(0, 150) + '...' : e.query;

    console.log(`${icon} [${level}] Prisma Query (${duration.toFixed(2)}ms):`, {
      query: queryPreview,
      // params 太長時截斷
      params: e.params && e.params.length > 100 ? e.params.substring(0, 100) + '...' : e.params,
    });
  });
}

export { prisma };
