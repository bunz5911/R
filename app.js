/**
 * K-Context Master - 한국어 동화 학습 앱
 * 순수 JavaScript (No Framework)
 */

// 배포 환경 감지: Netlify에서는 Render 백엔드 사용, 로컬에서는 localhost 사용
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8080/api'
    : 'https://r-6s57.onrender.com/api';

// ============================================================================
// 🚀 하드코딩된 동화 목록 (즉시 로딩용)
// ============================================================================
const PRELOADED_STORIES = [
    { id: 1, title: "강아지 닥스훈트", preview: "" },
    { id: 2, title: "공룡발자국", preview: "" },
    { id: 3, title: "기린", preview: "" },
    { id: 4, title: "까치집", preview: "" },
    { id: 5, title: "꿀벌", preview: "" },
    { id: 6, title: "낡은노트", preview: "" },
    { id: 7, title: "냉장고", preview: "" },
    { id: 8, title: "대나무", preview: "" },
    { id: 9, title: "독수리", preview: "" },
    { id: 10, title: "막대자석", preview: "" },
    { id: 11, title: "뭉게구름", preview: "" },
    { id: 12, title: "밍크고래", preview: "" },
    { id: 13, title: "박물관", preview: "" },
    { id: 14, title: "반코팅장갑", preview: "" },
    { id: 15, title: "블랙다이아몬드", preview: "" },
    { id: 16, title: "빨간신호등", preview: "" },
    { id: 17, title: "색과무늬", preview: "" },
    { id: 18, title: "세탁소드라이클리너", preview: "" },
    { id: 19, title: "수영장 꽃무늬 투명 튜브", preview: "" },
    { id: 20, title: "숫자2", preview: "" },
    { id: 21, title: "숲", preview: "" },
    { id: 22, title: "시간을파는자판기", preview: "" },
    { id: 23, title: "시내버스", preview: "" },
    { id: 24, title: "아기밥그릇", preview: "" },
    { id: 25, title: "아기북극곰", preview: "" },
    { id: 26, title: "애벌레", preview: "" },
    { id: 27, title: "야구장빗자루", preview: "" },
    { id: 28, title: "얼굴", preview: "" },
    { id: 29, title: "엘리베이터", preview: "" },
    { id: 30, title: "여자화장실", preview: "" },
    { id: 31, title: "유리구슬", preview: "" },
    { id: 32, title: "은수저", preview: "" },
    { id: 33, title: "자동차바퀴", preview: "" },
    { id: 34, title: "전기", preview: "" },
    { id: 35, title: "전기+-", preview: "" },
    { id: 36, title: "조개눈물", preview: "" },
    { id: 37, title: "종이에이포", preview: "" },
    { id: 38, title: "주방 가위", preview: "" },
    { id: 39, title: "청바지와스커트", preview: "" },
    { id: 40, title: "칭찬스티커", preview: "" },
    { id: 41, title: "케이크", preview: "" },
    { id: 42, title: "쿠션", preview: "" },
    { id: 43, title: "크레파스", preview: "" },
    { id: 44, title: "크리스마스트리", preview: "" },
    { id: 45, title: "택배상자", preview: "" },
    { id: 46, title: "팬지꽃", preview: "" },
    { id: 47, title: "풍차날개", preview: "" },
    { id: 48, title: "허수아비", preview: "" },
    { id: 49, title: "흔들바위", preview: "" },
    { id: 50, title: "희망", preview: "" }
];

// 전역 상태
let currentStories = [];
let currentStory = null;
let currentAnalysis = null;
let currentLevel = '초급';
let currentTab = 'summary';
let userDifficultyPreference = null;  // 사용자 난이도 선호도

// 사용자 정보
let currentUserId = localStorage.getItem('userId') || '00000000-0000-0000-0000-000000000001';  // 테스트 사용자
let completedTabs = new Set();  // 완료한 탭 추적
let userCoins = 0;  // 사용자 코인

// TTS 설정
let ttsVoice = null;
let allVoices = [];
let selectedVoiceIndex = -1;
let useGoogleTTS = false;  // Google Cloud TTS 사용 여부
let googleTTSVoices = [];  // Google TTS 음성 목록
// ✅ 기본 음성: ElevenLabs Anna (최고 품질, 프리미엄)
let selectedGoogleVoice = 'uyVNoMrnUku1dZyVEXwD';
let currentAudio = null;  // 현재 재생 중인 오디오
let isPlaying = false;  // 재생 상태
let currentPlayingButton = null;  // 현재 재생 버튼
let recognition = null;
let recordedText = '';

// ============================================================================
// [1] 초기화
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    // ✅ 온보딩 체크 (첫 방문자)
    checkOnboarding();
    
    initializeTTS();
    initializeSTT();
    loadGoogleTTSVoices();  // Google TTS 음성 목록 로드
    loadUserCoins();  // ✅ 사용자 코인 로드
    loadStories();
    setupEventListeners();
    loadVoicePreference();
});

// ============================================================================
// [0] 온보딩 체크
// ============================================================================
function checkOnboarding() {
    const hasSeenOnboarding = localStorage.getItem('onboarding_complete');
    
    if (!hasSeenOnboarding) {
        // 온보딩 페이지로 리다이렉트
        window.location.href = 'onboarding.html';
    }
}

function resetOnboarding() {
    // 온보딩 완료 상태 초기화
    localStorage.removeItem('onboarding_complete');
    // 온보딩 페이지로 이동
    window.location.href = 'onboarding.html';
}

function setupEventListeners() {
    // 레벨 선택
    document.querySelectorAll('.level-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentLevel = e.target.dataset.level;
        });
    });

    // 탭 전환
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchTab(e.target.dataset.tab);
        });
    });
}

// ============================================================================
// [1-1] 사용자 코인 로드
// ============================================================================
async function loadUserCoins() {
    try {
        const response = await fetch(`${API_BASE}/user/${currentUserId}/coins`);
        const data = await response.json();
        userCoins = data.total_coins || 0;
        updateCoinDisplay();
    } catch (error) {
        console.log('⚠️ 코인 로드 실패:', error.message);
        userCoins = 0;
    }
}

function updateCoinDisplay() {
    // 코인 표시 제거됨 - 표시하지 않음
    console.log('현재 코인:', userCoins);
}

// ============================================================================
// [1-2] 학습 기록을 Supabase에 저장
// ============================================================================
async function recordStudySession(data) {
    try {
        const response = await fetch(`${API_BASE}/user/record-study`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: currentUserId,
                story_id: currentStory.id,
                story_title: currentStory.title,
                level: currentLevel,
                paragraph_num: data.paragraph_num || null,
                quiz_score: data.quiz_score || null,
                pronunciation_score: data.pronunciation_score || null,
                session_type: data.session_type || 'reading' // 'reading', 'quiz', 'pronunciation'
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ 학습 기록 저장 완료:', result);
        } else {
            console.log('⚠️ 학습 기록 저장 실패 (Supabase 미설정 가능)');
        }
    } catch (error) {
        console.log('⚠️ 학습 기록 저장 오류:', error.message);
    }
}

// ============================================================================
// [2] 동화 목록 로드 (하드코딩 데이터 즉시 표시)
// ============================================================================
async function loadStories() {
    // ✅ 즉시 하드코딩된 목록 표시 (0.1초 이내)
    currentStories = PRELOADED_STORIES;
    renderStoryList();
    
    // 백그라운드에서 서버 데이터 동기화 (선택사항)
    try {
        const response = await fetch(`${API_BASE}/stories`);
        const data = await response.json();
        // 서버 데이터가 있으면 업데이트 (필요시)
        if (data.stories && data.stories.length > 0) {
            console.log('✅ 서버 동화 목록 동기화 완료');
        }
    } catch (error) {
        console.log('⚠️ 서버 연결 실패, 로컬 데이터 사용 중:', error.message);
    }
}

function renderStoryList() {
    const listEl = document.getElementById('storyList');
    listEl.innerHTML = currentStories.map(story => `
        <div class="story-card" onclick="selectStory(${story.id})">
            <div class="story-card-title">${story.id}. ${story.title}</div>
            <div class="story-card-preview">${story.preview}</div>
        </div>
    `).join('');
}

