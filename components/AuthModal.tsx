'use client'

import { useState } from 'react'
import { signUp, signIn } from '@/lib/supabase'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      if (mode === 'signup') {
        const { data, error } = await signUp(email, password)
        if (error) throw error
        setMessage('注册成功！请查收验证邮件后登录')
      } else {
        const { data, error } = await signIn(email, password)
        if (error) throw error
        onSuccess()
      }
    } catch (err: any) {
      setError(err.message || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-800">
            {mode === 'login' ? '登录账号' : '注册账号'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位"
              required
              minLength={6}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm"
            />
          </div>

          {error && (
            <div className="p-2.5 bg-red-50 text-red-600 rounded-lg text-xs">{error}</div>
          )}

          {message && (
            <div className="p-2.5 bg-green-50 text-green-700 rounded-lg text-xs">{message}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-medium hover:bg-primary-700 disabled:bg-gray-300 transition-colors"
          >
            {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-gray-500">
          {mode === 'login' ? (
            <>
              还没有账号？{' '}
              <button onClick={() => { setMode('signup'); setError(''); setMessage('') }} className="text-primary-600 font-medium hover:underline">
                立即注册
              </button>
            </>
          ) : (
            <>
              已有账号？{' '}
              <button onClick={() => { setMode('login'); setError(''); setMessage('') }} className="text-primary-600 font-medium hover:underline">
                直接登录
              </button>
            </>
          )}
        </div>

        <p className="mt-4 text-[10px] text-gray-400 text-center leading-relaxed">
          登录后数据将同步到云端，换设备登录可恢复记录
        </p>
      </div>
    </div>
  )
}
