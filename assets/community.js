/**
 * Storynara 커뮤니티 게시판
 * - 비로그인: 글 읽기 가능
 * - 로그인: 글 작성 가능
 */
(function () {
    "use strict";

    const CATEGORIES = [
        { id: "daily_korean", labelKey: "catDaily" },
        { id: "concerns", labelKey: "catConcerns" },
        { id: "info_exchange", labelKey: "catInfo" },
        { id: "meeting_plaza", labelKey: "catMeeting" },
    ];

    const STRINGS = {
        en: {
            catDaily: "Daily Korean",
            catConcerns: "Concerns",
            catInfo: "Info Exchange",
            catMeeting: "Meeting Plaza",
            guestStatus: "You are browsing as a guest. Sign in to write a post.",
            userStatus: "Signed in as",
            login: "Log in",
            signup: "Sign up",
            logout: "Log out",
            write: "Write post",
            boardTitle: "Posts",
            emptyPosts: "No posts yet. Be the first to share!",
            loadError: "Could not load posts. Please try again later.",
            configError:
                "Community is not configured yet. Set SUPABASE_URL and SUPABASE_ANON_KEY in assets/supabase-config.js, then run the SQL migration.",
            loginTitle: "Log in",
            signupTitle: "Sign up",
            writeTitle: "Write a post",
            postTitle: "Post",
            email: "Email",
            password: "Password",
            displayName: "Display name",
            title: "Title",
            content: "Content",
            cancel: "Cancel",
            submitLogin: "Log in",
            submitSignup: "Create account",
            submitWrite: "Publish",
            authRequired: "Please log in to write a post.",
            signupSuccess: "Account created. Check your email if confirmation is required, then log in.",
            writeSuccess: "Your post has been published.",
            genericError: "Something went wrong. Please try again.",
            invalidCredentials: "Invalid email or password.",
            close: "Close",
            by: "by",
            at: "·",
        },
        ko: {
            catDaily: "일상생활 한국어",
            catConcerns: "고민거리",
            catInfo: "정보교환",
            catMeeting: "만남의 광장",
            guestStatus: "게스트로 둘러보는 중입니다. 글을 쓰려면 로그인하세요.",
            userStatus: "로그인:",
            login: "로그인",
            signup: "회원가입",
            logout: "로그아웃",
            write: "글쓰기",
            boardTitle: "게시글",
            emptyPosts: "아직 글이 없습니다. 첫 글을 남겨보세요!",
            loadError: "게시글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
            configError:
                "커뮤니티 설정이 필요합니다. assets/supabase-config.js에 Supabase URL·키를 넣고 SQL 마이그레이션을 실행하세요.",
            loginTitle: "로그인",
            signupTitle: "회원가입",
            writeTitle: "글쓰기",
            postTitle: "게시글",
            email: "이메일",
            password: "비밀번호",
            displayName: "표시 이름",
            title: "제목",
            content: "내용",
            cancel: "취소",
            submitLogin: "로그인",
            submitSignup: "가입하기",
            submitWrite: "등록",
            authRequired: "글을 쓰려면 로그인이 필요합니다.",
            signupSuccess: "가입이 완료되었습니다. 이메일 확인이 필요하면 메일을 확인 후 로그인하세요.",
            writeSuccess: "글이 등록되었습니다.",
            genericError: "오류가 발생했습니다. 다시 시도해 주세요.",
            invalidCredentials: "이메일 또는 비밀번호가 올바르지 않습니다.",
            close: "닫기",
            by: "작성자",
            at: "·",
        },
    };

    const lang = document.documentElement.lang === "ko" ? "ko" : "en";

    /** UI 문자열 반환 */
    function t(key) {
        return STRINGS[lang][key] || key;
    }

    /** 카테고리 라벨 */
    function categoryLabel(categoryId) {
        const cat = CATEGORIES.find(function (c) {
            return c.id === categoryId;
        });
        return cat ? t(cat.labelKey) : categoryId;
    }

    /** ISO 날짜를 로케일 문자열로 */
    function formatDate(iso) {
        try {
            return new Date(iso).toLocaleString(lang === "ko" ? "ko-KR" : "en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch (_e) {
            return iso;
        }
    }

    let supabaseClient = null;
    let currentUser = null;
    let activeCategory = "daily_korean";

  // DOM
    const alertBox = document.getElementById("community-alert");
    const authStatus = document.getElementById("auth-status");
    const btnLogin = document.getElementById("btn-login");
    const btnSignup = document.getElementById("btn-signup");
    const btnLogout = document.getElementById("btn-logout");
    const btnWrite = document.getElementById("btn-write");
    const categoryContainer = document.getElementById("category-tabs");
    const boardTitle = document.getElementById("board-category-title");
    const postList = document.getElementById("post-list");

    const modalOverlay = document.getElementById("modal-overlay");
    const modalTitle = document.getElementById("modal-title");
    const modalBody = document.getElementById("modal-body");
    const modalFooter = document.getElementById("modal-footer");
    const modalClose = document.getElementById("modal-close");

    /** 알림 배너 표시 */
    function showAlert(message, type) {
        if (!alertBox) return;
        alertBox.hidden = false;
        alertBox.textContent = message;
        alertBox.className = "community-alert community-alert--" + (type || "info");
    }

    /** 알림 배너 숨김 */
    function hideAlert() {
        if (alertBox) alertBox.hidden = true;
    }

    /** 모달 열기 */
    function openModal(title, bodyHtml, footerHtml) {
        modalTitle.textContent = title;
        modalBody.innerHTML = bodyHtml;
        modalFooter.innerHTML = footerHtml || "";
        modalOverlay.hidden = false;
        document.body.style.overflow = "hidden";
    }

    /** 모달 닫기 */
    function closeModal() {
        modalOverlay.hidden = true;
        modalBody.innerHTML = "";
        modalFooter.innerHTML = "";
        document.body.style.overflow = "";
    }

    /** 로그인 UI 갱신 */
    function updateAuthUI(user) {
        currentUser = user;
        const isLoggedIn = Boolean(user);

        if (isLoggedIn) {
            const name =
                user.user_metadata && user.user_metadata.display_name
                    ? user.user_metadata.display_name
                    : user.email;
            authStatus.innerHTML =
                t("userStatus") + " <strong>" + escapeHtml(name) + "</strong>";
            btnLogin.hidden = true;
            btnSignup.hidden = true;
            btnLogout.hidden = false;
            btnWrite.hidden = false;
        } else {
            authStatus.textContent = t("guestStatus");
            btnLogin.hidden = false;
            btnSignup.hidden = false;
            btnLogout.hidden = true;
            btnWrite.hidden = false;
        }
    }

    /** HTML 이스케이프 */
    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    /** 카테고리 탭 렌더 */
    function renderCategoryTabs() {
        categoryContainer.innerHTML = "";
        CATEGORIES.forEach(function (cat) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className =
                "category-tab" + (cat.id === activeCategory ? " is-active" : "");
            btn.textContent = t(cat.labelKey);
            btn.addEventListener("click", function () {
                activeCategory = cat.id;
                renderCategoryTabs();
                loadPosts();
            });
            categoryContainer.appendChild(btn);
        });
        boardTitle.textContent = categoryLabel(activeCategory);
    }

    /** 게시글 목록 로드 */
    async function loadPosts() {
        if (!supabaseClient) return;

        boardTitle.textContent = categoryLabel(activeCategory);
        postList.innerHTML =
            "<li class='post-list__empty'>" + escapeHtml(t("loadError")) + "</li>";

        const { data, error } = await supabaseClient
            .from("community_posts")
            .select("id, title, author_display_name, created_at, category")
            .eq("category", activeCategory)
            .order("created_at", { ascending: false });

        if (error) {
            postList.innerHTML =
                "<li class='post-list__empty'>" + escapeHtml(t("loadError")) + "</li>";
            return;
        }

        if (!data || data.length === 0) {
            postList.innerHTML =
                "<li class='post-list__empty'>" + escapeHtml(t("emptyPosts")) + "</li>";
            return;
        }

        postList.innerHTML = "";
        data.forEach(function (post) {
            const li = document.createElement("li");
            li.className = "post-item";
            li.innerHTML =
                "<a class='post-item__link' href='#' data-post-id='" +
                escapeHtml(post.id) +
                "'>" +
                "<h3 class='post-item__title'>" +
                escapeHtml(post.title) +
                "</h3>" +
                "<div class='post-item__meta'>" +
                "<span>" +
                escapeHtml(t("by")) +
                " " +
                escapeHtml(post.author_display_name) +
                "</span>" +
                "<span>" +
                escapeHtml(formatDate(post.created_at)) +
                "</span>" +
                "</div>" +
                "</a>";
            postList.appendChild(li);
        });
    }

    /** 글 상세 보기 */
    async function showPostDetail(postId) {
        const { data, error } = await supabaseClient
            .from("community_posts")
            .select("*")
            .eq("id", postId)
            .maybeSingle();

        if (error || !data) {
            showAlert(t("loadError"), "error");
            return;
        }

        const meta =
            escapeHtml(categoryLabel(data.category)) +
            " " +
            escapeHtml(t("at")) +
            " " +
            escapeHtml(t("by")) +
            " " +
            escapeHtml(data.author_display_name) +
            " " +
            escapeHtml(t("at")) +
            " " +
            escapeHtml(formatDate(data.created_at));

        openModal(
            escapeHtml(data.title),
            "<p class='post-detail__meta'>" +
                meta +
                "</p>" +
                "<div class='post-detail__content'>" +
                escapeHtml(data.content) +
                "</div>",
            "<button type='button' class='cm-btn cm-btn--outline' id='modal-close-footer'>" +
                escapeHtml(t("close")) +
                "</button>"
        );

        document.getElementById("modal-close-footer").addEventListener("click", closeModal);
    }

    /** 로그인 모달 */
    function openLoginModal() {
        openModal(
            t("loginTitle"),
            "<p class='cm-form-error' id='form-error' hidden></p>" +
                "<div class='cm-field'><label for='login-email'>" +
                escapeHtml(t("email")) +
                "</label><input id='login-email' type='email' autocomplete='email' required></div>" +
                "<div class='cm-field'><label for='login-password'>" +
                escapeHtml(t("password")) +
                "</label><input id='login-password' type='password' autocomplete='current-password' required></div>",
            "<button type='button' class='cm-btn cm-btn--outline' id='modal-cancel'>" +
                escapeHtml(t("cancel")) +
                "</button>" +
                "<button type='button' class='cm-btn cm-btn--primary' id='modal-submit'>" +
                escapeHtml(t("submitLogin")) +
                "</button>"
        );

        document.getElementById("modal-cancel").addEventListener("click", closeModal);
        document.getElementById("modal-submit").addEventListener("click", handleLogin);
    }

    /** 로그인 처리 */
    async function handleLogin() {
        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value;
        const errEl = document.getElementById("form-error");

        errEl.hidden = true;

        const { error } = await supabaseClient.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            errEl.textContent =
                error.message.includes("Invalid") ? t("invalidCredentials") : t("genericError");
            errEl.hidden = false;
            return;
        }

        closeModal();
        hideAlert();
    }

    /** 회원가입 모달 */
    function openSignupModal() {
        openModal(
            t("signupTitle"),
            "<p class='cm-form-error' id='form-error' hidden></p>" +
                "<div class='cm-field'><label for='signup-name'>" +
                escapeHtml(t("displayName")) +
                "</label><input id='signup-name' type='text' autocomplete='name' required maxlength='80'></div>" +
                "<div class='cm-field'><label for='signup-email'>" +
                escapeHtml(t("email")) +
                "</label><input id='signup-email' type='email' autocomplete='email' required></div>" +
                "<div class='cm-field'><label for='signup-password'>" +
                escapeHtml(t("password")) +
                "</label><input id='signup-password' type='password' autocomplete='new-password' required minlength='6'></div>",
            "<button type='button' class='cm-btn cm-btn--outline' id='modal-cancel'>" +
                escapeHtml(t("cancel")) +
                "</button>" +
                "<button type='button' class='cm-btn cm-btn--primary' id='modal-submit'>" +
                escapeHtml(t("submitSignup")) +
                "</button>"
        );

        document.getElementById("modal-cancel").addEventListener("click", closeModal);
        document.getElementById("modal-submit").addEventListener("click", handleSignup);
    }

    /** 회원가입 처리 */
    async function handleSignup() {
        const displayName = document.getElementById("signup-name").value.trim();
        const email = document.getElementById("signup-email").value.trim();
        const password = document.getElementById("signup-password").value;
        const errEl = document.getElementById("form-error");

        errEl.hidden = true;

        if (!displayName) {
            errEl.textContent = t("genericError");
            errEl.hidden = false;
            return;
        }

        const { error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: { display_name: displayName },
            },
        });

        if (error) {
            errEl.textContent = t("genericError");
            errEl.hidden = false;
            return;
        }

        closeModal();
        showAlert(t("signupSuccess"), "info");
    }

    /** 글쓰기 모달 */
    function openWriteModal() {
        if (!currentUser) {
            showAlert(t("authRequired"), "info");
            openLoginModal();
            return;
        }

        openModal(
            t("writeTitle") + " — " + categoryLabel(activeCategory),
            "<p class='cm-form-error' id='form-error' hidden></p>" +
                "<div class='cm-field'><label for='write-title'>" +
                escapeHtml(t("title")) +
                "</label><input id='write-title' type='text' required maxlength='200'></div>" +
                "<div class='cm-field'><label for='write-content'>" +
                escapeHtml(t("content")) +
                "</label><textarea id='write-content' required maxlength='10000'></textarea></div>",
            "<button type='button' class='cm-btn cm-btn--outline' id='modal-cancel'>" +
                escapeHtml(t("cancel")) +
                "</button>" +
                "<button type='button' class='cm-btn cm-btn--primary' id='modal-submit'>" +
                escapeHtml(t("submitWrite")) +
                "</button>"
        );

        document.getElementById("modal-cancel").addEventListener("click", closeModal);
        document.getElementById("modal-submit").addEventListener("click", handleWrite);
    }

    /** 글 등록 처리 */
    async function handleWrite() {
        const title = document.getElementById("write-title").value.trim();
        const content = document.getElementById("write-content").value.trim();
        const errEl = document.getElementById("form-error");

        errEl.hidden = true;

        if (!title || !content) {
            errEl.textContent = t("genericError");
            errEl.hidden = false;
            return;
        }

        const displayName =
            currentUser.user_metadata && currentUser.user_metadata.display_name
                ? currentUser.user_metadata.display_name
                : currentUser.email;

        const { error } = await supabaseClient.from("community_posts").insert({
            category: activeCategory,
            title,
            content,
            author_id: currentUser.id,
            author_display_name: displayName,
        });

        if (error) {
            errEl.textContent = t("genericError");
            errEl.hidden = false;
            return;
        }

        closeModal();
        showAlert(t("writeSuccess"), "info");
        await loadPosts();
    }

    /** 로그아웃 */
    async function handleLogout() {
        await supabaseClient.auth.signOut();
        hideAlert();
    }

    /** 글쓰기 버튼 — 비로그인 시 로그인 유도 */
    function handleWriteClick() {
        if (!currentUser) {
            showAlert(t("authRequired"), "info");
            openLoginModal();
            return;
        }
        openWriteModal();
    }

    /** 초기화 */
    async function init() {
        const url = window.SUPABASE_URL;
        const key = window.SUPABASE_ANON_KEY;

        if (!url || !key) {
            showAlert(t("configError"), "error");
            btnLogin.disabled = true;
            btnSignup.disabled = true;
            btnWrite.disabled = true;
            renderCategoryTabs();
            postList.innerHTML =
                "<li class='post-list__empty'>" + escapeHtml(t("configError")) + "</li>";
            return;
        }

        if (!window.supabase || !window.supabase.createClient) {
            showAlert(t("genericError"), "error");
            return;
        }

        supabaseClient = window.supabase.createClient(url, key);

        const { data: sessionData } = await supabaseClient.auth.getSession();
        updateAuthUI(sessionData.session ? sessionData.session.user : null);

        supabaseClient.auth.onAuthStateChange(function (_event, session) {
            updateAuthUI(session ? session.user : null);
        });

        renderCategoryTabs();
        await loadPosts();

        btnLogin.addEventListener("click", openLoginModal);
        btnSignup.addEventListener("click", openSignupModal);
        btnLogout.addEventListener("click", handleLogout);
        btnWrite.addEventListener("click", handleWriteClick);
        modalClose.addEventListener("click", closeModal);
        modalOverlay.addEventListener("click", function (e) {
            if (e.target === modalOverlay) closeModal();
        });

        postList.addEventListener("click", function (e) {
            const link = e.target.closest("[data-post-id]");
            if (!link) return;
            e.preventDefault();
            showPostDetail(link.getAttribute("data-post-id"));
        });

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && !modalOverlay.hidden) closeModal();
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
