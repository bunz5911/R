# OAuth 리다이렉트 URL 설정 가이드

## 🔍 현재 동작 방식

### 로컬 환경 (localhost)
- 리다이렉트 URL: `http://localhost:8080/login.html`
- 사용자: 개발자

### 프로덕션 환경 (Cloudflare Pages)
- 리다이렉트 URL: `https://rakorean.site/login.html` (자동 감지)
- 사용자: 일반 유저

## ✅ 일반 유저가 사용할 때

일반 유저가 Cloudflare Pages에서 접속하면:
1. 브라우저 주소창: `https://rakorean.site/login.html`
2. `window.location.hostname` = `rakorean.site` (localhost가 아님)
3. `window.location.origin` = `https://rakorean.site`
4. 리다이렉트 URL = `https://rakorean.site/login.html` ✅

**결론: 일반 유저는 프로덕션 URL로 올바르게 리다이렉트됩니다.**

## ⚙️ Supabase Dashboard 설정 확인

### 필수 리다이렉트 URL 목록

Supabase Dashboard → Authentication → URL Configuration에서 다음 URL들이 등록되어 있어야 합니다:

**로컬 개발용:**
```
http://localhost:8080/login.html
http://localhost:8080/signup.html
```

**프로덕션용 (Cloudflare Pages):**
```
https://rakorean.site/login.html
https://rakorean.site/signup.html
```

## 🔧 Google Cloud Console 설정 확인

Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 클라이언트 ID에서:

**Authorized redirect URIs에 다음이 있어야 함:**
```
https://vofhdnrsrwwgwoxtqwba.supabase.co/auth/v1/callback
```

이것은 Supabase의 콜백 URL이므로, Supabase가 Google 인증을 처리한 후 우리 앱으로 리다이렉트합니다.

## 🐛 문제 해결

### 문제: 로그인 후 이상한 URL로 리다이렉트됨

**원인:**
- Supabase Dashboard에 리다이렉트 URL이 등록되지 않음
- 또는 잘못된 포트/도메인으로 등록됨

**해결:**
1. Supabase Dashboard 접속
2. Authentication → URL Configuration
3. Redirect URLs에 올바른 URL 추가
4. 저장

### 문제: 로컬에서는 되는데 프로덕션에서 안됨

**원인:**
- Supabase Dashboard에 프로덕션 URL이 등록되지 않음

**해결:**
- 위의 "필수 리다이렉트 URL 목록" 참고하여 프로덕션 URL 추가

## 📝 코드 동작 원리

```javascript
// 환경 감지
const isLocal = window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1';

// 리다이렉트 URL 결정
const redirectUrl = isLocal
    ? 'http://localhost:8080/login.html'  // 로컬
    : window.location.origin + '/login.html';  // 프로덕션 (자동 감지)
```

**장점:**
- 로컬과 프로덕션 환경을 자동으로 감지
- 프로덕션 도메인이 변경되어도 자동으로 적용
- 별도의 환경 변수 설정 불필요

## ✅ 확인 체크리스트

- [ ] Supabase Dashboard에 로컬 URL 등록됨
- [ ] Supabase Dashboard에 프로덕션 URL 등록됨
- [ ] Google Cloud Console에 Supabase 콜백 URL 등록됨
- [ ] 로컬에서 로그인 테스트 성공
- [ ] 프로덕션에서 로그인 테스트 성공

