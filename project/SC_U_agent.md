# SC&U 에이전트 실행 지시서

## 프로젝트 정보
- **이름**: SC&U (Suncheon Campus & You)
- **목적**: 국립순천대학교 장애인 접근성 AI 안내 시스템
- **스택**: React+Vite (FE), FastAPI (BE), Supabase (DB/Auth), Gemini API (AI)

---

## 작업 순서

### STEP 1: 프로젝트 폴더 구조 생성

```
sc-u/
├── frontend/          # React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── Map/
│   │   │   │   ├── KakaoMap.jsx
│   │   │   │   ├── FacilityMarker.jsx
│   │   │   │   └── FacilityPopup.jsx
│   │   │   ├── Chat/
│   │   │   │   ├── ChatWindow.jsx
│   │   │   │   └── ChatMessage.jsx
│   │   │   ├── Report/
│   │   │   │   └── ReportForm.jsx
│   │   │   └── Admin/
│   │   │       └── AdminDashboard.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── FacilityDetail.jsx
│   │   │   ├── ChatPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── SignupPage.jsx
│   │   │   └── MyPage.jsx
│   │   ├── lib/
│   │   │   └── supabaseClient.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env
│   └── package.json
└── backend/           # FastAPI
    ├── main.py
    ├── routers/
    │   ├── facilities.py
    │   ├── reports.py
    │   └── chat.py
    ├── services/
    │   └── rag_service.py
    ├── .env
    └── requirements.txt
```

---

### STEP 2: 프론트엔드 초기화

```bash
cd sc-u/frontend
npm create vite@latest . -- --template react
npm install
npm install @supabase/supabase-js axios react-router-dom
```

#### `.env` (frontend)
```
VITE_KAKAO_MAP_KEY=YOUR_KAKAO_KEY
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
VITE_API_BASE_URL=http://localhost:8000
```

---

### STEP 3: `lib/supabaseClient.js` 작성

```js
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

---

### STEP 4: `App.jsx` 라우팅

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import FacilityDetail from './pages/FacilityDetail'
import ChatPage from './pages/ChatPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import MyPage from './pages/MyPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/facility/:id" element={<FacilityDetail />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}
```

---

### STEP 5: 카카오맵 컴포넌트 (`KakaoMap.jsx`)

```jsx
import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import FacilityPopup from './FacilityPopup'

const ICON_MAP = {
  toilet: '🚾', parking: '🅿️', elevator: '🛗', ramp: '♿', door: '🚪'
}

export default function KakaoMap({ filter }) {
  const mapRef = useRef(null)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    window.kakao.maps.load(() => {
      const map = new window.kakao.maps.Map(mapRef.current, {
        center: new window.kakao.maps.LatLng(34.9568, 127.4879),
        level: 4
      })
      loadMarkers(map)
    })
  }, [filter])

  const loadMarkers = async (map) => {
    const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/facilities`, {
      params: filter
    })
    res.data.forEach(f => {
      const marker = new window.kakao.maps.Marker({
        map,
        position: new window.kakao.maps.LatLng(f.latitude, f.longitude),
        title: f.name
      })
      window.kakao.maps.event.addListener(marker, 'click', () => setSelected(f))
    })
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      {selected && <FacilityPopup facility={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
```

---

### STEP 6: 백엔드 초기화

```bash
cd sc-u/backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install fastapi uvicorn supabase langchain langchain-google-genai python-dotenv python-multipart
```

#### `.env` (backend)
```
SUPABASE_URL=YOUR_SUPABASE_URL
SUPABASE_SERVICE_KEY=YOUR_SERVICE_ROLE_KEY
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

---

### STEP 7: `main.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import facilities, reports, chat

app = FastAPI(title="SC&U API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(facilities.router, prefix="/api/facilities", tags=["facilities"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
```

---

### STEP 8: `routers/facilities.py`

```python
from fastapi import APIRouter, Query
from supabase import create_client
import os

router = APIRouter()
sb = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))

@router.get("/")
def list_facilities(type: str = None, building: str = None):
    q = sb.table("facilities").select("*").eq("is_active", True)
    if type:
        q = q.eq("type", type)
    if building:
        q = q.ilike("building", f"%{building}%")
    return q.execute().data

@router.get("/{id}")
def get_facility(id: str):
    return sb.table("facilities").select("*").eq("id", id).single().execute().data

@router.post("/")
def create_facility(data: dict):
    return sb.table("facilities").insert(data).execute().data

@router.put("/{id}")
def update_facility(id: str, data: dict):
    return sb.table("facilities").update(data).eq("id", id).execute().data

@router.delete("/{id}")
def delete_facility(id: str):
    return sb.table("facilities").update({"is_active": False}).eq("id", id).execute().data
```

---

### STEP 9: `routers/reports.py`

```python
from fastapi import APIRouter
from supabase import create_client
import os

router = APIRouter()
sb = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))

