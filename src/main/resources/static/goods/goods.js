(function () {
    const grid = document.getElementById("goodsGrid");
    const tagFilterPanel = document.getElementById("tagFilterPanel");
    const activeTagLabel = document.getElementById("activeTagLabel");
    const products = Array.isArray(window.NOVA_GOODS_PRODUCTS) ? window.NOVA_GOODS_PRODUCTS : [];
    let activeTag = "all";

    function formatPrice(price) {
        return new Intl.NumberFormat("ko-KR", {
            style: "currency",
            currency: "KRW",
            maximumFractionDigits: 0
        }).format(Number(price) || 0);
    }

    function createTextElement(tagName, className, text) {
        const element = document.createElement(tagName);
        if (className) {
            element.className = className;
        }
        element.textContent = text || "";
        return element;
    }

    function createProductCard(product) {
        const card = document.createElement("article");
        card.className = "goods-card";
        card.dataset.productId = product.id;

        const imageWrap = document.createElement("div");
        imageWrap.className = "goods-image";

        const image = document.createElement("img");
        image.src = product.image;
        image.alt = product.name;
        image.loading = "lazy";
        imageWrap.appendChild(image);

        const status = createTextElement("span", "status-badge", product.status);
        imageWrap.appendChild(status);

        const body = document.createElement("div");
        body.className = "goods-card-body";

        body.appendChild(createTextElement("p", "goods-category", product.category));
        body.appendChild(createTextElement("h3", "", product.name));
        body.appendChild(createTextElement("strong", "goods-price", formatPrice(product.price)));
        body.appendChild(createTextElement("p", "goods-description", product.description));

        const tags = document.createElement("div");
        tags.className = "goods-tags";
        (product.tags || []).slice(0, 3).forEach((tag) => {
            tags.appendChild(createTextElement("span", "", tag));
        });
        body.appendChild(tags);

        body.appendChild(createTextElement("p", "curator-note", product.curatorNote));

        const actions = document.createElement("div");
        actions.className = "goods-actions";

        const quickView = document.createElement("button");
        quickView.type = "button";
        quickView.textContent = "Quick View";
        quickView.addEventListener("click", () => {
            console.log("[GOODS_PAGE] quick view", product.id);
        });

        const addToCart = document.createElement("button");
        addToCart.type = "button";
        addToCart.className = "secondary";
        addToCart.textContent = "Add to Cart";
        addToCart.addEventListener("click", () => {
            console.log("[GOODS_PAGE] add to cart", product.id);
        });

        actions.append(quickView, addToCart);
        body.appendChild(actions);
        card.append(imageWrap, body);
        return card;
    }

    function getAllTags() {
        return Array.from(new Set(products.flatMap((product) => product.tags || []))).sort();
    }

    function getFilteredProducts() {
        if (activeTag === "all") {
            return products;
        }

        return products.filter((product) => {
            return (product.tags || []).includes(activeTag);
        });
    }

    function setActiveTag(nextTag) {
        activeTag = nextTag || "all";
        if (activeTagLabel) {
            activeTagLabel.textContent = activeTag === "all" ? "All Goods" : `#${activeTag}`;
        }
        renderTagPanel();
        renderProducts();
        console.log("[GOODS_PAGE] tag selected", activeTag);
    }

    function createTagButton(tag, label) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = label;
        button.dataset.tag = tag;
        button.className = tag === activeTag ? "active" : "";
        button.addEventListener("click", () => {
            setActiveTag(tag);
        });
        return button;
    }

    function renderTagPanel() {
        if (!tagFilterPanel) {
            return;
        }

        tagFilterPanel.textContent = "";
        tagFilterPanel.appendChild(createTagButton("all", "All"));
        getAllTags().forEach((tag) => {
            tagFilterPanel.appendChild(createTagButton(tag, `#${tag}`));
        });
    }

    function renderProducts() {
        if (!grid) {
            console.warn("[GOODS_PAGE] goodsGrid not found");
            return;
        }

        const filteredProducts = getFilteredProducts();
        grid.textContent = "";
        filteredProducts.forEach((product) => {
            grid.appendChild(createProductCard(product));
        });
        if (filteredProducts.length === 0) {
            grid.appendChild(createTextElement("p", "empty-goods-message", "선택한 태그에 해당하는 상품이 없습니다."));
        }
        console.log("[GOODS_PAGE] rendered", filteredProducts.length);
    }

    try {
        renderTagPanel();
        renderProducts();
    } catch (error) {
        console.error("[GOODS_PAGE] render failed", error);
        if (grid) {
            grid.textContent = "상품 정보를 불러오지 못했습니다.";
        }
    }
})();
