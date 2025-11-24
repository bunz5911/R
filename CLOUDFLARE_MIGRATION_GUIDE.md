# Cloudflare Pages 마이그레이션 가이드

## 📋 개요

이 가이드는 Netlify에서 Cloudflare Pages로 안전하게 호스팅을 이동하는 단계별 가이드를 제공합니다.

## ✅ 완료된 작업

1. ✅ 모든 `<img>` 태그에 `loading="lazy"` 속성 추가 완료
2. ✅ Cloudflare Pages 설정 파일 생성 (`_redirects`, `cloudflare-pages.json`)
3. ✅ Netlify 설정 분석 및 Cloudflare 호환 설정 준비

---

## 🚀 단계별 마이그레이션 절차

### 1단계: Cloudflare 계정 준비

#### 1.1 Cloudflare 계정 생성
1. [Cloudflare 대시보드](https://dash.cloudflare.com/) 접속
2. 계정이 없으면 "Sign Up" 클릭하여 계정 생성
3. 이메일 인증 완료

#### 1.2 Pages 서비스 확인
1. 대시보드 왼쪽 메뉴에서 **"Workers & Pages"** 클릭
2. **"Pages"** 탭 선택
3. Pages 서비스가 활성화되어 있는지 확인

---

### 2단계: GitHub 저장소 연결

#### 2.1 GitHub 저장소 확인
- 현재 저장소: `bunz5911/R` (또는 실제 저장소 이름)
- 저장소가 GitHub에 푸시되어 있는지 확인

#### 2.2 Cloudflare Pages에서 저장소 연결
1. Cloudflare Pages 대시보드에서 **"Create a project"** 클릭
2. **"Connect to Git"** 선택
3. GitHub 계정 연결 (처음이면 GitHub 인증 필요)
4. 저장소 선택: `bunz5911/R` (또는 실제 저장소 이름)
5. **"Begin setup"** 클릭

---

### 3단계: 빌드 설정

#### 3.1 프로젝트 설정
- **Project name**: `rakorean` (또는 원하는 이름)
- **Production branch**: `main` (또는 기본 브랜치)

#### 3.2 빌드 설정
- **Framework preset**: `None` 또는 `Plain HTML`
- **Build command**: (비워두기 - 정적 파일이므로 빌드 불필요)
- **Build output directory**: `.` (루트 디렉토리)

#### 3.3 환경 변수 설정 (필요한 경우)
현재 Netlify에서 사용 중인 환경 변수가 있다면:
1. **"Environment variables"** 섹션으로 이동
2. 필요한 변수 추가 (예: `NODE_VERSION=18`)

---

### 4단계: 커스텀 도메인 설정 (선택사항)

#### 4.1 도메인 추가
1. 프로젝트 설정에서 **"Custom domains"** 탭 선택
2. **"Set up a custom domain"** 클릭
3. 도메인 입력 (예: `rakorean.com`)
4. DNS 설정 안내에 따라 DNS 레코드 추가

#### 4.2 SSL/TLS 설정
- Cloudflare는 자동으로 SSL 인증서를 제공하므로 추가 설정 불필요

---

### 5단계: 리다이렉트 및 헤더 설정

#### 5.1 _redirects 파일 확인
프로젝트 루트에 `_redirects` 파일이 생성되어 있습니다:
```
/api/*  https://r-6s57.onrender.com/api/:splat  200
```

#### 5.2 Functions 설정 (필요한 경우)
Cloudflare Pages Functions를 사용하여 리다이렉트를 설정할 수도 있습니다:
- `functions/api/[...path].ts` 파일 생성 (TypeScript 사용 시)
- 또는 `_redirects` 파일 사용 (더 간단)

현재는 `_redirects` 파일을 사용하는 것을 권장합니다.

---

### 6단계: 배포 테스트

#### 6.1 첫 배포
1. **"Save and Deploy"** 클릭
2. 배포 진행 상황 확인 (보통 1-2분 소요)
3. 배포 완료 후 제공되는 URL 확인 (예: `rakorean.pages.dev`)

#### 6.2 기능 테스트
다음 항목들을 테스트하세요:
- [ ] 메인 페이지 로딩 확인
- [ ] 이미지 lazy loading 동작 확인
- [ ] API 호출이 정상적으로 프록시되는지 확인 (`/api/*` 경로)
- [ ] 모든 페이지 라우팅 정상 작동 확인
- [ ] 로그인/회원가입 기능 정상 작동 확인

---

### 7단계: DNS 설정 (도메인 사용 시)

#### 7.1 Cloudflare DNS 설정
1. Cloudflare 대시보드에서 도메인 선택
2. **"DNS"** 탭으로 이동
3. Pages 프로젝트를 가리키는 CNAME 레코드 추가:
   - **Type**: CNAME
   - **Name**: `@` 또는 `www` (서브도메인)
   - **Target**: `rakorean.pages.dev` (실제 Pages URL)
   - **Proxy status**: Proxied (주황색 구름)

#### 7.2 DNS 전파 대기
- DNS 변경사항이 전파되는데 보통 5분~24시간 소요
- `nslookup` 또는 온라인 DNS 체크 도구로 확인

---

### 8단계: Netlify에서 Cloudflare로 전환

#### 8.1 최종 테스트
1. Cloudflare Pages URL에서 모든 기능이 정상 작동하는지 확인
2. 도메인이 연결되어 있다면 도메인으로도 테스트
3. 모바일 기기에서도 테스트

#### 8.2 DNS 전환 (도메인 사용 시)
1. 도메인 DNS를 Cloudflare로 변경
2. 또는 Netlify에서 도메인을 제거하고 Cloudflare에 추가

#### 8.3 Netlify 비활성화 (선택사항)
- 모든 것이 정상 작동하는 것을 확인한 후
- Netlify 대시보드에서 사이트 삭제 또는 비활성화

---

## 🔧 Cloudflare Pages 고급 설정

### Functions 사용 (선택사항)

API 프록시를 Functions로 구현하려면:

1. `functions/api/[...path].ts` 파일 생성:
```typescript
export async function onRequest(context: EventContext) {
  const url = new URL(context.request.url);
  const apiPath = url.pathname.replace('/api/', '');
  const backendUrl = `https://r-6s57.onrender.com/api/${apiPath}${url.search}`;
  
  return fetch(backendUrl, {
    method: context.request.method,
    headers: context.request.headers,
    body: context.request.body,
  });
}
```

현재는 `_redirects` 파일로 충분하므로 Functions는 선택사항입니다.

### 캐싱 설정

Cloudflare Pages는 자동으로 정적 파일을 캐싱합니다. 추가 설정이 필요하면:
1. 프로젝트 설정 → **"Custom headers"** 섹션
2. 캐시 헤더 추가

---

## 📊 Netlify vs Cloudflare Pages 비교

| 기능 | Netlify | Cloudflare Pages |
|------|---------|------------------|
| 무료 트래픽 | 제한적 | 무제한 |
| 빌드 시간 | 제한적 | 무제한 |
| 배포 속도 | 빠름 | 매우 빠름 |
| CDN | 글로벌 | 글로벌 (더 빠름) |
| SSL | 자동 | 자동 |
| Functions | 지원 | Workers 지원 |

---

## ⚠️ 주의사항

1. **API 프록시**: `/api/*` 경로가 Render.com 백엔드로 올바르게 프록시되는지 확인
2. **환경 변수**: Netlify에서 사용하던 환경 변수가 있다면 Cloudflare에도 추가
3. **도메인 전환**: DNS 전환 시 다운타임을 최소화하려면 Cloudflare에서 먼저 테스트
4. **캐시**: 변경사항이 즉시 반영되지 않으면 브라우저 캐시 삭제

---

## 🆘 문제 해결

### 배포 실패 시
1. 빌드 로그 확인
2. `_redirects` 파일 형식 확인
3. 파일 경로 확인

### API 프록시가 작동하지 않을 때
1. `_redirects` 파일이 루트 디렉토리에 있는지 확인
2. Cloudflare Pages Functions 사용 고려

### 이미지가 로드되지 않을 때
1. 이미지 경로 확인
2. `loading="lazy"` 속성이 올바르게 추가되었는지 확인

---

## 📝 체크리스트

마이그레이션 전:
- [ ] Cloudflare 계정 생성
- [ ] GitHub 저장소 확인
- [ ] Netlify 설정 백업

마이그레이션 중:
- [ ] Cloudflare Pages 프로젝트 생성
- [ ] 빌드 설정 완료
- [ ] 첫 배포 성공
- [ ] 기능 테스트 완료

마이그레이션 후:
- [ ] DNS 전환 완료 (도메인 사용 시)
- [ ] 최종 테스트 완료
- [ ] Netlify 비활성화 (선택사항)
- [ ] 모니터링 설정

---

## 📞 추가 도움

- [Cloudflare Pages 문서](https://developers.cloudflare.com/pages/)
- [Cloudflare 커뮤니티 포럼](https://community.cloudflare.com/)

---

**마이그레이션 완료 후 이 파일을 삭제하거나 보관하세요.**