// ============================================================================
// [3] 동화 선택 및 학습 시작
// ============================================================================
async function selectStory(storyId) {
    console.log(`📖 동화 선택: ID=${storyId}`);
    
    // ✅ 즉시 화면 전환 및 로딩 표시
    document.getElementById('storyListView').style.display = 'none';
    document.getElementById('learningView').style.display = 'flex';
    
    const contentEl = document.getElementById('learningContent');
    contentEl.innerHTML = `
        <div class="loading">
            <img src="img/loading.png" alt="Loading" class="loading-image">
            <p>동화를 불러오는 중...</p>
        </div>
    `;
    
    try {
        console.log(`📡 동화 내용 로드 시작: /story/${storyId}`);
        console.log(`🌐 API_BASE: ${API_BASE}`);
        
        // ✅ 타임아웃 설정 (60초로 증가)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.error('⏱️ 동화 로드 타임아웃 (60초 초과)');
            controller.abort();
        }, 60000);
        
        const storyResponse = await fetch(`${API_BASE}/story/${storyId}`, {
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        console.log(`✅ 동화 API 응답 받음: ${storyResponse.status}`);
        
        if (!storyResponse.ok) {
            throw new Error(`서버 오류 (${storyResponse.status})`);
        }
        
        currentStory = await storyResponse.json();
        console.log(`✅ 동화 로드 완료:`, currentStory.title);
        console.log(`📄 동화 정보:`, {
            id: currentStory.id,
            title: currentStory.title,
            fullTextLength: currentStory.full_text?.length || 0,
            paragraphsCount: currentStory.paragraphs?.length || 0
        });

        // ✅ 개인화된 로드맵: 난이도 체크 먼저
        // TODO: Git push 후 활성화
        // await showDifficultyCheck(storyId);
        
        // 임시: 바로 분석 시작
        console.log(`🔍 분석 시작...`);
        await analyzeStory(storyId);

    } catch (error) {
        console.error('❌ 동화 로드 오류:', error);
        
        let isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        let errorMsg = error.message;
        let detailMsg = '';
        
        if (error.name === 'AbortError') {
            errorMsg = '⏱️ 동화 로드 시간이 초과되었습니다 (60초).';
            detailMsg = `
                <strong>가능한 원인:</strong><br>
                1. 서버가 응답이 느립니다<br>
                2. 네트워크 연결이 불안정합니다<br>
                3. 서버가 재시작 중입니다<br>
                <br>
                <strong>해결 방법:</strong><br>
                • 페이지를 새로고침 (F5)하고 다시 시도<br>
                • 서버 로그를 확인해주세요<br>
                • 브라우저 콘솔(F12)에서 상세 로그 확인
            `;
        } else if (error.message.includes('Failed to fetch')) {
            errorMsg = '🔌 서버에 연결할 수 없습니다.';
            
            if (isLocalhost) {
                detailMsg = `
                    <strong style="color: #d32f2f;">로컬 서버가 실행되지 않았습니다!</strong><br><br>
                    새 터미널에서 다음 명령어를 실행하세요:<br>
                    <code style="background: #000; color: #0f0; padding: 12px; display: block; margin: 12px 0; border-radius: 4px; font-family: monospace;">
                    cd /Users/hongbeomseog/Desktop/RAKorean<br>
                    python app.py
                    </code>
                `;
            } else {
                detailMsg = 'Render.com 서버 상태를 확인해주세요.';
            }
        }
        
        contentEl.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 16px;">😔</div>
                <div style="font-size: 20px; font-weight: 700; color: #c62828; margin-bottom: 12px;">
                    ${errorMsg}
                </div>
                <div style="font-size: 14px; color: #666; line-height: 1.8; margin-bottom: 20px;">
                    ${detailMsg}
                </div>
                <div style="margin-top: 20px;">
                    <button class="btn" onclick="selectStory(${storyId})">
                        🔄 다시 시도
                    </button>
                    <button class="btn btn-secondary" onclick="showStoryList()">
                        ← 동화 목록으로
                    </button>
                </div>
            </div>
        `;
    }
}

// ============================================================================
// [3-1] 개인화된 로드맵: 난이도 체크
// ============================================================================
async function showDifficultyCheck(storyId) {
    const contentEl = document.getElementById('learningContent');
    
    // 첫 문장 추출 (샘플로 보여주기)
    const sampleText = currentStory.paragraphs?.[0] || currentStory.full_text?.substring(0, 100) || '';
    
    contentEl.innerHTML = `
        <div style="padding: 20px;">
            <div class="section-title">🎯 나에게 맞는 레벨을 찾아볼까요?</div>
            
            <div class="content-box" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); color: #2d3436; margin-bottom: 20px;">
                <strong>이 동화의 첫 문장입니다:</strong>
            </div>
            
            <div class="content-box" style="font-size: 20px; line-height: 1.8; font-weight: 600; background: #f8f9fa; padding: 24px;">
                ${sampleText}
            </div>
            
            <div class="section-title" style="margin-top: 30px; font-size: 18px;">이 문장이 어떻게 느껴지나요?</div>
            
            <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 16px;">
                <button class="btn" onclick="adjustDifficultyAndStart('easier')" style="background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%); font-size: 16px; padding: 20px;">
                    😰 너무 어려워요 → 더 쉬운 표현으로
                </button>
                <button class="btn" onclick="adjustDifficultyAndStart('same')" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); font-size: 16px; padding: 20px;">
                    😊 적당해요 → 지금 그대로
                </button>
                <button class="btn" onclick="adjustDifficultyAndStart('harder')" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); font-size: 16px; padding: 20px;">
                    🤓 더 어렵게 해주세요 → 고급 표현으로
                </button>
            </div>
            
            <button class="btn btn-secondary" onclick="showStoryList()" style="margin-top: 20px; width: 100%;">
                ← 동화 목록으로
            </button>
        </div>
    `;
}

async function adjustDifficultyAndStart(preference) {
    userDifficultyPreference = preference;
    console.log(`🎯 사용자 난이도 선호: ${preference}`);
    
    // 선호도에 따라 레벨 자동 조정
    if (preference === 'easier') {
        currentLevel = '초급';
        document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('[data-level="초급"]')?.classList.add('active');
    } else if (preference === 'harder') {
        currentLevel = '고급';
        document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('[data-level="고급"]')?.classList.add('active');
    }
    
    // 학습 데이터 분석 시작
    console.log(`🔍 분석 시작... (레벨: ${currentLevel})`);
    await analyzeStory(currentStory.id);
}

async function analyzeStory(storyId) {
    const contentEl = document.getElementById('learningContent');
    
    // 캐시 키 생성 (동화ID + 레벨)
    const cacheKey = `analysis_${storyId}_${currentLevel}`;
    const cachedAnalysis = localStorage.getItem(cacheKey);
    
    // 캐시된 분석 결과가 있으면 즉시 표시
    if (cachedAnalysis) {
        try {
            currentAnalysis = JSON.parse(cachedAnalysis);
            console.log('✅ 캐시된 분석 결과 로드 (즉시 표시)');
            switchTab('summary');
            return;
        } catch (e) {
            console.log('캐시 파싱 오류, 새로 분석합니다.');
            localStorage.removeItem(cacheKey);
        }
    }
    
    // 캐시가 없으면 AI 분석 시작
    contentEl.innerHTML = `
        <div class="loading">
            <img src="img/loading.png" alt="Loading" class="loading-image">
            <p>데이터를 로드합니다...</p>
        </div>
    `;

    try {
        console.log(`📡 백엔드 API 호출 시작: /story/${storyId}/analyze`);
        console.log(`🌐 API_BASE: ${API_BASE}`);
        
        // ✅ 타임아웃 설정 (120초 - Gemini API 응답 대기)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000);
        
        const response = await fetch(`${API_BASE}/story/${storyId}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ level: currentLevel }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        console.log(`📡 응답 상태: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ 서버 에러 응답:', errorText);
            throw new Error(`서버 오류 (${response.status}): ${errorText}`);
        }

        currentAnalysis = await response.json();
        console.log('✅ 분석 데이터 수신 완료');
        
        if (currentAnalysis.error) {
            throw new Error(currentAnalysis.error);
        }
        
        // 분석 결과를 캐시에 저장
        localStorage.setItem(cacheKey, JSON.stringify(currentAnalysis));
        console.log('💾 분석 결과 캐시 저장 완료');
        
        // ✅ 학습 기록 저장 (Supabase)
        recordStudySession({
            session_type: 'reading'
        });
        
        switchTab('summary'); // 요약 탭 표시
        
    } catch (error) {
        console.error('❌ 분석 오류:', error);
        
        let errorMessage = error.message;
        let suggestion = '';
        let isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        // 에러 타입별 상세 안내
        if (error.name === 'AbortError') {
            errorMessage = '⏱️ 요청 시간이 초과되었습니다 (60초).';
            suggestion = `
                <strong>가능한 원인:</strong><br>
                1. 서버가 응답하지 않음<br>
                2. Gemini API 응답이 너무 느림<br>
                3. 네트워크 속도 문제<br>
                <br>
                <strong>해결 방법:</strong><br>
                • 잠시 후 다시 시도<br>
                • 서버 상태 확인
            `;
        } else if (error.message.includes('Failed to fetch') || error.message.includes('load failed') || error.message.includes('NetworkError')) {
            errorMessage = '🔌 백엔드 서버에 연결할 수 없습니다.';
            
            if (isLocalhost) {
                suggestion = `
                    <strong style="color: #d32f2f;">⚠️ 로컬 서버가 실행되지 않았습니다!</strong><br><br>
                    <strong>해결 방법:</strong><br>
                    1. 새 터미널을 열어주세요<br>
                    2. 다음 명령어 실행:<br>
                    <code style="background: #f5f5f5; padding: 8px; display: block; margin: 8px 0; border-radius: 4px;">
                    cd /Users/hongbeomseog/Desktop/RAKorean<br>
                    ./start_server.sh
                    </code>
                    또는:<br>
                    <code style="background: #f5f5f5; padding: 8px; display: block; margin: 8px 0; border-radius: 4px;">
                    export GEMINI_API_KEY="YOUR_API_KEY"<br>
                    export ELEVENLABS_API_KEY="YOUR_API_KEY"<br>
                    python app.py
                    </code>
                    3. 서버 시작 메시지 확인<br>
                    4. 이 페이지 새로고침 (F5)
                `;
            } else {
                suggestion = `
                    <strong>가능한 원인:</strong><br>
                    1. Render.com 배포 중<br>
                    2. 서버 재시작 중<br>
                    3. 인터넷 연결 문제<br>
                    <br>
                    <a href="${API_BASE.replace('/api', '')}/health" target="_blank" style="color: #667eea; text-decoration: underline;">
                        서버 상태 확인하기 →
                    </a>
                `;
            }
        } else if (error.message.includes('500')) {
            errorMessage = '💥 서버 내부 오류가 발생했습니다.';
            suggestion = `
                <strong>가능한 원인:</strong><br>
                1. Gemini API 키 설정 확인<br>
                2. API 할당량 초과<br>
                3. 서버 설정 오류<br>
                <br>
                Render.com 로그를 확인해주세요.
            `;
        }
        
        contentEl.innerHTML = `
            <div style="padding: 20px;">
                <div class="content-box" style="background: #ffebee; border-left: 4px solid #f44336; margin-bottom: 16px;">
                    <div style="font-size: 20px; font-weight: 700; color: #c62828; margin-bottom: 12px;">
                        ${errorMessage}
                    </div>
                    <div style="font-size: 14px; color: #c62828; line-height: 1.8;">
                        ${suggestion}
                    </div>
                    <div style="margin-top: 16px; padding: 12px; background: #fff3cd; border-radius: 8px;">
                        <strong style="color: #856404;">💡 디버깅 정보:</strong><br>
                        <small style="color: #856404;">
                        API URL: ${API_BASE}<br>
                        Story ID: ${storyId}<br>
                        Level: ${currentLevel}<br>
                        브라우저 콘솔(F12)에서 상세 에러 확인
                        </small>
                    </div>
                </div>
                <button class="btn" onclick="analyzeStory(${storyId})" style="margin-top: 16px;">
                    🔄 다시 시도
                </button>
                <button class="btn btn-secondary" onclick="showStoryList()" style="margin-top: 8px;">
                    ← 동화 목록으로
                </button>
                ${isLocalhost ? `
                    <button class="btn" onclick="alert('터미널에서:\\ncd /Users/hongbeomseog/Desktop/RAKorean\\npython app.py')" style="margin-top: 8px; background: #ff9800;">
                        📋 서버 실행 명령어 보기
                    </button>
                ` : ''}
            </div>
        `;
    }
}

function showStoryList() {
    document.getElementById('learningView').style.display = 'none';
    document.getElementById('storyListView').style.display = 'block';
    stopTTS();
}

// ============================================================================
// [4] 탭 전환
// ============================================================================
function switchTab(tabName) {
    currentTab = tabName;
    
    // 완료한 탭 추적
    completedTabs.add(tabName);
    
    // 탭 버튼 활성화
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // 콘텐츠 렌더링
    const contentEl = document.getElementById('learningContent');
    
    if (!currentAnalysis) {
        contentEl.innerHTML = '<div class="loading"><img src="img/loading.png" alt="Loading" class="loading-image"><p>데이터를 로드합니다...</p></div>';
        return;
    }

    switch(tabName) {
        case 'summary':
            renderSummary();
            break;
        case 'full-story':
            renderFullStory();
            break;
        case 'paragraphs':
            renderParagraphs();
            break;
        case 'real-life':
            renderRealLife();
            break;
        case 'vocabulary':
            renderVocabulary();
            break;
        case 'wordbook':
            renderWordbook();
            break;
        case 'quiz':
            renderQuiz();
            break;
        case 'growth':
            renderGrowth();
            break;
    }
}

// ============================================================================
// [5] 각 탭 렌더링
// ============================================================================
function renderSummary() {
    const contentEl = document.getElementById('learningContent');
    contentEl.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <div class="section-title" style="margin-bottom: 0;">이야기 요약</div>
            <button class="play-btn-circle" id="summaryPlayBtn" onclick="togglePlay('summary', '${escapeQuotes(currentAnalysis.summary)}', this)">
                ▶
            </button>
        </div>
        <div class="content-box">
            ${currentAnalysis.summary || '요약 정보가 없습니다.'}
        </div>
        <div class="bottom-spacer"></div>
    `;
}

