// admin.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// ==========================================
// 🚨 사용자(관리자)님, 여기에 Supabase 설정값을 넣어주세요! 🚨
// ==========================================
const SUPABASE_URL = 'https://xxvfgnoffomrhtxitqkj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Q4t2p9WcUBdtUxd7HYV56A_MvxnZRk9';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// 사이트 통합 카테고리 정의 (전역 참조용)
// ==========================================
const SITE_CATEGORIES = {
    'system': {
        icon: 'fa-server', label: '도서관리시스템',
        subs: [
            { id: 'rfid-cat-tag', name: 'RFID > 태그 (TAG)' },
            { id: 'rfid-cat-anti', name: 'RFID > 분실 방지기' },
            { id: 'rfid-cat-reader', name: 'RFID > 리더기' },
            { id: 'rfid-cat-return', name: 'RFID > 대출 반납기' },
            { id: 'em-cat-0', name: 'EM > 분실 방지기' },
            { id: 'em-cat-1', name: 'EM > 감응제거재생기' },
            { id: 'em-cat-2', name: 'EM > 감응 테이프' }
        ]
    },
    'supplies': {
        icon: 'fa-box-open', label: '도서관 용품',
        subs: [
            { id: 'supplies-arrange-cat-0', name: '정리 > 키퍼' },
            { id: 'supplies-arrange-cat-1', name: '정리 > 색띠라벨' },
            { id: 'supplies-arrange-cat-2', name: '정리 > 라벨용지' },
            { id: 'supplies-arrange-cat-3', name: '정리 > 장갑' },
            { id: 'supplies-arrange-cat-4', name: '정리 > 도장' },
            { id: 'supplies-arrange-cat-5', name: '정리 > 북앤드' },
            { id: 'supplies-arrange-cat-6', name: '정리 > 기타' },
            { id: 'supplies-protect-cat-0', name: '보호 > 필모시리즈' },
            { id: 'supplies-protect-cat-1', name: '보호 > 중성풀' },
            { id: 'supplies-protect-cat-2', name: '보호 > 양면테이프' },
            { id: 'supplies-protect-cat-3', name: '보호 > 북커버' },
            { id: 'supplies-lend-cat-0', name: '대출 > 바코드' },
            { id: 'supplies-lend-cat-1', name: '대출 > 카드프린터/기기' },
            { id: 'supplies-lend-cat-2', name: '대출 > 회원증카드' },
            { id: 'supplies-lend-cat-3', name: '대출 > 감열지' },
            { id: 'sterilizer-cat-0', name: '책소독기 소모품' }
        ]
    },
    'furniture': {
        icon: 'fa-chair', label: '도서관 가구',
        subs: [
            { id: 'koas-cat-0', name: '코아스 > 서가' },
            { id: 'koas-cat-1', name: '코아스 > 테이블' },
            { id: 'koas-cat-2', name: '코아스 > 의자' },
            { id: 'koas-cat-3', name: '코아스 > 기타' },
            { id: 'fomus-cat-0', name: '포머스 > 서가' },
            { id: 'fomus-cat-1', name: '포머스 > 테이블' },
            { id: 'fomus-cat-2', name: '포머스 > 의자' },
            { id: 'fomus-cat-3', name: '포머스 > 기타' },
            { id: 'fursys-cat-0', name: '퍼시스 > 서가' },
            { id: 'fursys-cat-1', name: '퍼시스 > 테이블' },
            { id: 'fursys-cat-2', name: '퍼시스 > 의자' },
            { id: 'fursys-cat-3', name: '퍼시스 > 기타' }
        ]
    },
    'signage': {
        icon: 'fa-scroll', label: '사인물',
        subs: [
            { id: 'sign-class-cat-0', name: '분류/대분류 표지판' },
            { id: 'sign-board-cat-0', name: '게시판/이용안내' },
            { id: 'sign-date-cat-0', name: '대출반납일력표' },
            { id: 'sign-custom-cat-0', name: '제작 사인물' }
        ]
    },
    'discount': {
        icon: 'fa-tags', label: '할인상품',
        subs: [
            { id: 'discount-cat-0', name: '할인상품 전체' }
        ]
    }
};

// DOM Elements - Login & Global
const loginOverlay = document.getElementById('loginOverlay');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const emailInput = document.getElementById('adminEmail');
const passInput = document.getElementById('adminPassword');
const loginMessage = document.getElementById('loginMessage');

// DOM Elements - Navigation Tabs
const navItems = document.querySelectorAll('.nav-item');
const tabPanes = document.querySelectorAll('.tab-pane');

// DOM Elements - Product Management (Tab 1)
const productTableBody = document.getElementById('productTableBody');
const addProductBtn = document.getElementById('addProductBtn');

// DOM Elements - Order Stats (Tab 2)
const downloadExcelBtn = document.getElementById('downloadExcelBtn');
const downloadProductExcelBtn = document.getElementById('downloadProductExcelBtn');
let globalOrders = []; // 엑셀 다운로드를 위해 데이터를 캐싱하는 변수
let globalProducts = []; // 제품 엑셀 다운로드를 위한 캐시

// Product Modal Elements
const modalOverlay = document.getElementById('productModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const saveProductBtn = document.getElementById('saveProductBtn');
const saveMsg = document.getElementById('saveMsg');
const modalTitle = document.getElementById('modalTitle');

const productIdInput = document.getElementById('productId');
const productNameInput = document.getElementById('productName');
const productCategoryInput = document.getElementById('productCategory');
const productPriceInput = document.getElementById('productPrice');
const productStockInput = document.getElementById('productStock');
const productDescInput = document.getElementById('productDesc');
const productImageFile = document.getElementById('productImageFile');
const productImageUrl = document.getElementById('productImageUrl');
const imagePreview = document.getElementById('imagePreview');

// DOM Elements - Banner Management (Tab 4)
const bannerTableBody = document.getElementById('bannerTableBody');
const addBannerBtn = document.getElementById('addBannerBtn');

// Banner Modal Elements
const bannerModalOverlay = document.getElementById('bannerModal');
const closeBannerModalBtn = document.getElementById('closeBannerModalBtn');
const cancelBannerModalBtn = document.getElementById('cancelBannerModalBtn');
const saveBannerBtn = document.getElementById('saveBannerBtn');
const saveBannerMsg = document.getElementById('saveBannerMsg');
const bannerModalTitle = document.getElementById('bannerModalTitle');

const bannerIdInput = document.getElementById('bannerId');
const bannerTypeInput = document.getElementById('bannerType');
const bannerIsActiveInput = document.getElementById('bannerIsActive');
const bannerLinkUrlInput = document.getElementById('bannerLinkUrl');
const bannerImageFile = document.getElementById('bannerImageFile');
const bannerImageUrl = document.getElementById('bannerImageUrl');
const bannerImagePreview = document.getElementById('bannerImagePreview');
const bannerDisplayOrderInput = document.getElementById('bannerDisplayOrder');

// ==========================================
// 1. 로그인 / 세션 관리
// ==========================================
async function checkSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (session) {
        loginOverlay.style.display = 'none';
        initDashboard(); // 로그인 성공 시 대시보드 강제 초기화
    } else {
        loginOverlay.style.display = 'flex';
    }
}

