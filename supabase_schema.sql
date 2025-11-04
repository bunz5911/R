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

-- ============================================================================
-- 🚀 코인 시스템 및 읽기 평가 테이블 (신규)
-- ============================================================================

-- 5. 사용자 코인 관리 테이블
CREATE TABLE IF NOT EXISTS user_coins (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_coins INT DEFAULT 0 CHECK (total_coins >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 코인 획득/사용 내역 테이블
CREATE TABLE IF NOT EXISTS coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INT NOT NULL, -- 양수: 획득, 음수: 사용
  type TEXT NOT NULL, -- 'reading_score', 'quiz_retry', 'purchase', 'bonus'
  story_id INT,
  paragraph_num INT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 발음 평가 기록 테이블 (녹음 데이터는 저장하지 않음!)
CREATE TABLE IF NOT EXISTS pronunciation_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  story_id INT NOT NULL,
  paragraph_num INT NOT NULL,
  score INT NOT NULL CHECK (score >= 0 AND score <= 100),
  coins_earned INT NOT NULL DEFAULT 0,
  feedback TEXT,
  mistakes JSONB DEFAULT '[]'::jsonb, -- [{original, user, suggestion}]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 학습 진행 상태 테이블 (섹션 잠금 관리)
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  story_id INT NOT NULL,
  completed_tabs JSONB DEFAULT '[]'::jsonb, -- ['summary', 'full-story', ...]
  quiz_passed BOOLEAN DEFAULT FALSE,
  quiz_attempts INT DEFAULT 0,
  locked BOOLEAN DEFAULT FALSE, -- 퀴즈 통과 전까지 잠금
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, story_id)
);

-- 9. 분석 데이터 캐시 테이블 (Gemini API 호출 최소화)
CREATE TABLE IF NOT EXISTS analysis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_title TEXT NOT NULL,
  level TEXT NOT NULL,
  result JSONB NOT NULL, -- 분석 결과 전체
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(story_title, level)
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_learning_records_user ON learning_records(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_records_date ON learning_records(study_date DESC);
CREATE INDEX IF NOT EXISTS idx_wordbook_user ON wordbook(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_user ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user ON coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_date ON coin_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pronunciation_scores_user ON pronunciation_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_pronunciation_scores_story ON pronunciation_scores(story_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_story ON user_progress(user_id, story_id);
CREATE INDEX IF NOT EXISTS idx_analysis_cache_lookup ON analysis_cache(story_title, level);

-- Row Level Security (RLS) 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE wordbook ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_coins ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pronunciation_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
-- analysis_cache는 모든 사용자가 읽기 가능 (RLS 비활성화)

-- RLS 정책 (사용자는 자신의 데이터만 조회/수정 가능)
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view own learning records" ON learning_records
  FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own wordbook" ON wordbook
  FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own quiz results" ON quiz_results
  FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own coins" ON user_coins
  FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own coin transactions" ON coin_transactions
  FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own pronunciation scores" ON pronunciation_scores
  FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own progress" ON user_progress
  FOR ALL USING (auth.uid()::text = user_id::text);

-- ============================================================================
-- 🚀 코인 관리 함수
-- ============================================================================

-- 코인 추가/차감 함수 (트랜잭션 안전)
CREATE OR REPLACE FUNCTION add_user_coins(
  p_user_id UUID,
  p_amount INT,
  p_type TEXT,
  p_story_id INT DEFAULT NULL,
  p_paragraph_num INT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_total INT;
BEGIN
  -- user_coins 테이블에 사용자가 없으면 생성
  INSERT INTO user_coins (user_id, total_coins)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- 코인 업데이트
  UPDATE user_coins
  SET total_coins = total_coins + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING total_coins INTO v_new_total;
  
  -- 거래 내역 기록
  INSERT INTO coin_transactions (user_id, amount, type, story_id, paragraph_num, description)
  VALUES (p_user_id, p_amount, p_type, p_story_id, p_paragraph_num, p_description);
  
  RETURN v_new_total;
END;
$$;

-- 초기 테스트 사용자 (선택사항)
INSERT INTO users (id, email, name, level) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'test@example.com', '테스트 사용자', '초급')
ON CONFLICT DO NOTHING;

-- 테스트 사용자 초기 코인 (100코인)
INSERT INTO user_coins (user_id, total_coins) VALUES
  ('00000000-0000-0000-0000-000000000001', 100)
ON CONFLICT DO NOTHING;

