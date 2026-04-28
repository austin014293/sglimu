$path = "c:\Users\park4\OneDrive\Desktop\test7"
$files = Get-ChildItem -Path $path -Filter *.html | Where-Object { $_.Name -ne 'admin.html' -and $_.Name -ne 'index.html' }

$headPattern = '(?i)</head>'
$headReplace = "    <link rel=`"stylesheet`" href=`"auth.css`">`r`n    <script src=`"https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js`"></script>`r`n</head>"

$userIconPattern = '(?i)<a href=`"#`"><i class=`"fa-regular fa-user`"></i></a>'
$userIconReplace = @"
                <div class="user-auth-wrap" id="userAuthWrap">
                    <button class="login-trigger-btn" id="loginTriggerBtn">
                        <i class="fa-regular fa-user"></i>
                        <span>로그인</span>
                    </button>
                </div>
"@

$bodyPattern = '(?i)</body>'
$bodyReplace = @"
    <!-- Auth Modal Overlay -->
    <div class="auth-overlay" id="authOverlay">
        <div class="auth-modal">
            <div class="auth-close" id="authClose">&times;</div>
            <div class="auth-tabs">
                <div class="auth-tab active" data-target="loginPane">로그인</div>
                <div class="auth-tab" data-target="signupPane">회원가입</div>
            </div>
            <div class="auth-content">
                <div class="auth-pane active" id="loginPane">
                    <div class="auth-header"><h2>환영합니다!</h2><p>간편로그인으로 빠르게 시작하세요.</p></div>
                    <div class="social-login-grid">
                        <button class="social-btn btn-kakao" id="kakaoLoginBtn"><i class="fa-solid fa-comment"></i> 카카오 로그인</button>
                        <button class="social-btn btn-naver" id="naverLoginBtn"><i class="fa-solid fa-n" style="font-size: 0.8rem;"></i> 네이버 로그인</button>
                        <button class="social-btn btn-google" id="googleLoginBtn"><i class="fa-brands fa-google"></i> Google 로그인</button>
                    </div>
                    <div class="auth-divider"><span>또는</span></div>
                    <form id="loginForm">
                        <div class="auth-form-group"><label>이메일</label><input type="email" id="loginEmail" class="auth-input" placeholder="example@email.com" required></div>
                        <div class="auth-form-group"><label>비밀번호</label><input type="password" id="loginPassword" class="auth-input" placeholder="비밀번호를 입력하세요" required></div>
                        <button type="submit" class="auth-submit-btn">로그인</button>
                    </form>
                    <div id="loginMsg" class="auth-message"></div>
                </div>
                <div class="auth-pane" id="signupPane">
                    <div class="auth-header"><h2>회원가입</h2><p>간단한 정보 입력으로 더 많은 혜택을 누리세요.</p></div>
                    <div class="auth-social-signup">
                        <div class="auth-social-signup-header"><span>간편 회원가입</span></div>
                        <div class="social-login-grid">
                            <button class="social-btn btn-kakao social-signup-btn" data-provider="kakao"><i class="fa-solid fa-comment"></i> 카카오로 시작</button>
                            <button class="social-btn btn-naver social-signup-btn" data-provider="naver"><i class="fa-solid fa-n" style="font-size: 0.8rem;"></i> 네이버로 시작</button>
                            <button class="social-btn btn-google social-signup-btn" data-provider="google"><i class="fa-brands fa-google"></i> Google로 시작</button>
                        </div>
                    </div>
                    <div class="auth-divider"><span>또는 이메일로 가입</span></div>
                    <div class="auth-type-selector" id="userTypeSelector">
                        <div class="auth-type-btn active" data-type="individual">개인 회원</div>
                        <div class="auth-type-btn" data-type="business">기관 / 사업자</div>
                    </div>
                    <form id="signupForm">
                        <div class="auth-row">
                            <div class="auth-form-group"><label>이름 *</label><input type="text" id="signupName" class="auth-input" placeholder="홍길동" required></div>
                            <div class="auth-form-group"><label>전화번호 *</label><input type="tel" id="signupPhone" class="auth-input" placeholder="010-0000-0000" required></div>
                        </div>
                        <div class="auth-form-group"><label>이메일 *</label><input type="email" id="signupEmail" class="auth-input" placeholder="example@email.com" required></div>
                        <div class="auth-row">
                            <div class="auth-form-group"><label>비밀번호 *</label><input type="password" id="signupPassword" class="auth-input" placeholder="6자 이상" minlength="6" required></div>
                            <div class="auth-form-group"><label>비밀번호 확인 *</label><input type="password" id="signupPasswordConfirm" class="auth-input" placeholder="한 번 더 입력" required></div>
                        </div>
                        <div class="auth-form-group" id="orgGroup"><label>소속기관 / 학교 / 도서관명</label><input type="text" id="signupOrg" class="auth-input" placeholder="예: 한국대학교 도서관"></div>
                        <div class="auth-form-group" id="bizGroup" style="display: none;"><label>사업자 등록번호</label><input type="text" id="signupBizNumber" class="auth-input" placeholder="000-00-00000"></div>
                        <div class="auth-form-group"><label>배송/방문용 주소</label><input type="text" id="signupAddress" class="auth-input" placeholder="전체 주소를 입력하세요"></div>
                        <button type="submit" class="auth-submit-btn">가입하기</button>
                    </form>
                    <div id="signupMsg" class="auth-message"></div>
                </div>
                <div class="auth-pane" id="completeProfilePane">
                    <div class="auth-header"><h2>추가 정보 입력</h2><p>원활한 서비스 이용을 위해 필수 정보를 입력해 주세요.</p></div>
                    <form id="completeProfileForm">
                        <div class="highlight-box">
                            <div class="auth-form-group"><label>전화번호 *</label><input type="tel" id="completePhone" class="auth-input" placeholder="010-0000-0000" required></div>
                            <div class="auth-form-group"><label>소속기관 / 학교 / 도서관명 *</label><input type="text" id="completeOrg" class="auth-input" placeholder="예: 한국대학교 도서관" required></div>
                            <div class="auth-form-group"><label>배송/방문용 주소</label><input type="text" id="completeAddress" class="auth-input" placeholder="전체 주소를 입력하세요"></div>
                        </div>
                        <button type="submit" class="auth-submit-btn">정보 저장 및 시작하기</button>
                    </form>
                    <div id="completeMsg" class="auth-message"></div>
                </div>
            </div>
        </div>
    </div>
    <script type="module" src="auth.js"></script>
</body>
"@

foreach ($file in $files) {
    Write-Output "Processing $($file.Name)..."
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    
    # Avoid duplicate injection
    if ($content -notmatch 'auth\.css') {
        $content = [regex]::Replace($content, $headPattern, $headReplace)
        $content = [regex]::Replace($content, $userIconPattern, $userIconReplace)
        $content = [regex]::Replace($content, $bodyPattern, $bodyReplace)
        [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
    }
}
Write-Output "Global Auth Injection Done"
