# -*- coding: utf-8 -*-
"""
데모용 분석 데이터 생성 (3개 동화만)
빠른 테스트 및 SM 미팅 데모용

실행 방법:
GEMINI_API_KEY='your_key' python generate_demo_analysis.py
"""

import os
import sys
import json
from datetime import datetime
from docx import Document
from google import genai
from google.genai import types

# Gemini 클라이언트 초기화
api_key = os.environ.get('GEMINI_API_KEY')
if not api_key:
    print("❌ GEMINI_API_KEY 환경변수가 설정되지 않았습니다.")
    sys.exit(1)

client = genai.Client(api_key=api_key)
print("✅ Gemini API 클라이언트 초기화 성공\n")

# 동화 폴더
DOC_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'stories')

def load_docx_file(file_path):
    """docx 파일 읽기"""
    try:
        doc = Document(file_path)
        paragraphs = []
        for para in doc.paragraphs:
            if para.text.strip():
                paragraphs.append(para.text.strip())
        return '\n\n'.join(paragraphs)
    except Exception as e:
        print(f"❌ 파일 읽기 오류: {e}")
        return ""

def analyze_story(title, content, level):
    """Gemini로 동화 분석"""
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
        print(f"  ❌ 분석 오류: {e}")
        return None

def main():
    """메인 실행"""
    print("="*80)
    print("🚀 데모용 분석 데이터 생성 (3개 동화)")
    print("="*80)
    print(f"📅 시작: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    # 데모용 동화 3개 선택
    demo_stories = [
        "강아지 닥스훈트.docx",    # 감동적
        "숲.docx",                  # 차분한
        "희망.docx"                 # 희망적
    ]
    
    analysis_data = {}
    levels = ['초급', '중급', '고급']
    
    for idx, filename in enumerate(demo_stories, 1):
        file_path = os.path.join(DOC_FOLDER, filename)
        title = filename[:-5]
        
        print(f"\n[{idx}/3] 📖 {title}")
        print("-"*60)
        
        content = load_docx_file(file_path)
        if not content:
            print(f"  ⚠️ 내용이 비어있습니다.")
            continue
        
        analysis_data[title] = {}
        
        for level in levels:
            print(f"  🎯 {level}...", end=' ', flush=True)
            result = analyze_story(title, content, level)
            
            if result:
                analysis_data[title][level] = result
                print(f"✅")
            else:
                print(f"❌")
    
    # 저장
    output_file = 'analysis_data.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(analysis_data, f, ensure_ascii=False, indent=2)
    
    print("\n" + "="*80)
    print("✅ 데모 분석 완료!")
    print("="*80)
    print(f"💾 파일: {output_file}")
    print(f"📊 동화: {len(analysis_data)}개")
    print(f"📅 종료: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)

if __name__ == '__main__':
    main()

