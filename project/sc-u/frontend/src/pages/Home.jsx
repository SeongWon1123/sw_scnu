import { useState } from 'react'
import KakaoMap from '../components/Map/KakaoMap'

const FILTERS = [
  { label: '전체', value: null },
  { label: '🚾 화장실', value: 'toilet' },
  { label: '🅿️ 주차', value: 'parking' },
  { label: '🛗 엘리베이터', value: 'elevator' },
  { label: '♿ 경사로', value: 'ramp' },
]

export default function Home() {
  const [filter, setFilter] = useState({})

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <nav style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        background: 'rgba(15,36,64,0.95)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', padding: '12px 20px', gap: 12
      }}>
        <span style={{ color: 'white', fontWeight: 900, fontSize: 22 }}>SC&U</span>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>순천대학교 접근성 안내</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {FILTERS.map(f => (
            <button key={f.label}
              onClick={() => setFilter(f.value ? { type: f.value } : {})}
              style={{
                background: filter.type === f.value ? '#2196F3' : 'rgba(255,255,255,0.1)',
                color: 'white', border: 'none', borderRadius: 20,
                padding: '6px 14px', cursor: 'pointer', fontSize: 13
              }}>
              {f.label}
            </button>
          ))}
          <a href="/chat" style={{
            background: '#43a047', color: 'white', borderRadius: 20,
            padding: '6px 14px', textDecoration: 'none', fontSize: 13
          }}>🤖 AI 질문</a>
        </div>
      </nav>
      <KakaoMap filter={filter} />
    </div>
  )
}
