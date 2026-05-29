# 🫀 乐心 (HeartMate) - 产品需求文档

> **版本：** v0.3  
> **日期：** 2026-05-25  
> **核心洞察：** 长期工作情绪压抑与心脏健康存在强关联。产品不仅要记录情绪，更要建立「情绪-身体」预警防线。

---

## 一、项目背景

基于近期工作经历发现：**工作情绪对心脏等器官有直接且累积的影响**。高强度工作状态下的焦虑、压抑、愤怒等负面情绪，长期不释放会导致：

- 心率变异性（HRV）持续降低
- 血压波动增大
- 睡眠质量下降 → 恢复不足 → 恶性循环
- 最终表现为心脏不适、胸闷、心悸等躯体症状

**现有产品的局限：**
- 单纯记录情绪，没有与身体指标联动
- AI 分析只停留在心理层面，没有健康预警
- 缺乏「情绪过载→身体警报→主动干预」的闭环

---

## 二、核心目标

### 2.1 一句话定义
> **追踪情绪轨迹，预警身体风险，守护心脏健康。**

### 2.2 三层价值
| 层级 | 价值 | 对应功能 |
|:---:|---|---|
| 🔴 **感知层** | 识别当下情绪状态 | AI 情绪分析（已有） |
| 🟡 **关联层** | 发现情绪→身体的关联规律 | 生理指标录入 + 关联分析 |
| 🟢 **预警层** | 在身体出症状前发出预警 | 健康风险模型 + 干预建议 |

---

## 三、身体指标设计（3个核心指标）

基于权威医学研究，选取**最简单、无需设备、用户可立即上手**的三个指标：

| 指标 | 输入方式 | 为什么选它 | 研究依据 |
|---|---|---|---|
| **静息心率** | 数字输入（次/分） | 最强单一心血管预测因子 | Jensen et al. (2024): RHR增加2.6bpm即显著增加死亡风险；50岁男性RHR>75 vs ≤55，死亡风险翻倍 |
| **睡眠质量** | 1-10 滑块 | 恢复的核心指标 | 睡眠差直接导致HRV降低、次日疲劳峰值 |
| **疲劳感** | 1-10 滑块 | 身体最直接的求救信号 | 慢性疲劳是心血管事件的早期预警信号 |

> **为什么不选 HRV / 血压？**  
> HRV 需要专业设备（Apple Watch / 心率带），血压需要血压计。这三个指标用户随时随地可以主观评估或手动测量（脉搏），门槛最低。

---

## 四、预警阈值（基于循证医学）

### 4.1 核心研究引用

1. **静息心率阈值**（Jensen MT, et al. *Change in resting heart rate and risk for all-cause mortality*. Amsterdam UMC, 2024）
   - RHR 平均增加 **2.6 bpm** 即与全因死亡风险显著增加相关
   - 50岁男性 RHR >75 bpm vs ≤55 bpm：**死亡风险翻倍**（21年随访）
   - 糖尿病患者 RHR **~77 bpm** 是 CV 风险分界点

2. **工作压力与冠心病**（Kivimäki M, et al. *Lancet*, 2012; IPD-Work Consortium, n=197,473）
   - 工作压力使冠心病风险增加 **23%**（HR 1.23, 95% CI 1.10–1.37）
   - 每周工作 **>55小时** vs 35-40小时：中风风险增加 **33%**
   - 人群归因风险（PAR）：**3.4%**

3. **情绪与心血管事件**（Civieri G, et al. *AHA 2023*）
   - 焦虑/抑郁使主要心血管事件风险增加 **~35%**
   - 有焦虑/抑郁的人比无的人**早6个月**出现新的心血管风险因素

4. **双重打击效应**（Huang Y, et al. *Diabetes Metab Syndr*, 2024; ACCORD trial, n=7,529）
   - 低 HRV + 高 RHR 组合：**全因死亡风险 HR 1.68**（95% CI 1.43-1.97）
   - 两者有**协同致死效应**

5. **高付出低回报 + 工作压力**（Lavigne-Robichaud M, et al. *Circulation*, 2023）
   - 男性同时经历工作压力 + 高付出低回报：**心脏病风险翻倍**
   - 效应量**相当于肥胖**对冠心病的影响

### 4.2 预警规则

```
【预警算法】基于上述研究的保守阈值设计

🟢 关注（Attention）
  触发条件（满足任一）：
  - 静息心率 > 75 bpm 连续 2 天
  - 疲劳感 ≥ 8 连续 2 天
  - 睡眠质量 ≤ 3 连续 3 天
  建议：注意休息、减少工作强度、深呼吸

🟡 警告（Warning）
  触发条件（满足任一）：
  - 静息心率 > 85 bpm 连续 3 天
  - 静息心率 > 75 + 疲劳感 ≥ 8 + 睡眠 ≤ 4 同时出现 连续 2 天
  - 情绪评分 < 4（消极）+ 疲劳感 ≥ 8 连续 3 天
  建议：建议体检、减少工作、增加运动、必要时就医

🔴 危险（Danger）
  触发条件（满足任一）：
  - 静息心率 > 100 bpm（心动过速）
  - 静息心率 > 90 + 疲劳感 ≥ 9 + 睡眠 ≤ 3 同时出现 连续 2 天
  - 用户主动报告"胸闷/心悸/胸痛"+ 心率 > 85
  建议：⚠️ 建议立即就医检查，暂停高强度工作
```

