# K-Context Master: 한국어 동화 학습 앱

AI 기반 한국어 동화 학습 플랫폼

## 🎯 주요 기능

### 8단계 학습 시스템
1. **요약** - AI가 동화 요약
2. **전체듣기** - Google Cloud TTS 음성 재생
3. **문단별학습** - 원문 + 쉬운 표현 + 설명
4. **실생활활용** - 레벨별 10개 회화 문장
5. **어휘문법** - 단어별 발음 듣기
6. **단어장** - 개인 단어 저장/관리
7. **이해도확인** - 15개 AI 퀴즈
8. **성장기록** - 발음 테스트 + AI 피드백

### 기술 스택
- **프론트엔드**: 순수 HTML, CSS, JavaScript
- **백엔드**: Python Flask
- **AI**: Gemini 2.0 Flash (RAG)
- **음성**: Google Cloud TTS (Neural2)
- **데이터베이스**: Supabase (PostgreSQL)
- **배포**: Netlify (프론트) + Render (백엔드)

---

## 🚀 로컬 개발 환경 설정

### 1. 필수 요구사항
```bash
Python 3.8+
pip
```

### 2. 라이브러리 설치
```bash
pip install -r requirements.txt
```

### 3. 환경 변수 설정
`.env` 파일 생성:
```bash
# Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Google Cloud TTS
GOOGLE_APPLICATION_CREDENTIALS=/path/to/cloudtext2speechapi.json

# Supabase (선택사항)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key
```

### 4. 서버 실행
```bash
export GEMINI_API_KEY=your_key
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/cloudtext2speechapi.json
python app.py
```

### 5. 브라우저에서 열기
```
http://localhost:8080/index.html
```

---

## ☁️ 프로덕션 배포

### Step 1: Supabase 설정

1. [Supabase](https://supabase.com) 가입
2. 새 프로젝트 생성
3. SQL Editor에서 `supabase_schema.sql` 실행
4. Settings → API에서 URL과 anon key 복사

### Step 2: Render.com 백엔드 배포

1. [Render.com](https://render.com) 가입
2. New → Web Service
3. GitHub 저장소 연결
4. 설정:
   - Name: `k-context-master-api`
   - Environment: `Python 3`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app:app`
5. Environment Variables 추가:
   ```
   GEMINI_API_KEY=your_key
   GOOGLE_APPLICATION_CREDENTIALS=./cloudtext2speechapi.json
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_KEY=your_anon_key
   PORT=8080
   ```
6. Deploy 클릭

### Step 3: Netlify 프론트엔드 배포

1. [Netlify](https://netlify.com) 가입
2. New site from Git
3. GitHub 저장소 연결
4. 설정:
   - Build command: (비워두기)
   - Publish directory: `.`
5. `netlify.toml` 수정:
   ```toml
   [[redirects]]
     from = "/api/*"
     to = "https://your-app.onrender.com/api/:splat"
   ```
6. Deploy 클릭

### Step 4: app.js API 주소 변경

`app.js` 파일 수정:
```javascript
// 로컬 개발
const API_BASE = 'http://localhost:8080/api';

// 프로덕션
const API_BASE = 'https://your-app.onrender.com/api';
```

---

## 📊 비용 (무료로 시작 가능!)

| 서비스 | 무료 한도 | 가격 |
|--------|-----------|------|
| Netlify | 무제한 | 무료 |
| Render | 750시간/월 | 무료 → $7/월 |
| Supabase | 500MB DB | 무료 → $25/월 |
| Gemini API | 1,500회/일 | 무료 |
| Google TTS | 100만 글자/월 | 무료 |

**예상 비용**: **완전 무료** (개인 사용)

---

## 🗄️ 데이터베이스 구조

### learning_records (학습 기록)
```sql
- user_id: 사용자 ID
- story_id: 동화 번호
- completed_tabs: 완료한 탭 목록
- quiz_score: 퀴즈 점수
- pronunciation_score: 발음 점수
- study_date: 학습 날짜
```

### wordbook (단어장)
```sql
- user_id: 사용자 ID
- word: 단어
- meaning: 뜻
- mastered: 외웠는지 여부
```

---

## 💾 캐싱 시스템

### localStorage 캐싱
- AI 분석 결과를 브라우저에 저장
- 같은 동화 + 같은 레벨 = 즉시 표시 (0초)
- 디자인 레이아웃 100% 일관성 유지

### 캐시 키 형식
```
analysis_[동화ID]_[레벨]
예: analysis_1_초급
```

### 캐시 삭제
개발자 도구 Console에서:
```javascript
localStorage.clear()  // 전체 삭제
```

---

## 🔧 문제 해결

### 서버 연결 안됨
```bash
# 포트 확인
lsof -ti:8080 | xargs kill -9

# 서버 재시작
python app.py
```

### AI 분석 느림
- 최초 1회: 5-10초 (정상)
- 2회차 이후: 0초 (캐시 사용)

### Google TTS 안들림
```bash
pip install google-cloud-texttospeech
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/json
```

---

## 📱 모바일 최적화

- 아이폰 16 Pro Max (430 x 932px)
- 2줄 4열 그리드 탭
- 터치 최적화 45x45 원형 버튼
- PWA 지원 준비

---

## 📞 문의

질문이나 버그 리포트는 Issue로 등록해주세요!

