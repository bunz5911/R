# Netlify 배포 문제 해결 가이드

## 문제: 로컬에서는 작동하지만 Netlify에서는 작동하지 않음

### 1. Netlify 배포 상태 확인

1. Netlify 대시보드 접속: https://app.netlify.com
2. 사이트 선택
3. "Deploys" 탭 확인
4. 최신 배포가 성공했는지 확인 (초록색 체크 표시)

### 2. 브라우저 캐시 문제 해결

#### 방법 1: 강제 새로고침
- **Mac**: `Cmd + Shift + R`
- **Windows**: `Ctrl + Shift + R`

#### 방법 2: 브라우저 캐시 완전 삭제
1. 브라우저 개발자 도구 열기 (F12)
2. Network 탭 열기
3. "Disable cache" 체크박스 선택
4. 페이지 새로고침

#### 방법 3: 시크릿 모드에서 테스트
- **Chrome**: `Cmd + Shift + N` (Mac) / `Ctrl + Shift + N` (Windows)
- **Safari**: `Cmd + Shift + N` (Mac)

### 3. config.js 파일 확인

브라우저에서 직접 접속하여 확인:
```
https://marvelous-cat-d90804.netlify.app/config.js
```

정상적으로 로드되면:
```javascript
const CONFIG = {
    SUPABASE_URL: 'https://...',
    SUPABASE_ANON_KEY: '...',
    ...
};
```

404 에러가 나면:
- Netlify 배포가 완료되지 않았을 수 있음
- 배포 로그 확인 필요

### 4. 콘솔 에러 확인

브라우저 개발자 도구 (F12) → Console 탭에서 확인:

#### 정상적인 경우:
```
✅ Supabase 클라이언트 초기화 완료 (config.js)
```

#### 문제가 있는 경우:
```
⚠️ Supabase 설정을 찾을 수 없습니다.
```

### 5. Netlify 재배포

1. Netlify 대시보드 → 사이트 선택
2. "Deploys" 탭
3. "Trigger deploy" → "Clear cache and deploy site" 클릭

### 6. 수동 배포 확인

GitHub에 푸시가 제대로 되었는지 확인:
```bash
git log --oneline -5
git ls-files config.js
```

### 7. Netlify 빌드 로그 확인

1. Netlify 대시보드 → 사이트 선택
2. "Deploys" 탭
3. 최신 배포 클릭
4. "Build log" 확인
5. 에러 메시지 확인

## 일반적인 문제와 해결책

### 문제 1: config.js 404 에러
**원인**: 파일이 Git에 추가되지 않음
**해결**: 
```bash
git add config.js
git commit -m "Add config.js"
git push origin main
```

### 문제 2: Supabase 초기화 실패
**원인**: config.js가 로드되지 않음
**해결**: 브라우저 캐시 삭제 및 강제 새로고침

### 문제 3: API 연결 실패
**원인**: API_BASE 설정 문제
**해결**: login.html의 API_BASE가 환경에 따라 자동 감지되는지 확인

## 빠른 체크리스트

- [ ] Netlify 배포가 성공했는가?
- [ ] 브라우저 캐시를 삭제했는가?
- [ ] config.js가 직접 접속 가능한가? (https://your-site.netlify.app/config.js)
- [ ] 브라우저 콘솔에 에러가 없는가?
- [ ] 최신 코드가 GitHub에 푸시되었는가?