function renderFullStory() {
    const contentEl = document.getElementById('learningContent');
    const fullText = currentStory.full_text || '';
    
    contentEl.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <div class="section-title" style="margin-bottom: 0;">전체 이야기 듣기</div>
            <button class="play-btn-circle" id="fullStoryPlayBtn" onclick="togglePlay('fullStory', '${escapeQuotes(fullText)}', this)">
                ▶
            </button>
        </div>
        <div class="content-box">
            ${fullText.replace(/\n/g, '<br>')}
        </div>
        <div class="bottom-spacer"></div>
    `;
}

/**
 * 텍스트에서 첫 문장만 추출 (마침표, 물음표, 느낌표 기준)
 */
function extractFirstSentence(text) {
    if (!text) return '';
    
    // 마침표, 물음표, 느낌표로 문장 분리
    const match = text.match(/[^.!?]*[.!?]/);
    if (match) {
        return match[0].trim();
    }
    
    // 문장 구분이 없으면 첫 50자만
    return text.substring(0, 50).trim() + '...';
}

function renderParagraphs() {
    const contentEl = document.getElementById('learningContent');
    const paragraphs = currentAnalysis.paragraphs_analysis || [];
    
    if (paragraphs.length === 0) {
        contentEl.innerHTML = '<div class="content-box">문단 분석 데이터가 없습니다.</div>';
        return;
    }

    contentEl.innerHTML = `
        <div class="section-title">문단별 학습 + 읽기 평가 (${currentLevel} 레벨)</div>
        <div class="content-box" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; margin-bottom: 20px;">
            <strong>🎤 ${currentLevel}에 맞는 문장을 읽고 AI 평가를 받아 코인을 획득하세요!</strong><br>
            <small style="opacity: 0.9; margin-top: 8px; display: block;">
                📗 초급: 짧은 문장 (1-2문장) | 📘 중급: 적당한 길이 (2-4문장) | 📕 고급: 다른 표현으로 (패러프레이징)
            </small>
        </div>
        ${paragraphs.map((p, idx) => {
            // ✅ 연습용 텍스트: AI가 레벨별로 선택한 텍스트 (없으면 첫 문장 추출)
            const practiceText = p.practice_text || extractFirstSentence(p.original_text || '');
            const fullText = p.original_text || '';
            
            return `
            <div class="paragraph-item" id="paragraph${idx}">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                    <span class="paragraph-num">문단 ${p.paragraph_num || idx + 1}</span>
                    <button class="play-btn-circle" id="paraPlayBtn${idx}" onclick="togglePlay('para${idx}', '${escapeQuotes(practiceText)}', this)">
                        ▶
                    </button>
                </div>
                
                <!-- ✅ 레벨별 연습 문장 (AI가 선택한 적절한 길이) -->
                <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 16px; margin-bottom: 12px; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <div style="font-weight: 600; color: #1976d2;">🎤 연습 문장 (이 부분을 읽으세요):</div>
                        <div style="display: flex; gap: 4px;">
                            <button onclick="adjustParagraphDifficulty(${idx}, 'easier')" style="background: #84fab0; color: white; border: none; padding: 4px 8px; border-radius: 12px; font-size: 11px; cursor: pointer;" title="더 쉽게">⬇️</button>
                            <button onclick="adjustParagraphDifficulty(${idx}, 'harder')" style="background: #fa709a; color: white; border: none; padding: 4px 8px; border-radius: 12px; font-size: 11px; cursor: pointer;" title="더 어렵게">⬆️</button>
                            <button onclick="adjustParagraphDifficulty(${idx}, 'realistic')" style="background: #667eea; color: white; border: none; padding: 4px 8px; border-radius: 12px; font-size: 11px; cursor: pointer;" title="현실적 표현">💬</button>
                        </div>
                    </div>
                    <div style="font-size: 18px; font-weight: 600; line-height: 1.8; color: #333;" id="practiceText${idx}">
                        ${practiceText}
                    </div>
                </div>
                
                <details style="margin-bottom: 12px;">
                    <summary style="cursor: pointer; color: #667eea; font-weight: 600;">전체 원문 보기</summary>
                    <div style="margin-top: 12px; padding: 12px; background: #f5f5f5; border-radius: 8px;" id="originalText${idx}">
                        ${fullText}
                    </div>
                </details>
                
                <div style="font-weight: 600; color: #667eea;">쉬운 표현:</div>
                <div style="margin-bottom: 12px;">${p.simplified_text || ''}</div>
                <div style="font-weight: 600; color: #764ba2;">설명:</div>
                <div style="margin-bottom: 16px;">${p.explanation || ''}</div>
                
                <!-- ✅ 읽기 평가 버튼 -->
                <div class="control-buttons" id="recordingButtons${idx}">
                    <button class="btn" onclick="startParagraphRecording(${idx}, ${p.paragraph_num || idx + 1}, '${escapeQuotes(practiceText)}')">
                        🎤 녹음하고 평가받기
                    </button>
                </div>
                
                <!-- 녹음 상태 표시 -->
                <div class="recording-indicator" id="recordingIndicator${idx}">
                    <div class="recording-text">녹음 중...</div>
                </div>
                
                <!-- 평가 결과 -->
                <div id="evaluationResult${idx}"></div>
            </div>
        `;
        }).join('')}
        <div class="bottom-spacer"></div>
    `;
}

function renderRealLife() {
    const contentEl = document.getElementById('learningContent');
    const examples = currentAnalysis.real_life_usage || [];
    
    contentEl.innerHTML = `
        <div class="section-title">실생활 활용 (${currentLevel} 레벨)</div>
        <div class="content-box" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); color: #2d3436;">
            <strong>이 동화에서 배운 표현을 실제 대화에서 사용해보세요!</strong>
        </div>
        ${examples.map((example, idx) => `
            <div class="content-box">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="flex: 1;">
                        <strong>${idx + 1}.</strong> ${example}
                    </div>
                    <button class="play-btn-circle" onclick="togglePlay('real${idx}', '${escapeQuotes(example)}', this)" style="margin-left: 8px;">
                        ▶
                    </button>
                </div>
            </div>
        `).join('')}
        <div class="bottom-spacer"></div>
    `;
}

function renderVocabulary() {
    const contentEl = document.getElementById('learningContent');
    const vocabulary = currentAnalysis.vocabulary || [];
    const grammar = currentAnalysis.grammar || [];
    
    contentEl.innerHTML = `
        <div class="section-title">어휘 문법</div>
        
        <div class="section-title" style="font-size: 18px; margin-top: 16px;">주요 어휘</div>
        ${vocabulary.map((v, idx) => `
            <div class="vocabulary-item">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <div class="vocab-word">${v.word}</div>
                    <button class="play-btn-circle" onclick="togglePlay('vocab${idx}', '${escapeQuotes(v.word)}', this)">
                        ▶
                    </button>
                </div>
                <div class="vocab-meaning">${v.meaning}</div>
                <div class="vocab-example">예: ${v.example}</div>
            </div>
        `).join('')}

        ${grammar.length > 0 ? `
            <div class="section-title" style="font-size: 18px; margin-top: 32px;">문법 포인트</div>
            ${grammar.map((g, idx) => `
                <div class="grammar-item">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <div class="vocab-word">${g.pattern}</div>
                        <button class="play-btn-circle" onclick="togglePlay('grammar${idx}', '${escapeQuotes(g.example)}', this)">
                            ▶
                        </button>
                    </div>
                    <div class="vocab-meaning">${g.explanation}</div>
                    <div class="vocab-example">예: ${g.example}</div>
                </div>
            `).join('')}
        ` : ''}
        <div class="bottom-spacer"></div>
    `;
}

function renderWordbook() {
    const contentEl = document.getElementById('learningContent');
    
    // localStorage에서 단어장 불러오기
    let myWords = JSON.parse(localStorage.getItem('myWordbook') || '[]');
    
    contentEl.innerHTML = `
        <div class="section-title">나만의 단어장</div>
        <div class="content-box" style="background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%); color: #2d3436;">
            <strong>외우고 싶은 단어를 추가하세요!</strong>
        </div>

        <div style="margin-top: 16px;">
            <input type="text" id="newWord" placeholder="단어" style="width: calc(50% - 5px); padding: 12px; border: 2px solid #e9ecef; border-radius: 8px; font-size: 14px;">
            <input type="text" id="newMeaning" placeholder="뜻" style="width: calc(50% - 5px); padding: 12px; border: 2px solid #e9ecef; border-radius: 8px; font-size: 14px; margin-left: 10px;">
            <button class="btn" onclick="addToWordbook()" style="width: 100%; margin-top: 10px;">
                단어 추가
            </button>
        </div>

        <div style="margin-top: 24px;">
            ${myWords.length === 0 ? `
                <div class="content-box">
                    아직 저장된 단어가 없습니다.<br>
                    위에서 단어를 추가해보세요!
                </div>
            ` : myWords.map((word, idx) => `
                <div class="vocabulary-item">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div style="flex: 1;">
                            <div class="vocab-word">${word.word}</div>
                            <div class="vocab-meaning">${word.meaning}</div>
                        </div>
                        <div style="display: flex; gap: 8px; margin-left: 12px;">
                            <button class="play-btn-circle" onclick="togglePlay('word${idx}', '${escapeQuotes(word.word)}', this)">
                                ▶
                            </button>
                            <button class="btn-secondary btn" onclick="removeFromWordbook(${idx})" style="padding: 8px 14px; font-size: 12px; background: #e74c3c; border-radius: 20px; border: none;">
                                삭제
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="bottom-spacer"></div>
    `;
}

// 단어장 관리 함수
function addToWordbook() {
    const word = document.getElementById('newWord').value.trim();
    const meaning = document.getElementById('newMeaning').value.trim();
    
    if (!word || !meaning) {
        alert('단어와 뜻을 모두 입력해주세요!');
        return;
    }
    
    let myWords = JSON.parse(localStorage.getItem('myWordbook') || '[]');
    myWords.push({ word, meaning, date: new Date().toISOString() });
    localStorage.setItem('myWordbook', JSON.stringify(myWords));
    
    renderWordbook();
}

function removeFromWordbook(index) {
    if (confirm('이 단어를 단어장에서 삭제하시겠습니까?')) {
        let myWords = JSON.parse(localStorage.getItem('myWordbook') || '[]');
        myWords.splice(index, 1);
        localStorage.setItem('myWordbook', JSON.stringify(myWords));
        renderWordbook();
    }
}

// 퀴즈 렌더링
let quizData = [];
let currentQuizIndex = 0;
let correctCount = 0;

function renderQuiz() {
    const contentEl = document.getElementById('learningContent');
    
    if (!currentAnalysis.quiz_questions || currentAnalysis.quiz_questions.length === 0) {
        // 퀴즈 생성 요청
        contentEl.innerHTML = `
            <div class="section-title">이해도 확인 (퀴즈)</div>
            <div class="loading">
                <img src="img/loading.png" alt="Loading" class="loading-image">
                <p>데이터를 로드합니다...</p>
            </div>
        `;
        generateQuiz();
        return;
    }
    
    quizData = currentAnalysis.quiz_questions;
    currentQuizIndex = 0;
    correctCount = 0;
    showQuizQuestion();
}

function showQuizQuestion() {
    const contentEl = document.getElementById('learningContent');
    
    if (currentQuizIndex >= quizData.length) {
        // 퀴즈 완료
        const score = Math.round((correctCount / quizData.length) * 100);
        
        // 학습 기록 저장
        saveProgress({ quiz_score: score });
        
        contentEl.innerHTML = `
            <div class="section-title">퀴즈 완료!</div>
            <div class="evaluation-result">
                <div class="score-display">${score}점</div>
                <div class="feedback-text">
                    ${correctCount}/${quizData.length} 정답!<br>
                    ${score >= 80 ? '훌륭합니다!' : score >= 60 ? '잘했어요! 조금만 더 연습해보세요.' : '다시 한번 학습해보세요!'}
                </div>
            </div>
            <div class="control-buttons" style="margin-top: 24px;">
                <button class="btn" onclick="renderQuiz()">
                    다시 풀기
                </button>
                <button class="btn-secondary btn" onclick="switchTab('summary')">
                    학습 계속하기
                </button>
            </div>
            <div class="bottom-spacer"></div>
        `;
        return;
    }
    
    const q = quizData[currentQuizIndex];
    contentEl.innerHTML = `
        <div class="section-title">문제 ${currentQuizIndex + 1} / ${quizData.length}</div>
        <div class="content-box" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); font-size: 16px; font-weight: 600; color: #2d3436;">
            ${q.question}
        </div>

        <div style="margin-top: 20px;">
            ${q.options.map((option, idx) => `
                <div class="content-box" id="option${idx}" onclick="checkAnswer(${idx}, ${q.correct_index})" style="cursor: pointer; margin-bottom: 12px; border: 2px solid #e9ecef; transition: all 0.3s;">
                    <strong>${String.fromCharCode(65 + idx)}.</strong> ${option}
                </div>
            `).join('')}
        </div>
        
        <div id="quizFeedback" style="margin-top: 20px;"></div>
        <div class="bottom-spacer"></div>
    `;
}

function checkAnswer(selectedIndex, correctIndex) {
    const optionEl = document.getElementById(`option${selectedIndex}`);
    const feedbackEl = document.getElementById('quizFeedback');
    
    if (selectedIndex === correctIndex) {
        // 정답!
        correctCount++;
        optionEl.style.background = 'linear-gradient(135deg, #55efc4 0%, #81ecec 100%)';
        optionEl.style.animation = 'flash 0.5s ease-in-out';
        feedbackEl.innerHTML = `
            <div class="content-box" style="background: #55efc4; color: white; font-weight: 700; text-align: center;">
                정답입니다!
            </div>
        `;
        
        setTimeout(() => {
            currentQuizIndex++;
            showQuizQuestion();
        }, 1500);
    } else {
        // 오답
        optionEl.style.background = '#ff7675';
        optionEl.style.animation = 'shake 0.5s ease-in-out';
        feedbackEl.innerHTML = `
            <div class="content-box" style="background: #ff7675; color: white; font-weight: 700; text-align: center;">
                다시 시도해보세요!
            </div>
        `;
        
        setTimeout(() => {
            optionEl.style.background = '';
            optionEl.style.animation = '';
            feedbackEl.innerHTML = '';
        }, 1000);
    }
}

async function generateQuiz() {
    try {
        const response = await fetch(`${API_BASE}/story/${currentStory.id}/quiz`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ level: currentLevel, count: 15 })
        });
        
        const data = await response.json();
        if (data.quiz_questions) {
            currentAnalysis.quiz_questions = data.quiz_questions;
            renderQuiz();
        }
    } catch (error) {
        document.getElementById('learningContent').innerHTML = `
            <div class="content-box" style="color: red;">
                퀴즈 생성 오류: ${error.message}
            </div>
        `;
    }
}

