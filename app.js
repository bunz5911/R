/**
 * K-Context Master - 한국어 동화 학습 앱
 * 순수 JavaScript (No Framework)
 * 버전: 20251117-MOBILE-OPTIMIZE
 */

// ✅ 버전 체크: 이 파일이 새로 로드되었는지 확인
window.APP_VERSION_20251117_PARAGRAPH = true;
window.APP_VERSION_20251117_CAROUSEL = true;
window.APP_VERSION_20251117_SYNTAX_FIX = true;
window.APP_VERSION_20251117_MOBILE_OPTIMIZE = true;
console.log('🚀🚀🚀 app.js 로드됨 - 버전: 20251117-MOBILE-OPTIMIZE-' + Date.now());
console.log('✅ 새 버전 확인: APP_VERSION_20251117_MOBILE_OPTIMIZE =', window.APP_VERSION_20251117_MOBILE_OPTIMIZE);

// 배포 환경 감지: 로컬에서는 localhost 사용, 프로덕션에서는 Cloudflare Pages API 프록시 사용
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8080/api'
    : window.location.origin + '/api';  // Cloudflare Pages API 프록시 사용

// ============================================================================
// 🌍 다국어 지원 시스템
// ============================================================================
let translations = {};
let currentLanguage = localStorage.getItem('language') || 'ko';

/**
 * 번역 파일 로드
 * @param {string} lang - 언어 코드 (ko, en, zh-CN, ja, es, de, fr, pt-BR, zh-TW, it)
 */
async function loadTranslations(lang) {
    try {
        const response = await fetch(`translations/${lang}.json?v=${Date.now()}`);
        if (!response.ok) {
            throw new Error(`번역 파일 로드 실패: ${response.status}`);
        }
        translations = await response.json();
        currentLanguage = lang;
        localStorage.setItem('language', lang);
        updateUI();
        console.log(`✅ 번역 로드 완료: ${lang}`);
    } catch (error) {
        console.error('❌ 번역 로드 실패:', error);
        // 폴백: 한국어 사용
        if (lang !== 'ko') {
            await loadTranslations('ko');
        }
    }
}

/**
 * 번역 함수
 * @param {string} key - 번역 키 (예: "tabs.summary")
 * @returns {string} 번역된 텍스트
 */
function t(key) {
    const keys = key.split('.');
    let value = translations;
    for (const k of keys) {
        value = value?.[k];
    }
    return value || key; // 번역 없으면 키 반환
}

/**
 * 레벨 번역 함수 (초급/중급/고급 -> 번역된 값)
 * @param {string} level - 레벨 (초급, 중급, 고급)
 * @returns {string} 번역된 레벨
 */
function translateLevel(level) {
    if (level === '초급') return t('levels.beginner');
    if (level === '중급') return t('levels.intermediate');
    if (level === '고급') return t('levels.advanced');
    return level; // 번역 없으면 원래 값 반환
}

/**
 * 스토리 제목 번역 함수 (현재 언어에 따라 반환)
 * @param {object} story - 스토리 객체
 * @returns {string} 번역된 제목
 */
function getStoryTitle(story) {
    if (!story) return '';
    
    // 영어일 경우 영어 제목 사용, 아니면 한국어 제목 사용
    if (currentLanguage === 'en' && story.title_en) {
        return story.title_en;
    }
    
    // 한국어 제목을 공백으로 분리하여 읽기 쉽게 변환
    return story.title.replace(/([가-힣])([A-Za-z])/g, '$1 $2')
                      .replace(/([A-Za-z])([가-힣])/g, '$1 $2')
                      .replace(/([가-힣])([0-9])/g, '$1 $2')
                      .replace(/([0-9])([가-힣])/g, '$1 $2');
}

/**
 * 언어 변경 함수
 * @param {string} lang - 언어 코드
 */
function changeLanguage(lang) {
    loadTranslations(lang);
}

/**
 * UI 업데이트 함수 (번역 적용)
 */
function updateUI() {
    // 언어 선택 드롭다운 업데이트
    const langSelect = document.getElementById('languageSelect');
    if (langSelect) {
        langSelect.value = currentLanguage;
    }
    
    // 네비게이션 바 텍스트 업데이트
    const authBtn = document.getElementById('authBtn');
    if (authBtn) authBtn.textContent = t('nav.login');
    
    const checkinBtn = document.getElementById('checkinBtn');
    if (checkinBtn) checkinBtn.innerHTML = `📅 ${t('nav.checkin')}`;
    
    const kContentBtn = document.getElementById('kContentBtn');
    if (kContentBtn) kContentBtn.innerHTML = `📝 ${t('nav.kContent')}`;
    
    const communityBtnText = document.getElementById('communityBtnText');
    if (communityBtnText) communityBtnText.textContent = t('nav.community');
    
    const adminBtn = document.getElementById('adminBtn');
    if (adminBtn) adminBtn.innerHTML = `🛠️ ${t('nav.admin')}`;
    
    const dashboardBtn = document.getElementById('dashboardBtn');
    if (dashboardBtn) dashboardBtn.textContent = t('nav.dashboard');
    
    const voiceSettingsBtn = document.getElementById('voiceSettingsBtn');
    if (voiceSettingsBtn) voiceSettingsBtn.textContent = t('nav.voiceSettings');
    
    const shopBtn = document.getElementById('shopBtn');
    if (shopBtn) shopBtn.innerHTML = `🛒 ${t('nav.shop')}`;
    
    // 헤더 타이틀 업데이트
    const headerSubtitle = document.querySelector('.header-center p');
    if (headerSubtitle) headerSubtitle.textContent = t('app.subtitle');
    
    // 레벨 버튼 업데이트
    const levelBeginner = document.getElementById('levelBeginner');
    const levelIntermediate = document.getElementById('levelIntermediate');
    const levelAdvanced = document.getElementById('levelAdvanced');
    
    if (levelBeginner) levelBeginner.textContent = t('levels.beginner');
    if (levelIntermediate) levelIntermediate.textContent = t('levels.intermediate');
    if (levelAdvanced) levelAdvanced.textContent = t('levels.advanced');
    
    // 학습 탭 버튼 업데이트
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(btn => {
        const tabName = btn.getAttribute('data-tab');
        if (tabName === 'summary') btn.textContent = t('tabs.summary');
        else if (tabName === 'full-story') btn.textContent = t('tabs.fullStory');
        else if (tabName === 'paragraphs') btn.textContent = t('tabs.paragraphs');
        else if (tabName === 'real-life') btn.textContent = t('tabs.realLife');
        else if (tabName === 'vocabulary') btn.textContent = t('tabs.vocabulary');
        else if (tabName === 'wordbook') btn.textContent = t('tabs.wordbook');
        else if (tabName === 'quiz') btn.textContent = t('tabs.quiz');
        else if (tabName === 'growth') btn.textContent = t('tabs.growth');
    });
    
    // 뒤로 버튼 업데이트
    const backButton = document.querySelector('.back-button');
    if (backButton) {
        backButton.textContent = `← ${t('buttons.backToStoryList')}`;
    }
    
    // currentLevel은 원래 값 유지 (초급/중급/고급), 표시할 때만 번역
    // currentLevel 변수는 그대로 두고, 렌더링할 때만 번역된 값 사용
    
    // 현재 탭 다시 렌더링 (안전하게 체크)
    const learningView = document.getElementById('learningView');
    if (learningView && learningView.style.display !== 'none' && currentTab) {
        // 학습 화면이 표시 중이면 현재 탭 다시 렌더링
        try {
            switchTab(currentTab);
        } catch (error) {
            console.warn('탭 렌더링 실패:', error);
        }
    }
}

// 페이지 로드 시 번역 로드
// 번역 파일 백그라운드 로드 (비블로킹)
document.addEventListener('DOMContentLoaded', () => {
    loadTranslations(currentLanguage).catch(() => {
        // 실패해도 계속 진행 (기본 한국어 사용)
    });
});

// ============================================================================
// 🎨 캐릭터 이미지 매핑
// ============================================================================
const CHARACTER_IMAGES = {
    'summary': 'img/characters/summary.png',        // 이야기 요약
    'full-story': 'img/characters/reading.png',      // 전체 듣기
    'paragraphs': 'img/characters/learning.png',    // 문단별 학습
    'real-life': 'img/characters/speaking.png',      // 실생활 활용
    'vocabulary': 'img/characters/studying.png',    // 어휘문법
    'wordbook': 'img/characters/notebook.png',      // 단어장
    'quiz': 'img/characters/quiz.png',              // 이해도확인
    'growth': 'img/characters/growth.png'           // 성장기록
};

/**
 * 캐릭터 이미지 렌더링 헬퍼 함수
 * @param {string} tabName - 탭 이름
 * @returns {string} HTML 문자열
 */
function renderCharacterImage(tabName) {
    const characterImg = CHARACTER_IMAGES[tabName];
    if (!characterImg) return '';
    
    return `
        <div class="character-image-container">
            <img src="${characterImg}" 
                 alt="캐릭터" 
                 class="character-image"
                 onerror="this.style.display='none'">
        </div>
    `;
}

// ============================================================================
// 🚀 하드코딩된 동화 목록 (즉시 로딩용)
// ============================================================================
// 레벨 분류 함수 (동화 ID 기반)
function getStoryLevel(storyId) {
    if (storyId <= 16) return '초급';
    if (storyId <= 33) return '중급';
    return '고급';
}

const PRELOADED_STORIES = [
    { id: 0, title: "도깨비키친", preview: "", image: "img/stories/story-0.jpg", level: "초급" },
    { id: 1, title: "강아지닥스훈트의비밀", preview: "", image: "img/stories/story-1.jpg", level: "초급" },
    { id: 2, title: "공룡발자국의비밀", preview: "", image: "img/stories/story-2.jpg", level: "초급" },
    { id: 3, title: "기린의비밀", preview: "", image: "img/stories/story-3.jpg", level: "초급" },
    { id: 4, title: "까치집의비밀", preview: "", image: "img/stories/story-4.jpg", level: "초급" },
    { id: 5, title: "꿀벌의비밀", preview: "", image: "img/stories/story-5.jpg", level: "초급" },
    { id: 6, title: "낡은노트의비밀", preview: "", image: "img/stories/story-6.jpg", level: "초급" },
    { id: 7, title: "냉장고의비밀", preview: "", image: "img/stories/story-7.jpg", level: "초급" },
    { id: 8, title: "대나무의비밀", preview: "", image: "img/stories/story-8.jpg", level: "초급" },
    { id: 9, title: "독수리의비밀", preview: "", image: "img/stories/story-9.jpg", level: "초급" },
    { id: 10, title: "막대자석의비밀", preview: "", image: "img/stories/story-10.jpg", level: "초급" },
    { id: 11, title: "뭉게구름의비밀", preview: "", image: "img/stories/story-11.jpg", level: "초급" },
    { id: 12, title: "밍크고래의비밀", preview: "", image: "img/stories/story-12.jpg", level: "초급" },
    { id: 13, title: "박물관의비밀", preview: "", image: "img/stories/story-13.jpg", level: "초급" },
    { id: 14, title: "반코팅장갑의비밀", preview: "", image: "img/stories/story-14.jpg", level: "초급" },
    { id: 15, title: "블랙다이아몬드의비밀", preview: "", image: "img/stories/story-15.jpg", level: "초급" },
    { id: 16, title: "빨간신호등의비밀", preview: "", image: "img/stories/story-16.jpg", level: "초급" },
    { id: 17, title: "색과무늬의비밀", preview: "", image: "img/stories/story-17.jpg", level: "중급" },
    { id: 18, title: "세탁소드라이클리너의비밀", preview: "", image: "img/stories/story-18.jpg", level: "중급" },
    { id: 19, title: "수영장꽃무늬투명튜브의비밀", preview: "", image: "img/stories/story-19.jpg", level: "중급" },
    { id: 20, title: "숫자2의비밀", preview: "", image: "img/stories/story-20.jpg", level: "중급" },
    { id: 21, title: "숲의비밀", preview: "", image: "img/stories/story-21.jpg", level: "중급" },
    { id: 22, title: "시간을파는자판기의비밀", preview: "", image: "img/stories/story-22.jpg", level: "중급" },
    { id: 23, title: "시내버스의비밀", preview: "", image: "img/stories/story-23.jpg", level: "중급" },
    { id: 24, title: "아기밥그릇의비밀", preview: "", image: "img/stories/story-24.jpg", level: "중급" },
    { id: 25, title: "아기북극곰의비밀", preview: "", image: "img/stories/story-25.jpg", level: "중급" },
    { id: 26, title: "애벌레의비밀", preview: "", image: "img/stories/story-26.jpg", level: "중급" },
    { id: 27, title: "야구장빗자루의비밀", preview: "", image: "img/stories/story-27.jpg", level: "중급" },
    { id: 28, title: "얼굴의비밀", preview: "", image: "img/stories/story-28.jpg", level: "중급" },
    { id: 29, title: "엘리베이터의비밀", preview: "", image: "img/stories/story-29.jpg", level: "중급" },
    { id: 30, title: "여자화장실의비밀", preview: "", image: "img/stories/story-30.jpg", level: "중급" },
    { id: 31, title: "유리구슬의비밀", preview: "", image: "img/stories/story-31.jpg", level: "중급" },
    { id: 32, title: "은수저의비밀", preview: "", image: "img/stories/story-32.jpg", level: "중급" },
    { id: 33, title: "자동차바퀴의비밀", preview: "", image: "img/stories/story-33.jpg", level: "중급" },
    { id: 34, title: "전기의비밀", preview: "", image: "img/stories/story-34.jpg", level: "고급" },
    { id: 35, title: "전기+-의비밀", preview: "", image: "img/stories/story-35.jpg", level: "고급" },
    { id: 36, title: "조개눈물의비밀", preview: "", image: "img/stories/story-36.jpg", level: "고급" },
    { id: 37, title: "종이에이포의비밀", preview: "", image: "img/stories/story-37.jpg", level: "고급" },
    { id: 38, title: "주방가위의비밀", preview: "", image: "img/stories/story-38.jpg", level: "고급" },
    { id: 39, title: "청바지와스커트의비밀", preview: "", image: "img/stories/story-39.jpg", level: "고급" },
    { id: 40, title: "칭찬스티커의비밀", preview: "", image: "img/stories/story-40.jpg", level: "고급" },
    { id: 41, title: "케이크의비밀", preview: "", image: "img/stories/story-41.jpg", level: "고급" },
    { id: 42, title: "쿠션의비밀", preview: "", image: "img/stories/story-42.jpg", level: "고급" },
    { id: 43, title: "크레파스의비밀", preview: "", image: "img/stories/story-43.jpg", level: "고급" },
    { id: 44, title: "크리스마스트리의비밀", preview: "", image: "img/stories/story-44.jpg", level: "고급" },
    { id: 45, title: "택배상자의비밀", preview: "", image: "img/stories/story-45.jpg", level: "고급" },
    { id: 46, title: "팬지꽃의비밀", preview: "", image: "img/stories/story-46.jpg", level: "고급" },
    { id: 47, title: "풍차날개의비밀", preview: "", image: "img/stories/story-47.jpg", level: "고급" },
    { id: 48, title: "허수아비의비밀", preview: "", image: "img/stories/story-48.jpg", level: "고급" },
    { id: 49, title: "흔들바위의비밀", preview: "", image: "img/stories/story-49.jpg", level: "고급" },
    { id: 50, title: "희망의비밀", preview: "", image: "img/stories/story-50.jpg", level: "고급" }
];

// 전역 상태
let currentStories = [];
let currentStory = null;
let currentAnalysis = null;
let currentLevel = '초급';
let currentTab = 'summary';
let userDifficultyPreference = null;  // 사용자 난이도 선호도
let PRECOMPUTED_ANALYSIS = {};  // 하드코딩된 분석 데이터 (즉시 로드용)
let completedStoryIds = [];  // 사용자가 학습한 동화 ID 목록
let recentStories = [];  // 최근 학습한 동화 목록
let recommendedLevel = null;  // AI 추천 레벨
let hasTakenLevelTest = false;  // 레벨 테스트 완료 여부
let renderedCardRange = { start: 0, end: 0 };  // 현재 렌더링된 카드 범위
let carouselVisitedIndices = new Set();  // 캐러셀에서 방문한 인덱스 추적 (무한 루프용)
let allCarouselStories = [];  // 전체 캐러셀 스토리 목록 (유료 사용자용)

// 플랜별 최대 표시 개수
const MAX_VISIBLE_STORIES = {
    free: 2,
    pro: 10,
    premier: 30
};

// 모바일 카드 렌더링 제한
const MOBILE_CARD_LIMITS = {
    small: 3,    // 480px 이하: 최대 3개 (보이는 1개 + 양옆 각 1개)
    medium: 5,   // 481-768px: 최대 5개 (보이는 2개 + 양옆 각 1-2개)
    tablet: 7    // 769-1024px: 최대 7개
};

// 사용자 정보
// 사용자 ID 초기화 (localStorage에서 읽기, 없으면 기본값)
let currentUserId = null;
function initializeUserId() {
    const storedUserId = localStorage.getItem('userId');
    const hasAccessToken = localStorage.getItem('access_token');
    
    if (storedUserId) {
        currentUserId = storedUserId;
        console.log('✅ 사용자 ID 초기화:', currentUserId, '(access_token:', hasAccessToken ? '있음' : '없음', ')');
    } else {
        // 로그인하지 않은 경우에만 기본값 사용
        if (!hasAccessToken) {
            currentUserId = '00000000-0000-0000-0000-000000000001';  // 테스트 사용자
            console.log('ℹ️ 로그인하지 않음 - 기본 사용자 ID 사용:', currentUserId);
        } else {
            console.warn('⚠️ access_token은 있지만 userId가 없습니다. 로그인 상태를 확인하세요.');
            // access_token이 있으면 잠시 대기 후 다시 시도 (Google 로그인 후 리다이렉트 타이밍 문제)
            setTimeout(() => {
                const retryUserId = localStorage.getItem('userId');
                if (retryUserId) {
                    currentUserId = retryUserId;
                    console.log('✅ 사용자 ID 재초기화 성공:', currentUserId);
                }
            }, 100);
        }
    }
}
// 즉시 초기화
initializeUserId();
let currentUserEmail = localStorage.getItem('userEmail') || null;
let currentDisplayName = localStorage.getItem('displayName') || null;
let currentUserPlan = localStorage.getItem('userPlan') || 'free';  // 사용자 플랜
let isAuthenticated = !!localStorage.getItem('access_token');  // 로그인 상태
let completedTabs = new Set();  // 완료한 탭 추적
let userCoins = 10;  // 사용자 코인 (초기: 10개 - 무료 회원)

// TTS 설정
let ttsVoice = null;
let allVoices = [];
let selectedVoiceIndex = -1;
let useGoogleTTS = true;  // 백엔드 TTS 사용 여부 (true: ElevenLabs/Google, false: 브라우저 기본)
let googleTTSVoices = [];  // 백엔드 TTS 음성 목록 (ElevenLabs + Google)
// ✅ 기본 음성: ElevenLabs Anna (최고 품질, 프리미엄)
// ❌ Google Cloud TTS는 사용하지 않음 (환경변수 미설정)
let selectedGoogleVoice = 'uyVNoMrnUku1dZyVEXwD';
let currentAudio = null;  // 현재 재생 중인 오디오
let isPlaying = false;  // 재생 상태
let currentPlayingButton = null;  // 현재 재생 버튼
let audioCache = {};  // 오디오 캐시 (텍스트 → Blob URL)
let fullStoryAudio = null;  // 전체 이야기 듣기 전용 오디오 객체
let recognition = null;
let recordedText = '';

// ============================================================================
// [0] 하드코딩된 분석 데이터 로드
// ============================================================================
async function loadPrecomputedAnalysis() {
    try {
        console.log('📦 하드코딩된 분석 데이터 우선 로드 시작...');
        // ✅ 최종 파일: 모든 키 공백 제거 완료
        // 브라우저 캐시 활용 (성능 최적화) - 재방문 시 빠른 로드
        // 타임아웃 설정 (5초) - 빠른 실패
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`stories_data_final.json?v=20250118`, {
            cache: 'default',  // 브라우저 캐시 활용
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`stories_data_final.json 로드 실패: ${response.status}`);
        }
        const jsonData = await response.json();
        
        PRECOMPUTED_ANALYSIS = jsonData;
        
        console.log(`✅ 분석 데이터 우선 로드 완료: ${Object.keys(PRECOMPUTED_ANALYSIS).length}개 동화`);
        
        return true;
    } catch (error) {
        if (error.name === 'AbortError') {
            console.warn('⚠️ 분석 데이터 로드 타임아웃 (5초), 백그라운드에서 계속 시도합니다.');
        } else {
            console.error('❌ 하드코딩 데이터 로드 실패:', error);
        }
        console.warn('⚠️ 분석 데이터 없이 계속 진행합니다. 서버에서 실시간 분석을 사용합니다.');
        // ✅ 실패해도 빈 객체로 초기화하여 앱이 계속 작동하도록 함
        PRECOMPUTED_ANALYSIS = {};
        return false;
    }
}

