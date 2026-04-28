// inquiry.js - 실시간 견적/문의 모달 로직 (고객용)
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// SG LIMU Supabase 연결정보 (퍼블릭 Key)
const SUPABASE_URL = 'https://xxvfgnoffomrhtxitqkj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Q4t2p9WcUBdtUxd7HYV56A_MvxnZRk9';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
    // 1. 팝업창 HTML을 바디 맨 끝에 주입
    const inquiryHTML = `
        <div id="inquiryOverlay" class="inquiry-overlay">
            <div class="inquiry-box">
                <div class="inquiry-header">
                    <h3><i class="fa-solid fa-headset"></i> 제품 견적/상담 문의</h3>
                    <button class="inquiry-close" id="inquiryCloseBtn">&times;</button>
                </div>
                <div class="inquiry-body">
                    <p style="margin-bottom:20px; font-size:0.95rem; color:#666; line-height:1.5;">필요하신 제품과 요구사항을 남겨주시면, SG LIMU 담당자가 빠르게 확인 후 답변해 드립니다.</p>
                    
                    <div class="inquiry-form-group">
                        <label>고객명 / 소속 기관명 *</label>
                        <input type="text" id="inqAuthor" class="inquiry-control" placeholder="예: 홍길동 / 백두도서관">
                    </div>
                    <div class="inquiry-form-group">
                        <label>연락처 (휴대폰 또는 유선) *</label>
                        <input type="text" id="inqPhone" class="inquiry-control" placeholder="예: 010-1234-5678">
                    </div>
                    <div class="inquiry-form-group">
                        <label>문의 제품 및 상세 내용 *</label>
                        <textarea id="inqTitle" class="inquiry-control" rows="4" placeholder="견적이 필요한 수량, 배송 지역, 기타 궁금하신 점을 자유롭게 입력해 주세요."></textarea>
                    </div>
                </div>
                <div class="inquiry-footer">
                    <button class="btn-inquiry-submit" id="inquirySubmitBtn">상담/견적 요청 접수하기</button>
                    <p class="inquiry-desc" id="inquiryStatusMsg">* 입력하신 정보는 원활한 상담을 위해서만 활용됩니다.</p>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', inquiryHTML);

    const overlay = document.getElementById('inquiryOverlay');
    const closeBtn = document.getElementById('inquiryCloseBtn');
    const submitBtn = document.getElementById('inquirySubmitBtn');
    const statusMsg = document.getElementById('inquiryStatusMsg');

    const inqAuthor = document.getElementById('inqAuthor');
    const inqPhone = document.getElementById('inqPhone');
    const inqTitle = document.getElementById('inqTitle');

    // 2. 화면의 [견적문의] 버튼들에 이벤트 연결
    // koas-cam.html 등의 버튼 클래스는 btn-buy 로 되어있음
    const buyBtns = document.querySelectorAll('.btn-buy');
    
    buyBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            // 보고 있던 상품명 가져오기
            const TitleEl = document.querySelector('.product-title h1');
            const pName = TitleEl ? TitleEl.innerText : document.title;
            
            inqTitle.value = `[문의상품: ${pName}]\n\n`; // 내용에 상품명 자동 기입
            inqAuthor.value = '';
            inqPhone.value = '';
            statusMsg.textContent = '* 입력하신 정보는 원활한 상담을 위해서만 활용됩니다.';
            statusMsg.style.color = '#7f8c8d';
            
            overlay.classList.add('active'); // 모달 켜기
        });
    });

    closeBtn.addEventListener('click', () => overlay.classList.remove('active'));
    overlay.addEventListener('click', (e) => {
        if(e.target === overlay) overlay.classList.remove('active');
    });

    // 3. 폼 전송버튼 (Supabase Insert 로직)
    submitBtn.addEventListener('click', async () => {
        const authorVal = inqAuthor.value.trim();
        const phoneVal = inqPhone.value.trim();
        const titleVal = inqTitle.value.trim();

        if(!authorVal || !phoneVal || !titleVal) {
            statusMsg.textContent = '❌ 필수 입력 항목을 모두 채워주세요.';
            statusMsg.style.color = '#e74c3c';
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = '정보 전송 중...';

        try {
            const { data, error } = await supabase
                .from('inquiries')
                .insert([{
                    author: authorVal,
                    phone: phoneVal,
                    title: titleVal,
                    status: 'open'
                }]);

            if (error) throw error;

            statusMsg.textContent = '✅ 견적 문의가 성공적으로 접수되었습니다! 곧 연락드리겠습니다.';
            statusMsg.style.color = '#8ec342';
            
            // 2초 뒤 모달 닫기
            setTimeout(() => {
                overlay.classList.remove('active');
                submitBtn.disabled = false;
                submitBtn.textContent = '상담/견적 요청 접수하기';
            }, 2000);

        } catch (err) {
            console.error('Inquiry Error:', err);
            statusMsg.textContent = '❌ 전송에 실패했습니다. 네트워크를 확인해주세요.';
            statusMsg.style.color = '#e74c3c';
            submitBtn.disabled = false;
            submitBtn.textContent = '재시도하기';
        }
    });
});
