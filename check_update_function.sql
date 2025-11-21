-- ============================================================================
-- updated_at 자동 업데이트 함수 확인 및 생성
-- ============================================================================

-- 1. 함수가 이미 있는지 확인
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'update_updated_at_column';

-- 2. 함수가 없으면 생성 (함수가 없을 경우에만 실행)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. 트리거 확인
SELECT 
    tgname AS trigger_name,
    tgrelid::regclass AS table_name,
    proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'public.community_posts'::regclass
AND tgname = 'update_community_posts_updated_at';

