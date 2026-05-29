# 乐心账号体系方案

## 核心设计原则

1. **低门槛**：用户不注册也能用，数据先存本地
2. **渐进式**：用到同步功能时才提示登录
3. **低成本**：尽量用免费额度，月成本 < 50 元
4. **合规**：国内上架需要用户信息保护合规

---

## 推荐方案：Supabase（BaaS）

### 为什么选 Supabase

| 维度 | Supabase | Firebase | 自建后端 |
|------|---------|----------|---------|
| 国内访问 | ⚠️ 需 CDN 加速 | ❌ 不稳定 | ✅ |
| 免费额度 | ✅  generous | ✅ generous | ❌ 服务器成本 |
| Auth 功能 | ✅ 完善 | ✅ 完善 | ❌ 自己写 |
| 数据库 | PostgreSQL | Firestore | 自己搭 |
| 开发速度 | ✅ 最快 | ✅ 快 | ❌ 慢 |
| 数据主权 | ✅ 可自托管 | ❌ Google | ✅ |

> Supabase 是开源 Firebase 替代品，基于 PostgreSQL，有完善的 Auth 系统。

### 免费额度（完全够用）

- 数据库：500MB 存储
- Auth：无限用户（免费版）
- API 调用：无限（ fair use）
- 带宽：2GB/月出口

按乐心的数据量：一条心情记录 ≈ 2KB，500MB 可以存 25 万条。足够支撑到几万用户。

---

## 技术架构

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   乐心 App      │────▶│   Supabase      │────▶│  PostgreSQL     │
│  (Capacitor)    │     │   (Auth + API)  │     │  (用户数据)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │
        │ (未登录时)
        ▼
┌─────────────────┐
│ 本地 Preferences │
│ (离线可用)       │
└─────────────────┘
```

### 数据流

1. **未登录用户**：数据存本地（和现在有一样体验）
2. **登录用户**：
   - 自动将本地数据同步到云端
   - 之后每次操作同步写入云端 + 本地缓存
   - 换设备登录 = 拉取云端数据到本地
3. **离线状态**：先写本地，联网后自动同步

---

## 登录方式选择

### 方案 A：手机号 + 验证码（推荐国内）

**优点**：
- 国内用户最习惯
- 不需要第三方平台资质

**缺点**：
- Supabase 不支持国内短信服务商（阿里云/腾讯云）
- 需要自己接入短信 API，有成本（约 0.05 元/条）

**实现**：
```
Supabase Auth(邮箱) + 自己封装手机号登录
或
直接调用阿里云短信 API + 自建简单验证逻辑
```

### 方案 B：微信登录

**优点**：
- 国内用户零 friction
- 一键登录，体验最好

**缺点**：
- **需要企业资质**（个人开发者开不了微信开放平台账号）
- 需要备案域名

**结论**：MVP 阶段做不了，以后公司化运营再加。

### 方案 C：邮箱 + 密码（最容易实现）

**优点**：
- Supabase 原生支持，一行代码搞定
- 零额外成本
- 国内外通用

**缺点**：
- 国内用户不太习惯邮箱注册
- 但心情类 App 用户偏年轻，接受度还行

**实现**：
```ts
// Supabase 自带
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
})
```

### 方案 D：匿名账号（保底方案）

**优点**：
- 用户零感知，自动创建
- 数据立即可以跨设备（只要记住匿名 ID）

**缺点**：
- 用户清缓存/换设备后找不到匿名 ID = 数据丢失
- 需要引导用户升级为正式账号

**实现**：
```ts
// 首次打开自动生成 UUID
const anonymousId = await generateUUID()
// 用这个 ID 作为 Supabase 用户标识
```

---

## 最终推荐：邮箱登录 + 匿名账号保底

### 用户旅程

```
首次打开 App
    │
    ├──▶ 自动生成匿名 ID（后台）
    │      数据存本地，云端用匿名 ID 同步
    │
    └──▶ 用户点击「同步/备份」
           │
           ├──▶ 弹登录框：邮箱 + 密码
           │      登录成功后，匿名数据迁移到正式账号
           │
           └──▶ 或选择「暂不登录，记住匿名 ID」
                  显示匿名 ID 二维码，换机时扫码恢复
