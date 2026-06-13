/**
 * Storynara 커뮤니티 게시판
 * - 비로그인: 글 읽기 가능
 * - 로그인 + 승인: 글 작성 가능
 * - 슈퍼바이저(bunz5911@gmail.com): 회원 승인·거절·강제 퇴거
 */
(function () {
    "use strict";

    const SUPERVISOR_EMAIL = (
        window.COMMUNITY_SUPERVISOR_EMAIL || "bunz5911@gmail.com"
    ).toLowerCase();

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
                "Community is not configured yet. Set SUPABASE_URL and SUPABASE_ANON_KEY in assets/supabase-config.js.",
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
            signupPending:
                "Sign-up complete. Your account is awaiting supervisor approval. You will be able to log in after approval.",
            writeSuccess: "Your post has been published.",
            genericError: "Something went wrong. Please try again.",
            invalidCredentials: "Invalid email or password.",
            close: "Close",
            by: "by",
            at: "·",
            pendingLogin: "Your account is awaiting supervisor approval. You cannot log in yet.",
            rejectedLogin: "Your membership request was not approved.",
            bannedLogin: "Your access has been removed from the community.",
            supervisorTitle: "Member management",
            supervisorDesc: "Approve, reject, or remove community members.",
            pendingMembers: "Pending approval",
            allMembers: "All members",
            noPending: "No members waiting for approval.",
            noMembers: "No members found.",
            approve: "Approve",
            reject: "Reject",
            ban: "Remove",
            statusPending: "Pending",
            statusApproved: "Approved",
            statusRejected: "Rejected",
            statusBanned: "Removed",
            memberUpdated: "Member status updated.",
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
                "커뮤니티 설정이 필요합니다. assets/supabase-config.js를 확인하세요.",
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
            signupPending:
                "가입이 완료되었습니다. 슈퍼바이저 승인 후 로그인할 수 있습니다.",
            writeSuccess: "글이 등록되었습니다.",
            genericError: "오류가 발생했습니다. 다시 시도해 주세요.",
            invalidCredentials: "이메일 또는 비밀번호가 올바르지 않습니다.",
            close: "닫기",
            by: "작성자",
            at: "·",
            pendingLogin: "승인 대기 중입니다. 슈퍼바이저 승인 후 로그인할 수 있습니다.",
            rejectedLogin: "회원 가입이 승인되지 않았습니다.",
            bannedLogin: "커뮤니티 이용이 제한되었습니다.",
            supervisorTitle: "회원 관리",
            supervisorDesc: "회원 승인, 거절, 강제 퇴거를 처리합니다.",
            pendingMembers: "승인 대기",
            allMembers: "전체 회원",
            noPending: "승인 대기 회원이 없습니다.",
            noMembers: "등록된 회원이 없습니다.",
            approve: "승인",
            reject: "거절",
            ban: "강제 퇴거",
            statusPending: "대기",
            statusApproved: "승인",
            statusRejected: "거절",
            statusBanned: "퇴거",
            memberUpdated: "회원 상태가 변경되었습니다.",
        },
    };

    const lang = document.documentElement.lang === "ko" ? "ko" : "en";

    function t(key) {
        return STRINGS[lang][key] || key;
    }

    function categoryLabel(categoryId) {
        const cat = CATEGORIES.find(function (c) {
            return c.id === categoryId;
        });
        return cat ? t(cat.labelKey) : categoryId;
    }

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

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function isSupervisorUser(user) {
        return user && String(user.email || "").toLowerCase() === SUPERVISOR_EMAIL;
    }

    function statusLabel(status) {
        const map = {
            pending: "statusPending",
            approved: "statusApproved",
            rejected: "statusRejected",
            banned: "statusBanned",
        };
        return t(map[status] || status);
    }

    let supabaseClient = null;
    let currentUser = null;
    let currentProfile = null;
    let activeCategory = "daily_korean";

    const alertBox = document.getElementById("community-alert");
    const authStatus = document.getElementById("auth-status");
    const btnLogin = document.getElementById("btn-login");
    const btnSignup = document.getElementById("btn-signup");
    const btnLogout = document.getElementById("btn-logout");
    const btnWrite = document.getElementById("btn-write");
    const categoryContainer = document.getElementById("category-tabs");
    const boardTitle = document.getElementById("board-category-title");
    const postList = document.getElementById("post-list");
    const supervisorPanel = document.getElementById("supervisor-panel");
    const pendingMembersList = document.getElementById("pending-members");
    const allMembersList = document.getElementById("all-members");

    const modalOverlay = document.getElementById("modal-overlay");
    const modalTitle = document.getElementById("modal-title");
    const modalBody = document.getElementById("modal-body");
    const modalFooter = document.getElementById("modal-footer");
    const modalClose = document.getElementById("modal-close");

    function showAlert(message, type) {
        if (!alertBox) return;
        alertBox.hidden = false;
        alertBox.textContent = message;
        alertBox.className = "community-alert community-alert--" + (type || "info");
    }

    function hideAlert() {
        if (alertBox) alertBox.hidden = true;
    }

    function openModal(title, bodyHtml, footerHtml) {
        modalTitle.textContent = title;
        modalBody.innerHTML = bodyHtml;
        modalFooter.innerHTML = footerHtml || "";
        modalOverlay.hidden = false;
        document.body.style.overflow = "hidden";
    }

    function closeModal() {
        modalOverlay.hidden = true;
        modalBody.innerHTML = "";
        modalFooter.innerHTML = "";
        document.body.style.overflow = "";
    }

    /** 회원 프로필(승인 상태) 조회 */
    async function fetchProfile(userId) {
        const { data, error } = await supabaseClient
            .from("community_profiles")
            .select("id, email, display_name, status, created_at")
            .eq("id", userId)
            .maybeSingle();

        if (error) return null;
        return data;
    }

    /** 승인되지 않은 회원은 즉시 로그아웃 */
    async function enforceMemberAccess(user) {
        if (!user) {
            currentProfile = null;
            return true;
        }

        if (isSupervisorUser(user)) {
            currentProfile = await fetchProfile(user.id);
            if (!currentProfile) {
                currentProfile = {
                    id: user.id,
                    status: "approved",
                    display_name: user.user_metadata?.display_name || user.email,
                    email: user.email,
                };
            }
            return true;
        }

        const profile = await fetchProfile(user.id);
        currentProfile = profile;

        if (!profile || profile.status !== "approved") {
            await supabaseClient.auth.signOut();
            currentUser = null;
            currentProfile = null;

            if (!profile || profile.status === "pending") {
                showAlert(t("pendingLogin"), "info");
            } else if (profile.status === "rejected") {
                showAlert(t("rejectedLogin"), "error");
            } else {
                showAlert(t("bannedLogin"), "error");
            }
            return false;
        }

        return true;
    }

    function updateAuthUI(user) {
        currentUser = user;
        const isLoggedIn = Boolean(user);
        const isApproved = currentProfile && currentProfile.status === "approved";

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
            btnWrite.hidden = !isApproved;
        } else {
            authStatus.textContent = t("guestStatus");
            btnLogin.hidden = false;
            btnSignup.hidden = false;
            btnLogout.hidden = true;
            btnWrite.hidden = false;
        }

        if (supervisorPanel) {
            const showPanel = isSupervisorUser(user);
            supervisorPanel.hidden = !showPanel;
            if (showPanel) {
                loadSupervisorMembers();
            }
        }
    }

    async function handleAuthUser(user) {
        if (!user) {
            currentProfile = null;
            updateAuthUI(null);
            return;
        }

        const allowed = await enforceMemberAccess(user);
        if (allowed) {
            updateAuthUI(user);
        } else {
            updateAuthUI(null);
        }
    }

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
            data.title,
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

    async function handleLogin() {
        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value;
        const errEl = document.getElementById("form-error");
        errEl.hidden = true;

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            errEl.textContent =
                error.message.includes("Invalid") ? t("invalidCredentials") : t("genericError");
            errEl.hidden = false;
            return;
        }

        const allowed = await enforceMemberAccess(data.user);
        if (!allowed) {
            closeModal();
            return;
        }

        closeModal();
        hideAlert();
        updateAuthUI(data.user);
    }

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

    async function notifySupervisor(userId) {
        try {
            await supabaseClient.functions.invoke("notify-supervisor", {
                body: {
                    user_id: userId,
                    community_url: window.location.href,
                },
            });
        } catch (_e) {
            /* 이메일 실패 시에도 가입은 유지 */
        }
    }

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

        const redirectUrl =
            window.COMMUNITY_SITE_URL
                ? window.COMMUNITY_SITE_URL.replace(/\/?$/, "/") +
                  (lang === "ko" ? "community-ko.html" : "community.html")
                : window.location.origin + window.location.pathname;

        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: { display_name: displayName },
                emailRedirectTo: redirectUrl,
            },
        });

        if (error) {
            errEl.textContent = t("genericError");
            errEl.hidden = false;
            return;
        }

        if (data.user) {
            await supabaseClient.auth.signOut();
            if (String(email).toLowerCase() !== SUPERVISOR_EMAIL) {
                await notifySupervisor(data.user.id);
            }
        }

        closeModal();
        showAlert(t("signupPending"), "info");
    }

    function openWriteModal() {
        if (!currentUser || !currentProfile || currentProfile.status !== "approved") {
            showAlert(t("authRequired"), "info");
            if (!currentUser) openLoginModal();
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

    async function handleLogout() {
        await supabaseClient.auth.signOut();
        currentProfile = null;
        hideAlert();
    }

    function handleWriteClick() {
        if (!currentUser) {
            showAlert(t("authRequired"), "info");
            openLoginModal();
            return;
        }
        if (!currentProfile || currentProfile.status !== "approved") {
            showAlert(t("pendingLogin"), "info");
            return;
        }
        openWriteModal();
    }

    function renderMemberItem(member, options) {
        const li = document.createElement("li");
        li.className = "member-item";
        li.dataset.memberId = member.id;

        const isSelf = currentUser && member.id === currentUser.id;

        let actionsHtml = "";
        if (!isSelf) {
            if (member.status === "pending") {
                actionsHtml +=
                    "<button type='button' class='cm-btn cm-btn--success' data-action='approve'>" +
                    escapeHtml(t("approve")) +
                    "</button>" +
                    "<button type='button' class='cm-btn cm-btn--outline' data-action='reject'>" +
                    escapeHtml(t("reject")) +
                    "</button>";
            }
            if (member.status === "approved") {
                actionsHtml +=
                    "<button type='button' class='cm-btn cm-btn--danger' data-action='ban'>" +
                    escapeHtml(t("ban")) +
                    "</button>";
            }
            if (member.status === "rejected" || member.status === "banned") {
                actionsHtml +=
                    "<button type='button' class='cm-btn cm-btn--success' data-action='approve'>" +
                    escapeHtml(t("approve")) +
                    "</button>";
            }
        }

        li.innerHTML =
            "<div class='member-item__info'>" +
            "<div class='member-item__name'>" +
            escapeHtml(member.display_name) +
            "</div>" +
            "<div class='member-item__email'>" +
            escapeHtml(member.email) +
            "</div>" +
            "<span class='member-item__status member-item__status--" +
            escapeHtml(member.status) +
            "'>" +
            escapeHtml(statusLabel(member.status)) +
            "</span>" +
            "</div>" +
            (actionsHtml
                ? "<div class='member-item__actions'>" + actionsHtml + "</div>"
                : "");

        li.addEventListener("click", function (e) {
            const btn = e.target.closest("[data-action]");
            if (!btn) return;
            const action = btn.getAttribute("data-action");
            let newStatus = "approved";
            if (action === "reject") newStatus = "rejected";
            if (action === "ban") newStatus = "banned";
            updateMemberStatus(member.id, newStatus);
        });

        return li;
    }

    async function updateMemberStatus(memberId, status) {
        const { error } = await supabaseClient
            .from("community_profiles")
            .update({
                status,
                reviewed_at: new Date().toISOString(),
                reviewed_by: currentUser.id,
            })
            .eq("id", memberId);

        if (error) {
            showAlert(t("genericError"), "error");
            return;
        }

        showAlert(t("memberUpdated"), "info");
        await loadSupervisorMembers();
    }

    async function loadSupervisorMembers() {
        if (!isSupervisorUser(currentUser) || !pendingMembersList || !allMembersList) return;

        const { data, error } = await supabaseClient
            .from("community_profiles")
            .select("id, email, display_name, status, created_at")
            .order("created_at", { ascending: false });

        if (error) {
            pendingMembersList.innerHTML =
                "<li class='member-list__empty'>" + escapeHtml(t("loadError")) + "</li>";
            allMembersList.innerHTML =
                "<li class='member-list__empty'>" + escapeHtml(t("loadError")) + "</li>";
            return;
        }

        const members = data || [];
        const pending = members.filter(function (m) {
            return m.status === "pending";
        });

        pendingMembersList.innerHTML = "";
        if (pending.length === 0) {
            pendingMembersList.innerHTML =
                "<li class='member-list__empty'>" + escapeHtml(t("noPending")) + "</li>";
        } else {
            pending.forEach(function (m) {
                pendingMembersList.appendChild(renderMemberItem(m, { pending: true }));
            });
        }

        allMembersList.innerHTML = "";
        if (members.length === 0) {
            allMembersList.innerHTML =
                "<li class='member-list__empty'>" + escapeHtml(t("noMembers")) + "</li>";
        } else {
            members.forEach(function (m) {
                allMembersList.appendChild(renderMemberItem(m));
            });
        }
    }

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
        if (sessionData.session) {
            await handleAuthUser(sessionData.session.user);
        } else {
            updateAuthUI(null);
        }

        supabaseClient.auth.onAuthStateChange(async function (_event, session) {
            await handleAuthUser(session ? session.user : null);
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