// ============================================================================
// [1] 초기화
// ============================================================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 앱 초기화 시작...');
    
    // ============================================================================
    // OAuth 콜백 체크 (최우선 - URL 해시에 access_token이 있으면 login.html로 리다이렉트)
    // ============================================================================
    const hash = window.location.hash;
    if (hash) {
        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const errorParam = hashParams.get('error');
        
        if (accessToken) {
            console.log('🔑 OAuth 콜백 감지 - login.html로 리다이렉트하여 처리');
            // login.html의 handleOAuthCallback이 처리하도록 리다이렉트
            window.location.href = window.location.origin + '/login.html' + window.location.hash + window.location.search;
            return; // 리다이렉트 후 초기화 중단
        } else if (errorParam) {
            console.error('❌ OAuth 에러 파라미터 발견:', errorParam);
            // 에러가 있어도 login.html로 리다이렉트하여 에러 메시지 표시
            window.location.href = window.location.origin + '/login.html' + window.location.hash + window.location.search;
            return;
        }
    }
    
    // ============================================================================
    // 즉시 실행 (블로킹 없음) - 사용자가 즉시 볼 수 있는 것들
    // ============================================================================
    
    // ✅ 1. 온보딩 체크 (첫 방문자) - 먼저 체크하여 리다이렉트 방지
    const hasSeenOnboarding = localStorage.getItem('onboarding_complete');
    if (!hasSeenOnboarding) {
        // 온보딩 페이지로 리다이렉트
        window.location.href = 'onboarding.html';
        return; // 리다이렉트 후 초기화 중단
    }
    
    // ✅ 2. 뷰 초기화 (온보딩 완료 후 메인 페이지 진입 시)
    // 동화 목록 화면 표시, 학습 화면 숨김
    const storyListView = document.getElementById('storyListView');
    const learningView = document.getElementById('learningView');
    if (storyListView) {
        storyListView.style.display = 'block';
    }
    if (learningView) {
        learningView.style.display = 'none';
    }
    
    // ✅ 3. 인증 상태 즉시 설정 (localStorage 캐시 우선) - loadStories() 이전에 실행
    // Google 로그인 후 리다이렉트 시 localStorage 값이 이미 저장되어 있을 수 있으므로 재초기화
    initializeUserId();
    
    const cachedToken = localStorage.getItem('access_token');
    const cachedUserId = localStorage.getItem('userId');
    const cachedDisplayName = localStorage.getItem('displayName');
    
    if (cachedToken && cachedUserId && cachedDisplayName) {
        // 로그인 직후: localStorage의 정보를 즉시 사용하여 인증 상태 설정
        isAuthenticated = true;
        currentUserId = cachedUserId;
        currentUserEmail = localStorage.getItem('userEmail');
        currentDisplayName = cachedDisplayName;
        currentUserPlan = localStorage.getItem('userPlan') || 'free';
        console.log('✅ 로그인 상태 즉시 설정 (캐시):', {
            userId: currentUserId,
            email: currentUserEmail,
            displayName: currentDisplayName,
            plan: currentUserPlan
        });
    } else {
        // 로그인하지 않은 경우
        isAuthenticated = false;
        console.log('ℹ️ 로그인하지 않음 - 인증 상태:', {
            hasToken: !!cachedToken,
            hasUserId: !!cachedUserId,
            hasDisplayName: !!cachedDisplayName
        });
    }
    
    // ✅ 4. 코인 로컬스토리지에서 즉시 표시 (캐시 우선)
    const cachedCoins = localStorage.getItem('userCoins');
    if (cachedCoins) {
        userCoins = parseInt(cachedCoins, 10);
        const coinAmount = document.getElementById('coinAmount');
        if (coinAmount) {
            coinAmount.textContent = userCoins;
        }
    }
    
    // ✅ 5. 이벤트 리스너 설정 (즉시 필요)
    setupEventListeners();
    
    // ✅ 6. 동화 목록 즉시 표시 (인증 상태 설정 후)
    loadStories();
    
    // ✅ 7. 인증 상태 서버 검증 (백그라운드, 비블로킹)
    checkAuthStatus().catch(error => {
        console.warn('⚠️ 인증 상태 체크 실패:', error);
        // 실패해도 캐시된 인증 상태 유지
    });
    
    // ============================================================================
    // 백그라운드 로드 (비블로킹) - 병렬 처리
    // ============================================================================
    
    // ✅ 코인 서버 동기화 (백그라운드)
    loadUserCoins().catch(error => {
        console.warn('⚠️ 코인 로드 실패:', error);
    });
    
    // ✅ 분석 데이터 우선 로드 (동화 선택 전에 로드 완료되어야 함)
    // Promise로 즉시 시작하되, 완료를 기다리지 않음 (비블로킹)
    const analysisLoadPromise = loadPrecomputedAnalysis().catch(error => {
        console.warn('⚠️ 분석 데이터 백그라운드 로드 실패, 서버 분석을 사용합니다:', error);
        PRECOMPUTED_ANALYSIS = {};
    });
    
    // 분석 데이터 로드 완료를 기다리지 않고 계속 진행
    // 하지만 동화 선택 시에는 이미 로드되었을 가능성이 높음
    
    // ✅ TTS/STT 지연 초기화 (필요할 때만 초기화)
    // 사용자가 동화를 선택하거나 음성 기능을 사용할 때 초기화됨
    
    console.log('✅ 초기 로딩 완료 - 사용자 인터랙션 대기 중');
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
        btn.addEventListener('click', async (e) => {
            document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const newLevel = e.target.dataset.level;
            
            // 레벨이 실제로 변경되었는지 확인
            if (currentLevel === newLevel) {
                return; // 같은 레벨이면 아무것도 하지 않음
            }
            
            // 현재 보고 있는 탭 저장 (레벨 변경 후 다시 렌더링하기 위해)
            const previousTab = currentTab || 'summary';
            
            console.log(`🔄 레벨 변경 시작:`, {
                이전레벨: currentLevel,
                새레벨: newLevel,
                현재탭: currentTab,
                previousTab: previousTab
            });
            
            // ✅ 레벨 변경 전에 이전 분석 데이터 초기화 (중요!)
            const oldAnalysis = currentAnalysis;
            currentLevel = newLevel;
            
            // ✅ 레벨 변경 시 동화 목록 다시 로드 (캐러셀 업데이트)
            const storyListView = document.getElementById('storyListView');
            if (storyListView && storyListView.style.display !== 'none') {
                loadStories();
            }
            
            // ✅ 레벨 변경 시 분석 데이터 다시 로드
            if (currentStory && currentStory.id !== undefined) {
                console.log(`🔄 레벨 변경: ${currentLevel} → 분석 데이터 다시 로드 (현재 탭: ${previousTab})`);
                
                // ✅ currentTab을 명시적으로 설정 (analyzeStory 함수 내부에서 사용)
                currentTab = previousTab;
                
                // ✅ 레벨 변경 시에는 렌더링을 건너뛰고 데이터만 로드
                console.log(`📡 analyzeStory 호출 전: currentAnalysis.level=${currentAnalysis?.level}, currentLevel=${currentLevel}`);
                await analyzeStory(currentStory.id, true);
                console.log(`📡 analyzeStory 호출 후: currentAnalysis.level=${currentAnalysis?.level}, currentLevel=${currentLevel}`);
                
                // ✅ 핵심 수정: 분석 완료 후 현재 탭 다시 렌더링 (레벨별 데이터 반영)
                if (currentAnalysis) {
                    console.log(`🔍 currentAnalysis 상세 확인:`, {
                        level: currentAnalysis.level,
                        현재레벨: currentLevel,
                        레벨일치: currentAnalysis.level === currentLevel,
                        문단수: currentAnalysis.paragraphs_analysis?.length || 0,
                        첫문단샘플: currentAnalysis.paragraphs_analysis?.[0]?.original_text?.substring(0, 50) || '없음',
                        첫문단연습텍스트: currentAnalysis.paragraphs_analysis?.[0]?.practice_text?.substring(0, 50) || '없음',
                        실생활활용첫번째: currentAnalysis.real_life_usage?.[0]?.substring(0, 50) || '없음',
                        어휘첫번째: currentAnalysis.vocabulary?.[0]?.word || '없음'
                    });
                    
                    // ✅ 레벨이 일치하든 안하든 무조건 탭 다시 렌더링
                    console.log(`🔄 강제 탭 재렌더링 시작: ${previousTab} (레벨: ${currentLevel})`);
                    console.log(`📊 렌더링 전 데이터 샘플:`, {
                        실생활활용: currentAnalysis.real_life_usage?.slice(0, 2) || [],
                        어휘: currentAnalysis.vocabulary?.slice(0, 2).map(v => v.word) || []
                    });
                    
                    // ✅ 강제로 탭 다시 렌더링
                    console.log(`🔄 switchTab 호출 전: previousTab=${previousTab}, currentLevel=${currentLevel}`);
                    
                    // ✅ 현재 탭이 실생활/어휘/퀴즈인 경우 강제로 재렌더링
                    if (previousTab === 'real-life' || previousTab === 'vocabulary' || previousTab === 'quiz') {
                        console.log(`🔄 레벨별 탭 강제 재렌더링: ${previousTab}`);
                        // DOM을 완전히 비우고 다시 렌더링
                        const contentEl = document.getElementById('learningContent');
                        if (contentEl) {
                            contentEl.innerHTML = ''; // 완전히 비우기
                        }
                        
                        // 약간의 지연 후 렌더링 (DOM 업데이트 보장)
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                    
                    await switchTab(previousTab);
                    
                    // ✅ 렌더링 후 확인
                    console.log(`✅ 렌더링 완료, currentAnalysis.level: ${currentAnalysis.level}, currentLevel: ${currentLevel}`);
                    console.log(`📊 렌더링 후 DOM 확인:`, {
                        실생활활용존재: !!document.querySelector('.content-box'),
                        탭내용길이: document.getElementById('learningContent')?.innerHTML?.length || 0,
                        첫번째예문: document.querySelector('.content-box')?.textContent?.substring(0, 50) || '없음'
                    });
                } else {
                    console.error(`❌ currentAnalysis가 없습니다!`);
                    console.error(`❌ 분석 실패 또는 레벨 불일치:`, {
                        currentAnalysis존재: !!currentAnalysis,
                        분석레벨: currentAnalysis?.level,
                        현재레벨: currentLevel,
                        이전분석레벨: oldAnalysis?.level
                    });
                }
            }
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
    // 로컬스토리지에서 먼저 읽기 (즉시 표시)
    const cachedCoins = localStorage.getItem('userCoins');
    if (cachedCoins) {
        userCoins = parseInt(cachedCoins, 10);
        updateCoinDisplay();
    }
    
    // 백그라운드에서 서버와 동기화 (비블로킹, 타임아웃 3초)
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const coinsUrl = `${API_BASE}/user/${currentUserId}/coins`;
        console.log('💰 코인 조회 요청:', coinsUrl);
        
        const response = await fetch(coinsUrl, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        console.log('📡 코인 응답 상태:', response.status, response.statusText);
        
        let data;
        try {
            const responseText = await response.text();
            console.log('📄 코인 응답 본문:', responseText);
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('❌ 코인 응답 JSON 파싱 실패:', parseError);
            throw new Error('서버 응답을 파싱할 수 없습니다');
        }
        
        const serverCoins = data.coins || 50;
        
        // 에러가 있어도 coins 값이 있으면 사용
        if (data.error) {
            console.warn('⚠️ 코인 조회 경고:', data.error);
        }
        
        // 서버 값이 다르면 업데이트
        if (serverCoins !== userCoins) {
            userCoins = serverCoins;
            localStorage.setItem('userCoins', userCoins.toString());
            updateCoinDisplay();
        }
        console.log('✅ 코인 서버 동기화 완료:', userCoins);
    } catch (error) {
        // 타임아웃이나 네트워크 오류는 무시 (로컬 캐시 사용)
        console.log('⚠️ 코인 서버 동기화 실패 (로컬 캐시 사용):', error.message);
        console.log('   에러 상세:', error);
    }
}

function updateCoinDisplay() {
    const coinAmount = document.getElementById('coinAmount');
    const coinDisplay = document.getElementById('coinDisplay');
    
    if (coinAmount) {
        coinAmount.textContent = userCoins;
        console.log('💰 코인 업데이트:', userCoins);
        
        // 코인 변화 애니메이션
        if (coinDisplay) {
            coinDisplay.style.animation = 'none';
            setTimeout(() => {
                coinDisplay.style.animation = 'pulse 0.5s ease';
            }, 10);
        }
    }
}

// ============================================================================
// [1-2] 학습 기록을 Supabase에 저장
// ============================================================================
async function recordStudySession(data) {
    // 로그인하지 않은 경우 저장하지 않음
    if (!isAuthenticated || !currentUserId || currentUserId === '00000000-0000-0000-0000-000000000001') {
        return;
    }
    
    try {
        // story_id와 story_title이 직접 전달된 경우 사용 (selectStory에서 호출 시)
        const storyId = data.story_id || currentStory?.id;
        const storyTitle = data.story_title || currentStory?.title;
        
        if (!storyId) {
            console.warn('⚠️ story_id가 없어 학습 기록을 저장할 수 없습니다.');
            return;
        }
        
        const response = await fetch(`${API_BASE}/user/record-study`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: currentUserId,
                story_id: storyId,
                story_title: storyTitle || PRELOADED_STORIES.find(s => s.id === storyId)?.title || '',
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
            // 학습 기록 저장 후 최근 목록 갱신
            await loadRecentStories();
        } else {
            console.log('⚠️ 학습 기록 저장 실패 (Supabase 미설정 가능)');
        }
    } catch (error) {
        console.log('⚠️ 학습 기록 저장 오류:', error.message);
    }
}

// ============================================================================
// [2] 동화 목록 로드 (캐러셀 방식, 레벨 필터링, 학습 기록 기반 정렬)
// ============================================================================

// 학습한 동화 목록 조회
async function loadCompletedStories() {
    if (!isAuthenticated || !currentUserId || currentUserId === '00000000-0000-0000-0000-000000000001') {
        completedStoryIds = [];
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/user/${currentUserId}/completed-stories`);
        const data = await response.json();
        completedStoryIds = data.completed_story_ids || [];
        console.log('✅ 학습한 동화 목록 로드:', completedStoryIds.length, '개');
    } catch (error) {
        console.warn('⚠️ 학습 기록 조회 실패:', error);
        completedStoryIds = [];
    }
}

// 최근 학습한 동화 목록 로드
async function loadRecentStories() {
    if (!isAuthenticated || !currentUserId || currentUserId === '00000000-0000-0000-0000-000000000001') {
        recentStories = [];
        renderRecentStories(); // 빈 목록으로 렌더링 (섹션 숨김)
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/user/${currentUserId}/recent-stories`);
        const data = await response.json();
        recentStories = data.recent_stories || [];
        console.log('✅ 최근 학습 목록 로드:', recentStories.length, '개');
        
        // UI 렌더링
        renderRecentStories();
    } catch (error) {
        console.warn('⚠️ 최근 학습 목록 조회 실패:', error);
        recentStories = [];
        renderRecentStories(); // 빈 목록으로 렌더링 (섹션 숨김)
    }
}

// 환영 메시지 렌더링
function renderWelcomeMessage() {
    const welcomeSection = document.getElementById('welcomeMessageSection');
    const welcomeUserName = document.getElementById('welcomeUserName');
    const welcomeLastStory = document.getElementById('welcomeLastStory');
    
    if (!welcomeSection || !welcomeUserName || !welcomeLastStory) {
        console.warn('⚠️ 환영 메시지 요소를 찾을 수 없습니다');
        return;
    }
    
    // 로그인하지 않았으면 숨김
    if (!isAuthenticated || !currentUserId || currentUserId === '00000000-0000-0000-0000-000000000001') {
        welcomeSection.style.display = 'none';
        console.log('ℹ️ 환영 메시지 숨김: 로그인하지 않음');
        return;
    }
    
    // 사용자 이름 설정
    const userName = currentDisplayName || currentUserId.substring(0, 8) || '사용자';
    welcomeUserName.textContent = userName;
    console.log('✅ 환영 메시지 사용자 이름 설정:', userName);
    
    // 최근 학습한 스토리 찾기
    if (recentStories && recentStories.length > 0) {
        const lastStory = recentStories[0]; // 가장 최근 스토리
        console.log('📖 최근 학습 스토리:', lastStory);
        
        const storyData = PRELOADED_STORIES.find(s => s.id === lastStory.story_id);
        if (storyData) {
            const storyTitle = getStoryTitle(storyData);
            welcomeLastStory.textContent = storyTitle;
            welcomeSection.style.display = 'block';
            console.log('✅ 환영 메시지 표시:', storyTitle);
        } else {
            welcomeLastStory.textContent = '없음';
            welcomeSection.style.display = 'block';
            console.log('⚠️ 최근 스토리 데이터를 찾을 수 없음:', lastStory.story_id);
        }
    } else {
        welcomeLastStory.textContent = '없음';
        welcomeSection.style.display = 'block';
        console.log('ℹ️ 최근 학습 기록이 없음 - 환영 메시지 표시 (스토리 없음)');
    }
    
    console.log('✅ renderWelcomeMessage 완료:', {
        isAuthenticated,
        currentUserId,
        userName,
        recentStoriesCount: recentStories ? recentStories.length : 0,
        display: welcomeSection.style.display
    });
}

// 최근 학습 목록 렌더링
function renderRecentStories() {
    const listEl = document.getElementById('storyList');
    if (!listEl) return;
    
    // 기존 "학습중인 목록" 섹션이 있으면 제거
    const existingSection = document.getElementById('recentStoriesSection');
    if (existingSection) {
        existingSection.remove();
    }
    
    // 로그인하지 않았거나 학습 기록이 없으면 표시하지 않음
    if (!isAuthenticated || recentStories.length === 0) {
        return;
    }
    
    // "학습중인 목록" 섹션 HTML 생성
    const recentStoriesHTML = `
        <div id="recentStoriesSection" class="recent-stories-section">
            <h3 class="recent-stories-title">학습중인 목록</h3>
            <div class="recent-stories-list">
                ${recentStories.map(story => {
                    const storyData = PRELOADED_STORIES.find(s => s.id === story.story_id);
                    if (!storyData) return '';
                    
                    const storyTitle = getStoryTitle(storyData);
                    const completedClass = story.completed ? 'completed' : '';
                    const completedBadge = story.completed ? '<span class="completed-indicator">✓</span>' : '';
                    
                    return `
                        <div class="recent-story-item ${completedClass}" onclick="selectStory(${story.story_id})">
                            <div class="recent-story-image">
                                <img src="${storyData.image}" alt="${storyTitle}" onerror="this.style.display='none'">
                                ${completedBadge}
                            </div>
                            <div class="recent-story-info">
                                <h4 class="recent-story-title">${storyTitle}</h4>
                                <p class="recent-story-meta">${story.completed ? '학습 완료' : '학습 중'}</p>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
    
    // 캐러셀 컨테이너 다음에 삽입
    const carouselContainer = listEl.querySelector('.story-carousel-container');
    if (carouselContainer) {
        carouselContainer.insertAdjacentHTML('afterend', recentStoriesHTML);
    } else {
        // 캐러셀이 없으면 맨 앞에 추가
        listEl.insertAdjacentHTML('afterbegin', recentStoriesHTML);
    }
}

// 레벨별 동화 필터링 및 정렬
function getFilteredAndSortedStories(level, userPlan) {
    console.log('🔍 getFilteredAndSortedStories 호출:', { level, userPlan, PRELOADED_STORIES_length: PRELOADED_STORIES ? PRELOADED_STORIES.length : 'undefined' });
    
    // PRELOADED_STORIES가 정의되지 않았거나 비어있는 경우 확인
    if (typeof PRELOADED_STORIES === 'undefined' || !PRELOADED_STORIES || PRELOADED_STORIES.length === 0) {
        console.error('❌ PRELOADED_STORIES가 비어있거나 정의되지 않았습니다!');
        console.error('❌ PRELOADED_STORIES 타입:', typeof PRELOADED_STORIES);
        console.error('❌ PRELOADED_STORIES 값:', PRELOADED_STORIES);
        // 빈 배열 반환 대신 에러 표시
        const listEl = document.getElementById('storyList');
        if (listEl) {
            listEl.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-secondary);"><p>동화 데이터를 불러올 수 없습니다. 페이지를 새로고침해주세요.</p></div>';
        }
        return [];
    }
    
    // 🔑 슈퍼바이저 (bunz5911@gmail.com): 전체 51개 모두 활성화된 상태로 반환
    if (currentUserEmail === 'bunz5911@gmail.com') {
        const allStories = [...PRELOADED_STORIES];
        const completed = allStories.filter(story => completedStoryIds.includes(story.id));
        const notCompleted = allStories.filter(story => !completedStoryIds.includes(story.id));
        const shuffledNotCompleted = shuffleArray([...notCompleted]);
        const result = [...completed, ...shuffledNotCompleted];
        console.log('🔑 슈퍼바이저 모드 결과:', result.length, '개');
        return result;
    }
    
    // 무료 사용자: 0, 1번만 반환
    if (userPlan === 'free') {
        const freeStories = PRELOADED_STORIES.filter(story => story.id === 0 || story.id === 1);
        console.log('🆓 무료 사용자 결과:', freeStories.length, '개');
        return freeStories;
    }
    
    // 유료 사용자 (pro/premier): 전체 51개 반환
    // 학습한 동화와 안 한 동화 분리
    const allStories = [...PRELOADED_STORIES];
    const completed = allStories.filter(story => completedStoryIds.includes(story.id));
    const notCompleted = allStories.filter(story => !completedStoryIds.includes(story.id));
    
    // 안 한 동화는 랜덤 셔플
    const shuffledNotCompleted = shuffleArray([...notCompleted]);
    
    // 학습한 동화 상단 + 안 한 동화
    const combined = [...completed, ...shuffledNotCompleted];
    console.log('💎 유료 사용자 결과:', combined.length, '개 (완료:', completed.length, ', 미완료:', shuffledNotCompleted.length, ')');
    
    return combined;
}

// 배열 셔플 함수
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

async function loadStories() {
    try {
        console.log('📚 loadStories() 시작');
        
        // PRELOADED_STORIES 확인 (가장 먼저 체크)
        if (typeof PRELOADED_STORIES === 'undefined' || !PRELOADED_STORIES || PRELOADED_STORIES.length === 0) {
            console.error('❌ PRELOADED_STORIES가 정의되지 않았거나 비어있습니다!');
            const listEl = document.getElementById('storyList');
            if (listEl) {
                listEl.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-secondary);"><p>동화 데이터를 불러올 수 없습니다. 페이지를 새로고침해주세요.</p></div>';
            }
            return;
        }
        
        console.log('📚 PRELOADED_STORIES 개수:', PRELOADED_STORIES.length);
        console.log('📚 currentLevel:', currentLevel);
        console.log('📚 currentUserPlan:', currentUserPlan);
        console.log('📚 isAuthenticated:', isAuthenticated);
        console.log('📚 currentUserId:', currentUserId);
        
        // 1. 학습 기록 로드 (로그인한 경우)
        await loadCompletedStories();
        console.log('📚 학습 기록 로드 완료, completedStoryIds:', completedStoryIds.length, '개');
        
        // 2. 레벨 테스트 확인 (첫 방문 시) - 로그인한 경우에만
        const storedLevelTest = localStorage.getItem('level_test_completed');
        if (!storedLevelTest && isAuthenticated && currentUserId && currentUserId !== '00000000-0000-0000-0000-000000000001') {
            // 레벨 테스트 모달 표시
            console.log('📝 레벨 테스트 모달 표시');
            showLevelTestModal();
            return; // 테스트 완료 후 다시 로드
        }
        
        // 3. 현재 레벨의 동화 필터링 및 정렬
        const userPlan = currentUserPlan || 'free';
        console.log('📚 getFilteredAndSortedStories 호출 전:', { level: currentLevel, userPlan });
        currentStories = getFilteredAndSortedStories(currentLevel, userPlan);
        console.log('📚 getFilteredAndSortedStories 결과:', currentStories.length, '개');
        
        // 🔑 슈퍼바이저 또는 유료 사용자의 경우 전체 스토리 목록 저장 (무한 루프용)
        if (currentUserEmail === 'bunz5911@gmail.com' || userPlan !== 'free') {
            allCarouselStories = PRELOADED_STORIES;
            carouselVisitedIndices.clear(); // 방문 기록 초기화
            if (currentUserEmail === 'bunz5911@gmail.com') {
                console.log('🔑 슈퍼바이저: 전체 루핑 캐러셀 활성화');
            }
        } else {
            allCarouselStories = [];
        }
        
        console.log('📚 동화 필터링 결과:', {
            레벨: currentLevel,
            플랜: userPlan,
            필터링된_동화수: currentStories.length,
            전체_동화수: PRELOADED_STORIES.length,
            레벨별_동화수: PRELOADED_STORIES.filter(s => s.level === currentLevel).length,
            전체_캐러셀_스토리수: allCarouselStories.length
        });
        
        // 4. 캐러셀 렌더링 (레벨 테스트가 없거나 완료된 경우)
        if (currentStories && currentStories.length > 0) {
            console.log('🎠 캐러셀 렌더링 시작:', currentStories.length, '개');
            renderStoryCarousel();
            console.log('✅ 동화 목록 렌더링 완료:', currentStories.length, '개 (레벨:', currentLevel + ')');
            
            // 최근 학습 목록 로드 (로그인한 경우)
            await loadRecentStories();
            
            // 환영 메시지 표시 (로그인한 경우) - loadRecentStories 완료 후 호출
            // 약간의 지연을 두어 DOM이 완전히 렌더링된 후 실행
            setTimeout(() => {
                renderWelcomeMessage();
            }, 100);
        } else {
            console.warn('⚠️ 표시할 동화가 없습니다. 레벨:', currentLevel);
            const listEl = document.getElementById('storyList');
            if (listEl) {
                listEl.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--text-secondary);"><p>${currentLevel} 레벨의 동화가 없습니다.</p></div>`;
            }
        }
    } catch (error) {
        console.error('❌ 동화 목록 렌더링 실패:', error);
        const listEl = document.getElementById('storyList');
        if (listEl) {
            listEl.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-secondary);"><p>동화 목록을 불러올 수 없습니다. 페이지를 새로고침해주세요.</p></div>';
        }
    }
    
    // 백그라운드에서 서버 데이터 동기화 (선택사항)
    try {
        const response = await fetch(`${API_BASE}/stories`);
        const data = await response.json();
        if (data.stories && data.stories.length > 0) {
            console.log('✅ 서버 동화 목록 동기화 완료');
        }
    } catch (error) {
        console.log('⚠️ 서버 연결 실패, 로컬 데이터 사용 중:', error.message);
    }
}

// 모바일에서 렌더링할 최대 카드 수 계산
function getMaxRenderedCards() {
    const width = window.innerWidth;
    
    if (width <= 480) {
        return MOBILE_CARD_LIMITS.small; // 3개
    } else if (width <= 768) {
        return MOBILE_CARD_LIMITS.medium; // 5개
    } else if (width <= 1024) {
        return MOBILE_CARD_LIMITS.tablet; // 7개
    }
    
    return Infinity; // PC는 제한 없음
}

// 렌더링할 카드 범위 계산
function getRenderRange(activeIndex, totalCards) {
    const maxRendered = getMaxRenderedCards();
    
    // PC에서는 모든 카드 렌더링 (여러 카드가 겹쳐서 보이도록)
    if (window.innerWidth > 1024) {
        return { start: 0, end: totalCards };
    }
    
    // 🔑 슈퍼바이저 또는 유료 사용자는 모바일에서도 전체 카드 렌더링
    const userPlan = currentUserPlan || 'free';
    if (currentUserEmail === 'bunz5911@gmail.com' || userPlan !== 'free') {
        return { start: 0, end: totalCards };
    }
    
    // 태블릿/모바일: 활성 카드 주변만 렌더링
    if (maxRendered === Infinity) {
        return { start: 0, end: totalCards };
    }
    
    // 모바일 무료 사용자: 활성 카드 주변만 렌더링
    const buffer = Math.floor(maxRendered / 2);
    const start = Math.max(0, activeIndex - buffer);
    const end = Math.min(totalCards, activeIndex + buffer + 1);
    
    return { start, end };
}

// CSS 캐러셀 지원 여부 체크
function supportsCSSScrollButtons() {
    return CSS.supports('scroll-button', 'start') || 
           CSS.supports('-webkit-scroll-button', 'start');
}

