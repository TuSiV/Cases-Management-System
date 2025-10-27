const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// 读取.env文件获取JWT密钥
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const jwtSecret = envContent.match(/NEXTAUTH_SECRET=(.+)/)?.[1] || 'default-secret-key';

const prisma = new PrismaClient();

async function testSession() {
  try {
    console.log('=== 测试会话处理 ===');
    
    // 1. 查询管理员用户信息
    const adminUser = await prisma.user.findFirst({
      where: { role: 'admin' }
    });
    
    if (!adminUser) {
      console.error('未找到管理员用户');
      return;
    }
    
    console.log('管理员用户信息:', {
      id: adminUser.id,
      username: adminUser.username,
      name: adminUser.name,
      role: adminUser.role,
      affiliation: adminUser.affiliation
    });
    
    // 2. 模拟认证流程中的用户对象
    const authUser = {
      id: adminUser.id,
      username: adminUser.username,
      name: adminUser.name,
      role: adminUser.role,
      affiliation: adminUser.affiliation
    };
    
    console.log('\n认证后用户对象:', authUser);
    
    // 3. 模拟JWT创建过程
    const token = jwt.sign(authUser, jwtSecret, { expiresIn: '24h' });
    console.log('\n生成的JWT Token:', token);
    
    // 4. 验证并解码JWT
    try {
      const decoded = jwt.verify(token, jwtSecret);
      console.log('\n解码后的JWT内容:', decoded);
    } catch (error) {
      console.error('JWT验证失败:', error);
    }
    
    // 5. 检查auth.ts中的认证逻辑
    console.log('\n=== 检查认证逻辑 ===');
    console.log('请确认auth.ts中的jwt和session回调函数正确处理了role字段');
    console.log('特别是确保session.user.role被正确设置');
    
    // 6. 建议
    console.log('\n=== 排查建议 ===');
    console.log('1. 检查浏览器开发者工具中的应用程序/会话存储，确认next-auth.session-token是否存在');
    console.log('2. 清除浏览器缓存和Cookie后重新登录');
    console.log('3. 确保DashboardLayout.tsx中的权限检查逻辑正确处理角色大小写');
    console.log('4. 检查用户API调用是否返回了正确的角色信息');
    
  } catch (error) {
    console.error('测试过程中出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSession();