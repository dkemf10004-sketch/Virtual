const chatbotToggle = document.getElementById("chatbotToggle");
const chatbotPanel = document.getElementById("chatbotPanel");
const closeChatbot = document.getElementById("closeChatbot");
const chatbotHeader = document.querySelector(".chatbot-header");
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const chatLog = document.getElementById("chatLog");
const botAvatar = document.getElementById("momoPngFallback");
const speechBubble = document.getElementById("speechBubble");
const live2dAssetCheck = document.getElementById("live2dAssetCheck");
const openAuditionFormButton = document.getElementById("openAuditionForm");
const auditionModal = document.getElementById("auditionModal");
const closeAuditionModalButton = document.getElementById("closeAuditionModal");
const auditionForm = document.getElementById("auditionForm");
const auditionFormMessage = document.getElementById("auditionFormMessage");

const messages = [];
let chatbotEventsBound = false;
let chatFormSubmitBound = false;
let auditionModalBound = false;
let goodsShopActionsBound = false;
let goodsDetailModal = null;
let chatbotResizeBound = false;
let chatbotResizeState = null;
let chatbotDragBound = false;
let chatbotDragState = null;
let sectionNavigatorInitialized = false;
let isSectionScrolling = false;
let activeSectionIndex = 0;
let sectionScrollUnlockTimer = null;
const SECTION_IDS = ["hero", "artists", "goods", "audition", "news", "contact"];
const sectionWheelIgnoreSelector = [
    ".chatbot-panel",
    ".chat-log",
    ".chat-form",
    "input",
    "textarea",
    "select",
    "button",
    ".audition-modal",
    ".goods-detail-modal",
    ".live2d-companion",
    ".live2d-companion-layer"
].join(", ");
const live2dAssetPaths = [
    "/model_dict.json",
    "/live2d-models/mao_pro/runtime/mao_pro.model3.json",
    "/live2d-models/mao_pro/runtime/mao_pro.moc3",
    "/live2d-models/mao_pro/runtime/mao_pro.4096/texture_00.png",
    "/live2d-models/mao_pro/runtime/motions/mtn_01.motion3.json",
    "/live2d-models/mao_pro/runtime/expressions/exp_01.exp3.json"
];
const STORE_CART_STORAGE_KEY = "momoStoreCart";
const SITE_ACTIONS = [
    {
        id: "go-artists",
        keywords: ["아티스트", "가수", "멤버", "라인업", "로스터"],
        actionType: "SCROLL_SECTION",
        targetId: "artists",
        speech: "아티스트 섹션으로 안내해드릴게요."
    },
    {
        id: "go-goods",
        keywords: ["굿즈", "상품", "샵", "스토어"],
        actionType: "SCROLL_SECTION",
        targetId: "goods",
        speech: "MOMO 굿즈샵으로 안내해드릴게요."
    },
    {
        id: "go-audition",
        keywords: ["오디션", "지원", "모집"],
        actionType: "SCROLL_SECTION",
        targetId: "audition",
        speech: "오디션 안내 섹션으로 이동할게요."
    },
    {
        id: "go-news",
        keywords: ["뉴스", "소식", "업데이트"],
        actionType: "SCROLL_SECTION",
        targetId: "news",
        speech: "NOVA 업데이트 소식으로 안내해드릴게요."
    },
    {
        id: "go-contact",
        keywords: ["문의", "연락", "컨택"],
        actionType: "SCROLL_SECTION",
        targetId: "contact",
        speech: "문의 정보를 확인할 수 있는 위치로 안내해드릴게요."
    },
    {
        id: "show-momo-mug",
        keywords: ["컵", "머그", "머그컵", "mug"],
        actionType: "HIGHLIGHT_PRODUCT",
        targetId: "momo-mug",
        speech: "MOMO Mug 상품을 보여드릴게요."
    },
    {
        id: "show-momo-tshirt",
        keywords: ["티셔츠", "셔츠", "t-shirt", "tshirt"],
        actionType: "HIGHLIGHT_PRODUCT",
        targetId: "momo-tshirt",
        speech: "MOMO T-Shirt 상품을 보여드릴게요."
    }
];

