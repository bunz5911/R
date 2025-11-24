-- ============================================================================
-- RAKorean Supabase 데이터베이스 스키마
-- ============================================================================

-- ============================================================================
-- 1. profiles 테이블 (사용자 프로필)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    
    -- 플랜 정보
    plan TEXT DEFAULT 'free', -- 'free', 'pro', 'premier'
    role TEXT DEFAULT 'user', -- 'user', 'admin', 'supervisor'
    
    -- 코인 정보
    coins INT DEFAULT 100,
    total_coins_earned INT DEFAULT 0,
    total_coins_spent INT DEFAULT 0,
    
    -- 스트릭 정보
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_check_in DATE,
    level INT DEFAULT 1,
    freeze_count INT DEFAULT 0,
    
    -- 구독 정보
    subscription_id TEXT,
    subscription_status TEXT, -- 'active', 'canceled', 'past_due'
    subscription_start DATE,
    subscription_end DATE,
    
    -- 통계
    total_stories_completed INT DEFAULT 0,
    total_quizzes_completed INT DEFAULT 0,
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 2. user_progress 테이블 (학습 진도)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    story_id INT NOT NULL,
    story_title TEXT,
    completed BOOLEAN DEFAULT false,
    quiz_score INT,
    pronunciation_score INT,
    time_spent INT, -- 초 단위
    last_accessed TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, story_id)
);

-- ============================================================================
-- 3. streak_history 테이블 (출석 기록)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.streak_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    checked_in BOOLEAN DEFAULT true,
    coins_earned INT DEFAULT 0,
    freeze_used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, date)
);

-- ============================================================================
-- 4. wordbook 테이블 (단어장)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.wordbook (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    meaning TEXT,
    example TEXT,
    story_id INT,
    story_title TEXT,
    mastered BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, word)
);

-- ============================================================================
-- 5. user_coins 테이블 (사용자 코인 잔액)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_coins (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    total_coins INT NOT NULL DEFAULT 50,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 6. coin_transactions 테이블 (코인 거래 내역)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.coin_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INT NOT NULL, -- 양수: 획득, 음수: 소비
    type TEXT NOT NULL, -- 'daily_reward', 'quiz_penalty', 'purchase', 'streak_bonus', 'quiz_bonus'
    description TEXT,
    balance_after INT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 7. analysis_cache 테이블 (분석 캐시 - 이미 존재하는 경우 스킵)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.analysis_cache (
    story_title TEXT NOT NULL,
    level TEXT NOT NULL,
    result JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    PRIMARY KEY (story_title, level)
);

-- ============================================================================
-- 8. RLS (Row Level Security) 정책 설정
-- ============================================================================

-- profiles 테이블 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Supervisor는 모든 프로필 조회 가능
DROP POLICY IF EXISTS "Supervisors can view all profiles" ON public.profiles;
CREATE POLICY "Supervisors can view all profiles"
    ON public.profiles FOR SELECT
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'supervisor'
    );

-- user_progress 테이블 RLS
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own progress" ON public.user_progress;
CREATE POLICY "Users can manage own progress"
    ON public.user_progress
    USING (auth.uid() = user_id);

-- streak_history 테이블 RLS
ALTER TABLE public.streak_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own streak history" ON public.streak_history;
CREATE POLICY "Users can view own streak history"
    ON public.streak_history
    USING (auth.uid() = user_id);

-- wordbook 테이블 RLS
ALTER TABLE public.wordbook ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own wordbook" ON public.wordbook;
CREATE POLICY "Users can manage own wordbook"
    ON public.wordbook
    USING (auth.uid() = user_id);

-- user_coins 테이블 RLS
ALTER TABLE public.user_coins ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 코인 조회 가능
DROP POLICY IF EXISTS "Users can view own coins" ON public.user_coins;
CREATE POLICY "Users can view own coins"
    ON public.user_coins FOR SELECT
    USING (auth.uid() = user_id);

-- 사용자는 자신의 코인 업데이트 가능
DROP POLICY IF EXISTS "Users can update own coins" ON public.user_coins;
CREATE POLICY "Users can update own coins"
    ON public.user_coins FOR UPDATE
    USING (auth.uid() = user_id);

