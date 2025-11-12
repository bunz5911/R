#!/usr/bin/env python3
"""
0번 동화(도깨비 키친) 전체 읽기 MP3 파일 생성 스크립트
한 번만 실행하여 story-0.mp3 파일을 생성합니다.
"""
import os
import sys
import base64

# requests 모듈 import (서버와 동일한 방식)
try:
    import requests as http_requests
except ImportError:
    print("❌ requests 모듈이 설치되지 않았습니다.")
    print("   설치 방법: pip install requests python-docx")
    sys.exit(1)

# docx 모듈 import
try:
    from docx import Document
except ImportError:
    print("❌ python-docx 모듈이 설치되지 않았습니다.")
    print("   설치 방법: pip install python-docx")
    sys.exit(1)

# 환경 설정
ELEVENLABS_API_KEY = os.environ.get('ELEVENLABS_API_KEY')
VOICE_ID = 'uyVNoMrnUku1dZyVEXwD'  # Anna 음성
OUTPUT_PATH = 'audio/full-stories/story-0.mp3'

def load_story_text():
    """도깨비 키친 원고 읽기"""
    doc_path = 'stories/00_도깨비 키친.docx'
    if not os.path.exists(doc_path):
        print(f"❌ 파일을 찾을 수 없습니다: {doc_path}")
        sys.exit(1)
    
    doc = Document(doc_path)
    paragraphs = []
    for para in doc.paragraphs:
        if para.text.strip():
            paragraphs.append(para.text.strip())
    
    return '\n\n'.join(paragraphs)

def generate_audio_chunks(text, max_chunk_size=2000):
    """텍스트를 청크로 분할 (문단 단위)"""
    paragraphs = text.split('\n\n')
    chunks = []
    current_chunk = ""
    
    for para in paragraphs:
        # 현재 청크에 문단을 추가했을 때 크기 확인
        if len(current_chunk) + len(para) > max_chunk_size and current_chunk:
            chunks.append(current_chunk.strip())
            current_chunk = para
        else:
            current_chunk += "\n\n" + para if current_chunk else para
    
    if current_chunk:
        chunks.append(current_chunk.strip())
    
    return chunks

def generate_tts_chunk(text, voice_id, api_key):
    """단일 청크 TTS 생성"""
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = {
        "xi-api-key": api_key,
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
    
    response = http_requests.post(url, json=payload, headers=headers, timeout=60)
    if response.status_code == 200:
        return response.content
    else:
        raise Exception(f"ElevenLabs API 오류: {response.status_code} - {response.text}")

def combine_mp3_files(chunks_data, output_path):
    """MP3 청크들을 하나로 합치기"""
    # MP3 파일은 단순히 바이트를 합치면 됩니다 (ElevenLabs가 올바른 형식으로 반환)
    combined_data = b''.join(chunks_data)
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'wb') as f:
        f.write(combined_data)
    
    print(f"✅ MP3 파일 저장 완료: {output_path}")
    print(f"   파일 크기: {len(combined_data) / 1024 / 1024:.2f} MB")

def main():
    print("="*80)
    print("🎵 0번 동화(도깨비 키친) 전체 읽기 MP3 생성")
    print("="*80)
    
    if not ELEVENLABS_API_KEY:
        print("❌ ELEVENLABS_API_KEY 환경변수가 설정되지 않았습니다.")
        print("   start_server.sh에서 환경변수를 확인하세요.")
        sys.exit(1)
    
    # 원고 읽기
    print("\n📖 원고 읽기 중...")
    full_text = load_story_text()
    print(f"✅ 원고 로드 완료: {len(full_text)}자")
    
    # 청크 분할
    print("\n📝 텍스트 청크 분할 중...")
    chunks = generate_audio_chunks(full_text)
    print(f"✅ {len(chunks)}개 청크로 분할 완료")
    
    # 각 청크 TTS 생성
    print("\n🔊 TTS 음성 생성 중...")
    print("   ⚠️ 이 작업은 몇 분이 걸릴 수 있습니다.")
    audio_chunks = []
    for i, chunk in enumerate(chunks, 1):
        print(f"   청크 {i}/{len(chunks)} 처리 중... ({len(chunk)}자)")
        try:
            audio_data = generate_tts_chunk(chunk, VOICE_ID, ELEVENLABS_API_KEY)
            audio_chunks.append(audio_data)
            print(f"   ✅ 청크 {i} 완료 ({len(audio_data) / 1024:.1f} KB)")
        except Exception as e:
            print(f"   ❌ 청크 {i} 실패: {e}")
            sys.exit(1)
    
    # MP3 파일 합치기 및 저장
    print("\n💾 MP3 파일 저장 중...")
    combine_mp3_files(audio_chunks, OUTPUT_PATH)
    
    print("\n" + "="*80)
    print("✅ 완료! story-0.mp3 파일이 생성되었습니다.")
    print(f"   파일 위치: {OUTPUT_PATH}")
    print("="*80)

if __name__ == '__main__':
    main()