function setChatbotOpen(isOpen) {
    if (!chatbotPanel || !chatbotToggle) {
        console.error("[CHATBOT] missing required DOM", {
            chatbotPanel: Boolean(chatbotPanel),
            chatbotToggle: Boolean(chatbotToggle)
        });
        return;
    }

    chatbotPanel.classList.toggle("open", isOpen);
    chatbotPanel.setAttribute("aria-hidden", String(!isOpen));
    chatbotToggle.setAttribute("aria-expanded", String(isOpen));
    chatbotToggle.setAttribute("aria-label", isOpen ? "MOMO AI 챗봇 닫기" : "MOMO AI 챗봇 열기");

    if (isOpen && messageInput) {
        requestAnimationFrame(() => messageInput.focus());
    }
}

function positionChatbotForAssistantMode() {
    if (!chatbotPanel || window.innerWidth <= 600) {
        return;
    }

    chatbotPanel.style.position = "fixed";
    chatbotPanel.style.left = "32px";
    chatbotPanel.style.right = "auto";
    chatbotPanel.style.bottom = "32px";
    chatbotPanel.style.top = "auto";
    chatbotPanel.style.transform = "none";
}

function openAssistantMode() {
    console.log("[ASSISTANT_MODE] open");
    document.body.classList.add("assistant-mode");
    console.log("[ASSISTANT_UI] compact chat profile applied");
    positionChatbotForAssistantMode();
    setChatbotOpen(true);
    window.MomoLive2DCompanion?.summon?.();
}

function closeAssistantMode() {
    console.log("[ASSISTANT_MODE] close");
    setChatbotOpen(false);
    window.MomoLive2DCompanion?.hide?.();
    document.body.classList.remove("assistant-mode");
}

function appendMessage(role, content) {
    if (!chatLog) {
        console.error("[CHATBOT] missing required DOM", { chatLog: false });
        return;
    }

    const message = document.createElement("div");
    message.classList.add("message", role);
    message.textContent = content;

    chatLog.appendChild(message);
    chatLog.scrollTop = chatLog.scrollHeight;
}

function setWaiting(isWaiting) {
    if (sendButton) {
        sendButton.disabled = isWaiting;
        sendButton.textContent = isWaiting ? "생각 중..." : "전송";
    }

    if (botAvatar) {
        botAvatar.classList.toggle("thinking", isWaiting);
        botAvatar.classList.remove("talking");
    }
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function getPageSections() {
    return SECTION_IDS
        .map((sectionId) => document.getElementById(sectionId))
        .filter(Boolean);
}

function getCurrentSectionIndex() {
    const sections = getPageSections();
    if (sections.length === 0) {
        return -1;
    }

    const viewportCenter = window.innerHeight * 0.5;
    let currentIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        const sectionCenter = rect.top + rect.height * 0.5;
        const distance = Math.abs(sectionCenter - viewportCenter);

        if (distance < closestDistance) {
            closestDistance = distance;
            currentIndex = index;
        }
    });

    console.log("[SECTION_NAV] current", currentIndex, sections[currentIndex]?.id);
    return currentIndex;
}

function getSectionCenterScrollTop(section) {
    const rect = section.getBoundingClientRect();
    const sectionTop = rect.top + window.scrollY;
    const sectionCenter = sectionTop + rect.height * 0.5;
    const maxScrollTop = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

    return clamp(sectionCenter - window.innerHeight * 0.5, 0, maxScrollTop);
}

