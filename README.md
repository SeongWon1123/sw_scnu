# sw_scnu — SC&U (순천대 접근성 안내)

`project/` 아래 SW 튜터링 산출물과 SC&U 앱 소스가 있습니다.
HWP/PDF 등 문서는 내용을 수정하지 않고 그대로 둡니다. 비밀값·키는 `.env`로만 관리합니다.

## 구조

```
project/
  docs/                 # HWP·PDF 원본 (유지)
  sc-u/
    frontend/           # React + Vite + Kakao Map + Supabase
    backend/            # FastAPI + Supabase + Ollama RAG
  SC_U_agent.md
  SC_U_계획서.md
```

## 환경변수 설정 (중요)

```bash
# Frontend
cp project/sc-u/frontend/.env.example project/sc-u/frontend/.env

# Backend
cp project/sc-u/backend/.env.example project/sc-u/backend/.env
```

`.env`에만 실제 키를 넣고 커밋하지 마세요.

| 위치 | 변수 |
|------|------|
| frontend | `VITE_KAKAO_MAP_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_BASE_URL` |
| backend | `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `OLLAMA_BASE_URL` |

## 실행

```bash
# Backend
cd project/sc-u/backend
python -m venv venv
# Windows: venv\Scripts\activate
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend (다른 터미널)
cd project/sc-u/frontend
npm install
npm run dev
```

## 문서 정책

- `project/docs/*.{hwp,hwpx,pdf}` : 원본 유지
- Desktop의 대용량 `data/`·PPTX는 GitHub 한도 때문에 저장소에 넣지 않음
