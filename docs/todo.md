# 乐心 (HeartMate) 待办清单

## 当前优先级

- [ ] **iOS 模拟器完整功能测试**（登录、AI 情绪分析、云端同步）
  - 状态：等待明天验证
  - 备注：Xcode 用 iPhone 17 Pro 可运行，Pro Max 有模拟器 bug

- [ ] **核对 `.env.local` 中的 Supabase/Moonshot key**
  - 状态：待确认
  - 备注：如果 iOS 登录或 AI 分析失败，先检查本地环境变量是否为最新值

## 安全/运维

- [ ] **重新生成 Supabase anon key**
  - 原因：之前的 anon key 曾发送在聊天中，存在泄露风险
  - 步骤：
    1. Supabase 控制台 → API Keys → Legacy anon key → Regenerate
    2. 更新 GitHub Secrets 的 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    3. 更新本地 `.env.local` 的 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    4. 重新构建 Android APK 并上传到蒲公英

## 产品/工程优化

- [ ] **（可选）拆分 `app/page.tsx` 为独立 Tab 组件**
  - 当前 600+ 行，可拆为 `RecordTab` / `HistoryTab` / `StatsTab`

- [ ] **（可选）评估 iOS CI 自动化构建方案**
  - 需要 Apple Developer Program（$99/年）才能真机分发或 TestFlight
  - 模拟器构建可在 GitHub Actions macOS runner 上实现

## 已完成（近期）

- [x] 修复 Android 登录 `Failed to fetch` 问题
- [x] 修复 Supabase 项目恢复后的 URL/key 变更问题
- [x] 修复 Moonshot API Key 缺失时的错误提示
- [x] 添加 Supabase 连通性诊断按钮
- [x] AI prompt 人格化改造（小乐）
- [x] iOS Capacitor 项目提交到版本控制