function goToSection(index) {
    const sections = getPageSections();
    if (sections.length === 0) {
        return;
    }

    const targetIndex = clamp(index, 0, sections.length - 1);
    const target = sections[targetIndex];
    if (!target || targetIndex === activeSectionIndex) {
        return;
    }

    activeSectionIndex = targetIndex;
    isSectionScrolling = true;
    if (sectionScrollUnlockTimer) {
        window.clearTimeout(sectionScrollUnlockTimer);
    }

    const targetScrollTop = getSectionCenterScrollTop(target);
    window.scrollTo({
        top: targetScrollTop,
        behavior: "smooth"
    });

    sectionScrollUnlockTimer = window.setTimeout(() => {
        isSectionScrolling = false;
        sectionScrollUnlockTimer = null;
    }, 850);

    console.log("[SECTION_NAV] goTo", target.id, "centerTop", targetScrollTop);
}

function goToSectionById(sectionId) {
    const sections = getPageSections();
    const targetIndex = sections.findIndex((section) => section.id === sectionId);

    if (targetIndex < 0) {
        console.warn("[SECTION_NAV] target not found", sectionId);
        return false;
    }

    goToSection(targetIndex);
    return true;
}

function handleSectionWheel(event) {
    if (!event) {
        return;
    }

    if (event.target?.closest?.(sectionWheelIgnoreSelector)) {
        return;
    }

    if (isSectionScrolling) {
        event.preventDefault();
        return;
    }

    if (event.deltaY <= 20 && event.deltaY >= -20) {
        return;
    }

    const sections = getPageSections();
    if (sections.length < 2) {
        return;
    }

    const measuredIndex = getCurrentSectionIndex();
    const activeSection = sections[activeSectionIndex];
    const activeRect = activeSection?.getBoundingClientRect?.();
    const activeSectionStillVisible = Boolean(
        activeRect && activeRect.top < window.innerHeight * 0.72 && activeRect.bottom > window.innerHeight * 0.28
    );

    if (!isSectionScrolling && !activeSectionStillVisible && measuredIndex >= 0) {
        activeSectionIndex = measuredIndex;
    }

    const currentIndex = activeSectionIndex;
    const direction = event.deltaY > 0 ? 1 : -1;
    const targetIndex = clamp(currentIndex + direction, 0, sections.length - 1);

    if (targetIndex === currentIndex) {
        return;
    }

    event.preventDefault();
    console.log("[SECTION_NAV] wheel", direction, "from", sections[currentIndex]?.id, "to", sections[targetIndex]?.id);
    goToSection(targetIndex);
}

function initSectionNavigator() {
    if (sectionNavigatorInitialized) {
        return;
    }

    activeSectionIndex = Math.max(0, getCurrentSectionIndex());
    window.addEventListener("wheel", handleSectionWheel, { passive: false });
    sectionNavigatorInitialized = true;
    console.log("[SECTION_NAV] initialized");
}

function openAuditionModal() {
    if (!auditionModal) {
        return;
    }

    auditionModal.classList.add("open");
    auditionModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("audition-modal-open");

    if (auditionFormMessage) {
        auditionFormMessage.textContent = "";
        auditionFormMessage.classList.remove("visible");
    }

    requestAnimationFrame(() => {
        auditionForm?.querySelector("input, select, textarea")?.focus();
    });
}

function closeAuditionModal() {
    if (!auditionModal) {
        return;
    }

    auditionModal.classList.remove("open");
    auditionModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("audition-modal-open");
}

function handleAuditionSubmit(event) {
    event.preventDefault();

    if (!auditionForm) {
        return;
    }

    if (!auditionForm.reportValidity()) {
        return;
    }

    const formData = Object.fromEntries(new FormData(auditionForm).entries());
    console.log("[AUDITION_FORM] submitted", formData);

    auditionForm.reset();
    if (auditionFormMessage) {
        auditionFormMessage.textContent = "지원 문의가 접수되었습니다. 담당자가 확인 후 연락드릴게요.";
        auditionFormMessage.classList.add("visible");
    }
}

