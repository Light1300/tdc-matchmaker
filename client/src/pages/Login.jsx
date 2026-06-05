import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../lib/auth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await login(email, password)
    if (result.success) {
      navigate('/dashboard')
      }
     else {
      setError('Invalid email or password')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #fff5f7 0%, #fff 50%, #f0f9ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Georgia', serif" }}>
      <div style={{ width: '100%', maxWidth: 420, padding: '0 20px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>💍</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1a1a2e', margin: 0, letterSpacing: '-0.5px' }}>The Date Crew</h1>
          <p style={{ color: '#6b7280', marginTop: 6, fontSize: 14, fontFamily: 'system-ui, sans-serif' }}>Matchmaker Portal</p>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '36px 32px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #f3f4f6' }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#111827', marginBottom: 24, fontFamily: 'system-ui, sans-serif' }}>Sign in to your account</h2>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 20, color: '#dc2626', fontSize: 14, fontFamily: 'system-ui, sans-serif' }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6, fontFamily: 'system-ui, sans-serif' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@tdc.com"
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'system-ui, sans-serif', boxSizing: 'border-box', transition: 'border 0.2s' }}
              onFocus={e => e.target.style.border = '1px solid #ec4899'}
              onBlur={e => e.target.style.border = '1px solid #d1d5db'}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6, fontFamily: 'system-ui, sans-serif' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={e => e.key === 'Enter' && handleSubmit(e)}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'system-ui, sans-serif', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.border = '1px solid #ec4899'}
              onBlur={e => e.target.style.border = '1px solid #d1d5db'}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{ width: '100%', padding: '12px', background: loading ? '#f9a8d4' : 'linear-gradient(135deg, #ec4899, #be185d)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'system-ui, sans-serif', transition: 'opacity 0.2s' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#9ca3af', fontFamily: 'system-ui, sans-serif' }}>
            Use <strong>admin@tdc.com</strong> / <strong>tdc2024</strong>
          </p>
        </div>
      </div>
    </div>
  )
}