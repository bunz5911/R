# -*- coding: utf-8 -*-
"""
K-Context Master: 한국어 동화 학습 앱
- 50개 동화 기반 8단계 학습 시스템
- Gemini RAG 기반 분석
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
try:
    from google import genai
    from google.genai import types
except ImportError:
    import google.generativeai as genai
    from google.generativeai import types
from google.cloud import texttospeech
import os
import sys
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

app = Flask(__name__, static_folder='.', static_url_path='')
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
print("\n" + "="*80, flush=True)
print("🔊 Google Cloud TTS 초기화 시작...", flush=True)
print("="*80, flush=True)

try:
    # 방법 1: 파일 경로에서 읽기 (로컬)
    credentials_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
    print(f"📁 GOOGLE_APPLICATION_CREDENTIALS: {credentials_path}", flush=True)
    
    if credentials_path and os.path.exists(credentials_path):
        print(f"✓ 인증 파일 발견: {credentials_path}", flush=True)
        tts_client = texttospeech.TextToSpeechClient()
        print("✅ Google Cloud TTS 클라이언트 초기화 성공 (파일)", flush=True)
    # 방법 2: 환경변수에서 JSON 직접 읽기 (Render/배포)
    elif os.environ.get('GOOGLE_TTS_JSON'):
        import tempfile
        import json
        
        print("✓ GOOGLE_TTS_JSON 환경변수 발견", flush=True)
        credentials_json = os.environ.get('GOOGLE_TTS_JSON')
        print(f"✓ JSON 길이: {len(credentials_json)} 문자", flush=True)
        
        # JSON 유효성 검사
        try:
            json_data = json.loads(credentials_json)
            print(f"✓ JSON 파싱 성공: project_id={json_data.get('project_id')}", flush=True)
        except json.JSONDecodeError as je:
            print(f"❌ JSON 파싱 실패: {je}", flush=True)
            raise
        
        # 임시 파일로 저장
        print("✓ 임시 파일 생성 시작...", flush=True)
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            f.write(credentials_json)
            temp_path = f.name
        print(f"✓ 임시 파일 생성 완료: {temp_path}", flush=True)
        
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = temp_path
        print("✓ TTS 클라이언트 초기화 시작...", flush=True)
        tts_client = texttospeech.TextToSpeechClient()
        print("✅ Google Cloud TTS 클라이언트 초기화 성공 (환경변수)", flush=True)
    else:
        print("⚠️ Google Cloud TTS 인증 정보가 없습니다.", flush=True)
        print("   → Web Speech API를 대체로 사용합니다.", flush=True)
except Exception as e:
    tts_client = None
    print(f"❌ Google Cloud TTS 초기화 실패: {type(e).__name__}", flush=True)
    print(f"   에러 메시지: {str(e)}", flush=True)
    import traceback
    print(f"   상세 오류:\n{traceback.format_exc()}", flush=True)
    print("   → Web Speech API를 대체로 사용합니다.", flush=True)

print("="*80 + "\n", flush=True)

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
story_files = {}  # {display_title: filepath}
story_titles = []  # display_title 목록 (정렬된 순서)
story_title_base_map = {}  # {display_title: base_title}
story_base_to_display_map = {}  # {base_title: display_title}

# ============================================================================
# 🚀 미리 생성된 분석 데이터 로드 (속도 최적화)
# ============================================================================
PRECOMPUTED_ANALYSIS = {}
analysis_file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'analysis_data.json')

try:
    if os.path.exists(analysis_file_path):
        with open(analysis_file_path, 'r', encoding='utf-8') as f:
            PRECOMPUTED_ANALYSIS = json.load(f)
        print(f"✅ 사전 생성된 분석 데이터 로드 완료: {len(PRECOMPUTED_ANALYSIS)}개 동화", flush=True)
    else:
        print("⚠️ analysis_data.json 파일이 없습니다. Gemini API를 사용합니다.", flush=True)
except Exception as e:
    print(f"⚠️ 분석 데이터 로드 실패: {e}", flush=True)
    PRECOMPUTED_ANALYSIS = {}

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

print(f"📂 동화 폴더 경로: {DOC_FOLDER}", flush=True)
print(f"📂 폴더 존재 여부: {os.path.exists(DOC_FOLDER)}", flush=True)
if os.path.exists(DOC_FOLDER):
    print(f"📂 폴더 내 파일 수: {len([f for f in os.listdir(DOC_FOLDER) if f.endswith('.docx')])}", flush=True)


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


def scan_story_files():
    """동화 파일 목록만 스캔 (메모리 절약)"""
    global story_files, story_titles, story_title_base_map, story_base_to_display_map
    
    story_files.clear()
    story_titles.clear()
    story_title_base_map.clear()
    story_base_to_display_map.clear()
    
    if not os.path.exists(DOC_FOLDER):
        print(f"❌ 폴더를 찾을 수 없습니다: {DOC_FOLDER}", flush=True)
        return
    
    doc_files = sorted(glob.glob(os.path.join(DOC_FOLDER, "*.docx")))
    print(f"📚 총 {len(doc_files)}개의 동화 발견", flush=True)
    
    for doc_path in doc_files:
        base_title = os.path.basename(doc_path)[:-5]  # .docx 제거
        display_title = base_title if base_title.endswith("의 비밀") else f"{base_title}의 비밀"
        
        story_files[display_title] = doc_path
        story_titles.append(display_title)
        story_title_base_map[display_title] = base_title
        story_base_to_display_map[base_title] = display_title
        print(f"  ✓ {base_title} → {display_title}", flush=True)
    
    print(f"✅ 총 {len(story_titles)}개의 동화 파일 등록 완료\n", flush=True)


def get_story_content(filename):
    """필요할 때만 동화 파일을 읽음 (Lazy Loading)"""
    if filename not in story_files:
        # base_title로 요청된 경우 display_title로 변환
        filename = story_base_to_display_map.get(filename, filename)
        if filename not in story_files:
            return None
    
    file_path = story_files[filename]
    return load_docx_file(file_path)


# 앱 시작 시 동화 파일 스캔 (Gunicorn 환경 대응)
print("\n" + "="*80, flush=True)
print("🔥 K-Context Master 초기화 중...", flush=True)
print("="*80, flush=True)
scan_story_files()
print("="*80 + "\n", flush=True)


def create_context_cache():
    """50개 동화를 Gemini Context Cache에 저장 (사용하지 않음 - 메모리 절약)"""
    global cached_content
    
    if not client or not story_files:
        return None
    
    print("\n" + "="*80)
    print("🚀 Gemini Context Cache 생성 중...")
    print("="*80)
    
    # 모든 동화를 하나의 텍스트로 결합
    combined_text = ""
    # 캐시 생성은 메모리 절약을 위해 비활성화
    return None
    
    for idx, (title, filepath) in enumerate(story_files.items(), 1):
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
    """루트 경로 - index.html 제공"""
    return send_file('index.html')

@app.route('/health', methods=['GET'])
def health():
    """API 상태 확인 및 헬스체크"""
    return jsonify({
        "status": "healthy",
        "gemini": client is not None,
        "tts": tts_client is not None,
        "supabase": supabase_client is not None,
        "stories_loaded": len(story_titles),
        "precomputed_analysis": len(PRECOMPUTED_ANALYSIS),
        "cache_sample": list(PRECOMPUTED_ANALYSIS.keys())[:5] if PRECOMPUTED_ANALYSIS else []
    })

@app.route('/api/stories', methods=['GET'])
def get_stories():
    """50개 동화 목록 반환 (Lazy Loading)"""
    story_list = []
    for i, title in enumerate(story_titles, 1):
        # 필요할 때만 내용 로드 (메모리 절약)
        content = get_story_content(title)
        preview = content[:100] + "..." if content else ""
        story_list.append({
            "id": i,
            "title": title,
            "preview": preview
        })
    
    return jsonify({
        "total": len(story_list),
        "stories": story_list
    })


@app.route('/api/story/<int:story_id>', methods=['GET'])
def get_story(story_id):
    """특정 동화의 전체 내용 반환 (Lazy Loading)"""
    print(f"📖 동화 요청 받음: story_id={story_id}", flush=True)
    
    if story_id < 1 or story_id > len(story_titles):
        print(f"❌ 잘못된 story_id: {story_id}", flush=True)
        return jsonify({"error": "동화를 찾을 수 없습니다"}), 404
    
    title = story_titles[story_id - 1]
    print(f"📚 동화 제목: {title}", flush=True)
    
    content = get_story_content(title)
    print(f"✅ 동화 내용 로드 완료 (길이: {len(content)}자)", flush=True)
    
    # 문단으로 분리
    paragraphs = [p.strip() for p in content.split('\n\n') if p.strip()]
    print(f"📝 문단 수: {len(paragraphs)}", flush=True)
    
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
    
    우선순위:
    1. 사전 생성된 분석 데이터 (즉시 반환)
    2. Supabase 캐시 (빠름)
    3. Gemini API 실시간 분석 (느림, 최후 수단)
    """
    print(f"\n{'='*80}", flush=True)
    print(f"🔍 분석 요청 받음: story_id={story_id}", flush=True)
    print(f"{'='*80}", flush=True)
    
    if story_id < 1 or story_id > len(story_titles):
        print(f"❌ 잘못된 story_id: {story_id}", flush=True)
        return jsonify({"error": "동화를 찾을 수 없습니다"}), 404
    
    data = request.get_json() or {}
    level = data.get('level', '초급')
    print(f"📊 요청된 레벨: {level}", flush=True)
    
    # 동화 제목 가져오기
    title = story_titles[story_id - 1]
    base_title = story_title_base_map.get(title, title)
    print(f"📚 동화 제목: {title} (원본: {base_title})", flush=True)
    
    # ✅ 1순위: 사전 생성된 분석 데이터 확인 (0.1초 이내)
    # 매칭 키 생성: 공백 제거 + "의비밀" 추가
    matching_key = base_title.replace(" ", "") + ("의비밀" if not base_title.endswith("의 비밀") else "")
    print(f"🔑 매칭 키: '{matching_key}' (원본: '{base_title}')", flush=True)
    
    if matching_key in PRECOMPUTED_ANALYSIS and level in PRECOMPUTED_ANALYSIS[matching_key]:
        print(f"✅ [캐시 HIT] {matching_key} - {level} (사전 생성 데이터)", flush=True)
        result = PRECOMPUTED_ANALYSIS[matching_key][level].copy()
        result['story_id'] = story_id
        result['title'] = title
        result['level'] = level
        result['cached'] = True
        return jsonify(result)
    
    # ✅ 2순위: Supabase 캐시 확인
    if supabase_client:
        try:
            cached = supabase_client.table('analysis_cache')\
                .select('*')\
                .eq('story_title', base_title)\
                .eq('level', level)\
                .execute()
            
            if cached.data and len(cached.data) > 0:
                print(f"✅ [캐시 HIT] {base_title} - {level} (Supabase)", flush=True)
                result = cached.data[0]['result']
                result['story_id'] = story_id
                result['title'] = title
                result['level'] = level
                result['cached'] = True
                return jsonify(result)
        except Exception as e:
            print(f"⚠️ Supabase 캐시 조회 실패: {e}", flush=True)
    
    # ✅ 3순위: Gemini API 실시간 분석 (느림)
    print(f"⚠️ [캐시 MISS] {base_title} - {level}, Gemini API 호출 중...", flush=True)
    
    content = get_story_content(title)
    
    if not client:
        return jsonify({"error": "Gemini API가 설정되지 않았습니다"}), 500
    
    # Gemini에게 분석 요청
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
    "이 동화에서 배운 표현이나 단어를 실제 대화에서 사용할 수 있는 {level} 레벨 회화 문장 10개. 각 문장은 반드시 '한국어 문장 (English translation)' 형식으로 작성할 것. 예시: 나는 그림을 잘 그려. (I'm good at drawing.)"
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
        print(f"🤖 Gemini API 호출 시작: {base_title} - {level}", flush=True)
        
        response = client.models.generate_content(
            model='gemini-2.0-flash-exp',
            contents=[prompt],
            config=types.GenerateContentConfig(
                temperature=0.5,
                response_mime_type="application/json"
            )
        )
        
        print(f"✅ Gemini API 응답 수신 완료", flush=True)
        
        response_text = response.text.strip()
        if response_text.startswith('```json'):
            response_text = response_text[7:-3].strip()
        elif response_text.startswith('```'):
            response_text = response_text[3:-3].strip()
        
        result = json.loads(response_text)
        result['story_id'] = story_id
        result['title'] = title
        result['level'] = level
        result['cached'] = False
        
        print(f"✅ JSON 파싱 성공", flush=True)
        
        # ✅ Supabase에 결과 캐싱 (다음번에 빠르게 로드)
        if supabase_client:
            try:
                supabase_client.table('analysis_cache').upsert({
                    'story_title': base_title,
                    'level': level,
                    'result': result,
                    'created_at': datetime.now().isoformat()
                }, on_conflict='story_title,level').execute()
                print(f"✅ Supabase에 분석 결과 캐싱 완료: {base_title} - {level}", flush=True)
            except Exception as e:
                print(f"⚠️ Supabase 캐싱 실패: {e}", flush=True)
        
        return jsonify(result)
        
    except json.JSONDecodeError as e:
        print(f"❌ JSON 파싱 오류: {e}", flush=True)
        print(f"응답 텍스트: {response_text[:200]}...", flush=True)
        return jsonify({"error": f"응답 형식 오류: {str(e)}"}), 500
    except Exception as e:
        print(f"❌ Gemini API 오류: {type(e).__name__}: {str(e)}", flush=True)
        import traceback
        print(traceback.format_exc(), flush=True)
        return jsonify({"error": f"분석 오류: {str(e)}"}), 500