function initAuditionModal() {
    if (auditionModalBound) {
        return;
    }

    if (openAuditionFormButton) {
        openAuditionFormButton.addEventListener("click", openAuditionModal);
    }

    if (closeAuditionModalButton) {
        closeAuditionModalButton.addEventListener("click", closeAuditionModal);
    }

    if (auditionModal) {
        auditionModal.addEventListener("click", (event) => {
            if (event.target === auditionModal) {
                closeAuditionModal();
            }
        });
    }

    if (auditionForm) {
        auditionForm.addEventListener("submit", handleAuditionSubmit);
    }

    window.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && auditionModal?.classList.contains("open")) {
            closeAuditionModal();
        }
    });

    auditionModalBound = true;
}

function startChatbotResize(direction, event) {
    if (!chatbotPanel || window.innerWidth <= 600) {
        return;
    }

    event.preventDefault();
    event.stopPropagation();

    const rect = chatbotPanel.getBoundingClientRect();
    chatbotResizeState = {
        direction,
        startX: event.clientX,
        startY: event.clientY,
        startLeft: rect.left,
        startTop: rect.top,
        startWidth: rect.width,
        startHeight: rect.height
    };

    chatbotPanel.style.position = "fixed";
    chatbotPanel.style.left = `${rect.left}px`;
    chatbotPanel.style.top = `${rect.top}px`;
    chatbotPanel.style.width = `${rect.width}px`;
    chatbotPanel.style.height = `${rect.height}px`;
    chatbotPanel.style.right = "auto";
    chatbotPanel.style.bottom = "auto";
    chatbotPanel.style.transform = "none";

    document.body.classList.add("resizing-chatbot");
    console.log("[CHATBOT_RESIZE] start", direction);
}

function resizeChatbot(direction, event) {
    if (!chatbotPanel || !chatbotResizeState || chatbotResizeState.direction !== direction) {
        return;
    }

    const minWidth = 320;
    const minHeight = 420;
    const maxWidth = window.innerWidth - 48;
    const maxHeight = window.innerHeight - 48;
    const deltaX = event.clientX - chatbotResizeState.startX;
    const deltaY = event.clientY - chatbotResizeState.startY;
    let nextLeft = chatbotResizeState.startLeft;
    let nextTop = chatbotResizeState.startTop;
    let nextWidth = chatbotResizeState.startWidth;
    let nextHeight = chatbotResizeState.startHeight;

    if (direction.includes("e")) {
        nextWidth = chatbotResizeState.startWidth + deltaX;
    }

    if (direction.includes("s")) {
        nextHeight = chatbotResizeState.startHeight + deltaY;
    }

    if (direction.includes("w")) {
        nextWidth = chatbotResizeState.startWidth - deltaX;
        nextLeft = chatbotResizeState.startLeft + deltaX;
    }

    if (direction.includes("n")) {
        nextHeight = chatbotResizeState.startHeight - deltaY;
        nextTop = chatbotResizeState.startTop + deltaY;
    }

    nextWidth = clamp(nextWidth, minWidth, maxWidth);
    nextHeight = clamp(nextHeight, minHeight, maxHeight);

    if (direction.includes("w")) {
        nextLeft = chatbotResizeState.startLeft + (chatbotResizeState.startWidth - nextWidth);
    }

    if (direction.includes("n")) {
        nextTop = chatbotResizeState.startTop + (chatbotResizeState.startHeight - nextHeight);
    }

    nextLeft = clamp(nextLeft, 24, Math.max(24, window.innerWidth - nextWidth - 24));
    nextTop = clamp(nextTop, 24, Math.max(24, window.innerHeight - nextHeight - 24));

    chatbotPanel.style.left = `${nextLeft}px`;
    chatbotPanel.style.top = `${nextTop}px`;
    chatbotPanel.style.width = `${nextWidth}px`;
    chatbotPanel.style.height = `${nextHeight}px`;
}

function stopChatbotResize() {
    if (!chatbotResizeState) {
        return;
    }

    chatbotResizeState = null;
    document.body.classList.remove("resizing-chatbot");
    console.log("[CHATBOT_RESIZE] end");
}

