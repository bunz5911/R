/**
 * K-Context Master - 한국어 동화 학습 앱
 * 순수 JavaScript (No Framework)
 */

const API_BASE = 'http://localhost:8080/api';

// 전역 상태
let currentStories = [];
let currentStory = null;
let currentAnalysis = null;
let currentLevel = '초급';
let currentTab = 'summary';

// 사용자 정보
let currentUserId = localStorage.getItem('userId') || '00000000-0000-0000-0000-000000000001';  // 테스트 사용자
let completedTabs = new Set();  // 완료한 탭 추적

// TTS 설정
let ttsVoice = null;
let allVoices = [];
let selectedVoiceIndex = -1;
let useGoogleTTS = false;  // Google Cloud TTS 사용 여부
let googleTTSVoices = [];  // Google TTS 음성 목록
let selectedGoogleVoice = 'ko-KR-Neural2-A';  // 기본 음성
let currentAudio = null;  // 현재 재생 중인 오디오
let isPlaying = false;  // 재생 상태
let currentPlayingButton = null;  // 현재 재생 버튼
let recognition = null;
let recordedText = '';

// ============================================================================
// [1] 초기화
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    initializeTTS();
    initializeSTT();
    loadGoogleTTSVoices();  // Google TTS 음성 목록 로드
    loadStories();
    setupEventListeners();
    loadVoicePreference();
});

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
// [2] 동화 목록 로드
// ============================================================================
async function loadStories() {
    try {
        const response = await fetch(`${API_BASE}/stories`);
        const data = await response.json();
        currentStories = data.stories;
        renderStoryList();
    } catch (error) {
        document.getElementById('storyList').innerHTML = `
            <div style="color: red; text-align: center; padding: 20px;">
                <p>서버에 연결할 수 없습니다.</p>
                <p style="font-size: 14px; margin-top: 10px;">백엔드 서버가 실행 중인지 확인하세요.</p>
            </div>
        `;
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
    try {
        // 동화 내용 로드
        const storyResponse = await fetch(`${API_BASE}/story/${storyId}`);
        currentStory = await storyResponse.json();

        // 화면 전환
        document.getElementById('storyListView').style.display = 'none';
        document.getElementById('learningView').style.display = 'flex';

        // 학습 데이터 분석 시작
        await analyzeStory(storyId);

    } catch (error) {
        alert('동화를 불러오는데 실패했습니다: ' + error.message);
    }
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
            <div class="spinner"></div>
            <p>AI가 동화를 분석하는 중입니다...</p>
            <p style="font-size: 14px; color: #888; margin-top: 8px;">최초 1회만 소요 (5-10초)</p>
            <p style="font-size: 13px; color: #667eea; margin-top: 4px;">다음부터는 즉시 표시됩니다!</p>
        </div>
    `;

    try {
        const response = await fetch(`${API_BASE}/story/${storyId}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ level: currentLevel })
        });

        if (!response.ok) {
            throw new Error(`서버 오류: ${response.status}`);
        }

        currentAnalysis = await response.json();
        
        if (currentAnalysis.error) {
            throw new Error(currentAnalysis.error);
        }
        
        // 분석 결과를 캐시에 저장
        localStorage.setItem(cacheKey, JSON.stringify(currentAnalysis));
        console.log('💾 분석 결과 캐시 저장 완료');
        
        switchTab('summary'); // 요약 탭 표시
    } catch (error) {
        contentEl.innerHTML = `
            <div style="color: red; padding: 20px; text-align: center;">
                <p>분석 오류: ${error.message}</p>
                <button class="btn" onclick="analyzeStory(${storyId})" style="margin-top: 16px;">
                    다시 시도
                </button>
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
        contentEl.innerHTML = '<div class="loading"><p>학습 데이터를 불러오는 중...</p></div>';
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

function renderParagraphs() {
    const contentEl = document.getElementById('learningContent');
    const paragraphs = currentAnalysis.paragraphs_analysis || [];
    
    if (paragraphs.length === 0) {
        contentEl.innerHTML = '<div class="content-box">문단 분석 데이터가 없습니다.</div>';
        return;
    }

    contentEl.innerHTML = `
        <div class="section-title">문단별 학습</div>
        ${paragraphs.map((p, idx) => `
            <div class="paragraph-item">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                    <span class="paragraph-num">문단 ${p.paragraph_num || idx + 1}</span>
                    <button class="play-btn-circle" id="paraPlayBtn${idx}" onclick="togglePlay('para${idx}', '${escapeQuotes(p.original_text || '')}', this)">
                        ▶
                    </button>
                </div>
                <div style="font-weight: 600;">원문:</div>
                <div style="margin-bottom: 12px;">${p.original_text || ''}</div>
                <div style="font-weight: 600; color: #667eea;">쉬운 표현:</div>
                <div style="margin-bottom: 12px;">${p.simplified_text || ''}</div>
                <div style="font-weight: 600; color: #764ba2;">설명:</div>
                <div>${p.explanation || ''}</div>
            </div>
        `).join('')}
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
                <div class="spinner"></div>
                <p>AI가 퀴즈를 생성하는 중...</p>
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
            <div class="spinner"></div>
            <p>AI가 발음을 평가하는 중...</p>
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
            selectedGoogleVoice = data.default || 'ko-KR-Neural2-A';
            useGoogleTTS = true;  // Google TTS 사용 가능
            console.log('✅ Google Cloud TTS 사용 가능:', googleTTSVoices.length, '개 음성');
            
            // 저장된 음성 설정 로드
            const saved = localStorage.getItem('selectedGoogleVoice');
            if (saved) {
                selectedGoogleVoice = saved;
            }
        }
    } catch (error) {
        console.log('⚠️ Google Cloud TTS 사용 불가, Web Speech API 사용');
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

async function speakText(text) {
    // Google Cloud TTS 사용
    if (useGoogleTTS) {
        await speakWithGoogleTTS(text);
    }
    // Web Speech API fallback
    else {
        speakWithWebSpeech(text);
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
    
    // Google TTS가 사용 가능하면 기본으로 설정
    if (googleTTSVoices.length > 0) {
        useGoogleTTS = true;
        selectedGoogleVoice = 'ko-KR-Neural2-A';  // 기본값
        localStorage.setItem('useGoogleTTS', 'true');
        localStorage.setItem('selectedGoogleVoice', selectedGoogleVoice);
        console.log('✅ Google Cloud TTS Neural2 음성으로 자동 설정');
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
// [10] 유틸리티
// ============================================================================
function escapeQuotes(str) {
    if (!str) return '';
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, ' ');
}