// 캐러셀 렌더링 함수
function renderStoryCarousel(activeIndex = 0) {
    const listEl = document.getElementById('storyList');
    if (!listEl) return;
    
    const userPlan = currentUserPlan || 'free';
    
    // 🔑 슈퍼바이저 (bunz5911@gmail.com): 전체 51개 모두 활성화된 상태로 표시
    let storiesToRender = [];
    let lockedStories = [];
    
    if (currentUserEmail === 'bunz5911@gmail.com') {
        // 슈퍼바이저: 전체 51개 모두 활성화된 상태로 표시
        const allStories = PRELOADED_STORIES;
        storiesToRender = allStories.map(story => ({ ...story, isLocked: false }));
        console.log('🔑 슈퍼바이저 모드: 전체 51개 스토리 활성화');
    } else if (userPlan === 'free') {
        // 무료: 0, 1번만 표시
        storiesToRender = currentStories;
    } else {
        // 유료: 전체 51개 표시하되 lock 상태 표시
        const allStories = PRELOADED_STORIES;
        const proLimit = userPlan === 'pro' ? 15 : 30;
        
        allStories.forEach(story => {
            if (story.id <= proLimit) {
                storiesToRender.push({ ...story, isLocked: false });
            } else {
                lockedStories.push({ ...story, isLocked: true });
            }
        });
        
        // lock된 카드도 캐러셀에 포함
        storiesToRender = [...storiesToRender, ...lockedStories];
    }
    
    // CSS 캐러셀 지원 여부 확인
    const supportsCSS = supportsCSSScrollButtons();
    
    // 렌더링할 카드 범위 계산 (유료 사용자는 전체 렌더링)
    const renderRange = getRenderRange(activeIndex, storiesToRender.length);
    renderedCardRange = renderRange;
    
    // 렌더링할 카드만 추출
    const cardsToRender = storiesToRender.slice(renderRange.start, renderRange.end);
    
    console.log(`📱 렌더링 범위: ${renderRange.start}-${renderRange.end} (총 ${cardsToRender.length}개, 활성: ${activeIndex})`);
    if (supportsCSS) {
        console.log('✨ CSS 캐러셀 기능 사용 중 (Chrome 135+ / Safari)');
    }
    
    // Bootstrap 스타일 캐러셀 컨테이너 HTML
    const carouselId = 'storyCarousel';
    let carouselHTML = `
        <div class="story-carousel-container">
            <div class="carousel-header">
                <h2 class="carousel-title">${currentLevel} 스토리</h2>
                <div class="carousel-info">
                </div>
            </div>
            <div id="${carouselId}" class="carousel-wrapper" data-bs-ride="false">
                ${!supportsCSS ? `
                    <button class="carousel-control-prev" type="button" data-bs-target="#${carouselId}" onclick="scrollCarousel(-1)">
                        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                        <span class="visually-hidden">이전</span>
                    </button>
                ` : ''}
                <div class="carousel-track" id="carouselTrack">
    `;
    
    // 동화 카드들 (렌더링 범위 내만) - Bootstrap 독립 지연 시간 적용
    cardsToRender.forEach((story, localIndex) => {
        const actualIndex = renderRange.start + localIndex;
        const isActive = actualIndex === activeIndex;
        const isCompleted = completedStoryIds.includes(story.id);
        const completedBadge = isCompleted ? '<div class="completed-badge">✓ 학습함</div>' : '';
        const isLocked = story.isLocked || false;
        
        // Bootstrap 독립 지연 시간: 첫 번째 카드는 10초, 나머지는 2초
        const interval = actualIndex === 0 ? '10000' : '2000';
        
        // lock된 카드 클릭 처리
        const onClickHandler = isLocked ? 'showSeason2Modal()' : `checkStoryAccess(${story.id})`;
        
        // CSS 캐러셀을 위해 id 추가, Bootstrap data-bs-interval 추가
        if (isLocked) {
            // Lock 카드 (Season 2)
            carouselHTML += `
                <div class="carousel-slide ${isActive ? 'active' : ''} locked-slide" 
                     data-story-id="${story.id}" 
                     data-index="${actualIndex}"
                     data-bs-interval="${interval}"
                     id="story-${story.id}">
                    <div class="story-card-carousel locked-card" onclick="${onClickHandler}">
                        <div class="story-card-image">
                            <img src="${story.image}" alt="${story.title}" onerror="this.style.display='none'" style="opacity: 0.5;">
                            <div class="story-card-overlay">
                                <h3 class="story-card-title-overlay">${getStoryTitle(story)}</h3>
                                <div class="lock-badge">🔒 Season 2</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // 일반 카드 (숫자 제거)
            const coinBadge = getCoinBadge(story.id, userPlan);
            carouselHTML += `
                <div class="carousel-slide ${isActive ? 'active' : ''}" 
                     data-story-id="${story.id}" 
                     data-index="${actualIndex}"
                     data-bs-interval="${interval}"
                     id="story-${story.id}">
                    <div class="story-card-carousel" onclick="${onClickHandler}">
                        ${completedBadge}
                        <div class="story-card-image">
                            <img src="${story.image}" alt="${story.title}" onerror="this.style.display='none'">
                            ${coinBadge}
                            <div class="story-card-overlay">
                                <h3 class="story-card-title-overlay">${getStoryTitle(story)}</h3>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    });
    
    carouselHTML += `
                </div>
                ${!supportsCSS ? `
                    <button class="carousel-control-next" type="button" data-bs-target="#${carouselId}" onclick="scrollCarousel(1)">
                        <span class="carousel-control-next-icon" aria-hidden="true"></span>
                        <span class="visually-hidden">다음</span>
                    </button>
                ` : ''}
            </div>
            ${!supportsCSS ? `<ol class="carousel-indicators" id="carouselIndicators"></ol>` : ''}
        </div>
    `;
    
    // 무료 사용자: "다른 스토리 더 보기" 카드를 캐러셀 밖으로 분리
    let upgradeCardHTML = '';
    if (userPlan === 'free' && currentStories.length < PRELOADED_STORIES.length) {
        const remainingCount = PRELOADED_STORIES.length - currentStories.length;
        upgradeCardHTML = `
            <div class="upgrade-card-container">
                <div class="upgrade-card-standalone">
                    <div class="lock-content">
                        <div class="lock-icon">🔒</div>
                        <h3>다른 스토리 더 보기</h3>
                        <p>pro 또는 premire 구독으로 더 많은 스토리를 보세요</p>
                        <button class="upgrade-btn-carousel" onclick="showUpgradeModal('pro')">구독하기</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    listEl.innerHTML = carouselHTML + upgradeCardHTML;
    
    // PC에서 마우스 호버 시 활성 카드 업데이트 (십자선 이동)
    // DOM 렌더링 완료 후 이벤트 리스너 추가
    if (window.innerWidth > 1024) {
        setTimeout(() => {
            setupCarouselHoverListeners();
        }, 100);
    }
    
    // CSS 캐러셀 미지원 시에만 JavaScript 기능 활성화
    if (!supportsCSS) {
        // 인디케이터 생성
        updateCarouselIndicators();
        
        // 스크롤 이벤트 리스너 추가 (동적 로딩용 - 모바일만)
        if (window.innerWidth <= 1024) {
            setupCarouselScrollListener();
            // 모바일에서 초기 스크롤 위치 조정 (더 보기 카드가 잘 보이도록)
            setTimeout(() => {
                adjustMobileCarouselPosition();
            }, 150);
        }
        
        // PC에서 중앙 정렬
        if (window.innerWidth > 1024) {
            setTimeout(() => {
                centerActiveCard();
            }, 100);
        }
    } else {
        // CSS 캐러셀 지원 시에도 모바일 스크롤 리스너는 유지
        if (window.innerWidth <= 1024) {
            setupCarouselScrollListener();
            // 모바일에서 초기 스크롤 위치 조정
            setTimeout(() => {
                adjustMobileCarouselPosition();
            }, 150);
        }
    }
}

// PC에서 마우스 호버 시 활성 카드 업데이트 (십자선 이동)
function setupCarouselHoverListeners() {
    const track = document.getElementById('carouselTrack');
    if (!track || window.innerWidth <= 1024) return;
    
    // 모든 카드에 마우스 호버 이벤트 리스너 추가
    const slides = track.querySelectorAll('.carousel-slide');
    slides.forEach(slide => {
        // 기존 이벤트 리스너 제거를 위해 클론 후 교체 (중복 방지)
        const newSlide = slide.cloneNode(true);
        slide.parentNode.replaceChild(newSlide, slide);
    });
    
    // 새로운 이벤트 리스너 추가
    const newSlides = track.querySelectorAll('.carousel-slide');
    newSlides.forEach(slide => {
        slide.addEventListener('mouseenter', function() {
            // 모든 활성 카드의 active 클래스 제거 (십자선 제거)
            const allActiveSlides = track.querySelectorAll('.carousel-slide.active');
            allActiveSlides.forEach(activeSlide => activeSlide.classList.remove('active'));
            
            // 호버된 카드에 active 클래스 추가 (십자선 표시)
            this.classList.add('active');
            updateCarouselIndicators();
        });
    });
}

// 활성 카드를 중앙에 배치하는 함수 (PC용)
function centerActiveCard() {
    const track = document.getElementById('carouselTrack');
    if (!track || window.innerWidth <= 1024) return;
    
    const activeSlide = track.querySelector('.carousel-slide.active');
    if (!activeSlide) return;
    
    const trackRect = track.getBoundingClientRect();
    const slideRect = activeSlide.getBoundingClientRect();
    const slideWidth = slideRect.width + 16; // gap 포함
    
    // 활성 카드가 중앙에 오도록 스크롤
    const scrollLeft = activeSlide.offsetLeft - (trackRect.width / 2) + (slideWidth / 2);
    
    track.scrollTo({
        left: Math.max(0, scrollLeft), // 음수 방지
        behavior: 'smooth'
    });
}

// 모바일에서 캐러셀 초기 위치 조정 (세로 그리드 레이아웃)
function adjustMobileCarouselPosition() {
    const track = document.getElementById('carouselTrack');
    if (!track) {
        console.log('⚠️ adjustMobileCarouselPosition: carouselTrack을 찾을 수 없습니다');
        return;
    }
    
    if (window.innerWidth > 1024) {
        console.log('⚠️ adjustMobileCarouselPosition: PC 화면이므로 스킵');
        return;
    }
    
    const slides = track.querySelectorAll('.carousel-slide');
    if (slides.length === 0) {
        console.log('⚠️ adjustMobileCarouselPosition: 슬라이드가 없습니다');
        return;
    }
    
    const activeSlide = track.querySelector('.carousel-slide.active');
    if (!activeSlide) {
        console.log('⚠️ adjustMobileCarouselPosition: 활성 슬라이드를 찾을 수 없습니다');
        return;
    }
    
    // 모바일은 세로 스크롤이므로 scrollTop 사용
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // 세로 그리드 레이아웃: 활성 카드를 상단에 배치
        const targetScrollTop = activeSlide.offsetTop;
        
        console.log('📱 모바일 세로 캐러셀 위치 조정:', {
            화면너비: window.innerWidth,
            활성인덱스: Array.from(slides).indexOf(activeSlide),
            목표스크롤: targetScrollTop
        });
        
        track.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth'
        });
    } else {
        // 태블릿은 기존 가로 스크롤 유지
        const slideWidth = activeSlide.offsetWidth;
        const viewportWidth = track.clientWidth;
        const targetScrollLeft = activeSlide.offsetLeft - (viewportWidth * 0.1);
        
        track.scrollTo({
            left: Math.max(0, targetScrollLeft),
            behavior: 'smooth'
        });
    }
}

// 화면 크기 변경 시 중앙 정렬 유지
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (window.innerWidth > 1024) {
            centerActiveCard();
        }
    }, 250);
});

// 캐러셀 스크롤 리스너 설정 (터치 스와이프 및 동적 카드 로딩)
function setupCarouselScrollListener() {
    const track = document.getElementById('carouselTrack');
    if (!track) return;
    
    let scrollTimeout;
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // 모바일: 세로 스크롤 - 네이티브 스크롤 사용, 터치 스와이프 제거
        // 스크롤 이벤트로 활성 카드 업데이트만 수행
        track.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                updateActiveSlideOnScroll();
            }, 100);
        }, { passive: true });
    } else {
        // 태블릿: 가로 스크롤 - 기존 터치 스와이프 유지
        let touchStartX = 0;
        let touchEndX = 0;
        
        track.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        track.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });
        
        function handleSwipe() {
            const swipeThreshold = 50;
            const diff = touchStartX - touchEndX;
            
            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    // 왼쪽으로 스와이프 (다음 카드)
                    scrollCarousel(1);
                } else {
                    // 오른쪽으로 스와이프 (이전 카드)
                    scrollCarousel(-1);
                }
            }
        }
        
        // 스크롤 이벤트 (동적 카드 로딩)
        track.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                checkAndLoadMoreCards();
            }, 100);
        }, { passive: true });
    }
}

// 세로 스크롤 시 활성 슬라이드 업데이트 (모바일용)
function updateActiveSlideOnScroll() {
    const track = document.getElementById('carouselTrack');
    if (!track || window.innerWidth > 768) return;
    
    const slides = track.querySelectorAll('.carousel-slide');
    if (slides.length === 0) return;
    
    const trackRect = track.getBoundingClientRect();
    const trackTop = trackRect.top;
    const trackCenter = trackTop + (trackRect.height / 2);
    
    let closestSlide = null;
    let closestDistance = Infinity;
    
    slides.forEach(slide => {
        const slideRect = slide.getBoundingClientRect();
        const slideCenter = slideRect.top + (slideRect.height / 2);
        const distance = Math.abs(slideCenter - trackCenter);
        
        if (distance < closestDistance) {
            closestDistance = distance;
            closestSlide = slide;
        }
    });
    
    if (closestSlide) {
        // 활성 슬라이드 업데이트
        slides.forEach(slide => slide.classList.remove('active'));
        closestSlide.classList.add('active');
        updateCarouselIndicators();
    }
}

// 스크롤 시 추가 카드 로드 확인
function checkAndLoadMoreCards() {
    const track = document.getElementById('carouselTrack');
    if (!track) return;
    
    const maxRendered = getMaxRenderedCards();
    if (maxRendered === Infinity) return; // PC는 불필요
    
    // 🔑 슈퍼바이저 또는 유료 사용자는 모바일에서도 전체 카드가 이미 렌더링되어 있으므로 불필요
    const userPlan = currentUserPlan || 'free';
    if (currentUserEmail === 'bunz5911@gmail.com' || userPlan !== 'free') {
        return;
    }
    
    const activeSlide = track.querySelector('.carousel-slide.active');
    if (!activeSlide) return;
    
    const activeIndex = parseInt(activeSlide.dataset.index) || 0;
    const currentRange = renderedCardRange;
    
    // 전체 스토리 수 가져오기 (무료 사용자만)
    const totalStories = currentStories.length;
    
    // 활성 카드가 범위 끝에 가까우면 확장
    const threshold = 1; // 범위 끝에서 1개 남았을 때
    const needsExpandRight = activeIndex >= currentRange.end - threshold && 
                             currentRange.end < totalStories;
    const needsExpandLeft = activeIndex <= currentRange.start + threshold && 
                            currentRange.start > 0;
    
    if (needsExpandRight || needsExpandLeft) {
        // 범위 재계산 및 재렌더링
        const newRange = getRenderRange(activeIndex, totalStories);
        if (newRange.start !== currentRange.start || newRange.end !== currentRange.end) {
            renderStoryCarousel(activeIndex);
        }
    }
}

// 다음 플랜 가져오기
function getNextPlan(currentPlan) {
    const planOrder = { free: 'pro', pro: 'premier', premier: null };
    return planOrder[currentPlan] || null;
}

// 캐러셀 스크롤 함수 (무한 루프 및 랜덤 연결 지원)
// 전역 스코프에 등록하여 onclick에서 접근 가능하도록
window.scrollCarousel = function(direction) {
    const track = document.getElementById('carouselTrack');
    if (!track) return;
    
    const activeSlide = track.querySelector('.carousel-slide.active');
    if (!activeSlide) return;
    
    const userPlan = currentUserPlan || 'free';
    const currentIndex = parseInt(activeSlide.dataset.index) || 0;
    const isPC = window.innerWidth > 1024;
    
    // 전체 스토리 목록 가져오기
    let totalStories;
    // 🔑 슈퍼바이저는 항상 전체 51개 사용
    if (currentUserEmail === 'bunz5911@gmail.com') {
        totalStories = allCarouselStories.length;
    } else if (userPlan === 'free') {
        totalStories = currentStories.length;
    } else {
        totalStories = allCarouselStories.length;
    }
    
    let nextIndex;
    
    // 🔑 슈퍼바이저 또는 유료 사용자: 무한 루프 및 랜덤 연결
    if ((currentUserEmail === 'bunz5911@gmail.com' || userPlan !== 'free') && totalStories > 0) {
        if (direction > 0) {
            // 다음 버튼: 마지막이면 랜덤, 아니면 다음
            if (currentIndex >= totalStories - 1) {
                // 한 바퀴를 돌았는지 확인
                if (carouselVisitedIndices.size >= totalStories) {
                    // 모든 카드를 방문했으면 랜덤 선택
                    carouselVisitedIndices.clear(); // 리셋
                    nextIndex = Math.floor(Math.random() * totalStories);
                } else {
                    // 아직 모든 카드를 방문하지 않았으면 첫 번째로
                    nextIndex = 0;
                }
            } else {
                nextIndex = currentIndex + 1;
            }
        } else {
            // 이전 버튼: 첫 번째면 랜덤, 아니면 이전
            if (currentIndex <= 0) {
                // 한 바퀴를 돌았는지 확인
                if (carouselVisitedIndices.size >= totalStories) {
                    // 모든 카드를 방문했으면 랜덤 선택
                    carouselVisitedIndices.clear(); // 리셋
                    nextIndex = Math.floor(Math.random() * totalStories);
                } else {
                    // 아직 모든 카드를 방문하지 않았으면 마지막으로
                    nextIndex = totalStories - 1;
                }
            } else {
                nextIndex = currentIndex - 1;
            }
        }
        
        // 방문한 인덱스 추적
        carouselVisitedIndices.add(nextIndex);
    } else {
        // 무료 사용자: 기존 로직
        nextIndex = currentIndex + direction;
        if (nextIndex < 0) nextIndex = 0;
        if (nextIndex >= totalStories) nextIndex = totalStories - 1;
    }
    
    // 인덱스 범위 체크
    if (nextIndex >= 0 && nextIndex < totalStories) {
        // PC에서는 화살표로 이동
        if (isPC) {
            // 모든 활성 카드의 active 클래스 제거 (십자선 제거)
            const allActiveSlides = track.querySelectorAll('.carousel-slide.active');
            allActiveSlides.forEach(slide => slide.classList.remove('active'));
            
            // 다음 카드 찾기
            let nextSlide = track.querySelector(`[data-index="${nextIndex}"]`);
            
            // 카드가 렌더링되지 않았으면 다시 렌더링
            if (!nextSlide) {
                renderStoryCarousel(nextIndex);
                // 렌더링 후 다시 찾기
                setTimeout(() => {
                    nextSlide = track.querySelector(`[data-index="${nextIndex}"]`);
                    if (nextSlide) {
                        // 모든 활성 카드 제거 후 새로운 활성 카드 추가
                        const allActiveSlides2 = track.querySelectorAll('.carousel-slide.active');
                        allActiveSlides2.forEach(slide => slide.classList.remove('active'));
                        nextSlide.classList.add('active');
                        centerActiveCard();
                        updateCarouselIndicators();
                    }
                }, 50);
                return;
            }
            
            // 카드가 있으면 바로 업데이트
            nextSlide.classList.add('active');
            centerActiveCard();
            updateCarouselIndicators();
            return;
        }
        
        // 모바일/태블릿 처리
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            // 모바일: 세로 그리드 레이아웃 - 세로 스크롤 사용
            activeSlide.classList.remove('active');
            const nextSlide = track.querySelector(`[data-index="${nextIndex}"]`);
            if (nextSlide) {
                nextSlide.classList.add('active');
                
                // 세로 스크롤로 해당 카드로 이동
                track.scrollTo({
                    top: nextSlide.offsetTop,
                    behavior: 'smooth'
                });
                
                updateCarouselIndicators();
            }
        } else {
            // 태블릿: 가로 스크롤 유지
            const maxRendered = getMaxRenderedCards();
            const needsRerender = maxRendered !== Infinity && 
                (nextIndex < renderedCardRange.start || nextIndex >= renderedCardRange.end);
            
            if (needsRerender) {
                // 범위를 벗어나면 다시 렌더링
                renderStoryCarousel(nextIndex);
                // 스크롤 위치 조정
                setTimeout(() => {
                    const newSlides = track.querySelectorAll('.carousel-slide');
                    const newActiveSlide = track.querySelector(`[data-index="${nextIndex}"]`);
                    if (newActiveSlide) {
                        const slideWidth = newActiveSlide.offsetWidth + 16;
                        const slideIndex = Array.from(newSlides).indexOf(newActiveSlide);
                        track.scrollTo({
                            left: slideIndex * slideWidth,
                            behavior: 'smooth'
                        });
                    }
                    updateCarouselIndicators();
                }, 50);
            } else {
                // 범위 내면 기존 카드만 업데이트
                // 모든 활성 카드의 active 클래스 제거 (십자선 제거)
                const allActiveSlides = track.querySelectorAll('.carousel-slide.active');
                allActiveSlides.forEach(slide => slide.classList.remove('active'));
                
                const nextSlide = track.querySelector(`[data-index="${nextIndex}"]`);
                if (nextSlide) {
                    nextSlide.classList.add('active');
                    
                    // 스크롤 애니메이션
                    const slides = track.querySelectorAll('.carousel-slide');
                    const slideIndex = Array.from(slides).indexOf(nextSlide);
                    const slideWidth = nextSlide.offsetWidth + 16;
                    track.scrollTo({
                        left: slideIndex * slideWidth,
                        behavior: 'smooth'
                    });
                    
                    updateCarouselIndicators();
                }
            }
        }
    }
}

// Bootstrap 스타일 캐러셀 인디케이터 업데이트
function updateCarouselIndicators() {
    const track = document.getElementById('carouselTrack');
    const indicators = document.getElementById('carouselIndicators');
    if (!track || !indicators) return;
    
    const activeSlide = track.querySelector('.carousel-slide.active');
    if (!activeSlide) return;
    
    const activeIndex = parseInt(activeSlide.dataset.index) || 0;
    const carouselId = 'storyCarousel';
    const userPlan = currentUserPlan || 'free';
    
    // 🔑 슈퍼바이저는 항상 전체 51개, 유료 사용자는 전체 스토리 수, 무료는 currentStories 수
    const totalStories = currentUserEmail === 'bunz5911@gmail.com' 
        ? allCarouselStories.length 
        : (userPlan !== 'free' ? allCarouselStories.length : currentStories.length);
    
    indicators.innerHTML = '';
    
    // Bootstrap 스타일: <li> 요소로 인디케이터 생성
    // 인디케이터는 최대 20개만 표시 (너무 많으면 UI가 복잡해짐)
    const maxIndicators = Math.min(totalStories, 20);
    for (let i = 0; i < maxIndicators; i++) {
        const li = document.createElement('li');
        li.setAttribute('data-bs-target', `#${carouselId}`);
        li.setAttribute('data-bs-slide-to', i);
        li.setAttribute('aria-label', `슬라이드 ${i + 1}`);
        if (i === activeIndex) {
            li.classList.add('active');
            li.setAttribute('aria-current', 'true');
        }
        li.onclick = (e) => {
            e.preventDefault();
            // 클릭한 인디케이터로 이동
            if (i !== activeIndex) {
                renderStoryCarousel(i);
            }
        };
        indicators.appendChild(li);
    }
    
    // 전체 스토리가 20개보다 많으면 "..." 표시
    if (totalStories > maxIndicators) {
        const li = document.createElement('li');
        li.textContent = '...';
        li.style.cursor = 'default';
        indicators.appendChild(li);
    }
}

// 레벨 테스트 모달 표시
function showLevelTestModal() {
    const modal = document.createElement('div');
    modal.className = 'level-test-modal';
    modal.id = 'levelTestModal';
    modal.innerHTML = `
        <div class="level-test-content">
            <h2>레벨 테스트</h2>
            <p>당신에게 맞는 레벨을 추천해드리겠습니다.</p>
            <div class="test-questions" id="testQuestions">
                <!-- 테스트 문제들이 여기에 동적으로 추가됩니다 -->
            </div>
            <div class="test-actions">
                <button class="btn-primary" onclick="submitLevelTest()">완료</button>
                <button class="btn-secondary" onclick="skipLevelTest()">건너뛰기</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 수준 높은 레벨 테스트 문제 풀 (15개)
    // 정답을 0, 1, 2, 3에 고르게 분포시킴
    const questionPool = [
        // 초급 수준 문제 (정답: 0, 1, 2, 0, 1로 분포)
        { id: 1, question: '"안녕하세요"의 의미는?', options: ["Hello", "Goodbye", "Thank you", "Sorry"], correct: 0, level: 'beginner' },
        { id: 2, question: '"감사합니다"의 의미는?', options: ["Hello", "Thank you", "Sorry", "Please"], correct: 1, level: 'beginner' },
        { id: 3, question: '"미안합니다"의 의미는?', options: ["Hello", "Thank you", "Sorry", "Please"], correct: 2, level: 'beginner' },
        { id: 4, question: '"물"의 의미는?', options: ["Water", "Fire", "Earth", "Air"], correct: 0, level: 'beginner' },
        { id: 5, question: '"사과"의 의미는?', options: ["Apple", "Orange", "Banana", "Grape"], correct: 1, level: 'beginner' },
        
        // 중급 수준 문제 (정답: 0, 1, 2, 3, 0, 1로 고르게 분포)
        { id: 6, question: '"오늘 날씨가 좋네요"의 적절한 응답은?', options: ["네, 정말 좋아요", "안녕하세요", "감사합니다", "미안합니다"], correct: 0, level: 'intermediate' },
        { id: 7, question: '"어제 뭐 했어요?"의 의미는?', options: ["What did you do yesterday?", "What will you do tomorrow?", "What are you doing now?", "What do you like?"], correct: 0, level: 'intermediate' },
        { id: 8, question: '"시간이 없어서 서두르고 있어요"의 의미는?', options: ["I'm in a hurry because I don't have time", "I have plenty of time", "Time is slow", "I'm waiting"], correct: 1, level: 'intermediate' },
        { id: 9, question: '"이 음식은 정말 맛있어요"의 의미는?', options: ["This food is really delicious", "This food is terrible", "I don't like this food", "This food is expensive"], correct: 2, level: 'intermediate' },
        { id: 10, question: '"제가 도와드릴까요?"의 의미는?', options: ["Can I help you?", "Do you need help?", "I need help", "Help me please"], correct: 3, level: 'intermediate' },
        { id: 11, question: '"내일 만날 수 있을까요?"의 의미는?', options: ["Can we meet tomorrow?", "Can we meet today?", "Can we meet next week?", "Can we meet yesterday?"], correct: 0, level: 'intermediate' },
        
        // 고급 수준 문제 (정답: 0, 1, 2, 3, 0, 1, 2, 3, 0으로 고르게 분포)
        { id: 12, question: '"그 일은 제가 처리하겠습니다"의 의미는?', options: ["I'll handle that matter", "I don't know about that", "That's not my problem", "I'll think about it"], correct: 0, level: 'advanced' },
        { id: 13, question: '"이 문제를 해결하기 위해서는 신중한 접근이 필요합니다"의 의미는?', options: ["We need a careful approach to solve this problem", "This problem is easy to solve", "We don't need to solve this", "This problem is impossible"], correct: 1, level: 'advanced' },
        { id: 14, question: '"그의 제안은 타당하지만 실행하기 어려울 것 같습니다"의 의미는?', options: ["His suggestion is valid but seems difficult to implement", "His suggestion is invalid", "His suggestion is easy to implement", "I don't understand his suggestion"], correct: 2, level: 'advanced' },
        { id: 15, question: '"이 프로젝트는 여러 분야의 전문가들의 협력이 필수적입니다"의 의미는?', options: ["This project requires cooperation from experts in various fields", "This project doesn't need experts", "This project is simple", "This project is impossible"], correct: 3, level: 'advanced' },
        { id: 16, question: '"그 회의에서 중요한 결정사항들이 논의되었습니다"의 의미는?', options: ["Important decisions were discussed at that meeting", "No decisions were made", "The meeting was cancelled", "The meeting was boring"], correct: 0, level: 'advanced' },
        { id: 17, question: '"이 계획은 장기적인 관점에서 검토해야 합니다"의 의미는?', options: ["This plan needs to be reviewed from a long-term perspective", "This plan is short-term", "This plan is not important", "This plan is already perfect"], correct: 1, level: 'advanced' },
        { id: 18, question: '"그들의 의견 차이를 좁히기 위해 중재가 필요합니다"의 의미는?', options: ["Mediation is needed to narrow their differences of opinion", "They agree completely", "No mediation is needed", "They don't have opinions"], correct: 2, level: 'advanced' },
        { id: 19, question: '"이 문제의 근본 원인을 파악하는 것이 중요합니다"의 의미는?', options: ["It's important to identify the root cause of this problem", "The cause is not important", "We already know the cause", "This problem has no cause"], correct: 3, level: 'advanced' },
        { id: 20, question: '"그 제안은 현실적으로 실행 가능성이 낮아 보입니다"의 의미는?', options: ["That proposal seems to have low feasibility in reality", "That proposal is very feasible", "That proposal is perfect", "That proposal doesn't exist"], correct: 0, level: 'advanced' }
    ];
    
    // 랜덤하게 12개 문제 선택 (초급 3개, 중급 4개, 고급 5개)
    const shuffledPool = [...questionPool].sort(() => Math.random() - 0.5);
    const beginnerQuestions = shuffledPool.filter(q => q.level === 'beginner').slice(0, 3);
    const intermediateQuestions = shuffledPool.filter(q => q.level === 'intermediate').slice(0, 4);
    const advancedQuestions = shuffledPool.filter(q => q.level === 'advanced').slice(0, 5);
    
    // 선택된 문제들을 다시 랜덤하게 섞기
    const selectedQuestions = [...beginnerQuestions, ...intermediateQuestions, ...advancedQuestions]
        .sort(() => Math.random() - 0.5)
        .map((q, idx) => ({ ...q, id: idx + 1 })); // ID 재할당
    
    const questionsEl = document.getElementById('testQuestions');
    questionsEl.innerHTML = selectedQuestions.map((q, idx) => `
        <div class="test-question">
            <p class="question-text">${q.question}</p>
            <div class="question-options">
                ${q.options.map((opt, optIdx) => `
                    <label class="option-label">
                        <input type="radio" name="question${q.id}" value="${optIdx}" data-correct="${optIdx === q.correct}">
                        <span>${opt}</span>
                    </label>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// 레벨 테스트 제출
async function submitLevelTest() {
    const questions = document.querySelectorAll('.test-question');
    const answers = [];
    let score = 0;
    let totalQuestions = 0;
    
    questions.forEach((q, idx) => {
        const selected = q.querySelector('input[type="radio"]:checked');
        if (selected) {
            const isCorrect = selected.dataset.correct === 'true';
            if (isCorrect !== null) {
                totalQuestions++;
                if (isCorrect) score++;
            }
            answers.push({
                question: q.querySelector('.question-text').textContent,
                answer: selected.value,
                correct: isCorrect
            });
        }
    });
    
    const totalScore = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 50;
    
    // AI 레벨 추천 요청
    try {
        const response = await fetch(`${API_BASE}/user/recommend-level`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: currentUserId,
                test_results: {
                    questions: answers,
                    total_score: totalScore
                }
            })
        });
        
        const data = await response.json();
        recommendedLevel = data.recommended_level || '초급';
        
        // 레벨 적용
        currentLevel = recommendedLevel;
        document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
        document.querySelector(`[data-level="${recommendedLevel}"]`)?.classList.add('active');
        
        // 성공 메시지 표시
        const modal = document.getElementById('levelTestModal');
        modal.innerHTML = `
            <div class="level-test-content">
                <h2>테스트 완료!</h2>
                <p class="recommendation-message">${currentDisplayName || currentUserId}님에게 적합한 스토리를 추천합니다.</p>
                <p class="recommended-level">추천 레벨: <strong>${recommendedLevel}</strong></p>
                <button class="btn-primary" onclick="closeLevelTestModal()">시작하기</button>
            </div>
        `;
        
        // localStorage에 저장
        localStorage.setItem('level_test_completed', 'true');
        localStorage.setItem('recommended_level', recommendedLevel);
        hasTakenLevelTest = true;
        
        // 동화 목록 다시 로드
        setTimeout(() => {
            closeLevelTestModal();
            loadStories();
        }, 2000);
    } catch (error) {
        console.error('레벨 추천 오류:', error);
        closeLevelTestModal();
        loadStories();
    }
}

// 레벨 테스트 건너뛰기
function skipLevelTest() {
    localStorage.setItem('level_test_completed', 'true');
    closeLevelTestModal();
    loadStories();
}

// 레벨 테스트 모달 닫기
function closeLevelTestModal() {
    const modal = document.getElementById('levelTestModal');
    if (modal) {
        modal.remove();
    }
}

// renderStoryList 함수 (캐러셀 버전 사용)
function renderStoryList() {
    renderStoryCarousel();
}

// ============================================================================
// [3] 동화 선택 및 학습 시작
// ============================================================================

// 승인 상태 확인 함수
async function checkUserApprovalStatus() {
    if (!isAuthenticated || !currentUserId) return null;
    
    try {
        const response = await fetch(`/api/user/approval-status?user_id=${currentUserId}`);
        if (response.ok) {
            const data = await response.json();
            return data;
        }
    } catch (e) {
        console.error('승인 상태 확인 실패:', e);
    }
    return null;
}

// 동화 접근 권한 체크
async function checkStoryAccess(storyId) {
    // 🔑 bunz5911@gmail.com은 모든 동화 무제한 접근
    if (currentUserEmail === 'bunz5911@gmail.com') {
        selectStory(storyId);
        return;
    }
    
    // 시즌 2 (21-50번)
    if (storyId >= 21) {
        showSeason2Modal();
        return;
    }
    
    // 🚧 승인 시스템 체크 (로그인한 사용자만)
    if (isAuthenticated && currentUserId) {
        const approvalStatus = await checkUserApprovalStatus();
        if (approvalStatus && approvalStatus.status !== 'not_found') {
            if (approvalStatus.status === 'pending') {
                showApprovalPendingModal();
                return;
            }
            if (approvalStatus.status === 'rejected') {
                showApprovalRejectedModal();
                return;
            }
            if (approvalStatus.status === 'approved') {
                // 승인된 목록 확인
                const approvedStories = approvalStatus.approved_stories.split(',').map(s => parseInt(s.trim()));
                if (!approvedStories.includes(storyId)) {
                    showNotApprovedModal(approvedStories);
                    return;
                }
                // 승인된 목록에 포함되어 있으면 계속 진행
            }
        }
    }
    
    // 승인 시스템이 비활성화되었거나 승인된 사용자: 0번과 1번 동화는 누구나 접근 가능 (무료 티어)
    if (storyId === 0 || storyId === 1) {
        // 승인 시스템이 활성화되어 있고 로그인하지 않은 경우만 체크
        if (!isAuthenticated) {
            showLoginModal(storyId);
            return;
        }
        selectStory(storyId);
        return;
    }
    
    // 비회원 - 로그인 필요
    if (!isAuthenticated) {
        showLoginModal(storyId);
        return;
    }
    
    // 로그인 상태 - 코인 차감 시스템 (무료 회원만)
    if (currentUserPlan === 'free') {
        // 0-1번: 무료 접근
        if (storyId === 0 || storyId === 1) {
            selectStory(storyId);
            return;
        }
        
        // 31-50번: 접근 제한
        if (storyId >= 31 && storyId <= 50) {
            showAccessRestrictedModal();
            return;
        }
        
        // 2-10번: 20코인 필요
        if (storyId >= 2 && storyId <= 10) {
            await accessStoryWithCoins(storyId, 20);
            return;
        }
        
        // 11-30번: 30코인 필요
        if (storyId >= 11 && storyId <= 30) {
            await accessStoryWithCoins(storyId, 30);
            return;
        }
    } else if (currentUserPlan === 'pro') {
        // Pro 회원: 기존 로직 유지 (0-10번 무료)
        if (storyId <= 10) {
            selectStory(storyId);
        } else {
            showUpgradeModal('premier');
        }
    } else if (currentUserPlan === 'premier') {
        // Premier 회원: 기존 로직 유지 (0-30번 무료)
        if (storyId <= 30) {
            selectStory(storyId);
        } else {
            showSeason2Modal();
        }
    } else {
        // 기본값: Free 플랜으로 처리
        if (storyId === 0 || storyId === 1) {
            selectStory(storyId);
        } else if (storyId >= 31) {
            showAccessRestrictedModal();
        } else {
            await accessStoryWithCoins(storyId, storyId <= 10 ? 20 : 30);
        }
    }
}

// 승인 대기 모달 표시
function showApprovalPendingModal() {
    const modal = document.createElement('div');
    modal.id = 'approvalPendingModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease-out;
    `;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 16px; padding: 32px; max-width: 400px; width: 90%; box-shadow: 0 20px 25px rgba(0,0,0,0.2);">
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="font-size: 64px; margin-bottom: 16px;">⏳</div>
                <h2 style="margin: 0; color: #1f2937; font-size: 24px;">승인 대기 중</h2>
            </div>
            <p style="color: #6b7280; line-height: 1.6; margin-bottom: 24px; text-align: center;">
                관리자 승인을 기다리고 있습니다.<br>
                승인이 완료되면 이메일로 알려드리겠습니다.
            </p>
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                    승인 후에는 다음 동화에 접근하실 수 있습니다:<br>
                    • 목록 0번: 도깨비키친<br>
                    • 목록 1번: 강아지닥스훈트의비밀
                </p>
            </div>
            <button onclick="this.closest('#approvalPendingModal').remove()" 
                    style="width: 100%; padding: 14px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); 
                           color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">
                확인
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// 승인 거부 모달 표시
function showApprovalRejectedModal() {
    const modal = document.createElement('div');
    modal.id = 'approvalRejectedModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease-out;
    `;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 16px; padding: 32px; max-width: 400px; width: 90%; box-shadow: 0 20px 25px rgba(0,0,0,0.2);">
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="font-size: 64px; margin-bottom: 16px;">❌</div>
                <h2 style="margin: 0; color: #1f2937; font-size: 24px;">승인 거부</h2>
            </div>
            <p style="color: #6b7280; line-height: 1.6; margin-bottom: 24px; text-align: center;">
                죄송합니다. 회원가입이 거부되었습니다.<br>
                문의사항이 있으시면 고객센터로 연락해주세요.
            </p>
            <button onclick="this.closest('#approvalRejectedModal').remove()" 
                    style="width: 100%; padding: 14px; background: #ef4444; 
                           color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">
                확인
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// 승인되지 않은 동화 모달 표시
function showNotApprovedModal(approvedStories) {
    const modal = document.createElement('div');
    modal.id = 'notApprovedModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease-out;
    `;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 16px; padding: 32px; max-width: 400px; width: 90%; box-shadow: 0 20px 25px rgba(0,0,0,0.2);">
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="font-size: 64px; margin-bottom: 16px;">🔒</div>
                <h2 style="margin: 0; color: #1f2937; font-size: 24px;">접근 권한 없음</h2>
            </div>
            <p style="color: #6b7280; line-height: 1.6; margin-bottom: 24px; text-align: center;">
                이 동화에 대한 접근 권한이 없습니다.
            </p>
            <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                <p style="margin: 0; color: #065f46; font-size: 14px;">
                    현재 접근 가능한 동화:<br>
                    ${approvedStories.map(id => `• 목록 ${id}번`).join('<br>')}
                </p>
            </div>
            <button onclick="this.closest('#notApprovedModal').remove()" 
                    style="width: 100%; padding: 14px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); 
                           color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">
                확인
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// 로그인 필요 모달 표시
function showLoginModal(storyId) {
    const modal = document.createElement('div');
    modal.id = 'accessModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s;
    `;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 24px; padding: 40px; max-width: 420px; width: 90%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: slideUp 0.3s;">
            <div style="font-size: 64px; margin-bottom: 20px;">🔒</div>
            <h2 style="font-size: 24px; font-weight: 800; color: #333; margin-bottom: 12px;">로그인이 필요합니다</h2>
            <p style="font-size: 15px; color: #666; line-height: 1.6; margin-bottom: 32px;">
                2번째 동화부터는 회원만 이용할 수 있습니다.<br>
                <strong style="color: #667eea;">가입하고 10코인을 받으세요!</strong>
            </p>
            
            <div style="display: flex; gap: 12px; margin-bottom: 16px;">
                <button onclick="location.href='signup.html'" style="flex: 1; padding: 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                    회원가입
                </button>
                <button onclick="location.href='login.html'" style="flex: 1; padding: 16px; background: white; color: #667eea; border: 2px solid #667eea; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer;">
                    로그인
                </button>
            </div>
            
            <button onclick="closeAccessModal()" style="width: 100%; padding: 12px; background: #f0f0f0; color: #666; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer;">
                취소
            </button>
        </div>
    `;
    
    // CSS 애니메이션 추가
    if (!document.getElementById('modalAnimationStyles')) {
        const style = document.createElement('style');
        style.id = 'modalAnimationStyles';
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from { transform: translateY(30px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(modal);
}

// 업그레이드 필요 모달 표시 (Free → Pro, Pro → Premier)
function showUpgradeModal(requiredPlan) {
    const planInfo = {
        pro: {
            name: 'Pro',
            price: '', // 가격 정보 숨김
            coins: '100코인',
            stories: '1-10번 동화'
        },
        premier: {
            name: 'Premier',
            price: '', // 가격 정보 숨김
            coins: '300코인',
            stories: '1-20번 동화'
        }
    };
    
    const info = planInfo[requiredPlan];
    
    const modal = document.createElement('div');
    modal.id = 'accessModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s;
    `;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 24px; padding: 40px; max-width: 420px; width: 90%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: slideUp 0.3s;">
            <div style="font-size: 64px; margin-bottom: 20px;">⬆️</div>
            <h2 style="font-size: 24px; font-weight: 800; color: #333; margin-bottom: 12px;">${info.name} 플랜이 필요합니다</h2>
            <p style="font-size: 15px; color: #666; line-height: 1.6; margin-bottom: 24px;">
                이 동화는 ${info.name} 플랜에서 이용할 수 있습니다.
            </p>
            
            <div style="background: #f8f9fa; border-radius: 16px; padding: 20px; margin-bottom: 24px; text-align: left;">
                <h3 style="font-size: 16px; font-weight: 700; color: #333; margin-bottom: 12px;">${info.name} 혜택</h3>
                <ul style="list-style: none; padding: 0;">
                    <li style="font-size: 14px; color: #666; margin-bottom: 8px;">✓ ${info.coins} 지급</li>
                    <li style="font-size: 14px; color: #666; margin-bottom: 8px;">✓ ${info.stories} 학습</li>
                    <li style="font-size: 14px; color: #666; margin-bottom: 8px;">✓ K-콘텐츠 무제한</li>
                </ul>
            </div>
            
            <button onclick="location.href='pricing.html'" style="width: 100%; padding: 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); margin-bottom: 12px;">
                ${info.name} 시작하기${info.price ? ` (${info.price})` : ''}
            </button>
            
            <button onclick="closeAccessModal()" style="width: 100%; padding: 12px; background: #f0f0f0; color: #666; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer;">
                취소
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// 시즌 2 Coming Soon 모달
function showSeason2Modal() {
    const modal = document.createElement('div');
    modal.id = 'accessModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s;
    `;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 24px; padding: 40px; max-width: 480px; width: 90%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: slideUp 0.3s;">
            <div style="font-size: 64px; margin-bottom: 20px;">🎬</div>
            <h2 style="font-size: 28px; font-weight: 800; color: #333; margin-bottom: 12px;">Season 2 Coming Soon!</h2>
            <p style="font-size: 15px; color: #666; line-height: 1.8; margin-bottom: 28px;">
                K-드라마 & K-POP 더빙 챌린지가 포함된<br>
                시즌 2가 <strong style="color: #667eea;">2026년 2월</strong>에 찾아옵니다!
            </p>
            
            <div style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); color: white; padding: 20px; border-radius: 16px; margin-bottom: 24px; display: none;">
                <h3 style="font-size: 20px; font-weight: 800; margin-bottom: 8px;">🐦 Early Bird 특별가</h3>
                <div style="font-size: 32px; font-weight: 800; margin-bottom: 8px;">$299.99/년</div>
                <p style="font-size: 13px; opacity: 0.95;">정가 $359.88 대비 17% 할인</p>
            </div>
            
            <button onclick="location.href='pricing.html'" style="width: 100%; padding: 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); margin-bottom: 12px;">
                자세히 보기
            </button>
            
            <button onclick="closeAccessModal()" style="width: 100%; padding: 12px; background: #f0f0f0; color: #666; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer;">
                닫기
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// 접근 모달 닫기
function closeAccessModal() {
    const modal = document.getElementById('accessModal');
    if (modal) {
        modal.remove();
    }
}

// 이전 호환성
function closeLoginModal() {
    closeAccessModal();
}

async function selectStory(storyId) {
    console.log(`📖 동화 선택: ID=${storyId}`);
    
    // ✅ 접근 권한 체크 (안전장치) - 0번과 1번은 무료 티어로 접근 가능
    if (storyId > 1 && !isAuthenticated) {
        showLoginModal(storyId);
        return;
    }
    
    // ✅ 동화 접근 시 즉시 학습 기록 저장 (로그인한 경우)
    // PRELOADED_STORIES에서 바로 가져와서 기록 저장 (API 호출 없이 빠르게)
    if (isAuthenticated && currentUserId && currentUserId !== '00000000-0000-0000-0000-000000000001') {
        const storyData = PRELOADED_STORIES.find(s => s.id === storyId);
        if (storyData) {
            // 학습 기록 저장 (비동기, 블로킹하지 않음)
            recordStudySession({
                story_id: storyId,
                story_title: storyData.title,
                session_type: 'reading'
            }).catch(err => console.warn('학습 기록 저장 실패:', err));
        }
    }
    
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
        
        // ✅ 타임아웃 설정 (15초로 최적화 - 빠른 실패)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.error('⏱️ 동화 로드 타임아웃 (15초 초과)');
            controller.abort();
        }, 15000); // 60초 → 15초로 단축
        
        const storyResponse = await fetch(`${API_BASE}/story/${storyId}`, {
            signal: controller.signal,
            headers: {
                'Cache-Control': 'no-cache'
            }
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

        // ✅ 성능 최적화: 하드코딩 데이터나 캐시가 있으면 즉시 표시
        console.log(`🔍 분석 시작 (최적화 모드)...`);
        
        // 분석 데이터가 아직 로드 중일 수 있으므로 잠시 대기 (최대 1초)
        let analysisDataReady = Object.keys(PRECOMPUTED_ANALYSIS).length > 0;
        if (!analysisDataReady) {
            // 분석 데이터 로드 대기 (최대 1초)
            const waitStart = Date.now();
            while (!analysisDataReady && (Date.now() - waitStart) < 1000) {
                await new Promise(resolve => setTimeout(resolve, 50));
                analysisDataReady = Object.keys(PRECOMPUTED_ANALYSIS).length > 0;
            }
        }
        
        // 하드코딩 데이터 또는 캐시 확인 (동기적으로 빠르게)
        const originalTitle = currentStory.title;
        let internalKey = originalTitle.replace(/\s+/g, '');
        if (storyId === 0 && internalKey.endsWith('의비밀')) {
            internalKey = internalKey.replace('의비밀', '');
        }
        
        const matchedData = PRECOMPUTED_ANALYSIS[internalKey];
        const cacheKey = `analysis_${storyId}_${currentLevel}`;
        const cachedAnalysis = localStorage.getItem(cacheKey);
        
        // 즉시 사용 가능한 데이터가 있으면 바로 표시
        if (matchedData && matchedData[currentLevel]) {
            console.log(`⚡ 하드코딩 데이터 즉시 사용: ${internalKey} - ${currentLevel}`);
            currentAnalysis = JSON.parse(JSON.stringify(matchedData[currentLevel]));
            currentAnalysis.story_id = storyId;
            currentAnalysis.title = currentStory.title;
            currentAnalysis.level = currentLevel;
            
            // 즉시 요약 탭 표시
            const tabToRender = currentTab || 'summary';
            await switchTab(tabToRender);
            return;
        } else if (cachedAnalysis) {
            try {
                console.log(`⚡ 캐시 데이터 즉시 사용`);
                currentAnalysis = JSON.parse(cachedAnalysis);
                const tabToRender = currentTab || 'summary';
                await switchTab(tabToRender);
                return;
            } catch (e) {
                console.log('⚠️ 캐시 파싱 오류, 새로 분석합니다.');
                localStorage.removeItem(cacheKey);
            }
        }
        
        // 캐시가 없으면 분석 시작 (백그라운드, 사용자는 로딩 화면 보지 않음)
        analyzeStory(storyId).catch(error => {
            console.error('❌ 분석 오류:', error);
        });

    } catch (error) {
        console.error('❌ 동화 로드 오류:', error);
        
        let isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        let errorMsg = error.message;
        let detailMsg = '';
        
        if (error.name === 'AbortError') {
            errorMsg = '⏱️ 동화 로드 시간이 초과되었습니다 (15초).';
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

async function analyzeStory(storyId, skipRender = false) {
    const contentEl = document.getElementById('learningContent');
    
    // ✅ 핵심: 서버에서 받은 제목의 모든 공백 제거 (내부 키와 100% 일치시키기)
    const originalTitle = currentStory.title;  // 화면 표시용 (원본)
    let internalKey = originalTitle.replace(/\s+/g, '');  // 내부 매칭용 (공백 완전 제거)
    
    // 0번 동화는 "의비밀" 제거 (이미 "도깨비키친"으로만 표시됨)
    if (storyId === 0 && internalKey.endsWith('의비밀')) {
        internalKey = internalKey.replace('의비밀', '');
    }
    
    console.log('🔍 하드코딩 데이터 확인:', {
        storyId: storyId,
        originalTitle: originalTitle,
        internalKey: internalKey,
        currentLevel: currentLevel,
        precomputedKeysCount: Object.keys(PRECOMPUTED_ANALYSIS).length
    });
    
    // ✅ 공백 제거한 키로 직접 매칭 (100% 일치 보장)
    let matchedData = PRECOMPUTED_ANALYSIS[internalKey];
    
    if (!matchedData) {
        console.error('❌ 매칭 실패!');
        console.error('찾는 키 (공백 제거):', internalKey);
        console.error('원본 제목:', originalTitle);
        console.error('전체 키 개수:', Object.keys(PRECOMPUTED_ANALYSIS).length);
        console.error('첫 5개 키:', Object.keys(PRECOMPUTED_ANALYSIS).slice(0, 5));
    } else {
        console.log('✅ 직접 매칭 성공! (공백 제거 방식)');
    }
    
    // ✅ matchedData 사용 (이미 찾은 데이터)
    if (matchedData && matchedData[currentLevel]) {
        console.log(`✅ 하드코딩 데이터 사용: ${internalKey} - ${currentLevel} (즉시 로드)`);
        console.log(`🔍 레벨별 데이터 확인:`, {
            사용중인레벨: currentLevel,
            사용가능한레벨: Object.keys(matchedData),
            문단수: matchedData[currentLevel]?.paragraphs_analysis?.length || 0,
            첫문단샘플: matchedData[currentLevel]?.paragraphs_analysis?.[0]?.original_text?.substring(0, 50) || '없음'
        });
        
        // ✅ 레벨별 데이터 복사 (원본 데이터 보호)
        currentAnalysis = JSON.parse(JSON.stringify(matchedData[currentLevel]));
        currentAnalysis.story_id = storyId;
        currentAnalysis.title = currentStory.title;  // 화면 표시용은 원본 제목 사용
        currentAnalysis.level = currentLevel;
        
        console.log(`✅ currentAnalysis 업데이트 완료:`, {
            level: currentAnalysis.level,
            문단수: currentAnalysis.paragraphs_analysis?.length || 0,
            실생활활용수: currentAnalysis.real_life_usage?.length || 0,
            어휘수: currentAnalysis.vocabulary?.length || 0
        });
        
        // ✅ skipRender가 false일 때만 렌더링 (레벨 변경 시에는 호출부에서 렌더링)
        if (!skipRender) {
            const tabToRender = currentTab || 'summary';
            console.log(`🔄 탭 렌더링 시작: ${tabToRender} (레벨: ${currentLevel})`);
            await switchTab(tabToRender);
        } else {
            console.log(`⏭️ 렌더링 건너뜀 (호출부에서 처리) - currentAnalysis.level=${currentAnalysis.level}, currentLevel=${currentLevel}`);
        }
        return;
    } else {
        console.error(`❌ 레벨별 데이터 없음:`, {
            matchedData존재: !!matchedData,
            사용중인레벨: currentLevel,
            사용가능한레벨: matchedData ? Object.keys(matchedData) : 'matchedData 없음'
        });
    }
    
    console.log('⚠️ 하드코딩 데이터 없음, API 호출 필요');
    
    // ✅ 2순위: LocalStorage 캐시 확인
    const cacheKey = `analysis_${storyId}_${currentLevel}`;
    const cachedAnalysis = localStorage.getItem(cacheKey);
    
    if (cachedAnalysis) {
        try {
            currentAnalysis = JSON.parse(cachedAnalysis);
            console.log('✅ LocalStorage 캐시 로드 (즉시 표시)');
            
            // ✅ skipRender가 false일 때만 렌더링 (레벨 변경 시에는 호출부에서 렌더링)
            if (!skipRender) {
                const tabToRender = currentTab || 'summary';
                await switchTab(tabToRender);
            }
            return;
        } catch (e) {
            console.log('⚠️ 캐시 파싱 오류, 새로 분석합니다.');
            localStorage.removeItem(cacheKey);
        }
    }
    
    // ✅ 캐시가 없으면 요약 탭을 먼저 표시하고 백그라운드에서 분석 진행
    console.log('📊 AI 분석 시작 (캐시 없음, 백그라운드 처리)');
    
    // 요약 탭을 먼저 표시 (임시 데이터로)
    if (!skipRender) {
        const tabToRender = currentTab || 'summary';
        // 임시 분석 데이터로 요약 탭 표시 (사용자는 즉시 화면을 볼 수 있음)
        currentAnalysis = {
            story_id: storyId,
            title: currentStory.title,
            level: currentLevel,
            summary: 'AI가 동화를 분석하는 중입니다. 잠시만 기다려주세요...',
            paragraphs_analysis: [],
            real_life_usage: [],
            vocabulary: []
        };
        await switchTab(tabToRender);
    }

    try {
        console.log(`📡 백엔드 API 호출 시작: /story/${storyId}/analyze`);
        console.log(`🌐 API_BASE: ${API_BASE}`);
        
        // ✅ 타임아웃 설정 (30초로 최적화 - 빠른 실패 및 재시도)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 120초 → 30초로 단축
        
        const response = await fetch(`${API_BASE}/story/${storyId}/analyze`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            },
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
        
        // ✅ skipRender가 false일 때만 렌더링 (레벨 변경 시에는 호출부에서 렌더링)
        // 분석이 완료되면 현재 탭을 자동으로 업데이트 (사용자는 즉시 업데이트된 내용을 볼 수 있음)
        if (!skipRender) {
            const tabToRender = currentTab || 'summary';
            console.log(`🔄 분석 완료, 탭 자동 업데이트: ${tabToRender}`);
            await switchTab(tabToRender);
        }
        
    } catch (error) {
        console.error('❌ 분석 오류:', error);
        
        let errorMessage = error.message;
        let suggestion = '';
        let isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        // 에러 타입별 상세 안내
        if (error.name === 'AbortError') {
            errorMessage = '⏱️ 요청 시간이 초과되었습니다 (30초).';
            suggestion = `
                <strong>가능한 원인:</strong><br>
                1. 서버가 응답하지 않음<br>
                2. Gemini API 응답이 너무 느림<br>
                3. 네트워크 속도 문제<br>
                <br>
                <strong>해결 방법:</strong><br>
                • 잠시 후 다시 시도<br>
                • 서버 상태 확인<br>
                • 하드코딩 데이터가 있으면 즉시 표시됩니다
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
async function switchTab(tabName) {
    console.log(`🔄 switchTab 호출: ${tabName} (현재 레벨: ${currentLevel}, 분석 레벨: ${currentAnalysis?.level})`);
    
    currentTab = tabName;
    
    // 완료한 탭 추적
    completedTabs.add(tabName);
    
    // 탭 버튼 활성화
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // 콘텐츠 렌더링
    const contentEl = document.getElementById('learningContent');
    
    // ✅ currentAnalysis가 없을 때만 로딩 표시 (즉시 렌더링 우선)
    if (!currentAnalysis) {
        contentEl.innerHTML = `<div class="loading"><img src="img/loading.png" alt="Loading" class="loading-image"><p>${t('messages.analyzing')}</p></div>`;
        return;
    }

    // ✅ 레벨 불일치 체크 (렌더링 전에 확인)
    if (currentAnalysis.level !== currentLevel) {
        console.error(`⚠️ switchTab에서 레벨 불일치 감지! currentAnalysis.level=${currentAnalysis.level}, currentLevel=${currentLevel}`);
        console.error(`⚠️ 분석 데이터를 다시 로드합니다...`);
        // 분석 데이터 다시 로드
        await analyzeStory(currentStory.id, true);
        // 다시 렌더링
        await switchTab(tabName);
        return;
    }

    // ✅ 즉시 렌더링 (로딩 없음)
    console.log(`🎨 탭 렌더링 시작: ${tabName} (레벨: ${currentLevel})`);
    switch(tabName) {
        case 'summary':
            await renderSummary();
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
    console.log(`✅ 탭 렌더링 완료: ${tabName}`);
}

// ============================================================================
// [5] 각 탭 렌더링
// ============================================================================
async function renderSummary() {
    console.log('📄 요약 렌더링 시작 (즉시 표시)');
    const contentEl = document.getElementById('learningContent');
    
    // ✅ 다국어 요약 지원: summary가 객체면 현재 언어 선택, 문자열이면 그대로 사용 (하위 호환)
    let summaryText = '';
    if (currentAnalysis.summary) {
        if (typeof currentAnalysis.summary === 'object' && currentAnalysis.summary !== null) {
            // 다국어 요약 객체인 경우
            summaryText = currentAnalysis.summary[currentLanguage] || currentAnalysis.summary['ko'] || t('messages.noSummary');
        } else {
            // 기존 문자열 형식인 경우 (하위 호환)
            summaryText = currentAnalysis.summary;
        }
    } else {
        summaryText = t('messages.noSummary');
    }
    
    // ✅ 음성 재생 버튼 제거 (텍스트만 표시)
    contentEl.innerHTML = `
        <div class="section-title">${t('tabs.summary')}</div>
        
        <!-- ✅ 요약 이미지 (다른 탭과 동일한 스타일 적용) -->
        ${renderCharacterImage('summary')}
        
        <div class="content-box">
            ${summaryText}
        </div>
        
        <!-- 맥락 파악하기 버튼 -->
        <div style="margin-top: 20px;">
            <button class="btn btn-primary" onclick="showContextNotesModal()" style="width: 100%; padding: 16px; font-size: 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; color: white; border-radius: 12px; font-weight: 700; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3); cursor: pointer;">
                📝 맥락 파악하기
            </button>
            <p style="text-align: center; font-size: 13px; color: #888; margin-top: 8px;">
                이야기의 맥락을 파악하고 기록해보세요!
            </p>
        </div>
        
        <!-- 내가 추가한 K-콘텐츠 미리보기 -->
        <div id="kContentPreview" style="margin-top: 25px;">
            <div style="text-align: center; color: #999; padding: 20px;">
                로딩 중...
            </div>
        </div>
        
        <div class="bottom-spacer"></div>
    `;
    
    console.log('✅ 요약 렌더링 완료 (텍스트만, 음성 버튼 없음)');
    
    // 맥락 파악 미리보기 백그라운드 로드 (블로킹하지 않음)
    // 요약 텍스트는 즉시 표시되고, 미리보기는 나중에 로드됨
    loadContextNotesPreview().catch(error => {
        console.warn('⚠️ 맥락 파악 미리보기 로드 실패:', error);
        const previewEl = document.getElementById('kContentPreview');
        if (previewEl) {
            previewEl.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">로드 실패</div>';
        }
    });
}

async function loadKContentPreview() {
    const previewEl = document.getElementById('kContentPreview');
    if (!previewEl) return;
    
    try {
        const response = await fetch(`${API_BASE}/k-content/my-collection?user_id=${currentUserId}`);
        const data = await response.json();
        
        const collection = data.collection || [];
        
        if (collection.length === 0) {
            previewEl.innerHTML = '';
            return;
        }
        
        // 최근 3개만 표시
        const recentItems = collection.slice(0, 3);
        
        const typeIcons = {
            'drama': '📺',
            'kpop': '🎵',
            'variety': '🎬',
            'movie': '🎥',
            'other': '📝'
        };
        
        previewEl.innerHTML = `
            <div style="border-top: 2px solid #f0f0f0; padding-top: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3 style="font-size: 16px; font-weight: 700; color: #333;">
                        내가 추가한 K-콘텐츠 <span style="background: #667eea; color: white; padding: 2px 8px; border-radius: 10px; font-size: 12px; margin-left: 6px;">${collection.length}개</span>
                    </h3>
                    <a href="my-k-content.html" style="font-size: 13px; color: #667eea; text-decoration: none; font-weight: 600;">
                        전체 보기 →
                    </a>
                </div>
                
                ${recentItems.map(item => `
                    <div class="content-box" style="padding: 15px; margin-bottom: 12px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-left: 4px solid #667eea;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                            <div style="flex: 1;">
                                <div style="font-size: 12px; color: #888; margin-bottom: 4px;">
                                    ${typeIcons[item.content_type] || '📝'} ${item.source_title || 'K-콘텐츠'}
                                </div>
                                <div style="font-size: 15px; color: #333; line-height: 1.6; font-weight: 500;">
                                    "${item.content_text.length > 50 ? item.content_text.substring(0, 50) + '...' : item.content_text}"
                                </div>
                            </div>
                        </div>
                        <div style="display: flex; gap: 8px; margin-top: 12px;">
                            <button onclick="togglePlay('kcontent_${item.id}', '${escapeQuotes(item.content_text)}', this)" style="flex: 1; padding: 8px 12px; background: #667eea; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;">
                                ▶ 듣기
                            </button>
                            <button onclick="startKContentPractice('${escapeQuotes(item.content_text)}')" style="flex: 1; padding: 8px 12px; background: #27ae60; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;">
                                🎤 연습
                            </button>
                        </div>
                    </div>
                `).join('')}
                
                <button onclick="location.href='my-k-content.html'" style="width: 100%; padding: 12px; background: white; border: 2px solid #667eea; color: #667eea; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 14px; margin-top: 8px;">
                    📚 전체 컬렉션 보기 (${collection.length}개)
                </button>
            </div>
        `;
        
    } catch (error) {
        console.error('K-콘텐츠 미리보기 로드 실패:', error);
        previewEl.innerHTML = '';
    }
}

function renderFullStory() {
    const contentEl = document.getElementById('learningContent');
    const fullText = currentStory.full_text || '';
    const storyId = currentStory.id;
    
    console.log('📖 전체 이야기 렌더링:', {
        storyId: storyId,
        textLength: fullText.length,
        audioPath: `audio/full-stories/story-${storyId}.mp3`
    });
    
    // 텍스트를 문단 단위로 분할 (오디오 파일 생성 시 사용된 방식과 일치: \n\n로 분할)
    // 오디오 파일은 generate_story_0_audio.py에서 '\n\n'로 문단을 구분하므로 동일하게 처리
    const paragraphs = fullText.split('\n\n').filter(p => p.trim().length > 0);
    
    // 문단별 HTML 생성 (하이라이트용 ID 포함)
    const paragraphsHTML = paragraphs.map((para, index) => {
        const paraId = `full-story-para-${index}`;
        return `<div id="${paraId}" class="full-story-paragraph" style="font-size: 18px; font-weight: 700; line-height: 1.9; color: #1a1a1a; text-align: justify; padding: 12px; margin-bottom: 8px; border-radius: 8px; transition: all 0.3s ease;">
            ${para.trim()}
        </div>`;
    }).join('');
    
    contentEl.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <div class="section-title" style="margin-bottom: 0;">${t('tabs.fullStory')}</div>
            <button class="play-btn-circle" id="fullStoryPlayBtn" onclick="playFullStoryAudio(${storyId}, this)">
                ▶
            </button>
        </div>
        ${renderCharacterImage('full-story')}
        
        <!-- ✅ 사용자가 직접 읽어야 하는 부분 - 박스로 강조 (light green 배경) -->
        <div id="fullStoryTextContainer" style="border: 3px solid #4caf50; border-radius: 12px; padding: 24px; margin-bottom: 24px; background: #c8e6c9; box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);">
            <div style="font-size: 14px; color: #2e7d32; font-weight: 700; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;">
                📖 직접 읽어보세요
            </div>
            ${paragraphsHTML}
        </div>
        
        <!-- ✅ 학습 활동 섹션 -->
        <div style="margin-top: 32px;">
            <div style="font-size: 20px; font-weight: 700; color: #333; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #667eea;">
                📚 학습 활동
            </div>
            
            <!-- 가. 가장 중요한 단어 기록 -->
            <div style="background: #fff; border: 2px solid #667eea; border-radius: 10px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="font-size: 16px; font-weight: 700; color: #667eea; margin-bottom: 12px;">
                    가. 가장 중요한 단어를 기록해주세요
                </div>
                <textarea 
                    id="importantWordsInput" 
                    placeholder="이야기에서 가장 중요하다고 생각하는 단어들을 입력해주세요..."
                    style="width: 100%; min-height: 80px; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 15px; font-family: inherit; resize: vertical; box-sizing: border-box;"
                ></textarea>
            </div>
            
            <!-- 나. 이야기의 의미 기록 -->
            <div style="background: #fff; border: 2px solid #667eea; border-radius: 10px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="font-size: 16px; font-weight: 700; color: #667eea; margin-bottom: 12px;">
                    나. 이 이야기는 무엇을 말하려고 하는지를 기록해주세요
                </div>
                <textarea 
                    id="storyMeaningInput" 
                    placeholder="이야기가 전달하려는 메시지나 의미를 자유롭게 작성해주세요..."
                    style="width: 100%; min-height: 120px; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 15px; font-family: inherit; resize: vertical; box-sizing: border-box;"
                ></textarea>
            </div>
            
            <!-- 다. 소리내어 말해서 AI 평가 받기 -->
            <div style="background: #fff; border: 2px solid #667eea; border-radius: 10px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="font-size: 16px; font-weight: 700; color: #667eea; margin-bottom: 12px;">
                    다. 위 내용을 소리내어 말해서 AI의 평가를 받아주세요
                </div>
                <div style="background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                    <div style="font-size: 14px; color: #666; margin-bottom: 8px;">
                        💡 읽어볼 내용:
                    </div>
                    <div style="font-size: 16px; font-weight: 600; color: #333; line-height: 1.6;">
                        ${fullText.length > 200 ? fullText.substring(0, 200) + '...' : fullText}
                    </div>
                </div>
                <div class="control-buttons" id="fullStoryRecordingButtons">
                    <button class="btn" onclick="startFullStoryRecording(${storyId}, '${escapeQuotes(fullText)}')" style="background: #667eea; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">
                        🎤 소리내어 읽기 시작
                    </button>
                </div>
                <!-- 녹음 상태 표시 -->
                <div class="recording-indicator" id="fullStoryRecordingIndicator" style="display: none;">
                    <div class="recording-text">${t('messages.recording')}</div>
                </div>
                <!-- 평가 결과 표시 영역 -->
                <div id="fullStoryEvaluationResult" style="margin-top: 16px; display: none;"></div>
            </div>
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
    
    // ✅ 레벨 불일치 체크 및 경고
    if (currentAnalysis && currentAnalysis.level !== currentLevel) {
        console.error(`⚠️ 레벨 불일치 감지! currentAnalysis.level: ${currentAnalysis.level}, currentLevel: ${currentLevel}`);
        console.error(`⚠️ 분석 데이터를 다시 로드합니다...`);
        // 분석 데이터 다시 로드
        analyzeStory(currentStory.id, true).then(() => {
            switchTab('paragraphs');
        });
        return;
    }
    
    const paragraphs = currentAnalysis.paragraphs_analysis || [];
    
    console.log('📝 문단별 학습 렌더링:', {
        storyId: currentStory?.id,
        title: currentStory?.title,
        현재레벨: currentLevel,
        분석데이터레벨: currentAnalysis?.level,
        레벨일치: currentAnalysis?.level === currentLevel,
        문단수: paragraphs.length,
        모든문단번호: paragraphs.map(p => p.paragraph_num || '없음'),
        첫문단원문: paragraphs[0]?.original_text?.substring(0, 50) || '없음',
        첫문단연습텍스트: paragraphs[0]?.practice_text?.substring(0, 80) || '없음',
        첫문단쉬운표현: paragraphs[0]?.simplified_text?.substring(0, 50) || '없음',
        '첫문단전체데이터': paragraphs[0] ? Object.keys(paragraphs[0]) : '없음'
    });
    
    // ✅ 문단 수 확인 및 경고
    if (paragraphs.length === 1) {
        console.warn('⚠️ 경고: 문단이 1개만 있습니다! 데이터를 확인해주세요.');
        console.warn('⚠️ 현재 레벨:', currentLevel);
        console.warn('⚠️ 현재 동화:', currentStory?.title);
    }
    
    if (paragraphs.length === 0) {
        contentEl.innerHTML = `<div class="content-box">${t('messages.noParagraphs')}</div>`;
        return;
    }

    contentEl.innerHTML = `
        <div class="section-title">${t('tabs.paragraphs')} + ${t('tabs.quiz')} (${translateLevel(currentLevel)})</div>
        ${renderCharacterImage('paragraphs')}
        <div class="content-box" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; margin-bottom: 20px;">
            <strong>🎤 ${translateLevel(currentLevel)}${t('descriptions.levelDescription')}</strong><br>
            <small style="opacity: 0.9; margin-top: 8px; display: block;">
                📗 ${t('levels.beginner')}: ${t('descriptions.beginner')} | 📘 ${t('levels.intermediate')}: ${t('descriptions.intermediate')} | 📕 ${t('levels.advanced')}: ${t('descriptions.advanced')}
            </small>
        </div>
        ${paragraphs.map((p, idx) => {
            // ✅ 연습용 텍스트: AI가 레벨별로 선택한 텍스트 (없으면 첫 문장 추출)
            // 영어 번역 지원: 현재 언어가 영어면 영어 번역 사용, 아니면 한국어 사용
            const practiceText = (currentLanguage === 'en' && p.practice_text_en) 
                ? p.practice_text_en 
                : (p.practice_text || extractFirstSentence(p.original_text || ''));
            const fullText = p.original_text || '';
            const simplifiedText = (currentLanguage === 'en' && p.simplified_text_en) 
                ? p.simplified_text_en 
                : (p.simplified_text || '');
            const explanationText = (currentLanguage === 'en' && p.explanation_en) 
                ? p.explanation_en 
                : (p.explanation || '');
            
            return `
            <div class="paragraph-item" id="paragraph${idx}">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                    <span class="paragraph-num">${t('descriptions.paragraph')} ${p.paragraph_num || idx + 1}</span>
                    <button class="play-btn-circle" id="paraPlayBtn${idx}" onclick="togglePlay('para${idx}', '${escapeQuotes(practiceText)}', this)">
                        ▶
                    </button>
                </div>
                
                <!-- ✅ 레벨별 연습 문장 (AI가 선택한 적절한 길이) - 박스로 강조 (light green 배경) -->
                <div style="border: 3px solid #4caf50; border-radius: 12px; padding: 20px; margin-bottom: 16px; background: #c8e6c9; box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <div style="font-size: 14px; color: #2e7d32; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">📖 직접 읽어보세요</div>
                        <div style="display: flex; gap: 4px;">
                            <button onclick="adjustParagraphDifficulty(${idx}, 'easier')" style="background: #84fab0; color: white; border: none; padding: 4px 8px; border-radius: 12px; font-size: 11px; cursor: pointer;" title="${t('difficulty.easier')}">⬇️</button>
                            <button onclick="adjustParagraphDifficulty(${idx}, 'harder')" style="background: #fa709a; color: white; border: none; padding: 4px 8px; border-radius: 12px; font-size: 11px; cursor: pointer;" title="${t('difficulty.harder')}">⬆️</button>
                            <button onclick="adjustParagraphDifficulty(${idx}, 'realistic')" style="background: #667eea; color: white; border: none; padding: 4px 8px; border-radius: 12px; font-size: 11px; cursor: pointer;" title="${t('difficulty.realistic')}">💬</button>
                        </div>
                    </div>
                    <div style="font-size: 19px; font-weight: 700; line-height: 1.9; color: #1a1a1a; text-align: justify;" id="practiceText${idx}">
                        ${practiceText}
                    </div>
                </div>
                
                <details style="margin-bottom: 12px;">
                    <summary style="cursor: pointer; color: #667eea; font-weight: 600;">${t('descriptions.fullText')}</summary>
                    <div style="margin-top: 12px; padding: 12px; background: #f5f5f5; border-radius: 8px;" id="originalText${idx}">
                        ${fullText}
                    </div>
                </details>
                
                <div style="font-weight: 600; color: #667eea;">${t('descriptions.easyExpression')}</div>
                <div style="margin-bottom: 12px;">${simplifiedText}</div>
                <div style="font-weight: 600; color: #764ba2;">${t('descriptions.explanation')}</div>
                <div style="margin-bottom: 16px;">${explanationText}</div>
                
                <!-- ✅ 읽기 평가 버튼 -->
                <div class="control-buttons" id="recordingButtons${idx}">
                    <button class="btn" onclick="startParagraphRecording(${idx}, ${p.paragraph_num || idx + 1}, '${escapeQuotes(practiceText)}')">
                        🎤 ${t('buttons.record')}
                    </button>
                </div>
                
                <!-- 녹음 상태 표시 -->
                <div class="recording-indicator" id="recordingIndicator${idx}">
                    <div class="recording-text">${t('messages.recording')}</div>
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
    
    // ✅ 필수 체크: currentAnalysis가 없으면 에러
    if (!currentAnalysis) {
        console.error('❌ renderRealLife: currentAnalysis가 없습니다!');
        contentEl.innerHTML = '<div class="content-box">데이터를 불러오는 중...</div>';
        return;
    }
    
    // ✅ 레벨 불일치 체크 및 경고
    if (currentAnalysis.level !== currentLevel) {
        console.error(`⚠️ 레벨 불일치 감지! currentAnalysis.level: ${currentAnalysis.level}, currentLevel: ${currentLevel}`);
        console.error(`⚠️ 분석 데이터를 다시 로드합니다...`);
        analyzeStory(currentStory.id, true).then(() => {
            switchTab('real-life');
        });
        return;
    }
    
    const examples = currentAnalysis.real_life_usage || [];
    
    console.log('💬💬💬 실생활 활용 렌더링 시작:', {
        현재레벨: currentLevel,
        분석데이터레벨: currentAnalysis?.level,
        예문수: examples.length,
        첫예문전체: examples[0] || '없음',
        모든예문: examples.slice(0, 5)
    });
    
    // ✅ 예문이 없으면 에러
    if (examples.length === 0) {
        console.error('❌ 실생활 활용 예문이 없습니다!');
        contentEl.innerHTML = '<div class="content-box">예문 데이터가 없습니다.</div>';
        return;
    }
    
    contentEl.innerHTML = `
        <div class="section-title">${t('tabs.realLife')} (${translateLevel(currentLevel)})</div>
        ${renderCharacterImage('real-life')}
        <div class="content-box" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); color: #2d3436;">
            <strong>${t('descriptions.realLifeUsage')}</strong>
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
    
    // ✅ 레벨 불일치 체크 및 경고
    if (currentAnalysis && currentAnalysis.level !== currentLevel) {
        console.error(`⚠️ 레벨 불일치 감지! currentAnalysis.level: ${currentAnalysis.level}, currentLevel: ${currentLevel}`);
        console.error(`⚠️ 분석 데이터를 다시 로드합니다...`);
        analyzeStory(currentStory.id, true).then(() => {
            switchTab('vocabulary');
        });
        return;
    }
    
    const vocabulary = currentAnalysis.vocabulary || [];
    const grammar = currentAnalysis.grammar || [];
    
    console.log('📚 어휘/문법 렌더링:', {
        현재레벨: currentLevel,
        분석데이터레벨: currentAnalysis?.level,
        어휘수: vocabulary.length,
        문법수: grammar.length,
        첫어휘: vocabulary[0]?.word || '없음',
        모든어휘: vocabulary.slice(0, 3).map(v => v.word)
    });
    
    contentEl.innerHTML = `
        <div class="section-title">${t('tabs.vocabulary')}</div>
        ${renderCharacterImage('vocabulary')}
        <div class="section-title" style="font-size: 18px; margin-top: 16px;">${t('descriptions.vocabulary')}</div>
        ${vocabulary.map((v, idx) => `
            <div class="vocabulary-item">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <div class="vocab-word">${v.word}</div>
                    <button class="play-btn-circle" onclick="togglePlay('vocab${idx}', '${escapeQuotes(v.word)}', this)">
                        ▶
                    </button>
                </div>
                <div class="vocab-meaning">${v.meaning}</div>
                <div class="vocab-example">${t('descriptions.example')} ${v.example}</div>
            </div>
        `).join('')}

        ${grammar.length > 0 ? `
            <div class="section-title" style="font-size: 18px; margin-top: 32px;">${t('descriptions.grammar')}</div>
            ${grammar.map((g, idx) => `
                <div class="grammar-item">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <div class="vocab-word">${g.pattern}</div>
                        <button class="play-btn-circle" onclick="togglePlay('grammar${idx}', '${escapeQuotes(g.example)}', this)">
                            ▶
                        </button>
                    </div>
                    <div class="vocab-meaning">${g.explanation}</div>
                    <div class="vocab-example">${t('descriptions.example')} ${g.example}</div>
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
        <div class="section-title">${t('tabs.wordbook')}</div>
        ${renderCharacterImage('wordbook')}
        <div class="content-box" style="background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%); color: #2d3436;">
            <strong>${t('descriptions.wordbookDescription')}</strong>
        </div>

        <div style="margin-top: 16px;">
            <input type="text" id="newWord" placeholder="${t('descriptions.wordPlaceholder')}" style="width: calc(50% - 5px); padding: 12px; border: 2px solid #e9ecef; border-radius: 8px; font-size: 14px;">
            <input type="text" id="newMeaning" placeholder="${t('descriptions.meaningPlaceholder')}" style="width: calc(50% - 5px); padding: 12px; border: 2px solid #e9ecef; border-radius: 8px; font-size: 14px; margin-left: 10px;">
            <button class="btn" onclick="addToWordbook()" style="width: 100%; margin-top: 10px;">
                ${t('buttons.addWord')}
            </button>
        </div>

        <div style="margin-top: 24px;">
            ${myWords.length === 0 ? `
                <div class="content-box">
                    ${t('messages.noWords')}<br>
                    ${t('descriptions.addWordHint')}
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
                                ${t('buttons.delete')}
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
        alert(t('messages.enterWordAndMeaning'));
        return;
    }
    
    let myWords = JSON.parse(localStorage.getItem('myWordbook') || '[]');
    myWords.push({ word, meaning, date: new Date().toISOString() });
    localStorage.setItem('myWordbook', JSON.stringify(myWords));
    
    renderWordbook();
}

function removeFromWordbook(index) {
    if (confirm(t('messages.deleteConfirm'))) {
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
let wrongCount = 0;  // 틀린 횟수 추적
let quizBlocked = false;  // 퀴즈 막힘 상태

function renderQuiz() {
    const contentEl = document.getElementById('learningContent');
    
    console.log('📝 퀴즈 렌더링 시작:', {
        현재레벨: currentLevel,
        분석데이터레벨: currentAnalysis?.level,
        퀴즈문제수: currentAnalysis?.quiz_questions?.length || 0
    });
    
    // ✅ 레벨 불일치 체크
    if (currentAnalysis && currentAnalysis.level !== currentLevel) {
        console.error(`⚠️ 레벨 불일치 감지! currentAnalysis.level: ${currentAnalysis.level}, currentLevel: ${currentLevel}`);
        console.error(`⚠️ 분석 데이터를 다시 로드합니다...`);
        analyzeStory(currentStory.id, true).then(() => {
            switchTab('quiz');
        });
        return;
    }
    
    if (!currentAnalysis.quiz_questions || currentAnalysis.quiz_questions.length === 0) {
        // 퀴즈 생성 요청
        console.log('📝 퀴즈 문제 없음, 생성 요청 중...');
        contentEl.innerHTML = `
            <div class="section-title">${t('tabs.quiz')}</div>
            ${renderCharacterImage('quiz')}
            <div class="loading">
                <img src="img/loading.png" alt="Loading" class="loading-image">
                <p style="font-size: 16px; font-weight: 600; color: #333;">문제를 구성합니다...</p>
            </div>
        `;
        generateQuiz();
        return;
    }
    
    quizData = currentAnalysis.quiz_questions;
    currentQuizIndex = 0;
    correctCount = 0;
    wrongCount = 0;  // 틀린 횟수 초기화
    quizBlocked = false;  // 막힘 해제
    showQuizQuestion();
}

function showQuizQuestion() {
    const contentEl = document.getElementById('learningContent');
    
    if (currentQuizIndex >= quizData.length) {
        // 퀴즈 완료
        const score = Math.round((correctCount / quizData.length) * 100);
        
        // ✅ 90점 이상 시 5코인 보상
        let bonusCoins = 0;
        if (score >= 90) {
            bonusCoins = 5;
            userCoins += bonusCoins;
            localStorage.setItem('userCoins', userCoins);
            updateCoinDisplay();
            console.log('🎉 퀴즈 90점 이상! +5 코인 보상!');
        }
        
        // 학습 기록 저장
        saveProgress({ quiz_score: score });
        
        contentEl.innerHTML = `
            <div class="section-title">${t('quiz.completed')}</div>
            <div class="evaluation-result">
                <div class="score-display">${score}${t('quiz.score')}</div>
                <div class="feedback-text">
                    ${correctCount}/${quizData.length} ${t('quiz.correct')}<br>
                    ${score >= 80 ? t('quiz.excellent') : score >= 60 ? t('quiz.good') : t('quiz.practiceMore')}
                </div>
                ${bonusCoins > 0 ? `
                    <div style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); color: white; padding: 16px; border-radius: 12px; margin-top: 16px; font-weight: 700; text-align: center;">
                        🎉 ${t('quiz.achieved90Plus')}<br>
                        <span style="font-size: 24px;">🟡 +${bonusCoins} ${t('quiz.coinsEarned')}!</span>
                    </div>
                ` : ''}
            </div>
            <div class="control-buttons" style="margin-top: 24px;">
                <button class="btn" onclick="renderQuiz()">
                    ${t('quiz.retry')}
                </button>
                <button class="btn-secondary btn" onclick="switchTab('summary')">
                    ${t('quiz.continueLearning')}
                </button>
            </div>
            <div class="bottom-spacer"></div>
        `;
        return;
    }
    
    const q = quizData[currentQuizIndex];
    
    // ✅ 다국어 퀴즈 지원: 질문은 항상 한국어로, 선택지만 현재 언어에 따라 표시
    let questionText = '';
    let optionsList = [];
    let correctIndex = q.correct_index || 0;
    
    if (typeof q.question === 'object' && q.question !== null) {
        // 다국어 퀴즈 객체인 경우
        // 질문은 항상 한국어로 표시
        const koQ = q.question['ko'] || q.question;
        questionText = typeof koQ === 'string' ? koQ : (koQ.question || '');
        
        // 선택지는 현재 언어에 따라 표시 (영어면 영어, 한국어면 한국어)
        const multilangQ = q.question[currentLanguage] || q.question['ko'] || q.question;
        optionsList = multilangQ.options || [];
        correctIndex = multilangQ.correct_index !== undefined ? multilangQ.correct_index : correctIndex;
    } else {
        // 기존 문자열 형식인 경우 (하위 호환)
        questionText = q.question || '';
        optionsList = q.options || [];
    }
    
    contentEl.innerHTML = `
        <div class="section-title">${t('quiz.questionNumber')} ${currentQuizIndex + 1} / ${quizData.length}</div>
        ${renderCharacterImage('quiz')}
        <div class="content-box" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); font-size: 16px; font-weight: 600; color: #2d3436;">
            ${questionText}
        </div>

        <div style="margin-top: 20px;">
            ${optionsList.map((option, idx) => `
                <div class="content-box" id="option${idx}" onclick="checkAnswer(${idx}, ${correctIndex})" style="cursor: pointer; margin-bottom: 12px; border: 2px solid #e9ecef; transition: all 0.3s;">
                    <strong>${String.fromCharCode(65 + idx)}.</strong> ${option}
                </div>
            `).join('')}
        </div>
        
        <div id="quizFeedback" style="margin-top: 20px;"></div>
        <div class="bottom-spacer"></div>
    `;
}

function checkAnswer(selectedIndex, correctIndex) {
    // 퀴즈가 막힌 상태면 무시
    if (quizBlocked) return;
    
    const optionEl = document.getElementById(`option${selectedIndex}`);
    const feedbackEl = document.getElementById('quizFeedback');
    const q = quizData[currentQuizIndex];
    
    // ✅ 다국어 퀴즈 지원: correct_index도 다국어 객체에서 가져오기
    if (typeof q === 'object' && q !== null && !q.question && !q.options) {
        // 퀴즈가 언어별 객체로 구성된 경우 (예: {ko: {...}, en: {...}})
        const multilangQ = q[currentLanguage] || q['ko'] || q;
        if (multilangQ.correct_index !== undefined) {
            correctIndex = multilangQ.correct_index;
        }
    } else if (typeof q.question === 'object' && q.question !== null) {
        // question이 언어별 객체인 경우
        const multilangQ = q.question[currentLanguage] || q.question['ko'] || q.question;
        if (multilangQ.correct_index !== undefined) {
            correctIndex = multilangQ.correct_index;
        }
    }
    
    if (selectedIndex === correctIndex) {
        // 정답!
        correctCount++;
        wrongCount = 0;  // 정답 시 틀린 횟수 초기화
        
        optionEl.style.background = 'linear-gradient(135deg, #55efc4 0%, #81ecec 100%)';
        optionEl.style.animation = 'flash 0.5s ease-in-out';
        feedbackEl.innerHTML = `
            <div class="content-box" style="background: #55efc4; color: white; font-weight: 700; text-align: center;">
                ✅ ${t('quiz.correctAnswer')}
            </div>
        `;
        
        setTimeout(() => {
            currentQuizIndex++;
            showQuizQuestion();
        }, 1500);
    } else {
        // 오답 - 코인 차감
        wrongCount++;
        userCoins = Math.max(0, userCoins - 2);
        localStorage.setItem('userCoins', userCoins);
        updateCoinDisplay();
        
        optionEl.style.background = '#ff7675';
        optionEl.style.animation = 'shake 0.5s ease-in-out';
        
        // 3번 틀리면 막힘
        if (wrongCount >= 3) {
            quizBlocked = true;
            feedbackEl.innerHTML = `
                <div class="content-box" style="background: #ff7675; color: white; font-weight: 700; text-align: center; padding: 20px;">
                    <div style="font-size: 24px; margin-bottom: 12px;">❌</div>
                    <div style="font-size: 18px; margin-bottom: 16px;">${t('quiz.wrongThreeTimes')}</div>
                    <div style="font-size: 14px; opacity: 0.9; margin-bottom: 20px;">
                        ${t('quiz.cannotContinue')}<br>
                        ${t('quiz.useCoinsToContinue')}<br>
                        ${t('quiz.useCoinForExplanation')}
                    </div>
                    <div style="display: flex; gap: 8px; margin-top: 16px;">
                        <button class="btn" onclick="showCorrectAnswer(${correctIndex})" style="flex: 1; background: #6FCF97;">
                            💡 ${t('quiz.showExplanation')}<br><span style="font-size: 11px;">(-1 ${t('quiz.coinShortage')})</span>
                        </button>
                        <button class="btn" onclick="continueWithCoins()" style="flex: 1; background: #4A90E2;">
                            ▶️ ${t('quiz.continue')}<br><span style="font-size: 11px;">(-10 ${t('quiz.coinShortage')})</span>
                        </button>
                    </div>
                </div>
            `;
        } else {
            feedbackEl.innerHTML = `
                <div class="content-box" style="background: #ff7675; color: white; font-weight: 700; text-align: center;">
                    ❌ ${t('quiz.wrongAnswer')} ${t('quiz.coinDeducted')}<br>
                    <span style="font-size: 13px; opacity: 0.9;">${3 - wrongCount}${t('quiz.moreAttempts')}</span>
                </div>
            `;
            
            setTimeout(() => {
                optionEl.style.background = '';
                optionEl.style.animation = '';
                feedbackEl.innerHTML = '';
            }, 2000);
        }
    }
}

// ============================================================================
// [퀴즈] 정답 해설 보기 & 계속하기 (코인 사용)
// ============================================================================
function showCorrectAnswer(correctIndex) {
    // 코인 부족 체크
    if (userCoins < 1) {
        showCoinShop();
        return;
    }
    
    // 1코인 차감
    userCoins--;
    localStorage.setItem('userCoins', userCoins);
    updateCoinDisplay();
    
    const q = quizData[currentQuizIndex];
    
    // ✅ 다국어 퀴즈 지원: options와 explanation 다국어 처리
    let optionsList = [];
    let explanationText = '';
    
    // 퀴즈 데이터 구조 확인
    if (typeof q === 'object' && q !== null && !q.question && !q.options) {
        // 퀴즈가 언어별 객체로 구성된 경우
        const multilangQ = q[currentLanguage] || q['ko'] || q;
        optionsList = multilangQ.options || [];
        explanationText = multilangQ.explanation || '';
    } else if (typeof q.question === 'object' && q.question !== null) {
        const multilangQ = q.question[currentLanguage] || q.question['ko'] || q.question;
        optionsList = multilangQ.options || q.options || [];
        explanationText = multilangQ.explanation || q.explanation || '';
    } else {
        optionsList = q.options || [];
        explanationText = q.explanation || '';
    }
    
    const correctOption = optionsList[correctIndex] || '';
    const feedbackEl = document.getElementById('quizFeedback');
    
    feedbackEl.innerHTML = `
        <div class="content-box" style="background: #6FCF97; color: white; font-weight: 700; text-align: center; padding: 20px;">
            <div style="font-size: 24px; margin-bottom: 12px;">💡</div>
            <div style="font-size: 16px; margin-bottom: 16px;">${t('quiz.explanationTitle')} (-1 ${t('quiz.coinShortage')})</div>
            <div style="font-size: 14px; background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; margin-bottom: 16px;">
                ${t('quiz.correctAnswerLabel')} <strong>${correctOption}</strong>
            </div>
            <div style="font-size: 13px; opacity: 0.9; line-height: 1.6;">
                ${explanationText || t('quiz.defaultExplanation')}
            </div>
            <button class="btn" onclick="continueAfterExplanation()" style="margin-top: 16px; background: white; color: #6FCF97;">
                ${t('quiz.nextQuestion')}
            </button>
        </div>
    `;
    
    quizBlocked = false;  // 해설 본 후 계속 가능
}

function continueAfterExplanation() {
    wrongCount = 0;  // 틀린 횟수 초기화
    currentQuizIndex++;
    showQuizQuestion();
}

function continueWithCoins() {
    // 코인 부족 체크
    if (userCoins < 10) {
        showCoinShop();
        return;
    }
    
    // 10코인 차감
    userCoins -= 10;
    localStorage.setItem('userCoins', userCoins);
    updateCoinDisplay();
    
    console.log('💰 10코인 사용하여 계속하기');
    
    // 틀린 횟수 초기화하고 다음 문제로
    wrongCount = 0;
    quizBlocked = false;
    currentQuizIndex++;
    showQuizQuestion();
}

function showCoinShop() {
    const feedbackEl = document.getElementById('quizFeedback');
    feedbackEl.innerHTML = `
        <div class="content-box" style="background: #FFD700; color: white; font-weight: 700; text-align: center; padding: 20px;">
            <div style="font-size: 32px; margin-bottom: 12px;">🟡</div>
            <div style="font-size: 18px; margin-bottom: 16px;">${t('quiz.notEnoughCoins')}</div>
            <div style="font-size: 14px; opacity: 0.9; margin-bottom: 20px;">
                ${t('quiz.currentCoins')}: ${userCoins}
            </div>
            <button class="btn" onclick="location.href='coin-shop.html'" style="background: white; color: #FFD700;">
                🛒 ${t('quiz.goToCoinShop')}
            </button>
            <button class="btn" onclick="switchTab('summary')" style="margin-top: 8px; background: rgba(255,255,255,0.3); color: white;">
                ${t('quiz.continueLearning')}
            </button>
        </div>
    `;
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
                ${t('quiz.quizError')}: ${error.message}
            </div>
        `;
    }
}

function renderGrowth() {
    const contentEl = document.getElementById('learningContent');
    const fullText = currentStory.full_text || '';
    const firstParagraph = fullText.split('\n\n')[0] || fullText.substring(0, 200);
    
    contentEl.innerHTML = `
        <div class="section-title">${t('tabs.growth')}</div>
        ${renderCharacterImage('growth')}
        <div class="content-box" style="background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%); color: #2d3436;">
            <strong>${t('descriptions.readAndRecord')}</strong>
        </div>

        <div class="content-box" style="margin-top: 16px; font-size: 15px; line-height: 1.8;">
            ${firstParagraph}
        </div>

        <div class="recording-indicator" id="recordingIndicator">
            <div class="recording-text">${t('messages.recording')}</div>
        </div>

        <div class="control-buttons" style="margin-top: 16px;">
            <button class="btn" onclick="startRecording()">
                ${t('buttons.startRecording')}
            </button>
            <button class="btn-secondary btn" onclick="stopRecording()">
                ${t('buttons.stopRecording')}
            </button>
        </div>

        <div id="recordedTextBox" style="margin-top: 16px;"></div>

        ${recordedText ? `
            <div class="control-buttons" style="margin-top: 16px;">
                <button class="btn-success btn" onclick="evaluateGrowth()">
                    ${t('buttons.getAIEvaluation')}
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
            <p>${t('messages.loadingData')}</p>
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
        console.log('🔊 TTS 음성 로드 시도:', `${API_BASE}/tts/voices`);
        const response = await fetch(`${API_BASE}/tts/voices`, {
            timeout: 5000  // 5초 타임아웃
        });
        
        console.log('📡 TTS API 응답 상태:', response.status);
        
        if (!response.ok) {
            throw new Error(`API 응답 오류: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📦 TTS 데이터 수신:', data);
        
        if (data.voices && data.voices.length > 0) {
            googleTTSVoices = data.voices;
            // ✅ 기본 음성: ElevenLabs Anna (최고 품질, 프리미엄)
            selectedGoogleVoice = 'uyVNoMrnUku1dZyVEXwD';  // Anna 강제 설정
            useGoogleTTS = true;
            
            localStorage.setItem('selectedGoogleVoice', selectedGoogleVoice);
            localStorage.setItem('useGoogleTTS', 'true');
            
            console.log('✅ TTS 음성 로드 완료:', googleTTSVoices.length, '개');
            console.log('✅ Anna (ElevenLabs 프리미엄) 설정 완료');
            console.log('🎤 useGoogleTTS:', useGoogleTTS);
        } else {
            throw new Error('음성 목록이 비어있음');
        }
    } catch (error) {
        console.error('❌ 백엔드 TTS 로드 실패:', error.message);
        console.log('⚠️ Fallback: Web Speech API 사용');
        useGoogleTTS = false;
    }
}

// ============================================================================
// [6] TTS (Text-to-Speech) 기능
// ============================================================================

// TTS 초기화 상태 추적
let ttsInitialized = false;
let sttInitialized = false;

/**
 * TTS 지연 초기화 (필요할 때만 초기화)
 */
function ensureTTSInitialized() {
    if (!ttsInitialized) {
        initializeTTS();
        ttsInitialized = true;
    }
}

/**
 * STT 지연 초기화 (필요할 때만 초기화)
 */
function ensureSTTInitialized() {
    if (!sttInitialized) {
        initializeSTT();
        sttInitialized = true;
    }
}

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
    // TTS 초기화 확인 (필요할 때만)
    ensureTTSInitialized();
    
    console.log(`🎯 togglePlay 호출 - ID: ${id}, 텍스트 길이: ${text.length}`);
    console.log(`🎤 현재 TTS 상태: useGoogleTTS=${useGoogleTTS}, voice=${selectedGoogleVoice}`);
    
    // 이미 재생 중이면 정지
    if (isPlaying && currentPlayingButton === buttonElement) {
        stopTTS();
        buttonElement.textContent = '▶';
        buttonElement.style.animation = '';
        isPlaying = false;
        currentPlayingButton = null;
        return;
    }
    
    // 다른 버튼이 재생 중이면 먼저 정지
    if (currentPlayingButton && currentPlayingButton !== buttonElement) {
        currentPlayingButton.textContent = '▶';
        currentPlayingButton.style.animation = '';
    }
    
    // 재생 시작
    stopTTS();  // 기존 재생 정지
    currentPlayingButton = buttonElement;
    
    // ✅ 캐시 확인 (Anna 음성 + 텍스트)
    const koreanOnlyText = filterKoreanOnly(text);
    const cacheKey = `${selectedGoogleVoice}_${koreanOnlyText}`;
    
    console.log(`📝 필터링된 텍스트 길이: ${koreanOnlyText.length}`);
    
    if (audioCache[cacheKey]) {
        // 캐시에 있으면 바로 재생 (애니메이션 없음)
        console.log('⚡ 캐시에서 즉시 재생!');
        buttonElement.textContent = '■';
        isPlaying = true;
        await speakText(text);
    } else {
        // 캐시 없으면 로딩 표시
        console.log(`🔊 음성 데이터 생성 중... (ID: ${id})`);
        buttonElement.textContent = '⏳';
        buttonElement.style.animation = 'pulse 1s infinite';
        
        // 로딩 메시지 표시 (버튼 근처에)
        showLoadingMessage(buttonElement);
        
        isPlaying = true;
        await speakText(text);
        
        // 로딩 완료 (재생 중 표시)
        if (currentPlayingButton === buttonElement) {
            buttonElement.textContent = '■';
            buttonElement.style.animation = '';
            hideLoadingMessage();
        }
    }
}

/**
 * 한국어만 추출하는 필터 함수
 * 영어 단어와 괄호 안의 번역을 TTS가 어색하게 읽으므로 제거
 */
function filterKoreanOnly(text) {
    // 1. 괄호와 그 안의 내용을 모두 제거 (영문 번역 제거)
    // 예: "나는 그림을 잘 그려. (I'm good at drawing)" → "나는 그림을 잘 그려."
    text = text.replace(/\([^)]*\)/g, '');
    
    // 2. 대괄호와 그 안의 내용도 제거 (혹시 모를 경우 대비)
    text = text.replace(/\[[^\]]*\]/g, '');
    
    // 3. 영어 알파벳 제거
    text = text.replace(/[A-Za-z]+/g, '');
    
    // 4. 연속된 공백을 하나로
    text = text.replace(/\s+/g, ' ');
    
    return text.trim();
}

async function speakText(text) {
    // TTS 초기화 확인 (필요할 때만)
    ensureTTSInitialized();
    
    // 음성 목록이 아직 로드되지 않았으면 백그라운드에서 로드 (비블로킹)
    if (googleTTSVoices.length === 0 && useGoogleTTS) {
        loadGoogleTTSVoices().catch(() => {
            // 실패해도 계속 진행 (Web Speech API 사용)
        });
    }
    
    // ✅ 한국어만 추출 (영어 제거)
    const koreanOnlyText = filterKoreanOnly(text);
    
    if (!koreanOnlyText || koreanOnlyText.trim().length === 0) {
        console.log('⚠️ 읽을 한국어 텍스트가 없습니다.');
        return;
    }
    
    // ✅ 디버그: 현재 TTS 설정 확인
    console.log('🎤 TTS 설정 확인:', {
        useGoogleTTS: useGoogleTTS,
        selectedGoogleVoice: selectedGoogleVoice,
        textLength: koreanOnlyText.length
    });
    
    // Google Cloud TTS 사용
    if (useGoogleTTS) {
        console.log('✅ Anna (ElevenLabs) 음성 사용 중...');
        await speakWithGoogleTTS(koreanOnlyText);
    }
    // Web Speech API fallback
    else {
        console.log('⚠️ Web Speech API 사용 중 (Anna 아님!)');
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
        
        // ✅ 캐시 키 생성 (음성 ID + 텍스트)
        const cacheKey = `${selectedGoogleVoice}_${text}`;
        
        // ✅ 캐시에 있으면 즉시 재생 (0.1초!)
        if (audioCache[cacheKey]) {
            console.log('⚡ 캐시에서 즉시 재생!');
            currentAudio = new Audio(audioCache[cacheKey]);
            currentAudio.play();
            
            // 재생 완료 후 처리
            currentAudio.onended = () => {
                if (currentPlayingButton) {
                    currentPlayingButton.textContent = '▶';
                    currentPlayingButton.style.opacity = '1';
                    currentPlayingButton.style.animation = '';
                    isPlaying = false;
                    currentPlayingButton = null;
                }
            };
            return;
        }
        
        // ✅ 캐시 없으면 API 호출 (6-12초)
        console.log('🔊 음성 생성 중... (최초 1회만)');
        console.log('📡 API 호출:', {
            url: `${API_BASE}/tts/speak`,
            voice: selectedGoogleVoice,
            textLength: text.length
        });
        
        const response = await fetch(`${API_BASE}/tts/speak`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: text,
                voice: selectedGoogleVoice,
                speed: 0.95
            })
        });
        
        console.log('📡 TTS API 응답:', response.status);
        
        const data = await response.json();
        
        console.log('📦 TTS 응답 데이터:', data);
        
        if (data.error) {
            console.error('❌ TTS 오류:', data.error);
            console.log('⚠️ Web Speech API로 Fallback');
            // Fallback to Web Speech API
            speakWithWebSpeech(text);
            return;
        }
        
        if (!data.audio) {
            console.error('❌ 오디오 데이터 없음!');
            console.log('⚠️ Web Speech API로 Fallback');
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
        
        // ✅ Blob URL 생성 및 캐시 저장
        const audioUrl = URL.createObjectURL(audioBlob);
        audioCache[cacheKey] = audioUrl;
        console.log(`💾 오디오 캐시 저장 완료 (총 ${Object.keys(audioCache).length}개)`);
        
        // 오디오 재생
        currentAudio = new Audio(audioUrl);
        currentAudio.play();
        
        // 재생 완료 후 처리
        currentAudio.onended = () => {
            // 버튼 상태 복구
            if (currentPlayingButton) {
                currentPlayingButton.textContent = '▶';
                currentPlayingButton.style.opacity = '1';
                isPlaying = false;
                currentPlayingButton = null;
            }
        };
        
    } catch (error) {
        console.error('❌ Google TTS 심각한 오류:', error);
        console.log('⚠️ Web Speech API로 Fallback (Anna 실패)');
        // Fallback to Web Speech API
        hideLoadingMessage();  // 로딩 메시지 숨김
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
        currentPlayingButton.style.opacity = '1';
        currentPlayingButton.style.animation = '';
        isPlaying = false;
        currentPlayingButton = null;
    }
    
    // 로딩 메시지 숨김
    hideLoadingMessage();
}

/**
 * 전체 이야기 듣기 전용
 * - 0번 동화: TTS로 실시간 생성
 * - 기타 동화: 로컬 MP3 파일 재생
 * - 하이라이트 및 자동 스크롤 기능 포함
 */
async function playFullStoryAudio(storyId, buttonElement) {
    console.log(`🎵 playFullStoryAudio 호출됨 - storyId: ${storyId}, type: ${typeof storyId}`);
    
    // 모든 동화: 로컬 MP3 파일 재생 (0번 포함, 파일이 없으면 TTS로 fallback)
    // 절대 경로 사용 (프로덕션 환경에서도 정상 작동)
    const audioPath = `${window.location.origin}/audio/full-stories/story-${storyId}.mp3`;
    
    console.log(`🎵 전체 듣기 MP3 재생 시작: ${audioPath}`);
    console.log(`🌐 현재 origin: ${window.location.origin}`);
    
    // 이미 재생 중이면 정지
    if (fullStoryAudio && !fullStoryAudio.paused) {
        console.log('⏸ 재생 중지');
        fullStoryAudio.pause();
        fullStoryAudio.currentTime = 0;
        fullStoryAudio = null;
        buttonElement.textContent = '▶';
        buttonElement.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        
        // 하이라이트 제거
        clearFullStoryHighlight();
        return;
    }
    
    // 이전 오디오 정리
    if (fullStoryAudio) {
        fullStoryAudio.pause();
        fullStoryAudio = null;
    }
    
    // 새 오디오 객체 생성
    fullStoryAudio = new Audio(audioPath);
    
    // 로딩 중 표시
    buttonElement.innerHTML = '⏳';
    buttonElement.disabled = true;
    
    // 텍스트 문단 정보 가져오기 (renderFullStory와 동일한 방식으로 처리)
    // 오디오 파일 생성 시 사용된 방식과 일치: \n\n로 분할
    const fullText = currentStory?.full_text || '';
    const paragraphs = fullText.split('\n\n').filter(p => p.trim().length > 0);
    const totalParagraphs = paragraphs.length;
    
    // 각 문단의 텍스트 길이 계산 (renderFullStory에서 표시되는 텍스트와 동일하게 처리)
    // renderFullStory에서는 para.trim()을 사용하므로, 여기서도 trim() 후 길이 계산
    const paragraphLengths = paragraphs.map(p => {
        // trim() 후 공백 제외한 길이 계산 (표시되는 텍스트와 일치)
        const trimmedPara = p.trim();
        // 한글, 숫자, 기본 문장부호만 카운트 (공백 제외)
        return trimmedPara.replace(/\s/g, '').length;
    });
    
    // 전체 텍스트 길이
    const totalLength = paragraphLengths.reduce((sum, len) => sum + len, 0);
    
    // TTS fallback 함수 (0번 동화 파일이 없을 때만 사용)
    const fallbackToTTS = async () => {
        // 파일 존재 여부 확인을 위해 HEAD 요청 시도
        try {
            const checkResponse = await fetch(audioPath, { method: 'HEAD' });
            if (checkResponse.ok) {
                console.log('✅ 파일은 존재하지만 오디오 로드에 실패했습니다. 재시도합니다.');
                // 파일이 존재하면 재시도
                setTimeout(() => {
                    fullStoryAudio.load();
                    fullStoryAudio.play().catch(async (error) => {
                        console.error('❌ 재시도 실패:', error);
                        // 재시도 실패 시 에러 표시
                        if (storyId !== 0 && storyId !== '0') {
                            const fullPath = `${window.location.origin}/audio/full-stories/story-${storyId}.mp3`;
                            alert(`오디오 파일을 재생할 수 없습니다.\n\n파일명: story-${storyId}.mp3\n경로: ${fullPath}\n\n브라우저 콘솔을 확인해 주세요.`);
                            buttonElement.innerHTML = '▶';
                            buttonElement.disabled = false;
                            fullStoryAudio = null;
                        }
                    });
                }, 500);
                return;
            }
        } catch (fetchError) {
            console.error('❌ 파일 존재 확인 실패:', fetchError);
        }
        
        if (storyId !== 0 && storyId !== '0') {
            // 0번이 아니면 TTS fallback 없음
            const fullPath = `${window.location.origin}/audio/full-stories/story-${storyId}.mp3`;
            console.error(`❌ 오디오 파일을 찾을 수 없음: ${fullPath}`);
            alert(`전체 듣기 오디오 파일을 찾을 수 없습니다.\n\n파일명: story-${storyId}.mp3\n경로: ${fullPath}\n\n파일이 존재하는지 확인해 주세요.\n\nCloudflare Pages 배포가 완료되면 정상 작동합니다.`);
            buttonElement.innerHTML = '▶';
            buttonElement.disabled = false;
            return;
        }
        
        console.log('⚠️ story-0.mp3 파일이 없습니다. TTS로 fallback합니다.');
        
        if (!fullText) {
            alert('동화 내용을 불러올 수 없습니다.');
            buttonElement.innerHTML = '▶';
            buttonElement.disabled = false;
            return;
        }
        
        // TTS는 문단별 학습을 권장
        alert(`전체 읽기 오디오 파일이 아직 생성되지 않았습니다.\n\n문단별 학습을 이용해주세요.\n(AI 음성으로 실시간 생성됩니다)`);
        buttonElement.innerHTML = '▶';
        buttonElement.disabled = false;
        fullStoryAudio = null;
    };
    
    // 에러 처리 (파일 없음) - 0번 동화는 TTS로 fallback
    fullStoryAudio.addEventListener('error', async (e) => {
        console.error('❌ 오디오 로드 실패:', e);
        console.error('❌ 오디오 경로:', audioPath);
        console.error('❌ 오디오 에러 상세:', fullStoryAudio.error);
        // 네트워크 에러인지 파일 없음인지 확인
        if (fullStoryAudio.error && fullStoryAudio.error.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
            console.error('❌ 파일 형식이 지원되지 않거나 파일을 찾을 수 없습니다.');
        }
        await fallbackToTTS();
    }, { once: true });
    
    // 재생 준비 완료
    fullStoryAudio.addEventListener('loadedmetadata', () => {
        console.log('✅ 오디오 메타데이터 로드 완료, 재생 가능');
        buttonElement.innerHTML = '⏸';
        buttonElement.disabled = false;
        
        // 오디오 길이 확인
        const audioDuration = fullStoryAudio.duration;
        console.log(`📊 오디오 길이: ${audioDuration.toFixed(2)}초, 문단 수: ${totalParagraphs}`);
        console.log(`📊 문단별 길이:`, paragraphLengths);
        console.log(`📊 전체 텍스트 길이: ${totalLength}자`);
        
        // 하이라이트 및 스크롤 시작 (문단별 길이 비율 사용)
        startFullStoryHighlight(audioDuration, paragraphLengths, totalLength, paragraphs);
    }, { once: true });
    
    // 재생 시작
    fullStoryAudio.play()
        .then(() => {
            console.log('✅ 재생 시작됨');
            buttonElement.innerHTML = '⏸';
            buttonElement.disabled = false;
        })
        .catch(async (error) => {
            console.error('❌ 오디오 재생 실패:', error);
            await fallbackToTTS();
        });
    
    // 재생 완료 시
    fullStoryAudio.addEventListener('ended', () => {
        console.log('✅ 재생 완료');
        buttonElement.innerHTML = '▶';
        clearFullStoryHighlight();
        fullStoryAudio = null;
    }, { once: true });
    
    // 일시정지 시 하이라이트 정지
    fullStoryAudio.addEventListener('pause', () => {
        console.log('⏸ 재생 일시정지');
    });
}

// 전체 이야기 하이라이트 및 스크롤 관리
let fullStoryHighlightInterval = null;
let fullStoryTimeUpdateHandler = null;
let paragraphTimings = []; // 문단별 시작 시간 저장
let currentHighlightedIndex = -1; // 현재 하이라이트된 문단 인덱스 추적

function startFullStoryHighlight(audioDuration, paragraphLengths, totalLength, paragraphs) {
    // 기존 인터벌 및 이벤트 리스너 정리
    if (fullStoryHighlightInterval) {
        clearInterval(fullStoryHighlightInterval);
        fullStoryHighlightInterval = null;
    }
    if (fullStoryTimeUpdateHandler) {
        fullStoryAudio.removeEventListener('timeupdate', fullStoryTimeUpdateHandler);
        fullStoryTimeUpdateHandler = null;
    }
    
    // 문단별 시작 시간 계산 (텍스트 길이 비율 기반, 더 정확한 계산)
    paragraphTimings = [];
    let accumulatedTime = 0;
    
    // 문단별로 실제 텍스트 길이와 단어 수를 고려하여 더 정확한 시간 계산
    paragraphLengths.forEach((length, index) => {
        // 텍스트 길이 비율
        const paragraphRatio = length / totalLength;
        
        // 문단의 실제 단어 수도 고려 (한글은 보통 더 천천히 읽힘)
        const paragraphText = paragraphs[index].trim();
        const wordCount = paragraphText.split(/\s+/).length;
        const charCount = paragraphText.replace(/\s/g, '').length;
        
        // 단어 수와 문자 수를 모두 고려한 가중치 계산
        // 한글은 보통 초당 3-4자 정도 읽히지만, 문장부호와 공백을 고려
        const avgReadingSpeed = 3.5; // 초당 평균 읽기 속도 (자/초)
        const estimatedDuration = charCount / avgReadingSpeed;
        
        // 텍스트 길이 비율과 실제 읽기 시간 추정을 결합
        const ratioBasedDuration = audioDuration * paragraphRatio;
        const estimatedBasedDuration = estimatedDuration;
        
        // 두 방법의 평균을 사용하되, 비율 기반에 더 가중치를 둠 (실제 오디오 길이에 맞춤)
        const paragraphDuration = (ratioBasedDuration * 0.7) + (estimatedBasedDuration * 0.3);
        
        paragraphTimings.push({
            startTime: accumulatedTime,
            endTime: accumulatedTime + paragraphDuration,
            index: index,
            duration: paragraphDuration
        });
        
        accumulatedTime += paragraphDuration;
    });
    
    // 마지막 문단의 끝 시간을 오디오 전체 길이에 맞춤 (누적 오차 보정)
    if (paragraphTimings.length > 0) {
        const lastTiming = paragraphTimings[paragraphTimings.length - 1];
        const timeDifference = audioDuration - lastTiming.endTime;
        // 마지막 문단의 시간을 조정하여 전체 오디오 길이에 맞춤
        lastTiming.endTime = audioDuration;
        lastTiming.duration += timeDifference;
    }
    
    console.log(`🎯 하이라이트 시작: 총 ${paragraphLengths.length}개 문단`);
    console.log(`📊 문단별 시간 구간:`, paragraphTimings.map(t => 
        `문단${t.index}: ${t.startTime.toFixed(2)}초 ~ ${t.endTime.toFixed(2)}초 (${t.duration.toFixed(2)}초)`
    ));
    
    // 현재 하이라이트된 문단 인덱스 초기화
    currentHighlightedIndex = -1;
    
    // 오디오의 timeupdate 이벤트를 사용하여 더 정확한 타이밍으로 업데이트
    fullStoryTimeUpdateHandler = () => {
        if (!fullStoryAudio || fullStoryAudio.paused) {
            return;
        }
        
        const currentTime = fullStoryAudio.currentTime;
        
        // 현재 시간에 해당하는 문단 찾기 (이진 검색으로 최적화)
        let currentParagraphIndex = -1;
        
        // 이진 검색으로 현재 시간에 해당하는 문단 찾기
        let left = 0;
        let right = paragraphTimings.length - 1;
        
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            const timing = paragraphTimings[mid];
            
            if (currentTime >= timing.startTime && currentTime < timing.endTime) {
                currentParagraphIndex = timing.index;
                break;
            } else if (currentTime < timing.startTime) {
                right = mid - 1;
            } else {
                left = mid + 1;
            }
        }
        
        // 마지막 문단 처리 (끝 시간 포함)
        if (currentParagraphIndex === -1 && paragraphTimings.length > 0) {
            const lastTiming = paragraphTimings[paragraphTimings.length - 1];
            if (currentTime >= lastTiming.startTime && currentTime <= lastTiming.endTime) {
                currentParagraphIndex = lastTiming.index;
            }
        }
        
        // 안전한 인덱스 보장 및 하이라이트 업데이트 (변경된 경우에만)
        if (currentParagraphIndex >= 0 && currentParagraphIndex < paragraphLengths.length) {
            // 이전과 다른 문단이면 하이라이트 업데이트
            if (currentHighlightedIndex !== currentParagraphIndex) {
                currentHighlightedIndex = currentParagraphIndex;
                highlightFullStoryParagraph(currentParagraphIndex);
            }
        }
    };
    
    // timeupdate 이벤트 리스너 등록 (오디오 재생 중 계속 발생)
    fullStoryAudio.addEventListener('timeupdate', fullStoryTimeUpdateHandler);
}

function highlightFullStoryParagraph(index) {
    // 모든 문단 하이라이트 제거
    document.querySelectorAll('.full-story-paragraph').forEach((para, i) => {
        if (i === index) {
            // 현재 문단 하이라이트
            para.style.background = '#fff3cd';
            para.style.border = '2px solid #ffc107';
            para.style.boxShadow = '0 4px 12px rgba(255, 193, 7, 0.3)';
            para.style.transform = 'scale(1.02)';
            
            // 자동 스크롤
            para.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        } else {
            // 다른 문단은 기본 스타일
            para.style.background = 'transparent';
            para.style.border = 'none';
            para.style.boxShadow = 'none';
            para.style.transform = 'scale(1)';
        }
    });
}

function clearFullStoryHighlight() {
    // 인터벌 정리
    if (fullStoryHighlightInterval) {
        clearInterval(fullStoryHighlightInterval);
        fullStoryHighlightInterval = null;
    }
    
    // timeupdate 이벤트 리스너 제거
    if (fullStoryTimeUpdateHandler && fullStoryAudio) {
        fullStoryAudio.removeEventListener('timeupdate', fullStoryTimeUpdateHandler);
        fullStoryTimeUpdateHandler = null;
    }
    
    // 상태 초기화
    paragraphTimings = [];
    currentHighlightedIndex = -1;
    
    // 모든 하이라이트 제거
    document.querySelectorAll('.full-story-paragraph').forEach(para => {
        para.style.background = 'transparent';
        para.style.border = 'none';
        para.style.boxShadow = 'none';
        para.style.transform = 'scale(1)';
    });
}

// ============================================================================
// [6-3] 로딩 메시지 표시/숨김
// ============================================================================
function showLoadingMessage(buttonElement) {
    // 기존 로딩 메시지 제거
    hideLoadingMessage();
    
    // 새 로딩 메시지 생성
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'ttsLoadingMessage';
    loadingDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.85);
        color: white;
        padding: 20px 30px;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 600;
        z-index: 9999;
        text-align: center;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
        animation: fadeIn 0.3s ease;
    `;
    loadingDiv.innerHTML = `
        <div style="font-size: 32px; margin-bottom: 8px;">🔊</div>
        <div>${t('messages.loadingAudio')}</div>
        <div style="font-size: 12px; opacity: 0.8; margin-top: 8px;">Anna (프리미엄 음성)</div>
    `;
    
    document.body.appendChild(loadingDiv);
}

function hideLoadingMessage() {
    const loadingDiv = document.getElementById('ttsLoadingMessage');
    if (loadingDiv) {
        loadingDiv.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => loadingDiv.remove(), 300);
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
    // STT 초기화 확인 (필요할 때만)
    ensureSTTInitialized();
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
    // STT 초기화 확인 (필요할 때만)
    ensureSTTInitialized();
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

// ============================================================================
// [7-2] 전체 이야기 녹음 및 평가
// ============================================================================
let fullStoryRecognition = null;
let fullStoryRecordedText = '';
let isFullStoryRecording = false;
let fullStorySilenceTimeout = null;

async function startFullStoryRecording(storyId, fullText) {
    console.log(`🎙️ 전체 이야기 녹음 시작 요청: story=${storyId}`);
    console.log(`📝 전체 텍스트 길이: ${fullText.length}`);
    
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
            return;
        }
        console.log('✅ 마이크 권한 허용됨');
    }
    
    // ✅ 기존 녹음 완전히 중지 및 정리
    if (isFullStoryRecording && fullStoryRecognition) {
        console.log('⚠️ 기존 전체 이야기 녹음 중지 및 정리');
        try {
            fullStoryRecognition.abort();
            fullStoryRecognition = null;
        } catch (e) {
            console.error('녹음 정리 오류:', e);
        }
        isFullStoryRecording = false;
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // 타이머 정리
    if (fullStorySilenceTimeout) {
        clearTimeout(fullStorySilenceTimeout);
        fullStorySilenceTimeout = null;
    }
    
    // 상태 초기화
    fullStoryRecordedText = '';
    let speechDetected = false;
    
    // ✅ 매번 새로운 Recognition 객체 생성
    console.log('🆕 새 전체 이야기 Recognition 객체 생성');
    fullStoryRecognition = new SpeechRecognition();
    fullStoryRecognition.lang = 'ko-KR';
    fullStoryRecognition.continuous = true;
    fullStoryRecognition.interimResults = true;
    fullStoryRecognition.maxAlternatives = 1;
    
    // ✅ 녹음 중 안내 메시지
    const indicator = document.getElementById('fullStoryRecordingIndicator');
    const resultEl = document.getElementById('fullStoryEvaluationResult');
    
    if (indicator) {
        indicator.style.display = 'block';
        indicator.classList.add('active');
        indicator.innerHTML = '<div class="recording-text">🔴 녹음 중... 지금 말하세요!</div>';
    }
    
    // 읽어볼 내용 표시
    if (resultEl) {
        resultEl.style.display = 'block';
        resultEl.innerHTML = `
            <div class="content-box" style="background: #fff3cd; border-left: 4px solid #ffc107; margin-top: 16px;">
                <div style="font-size: 16px; font-weight: 700; color: #856404; margin-bottom: 8px;">
                    🎤 지금 바로 말하세요!
                </div>
                <div style="font-size: 18px; font-weight: 600; color: #333; line-height: 1.8; padding: 12px; background: white; border-radius: 8px; margin-bottom: 12px;">
                    ${fullText.length > 300 ? fullText.substring(0, 300) + '...' : fullText}
                </div>
                <div style="font-size: 14px; color: #856404;">
                    <strong>✨ 자동 중지:</strong> 말을 멈춘 후 4초가 지나면 자동으로 평가가 시작됩니다.<br>
                    말하는 대로 텍스트가 아래에 표시됩니다.
                </div>
                <div id="fullStoryLiveTranscript" style="margin-top: 12px; padding: 12px; background: #e8f5e9; border-radius: 8px; min-height: 50px; font-size: 16px; line-height: 1.6;">
                    <em style="color: #999;">녹음 중...</em>
                </div>
            </div>
        `;
    }
    
    // 버튼을 "중지" 버튼으로 변경
    const buttonContainer = document.getElementById('fullStoryRecordingButtons');
    if (buttonContainer) {
        buttonContainer.innerHTML = `
            <button class="btn btn-secondary" onclick="stopFullStoryRecording(${storyId})" style="background: #dc3545; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">
                ⏹️ 녹음 중지 및 평가받기
            </button>
        `;
    }
    
    // ✅ STT 에러 핸들링
    fullStoryRecognition.onerror = (event) => {
        console.error('❌ 전체 이야기 음성 인식 오류:', event.error);
        isFullStoryRecording = false;
        
        if (resultEl) {
            let errorMessage = '음성 인식 오류가 발생했습니다.';
            if (event.error === 'not-allowed' || event.error === 'permission-denied') {
                errorMessage = '🔒 마이크 권한이 거부되었습니다.';
            } else if (event.error === 'no-speech') {
                errorMessage = '음성이 감지되지 않았습니다. 다시 시도해주세요.';
            }
            
            resultEl.innerHTML = `
                <div class="content-box" style="background: #ffebee; border-left: 4px solid #f44336; margin-top: 16px;">
                    <div style="font-size: 18px; font-weight: 700; color: #c62828; margin-bottom: 12px;">
                        ❌ ${errorMessage}
                    </div>
                    <button class="btn" onclick="startFullStoryRecording(${storyId}, '${escapeQuotes(fullText)}')">
                        🔄 다시 녹음하기
                    </button>
                </div>
            `;
        }
        
        if (indicator) {
            indicator.style.display = 'none';
            indicator.classList.remove('active');
        }
    };
    
    // ✅ STT 결과 처리 (실시간 표시 + 침묵 감지)
    fullStoryRecognition.onresult = (event) => {
        console.log('📝 전체 이야기 onresult 이벤트 발생');
        
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
        
        fullStoryRecordedText = (finalTranscript || interimTranscript).trim();
        
        console.log(`📝 현재 녹음 텍스트 (${fullStoryRecordedText.length}자):`, fullStoryRecordedText);
        
        // ✅ 실시간 텍스트 표시
        const liveEl = document.getElementById('fullStoryLiveTranscript');
        if (liveEl && fullStoryRecordedText) {
            liveEl.innerHTML = `
                <div style="color: #2e7d32; font-weight: 600;">
                    ${fullStoryRecordedText}
                </div>
            `;
        }
        
        // ✅ 침묵 감지 타이머 (음성 감지된 후에만)
        if (speechDetected && fullStoryRecordedText.length > 0) {
            if (fullStorySilenceTimeout) {
                clearTimeout(fullStorySilenceTimeout);
            }
            
            // 새 타이머 시작 (4초 후 자동 중지)
            fullStorySilenceTimeout = setTimeout(() => {
                console.log('⏱️ 침묵 감지 - 자동 중지');
                if (isFullStoryRecording) {
                    stopFullStoryRecording(storyId);
                }
            }, 4000);
        }
    };
    
    // ✅ 음성 시작 감지
    fullStoryRecognition.onspeechstart = () => {
        console.log('🎤 음성 시작 감지');
        speechDetected = true;
    };
    
    // ✅ 음성 종료 감지
    fullStoryRecognition.onspeechend = () => {
        console.log('🔇 음성 종료 감지');
    };
    
    // ✅ 녹음 시작
    try {
        isFullStoryRecording = true;
        fullStoryRecognition.start();
        console.log('✅ 전체 이야기 녹음 시작 성공');
    } catch (e) {
        console.error('❌ 전체 이야기 녹음 시작 실패:', e);
        isFullStoryRecording = false;
        if (indicator) {
            indicator.style.display = 'none';
            indicator.classList.remove('active');
        }
        alert('녹음을 시작할 수 없습니다. 페이지를 새로고침해주세요.');
    }
}

function stopFullStoryRecording(storyId) {
    console.log('⏹️ 전체 이야기 녹음 중지 함수 호출');
    
    // 타이머 정리
    if (fullStorySilenceTimeout) {
        clearTimeout(fullStorySilenceTimeout);
        fullStorySilenceTimeout = null;
    }
    
    // ✅ 녹음 중지
    if (fullStoryRecognition && isFullStoryRecording) {
        try {
            fullStoryRecognition.stop();
            console.log('✅ 전체 이야기 Recognition 중지 성공');
        } catch (e) {
            console.error('❌ 녹음 중지 오류:', e);
        }
    }
    isFullStoryRecording = false;
    
    // UI 업데이트
    const indicator = document.getElementById('fullStoryRecordingIndicator');
    if (indicator) {
        indicator.style.display = 'none';
        indicator.classList.remove('active');
    }
    
    // 버튼 복구
    const buttonContainer = document.getElementById('fullStoryRecordingButtons');
    const fullText = currentStory.full_text || '';
    if (buttonContainer) {
        buttonContainer.innerHTML = `
            <button class="btn" onclick="startFullStoryRecording(${storyId}, '${escapeQuotes(fullText)}')" style="background: #667eea; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">
                🎤 소리내어 읽기 시작
            </button>
        `;
    }
    
    console.log(`📊 전체 이야기 녹음 결과 - 텍스트 길이: ${fullStoryRecordedText.length}자`);
    console.log(`📝 녹음된 내용: "${fullStoryRecordedText}"`);
    
    // ✅ 평가 시작 (텍스트 길이 체크)
    if (fullStoryRecordedText && fullStoryRecordedText.trim().length > 0) {
        console.log('✅ 전체 이야기 평가 시작 - 텍스트 있음');
        evaluateFullStoryReading(storyId);
    } else {
        console.error('❌ 녹음된 텍스트 없음');
        const resultEl = document.getElementById('fullStoryEvaluationResult');
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
                        <button class="btn" onclick="startFullStoryRecording(${storyId}, '${escapeQuotes(fullText)}')">
                            🔄 다시 녹음하기
                        </button>
                    </div>
                </div>
            `;
        }
    }
}

async function evaluateFullStoryReading(storyId) {
    const fullText = currentStory.full_text || '';
    const resultEl = document.getElementById('fullStoryEvaluationResult');
    
    console.log(`📊 전체 이야기 평가 시작 - 녹음된 텍스트 길이: ${fullStoryRecordedText.length}`);
    console.log(`📝 녹음된 내용: "${fullStoryRecordedText}"`);
    
    // 로딩 표시
    resultEl.innerHTML = `
        <div class="loading" style="margin-top: 20px;">
            <img src="img/loading.png" alt="Loading" class="loading-image">
            <p>AI가 평가하는 중...</p>
        </div>
    `;
    
    try {
        console.log(`📡 전체 이야기 평가 API 호출: story=${storyId}`);
        console.log(`📝 원문 길이: ${fullText.length}, 녹음 길이: ${fullStoryRecordedText.length}`);
        
        const response = await fetch(`${API_BASE}/story/${storyId}/evaluate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: currentUserId,
                paragraph_num: 0,  // 전체 이야기는 paragraph_num을 0으로 설정
                original_text: fullText,
                user_text: fullStoryRecordedText
            })
        });
        
        console.log(`📡 응답 상태: ${response.status}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ 서버 에러:', errorText);
            throw new Error(`서버 오류 (${response.status})`);
        }
        
        const result = await response.json();
        console.log('✅ 전체 이야기 평가 결과 수신:', result);
        
        if (result.error) {
            throw new Error(result.error);
        }
        
        // 평가 결과 표시
        resultEl.innerHTML = `
            <div class="content-box" style="background: #e8f5e9; border-left: 4px solid #4caf50; margin-top: 16px;">
                <div style="font-size: 20px; font-weight: 700; color: #2e7d32; margin-bottom: 16px;">
                    ✅ 평가 완료
                </div>
                <div style="font-size: 16px; font-weight: 600; color: #333; margin-bottom: 12px;">
                    점수: ${result.score || 0}점
                </div>
                <div style="font-size: 15px; color: #555; line-height: 1.8; margin-bottom: 16px;">
                    ${result.feedback || '평가가 완료되었습니다.'}
                </div>
                ${result.suggestions ? `
                    <div style="background: #fff3cd; padding: 12px; border-radius: 8px; margin-top: 12px;">
                        <div style="font-size: 14px; font-weight: 600; color: #856404; margin-bottom: 8px;">
                            💡 개선 제안:
                        </div>
                        <div style="font-size: 14px; color: #856404; line-height: 1.6;">
                            ${result.suggestions}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
    } catch (error) {
        console.error('❌ 전체 이야기 평가 실패:', error);
        resultEl.innerHTML = `
            <div class="content-box" style="background: #ffebee; border-left: 4px solid #f44336; margin-top: 16px;">
                <div style="font-size: 18px; font-weight: 700; color: #c62828; margin-bottom: 12px;">
                    ❌ 평가 실패
                </div>
                <div style="font-size: 14px; color: #c62828; line-height: 1.8;">
                    ${error.message || '평가 중 오류가 발생했습니다.'}
                </div>
                <button class="btn" onclick="startFullStoryRecording(${storyId}, '${escapeQuotes(fullText)}')" style="margin-top: 12px;">
                    🔄 다시 녹음하기
                </button>
            </div>
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
                    🟡 +${result.coins} 코인 획득!
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
        
        // 문장 연습 미션 진행도 체크 (발음 평가 완료)
        await checkMissionProgress('sentence', 1);
        
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
            
            // 코인 보상 알림 표시
            if (result.coins_awarded && result.coins_awarded.length > 0) {
                // 코인 업데이트
                await loadUserCoins();
                
                // 각 보상 알림 표시
                result.coins_awarded.forEach((reward, index) => {
                    setTimeout(() => {
                        const reasonMap = {
                            'story_completed': '목록 완주',
                            'quiz_bonus': '퀴즈 80점 달성',
                            'pronunciation_bonus': '발음 평가 90점 달성'
                        };
                        const reason = reasonMap[reward.type] || '보상';
                        showCoinEarnedNotification(reward.amount, reason, userCoins);
                    }, index * 500); // 순차적으로 표시
                });
            }
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
        // 프로덕션 환경에서는 아직 API 미배포
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
// [10] 맥락 파악 학습 시스템
// ============================================================================

/**
 * 맥락 파악 모달 표시 (단순화된 버전: 텍스트 입력과 저장만)
 */
function showContextNotesModal() {
    if (!isAuthenticated || !currentUserId) {
        alert('로그인이 필요합니다.');
        window.location.href = 'login.html';
        return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'contextNotesModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        backdrop-filter: blur(5px);
    `;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 20px; padding: 30px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="font-size: 22px; font-weight: 700; color: #333;">📝 맥락 파악하기</h2>
                <button onclick="closeContextNotesModal()" style="background: none; border: none; font-size: 28px; cursor: pointer; color: #999;">&times;</button>
            </div>
            
            <!-- 텍스트 입력 -->
            <div style="margin-bottom: 20px;">
                <label style="display: block; font-size: 14px; color: #666; margin-bottom: 8px; font-weight: 600;">이야기의 맥락을 파악하고 기록해보세요</label>
                <textarea id="contextNotesText" placeholder="예: 이 이야기는 도깨비가 요리를 통해 사람들을 도와주는 내용입니다. 주인공은 요리 실력이 뛰어난 도깨비로, 어려운 사람들을 도와주며 행복을 나눕니다..." style="width: 100%; min-height: 200px; padding: 15px; border: 2px solid #E0E0E0; border-radius: 12px; font-size: 15px; resize: vertical; font-family: inherit; line-height: 1.6;"></textarea>
            </div>
            
            <!-- 액션 버튼 -->
            <div style="display: flex; gap: 12px; margin-top: 25px;">
                <button onclick="closeContextNotesModal()" style="flex: 1; padding: 14px; background: #f0f0f0; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; color: #666;">
                    취소
                </button>
                <button onclick="saveContextNotes()" style="flex: 2; padding: 14px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; border-radius: 10px; font-weight: 700; cursor: pointer; color: white; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                    💾 저장하기
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 모달 배경 클릭 시 닫기
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeContextNotesModal();
    });
}

/**
 * 맥락 파악 모달 닫기
 */
function closeContextNotesModal() {
    const modal = document.getElementById('contextNotesModal');
    if (modal) {
        modal.remove();
    }
}

/**
 * 맥락 파악 수정 모달 표시
 */
function showEditContextNotesModal(noteId, currentText) {
    if (!isAuthenticated || !currentUserId) {
        alert('로그인이 필요합니다.');
        window.location.href = 'login.html';
        return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'editContextNotesModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        backdrop-filter: blur(5px);
    `;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 20px; padding: 30px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="font-size: 22px; font-weight: 700; color: #333;">✏️ 맥락 파악 수정</h2>
                <button onclick="closeEditContextNotesModal()" style="background: none; border: none; font-size: 28px; cursor: pointer; color: #999;">&times;</button>
            </div>
            
            <!-- 텍스트 입력 -->
            <div style="margin-bottom: 20px;">
                <label style="display: block; font-size: 14px; color: #666; margin-bottom: 8px; font-weight: 600;">이야기의 맥락을 파악하고 기록해보세요</label>
                <textarea id="editContextNotesText" placeholder="예: 이 이야기는 도깨비가 요리를 통해 사람들을 도와주는 내용입니다. 주인공은 요리 실력이 뛰어난 도깨비로, 어려운 사람들을 도와주며 행복을 나눕니다..." style="width: 100%; min-height: 200px; padding: 15px; border: 2px solid #E0E0E0; border-radius: 12px; font-size: 15px; resize: vertical; font-family: inherit; line-height: 1.6;">${currentText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')}</textarea>
            </div>
            
            <!-- 액션 버튼 -->
            <div style="display: flex; gap: 12px; margin-top: 25px;">
                <button onclick="closeEditContextNotesModal()" style="flex: 1; padding: 14px; background: #f0f0f0; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; color: #666;">
                    취소
                </button>
                <button onclick="updateContextNotes('${noteId}')" style="flex: 2; padding: 14px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; border-radius: 10px; font-weight: 700; cursor: pointer; color: white; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                    💾 수정 저장
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 모달 배경 클릭 시 닫기
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeEditContextNotesModal();
    });
}

/**
 * 맥락 파악 수정 모달 닫기
 */
function closeEditContextNotesModal() {
    const modal = document.getElementById('editContextNotesModal');
    if (modal) {
        modal.remove();
    }
}

/**
 * 맥락 파악 내용 수정
 */
async function updateContextNotes(noteId) {
    const textInput = document.getElementById('editContextNotesText');
    const contextText = textInput?.value.trim();
    
    if (!contextText) {
        alert('맥락 파악 내용을 입력해주세요.');
        return;
    }
    
    if (!isAuthenticated || !currentUserId) {
        alert('로그인이 필요합니다.');
        window.location.href = 'login.html';
        return;
    }
    
    // 모달 닫기
    closeEditContextNotesModal();
    
    // 로딩 표시 (간단한 토스트 메시지)
    showToast('맥락 파악 내용을 수정하는 중...');
    
    try {
        const response = await fetch(`${API_BASE}/context-notes/${noteId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: currentUserId,
                context_text: contextText
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '수정 실패');
        }
        
        const result = await response.json();
        console.log('✅ 맥락 파악 내용 수정 완료:', result);
        
        // 저장된 맥락 파악 목록 새로고침
        await loadContextNotesPreview();
        
        showToast('맥락 파악 내용이 수정되었습니다!');
    } catch (error) {
        console.error('❌ 맥락 파악 수정 오류:', error);
        alert('수정 중 오류가 발생했습니다: ' + error.message);
    }
}

/**
 * 맥락 파악 내용 삭제
 */
async function deleteContextNotes(noteId) {
    if (!isAuthenticated || !currentUserId) {
        alert('로그인이 필요합니다.');
        window.location.href = 'login.html';
        return;
    }
    
    // 삭제 확인
    if (!confirm('정말로 이 맥락 파악 내용을 삭제하시겠습니까?')) {
        return;
    }
    
    // 로딩 표시 (간단한 토스트 메시지)
    showToast('맥락 파악 내용을 삭제하는 중...');
    
    try {
        const response = await fetch(`${API_BASE}/context-notes/${noteId}?user_id=${currentUserId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '삭제 실패');
        }
        
        const result = await response.json();
        console.log('✅ 맥락 파악 내용 삭제 완료:', result);
        
        // 저장된 맥락 파악 목록 새로고침
        await loadContextNotesPreview();
        
        showToast('맥락 파악 내용이 삭제되었습니다!');
    } catch (error) {
        console.error('❌ 맥락 파악 삭제 오류:', error);
        alert('삭제 중 오류가 발생했습니다: ' + error.message);
    }
}

/**
 * 맥락 파악 내용 저장
 */
async function saveContextNotes() {
    const textInput = document.getElementById('contextNotesText');
    const contextText = textInput?.value.trim();
    
    if (!contextText) {
        alert('맥락 파악 내용을 입력해주세요.');
        return;
    }
    
    if (!isAuthenticated || !currentUserId) {
        alert('로그인이 필요합니다.');
        window.location.href = 'login.html';
        return;
    }
    
    // 모달 닫기
    closeContextNotesModal();
    
    // 로딩 표시 (간단한 토스트 메시지)
    showToast('맥락 파악 내용을 저장하는 중...');
    
    try {
        const response = await fetch(`${API_BASE}/context-notes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: currentUserId,
                context_text: contextText,
                story_id: currentStory?.id || null
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '저장 실패');
        }
        
        const result = await response.json();
        console.log('✅ 맥락 파악 내용 저장 완료:', result);
        
        // 저장된 맥락 파악 목록 새로고침
        await loadContextNotesPreview();
        
        showToast('맥락 파악 내용이 저장되었습니다!');
    } catch (error) {
        console.error('❌ 맥락 파악 저장 오류:', error);
        alert('저장 중 오류가 발생했습니다: ' + error.message);
    }
}

/**
 * 저장된 맥락 파악 내용 미리보기 로드
 */
async function loadContextNotesPreview() {
    const previewEl = document.getElementById('kContentPreview');
    if (!previewEl) return;
    
    if (!isAuthenticated || !currentUserId) {
        previewEl.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">로그인이 필요합니다.</div>';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/context-notes?user_id=${currentUserId}&limit=5`);
        if (!response.ok) {
            throw new Error('조회 실패');
        }
        
        const data = await response.json();
        const notes = data.notes || [];
        
        if (notes.length === 0) {
            previewEl.innerHTML = `
                <div style="text-align: center; color: #999; padding: 20px;">
                    아직 저장된 맥락 파악 내용이 없어요.<br>
                    "맥락 파악하기" 버튼을 눌러 기록해보세요!
                </div>
            `;
            return;
        }
        
        // HTML 이스케이프 함수
        const escapeHtml = (text) => {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        };
        
        previewEl.innerHTML = `
            <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                <h3 style="font-size: 16px; font-weight: 700; color: #333;">
                    저장된 맥락 파악 <span style="background: #667eea; color: white; padding: 2px 8px; border-radius: 10px; font-size: 12px; margin-left: 6px;">${notes.length}개</span>
                </h3>
                <a href="my-k-content.html" style="font-size: 13px; color: #667eea; text-decoration: none; font-weight: 600;">
                    전체 보기 →
                </a>
            </div>
            <div style="display: flex; flex-direction: column; gap: 12px;">
                ${notes.slice(0, 3).map(note => {
                    // 안전한 이스케이프 처리
                    const escapedText = escapeHtml(note.context_text);
                    const safeTextForJs = JSON.stringify(note.context_text).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
                    return `
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 12px; border-left: 4px solid #667eea; position: relative;">
                        <div style="font-size: 13px; color: #666; margin-bottom: 8px;">
                            ${new Date(note.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                        </div>
                        <div style="font-size: 14px; color: #333; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 10px;">
                            ${escapedText}
                        </div>
                        <div style="display: flex; gap: 8px; margin-top: 10px;">
                            <button onclick="showEditContextNotesModal('${note.id}', '${safeTextForJs}')" style="flex: 1; padding: 8px 12px; background: #667eea; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;">
                                ✏️ 수정
                            </button>
                            <button onclick="deleteContextNotes('${note.id}')" style="flex: 1; padding: 8px 12px; background: #e74c3c; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;">
                                🗑️ 삭제
                            </button>
                        </div>
                    </div>
                `;
                }).join('')}
            </div>
            ${notes.length > 3 ? `
                <button onclick="location.href='my-k-content.html'" style="width: 100%; padding: 12px; background: white; border: 2px solid #667eea; color: #667eea; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 14px; margin-top: 8px;">
                    전체 ${notes.length}개 보기 →
                </button>
            ` : ''}
        `;
    } catch (error) {
        console.error('맥락 파악 미리보기 로드 실패:', error);
        previewEl.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">로드 실패</div>';
    }
}

// ============================================================================
// [10-1] K-콘텐츠 학습 시스템 (기존 코드 유지 - 호환성)
// ============================================================================

let kContentRecognition = null;
let kContentRecordedText = '';

function showKContentModal() {
    const modal = document.createElement('div');
    modal.id = 'kContentModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        backdrop-filter: blur(5px);
    `;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 20px; padding: 30px; max-width: 450px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="font-size: 22px; font-weight: 700; color: #333;">🎬 K-콘텐츠로 배우기</h2>
                <button onclick="closeKContentModal()" style="background: none; border: none; font-size: 28px; cursor: pointer; color: #999;">&times;</button>
            </div>
            
            <!-- 입력 방식 선택 탭 -->
            <div style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">
                <button id="textTabBtn" onclick="switchKContentTab('text')" class="k-content-tab-btn active" style="flex: 1; padding: 12px; border: none; background: #667eea; color: white; border-radius: 8px; font-weight: 600; cursor: pointer;">
                    📝 텍스트 입력
                </button>
                <button id="voiceTabBtn" onclick="switchKContentTab('voice')" class="k-content-tab-btn" style="flex: 1; padding: 12px; border: none; background: #f0f0f0; color: #666; border-radius: 8px; font-weight: 600; cursor: pointer;">
                    🎤 음성 녹음
                </button>
            </div>
            
            <!-- 텍스트 입력 탭 -->
            <div id="textInputTab" style="display: block;">
                <textarea id="kContentText" placeholder="K-드라마 대사나 K-POP 가사를 입력하세요...&#10;&#10;예시: 너에게 달려가고 싶어, 지금 당장!" style="width: 100%; min-height: 120px; padding: 15px; border: 2px solid #E0E0E0; border-radius: 12px; font-size: 15px; resize: vertical; font-family: inherit;"></textarea>
            </div>
            
            <!-- 음성 녹음 탭 -->
            <div id="voiceInputTab" style="display: none;">
                <div style="text-align: center; padding: 30px; background: #f8f9fa; border-radius: 12px; border: 2px dashed #ddd;">
                    <div style="font-size: 60px; margin-bottom: 15px;">🎤</div>
                    <p style="font-size: 14px; color: #666; margin-bottom: 15px;">
                        K-드라마 대사나 K-POP 가사를 말해보세요
                    </p>
                    <button id="kContentRecordBtn" onclick="startKContentRecording()" style="padding: 14px 30px; background: #e74c3c; color: white; border: none; border-radius: 25px; font-weight: 700; cursor: pointer; font-size: 15px;">
                        🎤 녹음 시작
                    </button>
                    <div id="kContentRecordingStatus" style="margin-top: 15px; font-size: 13px; color: #888;"></div>
                    <div id="kContentRecordedText" style="margin-top: 15px; padding: 15px; background: white; border-radius: 8px; display: none; text-align: left;">
                        <strong>인식된 텍스트:</strong>
                        <p id="kContentRecognizedText" style="margin-top: 8px; color: #333;"></p>
                    </div>
                </div>
            </div>
            
            <!-- 출처 정보 -->
            <div style="margin-top: 20px;">
                <label style="display: block; font-size: 13px; color: #666; margin-bottom: 6px; font-weight: 600;">콘텐츠 종류</label>
                <select id="kContentType" style="width: 100%; padding: 12px; border: 2px solid #E0E0E0; border-radius: 8px; font-size: 14px; margin-bottom: 12px;">
                    <option value="drama">📺 K-드라마</option>
                    <option value="kpop">🎵 K-POP</option>
                    <option value="variety">🎬 예능</option>
                    <option value="movie">🎥 영화</option>
                    <option value="other">기타</option>
                </select>
                
                <label style="display: block; font-size: 13px; color: #666; margin-bottom: 6px; font-weight: 600;">제목 (선택)</label>
                <input id="kContentTitle" type="text" placeholder="예: DNA, 도깨비" style="width: 100%; padding: 12px; border: 2px solid #E0E0E0; border-radius: 8px; font-size: 14px; margin-bottom: 12px;">
                
                <label style="display: block; font-size: 13px; color: #666; margin-bottom: 6px; font-weight: 600;">아티스트/출연진 (선택)</label>
                <input id="kContentArtist" type="text" placeholder="예: BTS, 공유" style="width: 100%; padding: 12px; border: 2px solid #E0E0E0; border-radius: 8px; font-size: 14px;">
            </div>
            
            <!-- 액션 버튼 -->
            <div style="display: flex; gap: 12px; margin-top: 25px;">
                <button onclick="closeKContentModal()" style="flex: 1; padding: 14px; background: #f0f0f0; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; color: #666;">
                    취소
                </button>
                <button onclick="analyzeKContent()" style="flex: 2; padding: 14px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; border-radius: 10px; font-weight: 700; cursor: pointer; color: white; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                    ✨ 분석하기 →
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 모달 배경 클릭 시 닫기
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeKContentModal();
    });
}

function switchKContentTab(tab) {
    const textTab = document.getElementById('textInputTab');
    const voiceTab = document.getElementById('voiceInputTab');
    const textBtn = document.getElementById('textTabBtn');
    const voiceBtn = document.getElementById('voiceTabBtn');
    
    if (tab === 'text') {
        textTab.style.display = 'block';
        voiceTab.style.display = 'none';
        textBtn.style.background = '#667eea';
        textBtn.style.color = 'white';
        voiceBtn.style.background = '#f0f0f0';
        voiceBtn.style.color = '#666';
    } else {
        textTab.style.display = 'none';
        voiceTab.style.display = 'block';
        textBtn.style.background = '#f0f0f0';
        textBtn.style.color = '#666';
        voiceBtn.style.background = '#667eea';
        voiceBtn.style.color = 'white';
    }
}

function startKContentRecording() {
    const btn = document.getElementById('kContentRecordBtn');
    const status = document.getElementById('kContentRecordingStatus');
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('이 브라우저는 음성 인식을 지원하지 않습니다. Chrome을 사용해주세요.');
        return;
    }
    
    if (kContentRecognition && kContentRecognition.isRecording) {
        // 녹음 중지
        kContentRecognition.stop();
        kContentRecognition.isRecording = false;
        btn.textContent = '🎤 녹음 시작';
        btn.style.background = '#e74c3c';
        status.textContent = '';
        return;
    }
    
    // 녹음 시작
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    kContentRecognition = new SpeechRecognition();
    kContentRecognition.lang = 'ko-KR';
    kContentRecognition.continuous = true;
    kContentRecognition.interimResults = true;
    
    kContentRecordedText = '';
    
    kContentRecognition.onstart = () => {
        kContentRecognition.isRecording = true;
        btn.textContent = '⏹ 녹음 중지';
        btn.style.background = '#95a5a6';
        status.textContent = '🔴 녹음 중... 대사를 말해주세요';
        status.style.color = '#e74c3c';
    };
    
    kContentRecognition.onresult = (event) => {
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
        
        kContentRecordedText = (finalTranscript + interimTranscript).trim();
        
        const recognizedEl = document.getElementById('kContentRecognizedText');
        const recordedBox = document.getElementById('kContentRecordedText');
        
        if (recognizedEl && kContentRecordedText) {
            recognizedEl.textContent = kContentRecordedText;
            recordedBox.style.display = 'block';
        }
    };
    
    kContentRecognition.onerror = (event) => {
        console.error('음성 인식 오류:', event.error);
        status.textContent = '⚠️ 오류 발생: ' + event.error;
        status.style.color = '#e74c3c';
        btn.textContent = '🎤 녹음 시작';
        btn.style.background = '#e74c3c';
        kContentRecognition.isRecording = false;
    };
    
    kContentRecognition.onend = () => {
        if (kContentRecognition.isRecording) {
            status.textContent = '✅ 녹음 완료!';
            status.style.color = '#27ae60';
        }
        kContentRecognition.isRecording = false;
        btn.textContent = '🎤 다시 녹음';
        btn.style.background = '#e74c3c';
    };
    
    kContentRecognition.start();
}

async function analyzeKContent() {
    // 텍스트 또는 음성에서 입력 가져오기
    const textInput = document.getElementById('kContentText');
    const voiceInput = kContentRecordedText;
    const activeTab = document.getElementById('textInputTab').style.display === 'block' ? 'text' : 'voice';
    
    const contentText = activeTab === 'text' ? textInput.value.trim() : voiceInput.trim();
    
    if (!contentText) {
        alert('분석할 텍스트를 입력하거나 녹음해주세요.');
        return;
    }
    
    const contentType = document.getElementById('kContentType').value;
    const sourceTitle = document.getElementById('kContentTitle').value;
    const sourceArtist = document.getElementById('kContentArtist').value;
    
    // 로딩 표시
    showLoadingMessage('AI가 분석 중입니다...');
    closeKContentModal();
    
    try {
        console.log('🎬 K-콘텐츠 분석 API 호출:', contentText);
        
        const response = await fetch(`${API_BASE}/k-content/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: currentUserId,
                content_text: contentText,
                content_type: contentType,
                source_title: sourceTitle,
                source_artist: sourceArtist,
                story_id: currentStory?.id
            })
        });
        
        if (!response.ok) {
            throw new Error(`API 오류: ${response.status}`);
        }
        
        const analysisData = await response.json();
        console.log('✅ K-콘텐츠 분석 완료:', analysisData);
        
        hideLoadingMessage();
        showKContentResult(analysisData, contentText, sourceTitle);
        
        // K-콘텐츠 미션 진행도 체크
        await checkMissionProgress('k_content', 1);
        
        // 코인 지급 (K-콘텐츠 추가 보상)
        await updateCoins(10, 'k_content_added', 'K-콘텐츠 추가');
        showToast('💰 +10 코인 획득!');
        
    } catch (error) {
        console.error('❌ K-콘텐츠 분석 오류:', error);
        hideLoadingMessage();
        alert('분석 중 오류가 발생했습니다: ' + error.message);
    }
}

function showKContentResult(analysis, originalText, sourceTitle) {
    const modal = document.createElement('div');
    modal.id = 'kContentResultModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        backdrop-filter: blur(5px);
    `;
    
    const grammarHTML = (analysis.grammar_patterns || []).map(g => `
        <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 12px; border-left: 4px solid #667eea;">
            <strong style="color: #667eea; font-size: 15px;">${g.pattern}</strong>
            <p style="margin: 8px 0; font-size: 14px; color: #555;">${g.explanation}</p>
            <p style="font-size: 13px; color: #888; font-style: italic;">예: ${g.example}</p>
        </div>
    `).join('');
    
    const vocabHTML = (analysis.vocabulary || []).map(v => `
        <div style="background: #fff3cd; padding: 12px; border-radius: 8px; margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong style="font-size: 15px;">${v.word}</strong>
                <span style="background: ${v.difficulty === 'beginner' ? '#6FCF97' : v.difficulty === 'intermediate' ? '#F59E0B' : '#E74C3C'}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600;">${v.difficulty}</span>
            </div>
            <p style="margin: 8px 0 4px; font-size: 14px; color: #555;">${v.meaning}</p>
        </div>
    `).join('');
    
    const similarStoriesHTML = (analysis.similar_stories || []).map(s => `
        <div onclick="loadStory(${s.story_id}); closeKContentResultModal();" style="background: #e8f4f8; padding: 12px; border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#d1e7f0'" onmouseout="this.style.background='#e8f4f8'">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 600;">${s.story_id}. ${s.title}</span>
                <span style="color: #667eea; font-size: 13px; font-weight: 600;">${s.similarity}% 유사</span>
            </div>
        </div>
    `).join('') || '<p style="text-align: center; color: #999;">추천할 동화가 없습니다.</p>';
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 20px; padding: 30px; max-width: 500px; width: 90%; max-height: 85vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="font-size: 22px; font-weight: 700; color: #333;">✨ 분석 완료!</h2>
                <button onclick="closeKContentResultModal()" style="background: none; border: none; font-size: 28px; cursor: pointer; color: #999;">&times;</button>
            </div>
            
            <!-- 원문 -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px; color: white; margin-bottom: 20px;">
                <div style="font-size: 13px; opacity: 0.9; margin-bottom: 8px;">${sourceTitle || 'K-콘텐츠'}</div>
                <div style="font-size: 17px; line-height: 1.6; font-weight: 500;">"${originalText}"</div>
                <div style="display: flex; gap: 8px; margin-top: 15px; align-items: center;">
                    <span style="background: rgba(255,255,255,0.2); padding: 6px 14px; border-radius: 15px; font-size: 12px; font-weight: 600;">🎯 ${analysis.difficulty_level || '중급'}</span>
                    <span style="background: rgba(255,255,255,0.2); padding: 6px 14px; border-radius: 15px; font-size: 12px; font-weight: 600;">📊 ${analysis.topik_level || 'TOPIK 3급'}</span>
                    <button onclick="togglePlay('kcontent', '${escapeQuotes(originalText)}', this)" style="background: rgba(255,255,255,0.9); color: #667eea; border: none; padding: 8px 16px; border-radius: 15px; font-weight: 700; cursor: pointer; font-size: 13px;">
                        ▶ 듣기
                    </button>
                </div>
            </div>
            
            <!-- 문법 패턴 -->
            <div style="margin-bottom: 25px;">
                <h3 style="font-size: 17px; font-weight: 700; color: #333; margin-bottom: 12px; display: flex; align-items: center;">
                    📚 문법 패턴 <span style="background: #667eea; color: white; padding: 2px 8px; border-radius: 10px; font-size: 12px; margin-left: 8px;">${(analysis.grammar_patterns || []).length}개</span>
                </h3>
                ${grammarHTML || '<p style="text-align: center; color: #999;">문법 패턴 정보가 없습니다.</p>'}
            </div>
            
            <!-- 어휘 분석 -->
            <div style="margin-bottom: 25px;">
                <h3 style="font-size: 17px; font-weight: 700; color: #333; margin-bottom: 12px; display: flex; align-items: center;">
                    📖 핵심 어휘 <span style="background: #F59E0B; color: white; padding: 2px 8px; border-radius: 10px; font-size: 12px; margin-left: 8px;">${(analysis.vocabulary || []).length}개</span>
                </h3>
                ${vocabHTML || '<p style="text-align: center; color: #999;">어휘 정보가 없습니다.</p>'}
            </div>
            
            <!-- 학습 팁 -->
            ${analysis.learning_tips ? `
            <div style="background: #fff3cd; padding: 15px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
                <strong style="color: #856404;">💡 학습 팁</strong>
                <p style="margin-top: 8px; color: #856404; line-height: 1.6; font-size: 14px;">${analysis.learning_tips}</p>
            </div>
            ` : ''}
            
            <!-- 유사한 동화 추천 -->
            <div style="margin-bottom: 20px;">
                <h3 style="font-size: 17px; font-weight: 700; color: #333; margin-bottom: 12px;">
                    🔗 이 표현과 비슷한 동화
                </h3>
                ${similarStoriesHTML}
            </div>
            
            <!-- 액션 버튼 -->
            <div style="display: flex; gap: 10px;">
                <button onclick="startKContentPractice('${escapeQuotes(originalText)}')" style="flex: 1; padding: 14px; background: #27ae60; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; color: white;">
                    🎤 따라 읽기
                </button>
                <button onclick="location.href='my-k-content.html'" style="flex: 1; padding: 14px; background: #667eea; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; color: white;">
                    📚 내 컬렉션
                </button>
                <button onclick="closeKContentResultModal()" style="flex: 1; padding: 14px; background: #f0f0f0; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; color: #666;">
                    ✓ 확인
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 모달 배경 클릭 시 닫기
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeKContentResultModal();
    });
}

function closeKContentModal() {
    const modal = document.getElementById('kContentModal');
    if (modal) modal.remove();
    
    // 음성 인식 중지
    if (kContentRecognition) {
        kContentRecognition.stop();
        kContentRecognition = null;
    }
    kContentRecordedText = '';
}

function closeKContentResultModal() {
    const modal = document.getElementById('kContentResultModal');
    if (modal) modal.remove();
}

function startKContentPractice(text) {
    closeKContentResultModal();
    
    // 읽기 평가 모달 표시
    const modal = document.createElement('div');
    modal.id = 'kContentPracticeModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1001;
    `;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 20px; padding: 40px; max-width: 450px; width: 90%; text-align: center;">
            <h2 style="font-size: 24px; margin-bottom: 20px; color: #333;">🎤 따라 읽기 연습</h2>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin-bottom: 25px;">
                <p style="font-size: 18px; line-height: 1.8; color: #333; font-weight: 500;">"${text}"</p>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
                위 문장을 자연스럽게 읽어주세요<br>
                AI가 발음과 억양을 평가합니다
            </p>
            
            <button id="kContentPracticeBtn" onclick="startKContentPracticeRecording('${escapeQuotes(text)}')" style="padding: 16px 40px; background: #e74c3c; color: white; border: none; border-radius: 25px; font-size: 16px; font-weight: 700; cursor: pointer; margin-bottom: 15px;">
                🎤 녹음 시작
            </button>
            
            <div id="kContentPracticeStatus" style="font-size: 14px; color: #888; min-height: 20px; margin-bottom: 15px;"></div>
            
            <button onclick="closePracticeModal()" style="padding: 12px 30px; background: #f0f0f0; color: #666; border: none; border-radius: 10px; font-weight: 600; cursor: pointer;">
                취소
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

let kPracticeRecognition = null;
let kPracticeText = '';

function startKContentPracticeRecording(originalText) {
    const btn = document.getElementById('kContentPracticeBtn');
    const status = document.getElementById('kContentPracticeStatus');
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('이 브라우저는 음성 인식을 지원하지 않습니다.');
        return;
    }
    
    if (kPracticeRecognition && kPracticeRecognition.isRecording) {
        // 녹음 중지 및 평가
        kPracticeRecognition.stop();
        return;
    }
    
    // 녹음 시작
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    kPracticeRecognition = new SpeechRecognition();
    kPracticeRecognition.lang = 'ko-KR';
    kPracticeRecognition.continuous = false;
    kPracticeRecognition.interimResults = false;
    
    kPracticeText = '';
    
    kPracticeRecognition.onstart = () => {
        kPracticeRecognition.isRecording = true;
        btn.textContent = '⏹ 녹음 중...';
        btn.style.background = '#95a5a6';
        status.textContent = '🔴 녹음 중... 소리 내어 읽어주세요';
        status.style.color = '#e74c3c';
    };
    
    kPracticeRecognition.onresult = async (event) => {
        kPracticeText = event.results[0][0].transcript;
        status.textContent = '✅ 녹음 완료! AI가 평가 중...';
        status.style.color = '#27ae60';
        
        // AI 평가 요청
        await evaluateKContentPractice(originalText, kPracticeText);
    };
    
    kPracticeRecognition.onerror = (event) => {
        console.error('음성 인식 오류:', event.error);
        status.textContent = '⚠️ 오류 발생';
        status.style.color = '#e74c3c';
        btn.textContent = '🎤 다시 녹음';
        btn.style.background = '#e74c3c';
    };
    
    kPracticeRecognition.start();
}

async function evaluateKContentPractice(originalText, userText) {
    try {
        const response = await fetch(`${API_BASE}/story/${currentStory?.id || 1}/evaluate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: currentUserId,
                paragraph_num: 0,  // K-콘텐츠는 0번으로 표시
                original_text: originalText,
                user_text: userText
            })
        });
        
        const result = await response.json();
        
        closePracticeModal();
        
        // 평가 결과 표시
        alert(`🎉 평가 완료!\n\n점수: ${result.score}점\n획득 코인: ${result.coins}개\n\n${result.feedback}`);
        
        // 코인 업데이트
        if (result.total_coins !== undefined) {
            userCoins = result.total_coins;
            updateCoinDisplay();
        }
        
    } catch (error) {
        console.error('평가 오류:', error);
        alert('평가 중 오류가 발생했습니다.');
    }
}

function closePracticeModal() {
    const modal = document.getElementById('kContentPracticeModal');
    if (modal) modal.remove();
    
    if (kPracticeRecognition) {
        kPracticeRecognition.stop();
        kPracticeRecognition = null;
    }
}

async function updateCoins(amount, type, description) {
    try {
        const response = await fetch(`${API_BASE}/user/${currentUserId}/coins`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: amount,
                type: type,
                description: description
            })
        });
        
        const data = await response.json();
        if (data.coins !== undefined) {
            userCoins = data.coins;
            updateCoinDisplay();
        }
    } catch (error) {
        console.log('코인 업데이트 실패:', error);
    }
}

/**
 * 코인으로 목록 접근
 * @param {number} storyId - 목록 ID
 * @param {number} requiredCoins - 필요 코인 수
 */
async function accessStoryWithCoins(storyId, requiredCoins) {
    try {
        // 현재 코인 확인
        const currentCoins = userCoins || 0;
        
        if (currentCoins < requiredCoins) {
            // 코인 부족 모달 표시
            showCoinInsufficientModal(storyId, requiredCoins, currentCoins);
            return;
        }
        
        // 코인 차감 API 호출
        const response = await fetch(`${API_BASE}/user/${currentUserId}/coins`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: -requiredCoins,
                type: 'story_access',
                description: `목록 ${storyId}번 접근`,
                story_id: storyId
            })
        });
        
        const data = await response.json();
        
        if (data.success && data.coins !== undefined) {
            // 코인 업데이트
            userCoins = data.coins;
            localStorage.setItem('userCoins', userCoins.toString());
            updateCoinDisplay();
            
            // 목록 접근 허용
            selectStory(storyId);
            
            // 코인 차감 알림
            showCoinDeductedNotification(requiredCoins, data.coins);
        } else {
            alert('코인 차감 중 오류가 발생했습니다.');
        }
    } catch (error) {
        console.error('코인 차감 오류:', error);
        alert('코인 차감 중 오류가 발생했습니다.');
    }
}

/**
 * 코인 부족 모달 표시
 */
function showCoinInsufficientModal(storyId, requiredCoins, currentCoins) {
    const modal = document.createElement('div');
    modal.id = 'coinInsufficientModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease-out;
    `;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 16px; padding: 32px; max-width: 400px; width: 90%; text-align: center;">
            <h2 style="font-size: 24px; margin-bottom: 16px; color: #333;">코인이 부족합니다! 💰</h2>
            <p style="font-size: 16px; color: #666; margin-bottom: 24px;">
                목록 ${storyId}번에 접근하려면 <strong>${requiredCoins}코인</strong>이 필요합니다.
            </p>
            <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <div style="font-size: 14px; color: #999; margin-bottom: 8px;">현재 코인</div>
                <div style="font-size: 32px; font-weight: bold; color: #f59e0b;">${currentCoins}코인</div>
                <div style="font-size: 14px; color: #999; margin-top: 8px;">필요 코인: ${requiredCoins}코인</div>
            </div>
            <div style="text-align: left; margin-bottom: 24px;">
                <h3 style="font-size: 16px; margin-bottom: 12px; color: #333;">코인 획득 방법:</h3>
                <ul style="list-style: none; padding: 0; margin: 0;">
                    <li style="padding: 8px 0; border-bottom: 1px solid #eee;">✓ 출석 체크: +2코인</li>
                    <li style="padding: 8px 0; border-bottom: 1px solid #eee;">✓ 목록 완주: +3코인</li>
                    <li style="padding: 8px 0; border-bottom: 1px solid #eee;">✓ 퀴즈 80점: +5코인</li>
                    <li style="padding: 8px 0; border-bottom: 1px solid #eee;">✓ 발음 평가 90점: +5코인</li>
                    <li style="padding: 8px 0;">✓ 일일 미션 완료: +5코인</li>
                </ul>
            </div>
            <div style="display: flex; gap: 12px;">
                <button onclick="this.closest('#coinInsufficientModal').remove()" 
                        style="flex: 1; padding: 12px; background: #e5e7eb; border: none; border-radius: 8px; font-size: 16px; cursor: pointer;">
                    닫기
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

/**
 * 접근 제한 모달 표시 (31-50번)
 */
function showAccessRestrictedModal() {
    const modal = document.createElement('div');
    modal.id = 'accessRestrictedModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 16px; padding: 32px; max-width: 400px; width: 90%; text-align: center;">
            <h2 style="font-size: 24px; margin-bottom: 16px; color: #333;">접근 제한 🚫</h2>
            <p style="font-size: 16px; color: #666; margin-bottom: 24px;">
                이 목록은 현재 접근할 수 없습니다.
            </p>
            <button onclick="this.closest('#accessRestrictedModal').remove()" 
                    style="width: 100%; padding: 12px; background: #667eea; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer;">
                확인
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

/**
 * 코인 획득 알림 표시
 */
function showCoinEarnedNotification(amount, reason, totalCoins) {
    const notification = document.createElement('div');
    notification.className = 'coin-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10001;
        animation: slideInRight 0.3s ease-out;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 24px;">💰</span>
            <div>
                <div style="font-size: 18px; font-weight: bold;">+${amount}코인 획득!</div>
                <div style="font-size: 12px; opacity: 0.9;">${reason}</div>
                <div style="font-size: 12px; margin-top: 4px;">보유 코인: ${totalCoins}코인</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // 3초 후 자동 제거
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * 목록별 코인 배지 생성
 */
function getCoinBadge(storyId, userPlan) {
    // 무료 회원만 코인 배지 표시
    if (userPlan !== 'free') {
        return '';
    }
    
    if (storyId === 0 || storyId === 1) {
        return '<span class="coin-badge free">무료</span>';
    } else if (storyId >= 2 && storyId <= 10) {
        return '<span class="coin-badge required">20코인</span>';
    } else if (storyId >= 11 && storyId <= 30) {
        return '<span class="coin-badge required">30코인</span>';
    } else if (storyId >= 31 && storyId <= 50) {
        return '<span class="coin-badge restricted">접근 제한</span>';
    }
    return '';
}

/**
 * 코인 차감 알림 표시
 */
function showCoinDeductedNotification(amount, remainingCoins) {
    const notification = document.createElement('div');
    notification.className = 'coin-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f59e0b;
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10001;
        animation: slideInRight 0.3s ease-out;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 24px;">💸</span>
            <div>
                <div style="font-size: 18px; font-weight: bold;">-${amount}코인 사용</div>
                <div style="font-size: 12px; margin-top: 4px;">보유 코인: ${remainingCoins}코인</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}


// ============================================================================
// [11] 유틸리티
// ============================================================================
function escapeQuotes(str) {
    if (!str) return '';
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, ' ');
}


// ============================================================================
// [12] 인증 관리
// ============================================================================

// 로그인 상태 체크 및 UI 업데이트
async function checkAuthStatus() {
    const accessToken = localStorage.getItem('access_token');
    
    if (!accessToken) {
        // 비로그인 상태
        isAuthenticated = false;
        currentUserId = '00000000-0000-0000-0000-000000000001';  // 테스트 사용자
        updateAuthUI();
        return false;
    }
    
    // ✅ 로그인 직후: localStorage의 정보를 먼저 사용하여 인증 상태 설정
    const cachedUserId = localStorage.getItem('userId');
    const cachedUserEmail = localStorage.getItem('userEmail');
    const cachedDisplayName = localStorage.getItem('displayName');
    const cachedUserPlan = localStorage.getItem('userPlan') || 'free';
    
    if (cachedUserId && cachedDisplayName) {
        // localStorage에 사용자 정보가 있으면 일단 인증 상태로 설정
        isAuthenticated = true;
        currentUserId = cachedUserId;
        currentUserEmail = cachedUserEmail;
        currentDisplayName = cachedDisplayName;
        currentUserPlan = cachedUserPlan;
        updateAuthUI();
        console.log('✅ 로그인 상태 확인 (캐시):', currentDisplayName, `(${currentUserPlan})`);
    }
    
    try {
        // 토큰으로 사용자 정보 확인 (백그라운드 검증)
        const response = await fetch(`${API_BASE}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.user) {
                // 로그인 상태 확인 성공
                isAuthenticated = true;
                currentUserId = data.user.id;
                currentUserEmail = data.user.email;
                currentDisplayName = data.user.display_name;
                currentUserPlan = data.user.plan || 'free';
                
                // localStorage 업데이트
                localStorage.setItem('userId', data.user.id);
                localStorage.setItem('userEmail', data.user.email);
                localStorage.setItem('displayName', data.user.display_name);
                localStorage.setItem('userPlan', currentUserPlan);
                
                updateAuthUI();
                console.log('✅ 로그인 상태 확인 (서버):', currentDisplayName, `(${currentUserPlan})`);
                return true;
            }
        }
        
        // 토큰이 유효하지 않음 (401, 403 등)
        if (response.status === 401 || response.status === 403) {
            console.warn('⚠️ 토큰이 유효하지 않습니다. 로그아웃 처리합니다.');
            logout();
            return false;
        }
        
        // 기타 오류 (500 등) - 네트워크 오류로 간주하고 캐시된 정보 사용
        console.warn('⚠️ 서버 응답 오류:', response.status, '- 캐시된 인증 정보 사용');
        return isAuthenticated; // 캐시된 인증 상태 유지
        
    } catch (error) {
        console.error('인증 확인 오류:', error);
        // 네트워크 오류 등 - 캐시된 정보 사용 (로그인 직후에는 토큰이 있으므로 인증 상태 유지)
        if (cachedUserId && cachedDisplayName) {
            console.log('⚠️ 네트워크 오류로 인해 캐시된 인증 정보를 사용합니다.');
            return isAuthenticated; // 캐시된 인증 상태 유지
        }
        
        // 캐시도 없으면 비로그인 상태
        isAuthenticated = false;
        updateAuthUI();
        return false;
    }
}

// 커뮤니티 접근 체크 및 이동
function checkAuthAndGoToCommunity() {
    const accessToken = localStorage.getItem('access_token');
    const userId = localStorage.getItem('userId');
    
    if (!accessToken || !userId || userId === '00000000-0000-0000-0000-000000000001') {
        alert('커뮤니티 이용을 위해 로그인이 필요합니다.');
        window.location.href = 'login.html';
        return;
    }
    
    // 로그인 상태 확인 후 커뮤니티로 이동
    window.location.href = 'k-community-app/index.html';
}

// 로그인/로그아웃 UI 업데이트
function updateAuthUI() {
    const authBtn = document.getElementById('authBtn');
    const userInfo = document.getElementById('userInfo');
    const adminBtn = document.getElementById('adminBtn');
    
    if (!authBtn) return;
    
    if (isAuthenticated && currentDisplayName) {
        // 로그인 상태
        authBtn.textContent = '로그아웃';
        authBtn.className = 'auth-btn logout';
        authBtn.onclick = handleAuth; // handleAuth 함수 사용 (로그인/로그아웃 통합 처리)
        
        if (userInfo) {
            userInfo.textContent = `👤 ${currentDisplayName}님`;
            userInfo.style.display = 'block';
            userInfo.onclick = () => location.href = 'profile.html';
            userInfo.title = '프로필 보기';
        }
        
        // 관리자 버튼 표시 (bunz5911@gmail.com만)
        if (adminBtn && currentUserEmail === 'bunz5911@gmail.com') {
            adminBtn.style.display = 'block';
        }
    } else {
        // 비로그인 상태
        authBtn.textContent = '로그인';
        authBtn.className = 'auth-btn';
        authBtn.onclick = () => location.href = 'login.html';
        
        if (userInfo) {
            userInfo.style.display = 'none';
        }
        
        // 관리자 버튼 숨김
        if (adminBtn) {
            adminBtn.style.display = 'none';
        }
    }
}

// 로그아웃
function logout() {
    // localStorage 정리
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('displayName');
    localStorage.removeItem('userPlan');
    
    // 상태 초기화
    isAuthenticated = false;
    currentUserId = '00000000-0000-0000-0000-000000000001';
    currentUserEmail = null;
    currentDisplayName = null;
    currentUserPlan = 'free';
    
    // UI 업데이트
    updateAuthUI();
    
    console.log('✅ 로그아웃 완료');
    
    // 홈으로 리다이렉트
    if (window.location.pathname !== '/index.html' && window.location.pathname !== '/') {
        location.href = 'index.html';
    } else {
        // 이미 홈이면 새로고침
        location.reload();
    }
}

// 로그인/로그아웃 버튼 클릭 핸들러
function handleAuth() {
    if (isAuthenticated) {
        logout();
    } else {
        location.href = 'login.html';
    }
}

// 페이지 로드 시 추가 초기화 (메인 초기화 후 실행)
document.addEventListener('DOMContentLoaded', async () => {
    // 인증 상태 체크는 메인 초기화에서 처리됨 (중복 방지)
    
    // 로그인 상태면 출석 체크 상태 확인 (백그라운드)
    setTimeout(async () => {
        if (isAuthenticated) {
            try {
                await checkTodayCheckin();
            } catch (error) {
                console.warn('⚠️ 출석 체크 상태 확인 실패:', error);
            }
        }
    }, 1000); // 1초 후 백그라운드에서 실행
    
    // 네비게이션 바 스크롤 화살표 초기화
    initNavScrollArrows();
});


// ============================================================================
// [14] 네비게이션 바 스크롤 컨트롤
// ============================================================================

// 네비게이션 스크롤 함수
function scrollNav(amount) {
    const navBar = document.getElementById('navBar');
    if (navBar) {
        navBar.scrollLeft += amount;
    }
}

// 스크롤 화살표 표시/숨김 업데이트
function updateScrollArrows() {
    const navBar = document.getElementById('navBar');
    const leftArrow = document.getElementById('scrollLeft');
    const rightArrow = document.getElementById('scrollRight');
    
    if (!navBar || !leftArrow || !rightArrow) return;
    
    const scrollLeft = navBar.scrollLeft;
    const maxScroll = navBar.scrollWidth - navBar.clientWidth;
    
    // 왼쪽 화살표 (맨 왼쪽이면 숨김)
    if (scrollLeft <= 5) {
        leftArrow.classList.add('hidden');
    } else {
        leftArrow.classList.remove('hidden');
    }
    
    // 오른쪽 화살표 (맨 오른쪽이면 숨김)
    if (scrollLeft >= maxScroll - 5) {
        rightArrow.classList.add('hidden');
    } else {
        rightArrow.classList.remove('hidden');
    }
}

// 네비게이션 스크롤 화살표 초기화
function initNavScrollArrows() {
    const navBar = document.getElementById('navBar');
    
    if (navBar) {
        // 스크롤 이벤트 리스너
        navBar.addEventListener('scroll', updateScrollArrows);
        
        // 초기 상태 업데이트
        setTimeout(updateScrollArrows, 100);
        
        // 윈도우 리사이즈 시 업데이트
        window.addEventListener('resize', updateScrollArrows);
    }
}



// ============================================================================
// [13] 출석 체크 & 일일 미션
// ============================================================================

// 오늘 출석 상태 확인
async function checkTodayCheckin() {
    // 로그인하지 않았으면 스킵
    if (!isAuthenticated) return;
    
    // localStorage에서 오늘 출석 여부 확인
    const lastCheckin = localStorage.getItem('lastCheckinDate');
    const today = new Date().toISOString().split('T')[0];
    
    // 오늘 이미 출석했으면 버튼 스타일 변경
    const checkinBtn = document.getElementById('checkinBtn');
    if (checkinBtn) {
        if (lastCheckin === today) {
            checkinBtn.textContent = '✓ 출석완료';
            checkinBtn.style.background = '#95a5a6';
            checkinBtn.style.cursor = 'default';
        }
    }
}

// 출석 체크 모달 표시
async function showCheckinModal() {
    // 로그인하지 않았으면 로그인 요청
    if (!isAuthenticated) {
        alert('로그인이 필요합니다!');
        location.href = 'login.html';
        return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'checkinModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s;
    `;
    
    modal.innerHTML = `
        <div style="background: #1f2937; border-radius: 24px; padding: 40px; max-width: 500px; width: 90%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.5); animation: slideUp 0.3s;">
            <div style="font-size: 64px; margin-bottom: 20px;">📅</div>
            <h2 style="font-size: 24px; font-weight: 800; color: #f9fafb; margin-bottom: 12px;">출석 체크</h2>
            <p style="font-size: 15px; color: #d1d5db; line-height: 1.6; margin-bottom: 32px;">
                매일 출석하고 코인을 받으세요!
            </p>
            
            <div id="checkinContent" style="min-height: 200px;">
                <div style="text-align: center; padding: 40px;">
                    <div class="loading-spinner" style="border: 4px solid #374151; border-top: 4px solid #667eea; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                </div>
            </div>
            
            <button onclick="closeCheckinModal()" style="width: 100%; padding: 12px; background: #374151; color: #f9fafb; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; margin-top: 20px; transition: background 0.2s;">
                닫기
            </button>
        </div>
    `;
    
    // 스피너 애니메이션 추가
    if (!document.getElementById('spinnerAnimation')) {
        const style = document.createElement('style');
        style.id = 'spinnerAnimation';
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(modal);
    
    // 출석 체크 및 미션 로드
    await loadCheckinAndMissions();
}

// 출석 체크 및 미션 로드
async function loadCheckinAndMissions() {
    const contentEl = document.getElementById('checkinContent');
    
    try {
        // 오늘 출석 체크
        const checkinResponse = await fetch(`${API_BASE}/checkin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUserId })
        });
        
        let checkinData = null;
        let alreadyChecked = false;
        
        if (checkinResponse.ok) {
            checkinData = await checkinResponse.json();
        } else {
            const errorData = await checkinResponse.json();
            if (errorData.already_checked) {
                alreadyChecked = true;
            }
        }
        
        // 일일 미션 조회
        const missionsResponse = await fetch(`${API_BASE}/missions/daily?user_id=${currentUserId}`);
        const missionsData = await missionsResponse.json();
        
        // 출석 결과 표시
        if (checkinData && checkinData.success) {
            // 출석 성공
            localStorage.setItem('lastCheckinDate', new Date().toISOString().split('T')[0]);
            
            const bonusText = checkinData.bonus_coins > 0 ? ` (+${checkinData.bonus_coins} 보너스!)` : '';
            
            contentEl.innerHTML = `
                <div style="background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); color: white; padding: 24px; border-radius: 16px; margin-bottom: 24px;">
                    <div style="font-size: 48px; margin-bottom: 12px;">🎉</div>
                    <h3 style="font-size: 20px; font-weight: 800; margin-bottom: 8px;">출석 완료!</h3>
                    <p style="font-size: 32px; font-weight: 800; margin-bottom: 8px;">${checkinData.coins_earned}코인 획득${bonusText}</p>
                    <p style="font-size: 14px; opacity: 0.95;">🔥 ${checkinData.current_streak}일 연속 출석</p>
                </div>
            `;
            
            // 코인 업데이트
            await loadUserCoins();
            
            // 출석 버튼 업데이트
            const checkinBtn = document.getElementById('checkinBtn');
            if (checkinBtn) {
                checkinBtn.textContent = '✓ 출석완료';
                checkinBtn.style.background = '#95a5a6';
                checkinBtn.style.cursor = 'default';
            }
        } else if (alreadyChecked) {
            // 이미 출석함
            contentEl.innerHTML = `
                <div style="background: #374151; padding: 24px; border-radius: 16px; margin-bottom: 24px;">
                    <div style="font-size: 48px; margin-bottom: 12px;">✓</div>
                    <h3 style="font-size: 18px; font-weight: 700; color: #f9fafb;">오늘 이미 출석했습니다</h3>
                    <p style="font-size: 14px; color: #d1d5db; margin-top: 8px;">내일 다시 만나요!</p>
                </div>
            `;
        }
        
        // 일일 미션 표시
        if (missionsData && missionsData.missions) {
            const missionIcons = {
                'vocabulary': '📚',
                'grammar': '✏️',
                'sentence': '💬',
                'k_content': '🎬'
            };
            
            const missionsHTML = missionsData.missions.map(mission => {
                const progress = mission.current_count || 0;
                const target = mission.target_count || 1;
                const percentage = Math.min((progress / target) * 100, 100);
                const completed = mission.completed || false;
                const icon = missionIcons[mission.mission_type] || '📝';
                
                return `
                    <div style="background: ${completed ? '#1e3a2e' : '#374151'}; border: 2px solid ${completed ? '#27ae60' : '#4b5563'}; border-radius: 12px; padding: 16px; margin-bottom: 12px; text-align: left;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="font-size: 24px;">${icon}</span>
                                <div>
                                    <div style="font-size: 15px; font-weight: 700; color: #f9fafb;">${mission.title}</div>
                                    <div style="font-size: 13px; color: #d1d5db;">${mission.description}</div>
                                </div>
                            </div>
                            <div style="font-size: 14px; font-weight: 700; color: ${completed ? '#27ae60' : '#818cf8'};">
                                ${completed ? '✓' : progress + '/' + target}
                            </div>
                        </div>
                        <div style="background: #4b5563; height: 6px; border-radius: 3px; overflow: hidden;">
                            <div style="background: ${completed ? '#27ae60' : '#818cf8'}; width: ${percentage}%; height: 100%; transition: width 0.3s;"></div>
                        </div>
                        <div style="text-align: right; margin-top: 6px;">
                            <span style="font-size: 12px; color: #d1d5db;">🟡 ${mission.coins_reward}코인</span>
                        </div>
                    </div>
                `;
            }).join('');
            
            contentEl.innerHTML += `
                <div style="margin-top: 20px;">
                    <h3 style="font-size: 18px; font-weight: 700; color: #f9fafb; margin-bottom: 16px; text-align: left;">📋 오늘의 미션</h3>
                    ${missionsHTML}
                </div>
            `;
        }
        
    } catch (error) {
        console.error('출석 체크 오류:', error);
        contentEl.innerHTML = `
            <div style="padding: 40px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 16px;">😕</div>
                <p style="color: #ef4444; font-size: 15px;">출석 체크에 실패했습니다</p>
                <p style="color: #d1d5db; font-size: 13px; margin-top: 8px;">잠시 후 다시 시도해주세요</p>
            </div>
        `;
    }
}

// 출석 모달 닫기
function closeCheckinModal() {
    const modal = document.getElementById('checkinModal');
    if (modal) {
        modal.remove();
    }
}

// 미션 자동 완료 검증
async function checkMissionProgress(missionType, count = 1) {
    // 로그인하지 않았으면 스킵
    if (!isAuthenticated) return;
    
    try {
        // 오늘의 미션 조회
        const response = await fetch(`${API_BASE}/missions/daily?user_id=${currentUserId}`);
        const data = await response.json();
        
        if (!data.success || !data.missions) return;
        
        // 해당 타입의 미션 찾기
        const mission = data.missions.find(m => m.mission_type === missionType && !m.completed);
        
        if (!mission) return;
        
        // 미션 진행도 업데이트
        const completeResponse = await fetch(`${API_BASE}/missions/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: currentUserId,
                mission_id: mission.id,
                progress: count
            })
        });
        
        const completeData = await completeResponse.json();
        
        if (completeData.success && completeData.completed) {
            // 미션 완료 알림
            showMissionCompleteNotification(mission.title, completeData.coins_earned);
            
            // 코인 업데이트
            await loadUserCoins();
            
            // 모든 미션 완료 보상 알림
            if (completeData.all_missions_completed) {
                setTimeout(() => {
                    showCoinEarnedNotification(5, '일일 미션 모두 완료', userCoins);
                }, 1000);
            }
        }
        
    } catch (error) {
        console.error('미션 진행도 체크 오류:', error);
    }
}

// 미션 완료 알림
function showMissionCompleteNotification(missionTitle, coins) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 4px 15px rgba(39, 174, 96, 0.4);
        z-index: 9999;
        animation: slideInRight 0.3s ease;
        max-width: 300px;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <div style="font-size: 32px;">✓</div>
            <div>
                <div style="font-size: 14px; font-weight: 700; margin-bottom: 4px;">미션 완료!</div>
                <div style="font-size: 13px; opacity: 0.95;">${missionTitle}</div>
                <div style="font-size: 13px; opacity: 0.95; margin-top: 4px;">🟡 +${coins}코인</div>
            </div>
        </div>
    `;
    
    // 애니메이션 추가
    if (!document.getElementById('slideInRightAnimation')) {
        const style = document.createElement('style');
        style.id = 'slideInRightAnimation';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // 3초 후 제거
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// 피드백 제출 함수
async function submitFeedback() {
    const feedbackInput = document.getElementById('feedbackInput');
    const submitBtn = document.getElementById('feedbackSubmitBtn');
    
    if (!feedbackInput || !submitBtn) return;
    
    const feedbackText = feedbackInput.value.trim();
    
    // 입력 검증
    if (!feedbackText) {
        alert('피드백 내용을 입력해주세요.');
        feedbackInput.focus();
        return;
    }
    
    if (feedbackText.length < 10) {
        alert('피드백은 최소 10자 이상 입력해주세요.');
        feedbackInput.focus();
        return;
    }
    
    // 버튼 비활성화
    submitBtn.disabled = true;
    submitBtn.textContent = '전송 중...';
    
    try {
        const response = await fetch(`${API_BASE}/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: currentUserId || null,
                user_email: currentUserEmail || null,
                user_name: currentDisplayName || null,
                feedback: feedbackText,
                page_url: window.location.href,
                user_agent: navigator.userAgent
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            alert('피드백이 전송되었습니다. 감사합니다!');
            feedbackInput.value = '';
        } else {
            throw new Error(data.error || '피드백 전송에 실패했습니다.');
        }
    } catch (error) {
        console.error('❌ 피드백 전송 오류:', error);
        alert('피드백 전송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
        // 버튼 활성화
        submitBtn.disabled = false;
        submitBtn.textContent = '전송하기';
    }
}