function renderGrowth() {
    const contentEl = document.getElementById('learningContent');
    const fullText = currentStory.full_text || '';
    const firstParagraph = fullText.split('\n\n')[0] || fullText.substring(0, 200);
    
    contentEl.innerHTML = `
        <div class="section-title">성장 기록 (발음 테스트)</div>
        <div class="content-box" style="background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%); color: #2d3436;">
            <strong>이 문장을 읽고 녹음해보세요!</strong>
        </div>

        <div class="content-box" style="margin-top: 16px; font-size: 15px; line-height: 1.8;">
            ${firstParagraph}
        </div>

        <div class="recording-indicator" id="recordingIndicator">
            <div class="recording-text">녹음 중...</div>
        </div>

        <div class="control-buttons" style="margin-top: 16px;">
            <button class="btn" onclick="startRecording()">
                녹음 시작
            </button>
            <button class="btn-secondary btn" onclick="stopRecording()">
                녹음 중지
            </button>
        </div>

        <div id="recordedTextBox" style="margin-top: 16px;"></div>

        ${recordedText ? `
            <div class="control-buttons" style="margin-top: 16px;">
                <button class="btn-success btn" onclick="evaluateGrowth()">
                    AI 평가 받기
                </button>
            </div>
        ` : ''}

        <div id="growthFeedback"></div>
        <div class="bottom-spacer"></div>
    `;
}