-- 사용자는 자신의 코인 데이터 삽입 가능
DROP POLICY IF EXISTS "Users can insert own coins" ON public.user_coins;
CREATE POLICY "Users can insert own coins"
    ON public.user_coins FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Service role은 모든 작업 가능 (백엔드에서 사용)
-- 주의: service_role 키는 RLS를 우회하므로 별도 정책 불필요
-- 하지만 명시적으로 정책을 추가하면 더 안전함

-- coin_transactions 테이블 RLS
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON public.coin_transactions;
CREATE POLICY "Users can view own transactions"
    ON public.coin_transactions FOR SELECT
    USING (auth.uid() = user_id);

-- analysis_cache 테이블 RLS (모두 읽기 가능)
ALTER TABLE public.analysis_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read analysis cache" ON public.analysis_cache;
CREATE POLICY "Anyone can read analysis cache"
    ON public.analysis_cache FOR SELECT
    TO authenticated
    USING (true);

-- ============================================================================
-- 9. 인덱스 생성 (성능 최적화)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_streak_history_user_id ON public.streak_history(user_id);
CREATE INDEX IF NOT EXISTS idx_wordbook_user_id ON public.wordbook(user_id);
CREATE INDEX IF NOT EXISTS idx_user_coins_user_id ON public.user_coins(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON public.coin_transactions(user_id);

-- user_coins 테이블 updated_at 자동 업데이트 트리거
DROP TRIGGER IF EXISTS update_user_coins_updated_at ON public.user_coins;
CREATE TRIGGER update_user_coins_updated_at
    BEFORE UPDATE ON public.user_coins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 10. 트리거 (자동 업데이트)
-- ============================================================================

-- profiles 테이블 updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 11. user_approvals 테이블 (승인 관리 시스템)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    approved_stories TEXT DEFAULT '0,1', -- 접근 가능한 목록 (예: "0,1")
    approved_at TIMESTAMP,
    approved_by TEXT, -- 승인자 이메일
    approval_token TEXT UNIQUE NOT NULL, -- 승인 링크용 토큰
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_approvals_user_id ON public.user_approvals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_approvals_token ON public.user_approvals(approval_token);
CREATE INDEX IF NOT EXISTS idx_user_approvals_status ON public.user_approvals(status);
CREATE INDEX IF NOT EXISTS idx_user_approvals_email ON public.user_approvals(email);

-- RLS 설정
ALTER TABLE public.user_approvals ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 승인 상태만 조회 가능
DROP POLICY IF EXISTS "Users can view own approval" ON public.user_approvals;
CREATE POLICY "Users can view own approval"
    ON public.user_approvals FOR SELECT
    USING (auth.uid() = user_id);

-- 슈퍼바이저는 모든 승인 요청 조회 및 수정 가능
DROP POLICY IF EXISTS "Supervisors can manage approvals" ON public.user_approvals;
CREATE POLICY "Supervisors can manage approvals"
    ON public.user_approvals
    USING (
        (SELECT email FROM public.profiles WHERE id = auth.uid()) = 'bunz5911@gmail.com'
    );

-- updated_at 자동 업데이트 트리거
DROP TRIGGER IF EXISTS update_user_approvals_updated_at ON public.user_approvals;
CREATE TRIGGER update_user_approvals_updated_at
    BEFORE UPDATE ON public.user_approvals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 12. 초기 데이터 (슈퍼바이저 계정은 수동 설정)
-- ============================================================================

-- bunz5911@gmail.com 계정을 슈퍼바이저로 설정하려면:
-- 1. 먼저 해당 이메일로 회원가입
-- 2. 아래 SQL 실행 (user_id는 auth.users 테이블에서 확인)
/*
UPDATE public.profiles 
SET role = 'supervisor',
    plan = 'premier',
    coins = 999999
WHERE email = 'bunz5911@gmail.com';
*/

-- ============================================================================
-- 완료!
-- ============================================================================