loginBtn.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passInput.value;
    
    if(!email || !password) {
        loginMessage.textContent = '이메일과 비밀번호를 입력해주세요.';
        return;
    }

    loginBtn.textContent = '로그인 중...';
    loginBtn.disabled = true;

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        loginMessage.textContent = '로그인 실패: ' + error.message;
        loginBtn.textContent = '로그인';
        loginBtn.disabled = false;
    } else {
        loginOverlay.style.display = 'none';
        emailInput.value = '';
        passInput.value = '';
        initDashboard();
    }
});

logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    location.reload(); // 깔끔하게 화면 전체 새로고침
});

// ==========================================
// 2. 탭(메뉴) 전환 제어
// ==========================================
navItems.forEach(item => {
    item.addEventListener('click', () => {
        // 활성화 상태 토글
        navItems.forEach(nav => nav.classList.remove('active'));
        tabPanes.forEach(tab => tab.classList.remove('active'));

        item.classList.add('active');
        const targetId = item.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');

        // 해당 탭 접속 시 데이터 로드
        if(targetId === 'tab-products') {
            fetchProducts();
        } else if(targetId === 'tab-orders') {
            fetchOrders();
        } else if(targetId === 'tab-inquiries') {
            fetchInquiries();
        } else if(targetId === 'tab-banners') {
            fetchBanners();
        } else if(targetId === 'tab-users') {
            fetchUsers();
        } else if(targetId === 'tab-page-manage') {
            initPageManageTab();
        } else if(targetId === 'tab-category-display') {
            initCategoryDisplayTab();
        }
    });
});

function initDashboard() {
    // 최초 접속 시 제품 관리 탭 로드
    document.querySelector('.nav-item[data-target="tab-products"]').click();
}

