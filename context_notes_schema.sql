-- ============================================================================
-- 맥락 파악 학습 시스템 스키마
-- ============================================================================

-- ============================================================================
-- 1. user_context_notes 테이블 (사용자가 기록한 맥락 파악 내용)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_context_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    story_id INT,  -- 어떤 동화 학습 중에 기록했는지 (선택사항)
    
    -- 맥락 파악 내용
    context_text TEXT NOT NULL,  -- 사용자가 입력한 맥락 파악 내용
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 2. RLS (Row Level Security) 정책
-- ============================================================================

-- user_context_notes RLS
ALTER TABLE public.user_context_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own context notes" ON public.user_context_notes;
CREATE POLICY "Users can view own context notes"
    ON public.user_context_notes FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own context notes" ON public.user_context_notes;
CREATE POLICY "Users can insert own context notes"
    ON public.user_context_notes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own context notes" ON public.user_context_notes;
CREATE POLICY "Users can update own context notes"
    ON public.user_context_notes FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own context notes" ON public.user_context_notes;
CREATE POLICY "Users can delete own context notes"
    ON public.user_context_notes FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- 3. 인덱스 (성능 최적화)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_user_context_notes_user_id ON public.user_context_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_context_notes_story_id ON public.user_context_notes(story_id);
CREATE INDEX IF NOT EXISTS idx_user_context_notes_created_at ON public.user_context_notes(created_at DESC);

-- ============================================================================
-- 4. 트리거 (자동 업데이트)
-- ============================================================================

-- updated_at 자동 업데이트 트리거
DROP TRIGGER IF EXISTS update_context_notes_updated_at ON public.user_context_notes;
CREATE TRIGGER update_context_notes_updated_at
    BEFORE UPDATE ON public.user_context_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 완료!
-- ============================================================================

