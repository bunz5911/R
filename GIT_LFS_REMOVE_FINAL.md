# Git LFS 파일 완전히 제거 가이드

## 🔴 문제

GitHub에 이미 LFS로 추적된 파일이 있어서, `.gitattributes`만 수정해서는 해결되지 않습니다.

## ✅ 해결 방법: GitHub에서 LFS 파일 제거

### 방법 1: Git에서 파일 제거 (권장)

로컬에서 다음 명령어 실행:

```bash
cd /Users/hongbeomseog/Desktop/RAKorean

# Git LFS 추적 제거
git lfs untrack "audio/full-stories/*.mp3"

# .gitattributes와 .gitignore 변경사항 스테이징
git add .gitattributes .gitignore

# GitHub에서 LFS 파일 제거 (로컬 파일은 유지)
# 주의: 이 명령어는 GitHub의 LFS 파일을 제거합니다
git rm --cached audio/full-stories/*.mp3 2>/dev/null || echo "파일이 이미 제거되었거나 없습니다"

# 변경사항 커밋
git commit -m "fix: Git LFS 제거 및 오디오 파일을 Git에서 제외 - Cloudflare Pages 배포를 위해"

# GitHub에 푸시
git push origin main
```

### 방법 2: GitHub 웹에서 직접 제거

1. GitHub 저장소 접속: `https://github.com/bunz5911/R`
2. `audio/full-stories/` 폴더로 이동
3. 각 MP3 파일 클릭
4. 파일 페이지에서 **"Delete"** 버튼 클릭
5. 커밋 메시지 입력 후 삭제 확인

### 방법 3: .gitignore만 사용 (가장 간단)

이미 `.gitignore`에 추가했으므로:
1. 변경사항 커밋 및 푸시
2. Cloudflare Pages에서 재배포
3. 배포 시 오디오 파일은 무시됨

---

## 🚀 빠른 해결 (권장)

터미널에서 실행:

```bash
cd /Users/hongbeomseog/Desktop/RAKorean

# Git LFS 추적 제거
git lfs untrack "audio/full-stories/*.mp3" 2>/dev/null || true

# 변경사항 스테이징
git add .gitattributes .gitignore

# 커밋
git commit -m "fix: Git LFS 제거 및 오디오 파일을 Git에서 제외 - Cloudflare Pages 배포를 위해"

# GitHub에 푸시
git push origin main
```

---

## 📋 체크리스트

- [ ] `.gitattributes` 파일에서 LFS 추적 제거됨
- [ ] `.gitignore`에 오디오 파일 추가됨
- [ ] 변경사항 커밋 및 푸시
- [ ] Cloudflare Pages에서 재배포
- [ ] 배포 성공 확인

---

## 💡 참고사항

### 오디오 파일 처리:

오디오 파일을 Git에서 제외했으므로:
- Cloudflare Pages 배포 시 오디오 파일은 포함되지 않습니다
- 앱에서는 TTS로 실시간 생성하거나
- 별도 CDN/스토리지에서 제공해야 합니다

### 현재 코드 확인:

`app.js`를 보면 오디오 파일이 없을 때 TTS로 fallback하는 로직이 있습니다:
- 파일이 없으면 TTS로 실시간 생성
- 또는 사용자에게 안내 메시지 표시

따라서 오디오 파일을 Git에서 제외해도 앱은 정상 작동합니다!

---

## ✅ 완료 후

1. 위 명령어 실행
2. GitHub에 푸시
3. Cloudflare Pages에서 재배포
4. 배포 성공 확인

이제 Git LFS 예산 문제 없이 배포할 수 있습니다!