// ==========================================
// 3. (기존) 제품 목록 로드 / CRUD 
// ==========================================
async function fetchProducts() {
    productTableBody.innerHTML = '<tr><td colspan="7" class="empty-state">데이터를 불러오는 중입니다...</td></tr>';
    
    const { data: products, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    globalProducts = products || [];

    if (error) {
        console.error('Error fetching products:', error);
        productTableBody.innerHTML = `<tr><td colspan="7" class="empty-state" style="color:red"><i class="fa-solid fa-triangle-exclamation"></i> 오류: ${error.message}</td></tr>`;
        return;
    }

    if (products.length === 0) {
        productTableBody.innerHTML = '<tr><td colspan="7" class="empty-state">등록된 제품이 없습니다. 새 제품 등록 버튼을 눌러주세요.</td></tr>';
        return;
    }

    productTableBody.innerHTML = '';
    products.forEach(p => {
        const tr = document.createElement('tr');
        const imgHtml = p.image_url ? `<img src="${p.image_url}" class="td-img" alt="${p.name}">` : `<div class="td-img" style="background:#eee; display:flex; align-items:center; justify-content:center; color:#999; font-size:0.8rem;">NO IMG</div>`;
        const dateStr = new Date(p.created_at).toLocaleDateString('ko-KR');

        // 카테고리 라벨 매핑
        let displayCategory = p.category;
        for (const key in SITE_CATEGORIES) {
            const sub = SITE_CATEGORIES[key].subs.find(s => s.id === p.category);
            if (sub) {
                displayCategory = `${SITE_CATEGORIES[key].label} > ${sub.name.split('>').pop().trim()}`;
                break;
            }
        }
        if (p.category === 'best_product') displayCategory = '★ 베스트 상품';

        tr.innerHTML = `
            <td>${imgHtml}</td>
            <td style="font-weight:600;">${p.name}</td>
            <td><span style="background:#eaf2f8; color:#2980b9; padding:3px 8px; border-radius:3px; font-size:0.8rem;">${displayCategory}</span></td>
            <td>${p.price}</td>
            <td>${p.stock}개</td>
            <td style="color:#666; font-size:0.9rem;">${dateStr}</td>
            <td>
                <button class="action-btn edit" onclick="editProduct('${p.id}')" title="수정"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="action-btn delete" onclick="deleteProduct('${p.id}', '${p.name}')" title="삭제"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        productTableBody.appendChild(tr);
    });

    // [신규] '상세페이지 관리' 탭의 Select 옵션을 동적으로 업데이트
    const targetSelect = document.getElementById('targetPageId');
    if (targetSelect) {
        if (products.length > 0) {
            targetSelect.innerHTML = products.map(p => 
                `<option value="${p.id}">${p.name} (${p.category})</option>`
            ).join('');
            
            // 만약 '상세페이지 관리' 탭이 활성화되어 있다면 즉시 이벤트 발생시켜 데이터 로드
            if(document.getElementById('tab-page-manage').classList.contains('active')) {
                const event = new Event('change');
                targetSelect.dispatchEvent(event);
            }
        } else {
            targetSelect.innerHTML = '<option value="">등록된 제품이 없습니다. 먼저 제품을 등록하세요.</option>';
        }
    }

    // [신규] '카테고리 전시 관리' 탭의 체크박스 그리드 동적 업데이트
    const displayCheckboxGrid = document.getElementById('productCheckboxGrid');
    if (displayCheckboxGrid) {
        if (products.length > 0) {
            displayCheckboxGrid.innerHTML = products.map(p => `
                <label style="display:flex; align-items:center; gap:8px; padding:10px; background:#fff; border:1px solid #ddd; border-radius:4px; cursor:pointer; transition:background 0.2s;">
                    <input type="checkbox" class="display-item-cb" value="${p.id}" style="transform:scale(1.3); margin-right:5px;">
                    <div style="font-size:0.95rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${p.name}">
                        <span style="color:#2980b9; font-size:0.75rem; font-weight:bold;">[${p.category}]</span><br>
                        ${p.name}
                    </div>
                </label>
            `).join('');
            
            // 카테고리 전시 관리 탭이 활성화된 상태라면 체크박스 상태 갱신
            if(document.getElementById('tab-category-display').classList.contains('active')) {
                const secSelect = document.getElementById('targetDisplaySection');
                if(secSelect) secSelect.dispatchEvent(new Event('change'));
            }
        } else {
            displayCheckboxGrid.innerHTML = '<div style="color:#999;">등록된 제품이 없습니다.</div>';
        }
    }
}

// 제품 재고 엑셀 다운로드 함수
function downloadProductExcel() {
    if (globalProducts.length === 0) {
        alert('다운로드할 제품 데이터가 없습니다.');
        return;
    }

    // 엑셀에 들어갈 데이터 정리
    const data = globalProducts.map(p => ({
        '제품ID': p.id,
        '제품명': p.name,
        '카테고리': p.category,
        '판매가격': p.price,
        '현재고량': (p.stock || 0) + '개',
        '등록일시': new Date(p.created_at).toLocaleString('ko-KR')
    }));

    // SheetJS를 사용하여 엑셀 생성
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "재고현황");

    // 컬럼 너비 조정
    const wscols = [
        {wch: 20}, // ID
        {wch: 35}, // 제품명
        {wch: 20}, // 카테고리
        {wch: 15}, // 가격
        {wch: 10}, // 재고
        {wch: 25}  // 등록일
    ];
    worksheet['!cols'] = wscols;

    // 파일 내보내기
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `SG_LIMU_재고현황_${dateStr}.xlsx`);
}

// 이벤트 리스너 등록
if(downloadProductExcelBtn) {
    downloadProductExcelBtn.addEventListener('click', downloadProductExcel);
}

// 색상 입력 필드 동적 생성 함수
function createColorRow(val = '') {
    const container = document.getElementById('colorContainer');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'color-row';
    div.style.cssText = "display:flex; align-items:center; gap:5px; background:#fff; padding:5px 10px; border:1px solid #ddd; border-radius:20px;";
    div.innerHTML = `
        <input type="text" value="${val}" placeholder="색상명" style="border:none; outline:none; font-size:0.9rem; width:80px;">
        <i class="fa-solid fa-xmark" style="cursor:pointer; color:#999; font-size:0.8rem;" onclick="this.parentElement.remove()"></i>
    `;
    container.appendChild(div);
}

// 색상 추가 버튼 이벤트 리스너
const addColorBtn = document.getElementById('addColorBtn');
if (addColorBtn) {
    addColorBtn.addEventListener('click', () => createColorRow(''));
}

// 사이즈 입력 필드 동적 생성 함수
function createSizeRow(val = '') {
    const container = document.getElementById('sizeContainer');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'size-row';
    div.style.cssText = "display:flex; align-items:center; gap:5px; background:#fff; padding:5px 10px; border:1px solid #ddd; border-radius:20px;";
    
    // 명칭:금액 분리 파싱
    const parts = val.split(':');
    const name = parts[0] || '';
    const price = parts[1] || '0';

    div.innerHTML = `
        <input type="text" value="${name}" placeholder="사이즈명" style="border:none; outline:none; font-size:0.9rem; width:80px;">
        <span style="color:#eee">|</span>
        <input type="number" value="${price}" placeholder="추가금" style="border:none; outline:none; font-size:0.9rem; width:60px;">
        <i class="fa-solid fa-xmark" style="cursor:pointer; color:#999; font-size:0.8rem;" onclick="this.parentElement.remove()"></i>
    `;
    container.appendChild(div);
}

// 사이즈 추가 버튼 이벤트 리스너
const addSizeBtn = document.getElementById('addSizeBtn');
if (addSizeBtn) {
    addSizeBtn.addEventListener('click', () => createSizeRow(''));
}

// 모달 및 제품 CRUD 로직은 그대로 복원
function openModal(isEdit = false) {
    if (!isEdit) {
        modalTitle.textContent = '새 제품 등록';
        productIdInput.value = ''; productNameInput.value = ''; productPriceInput.value = '전화문의';
        productStockInput.value = '999'; productDescInput.value = ''; productImageUrl.value = ''; productImageFile.value = '';
        imagePreview.innerHTML = '<i class="fa-regular fa-image" style="font-size: 2rem; color: #ccc;"></i>';
        const colorContainer = document.getElementById('colorContainer');
        if(colorContainer) colorContainer.innerHTML = ''; // 색상 초기화
        const sizeContainer = document.getElementById('sizeContainer');
        if(sizeContainer) sizeContainer.innerHTML = ''; // 사이즈 초기화
    } else {
        modalTitle.textContent = '제품 정보 수정';
    }
    saveMsg.textContent = ''; saveProductBtn.disabled = false; saveProductBtn.textContent = '저장하기';
    modalOverlay.style.display = 'flex';
}
function closeModal() { modalOverlay.style.display = 'none'; }
addProductBtn.addEventListener('click', () => openModal(false));
closeModalBtn.addEventListener('click', closeModal);
cancelModalBtn.addEventListener('click', closeModal);

productImageFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => { imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`; };
        reader.readAsDataURL(file);
    }
});

