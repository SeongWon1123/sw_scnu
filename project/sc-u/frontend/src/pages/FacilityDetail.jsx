import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import ReportForm from '../components/Report/ReportForm'

export default function FacilityDetail() {
  const { id } = useParams()
  const [facility, setFacility] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/facilities/${id}`)
      .then(res => setFacility(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div style={{ padding: 40, color: '#666' }}>로딩 중...</div>
  if (!facility) return <div style={{ padding: 40, color: '#e53935' }}>시설을 찾을 수 없습니다.</div>

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div style={{ background: '#0f2440', color: 'white', padding: '20px' }}>
        <a href="/" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>← 지도로</a>
        <h1 style={{ margin: '12px 0 4px', fontSize: 24 }}>{facility.name}</h1>
        <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)' }}>{facility.building} {facility.floor}층</p>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
        <div style={{ background: 'white', borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 12px' }}>📋 상세 정보</h3>
          <p style={{ lineHeight: 1.6, margin: '0 0 16px' }}>{facility.description}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {facility.has_ramp && <span style={{ background: '#e3f2fd', color: '#1565c0', padding: '6px 12px', borderRadius: 16, fontSize: 13 }}>♿ 경사로</span>}
            {facility.has_auto_door && <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '6px 12px', borderRadius: 16, fontSize: 13 }}>🚪 자동문</span>}
            {facility.is_electric_wheelchair_accessible && <span style={{ background: '#fff3e0', color: '#e65100', padding: '6px 12px', borderRadius: 16, fontSize: 13 }}>🔋 전동휠체어 접근 가능</span>}
            {facility.door_width_cm && <span style={{ background: '#f3e5f5', color: '#6a1b9a', padding: '6px 12px', borderRadius: 16, fontSize: 13 }}>📏 출입구 {facility.door_width_cm}cm</span>}
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden' }}>
          <ReportForm facilityId={id} />
        </div>
      </div>
    </div>
  )
}