@app.route('/api/tts/voices', methods=['GET'])
def get_tts_voices():
    """사용 가능한 TTS 음성 목록 반환 (ElevenLabs + Google)"""
    
    # ============================================================================
    # 음성 목록: ElevenLabs (프리미엄) + Google TTS (fallback)
    # ============================================================================
    voices = [
        # ✅ ElevenLabs - 프리미엄 음성 (메인, 항상 표시)
        {
            "id": "uyVNoMrnUku1dZyVEXwD",
            "name": "Anna (여성, 프리미엄)",
            "gender": "FEMALE",
            "type": "ElevenLabs",
            "provider": "elevenlabs",
            "description": "부드럽고 차분한 여성 목소리 - 최고 품질"
        },
        {
            "id": "BbsagRO6ohd8MKPS2Ob0",
            "name": "Jin neon song (남성, 프리미엄)",
            "gender": "MALE",
            "type": "ElevenLabs",
            "provider": "elevenlabs",
            "description": "활기찬 남성 목소리 - 최고 품질"
        },
        {
            "id": "nbrxrAz3eYm9NgojrmFK",
            "name": "Min joon (남성, 프리미엄)",
            "gender": "MALE",
            "type": "ElevenLabs",
            "provider": "elevenlabs",
            "description": "차분한 남성 목소리 - 최고 품질"
        }
    ]
    
    # ✅ Google Cloud TTS 음성 추가 (있는 경우에만)
    if tts_client:
        voices.insert(0, {
            "id": "ko-KR-Studio-A",
            "name": "Google Studio A (여성)",
            "gender": "FEMALE",
            "type": "Google",
            "provider": "google",
            "description": "방송 수준의 여성 목소리 (Fallback)"
        })
    
    # ✅ 기본 음성: ElevenLabs Anna (최고 품질)
    return jsonify({"voices": voices, "default": "uyVNoMrnUku1dZyVEXwD"})


