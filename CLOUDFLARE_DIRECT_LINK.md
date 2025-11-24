# Cloudflare Pages Settings 직접 링크

## 🔗 직접 링크

### 방법 1: 대시보드에서 시작 (가장 확실함)
```
https://dash.cloudflare.com
```

1. 이 링크로 접속
2. 로그인
3. 왼쪽 사이드바에서 **"Workers & Pages"** 클릭
4. 상단 탭에서 **"Pages"** 선택
5. **"rakorean"** 프로젝트 클릭
6. 상단 탭에서 **"Settings"** 클릭

---

### 방법 2: Pages 프로젝트 목록 직접 링크
```
https://dash.cloudflare.com/?to=/:account/pages
```

이 링크로 접속하면 Pages 프로젝트 목록으로 바로 이동합니다.

---

### 방법 3: 프로젝트 Settings 직접 링크 (계정 ID 필요)

**⚠️ 주의**: 아래 링크에서 `[account-id]`를 실제 계정 ID로 바꿔야 합니다.

```
https://dash.cloudflare.com/[account-id]/pages/view/rakorean/settings
```

**계정 ID 확인 방법:**
1. Cloudflare 대시보드 접속
2. 오른쪽 하단 또는 프로필 메뉴에서 Account ID 확인
3. 위 링크의 `[account-id]` 부분을 실제 ID로 교체

---

## 🚀 가장 빠른 방법

1. **대시보드 접속**: `https://dash.cloudflare.com`
2. **검색창 사용**: 상단 검색창에 "rakorean" 입력
3. **프로젝트 선택**: 검색 결과에서 "rakorean" 클릭
4. **Settings 탭**: 상단 탭에서 "Settings" 클릭

---

## 💡 빠른 접근 스크립트

브라우저 콘솔에서 실행 (F12 → Console):

```javascript
// Pages 프로젝트 목록으로 이동
window.location.href = 'https://dash.cloudflare.com/?to=/:account/pages';
```

또는:

```javascript
// 검색으로 프로젝트 찾기
window.location.href = 'https://dash.cloudflare.com';
// 그 다음 검색창에 "rakorean" 입력
```

