const ICON_MAP = {
  toilet: '🚾', parking: '🅿️', elevator: '🛗', ramp: '♿', door: '🚪'
}

export default function FacilityPopup({ facility, onClose }) {
  return (
    <div style={{
      position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
      background: 'white', borderRadius: 16, padding: 20, minWidth: 300, maxWidth: 400,
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)', zIndex: 20
    }}>
      <button onClick={onClose} style={{
        position: 'absolute', top: 8, right: 12, background: 'none', border: 'none',
        fontSize: 18, cursor: 'pointer', color: '#999'
      }}>✕</button>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{ICON_MAP[facility.type] || '📍'}</div>
      <h3 style={{ margin: '0 0 4px', fontSize: 18 }}>{facility.name}</h3>
      <p style={{ margin: '0 0 8px', color: '#666', fontSize: 13 }}>{facility.building} {facility.floor}층</p>
      <p style={{ margin: '0 0 12px', fontSize: 14, lineHeight: 1.5 }}>{facility.description}</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {facility.has_ramp && <span style={{ background: '#e3f2fd', color: '#1565c0', padding: '4px 10px', borderRadius: 12, fontSize: 12 }}>♿ 경사로</span>}
        {facility.has_auto_door && <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '4px 10px', borderRadius: 12, fontSize: 12 }}>🚪 자동문</span>}
        {facility.is_electric_wheelchair_accessible && <span style={{ background: '#fff3e0', color: '#e65100', padding: '4px 10px', borderRadius: 12, fontSize: 12 }}>🔋 전동휠체어</span>}
        {facility.door_width_cm && <span style={{ background: '#f3e5f5', color: '#6a1b9a', padding: '4px 10px', borderRadius: 12, fontSize: 12 }}>📏 {facility.door_width_cm}cm</span>}
      </div>
      <a href={`/facility/${facility.id}`} style={{
        display: 'block', textAlign: 'center', background: '#0f2440', color: 'white',
        padding: '10px', borderRadius: 12, textDecoration: 'none', fontWeight: 600, fontSize: 14
      }}>상세 보기</a>
    </div>
  )
}
