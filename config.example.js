// ============================================================================
// RAKorean 프론트엔드 설정 예제
// ============================================================================
// 이 파일을 config.js로 복사하고 실제 값을 입력하세요

// Supabase 설정 (Google 소셜 로그인용)
const CONFIG = {
    // Supabase 프로젝트 URL (예: https://xxxxx.supabase.co)
    SUPABASE_URL: 'YOUR_SUPABASE_URL',
    
    // Supabase Anon Key (공개 키, RLS로 보호됨)
    SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',
    
    // 카카오 로그인 설정
    // Kakao Developers (https://developers.kakao.com/) → 내 애플리케이션 → 앱 키
    KAKAO_JS_KEY: 'YOUR_KAKAO_JAVASCRIPT_KEY'
};

// ============================================================================
// 설정 방법:
// ============================================================================
// 1. Supabase Dashboard → Settings → API
//    - Project URL 복사 → SUPABASE_URL에 붙여넣기
//    - Project API keys → anon/public 복사 → SUPABASE_ANON_KEY에 붙여넣기
//
// 2. Google 로그인 설정 (상세: GOOGLE_OAUTH_SETUP.md)
//    - Google Cloud Console에서 OAuth 2.0 클라이언트 ID 생성
//    - Supabase → Authentication → Providers → Google 활성화
//
// 3. 카카오 로그인 설정 (상세: KAKAO_SETUP.md)
//    - Kakao Developers에서 애플리케이션 등록
//    - JavaScript 키 복사 → KAKAO_JS_KEY에 붙여넣기
//    - 플랫폼 도메인 등록: http://localhost:8080
//    - Redirect URI 등록: /login.html, /signup.html
// ============================================================================

