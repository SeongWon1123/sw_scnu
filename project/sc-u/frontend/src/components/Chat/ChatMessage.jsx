export default function ChatMessage({ message }) {
  return (
    <div style={{
      alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
      background: message.role === 'user' ? '#2196F3' : 'rgba(255,255,255,0.1)',
      color: 'white', borderRadius: 16, padding: '12px 16px',
      maxWidth: '75%', fontSize: 14, lineHeight: 1.6
    }}>
      {message.content}
    </div>
  )
}