saveProductBtn.addEventListener('click', async () => {
    const payload = {
        name: productNameInput.value.trim(), category: productCategoryInput.value,
        price: productPriceInput.value.trim(), stock: parseInt(productStockInput.value) || 0,
        description: productDescInput.value.trim(), image_url: productImageUrl.value,
        colors: Array.from(document.querySelectorAll('#colorContainer .color-row input')).map(inp => inp.value).filter(v => v).join(','),
        sizes: Array.from(document.querySelectorAll('#sizeContainer .size-row')).map(row => {
            const inps = row.querySelectorAll('input');
            const name = inps[0].value.trim();
            const price = inps[1].value.trim() || '0';
            return name ? `${name}:${price}` : null;
        }).filter(v => v).join(',')
    };
    if (!payload.name) { saveMsg.textContent = '제품명은 필수입니다!'; return; }

    saveProductBtn.disabled = true; saveProductBtn.textContent = '저장 중...';
    const file = productImageFile.files[0];

    // 스토리지 업로드
    if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `products/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, file);
        if (uploadError) { saveMsg.textContent = '업로드 오류: ' + uploadError.message; saveProductBtn.disabled=false; saveProductBtn.textContent='저장하기'; return; }
        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
        payload.image_url = publicUrl;
    }

    const id = productIdInput.value;
    
    // [폴백 로직] 컬럼이 없을 경우를 대비해 description에도 색상/사이즈 정보 포함 (기존 마커 제거 후 새로 추가)
    const colorTag = `[[C:${payload.colors}]]`;
    const sizeTag = `[[S:${payload.sizes}]]`;
    let cleanDesc = payload.description.replace(/\[\[C:.*?\]\]/g, '').replace(/\[\[S:.*?\]\]/g, '').trim();
    const payloadWithDescFallback = { ...payload, description: (cleanDesc + "\n\n" + colorTag + "\n" + sizeTag).trim() };

    let error = null;
    if (id) {
        const { error: updateError } = await supabase.from('products').update(payload).eq('id', id);
        error = updateError;
        // 컬럼이 없어서 실패한 경우 폴백 실행
        if (error && (error.message.includes("colors") || error.message.includes("sizes"))) {
            console.warn("Falling back to description for colors and sizes...");
            const { colors, sizes, ...fallbackPayload } = payloadWithDescFallback;
            const { error: fallbackError } = await supabase.from('products').update(fallbackPayload).eq('id', id);
            error = fallbackError;
        }
    } else {
        const { error: insertError } = await supabase.from('products').insert([payload]);
        error = insertError;
        // 컬럼이 없어서 실패한 경우 폴백 실행
        if (error && (error.message.includes("colors") || error.message.includes("sizes"))) {
            console.warn("Falling back to description for colors and sizes...");
            const { colors, sizes, ...fallbackPayload } = payloadWithDescFallback;
            const { error: fallbackError } = await supabase.from('products').insert([fallbackPayload]);
            error = fallbackError;
        }
    }

    if (error) {
        saveMsg.textContent = '저장 실패: ' + error.message;
    } else {
        closeModal(); fetchProducts();
    }
    
    saveProductBtn.disabled = false;
    saveProductBtn.textContent = '저장하기';
});

window.editProduct = async (id) => {
    const { data: p, error } = await supabase.from('products').select('*').eq('id', id).single();
    if (error) { alert("데이터 불러오기 실패"); return; }
    openModal(true);
    productIdInput.value = p.id; productNameInput.value = p.name; productCategoryInput.value = p.category;
    productPriceInput.value = p.price; productStockInput.value = p.stock; 
    
    // 상세 설명 로드 시 색상/사이즈 태그 제거 처리
    productDescInput.value = (p.description || '').replace(/\[\[C:.*?\]\]/g, '').replace(/\[\[S:.*?\]\]/g, '').trim();
    
    productImageUrl.value = p.image_url || '';
    imagePreview.innerHTML = p.image_url ? `<img src="${p.image_url}">` : '<i class="fa-regular fa-image" style="font-size: 2rem; color: #ccc;"></i>';
    
    // 색상/사이즈 데이터 로드 (컬럼 우선, 없으면 description에서 파싱)
    const colorContainer = document.getElementById('colorContainer');
    const sizeContainer = document.getElementById('sizeContainer');

    if(colorContainer) {
        colorContainer.innerHTML = '';
        let colorData = p.colors;
        if(!colorData && p.description) {
            const match = p.description.match(/\[\[C:(.*?)\]\]/);
            if(match) colorData = match[1];
        }
        if(colorData) {
            colorData.split(',').forEach(c => createColorRow(c.trim()));
        }
    }

    if(sizeContainer) {
        sizeContainer.innerHTML = '';
        let sizeData = p.sizes;
        if(!sizeData && p.description) {
            const match = p.description.match(/\[\[S:(.*?)\]\]/);
            if(match) sizeData = match[1];
        }
        if(sizeData) {
            sizeData.split(',').forEach(s => createSizeRow(s.trim()));
        }
    }
};

window.deleteProduct = async (id, name) => {
    if(confirm(`"${name}" 제품을 영구 삭제하시겠습니까?`)) {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) alert('삭제 실패: ' + error.message); else fetchProducts();
    }
};

// ==========================================
// 4. [신규] 주문 통계 데이터 로드 및 분석 차트
// ==========================================
let orderChartInstance = null;
let revenueChartInstance = null;

async function fetchOrders() {
    const tableBody = document.getElementById('orderTableBody');
    if(!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="8" class="empty-state">분석 데이터를 불러오는 중입니다...</td></tr>';
    
    // orders 테이블에서 가져오기
    const { data: orders, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });

    if (error) {
        console.warn('Orders Table 에러:', error.message);
        tableBody.innerHTML = `<tr><td colspan="8" class="empty-state" style="color:var(--danger)">
            <i class="fa-solid fa-triangle-exclamation" style="font-size:2rem;margin-bottom:10px;"></i><br>
            <b>'orders'</b> 테이블을 불러올 수 없습니다. (${error.message})<br>
            <div style="font-size:0.8rem; background:#f9f9f9; padding:10px; margin-top:10px; text-align:left; border-radius:4px;">
                SQL Editor에서 다음을 실행하세요:<br>
                <code>CREATE TABLE orders (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), customer_name text, product_name text, total_price int, status text, created_at timestamp with time zone DEFAULT now());</code>
            </div>
        </td></tr>`;
        return;
    }

    if (!orders || orders.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="empty-state">결제/접수된 주문 내역이 없습니다.</td></tr>';
        renderOrderChart([]); // 빈 차트
        document.getElementById('totalOrderCount').textContent = "0건";
        document.getElementById('totalOrderRevenue').textContent = "0원";
        document.getElementById('pendingOrderCount').textContent = "0건";
        return;
    }

    globalOrders = orders; // 엑셀 다운로드용 전역변수
    tableBody.innerHTML = '';
    
    let totalRevenue = 0;
    let pendingCount = 0;

    orders.forEach(o => {
        const tr = document.createElement('tr');
        const createdAt = o.created_at ? new Date(o.created_at) : new Date();
        const dateStr = createdAt.toLocaleString('ko-KR');
        
        // 상태 뱃지 UI
        const status = o.status || 'pending';
        const statusStr = status === 'pending' ? '<span style="color:var(--danger);font-weight:bold;">배송준비</span>' : 
                          status === 'shipped' ? '<span style="color:#3498db;font-weight:bold;">배송진행</span>' : 
                          '<span style="color:var(--success);font-weight:bold;">완료됨</span>';

        const rawPrice = Number(o.total_price) || 0;
        const displayId = o.id ? o.id.toString().substring(0,8).toUpperCase() : 'N/A';

        tr.innerHTML = `
            <td>#${displayId}</td>
            <td style="font-weight:600;">${o.customer_name || '익명'}</td>
            <td>${o.product_name || '정보없음'}</td>
            <td>${o.quantity || 0}개</td>
            <td style="font-weight:600;">${rawPrice.toLocaleString()}원</td>
            <td>${statusStr}</td>
            <td style="font-size:0.9rem; color:#666;">${dateStr}</td>
            <td><button class="action-btn" title="주문 관리(준비중)"><i class="fa-solid fa-pen"></i></button></td>
        `;
        tableBody.appendChild(tr);

        totalRevenue += rawPrice;
        if(status === 'pending') pendingCount++;
    });

    // 상단 Dashboard 요약창 정보 업데이트
    if(document.getElementById('totalOrderCount')) document.getElementById('totalOrderCount').textContent = orders.length + "건";
    if(document.getElementById('totalOrderRevenue')) document.getElementById('totalOrderRevenue').textContent = totalRevenue.toLocaleString() + "원";
    if(document.getElementById('pendingOrderCount')) document.getElementById('pendingOrderCount').textContent = pendingCount + "건";

    // 분석 차트 렌더링 (건수 및 매출액)
    renderAnalysisCharts(orders);
}

// Chart.js를 사용한 일별 통계 렌더링 (주문 건수 + 매출액)
function renderAnalysisCharts(orders) {
    const orderCanvas = document.getElementById('orderChart');
    const revenueCanvas = document.getElementById('revenueChart');
    if(!orderCanvas || !revenueCanvas) return;
    
    // 최근 7일 라벨 및 데이터 초기화
    const today = new Date();
    today.setHours(0,0,0,0);

    const labels = [];
    const countData = [0, 0, 0, 0, 0, 0, 0];
    const revenueData = [0, 0, 0, 0, 0, 0, 0];

    for(let i=6; i>=0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        labels.push((d.getMonth()+1) + '/' + d.getDate());
    }

    orders.forEach(o => {
        if(!o.created_at) return;
        const orderDate = new Date(o.created_at);
        orderDate.setHours(0,0,0,0);

        const diffTime = today.getTime() - orderDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        if(diffDays >= 0 && diffDays < 7) {
            countData[6 - diffDays]++;
            revenueData[6 - diffDays] += Number(o.total_price) || 0;
        }
    });

    // 1. 주문 건수 차트 (막대)
    if(orderChartInstance) orderChartInstance.destroy();
    orderChartInstance = new Chart(orderCanvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '주문 건수',
                data: countData,
                backgroundColor: 'rgba(142, 195, 66, 0.8)',
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
            plugins: { legend: { display: false } }
        }
    });

    // 2. 매출액 추이 차트 (라인)
    if(revenueChartInstance) revenueChartInstance.destroy();
    revenueChartInstance = new Chart(revenueCanvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '매출액 (원)',
                data: revenueData,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#3498db'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { 
                y: { 
                    beginAtZero: true,
                    ticks: { callback: (value) => value.toLocaleString() + '원' }
                } 
            },
            plugins: { 
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => context.raw.toLocaleString() + '원'
                    }
                }
            }
        }
    });
}

// SheetJS를 활용한 엑셀 다운로드 트리거
downloadExcelBtn.addEventListener('click', () => {
    if(globalOrders.length === 0) {
        alert("엑셀로 다운로드할 배송 기록/통계 데이터가 하나도 존재하지 않습니다.");
        return;
    }

    // 엑셀 표로 만들 데이터 가공 (한글 컬럼 적용)
    const excelData = globalOrders.map(o => ({
        "접수번호": o.id,
        "고객명/소속": o.customer_name,
        "연락처": o.customer_phone || "미입력",
        "주문 상품명": o.product_name,
        "구매 수량": o.quantity,
        "총 결제/청구액": o.total_price,
        "처리 상태": o.status === 'pending' ? '배송준비중' : o.status === 'shipped' ? '배송중' : '처리완료',
        "접수 일자 (KST 기준)": new Date(o.created_at).toLocaleString('ko-KR')
    }));

    // 가상 워크북 및 시트 생성
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "통계 집계결과(Orders)");
    
    // 파일 다운로드
    const todayStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `SG_LIMU_총주문통계_${todayStr}.xlsx`);
});

// ==========================================
// 5. 기타 제안 기능(견적, 배너, 회원) 더미 로드 함수
// ==========================================
async function fetchInquiries() {
    const tBody = document.getElementById('inquiryTableBody');
    tBody.innerHTML = '<tr><td colspan="7" class="empty-state">고객 문의 데이터를 불러오는 중입니다...</td></tr>';
    
    const { data: inquiries, error } = await supabase.from('inquiries').select('*').order('created_at', { ascending: false });

    if(error) {
        tBody.innerHTML = `<tr><td colspan="7" class="empty-state" style="color:#e74c3c;"><i class="fa-solid fa-triangle-exclamation"></i> 테이블 구조 불일치 또는 미생성 에러입니다.<br>${error.message}</td></tr>`;
        return;
    }

    if(inquiries.length === 0) {
        tBody.innerHTML = `<tr><td colspan="7" class="empty-state">접수된 견적/상담 문의 내역이 없습니다. (고객의 연락을 기다리는 중)</td></tr>`;
        return;
    }

    tBody.innerHTML = '';
    inquiries.forEach(inq => {
        const tr = document.createElement('tr');
        const dateStr = new Date(inq.created_at).toLocaleString('ko-KR');
        
        let statusBadge = '';
        if(inq.status === 'open') statusBadge = '<span style="background:#e74c3c;color:#fff;padding:4px 8px;border-radius:12px;font-size:0.8rem;"><i class="fa-solid fa-circle-exclamation"></i> 신규접수</span>';
        else if(inq.status === 'processing') statusBadge = '<span style="background:#f39c12;color:#fff;padding:4px 8px;border-radius:12px;font-size:0.8rem;"><i class="fa-solid fa-spinner"></i> 확인중</span>';
        else statusBadge = '<span style="background:#2ecc71;color:#fff;padding:4px 8px;border-radius:12px;font-size:0.8rem;"><i class="fa-solid fa-check"></i> 답변완료</span>';

        tr.innerHTML = `
            <td>#${inq.id}</td>
            <td style="font-weight:600;">${inq.author}</td>
            <td>${inq.phone}</td>
            <td style="text-align:left; max-width:250px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${inq.title}">${inq.title}</td>
            <td style="font-size:0.9rem; color:#666;">${dateStr}</td>
            <td>${statusBadge}</td>
            <td>
                <select onchange="updateInquiryStatus(${inq.id}, this.value)" style="padding:5px; border-radius:4px; border:1px solid #ccc; font-size:0.9rem;">
                    <option value="open" ${inq.status === 'open' ? 'selected' : ''}>대기중</option>
                    <option value="processing" ${inq.status === 'processing' ? 'selected' : ''}>확인(처리)중</option>
                    <option value="closed" ${inq.status === 'closed' ? 'selected' : ''}>답변완료</option>
                </select>
                <button class="action-btn" style="margin-left:10px; color:#3498db" onclick="alert('👤 고객명/기관: ${inq.author}\\n📞 연락처: ${inq.phone}\\n🕒 접수일시: ${dateStr}\\n\\n📋 [문의 및 요청내용]\\n${inq.title.replace(/'/g, "\\'")}')" title="내용 전체보기"><i class="fa-solid fa-envelope-open-text"></i></button>
            </td>
        `;
        tBody.appendChild(tr);
    });
}

// 문의 상태 (답변완료 등) 변경 저장 함수 (전역)
window.updateInquiryStatus = async function(id, newStatus) {
    const { error } = await supabase.from('inquiries').update({ status: newStatus }).eq('id', id);
    if (error) {
        alert('상태 변경 중 오류: ' + error.message);
    } else {
        fetchInquiries(); // 화면 자동 재로딩
    }
}
async function fetchBanners() {
    // banners 테이블에서 데이터 가져오기 (순서 필드 기준 오름차순)
    const { data: banners, error } = await supabase.from('banners').select('*').order('display_order', { ascending: true }).order('created_at', { ascending: false });

    if (error) {
        bannerTableBody.innerHTML = `<tr><td colspan="7" class="empty-state" style="color:#e74c3c;">데이터베이스에 'banners' 테이블을 먼저 생성해주세요.<br>${error.message}</td></tr>`;
        return;
    }

    if (banners.length === 0) {
        bannerTableBody.innerHTML = '<tr><td colspan="7" class="empty-state">현재 등록된 배너/팝업이 없습니다.</td></tr>';
        return;
    }

    bannerTableBody.innerHTML = '';
    banners.forEach(b => {
        const tr = document.createElement('tr');
        const imgHtml = b.image_url ? `<img src="${b.image_url}" class="td-img" style="width:100px; height:auto; object-fit:contain;" alt="배너 이미지">` : `<div style="color:#999; font-size:0.8rem;">이미지 없음</div>`;
        const typeBadge = b.type === 'slide' ? '<span style="background:#3498db; color:#fff; padding:3px 8px; border-radius:3px; font-size:0.8rem;">메인 슬라이드</span>' : '<span style="background:#9b59b6; color:#fff; padding:3px 8px; border-radius:3px; font-size:0.8rem;">팝업창</span>';
        
        // 상태 토글 스위치 (활성/비활성)
        const statusHtml = `
            <select onchange="updateBannerStatus('${b.id}', this.value)" style="padding:4px; border-radius:4px; border:1px solid #ccc;">
                <option value="true" ${b.is_active ? 'selected' : ''}>노출 중</option>
                <option value="false" ${!b.is_active ? 'selected' : ''}>숨김</option>
            </select>
        `;
        
        const dateStr = new Date(b.created_at).toLocaleDateString('ko-KR');

        tr.innerHTML = `
            <td>${imgHtml}</td>
            <td>${typeBadge}</td>
            <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"><a href="${b.link_url || '#'}" target="_blank" style="color:var(--primary); text-decoration:none;">${b.link_url || '없음'}</a></td>
            <td style="font-weight:bold;">${b.display_order || 0}</td>
            <td>${dateStr}</td>
            <td>${statusHtml}</td>
            <td>
                <button class="action-btn delete" onclick="deleteBanner('${b.id}')" title="삭제"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        bannerTableBody.appendChild(tr);
    });
}

