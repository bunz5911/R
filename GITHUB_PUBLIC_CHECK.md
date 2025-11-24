# GitHub 저장소 Public/Private 확인 방법

## 🔍 방법 1: 저장소 페이지에서 직접 확인 (가장 빠름)

### Step 1: 저장소 접속
1. 브라우저에서 다음 URL 접속:
   ```
   https://github.com/bunz5911/R
   ```

### Step 2: 저장소 상단 확인
저장소 페이지 상단 오른쪽을 확인하세요:

**Public 저장소인 경우:**
```
[🔓 Public]  [⭐ Star]  [🍴 Fork]
```
- 🔓 **Public** 배지가 보임
- 초록색 또는 파란색 배지

**Private 저장소인 경우:**
```
[🔒 Private]  [⭐ Star]  [🍴 Fork]
```
- 🔒 **Private** 배지가 보임
- 회색 배지

---

## 🔍 방법 2: Settings에서 확인 (더 정확함)

### Step 1: Settings 탭 접속
1. 저장소 페이지: `https://github.com/bunz5911/R`
2. 상단 탭 메뉴에서 **"Settings"** 클릭
   - 탭 순서: Code | Issues | Pull requests | Actions | Projects | Wiki | Security | Insights | **Settings**

### Step 2: General 설정 확인
Settings 페이지에서:
1. 왼쪽 사이드바에서 **"General"** 클릭 (기본적으로 선택되어 있음)
2. 페이지 맨 아래로 스크롤
3. **"Danger Zone"** 섹션 찾기

### Step 3: Visibility 확인
**"Danger Zone"** 섹션에서:

**Public 저장소인 경우:**
```
Change repository visibility
Make this repository private
```
- "Make this repository private" 버튼이 보임
- → 현재 Public 상태

**Private 저장소인 경우:**
```
Change repository visibility
Make this repository public
```
- "Make this repository public" 버튼이 보임
- → 현재 Private 상태

---

## 🔍 방법 3: URL로 확인 (로그아웃 상태에서)

### Step 1: GitHub에서 로그아웃
1. GitHub 우측 상단 프로필 아이콘 클릭
2. **"Sign out"** 클릭

### Step 2: 저장소 접속 시도
1. 브라우저에서 접속: `https://github.com/bunz5911/R`

**Public 저장소인 경우:**
- ✅ 저장소 페이지가 정상적으로 보임
- 코드, 파일 등 모든 내용이 보임

**Private 저장소인 경우:**
- ❌ "404 - Page not found" 또는 "This repository is private" 메시지
- 로그인하라는 메시지가 보임

---

## 🔍 방법 4: GitHub API로 확인 (고급)

터미널에서 확인:
```bash
curl -s https://api.github.com/repos/bunz5911/R | grep '"private"'
```

**Public 저장소인 경우:**
```
"private": false
```

**Private 저장소인 경우:**
```
"private": true
```

---

## 📝 요약: 가장 빠른 확인 방법

1. **브라우저에서 접속**: `https://github.com/bunz5911/R`
2. **저장소 상단 오른쪽 확인**:
   - 🔓 **Public** → Public 저장소 ✅
   - 🔒 **Private** → Private 저장소 ⚠️

---

## 🔄 Public으로 변경하는 방법 (Private인 경우)

만약 Private로 확인되면:

1. 저장소 페이지 → **Settings** 탭
2. 맨 아래 **"Danger Zone"** 섹션
3. **"Change repository visibility"** 클릭
4. **"Change to public"** 선택
5. 저장소 이름 `bunz5911/R` 입력
6. **"I understand, change repository visibility"** 클릭

---

## ✅ 확인 후 다음 단계

**Public으로 확인된 경우:**
- Cloudflare Pages 설정에서 다른 원인 확인
- Production branch가 `main`인지 확인
- "Retry build" 클릭

**Private으로 확인된 경우:**
- 위의 방법으로 Public으로 변경
- 또는 Cloudflare에 GitHub 권한 부여

