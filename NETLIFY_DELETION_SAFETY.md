# Netlify 삭제 안전 가이드

## ⚠️ 중요: Netlify 삭제 전 반드시 확인

### 현재 상태
- ✅ 모든 HTML 파일에 자동 리다이렉트 스크립트 추가됨
- ✅ 코드에 하드코딩된 Netlify URL 없음
- ✅ 모든 API 호출은 Render.com 백엔드 사용

## 🚨 Netlify 삭제 시 문제점

**Netlify를 완전히 삭제하면:**
- Netlify URL로 접속 시 HTML 파일을 로드할 수 없음
- 브라우저 리다이렉트 스크립트가 실행되지 않음
- 사용자가 404 에러를 보게 됨

## ✅ 해결 방법

### 방법 1: Netlify에 최소한의 리다이렉트 페이지 유지 (권장)

Netlify를 완전히 삭제하지 말고, 최소한의 리다이렉트 페이지만 남겨두세요:

1. **Netlify 프로젝트 설정에서:**
   - 빌드 명령어: 비워두기
   - 빌드 출력 디렉토리: `.` (루트)
   
2. **루트에 `index.html` 파일 하나만 유지:**
   ```html
   <!DOCTYPE html>
   <html>
   <head>
       <meta charset="UTF-8">
       <title>리다이렉트 중...</title>
       <script>
           // 즉시 Cloudflare로 리다이렉트
           const currentPath = window.location.pathname + window.location.search + window.location.hash;
           window.location.replace('https://rakorean.site' + currentPath);
       </script>
       <meta http-equiv="refresh" content="0; url=https://rakorean.site">
   </head>
   <body>
       <p>리다이렉트 중... <a href="https://rakorean.site">여기를 클릭하세요</a></p>
   </body>
   </html>
   ```

3. **Netlify 배포:**
   - 이 파일만 배포하여 최소한의 리다이렉트 서비스 유지
   - 비용: 무료 플랜으로도 충분

### 방법 2: DNS 레벨 리다이렉트 (고급)

Cloudflare DNS에서 Netlify 도메인을 가리키는 CNAME을 추가하고, Cloudflare Workers로 리다이렉트 처리:

1. Cloudflare DNS에 CNAME 추가:
   - Type: CNAME
   - Name: `marvelous-cat-d90804.netlify.app` (또는 실제 Netlify 도메인)
   - Target: `rakorean.site`
   - Proxy: Proxied

2. Cloudflare Workers로 리다이렉트 처리 (선택사항)

### 방법 3: 사용자에게 공지 (단기)

Netlify 삭제 전 사용자에게 공지:
- "사이트 주소가 변경되었습니다: https://rakorean.site"
- 소셜 미디어, 이메일, 앱 내 공지 등으로 알림

## 📋 Netlify 삭제 전 체크리스트

- [ ] Cloudflare Pages 배포 정상 작동 확인
- [ ] `https://rakorean.site` 모든 페이지 테스트 완료
- [ ] 로그인/회원가입 기능 정상 작동 확인
- [ ] API 호출 정상 작동 확인
- [ ] 모바일/데스크톱 모두 테스트 완료
- [ ] Netlify URL 접속 시 리다이렉트 동작 확인
- [ ] 사용자 공지 발송 (선택사항)

## 🎯 권장 절차

1. **단계 1: Cloudflare Pages 완전히 안정화**
   - 최소 1주일간 모니터링
   - 모든 기능 정상 작동 확인

2. **단계 2: Netlify에 최소 리다이렉트 페이지 배포**
   - 위의 `index.html` 파일만 배포
   - Netlify 프로젝트는 최소한으로 유지

3. **단계 3: 모니터링**
   - Netlify 트래픽 모니터링
   - 리다이렉트 동작 확인

4. **단계 4: 장기적으로 Netlify 삭제 고려**
   - 트래픽이 거의 없어지면 삭제 검토
   - 또는 영구적으로 리다이렉트 서비스로 유지

## 💡 결론

**가장 안전한 방법:**
- Netlify를 완전히 삭제하지 말고, 최소한의 리다이렉트 페이지만 유지
- 이렇게 하면 사용자가 Netlify URL로 접속해도 자동으로 Cloudflare로 이동
- 비용도 무료이고, 사용자 경험도 좋음

