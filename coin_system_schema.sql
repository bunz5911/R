-- ============================================================================
-- 코인 차감 시스템 구현을 위한 Supabase SQL 스크립트
-- ============================================================================
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요
-- 실행 순서: 위에서 아래로 순차 실행

-- ============================================================================
-- 1. learning_records 테이블에 completed 컬럼 추가 (없는 경우)
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'learning_records' 
        AND column_name = 'completed'
    ) THEN
        ALTER TABLE public.learning_records 
        ADD COLUMN completed BOOLEAN DEFAULT false;
        
        RAISE NOTICE '✅ learning_records.completed 컬럼 추가 완료';
    ELSE
        RAISE NOTICE 'ℹ️ learning_records.completed 컬럼이 이미 존재합니다';
    END IF;
END $$;

-- ============================================================================
-- 2. coin_transactions 테이블에 story_id 컬럼 추가 (없는 경우)
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'coin_transactions' 
        AND column_name = 'story_id'
    ) THEN
        ALTER TABLE public.coin_transactions 
        ADD COLUMN story_id INT;
        
        RAISE NOTICE '✅ coin_transactions.story_id 컬럼 추가 완료';
    ELSE
        RAISE NOTICE 'ℹ️ coin_transactions.story_id 컬럼이 이미 존재합니다';
    END IF;
END $$;

-- ============================================================================
-- 3. coin_transactions 테이블 인덱스 추가 (중복 방지 쿼리 성능 향상)
-- ============================================================================

-- user_id, type, description, created_at 복합 인덱스 (중복 방지 쿼리용)
CREATE INDEX IF NOT EXISTS idx_coin_transactions_duplicate_check 
ON public.coin_transactions(user_id, type, description, created_at);

-- user_id, created_at 인덱스 (일일 미션 완료 확인용)
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_date 
ON public.coin_transactions(user_id, created_at DESC);

-- type 인덱스 (타입별 조회용)
CREATE INDEX IF NOT EXISTS idx_coin_transactions_type 
ON public.coin_transactions(type);

-- ============================================================================
-- 4. add_user_coins RPC 함수 생성/수정
-- ============================================================================
CREATE OR REPLACE FUNCTION public.add_user_coins(
    p_user_id UUID,
    p_amount INT,
    p_type TEXT,
    p_description TEXT DEFAULT NULL,
    p_story_id INT DEFAULT NULL,
    p_paragraph_num INT DEFAULT NULL
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_coins INT;
    v_new_coins INT;
BEGIN
    -- 현재 코인 조회
    SELECT COALESCE(total_coins, 0) INTO v_current_coins
    FROM public.user_coins
    WHERE user_id = p_user_id;
    
    -- 코인 데이터가 없으면 생성 (초기 10코인)
    IF v_current_coins IS NULL THEN
        INSERT INTO public.user_coins (user_id, total_coins)
        VALUES (p_user_id, 10)
        ON CONFLICT (user_id) DO NOTHING;
        
        SELECT COALESCE(total_coins, 10) INTO v_current_coins
        FROM public.user_coins
        WHERE user_id = p_user_id;
    END IF;
    
    -- 새 코인 계산 (음수 방지)
    v_new_coins := GREATEST(0, v_current_coins + p_amount);
    
    -- 코인 업데이트
    UPDATE public.user_coins
    SET total_coins = v_new_coins,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- 거래 내역 저장
    INSERT INTO public.coin_transactions (
        user_id,
        amount,
        type,
        description,
        story_id,
        paragraph_num,
        balance_after
    ) VALUES (
        p_user_id,
        p_amount,
        p_type,
        p_description,
        p_story_id,
        p_paragraph_num,
        v_new_coins
    );
    
    -- 새 코인 수 반환
    RETURN v_new_coins;
END;
$$;

-- 함수 권한 설정
GRANT EXECUTE ON FUNCTION public.add_user_coins(UUID, INT, TEXT, TEXT, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_user_coins(UUID, INT, TEXT, TEXT, INT, INT) TO service_role;

-- ============================================================================
-- 5. user_coins 테이블 기본값 변경 (신규 회원 10코인)
-- ============================================================================
ALTER TABLE public.user_coins 
ALTER COLUMN total_coins SET DEFAULT 10;

-- ============================================================================
-- 6. 기존 회원 코인 조정 (30코인 이상인 경우 유지, 30코인 미만인 경우 10코인으로 조정)
-- ============================================================================
-- 주의: 이 부분은 선택사항입니다. 기존 회원의 코인을 유지하려면 이 섹션을 주석 처리하세요.
-- UPDATE public.user_coins
-- SET total_coins = 10
-- WHERE total_coins < 10;

-- ============================================================================
-- 완료 메시지
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ 코인 차감 시스템 스키마 설정 완료!';
    RAISE NOTICE '   - learning_records.completed 컬럼 확인 완료';
    RAISE NOTICE '   - coin_transactions.story_id 컬럼 확인 완료';
    RAISE NOTICE '   - coin_transactions 인덱스 생성 완료';
    RAISE NOTICE '   - add_user_coins 함수 생성 완료';
    RAISE NOTICE '   - user_coins 기본값 변경 완료 (10코인)';
END $$;

