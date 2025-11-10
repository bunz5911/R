# 🔒 보안 가이드

## ⚠️ 절대 Git에 커밋하면 안 되는 파일

다음 파일들에는 **민감한 API 키와 비밀 정보**가 포함되어 있으므로 절대 Git에 커밋하면 안 됩니다:

### 🚫 커밋 금지 파일 목록

1. **`start_server.sh`** - 모든 API 키 포함
   - ElevenLabs API Key
   - Gemini API Key
   - Supabase URL/Key
   - Google Cloud Credentials

2. **`cloudtext2speechapi.json`** - Google Cloud 서비스 계정 Private Key

3. **`.env`** - 환경 변수 파일

4. **`*.key`, `*.pem`** - 기타 인증서 및 비밀 키

---

## ✅ 안전하게 설정하는 방법

### 1단계: 예제 파일 복사

```bash
cp start_server.sh.example start_server.sh
```

### 2단계: API 키 입력

`start_server.sh` 파일을 열어서 `YOUR_KEY_HERE` 부분을 실제 API 키로 변경하세요.

```bash
export ELEVENLABS_API_KEY="sk_실제_키를_여기에"
export GEMINI_API_KEY="AIzaSy실제_키를_여기에"
export SUPABASE_URL="https://실제_url.supabase.co"
export SUPABASE_KEY="실제_키를_여기에"
```

### 3단계: 권한 설정

```bash
chmod +x start_server.sh
```

### 4단계: 서버 실행

```bash
./start_server.sh
```

---

## 🔍 .gitignore 확인

다음 내용이 `.gitignore`에 포함되어 있는지 확인하세요:

```gitignore
# API 키 및 민감 정보
.env
.env.*
start_server.sh
cloudtext2speechapi.json
*_api_key*
*credentials*.json
*.pem
*.key
```

---

## 🚨 만약 실수로 API 키를 커밋했다면?

### 즉시 해야 할 일:

1. **API 키 즉시 폐기**
   - [ElevenLabs Settings](https://elevenlabs.io/app/settings/api-keys)
   - [Google AI Studio](https://aistudio.google.com/app/apikey)
   - [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - [Supabase Settings](https://supabase.com/dashboard/project/_/settings/api)

2. **Git History에서 완전히 제거**
   ```bash
   # BFG Repo-Cleaner 사용 (권장)
   brew install bfg
   bfg --delete-files cloudtext2speechapi.json
   bfg --delete-files start_server.sh
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   ```

3. **새 API 키 발급**

4. **Force Push (주의!)**
   ```bash
   git push origin main --force
   ```

---

## 📚 API 키 발급 방법

### 1. ElevenLabs (TTS)
1. https://elevenlabs.io 가입
2. Settings → API Keys → Create API Key
3. 무료: 10,000자/월, 유료: 무제한

### 2. Google Gemini (AI 분석)
1. https://aistudio.google.com 접속
2. Get API Key → Create API Key
3. 무료: 분당 60회 요청

### 3. Google Cloud TTS (선택)
1. https://console.cloud.google.com
2. APIs & Services → Credentials
3. Create Service Account → Download JSON
4. JSON 파일을 `cloudtext2speechapi.json`로 저장

### 4. Supabase (데이터베이스)
1. https://supabase.com 가입
2. New Project 생성
3. Settings → API → URL, service_role key 복사

---

## ✨ 보안 체크리스트

- [ ] `start_server.sh`가 `.gitignore`에 포함되어 있나요?
- [ ] `cloudtext2speechapi.json`이 `.gitignore`에 포함되어 있나요?
- [ ] API 키가 코드에 하드코딩되어 있지 않나요?
- [ ] `.env` 파일이 `.gitignore`에 포함되어 있나요?
- [ ] `start_server.sh.example`에는 실제 키가 없나요?
- [ ] GitHub에 private key가 노출되지 않았나요?

---

## 📞 문제 발생 시

보안 문제를 발견했다면:
1. 즉시 관련 API 키를 폐기하세요
2. Git history를 정리하세요
3. 새로운 키를 발급하세요
4. 이 가이드를 따라 다시 설정하세요

**기억하세요: API 키는 절대 Git에 커밋하지 마세요!** 🔒

