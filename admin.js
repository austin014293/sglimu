// admin.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// ==========================================
// 🚨 사용자(관리자)님, 여기에 Supabase 설정값을 넣어주세요! 🚨
// ==========================================
const SUPABASE_URL = 'YOUR_SUPABASE_URL_HERE';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE';

if (SUPABASE_URL === 'YOUR_SUPABASE_URL_HERE') {
    alert("⚠️ admin.js 파일에서 SUPABASE_URL과 SUPABASE_ANON_KEY를 설정해주세요!");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const loginOverlay = document.getElementById('loginOverlay');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const emailInput = document.getElementById('adminEmail');
const passInput = document.getElementById('adminPassword');
const loginMessage = document.getElementById('loginMessage');
const productTableBody = document.getElementById('productTableBody');
const addProductBtn = document.getElementById('addProductBtn');

// Modal Elements
const modalOverlay = document.getElementById('productModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const saveProductBtn = document.getElementById('saveProductBtn');
const saveMsg = document.getElementById('saveMsg');
const modalTitle = document.getElementById('modalTitle');

// Form Elements
const productIdInput = document.getElementById('productId');
const productNameInput = document.getElementById('productName');
const productCategoryInput = document.getElementById('productCategory');
const productPriceInput = document.getElementById('productPrice');
const productStockInput = document.getElementById('productStock');
const productDescInput = document.getElementById('productDesc');
const productImageFile = document.getElementById('productImageFile');
const productImageUrl = document.getElementById('productImageUrl');
const imagePreview = document.getElementById('imagePreview');

// ==========================================
// 1. 로그인 / 세션 관리 (Authentication)
// ==========================================
async function checkSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (session) {
        // Logged in
        loginOverlay.style.display = 'none';
        fetchProducts(); // Load data after login
    } else {
        // Not logged in
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
        fetchProducts();
    }
});

logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    productTableBody.innerHTML = '<tr><td colspan="7" class="empty-state">로그아웃 되었습니다.</td></tr>';
    loginOverlay.style.display = 'flex';
});

