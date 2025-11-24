# Git LFS 예산 초과 문제 해결 가이드

## 🔴 문제

GitHub LFS 예산을 초과하여 Cloudflare Pages 배포가 실패했습니다:
```
Error: This repository exceeded its LFS budget
```

## ✅ 해결 방법

### 방법 1: Git LFS 추적 제거 (권장)

`.gitattributes` 파일에서 LFS 추적을 제거했습니다.

#### 다음 단계:

1. **Git LFS에서 파일 제거** (로컬에서 실행):
```bash
cd /Users/hongbeomseog/Desktop/RAKorean
git lfs untrack "audio/full-stories/*.mp3"
git add .gitattributes
git commit -m "fix: Git LFS 추적 제거 - Cloudflare Pages 배포를 위해"
```

2. **기존 LFS 파일을 일반 Git으로 변경**:
```bash
# LFS 포인터 파일을 실제 파일로 교체
git lfs migrate export --include="audio/full-stories/*.mp3" --everything
git add audio/full-stories/*.mp3
git commit -m "fix: LFS 파일을 일반 Git으로 변경"
```

3. **GitHub에 푸시**:
```bash
git push origin main --force
```

**⚠️ 주의**: `--force` 옵션은 기존 히스토리를 덮어씁니다. 팀 작업 시 주의하세요.

---

### 방법 2: 오디오 파일을 Git에서 제외 (대안)

오디오 파일이 크다면 Git에서 완전히 제외할 수 있습니다:

1. **`.gitignore`에 추가**:
```
# 오디오 파일 (Git LFS 대신 별도 스토리지 사용)
audio/full-stories/*.mp3
```

2. **Git에서 제거** (히스토리는 유지):
```bash
git rm --cached audio/full-stories/*.mp3
git commit -m "fix: 오디오 파일을 Git에서 제외"
git push origin main
```

3. **별도 스토리지 사용**:
   - Cloudflare R2
   - AWS S3
   - 또는 다른 CDN

---

### 방법 3: GitHub LFS 예산 증가 (유료)

GitHub LFS 예산을 증가시키는 방법:
1. GitHub Settings → Billing
2. Data Pack 구매
3. LFS 예산 증가

하지만 이 방법은 비용이 발생합니다.

---

## 🚀 빠른 해결 방법 (권장)

### Step 1: 로컬에서 실행

터미널에서 다음 명령어 실행:

```bash
cd /Users/hongbeomseog/Desktop/RAKorean

# Git LFS 추적 제거
git lfs untrack "audio/full-stories/*.mp3"

# .gitattributes 변경사항 커밋
git add .gitattributes
git commit -m "fix: Git LFS 추적 제거 - Cloudflare Pages 배포를 위해"

# GitHub에 푸시
git push origin main
```

### Step 2: Cloudflare Pages에서 재배포

1. Cloudflare Pages 프로젝트로 이동
2. **"Retry build"** 클릭
3. 배포 성공 확인

---

## 📋 체크리스트

- [ ] `.gitattributes` 파일에서 LFS 추적 제거됨
- [ ] `git lfs untrack` 명령어 실행
- [ ] 변경사항 커밋 및 푸시
- [ ] Cloudflare Pages에서 재배포
- [ ] 배포 성공 확인

---

## 💡 참고사항

### 오디오 파일 크기 고려사항:

오디오 파일이 많고 크다면:
- Git 저장소 크기가 커질 수 있습니다
- GitHub 무료 플랜 제한 (100MB 파일 크기 제한)에 걸릴 수 있습니다
- 대안: CDN이나 별도 스토리지 사용 고려

### 현재 상황:

- `.gitattributes` 파일 수정 완료
- 이제 Git LFS 추적이 제거되었습니다
- 다음 커밋부터 일반 Git으로 관리됩니다

---

## 🆘 문제 해결

여전히 문제가 있다면:

1. **Git LFS 완전히 제거**:
```bash
git lfs uninstall
```

2. **저장소에서 LFS 파일 확인**:
```bash
git lfs ls-files
```

3. **모든 LFS 파일 제거**:
```bash
git lfs prune
```

---

## ✅ 완료 후

Git LFS 추적을 제거한 후:
1. 변경사항을 커밋하고 푸시
2. Cloudflare Pages에서 재배포
3. 배포 성공 확인

이제 Git LFS 예산 문제 없이 배포할 수 있습니다!

