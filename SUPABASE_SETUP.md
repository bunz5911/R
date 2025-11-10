# Supabase 연동 가이드

## 1단계: Supabase 프로젝트 생성

1. https://supabase.com 접속
2. "Start your project" 또는 "New Project" 클릭
3. 프로젝트 정보 입력:
   - **Name**: RAKorean (또는 원하는 이름)
   - **Database Password**: 안전한 비밀번호 입력 (잘 보관!)
   - **Region**: Northeast Asia (Seoul) 선택 (한국 사용자용)
4. "Create new project" 클릭 (약 2분 소요)

---

## 2단계: API 키 확인

프로젝트 생성 후:

1. 좌측 메뉴에서 **Settings** (⚙️) 클릭
2. **API** 메뉴 클릭
3. 다음 정보 복사:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public** key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (프론트엔드용)
   - **service_role** key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (백엔드용, 비밀!)

⚠️ **주의**: `service_role` 키는 절대 클라이언트에 노출하면 안 됩니다!

---

## 3단계: 데이터베이스 스키마 생성

1. 좌측 메뉴에서 **SQL Editor** 클릭
2. "New query" 클릭
3. `supabase_schema.sql` 파일의 내용을 복사해서 붙여넣기
4. "Run" 버튼 클릭 (또는 Cmd+Enter)
5. 성공 메시지 확인

---

## 4단계: 환경변수 설정

### 로컬 개발 환경

`start_server.sh` 파일을 열어 다음 줄의 주석을 제거하고 실제 값으로 변경:

```bash
# 주석 제거하고 실제 값 입력
export SUPABASE_URL="https://your-project-id.supabase.co"
export SUPABASE_KEY="your-service-role-key-here"
```

### 배포 환경 (Render)

Render 대시보드에서:
1. 서비스 선택
2. "Environment" 탭
3. "Add Environment Variable" 클릭
4. 다음 변수 추가:
   - `SUPABASE_URL`: `https://xxxxx.supabase.co`
   - `SUPABASE_KEY`: `service_role_key`

---

## 5단계: 서버 재시작

```bash
pkill -f "python app.py"
./start_server.sh
```

헬스 체크 확인:
```bash
curl http://localhost:8080/health
```

`"supabase": true`가 나오면 성공!

---

## 6단계: 슈퍼바이저 계정 설정

1. 브라우저에서 앱 접속
2. `bunz5911@gmail.com`으로 회원가입
3. Supabase 대시보드 > **Table Editor** > **profiles** 테이블
4. 해당 계정 찾아서 수동으로 수정:
   - `role`: `supervisor`
   - `plan`: `premier`
   - `coins`: `999999`

---

## 완료!

이제 다음 기능이 활성화됩니다:
- ✅ 코인 시스템 (Supabase 동기화)
- ✅ 학습 진도 저장
- ✅ 출석 체크 & 스트릭
- ✅ 단어장 저장
- ✅ 사용자 통계

---

## 문제 해결

### "supabase": false로 나오는 경우
1. 환경변수가 제대로 설정되었는지 확인
2. `pip install supabase` 실행 확인
3. 서버 재시작

### RLS 정책 오류
- SQL Editor에서 정책을 다시 실행
- 또는 Supabase 대시보드 > Authentication > Policies에서 수동 설정

