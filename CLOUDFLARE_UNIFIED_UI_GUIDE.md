# Cloudflare 통합 UI에서 Pages 프로젝트 만들기

## 📍 현재 상황

Cloudflare 대시보드에서 "Workers & Pages"가 통합되어 있고, 탭이 분리되어 있지 않습니다. 이 경우 프로젝트를 생성할 때 타입을 선택해야 합니다.

---

## ✅ Pages 프로젝트 생성 방법

### Step 1: 새 프로젝트 생성 시작

1. Cloudflare 대시보드에서 **"Workers & Pages"** 섹션으로 이동
2. 상단 오른쪽에 **"Create application"** 또는 **"Create"** 버튼 클릭
3. 또는 프로젝트 목록 상단의 **"Create application"** 버튼 클릭

### Step 2: 프로젝트 타입 선택

프로젝트 생성 화면에서 다음 중 하나가 나타날 수 있습니다:

**옵션 A: 타입 선택 화면이 나타나는 경우**
- **"Pages"** 선택 (Workers 아님!)
- **"Create"** 또는 **"Next"** 클릭

**옵션 B: 바로 Git 연결 화면이 나타나는 경우**
- 이 경우 이미 Pages로 설정된 것일 수 있음
- 다음 단계로 진행

### Step 3: Git 저장소 연결

1. **"Connect to Git"** 또는 **"Connect Git repository"** 선택
2. GitHub 계정 선택 (이미 연결되어 있을 수 있음)
3. 저장소 선택: **"bunz5911/R"**
4. **"Begin setup"** 또는 **"Continue"** 클릭

### Step 4: Pages 프로젝트 설정

프로젝트 설정 화면에서 다음 필드들을 확인하세요:

```
Project name: rakorean-pages (또는 원하는 이름)
Production branch: main

Framework preset: None (또는 Plain HTML)
Build command: (비워두기)
Build output directory: . (점 하나만)  ← 여기서 확인!
Root directory: (비워두기)
```

**⚠️ 중요 확인사항:**
- **"Build output directory"** 필드가 보여야 합니다!
- 이 필드가 보이면 Pages 프로젝트입니다
- 이 필드가 보이지 않으면 Workers 프로젝트입니다

### Step 5: 저장 및 배포

1. 모든 설정 확인 후 **"Save and Deploy"** 클릭
2. 배포 진행 상황 확인

---

## 🔍 Pages vs Workers 구분 방법

### Pages 프로젝트 설정 화면에는:
- ✅ **"Build output directory"** 필드가 있음
- ✅ **"Framework preset"** 선택 옵션이 있음
- ✅ **"Build command"** 필드가 있음

### Workers 프로젝트 설정 화면에는:
- ❌ **"Build output directory"** 필드가 없음
- ✅ **"Deploy command"** 필드가 있음 (예: `npx wrangler deploy`)
- ✅ **"Version command"** 필드가 있음

---

## 💡 팁: 기존 프로젝트 확인

현재 "rakorean" 프로젝트가 어떤 타입인지 확인하는 방법:

1. "rakorean" 프로젝트 클릭
2. Settings 탭으로 이동
3. **"Build output directory"** 필드가 있는지 확인
   - 있으면 → Pages 프로젝트 ✅
   - 없으면 → Workers 프로젝트 ❌ (새로 만들어야 함)

---

## 🚀 빠른 해결 방법

1. **"Create application"** 버튼 클릭
2. 프로젝트 타입 선택 화면이 나타나면 **"Pages"** 선택
3. Git 저장소 연결: `bunz5911/R`
4. **"Build output directory"** 필드가 보이는지 확인
5. 값이 **`.` (점 하나)** 인지 확인
6. **"Save and Deploy"** 클릭

---

## 📋 체크리스트

- [ ] **"Create application"** 버튼 클릭
- [ ] 프로젝트 타입에서 **"Pages"** 선택 (선택 화면이 있는 경우)
- [ ] Git 저장소 연결: `bunz5911/R`
- [ ] **"Build output directory"** 필드가 보이는지 확인
- [ ] 값이 **`.` (점 하나)** 인지 확인
- [ ] **"Save and Deploy"** 클릭

---

## 🆘 여전히 찾을 수 없다면

다음 정보를 알려주세요:
1. "Create application" 버튼을 클릭했을 때 어떤 화면이 나타나는지
2. 프로젝트 타입 선택 옵션이 있는지
3. 바로 Git 연결 화면이 나타나는지

이 정보를 주시면 더 구체적으로 안내하겠습니다.

