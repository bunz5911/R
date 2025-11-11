-- ============================================================================
-- bunz5911@gmail.com 관리자 계정 설정
-- ============================================================================
-- 이 SQL을 Supabase SQL Editor에서 실행하세요
-- 
-- 사전 조건: bunz5911@gmail.com으로 회원가입 완료
-- ============================================================================

-- 1. 관리자 권한 및 특별 혜택 설정
UPDATE public.profiles 
SET 
    role = 'supervisor',           -- 관리자 권한
    plan = 'free',                 -- 평생 무료 (Free 플랜)
    coins = 1000000,               -- 100만 코인
    total_coins_earned = 1000000,
    level = 99,                    -- 최고 레벨
    current_streak = 365,          -- 365일 연속 출석
    longest_streak = 365
WHERE email = 'bunz5911@gmail.com';

-- 2. user_coins 테이블 업데이트
UPDATE public.user_coins
SET total_coins = 1000000
WHERE user_id = (SELECT id FROM profiles WHERE email = 'bunz5911@gmail.com');

-- user_coins가 없으면 생성
INSERT INTO public.user_coins (user_id, total_coins)
SELECT id, 1000000 
FROM profiles 
WHERE email = 'bunz5911@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM user_coins WHERE user_id = (SELECT id FROM profiles WHERE email = 'bunz5911@gmail.com')
  );

-- 3. 확인
SELECT 
    email,
    display_name,
    role,
    plan,
    coins,
    level,
    current_streak
FROM public.profiles
WHERE email = 'bunz5911@gmail.com';

-- ============================================================================
-- 실행 결과 예상:
-- ============================================================================
-- email: bunz5911@gmail.com
-- display_name: (가입 시 입력한 닉네임)
-- role: supervisor
-- plan: free
-- coins: 1000000
-- level: 99
-- current_streak: 365
-- ============================================================================

-- ⚠️ 주의사항:
-- 1. bunz5911@gmail.com으로 먼저 회원가입하세요
-- 2. 이 SQL은 한 번만 실행하세요
-- 3. 실행 후 로그아웃 → 재로그인
-- 4. 헤더에 "🛠️ 관리" 버튼이 나타납니다
-- 5. 모든 동화(1-50번)가 잠금 해제됩니다
-- ============================================================================

