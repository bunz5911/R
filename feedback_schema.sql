-- ============================================================================
-- 사용자 피드백 테이블 생성 SQL
-- ============================================================================
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요

-- ============================================================================
-- 1. user_feedback 테이블 생성
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    user_name TEXT,
    feedback TEXT NOT NULL,
    page_url TEXT,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 2. 인덱스 생성 (성능 최적화)
-- ============================================================================

-- user_id 인덱스 (사용자별 피드백 조회용)
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id 
ON public.user_feedback(user_id);

-- created_at 인덱스 (최신순 정렬용)
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at 
ON public.user_feedback(created_at DESC);

-- ============================================================================
-- 3. RLS (Row Level Security) 정책 설정
-- ============================================================================

-- RLS 활성화
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Users can view own feedback" ON public.user_feedback;
DROP POLICY IF EXISTS "Users can insert own feedback" ON public.user_feedback;
DROP POLICY IF EXISTS "Service role can manage all feedback" ON public.user_feedback;

-- 사용자는 자신의 피드백 조회 가능
CREATE POLICY "Users can view own feedback"
    ON public.user_feedback FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

-- 누구나 피드백 작성 가능 (비회원도 가능)
CREATE POLICY "Anyone can insert feedback"
    ON public.user_feedback FOR INSERT
    WITH CHECK (true);

-- 서비스 역할은 모든 피드백 관리 가능 (백엔드에서 사용)
-- 이 정책은 service_role로 실행되는 경우에만 적용됨

-- ============================================================================
-- 4. updated_at 자동 업데이트 트리거
-- ============================================================================

-- 트리거 함수가 없으면 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
DROP TRIGGER IF EXISTS update_user_feedback_updated_at ON public.user_feedback;
CREATE TRIGGER update_user_feedback_updated_at
    BEFORE UPDATE ON public.user_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 완료 메시지
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ 사용자 피드백 테이블 생성 완료!';
    RAISE NOTICE '   - user_feedback 테이블 생성 완료';
    RAISE NOTICE '   - 인덱스 생성 완료';
    RAISE NOTICE '   - RLS 정책 설정 완료';
    RAISE NOTICE '   - updated_at 트리거 생성 완료';
END $$;

