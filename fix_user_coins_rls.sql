-- ============================================================================
-- user_coins 테이블 RLS 정책 수정
-- ============================================================================
-- 이 스크립트는 기존 Supabase 데이터베이스에 user_coins 테이블이 있는 경우
-- RLS 정책을 추가/수정하기 위해 사용합니다.

-- 1. user_coins 테이블이 없으면 생성
CREATE TABLE IF NOT EXISTS public.user_coins (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    total_coins INT NOT NULL DEFAULT 50,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. RLS 활성화
ALTER TABLE public.user_coins ENABLE ROW LEVEL SECURITY;

-- 3. 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Users can view own coins" ON public.user_coins;
DROP POLICY IF EXISTS "Users can update own coins" ON public.user_coins;
DROP POLICY IF EXISTS "Users can insert own coins" ON public.user_coins;
DROP POLICY IF EXISTS "Service role bypass RLS" ON public.user_coins;

-- 4. 새로운 정책 생성
-- 사용자는 자신의 코인 조회 가능
CREATE POLICY "Users can view own coins"
    ON public.user_coins FOR SELECT
    USING (auth.uid() = user_id);

-- 사용자는 자신의 코인 업데이트 가능
CREATE POLICY "Users can update own coins"
    ON public.user_coins FOR UPDATE
    USING (auth.uid() = user_id);

-- 사용자는 자신의 코인 데이터 삽입 가능
CREATE POLICY "Users can insert own coins"
    ON public.user_coins FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 5. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_user_coins_user_id ON public.user_coins(user_id);

-- 6. updated_at 자동 업데이트 트리거 함수가 없으면 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. 트리거 생성
DROP TRIGGER IF EXISTS update_user_coins_updated_at ON public.user_coins;
CREATE TRIGGER update_user_coins_updated_at
    BEFORE UPDATE ON public.user_coins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 완료!
-- ============================================================================
-- 참고: service_role 키를 사용하는 백엔드는 RLS를 우회하므로
-- 위 정책들은 프론트엔드에서 직접 Supabase를 사용할 때만 적용됩니다.
-- 백엔드(Flask)는 service_role 키를 사용하므로 RLS 제약 없이 모든 작업이 가능합니다.