async function evaluateGrowth() {
    const originalText = currentStory.full_text.split('\n\n')[0] || currentStory.full_text.substring(0, 200);
    const feedbackEl = document.getElementById('growthFeedback');
    
    feedbackEl.innerHTML = `
        <div class="loading" style="margin-top: 20px;">
            <img src="img/loading.png" alt="Loading" class="loading-image">
            <p>데이터를 로드합니다...</p>
        </div>
    `;
    
    try {
        const response = await fetch(`${API_BASE}/story/${currentStory.id}/evaluate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                original_text: originalText,
                user_text: recordedText
            })
        });

        const result = await response.json();
        
        // 발음 점수 저장
        saveProgress({ pronunciation_score: result.score });
        
        feedbackEl.innerHTML = `
            <div class="evaluation-result" style="margin-top: 20px;">
                <div class="score-display">${result.score}점</div>
                <div class="feedback-text">
                    <strong>AI 피드백:</strong><br>
                    ${result.feedback}
                </div>
            </div>

            ${result.pronunciation_tips && result.pronunciation_tips.length > 0 ? `
                <div class="section-title" style="margin-top: 24px;">발음 개선 팁</div>
                ${result.pronunciation_tips.map(tip => `
                    <div class="content-box">${tip}</div>
                `).join('')}
            ` : ''}

            ${result.corrections && result.corrections.length > 0 ? `
                <div class="section-title" style="margin-top: 24px;">교정 사항</div>
                ${result.corrections.map(c => `
                    <div class="vocabulary-item">
                        <div class="vocab-word">원문: ${c.original}</div>
                        <div class="vocab-meaning">당신: ${c.user}</div>
                        <div class="vocab-example">제안: ${c.suggestion}</div>
                    </div>
                `).join('')}
            ` : ''}
        `;
    } catch (error) {
        feedbackEl.innerHTML = `
            <div class="content-box" style="color: red; margin-top: 20px;">
                평가 오류: ${error.message}
            </div>
        `;
    }
}

// ============================================================================
// [5-1] Google Cloud TTS 로드
// ============================================================================
async function loadGoogleTTSVoices() {
    try {
        const response = await fetch(`${API_BASE}/tts/voices`);
        const data = await response.json();
        
        if (data.voices) {
            googleTTSVoices = data.voices;
            // ✅ 기본 음성: ElevenLabs Anna (최고 품질, 프리미엄)
            selectedGoogleVoice = data.default || 'uyVNoMrnUku1dZyVEXwD';
            useGoogleTTS = true;
            console.log('✅ TTS 음성 로드 완료:', googleTTSVoices.length, '개');
            console.log('✅ 기본 음성: Anna (ElevenLabs 프리미엄)');
            
            // 저장된 음성 설정 로드 (사용자가 설정한 경우)
            const saved = localStorage.getItem('selectedGoogleVoice');
            if (saved) {
                selectedGoogleVoice = saved;
                console.log('✅ 사용자 설정 음성 로드:', saved);
            }
        }
    } catch (error) {
        console.log('⚠️ 백엔드 TTS 사용 불가, Web Speech API 사용');
        useGoogleTTS = false;
    }
}

// ============================================================================
// [6] TTS (Text-to-Speech) 기능
// ============================================================================
function initializeTTS() {
    if ('speechSynthesis' in window) {
        // 음성 목록 로드
        const loadVoices = () => {
            allVoices = window.speechSynthesis.getVoices();
            
            // 한국어 음성만 필터링
            allVoices = allVoices.filter(v => 
                v.lang.startsWith('ko') || v.lang === 'ko-KR' || v.name.includes('Korean')
            );
            
            // 만약 한국어 음성이 없으면 모든 음성 표시
            if (allVoices.length === 0) {
                allVoices = window.speechSynthesis.getVoices();
            }
            
            // 기본 음성 설정 - "구글 한국의" 우선 선택
            if (allVoices.length > 0 && !ttsVoice) {
                // 1순위: "Google 한국의" 찾기
                let googleKoreanIndex = allVoices.findIndex(v => 
                    v.name.includes('Google') && v.name.includes('한국')
                );
                
                // 2순위: "Google Korean" 찾기
                if (googleKoreanIndex === -1) {
                    googleKoreanIndex = allVoices.findIndex(v => 
                        v.name.includes('Google') && v.name.includes('Korean')
                    );
                }
                
                // 3순위: "Google ko" 찾기
                if (googleKoreanIndex === -1) {
                    googleKoreanIndex = allVoices.findIndex(v => 
                        v.name.includes('Google') && v.lang.startsWith('ko')
                    );
                }
                
                // 구글 한국의를 찾았으면 선택, 아니면 첫 번째 음성
                if (googleKoreanIndex >= 0) {
                    ttsVoice = allVoices[googleKoreanIndex];
                    selectedVoiceIndex = googleKoreanIndex;
                    console.log('✅ 구글 한국의 음성 자동 선택:', ttsVoice.name);
                } else {
                    ttsVoice = allVoices[0];
                    selectedVoiceIndex = 0;
                    console.log('⚠️ 구글 한국의를 찾지 못해 기본 음성 선택:', ttsVoice.name);
                }
            }
        };
        
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }
}

// 재생/정지 토글 함수
async function togglePlay(id, text, buttonElement) {
    // 이미 재생 중이면 정지
    if (isPlaying && currentPlayingButton === buttonElement) {
        stopTTS();
        buttonElement.textContent = '▶';
        isPlaying = false;
        currentPlayingButton = null;
        return;
    }
    
    // 다른 버튼이 재생 중이면 먼저 정지
    if (currentPlayingButton && currentPlayingButton !== buttonElement) {
        currentPlayingButton.textContent = '▶';
    }
    
    // 재생 시작
    stopTTS();  // 기존 재생 정지
    currentPlayingButton = buttonElement;
    buttonElement.textContent = '■';
    isPlaying = true;
    
    await speakText(text);
}

/**
 * 한국어만 추출하는 필터 함수
 * 영어 단어는 TTS가 어색하게 읽으므로 제거
 */
function filterKoreanOnly(text) {
    // 영어 알파벳만 제거 (숫자, 특수문자는 유지)
    // 예: "Hello 안녕하세요" → "안녕하세요"
    return text.replace(/[A-Za-z]+/g, '').trim();
}

async function speakText(text) {
    // ✅ 한국어만 추출 (영어 제거)
    const koreanOnlyText = filterKoreanOnly(text);
    
    if (!koreanOnlyText || koreanOnlyText.trim().length === 0) {
        console.log('⚠️ 읽을 한국어 텍스트가 없습니다.');
        return;
    }
    
    // Google Cloud TTS 사용
    if (useGoogleTTS) {
        await speakWithGoogleTTS(koreanOnlyText);
    }
    // Web Speech API fallback
    else {
        speakWithWebSpeech(koreanOnlyText);
    }
}

async function speakWithGoogleTTS(text) {
    try {
        // 기존 오디오 중지
        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
        }
        
        // 텍스트가 너무 길면 분할 (Google TTS는 5000자 제한)
        if (text.length > 5000) {
            text = text.substring(0, 5000);
        }
        
        const response = await fetch(`${API_BASE}/tts/speak`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: text,
                voice: selectedGoogleVoice,
                speed: 0.95
            })
        });
        
        const data = await response.json();
        
        if (data.error) {
            console.error('TTS 오류:', data.error);
            // Fallback to Web Speech API
            speakWithWebSpeech(text);
            return;
        }
        
        // Base64를 Blob으로 변환
        const audioData = atob(data.audio);
        const arrayBuffer = new ArrayBuffer(audioData.length);
        const view = new Uint8Array(arrayBuffer);
        for (let i = 0; i < audioData.length; i++) {
            view[i] = audioData.charCodeAt(i);
        }
        const audioBlob = new Blob([arrayBuffer], { type: 'audio/mp3' });
        
        // 오디오 재생
        const audioUrl = URL.createObjectURL(audioBlob);
        currentAudio = new Audio(audioUrl);
        currentAudio.play();
        
        // 재생 완료 후 처리
        currentAudio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            // 버튼 상태 복구
            if (currentPlayingButton) {
                currentPlayingButton.textContent = '▶';
                isPlaying = false;
                currentPlayingButton = null;
            }
        };
        
    } catch (error) {
        console.error('Google TTS 오류:', error);
        // Fallback to Web Speech API
        speakWithWebSpeech(text);
    }
}

function speakWithWebSpeech(text) {
    if (!('speechSynthesis' in window)) {
        alert('이 브라우저는 음성 재생을 지원하지 않습니다.');
        return;
    }

    // 기존 재생 중지
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = ttsVoice;
    utterance.lang = 'ko-KR';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    
    // 재생 완료 후 버튼 상태 복구
    utterance.onend = () => {
        if (currentPlayingButton) {
            currentPlayingButton.textContent = '▶';
            isPlaying = false;
            currentPlayingButton = null;
        }
    };

    window.speechSynthesis.speak(utterance);
}

function stopTTS() {
    // Google TTS 오디오 중지
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
    
    // Web Speech API 중지
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
    
    // 버튼 상태 복구
    if (currentPlayingButton) {
        currentPlayingButton.textContent = '▶';
        isPlaying = false;
        currentPlayingButton = null;
    }
}

// ============================================================================
// [6-1] 음성 설정 모달
// ============================================================================
function showVoiceSettings() {
    const modal = document.getElementById('voiceModal');
    modal.classList.add('active');
    renderVoiceList();
}

function closeVoiceSettings() {
    const modal = document.getElementById('voiceModal');
    modal.classList.remove('active');
    stopTTS();
}

function renderVoiceList() {
    const listEl = document.getElementById('voiceList');
    
    // 현재 선택된 음성 정보
    let currentVoiceInfo = '';
    if (useGoogleTTS && selectedGoogleVoice) {
        const voice = googleTTSVoices.find(v => v.id === selectedGoogleVoice);
        currentVoiceInfo = voice ? voice.name : selectedGoogleVoice;
    } else if (ttsVoice) {
        currentVoiceInfo = ttsVoice.name;
    }
    
    // Google Cloud TTS 음성이 있으면 우선 표시
    if (useGoogleTTS && googleTTSVoices.length > 0) {
        listEl.innerHTML = `
            ${currentVoiceInfo ? `
                <div style="background: #f0f9ff; border: 2px solid #667eea; padding: 12px; border-radius: 12px; margin-bottom: 16px; text-align: center;">
                    <strong style="color: #667eea;">현재 선택: ${currentVoiceInfo}</strong><br>
                    <span style="font-size: 12px; color: #888;">모든 재생 버튼에 적용됨</span>
                </div>
            ` : ''}
            
            <!-- 스타 보이스 섹션 -->
            <div style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); color: white; padding: 12px; border-radius: 12px; margin-bottom: 12px; text-align: center;">
                <strong>⭐ Star Voice</strong><br>
                <span style="font-size: 13px; opacity: 0.9;">K-POP 아티스트 음성 (Coming Soon)</span>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px;">
                <div class="star-voice-btn" onclick="selectStarVoice('jungkook')" style="background: white; border: 2px solid #E8EEDF; padding: 16px; border-radius: 10px; text-align: center; cursor: pointer; transition: all 0.3s;">
                    <div style="font-size: 20px; margin-bottom: 4px;">🎤</div>
                    <div style="font-weight: 600; color: #333; font-size: 14px;">방탄소년단</div>
                    <div style="font-size: 12px; color: #666;">정국</div>
                </div>
                
                <div class="star-voice-btn" onclick="selectStarVoice('jennie')" style="background: white; border: 2px solid #E8EEDF; padding: 16px; border-radius: 10px; text-align: center; cursor: pointer; transition: all 0.3s;">
                    <div style="font-size: 20px; margin-bottom: 4px;">💎</div>
                    <div style="font-weight: 600; color: #333; font-size: 14px;">블랙핑크</div>
                    <div style="font-size: 12px; color: #666;">제니</div>
                </div>
                
                <div class="star-voice-btn" onclick="selectStarVoice('bangchan')" style="background: white; border: 2px solid #E8EEDF; padding: 16px; border-radius: 10px; text-align: center; cursor: pointer; transition: all 0.3s;">
                    <div style="font-size: 20px; margin-bottom: 4px;">🎸</div>
                    <div style="font-weight: 600; color: #333; font-size: 14px;">스트레이키즈</div>
                    <div style="font-size: 12px; color: #666;">방찬</div>
                </div>
                
                <div class="star-voice-btn" onclick="selectStarVoice('taeyeon')" style="background: white; border: 2px solid #E8EEDF; padding: 16px; border-radius: 10px; text-align: center; cursor: pointer; transition: all 0.3s;">
                    <div style="font-size: 20px; margin-bottom: 4px;">✨</div>
                    <div style="font-weight: 600; color: #333; font-size: 14px;">소녀시대</div>
                    <div style="font-size: 12px; color: #666;">태연</div>
                </div>
            </div>
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px; border-radius: 12px; margin-bottom: 16px; text-align: center;">
                <strong>Google Cloud TTS</strong><br>
                <span style="font-size: 13px; opacity: 0.9;">Neural2 고품질 AI 음성</span>
            </div>
            ${googleTTSVoices.map((voice, index) => {
                const isSelected = voice.id === selectedGoogleVoice;
                const genderLabel = voice.gender === 'FEMALE' ? '여성' : '남성';
                
                // 음성 타입에 따른 태그
                let typeTag = '';
                let tagColor = '';
                if (voice.type === 'Studio') {
                    typeTag = 'STUDIO';
                    tagColor = '#9333EA';  // 보라색 - 최고급
                } else if (voice.type === 'Neural2') {
                    typeTag = 'NEURAL2';
                    tagColor = '#FF6B6B';  // 빨간색 - 프리미엄
                } else if (voice.type === 'WaveNet') {
                    typeTag = 'WAVENET';
                    tagColor = '#4ECDC4';  // 청록색 - 고급
                } else if (voice.type === 'Standard') {
                    typeTag = 'STANDARD';
                    tagColor = '#95A5A6';  // 회색 - 기본
                }
                
                return `
                    <div class="voice-option ${isSelected ? 'selected' : ''}" onclick="selectGoogleVoice('${voice.id}')">
                        <div class="voice-name">
                            [${genderLabel}] ${voice.name}
                            <span style="background: ${tagColor}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-left: 8px;">${typeTag}</span>
                        </div>
                        <div class="voice-details">${voice.description}</div>
                        <button class="voice-test-btn" onclick="event.stopPropagation(); testGoogleVoice('${voice.id}')">
                            샘플 듣기
                        </button>
                    </div>
                `;
            }).join('')}
            
            <div style="border-top: 2px solid #e9ecef; margin: 24px 0; padding-top: 16px;">
                <div style="color: #888; font-size: 13px; text-align: center; margin-bottom: 12px;">
                    또는 브라우저 기본 음성 사용
                </div>
            </div>
        ` + renderWebSpeechVoices();
    } else {
        listEl.innerHTML = renderWebSpeechVoices();
    }
}

function renderWebSpeechVoices() {
    if (allVoices.length === 0) {
        return `
            <div class="content-box">
                <p>사용 가능한 음성이 없습니다.</p>
                <p style="font-size: 14px; color: #888; margin-top: 8px;">
                    브라우저나 운영체제의 음성 설정을 확인해주세요.
                </p>
            </div>
        `;
    }

    // 현재 선택된 Web Speech 음성 표시
    let header = '';
    if (!useGoogleTTS && ttsVoice) {
        header = `
            <div style="background: #f0f9ff; border: 2px solid #667eea; padding: 12px; border-radius: 12px; margin-bottom: 16px; text-align: center;">
                <strong style="color: #667eea;">현재 선택: ${ttsVoice.name}</strong><br>
                <span style="font-size: 12px; color: #888;">모든 재생 버튼에 적용됨</span>
            </div>
        `;
    }

    return header + allVoices.map((voice, index) => {
        const isSelected = index === selectedVoiceIndex && !useGoogleTTS;
        const localInfo = voice.localService ? '로컬' : '온라인';
        const defaultInfo = voice.default ? '[기본]' : '';
        
        return `
            <div class="voice-option ${isSelected ? 'selected' : ''}" onclick="selectVoice(${index})">
                <div class="voice-name">${voice.name} ${defaultInfo}</div>
                <div class="voice-details">
                    언어: ${voice.lang} | ${localInfo}
                </div>
                <button class="voice-test-btn" onclick="event.stopPropagation(); testVoice(${index})">
                    샘플 듣기
                </button>
            </div>
        `;
    }).join('');
}

// ============================================================================
// [6-2] 스타 보이스 선택 (Coming Soon)
// ============================================================================
function selectStarVoice(starId) {
    const starNames = {
        'jungkook': '방탄소년단 정국',
        'jennie': '블랙핑크 제니',
        'bangchan': '스트레이키즈 방찬',
        'taeyeon': '소녀시대 태연'
    };
    
    const starName = starNames[starId] || starId;
    
    console.log(`⭐ 스타 보이스 선택: ${starName}`);
    
    // 사용자 피드백
    alert(`⭐ ${starName} 음성은 SM Entertainment와의 미팅 후 제공될 예정입니다.\n\n현재는 선택만 가능하며, 실제 음성은 정식 허락 및 Voice ID 획득 후 구현됩니다.`);
}

function selectGoogleVoice(voiceId) {
    selectedGoogleVoice = voiceId;
    useGoogleTTS = true;
    
    // localStorage에 저장 (전역 설정)
    localStorage.setItem('selectedGoogleVoice', voiceId);
    localStorage.setItem('useGoogleTTS', 'true');
    
    renderVoiceList();
    
    // 선택한 음성 정보 표시
    const voice = googleTTSVoices.find(v => v.id === voiceId);
    console.log(`✅ 음성 전역 설정 완료: ${voice ? voice.name : voiceId}`);
    
    // 선택 피드백 - 새로운 음성으로 바로 재생
    const testText = `${voice ? voice.name : '이 음성'}으로 설정되었습니다. 모든 재생 버튼에서 이 음성을 사용합니다.`;
    setTimeout(() => speakText(testText), 100);
}

function selectVoice(index) {
    selectedVoiceIndex = index;
    ttsVoice = allVoices[index];
    useGoogleTTS = false;  // 웹 음성 사용으로 전환
    
    // localStorage에 저장 (전역 설정)
    localStorage.setItem('selectedVoiceIndex', index);
    localStorage.setItem('selectedVoiceName', ttsVoice.name);
    localStorage.setItem('useGoogleTTS', 'false');
    
    renderVoiceList();
    
    console.log(`✅ 음성 전역 설정 완료: ${ttsVoice.name}`);
    
    // 선택 피드백 - 새로운 음성으로 바로 재생
    const testText = `${ttsVoice.name}으로 설정되었습니다. 모든 재생 버튼에서 이 음성을 사용합니다.`;
    setTimeout(() => speakText(testText), 100);
}

async function testGoogleVoice(voiceId) {
    stopTTS();
    
    const voice = googleTTSVoices.find(v => v.id === voiceId);
    const testText = `안녕하세요! 저는 ${voice.name} 음성입니다. 한국어 동화를 함께 읽어드릴게요.`;
    
    try {
        const response = await fetch(`${API_BASE}/tts/speak`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: testText,
                voice: voiceId,
                speed: 1.0
            })
        });
        
        const data = await response.json();
        
        if (!data.error) {
            const audioData = atob(data.audio);
            const arrayBuffer = new ArrayBuffer(audioData.length);
            const view = new Uint8Array(arrayBuffer);
            for (let i = 0; i < audioData.length; i++) {
                view[i] = audioData.charCodeAt(i);
            }
            const audioBlob = new Blob([arrayBuffer], { type: 'audio/mp3' });
            const audioUrl = URL.createObjectURL(audioBlob);
            currentAudio = new Audio(audioUrl);
            currentAudio.play();
            currentAudio.onended = () => URL.revokeObjectURL(audioUrl);
        }
    } catch (error) {
        console.error('음성 테스트 오류:', error);
    }
}

function testVoice(index) {
    stopTTS();
    
    const testVoice = allVoices[index];
    const testText = '안녕하세요! 저는 ' + testVoice.name + ' 음성입니다. 한국어 동화를 함께 읽어드릴게요.';
    
    const utterance = new SpeechSynthesisUtterance(testText);
    utterance.voice = testVoice;
    utterance.lang = 'ko-KR';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    
    window.speechSynthesis.speak(utterance);
}

function loadVoicePreference() {
    // Google TTS 사용 설정 로드
    const savedUseGoogle = localStorage.getItem('useGoogleTTS');
    const savedGoogleVoice = localStorage.getItem('selectedGoogleVoice');
    
    if (savedUseGoogle === 'true' && savedGoogleVoice && googleTTSVoices.length > 0) {
        useGoogleTTS = true;
        selectedGoogleVoice = savedGoogleVoice;
        console.log('💾 저장된 Google TTS 음성 로드:', selectedGoogleVoice);
        return;
    }
    
    // TTS가 사용 가능하면 기본으로 설정
    if (googleTTSVoices.length > 0) {
        useGoogleTTS = true;
        selectedGoogleVoice = 'uyVNoMrnUku1dZyVEXwD';  // 기본값: ElevenLabs Anna
        localStorage.setItem('useGoogleTTS', 'true');
        localStorage.setItem('selectedGoogleVoice', selectedGoogleVoice);
        console.log('✅ ElevenLabs Anna 음성으로 자동 설정 (최고 품질)');
        return;
    }
    
    // Fallback: Web Speech API 설정
    const savedIndex = localStorage.getItem('selectedVoiceIndex');
    const savedName = localStorage.getItem('selectedVoiceName');
    
    if (allVoices.length === 0) return;
    
    if (savedIndex !== null && savedName) {
        const index = parseInt(savedIndex);
        
        if (index >= 0 && index < allVoices.length && allVoices[index].name === savedName) {
            selectedVoiceIndex = index;
            ttsVoice = allVoices[index];
            console.log('💾 저장된 Web Speech 음성 로드:', ttsVoice.name);
            return;
        } else if (savedName) {
            const voiceIndex = allVoices.findIndex(v => v.name === savedName);
            if (voiceIndex >= 0) {
                selectedVoiceIndex = voiceIndex;
                ttsVoice = allVoices[voiceIndex];
                console.log('💾 저장된 Web Speech 음성 로드:', ttsVoice.name);
                return;
            }
        }
    }
    
    // 기본 음성 설정
    if (allVoices.length > 0) {
        selectedVoiceIndex = 0;
        ttsVoice = allVoices[0];
    }
}

// ============================================================================
// [7] STT (Speech-to-Text) 녹음 기능
// ============================================================================
function initializeSTT() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.lang = 'ko-KR';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }

            recordedText = finalTranscript || interimTranscript;
            
            const box = document.getElementById('recordedTextBox');
            if (box) {
                box.innerHTML = `
                    <div class="content-box" style="margin-top: 16px;">
                        <strong>녹음된 텍스트:</strong><br>
                        ${recordedText}
                    </div>
                `;
            }
        };

        recognition.onerror = (event) => {
            console.error('음성 인식 오류:', event.error);
            stopRecording();
        };
    }
}

function startRecording() {
    if (!recognition) {
        alert('이 브라우저는 음성 인식을 지원하지 않습니다.');
        return;
    }

    recordedText = '';
    document.getElementById('recordingIndicator').classList.add('active');
    recognition.start();
}

function stopRecording() {
    if (recognition) {
        recognition.stop();
        document.getElementById('recordingIndicator').classList.remove('active');
    }
}

// ============================================================================
// [7-1] 문단별 녹음 및 평가 (완전히 재작성 - Safari 호환)
// ============================================================================
let currentRecordingIndex = -1;
let currentParagraphNum = -1;
let paragraphRecordedText = '';
let recordingTimeout = null;
let silenceTimeout = null;  // 침묵 감지 타이머
let isRecording = false;
let paragraphRecognition = null;  // 문단별 독립 Recognition 객체
let microphonePermissionGranted = false;  // 마이크 권한 상태
let speechDetected = false;  // 음성 감지 여부

// ✅ 침묵 감지 설정 (3-5초)
const SILENCE_DURATION = 4000;  // 4초 침묵 시 자동 중지

/**
 * 마이크 권한 요청 및 확인
 */
async function requestMicrophonePermission() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop()); // 즉시 해제
        microphonePermissionGranted = true;
        console.log('✅ 마이크 권한 허용됨');
        return true;
    } catch (error) {
        console.error('❌ 마이크 권한 거부:', error);
        
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        
        let message = '🎤 마이크 권한이 필요합니다.\n\n';
        
        if (isIOS || isSafari) {
            message += '📱 Safari 설정:\n' +
                      '1. 설정 앱 → Safari\n' +
                      '2. 웹사이트 설정 → 마이크\n' +
                      '3. "허용" 선택';
        } else {
            message += '💻 Chrome 설정:\n' +
                      '1. 주소창 왼쪽 자물쇠 아이콘 클릭\n' +
                      '2. 사이트 설정 → 마이크\n' +
                      '3. "허용" 선택';
        }
        
        alert(message);
        return false;
    }
}

async function startParagraphRecording(paraIndex, paraNum, practiceText) {
    console.log(`🎙️ 녹음 시작 요청: para=${paraIndex}, num=${paraNum}`);
    console.log(`📝 연습 문장: ${practiceText}`);
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    // 브라우저 감지
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (!SpeechRecognition) {
        let message = '이 브라우저는 음성 인식을 지원하지 않습니다.\n\n';
        
        if (isIOS) {
            message += '📱 iOS Safari는 음성 인식 지원이 제한적입니다.\n' +
                      'Chrome 브라우저 사용을 권장합니다.';
        } else if (isSafari) {
            message += '🍎 Safari는 음성 인식 지원이 제한적입니다.\n' +
                      'Chrome 브라우저 사용을 권장합니다.';
        } else {
            message += '💡 Chrome 브라우저를 사용해주세요.';
        }
        
        alert(message);
        return;
    }
    
    // ✅ 마이크 권한 확인 및 요청
    if (!microphonePermissionGranted) {
        console.log('🎤 마이크 권한 요청 중...');
        const permitted = await requestMicrophonePermission();
        if (!permitted) {
            console.error('❌ 마이크 권한 거부됨');
            return;  // 권한 거부 시 중단
        }
        console.log('✅ 마이크 권한 허용됨');
    }
    
    // ✅ 기존 녹음 완전히 중지 및 정리
    if (isRecording && paragraphRecognition) {
        console.log('⚠️ 기존 녹음 중지 및 정리');
        try {
            paragraphRecognition.abort();
            paragraphRecognition = null;
        } catch (e) {
            console.error('녹음 정리 오류:', e);
        }
        isRecording = false;
        
        // 0.5초 대기 후 재시작
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // 타이머 정리
    if (recordingTimeout) {
        clearTimeout(recordingTimeout);
        recordingTimeout = null;
    }
    if (silenceTimeout) {
        clearTimeout(silenceTimeout);
        silenceTimeout = null;
    }
    
    // 상태 초기화
    currentRecordingIndex = paraIndex;
    currentParagraphNum = paraNum;
    paragraphRecordedText = '';
    speechDetected = false;
    
    // ✅ 매번 새로운 Recognition 객체 생성 (aborted 에러 방지!)
    console.log('🆕 새 Recognition 객체 생성');
    paragraphRecognition = new SpeechRecognition();
    paragraphRecognition.lang = 'ko-KR';
    paragraphRecognition.continuous = true;  // 모든 브라우저에서 true 시도
    paragraphRecognition.interimResults = true;
    paragraphRecognition.maxAlternatives = 1;
    
    console.log(`🔧 Recognition 설정: continuous=true, interimResults=true`);
    
    // ✅ 녹음 중 안내 메시지 (명확하게!)
    const indicator = document.getElementById(`recordingIndicator${paraIndex}`);
    const resultEl = document.getElementById(`evaluationResult${paraIndex}`);
    
    if (indicator) {
        indicator.classList.add('active');
        indicator.innerHTML = '<div class="recording-text">🔴 녹음 중... 지금 말하세요!</div>';
    }
    
    // 연습 문장 다시 표시
    if (resultEl) {
        resultEl.innerHTML = `
            <div class="content-box" style="background: #fff3cd; border-left: 4px solid #ffc107; margin-top: 16px;">
                <div style="font-size: 16px; font-weight: 700; color: #856404; margin-bottom: 8px;">
                    🎤 지금 바로 말하세요!
                </div>
                <div style="font-size: 18px; font-weight: 600; color: #333; line-height: 1.8; padding: 12px; background: white; border-radius: 8px; margin-bottom: 12px;">
                    ${practiceText}
                </div>
                <div style="font-size: 14px; color: #856404;">
                    <strong>✨ 자동 중지:</strong> 말을 멈춘 후 4초가 지나면 자동으로 평가가 시작됩니다.<br>
                    말하는 대로 텍스트가 아래에 표시됩니다.
                </div>
                <div id="liveTranscript${paraIndex}" style="margin-top: 12px; padding: 12px; background: #e8f5e9; border-radius: 8px; min-height: 50px; font-size: 16px; line-height: 1.6;">
                    <em style="color: #999;">녹음 중...</em>
                </div>
            </div>
        `;
    }
    
    // 버튼을 "중지" 버튼으로 변경
    const buttonContainer = document.getElementById(`recordingButtons${paraIndex}`);
    if (buttonContainer) {
        buttonContainer.innerHTML = `
            <button class="btn btn-secondary" onclick="stopParagraphRecording(${paraIndex})">
                ⏹️ 녹음 중지 및 평가받기
            </button>
        `;
    }
    
    // ✅ STT 에러 핸들링 (브라우저별 상세 안내)
    paragraphRecognition.onerror = (event) => {
        console.error('❌ 음성 인식 오류:', event.error);
        isRecording = false;
        
        const resultEl = document.getElementById(`evaluationResult${paraIndex}`);
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        
        if (resultEl) {
            let errorMessage = '음성 인식 오류가 발생했습니다.';
            let suggestion = '';
            let detailSteps = '';
            
            if (event.error === 'not-allowed' || event.error === 'permission-denied') {
                errorMessage = '🔒 마이크 권한이 거부되었습니다.';
                
                if (isIOS || isSafari) {
                    detailSteps = `
                        <strong>📱 Safari/iOS 권한 설정:</strong><br>
                        1. iPhone 설정 앱 열기<br>
                        2. Safari → 웹사이트 설정<br>
                        3. 마이크 → 허용<br>
                        4. 페이지 새로고침
                    `;
                } else {
                    detailSteps = `
                        <strong>💻 Chrome 권한 설정:</strong><br>
                        1. 주소창 왼쪽 🔒 아이콘 클릭<br>
                        2. 사이트 설정 선택<br>
                        3. 마이크 → 허용<br>
                        4. 페이지 새로고침
                    `;
                }
            } else if (event.error === 'no-speech') {
                errorMessage = '🔇 음성이 감지되지 않았습니다.';
                detailSteps = `
                    <strong>해결 방법:</strong><br>
                    1. 마이크가 음소거되지 않았는지 확인<br>
                    2. 마이크에 가까이 대고 말하기<br>
                    3. 조용한 환경에서 시도<br>
                    4. 마이크 볼륨 확인
                `;
            } else if (event.error === 'aborted') {
                errorMessage = '⏹️ 녹음이 중단되었습니다.';
                detailSteps = `
                    <strong>가능한 원인:</strong><br>
                    1. 녹음 중 다른 탭에서 마이크 사용<br>
                    2. 브라우저 백그라운드 전환<br>
                    3. 시스템 마이크 충돌<br>
                    <br>
                    다시 시도하면 정상 작동합니다.
                `;
            } else if (event.error === 'audio-capture') {
                errorMessage = '🎤 마이크를 찾을 수 없습니다.';
                detailSteps = `
                    <strong>해결 방법:</strong><br>
                    1. 마이크가 연결되어 있는지 확인<br>
                    2. 시스템 설정에서 마이크 활성화<br>
                    3. 다른 앱이 마이크를 사용 중인지 확인
                `;
            } else {
                detailSteps = `
                    <strong>일반적인 해결 방법:</strong><br>
                    1. 페이지 새로고침 (F5)<br>
                    2. 브라우저 재시작<br>
                    3. Chrome 브라우저 사용
                `;
            }
            
            resultEl.innerHTML = `
                <div class="content-box" style="background: #fff3cd; border-left: 4px solid #ffc107; margin-top: 16px;">
                    <div style="font-size: 18px; font-weight: 700; color: #856404; margin-bottom: 12px;">
                        ${errorMessage}
                    </div>
                    <div style="font-size: 14px; color: #856404; line-height: 1.8;">
                        ${detailSteps}
                    </div>
                    <small style="color: #999; margin-top: 12px; display: block; font-size: 12px;">
                        에러 코드: ${event.error} | 브라우저: ${isSafari || isIOS ? 'Safari' : 'Chrome'}
                    </small>
                    <div style="margin-top: 16px; display: flex; gap: 8px;">
                        <button class="btn" onclick="startParagraphRecording(${paraIndex}, ${paraNum})">
                            🔄 다시 녹음하기
                        </button>
                        <button class="btn btn-secondary" onclick="location.reload()">
                            🔄 페이지 새로고침
                        </button>
                    </div>
                </div>
            `;
        }
        
        // UI 복구
        if (indicator) {
            indicator.classList.remove('active');
        }
        
        // practiceText 가져오기
        const practiceTextEl = document.getElementById(`practiceText${paraIndex}`);
        const practiceText = practiceTextEl ? practiceTextEl.textContent : '';
        resetRecordingButton(paraIndex, paraNum, practiceText);
        
        // Recognition 객체 정리
        paragraphRecognition = null;
    };
    
    // ✅ STT 시작 이벤트
    paragraphRecognition.onstart = () => {
        console.log('✅ Recognition 시작됨');
        isRecording = true;
    };
    
    // ✅ 음성 감지 시작
    paragraphRecognition.onspeechstart = () => {
        console.log('🎤 음성 감지 시작!');
        speechDetected = true;  // 음성 감지됨
        const liveEl = document.getElementById(`liveTranscript${paraIndex}`);
        if (liveEl) {
            liveEl.innerHTML = '<em style="color: #4caf50;">✅ 음성이 감지되었습니다...</em>';
        }
    };
    
    // ✅ STT 결과 처리 (실시간 표시 + 침묵 감지)
    paragraphRecognition.onresult = (event) => {
        console.log('📝 onresult 이벤트 발생');
        
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript + ' ';
                console.log('✅ Final:', transcript);
            } else {
                interimTranscript += transcript;
                console.log('⏳ Interim:', transcript);
            }
        }
        
        paragraphRecordedText = (finalTranscript || interimTranscript).trim();
        
        console.log(`📝 현재 녹음 텍스트 (${paragraphRecordedText.length}자):`, paragraphRecordedText);
        
        // ✅ 실시간 텍스트 표시
        const liveEl = document.getElementById(`liveTranscript${paraIndex}`);
        if (liveEl && paragraphRecordedText) {
            liveEl.innerHTML = `
                <div style="color: #2e7d32; font-weight: 600;">
                    ${paragraphRecordedText}
                </div>
            `;
        }
        
        // ✅ 침묵 감지 타이머 (음성 감지된 후에만)
        if (speechDetected && paragraphRecordedText.length > 0) {
            // 기존 타이머 취소
            if (silenceTimeout) {
                clearTimeout(silenceTimeout);
            }
            
            // 새 타이머 시작 (4초 후 자동 중지)
            silenceTimeout = setTimeout(() => {
                console.log('⏱️ 침묵 감지 - 자동 중지');
                if (isRecording) {
                    stopParagraphRecording(paraIndex);
                }
            }, SILENCE_DURATION);
        }
    };
    
    // ✅ 녹음 종료 이벤트
    paragraphRecognition.onend = () => {
        console.log('📴 Recognition onend 이벤트');
        
        // Safari에서는 자동 재시작될 수 있으므로 명시적으로 중단
        if (isRecording && paragraphRecognition) {
            isRecording = false;
            console.log('⚠️ 녹음이 예상치 않게 종료됨');
        }
    };
    
    // ✅ 음성 감지 종료
    paragraphRecognition.onspeechend = () => {
        console.log('🔇 음성 감지 종료');
    };
    
    // ✅ 녹음 시작 (에러 처리 강화)
    try {
        console.log('🎤 Recognition.start() 호출...');
        
        paragraphRecognition.start();
        console.log('✅ Recognition.start() 성공');
        
        // ✅ 백업 타이머 (60초 - 침묵 감지가 우선)
        recordingTimeout = setTimeout(() => {
            console.log('⏱️ 60초 백업 타이머 만료 - 자동 중지');
            if (isRecording) {
                stopParagraphRecording(paraIndex);
            }
        }, 60000);
        
    } catch (error) {
        console.error('❌ 녹음 시작 오류:', error);
        isRecording = false;
        
        if (indicator) {
            indicator.classList.remove('active');
        }
        
        // practiceText 가져오기
        const practiceTextEl = document.getElementById(`practiceText${paraIndex}`);
        const practiceTextForError = practiceTextEl ? practiceTextEl.textContent : '';
        resetRecordingButton(paraIndex, paraNum, practiceTextForError);
        
        // 사용자에게 명확한 에러 메시지
        const resultEl = document.getElementById(`evaluationResult${paraIndex}`);
        if (resultEl) {
            resultEl.innerHTML = `
                <div class="content-box" style="color: red; margin-top: 16px;">
                    ❌ 녹음을 시작할 수 없습니다.<br>
                    <strong>에러:</strong> ${error.message}<br><br>
                    <strong>해결 방법:</strong><br>
                    1. 페이지를 새로고침 (Ctrl + Shift + R)<br>
                    2. 마이크 권한 다시 허용<br>
                    3. Chrome 브라우저 사용<br>
                    <br>
                    <button class="btn" onclick="location.reload()">
                        🔄 페이지 새로고침
                    </button>
                </div>
            `;
        }
    }
}

function stopParagraphRecording(paraIndex) {
    console.log('⏹️ 녹음 중지 함수 호출');
    
    // 타이머 정리
    if (recordingTimeout) {
        clearTimeout(recordingTimeout);
        recordingTimeout = null;
    }
    if (silenceTimeout) {
        clearTimeout(silenceTimeout);
        silenceTimeout = null;
    }
    
    // ✅ 녹음 중지
    if (paragraphRecognition && isRecording) {
        try {
            paragraphRecognition.stop();
            console.log('✅ Recognition 중지 성공');
        } catch (e) {
            console.error('❌ 녹음 중지 오류:', e);
        }
    }
    isRecording = false;
    
    // UI 업데이트
    const indicator = document.getElementById(`recordingIndicator${paraIndex}`);
    if (indicator) {
        indicator.classList.remove('active');
    }
    
    // 버튼 복구
    const practiceTextEl = document.getElementById(`practiceText${paraIndex}`);
    const practiceText = practiceTextEl ? practiceTextEl.textContent : '';
    resetRecordingButton(paraIndex, currentParagraphNum, practiceText);
    
    console.log(`📊 녹음 결과 - 텍스트 길이: ${paragraphRecordedText.length}자`);
    console.log(`📝 녹음된 내용: "${paragraphRecordedText}"`);
    
    // ✅ 평가 시작 (텍스트 길이 체크)
    if (paragraphRecordedText && paragraphRecordedText.trim().length > 0) {
        console.log('✅ 평가 시작 - 텍스트 있음');
        evaluateParagraphReading(paraIndex);
    } else {
        console.error('❌ 녹음된 텍스트 없음');
        const resultEl = document.getElementById(`evaluationResult${paraIndex}`);
        if (resultEl) {
            resultEl.innerHTML = `
                <div class="content-box" style="background: #ffebee; border-left: 4px solid #f44336; margin-top: 16px;">
                    <div style="font-size: 18px; font-weight: 700; color: #c62828; margin-bottom: 12px;">
                        ❌ 녹음된 텍스트가 없습니다
                    </div>
                    <div style="font-size: 14px; color: #c62828; line-height: 1.8;">
                        <strong>가능한 원인:</strong><br>
                        1. 녹음 시작 후 즉시 말하지 않음<br>
                        2. 마이크 볼륨이 너무 작음<br>
                        3. 백그라운드 소음이 너무 큼<br>
                        4. 브라우저가 음성을 인식하지 못함<br>
                        <br>
                        <strong>💡 해결 방법:</strong><br>
                        • 녹음 버튼을 누른 후 <strong>즉시</strong> 말하기<br>
                        • 마이크에 가까이 대고 <strong>또박또박</strong> 읽기<br>
                        • 조용한 환경에서 시도<br>
                        • <strong>브라우저 콘솔(F12)</strong>에서 로그 확인
                    </div>
                    <div style="margin-top: 16px; display: flex; gap: 8px;">
                        <button class="btn" onclick="startParagraphRecording(${paraIndex}, ${currentParagraphNum}, '${escapeQuotes(practiceText)}')">
                            🔄 다시 녹음하기
                        </button>
                        <button class="btn btn-secondary" onclick="location.reload()">
                            🔄 페이지 새로고침
                        </button>
                    </div>
                </div>
            `;
        }
    }
}

function resetRecordingButton(paraIndex, paraNum, practiceText) {
    const buttonContainer = document.getElementById(`recordingButtons${paraIndex}`);
    if (buttonContainer) {
        buttonContainer.innerHTML = `
            <button class="btn" onclick="startParagraphRecording(${paraIndex}, ${paraNum}, '${escapeQuotes(practiceText)}')">
                🎤 녹음하고 평가받기
            </button>
        `;
    }
}

async function evaluateParagraphReading(paraIndex) {
    // ✅ 연습 문장 (첫 문장)을 원문으로 사용
    const practiceText = document.getElementById(`practiceText${paraIndex}`).textContent;
    const resultEl = document.getElementById(`evaluationResult${paraIndex}`);
    
    console.log(`📊 평가 시작 - 녹음된 텍스트 길이: ${paragraphRecordedText.length}`);
    console.log(`📝 녹음된 내용: "${paragraphRecordedText}"`);
    
    // 로딩 표시
    resultEl.innerHTML = `
        <div class="loading" style="margin-top: 20px;">
            <img src="img/loading.png" alt="Loading" class="loading-image">
            <p>AI가 평가하는 중...</p>
        </div>
    `;
    
    try {
        console.log(`📡 평가 API 호출: story=${currentStory.id}, para=${currentParagraphNum}`);
        console.log(`📝 연습문장 길이: ${practiceText.length}, 녹음 길이: ${paragraphRecordedText.length}`);
        
        const response = await fetch(`${API_BASE}/story/${currentStory.id}/evaluate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: currentUserId,
                paragraph_num: currentParagraphNum,
                original_text: practiceText,  // ✅ 첫 문장만 평가
                user_text: paragraphRecordedText
            })
        });
        
        console.log(`📡 응답 상태: ${response.status}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ 서버 에러:', errorText);
            throw new Error(`서버 오류 (${response.status})`);
        }
        
        const result = await response.json();
        console.log('✅ 평가 결과 수신:', result);
        
        if (result.error) {
            throw new Error(result.error);
        }
        
        // ✅ 평가 결과 표시
        resultEl.innerHTML = `
            <div class="evaluation-result" style="margin-top: 20px;">
                <div class="score-display">${result.score}점</div>
                <div style="font-size: 24px; font-weight: 700; color: #f093fb; text-align: center; margin-bottom: 16px;">
                    🪙 +${result.coins} 코인 획득!
                </div>
                <div class="feedback-text">
                    <strong>AI 피드백:</strong><br>
                    ${result.feedback}
                </div>
            </div>

            ${result.strengths && result.strengths.length > 0 ? `
                <div class="section-title" style="margin-top: 24px;">👍 잘한 점</div>
                ${result.strengths.map(s => `
                    <div class="content-box">${s}</div>
                `).join('')}
            ` : ''}

            ${result.pronunciation_tips && result.pronunciation_tips.length > 0 ? `
                <div class="section-title" style="margin-top: 24px;">💡 발음 개선 팁</div>
                ${result.pronunciation_tips.map(tip => `
                    <div class="content-box">${tip}</div>
                `).join('')}
            ` : ''}

            ${result.corrections && result.corrections.length > 0 ? `
                <div class="section-title" style="margin-top: 24px;">✏️ 교정 사항</div>
                ${result.corrections.map(c => `
                    <div class="vocabulary-item">
                        <div class="vocab-word">원문: ${c.original}</div>
                        <div class="vocab-meaning">발음: ${c.user}</div>
                        <div class="vocab-example">제안: ${c.suggestion}</div>
                    </div>
                `).join('')}
            ` : ''}
        `;
        
        // ✅ 코인 업데이트
        if (result.total_coins !== undefined) {
            userCoins = result.total_coins;
            updateCoinDisplay();
            console.log('✅ 코인 업데이트 완료:', userCoins);
        } else {
            // 코인 다시 로드
            loadUserCoins();
        }
        
        // ✅ 학습 기록 저장 (Supabase)
        recordStudySession({
            paragraph_num: currentParagraphNum,
            pronunciation_score: result.score,
            session_type: 'pronunciation'
        });
        
    } catch (error) {
        console.error('❌ 평가 오류:', error);
        
        let errorMessage = error.message;
        let suggestion = '';
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        if (error.message.includes('Failed to fetch') || error.message.includes('load failed')) {
            errorMessage = '백엔드 서버에 연결할 수 없습니다.';
            
            if (!isLocalhost) {
                suggestion = `
                    <strong style="color: #d32f2f;">⚠️ 잘못된 접속 방법입니다!</strong><br><br>
                    <strong>문제:</strong> index.html 파일을 직접 열었습니다.<br>
                    <strong>해결 방법:</strong><br>
                    1. 터미널에서 <code>./start_server.sh</code> 실행<br>
                    2. 브라우저 주소창에 <strong style="color: #2e7d32;">http://localhost:8080</strong> 입력<br>
                    3. 다시 녹음 시도<br>
                    <br>
                    <div style="background: #fff3cd; padding: 12px; border-radius: 8px; margin-top: 12px;">
                        <strong>💡 Tip:</strong> 파일을 직접 열면 서버에 연결할 수 없습니다!
                    </div>
                `;
            } else {
                suggestion = `
                    <strong>가능한 원인:</strong><br>
                    1. Python 서버가 실행되지 않았습니다<br>
                    2. 인터넷 연결 확인<br>
                    <br>
                    <strong>해결 방법:</strong><br>
                    • 터미널에서 <code>./start_server.sh</code> 실행<br>
                    • 서버 로그 확인<br>
                `;
            }
        } else if (error.message.includes('500')) {
            errorMessage = 'AI 평가 중 오류가 발생했습니다.';
            suggestion = 'Gemini API 상태를 확인해주세요.';
        }
        
        resultEl.innerHTML = `
            <div class="content-box" style="color: red; margin-top: 20px;">
                <strong>❌ ${errorMessage}</strong><br><br>
                ${suggestion}<br>
                <button class="btn" onclick="evaluateParagraphReading(${paraIndex})" style="margin-top: 12px;">
                    🔄 평가 다시 시도
                </button>
                <button class="btn btn-secondary" onclick="startParagraphRecording(${paraIndex}, ${currentParagraphNum})" style="margin-top: 8px;">
                    🎤 다시 녹음하기
                </button>
            </div>
        `;
    }
}

// ============================================================================
// [8] 발음 평가
// ============================================================================
async function evaluatePronunciation() {
    const originalText = currentStory.full_text.split('\n\n')[0];
    
    try {
        const response = await fetch(`${API_BASE}/story/${currentStory.id}/evaluate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                original_text: originalText,
                user_text: recordedText
            })
        });

        const result = await response.json();
        
        const contentEl = document.getElementById('learningContent');
        contentEl.innerHTML = `
            <div class="section-title">발음 평가 결과</div>
            <div class="evaluation-result">
                <div class="score-display">${result.score}점</div>
                <div class="feedback-text">
                    <strong>종합 평가:</strong><br>
                    ${result.feedback}
                </div>
            </div>

            ${result.pronunciation_tips && result.pronunciation_tips.length > 0 ? `
                <div class="section-title" style="margin-top: 24px;">발음 팁</div>
                ${result.pronunciation_tips.map(tip => `
                    <div class="content-box">${tip}</div>
                `).join('')}
            ` : ''}

            ${result.corrections && result.corrections.length > 0 ? `
                <div class="section-title" style="margin-top: 24px;">교정 사항</div>
                ${result.corrections.map(c => `
                    <div class="vocabulary-item">
                        <div class="vocab-word">원문: ${c.original}</div>
                        <div class="vocab-meaning">당신: ${c.user}</div>
                        <div class="vocab-example">제안: ${c.suggestion}</div>
                    </div>
                `).join('')}
            ` : ''}
            <div class="bottom-spacer"></div>
        `;
    } catch (error) {
        const contentEl = document.getElementById('learningContent');
        contentEl.innerHTML = `
            <div style="color: red; padding: 20px;">
                평가 오류: ${error.message}
            </div>
        `;
    }
}

