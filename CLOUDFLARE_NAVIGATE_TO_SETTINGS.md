# Cloudflare Pages Settings 페이지로 이동하는 방법

## 📍 현재 위치

현재 **Workers & Pages 대시보드**를 보고 계십니다.
- 이것은 프로젝트 목록을 보여주는 페이지입니다
- 설정을 변경하려면 프로젝트를 클릭해야 합니다

## ✅ 다음 단계: 프로젝트 클릭

### Step 1: 프로젝트 클릭

화면 왼쪽의 애플리케이션 목록에서:
1. **"rakorean"** 프로젝트를 클릭하세요
   - "Latest build failed" 상태로 표시되어 있습니다
   - GitHub 저장소: "bunz5911/R"

### Step 2: Settings 탭 찾기

프로젝트 페이지로 이동하면 상단에 탭 메뉴가 보입니다:
```
[Deployments] [Settings] [Custom domains] [Analytics] ...
```

**"Settings"** 탭을 클릭하세요.

### Step 3: Builds & deployments 섹션 찾기

Settings 페이지에서:
1. 왼쪽 사이드바 또는 페이지 중앙에 섹션 목록이 보입니다
2. **"Builds & deployments"** 섹션을 찾아 클릭하세요

### Step 4: Build output directory 확인

**"Builds & deployments"** 섹션에서:
- **"Build output directory"** 필드를 찾으세요
- 값이 **`.` (점 하나)** 인지 확인하세요

---

## ⚠️ 중요 확인사항

### 이것이 Pages 프로젝트인지 확인

프로젝트 페이지에서 확인할 수 있는 것들:

**Pages 프로젝트인 경우:**
- URL이 `rakorean.site` 형식으로 보임
- "Deployments" 탭에 배포 목록이 보임
- Settings에 "Build output directory" 필드가 있음

**Workers 프로젝트인 경우:**
- "No production routes" 메시지가 보임 (현재 보이는 것)
- Settings에 "Deploy command" 필드만 보임
- "Build output directory" 필드가 없음

---

## 🔄 만약 Workers 프로젝트라면

현재 "rakorean"이 Workers 프로젝트인 경우:

### 방법 1: Pages 프로젝트 새로 만들기 (권장)

1. 대시보드로 돌아가기 (뒤로 가기)
2. 상단 오른쪽 **"Create application"** 버튼 클릭
3. **"Pages"** 탭 선택 (Workers 아님!)
4. **"Connect to Git"** 선택
5. 저장소 선택: `bunz5911/R`
6. 설정:
   ```
   Framework preset: None
   Build command: (비워두기)
   Build output directory: . (점 하나)
   ```
7. **"Save and Deploy"** 클릭

### 방법 2: 기존 프로젝트 확인

현재 "rakorean" 프로젝트를 클릭해서:
- Settings 탭으로 이동
- "Build output directory" 필드가 있는지 확인
- 있으면 Pages, 없으면 Workers

---

## 📋 단계별 체크리스트

1. [ ] **"rakorean"** 프로젝트 클릭
2. [ ] 상단 탭에서 **"Settings"** 클릭
3. [ ] **"Builds & deployments"** 섹션 찾기
4. [ ] **"Build output directory"** 필드 확인
5. [ ] 값이 **`.` (점 하나)** 인지 확인

---

## 💡 팁

- 대시보드는 프로젝트 목록만 보여줍니다
- 실제 설정은 프로젝트를 클릭한 후 Settings 탭에 있습니다
- "Build output directory"는 Pages 프로젝트에만 있습니다

