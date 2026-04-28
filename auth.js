// auth.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// ==========================================
// 🚨 Supabase Configuration (Sync with admin.js)
// ==========================================
const SUPABASE_URL = 'https://xxvfgnoffomrhtxitqkj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Q4t2p9WcUBdtUxd7HYV56A_MvxnZRk9';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const authOverlay = document.getElementById('authOverlay');
const loginTriggerBtn = document.getElementById('loginTriggerBtn');
const authClose = document.getElementById('authClose');
const authTabs = document.querySelectorAll('.auth-tab');
const authPanes = document.querySelectorAll('.auth-pane');

const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginMsg = document.getElementById('loginMsg');
const signupMsg = document.getElementById('signupMsg');

const userAuthWrap = document.getElementById('userAuthWrap');

// Social Login Buttons
// Social Login & Signup Buttons
const kakaoLoginBtn = document.getElementById('kakaoLoginBtn');
const naverLoginBtn = document.getElementById('naverLoginBtn');
const googleLoginBtn = document.getElementById('googleLoginBtn');
const socialSignupBtns = document.querySelectorAll('.social-signup-btn');

// ==========================================
// 1. Modal & Tab Logic
// ==========================================
function openAuthModal(tab = 'loginPane') {
    authOverlay.style.display = 'flex';
    switchTab(tab);
}

function closeAuthModal() {
    authOverlay.style.display = 'none';
}

function switchTab(targetId) {
    authTabs.forEach(tab => {
        if (tab.dataset.target === targetId) tab.classList.add('active');
        else tab.classList.remove('active');
    });
    authPanes.forEach(pane => {
        if (pane.id === targetId) pane.classList.add('active');
        else pane.classList.remove('active');
    });
}

if (loginTriggerBtn) loginTriggerBtn.addEventListener('click', () => openAuthModal());
if (authClose) authClose.addEventListener('click', closeAuthModal);
authOverlay.addEventListener('click', (e) => { if (e.target === authOverlay) closeAuthModal(); });

authTabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.target));
});

// User Type Selection
let selectedUserType = 'individual';
const typeBtns = document.querySelectorAll('.auth-type-btn');
const bizGroup = document.getElementById('bizGroup');

typeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        typeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedUserType = btn.dataset.type;
        
        // Toggle business fields
        if (selectedUserType === 'business') {
            bizGroup.style.display = 'block';
        } else {
            bizGroup.style.display = 'none';
        }
    });
});

// ==========================================
// 2. Auth Logic - Social
// ==========================================
async function signInWithSocial(provider) {
    // Store user type in localStorage to use after redirect (for new users)
    localStorage.setItem('pending_user_type', selectedUserType);
    
    const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
            redirectTo: window.location.origin,
            queryParams: {
                prompt: 'select_account'
            }
        }
    });
    if (error) alert(`${provider} 로그인 오류: ` + error.message);
}

if (kakaoLoginBtn) kakaoLoginBtn.addEventListener('click', () => signInWithSocial('kakao'));
if (naverLoginBtn) naverLoginBtn.addEventListener('click', () => signInWithSocial('naver'));
if (googleLoginBtn) googleLoginBtn.addEventListener('click', () => signInWithSocial('google'));

socialSignupBtns.forEach(btn => {
    btn.addEventListener('click', () => signInWithSocial(btn.dataset.provider));
});

// ==========================================
// 3. Auth Logic - Email/PW & Profile
// ==========================================

// SIGN UP
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('signupName').value;
        const phone = document.getElementById('signupPhone').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const passwordConfirm = document.getElementById('signupPasswordConfirm').value;
        const organization = document.getElementById('signupOrg').value;
        const bizNumber = document.getElementById('signupBizNumber').value;
        const address = document.getElementById('signupAddress').value;

        signupMsg.className = 'auth-message';
        
        if (password !== passwordConfirm) {
            signupMsg.textContent = '비밀번호가 일치하지 않습니다.';
            signupMsg.classList.add('error');
            return;
        }

        signupMsg.textContent = '가입 처리 중...';

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                    phone: phone,
                    organization: organization,
                    address: address,
                    user_type: selectedUserType,
                    biz_number: bizNumber
                }
            }
        });

        if (error) {
            signupMsg.textContent = '가입 오류: ' + error.message;
            signupMsg.classList.add('error');
        } else {
            signupMsg.textContent = '가입 성공! 이메일을 확인하거나 로그인해 주세요.';
            signupMsg.classList.add('success');
            signupForm.reset();
        }
    });
}

// LOGIN
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        loginMsg.className = 'auth-message';
        loginMsg.textContent = '로그인 중...';

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            loginMsg.textContent = '로그인 실패: ' + error.message;
            loginMsg.classList.add('error');
        } else {
            loginMsg.textContent = '반갑습니다! 로그인 성공.';
            loginMsg.classList.add('success');
            setTimeout(() => {
                closeAuthModal();
                updateAuthUI(data.user);
            }, 1000);
        }
    });
}

// PROFILE COMPLETION
const completeProfileForm = document.getElementById('completeProfileForm');
const completeMsg = document.getElementById('completeMsg');

if (completeProfileForm) {
    completeProfileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const phone = document.getElementById('completePhone').value;
        const org = document.getElementById('completeOrg').value;
        const address = document.getElementById('completeAddress').value;
        const userType = localStorage.getItem('pending_user_type') || 'individual';

        completeMsg.className = 'auth-message';
        completeMsg.textContent = '저장 중...';

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from('profiles').update({
            phone: phone,
            organization: org,
            address: address,
            user_type: userType
        }).eq('id', user.id);

        if (error) {
            completeMsg.textContent = '저장 실패: ' + error.message;
            completeMsg.classList.add('error');
        } else {
            completeMsg.textContent = '저장 완료! 환영합니다.';
            completeMsg.classList.add('success');
            setTimeout(() => {
                closeAuthModal();
                window.location.reload();
            }, 1000);
        }
    });
}

// ==========================================
// 4. UI State Management
// ==========================================

async function checkProfileCompletion(user) {
    if (!user) return;
    
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    
    if (error && error.code !== 'PGRST116') return; // PGRST116 is 'not found'

    // If profile is missing phone or organization, show completion pane
    if (!profile || !profile.phone || !profile.organization) {
        // Clear pending type after we know we're using it
        openAuthModal('completeProfilePane');
        // Pre-fill name if available
        if (profile && profile.full_name) {
            // Optional: pre-fill fields
        }
    }
}

async function updateAuthUI(user) {
    if (user) {
        const userName = user.user_metadata.full_name || user.email.split('@')[0];
        userAuthWrap.innerHTML = `
            <div class="user-profile-nav">
                <span class="user-name"><b>${userName}</b> 님</span>
                <button class="logout-btn" id="logoutBtn">로그아웃</button>
            </div>
        `;
        document.getElementById('logoutBtn').addEventListener('click', async () => {
            await supabase.auth.signOut();
            window.location.reload();
        });
        
        // After UI update, check for profile completion
        checkProfileCompletion(user);
    } else {
        userAuthWrap.innerHTML = `
            <button class="login-trigger-btn" id="loginTriggerBtn">
                <i class="fa-regular fa-user"></i>
                <span>로그인</span>
            </button>
        `;
        const btn = document.getElementById('loginTriggerBtn');
        if (btn) btn.addEventListener('click', () => openAuthModal());
    }
}

async function initAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    updateAuthUI(session ? session.user : null);
}

initAuth();

supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
        updateAuthUI(session.user);
    } else if (event === 'SIGNED_OUT') {
        updateAuthUI(null);
    }
});