function startChatbotDrag(event) {
    if (!chatbotPanel || window.innerWidth <= 600 || event.target.closest("button")) {
        return;
    }

    event.preventDefault();

    const rect = chatbotPanel.getBoundingClientRect();
    chatbotDragState = {
        startX: event.clientX,
        startY: event.clientY,
        startLeft: rect.left,
        startTop: rect.top,
        width: rect.width,
        height: rect.height
    };

    chatbotPanel.style.position = "fixed";
    chatbotPanel.style.left = `${rect.left}px`;
    chatbotPanel.style.top = `${rect.top}px`;
    chatbotPanel.style.width = `${rect.width}px`;
    chatbotPanel.style.height = `${rect.height}px`;
    chatbotPanel.style.right = "auto";
    chatbotPanel.style.bottom = "auto";
    chatbotPanel.style.transform = "none";

    document.body.classList.add("dragging-chatbot");
}

function dragChatbot(event) {
    if (!chatbotPanel || !chatbotDragState) {
        return;
    }

    const deltaX = event.clientX - chatbotDragState.startX;
    const deltaY = event.clientY - chatbotDragState.startY;
    const nextLeft = clamp(
        chatbotDragState.startLeft + deltaX,
        24,
        Math.max(24, window.innerWidth - chatbotDragState.width - 24)
    );
    const nextTop = clamp(
        chatbotDragState.startTop + deltaY,
        24,
        Math.max(24, window.innerHeight - chatbotDragState.height - 24)
    );

    chatbotPanel.style.left = `${nextLeft}px`;
    chatbotPanel.style.top = `${nextTop}px`;
}

function stopChatbotDrag() {
    if (!chatbotDragState) {
        return;
    }

    chatbotDragState = null;
    document.body.classList.remove("dragging-chatbot");
}

function initChatbotDraggable() {
    if (!chatbotHeader || chatbotDragBound) {
        return;
    }

    chatbotHeader.addEventListener("pointerdown", startChatbotDrag);
    window.addEventListener("pointermove", dragChatbot);
    window.addEventListener("pointerup", stopChatbotDrag);
    window.addEventListener("pointercancel", stopChatbotDrag);
    chatbotDragBound = true;
}

function initChatbotResizable() {
    if (!chatbotPanel || chatbotResizeBound) {
        return;
    }

    const resizeHandles = chatbotPanel.querySelectorAll(".resize-handle");
    resizeHandles.forEach((handle) => {
        const direction = handle.dataset.resizeDirection;
        handle.addEventListener("pointerdown", (event) => {
            startChatbotResize(direction, event);
        });
    });

    window.addEventListener("pointermove", (event) => {
        if (!chatbotResizeState) {
            return;
        }

        resizeChatbot(chatbotResizeState.direction, event);
    });

    window.addEventListener("pointerup", stopChatbotResize);
    window.addEventListener("pointercancel", stopChatbotResize);
    chatbotResizeBound = true;
    console.log("[CHATBOT_RESIZE] initialized");
}

async function checkLive2dAssets() {
    if (!live2dAssetCheck) {
        return;
    }

    live2dAssetCheck.classList.remove("ok", "error");
    live2dAssetCheck.textContent = "Live2D Assets: checking...";

    const results = await Promise.all(live2dAssetPaths.map(async (path) => {
        try {
            const response = await fetch(path, {
                method: "GET",
                cache: "no-store"
            });

            return {
                path,
                ok: response.ok,
                status: response.status
            };
        } catch (error) {
            return {
                path,
                ok: false,
                status: "network-error",
                error
            };
        }
    }));

    const failedAssets = results.filter((result) => !result.ok);

    if (failedAssets.length === 0) {
        live2dAssetCheck.classList.add("ok");
        live2dAssetCheck.textContent = "Live2D Assets: OK";
        return;
    }

    const failedPaths = failedAssets.map((asset) => asset.path).join(", ");
    live2dAssetCheck.classList.add("error");
    live2dAssetCheck.textContent = `Live2D Assets: Missing ${failedPaths}`;
    console.warn("Live2D asset check failed", failedAssets);
}