// ==========================================
// 2. 제품 목록 불러오기 (Read)
// ==========================================
async function fetchProducts() {
    productTableBody.innerHTML = '<tr><td colspan="7" class="empty-state">데이터를 불러오는 중입니다...</td></tr>';
    
    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching products:', error);
        productTableBody.innerHTML = `<tr><td colspan="7" class="empty-state" style="color:red">오류: ${error.message}</td></tr>`;
        return;
    }

    if (products.length === 0) {
        productTableBody.innerHTML = '<tr><td colspan="7" class="empty-state">등록된 제품이 없습니다. 새 제품 등록 버튼을 눌러주세요.</td></tr>';
        return;
    }

    productTableBody.innerHTML = '';
    products.forEach(p => {
        const tr = document.createElement('tr');
        const imgHtml = p.image_url 
            ? `<img src="${p.image_url}" class="td-img" alt="${p.name}">` 
            : `<div class="td-img" style="background:#eee; display:flex; align-items:center; justify-content:center; color:#999; font-size:0.8rem;">NO IMG</div>`;
        
        // 날짜 포맷
        const dateStr = new Date(p.created_at).toLocaleDateString('ko-KR');

        tr.innerHTML = `
            <td>${imgHtml}</td>
            <td style="font-weight:600;">${p.name}</td>
            <td><span style="background:#eaf2f8; color:#2980b9; padding:3px 8px; border-radius:3px; font-size:0.8rem;">${p.category}</span></td>
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
}

// ==========================================
// 3. 모달 제어 및 이미지 미리보기
// ==========================================
function openModal(isEdit = false) {
    if (!isEdit) {
        modalTitle.textContent = '새 제품 등록';
        productIdInput.value = '';
        productNameInput.value = '';
        productPriceInput.value = '전화문의';
        productStockInput.value = '999';
        productDescInput.value = '';
        productImageUrl.value = '';
        productImageFile.value = '';
        imagePreview.innerHTML = '<i class="fa-regular fa-image" style="font-size: 2rem; color: #ccc;"></i>';
    } else {
        modalTitle.textContent = '제품 정보 수정';
    }
    saveMsg.textContent = '';
    saveProductBtn.disabled = false;
    saveProductBtn.textContent = '저장하기';
    modalOverlay.style.display = 'flex';
}

function closeModal() {
    modalOverlay.style.display = 'none';
}

addProductBtn.addEventListener('click', () => openModal(false));
closeModalBtn.addEventListener('click', closeModal);
cancelModalBtn.addEventListener('click', closeModal);

// 이미지 미리보기 로직
productImageFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    }
});

// ==========================================
// 4. 제품 저장 (Insert / Update) & 스토리지 업로드
// ==========================================
saveProductBtn.addEventListener('click', async () => {
    const name = productNameInput.value.trim();
    const category = productCategoryInput.value;
    const price = productPriceInput.value.trim();
    const stock = parseInt(productStockInput.value) || 0;
    const desc = productDescInput.value.trim();
    const id = productIdInput.value;
    
    if (!name) {
        saveMsg.textContent = '제품명은 필수입니다!';
        return;
    }

    saveProductBtn.disabled = true;
    saveProductBtn.textContent = '저장 중... (사진 업로드 포함)';
    
    let finalImageUrl = productImageUrl.value; // 기존 이미지 URL
    const file = productImageFile.files[0];

    // 새 사진이 등록된 경우 Storage에 업로드
    if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(filePath, file);

        if (uploadError) {
            saveMsg.textContent = '이미지 업로드 실패: ' + uploadError.message;
            saveProductBtn.disabled = false;
            saveProductBtn.textContent = '저장하기';
            return;
        }

        // 업로드 성공 후 Public URL 가져오기
        const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);
        
        finalImageUrl = publicUrl;
    }

    const payload = {
        name,
        category,
        price,
        stock,
        description: desc,
        image_url: finalImageUrl
    };

    if (id) {
        // Update (수정)
        const { error } = await supabase.from('products').update(payload).eq('id', id);
        if (error) { saveMsg.textContent = '수정 오류: ' + error.message; }
    } else {
        // Insert (등록)
        const { error } = await supabase.from('products').insert([payload]);
        if (error) { saveMsg.textContent = '등록 오류: ' + error.message; }
    }

    if (!saveMsg.textContent.includes('오류')) {
        closeModal();
        fetchProducts(); // 새로고침
    } else {
        saveProductBtn.disabled = false;
        saveProductBtn.textContent = '저장하기';
    }
});

// ==========================================
// 5. 제품 수정 모달 띄우기 (Update 불러오기)
// ==========================================
window.editProduct = async (id) => {
    const { data: p, error } = await supabase.from('products').select('*').eq('id', id).single();
    if (error) {
        alert("수정할 데이터를 불러오는 데 실패했습니다."); return;
    }
    
    openModal(true);
    productIdInput.value = p.id;
    productNameInput.value = p.name;
    productCategoryInput.value = p.category;
    productPriceInput.value = p.price;
    productStockInput.value = p.stock;
    productDescInput.value = p.description;
    productImageUrl.value = p.image_url;

    if (p.image_url) {
        imagePreview.innerHTML = `<img src="${p.image_url}" alt="${p.name}">`;
    } else {
        imagePreview.innerHTML = '<i class="fa-regular fa-image" style="font-size: 2rem; color: #ccc;"></i>';
    }
};

// ==========================================
// 6. 제품 삭제 (Delete)
// ==========================================
window.deleteProduct = async (id, name) => {
    if(confirm(`정말 "${name}" 제품을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없으며 라이브 사이트에서도 즉시 사라집니다.`)) {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) {
            alert('삭제 실패: ' + error.message);
        } else {
            fetchProducts();
        }
    }
};

// 초기화
checkSession();
