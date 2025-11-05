# 🔐 보안 설정 가이드

## ⚠️ 중요: API 키 보안

이 프로젝트는 민감한 API 키를 사용합니다. **절대 Git에 올리지 마세요!**

---

## 🚀 빠른 시작

### 1. API 키 발급

#### Gemini API (무료)
1. https://aistudio.google.com/app/apikey 접속
2. **Create API Key** 클릭
3. 키 복사 → 안전한 곳에 저장

#### ElevenLabs API (무료 티어)
1. https://elevenlabs.io/app/settings/api-keys 접속
2. **Generate** 클릭
3. 키 복사 → 안전한 곳에 저장

---

### 2. 서버 시작 스크립트 설정

```bash
# 1. 템플릿 복사
cp start_server.sh.example start_server.sh

# 2. start_server.sh 파일 열기
nano start_server.sh
# 또는
code start_server.sh

# 3. YOUR_KEY_HERE를 실제 API 키로 변경
export ELEVENLABS_API_KEY="실제_ElevenLabs_키"
export GEMINI_API_KEY="실제_Gemini_키"

# 4. 저장 후 실행
chmod +x start_server.sh
./start_server.sh
```

---

### 3. .env 파일 사용 (권장)

```bash
# 1. .env 파일 생성
cat > .env << EOF
ELEVENLABS_API_KEY=실제_ElevenLabs_키
GEMINI_API_KEY=실제_Gemini_키
EOF

# 2. python-dotenv 설치
pip install python-dotenv

# 3. 서버 실행
python app.py
```

---

## 🛡️ 보안 체크리스트

- [ ] `.gitignore`에 `start_server.sh` 추가됨
- [ ] `.gitignore`에 `.env` 추가됨
- [ ] 실제 API 키는 로컬에만 존재
- [ ] Git 커밋 전 `git diff` 확인
- [ ] 공개 저장소에 키 노출 여부 확인

---

## 🚨 API 키가 노출된 경우

### 즉시 조치:

1. **키 즉시 삭제/재발급**
   - Google AI Studio → API 키 삭제
   - ElevenLabs → API 키 삭제

2. **Git 히스토리에서 제거**
   ```bash
   # BFG Repo-Cleaner 사용 (강력 권장)
   brew install bfg
   bfg --replace-text passwords.txt
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   git push --force
   ```

3. **새 키 발급 및 안전하게 설정**

---

## 🌐 Render.com 배포

환경변수는 **Render.com 대시보드**에서만 설정:

1. https://dashboard.render.com
2. Environment 탭
3. 환경변수 추가:
   - `ELEVENLABS_API_KEY`
   - `GEMINI_API_KEY`

**절대 코드에 포함하지 마세요!**

---

## ✅ 안전한 작업 흐름

```
개발:
.env 파일 (로컬) → 절대 Git에 올리지 않음

배포:
Render.com 환경변수 → 대시보드에서만 설정

공유:
start_server.sh.example → 템플릿만 공유
```

---

## 📚 참고 자료

- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [.gitignore 가이드](https://git-scm.com/docs/gitignore)
- [환경변수 관리 Best Practices](https://12factor.net/config)

---

**보안은 항상 최우선입니다!** 🔐

