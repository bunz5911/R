# GitHub에서 LFS 파일 제거 방법

## 🔴 문제

GitHub에 이미 LFS로 추적된 파일이 있어서, `.gitattributes`와 `.gitignore`만 수정해서는 해결되지 않습니다.

## ✅ 해결 방법: GitHub에서 LFS 파일 직접 제거

### 방법 1: GitHub 웹에서 직접 제거 (가장 확실함)

#### Step 1: GitHub 저장소 접속
1. 브라우저에서 접속: `https://github.com/bunz5911/R`
2. `audio/full-stories/` 폴더로 이동

#### Step 2: 각 MP3 파일 삭제
1. 각 MP3 파일 클릭 (예: `story-0.mp3`)
2. 파일 페이지에서 오른쪽 상단의 **"Delete"** 버튼 클릭
3. 커밋 메시지 입력:
   ```
   fix: LFS 파일 제거 - Cloudflare Pages 배포를 위해
   ```
4. **"Commit changes"** 클릭

#### Step 3: 모든 오디오 파일 삭제
- `story-0.mp3`부터 `story-50.mp3`까지 모든 파일을 위와 같이 삭제
- 또는 폴더 전체를 삭제할 수 있다면 폴더 삭제

---

### 방법 2: Git 명령어로 제거 (고급)

로컬에서 실행:

```bash
cd /Users/hongbeomseog/Desktop/RAKorean

# GitHub에서 LFS 파일 제거 (로컬 파일은 유지)
git rm --cached audio/full-stories/*.mp3

# 커밋
git commit -m "fix: GitHub에서 LFS 파일 제거"

# 푸시
git push origin main
```

**⚠️ 주의**: 이 방법은 GitHub의 LFS 파일을 제거하지만, 로컬 파일은 유지됩니다.

---

### 방법 3: Git LFS 완전히 제거

```bash
cd /Users/hongbeomseog/Desktop/RAKorean

# Git LFS 제거
git lfs uninstall

# LFS 추적 제거
git lfs untrack "audio/full-stories/*.mp3"

# GitHub에서 LFS 파일 제거
git rm --cached audio/full-stories/*.mp3

# 커밋
git commit -m "fix: Git LFS 완전히 제거"

# 푸시
git push origin main
```

---

## 🚀 가장 빠른 해결 방법

### Step 1: GitHub 웹에서 파일 삭제

1. `https://github.com/bunz5911/R/tree/main/audio/full-stories` 접속
2. 각 MP3 파일 클릭
3. **"Delete"** 버튼 클릭
4. 커밋 메시지 입력 후 삭제 확인

### Step 2: Cloudflare Pages 재배포

1. Cloudflare Pages 프로젝트로 이동
2. **"Retry build"** 클릭
3. 배포 성공 확인

---

## 📋 체크리스트

- [ ] GitHub 저장소에서 `audio/full-stories/` 폴더 확인
- [ ] 각 MP3 파일 삭제 (또는 폴더 전체 삭제)
- [ ] 삭제 커밋 완료
- [ ] Cloudflare Pages에서 재배포
- [ ] 배포 성공 확인

---

## 💡 참고사항

### 오디오 파일이 없어도 앱은 작동합니다:

`app.js` 코드를 보면:
- 오디오 파일이 없으면 TTS로 실시간 생성
- 또는 사용자에게 안내 메시지 표시

따라서 오디오 파일을 Git에서 제거해도 앱은 정상 작동합니다!

---

## ✅ 완료 후

1. GitHub에서 모든 오디오 파일 삭제
2. Cloudflare Pages에서 재배포
3. 배포 성공 확인

이제 Git LFS 예산 문제 없이 배포할 수 있습니다!

