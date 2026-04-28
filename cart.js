// cart.js - 장바구니 로직 처리
// 전역 장바구니 팝업 HTML 템플릿 주입
document.addEventListener('DOMContentLoaded', () => {
    // 1. 장바구니 UI 주입
    const cartHTML = `
        <div id="cartOverlay" class="slide-cart-overlay">
            <div class="slide-cart" id="slideCart">
                <div class="cart-header">
                    <h2><i class="fa-solid fa-cart-shopping"></i> 장바구니</h2>
                    <button class="close-cart" id="closeCartBtn">&times;</button>
                </div>
                <div class="cart-items" id="cartItemList">
                    <!-- 상품 목록 렌더링 영역 -->
                </div>
                <div class="cart-footer">
                    <div class="cart-total">
                        <span>총 결제금액</span>
                        <span id="cartTotalPrice">0원</span>
                    </div>
                    <button class="btn-checkout" onclick="alert('결제 모듈은 준비중입니다.')">장바구니 결제하기</button>
                    <button class="btn-quote" id="btnCartQuote">견적서 자동 발행 (PDF)</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', cartHTML);

    const cartOverlay = document.getElementById('cartOverlay');
    const closeCartBtn = document.getElementById('closeCartBtn');
    
    // 2. 상단 메뉴 바 장바구니 아이콘 찾아서 뱃지 달기 및 클릭이벤트 연동
    const topCartIcons = document.querySelectorAll('.header-utils .fa-cart-shopping');
    topCartIcons.forEach(icon => {
        const parentLink = icon.closest('a');
        if(parentLink) {
            parentLink.style.position = 'relative';
            parentLink.insertAdjacentHTML('beforeend', '<span class="cart-badge" id="topCartBadge">0</span>');
            
            parentLink.addEventListener('click', (e) => {
                e.preventDefault();
                openCart();
            });
        }
    });

    closeCartBtn.addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', (e) => {
        if(e.target === cartOverlay) closeCart();
    });

    // 견적서 발행 버튼 연동
    const btnCartQuote = document.getElementById('btnCartQuote');
    if(btnCartQuote) {
        btnCartQuote.addEventListener('click', generateQuotePDF);
    }

    // 화면의 모든 장바구니 담기(.btn-cart) 버튼 연동
    const addCartBtns = document.querySelectorAll('.btn-cart');
    addCartBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            // 상품 상세 페이지일 경우 정보 자동수집
            const TitleEl = document.querySelector('.product-title h1');
            const PriceEl = document.querySelector('.product-price');
            
            const pName = TitleEl ? TitleEl.innerText : document.title;
            const pPriceRaw = PriceEl ? PriceEl.innerText.replace(/[^0-9]/g, '') : "0";
            const pPrice = parseInt(pPriceRaw) || 0;
            
            const item = {
                id: pName + '_' + new Date().getTime(),
                name: pName,
                price: pPrice,
                qty: 1
            };
            
            addToCart(item);
            openCart();
        });
    });

    // 처음 접속시 랜더링
    renderCart();
});

// 핵심 로직 함수들
function getCart() {
    return JSON.parse(localStorage.getItem('sg_limu_cart')) || [];
}

function saveCart(cart) {
    localStorage.setItem('sg_limu_cart', JSON.stringify(cart));
}

function addToCart(newItem) {
    let cart = getCart();
    // 중복 상품이 있다면 수량만 증가
    let existingItem = cart.find(item => item.name === newItem.name && item.price === newItem.price);
    
    if(existingItem) {
        existingItem.qty += 1;
    } else {
        cart.push(newItem);
    }
    
    saveCart(cart);
    renderCart(); // 추가 후 재렌더링
}

window.removeFromCart = function(id) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== id);
    saveCart(cart);
    renderCart();
};

function renderCart() {
    let cart = getCart();
    const cartItemList = document.getElementById('cartItemList');
    const badge = document.getElementById('topCartBadge');
    
    if(!cartItemList) return;

    if(cart.length === 0) {
        cartItemList.innerHTML = `<div class="cart-empty"><i class="fa-solid fa-box-open" style="font-size:3rem; margin-bottom:15px;"></i><p>장바구니가 비어 있습니다.</p></div>`;
        document.getElementById('cartTotalPrice').innerText = '0원';
        if(badge) badge.style.display = 'none';
        return;
    }

    // 뱃지 업데이트
    if(badge) {
        badge.innerText = cart.length;
        badge.style.display = 'inline-block';
    }

    let html = '';
    let total = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;
        html += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>${item.price.toLocaleString()}원 x ${item.qty}개</p>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart('${item.id}')"><i class="fa-solid fa-xmark"></i></button>
            </div>
        `;
    });

    cartItemList.innerHTML = html;
    document.getElementById('cartTotalPrice').innerText = total.toLocaleString() + '원';
}

function openCart() {
    document.getElementById('cartOverlay').classList.add('open');
}

