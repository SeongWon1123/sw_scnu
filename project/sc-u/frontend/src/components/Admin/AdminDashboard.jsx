import { useState, useEffect } from 'react'
import axios from 'axios'

export default function AdminDashboard() {
  const [reports, setReports] = useState([])
  const [tab, setTab] = useState('pending')

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/reports`)
    setReports(res.data)
  }

  const approve = async (id) => {
    await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/api/reports/${id}/approve`)
    loadReports()
  }

  const resolve = async (id) => {
    await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/api/reports/${id}/resolve`)
    loadReports()
  }

  const filtered = reports.filter(r => r.status === tab)

  return (
    <div style={{ minHeight: '100vh', background: '#0f2440', color: 'white', padding: '20px' }}>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>🔧 관리자 대시보드</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['pending', 'approved', 'resolved'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: tab === t ? '#2196F3' : 'rgba(255,255,255,0.1)',
            color: 'white', border: 'none', borderRadius: 20,
            padding: '8px 16px', cursor: 'pointer', fontSize: 13
          }}>
            {t === 'pending' ? '대기' : t === 'approved' ? '승인' : '해결'} ({reports.filter(r => r.status === t).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 && <p style={{ color: 'rgba(255,255,255,0.5)' }}>해당 상태의 제보가 없습니다.</p>}

      {filtered.map(r => (
        <div key={r.id} style={{
          background: 'rgba(255,255,255,0.05)', borderRadius: 12,
          padding: 16, marginBottom: 12
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <strong>{r.report_type}</strong>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
              {r.facilities?.name || '시설'}
            </span>
          </div>
          <p style={{ margin: '0 0 12px', fontSize: 14, lineHeight: 1.5 }}>{r.description}</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {tab === 'pending' && (
              <button onClick={() => approve(r.id)} style={{
                background: '#43a047', color: 'white', border: 'none',
                borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13
              }}>승인</button>
            )}
            {tab === 'approved' && (
              <button onClick={() => resolve(r.id)} style={{
                background: '#2196F3', color: 'white', border: 'none',
                borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13
              }}>해결 완료</button>
            )}
          </div>
        </div>
      ))}

      <a href="/" style={{ display: 'inline-block', marginTop: 20, color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>← 지도로 돌아가기</a>
    </div>
  )
}