function detectSiteAction(message) {
    const normalizedMessage = String(message || "").trim().toLowerCase();
    if (!normalizedMessage) {
        return null;
    }

    const matchedAction = SITE_ACTIONS.find((action) => {
        return action.keywords.some((keyword) => normalizedMessage.includes(String(keyword).toLowerCase()));
    });

    if (!matchedAction) {
        return null;
    }

    console.log("[SITE_ACTION] detected", matchedAction);
    return matchedAction;
}

function highlightSiteActionTarget(targetElement) {
    if (!targetElement) {
        return;
    }

    targetElement.classList.add("site-action-highlight");
    window.setTimeout(() => {
        targetElement.classList.remove("site-action-highlight");
    }, 1600);
}

function syncActiveSectionById(sectionId) {
    const sections = getPageSections();
    const nextIndex = sections.findIndex((section) => section.id === sectionId);
    if (nextIndex >= 0) {
        activeSectionIndex = nextIndex;
    }
}

function executeScrollSectionAction(action) {
    const targetElement = document.getElementById(action.targetId);
    if (!targetElement) {
        console.warn("[SITE_ACTION] target not found", action);
        return;
    }

    targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
    syncActiveSectionById(action.targetId);
    highlightSiteActionTarget(targetElement);
    window.MomoLive2DCompanion?.say?.(action.speech);
    console.log("[SITE_ACTION] executed", action.actionType, action.targetId);
}

function executeHighlightProductAction(action) {
    const goodsSection = document.getElementById("goods");
    if (goodsSection) {
        goodsSection.scrollIntoView({ behavior: "smooth", block: "start" });
        syncActiveSectionById("goods");
    } else {
        console.warn("[SITE_ACTION] target not found", { ...action, targetId: "goods" });
    }

    const productCard = document.querySelector(`[data-product-id="${action.targetId}"]`);
    if (!productCard) {
        console.warn("[SITE_ACTION] target not found", action);
        window.MomoLive2DCompanion?.say?.(action.speech);
        return;
    }

    productCard.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    highlightSiteActionTarget(productCard);
    window.MomoLive2DCompanion?.say?.(action.speech);
    console.log("[SITE_ACTION] executed", action.actionType, action.targetId);
}

function executeOpenModalAction(action) {
    const fallbackTargetId = action.fallbackTargetId || "audition";
    const fallbackElement = document.getElementById(fallbackTargetId) || document.getElementById("contact");

    if (!fallbackElement) {
        console.warn("[SITE_ACTION] target not found", action);
        return;
    }

    fallbackElement.scrollIntoView({ behavior: "smooth", block: "start" });
    syncActiveSectionById(fallbackElement.id);
    highlightSiteActionTarget(fallbackElement);
    window.MomoLive2DCompanion?.say?.(action.speech);
    console.log("[SITE_ACTION] executed", action.actionType, action.targetId);
}

function executeSiteAction(action) {
    if (!action) {
        return;
    }

    if (action.actionType === "SCROLL_SECTION") {
        executeScrollSectionAction(action);
        return;
    }

    if (action.actionType === "HIGHLIGHT_PRODUCT") {
        executeHighlightProductAction(action);
        return;
    }

    if (action.actionType === "OPEN_MODAL") {
        executeOpenModalAction(action);
        return;
    }

    console.warn("[SITE_ACTION] target not found", action);
}

