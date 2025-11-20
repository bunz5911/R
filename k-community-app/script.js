// Supabase 클라이언트 초기화
let supabase = null;
let currentUserId = null;
let currentUserEmail = null;
let currentDisplayName = null;
let isAuthenticated = false;

// Supabase 초기화 함수
function initSupabase() {
    // 메인 앱의 config.js에서 Supabase 설정 가져오기
    if (typeof CONFIG !== 'undefined' && CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY) {
        supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
        console.log('✅ Supabase 클라이언트 초기화 완료');
        return true;
    }
    
    // config.js가 없으면 localStorage에서 가져오기 (메인 앱에서 설정된 경우)
    const supabaseUrl = localStorage.getItem('supabase_url');
    const supabaseKey = localStorage.getItem('supabase_anon_key');
    
    if (supabaseUrl && supabaseKey) {
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
        console.log('✅ Supabase 클라이언트 초기화 완료 (localStorage)');
        return true;
    }
    
    console.warn('⚠️ Supabase 설정을 찾을 수 없습니다. 게시판 기능이 제한됩니다.');
    return false;
}

// 로그인 상태 확인 함수
async function checkAuthStatus() {
    // localStorage에서 메인 앱의 로그인 정보 확인
    const accessToken = localStorage.getItem('access_token');
    const userId = localStorage.getItem('userId');
    const userEmail = localStorage.getItem('userEmail');
    const displayName = localStorage.getItem('displayName');
    
    if (accessToken && userId) {
        isAuthenticated = true;
        currentUserId = userId;
        currentUserEmail = userEmail;
        currentDisplayName = displayName || userEmail?.split('@')[0] || 'User';
        
        // Supabase 세션 설정
        if (supabase) {
            await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: localStorage.getItem('refresh_token') || ''
            });
        }
        
        updateAuthUI();
        return true;
    }
    
    isAuthenticated = false;
    currentUserId = null;
    currentUserEmail = null;
    currentDisplayName = null;
    updateAuthUI();
    return false;
}

// 인증 UI 업데이트
function updateAuthUI() {
    const signInLink = document.getElementById('signInLink');
    const userDisplayName = document.getElementById('userDisplayName');
    
    if (isAuthenticated) {
        if (signInLink) signInLink.style.display = 'none';
        if (userDisplayName) {
            userDisplayName.style.display = 'inline';
            userDisplayName.textContent = currentDisplayName || 'User';
        }
    } else {
        if (signInLink) signInLink.style.display = 'inline';
        if (userDisplayName) userDisplayName.style.display = 'none';
    }
}

