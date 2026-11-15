import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

const REPORT_TYPES = [
  { value: 'broken', label: '시설 고장' },
  { value: 'inaccessible', label: '접근 불가' },
  { value: 'improvement', label: '개선 요청' },
  { value: 'new', label: '신규 시설 요청' },
]

export default function ReportForm({ facilityId }) {
  const [type, setType] = useState('')
  const [desc, setDesc] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const submit = async () => {
    if (!type || !desc.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }

    await supabase.from('reports').insert({
      facility_id: facilityId,
      user_id: user.id,
      report_type: type,
      description: desc,
    })
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: '#43a047' }}>
        ✅ 제보가 접수되었습니다. 감사합니다!
      </div>
    )
  }

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h3 style={{ margin: 0, fontSize: 16 }}>📢 시설 제보하기</h3>
      <select value={type} onChange={e => setType(e.target.value)} style={{
        padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14
      }}>
        <option value="">제보 유형 선택</option>
        {REPORT_TYPES.map(r => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>
      <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="상세 내용을 입력해주세요." rows={4} style={{
        padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, resize: 'vertical'
      }} />
      <button onClick={submit} style={{
        background: '#0f2440', color: 'white', border: 'none',
        borderRadius: 8, padding: '12px', cursor: 'pointer', fontWeight: 600, fontSize: 14
      }}>제보 제출</button>
    </div>
  )
}
