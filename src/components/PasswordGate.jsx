import { useState } from 'react'
import { useStore } from '../store/useStore'
import { Eye, EyeOff } from 'lucide-react'

export default function PasswordGate() {
  const [password, setPassword] = useState('')
  const [show, setShow]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const { authenticate, authError } = useStore()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!password.trim()) return
    setLoading(true)
    await authenticate(password.trim())
    setLoading(false)
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6">

      {/* Wordmark */}
      <div className="mb-12 text-center slide-up">
        <p className="eyebrow mb-4" style={{ color: '#b8956a', letterSpacing: '0.35em' }}>
          Private Research
        </p>
        <h1 className="font-serif text-[38px] font-light leading-none" style={{ color: '#f0ece3' }}>
          Trading Desk
        </h1>
        <div className="mx-auto mt-5" style={{ width: 28, height: 1, background: 'rgba(184,149,106,0.3)' }} />
      </div>

      {/* Form */}
      <div className="w-full max-w-[300px] slide-up" style={{ animationDelay: '100ms' }}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              className="input w-full pr-10 font-mono tracking-widest"
              placeholder="Group password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-70 transition-opacity"
            >
              {show ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>

          {authError && (
            <p className="text-xs px-3 py-2 rounded-lg bg-bear-dim text-bear-text">
              {authError}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="btn-primary w-full py-3 disabled:opacity-40"
          >
            {loading
              ? <span className="w-3.5 h-3.5 border border-current/30 border-t-current rounded-full animate-spin" />
              : 'Enter'}
          </button>
        </form>

        <div className="mt-10 text-center space-y-2">
          <p style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(122,114,104,0.45)' }}>
            Research only · No trading
          </p>
          <p style={{ fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(122,114,104,0.28)' }}>
            Owner? Use your PIN for full access
          </p>
        </div>
      </div>
    </div>
  )
}
