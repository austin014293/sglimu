import sys
import re

# Categories definition
categories = {
    "em": {
        "title": "EM시스템",
        "desc": "가장 확실한 도서 분실 방지 시스템입니다.",
        "subs": ["분실 방지기", "감응제거재생기", "감응 테이프"]
    },
    "supplies-arrange": {
        "title": "도서정리 용품",
        "desc": "도서관의 체계적인 정리를 위한 필수 용품입니다.",
        "subs": ["키퍼", "색띠라벨", "라벨용지", "장갑", "도장", "북앤드", "기타"]
    },
    "supplies-protect": {
        "title": "도서보호, 보수용품",
        "desc": "소중한 도서를 오래 보관하기 위한 보조 용품입니다.",
        "subs": ["필모시리즈", "중성풀", "양면테이프", "북커버"]
    },
    "supplies-lend": {
        "title": "대출용품",
        "desc": "도서 대출 및 반납 처리에 필요한 용품입니다.",
        "subs": ["바코드", "카드관련용품", "회원증카드", "감열지"]
    },
    "sterilizer": {
        "title": "책소독기",
        "desc": "안전한 독서 환경을 위한 책소독기 및 소모품입니다.",
        "subs": ["소모품"]
    },
    "furniture-koas": {
        "title": "코아스 가구",
        "desc": "내구성과 디자인이 뛰어난 코아스 브랜드입니다.",
        "subs": ["서가", "테이블", "의자", "기타"]
    },
    "furniture-fomus": {
        "title": "포머스 가구",
        "desc": "도서관에 최적화된 포머스 브랜드 가구입니다.",
        "subs": ["서가", "테이블", "의자", "기타"]
    },
    "furniture-fursys": {
        "title": "퍼시스 가구",
        "desc": "인체공학적 설계가 돋보이는 퍼시스 가구입니다.",
        "subs": ["서가", "테이블", "의자", "기타"]
    }
}

with open("rfid.html", "r", encoding="utf-8") as f:
    template = f.read()

# Make base template completely devoid of specific items in main
main_pattern = re.compile(r'<main class="category-page">.*?</main>', re.DOTALL)

for code, data in categories.items():
    title = data["title"]
    desc = data["desc"]
    subs = data["subs"]
    
    # build the replacement main chunk
    header_html = f'''<main class="category-page">\n        <div class="category-header">\n            <h2 class="category-title">{title}</h2>\n            <p>{desc}</p>\n        </div>\n\n        <ul class="subcategory-nav" id="subCategoryNav">\n'''
    for i, sub in enumerate(subs):
        active_class = ' active' if i == 0 else ''
        header_html += f'            <li class="subcategory-item{active_class}" data-target="cat-{i}">{sub}</li>\n'
        
    header_html += '        </ul>\n\n'
    
    for i, sub in enumerate(subs):
        active_class = ' active' if i == 0 else ''
        header_html += f'''        <div id="cat-{i}" class="sub-content{active_class}">\n            <div class="product-list">\n                <div class="product-card visible">\n                    <div class="product-img" style="background-image: url(\\'assets/public_library.png\\'); background-size: cover; background-position: center;"></div>\n                    <div class="product-info">\n                        <h4>{sub} 상품</h4>\n                    </div>\n                </div>\n            </div>\n        </div>\n\n'''
        
    header_html += '    </main>'
    
    # replace title tag
    content = re.sub(r'<title>.*?<', f'<title>{title} - 에스지라이뮤<', template)
    # replace main
    content = main_pattern.sub(header_html, content)
    
    with open(f"{code}.html", "w", encoding="utf-8") as f:
        f.write(content)

print(f"Generated {len(categories)} HTML files.")
