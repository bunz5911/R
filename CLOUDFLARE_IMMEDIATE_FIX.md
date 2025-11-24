# Cloudflare Pages "checking out repository" 에러 즉시 해결

## 🔴 에러 로그
```
Failed: error occurred while checking out repository
```

---

## ✅ 즉시 해결 방법 (단계별)

### ⚡ 방법 1: Cloudflare Pages 설정 확인 및 수정 (가장 중요!)

#### Step 1: 프로젝트 설정 열기
1. Cloudflare 대시보드 접속
2. **Workers & Pages** → **Pages** 탭
3. 프로젝트 `rakorean` 클릭
4. **Settings** 탭 클릭

#### Step 2: Builds & deployments 설정 확인
**"Builds & deployments"** 섹션에서 다음을 확인:

```
✅ Production branch: main
✅ Framework preset: None (또는 Plain HTML)
✅ Build command: (비워두기 - 아무것도 입력하지 않음)
✅ Build output directory: . (점 하나만)
✅ Root directory: (비워두기)
```

**⚠️ 중요**: Production branch가 `main`인지 확인하세요!

#### Step 3: 저장소 연결 확인
**"Connected Git repository"** 섹션에서:
- 저장소: `bunz5911/R`
- 브랜치: `main`

---

### ⚡ 방법 2: GitHub 저장소 Public 확인 (가장 빠른 해결책)

#### Step 1: GitHub 저장소 확인
1. 브라우저에서 접속: `https://github.com/bunz5911/R`
2. 저장소 페이지 상단 확인:
   - **Public** ✅ → 문제 없음
   - **Private** ⚠️ → 아래 Step 2 진행

#### Step 2: Private 저장소인 경우 Public으로 변경
1. 저장소 페이지에서 **Settings** 탭 클릭
2. 맨 아래로 스크롤
3. **"Danger Zone"** 섹션 찾기
4. **"Change visibility"** 클릭
5. **"Change to public"** 선택
6. 저장소 이름 `bunz5911/R` 입력
7. **"I understand, change repository visibility"** 클릭

#### Step 3: Cloudflare에서 재배포
1. Cloudflare Pages 프로젝트로 돌아가기
2. **"Retry build"** 버튼 클릭
3. 배포 성공 확인

---

### ⚡ 방법 3: GitHub 권한 재부여 (Private 저장소 유지 시)

#### Step 1: Cloudflare GitHub 연결 확인
1. Cloudflare Pages 프로젝트 → **Settings**
2. **"Connected Git repository"** 섹션
3. **"Manage GitHub access"** 클릭

#### Step 2: GitHub 권한 부여
GitHub 인증 화면에서:
1. **"Authorize Cloudflare"** 클릭
2. 다음 권한 체크:
   - ✅ **repo** (전체 저장소 접근)
   - ✅ **read:org** (조직 읽기, 선택사항)
3. 저장소 선택:
   - ✅ `bunz5911/R` 선택
4. **"Save"** 클릭

#### Step 3: 재배포
1. Cloudflare로 돌아가기
2. **"Retry build"** 클릭

---

### ⚡ 방법 4: 저장소 연결 재설정

위 방법들이 안 되면:

#### Step 1: 저장소 연결 해제
1. Cloudflare Pages 프로젝트 → **Settings**
2. **"Builds & deployments"** 탭
3. **"Connected Git repository"** 섹션
4. **"Disconnect"** 클릭

#### Step 2: 저장소 재연결
1. **"Connect to Git"** 클릭
2. GitHub 계정 선택
3. 저장소 선택: `bunz5911/R`
4. 브랜치 선택: `main` (⚠️ 중요!)
5. **"Begin setup"** 클릭

#### Step 3: 빌드 설정
```
Framework preset: None
Build command: (비워두기)
Build output directory: . (점 하나)
```

#### Step 4: 저장 및 배포
1. **"Save and Deploy"** 클릭
2. 배포 진행 상황 확인

---

## 🔍 문제 진단 체크리스트

다음 항목들을 순서대로 확인하세요:

### 1. 브랜치 이름 확인
- [ ] Cloudflare 설정에서 Production branch가 `main`인지 확인
- [ ] `master`가 아닌 `main`인지 확인

### 2. 저장소 접근 권한
- [ ] GitHub 저장소가 Public인지 확인
- [ ] Private이면 Cloudflare에 권한이 부여되었는지 확인

### 3. 저장소 이름 확인
- [ ] Cloudflare에서 저장소 이름이 `bunz5911/R`인지 확인
- [ ] 대소문자가 정확한지 확인

### 4. GitHub 연결 상태
- [ ] Cloudflare와 GitHub가 정상적으로 연결되어 있는지 확인
- [ ] GitHub OAuth 권한이 있는지 확인

---

## 🚀 가장 빠른 해결 순서

**1단계 (30초)**: 브랜치 확인
- Cloudflare 설정에서 Production branch가 `main`인지 확인

**2단계 (2분)**: 저장소 Public으로 변경
- GitHub에서 저장소를 Public으로 변경

**3단계 (1분)**: 재배포
- Cloudflare에서 "Retry build" 클릭

**→ 총 3-4분이면 해결됩니다!**

---

## 💡 추가 팁

### 빌드 로그 더 자세히 보기
1. Cloudflare Pages 프로젝트
2. **"Deployments"** 탭
3. 실패한 배포 클릭
4. **"Build log"** 섹션 확장
5. 전체 로그 확인

더 자세한 에러 메시지가 있을 수 있습니다:
- `Repository not found` → 저장소 이름 확인
- `Branch not found` → 브랜치 이름 확인
- `Permission denied` → 권한 문제
- `Authentication failed` → GitHub 연결 문제

---

## 🆘 여전히 안 되면

다음 정보를 확인해주세요:

1. **GitHub 저장소 상태**:
   - Public인지 Private인지
   - 저장소 이름이 정확히 `bunz5911/R`인지

2. **Cloudflare 설정**:
   - Production branch 이름
   - 저장소 연결 상태

3. **빌드 로그 전체**:
   - "Build log" 섹션의 전체 내용

이 정보를 주시면 더 정확한 해결 방법을 제시하겠습니다.

