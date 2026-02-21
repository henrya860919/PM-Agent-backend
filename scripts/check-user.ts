// scripts/check-user.ts
// 检查测试用户是否存在

import { prisma } from '../src/lib/prisma';

const DEFAULT_DEV_USER_ID = '00000000-0000-0000-0000-000000000001';

async function checkUser() {
  try {
    console.log('🔍 Checking for user:', DEFAULT_DEV_USER_ID);
    
    const user = await prisma.user.findFirst({
      where: { uuid: DEFAULT_DEV_USER_ID, deletedAt: null },
    });

    if (user) {
      console.log('✅ User found:');
      console.log('  - ID:', user.uuid);
      console.log('  - Username:', user.username);
      console.log('  - Display Name:', user.displayName);
    } else {
      console.log('❌ User not found!');
      console.log('💡 Creating test user...');
      
      const newUser = await prisma.user.create({
        data: {
          uuid: DEFAULT_DEV_USER_ID,
          username: 'testuser',
          password: 'testpassword', // 实际应用中应该加密
          displayName: 'Test User',
        },
      });
      
      console.log('✅ Test user created:', newUser.username);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