// 상태 즉시 업데이트 함수 (전역)
window.updateBannerStatus = async function(id, isActiveStr) {
    const isActive = isActiveStr === 'true';
    const { error } = await supabase.from('banners').update({ is_active: isActive }).eq('id', id);
    if(error) alert('상태 변경 오류: ' + error.message);
};

window.deleteBanner = async function(id) {
    if(confirm('이 배너를 영구적으로 삭제하시겠습니까?')) {
        const { error } = await supabase.from('banners').delete().eq('id', id);
        if(error) alert('삭제 실패: ' + error.message);
        else fetchBanners();
    }
};

// ==========================================
// 6. 배너 모달 제어 및 수정 로직
// ==========================================
function openBannerModal() {
    bannerModalTitle.textContent = '새 배너/팝업 등록';
    bannerIdInput.value = '';
    bannerTypeInput.value = 'slide';
    bannerIsActiveInput.value = 'true';
    bannerLinkUrlInput.value = '';
    bannerDisplayOrderInput.value = '0';
    bannerImageUrl.value = '';
    bannerImageFile.value = '';
    bannerImagePreview.innerHTML = '<i class="fa-regular fa-image" style="font-size: 2rem; color: #ccc;"></i>';
    
    saveBannerMsg.textContent = '';
    saveBannerBtn.disabled = false;
    saveBannerBtn.textContent = '저장하기';
    
    bannerModalOverlay.style.display = 'flex';
}

