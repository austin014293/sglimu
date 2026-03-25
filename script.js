document.addEventListener('DOMContentLoaded', () => {
    // 1. Slider Logic
    const slidesData = [
        {
            title: "프리미엄 북엔드 시리즈",
            desc: "흔들림 없는 독서의 완성",
            imgId: "hero_slide_1"
        },
        {
            title: "모던 도서관 공간",
            desc: "공간을 가치있게 만드는 디자인",
            imgId: "hero_slide_2"
        },
        {
            title: "스마트 관리 시스템",
            desc: "빠르고 정확한 도서 관리 시스템",
            imgId: "hero_slide_3"
        },
        {
            title: "독서 보조 용품",
            desc: "더 편안한 독서 경험을 위해",
            imgId: "hero_slide_4"
        },
        {
            title: "데스크 문구 기획전",
            desc: "에스지라이뮤의 새로운 아이템",
            imgId: "hero_slide_5"
        }
    ];

    const sliderContainer = document.getElementById('sliderContainer');
    const dotsContainer = document.getElementById('sliderDots');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    let currentSlide = 0;
    let slideInterval;
    const intervalTime = 3000; // 3 seconds

    function initSlider() {
        sliderContainer.innerHTML = '';
        dotsContainer.innerHTML = '';

        slidesData.forEach((slide, index) => {
            // Create slide
            const slideEl = document.createElement('div');
            slideEl.className = `slide ${index === 0 ? 'active' : ''}`;
            
            // Assume images will be in assets folder, or load a fallback
            const imgPath = `assets/${slide.imgId}.png`;
            
            slideEl.innerHTML = `
                <img src="${imgPath}" alt="${slide.title}" class="slide-img" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'1920\\' height=\\'1080\\'><rect width=\\'100%\\' height=\\'100%\\' fill=\\'%2334495e\\'/></svg>'">
                <div class="slide-content">
                    <h2>${slide.title}</h2>
                    <p>${slide.desc}</p>
                </div>
            `;
            sliderContainer.appendChild(slideEl);

            // Create dot
            const dotEl = document.createElement('div');
            dotEl.className = `dot ${index === 0 ? 'active' : ''}`;
            dotEl.addEventListener('click', () => goToSlide(index));
            dotsContainer.appendChild(dotEl);
        });

        startSlideShow();
    }

    function goToSlide(index) {
        const slides = document.querySelectorAll('.slide');
        const dots = document.querySelectorAll('.dot');
        
        slides[currentSlide].classList.remove('active');
        dots[currentSlide].classList.remove('active');
        
        currentSlide = (index + slides.length) % slides.length;
        
        slides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');
    }

    function nextSlide() {
        goToSlide(currentSlide + 1);
    }

    function prevSlide() {
        goToSlide(currentSlide - 1);
    }

    function startSlideShow() {
        slideInterval = setInterval(nextSlide, intervalTime);
    }

    function stopSlideShow() {
        clearInterval(slideInterval);
    }

    prevBtn.addEventListener('click', () => {
        stopSlideShow();
        prevSlide();
        startSlideShow();
    });

    nextBtn.addEventListener('click', () => {
        stopSlideShow();
        nextSlide();
        startSlideShow();
    });

    sliderContainer.addEventListener('mouseenter', stopSlideShow);
    sliderContainer.addEventListener('mouseleave', startSlideShow);

    // 2. Scroll Logic for Right Banner
    const scrollTopBtn = document.getElementById('scrollTopBtn');
    const scrollBottomBtn = document.getElementById('scrollBottomBtn');

    scrollTopBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    scrollBottomBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
        });
    });

    // Handle header visual state on scroll
    window.addEventListener('scroll', () => {
        const header = document.querySelector('.header');
        if (window.scrollY > 50) {
            header.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)';
        } else {
            header.style.boxShadow = 'none';
        }
    });

    // Initialize
    initSlider();

    // 3. Product Tabs Logic
    const tabItems = document.querySelectorAll('.tab-item');
    const tabContents = document.querySelectorAll('.tab-content');

    tabItems.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all
            tabItems.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Show corresponding content
            const targetId = tab.getAttribute('data-tab');
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.add('active');
                
                // Trigger reveal for cards in newly active tab with stagger
                targetContent.querySelectorAll('.product-card').forEach((card, index) => {
                    card.classList.remove('visible'); // Reset
                    setTimeout(() => {
                        card.classList.add('visible');
                    }, 50 + (index * 100)); // Staggered reveal
                });
            }
        });
    });

    // 4. Search Focus Logic
    const headerSearchBtn = document.getElementById('headerSearchBtn');
    const searchInput = document.querySelector('.search-input');
    const asideSearchBtn = document.querySelector('.search-btn-aside');

    if (headerSearchBtn) {
        headerSearchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            searchInput.focus();
        });
    }
    
    if (asideSearchBtn) {
        asideSearchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            setTimeout(() => {
                searchInput.focus();
            }, 500);
        });
    }

    // 6. Live Chat Widget Logic
    const chatFab = document.getElementById('chatFab');
    const chatWindow = document.getElementById('chatWindow');
    const chatCloseBtn = document.getElementById('chatCloseBtn');
    const chatInput = document.getElementById('chatInput');
    const chatSendBtn = document.getElementById('chatSendBtn');
    const chatBody = document.getElementById('chatBody');

    function toggleChat() {
        chatWindow.classList.toggle('active');
        if (chatWindow.classList.contains('active')) {
            setTimeout(() => chatInput.focus(), 300);
        }
    }

    if (chatFab && chatCloseBtn) {
        chatFab.addEventListener('click', toggleChat);
        chatCloseBtn.addEventListener('click', toggleChat);
    }

    function sendChatMessage() {
        const text = chatInput.value.trim();
        if (text === '') return;

        // User message
        const userMsg = document.createElement('div');
        userMsg.className = 'message user-msg';
        userMsg.textContent = text;
        chatBody.appendChild(userMsg);

        chatInput.value = '';
        chatBody.scrollTop = chatBody.scrollHeight;

        // Auto reply after 1s
        setTimeout(() => {
            const sysMsg = document.createElement('div');
            sysMsg.className = 'message system-msg';
            sysMsg.innerHTML = "안녕하세요!<br>문의를 담당자에게 전달했습니다.<br>빠른 시일 내에 답변 드리겠습니다.";
            chatBody.appendChild(sysMsg);
            chatBody.scrollTop = chatBody.scrollHeight;
        }, 1000);
    }

    if (chatSendBtn && chatInput) {
        chatSendBtn.addEventListener('click', sendChatMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendChatMessage();
        });
    }

    // 7. Scroll Reveal Animation Logic
    const revealElements = document.querySelectorAll('.section-title, .product-tabs, .product-card');
    
    // Add base class immediately so they are hidden before scroll
    revealElements.forEach(el => el.classList.add('reveal-up'));

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add stagger effect based on element index in the viewport
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, 50);
                observer.unobserve(entry.target);
            }
        });
    }, {
        root: null,
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    });

    setTimeout(() => {
        revealElements.forEach((el) => {
            revealObserver.observe(el);
        });
    }, 100);
});