```

### 界面改动

在现有页面基础上加：

1. **设置页**（从 Tab 栏或右上角菜单进入）
   - 登录状态 / 未登录提示
   - 同步按钮（手动触发）
   - 退出登录

2. **登录弹窗**（模态框）
   - 邮箱输入框
   - 密码输入框
   - 登录 / 注册切换
   - 忘记密码（Supabase 自带邮件重置）

---

## 数据库设计

### users 表（Supabase Auth 自动管理）

Supabase Auth 自带 `auth.users`，不需要自己建。

### moods 表（云端同步）

```sql
create table moods (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  content text not null,
  score integer,
  comment text,
  valence integer,
  arousal integer,
  dominant_need text,
  cognitive_pattern text,
  social_connection text,
  suggestion text,
  alert_level text,
  alert_message text,
  body_load_index integer,
  body_advice text,
  vitals jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  -- 本地生成的 ID，用于去重
  local_id text unique
);

-- 行级安全策略：用户只能读写自己的数据
alter table moods enable row level security;

create policy "Users can only access their own moods"
  on moods for all
  using (auth.uid() = user_id);

-- 索引
create index idx_moods_user_created on moods(user_id, created_at desc);
```

### 本地数据结构（保持不变）

本地仍用 Preferences，结构不变。只是多一个 `synced` 字段标记是否已同步。

```ts
interface MoodEntry {
  // ... 现有字段
  synced?: boolean     // 是否已同步到云端
  localOnly?: boolean  // 是否仅本地（未登录时）
}
```

---

## API 封装（lib/supabase.ts）

```ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// 登录
export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

// 注册
export async function signUp(email: string, password: string) {
  return supabase.auth.signUp({ email, password })
}

// 同步本地数据到云端
export async function syncMoodsToCloud(moods: MoodEntry[]) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  
  const records = moods.map(m => ({
    user_id: user.id,
    local_id: m.id,
    content: m.content,
    // ... 其他字段
  }))
  
  // upsert = 插入或更新
  return supabase.from('moods').upsert(records, { onConflict: 'local_id' })
}

// 从云端拉取数据
export async function fetchMoodsFromCloud() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  
  return supabase
    .from('moods')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
}
```

---

## 实施步骤

### Phase 1：基础设施（30 分钟）

1. 注册 Supabase 账号（https://supabase.com）
2. 创建新项目
3. 执行 moods 表的 SQL
4. 获取 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY`
5. 添加到 GitHub Secrets 和本地 `.env`

### Phase 2：前端集成（2-3 小时）

1. 安装依赖：`npm install @supabase/supabase-js`
2. 封装 `lib/supabase.ts`
3. 添加登录/注册弹窗组件
4. 修改 `lib/moodStorage.ts`：支持 sync 标记
5. 添加「设置」入口（Tab 栏或菜单）

### Phase 3：同步逻辑（2 小时）

1. 登录时：本地数据 → 云端（upsert）
2. 启动时：检查登录状态 → 拉取云端数据 → 合并到本地
3. 每次增删改：本地 + 云端双写（或先本地后异步同步）
4. 网络断开：入队列，联网后批量同步

### Phase 4：测试 & 上线（1 小时）

1. 测试登录/注册流程
2. 测试数据同步（两台设备）
3. 测试离线场景
4. 更新隐私政策（说明数据存储方式）

---

## 成本估算

| 项目 | 费用 |
|------|------|
| Supabase 免费版 | ¥0/月 |
| 域名（可选） | ¥50-100/年 |
| 短信验证码（如后续加手机号） | ¥0.05/条 |
| **合计** | **¥0/月（初期）** |

---

## 风险 & 备案

### 国内上架合规

- **ICP 备案**：如果用自己的域名，需要备案
- **数据出境**：Supabase 服务器在海外，理论上有数据出境问题
- **隐私政策**：需要更新，说明数据存储在 Supabase（新加坡/美国）

**规避方案**：
- 不上传敏感数据（心情内容算敏感吗？严格来说算个人日记）
- 或者后续自托管 Supabase（可以部署在国内云服务器）
- 或在隐私政策中明确告知数据存储位置

### 更稳妥的替代

如果担心合规，可以用 **Vercel + Vercel Postgres**（Edge Network 在国内有节点）：
- Next.js API 做后端
- Vercel Postgres 做数据库
- NextAuth.js 做认证
- 成本：Vercel Hobby 免费，Postgres 有免费额度

但开发复杂度比 Supabase 高。

---

## 决策建议

| 你的情况 | 建议方案 |
|---------|---------|
| 想最快上线，不纠结合规 | Supabase 邮箱登录，1 天搞定 |
| 担心数据出境/合规 | Vercel + 自建 API，2-3 天 |
| 预算极其紧张 | 先不做账号，只做本地导出 |
| 想一次到位 | Supabase + 后续自托管 |

---

## 下一步

如果你决定做，告诉我选哪个方案，我直接开始写代码：

1. **Supabase 方案**（最快）
2. **Vercel 自建方案**（更合规）
3. **再想想**（继续用本地存储 + 导出导入）
