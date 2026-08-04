import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const login = async (e) => {
    e.preventDefault()
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
    } else {
      navigate('/')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f2440', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form onSubmit={login} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 32, width: 360 }}>
        <h2 style={{ color: 'white', marginBottom: 24, textAlign: 'center' }}>SC&U 로그인</h2>
        {error && <p style={{ color: '#ef5350', fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <input
          type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="이메일" required
          style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: 'none', marginBottom: 12, fontSize: 14, boxSizing: 'border-box' }}
        />
        <input
          type="password" value={password} onChange={e => setPassword(e.target.value)}
          placeholder="비밀번호" required
          style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: 'none', marginBottom: 20, fontSize: 14, boxSizing: 'border-box' }}
        />
        <button type="submit" style={{
          width: '100%', padding: '12px', borderRadius: 8, border: 'none',
          background: '#2196F3', color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer'
        }}>로그인</button>
        <p style={{ textAlign: 'center', marginTop: 16 }}>
          <a href="/signup" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>계정이 없으신가요? 회원가입</a>
        </p>
        <p style={{ textAlign: 'center', marginTop: 8 }}>
          <a href="/" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>← 메인으로</a>
        </p>
      </form>
    </div>
  )
}
