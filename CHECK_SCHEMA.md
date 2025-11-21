# 커뮤니티 게시판 스키마 확인 체크리스트

## ✅ 메뉴 구조 확인
- [x] index.html: study, grammar, culture, meet-up, k-content (5개)
- [x] 각 메뉴의 data-view 속성이 올바르게 설정됨

## ✅ 코드 매핑 확인
- [x] renderView: case 'study', 'grammar', 'culture', 'meet-up', 'k-content'
- [x] handleCreatePost: allowedCategories에 5개 모두 포함
- [x] mapCategoryToTag: 각 카테고리 → 태그 매핑 정확
- [x] renderFeed: 각 카테고리별 필터링 정확

## ✅ 데이터베이스 스키마 확인
- [x] SQL 스키마: 5개 카테고리만 허용
- [x] 기존 데이터 마이그레이션 포함
- [x] 실행 가능한 SQL 구문

## 📋 실행 순서

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard 접속
   - 프로젝트 선택

2. **SQL Editor 열기**
   - 왼쪽 메뉴에서 "SQL Editor" 클릭
   - "New query" 클릭

3. **스키마 실행**
   - `update_category_schema.sql` 파일의 내용을 복사
   - SQL Editor에 붙여넣기
   - "Run" 버튼 클릭

4. **결과 확인**
   - 마지막 SELECT 쿼리 결과 확인
   - 각 카테고리별 게시글 수 확인

## ⚠️ 주의사항

- 기존 데이터가 있다면 마이그레이션이 자동으로 실행됩니다
- 'sentences' → 'study'
- 'speaking' → 'meet-up'
- 'kcontent' → 'k-content'
- 'tips' → 'study'

## ✅ 실행 후 확인사항

1. 각 게시판에서 글 작성 테스트
2. 작성한 글이 올바른 태그로 표시되는지 확인
3. 각 게시판에서 해당 카테고리의 글만 보이는지 확인

