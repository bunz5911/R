-- ============================================================================
-- learning_records 테이블 스키마 수정
-- ============================================================================
-- 이 스크립트는 learning_records 테이블에 필요한 필드를 추가하거나 수정합니다.

-- 1. 필수 필드 추가 (없는 경우에만)
-- ============================================================================

-- id 필드 추가 (없는 경우)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'learning_records' AND column_name = 'id'
    ) THEN
        ALTER TABLE public.learning_records 
        ADD COLUMN id UUID PRIMARY KEY DEFAULT uuid_generate_v4();
    END IF;
END $$;

-- user_id 필드 추가 (없는 경우만 추가)
-- 타입 변환은 RLS 정책 삭제 후 별도로 처리
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'learning_records' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.learning_records 
        ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- story_id 필드 추가 (없는 경우)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'learning_records' AND column_name = 'story_id'
    ) THEN
        ALTER TABLE public.learning_records 
        ADD COLUMN story_id INT NOT NULL;
    END IF;
END $$;

-- story_title 필드 추가 (없는 경우)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'learning_records' AND column_name = 'story_title'
    ) THEN
        ALTER TABLE public.learning_records 
        ADD COLUMN story_title TEXT;
    END IF;
END $$;

-- level 필드 추가 (없는 경우)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'learning_records' AND column_name = 'level'
    ) THEN
        ALTER TABLE public.learning_records 
        ADD COLUMN level TEXT;
    END IF;
END $$;

-- quiz_score 필드 추가 (없는 경우)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'learning_records' AND column_name = 'quiz_score'
    ) THEN
        ALTER TABLE public.learning_records 
        ADD COLUMN quiz_score INT;
    END IF;
END $$;

-- pronunciation_score 필드 추가 (없는 경우)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'learning_records' AND column_name = 'pronunciation_score'
    ) THEN
        ALTER TABLE public.learning_records 
        ADD COLUMN pronunciation_score INT;
    END IF;
END $$;

-- paragraph_num 필드 추가 (없는 경우)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'learning_records' AND column_name = 'paragraph_num'
    ) THEN
        ALTER TABLE public.learning_records 
        ADD COLUMN paragraph_num INT;
    END IF;
END $$;

-- session_type 필드 추가 (없는 경우)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'learning_records' AND column_name = 'session_type'
    ) THEN
        ALTER TABLE public.learning_records 
        ADD COLUMN session_type TEXT DEFAULT 'reading';
    END IF;
END $$;

-- completed 필드 추가 (없는 경우)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'learning_records' AND column_name = 'completed'
    ) THEN
        ALTER TABLE public.learning_records 
        ADD COLUMN completed BOOLEAN DEFAULT false;
    END IF;
END $$;

-- created_at 필드 추가 (없는 경우)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'learning_records' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.learning_records 
        ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- updated_at 필드 추가 (없는 경우)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'learning_records' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.learning_records 
        ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- study_date 필드 추가 (없는 경우, 선택사항)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'learning_records' AND column_name = 'study_date'
    ) THEN
        ALTER TABLE public.learning_records 
        ADD COLUMN study_date TIMESTAMP;
    END IF;
END $$;

-- completed_tabs 필드 추가 (없는 경우, 선택사항)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'learning_records' AND column_name = 'completed_tabs'
    ) THEN
        ALTER TABLE public.learning_records 
        ADD COLUMN completed_tabs JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- ============================================================================
-- 2. 인덱스 생성 (성능 향상)
-- ============================================================================

-- user_id 인덱스
CREATE INDEX IF NOT EXISTS idx_learning_records_user_id 
ON public.learning_records(user_id);

-- story_id 인덱스
CREATE INDEX IF NOT EXISTS idx_learning_records_story_id 
ON public.learning_records(story_id);

-- created_at 인덱스 (최근 학습 목록 조회용)
CREATE INDEX IF NOT EXISTS idx_learning_records_created_at 
ON public.learning_records(created_at DESC);

-- user_id + story_id 복합 인덱스 (중복 체크용)
CREATE INDEX IF NOT EXISTS idx_learning_records_user_story 
ON public.learning_records(user_id, story_id);

-- ============================================================================
-- 3. user_id 컬럼 타입 변환 (TEXT -> UUID)
-- ============================================================================
-- RLS 정책이 있으면 컬럼 타입을 변경할 수 없으므로, 먼저 정책을 삭제해야 함

