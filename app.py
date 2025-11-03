# -*- coding: utf-8 -*-
"""
K-Context Master: 한국어 동화 학습 앱
- 50개 동화 기반 8단계 학습 시스템
- Gemini RAG 기반 분석
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from google import genai
from google.genai import types
from google.cloud import texttospeech
import os
import json
import glob
import re
import io
import base64
from datetime import datetime

# Supabase 연동
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    print("⚠️ supabase 라이브러리가 설치되지 않았습니다.")

try:
    from docx import Document
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False
    print("⚠️ python-docx가 설치되지 않았습니다.")

app = Flask(__name__)
CORS(app)

# Gemini 클라이언트 초기화
try:
    client = genai.Client()
    print("✅ Gemini API 클라이언트 초기화 성공")
except Exception as e:
    client = None
    print(f"❌ Gemini API 클라이언트 초기화 실패: {e}")

# Google Cloud TTS 클라이언트 초기화
tts_client = None
try:
    # 방법 1: 파일 경로에서 읽기 (로컬)
    credentials_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
    if credentials_path and os.path.exists(credentials_path):
        tts_client = texttospeech.TextToSpeechClient()
        print("✅ Google Cloud TTS 클라이언트 초기화 성공 (파일)")
        print(f"   인증 파일: {credentials_path}")
    # 방법 2: 환경변수에서 JSON 직접 읽기 (Render/배포)
    elif os.environ.get('GOOGLE_TTS_JSON'):
        import tempfile
        credentials_json = os.environ.get('GOOGLE_TTS_JSON')
        
        # 임시 파일로 저장
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            f.write(credentials_json)
            temp_path = f.name
        
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = temp_path
        tts_client = texttospeech.TextToSpeechClient()
        print("✅ Google Cloud TTS 클라이언트 초기화 성공 (환경변수)")
    else:
        print("⚠️ Google Cloud TTS 인증 정보가 없습니다.")
        print("   → Web Speech API를 대체로 사용합니다.")
except Exception as e:
    tts_client = None
    print(f"⚠️ Google Cloud TTS 초기화 실패: {e}")
    print("   → Web Speech API를 대체로 사용합니다.")

# Supabase 클라이언트 초기화
supabase_client = None
if SUPABASE_AVAILABLE:
    supabase_url = os.environ.get('SUPABASE_URL')
    supabase_key = os.environ.get('SUPABASE_KEY')
    if supabase_url and supabase_key:
        try:
            supabase_client = create_client(supabase_url, supabase_key)
            print("✅ Supabase 클라이언트 초기화 성공")
        except Exception as e:
            print(f"⚠️ Supabase 초기화 실패: {e}")
    else:
        print("⚠️ SUPABASE_URL 또는 SUPABASE_KEY 환경변수가 설정되지 않았습니다.")

# 전역 변수
cached_content = None
all_stories = {}  # {filename: content}

# 동화 폴더 경로 (로컬/배포 환경 대응)
DOC_FOLDER = os.environ.get('DOC_FOLDER')

if not DOC_FOLDER:
    # 로컬 개발 환경
    local_path = '/Users/hongbeomseog/Desktop/동화_doc'
    if os.path.exists(local_path):
        DOC_FOLDER = local_path
    else:
        # 배포 환경 - 프로젝트 내 stories 폴더
        DOC_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'stories')

print(f"📂 동화 폴더 경로: {DOC_FOLDER}")
print(f"📂 폴더 존재 여부: {os.path.exists(DOC_FOLDER)}")
if os.path.exists(DOC_FOLDER):
    print(f"📂 폴더 내 파일 수: {len([f for f in os.listdir(DOC_FOLDER) if f.endswith('.docx')])}")


# ============================================================================
# [1] 동화 문서 로드
# ============================================================================
def load_docx_file(file_path):
    """docx 파일을 읽어서 텍스트 반환"""
    if not DOCX_AVAILABLE:
        return ""
    
    try:
        doc = Document(file_path)
        paragraphs = []
        for para in doc.paragraphs:
            if para.text.strip():
                paragraphs.append(para.text.strip())
        return '\n\n'.join(paragraphs)
    except Exception as e:
        print(f"파일 읽기 오류 ({file_path}): {e}")
        return ""


def load_all_stories():
    """50개의 동화 파일을 모두 로드"""
    global all_stories
    
    if not os.path.exists(DOC_FOLDER):
        print(f"❌ 폴더를 찾을 수 없습니다: {DOC_FOLDER}")
        return
    
    doc_files = sorted(glob.glob(os.path.join(DOC_FOLDER, "*.docx")))
    print(f"📚 총 {len(doc_files)}개의 동화 발견")
    
    for doc_path in doc_files:
        filename = os.path.basename(doc_path)[:-5]  # .docx 제거
        content = load_docx_file(doc_path)
        if content:
            all_stories[filename] = content
            print(f"  ✓ {filename}")
    
    print(f"✅ 총 {len(all_stories)}개의 동화 로드 완료\n")


def create_context_cache():
    """50개 동화를 Gemini Context Cache에 저장"""
    global cached_content
    
    if not client or not all_stories:
        return None
    
    print("\n" + "="*80)
    print("🚀 Gemini Context Cache 생성 중...")
    print("="*80)
    
    # 모든 동화를 하나의 텍스트로 결합
    combined_text = ""
    for idx, (title, content) in enumerate(all_stories.items(), 1):
        combined_text += f"\n\n{'='*80}\n[동화 {idx}] {title}\n{'='*80}\n{content}\n"
    
    system_instruction = """
