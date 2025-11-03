-- K-Context Master 데이터베이스 스키마
-- Supabase SQL Editor에서 실행하세요

-- 1. 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  name TEXT,
  level TEXT DEFAULT '초급',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 학습 기록 테이블
CREATE TABLE IF NOT EXISTS learning_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  story_id INT NOT NULL,
  story_title TEXT,
  completed_tabs JSONB DEFAULT '[]'::jsonb,
  quiz_score INT,
  pronunciation_score INT,
  study_date DATE DEFAULT CURRENT_DATE,
  level TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 단어장 테이블
CREATE TABLE IF NOT EXISTS wordbook (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  meaning TEXT NOT NULL,
  mastered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 퀴즈 결과 테이블 (상세 기록)
CREATE TABLE IF NOT EXISTS quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  story_id INT NOT NULL,
  total_questions INT,
  correct_answers INT,
  score INT,
  time_spent INT, -- 초 단위
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_learning_records_user ON learning_records(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_records_date ON learning_records(study_date DESC);
CREATE INDEX IF NOT EXISTS idx_wordbook_user ON wordbook(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_user ON quiz_results(user_id);

-- Row Level Security (RLS) 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE wordbook ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

-- RLS 정책 (사용자는 자신의 데이터만 조회/수정 가능)
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view own learning records" ON learning_records
  FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own wordbook" ON wordbook
  FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own quiz results" ON quiz_results
  FOR ALL USING (auth.uid()::text = user_id::text);

-- 초기 테스트 사용자 (선택사항)
INSERT INTO users (id, email, name, level) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'test@example.com', '테스트 사용자', '초급')
ON CONFLICT DO NOTHING;