-- 기존 RLS 정책 삭제 (타입 변환 전에 필수)
DROP POLICY IF EXISTS "Users can view own learning records" ON public.learning_records;
DROP POLICY IF EXISTS "Users can insert own learning records" ON public.learning_records;
DROP POLICY IF EXISTS "Users can update own learning records" ON public.learning_records;
DROP POLICY IF EXISTS "Users can delete own learning records" ON public.learning_records;

-- user_id 컬럼이 TEXT 타입인 경우 UUID로 변환
DO $$ 
DECLARE
    invalid_count INTEGER;
    not_null_constraint_exists BOOLEAN;
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'learning_records' 
        AND column_name = 'user_id' 
        AND data_type = 'text'
    ) THEN
        -- NOT NULL 제약 조건 확인
        SELECT EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu 
            ON tc.constraint_name = ccu.constraint_name
            WHERE tc.table_name = 'learning_records'
            AND tc.constraint_type = 'CHECK'
            AND ccu.column_name = 'user_id'
            AND tc.constraint_name LIKE '%user_id%not_null%'
        ) INTO not_null_constraint_exists;
        
        -- NOT NULL 제약 조건이 있는지 확인 (is_nullable = 'NO')
        SELECT NOT is_nullable INTO not_null_constraint_exists
        FROM information_schema.columns
        WHERE table_name = 'learning_records' 
        AND column_name = 'user_id';
        
        -- 유효하지 않은 UUID 값 확인
        SELECT COUNT(*) INTO invalid_count
        FROM public.learning_records
        WHERE user_id IS NOT NULL 
        AND user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        
        IF invalid_count > 0 THEN
            RAISE NOTICE '유효하지 않은 UUID 값 %개 발견.', invalid_count;
            
            -- NOT NULL 제약 조건이 있으면 먼저 제거
            IF not_null_constraint_exists THEN
                RAISE NOTICE 'NOT NULL 제약 조건을 임시로 제거합니다.';
                ALTER TABLE public.learning_records
                ALTER COLUMN user_id DROP NOT NULL;
            END IF;
            
            -- 유효하지 않은 UUID 값을 NULL로 설정
            UPDATE public.learning_records
            SET user_id = NULL
            WHERE user_id IS NOT NULL 
            AND user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
            
            RAISE NOTICE '유효하지 않은 UUID 값을 NULL로 설정했습니다.';
        END IF;
        
        -- 기존 외래키 제약 조건 제거 (있는 경우)
        ALTER TABLE public.learning_records
        DROP CONSTRAINT IF EXISTS fk_learning_records_user_id;
        
        -- TEXT를 UUID로 변환 (유효한 UUID만 변환, NULL은 그대로 유지)
        ALTER TABLE public.learning_records
        ALTER COLUMN user_id TYPE UUID 
        USING CASE 
            WHEN user_id IS NULL THEN NULL
            WHEN user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
            THEN user_id::UUID
            ELSE NULL
        END;
        
        -- 외래키 제약 조건 추가 (NULL 값 허용)
        ALTER TABLE public.learning_records
        ADD CONSTRAINT fk_learning_records_user_id 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        
        -- NOT NULL 제약 조건이 있었고, 유효하지 않은 값이 없었다면 다시 추가
        -- 하지만 NULL 값이 있을 수 있으므로 추가하지 않음
        -- 필요시 수동으로 추가: ALTER TABLE public.learning_records ALTER COLUMN user_id SET NOT NULL;
    END IF;
END $$;

-- ============================================================================
-- 4. RLS (Row Level Security) 정책 설정
-- ============================================================================

-- RLS 활성화
ALTER TABLE public.learning_records ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 학습 기록만 볼 수 있음
CREATE POLICY "Users can view own learning records"
ON public.learning_records
FOR SELECT
USING (auth.uid() = user_id);

-- 사용자는 자신의 학습 기록만 삽입할 수 있음
CREATE POLICY "Users can insert own learning records"
ON public.learning_records
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 학습 기록만 수정할 수 있음
CREATE POLICY "Users can update own learning records"
ON public.learning_records
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 학습 기록만 삭제할 수 있음
CREATE POLICY "Users can delete own learning records"
ON public.learning_records
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- 5. updated_at 자동 업데이트 트리거 (선택사항)
-- ============================================================================

-- 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_learning_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_learning_records_updated_at ON public.learning_records;
CREATE TRIGGER trigger_update_learning_records_updated_at
BEFORE UPDATE ON public.learning_records
FOR EACH ROW
EXECUTE FUNCTION update_learning_records_updated_at();

-- ============================================================================
-- 완료 메시지
-- ============================================================================
DO $$ 
BEGIN
    RAISE NOTICE 'learning_records 테이블 스키마 수정 완료!';
END $$;

