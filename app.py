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
story_files = {}  # {filename: filepath} - 메모리 절약: 경로만 저장

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
    global story_files
    
    if not os.path.exists(DOC_FOLDER):
        print(f"❌ 폴더를 찾을 수 없습니다: {DOC_FOLDER}", flush=True)
        return
    
    doc_files = sorted(glob.glob(os.path.join(DOC_FOLDER, "*.docx")))
    print(f"📚 총 {len(doc_files)}개의 동화 발견", flush=True)
    
    for doc_path in doc_files:
        filename = os.path.basename(doc_path)[:-5]  # .docx 제거
        story_files[filename] = doc_path
        print(f"  ✓ {filename}", flush=True)
    
    print(f"✅ 총 {len(story_files)}개의 동화 파일 등록 완료\n", flush=True)


def get_story_content(filename):
    """필요할 때만 동화 파일을 읽음 (Lazy Loading)"""
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
        "stories_loaded": len(story_files),
        "precomputed_analysis": len(PRECOMPUTED_ANALYSIS),
        "cache_sample": list(PRECOMPUTED_ANALYSIS.keys())[:5] if PRECOMPUTED_ANALYSIS else []
    })

@app.route('/api/stories', methods=['GET'])
def get_stories():
    """50개 동화 목록 반환 (Lazy Loading)"""
    story_list = []
    for i, title in enumerate(story_files.keys(), 1):
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
    
    if story_id < 1 or story_id > len(story_files):
        print(f"❌ 잘못된 story_id: {story_id}", flush=True)
        return jsonify({"error": "동화를 찾을 수 없습니다"}), 404
    
    title = list(story_files.keys())[story_id - 1]
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
    
    if story_id < 1 or story_id > len(story_files):
        print(f"❌ 잘못된 story_id: {story_id}", flush=True)
        return jsonify({"error": "동화를 찾을 수 없습니다"}), 404
    
    data = request.get_json() or {}
    level = data.get('level', '초급')
    print(f"📊 요청된 레벨: {level}", flush=True)
    
    # 동화 제목 가져오기
    title = list(story_files.keys())[story_id - 1]
    print(f"📚 동화 제목: {title}", flush=True)
    
    # ✅ 1순위: 사전 생성된 분석 데이터 확인 (0.1초 이내)
    if title in PRECOMPUTED_ANALYSIS and level in PRECOMPUTED_ANALYSIS[title]:
        print(f"✅ [캐시 HIT] {title} - {level} (사전 생성 데이터)", flush=True)
        result = PRECOMPUTED_ANALYSIS[title][level].copy()
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
                .eq('story_title', title)\
                .eq('level', level)\
                .execute()
            
            if cached.data and len(cached.data) > 0:
                print(f"✅ [캐시 HIT] {title} - {level} (Supabase)", flush=True)
                result = cached.data[0]['result']
                result['story_id'] = story_id
                result['title'] = title
                result['level'] = level
                result['cached'] = True
                return jsonify(result)
        except Exception as e:
            print(f"⚠️ Supabase 캐시 조회 실패: {e}", flush=True)
    
    # ✅ 3순위: Gemini API 실시간 분석 (느림)
    print(f"⚠️ [캐시 MISS] {title} - {level}, Gemini API 호출 중...", flush=True)
    
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
        print(f"🤖 Gemini API 호출 시작: {title} - {level}", flush=True)
        
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
                    'story_title': title,
                    'level': level,
                    'result': result,
                    'created_at': datetime.now().isoformat()
                }, on_conflict='story_title,level').execute()
                print(f"✅ Supabase에 분석 결과 캐싱 완료: {title} - {level}", flush=True)
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
    Google TTS (fallback) + ElevenLabs (프리미엄)
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
    
    # ✅ Voice ID로 Provider 감지
    is_elevenlabs = not voice_id.startswith('ko-KR')
    
    # ============================================================================
    # ElevenLabs TTS (프리미엄)
    # ============================================================================
    if is_elevenlabs:
        try:
            import requests as http_requests
            
            elevenlabs_api_key = os.environ.get('ELEVENLABS_API_KEY')
            if not elevenlabs_api_key:
                print("⚠️ ELEVENLABS_API_KEY 없음, Google TTS로 fallback", flush=True)
                # Fallback to Google
                voice_id = 'ko-KR-Studio-A'
                is_elevenlabs = False
            else:
                print(f"🎤 ElevenLabs TTS 호출: voice={voice_id}", flush=True)
                
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
                    print(f"❌ ElevenLabs API 오류: {response.status_code}", flush=True)
                    print(f"응답: {response.text}", flush=True)
                    # Fallback to Google
                    voice_id = 'ko-KR-Studio-A'
                    is_elevenlabs = False
                    
        except Exception as e:
            print(f"❌ ElevenLabs 오류: {e}", flush=True)
            # Fallback to Google
            voice_id = 'ko-KR-Studio-A'
            is_elevenlabs = False
    
    # ============================================================================
    # Google Cloud TTS (Fallback)
    # ============================================================================
    if not is_elevenlabs:
        if not tts_client:
            return jsonify({"error": "TTS 서비스가 설정되지 않았습니다"}), 503
        
        try:
            print(f"🎤 Google TTS 호출: voice={voice_id}", flush=True)
            
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
            print(f"✅ Google TTS 음성 생성 완료: {len(text)}자", flush=True)
            
            return jsonify({
                "audio": audio_base64,
                "voice": voice_id,
                "provider": "google",
                "text_length": len(text)
            })
            
        except Exception as e:
            print(f"❌ Google TTS 오류: {e}", flush=True)
            return jsonify({"error": f"음성 합성 오류: {str(e)}"}), 500


@app.route('/api/story/<int:story_id>/quiz', methods=['POST'])
def generate_quiz(story_id):
    """
    동화 기반 퀴즈 생성
    POST body: { "level": "초급|중급|고급", "count": 15 }
    """
    if story_id < 1 or story_id > len(story_files):
        return jsonify({"error": "동화를 찾을 수 없습니다"}), 404
    
    data = request.get_json() or {}
    level = data.get('level', '초급')
    count = data.get('count', 15)
    
    # 동화 로드 (Lazy Loading)
    title = list(story_files.keys())[story_id - 1]
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
            'paragraph_num': paragraph_num,
            'quiz_score': quiz_score,
            'pronunciation_score': pronunciation_score,
            'session_type': session_type,
            'study_date': 'now()'
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
    """사용자 코인 조회"""
    if not supabase_client:
        return jsonify({"total_coins": 0, "error": "Supabase가 설정되지 않았습니다"}), 503
    
    try:
        result = supabase_client.table('user_coins')\
            .select('total_coins')\
            .eq('user_id', user_id)\
            .execute()
        
        if result.data and len(result.data) > 0:
            return jsonify({"total_coins": result.data[0]['total_coins']})
        else:
            # 사용자 코인 데이터가 없으면 0으로 초기화
            supabase_client.table('user_coins').insert({
                'user_id': user_id,
                'total_coins': 0
            }).execute()
            return jsonify({"total_coins": 0})
    except Exception as e:
        return jsonify({"error": str(e), "total_coins": 0}), 500


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
# [3] 서버 시작
# ============================================================================
if __name__ == '__main__':
    print("🌐 서버 주소: http://localhost:8080")
    print("📱 동화 목록: http://localhost:8080/api/stories")
    print("="*80 + "\n")
    
    app.run(debug=True, port=8080, host='0.0.0.0')