@app.route('/api/tts/speak', methods=['POST'])
def text_to_speech():
    """
    텍스트를 음성으로 변환하여 반환
    ElevenLabs TTS만 사용 (Google TTS 제거)
    """
    data = request.get_json() or {}
    text = data.get('text', '')
    voice_id = data.get('voice', 'uyVNoMrnUku1dZyVEXwD')  # 기본: Anna
    speaking_rate = data.get('speed', 1.0)
    
    if not text:
        return jsonify({"error": "텍스트가 필요합니다"}), 400
    
    # 텍스트 길이 제한 (5000자)
    if len(text) > 5000:
        text = text[:5000]
    
    # ============================================================================
    # ElevenLabs TTS (유일한 TTS)
    # ============================================================================
    try:
        import requests as http_requests
        
        elevenlabs_api_key = os.environ.get('ELEVENLABS_API_KEY')
        if not elevenlabs_api_key:
            print("❌ ELEVENLABS_API_KEY 없음", flush=True)
            return jsonify({"error": "ElevenLabs API 키가 설정되지 않았습니다"}), 503
        
        print(f"🎤 ElevenLabs TTS 호출: voice={voice_id}, text={len(text)}자", flush=True)
        
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        headers = {
            "xi-api-key": elevenlabs_api_key,
            "Content-Type": "application/json"
        }
        payload = {
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.6,
                "similarity_boost": 0.8,
                "style": 0.0,
                "use_speaker_boost": True
            }
        }
        
        response = http_requests.post(url, json=payload, headers=headers, timeout=30)
        
        if response.status_code == 200:
            # MP3 데이터를 Base64로 인코딩
            audio_base64 = base64.b64encode(response.content).decode('utf-8')
            print(f"✅ ElevenLabs 음성 생성 완료: {len(text)}자", flush=True)
            
            return jsonify({
                "audio": audio_base64,
                "voice": voice_id,
                "provider": "elevenlabs",
                "text_length": len(text)
            })
        else:
            error_msg = f"ElevenLabs API 오류: {response.status_code}"
            print(f"❌ {error_msg}", flush=True)
            print(f"응답: {response.text}", flush=True)
            return jsonify({"error": error_msg, "details": response.text}), response.status_code
                
    except Exception as e:
        error_msg = f"ElevenLabs TTS 오류: {str(e)}"
        print(f"❌ {error_msg}", flush=True)
        import traceback
        print(traceback.format_exc(), flush=True)
        return jsonify({"error": error_msg}), 500


@app.route('/api/story/<int:story_id>/quiz', methods=['POST'])
def generate_quiz(story_id):
    """
    동화 기반 퀴즈 생성
    POST body: { "level": "초급|중급|고급", "count": 15 }
    """
    if story_id < 1 or story_id > len(story_titles):
        return jsonify({"error": "동화를 찾을 수 없습니다"}), 404
    
    data = request.get_json() or {}
    level = data.get('level', '초급')
    count = data.get('count', 15)
    
    # 동화 로드 (Lazy Loading)
    title = story_titles[story_id - 1]
    content = get_story_content(title)
    
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


@app.route('/api/user/record-study', methods=['POST'])
def record_study_session():
    """학습 기록 저장"""
    if not supabase_client:
        print("⚠️ Supabase 미설정 - 학습 기록 저장 생략", flush=True)
        return jsonify({"message": "Supabase not configured"}), 200
    
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        story_id = data.get('story_id')
        story_title = data.get('story_title')
        level = data.get('level')
        paragraph_num = data.get('paragraph_num')
        quiz_score = data.get('quiz_score')
        pronunciation_score = data.get('pronunciation_score')
        session_type = data.get('session_type', 'reading')
        
        # Supabase에 저장
        result = supabase_client.table('learning_records').insert({
            'user_id': user_id,
            'story_id': story_id,
            'story_title': story_title,
            'level': level,
            'quiz_score': quiz_score,
            'pronunciation_score': pronunciation_score
            # study_date와 created_at은 Supabase에서 자동 생성 (DEFAULT NOW())
        }).execute()
        
        print(f"✅ 학습 기록 저장 완료: {story_title} ({session_type})", flush=True)
        return jsonify({"success": True, "message": "Study session recorded"})
        
    except Exception as e:
        print(f"❌ 학습 기록 저장 오류: {e}", flush=True)
        return jsonify({"error": str(e)}), 500


