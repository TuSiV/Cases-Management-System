const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

// 获取项目根目录
const projectRoot = path.resolve(__dirname);

// 读取utils/index.ts文件内容
const utilsFilePath = path.join(projectRoot, 'src', 'utils', 'index.ts');
let utilsContent;

try {
  utilsContent = fs.readFileSync(utilsFilePath, 'utf8');
  console.log('成功读取utils文件');
} catch (error) {
  console.error('无法读取utils文件:', error);
  process.exit(1);
}

// 提取UserRole和Affiliation常量定义
const userRoleMatch = utilsContent.match(/enum UserRole {[\s\S]*?}/);
const affiliationMatch = utilsContent.match(/enum Affiliation {[\s\S]*?}/);

let UserRole = { ADMIN: 'admin', USER: 'user', VIEWER: 'viewer' };
let Affiliation = { HEADQUARTERS: '总部', BRANCH: '分部' };

// 尝试从文件中提取枚举值
if (userRoleMatch) {
  const userRoleContent = userRoleMatch[0];
  const roleLines = userRoleContent.split('\n').slice(1, -1);
  roleLines.forEach(line => {
    const [key, value] = line.trim().split('=').map(part => part.trim().replace(/[';]/g, ''));
    if (key && value) {
      UserRole[key] = value;
    }
  });
}

if (affiliationMatch) {
  const affiliationContent = affiliationMatch[0];
  const affiliationLines = affiliationContent.split('\n').slice(1, -1);
  affiliationLines.forEach(line => {
    const [key, value] = line.trim().split('=').map(part => part.trim().replace(/[';]/g, ''));
    if (key && value) {
      Affiliation[key] = value;
    }
  });
}

// 重新实现hasViewPermission函数以进行测试
function hasViewPermission(userRole, userAffiliation, caseAffiliation) {
  // 管理员可以查看所有案件
  if (userRole === UserRole.ADMIN) return true;
  
  // 查看角色可以查看所有案件
  if (userRole === UserRole.VIEWER) return true;
  
  // 普通用户只能查看自己隶属的案件
  return userAffiliation === caseAffiliation;
}

// 测试不同场景
console.log('\n=== 权限测试结果 ===');

// 测试1: VIEWER角色，分部隶属，查看总部案件
const test1 = hasViewPermission(UserRole.VIEWER, '分部', '总部');
console.log('测试1 - VIEWER角色(分部)查看总部案件:', test1 ? '✓ 有权限' : '✗ 无权限');

// 测试2: VIEWER角色，分部隶属，查看分部案件
const test2 = hasViewPermission(UserRole.VIEWER, '分部', '分部');
console.log('测试2 - VIEWER角色(分部)查看分部案件:', test2 ? '✓ 有权限' : '✗ 无权限');

// 测试3: VIEWER角色，总部隶属，查看分部案件
const test3 = hasViewPermission(UserRole.VIEWER, '总部', '分部');
console.log('测试3 - VIEWER角色(总部)查看分部案件:', test3 ? '✓ 有权限' : '✗ 无权限');

// 测试4: USER角色，分部隶属，查看总部案件
const test4 = hasViewPermission(UserRole.USER, '分部', '总部');
console.log('测试4 - USER角色(分部)查看总部案件:', test4 ? '✓ 有权限' : '✗ 无权限');

// 测试5: USER角色，分部隶属，查看分部案件
const test5 = hasViewPermission(UserRole.USER, '分部', '分部');
console.log('测试5 - USER角色(分部)查看分部案件:', test5 ? '✓ 有权限' : '✗ 无权限');

// 测试6: ADMIN角色，任意隶属，查看任意案件
const test6 = hasViewPermission(UserRole.ADMIN, '分部', '总部');
console.log('测试6 - ADMIN角色查看任意案件:', test6 ? '✓ 有权限' : '✗ 无权限');

// 创建Prisma客户端来检查数据库中的实际案件
const prisma = new PrismaClient();

async function checkActualCases() {
  try {
    console.log('\n=== 检查数据库中的实际案件 ===');
    
    // 获取所有案件
    const allCases = await prisma.case.findMany();
    
    if (allCases.length === 0) {
      console.log('数据库中没有案件');
      await prisma.$disconnect();
      return;
    }
    
    console.log(`找到 ${allCases.length} 个案件`);
    
    // 对于每个案件，检查testviewer用户是否有权限查看
    allCases.forEach(caseItem => {
      const hasPermission = hasViewPermission(UserRole.VIEWER, '分部', caseItem.affiliation);
      console.log(`案件 ${caseItem.caseNumber} (${caseItem.affiliation}): testviewer用户${hasPermission ? '有权限' : '无权限'}查看`);
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('检查案件时出错:', error);
    await prisma.$disconnect();
  }
}

// 执行实际案件检查
checkActualCases();