async function handleChatSubmit(event) {
    event.preventDefault();

    if (!messageInput || !chatLog || !chatForm) {
        console.error("[CHATBOT] missing required DOM before submit", {
            chatForm: Boolean(chatForm),
            messageInput: Boolean(messageInput),
            chatLog: Boolean(chatLog)
        });
        return;
    }

    const content = messageInput.value.trim();
    if (!content) {
        return;
    }

    console.log("[CHATBOT] send", content);

    const userMessage = { role: "user", content };
    messages.push(userMessage);
    appendMessage("user", content);
    const siteAction = detectSiteAction(content);
    executeSiteAction(siteAction);

    messageInput.value = "";
    setWaiting(true);
    window.MomoLive2DCompanion?.setThinking?.(true);

    if (window.MomoLive2DCompanion?.isOpen?.()) {
        window.MomoLive2DCompanion?.say?.("잠시만요, 확인해볼게요.");
    }

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ messages: messages })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const reply = typeof data.reply === "string" ? data.reply : "응답을 읽지 못했어요.";
        console.log("[CHATBOT] reply", reply);

        messages.push({ role: "assistant", content: reply });
        appendMessage("assistant", reply);
        if (speechBubble) {
            speechBubble.textContent = reply;
        }
        window.MomoLive2DCompanion?.setThinking?.(false);
        window.MomoLive2DCompanion?.say?.(reply);
    } catch (error) {
        const errorMessage = "서버 응답을 받지 못했어요. 잠시 후 다시 시도해 주세요.";
        appendMessage("error", errorMessage);
        if (speechBubble) {
            speechBubble.textContent = errorMessage;
        }
        window.MomoLive2DCompanion?.setThinking?.(false);
        window.MomoLive2DCompanion?.setError?.("앗, 응답을 받지 못했어요. 잠시 후 다시 시도해 주세요.");
        console.error("[CHATBOT] failed", error);
    } finally {
        setWaiting(false);
        if (messageInput) {
            messageInput.focus();
        }
    }
}

function validateChatbotDom() {
    const requiredElements = {
        chatbotToggle,
        chatbotPanel,
        chatForm,
        messageInput,
        sendButton,
        chatLog
    };

    const missingElements = Object.entries(requiredElements)
        .filter(([, element]) => !element)
        .map(([name]) => name);

    if (missingElements.length > 0) {
        console.error("[CHATBOT] missing required DOM", missingElements);
        return false;
    }

    return true;
}

function initializeChatbot() {
    validateChatbotDom();

    if (!chatbotEventsBound && chatbotToggle && chatbotPanel) {
        chatbotToggle.addEventListener("click", openAssistantMode);
        chatbotEventsBound = true;
    }

    if (closeChatbot) {
        closeChatbot.addEventListener("click", closeAssistantMode);
    }

    window.addEventListener("momo-live2d-hide-requested", (event) => {
        event.preventDefault();
        closeAssistantMode();
    });

    if (!chatFormSubmitBound && chatForm) {
        chatForm.addEventListener("submit", handleChatSubmit);
        chatFormSubmitBound = true;
    }

    initChatbotResizable();
    initChatbotDraggable();
    console.log("[CHATBOT] initialized");
    console.log("[CHATBOT_UI] initialized");
    console.log("[ASSISTANT_MODE] initialized");
}

function getGoodsProductData(card) {
    if (!card) {
        return null;
    }

    const image = card.querySelector(".goods-product-image");
    return {
        id: card.dataset.productId || "",
        category: card.dataset.category || card.querySelector(".goods-category")?.textContent?.trim() || "",
        name: card.querySelector("h3")?.textContent?.trim() || "MOMO Goods",
        description: card.querySelector(".goods-card-body p:not(.goods-category)")?.textContent?.trim() || "",
        price: card.querySelector(".goods-price")?.textContent?.trim() || "",
        image: image?.getAttribute("src") || "",
        alt: image?.getAttribute("alt") || "MOMO goods product"
    };
}

