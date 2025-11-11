# Google OAuth 로그인 설정 가이드

Google 소셜 로그인을 활성화하려면 다음 단계를 따르세요.

---

## 📋 Step 1: Supabase 설정

### 1-1. Supabase Dashboard 접속
```
https://supabase.com/dashboard
→ 프로젝트 선택
```

### 1-2. API 정보 복사
```
Settings → API

복사할 정보:
✓ Project URL (예: https://xxxxx.supabase.co)
✓ Project API keys → anon/public key
```

### 1-3. config.js 파일 생성
```bash
# config.example.js를 복사
cp config.example.js config.js
```

`config.js` 파일에 실제 값 입력:
```javascript
const CONFIG = {
    SUPABASE_URL: 'https://xxxxx.supabase.co',  // ← 여기에 입력
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'  // ← 여기에 입력
};
```

---

## 🔑 Step 2: Google Cloud Console 설정

### 2-1. Google Cloud Console 접속
```
https://console.cloud.google.com/
→ 프로젝트 생성 또는 선택
```

### 2-2. OAuth 2.0 클라이언트 ID 생성
```
1. APIs & Services → Credentials
2. "+ CREATE CREDENTIALS" 클릭
3. "OAuth client ID" 선택
4. Application type: "Web application"
5. Name: "RAKorean App"
```

### 2-3. Authorized redirect URIs 추가
```
Supabase Dashboard → Authentication → URL Configuration에서 복사:

추가할 URL:
https://xxxxx.supabase.co/auth/v1/callback

예시:
https://abcdefghijk.supabase.co/auth/v1/callback
```

### 2-4. Client ID와 Secret 복사
```
생성 완료 후:
✓ Client ID 복사
✓ Client Secret 복사
```

---

## 🔗 Step 3: Supabase에 Google Provider 연결

### 3-1. Authentication 설정
```
Supabase Dashboard
→ Authentication
→ Providers
→ Google
```

### 3-2. 정보 입력
```
✓ Enabled: ON (활성화)
✓ Client ID: (Google에서 복사한 값)
✓ Client Secret: (Google에서 복사한 값)
```

### 3-3. 저장
```
"Save" 클릭
```

---

## ✅ Step 4: 테스트

### 4-1. config.js 확인
```javascript
// config.js 파일이 올바르게 설정되었는지 확인
const CONFIG = {
    SUPABASE_URL: 'https://xxxxx.supabase.co',  // ✓ 실제 URL
    SUPABASE_ANON_KEY: 'eyJhbG...'  // ✓ 실제 키
};
```

### 4-2. 브라우저 테스트
```
1. 브라우저 새로고침 (Cmd + Shift + R)
2. login.html 또는 signup.html 접속
3. "Google로 로그인" 버튼 클릭
4. Google 로그인 페이지로 리다이렉트
5. 계정 선택
6. 앱으로 다시 리다이렉트
7. 자동 로그인 완료!
```

---

## 🔍 문제 해결

### 에러: "Google 로그인 설정이 필요합니다"
```
→ config.js 파일이 없거나 값이 설정되지 않음
→ config.example.js를 복사하여 config.js 생성
→ 실제 Supabase URL과 Key 입력
```

### 에러: "redirect_uri_mismatch"
```
→ Google Cloud Console의 Authorized redirect URIs 확인
→ Supabase 콜백 URL이 정확히 입력되었는지 확인
→ https://xxxxx.supabase.co/auth/v1/callback
```

### 에러: "Invalid provider"
```
→ Supabase Authentication → Providers → Google이 활성화되었는지 확인
→ Client ID와 Secret이 올바르게 입력되었는지 확인
```

---

## 🎯 요약

```
1. Supabase URL/Key → config.js 파일에 입력
2. Google Cloud Console → OAuth 클라이언트 생성
3. Redirect URI 추가 (Supabase 콜백 URL)
4. Supabase → Google Provider 활성화
5. Client ID/Secret 입력
6. 테스트!
```

---

## 🔐 보안 주의사항

- `config.js`는 `.gitignore`에 포함되어 Git에 커밋되지 않습니다
- Supabase Anon Key는 공개해도 안전합니다 (RLS로 보호됨)
- Client Secret은 Supabase에만 입력하고, 프론트엔드에 노출하지 마세요

---

완료되었습니다! 🚀