당신은 한국어 교육 전문 AI입니다.
50개의 한국어 동화를 학습했습니다.

역할:
1. 동화 내용 요약
2. 문단별 분석 및 문맥 파악
3. 실생활 활용 예시 제공
4. 주요 어휘 및 문법 추출
5. 학습자 레벨에 맞는 설명

반드시 JSON 형식으로만 응답하세요.
"""
    
    try:
        cached_content = client.caches.create(
            model='gemini-2.0-flash-exp',
            config=types.CreateCachedContentConfig(
                system_instruction=system_instruction,
                contents=[types.Part.from_text(combined_text)],
                ttl="3600s"
            )
        )
        print(f"✅ Context Cache 생성 완료! (Cache: {cached_content.name})")
        print("="*80 + "\n")
        return cached_content
    except Exception as e:
        print(f"❌ Cache 생성 실패: {e}")
        return None


# ============================================================================
# [2] API 엔드포인트
# ============================================================================

@app.route('/', methods=['GET'])
def home():
    """루트 경로 - API 상태 확인"""
    return jsonify({
        "status": "online",
        "service": "K-Context Master API",
        "version": "1.0.0",
        "endpoints": {
            "stories": "/api/stories",
            "story_detail": "/api/story/<id>",
            "analyze": "/api/story/<id>/analyze",
            "quiz": "/api/story/<id>/quiz",
            "evaluate": "/api/story/<id>/evaluate",
            "tts_voices": "/api/tts/voices",
            "tts_speak": "/api/tts/speak",
            "save_progress": "/api/user/progress",
            "dashboard": "/api/user/dashboard/<user_id>"
        },
        "total_stories": len(all_stories)
    })

@app.route('/health', methods=['GET'])
def health_check():
    """헬스체크 엔드포인트"""
    return jsonify({
        "status": "healthy",
        "gemini": client is not None,
        "tts": tts_client is not None,
        "supabase": supabase_client is not None,
        "stories_loaded": len(all_stories)
    })

@app.route('/api/stories', methods=['GET'])
def get_stories():
    """50개 동화 목록 반환"""
    story_list = [
        {"id": i, "title": title, "preview": content[:100] + "..."}
        for i, (title, content) in enumerate(all_stories.items(), 1)
    ]
    return jsonify({
        "total": len(story_list),
        "stories": story_list
    })


@app.route('/api/story/<int:story_id>', methods=['GET'])
def get_story(story_id):
    """특정 동화의 전체 내용 반환"""
    if story_id < 1 or story_id > len(all_stories):
        return jsonify({"error": "동화를 찾을 수 없습니다"}), 404
    
    title = list(all_stories.keys())[story_id - 1]
    content = all_stories[title]
    
    # 문단으로 분리
    paragraphs = [p.strip() for p in content.split('\n\n') if p.strip()]
    
    return jsonify({
        "id": story_id,
        "title": title,
        "full_text": content,
        "paragraphs": paragraphs
    })


@app.route('/api/story/<int:story_id>/analyze', methods=['POST'])
def analyze_story(story_id):
    """
    동화 분석 (8단계 학습 데이터 생성)
    POST body: { "level": "초급|중급|고급" }
    """
    if story_id < 1 or story_id > len(all_stories):
        return jsonify({"error": "동화를 찾을 수 없습니다"}), 404
    
    data = request.get_json() or {}
    level = data.get('level', '초급')
    
    title = list(all_stories.keys())[story_id - 1]
    content = all_stories[title]
    
    if not client:
        return jsonify({"error": "Gemini API가 설정되지 않았습니다"}), 500
    
    # Cache 없이 빠르게 분석 (속도 개선)
    # if not cached_content:
    #     create_context_cache()
    
    # Gemini에게 분석 요청 (간소화된 프롬프트로 속도 개선)
    prompt = f"""
{level} 학습자를 위한 동화 분석:

