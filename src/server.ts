import { env } from '@/_env';
import http from 'http';
import app from './app';

const server = http.createServer(app);

server.listen(env.PORT, env.HOST, () => {
  console.log('\n🚀 Server is running!');
  console.log(`📍 Local:    http://localhost:${env.PORT}`);
  console.log(`📍 Network:  http://${env.HOST}:${env.PORT}`);
  console.log('');
  console.log('🔑 API Keys (from .env):');
  console.log(`   OPENAI_API_KEY:    ${env.OPENAI_API_KEY?.length ? '✓ 已設定' : '✗ 未設定 (音檔轉錄無法使用)'}`);
  console.log(`   ANTHROPIC_API_KEY: ${env.ANTHROPIC_API_KEY?.length ? '✓ 已設定' : '✗ 未設定 (Claude 分析無法使用)'}`);
  if (env.MOCK_AUDIO_PROCESSING) {
    console.log('   🧪 MOCK_AUDIO_PROCESSING=true → 不呼叫 Whisper/Claude，使用假資料（不花錢）');
  } else if (process.env.NODE_ENV === 'development') {
    console.log('   🧪 開發者模式：可在畫面上開啟「模擬音檔處理」開關，測試時不花 API 額度');
  }
  console.log('');
});
