-- ============================================================================
-- 커뮤니티 게시판 카테고리 제약조건 업데이트
-- 'study'와 'meet-up' 카테고리 추가
-- ============================================================================

-- 기존 제약조건 삭제
ALTER TABLE public.community_posts 
DROP CONSTRAINT IF EXISTS valid_category;

-- 새로운 제약조건 추가 ('study'와 'meet-up' 포함)
ALTER TABLE public.community_posts 
ADD CONSTRAINT valid_category CHECK (
    category IN (
        'grammar', 
        'culture', 
        'tips', 
        'kcontent', 
        'sentences', 
        'speaking',
        'study',
        'meet-up'
    )
);

-- 기존 데이터 업데이트 (선택사항)
-- 'sentences'를 'study'로, 'speaking'을 'meet-up'으로 변경하려면 아래 주석을 해제하세요
-- UPDATE public.community_posts SET category = 'study' WHERE category = 'sentences';
-- UPDATE public.community_posts SET category = 'meet-up' WHERE category = 'speaking';