function closeBannerModal() { bannerModalOverlay.style.display = 'none'; }

if (addBannerBtn) addBannerBtn.addEventListener('click', openBannerModal);
if (closeBannerModalBtn) closeBannerModalBtn.addEventListener('click', closeBannerModal);
if (cancelBannerModalBtn) cancelBannerModalBtn.addEventListener('click', closeBannerModal);

bannerImageFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => { bannerImagePreview.innerHTML = `<img src="${e.target.result}" style="width:100%; height:100%; object-fit:contain;" alt="Preview">`; };
        reader.readAsDataURL(file);
    }
});

saveBannerBtn.addEventListener('click', async () => {
    const file = bannerImageFile.files[0];
    const bType = bannerTypeInput.value;
    const isActive = bannerIsActiveInput.value === 'true';
    const linkUrl = bannerLinkUrlInput.value.trim();
    const displayOrder = parseInt(bannerDisplayOrderInput.value) || 0;
    
    // 새 배너 등록 시 이미지는 필수
    if(!file && !bannerImageUrl.value) {
        saveBannerMsg.textContent = '배너 이미지를 첨부해주세요.';
        return;
    }

    saveBannerBtn.disabled = true;
    saveBannerBtn.textContent = '저장 중...';

    const payload = {
        type: bType,
        is_active: isActive,
        link_url: linkUrl || null,
        display_order: displayOrder
    };

    // 이미지 파일 업로드 로직 (bucket명: banner-images)
    if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `banners/${fileName}`; // 폴더 지정 선택적
        
        const { error: uploadError } = await supabase.storage.from('banner-images').upload(filePath, file);
        
        if (uploadError) { 
            saveBannerMsg.textContent = '이미지 업로드 오류: ' + uploadError.message; 
            saveBannerBtn.disabled = false; 
            saveBannerBtn.textContent = '저장하기'; 
            return; 
        }
        
        const { data: { publicUrl } } = supabase.storage.from('banner-images').getPublicUrl(filePath);
        payload.image_url = publicUrl;
    } else {
        payload.image_url = bannerImageUrl.value;
    }

    // Insert
    const { error } = await supabase.from('banners').insert([payload]);
    
    if (error) {
        saveBannerMsg.textContent = '등록 실패: ' + error.message;
        saveBannerBtn.disabled = false; 
        saveBannerBtn.textContent = '저장하기';
    } else {
        closeBannerModal();
        fetchBanners();
    }
});
// ------------------------------------------
// 7. [신규] 상세페이지 관리 로직 (멀티 제품 대응)
// ------------------------------------------
let currentPageDataKey = ''; // 기본값 비워둠 (targetPageId 값이 없을 수 있음)

