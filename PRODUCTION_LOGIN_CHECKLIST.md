# 프로덕션 로그인 확인 체크리스트

## ✅ 코드 확인 (완료됨)

- [x] 환경 자동 감지 코드 구현됨
- [x] 로컬: `localhost:8080` 사용
- [x] 프로덕션: `window.location.origin` 자동 감지
- [x] 리다이렉트 URL 자동 설정

## ⚙️ Supabase Dashboard 설정 (필수 확인)

### 1. Supabase Dashboard 접속
```
https://supabase.com/dashboard
→ 프로젝트 선택
```

### 2. Authentication → URL Configuration
```
Settings → Authentication → URL Configuration
```

### 3. Redirect URLs 확인 및 추가

**다음 URL들이 모두 등록되어 있어야 합니다:**

```
http://localhost:8080/login.html
http://localhost:8080/signup.html
https://marvelous-cat-d90804.netlify.app/login.html
https://marvelous-cat-d90804.netlify.app/signup.html
```

**추가 방법:**
1. "Redirect URLs" 섹션에서 "+ Add URL" 클릭
2. 위 URL들을 하나씩 추가
3. "Save" 클릭

## 🔧 Google Cloud Console 설정 (필수 확인)

### 1. Google Cloud Console 접속
```
https://console.cloud.google.com/
→ 프로젝트 선택
```

### 2. APIs & Services → Credentials
```
APIs & Services → Credentials
→ OAuth 2.0 클라이언트 ID 선택
```

### 3. Authorized redirect URIs 확인

**다음 URL이 등록되어 있어야 합니다:**
```
https://vofhdnrsrwwgwoxtqwba.supabase.co/auth/v1/callback
```

이것은 Supabase의 콜백 URL입니다. Supabase가 Google 인증을 처리한 후 우리 앱으로 리다이렉트합니다.

## 🧪 실제 테스트 방법

### 방법 1: Netlify 사이트에서 직접 테스트

1. **브라우저에서 Netlify 사이트 접속**
   ```
   https://marvelous-cat-d90804.netlify.app/login.html
   ```

2. **개발자 도구 열기 (F12)**
   - Console 탭 확인
   - 다음 로그가 보여야 함:
     ```
     ✅ Supabase 클라이언트 초기화 완료
     🔐 Google 로그인 리다이렉트 URL: https://marvelous-cat-d90804.netlify.app/login.html
     📍 현재 환경: 프로덕션
     🌐 현재 origin: https://marvelous-cat-d90804.netlify.app
     ```

3. **Google 로그인 버튼 클릭**
   - Google 로그인 페이지로 이동해야 함
   - 로그인 후 Netlify 사이트로 리다이렉트되어야 함

### 방법 2: 브라우저 콘솔에서 확인

Netlify 사이트에서 브라우저 콘솔(F12)을 열고 다음 코드 실행:

```javascript
// 환경 감지 확인
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
console.log('현재 환경:', isLocal ? '로컬' : '프로덕션');
console.log('현재 origin:', window.location.origin);

// 리다이렉트 URL 확인
const redirectUrl = isLocal
    ? 'http://localhost:8080/login.html'
    : window.location.origin + '/login.html';
console.log('리다이렉트 URL:', redirectUrl);
```

**예상 결과 (프로덕션):**
```
현재 환경: 프로덕션
현재 origin: https://marvelous-cat-d90804.netlify.app
리다이렉트 URL: https://marvelous-cat-d90804.netlify.app/login.html
```

## 🐛 문제 해결

### 문제 1: "Google 로그인 설정이 필요합니다" 메시지

**원인:** `config.js`가 로드되지 않음

**해결:**
1. `config.js` 파일이 Git에 포함되어 있는지 확인
2. Netlify에서 `config.js` 파일이 배포되었는지 확인
3. 브라우저에서 직접 접속: `https://marvelous-cat-d90804.netlify.app/config.js`
4. 정상이면 JavaScript 코드가 보여야 함

### 문제 2: 로그인 후 이상한 URL로 리다이렉트됨

**원인:** Supabase Dashboard에 리다이렉트 URL이 등록되지 않음

**해결:**
1. Supabase Dashboard → Authentication → URL Configuration
2. Redirect URLs에 프로덕션 URL 추가
3. 저장 후 다시 테스트

### 문제 3: Google 로그인 페이지로 이동하지 않음

**원인:** Google Cloud Console 설정 문제

**해결:**
1. Google Cloud Console → APIs & Services → Credentials
2. OAuth 2.0 클라이언트 ID 확인
3. Authorized redirect URIs에 Supabase 콜백 URL 확인

## 📊 현재 코드 동작 확인

### 로컬 환경
```javascript
// window.location.hostname = 'localhost'
// isLocal = true
// redirectUrl = 'http://localhost:8080/login.html'
```

### 프로덕션 환경 (Netlify)
```javascript
// window.location.hostname = 'marvelous-cat-d90804.netlify.app'
// isLocal = false
// redirectUrl = 'https://marvelous-cat-d90804.netlify.app/login.html'
```

**✅ 코드는 올바르게 작동합니다!**

## ✅ 최종 확인 사항

- [ ] Supabase Dashboard에 프로덕션 URL 등록됨
- [ ] Google Cloud Console에 Supabase 콜백 URL 등록됨
- [ ] Netlify에서 `config.js` 접속 가능
- [ ] Netlify에서 로그인 페이지 접속 가능
- [ ] 브라우저 콘솔에서 환경 감지 로그 확인
- [ ] Google 로그인 버튼 클릭 시 Google 로그인 페이지로 이동
- [ ] 로그인 후 Netlify 사이트로 리다이렉트됨

## 🎯 결론

**코드는 올바르게 작성되어 있습니다.** 

일반 유저가 Netlify에서 접속하면:
1. 환경이 자동으로 감지됨 (프로덕션)
2. 리다이렉트 URL이 자동으로 설정됨 (`https://marvelous-cat-d90804.netlify.app/login.html`)
3. Google 로그인 후 올바른 URL로 리다이렉트됨

**중요:** Supabase Dashboard와 Google Cloud Console 설정만 확인하면 됩니다!

