import { useState, useRef, useEffect } from 'react'

export default function ChatWindow({ messages, onSend, loading }) {
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = () => {
    if (!input.trim() || loading) return
    onSend(input)
    setInput('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            background: m.role === 'user' ? '#2196F3' : 'rgba(255,255,255,0.1)',
            color: 'white', borderRadius: 16, padding: '12px 16px',
            maxWidth: '75%', fontSize: 14, lineHeight: 1.6
          }}>
            {m.content}
          </div>
        ))}
        {loading && (
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, alignSelf: 'flex-start' }}>
            AI가 답변을 생성 중...
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: 16, display: 'flex', gap: 8, background: 'rgba(0,0,0,0.2)' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="메시지를 입력하세요..."
          style={{
            flex: 1, padding: '12px 16px', borderRadius: 24, border: 'none',
            background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: 14, outline: 'none'
          }}
        />
        <button onClick={send} disabled={loading} style={{
          background: '#2196F3', color: 'white', border: 'none',
          borderRadius: 24, padding: '12px 20px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700
        }}>전송</button>
      </div>
    </div>
  )
}
