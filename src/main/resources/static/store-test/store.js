const CART_STORAGE_KEY = "momoStoreCart";
const ORDERS_STORAGE_KEY = "momoStoreOrders";
const LEGACY_CART_STORAGE_KEY = "momo-store-test-cart";
const LEGACY_ORDERS_STORAGE_KEY = "momo-store-test-orders";

const products = Array.isArray(window.MOMO_STORE_PRODUCTS) ? window.MOMO_STORE_PRODUCTS : [];
const productList = document.getElementById("productList");
const cartItems = document.getElementById("cartItems");
const cartItemCount = document.getElementById("cartItemCount");
const cartTotal = document.getElementById("cartTotal");
const clearCartButton = document.getElementById("clearCartButton");
const checkoutButton = document.getElementById("checkoutButton");
const checkoutMessage = document.getElementById("checkoutMessage");
const buyerName = document.getElementById("buyerName");
const buyerEmail = document.getElementById("buyerEmail");
const orderComplete = document.getElementById("orderComplete");
const completeMessage = document.getElementById("completeMessage");
const orderHistory = document.getElementById("orderHistory");

let cart = loadStorage(CART_STORAGE_KEY, loadStorage(LEGACY_CART_STORAGE_KEY, {}));
let orders = normalizeOrders(loadStorage(ORDERS_STORAGE_KEY, loadStorage(LEGACY_ORDERS_STORAGE_KEY, [])));
let expandedOrderId = null;

function loadStorage(key, fallback) {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : fallback;
    } catch (error) {
        console.warn("[MOMO_STORE] storage read failed", key, error);
        return fallback;
    }
}

function saveStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function formatPrice(price) {
    return `₩${Number(price || 0).toLocaleString("ko-KR")}`;
}

function getProduct(productId) {
    return products.find((product) => product.id === productId);
}

function normalizeOrders(savedOrders) {
    if (!Array.isArray(savedOrders)) {
        return [];
    }

    return savedOrders.map((order) => {
        if (order.orderId && Array.isArray(order.items)) {
            return order;
        }

        const items = Array.isArray(order.items) ? order.items.map((item) => {
            const productId = item.productId || item.id;
            const product = getProduct(productId) || {};
            const quantity = Number(item.quantity || 1);
            const price = Number(item.price || product.price || 0);

            return {
                productId,
                name: item.name || product.name || productId || "Unknown Product",
                price,
                quantity,
                subtotal: Number(item.subtotal || price * quantity),
                image: item.image || product.image || ""
            };
        }) : [];

        return {
            orderId: order.orderId || order.id || `ORDER-${Date.now()}`,
            customerName: order.customerName || order.buyerName || "테스트 주문자",
            customerEmail: order.customerEmail || order.buyerEmail || "",
            items,
            itemCount: Number(order.itemCount || items.reduce((sum, item) => sum + item.quantity, 0)),
            totalAmount: Number(order.totalAmount || order.total || items.reduce((sum, item) => sum + item.subtotal, 0)),
            paymentMethod: order.paymentMethod || "KakaoPay Test",
            paymentStatus: order.paymentStatus || "MOCK_PAID",
            orderStatus: order.orderStatus || "COMPLETED",
            createdAt: order.createdAt || new Date().toLocaleString("ko-KR")
        };
    });
}

function getCartEntries() {
    return Object.entries(cart)
        .map(([productId, quantity]) => ({
            product: getProduct(productId),
            quantity: Number(quantity)
        }))
        .filter((entry) => entry.product && entry.quantity > 0);
}

function getCartItemCount() {
    return getCartEntries().reduce((sum, entry) => sum + entry.quantity, 0);
}

function getCartTotal() {
    return getCartEntries().reduce((sum, entry) => {
        return sum + entry.product.price * entry.quantity;
    }, 0);
}

function getSelectedPaymentMethod() {
    return document.querySelector('input[name="paymentMethod"]:checked')?.value || "KakaoPay Test";
}

function setCheckoutMessage(message, type = "info") {
    if (!checkoutMessage) {
        return;
    }

    checkoutMessage.textContent = message;
    checkoutMessage.dataset.type = type;
}

