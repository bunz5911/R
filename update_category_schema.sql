-- ============================================================================
-- 커뮤니티 게시판 카테고리 스키마 업데이트
-- study, grammar, culture, meet-up, k-content 게시판 설정
-- ============================================================================

-- 1. 기존 제약조건 삭제 (먼저 제약조건을 삭제해야 데이터 수정 가능)
ALTER TABLE public.community_posts 
DROP CONSTRAINT IF EXISTS valid_category;

-- 2. 현재 데이터 확인 (마이그레이션 전 상태 확인)
SELECT category, COUNT(*) as count
FROM public.community_posts
GROUP BY category
ORDER BY count DESC;

-- 3. 기존 데이터 마이그레이션 (제약조건 삭제 후 데이터 수정)
-- 'sentences'를 'study'로 변경
UPDATE public.community_posts 
SET category = 'study' 
WHERE category = 'sentences';

-- 'speaking'을 'meet-up'으로 변경
UPDATE public.community_posts 
SET category = 'meet-up' 
WHERE category = 'speaking';

-- 'kcontent'를 'k-content'로 변경
UPDATE public.community_posts 
SET category = 'k-content' 
WHERE category = 'kcontent';

-- 'tips'를 'study'로 변경
UPDATE public.community_posts 
SET category = 'study' 
WHERE category = 'tips';

-- 4. 마이그레이션 후 데이터 확인
SELECT category, COUNT(*) as count
FROM public.community_posts
GROUP BY category
ORDER BY count DESC;

-- 5. 새로운 제약조건 추가 (데이터 마이그레이션 완료 후)
ALTER TABLE public.community_posts 
ADD CONSTRAINT valid_category CHECK (
    category IN (
        'study',
        'grammar', 
        'culture', 
        'meet-up',
        'k-content'
    )
);

-- 6. 최종 확인
SELECT category, COUNT(*) as count
FROM public.community_posts
GROUP BY category
ORDER BY count DESC;