@router.get("/")
def list_reports():
    return sb.table("reports").select("*, facilities(name, building)").execute().data

@router.post("/")
def create_report(data: dict):
    return sb.table("reports").insert(data).execute().data

@router.patch("/{id}/approve")
def approve_report(id: str):
    from datetime import datetime, timezone
    return sb.table("reports").update({
        "status": "approved",
        "approved_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", id).execute().data

@router.patch("/{id}/resolve")
def resolve_report(id: str):
    from datetime import datetime, timezone
    return sb.table("reports").update({
        "status": "resolved",
        "resolved_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", id).execute().data
```

---

### STEP 10: `services/rag_service.py` (AI RAG 파이프라인)

```python
import os
import google.generativeai as genai
from supabase import create_client

sb = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

SYSTEM_PROMPT = """당신은 국립순천대학교 캠퍼스 장애인 접근성 안내 AI 'SC&U'입니다.
반드시 아래 제공된 데이터만 사용하여 한국어로 친절하고 구체적으로 답변하세요.
데이터에 없는 정보는 "확인된 정보가 없습니다"라고 답하세요."""

def embed_text(text: str) -> list:
    result = genai.embed_content(
        model="models/text-embedding-004",
        content=text
    )
    return result["embedding"]

def search_facilities(query: str, k: int = 5) -> list:
    embedding = embed_text(query)
    result = sb.rpc("match_facilities", {
        "query_embedding": embedding,
        "match_count": k
    }).execute()
    return result.data

def generate_answer(query: str, context_items: list) -> str:
    context = "\n".join([
        f"- {item['name']} ({item['building']} {item['floor']}층): {item['description']}"
        for item in context_items
    ])
    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(
        f"{SYSTEM_PROMPT}\n\n[데이터]\n{context}\n\n[질문]\n{query}"
    )
    return response.text

def ask(query: str) -> str:
    items = search_facilities(query)
    if not items:
        return "관련 시설 정보를 찾을 수 없습니다."
    return generate_answer(query, items)
```

---

### STEP 11: `routers/chat.py`

```python
from fastapi import APIRouter
from pydantic import BaseModel
from services.rag_service import ask
from supabase import create_client
import os, uuid

router = APIRouter()
sb = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))

class ChatRequest(BaseModel):
    message: str
    session_id: str = None

@router.post("/")
def chat(req: ChatRequest):
    session_id = req.session_id or str(uuid.uuid4())
    answer = ask(req.message)
    sb.table("chat_logs").insert([
        {"session_id": session_id, "role": "user", "content": req.message},
        {"session_id": session_id, "role": "assistant", "content": answer}
    ]).execute()
    return {"answer": answer, "session_id": session_id}
```

---

### STEP 12: Supabase DB 마이그레이션 실행

Supabase 대시보드 SQL Editor에서 순서대로 실행:

```sql
-- 1. pgvector 확장
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. facilities
CREATE TABLE facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  building TEXT NOT NULL,
  floor INTEGER,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  description TEXT,
  door_width_cm INTEGER,
  is_electric_wheelchair_accessible BOOLEAN DEFAULT true,
  has_ramp BOOLEAN DEFAULT false,
  has_auto_door BOOLEAN DEFAULT false,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  nickname TEXT,
  role TEXT DEFAULT 'user',
  disability_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. reports
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  report_type TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  status TEXT DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. chat_logs
CREATE TABLE chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. RLS
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read" ON facilities FOR SELECT USING (true);
CREATE POLICY "admin write" ON facilities FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user own" ON reports FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "user insert" ON reports FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "admin all" ON reports FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON profiles FOR ALL USING (id = auth.uid());

