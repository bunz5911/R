# 카카오 로그인 설정 가이드

카카오 소셜 로그인을 활성화하려면 다음 단계를 따르세요.

---

## 📋 Step 1: Kakao Developers 애플리케이션 등록

### 1-1. Kakao Developers 접속
```
https://developers.kakao.com/
→ 로그인 (카카오 계정)
→ 내 애플리케이션
```

### 1-2. 애플리케이션 추가
```
1. "애플리케이션 추가하기" 클릭
2. 앱 이름: "RAKorean"
3. 사업자명: (선택사항)
4. 저장
```

### 1-3. JavaScript 키 복사
```
1. 생성된 앱 클릭
2. "앱 키" 메뉴
3. "JavaScript 키" 복사
```

---

## 🔑 Step 2: config.js 파일 수정

`/Users/hongbeomseog/Desktop/RAKorean/config.js` 파일 수정:

```javascript
const CONFIG = {
    SUPABASE_URL: 'https://vofhdnrsrwwgwoxtqwba.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGci...',  // 이미 입력됨
    
    KAKAO_JS_KEY: '여기에_JavaScript_키_붙여넣기'  // ← 여기!
};
```

---

## 🌐 Step 3: 플랫폼 설정 (중요!)

### 3-1. 플랫폼 추가
```
Kakao Developers → 내 애플리케이션 → 앱 선택
→ 플랫폼
→ Web 플랫폼 등록
```

### 3-2. 사이트 도메인 등록

**로컬 개발용:**
```
http://localhost:8080
```

**배포 시 추가:**
```
https://yourdomain.com
```

---

## 🔐 Step 4: 카카오 로그인 활성화

### 4-1. 카카오 로그인 설정
```
Kakao Developers → 제품 설정 → 카카오 로그인
```

### 4-2. 활성화 설정
```
✓ 카카오 로그인 활성화: ON
✓ OpenID Connect 활성화: ON (권장)
```

### 4-3. Redirect URI 설정
```
Redirect URI 등록:
http://localhost:8080/login.html
http://localhost:8080/signup.html
```

**배포 시 추가:**
```
https://yourdomain.com/login.html
https://yourdomain.com/signup.html
```

---

## 📱 Step 5: 동의항목 설정

### 5-1. 동의항목 메뉴
```
Kakao Developers → 제품 설정 → 카카오 로그인 → 동의항목
```

### 5-2. 필수 동의항목 설정
```
✓ 닉네임: 필수 동의
✓ 프로필 사진: 선택 동의
✓ 카카오계정(이메일): 선택 동의
```

---

## ✅ Step 6: 테스트

### 6-1. config.js 확인
```javascript
const CONFIG = {
    SUPABASE_URL: 'https://vofhdnrsrwwgwoxtqwba.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGci...',
    KAKAO_JS_KEY: 'abc123...'  // ✓ 실제 JavaScript 키
};
```

### 6-2. 브라우저 테스트
```
1. 브라우저 새로고침 (Cmd + Shift + R)
2. login.html 또는 signup.html 접속
3. 콘솔에 "✅ 카카오 SDK 초기화 완료" 표시 확인
4. "카카오로 로그인" 버튼 클릭
5. 카카오 로그인 팝업 나타남 ✅
6. 계정 선택 및 동의
7. 앱으로 돌아옴
8. 자동 로그인 완료!
```

---

## 🔍 문제 해결

### 에러: "카카오 로그인 설정이 필요합니다"
```
→ config.js 파일에 KAKAO_JS_KEY가 입력되지 않음
→ Kakao Developers에서 JavaScript 키 복사
→ config.js에 붙여넣기
```

### 에러: "유효하지 않은 redirect_uri"
```
→ Kakao Developers → 카카오 로그인 → Redirect URI 확인
→ http://localhost:8080/login.html 추가
→ http://localhost:8080/signup.html 추가
```

### 에러: "앱 키가 유효하지 않습니다"
```
→ config.js의 KAKAO_JS_KEY 확인
→ JavaScript 키가 맞는지 확인 (REST API 키가 아님!)
```

### 에러: "동의 항목이 설정되지 않음"
```
→ Kakao Developers → 동의항목
→ 닉네임, 프로필 사진, 이메일 설정
```

### 팝업이 차단됨
```
→ 브라우저 설정에서 팝업 허용
→ Safari: 환경설정 → 웹사이트 → 팝업 윈도우
→ Chrome: 설정 → 개인정보 및 보안 → 사이트 설정 → 팝업
```

---

## 🎯 요약

```
1. Kakao Developers 앱 등록
2. JavaScript 키 → config.js 입력
3. 플랫폼 도메인 등록 (http://localhost:8080)
4. 카카오 로그인 활성화
5. Redirect URI 등록 (login.html, signup.html)
6. 동의항목 설정 (닉네임, 이메일)
7. 테스트!
```

---

## 💡 추가 정보

### 카카오 로그인 플로우
```
[카카오 버튼 클릭]
    ↓
[카카오 로그인 팝업]
    ↓
[계정 선택 및 동의]
    ↓
[사용자 정보 조회]
    ↓
[백엔드 로그인 처리]
    ↓
[프로필 자동 생성] (신규 사용자)
    ↓
[10코인 지급]
    ↓
[홈으로 이동] ✅
```

### 카카오 vs Supabase Auth
- **카카오**: 자체 SDK 사용, 자체 토큰 관리
- **Google**: Supabase Auth 통합, Supabase 토큰 사용
- 둘 다 profiles 테이블에 동일하게 저장됨

---

## 🔐 보안

- `config.js`는 Git에 커밋되지 않음 (.gitignore)
- JavaScript 키는 공개해도 안전 (플랫폼 도메인으로 제한)
- Admin Key는 절대 노출하지 마세요!

---

완료되었습니다! 🚀

