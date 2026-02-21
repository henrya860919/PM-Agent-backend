// prisma/seed.ts
// 開發環境測試資料 seed 腳本

// 使用與主應用程式相同的 Prisma Client 設定
// 這樣可以確保使用相同的連接池配置和環境變數
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('🌱 開始建立測試資料...');

  // 建立預設測試使用者
  const defaultUserId = '00000000-0000-0000-0000-000000000001';

  const user = await prisma.user.upsert({
    where: { uuid: defaultUserId },
    update: {},
    create: {
      uuid: defaultUserId,
      username: 'testuser',
      password: 'hashed_password_here', // 實際應用中應該使用 bcrypt 加密
      displayName: '測試使用者',
      email: 'test@example.com',
    },
  });

  console.log('✅ 測試使用者已建立:', user.username);
  console.log('🎉 Seed 完成！');
}

main()
  .catch((e) => {
    console.error('❌ Seed 失敗:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
