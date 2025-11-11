-- ============================================================================
-- 출석 체크 & 일일 미션 문제 해결
-- ============================================================================
-- Supabase SQL Editor에서 실행하세요
-- ============================================================================

-- 1. 외래키 제약 제거 (출석, 미션, 코인)
ALTER TABLE public.streak_history 
DROP CONSTRAINT IF EXISTS streak_history_user_id_fkey;

ALTER TABLE public.daily_missions 
DROP CONSTRAINT IF EXISTS daily_missions_user_id_fkey;

ALTER TABLE public.user_coins 
DROP CONSTRAINT IF EXISTS user_coins_user_id_fkey;

-- 2. daily_missions 테이블에 coins_reward 컬럼 추가
ALTER TABLE public.daily_missions 
ADD COLUMN IF NOT EXISTS coins_reward INT DEFAULT 5;

-- 3. 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'daily_missions' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================================================
-- 완료!
-- ============================================================================