> **设计原则：** 宁可误报，不可漏报。所有阈值偏保守，给用户留出干预时间窗口。

---

## 五、功能需求

### P0 - 核心功能（当前阶段）

#### 5.1 身体指标录入（3指标）
- 记录心情时，可选录入身体指标（默认折叠，点击展开）
- 静息心率：数字输入（40-200 bpm），附带"如何测量"提示（摸脉搏15秒×4）
- 睡眠质量：1-10 滑块（1=极差，10=完美）
- 疲劳感：1-10 滑块（1=精力充沛，10=精疲力竭）

#### 5.2 AI 身心关联分析
- AI 结合情绪文本 + 身体指标，给出更精准的分析
- 新增输出：「身体负荷指数」「恢复建议」

#### 5.3 三级预警系统
- 基于上述循证阈值，实时计算预警状态
- 预警卡片显示在记录页面顶部和历史记录中
- 每次提交后自动评估

### P1 - 重要功能（后续）

#### 5.4 身心趋势图表
- 情绪分数 × 静息心率 双轴趋势图
- 疲劳感/睡眠质量 长期变化

#### 5.5 周报生成
- AI 自动总结身心趋势
- 基于数据给出个性化健康建议

#### 5.6 数据导出
- 导出 CSV/PDF，方便就医时给医生

### P2 - 优化功能（远期）

#### 5.7 设备接入
- Apple HealthKit / 智能手环数据同步

#### 5.8 用药/体检记录
- 降压药、安眠药服用记录
- 体检报告关键指标存档

---

## 六、数据模型

```typescript
interface MoodEntry {
  // === 已有字段 ===
  id: string
  content: string
  score: number        // AI 情绪评分 1-10
  comment: string      // AI 洞察评语
  createdAt: string
  valence?: number
  arousal?: number
  dominant_need?: string
  cognitive_pattern?: string
  social_connection?: string
  suggestion?: string

  // === 新增：身体指标 ===
  vitals?: {
    restingHeartRate?: number   // 静息心率（bpm）
    sleepQuality?: number       // 睡眠质量 1-10
    fatigueLevel?: number       // 疲劳感 1-10
  }

  // === 新增：预警状态（由系统计算）===
  alertLevel?: 'none' | 'attention' | 'warning' | 'danger'
  alertMessage?: string
}
```

---

## 七、技术实施路线

### 第一阶段（当前 → 1周）
1. 扩展数据模型（vitals 字段）
2. 记录表单增加身体指标录入（折叠面板）
3. 升级 AI Prompt，结合身体指标分析
4. 实现三级预警算法
5. 预警卡片 UI

### 第二阶段（1-2周）
1. 身心趋势图表
2. 周报生成
3. 预警阈值根据用户反馈微调

### 第三阶段（后续）
1. HealthKit 接入
2. 用户系统
3. 数据导出

---

## 八、医疗免责声明

> ⚠️ **本产品仅为健康监测和自我管理工具，不能替代专业医疗诊断。** 所有预警建议仅供参考，如身体出现不适，请及时就医。

---

## 九、命名建议

| 候选名 | 含义 |
|---|---|
| **乐心** (HeartMate) | 快乐的心 + 心情乐谱 |
| **心盾** (HeartShield) | 守护心脏 |
| **脉语** (PulseTalk) | 脉搏在说话 |

---

## 十、参考文献

1. Jensen MT, et al. (2024). *Change in resting heart rate and risk for all-cause mortality*. Amsterdam UMC.
2. Kivimäki M, et al. (2012). *Job strain as a risk factor for coronary heart disease*. Lancet. 380:1491-7. (IPD-Work Consortium, n=197,473)
3. Huang Y, et al. (2024). *Interplay of heart rate variability and resting heart rate on mortality in type 2 diabetes*. Diabetes Metab Syndr.
4. Civieri G, et al. (2023). *Depression, anxiety and stress linked to poor heart health*. AHA Scientific Sessions.
5. Lavigne-Robichaud M, et al. (2023). *Job strain combined with high efforts and low reward doubled men's heart disease risk*. Circulation.
6. Virtanen M, et al. (2018). *Long working hours and risk of coronary heart disease and stroke*. Lancet.

---

*本文档基于循证医学研究设计，预警阈值会随用户数据积累和医学进展持续优化。*
