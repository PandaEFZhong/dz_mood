import { RateLimiterMemory } from 'rate-limiter-flexible'

// 分析 API：每分钟最多 10 次请求
export const analyzeLimiter = new RateLimiterMemory({
  keyPrefix: 'analyze',
  points: 10,
  duration: 60,
})

// 通用 API：每分钟最多 60 次请求
export const generalLimiter = new RateLimiterMemory({
  keyPrefix: 'general',
  points: 60,
  duration: 60,
})