@app.route('/api/story/<int:story_id>/evaluate', methods=['POST'])
def evaluate_pronunciation(story_id):
    """
    🚀 개선된 발음 평가 API (코인 시스템 통합)
    POST body: { 
        "user_id": "UUID",
        "paragraph_num": 1,
        "original_text": "원문", 
        "user_text": "사용자가 말한 텍스트" 
    }
    
    기능:
    - AI가 발음/속도/정확도를 평가
    - 점수에 따라 코인 지급 (90+점: 10코인, 80-89: 7코인, ...)
    - 녹음 데이터는 서버에 저장하지 않음 (평가 후 즉시 삭제)
    - 평가 결과와 획득 코인만 DB에 기록
    """
    data = request.get_json() or {}
    user_id = data.get('user_id')
    paragraph_num = data.get('paragraph_num', 1)
    original = data.get('original_text', '')
    user_text = data.get('user_text', '')
    
    if not original or not user_text:
        return jsonify({"error": "원문과 사용자 텍스트가 필요합니다"}), 400
    
    if not user_id:
        return jsonify({"error": "user_id가 필요합니다"}), 400
    
    if not client:
        return jsonify({"error": "Gemini API가 설정되지 않았습니다"}), 500
    
    # ✅ Gemini로 종합 평가 (발음, 속도, 정확도, 적절한 어휘 사용)
    prompt = f"""
원문: {original}
사용자가 읽은 텍스트: {user_text}

위 두 텍스트를 비교하여 다음 기준으로 평가하세요:
1. 발음 정확도 (단어가 제대로 인식되었는가)
2. 속도 (너무 빠르거나 느리지 않은가)
3. 문법 (문법적으로 올바른가)
4. 어휘 사용 (적절한 단어를 사용했는가)

평가 점수에 따른 코인 지급:
- 90-100점: 10코인
- 80-89점: 7코인
- 70-79점: 5코인
- 60-69점: 3코인
- 60점 미만: 1코인

JSON 형식으로 응답:
{{
  "score": 0-100 점수,
  "coins": 획득 코인 수,
  "feedback": "종합 피드백 (격려와 개선점 포함)",
  "corrections": [
    {{
      "original": "원문 단어",
      "user": "사용자가 말한 단어",
      "suggestion": "교정 제안"
    }}
  ],
  "pronunciation_tips": ["발음 개선 팁 1", "발음 개선 팁 2"],
  "strengths": ["잘한 점 1", "잘한 점 2"]
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
        
        print(f"✅ Gemini 평가 응답 수신", flush=True)
        
        response_text = response.text.strip()
        if response_text.startswith('```json'):
            response_text = response_text[7:-3].strip()
        elif response_text.startswith('```'):
            response_text = response_text[3:-3].strip()
        
        result = json.loads(response_text)
        score = result.get('score', 0)
        coins = result.get('coins', 0)
        
        print(f"✅ 평가 결과: 점수={score}, 코인={coins}", flush=True)
        
        # ✅ 점수 기록 (녹음 데이터는 저장하지 않음!)
        if supabase_client:
            try:
                # 발음 평가 기록 저장
                supabase_client.table('pronunciation_scores').insert({
                    'user_id': user_id,
                    'story_id': story_id,
                    'paragraph_num': paragraph_num,
                    'score': score,
                    'coins_earned': coins,
                    'feedback': result.get('feedback', ''),
                    'mistakes': json.dumps(result.get('corrections', []), ensure_ascii=False)
                }).execute()
                
                print(f"✅ 평가 기록 저장 완료", flush=True)
                
                # 코인 지급 (PostgreSQL 함수 호출)
                coin_result = supabase_client.rpc('add_user_coins', {
                    'p_user_id': user_id,
                    'p_amount': coins,
                    'p_type': 'reading_score',
                    'p_story_id': story_id,
                    'p_paragraph_num': paragraph_num,
                    'p_description': f"문단 {paragraph_num} 읽기 평가 ({score}점)"
                }).execute()
                
                print(f"✅ 코인 지급 완료", flush=True)
                
                # 새로운 총 코인 수 반환
                if coin_result.data:
                    result['total_coins'] = coin_result.data
                    print(f"✅ 총 코인: {coin_result.data}", flush=True)
                
                print(f"✅ 읽기 평가 완료: user={user_id}, story={story_id}, para={paragraph_num}, score={score}, coins={coins}", flush=True)
                
            except Exception as e:
                print(f"⚠️ 평가 기록 저장 실패: {e}", flush=True)
                import traceback
                print(traceback.format_exc(), flush=True)
                # 에러가 나도 평가 결과는 반환
        
        # ✅ 녹음 데이터는 여기서 자동 삭제됨 (메모리에만 존재)
        return jsonify(result)
        
    except json.JSONDecodeError as e:
        print(f"❌ JSON 파싱 오류: {e}", flush=True)
        return jsonify({"error": f"응답 형식 오류: {str(e)}"}), 500
    except Exception as e:
        print(f"❌ 평가 오류: {type(e).__name__}: {str(e)}", flush=True)
        import traceback
        print(traceback.format_exc(), flush=True)
        return jsonify({"error": f"평가 오류: {str(e)}"}), 500


@app.route('/api/user/<user_id>/coins', methods=['GET'])
def get_user_coins(user_id):
    """사용자 코인 조회 (초기 50코인)"""
    if not supabase_client:
        return jsonify({"coins": 50, "error": "Supabase가 설정되지 않았습니다"}), 503
    
    try:
        result = supabase_client.table('user_coins')\
            .select('total_coins')\
            .eq('user_id', user_id)\
            .execute()
        
        if result.data and len(result.data) > 0:
            current_coins = result.data[0]['total_coins']
            
            # ✅ 코인이 0이면 50으로 리셋 (신규 사용자 또는 초기화)
            if current_coins == 0:
                supabase_client.table('user_coins')\
                    .update({'total_coins': 50})\
                    .eq('user_id', user_id)\
                    .execute()
                print(f"💰 사용자 {user_id} 코인 초기화: 0 → 50", flush=True)
                return jsonify({"coins": 50})
            
            return jsonify({"coins": current_coins})
        else:
            # 코인 데이터가 없으면 생성 (초기 50 코인)
            supabase_client.table('user_coins').insert({
                'user_id': user_id,
                'total_coins': 50
            }).execute()
            print(f"💰 신규 사용자 {user_id} 코인 생성: 50개", flush=True)
            return jsonify({"coins": 50})
    except Exception as e:
        print(f"❌ 코인 조회 오류: {e}", flush=True)
        return jsonify({"error": str(e), "coins": 50}), 500


@app.route('/api/user/<user_id>/coins', methods=['POST'])
def update_user_coins(user_id):
    """사용자 코인 업데이트"""
    if not supabase_client:
        return jsonify({"error": "Supabase가 설정되지 않았습니다"}), 503
    
    data = request.get_json() or {}
    amount = data.get('amount', 0)  # 양수: 획득, 음수: 소비
    transaction_type = data.get('type', 'manual')
    description = data.get('description', '')
    story_id = data.get('story_id')
    paragraph_num = data.get('paragraph_num')
    
    try:
        # 현재 코인 조회
        result = supabase_client.table('user_coins')\
            .select('total_coins')\
            .eq('user_id', user_id)\
            .execute()
        
        if not result.data or len(result.data) == 0:
            # 코인 데이터 생성 (초기 50코인)
            supabase_client.table('user_coins').insert({
                'user_id': user_id,
                'total_coins': 50
            }).execute()
            current_coins = 50
        else:
            current_coins = result.data[0]['total_coins']
        
        new_coins = max(0, current_coins + amount)
        
        # 코인 업데이트
        supabase_client.table('user_coins')\
            .update({'total_coins': new_coins, 'updated_at': datetime.now().isoformat()})\
            .eq('user_id', user_id)\
            .execute()
        
        # 거래 내역 저장
        supabase_client.table('coin_transactions').insert({
            'user_id': user_id,
            'amount': amount,
            'type': transaction_type,
            'description': description,
            'story_id': story_id,
            'paragraph_num': paragraph_num
        }).execute()
        
        print(f"💰 코인 업데이트: {current_coins} → {new_coins} ({amount:+d})", flush=True)
        
        return jsonify({
            "success": True,
            "coins": new_coins,
            "previous": current_coins,
            "change": amount
        })
        
    except Exception as e:
        print(f"❌ 코인 업데이트 오류: {e}", flush=True)
        return jsonify({"error": str(e)}), 500


@app.route('/api/quiz/retry', methods=['POST'])
def retry_quiz():
    """
    코인을 사용하여 퀴즈 재시도
    POST body: { "user_id": "UUID", "story_id": 1 }
    """
    if not supabase_client:
        return jsonify({"error": "Supabase가 설정되지 않았습니다"}), 503
    
    data = request.get_json() or {}
    user_id = data.get('user_id')
    story_id = data.get('story_id')
    
    RETRY_COST = 5  # 재시도 비용: 5코인
    
    try:
        # 코인 확인
        coin_result = supabase_client.table('user_coins')\
            .select('total_coins')\
            .eq('user_id', user_id)\
            .execute()
        
        if not coin_result.data or len(coin_result.data) == 0:
            return jsonify({
                "success": False,
                "message": "코인 정보를 찾을 수 없습니다."
            }), 404
        
        current_coins = coin_result.data[0]['total_coins']
        
        if current_coins < RETRY_COST:
            return jsonify({
                "success": False,
                "message": f"코인이 부족합니다. (보유: {current_coins}, 필요: {RETRY_COST})",
                "current_coins": current_coins,
                "required_coins": RETRY_COST
            }), 400
        
        # 코인 차감
        new_total = supabase_client.rpc('add_user_coins', {
            'p_user_id': user_id,
            'p_amount': -RETRY_COST,
            'p_type': 'quiz_retry',
            'p_story_id': story_id,
            'p_description': f"동화 {story_id} 퀴즈 재시도"
        }).execute()
        
        return jsonify({
            "success": True,
            "remaining_coins": new_total.data if new_total.data else current_coins - RETRY_COST,
            "message": "퀴즈를 다시 시도할 수 있습니다."
        })
        
    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500


@app.route('/api/adjust-difficulty', methods=['POST'])
def adjust_difficulty():
    """
    텍스트 난이도를 실시간으로 조정
    POST body: {
        "text": "원문",
        "direction": "easier|harder|realistic",
        "current_level": "초급|중급|고급"
    }
    """
    data = request.get_json()
    text = data.get('text', '')
    direction = data.get('direction', 'same')
    current_level = data.get('current_level', '초급')
    
    if not text:
        return jsonify({"error": "텍스트가 필요합니다"}), 400
    
    if not client:
        return jsonify({"error": "Gemini API가 설정되지 않았습니다"}), 500
    
    # Gemini에게 텍스트 조정 요청
    if direction == 'easier':
        prompt = f"""
다음 한국어 문장을 더 쉽게 바꿔주세요:

원문: {text}

요구사항:
- 초등학생도 이해할 수 있는 쉬운 단어 사용
- 짧고 간단한 문장 구조
- 의미는 그대로 유지
- 한국어로만 응답

쉬운 문장:"""
    
    elif direction == 'harder':
        prompt = f"""
다음 한국어 문장을 고급 표현으로 바꿔주세요:

원문: {text}

요구사항:
- 고급 어휘 사용
- 복잡한 문장 구조
- 의미는 그대로 유지
- 격식 있는 표현 사용
- 한국어로만 응답

고급 문장:"""
    
    elif direction == 'realistic':
        prompt = f"""
다음 한국어 문장을 실제 대화에서 쓰는 자연스러운 표현으로 바꿔주세요:

원문: {text}

요구사항:
- 실제 한국인이 일상에서 쓰는 표현
- 구어체 활용
- 의미는 그대로 유지
- 자연스럽고 편한 느낌
- 한국어로만 응답