function createGoodsDetailModal() {
    if (goodsDetailModal) {
        return goodsDetailModal;
    }

    const modal = document.createElement("div");
    modal.id = "goodsDetailModal";
    modal.className = "goods-detail-modal";
    modal.setAttribute("aria-hidden", "true");

    const panel = document.createElement("section");
    panel.className = "goods-detail-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-labelledby", "goodsDetailTitle");

    const closeButton = document.createElement("button");
    closeButton.className = "goods-detail-close";
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "상품 상세 닫기");
    closeButton.textContent = "Close";

    const imageWrap = document.createElement("div");
    imageWrap.className = "goods-detail-image";

    const image = document.createElement("img");
    image.className = "goods-detail-product-image";
    image.alt = "";
    imageWrap.appendChild(image);

    const content = document.createElement("div");
    content.className = "goods-detail-content";

    const category = document.createElement("p");
    category.className = "goods-detail-category";

    const title = document.createElement("h2");
    title.id = "goodsDetailTitle";

    const description = document.createElement("p");
    description.className = "goods-detail-description";

    const price = document.createElement("strong");
    price.className = "goods-detail-price";

    const actions = document.createElement("div");
    actions.className = "goods-detail-actions";

    const addButton = document.createElement("button");
    addButton.className = "goods-button";
    addButton.type = "button";
    addButton.textContent = "Add to Cart";

    const keepBrowsingButton = document.createElement("button");
    keepBrowsingButton.className = "goods-button secondary";
    keepBrowsingButton.type = "button";
    keepBrowsingButton.textContent = "Keep Browsing";

    actions.append(addButton, keepBrowsingButton);
    content.append(category, title, description, price, actions);
    panel.append(closeButton, imageWrap, content);
    modal.appendChild(panel);
    document.body.appendChild(modal);

    closeButton.addEventListener("click", closeGoodsDetailModal);
    keepBrowsingButton.addEventListener("click", closeGoodsDetailModal);
    addButton.addEventListener("click", () => {
        const productId = modal.dataset.productId;
        if (productId) {
            addGoodsProductToStoreCart(productId);
            window.location.href = "/store-test/index.html";
        }
    });
    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeGoodsDetailModal();
        }
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && modal.classList.contains("open")) {
            closeGoodsDetailModal();
        }
    });

    goodsDetailModal = modal;
    return goodsDetailModal;
}

function openGoodsDetailModal(product) {
    if (!product) {
        return;
    }

    const modal = createGoodsDetailModal();
    modal.dataset.productId = product.id;
    modal.querySelector(".goods-detail-product-image").src = product.image;
    modal.querySelector(".goods-detail-product-image").alt = product.alt;
    modal.querySelector(".goods-detail-category").textContent = product.category;
    modal.querySelector("#goodsDetailTitle").textContent = product.name;
    modal.querySelector(".goods-detail-description").textContent = product.description;
    modal.querySelector(".goods-detail-price").textContent = product.price;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("goods-detail-open");
}

function closeGoodsDetailModal() {
    if (!goodsDetailModal) {
        return;
    }

    goodsDetailModal.classList.remove("open");
    goodsDetailModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("goods-detail-open");
}

function addGoodsProductToStoreCart(productId) {
    if (!productId) {
        return;
    }

    let cart = {};
    try {
        cart = JSON.parse(localStorage.getItem(STORE_CART_STORAGE_KEY) || "{}") || {};
    } catch (error) {
        console.warn("[GOODS_SHOP] cart read failed", error);
        cart = {};
    }

    cart[productId] = (Number(cart[productId]) || 0) + 1;
    localStorage.setItem(STORE_CART_STORAGE_KEY, JSON.stringify(cart));
    console.log("[GOODS_SHOP] add to cart", productId);
}

function initGoodsShopActions() {
    if (goodsShopActionsBound) {
        return;
    }

    const goodsSection = document.getElementById("goods");
    if (!goodsSection) {
        return;
    }

    goodsSection.addEventListener("click", (event) => {
        const button = event.target.closest(".goods-button");
        const card = event.target.closest(".goods-card");
        if (!button || !card) {
            return;
        }

        const product = getGoodsProductData(card);
        if (!product) {
            return;
        }

        if (button.classList.contains("secondary")) {
            openGoodsDetailModal(product);
            return;
        }

        addGoodsProductToStoreCart(product.id);
        window.location.href = "/store-test/index.html";
    });

    goodsShopActionsBound = true;
    console.log("[GOODS_SHOP] actions initialized");
}

document.addEventListener("DOMContentLoaded", () => {
    initializeChatbot();
    initSectionNavigator();
    initAuditionModal();
    initGoodsShopActions();
    checkLive2dAssets();
});
