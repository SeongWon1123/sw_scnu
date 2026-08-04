import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function MyPage() {
  const [profile, setProfile] = useState(null)
  const [nickname, setNickname] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/login'); return }
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(data)
    setNickname(data?.nickname || '')
  }

  const updateNickname = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('profiles').update({ nickname }).eq('id', user.id)
    alert('닉네임이 업데이트되었습니다.')
  }

  const logout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  if (!profile) return <div style={{ padding: 40, color: 'white', background: '#0f2440', minHeight: '100vh' }}>로딩 중...</div>

  return (
    <div style={{ minHeight: '100vh', background: '#0f2440', color: 'white', padding: 20 }}>
      <div style={{ maxWidth: 400, margin: '0 auto' }}>
        <a href="/" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>← 지도로</a>
        <h1 style={{ margin: '16px 0' }}>마이페이지</h1>

        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <p style={{ margin: '0 0 8px', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>이메일</p>
          <p style={{ margin: '0 0 16px' }}>{profile.email}</p>

          <p style={{ margin: '0 0 8px', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>닉네임</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={nickname} onChange={e => setNickname(e.target.value)} style={{
              flex: 1, padding: '10px 12px', borderRadius: 8, border: 'none', fontSize: 14
            }} />
            <button onClick={updateNickname} style={{
              background: '#2196F3', color: 'white', border: 'none',
              borderRadius: 8, padding: '10px 16px', cursor: 'pointer'
            }}>저장</button>
          </div>
        </div>

        <button onClick={logout} style={{
          width: '100%', padding: '12px', borderRadius: 8, border: 'none',
          background: '#e53935', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: 14
        }}>로그아웃</button>
      </div>
    </div>
  )
}
