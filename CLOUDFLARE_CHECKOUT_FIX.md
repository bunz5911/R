# Cloudflare Pages "checking out repository" 에러 해결

## 🔴 에러 메시지
```
Failed: error occurred while checking out repository
```

이 에러는 Git 저장소를 체크아웃하는 과정에서 발생합니다.

---

## ✅ 해결 방법 (우선순위 순)

### 방법 1: Cloudflare Pages 설정에서 브랜치 확인 (가장 흔한 원인)

#### 1.1 프로젝트 설정 확인
1. Cloudflare Pages 프로젝트 → **"Settings"** 탭
2. **"Builds & deployments"** 섹션
3. **"Production branch"** 확인:
   - ✅ `main` 또는 `master`로 설정되어 있는지 확인
   - ⚠️ 다른 브랜치 이름이면 `main`으로 변경

#### 1.2 브랜치 이름 수정
```
Production branch: main
```

**저장** 후 **"Retry build"** 클릭

---

### 방법 2: GitHub 저장소 접근 권한 확인

#### 2.1 저장소가 Private인지 확인
1. GitHub 저장소 접속: `https://github.com/bunz5911/R`
2. 저장소가 **Private**인지 확인

#### 2.2 Private 저장소인 경우
1. Cloudflare Pages 프로젝트 설정
2. **"Connected Git repository"** 섹션
3. **"Manage GitHub access"** 클릭
4. GitHub에서 권한 부여:
   - ✅ **Private repositories** 접근 권한 체크
   - ✅ 저장소 `bunz5911/R` 선택
5. **"Save"** 클릭
6. **"Retry build"** 클릭

#### 2.3 Public으로 변경 (가장 간단)
1. GitHub 저장소 → **Settings**
2. 맨 아래 **"Danger Zone"**
3. **"Change visibility"** → **"Change to public"**
4. Cloudflare에서 **"Retry build"**

---

### 방법 3: 저장소 연결 재설정

#### 3.1 저장소 연결 해제 후 재연결
1. Cloudflare Pages 프로젝트 설정
2. **"Builds & deployments"** 탭
3. **"Connected Git repository"** 섹션
4. **"Disconnect"** 클릭
5. **"Connect to Git"** 클릭
6. GitHub 계정 재연결
7. 저장소 선택: `bunz5911/R`
8. 브랜치 선택: `main`
9. **"Save"** 클릭
10. **"Retry build"** 클릭

---

### 방법 4: 빌드 설정 초기화

#### 4.1 빌드 설정 확인
프로젝트 설정에서:
```
Framework preset: None (또는 Plain HTML)
Build command: (비워두기)
Build output directory: . (점 하나)
Root directory: (비워두기)
```

#### 4.2 설정 저장 후 재배포
1. **"Save"** 클릭
2. **"Retry build"** 클릭

---

## 🔍 추가 확인 사항

### 로컬 Git 상태 확인
터미널에서 확인:
```bash
git branch
git remote -v
git log --oneline -1
```

### Cloudflare에서 확인할 것들
1. **저장소 이름**: `bunz5911/R` (정확히 일치하는지)
2. **브랜치 이름**: `main` (master가 아닌지)
3. **GitHub 연결**: 정상적으로 연결되어 있는지

---

## 🚀 빠른 해결 체크리스트

다음 순서로 확인하세요:

1. [ ] **브랜치 이름 확인**: Production branch가 `main`인지 확인
2. [ ] **저장소 Public 확인**: GitHub에서 저장소가 Public인지 확인
3. [ ] **GitHub 권한 확인**: Cloudflare에 Private 저장소 접근 권한이 있는지 확인
4. [ ] **저장소 재연결**: 필요하면 저장소 연결 해제 후 재연결
5. [ ] **빌드 재시도**: "Retry build" 클릭

---

## 💡 가장 빠른 해결책

**1단계: 브랜치 확인**
- Cloudflare Pages 설정에서 Production branch가 `main`인지 확인

**2단계: 저장소 Public으로 변경**
- GitHub 저장소를 Public으로 변경 (가장 확실한 방법)

**3단계: 재배포**
- Cloudflare에서 "Retry build" 클릭

---

## 🆘 여전히 문제가 있다면

빌드 로그의 전체 에러 메시지를 확인하세요:

1. Cloudflare Pages 프로젝트
2. **"Deployments"** 탭
3. 실패한 배포 클릭
4. **"Build log"** 섹션의 전체 로그 확인

특히 다음 메시지를 찾아보세요:
- `Repository not found`
- `Branch not found`
- `Permission denied`
- `Authentication failed`

정확한 에러 메시지를 알려주시면 더 구체적인 해결 방법을 제시하겠습니다.

