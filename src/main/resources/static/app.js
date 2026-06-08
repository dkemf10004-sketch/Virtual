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

const messages = [];
let chatbotEventsBound = false;
let chatFormSubmitBound = false;
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
    const normalizedMessage = String(message || "").toLowerCase();
    const actionRules = [
        {
            keywords: ["아티스트", "가수", "멤버", "라인업"],
            targetId: "artists",
            speech: "아티스트 섹션으로 안내해드릴게요."
        },
        {
            keywords: ["오디션", "지원", "모집"],
            targetId: "audition",
            speech: "오디션 안내 섹션으로 이동할게요."
        },
        {
            keywords: ["뉴스", "소식", "업데이트"],
            targetId: "news",
            speech: "최신 소식 섹션으로 안내해드릴게요."
        },
        {
            keywords: ["문의", "연락", "컨택"],
            targetId: "contact",
            speech: "문의 정보가 있는 영역으로 안내해드릴게요."
        },
        {
            keywords: ["굿즈", "상품", "샵", "스토어"],
            targetId: "goods",
            speech: "MOMO Goods Shop으로 안내해드릴게요."
        }
    ];

    const matchedRule = actionRules.find((rule) => {
        return rule.keywords.some((keyword) => normalizedMessage.includes(keyword));
    });

    if (!matchedRule) {
        return null;
    }

    return {
        type: "scroll",
        targetId: matchedRule.targetId,
        speech: matchedRule.speech
    };
}

function executeSiteAction(action) {
    if (!action) {
        return;
    }

    const moved = goToSectionById(action.targetId);
    const targetElement = document.getElementById(action.targetId);
    if (!moved || !targetElement) {
        console.warn("[SITE_ACTION] target not found", action.targetId);
        return;
    }

    targetElement.classList.add("site-action-highlight");
    window.setTimeout(() => {
        targetElement.classList.remove("site-action-highlight");
    }, 1600);
    window.MomoLive2DCompanion?.say?.(action.speech);
    console.log("[SITE_ACTION] executed", action);
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

document.addEventListener("DOMContentLoaded", () => {
    initializeChatbot();
    initSectionNavigator();
    checkLive2dAssets();
});