function initPageManageTab() {
    const targetSelect = document.getElementById('targetPageId');
    const savePageBtn = document.getElementById('savePageBtn');
    const addSpecBtn = document.getElementById('addSpecBtn');
    const specContainer = document.getElementById('specContainer');
    const addFeatureBtn = document.getElementById('addFeatureBtn');
    const featureContainer = document.getElementById('featureContainer');
    
    const pageMainImage = document.getElementById('pageMainImage');
    const pageMainImagePreview = document.getElementById('pageMainImagePreview');
    const pageDetailImage = document.getElementById('pageDetailImage');
    const pageDetailImagePreview = document.getElementById('pageDetailImagePreview');
    const pageDescription = document.getElementById('pageDescription');

    // 1. 제품 선택 변경 시 로드
    targetSelect.addEventListener('change', (e) => {
        currentPageDataKey = 'pageData_' + e.target.value;
        loadPageData();
    });

    // 2. 항목 추가 버튼들
    if(addSpecBtn && !addSpecBtn.dataset.init) {
        addSpecBtn.addEventListener('click', () => createSpecRow('', ''));
        addSpecBtn.dataset.init = "true";
    }
    if(addFeatureBtn && !addFeatureBtn.dataset.init) {
        addFeatureBtn.addEventListener('click', () => createFeatureBlock('', ''));
        addFeatureBtn.dataset.init = "true";
    }

    // 3. 이미지 미리보기 처리
    if(pageMainImage && !pageMainImage.dataset.init) {
        pageMainImage.addEventListener('change', (e) => {
            pageMainImagePreview.innerHTML = '';
            Array.from(e.target.files).forEach(file => {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const img = document.createElement('img');
                    img.src = ev.target.result;
                    img.style.cssText = "width:80px; height:80px; object-fit:cover; border-radius:4px; border:1px solid #ddd;";
                    pageMainImagePreview.appendChild(img);
                };
                reader.readAsDataURL(file);
            });
        });
        pageMainImage.dataset.init = "true";
    }

    if(pageDetailImage && !pageDetailImage.dataset.init) {
        pageDetailImage.addEventListener('change', (e) => {
            pageDetailImagePreview.innerHTML = '';
            Array.from(e.target.files).forEach(file => {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const img = document.createElement('img');
                    img.src = ev.target.result;
                    img.style.cssText = "max-width:100%; border-radius:4px; border:1px solid #eee;";
                    pageDetailImagePreview.appendChild(img);
                };
                reader.readAsDataURL(file);
            });
        });
        pageDetailImage.dataset.init = "true";
    }

    // [개선] 데이터 URL을 Supabase Storage에 업로드하는 헬퍼 함수
    async function uploadDataUrl(dataUrl, bucket, folder = 'details') {
        try {
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const fileExt = blob.type.split('/')[1] || 'png';
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${folder}/${fileName}`;
            
            const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, blob);
            if (uploadError) throw uploadError;
            
            const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);
            return publicUrl;
        } catch (err) {
            console.error('Upload Error:', err);
            throw new Error('이미지 업로드 중 오류가 발생했습니다: ' + err.message);
        }
    }

    // 4. 저장 버튼
    if(savePageBtn && !savePageBtn.dataset.init) {
        savePageBtn.addEventListener('click', async () => {
            if (!targetSelect.value) {
                alert('수정할 대상 제품을 먼저 선택하세요.');
                return;
            }

            const originalBtnText = savePageBtn.innerHTML;
            savePageBtn.disabled = true;
            savePageBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 저장 중...';

            try {
                // 1. 대표 사진들 처리 (신규인 경우 업로드)
                const mainImageElements = Array.from(pageMainImagePreview.querySelectorAll('img'));
                const mainImages = [];
                for (const img of mainImageElements) {
                    if (img.src.startsWith('data:')) {
                        const url = await uploadDataUrl(img.src, 'product-images');
                        mainImages.push(url);
                    } else if (img.src.startsWith('http')) {
                        mainImages.push(img.src);
                    }
                }

                // 2. 상세 이미지들 처리
                const detailImageElements = Array.from(pageDetailImagePreview.querySelectorAll('img'));
                const detailImages = [];
                for (const img of detailImageElements) {
                    if (img.src.startsWith('data:')) {
                        const url = await uploadDataUrl(img.src, 'product-images');
                        detailImages.push(url);
                    } else if (img.src.startsWith('http')) {
                        detailImages.push(img.src);
                    }
                }

                const data = {
                    mainImages: mainImages,
                    detailImages: detailImages, // [변경] 다중 이미지 대응
                    description: pageDescription.value,
                    specs: [],
                    features: []
                };
                
                specContainer.querySelectorAll('.spec-row').forEach(row => {
                    const inputs = row.querySelectorAll('input');
                    if(inputs[0].value) data.specs.push({ key: inputs[0].value, val: inputs[1].value });
                });
                
                featureContainer.querySelectorAll('.feature-block').forEach(block => {
                    const title = block.querySelector('input').value;
                    const desc = block.querySelector('textarea').value;
                    if(title) data.features.push({ title, desc });
                });
                
                localStorage.setItem(currentPageDataKey, JSON.stringify(data));
                
                const productName = targetSelect.options[targetSelect.selectedIndex].text;
                alert(`[${productName}] 상세페이지 설정이 성공적으로 저장되었습니다.`);
                
                // 업로드 후 미리보기의 src를 새 URL로 교체 (다시 저장할 때 재업로드 방지)
                loadPageData(); 

            } catch (error) {
                console.error('Save Error:', error);
                alert('저장 중 오류가 발생했습니다: ' + error.message);
            } finally {
                savePageBtn.disabled = false;
                savePageBtn.innerHTML = originalBtnText;
            }
        });
        savePageBtn.dataset.init = "true";
    }

    // 초기 데이터 로드
    if (targetSelect.value) {
        currentPageDataKey = 'pageData_' + targetSelect.value;
        loadPageData();
    } else {
        // 제품 목록이 아직 없는 경우
        currentPageDataKey = '';
    }
}

function createSpecRow(key, val) {
    const specContainer = document.getElementById('specContainer');
    const row = document.createElement('div');
    row.className = 'spec-row';
    row.style.cssText = "display:flex; gap:10px; align-items:center;";
    row.innerHTML = `
        <input type="text" class="form-control" placeholder="항목명" value="${key}" style="flex:1;">
        <input type="text" class="form-control" placeholder="내용" value="${val}" style="flex:2;">
        <button class="action-btn delete" onclick="this.parentElement.remove()"><i class="fa-solid fa-circle-minus"></i></button>
    `;
    specContainer.appendChild(row);
}

function createFeatureBlock(title, desc) {
    const featureContainer = document.getElementById('featureContainer');
    const block = document.createElement('div');
    block.className = 'feature-block';
    block.style.cssText = "background:#f9f9f9; padding:15px; border-radius:6px; border:1px solid #eee; display:flex; flex-direction:column; gap:8px;";
    block.innerHTML = `
        <div style="display:flex; justify-content:space-between;">
            <input type="text" class="form-control" placeholder="특징 제목" value="${title}" style="font-weight:bold; width:85%;">
            <button class="action-btn delete" onclick="this.parentElement.parentElement.remove()"><i class="fa-solid fa-trash"></i></button>
        </div>
        <textarea class="form-control" rows="2" placeholder="특징 설명을 입력하세요">${desc}</textarea>
    `;
    featureContainer.appendChild(block);
}

function loadPageData() {
    if(!currentPageDataKey) return;
    const raw = localStorage.getItem(currentPageDataKey);
    const specContainer = document.getElementById('specContainer');
    const featureContainer = document.getElementById('featureContainer');
    const pageMainImagePreview = document.getElementById('pageMainImagePreview');
    const pageDetailImagePreview = document.getElementById('pageDetailImagePreview');
    const pageDescription = document.getElementById('pageDescription');

    specContainer.innerHTML = '';
    featureContainer.innerHTML = '';
    pageMainImagePreview.innerHTML = '<i class="fa-regular fa-image" style="font-size: 2rem; color: #ccc; margin:auto;"></i>';
    pageDetailImagePreview.innerHTML = '<i class="fa-regular fa-image" style="font-size: 2rem; color: #ccc;"></i>';
    pageDescription.value = '';

    if(!raw) return;
    const data = JSON.parse(raw);
    
    if(data.mainImages && data.mainImages.length > 0) {
        pageMainImagePreview.innerHTML = '';
        data.mainImages.forEach(src => {
            const img = document.createElement('img');
            img.src = src; img.style.cssText = "width:80px; height:80px; object-fit:cover; border-radius:4px; border:1px solid #ddd;";
            pageMainImagePreview.appendChild(img);
        });
    }
    if(data.detailImages || data.detailImage) {
        pageDetailImagePreview.innerHTML = '';
        const imgs = data.detailImages || [data.detailImage];
        imgs.forEach(src => {
            if(!src) return;
            const img = document.createElement('img');
            img.src = src;
            img.style.cssText = "max-width:100%; border-radius:4px; border:1px solid #eee;";
            pageDetailImagePreview.appendChild(img);
        });
    }
    pageDescription.value = data.description || '';
    if(data.specs) data.specs.forEach(s => createSpecRow(s.key, s.val));
    if(data.features) data.features.forEach(f => createFeatureBlock(f.title, f.desc));
}

async function fetchUsers() {
    const tBody = document.getElementById('userTableBody');
    const { data, error } = await supabase.from('users').select('*').limit(10);
    if(error) { tBody.innerHTML = `<tr><td colspan="7" class="empty-state" style="color:#e74c3c;">데이터베이스에 'users' 테이블을 먼저 생성해주세요.</td></tr>`; }
}

// 8. [개선] 카테고리 전시 관리 (전체 카테고리 대응 및 UI 고도화)
// ------------------------------------------
// (SITE_CATEGORIES는 상단 전역으로 이동됨)

let currentSelectedSection = ''; // 현재 선택된 소분류 ID

function initCategoryDisplayTab() {
    const majorBtns = document.querySelectorAll('.major-btn');
    const minorGrid = document.getElementById('minorCategoryGrid');
    const saveBtn = document.getElementById('saveDisplayBtn');
    const statusBox = document.getElementById('displaySectionStatus');
    const selectionName = document.getElementById('currentSelectionName');

    // 1. 대분류 클릭 이벤트
    majorBtns.forEach(btn => {
        btn.onclick = () => {
            majorBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const majorKey = btn.dataset.major;
            renderMinorCategories(majorKey);
        };
    });

    // 2. 소분류 렌더링 함수
    function renderMinorCategories(majorKey) {
        const category = SITE_CATEGORIES[majorKey];
        if (!category) return;

        minorGrid.innerHTML = category.subs.map(sub => `
            <button class="minor-btn ${currentSelectedSection === sub.id ? 'active' : ''}" 
                    onclick="selectMinorCategory('${sub.id}', '${sub.name}')">
                ${sub.name}
            </button>
        `).join('');
    }

    // 3. 소분류 선택 함수 (전역 window 객체에 연결하여 onclick 대응)
    window.selectMinorCategory = (id, name) => {
        currentSelectedSection = id;
        
        // 버튼 스타일 업데이트
        document.querySelectorAll('.minor-btn').forEach(btn => {
            btn.classList.toggle('active', btn.innerText.trim() === name);
        });

        // 상태창 업데이트
        statusBox.style.display = 'block';
        selectionName.innerText = name;

        // 체크박스 데이터 로드
        loadCategoryDisplay(id);
    };

    // 4. 저장 버튼
    if(saveBtn && !saveBtn.dataset.init) {
        saveBtn.onclick = () => {
            if(!currentSelectedSection) {
                alert('먼저 관리할 소분류(전시화면)를 선택해주세요.');
                return;
            }
            const checkboxes = document.querySelectorAll('.display-item-cb');
            const selectedProducts = [];
            checkboxes.forEach(cb => {
                if(cb.checked) selectedProducts.push(cb.value);
            });
            localStorage.setItem('display_' + currentSelectedSection, JSON.stringify(selectedProducts));
            alert(`[${selectionName.innerText}] 화면 배치가 성공적으로 저장되었습니다.`);
        };
        saveBtn.dataset.init = "true";
    }

    // 초기 상태: 첫 번째 대분류(도서관리시스템) 렌더링
    const activeMajor = document.querySelector('.major-btn.active');
    if(activeMajor) renderMinorCategories(activeMajor.dataset.major);
}

function loadCategoryDisplay(sectionKey) {
    const raw = localStorage.getItem('display_' + sectionKey);
    const selectedIds = raw ? JSON.parse(raw) : [];
    
    const checkboxes = document.querySelectorAll('.display-item-cb');
    checkboxes.forEach(cb => {
        cb.checked = selectedIds.includes(cb.value);
    });
}

// ------------------------------------------
// 시스템 초기화
checkSession();
