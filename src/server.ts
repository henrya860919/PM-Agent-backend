import { env } from '@/_env';
import http from 'http';
import app from './app';

const server = http.createServer(app);

server.listen(env.PORT, env.HOST, () => {
  console.log('\n🚀 Server is running!');
  console.log(`📍 Local:    http://localhost:${env.PORT}`);
  console.log(`📍 Network:  http://${env.HOST}:${env.PORT}`);
  console.log('');
});