자연스러운 표현:"""
    
    else:
        return jsonify({"adjusted_text": text})
    
    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash-exp',
            contents=[prompt]
        )
        
        adjusted_text = response.text.strip()
        
        print(f"✅ 난이도 조정 완료: {direction}", flush=True)
        print(f"   원문: {text[:50]}...", flush=True)
        print(f"   조정: {adjusted_text[:50]}...", flush=True)
        
        return jsonify({
            "adjusted_text": adjusted_text,
            "direction": direction,
            "original_text": text
        })
        
    except Exception as e:
        print(f"❌ 난이도 조정 오류: {e}", flush=True)
        return jsonify({"error": str(e)}), 500


# ============================================================================
# [2-1] K-콘텐츠 학습 시스템
# ============================================================================

@app.route('/api/k-content/analyze', methods=['POST'])
def analyze_k_content():
    """
    사용자가 입력한 K-콘텐츠(드라마/K-POP 대사) 분석
    POST body: {
        "user_id": "UUID",
        "content_text": "너에게 달려가고 싶어, 지금 당장!",
        "content_type": "kpop|drama|variety|movie",
        "source_title": "DNA",
        "source_artist": "BTS",
        "story_id": 1 (현재 학습 중인 동화)
    }
    
    응답:
    - 문법 패턴 분석
    - 어휘 난이도
    - TOPIK 레벨
    - 유사한 동화 추천
    """
    data = request.get_json() or {}
    user_id = data.get('user_id')
    content_text = data.get('content_text', '').strip()
    content_type = data.get('content_type', 'other')
    source_title = data.get('source_title', '')
    source_artist = data.get('source_artist', '')
    story_id = data.get('story_id')
    
    if not content_text:
        return jsonify({"error": "분석할 텍스트가 필요합니다"}), 400
    
    if not user_id:
        return jsonify({"error": "user_id가 필요합니다"}), 400
    
    if not client:
        return jsonify({"error": "Gemini API가 설정되지 않았습니다"}), 500
    
    # ✅ Gemini로 K-콘텐츠 분석
    prompt = f"""
다음 한국어 문장을 TOPIK 학습자 관점에서 상세히 분석하세요:

원문: {content_text}
출처: {source_title} ({content_type})

