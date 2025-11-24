# Cloudflare Pages Git Clone 에러 해결 가이드

## 🔴 문제: "Cloning git repository" 단계에서 실패

빌드 로그에서 "Cloning git repository" 단계에서 실패하는 경우, Git 저장소 접근 권한 문제일 가능성이 높습니다.

---

## ✅ 해결 방법

### 방법 1: GitHub 저장소 연결 확인 (가장 흔한 원인)

#### 1.1 GitHub 저장소가 Public인지 확인

1. GitHub에서 저장소 접속: `https://github.com/bunz5911/R`
2. 저장소가 **Public**인지 확인
   - Public: ✅ 문제 없음
   - Private: ⚠️ Cloudflare에 권한 부여 필요

#### 1.2 Private 저장소인 경우 권한 부여

1. Cloudflare Pages 프로젝트 설정으로 이동
2. **"Settings"** → **"Builds & deployments"** 탭
3. **"Connected Git repository"** 섹션 확인
4. **"Manage GitHub access"** 또는 **"Reconnect"** 클릭
5. GitHub 인증 및 저장소 접근 권한 부여
6. 저장소 선택: `bunz5911/R`
7. **"Save"** 클릭
8. **"Retry build"** 클릭

---

### 방법 2: 저장소 URL 확인

#### 2.1 저장소 이름 확인

현재 설정된 저장소: `bunz5911/R`

올바른 저장소 이름인지 확인:
1. GitHub에서 실제 저장소 이름 확인
2. 저장소 이름이 다르면 수정 필요

#### 2.2 저장소 URL 수정

1. 프로젝트 설정 → **"Builds & deployments"** 탭
2. **"Connected Git repository"** 섹션
3. **"Disconnect"** 클릭
4. **"Connect to Git"** 클릭
5. GitHub 계정 재연결
6. 올바른 저장소 선택
7. **"Save"** 클릭

---

### 방법 3: GitHub OAuth 권한 확인

#### 3.1 Cloudflare GitHub 권한 확인

1. GitHub → **Settings** → **Applications** → **Authorized OAuth Apps**
2. **Cloudflare** 앱 찾기
3. 권한 확인:
   - ✅ **Repository access** 권한이 있는지 확인
   - ✅ **Private repositories** 접근 권한이 있는지 확인

#### 3.2 권한이 없는 경우

1. Cloudflare Pages 프로젝트 설정
2. **"Connected Git repository"** 섹션
3. **"Manage GitHub access"** 클릭
4. GitHub에서 권한 부여
5. **"Authorize Cloudflare"** 클릭
6. 저장소 접근 권한 선택
7. **"Save"** 클릭

---

### 방법 4: 저장소를 Public으로 변경 (가장 간단한 해결책)

#### 4.1 GitHub에서 저장소 Public으로 변경

1. GitHub 저장소 접속: `https://github.com/bunz5911/R`
2. **"Settings"** 탭 클릭
3. 맨 아래로 스크롤
4. **"Danger Zone"** 섹션 찾기
5. **"Change visibility"** 클릭
6. **"Change to public"** 선택
7. 저장소 이름 입력하여 확인
8. **"I understand, change repository visibility"** 클릭

#### 4.2 Cloudflare에서 재배포

1. Cloudflare Pages 프로젝트로 이동
2. **"Retry build"** 클릭
3. 배포 성공 확인

---

## 🔍 추가 확인 사항

### 저장소 존재 확인

터미널에서 확인:
```bash
cd /Users/hongbeomseog/Desktop/RAKorean
git remote -v
```

출력 예시:
```
origin  https://github.com/bunz5911/R.git (fetch)
origin  https://github.com/bunz5911/R.git (push)
```

저장소 URL이 올바른지 확인하세요.

### Git 상태 확인

```bash
git status
git log --oneline -5
```

최신 커밋이 있는지 확인하세요.

---

## 🚀 빠른 해결 체크리스트

빌드 에러 해결 순서:

1. [ ] GitHub 저장소가 Public인지 확인
2. [ ] Cloudflare GitHub 연결 확인
3. [ ] 저장소 이름이 올바른지 확인 (`bunz5911/R`)
4. [ ] GitHub OAuth 권한 확인
5. [ ] Cloudflare에서 "Retry build" 클릭

---

## 💡 권장 해결 방법

**가장 빠른 해결책:**
1. 저장소를 Public으로 변경 (위의 방법 4)
2. Cloudflare에서 "Retry build" 클릭

**Private 저장소를 유지하려면:**
1. Cloudflare GitHub 권한 부여 (위의 방법 1, 3)
2. 저장소 접근 권한 확인
3. "Retry build" 클릭

---

## 🆘 여전히 문제가 있다면

빌드 로그의 정확한 에러 메시지를 확인하세요:

1. Cloudflare Pages 프로젝트
2. **"Deployments"** 탭
3. 실패한 배포 클릭
4. **"Build log"** 섹션 확장
5. "Cloning git repository" 단계의 에러 메시지 확인

일반적인 에러 메시지:
- `Repository not found`: 저장소 이름이 잘못되었거나 접근 권한 없음
- `Permission denied`: GitHub 권한 문제
- `Authentication failed`: GitHub 연결 문제

정확한 에러 메시지를 알려주시면 더 구체적인 해결 방법을 제시하겠습니다.

