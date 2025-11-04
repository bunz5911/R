# -*- coding: utf-8 -*-
"""
분석 데이터 사전 생성 스크립트
50개 동화 × 3레벨 = 150개 분석 결과를 미리 생성하여 JSON 파일로 저장

실행 방법:
python generate_analysis.py

소요 시간: 약 30-60분 (Gemini API 호출 속도에 따라)
"""

import os
import sys
import json
import glob
from datetime import datetime
from docx import Document
from google import genai
from google.genai import types

# Gemini 클라이언트 초기화
try:
    # 환경변수에서 API 키 가져오기
    api_key = os.environ.get('GEMINI_API_KEY')
    
    if not api_key:
        print("❌ GEMINI_API_KEY 환경변수가 설정되지 않았습니다.")
        print("💡 해결 방법:")
        print("   export GEMINI_API_KEY='your_api_key_here'")
        print("   또는")
        print("   GEMINI_API_KEY='your_api_key_here' python generate_analysis.py")
        sys.exit(1)
    
    client = genai.Client(api_key=api_key)
    print("✅ Gemini API 클라이언트 초기화 성공")
except Exception as e:
    print(f"❌ Gemini API 초기화 실패: {e}")
    sys.exit(1)

# 동화 폴더 경로
DOC_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'stories')

def load_docx_file(file_path):
    """docx 파일을 읽어서 텍스트 반환"""
    try:
        doc = Document(file_path)
        paragraphs = []
        for para in doc.paragraphs:
            if para.text.strip():
                paragraphs.append(para.text.strip())
        return '\n\n'.join(paragraphs)
    except Exception as e:
        print(f"❌ 파일 읽기 오류 ({file_path}): {e}")
        return ""

def analyze_story(title, content, level):
    """Gemini를 사용하여 동화 분석"""
    prompt = f"""
{level} 학습자를 위한 동화 분석:

{content}

JSON 형식으로 응답:
{{
  "summary": "동화 전체 내용을 3-4문장으로 요약",
  "paragraphs_analysis": [
    {{
      "paragraph_num": 1,
      "original_text": "원문 전체 (그대로 유지)",
      "practice_text": "{level}에 맞는 연습 텍스트 - 초급: 원문에서 1-2문장 선택, 중급: 원문에서 2-4문장 선택, 고급: 원문의 의미를 유지하되 다른 어휘와 문장 구조로 재구성(패러프레이징)",
      "simplified_text": "{level} 학습자가 이해할 수 있도록 쉽게 바꾼 텍스트",
      "explanation": "이 문단의 의미와 문맥 설명"
    }}
  ],
  "real_life_usage": [
    "이 동화에서 배운 표현이나 단어를 실제 대화에서 사용할 수 있는 {level} 레벨 회화 문장 10개"
  ],
  "vocabulary": [
    {{
      "word": "어려운 단어",
      "meaning": "뜻 설명",
      "example": "예문"
    }}
  ],
  "grammar": [
    {{
      "pattern": "문법 패턴",
      "explanation": "설명",
      "example": "예문"
    }}
  ],
  "key_expressions": [
    "핵심 표현 1",
    "핵심 표현 2",
    "핵심 표현 3"
  ]
}}
"""
    
    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash-exp',
            contents=[prompt],
            config=types.GenerateContentConfig(
                temperature=0.5,
                response_mime_type="application/json"
            )
        )
        
        response_text = response.text.strip()
        if response_text.startswith('```json'):
            response_text = response_text[7:-3].strip()
        elif response_text.startswith('```'):
            response_text = response_text[3:-3].strip()
        
        result = json.loads(response_text)
        return result
        
    except Exception as e:
        print(f"  ❌ Gemini 분석 오류: {e}")
        return None

def main():
    """메인 실행 함수"""
    print("\n" + "="*80)
    print("🚀 동화 분석 데이터 생성 시작")
    print("="*80)
    print(f"📂 동화 폴더: {DOC_FOLDER}")
    print(f"📅 시작 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    # 동화 파일 목록 가져오기
    if not os.path.exists(DOC_FOLDER):
        print(f"❌ 폴더를 찾을 수 없습니다: {DOC_FOLDER}")
        return
    
    doc_files = sorted(glob.glob(os.path.join(DOC_FOLDER, "*.docx")))
    print(f"📚 총 {len(doc_files)}개의 동화 발견\n")
    
    # 분석 결과 저장 딕셔너리
    analysis_data = {}
    levels = ['초급', '중급', '고급']
    
    # 진행 상황 추적
    total_tasks = len(doc_files) * len(levels)
    completed_tasks = 0
    
    # 각 동화 파일 처리
    for idx, doc_path in enumerate(doc_files, 1):
        filename = os.path.basename(doc_path)[:-5]  # .docx 제거
        print(f"\n{'='*80}")
        print(f"[{idx}/{len(doc_files)}] 📖 분석 중: {filename}")
        print(f"{'='*80}")
        
        # 동화 내용 읽기
        content = load_docx_file(doc_path)
        if not content:
            print(f"  ⚠️ 내용이 비어있습니다. 건너뜁니다.")
            continue
        
        analysis_data[filename] = {}
        
        # 각 레벨별로 분석
        for level in levels:
            print(f"\n  🎯 레벨: {level}")
            result = analyze_story(filename, content, level)
            
            if result:
                analysis_data[filename][level] = result
                completed_tasks += 1
                print(f"  ✅ {level} 분석 완료 ({completed_tasks}/{total_tasks})")
                
                # 중간 저장 (데이터 손실 방지)
                with open('analysis_data_temp.json', 'w', encoding='utf-8') as f:
                    json.dump(analysis_data, f, ensure_ascii=False, indent=2)
            else:
                print(f"  ❌ {level} 분석 실패")
                completed_tasks += 1
    
    # 최종 결과 저장
    output_file = 'analysis_data.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(analysis_data, f, ensure_ascii=False, indent=2)
    
    # 임시 파일 삭제
    if os.path.exists('analysis_data_temp.json'):
        os.remove('analysis_data_temp.json')
    
    print("\n" + "="*80)
    print("✅ 모든 분석 완료!")
    print("="*80)
    print(f"📊 총 동화 수: {len(doc_files)}")
    print(f"📊 총 분석 결과: {completed_tasks}/{total_tasks}")
    print(f"💾 저장 파일: {output_file}")
    print(f"📅 종료 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80 + "\n")

if __name__ == '__main__':
    main()