다음 항목을 JSON 형식으로 분석:
{{
  "difficulty_level": "beginner|intermediate|advanced",
  "topik_level": "TOPIK 2급|3급|4급...",
  "grammar_patterns": [
    {{
      "pattern": "-(으)려고 하다",
      "explanation": "의지나 계획을 나타내는 표현",
      "example": "학교에 가려고 해요."
    }}
  ],
  "vocabulary": [
    {{
      "word": "달려가다",
      "difficulty": "intermediate",
      "meaning": "빠르게 가다, 서두르다",
      "similar_words": ["뛰어가다", "서두르다"]
    }}
  ],
  "key_expressions": [
    "지금 당장",
    "-(으)려고 싶다"
  ],
  "similar_story_keywords": ["의지", "행동", "감정표현"],
  "learning_tips": "이 표현은 강한 의지를 표현할 때 사용합니다. K-POP 가사에서 자주 등장하는 패턴입니다."
}}
"""
    
    try:
        print(f"🎬 K-콘텐츠 분석 시작: {content_text[:30]}...", flush=True)
        
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
        
        analysis_result = json.loads(response_text)
        
        # ✅ Gemini가 배열로 반환하는 경우 처리
        if isinstance(analysis_result, list):
            print(f"⚠️ Gemini가 배열로 반환함, 첫 번째 요소 사용", flush=True)
            if len(analysis_result) > 0:
                analysis_result = analysis_result[0]
            else:
                raise ValueError("빈 배열 반환됨")
        
        print(f"✅ K-콘텐츠 분석 완료 (타입: {type(analysis_result).__name__})", flush=True)
        
        # ✅ 유사한 동화 추천 (키워드 기반)
        similar_stories = []
        keywords = analysis_result.get('similar_story_keywords', []) if isinstance(analysis_result, dict) else []
        if keywords:
            # 간단한 매칭: 동화 제목이나 내용에 키워드가 포함된 것 추천
            for i, title in enumerate(story_titles[:20], 1):
                similarity_score = 0
                for kw in keywords:
                    if kw in title:
                        similarity_score += 30
                
                if similarity_score > 0:
                    similar_stories.append({
                        "story_id": i,
                        "title": title,
                        "similarity": min(similarity_score, 95)
                    })
        
        # 점수 높은 순으로 정렬, 상위 3개
        similar_stories = sorted(similar_stories, key=lambda x: x['similarity'], reverse=True)[:3]
        analysis_result['similar_stories'] = similar_stories
        
        # ✅ Supabase에 저장 (컬렉션)
        if supabase_client:
            try:
                saved = supabase_client.table('user_k_content').insert({
                    'user_id': user_id,
                    'story_id': story_id,
                    'content_text': content_text,
                    'content_type': content_type,
                    'source_title': source_title,
                    'source_artist': source_artist,
                    'grammar_analysis': analysis_result.get('grammar_patterns', []),
                    'vocabulary_analysis': analysis_result.get('vocabulary', []),
                    'difficulty_level': analysis_result.get('difficulty_level', 'intermediate'),
                    'similar_stories': similar_stories
                }).execute()
                
                print(f"✅ K-콘텐츠 저장 완료: content_id={saved.data[0]['id'] if saved.data else 'N/A'}", flush=True)
                analysis_result['content_id'] = saved.data[0]['id'] if saved.data else None
                
            except Exception as e:
                print(f"⚠️ K-콘텐츠 저장 실패: {e}", flush=True)
        
        return jsonify(analysis_result)
        
    except json.JSONDecodeError as e:
        print(f"❌ JSON 파싱 오류: {e}", flush=True)
        return jsonify({"error": f"응답 형식 오류: {str(e)}"}), 500
    except Exception as e:
        print(f"❌ K-콘텐츠 분석 오류: {type(e).__name__}: {str(e)}", flush=True)
        import traceback
        print(traceback.format_exc(), flush=True)
        return jsonify({"error": f"분석 오류: {str(e)}"}), 500


@app.route('/api/k-content/my-collection', methods=['GET'])
def get_my_k_content():
    """사용자의 K-콘텐츠 컬렉션 조회"""
    user_id = request.args.get('user_id')
    
    if not user_id:
        return jsonify({"error": "user_id가 필요합니다"}), 400
    
    if not supabase_client:
        return jsonify({"error": "Supabase가 설정되지 않았습니다"}), 503
    
    try:
        result = supabase_client.table('user_k_content')\
            .select('*')\
            .eq('user_id', user_id)\
            .order('created_at', desc=True)\
            .execute()
        
        return jsonify({
            "total": len(result.data),
            "collection": result.data
        })
    except Exception as e:
        print(f"❌ 컬렉션 조회 오류: {e}", flush=True)
        return jsonify({"error": str(e)}), 500


@app.route('/api/k-content/<content_id>', methods=['DELETE'])
def delete_k_content(content_id):
    """K-콘텐츠 삭제"""
    user_id = request.args.get('user_id')
    
    if not user_id:
        return jsonify({"error": "user_id가 필요합니다"}), 400
    
    if not supabase_client:
        return jsonify({"error": "Supabase가 설정되지 않았습니다"}), 503
    
    try:
        supabase_client.table('user_k_content')\
            .delete()\
            .eq('id', content_id)\
            .eq('user_id', user_id)\
            .execute()
        
        return jsonify({"success": True, "message": "삭제되었습니다"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/k-content/public', methods=['GET'])
def get_public_k_content():
    """공개된 인기 K-콘텐츠 조회"""
    if not supabase_client:
        return jsonify({"error": "Supabase가 설정되지 않았습니다"}), 503
    
    try:
        limit = request.args.get('limit', 20)
        
        result = supabase_client.table('user_k_content')\
            .select('*')\
            .eq('is_public', True)\
            .order('likes_count', desc=True)\
            .limit(limit)\
            .execute()
        
        return jsonify({
            "total": len(result.data),
            "popular_content": result.data
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================================================
# Auth API (회원가입/로그인)
# ============================================================================

@app.route('/api/auth/signup', methods=['POST'])
def auth_signup():
    """
    회원가입 (이메일 + 비밀번호)
    POST body: { "email": "user@example.com", "password": "password123", "display_name": "홍길동" }
    """
    if not supabase_client:
        return jsonify({"error": "Supabase가 설정되지 않았습니다"}), 503
    
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')
    display_name = data.get('display_name')
    
    if not email or not password:
        return jsonify({"error": "이메일과 비밀번호가 필요합니다"}), 400
    
    try:
        # Supabase Auth 회원가입
        auth_response = supabase_client.auth.sign_up({
            "email": email,
            "password": password,
            "options": {
                "data": {
                    "display_name": display_name or email.split('@')[0]
                }
            }
        })
        
        if auth_response.user:
            user = auth_response.user
            
            # profiles 테이블에 사용자 프로필 생성
            try:
                supabase_client.table('profiles').insert({
                    'id': user.id,
                    'email': email,
                    'display_name': display_name or email.split('@')[0],
                    'plan': 'free',
                    'coins': 10,  # 신규 무료 회원 10코인
                    'role': 'user'
                }).execute()
                
                # user_coins 테이블에도 초기화
                supabase_client.table('user_coins').insert({
                    'user_id': user.id,
                    'total_coins': 10
                }).execute()
                
                print(f"✅ 신규 회원 가입: {email}", flush=True)
            except Exception as profile_error:
                print(f"⚠️ 프로필 생성 실패 (이미 존재할 수 있음): {profile_error}", flush=True)
            
            return jsonify({
                "success": True,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "display_name": display_name or email.split('@')[0]
                },
                "session": {
                    "access_token": auth_response.session.access_token if auth_response.session else None,
                    "refresh_token": auth_response.session.refresh_token if auth_response.session else None
                }
            })
        else:
            return jsonify({"error": "회원가입 실패"}), 400
            
    except Exception as e:
        error_msg = str(e)
        print(f"❌ 회원가입 오류: {error_msg}", flush=True)
        return jsonify({"error": error_msg}), 400


@app.route('/api/auth/login', methods=['POST'])
def auth_login():
    """
    로그인 (이메일 + 비밀번호)
    POST body: { "email": "user@example.com", "password": "password123" }
    """
    if not supabase_client:
        return jsonify({"error": "Supabase가 설정되지 않았습니다"}), 503
    
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({"error": "이메일과 비밀번호가 필요합니다"}), 400
    
    try:
        # Supabase Auth 로그인
        auth_response = supabase_client.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        
        if auth_response.user and auth_response.session:
            user = auth_response.user
            
            # 프로필 정보 조회
            profile_result = supabase_client.table('profiles')\
                .select('*')\
                .eq('id', user.id)\
                .execute()
            
            profile = profile_result.data[0] if profile_result.data else None
            
            print(f"✅ 로그인 성공: {email}", flush=True)
            
            return jsonify({
                "success": True,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "display_name": profile.get('display_name') if profile else email.split('@')[0],
                    "avatar_url": profile.get('avatar_url') if profile else None,
                    "plan": profile.get('plan') if profile else 'free',
                    "coins": profile.get('coins') if profile else 100
                },
                "session": {
                    "access_token": auth_response.session.access_token,
                    "refresh_token": auth_response.session.refresh_token
                }
            })
        else:
            return jsonify({"error": "로그인 실패"}), 401
            
    except Exception as e:
        error_msg = str(e)
        print(f"❌ 로그인 오류: {error_msg}", flush=True)
        return jsonify({"error": "이메일 또는 비밀번호가 올바르지 않습니다"}), 401


@app.route('/api/auth/me', methods=['GET'])
def auth_me():
    """
    현재 로그인한 사용자 정보 조회
    Header: Authorization: Bearer <access_token>
    """
    if not supabase_client:
        return jsonify({"error": "Supabase가 설정되지 않았습니다"}), 503
    
    # Authorization 헤더에서 토큰 추출
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "인증 토큰이 필요합니다"}), 401
    
    access_token = auth_header.replace('Bearer ', '')
    
    try:
        # 토큰으로 사용자 정보 조회
        user_response = supabase_client.auth.get_user(access_token)
        
        if user_response and user_response.user:
            user = user_response.user
            
            # 프로필 정보 조회
            profile_result = supabase_client.table('profiles')\
                .select('*')\
                .eq('id', user.id)\
                .execute()
            
            profile = profile_result.data[0] if profile_result.data else None
            
            return jsonify({
                "success": True,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "display_name": profile.get('display_name') if profile else user.email.split('@')[0],
                    "avatar_url": profile.get('avatar_url') if profile else None,
                    "plan": profile.get('plan') if profile else 'free',
                    "coins": profile.get('coins') if profile else 100,
                    "current_streak": profile.get('current_streak') if profile else 0,
                    "level": profile.get('level') if profile else 1
                }
            })
        else:
            return jsonify({"error": "유효하지 않은 토큰입니다"}), 401
            
    except Exception as e:
        error_msg = str(e)
        print(f"❌ 사용자 조회 오류: {error_msg}", flush=True)
        return jsonify({"error": "인증 실패"}), 401


@app.route('/api/auth/logout', methods=['POST'])
def auth_logout():
    """
    로그아웃
    Header: Authorization: Bearer <access_token>
    """
    if not supabase_client:
        return jsonify({"error": "Supabase가 설정되지 않았습니다"}), 503
    
    try:
        # 클라이언트 측에서 토큰 제거로 충분
        # Supabase는 세션 관리를 자동으로 처리
        return jsonify({"success": True, "message": "로그아웃 성공"})
            
    except Exception as e:
        error_msg = str(e)
        print(f"❌ 로그아웃 오류: {error_msg}", flush=True)
        return jsonify({"error": "로그아웃 실패"}), 400


@app.route('/api/story/access-check/<int:story_id>', methods=['GET'])
def check_story_access(story_id):
    """
    동화 접근 권한 확인
    - Free (비회원): 1번만
    - Free (회원): 1-3번
    - Pro: 1-10번
    - Premier: 1-20번
    - Season 2 (21-50번): 2026년 2월 오픈 예정
    
    Query param: user_id (optional)
    """
    user_id = request.args.get('user_id')
    
    # 21-50번은 시즌 2 (아직 미오픈)
    if story_id >= 21:
        return jsonify({
            "access": False,
            "reason": "season_2",
            "message": "시즌 2는 2026년 2월에 오픈됩니다",
            "required_plan": "season_2"
        }), 403
    
    # 1번 동화는 누구나 접근 가능
    if story_id == 1:
        return jsonify({
            "access": True,
            "reason": "free_story",
            "message": "누구나 읽을 수 있는 동화입니다"
        })
    
    # 비회원 또는 테스트 사용자
    if not user_id or user_id == '00000000-0000-0000-0000-000000000001':
        return jsonify({
            "access": False,
            "reason": "login_required",
            "message": "로그인이 필요합니다",
            "required_plan": "free"
        }), 403
    
    # 로그인한 사용자 - 플랜 확인
    if supabase_client:
        try:
            profile_result = supabase_client.table('profiles')\
                .select('plan')\
                .eq('id', user_id)\
                .execute()
            
            if profile_result.data and len(profile_result.data) > 0:
                plan = profile_result.data[0].get('plan', 'free')
                
                # 플랜별 접근 제한
                if plan == 'free':
                    # Free 회원: 1-3번
                    if story_id <= 3:
                        return jsonify({"access": True, "reason": "free_member"})
                    else:
                        return jsonify({
                            "access": False,
                            "reason": "upgrade_required",
                            "message": "Pro 플랜이 필요합니다",
                            "required_plan": "pro"
                        }), 403
                        
                elif plan == 'pro':
                    # Pro 회원: 1-10번
                    if story_id <= 10:
                        return jsonify({"access": True, "reason": "pro_member"})
                    else:
                        return jsonify({
                            "access": False,
                            "reason": "upgrade_required",
                            "message": "Premier 플랜이 필요합니다",
                            "required_plan": "premier"
                        }), 403
                        
                elif plan == 'premier':
                    # Premier 회원: 1-20번
                    if story_id <= 20:
                        return jsonify({"access": True, "reason": "premier_member"})
                    else:
                        return jsonify({
                            "access": False,
                            "reason": "season_2",
                            "message": "시즌 2는 2026년 2월에 오픈됩니다",
                            "required_plan": "season_2"
                        }), 403
        except Exception as e:
            print(f"⚠️ 플랜 조회 오류: {e}", flush=True)
    
    # 기본: Free 회원으로 처리 (1-3번)
    if story_id <= 3:
        return jsonify({"access": True, "reason": "default_free"})
    else:
        return jsonify({
            "access": False,
            "reason": "upgrade_required",
            "message": "Pro 플랜이 필요합니다",
            "required_plan": "pro"
        }), 403


# ============================================================================
# 출석 체크 & 일일 미션 시스템
# ============================================================================

@app.route('/api/checkin', methods=['POST'])
def daily_checkin():
    """
    출석 체크
    POST body: { "user_id": "UUID" }
    """
    if not supabase_client:
        return jsonify({"error": "Supabase가 설정되지 않았습니다"}), 503
    
    data = request.get_json() or {}
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({"error": "user_id가 필요합니다"}), 400
    
    try:
        from datetime import date, timedelta
        today = date.today()
        
        # 오늘 이미 출석했는지 확인
        check_result = supabase_client.table('streak_history')\
            .select('*')\
            .eq('user_id', user_id)\
            .eq('date', today.isoformat())\
            .execute()
        
        if check_result.data and len(check_result.data) > 0:
            # 이미 출석함
            return jsonify({
                "success": False,
                "message": "오늘 이미 출석했습니다",
                "already_checked": True
            }), 400
        
        # 어제 출석 확인 (연속 출석 체크)
        yesterday = today - timedelta(days=1)
        yesterday_result = supabase_client.table('streak_history')\
            .select('*')\
            .eq('user_id', user_id)\
            .eq('date', yesterday.isoformat())\
            .execute()
        
        # 프로필 조회
        profile_result = supabase_client.table('profiles')\
            .select('current_streak, longest_streak')\
            .eq('id', user_id)\
            .execute()
        
        current_streak = 1
        longest_streak = 1
        
        if profile_result.data and len(profile_result.data) > 0:
            profile = profile_result.data[0]
            prev_streak = profile.get('current_streak', 0)
            prev_longest = profile.get('longest_streak', 0)
            
            # 어제 출석했으면 연속 출석
            if yesterday_result.data and len(yesterday_result.data) > 0:
                current_streak = prev_streak + 1
            else:
                # 끊김 - 1일부터 다시 시작
                current_streak = 1
            
            longest_streak = max(current_streak, prev_longest)
        
        # 출석 코인 보상 (기본 2코인 + 연속 출석 보너스)
        bonus_coins = 0
        if current_streak >= 7:
            bonus_coins = 5  # 7일 연속: +5코인
        elif current_streak >= 3:
            bonus_coins = 2  # 3일 연속: +2코인
        
        total_coins = 2 + bonus_coins
        
        # 출석 기록 저장
        supabase_client.table('streak_history').insert({
            'user_id': user_id,
            'date': today.isoformat(),
            'checked_in': True,
            'coins_earned': total_coins,
            'freeze_used': False
        }).execute()
        
        # 프로필 업데이트
        supabase_client.table('profiles').update({
            'current_streak': current_streak,
            'longest_streak': longest_streak,
            'last_check_in': today.isoformat()
        }).eq('id', user_id).execute()
        
        # 코인 지급
        supabase_client.rpc('add_user_coins', {
            'p_user_id': user_id,
            'p_amount': total_coins,
            'p_type': 'daily_checkin',
            'p_description': f'출석 체크 ({current_streak}일 연속)'
        }).execute()
        
        print(f"✅ 출석 체크: {user_id}, 연속 {current_streak}일, +{total_coins}코인", flush=True)
        
        return jsonify({
            "success": True,
            "current_streak": current_streak,
            "longest_streak": longest_streak,
            "coins_earned": total_coins,
            "bonus_coins": bonus_coins,
            "message": f"{current_streak}일 연속 출석!"
        })
        
    except Exception as e:
        print(f"❌ 출석 체크 오류: {e}", flush=True)
        return jsonify({"error": str(e)}), 500


@app.route('/api/missions/daily', methods=['GET'])
def get_daily_missions():
    """
    오늘의 일일 미션 조회 (없으면 자동 생성)
    Query param: user_id
    """
    if not supabase_client:
        return jsonify({"error": "Supabase가 설정되지 않았습니다"}), 503
    
    user_id = request.args.get('user_id')
    
    if not user_id:
        return jsonify({"error": "user_id가 필요합니다"}), 400
    
    try:
        from datetime import date
        import random
        
        today = date.today()
        
        # 오늘의 미션 조회
        missions_result = supabase_client.table('daily_missions')\
            .select('*')\
            .eq('user_id', user_id)\
            .eq('mission_date', today.isoformat())\
            .execute()
        
        if missions_result.data and len(missions_result.data) > 0:
            # 이미 생성된 미션이 있음
            return jsonify({
                "success": True,
                "missions": missions_result.data,
                "generated": False
            })
        
        # 오늘의 미션 생성 (4개: 어휘, 문법, 문장, K-콘텐츠)
        mission_types = [
            {
                "type": "vocabulary",
                "title": "어휘 마스터",
                "descriptions": [
                    "새로운 단어 5개 학습하기",
                    "단어장에 단어 3개 추가하기",
                    "어휘 퀴즈 통과하기"
                ],
                "coins": 5,
                "target_count": 5
            },
            {
                "type": "grammar",
                "title": "문법 정복",
                "descriptions": [
                    "문법 패턴 3개 학습하기",
                    "문법 설명 읽고 이해하기",
                    "문법 문제 5개 풀기"
                ],
                "coins": 5,
                "target_count": 3
            },
            {
                "type": "sentence",
                "title": "문장 연습",
                "descriptions": [
                    "동화 1개 완독하기",
                    "문장 3개 소리 내어 읽기",
                    "따라 읽기 점수 80점 이상 받기"
                ],
                "coins": 10,
                "target_count": 3
            },
            {
                "type": "k_content",
                "title": "K-콘텐츠 학습",
                "descriptions": [
                    "K-콘텐츠 1개 추가하기",
                    "K-콘텐츠 발음 연습하기",
                    "내 컬렉션에 저장하기"
                ],
                "coins": 10,
                "target_count": 1
            }
        ]
        
        # 각 타입별로 랜덤 설명 선택
        created_missions = []
        for mission_type in mission_types:
            description = random.choice(mission_type["descriptions"])
            
            mission_data = {
                'user_id': user_id,
                'mission_date': today.isoformat(),
                'mission_type': mission_type["type"],
                'title': mission_type["title"],
                'description': description,
                'target_count': mission_type["target_count"],
                'current_count': 0,
                'completed': False,
                'coins_reward': mission_type["coins"]
            }
            
            result = supabase_client.table('daily_missions').insert(mission_data).execute()
            if result.data and len(result.data) > 0:
                created_missions.append(result.data[0])
        
        print(f"✅ 일일 미션 생성: {user_id}, {len(created_missions)}개", flush=True)
        
        return jsonify({
            "success": True,
            "missions": created_missions,
            "generated": True
        })
        
    except Exception as e:
        print(f"❌ 일일 미션 조회 오류: {e}", flush=True)
        return jsonify({"error": str(e)}), 500


@app.route('/api/missions/complete', methods=['POST'])
def complete_mission():
    """
    미션 완료 처리
    POST body: { "user_id": "UUID", "mission_id": "UUID", "progress": 1 }
    """
    if not supabase_client:
        return jsonify({"error": "Supabase가 설정되지 않았습니다"}), 503
    
    data = request.get_json() or {}
    user_id = data.get('user_id')
    mission_id = data.get('mission_id')
    progress = data.get('progress', 1)  # 진행도 (기본 1)
    
    if not user_id or not mission_id:
        return jsonify({"error": "user_id와 mission_id가 필요합니다"}), 400
    
    try:
        # 미션 조회
        mission_result = supabase_client.table('daily_missions')\
            .select('*')\
            .eq('id', mission_id)\
            .eq('user_id', user_id)\
            .execute()
        
        if not mission_result.data or len(mission_result.data) == 0:
            return jsonify({"error": "미션을 찾을 수 없습니다"}), 404
        
        mission = mission_result.data[0]
        
        # 이미 완료된 미션
        if mission.get('completed'):
            return jsonify({
                "success": False,
                "message": "이미 완료된 미션입니다",
                "mission": mission
            }), 400
        
        # 진행도 업데이트
        current_count = mission.get('current_count', 0) + progress
        target_count = mission.get('target_count', 1)
        completed = current_count >= target_count
        
        # 미션 업데이트
        update_data = {
            'current_count': current_count,
            'completed': completed
        }
        
        if completed:
            update_data['completed_at'] = datetime.now().isoformat()
        
        supabase_client.table('daily_missions')\
            .update(update_data)\
            .eq('id', mission_id)\
            .execute()
        
        # 완료 시 코인 지급
        coins_earned = 0
        if completed:
            coins_reward = mission.get('coins_reward', 5)
            
            supabase_client.rpc('add_user_coins', {
                'p_user_id': user_id,
                'p_amount': coins_reward,
                'p_type': 'mission_complete',
                'p_description': f'미션 완료: {mission.get("title")}'
            }).execute()
            
            coins_earned = coins_reward
            print(f"✅ 미션 완료: {mission.get('title')}, +{coins_reward}코인", flush=True)
        
        return jsonify({
            "success": True,
            "completed": completed,
            "current_count": current_count,
            "target_count": target_count,
            "coins_earned": coins_earned,
            "message": "미션 완료!" if completed else "진행 중"
        })
        
    except Exception as e:
        print(f"❌ 미션 완료 처리 오류: {e}", flush=True)
        return jsonify({"error": str(e)}), 500


# ============================================================================
# 관리자 API (bunz5911@gmail.com 전용)
# ============================================================================

def check_admin_permission(user_id):
    """관리자 권한 확인"""
    if not supabase_client:
        return False
    
    try:
        profile_result = supabase_client.table('profiles')\
            .select('email, role')\
            .eq('id', user_id)\
            .execute()
        
        if profile_result.data and len(profile_result.data) > 0:
            profile = profile_result.data[0]
            return profile.get('email') == 'bunz5911@gmail.com' and profile.get('role') == 'supervisor'
        
        return False
    except Exception as e:
        print(f"⚠️ 권한 확인 오류: {e}", flush=True)
        return False


@app.route('/api/admin/users', methods=['GET'])
def admin_get_users():
    """
    관리자 전용: 회원 목록 조회
    Query params: page, limit, search
    Header: Authorization: Bearer <access_token>
    """
    if not supabase_client:
        return jsonify({"error": "Supabase가 설정되지 않았습니다"}), 503
    
    # 권한 확인
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "인증이 필요합니다"}), 401
    
    try:
        access_token = auth_header.replace('Bearer ', '')
        user_response = supabase_client.auth.get_user(access_token)
        
        if not user_response or not user_response.user:
            return jsonify({"error": "유효하지 않은 토큰입니다"}), 401
        
        user_id = user_response.user.id
        
        # 관리자 권한 확인
        if not check_admin_permission(user_id):
            return jsonify({"error": "관리자 권한이 필요합니다"}), 403
        
        # 회원 목록 조회
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        search = request.args.get('search', '')
        
        offset = (page - 1) * limit
        
        query = supabase_client.table('profiles').select('*')
        
        if search:
            query = query.or_(f'email.ilike.%{search}%,display_name.ilike.%{search}%')
        
        result = query.order('created_at', desc=True)\
            .range(offset, offset + limit - 1)\
            .execute()
        
        # 전체 회원 수
        count_result = supabase_client.table('profiles')\
            .select('id', count='exact')\
            .execute()
        
        total = count_result.count if count_result.count else 0
        
        return jsonify({
            "success": True,
            "users": result.data,
            "total": total,
            "page": page,
            "limit": limit
        })
        
    except Exception as e:
        print(f"❌ 회원 목록 조회 오류: {e}", flush=True)
        return jsonify({"error": str(e)}), 500


@app.route('/api/admin/stats', methods=['GET'])
def admin_get_stats():
    """
    관리자 전용: 통계 조회
    Header: Authorization: Bearer <access_token>
    """
    if not supabase_client:
        return jsonify({"error": "Supabase가 설정되지 않았습니다"}), 503
    
    # 권한 확인
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "인증이 필요합니다"}), 401
    
    try:
        access_token = auth_header.replace('Bearer ', '')
        user_response = supabase_client.auth.get_user(access_token)
        
        if not user_response or not user_response.user:
            return jsonify({"error": "유효하지 않은 토큰입니다"}), 401
        
        user_id = user_response.user.id
        
        # 관리자 권한 확인
        if not check_admin_permission(user_id):
            return jsonify({"error": "관리자 권한이 필요합니다"}), 403
        
        from datetime import date, timedelta
        today = date.today()
        last_30_days = today - timedelta(days=30)
        
        # 전체 회원 수
        total_users = supabase_client.table('profiles')\
            .select('id', count='exact')\
            .execute()
        
        # 신규 회원 (최근 30일)
        new_users = supabase_client.table('profiles')\
            .select('id', count='exact')\
            .gte('created_at', last_30_days.isoformat())\
            .execute()
        
        # 플랜별 회원 수
        free_users = supabase_client.table('profiles')\
            .select('id', count='exact')\
            .eq('plan', 'free')\
            .execute()
        
        pro_users = supabase_client.table('profiles')\
            .select('id', count='exact')\
            .eq('plan', 'pro')\
            .execute()
        
        premier_users = supabase_client.table('profiles')\
            .select('id', count='exact')\
            .eq('plan', 'premier')\
            .execute()
        
        # 활성 사용자 (최근 7일 내 출석)
        last_7_days = today - timedelta(days=7)
        active_users = supabase_client.table('streak_history')\
            .select('user_id', count='exact')\
            .gte('date', last_7_days.isoformat())\
            .execute()
        
        # 총 코인 발행량
        total_coins_result = supabase_client.table('coin_transactions')\
            .select('amount')\
            .gte('amount', 0)\
            .execute()
        
        total_coins_issued = sum(t['amount'] for t in total_coins_result.data) if total_coins_result.data else 0
        
        # 월 매출 추정 (Pro: $13.99, Premier: $29.99)
        monthly_revenue = (pro_users.count or 0) * 13.99 + (premier_users.count or 0) * 29.99
        
        return jsonify({
            "success": True,
            "stats": {
                "total_users": total_users.count or 0,
                "new_users_30d": new_users.count or 0,
                "active_users_7d": len(set(t['user_id'] for t in active_users.data)) if active_users.data else 0,
                "free_users": free_users.count or 0,
                "pro_users": pro_users.count or 0,
                "premier_users": premier_users.count or 0,
                "total_coins_issued": total_coins_issued,
                "monthly_revenue": round(monthly_revenue, 2)
            }
        })
        
    except Exception as e:
        print(f"❌ 통계 조회 오류: {e}", flush=True)
        return jsonify({"error": str(e)}), 500


@app.route('/api/admin/user/<user_id>/update', methods=['POST'])
def admin_update_user(user_id):
    """
    관리자 전용: 회원 정보 수정
    Header: Authorization: Bearer <access_token>
    POST body: { "plan": "pro", "coins": 100 }
    """
    if not supabase_client:
        return jsonify({"error": "Supabase가 설정되지 않았습니다"}), 503
    
    # 권한 확인
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "인증이 필요합니다"}), 401
    
    try:
        access_token = auth_header.replace('Bearer ', '')
        user_response = supabase_client.auth.get_user(access_token)
        
        if not user_response or not user_response.user:
            return jsonify({"error": "유효하지 않은 토큰입니다"}), 401
        
        admin_id = user_response.user.id
        
        # 관리자 권한 확인
        if not check_admin_permission(admin_id):
            return jsonify({"error": "관리자 권한이 필요합니다"}), 403
        
        data = request.get_json() or {}
        update_data = {}
        
        if 'plan' in data:
            update_data['plan'] = data['plan']
        
        if 'coins' in data:
            update_data['coins'] = data['coins']
        
        if update_data:
            supabase_client.table('profiles')\
                .update(update_data)\
                .eq('id', user_id)\
                .execute()
            
            print(f"✅ 관리자 회원 수정: {user_id}, {update_data}", flush=True)
        
        return jsonify({
            "success": True,
            "message": "회원 정보가 수정되었습니다"
        })
        
    except Exception as e:
        print(f"❌ 회원 수정 오류: {e}", flush=True)
        return jsonify({"error": str(e)}), 500


# ============================================================================
# [3] 서버 시작
# ============================================================================
if __name__ == '__main__':
    print("🌐 서버 주소: http://localhost:8080")
    print("📱 동화 목록: http://localhost:8080/api/stories")
    print("="*80 + "\n")
    
    app.run(debug=True, port=8080, host='0.0.0.0')
