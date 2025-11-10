# 🔐 API 설정 가이드

이 가이드는 **API 키를 안전하게 관리**하는 방법을 설명합니다.

## ⚠️ 중요: API 키는 절대 Git에 커밋하지 마세요!

---

## 📋 필수 API 키

### 1. ElevenLabs API (TTS 음성 합성)
- **용도**: 읽기 연습, 문단 재생
- **플랜**: Pro ($5/월, 30,000 크레딧)
- **발급**: https://elevenlabs.io/app/settings/api-keys

### 2. Google Gemini API (AI 분석)
- **용도**: 동화 분석, 발음 평가
- **플랜**: 무료 (분당 60회 요청)
- **발급**: https://aistudio.google.com/app/apikey

### 3. Supabase (데이터베이스)
- **용도**: 학습 기록, 코인 시스템
- **플랜**: 무료 (50,000 요청/월)
- **발급**: https://supabase.com/dashboard/project/_/settings/api

---

## 🚀 설정 방법

### 1단계: 템플릿 복사

```bash
cp start_server.sh.example start_server.sh
```

### 2단계: API 키 입력

`start_server.sh` 파일을 열고 실제 API 키를 입력하세요:

```bash
# ElevenLabs (프리미엄 TTS)
export ELEVENLABS_API_KEY="sk_여기에_실제_키를_입력"

# Gemini (동화 분석용)
export GEMINI_API_KEY="AIzaSy여기에_실제_키를_입력"

# Supabase 연동
export SUPABASE_URL="https://여기에_URL입력.supabase.co"
export SUPABASE_KEY="여기에_실제_키를_입력"
```

### 3단계: 실행 권한 부여

```bash
chmod +x start_server.sh
```

### 4단계: 서버 실행

```bash
./start_server.sh
```

---

## 🔒 보안 체크리스트

- [x] `start_server.sh`가 `.gitignore`에 포함되어 있나요?
- [x] `cloudtext2speechapi.json`이 `.gitignore`에 포함되어 있나요?
- [x] API 키가 코드에 하드코딩되어 있지 않나요?
- [x] `.env` 파일이 `.gitignore`에 포함되어 있나요?
- [x] Git 히스토리에 API 키가 없나요?

---

## 🚨 API 키가 노출되었다면?

### 즉시 조치

1. **API 키 즉시 폐기**
   - ElevenLabs: https://elevenlabs.io/app/settings/api-keys
   - Gemini: https://aistudio.google.com/app/apikey
   - Supabase: https://supabase.com/dashboard/project/_/settings/api

2. **새 API 키 발급**

3. **`start_server.sh` 업데이트**

4. **Git 히스토리 정리** (필요시)
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch start_server.sh" \
     --prune-empty --tag-name-filter cat -- --all
   
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   git push origin main --force
   ```

---

## 📊 API 사용량 확인

### ElevenLabs
- 대시보드: https://elevenlabs.io/app/usage
- Pro 플랜: 월 30,000 크레딧
- 크레딧 계산: 1자 = 1 크레딧

### Google Gemini
- 대시보드: https://aistudio.google.com/app/usage
- 무료 플랜: 분당 60회 요청
- 일일 1,500회 요청

### Supabase
- 대시보드: https://supabase.com/dashboard/project/_/settings/billing
- 무료 플랜: 월 50,000 요청
- 500MB 데이터베이스

---

## 💡 팁

### 로컬 개발
- `start_server.sh` 사용
- API 키는 환경 변수로 관리

### 프로덕션 배포 (Render, Heroku 등)
- 플랫폼의 환경 변수 설정 사용
- `start_server.sh`를 배포하지 마세요

### 팀 협업
- `.env.example` 파일에 키 이름만 표시
- 실제 키는 개인적으로 공유
- 절대 Git에 커밋하지 마세요

---

## 📞 문제 발생 시

보안 문제를 발견했다면:
1. 즉시 관련 API 키를 폐기하세요
2. Git history를 정리하세요
3. 새로운 키를 발급하세요
4. 이 가이드를 따라 다시 설정하세요

---

**기억하세요: API 키는 비밀번호입니다. 절대 공유하지 마세요!** 🔐

