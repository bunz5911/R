# Cloudflare Pages 프로젝트 생성 단계별 가이드

## ✅ 현재 위치 확인

네, 여기가 맞는 페이지입니다! "Workers & Pages" 대시보드를 보고 계십니다.

## 📋 다음 단계

### Step 1: 새 Pages 프로젝트 생성

1. 화면 오른쪽 상단의 **"Create application"** 버튼 클릭 (파란색 버튼)
2. 프로젝트 타입 선택 화면이 나타나면:
   - **"Pages"** 선택 (Workers 아님!)
   - 또는 바로 Git 연결 화면이 나타날 수 있음
3. **"Connect to Git"** 선택
4. GitHub 계정 선택 (이미 연결되어 있을 수 있음)
5. 저장소 선택: **"bunz5911/R"**
6. **"Begin setup"** 클릭

### Step 2: Pages 프로젝트 설정

프로젝트 설정 화면에서:

```
Project name: rakorean-pages (또는 원하는 이름)
Production branch: main

Framework preset: None (또는 Plain HTML)
Build command: (비워두기)
Build output directory: . (점 하나만)  ← 여기서 확인!
Root directory: (비워두기)
```

**⚠️ 중요**: **"Build output directory"** 필드가 보여야 합니다!
- 보이면 → 올바른 Pages 프로젝트 ✅
- 보이지 않으면 → Workers 프로젝트 ❌ (취소하고 다시)

### Step 3: 저장 및 배포

1. 모든 설정 확인 후 **"Save and Deploy"** 클릭
2. 배포 진행 상황 확인
3. 배포 성공 확인

### Step 4: 기존 Workers 프로젝트 처리 (선택사항)

**옵션 A: 삭제하기 (권장)**
1. 대시보드로 돌아가기
2. **"rakorean"** 프로젝트 클릭
3. Settings 탭 → 맨 아래로 스크롤
4. **"Delete"** 또는 **"Remove"** 버튼 찾기
5. 확인 후 삭제

**옵션 B: 그대로 두기**
- 두 프로젝트가 공존해도 문제 없습니다
- 나중에 삭제해도 됩니다

---

## 🔍 기존 Workers 프로젝트 삭제 방법

### 방법 1: 프로젝트 설정에서 삭제

1. **"rakorean"** 프로젝트 클릭
2. **"Settings"** 탭 클릭
3. 맨 아래로 스크롤
4. **"Delete"** 또는 **"Remove"** 버튼 찾기
5. 프로젝트 이름 입력하여 확인
6. 삭제 확인

### 방법 2: 프로젝트 목록에서 삭제

1. 프로젝트 목록에서 **"rakorean"** 프로젝트에 마우스 오버
2. 오른쪽에 나타나는 메뉴 아이콘(점 3개) 클릭
3. **"Delete"** 선택
4. 확인

---

## ⚠️ 주의사항

### 삭제 전 확인:
- [ ] 새 Pages 프로젝트가 성공적으로 생성되었는지 확인
- [ ] 새 Pages 프로젝트가 정상적으로 배포되었는지 확인
- [ ] 새 Pages 프로젝트에서 "Build output directory" 설정이 올바른지 확인

### 삭제 후:
- 기존 Workers 프로젝트의 설정은 복구할 수 없습니다
- 하지만 새 Pages 프로젝트가 있으므로 문제 없습니다

---

## 📋 체크리스트

1. [ ] **"Create application"** 버튼 클릭
2. [ ] 프로젝트 타입에서 **"Pages"** 선택
3. [ ] Git 저장소 연결: `bunz5911/R`
4. [ ] **"Build output directory"** 필드가 보이는지 확인
5. [ ] 값이 **`.` (점 하나)** 인지 확인
6. [ ] **"Save and Deploy"** 클릭
7. [ ] 배포 성공 확인
8. [ ] (선택) 기존 Workers 프로젝트 삭제

---

## 💡 요약

- ✅ 여기가 맞는 페이지입니다
- ✅ **"Create application"** 버튼 클릭하여 새 Pages 프로젝트 생성
- ✅ 기존 Workers 프로젝트는 나중에 삭제해도 됩니다 (또는 그대로 두어도 됨)
- ✅ 먼저 새 Pages 프로젝트를 성공적으로 만든 후에 기존 프로젝트를 삭제하는 것이 안전합니다

**지금 할 일**: 오른쪽 상단의 **"Create application"** 버튼을 클릭하세요!

