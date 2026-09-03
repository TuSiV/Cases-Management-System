# 案件管理系统 (CMS)

这是一个基于Next.js和Prisma开发的Web端案件管理系统，用于管理和跟踪案件信息。

## 功能特点

- 用户认证与授权（管理员和普通用户角色）
- 基于隶属的用户分组和权限控制
- 案件管理（创建、查看、编辑、删除）
- 用户管理（创建、查看、编辑、删除、重置密码）
- 仪表盘统计（案件总数、未结案件、已结案件、最近案件）
- 个人信息管理

## 技术栈

- **前端框架**：Next.js 14 (App Router)
- **UI组件库**：Ant Design
- **数据库ORM**：Prisma
- **认证**：NextAuth.js
- **状态管理**：SWR
- **样式**：CSS Modules

## 安装与运行

### 前提条件

- Node.js 18+
- npm 或 yarn

### 安装步骤

1. 克隆项目

```bash
git clone <repository-url>
cd CMS
```

2. 安装依赖

```bash
npm install
# 或
yarn install
```

3. 设置环境变量

复制`.env.example`文件为`.env`，并根据需要修改配置：

```
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
```

4. 初始化数据库

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

5. 启动开发服务器

```bash
npm run dev
# 或
yarn dev
```

6. 访问应用

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

### 默认账户

- 管理员账户：
  - 用户名：admin
  - 密码：见环境变量 ADMIN_DEFAULT_PASSWORD

- 普通用户账户（以REGION_1为例）：
  - 用户名：user_REGION_1
  - 密码：见环境变量 USER_DEFAULT_PASSWORD

## 项目结构

```
CMS/
├── prisma/                # Prisma配置和迁移文件
│   ├── schema.prisma      # 数据库模型定义
│   └── seed.ts           # 数据库种子文件
├── public/                # 静态资源
├── src/                   # 源代码
│   ├── app/               # Next.js应用目录
│   │   ├── api/           # API路由
│   │   ├── dashboard/     # 仪表盘页面
│   │   ├── login/         # 登录页面
│   │   ├── globals.css    # 全局样式
│   │   ├── layout.tsx     # 根布局组件
│   │   └── page.tsx       # 首页组件
│   ├── components/        # 共享组件
│   └── types/             # 类型定义
├── .env                   # 环境变量
├── next.config.js         # Next.js配置
├── package.json           # 项目依赖
└── tsconfig.json          # TypeScript配置
```

## 案件数据字段

系统管理的案件数据包括但不限于以下字段：

- 案件号（根据隶属、立案日期、案件类型自动生成）
- 隶属（REGION_1、REGION_2、REGION_3、REGION_4、REGION_5、REGION_6、REGION_7、REGION_8、REGION_9、REGION_10、REGION_11）
- 结案情况（未结案、审结、执结、调解、和解、撤诉、破产）
- 案件名称、原告名称、被告名称
- 对方性质（国有企业、民营企业、个人、行政机关、事业单位、外国主体、其他）
- 案件类型（民事、刑事）
- 立案日期、审结日期、执结日期
- 诉讼地位（主动、被动）
- 案由、纠纷解决方式（诉讼、仲裁）
- 审理机构、所处阶段
- 案件所属领域（集采、非集采）
- 案件标的额、本金金额、案件余额
- 年度指标（结案指标、避免或挽回损失指标、已实现金额）
- 已实现金额、计提坏账情况、风险敞口
- 项目组成员
- 费用信息（诉讼费用、律所情况、代理费用、其他费用）
- 抵押担保情况
- 案情描述（基本案情、处置措施、月度进展情况）

## 用户权限

- **管理员**：可以管理所有案件和用户，包括创建、查看、编辑和删除。
- **普通用户**：只能查看和编辑自己隶属部门的案件信息。

## 许可证

[MIT](LICENSE)