const app = {
    state: {
        currentView: 'home',
        currentPost: null,
        onlineUsers: Math.floor(Math.random() * 50) + 120, // Random 120-170
        user: {
            name: 'RAKorean',
            level: 3,
            xp: 450,
            likedPosts: [] // Posts user has liked (Supabase에서 로드)
        }
    },

    data: {
        posts: [
            {
                id: 1,
                tag: 'Culture',
                title: 'Why do Koreans bow?',
                content: 'I noticed people bowing when saying hello. Is there a rule for the angle?',
                fullContent: 'I\'ve been in Korea for 2 months now and I noticed that people bow when greeting each other. Sometimes it\'s just a slight nod, other times it\'s a deeper bow. Is there a specific rule about the angle? Does it depend on age or social status?',
                author: 'Sarah J.',
                likes: 24,
                comments: [
                    { author: 'Kim S.', content: 'Yes! The angle depends on respect level. Deeper bow = more respect.', time: '1h ago' },
                    { author: 'John D.', content: 'I learned that 15° is casual, 30° is formal, and 45° is very formal!', time: '45m ago' },
                    { author: 'Min J.', content: 'Don\'t worry too much! A slight nod is fine for most situations.', time: '20m ago' }
                ],
                time: '2h ago'
            },
            {
                id: 2,
                tag: 'Grammar',
                title: 'Difference between 은/는 and 이/가',
                content: 'This is still so confusing to me! Can someone explain it simply?',
                fullContent: 'I\'ve been studying Korean for 6 months and I still can\'t understand when to use 은/는 vs 이/가. Every explanation I find online is too complicated. Can someone explain this in simple terms with examples?',
                author: 'Mike T.',
                likes: 156,
                comments: [
                    { author: 'Teacher Lee', content: '은/는 is for topics (what you\'re talking about), 이/가 is for subjects (who does the action).', time: '4h ago' },
                    { author: 'Anna K.', content: 'Think of it this way: 나는 학생이에요 (I am a student - topic). 누가 왔어요? 친구가 왔어요 (Who came? Friend came - subject)', time: '3h ago' }
                ],
                time: '5h ago'
            },
            {
                id: 3,
                tag: 'Tips',
                title: 'Best way to memorize vocabulary?',
                content: 'Flashcards aren\'t working for me anymore. Any app suggestions?',
                fullContent: 'I\'ve been using Anki for vocabulary but I feel like I\'m not retaining words well. I can recognize them in flashcards but can\'t use them in conversation. What methods do you use?',
                author: 'Yuki M.',
                likes: 42,
                comments: [
                    { author: 'Chris P.', content: 'Try writing sentences with each word! It helps with context.', time: '12h ago' },
                    { author: 'Soo Y.', content: 'I use the words in real conversations (even if awkward). That\'s the best way!', time: '8h ago' }
                ],
                time: '1d ago'
            },
            {
                id: 4,
                tag: 'Culture',
                title: 'Korean drinking culture explained',
                content: 'What are the etiquette rules when drinking with Koreans?',
                fullContent: 'I\'m going to a company dinner next week and I heard there are specific rules about drinking. Can someone explain the basics?',
                author: 'David L.',
                likes: 89,
                comments: [
                    { author: 'Park M.', content: 'Always pour for others, never yourself! And use two hands when receiving from elders.', time: '2d ago' }
                ],
                time: '2d ago'
            },
            {
                id: 5,
                tag: 'Grammar',
                title: 'When to use 요 ending?',
                content: 'Is it always necessary to add 요 at the end?',
                fullContent: 'Sometimes I hear people drop the 요 ending even in polite conversation. When is it okay to not use it?',
                author: 'Emma W.',
                likes: 67,
                comments: [],
                time: '3d ago'
            }
        ],
        sentences: [
            {
                kr: '안녕하세요, 만나서 반가워요.',
                en: 'Hello, nice to meet you.',
                difficulty: 'Easy'
            },
            {
                kr: '이거 얼마예요?',
                en: 'How much is this?',
                difficulty: 'Easy'
            },
            {
                kr: '한국 음식을 정말 좋아해요.',
                en: 'I really like Korean food.',
                difficulty: 'Medium'
            }
        ],
        kcontentPosts: [
            {
                id: 101,
                tag: 'K-pop',
                title: 'NCT DREAM "Smoothie" lyrics meaning?',
                content: '"Yes, I\'m a smoothie" - What does this mean in Korean context?',
                fullContent: 'I have been listening to NCT DREAM new song "Smoothie" and I am confused about some lyrics. The chorus goes "Yes, I am a smoothie, smoothie, smoothie." I know they are mixing Korean and English, but what is the deeper meaning? Also, there is a line "달콤한 나의 적들을 씹어 삼켜" - can someone explain this metaphor?',
                author: 'Kpop_Learner',
                likes: 234,
                comments: [
                    { author: 'NCTzen_KR', content: '"달콤한 나의 적들을 씹어 삼켜" means "chew and swallow my sweet enemies." It is a metaphor about overcoming haters by turning negativity into strength!', time: '2h ago' },
                    { author: 'Korean_Teacher_Min', content: 'The smoothie metaphor is brilliant! Just like blending different fruits, they are mixing different experiences (good and bad) to become stronger. 씹어 삼키다 (chew and swallow) is a powerful expression in Korean.', time: '1h ago' },
                    { author: 'Mark_Lee_Fan', content: 'Mark rap part "가시밭길 위를 맨발로 걸어왔어" (walked barefoot on a thorny path) is so poetic. It shows their journey was not easy.', time: '45m ago' },
                    { author: 'Linguistics_Nerd', content: 'Fun fact: The word play with "smoothie" sounds like "스무디" in Korean, and they use it to represent blending all their experiences into something sweet!', time: '20m ago' }
                ],
                time: '3h ago'
            },
            {
                id: 102,
                tag: 'K-drama',
                title: 'Understanding "아이고" in different contexts',
                content: 'I hear this in every drama but the meaning seems to change?',
                fullContent: 'In Korean dramas, I constantly hear "아이고" but sometimes it seems like surprise, sometimes pain, sometimes just exasperation. How do I know which meaning it is?',
                author: 'Drama_Addict',
                likes: 178,
                comments: [
                    { author: 'Seoul_Native', content: 'It is all about tone! High pitch = surprise, low groan = pain/tiredness, quick = frustration. Context is everything!', time: '5h ago' },
                    { author: 'Kim_Soo', content: 'My grandma says "아이고" like 50 times a day. It is basically a universal expression for any emotion!', time: '4h ago' }
                ],
                time: '6h ago'
            },
            {
                id: 103,
                tag: 'K-pop',
                title: 'BTS "Spring Day" hidden meanings',
                content: 'Is this song really about the Sewol Ferry tragedy?',
                fullContent: 'I have heard that BTS "Spring Day" has deeper meanings related to Korean history. Can someone explain the symbolism?',
                author: 'ARMY_Forever',
                likes: 445,
                comments: [
                    { author: 'History_Buff', content: 'While BTS never confirmed it, many Koreans interpret it as a tribute. The yellow ribbons, the imagery of waiting - it all connects.', time: '1d ago' },
                    { author: 'Poetry_Lover', content: 'The line "보고 싶다" (I miss you) hits different when you understand the cultural context of longing and loss in Korean society.', time: '1d ago' }
                ],
                time: '1d ago'
            },
            {
                id: 104,
                tag: 'K-drama',
                title: 'Why do characters in dramas always eat ramyeon?',
                content: 'Is "ramyeon" code for something else?',
                fullContent: 'In every K-drama, when someone asks "Do you want to come up for ramyeon?" it seems like it means more than just eating noodles. What is the cultural context here?',
                author: 'Curious_Viewer',
                likes: 312,
                comments: [
                    { author: 'Korean_Culture_101', content: 'Haha yes! "라면 먹고 갈래?" (Want to eat ramyeon?) is often used as a subtle invitation to spend more time together, sometimes with romantic implications', time: '2d ago' },
                    { author: 'Seoul_Student', content: 'But sometimes it literally just means ramyeon! You have to read the situation', time: '2d ago' }
                ],
                time: '2d ago'
            },
            {
                id: 105,
                tag: 'K-pop',
                title: 'NewJeans "Ditto" - What does the title mean?',
                content: 'Is "ditto" a Korean word or English?',
                fullContent: 'NewJeans song "Ditto" - I know "ditto" means "same" in English, but how does it relate to the Korean lyrics "똑같은 마음"?',
                author: 'NewJeans_Stan',
                likes: 189,
                comments: [
                    { author: 'Bilingual_Teacher', content: '"Ditto" and "똑같은" both mean "same"! They are playing with bilingual wordplay. The song is about mutual feelings.', time: '3d ago' }
                ],
                time: '3d ago'
            }
        ]
    },

    async init() {
        // Supabase 초기화
        initSupabase();
        
        // 로그인 상태 확인
        await checkAuthStatus();
        
        this.cacheDOM();
        this.bindEvents();
        await this.loadPostsFromSupabase(); // Supabase에서 게시글 로드
        this.renderView('home');
        this.startOnlineUserSimulation();
    },

    startOnlineUserSimulation() {
        // Simulate online user count changes
        setInterval(() => {
            const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
            this.state.onlineUsers = Math.max(100, Math.min(200, this.state.onlineUsers + change));
            this.updateOnlineUserCount();
        }, 5000); // Update every 5 seconds
    },

    updateOnlineUserCount() {
        // 클래스 기반으로 모든 온라인 사용자 카운터 업데이트
        const counters = document.querySelectorAll('.online-users-count');
        counters.forEach(counter => {
            counter.textContent = this.state.onlineUsers;
        });
    },

    cacheDOM() {
        this.container = document.getElementById('view-container');
        this.navLinks = document.querySelectorAll('.nav-links li');
    },

    bindEvents() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = link.dataset.view;
                this.handleNavClick(link, view);
            });
        });
    },

    async handleNavClick(activeLink, viewName) {
        // Update Active State
        this.navLinks.forEach(l => l.classList.remove('active'));
        activeLink.classList.add('active');

        // Reset post detail view
        this.state.currentPost = null;

        // Render View
        await this.renderView(viewName);
    },

    async handlePostClick(postId) {
        // Search in both regular posts and K-content posts
        let post = this.data.posts.find(p => p.id === postId);
        if (!post) {
            post = this.data.kcontentPosts.find(p => p.id === postId);
        }

        if (post) {
            // 댓글 로드 (아직 로드되지 않은 경우)
            if (!post.comments || post.comments.length === 0) {
                await this.loadCommentsForPost(postId);
                post = this.data.posts.find(p => p.id === postId) || this.data.kcontentPosts.find(p => p.id === postId);
            }
            
            this.state.currentPost = post;
            this.renderPostDetail(post);
        }
    },

    async handleLikeClick(postId) {
        if (!isAuthenticated || !currentUserId) {
            alert('로그인이 필요합니다.');
            window.location.href = '../login.html';
            return;
        }
        
        // Search in both regular posts and K-content posts
        let post = this.data.posts.find(p => p.id === postId);
        if (!post) {
            post = this.data.kcontentPosts.find(p => p.id === postId);
        }
        if (!post) return;

        const isLiked = this.state.user.likedPosts.includes(postId);

        try {
            if (isLiked) {
                // Unlike - Supabase에서 삭제
                if (supabase) {
                    const { error } = await supabase
                        .from('community_likes')
                        .delete()
                        .eq('post_id', postId)
                        .eq('user_id', currentUserId);
                    
                    if (error) throw error;
                }
                
                this.state.user.likedPosts = this.state.user.likedPosts.filter(id => id !== postId);
                post.likes = Math.max(0, post.likes - 1);
            } else {
                // Like - Supabase에 추가
                if (supabase) {
                    const { error } = await supabase
                        .from('community_likes')
                        .insert({
                            post_id: postId,
                            user_id: currentUserId
                        });
                    
                    if (error) throw error;
                }
                
                this.state.user.likedPosts.push(postId);
                post.likes++;
            }

            // Re-render current view
            if (this.state.currentPost && this.state.currentPost.id === postId) {
                this.renderPostDetail(post);
            } else {
                this.renderView(this.state.currentView);
            }
        } catch (error) {
            console.error('❌ 좋아요 처리 실패:', error);
            alert('좋아요 처리 중 오류가 발생했습니다.');
        }
    },

    async handleCommentSubmit(postId, commentText) {
        if (!isAuthenticated || !currentUserId) {
            alert('로그인이 필요합니다.');
            window.location.href = '../login.html';
            return;
        }
        
        if (!commentText.trim()) {
            alert('댓글 내용을 입력해주세요.');
            return;
        }
        
        // Search in both regular posts and K-content posts
        let post = this.data.posts.find(p => p.id === postId);
        if (!post) {
            post = this.data.kcontentPosts.find(p => p.id === postId);
        }
        if (!post) return;

        try {
            // Supabase에 댓글 추가
            if (supabase) {
                const { data, error } = await supabase
                    .from('community_comments')
                    .insert({
                        post_id: postId,
                        user_id: currentUserId,
                        content: commentText.trim()
                    })
                    .select(`
                        *,
                        profiles:user_id (
                            display_name,
                            email
                        )
                    `)
                    .single();
                
                if (error) throw error;
                
                // 댓글 추가
                post.comments.push({
                    author: data.profiles?.display_name || data.profiles?.email?.split('@')[0] || currentDisplayName || 'User',
                    content: data.content,
                    time: 'Just now'
                });
            } else {
                // Supabase가 없으면 로컬에만 추가
                post.comments.push({
                    author: currentDisplayName || 'User',
                    content: commentText.trim(),
                    time: 'Just now'
                });
            }

            this.renderPostDetail(post);
            
            // 댓글 입력 필드 초기화
            const commentInput = document.getElementById('comment-input');
            if (commentInput) commentInput.value = '';
        } catch (error) {
            console.error('❌ 댓글 작성 실패:', error);
            alert('댓글 작성 중 오류가 발생했습니다.');
        }
    },

    async renderView(viewName) {
        this.container.innerHTML = ''; // Clear current view
        this.container.classList.remove('fade-in');
        void this.container.offsetWidth; // Trigger reflow
        this.container.classList.add('fade-in');
        
        // 현재 뷰 업데이트
        this.state.currentView = viewName;

        switch (viewName) {
            case 'home':
                this.renderHome();
                break;
            case 'sentences':
                this.renderSentences();
                break;
            case 'pronunciation':
                this.renderPronunciation();
                break;
            case 'grammar':
            case 'tips':
            case 'culture':
            case 'kcontent':
                this.renderFeed(viewName); // Re-use feed layout for these
                break;
            default:
                this.renderHome();
        }
    },

    renderHome() {
        const html = `
            <div class="section hero" style="background-image: url('img/header.png'); background-size: cover; background-position: center; background-repeat: no-repeat; position: relative; min-height: 500px;">
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.4);"></div>
                <div class="hero-content" style="position: relative; z-index: 2; padding-top: 50px;">
                    <h1 class="typography-headline" style="color: white; text-shadow: 0 2px 10px rgba(0,0,0,0.5);">Welcome back, ${this.state.user.name}!</h1>
                    <p class="typography-intro" style="color: rgba(255,255,255,0.9); text-shadow: 0 1px 5px rgba(0,0,0,0.5);">Ready to continue your daily streak? You're doing great!</p>
                    <button class="button" style="margin-top: 30px;" aria-label="Start Daily Practice">
                        Start Daily Practice
                    </button>
                </div>
            </div>

            <div class="section-content" style="padding-top: 17px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px;">
                    <h2 class="typography-headline-reduced">Trending Discussions</h2>
                    <div style="display: flex; align-items: center; gap: 8px; color: var(--text-secondary); font-size: 14px;">
                        <div style="width: 8px; height: 8px; background: #30d158; border-radius: 50%; animation: pulse 2s infinite;" aria-hidden="true"></div>
                        <span><span class="online-users-count">${this.state.onlineUsers}</span> online now</span>
                    </div>
                </div>
                <div class="grid-3-up">
                    ${this.data.posts.slice(0, 6).map(post => this.createPostCard(post)).join('')}
                </div>
            </div>
        `;
        this.container.innerHTML = html;
        this.bindPostEvents();
    },

    renderSentences() {
        const html = `
            <div class="section-content">
                <h2 class="typography-headline-reduced">Sentence Practice</h2>
                <p class="typography-intro" style="margin-bottom: 40px;">Master Korean sentences with native audio.</p>
                
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    ${this.data.sentences.map(s => `
                        <div class="sentence-card">
                            <span class="tag">${s.difficulty}</span>
                            <div class="sentence-kr">${s.kr}</div>
                            <div class="sentence-en">${s.en}</div>
                            <div class="controls">
                                <button class="icon-btn primary" aria-label="음성 재생"><i class="ph-fill ph-speaker-high" aria-hidden="true"></i></button>
                                <button class="icon-btn" aria-label="음성 녹음"><i class="ph-fill ph-microphone" aria-hidden="true"></i></button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        this.container.innerHTML = html;
    },

    renderPronunciation() {
        this.container.innerHTML = `
            <div class="section-content pronunciation-container">
                <h2 class="typography-headline-reduced">Pronunciation Lab</h2>
                <p class="typography-intro" style="margin-bottom: 60px;">Record your voice and get AI feedback on your intonation.</p>
                
                <div class="record-btn-wrapper">
                    <div class="record-ripple"></div>
                    <button class="record-btn" aria-label="음성 녹음 시작">
                        <i class="ph-fill ph-microphone" aria-hidden="true"></i>
                    </button>
                </div>
                <p class="typography-body">Tap to Record</p>
            </div>
        `;
    },

    renderFeed(category) {
        const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1);

        // Determine which posts to show
        let postsToShow;
        if (category === 'kcontent') {
            // K-content 카테고리
            postsToShow = this.data.posts.filter(p => 
                p.tag === 'K-pop' || p.tag === 'K-drama'
            );
            if (postsToShow.length === 0) {
                postsToShow = this.data.kcontentPosts; // 하드코딩된 데이터 fallback
            }
        } else {
            // 카테고리 매핑
            const categoryMapping = {
                'culture': 'Culture',
                'grammar': 'Grammar',
                'tips': 'Tips',
                'sentences': 'Sentences',
                'speaking': 'Speaking'
            };
            
            const targetTag = categoryMapping[category];
            postsToShow = this.data.posts.filter(p => p.tag === targetTag);
            
            // 필터링된 게시글이 없으면 모든 게시글 표시
            if (postsToShow.length === 0) {
                postsToShow = this.data.posts;
            }
        }

        const displayTitle = category === 'kcontent' ? 'K-content' : categoryTitle;

        const html = `
            <div class="section-content">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px;">
                    <div>
                        <h2 class="typography-headline-reduced">${displayTitle} Community</h2>
                        <div style="display: flex; align-items: center; gap: 8px; color: var(--text-secondary); font-size: 14px; margin-top: 8px;">
                            <div style="width: 8px; height: 8px; background: #30d158; border-radius: 50%; animation: pulse 2s infinite;" aria-hidden="true"></div>
                            <span><span class="online-users-count">${this.state.onlineUsers}</span> online now</span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <span class="tag hot">Hot</span>
                        <span class="tag new">New</span>
                        ${isAuthenticated ? `
                            <button class="button" onclick="app.showCreatePostModal('${category}')" style="padding: 8px 16px; font-size: 14px;">
                                <i class="ph ph-plus" style="margin-right: 4px;"></i> 새 게시글
                            </button>
                        ` : ''}
                    </div>
                </div>
                <div class="grid-3-up">
                    ${postsToShow.length > 0 ? postsToShow.map(post => this.createPostCard(post)).join('') : `
                        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                            <p style="font-size: 18px; margin-bottom: 20px;">아직 게시글이 없습니다.</p>
                            ${isAuthenticated ? `
                                <button class="button" onclick="app.showCreatePostModal('${category}')">
                                    첫 게시글 작성하기
                                </button>
                            ` : `
                                <p style="font-size: 14px;">게시글을 작성하려면 <a href="../login.html" style="color: var(--c-blue-light);">로그인</a>이 필요합니다.</p>
                            `}
                        </div>
                    `}
                </div>
            </div>
        `;
        this.container.innerHTML = html;
        this.bindPostEvents();
    },

    createPostCard(post) {
        const isLiked = this.state.user.likedPosts.includes(post.id);
        const commentCount = Array.isArray(post.comments) ? post.comments.length : (post.comments || 0);
        // post.id를 문자열로 변환 (UUID는 문자열)
        const postId = String(post.id);

        return `
            <div class="card post-card" data-post-id="${postId}" style="cursor: pointer;">
                    <div class="card-header">
                    <span class="tag">${post.tag}</span>
                    <button class="icon-btn-menu" aria-label="더보기 메뉴" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 4px;">
                        <i class="ph-fill ph-dots-three" aria-hidden="true"></i>
                    </button>
                </div>
                <h3 class="typography-label" style="margin-bottom: 8px;">${post.title}</h3>
                <p class="typography-body" style="margin-bottom: 20px; flex-grow: 1;">${post.content}</p>
                <div class="card-footer">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 24px; height: 24px; background: #333; border-radius: 50%; overflow: hidden;">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author}" alt="${post.author}의 프로필 이미지" style="width: 100%; height: 100%;">
                        </div>
                        <span style="font-size: 12px; color: var(--text-secondary);">${post.author}</span>
                    </div>
                    <div class="card-stats">
                        <button class="like-btn" data-post-id="${postId}" aria-label="${isLiked ? '좋아요 취소' : '좋아요'}" style="background: none; border: none; cursor: pointer; color: ${isLiked ? '#ff3b30' : 'inherit'}; padding: 0; display: flex; align-items: center; gap: 4px;">
                            <i class="${isLiked ? 'ph-fill' : 'ph'} ph-heart" aria-hidden="true"></i> ${post.likes}
                        </button>
                        <span aria-label="${commentCount}개의 댓글"><i class="ph-fill ph-chat-circle" aria-hidden="true"></i> ${commentCount}</span>
                    </div>
                </div>
            </div>
        `;
    },

    renderPostDetail(post) {
        const isLiked = this.state.user.likedPosts.includes(post.id);
        // post.id를 문자열로 변환 (UUID는 문자열)
        const postId = String(post.id);

        const html = `
            <div class="section-content">
                <button class="button secondary" onclick="app.renderView(app.state.currentView)" style="margin-bottom: 20px; padding: 8px 16px;" aria-label="뒤로 가기">
                    <i class="ph ph-arrow-left" aria-hidden="true"></i> Back
                </button>
                
                <div class="card" style="max-width: 800px; margin: 0 auto;">
                    <div class="card-header">
                        <span class="tag">${post.tag}</span>
                        <span style="font-size: 12px; color: var(--text-secondary);">${post.time}</span>
                    </div>
                    
                    <h1 class="typography-headline-reduced" style="margin: 20px 0;">${post.title}</h1>
                    
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <div style="width: 40px; height: 40px; background: #333; border-radius: 50%; overflow: hidden;">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author}" alt="${post.author}의 프로필 이미지" style="width: 100%; height: 100%;">
                        </div>
                        <div>
                            <div style="font-weight: 600; color: var(--text-primary);">${post.author}</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">${post.time}</div>
                        </div>
                    </div>
                    
                    <p class="typography-body" style="font-size: 19px; line-height: 1.6; color: var(--text-primary); margin-bottom: 30px;">
                        ${post.fullContent}
                    </p>
                    
                    <div style="display: flex; gap: 20px; padding: 20px 0; border-top: 1px solid rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <button class="like-btn" data-post-id="${postId}" aria-label="${isLiked ? '좋아요 취소' : '좋아요'}" style="background: none; border: none; color: ${isLiked ? '#ff3b30' : 'var(--text-secondary)'}; cursor: pointer; font-size: 16px; display: flex; align-items: center; gap: 8px; transition: color 0.2s;">
                            <i class="${isLiked ? 'ph-fill' : 'ph'} ph-heart" style="font-size: 24px;" aria-hidden="true"></i>
                            <span>${post.likes} likes</span>
                        </button>
                        <div style="color: var(--text-secondary); font-size: 16px; display: flex; align-items: center; gap: 8px;" aria-label="${post.comments.length}개의 댓글">
                            <i class="ph-fill ph-chat-circle" style="font-size: 24px;" aria-hidden="true"></i>
                            <span>${post.comments.length} comments</span>
                        </div>
                    </div>
                    
                    <div style="margin-top: 40px;">
                        <h3 class="typography-label" style="margin-bottom: 20px;">Comments</h3>
                        
                        ${post.comments.map(comment => `
                            <div style="padding: 20px; background: rgba(255,255,255,0.03); border-radius: 12px; margin-bottom: 12px;">
                                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                                    <div style="width: 32px; height: 32px; background: #333; border-radius: 50%; overflow: hidden;">
                                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author}" alt="${comment.author}의 프로필 이미지" style="width: 100%; height: 100%;">
                                    </div>
                                    <div>
                                        <div style="font-weight: 600; font-size: 14px;">${comment.author}</div>
                                        <div style="font-size: 12px; color: var(--text-secondary);">${comment.time}</div>
                                    </div>
                                </div>
                                <p style="color: var(--text-primary); line-height: 1.5;">${comment.content}</p>
                            </div>
                        `).join('')}
                        
                        <div style="margin-top: 30px;">
                            <textarea id="comment-input" placeholder="Add a comment..." aria-label="댓글 입력" style="width: 100%; min-height: 100px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 16px; color: var(--text-primary); font-size: 15px; font-family: inherit; resize: vertical;"></textarea>
                            <button class="button" id="comment-submit-btn" style="margin-top: 12px;" aria-label="댓글 게시">
                                Post Comment
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.container.innerHTML = html;
        this.bindPostEvents();
        
        // 댓글 작성 버튼 이벤트 바인딩
        const commentSubmitBtn = document.getElementById('comment-submit-btn');
        if (commentSubmitBtn) {
            commentSubmitBtn.addEventListener('click', () => {
                const commentInput = document.getElementById('comment-input');
                if (commentInput) {
                    this.handleCommentSubmit(postId, commentInput.value);
                }
            });
        }
    },

    // Supabase에서 게시글 로드
    async loadPostsFromSupabase() {
        if (!supabase) {
            console.warn('⚠️ Supabase가 초기화되지 않아 하드코딩된 데이터를 사용합니다.');
            return;
        }
        
        try {
            // 모든 게시글 가져오기
            const { data: posts, error } = await supabase
                .from('community_posts')
                .select(`
                    *,
                    profiles:user_id (
                        display_name,
                        email
                    )
                `)
                .order('created_at', { ascending: false })
                .limit(100);
            
            if (error) throw error;
            
            // 데이터 변환
            if (posts && posts.length > 0) {
                this.data.posts = posts.map(post => ({
                    id: post.id,
                    tag: this.mapCategoryToTag(post.category),
                    title: post.title,
                    content: post.content.length > 100 ? post.content.substring(0, 100) + '...' : post.content,
                    fullContent: post.content,
                    author: post.profiles?.display_name || post.profiles?.email?.split('@')[0] || 'Anonymous',
                    likes: post.likes_count || 0,
                    comments: [], // 댓글은 별도로 로드
                    time: this.formatTimeAgo(post.created_at)
                }));
                
                // 각 게시글의 댓글 로드
                for (let post of this.data.posts) {
                    await this.loadCommentsForPost(post.id);
                }
                
                // 사용자가 좋아요한 게시글 로드
                if (isAuthenticated && currentUserId) {
                    await this.loadUserLikes();
                }
                
                console.log(`✅ Supabase에서 ${this.data.posts.length}개 게시글 로드 완료`);
            } else {
                console.log('ℹ️ Supabase에 게시글이 없습니다. 하드코딩된 예시 데이터를 사용합니다.');
                // Supabase에 게시글이 없으면 하드코딩된 데이터 유지
            }
        } catch (error) {
            console.error('❌ 게시글 로드 실패:', error);
            console.log('⚠️ 하드코딩된 예시 데이터를 사용합니다.');
            // 에러 발생 시 하드코딩된 데이터 사용
        }
    },
    
    // 카테고리를 태그로 매핑
    mapCategoryToTag(category) {
        const mapping = {
            'grammar': 'Grammar',
            'culture': 'Culture',
            'tips': 'Tips',
            'kcontent': 'K-pop',
            'sentences': 'Sentences',
            'speaking': 'Speaking'
        };
        return mapping[category] || 'General';
    },
    
    // 태그를 카테고리로 매핑
    mapTagToCategory(tag) {
        const mapping = {
            'Grammar': 'grammar',
            'Culture': 'culture',
            'Tips': 'tips',
            'K-pop': 'kcontent',
            'K-drama': 'kcontent',
            'Sentences': 'sentences',
            'Speaking': 'speaking'
        };
        return mapping[tag] || 'grammar';
    },
    
    // 게시글의 댓글 로드
    async loadCommentsForPost(postId) {
        if (!supabase) return;
        
        try {
            const { data: comments, error } = await supabase
                .from('community_comments')
                .select(`
                    *,
                    profiles:user_id (
                        display_name,
                        email
                    )
                `)
                .eq('post_id', postId)
                .order('created_at', { ascending: true });
            
            if (error) throw error;
            
            // 해당 게시글 찾아서 댓글 추가
            const post = this.data.posts.find(p => p.id === postId);
            if (post && comments) {
                post.comments = comments.map(comment => ({
                    author: comment.profiles?.display_name || comment.profiles?.email?.split('@')[0] || 'Anonymous',
                    content: comment.content,
                    time: this.formatTimeAgo(comment.created_at)
                }));
            }
        } catch (error) {
            console.error(`❌ 댓글 로드 실패 (postId: ${postId}):`, error);
        }
    },
    
    // 사용자가 좋아요한 게시글 로드
    async loadUserLikes() {
        if (!supabase || !isAuthenticated || !currentUserId) return;
        
        try {
            const { data: likes, error } = await supabase
                .from('community_likes')
                .select('post_id')
                .eq('user_id', currentUserId);
            
            if (error) throw error;
            
            if (likes) {
                this.state.user.likedPosts = likes.map(like => like.post_id);
            }
        } catch (error) {
            console.error('❌ 좋아요 로드 실패:', error);
        }
    },
    
    // 시간 포맷팅
    formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    },
    
    // 게시글 작성 모달 표시
    showCreatePostModal(category) {
        if (!isAuthenticated || !currentUserId) {
            alert('로그인이 필요합니다.');
            window.location.href = '../login.html';
            return;
        }
        
        const categoryTitle = category === 'kcontent' ? 'K-content' : category.charAt(0).toUpperCase() + category.slice(1);
        
        const modal = document.createElement('div');
        modal.id = 'createPostModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(10px);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        `;
        
        modal.innerHTML = `
            <div style="background: var(--bg-card); border-radius: 18px; padding: 40px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto; border: 1px solid rgba(255,255,255,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                    <h2 class="typography-headline-reduced" style="margin: 0;">새 게시글 작성</h2>
                    <button onclick="document.getElementById('createPostModal').remove()" style="background: none; border: none; color: var(--text-secondary); font-size: 24px; cursor: pointer; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
                        <i class="ph ph-x"></i>
                    </button>
                </div>
                
                <form id="createPostForm" onsubmit="app.handleCreatePost(event, '${category}'); return false;">
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; color: var(--text-secondary); font-size: 14px;">카테고리</label>
                        <div style="display: inline-block; padding: 8px 16px; background: rgba(255,255,255,0.1); border-radius: 8px; color: var(--text-primary);">
                            ${categoryTitle}
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label for="postTitle" style="display: block; margin-bottom: 8px; color: var(--text-secondary); font-size: 14px;">제목</label>
                        <input 
                            type="text" 
                            id="postTitle" 
                            required
                            style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: var(--text-primary); font-size: 16px; font-family: inherit;"
                            placeholder="게시글 제목을 입력하세요"
                        />
                    </div>
                    
                    <div style="margin-bottom: 30px;">
                        <label for="postContent" style="display: block; margin-bottom: 8px; color: var(--text-secondary); font-size: 14px;">내용</label>
                        <textarea 
                            id="postContent" 
                            required
                            rows="10"
                            style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: var(--text-primary); font-size: 15px; font-family: inherit; resize: vertical;"
                            placeholder="게시글 내용을 입력하세요"
                        ></textarea>
                    </div>
                    
                    <div style="display: flex; gap: 12px; justify-content: flex-end;">
                        <button 
                            type="button" 
                            onclick="document.getElementById('createPostModal').remove()"
                            class="button secondary"
                            style="padding: 12px 24px;"
                        >
                            취소
                        </button>
                        <button 
                            type="submit" 
                            class="button"
                            style="padding: 12px 24px;"
                        >
                            게시하기
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 모달 외부 클릭 시 닫기
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    },
    
    // 게시글 작성 처리
    async handleCreatePost(event, category) {
        event.preventDefault();
        
        if (!isAuthenticated || !currentUserId) {
            alert('로그인이 필요합니다.');
            return;
        }
        
        const title = document.getElementById('postTitle').value.trim();
        const content = document.getElementById('postContent').value.trim();
        
        if (!title || !content) {
            alert('제목과 내용을 모두 입력해주세요.');
            return;
        }
        
        // 카테고리 매핑
        const categoryMapping = {
            'grammar': 'grammar',
            'culture': 'culture',
            'tips': 'tips',
            'kcontent': 'kcontent',
            'sentences': 'sentences',
            'speaking': 'speaking'
        };
        
        const dbCategory = categoryMapping[category] || 'grammar';
        
        try {
            if (!supabase) {
                alert('Supabase가 초기화되지 않았습니다.');
                return;
            }
            
            // 게시글 작성
            const { data: newPost, error } = await supabase
                .from('community_posts')
                .insert({
                    user_id: currentUserId,
                    category: dbCategory,
                    title: title,
                    content: content
                })
                .select(`
                    *,
                    profiles:user_id (
                        display_name,
                        email
                    )
                `)
                .single();
            
            if (error) throw error;
            
            // 새 게시글을 데이터에 추가
            const post = {
                id: newPost.id,
                tag: this.mapCategoryToTag(newPost.category),
                title: newPost.title,
                content: newPost.content.length > 100 ? newPost.content.substring(0, 100) + '...' : newPost.content,
                fullContent: newPost.content,
                author: newPost.profiles?.display_name || newPost.profiles?.email?.split('@')[0] || 'Anonymous',
                likes: newPost.likes_count || 0,
                comments: [],
                time: 'Just now'
            };
            
            this.data.posts.unshift(post); // 맨 앞에 추가
            
            // 모달 닫기
            document.getElementById('createPostModal').remove();
            
            // Supabase에서 최신 게시글 다시 로드
            await this.loadPostsFromSupabase();
            
            // 현재 뷰 다시 렌더링
            this.renderView(this.state.currentView);
            
            alert('게시글이 작성되었습니다!');
        } catch (error) {
            console.error('❌ 게시글 작성 실패:', error);
            alert('게시글 작성 중 오류가 발생했습니다: ' + error.message);
        }
    },
    
    bindPostEvents() {
        // Bind post card clicks
        document.querySelectorAll('.post-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking on like button
                if (e.target.closest('.like-btn')) return;

                const postId = card.dataset.postId; // UUID이므로 parseInt 제거
                this.handlePostClick(postId);
            });
        });

        // Bind like button clicks
        document.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const postId = btn.dataset.postId; // UUID이므로 parseInt 제거
                this.handleLikeClick(postId);
            });
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
