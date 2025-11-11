// ============================================================================
// RAKorean 프론트엔드 설정 예제
// ============================================================================
// 이 파일을 config.js로 복사하고 실제 값을 입력하세요

// Supabase 설정 (소셜 로그인용)
const CONFIG = {
    // Supabase 프로젝트 URL (예: https://xxxxx.supabase.co)
    SUPABASE_URL: 'YOUR_SUPABASE_URL',
    
    // Supabase Anon Key (공개 키, RLS로 보호됨)
    SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY'
};

// ============================================================================
// 설정 방법:
// ============================================================================
// 1. Supabase Dashboard → Settings → API
// 2. Project URL 복사 → SUPABASE_URL에 붙여넣기
// 3. Project API keys → anon/public 복사 → SUPABASE_ANON_KEY에 붙여넣기
// 4. Authentication → Providers → Google 활성화
//    - Google Cloud Console에서 OAuth 2.0 클라이언트 ID 생성
//    - Authorized redirect URIs에 Supabase 콜백 URL 추가
//    - Client ID와 Secret을 Supabase에 입력
// ============================================================================