function renderProducts() {
    if (!productList) {
        return;
    }

    productList.innerHTML = products.map((product) => `
        <article class="product-card">
            <img class="product-image" src="${product.image}" alt="${product.name}">
            <div class="product-body">
                <p class="product-category">${product.category}</p>
                <h3>${product.name}</h3>
                <strong class="product-price">${formatPrice(product.price)}</strong>
                <button class="store-button" type="button" data-add-to-cart="${product.id}">Add to Cart</button>
            </div>
        </article>
    `).join("");
}

function renderCart() {
    if (!cartItems || !cartTotal || !cartItemCount) {
        return;
    }

    const entries = getCartEntries();
    cartItemCount.textContent = `${getCartItemCount()}개`;
    cartTotal.textContent = formatPrice(getCartTotal());

    if (entries.length === 0) {
        cartItems.innerHTML = `<p class="empty-state">장바구니가 비어 있습니다.</p>`;
        clearCartButton.disabled = true;
        return;
    }

    clearCartButton.disabled = false;
    cartItems.innerHTML = entries.map(({ product, quantity }) => {
        const subtotal = product.price * quantity;

        return `
            <article class="cart-item">
                <div class="cart-item-header">
                    <div>
                        <h3>${product.name}</h3>
                        <p>${formatPrice(product.price)} x ${quantity}</p>
                    </div>
                    <strong>${formatPrice(subtotal)}</strong>
                </div>
                <div class="quantity-controls">
                    <button class="quantity-button" type="button" data-decrease="${product.id}" aria-label="${product.name} 수량 감소">-</button>
                    <span>${quantity}</span>
                    <button class="quantity-button" type="button" data-increase="${product.id}" aria-label="${product.name} 수량 증가">+</button>
                    <button class="remove-button" type="button" data-remove="${product.id}">삭제</button>
                </div>
            </article>
        `;
    }).join("");
}

function renderCompleteOrder(order) {
    if (!orderComplete || !completeMessage) {
        return;
    }

    if (!order) {
        orderComplete.classList.remove("is-complete");
        completeMessage.innerHTML = `<p class="empty-state">아직 완료된 주문이 없습니다.</p>`;
        return;
    }

    orderComplete.classList.add("is-complete");
    completeMessage.innerHTML = `
        <div class="complete-card">
            <h3>결제 완료</h3>
            <dl class="order-meta">
                <div><dt>주문번호</dt><dd>${order.orderId}</dd></div>
                <div><dt>구매자</dt><dd>${order.customerName} / ${order.customerEmail}</dd></div>
                <div><dt>결제 방법</dt><dd>${order.paymentMethod}</dd></div>
                <div><dt>상품 수량</dt><dd>${order.itemCount}개</dd></div>
                <div><dt>총 결제 금액</dt><dd>${formatPrice(order.totalAmount)}</dd></div>
            </dl>
            <div class="order-items-detail">
                ${renderOrderItems(order.items)}
            </div>
        </div>
    `;
}

function renderOrderItems(items) {
    return items.map((item) => `
        <article class="order-item-detail">
            <img src="${item.image}" alt="${item.name}">
            <div>
                <h4>${item.name}</h4>
                <p>수량 ${item.quantity} · 가격 ${formatPrice(item.price)} · 소계 ${formatPrice(item.subtotal)}</p>
            </div>
        </article>
    `).join("");
}

function renderOrders() {
    if (!orderHistory) {
        return;
    }

    if (orders.length === 0) {
        orderHistory.innerHTML = `<p class="empty-state">아직 주문내역이 없습니다.</p>`;
        return;
    }

    orderHistory.innerHTML = orders.map((order) => {
        const isExpanded = expandedOrderId === order.orderId;

        return `
            <article class="order-card">
                <div class="order-card-header">
                    <div>
                        <h3>${order.orderId}</h3>
                        <p>${order.createdAt} · ${order.itemCount}개 상품</p>
                    </div>
                    <strong>${formatPrice(order.totalAmount)}</strong>
                </div>
                <button class="ghost-button detail-toggle" type="button" data-toggle-order="${order.orderId}">
                    ${isExpanded ? "상세 닫기" : "상세 보기"}
                </button>
                ${isExpanded ? `<div class="order-items-detail">${renderOrderItems(order.items)}</div>` : ""}
            </article>
        `;
    }).join("");
}

