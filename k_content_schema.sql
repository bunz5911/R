-- ============================================================================
-- K-콘텐츠 학습 시스템 스키마
-- ============================================================================

-- ============================================================================
-- 1. user_k_content 테이블 (사용자가 추가한 K-콘텐츠)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_k_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    story_id INT,  -- 어떤 동화 학습 중에 추가했는지
    
    -- 콘텐츠 정보
    content_text TEXT NOT NULL,  -- 원문 (한국어)
    content_type TEXT,  -- 'drama', 'kpop', 'variety', 'movie', 'other'
    source_title TEXT,  -- 예: "도깨비", "Spring Day"
    source_artist TEXT,  -- 예: "BTS", "공유", "tvN"
    
    -- AI 분석 결과 (JSONB)
    grammar_analysis JSONB,  -- 문법 패턴 분석
    vocabulary_analysis JSONB,  -- 어휘 난이도 분석
    difficulty_level TEXT,  -- 'beginner', 'intermediate', 'advanced'
    similar_stories JSONB,  -- 유사한 동화 추천
    
    -- 학습 기록
    pronunciation_score INT,  -- 발음 점수 (0-100)
    practice_count INT DEFAULT 0,  -- 연습 횟수
    last_practiced TIMESTAMP,  -- 마지막 연습 시간
    
    -- 태그 & 즐겨찾기
    tags TEXT[],  -- 예: ['사랑', '이별', '우정']
    is_favorite BOOLEAN DEFAULT false,
    
    -- 공유 & 인기도
    is_public BOOLEAN DEFAULT false,  -- 공개 여부
    likes_count INT DEFAULT 0,
    bookmarks_count INT DEFAULT 0,
    views_count INT DEFAULT 0,
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 2. k_content_likes 테이블 (좋아요)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.k_content_likes (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content_id UUID REFERENCES public.user_k_content(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    
    PRIMARY KEY (user_id, content_id)
);

-- ============================================================================
-- 3. k_content_bookmarks 테이블 (북마크)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.k_content_bookmarks (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content_id UUID REFERENCES public.user_k_content(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    
    PRIMARY KEY (user_id, content_id)
);

-- ============================================================================
-- 4. daily_missions 테이블 (일일 미션)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.daily_missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    mission_date DATE NOT NULL,
    
    -- 미션 완료 여부
    check_in_completed BOOLEAN DEFAULT false,
    story_read_completed BOOLEAN DEFAULT false,
    k_content_added BOOLEAN DEFAULT false,
    dubbing_completed BOOLEAN DEFAULT false,
    
    -- 획득 코인
    total_coins_earned INT DEFAULT 0,
    
    -- 연속 출석
    current_streak INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, mission_date)
);

-- ============================================================================
-- 5. RLS (Row Level Security) 정책
-- ============================================================================

-- user_k_content RLS
ALTER TABLE public.user_k_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own k-content" ON public.user_k_content;
CREATE POLICY "Users can view own k-content"
    ON public.user_k_content FOR SELECT
    USING (auth.uid() = user_id OR is_public = true);

DROP POLICY IF EXISTS "Users can insert own k-content" ON public.user_k_content;
CREATE POLICY "Users can insert own k-content"
    ON public.user_k_content FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own k-content" ON public.user_k_content;
CREATE POLICY "Users can update own k-content"
    ON public.user_k_content FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own k-content" ON public.user_k_content;
CREATE POLICY "Users can delete own k-content"
    ON public.user_k_content FOR DELETE
    USING (auth.uid() = user_id);

-- k_content_likes RLS
ALTER TABLE public.k_content_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own likes" ON public.k_content_likes;
CREATE POLICY "Users can manage own likes"
    ON public.k_content_likes
    USING (auth.uid() = user_id);

-- k_content_bookmarks RLS
ALTER TABLE public.k_content_bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own bookmarks" ON public.k_content_bookmarks;
CREATE POLICY "Users can manage own bookmarks"
    ON public.k_content_bookmarks
    USING (auth.uid() = user_id);

-- daily_missions RLS
ALTER TABLE public.daily_missions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own missions" ON public.daily_missions;
CREATE POLICY "Users can view own missions"
    ON public.daily_missions
    USING (auth.uid() = user_id);

-- ============================================================================
-- 6. 인덱스 (성능 최적화)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_user_k_content_user_id ON public.user_k_content(user_id);
CREATE INDEX IF NOT EXISTS idx_user_k_content_is_public ON public.user_k_content(is_public);
CREATE INDEX IF NOT EXISTS idx_user_k_content_likes ON public.user_k_content(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_daily_missions_user_date ON public.daily_missions(user_id, mission_date);

-- ============================================================================
-- 7. 트리거 (자동 업데이트)
-- ============================================================================

-- updated_at 자동 업데이트
DROP TRIGGER IF EXISTS update_k_content_updated_at ON public.user_k_content;
CREATE TRIGGER update_k_content_updated_at
    BEFORE UPDATE ON public.user_k_content
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 완료!
-- ============================================================================