// ============================================================================
// [9] 학습 기록 저장 (Supabase)
// ============================================================================
async function saveProgress(additionalData = {}) {
    const progressData = {
        user_id: currentUserId,
        story_id: currentStory?.id,
        story_title: currentStory?.title,
        completed_tabs: Array.from(completedTabs),
        level: currentLevel,
        ...additionalData
    };
    
    try {
        const response = await fetch(`${API_BASE}/user/progress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(progressData)
        });
        
        const result = await response.json();
        if (result.saved) {
            console.log('✅ 학습 기록 저장 완료');
        } else {
            console.log('⚠️ 학습 기록 미저장 (Supabase 미설정)');
        }
    } catch (error) {
        console.log('학습 기록 저장 오류:', error);
    }
}

// ============================================================================
// [9-1] 개인화된 로드맵: 실시간 난이도 조정
// ============================================================================
async function adjustParagraphDifficulty(paraIndex, direction) {
    const practiceTextEl = document.getElementById(`practiceText${paraIndex}`);
    const currentText = practiceTextEl.textContent;
    
    // 로컬 서버 체크
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (!isLocalhost) {
        // Netlify에서는 아직 API 미배포
        showToast('⚠️ 이 기능은 곧 배포될 예정입니다! (로컬에서만 작동)');
        return;
    }
    
    // 로딩 표시
    practiceTextEl.innerHTML = `<em style="color: #999;">AI가 텍스트를 조정하는 중...</em>`;
    
    try {
        const response = await fetch(`${API_BASE}/adjust-difficulty`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: currentText,
                direction: direction,  // easier, harder, realistic
                current_level: currentLevel
            })
        });
        
        if (!response.ok) {
            throw new Error(`서버 오류 (${response.status})`);
        }
        
        const result = await response.json();
        
        if (result.adjusted_text) {
            // 조정된 텍스트로 업데이트
            practiceTextEl.textContent = result.adjusted_text;
            
            // 성공 알림
            showToast(`✨ ${direction === 'easier' ? '더 쉬운' : direction === 'harder' ? '더 어려운' : '현실적인'} 표현으로 변경되었습니다!`);
        } else {
            throw new Error('텍스트 조정 실패');
        }
        
    } catch (error) {
        console.error('❌ 난이도 조정 오류:', error);
        practiceTextEl.textContent = currentText;  // 원래대로 복구
        showToast('⚠️ 텍스트 조정에 실패했습니다. Git push 후 다시 시도해주세요.');
    }
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 24px;
        border-radius: 25px;
        font-size: 14px;
        font-weight: 600;
        z-index: 10000;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================================================
// [10] 유틸리티
// ============================================================================
function escapeQuotes(str) {
    if (!str) return '';
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, ' ');
}