function closeCart() {
    document.getElementById('cartOverlay').classList.remove('open');
}

// ==========================================
// 견적서 PDF 자동 발행 기능
// ==========================================
async function generateQuotePDF() {
    const cart = getCart();
    if(cart.length === 0) {
        alert('장바구니에 상품을 담아주세요.');
        return;
    }

    const btn = document.getElementById('btnCartQuote');
    const originalText = btn.innerText;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 생성 중...';
    btn.disabled = true;

    try {
        // 1. 사용자 정보 가져오기 (Supabase 연동 시도)
        let purchaserInfo = { name: "귀하", org: "기관/개인", phone: "-" };
        
        // auth.js의 supabase 클라이언트를 전역에서 접근 가능한지 확인 (또는 직접 초기화)
        if (window.supabase) {
            const { data: { user } } = await window.supabase.auth.getUser();
            if (user) {
                const { data: profile } = await window.supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                
                if (profile) {
                    purchaserInfo = {
                        name: profile.full_name || user.email.split('@')[0],
                        org: profile.organization || "개인",
                        phone: profile.phone || "-"
                    };
                }
            }
        }

        // 2. 날짜 계산
        const today = new Date();
        const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
        const validDate = new Date();
        validDate.setDate(today.getDate() + 30);
        const validStr = `${validDate.getFullYear()}년 ${validDate.getMonth() + 1}월 ${validDate.getDate()}일까지 (30일)`;

        // 3. 견적서 번호 
        const quoteNo = 'QL-' + today.getTime().toString().slice(-8);

        // 4. 제품 리스트 HTML 생성
        let total = 0;
        const itemRows = cart.map((item, idx) => {
            const sum = item.price * item.qty;
            total += sum;
            return `
                <tr>
                    <td style="text-align:center;">${idx + 1}</td>
                    <td style="padding:10px;">${item.name}</td>
                    <td style="text-align:center;">규격참조</td>
                    <td style="text-align:center; padding:10px;">${item.qty.toLocaleString()}</td>
                    <td style="text-align:right; padding:10px;">${item.price.toLocaleString()}</td>
                    <td style="text-align:right; padding:10px;">${sum.toLocaleString()}</td>
                    <td style="text-align:center;">-</td>
                </tr>
            `;
        }).join('');

        // 5. PDF 템플릿 생성
        const element = document.createElement('div');
        element.style.padding = '40px';
        element.style.fontFamily = "'Pretendard', sans-serif";
        element.style.color = '#333';
        element.style.background = '#fff';
        element.style.fontSize = '12px';

        element.innerHTML = `
            <div style="text-align:center; margin-bottom:20px;">
                <h1 style="font-size:32px; font-weight:800; border-bottom:4px double #000; display:inline-block; padding:0 30px 5px; margin-bottom:10px;">견 &nbsp; 적 &nbsp; 서</h1>
            </div>

            <div style="display:flex; justify-content:space-between; margin-bottom:20px;">
                <div style="flex:1; padding-right:20px;">
                    <p style="margin-bottom:8px;">문서번호 : ${quoteNo}</p>
                    <p style="margin-bottom:8px;">발행일자 : ${dateStr}</p>
                    <div style="border:2px solid #000; padding:15px; margin-top:10px; min-height:80px;">
                        <h2 style="font-size:18px; margin-bottom:10px;">${purchaserInfo.org} &nbsp; ${purchaserInfo.name} 貴下</h2>
                        <p style="font-size:13px; line-height:1.5;">아래와 같이 견적합니다.</p>
                        <p style="font-size:13px; font-weight:700; margin-top:10px; border-bottom:1px solid #333; display:inline-block;">합계금액 : ￦ ${total.toLocaleString()} (VAT포함)</p>
                    </div>
                </div>

                <div style="flex:1; display:flex;">
                    <table style="width:100%; border-collapse:collapse; border:2px solid #000; font-size:11px;">
                        <tr>
                            <td rowspan="5" style="width:25px; border-right:1px solid #000; text-align:center; background:#f9f9f9; font-weight:700;">공<br><br>급<br><br>자</td>
                            <td style="padding:5px; border-bottom:1px solid #000; border-right:1px solid #000; text-align:center; background:#f9f9f9;">사업자번호</td>
                            <td colspan="3" style="padding:5px; border-bottom:1px solid #000;">621-81-42086</td>
                        </tr>
                        <tr>
                            <td style="padding:5px; border-bottom:1px solid #000; border-right:1px solid #000; text-align:center; background:#f9f9f9;">상 호</td>
                            <td style="padding:5px; border-bottom:1px solid #000; border-right:1px solid #000;">(주)에스지라이뮤</td>
                            <td style="padding:5px; border-bottom:1px solid #000; border-right:1px solid #000; text-align:center; background:#f9f9f9;">성 명</td>
                            <td style="padding:5px; border-bottom:1px solid #000; position:relative;">
                                강인숙
                                <div style="position:absolute; right:5px; top:-5px;">
                                    <svg width="45" height="45" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="45" fill="none" stroke="red" stroke-width="3" opacity="0.8"/>
                                        <text x="50" y="45" text-anchor="middle" fill="red" font-size="16" font-weight="bold" opacity="0.8">에스지</text>
                                        <text x="50" y="65" text-anchor="middle" fill="red" font-size="16" font-weight="bold" opacity="0.8">라이뮤</text>
                                        <rect x="15" y="15" width="70" height="70" fill="none" stroke="red" stroke-width="2" transform="rotate(45 50 50)" opacity="0.3"/>
                                    </svg>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:5px; border-bottom:1px solid #000; border-right:1px solid #000; text-align:center; background:#f9f9f9;">주 소</td>
                            <td colspan="3" style="padding:5px; border-bottom:1px solid #000;">부산광역시 금정구 놀이마당로 29-1 (청룡동)</td>
                        </tr>
                        <tr>
                            <td style="padding:5px; border-bottom:1px solid #000; border-right:1px solid #000; text-align:center; background:#f9f9f9;">업 태</td>
                            <td style="padding:5px; border-bottom:1px solid #000; border-right:1px solid #000;">도소매, 제조</td>
                            <td style="padding:5px; border-bottom:1px solid #000; border-right:1px solid #000; text-align:center; background:#f9f9f9;">종 목</td>
                            <td style="padding:5px; border-bottom:1px solid #000;">도서관용품, 가구</td>
                        </tr>
                        <tr>
                            <td style="padding:5px; border-right:1px solid #000; text-align:center; background:#f9f9f9;">전화번호</td>
                            <td colspan="3" style="padding:5px;">Tel: 1544-5703 / Fax: 051-518-5985</td>
                        </tr>
                    </table>
                </div>
            </div>

            <table style="width:100%; border-collapse:collapse; border:2px solid #000; margin-bottom:20px;">
                <thead>
                    <tr style="background:#f2f2f2; font-weight:700;">
                        <td style="border:1px solid #000; padding:10px; text-align:center; width:30px;">NO</td>
                        <td style="border:1px solid #000; padding:10px; text-align:center;">품명 및 규격</td>
                        <td style="border:1px solid #000; padding:10px; text-align:center; width:60px;">단위</td>
                        <td style="border:1px solid #000; padding:10px; text-align:center; width:50px;">수량</td>
                        <td style="border:1px solid #000; padding:10px; text-align:center; width:100px;">단가</td>
                        <td style="border:1px solid #000; padding:10px; text-align:center; width:100px;">합계금액</td>
                        <td style="border:1px solid #000; padding:10px; text-align:center; width:60px;">비고</td>
                    </tr>
                </thead>
                <tbody style="min-height:300px;">
                    ${itemRows}
                    <!-- 빈 행 추가 (레이아웃 조절용) -->
                    ${Array(Math.max(0, 10 - cart.length)).fill(0).map(() => `<tr><td style="border:1px solid #000; height:30px;"></td><td style="border:1px solid #000;"></td><td style="border:1px solid #000;"></td><td style="border:1px solid #000;"></td><td style="border:1px solid #000;"></td><td style="border:1px solid #000;"></td><td style="border:1px solid #000;"></td></tr>`).join('')}
                </tbody>
                <tfoot>
                    <tr style="background:#f9f9f9; font-weight:700;">
                        <td colspan="2" style="border:1px solid #000; padding:12px; text-align:center; font-size:14px;">합 계 (TOTAL)</td>
                        <td colspan="5" style="border:1px solid #000; padding:12px; text-align:right; font-size:16px;">￦ ${total.toLocaleString()}</td>
                    </tr>
                </tfoot>
            </table>

            <div style="margin-top:20px; border:1px solid #ddd; padding:15px; border-radius:5px; line-height:1.6; font-size:11px; color:#666;">
                <p>● <strong>유효기간</strong>: ${validStr}</p>
                <p>● <strong>납기기한</strong>: 발주 후 7~10일 이내 (사전협의 가)</p>
                <p>● <strong>기타문의</strong>: 고객센터 1544-5703으로 연락주시기 바랍니다.</p>
                <p>● <strong>결제계좌</strong>: (예금주:주식회사에스지라이뮤) 기업은행 010-1544-5703-00</p>
            </div>
        `;

        // 6. PDF 변환 및 다운로드
        const opt = {
            margin:       10,
            filename:     `견적서_${purchaserInfo.name}_${today.getTime()}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        if (window.html2pdf) {
            await html2pdf().set(opt).from(element).save();
        } else {
            console.error('html2pdf 라이브러리를 찾을 수 없습니다.');
            alert('PDF 생성 도구를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
        }

    } catch (err) {
        console.error('PDF 생성 중 오류:', err);
        alert('견적서 생성 중 오류가 발생했습니다.');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}
