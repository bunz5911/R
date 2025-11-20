-- ============================================================================
-- 커뮤니티 게시판 Supabase 스키마
-- ============================================================================

-- ============================================================================
-- 1. community_posts 테이블 (게시글)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.community_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- 'grammar', 'culture', 'tips', 'kcontent', 'sentences', 'speaking'
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- 인덱스
    CONSTRAINT valid_category CHECK (category IN ('grammar', 'culture', 'tips', 'kcontent', 'sentences', 'speaking'))
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_community_posts_category ON public.community_posts(category);
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at DESC);

-- ============================================================================
-- 2. community_comments 테이블 (댓글)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.community_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON public.community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_user_id ON public.community_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_created_at ON public.community_comments(created_at DESC);

-- ============================================================================
-- 3. community_likes 테이블 (좋아요)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.community_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(post_id, user_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_community_likes_post_id ON public.community_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_community_likes_user_id ON public.community_likes(user_id);

-- ============================================================================
-- 4. RLS (Row Level Security) 정책 설정
-- ============================================================================

-- community_posts 테이블 RLS
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- 모든 사용자는 게시글 조회 가능
DROP POLICY IF EXISTS "Anyone can view posts" ON public.community_posts;
CREATE POLICY "Anyone can view posts"
    ON public.community_posts FOR SELECT
    USING (true);

-- 인증된 사용자만 게시글 작성 가능
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.community_posts;
CREATE POLICY "Authenticated users can create posts"
    ON public.community_posts FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- 작성자만 자신의 게시글 수정/삭제 가능
DROP POLICY IF EXISTS "Users can update own posts" ON public.community_posts;
CREATE POLICY "Users can update own posts"
    ON public.community_posts FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own posts" ON public.community_posts;
CREATE POLICY "Users can delete own posts"
    ON public.community_posts FOR DELETE
    USING (auth.uid() = user_id);

-- community_comments 테이블 RLS
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

-- 모든 사용자는 댓글 조회 가능
DROP POLICY IF EXISTS "Anyone can view comments" ON public.community_comments;
CREATE POLICY "Anyone can view comments"
    ON public.community_comments FOR SELECT
    USING (true);

-- 인증된 사용자만 댓글 작성 가능
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.community_comments;
CREATE POLICY "Authenticated users can create comments"
    ON public.community_comments FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- 작성자만 자신의 댓글 수정/삭제 가능
DROP POLICY IF EXISTS "Users can update own comments" ON public.community_comments;
CREATE POLICY "Users can update own comments"
    ON public.community_comments FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON public.community_comments;
CREATE POLICY "Users can delete own comments"
    ON public.community_comments FOR DELETE
    USING (auth.uid() = user_id);

-- community_likes 테이블 RLS
ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;

-- 모든 사용자는 좋아요 조회 가능
DROP POLICY IF EXISTS "Anyone can view likes" ON public.community_likes;
CREATE POLICY "Anyone can view likes"
    ON public.community_likes FOR SELECT
    USING (true);

-- 인증된 사용자만 좋아요 추가/삭제 가능
DROP POLICY IF EXISTS "Authenticated users can manage likes" ON public.community_likes;
CREATE POLICY "Authenticated users can manage likes"
    ON public.community_likes
    USING (auth.uid() = user_id);

-- ============================================================================
-- 5. 트리거 함수 (댓글 수, 좋아요 수 자동 업데이트)
-- ============================================================================

-- 댓글 수 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.community_posts
        SET comments_count = comments_count + 1
        WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.community_posts
        SET comments_count = comments_count - 1
        WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 좋아요 수 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.community_posts
        SET likes_count = likes_count + 1
        WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.community_posts
        SET likes_count = likes_count - 1
        WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_comments_count ON public.community_comments;
CREATE TRIGGER trigger_update_comments_count
    AFTER INSERT OR DELETE ON public.community_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_post_comments_count();

DROP TRIGGER IF EXISTS trigger_update_likes_count ON public.community_likes;
CREATE TRIGGER trigger_update_likes_count
    AFTER INSERT OR DELETE ON public.community_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_post_likes_count();

-- updated_at 자동 업데이트 트리거
DROP TRIGGER IF EXISTS update_community_posts_updated_at ON public.community_posts;
CREATE TRIGGER update_community_posts_updated_at
    BEFORE UPDATE ON public.community_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_comments_updated_at ON public.community_comments;
CREATE TRIGGER update_community_comments_updated_at
    BEFORE UPDATE ON public.community_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 완료!
-- ============================================================================