{content}

JSON 형식으로 응답:
{{
  "summary": "동화 전체 내용을 3-4문장으로 요약",
  "paragraphs_analysis": [
    {{
      "paragraph_num": 1,
      "original_text": "원문",
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
                temperature=0.5,  # 속도 개선을 위해 상향
                response_mime_type="application/json"
            )
        )
        
        response_text = response.text.strip()
        if response_text.startswith('```json'):
            response_text = response_text[7:-3].strip()
        elif response_text.startswith('```'):
            response_text = response_text[3:-3].strip()
        
        result = json.loads(response_text)
        result['story_id'] = story_id
        result['title'] = title
        result['level'] = level
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": f"분석 오류: {str(e)}"}), 500


@app.route('/api/tts/voices', methods=['GET'])
def get_tts_voices():
    """사용 가능한 Google Cloud TTS 음성 목록 반환"""
    if not tts_client:
        return jsonify({"error": "Google Cloud TTS가 설정되지 않았습니다"}), 503
    
    # 한국어 고품질 음성 목록 (2024 최신)
    voices = [
        # Studio 음성 (최고 품질)
        {
            "id": "ko-KR-Studio-A",
            "name": "Studio A (여성, 프리미엄)",
            "gender": "FEMALE",
            "type": "Studio",
            "description": "최고급 품질, 방송 수준의 자연스러운 여성 목소리"
        },
        {
            "id": "ko-KR-Studio-B",
            "name": "Studio B (남성, 프리미엄)",
            "gender": "MALE",
            "type": "Studio",
            "description": "최고급 품질, 방송 수준의 자연스러운 남성 목소리"
        },
        # Neural2 음성 (고품질)
        {
            "id": "ko-KR-Neural2-A",
            "name": "Neural2 A (여성, 밝고 명랑)",
            "gender": "FEMALE",
            "type": "Neural2",
            "description": "밝고 명랑한 여성 목소리, 교육 콘텐츠에 최적"
        },
        {
            "id": "ko-KR-Neural2-B",
            "name": "Neural2 B (남성, 차분함)",
            "gender": "MALE",
            "type": "Neural2",
            "description": "차분하고 신뢰감 있는 남성 목소리"
        },
        {
            "id": "ko-KR-Neural2-C",
            "name": "Neural2 C (여성, 부드러움)",
            "gender": "FEMALE",
            "type": "Neural2",
            "description": "부드럽고 다정한 여성 목소리, 동화 읽기에 적합"
        },
        # Wavenet 음성 (표준 고품질)
        {
            "id": "ko-KR-Wavenet-A",
            "name": "Wavenet A (여성)",
            "gender": "FEMALE",
            "type": "WaveNet",
            "description": "자연스러운 여성 목소리"
        },
        {
            "id": "ko-KR-Wavenet-B",
            "name": "Wavenet B (여성)",
            "gender": "FEMALE",
            "type": "WaveNet",
            "description": "다정한 여성 목소리"
        },
        {
            "id": "ko-KR-Wavenet-C",
            "name": "Wavenet C (남성)",
            "gender": "MALE",
            "type": "WaveNet",
            "description": "신뢰감 있는 남성 목소리"
        },
        {
            "id": "ko-KR-Wavenet-D",
            "name": "Wavenet D (남성)",
            "gender": "MALE",
            "type": "WaveNet",
            "description": "깊고 안정적인 남성 목소리"
        },
        # Standard 음성 (경제적)
        {
            "id": "ko-KR-Standard-A",
            "name": "Standard A (여성, 경제적)",
            "gender": "FEMALE",
            "type": "Standard",
            "description": "기본 품질 여성 목소리 (가장 저렴)"
        },
        {
            "id": "ko-KR-Standard-B",
            "name": "Standard B (여성, 경제적)",
            "gender": "FEMALE",
            "type": "Standard",
            "description": "기본 품질 여성 목소리 (가장 저렴)"
        },
        {
            "id": "ko-KR-Standard-C",
            "name": "Standard C (남성, 경제적)",
            "gender": "MALE",
            "type": "Standard",
            "description": "기본 품질 남성 목소리 (가장 저렴)"
        },
        {
            "id": "ko-KR-Standard-D",
            "name": "Standard D (남성, 경제적)",
            "gender": "MALE",
            "type": "Standard",
            "description": "기본 품질 남성 목소리 (가장 저렴)"
        }
    ]
    
    return jsonify({"voices": voices, "default": "ko-KR-Neural2-A"})


@app.route('/api/tts/speak', methods=['POST'])
def text_to_speech():
    """텍스트를 음성으로 변환하여 반환"""
    if not tts_client:
        return jsonify({"error": "Google Cloud TTS가 설정되지 않았습니다"}), 503
    
    data = request.get_json() or {}
    text = data.get('text', '')
    voice_id = data.get('voice', 'ko-KR-Neural2-A')
    speaking_rate = data.get('speed', 1.0)
    
    if not text:
        return jsonify({"error": "텍스트가 필요합니다"}), 400
    
    # 텍스트 길이 제한 (5000자)
    if len(text) > 5000:
        text = text[:5000]
    
    try:
        # 음성 합성 입력 설정
        synthesis_input = texttospeech.SynthesisInput(text=text)
        
        # 음성 설정
        voice = texttospeech.VoiceSelectionParams(
            language_code="ko-KR",
            name=voice_id
        )
        
        # 오디오 설정
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            speaking_rate=speaking_rate,
            pitch=0.0
        )
        
        # 음성 합성 요청
        response = tts_client.synthesize_speech(
            input=synthesis_input,
            voice=voice,
            audio_config=audio_config
        )
        
        # Base64로 인코딩하여 반환
        audio_base64 = base64.b64encode(response.audio_content).decode('utf-8')
        
        return jsonify({
            "audio": audio_base64,
            "voice": voice_id,
            "text_length": len(text)
        })
        
    except Exception as e:
        return jsonify({"error": f"음성 합성 오류: {str(e)}"}), 500


@app.route('/api/story/<int:story_id>/quiz', methods=['POST'])
def generate_quiz(story_id):
    """
    동화 기반 퀴즈 생성
    POST body: { "level": "초급|중급|고급", "count": 15 }
    """
    if story_id < 1 or story_id > len(all_stories):
        return jsonify({"error": "동화를 찾을 수 없습니다"}), 404
    
    data = request.get_json() or {}
    level = data.get('level', '초급')
    count = data.get('count', 15)
    
    title = list(all_stories.keys())[story_id - 1]
    content = all_stories[title]
    
    if not client:
        return jsonify({"error": "Gemini API가 설정되지 않았습니다"}), 500
    
    prompt = f"""
동화 제목: {title}
학습 레벨: {level}
동화 내용:
{content}

위 동화를 읽은 {level} 학습자의 이해도를 확인하기 위한 객관식 퀴즈 {count}개를 생성하세요.

JSON 형식으로 응답:
{{
  "quiz_questions": [
    {{
      "question": "질문 내용",
      "options": ["선택지1", "선택지2", "선택지3", "선택지4"],
      "correct_index": 0,
      "explanation": "정답 해설"
    }}
  ]
}}

퀴즈는 다양한 유형으로 구성하세요:
- 내용 이해 (누가 무엇을 했나?)
- 어휘 뜻 맞추기
- 문맥 파악
- 등장인물 행동 이유
- 교훈이나 주제
"""
    
    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash-exp',
            contents=[prompt],
            config=types.GenerateContentConfig(
                temperature=0.8,  # 속도 개선
                response_mime_type="application/json"
            )
        )
        
        response_text = response.text.strip()
        if response_text.startswith('```json'):
            response_text = response_text[7:-3].strip()
        
        result = json.loads(response_text)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": f"퀴즈 생성 오류: {str(e)}"}), 500


@app.route('/api/user/progress', methods=['POST'])
def save_user_progress():
    """
    사용자 학습 진행 상황 저장
    POST body: {
        "user_id": "user123",
        "story_id": 1,
        "completed_tabs": ["요약", "전체듣기"],
        "quiz_score": 85,
        "pronunciation_score": 90
    }
    """
    if not supabase_client:
        return jsonify({"error": "Supabase가 설정되지 않았습니다", "saved": False}), 503
    
    data = request.get_json() or {}
    
    try:
        result = supabase_client.table('learning_records').insert({
            'user_id': data.get('user_id'),
            'story_id': data.get('story_id'),
            'story_title': data.get('story_title'),
            'completed_tabs': data.get('completed_tabs', []),
            'quiz_score': data.get('quiz_score'),
            'pronunciation_score': data.get('pronunciation_score'),
            'study_date': datetime.now().isoformat(),
            'level': data.get('level', '초급')
        }).execute()
        
        return jsonify({"saved": True, "data": result.data})
    except Exception as e:
        print(f"학습 기록 저장 오류: {e}")
        return jsonify({"error": str(e), "saved": False}), 500


@app.route('/api/user/dashboard/<user_id>', methods=['GET'])
def get_user_dashboard(user_id):
    """사용자 대시보드 데이터 조회"""
    if not supabase_client:
        return jsonify({"error": "Supabase가 설정되지 않았습니다"}), 503
    
    try:
        # 학습 기록 조회
        records = supabase_client.table('learning_records')\
            .select('*')\
            .eq('user_id', user_id)\
            .order('created_at', desc=True)\
            .limit(50)\
            .execute()
        
        # 단어장 조회
        wordbook = supabase_client.table('wordbook')\
            .select('*')\
            .eq('user_id', user_id)\
            .eq('mastered', False)\
            .execute()
        
        # 통계 계산
        total_stories = len(set([r['story_id'] for r in records.data]))
        avg_quiz = sum([r['quiz_score'] for r in records.data if r['quiz_score']]) / max(len([r for r in records.data if r['quiz_score']]), 1)
        avg_pronunciation = sum([r['pronunciation_score'] for r in records.data if r['pronunciation_score']]) / max(len([r for r in records.data if r['pronunciation_score']]), 1)
        
        return jsonify({
            "records": records.data,
            "wordbook": wordbook.data,
            "stats": {
                "total_stories_studied": total_stories,
                "total_sessions": len(records.data),
                "avg_quiz_score": round(avg_quiz, 1),
                "avg_pronunciation_score": round(avg_pronunciation, 1)
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/story/<int:story_id>/evaluate', methods=['POST'])
def evaluate_pronunciation(story_id):
    """
    발음 평가 (녹음된 텍스트와 원문 비교)
    POST body: { "original_text": "원문", "user_text": "사용자가 말한 텍스트" }
    """
    data = request.get_json() or {}
    original = data.get('original_text', '')
    user_text = data.get('user_text', '')
    
    if not original or not user_text:
        return jsonify({"error": "텍스트가 필요합니다"}), 400
    
    if not client:
        return jsonify({
            "score": 85,
            "feedback": "Mock 평가: 발음이 좋습니다!",
            "corrections": []
        })
    
    prompt = f"""
원문: {original}
사용자가 읽은 텍스트: {user_text}

위 두 텍스트를 비교하여 발음 평가를 JSON으로 제공하세요:
{{
  "score": 0-100 점수,
  "feedback": "종합 피드백",
  "corrections": [
    {{
      "original": "원문 단어",
      "user": "사용자가 말한 단어",
      "suggestion": "교정 제안"
    }}
  ],
  "pronunciation_tips": ["발음 팁 1", "발음 팁 2"]
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
        
        result = json.loads(response.text.strip())
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": f"평가 오류: {str(e)}"}), 500


# ============================================================================
# [3] 서버 시작
# ============================================================================
if __name__ == '__main__':
    print("\n" + "="*80)
    print("🔥 K-Context Master: 한국어 동화 학습 앱")
    print("="*80)
    
    # 동화 로드
    load_all_stories()
    
    # Cache는 필요시에만 생성 (서버 시작 속도 개선)
    # if client and all_stories:
    #     create_context_cache()
    
    print(f"🌐 서버 주소: http://localhost:8080")
    print(f"📱 동화 목록: http://localhost:8080/api/stories")
    print("="*80 + "\n")
    
    app.run(debug=True, port=8080, host='0.0.0.0')