-- 7. 유사도 검색 함수
CREATE OR REPLACE FUNCTION match_facilities(
  query_embedding vector(1536),
  match_count INT DEFAULT 5
)
RETURNS TABLE(id UUID, name TEXT, building TEXT, floor INTEGER, description TEXT, similarity FLOAT)
LANGUAGE SQL STABLE AS $$
  SELECT id, name, building, floor, description,
    1 - (embedding <=> query_embedding) AS similarity
  FROM facilities
  WHERE is_active = true
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

-- 8. 가입 시 profiles 자동 생성 트리거
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, email) VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

### STEP 13: 샘플 데이터 입력

```sql
INSERT INTO facilities (name, type, building, floor, latitude, longitude, description, door_width_cm, is_electric_wheelchair_accessible, has_ramp) VALUES
('중앙도서관 1층 장애인 화장실', 'toilet', '중앙도서관', 1, 34.9568, 127.4879, '정문 기준 오른쪽 복도 끝. 자동문 설치.', 95, true, false),
('공과대학 2관 장애인 주차구역', 'parking', '공과대학 2관', 0, 34.9571, 127.4882, '정문에서 30m. 3면. 경사로 있음.', null, true, true),
('학생회관 엘리베이터', 'elevator', '학생회관', 1, 34.9565, 127.4875, '1층 로비 좌측. 전동휠체어 진입 가능.', 110, true, false),
('인문대학 경사로', 'ramp', '인문대학', 0, 34.9562, 127.4871, '정문 우측. 경사 8도.', null, true, true),
('행정관 1층 장애인 화장실', 'toilet', '행정관', 1, 34.9570, 127.4877, '민원실 옆. 열쇠 필요 없음.', 90, true, false);
```

---

### STEP 14: 임베딩 일괄 생성 스크립트

`backend/scripts/embed_facilities.py` 작성 후 실행:

```python
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
load_dotenv()

import google.generativeai as genai
from supabase import create_client

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
sb = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))

facilities = sb.table("facilities").select("id, name, building, floor, description, type").execute().data

for f in facilities:
    text = f"{f['name']} {f['building']} {f['floor']}층 {f['description']} 유형:{f['type']}"
    result = genai.embed_content(model="models/text-embedding-004", content=text)
    embedding = result["embedding"]
    sb.table("facilities").update({"embedding": embedding}).eq("id", f["id"]).execute()
    print(f"✓ {f['name']} 임베딩 완료")

print("전체 임베딩 완료!")
```

```bash
python backend/scripts/embed_facilities.py
```

---

### STEP 15: 로컬 실행

```bash
# 백엔드
cd sc-u/backend
uvicorn main:app --reload --port 8000

# 프론트엔드 (새 터미널)
cd sc-u/frontend
npm run dev
```

접속: `http://localhost:5173`

---

### STEP 16: Home.jsx (메인 지도 페이지)

```jsx
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
      {/* 상단 네비 */}
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
```

---

### STEP 17: ChatPage.jsx (AI 챗봇 페이지)

```jsx
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
```

---

### STEP 18: requirements.txt

```
fastapi==0.111.0
uvicorn[standard]==0.29.0
supabase==2.4.6
langchain==0.2.0
langchain-google-genai==1.0.5
google-generativeai==0.5.4
python-dotenv==1.0.1
python-multipart==0.0.9
pydantic==2.7.1
```

---

### STEP 19: 배포

**프론트엔드 (Vercel)**
```bash
cd sc-u/frontend
npm install -g vercel
vercel --prod
# Vercel 대시보드에서 환경변수 설정
```

**백엔드 (Render)**
- render.com 접속 → New Web Service
- GitHub 레포 연결
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- 환경변수 입력

---

### STEP 20: 최종 체크리스트

- [ ] Supabase DB 마이그레이션 완료
- [ ] pgvector 활성화 및 match_facilities 함수 생성
- [ ] 시설 샘플 데이터 입력 (최소 20건)
- [ ] 임베딩 생성 스크립트 실행
- [ ] 카카오맵 마커 정상 표시
- [ ] AI 챗봇 5가지 질문 테스트 통과
- [ ] 제보 → 관리자 승인 → 지도 반영 플로우 테스트
- [ ] Vercel + Render 배포 완료
- [ ] 모바일 화면 반응형 확인

---

*SC&U — Suncheon Campus & You | 국립순천대학교 웰니스 메이커조 | 2026*