function renderStore() {
    renderCart();
    renderOrders();
}

function addToCart(productId) {
    cart[productId] = (cart[productId] || 0) + 1;
    saveStorage(CART_STORAGE_KEY, cart);
    renderStore();
}

function increaseQuantity(productId) {
    addToCart(productId);
}

function decreaseQuantity(productId) {
    if (!cart[productId]) {
        return;
    }

    cart[productId] -= 1;
    if (cart[productId] <= 0) {
        delete cart[productId];
    }

    saveStorage(CART_STORAGE_KEY, cart);
    renderStore();
}

function removeFromCart(productId) {
    delete cart[productId];
    saveStorage(CART_STORAGE_KEY, cart);
    renderStore();
}

function clearCart() {
    cart = {};
    saveStorage(CART_STORAGE_KEY, cart);
    renderStore();
    setCheckoutMessage("장바구니를 비웠습니다.");
}

function validateCheckout() {
    if (getCartEntries().length === 0) {
        setCheckoutMessage("장바구니에 상품을 담아주세요.", "error");
        return false;
    }

    if (!buyerName.value.trim()) {
        setCheckoutMessage("주문자명을 입력해 주세요.", "error");
        buyerName.focus();
        return false;
    }

    if (!buyerEmail.value.trim() || !buyerEmail.checkValidity()) {
        setCheckoutMessage("올바른 이메일을 입력해 주세요.", "error");
        buyerEmail.focus();
        return false;
    }

    return true;
}

function createDummyOrder() {
    if (!validateCheckout()) {
        return;
    }

    const entries = getCartEntries();
    const order = {
        orderId: `ORDER-${Date.now()}`,
        customerName: buyerName.value.trim(),
        customerEmail: buyerEmail.value.trim(),
        items: entries.map(({ product, quantity }) => ({
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity,
            subtotal: product.price * quantity,
            image: product.image
        })),
        itemCount: getCartItemCount(),
        totalAmount: getCartTotal(),
        paymentMethod: getSelectedPaymentMethod(),
        paymentStatus: "MOCK_PAID",
        orderStatus: "COMPLETED",
        createdAt: new Date().toLocaleString("ko-KR")
    };

    orders = [order, ...orders];
    cart = {};
    expandedOrderId = order.orderId;

    saveStorage(ORDERS_STORAGE_KEY, orders);
    saveStorage(CART_STORAGE_KEY, cart);
    setCheckoutMessage("더미 결제가 완료되었습니다.", "success");
    renderCompleteOrder(order);
    renderStore();
}

function toggleOrderDetail(orderId) {
    expandedOrderId = expandedOrderId === orderId ? null : orderId;
    renderOrders();
}

function bindStoreEvents() {
    document.addEventListener("click", (event) => {
        const addButton = event.target.closest("[data-add-to-cart]");
        const increaseButton = event.target.closest("[data-increase]");
        const decreaseButton = event.target.closest("[data-decrease]");
        const removeButton = event.target.closest("[data-remove]");
        const toggleOrderButton = event.target.closest("[data-toggle-order]");

        if (addButton) {
            addToCart(addButton.dataset.addToCart);
            return;
        }

        if (increaseButton) {
            increaseQuantity(increaseButton.dataset.increase);
            return;
        }

        if (decreaseButton) {
            decreaseQuantity(decreaseButton.dataset.decrease);
            return;
        }

        if (removeButton) {
            removeFromCart(removeButton.dataset.remove);
            return;
        }

        if (toggleOrderButton) {
            toggleOrderDetail(toggleOrderButton.dataset.toggleOrder);
        }
    });

    clearCartButton?.addEventListener("click", clearCart);
    checkoutButton?.addEventListener("click", createDummyOrder);
}

saveStorage(CART_STORAGE_KEY, cart);
saveStorage(ORDERS_STORAGE_KEY, orders);
renderProducts();
renderStore();
renderCompleteOrder(null);
bindStoreEvents();
