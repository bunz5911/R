-- ============================================================================
-- meet-up 카테고리 문제 해결을 위한 SQL 스크립트
-- ============================================================================

-- 1. 현재 제약조건 확인
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.community_posts'::regclass
AND conname = 'valid_category';

-- 2. 기존 제약조건 삭제
ALTER TABLE public.community_posts 
DROP CONSTRAINT IF EXISTS valid_category;

-- 3. 새로운 제약조건 추가 (기존 카테고리 유지)
ALTER TABLE public.community_posts 
ADD CONSTRAINT valid_category CHECK (
    category IN (
        'grammar', 
        'culture', 
        'tips', 
        'kcontent', 
        'sentences', 
        'speaking'
    )
);

-- 4. 현재 community_posts 테이블의 카테고리 분포 확인
SELECT category, COUNT(*) as count
FROM public.community_posts
GROUP BY category
ORDER BY count DESC;

