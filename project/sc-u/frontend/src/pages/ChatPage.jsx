import { useState } from 'react'
import axios from 'axios'

export default function ChatPage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '안녕하세요! 순천대학교 접근성 안내 AI SC&U입니다. 캠퍼스 내 장애인 편의시설에 대해 무엇이든 물어보세요.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const send = async () => {
    if (!input.trim()) return
    const userMsg = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/chat`, { message: input })
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.answer }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '오류가 발생했습니다. 다시 시도해주세요.' }])
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0f2440' }}>
      <nav style={{ padding: '16px 20px', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <a href="/" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>← 지도로</a>
        <span style={{ color: 'white', fontWeight: 700 }}>🤖 AI 접근성 안내</span>
      </nav>
      <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            background: m.role === 'user' ? '#2196F3' : 'rgba(255,255,255,0.1)',
            color: 'white', borderRadius: 16, padding: '12px 16px',
            maxWidth: '70%', fontSize: 14, lineHeight: 1.6
          }}>
            {m.content}
          </div>
        ))}
        {loading && <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>AI가 답변을 생성 중...</div>}
      </div>
      <div style={{ padding: 16, display: 'flex', gap: 8, background: 'rgba(0,0,0,0.2)' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="예: 도서관 근처 장애인 화장실 어디야?"
          style={{
            flex: 1, padding: '12px 16px', borderRadius: 24, border: 'none',
            background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: 14,
            outline: 'none'
          }}
        />
        <button onClick={send} style={{
          background: '#2196F3', color: 'white', border: 'none',
          borderRadius: 24, padding: '12px 20px', cursor: 'pointer', fontWeight: 700
        }}>전송</button>
      </div>
    </div>
  )
}
