-- SC&U Supabase DB Migration
-- Execute in Supabase SQL Editor in order

-- 1. pgvector extension
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
  embedding vector(768),
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

-- 7. Vector similarity search function
CREATE OR REPLACE FUNCTION match_facilities(
  query_embedding vector(768),
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

-- 8. Auto-create profile on signup trigger
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

-- 9. Sample data (Actual SCNU Campus)
DELETE FROM facilities;
INSERT INTO facilities (name, type, building, floor, latitude, longitude, description, door_width_cm, is_electric_wheelchair_accessible, has_ramp, has_auto_door) VALUES
('정문 접근로', 'entrance', '정문', 0, 34.9676, 127.4797, '순천대학교의 메인 출입구입니다. 보도가 평탄하여 휠체어 이동이 용이합니다.', null, true, true, false),
('대학본부 1층 화장실', 'toilet', '대학본부(A1)', 1, 34.9692, 127.4805, '1층 로비 중앙 우측에 위치한 장애인 화장실입니다.', 90, true, true, true),
('학생회관 식당 입구', 'ramp', '학생회관(E1)', 1, 34.9705, 127.4800, '학생회관 1층 식당으로 연결되는 완만한 경사로입니다.', null, true, true, false),
('중앙도서관 엘리베이터', 'elevator', '중앙도서관(C1)', 1, 34.9715, 127.4810, '도서관 전 층을 운행하는 대형 엘리베이터입니다. 휠체어 회전 공간이 충분합니다.', 110, true, true, true),
('인문예술대학 주출입구', 'entrance', '인문예술대학(E8)', 1, 34.9725, 127.4795, '인문대 1층 로비로 들어가는 자동문입니다.', 100, true, true, true),
('공과대학 1호관 경사로', 'ramp', '공과대학 1호관(D2)', 1, 34.9730, 127.4830, '공대 1호관 주차장 옆에 설치된 장애인용 경사로입니다.', null, true, true, false),
('70주년기념관 대강당', 'culture', '70주년기념관(B2)', 1, 34.9690, 127.4815, '휠체어 전용 관람석이 마련된 대강당입니다.', null, true, true, true),
('사범대학 1호관 엘리베이터', 'elevator', '사범대학 1호관(E3)', 1, 34.9712, 127.4785, '강의실 이동이 가능한 엘리베이터입니다.', 95, true, true, false),
('향림관(기숙사) 정문', 'entrance', '학생생활관(A6)', 1, 34.9735, 127.4770, '기숙사 입구 자동문 및 경사로입니다.', 90, true, true, true),
('생명산업과학대학 1층', 'toilet', '생명대 1호관(B3)', 1, 34.9685, 127.4825, '1층 로비 옆 장애인 화장실입니다.', 85, true, true, false);
