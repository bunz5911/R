# Cloudflare Pages 빌드 에러 해결 가이드

## ⚠️ 중요: Pages vs Workers

현재 **Cloudflare Workers** 설정 화면을 보고 계신데, 우리는 **Cloudflare Pages**를 사용해야 합니다.

### 차이점:
- **Pages**: 정적 HTML 사이트 호스팅 (우리가 필요한 것)
- **Workers**: 서버리스 함수 실행 환경 (우리는 필요 없음)

---

## 🔧 올바른 Cloudflare Pages 설정 방법

### 1단계: Pages 프로젝트 생성 (Workers가 아닌 Pages!)

1. Cloudflare 대시보드 접속
2. 왼쪽 메뉴에서 **"Workers & Pages"** 클릭
3. **"Pages"** 탭 선택 (Workers 탭이 아님!)
4. **"Create a project"** 클릭
5. **"Connect to Git"** 선택

### 2단계: 프로젝트 설정 (중요!)

프로젝트 설정 화면에서 다음을 입력:

```
Project name: rakorean
Production branch: main

Framework preset: None (또는 "Plain HTML")
Build command: (비워두기 - 아무것도 입력하지 않음)
Build output directory: . (점 하나만 입력)
Root directory: (비워두기)
```

**⚠️ 중요 사항:**
- Build command는 **반드시 비워두세요**
- Build output directory는 **점 하나 (.)** 만 입력
- Framework preset은 **None** 또는 **Plain HTML** 선택

### 3단계: 환경 변수 (필요한 경우)

현재는 환경 변수가 필요하지 않지만, 나중에 필요하면:
- **Environment variables** 섹션에서 추가 가능

### 4단계: 배포

1. **"Save and Deploy"** 클릭
2. 배포 진행 상황 확인
3. 배포 완료 후 URL 확인 (예: `rakorean.pages.dev`)

---

## 🐛 빌드 에러 해결 방법

### 에러 1: "Build command failed"

**원인**: Build command에 잘못된 명령어가 입력됨

**해결**:
1. 프로젝트 설정 → **"Builds & deployments"** 탭
2. **"Build command"** 필드를 **완전히 비워두기**
3. **"Save"** 클릭
4. 재배포

### 에러 2: "Build output directory not found"

**원인**: Build output directory가 잘못 설정됨

**해결**:
1. 프로젝트 설정 → **"Builds & deployments"** 탭
2. **"Build output directory"** 필드에 **`.` (점 하나)** 입력
3. **"Save"** 클릭
4. 재배포

### 에러 3: "No files found in build output"

**원인**: 빌드 출력 디렉토리가 비어있음

**해결**:
- Build output directory가 `.` (점 하나)인지 확인
- 루트 디렉토리에 `index.html` 파일이 있는지 확인

### 에러 4: Functions 관련 에러

**원인**: `functions` 디렉토리가 있지만 잘못 구성됨

**해결 방법 1**: Functions 사용 안 함 (권장)
- `functions` 디렉토리를 삭제하거나 `.gitignore`에 추가
- `_redirects` 파일만 사용

**해결 방법 2**: Functions 올바르게 설정
- `functions/api/[[path]].js` 파일이 올바른지 확인
- 필요 없으면 삭제

---

## ✅ 올바른 프로젝트 구조 확인

프로젝트 루트에 다음 파일들이 있어야 합니다:

```
RAKorean/
├── index.html          ✅ (필수)
├── app.js              ✅
├── _redirects          ✅ (API 프록시용)
├── netlify.toml        (삭제됨 - Cloudflare Pages 사용)
├── cloudflare-pages.json  (참고용, 삭제 가능)
└── functions/          (선택사항, 필요 없으면 삭제)
    └── api/
        └── [[path]].js
```

---

## 🚀 빠른 해결 방법

### 방법 1: Pages 프로젝트 새로 만들기 (권장)

1. 기존 프로젝트 삭제 (잘못 만들어진 경우)
2. **Pages** 탭에서 새 프로젝트 생성
3. 위의 설정대로 입력
4. 배포

### 방법 2: 기존 프로젝트 설정 수정

1. 프로젝트 선택
2. **"Settings"** → **"Builds & deployments"** 탭
3. 다음 설정 확인:
   - Build command: **(비워두기)**
   - Build output directory: **`.` (점 하나)**
4. **"Save"** 클릭
5. **"Retry deployment"** 클릭

---

## 📝 체크리스트

배포 전 확인:
- [ ] **Pages** 탭에서 프로젝트 생성 (Workers 아님!)
- [ ] Build command 비워두기
- [ ] Build output directory: `.` (점 하나)
- [ ] `index.html` 파일이 루트에 있음
- [ ] `_redirects` 파일이 루트에 있음

배포 후 확인:
- [ ] 배포 성공 (초록색 체크)
- [ ] Pages URL 접속 가능 (예: `rakorean.pages.dev`)
- [ ] 메인 페이지 로딩 확인
- [ ] API 호출 정상 작동 (`/api/*` 경로)

---

## 🆘 여전히 문제가 있다면

1. **배포 로그 확인**:
   - 프로젝트 → **"Deployments"** 탭
   - 최신 배포 클릭
   - **"Build logs"** 확인

2. **에러 메시지 공유**:
   - 빌드 로그의 에러 메시지를 복사
   - 정확한 에러 메시지를 알려주시면 해결 방법 제시

---

## 💡 팁

- Cloudflare Pages는 빌드가 필요 없는 정적 사이트에 최적화되어 있습니다
- Build command를 비워두면 파일을 그대로 배포합니다
- `_redirects` 파일로 API 프록시가 자동으로 작동합니다

