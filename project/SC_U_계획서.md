# SC&U — 종합 프로젝트 계획서
> Suncheon Campus & You | 국립순천대학교 AI 기반 장애인 접근성 안내 시스템  
> 2026 SW 융합캡스톤디자인 | 웰니스 메이커조

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 프로젝트명 | SC&U (Suncheon Campus & You) |
| 목적 | 국립순천대학교 캠퍼스 내 장애인 접근성 정보를 AI와 지도로 제공 |
| 핵심 가치 | 직접 수집 데이터 + AI 자연어 질의 + 실시간 커뮤니티 제보 |
| 기간 | 2026년 1학기 ~ 2026년 2학기 (12개월) |
| 대상 | 장애 학생, 교직원, 방문객 |

---

## 2. 핵심 기능 3가지

### 기능 1: 캠퍼스 접근성 지도
- 카카오맵 SDK 기반 지도 위에 핀 마커 표시
- 마커 종류: 장애인 화장실, 장애인 주차구역, 엘리베이터, 경사로, 자동문
- 핀 클릭 시: 문 폭, 경사 유무, 전동휠체어 진입 가능 여부 등 세부 정보 팝업
- 데이터: 팀 직접 현장 조사 수집

### 기능 2: 실시간 불편 제보 시스템
- 사용자가 고장/잠금/공사 등 불편 사항 직접 제보
- 제보 즉시 지도에 반영 (관리자 승인 후 확정)
- 제보 유형: 고장, 임시폐쇄, 공사중, 기타

### 기능 3: AI 챗봇 자연어 질의
- "도서관 근처 장애인 화장실 어디야?" → DB 검색 → 답변
- RAG(Retrieval-Augmented Generation) 방식: 실제 DB 데이터만 응답
- 사용 LLM: Google Gemini API (gemini-1.5-flash)

---

## 3. 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React 18 + Vite, Kakao Maps SDK v3, React Router v6, PWA |
| Backend | Python 3.11 + FastAPI, LangChain, JWT |
| DB/Auth | Supabase (PostgreSQL + Auth + Storage + Realtime + pgvector) |
| AI | Google Gemini API, text-embedding-3-small |
| 배포 | Vercel (FE), Render (BE), GitHub Actions (CI/CD) |

---

## 4. 데이터베이스 스키마

### facilities (접근성 시설 정보)
```sql
CREATE TABLE facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- toilet | parking | elevator | ramp | door
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
```

### reports (불편 제보)
```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  report_type TEXT NOT NULL, -- broken | closed | construction | other
  description TEXT NOT NULL,
  image_url TEXT,
  status TEXT DEFAULT 'pending', -- pending | approved | resolved | rejected
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### profiles (사용자 프로필)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  nickname TEXT,
  role TEXT DEFAULT 'user', -- user | admin
  disability_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### chat_logs (AI 대화 기록)
```sql
CREATE TABLE chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT NOT NULL,
  role TEXT NOT NULL, -- user | assistant
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS 정책
```sql
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
```

### pgvector 유사도 검색 함수
```sql
CREATE EXTENSION IF NOT EXISTS vector;

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
```

---

## 5. API 설계 (FastAPI)

### 시설
| Method | Endpoint | Auth | 설명 |
|--------|----------|------|------|
| GET | `/api/facilities` | 없음 | 전체 목록 (쿼리: type, building) |
| GET | `/api/facilities/{id}` | 없음 | 상세 조회 |
| POST | `/api/facilities` | 관리자 | 등록 |
| PUT | `/api/facilities/{id}` | 관리자 | 수정 |
| DELETE | `/api/facilities/{id}` | 관리자 | 삭제 |

### 제보
| Method | Endpoint | Auth | 설명 |
|--------|----------|------|------|
| GET | `/api/reports` | 로그인 | 목록 (관리자: 전체) |
| POST | `/api/reports` | 로그인 | 제보 등록 |
| PATCH | `/api/reports/{id}/approve` | 관리자 | 승인 |
| PATCH | `/api/reports/{id}/resolve` | 관리자 | 해결 처리 |

### AI 챗봇
| Method | Endpoint | Auth | 설명 |
|--------|----------|------|------|
| POST | `/api/chat` | 선택 | 자연어 질의 → 응답 |
| GET | `/api/chat/history` | 로그인 | 대화 기록 |

---

## 6. AI RAG 파이프라인

```
[사용자 질문]
  → [임베딩 생성] (Gemini Embedding)
  → [pgvector 유사도 검색] (상위 5개 시설)
  → [프롬프트 구성]
      System: "순천대학교 접근성 안내 AI. 아래 데이터만 사용하여 한국어로 답변하세요."
      Context: 검색된 시설 정보
      User: 원래 질문
  → [Gemini API 호출]
  → [응답 반환 + chat_logs 저장]
```

---

## 7. 화면 구성

| 화면 | 경로 | 설명 |
|------|------|------|
| 메인 지도 | `/` | 카카오맵 + 마커 + 필터 버튼 |
| 시설 상세 | `/facility/:id` | 정보 + 사진 + 제보 목록 |
| 제보하기 | `/report` | 제보 폼 + 사진 업로드 |
| AI 챗봇 | `/chat` | 채팅 UI |
| 로그인 | `/login` | 이메일 로그인 |
| 회원가입 | `/signup` | 가입 + 장애 유형 선택 |
| 관리자 | `/admin` | 시설 CRUD + 제보 승인 |
| 마이페이지 | `/mypage` | 내 제보 내역 |

---

## 8. 단계별 로드맵

### Phase 1 (1~3개월): 데이터 & 지도
- 순천대 전 건물 현장 조사
- Supabase 프로젝트 + DB 마이그레이션
- React + Vite 초기화
- 카카오맵 마커 + 팝업 구현
- FastAPI `/api/facilities` CRUD

### Phase 2 (4~6개월): 사용자 기능
- Supabase Auth (이메일 로그인)
- 제보 시스템 + 관리자 승인
- Supabase Realtime 연동 (제보 실시간 반영)
- 사진 업로드 (Supabase Storage)
- 관리자 대시보드

### Phase 3 (7~9개월): AI 챗봇
- pgvector 활성화 + 임베딩 생성
- LangChain RAG 파이프라인
- Gemini API 연동
- 챗봇 UI 구현
- 정확도 테스트 (20가지 시나리오)

### Phase 4 (10~12개월): 완성 & 발표
- 사용자 테스트 (장애 학생/교직원 최소 10명)
- 피드백 반영 + 버그 수정
- Vercel + Render 배포
- PWA 설정
- 최종 보고서 + 발표

---

## 9. 환경변수

```env
# Frontend (.env)
VITE_KAKAO_MAP_KEY=카카오맵_앱키
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=anon_key
VITE_API_BASE_URL=http://localhost:8000

# Backend (.env)
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=service_role_key
GEMINI_API_KEY=구글_제미나이_API_키
```

---

*SC&U — Suncheon Campus & You | 순천대학교 웰니스 메이커조 | 2026*
