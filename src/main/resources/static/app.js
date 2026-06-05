const chatbotToggle = document.getElementById("chatbotToggle");
const chatbotPanel = document.getElementById("chatbotPanel");
const closeChatbot = document.getElementById("closeChatbot");
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const chatLog = document.getElementById("chatLog");
const botAvatar = document.getElementById("momoPngFallback");
const speechBubble = document.getElementById("speechBubble");
const live2dAssetCheck = document.getElementById("live2dAssetCheck");
const live2dRenderStatus = document.getElementById("live2dRenderStatus");
const live2dStage = document.getElementById("live2dStage");
const live2dCanvas = document.getElementById("live2dCanvas");

const messages = [];
let live2dReady = false;
let live2dApp = null;
const live2dAssetPaths = [
    "/model_dict.json",
    "/live2d-models/mao_pro/runtime/mao_pro.model3.json",
    "/live2d-models/mao_pro/runtime/mao_pro.moc3",
    "/live2d-models/mao_pro/runtime/mao_pro.4096/texture_00.png",
    "/live2d-models/mao_pro/runtime/motions/mtn_01.motion3.json",
    "/live2d-models/mao_pro/runtime/expressions/exp_01.exp3.json"
];

function setChatbotOpen(isOpen) {
    chatbotPanel.classList.toggle("open", isOpen);
    chatbotPanel.setAttribute("aria-hidden", String(!isOpen));
    chatbotToggle.setAttribute("aria-expanded", String(isOpen));
    chatbotToggle.setAttribute("aria-label", isOpen ? "MOMO AI 챗봇 닫기" : "MOMO AI 챗봇 열기");

    if (isOpen) {
        requestAnimationFrame(() => messageInput.focus());
    }
}

function appendMessage(role, content) {
    const message = document.createElement("div");
    message.classList.add("message", role);
    message.textContent = content;

    chatLog.appendChild(message);
    chatLog.scrollTop = chatLog.scrollHeight;
}

function setWaiting(isWaiting) {
    sendButton.disabled = isWaiting;
    sendButton.textContent = isWaiting ? "생각 중..." : "전송";

    if (botAvatar) {
        botAvatar.classList.toggle("thinking", isWaiting);
        botAvatar.classList.remove("talking");
    }

    if (live2dStage) {
        live2dStage.classList.toggle("thinking", isWaiting && live2dReady);
        live2dStage.classList.remove("talking");
    }
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

function setLive2DRenderStatus(message, statusClass) {
    if (!live2dRenderStatus) {
        return;
    }

    live2dRenderStatus.classList.remove("ok", "error");

    if (statusClass) {
        live2dRenderStatus.classList.add(statusClass);
    }

    live2dRenderStatus.textContent = message;
}

function keepPngFallback(reason) {
    live2dReady = false;

    if (live2dStage) {
        live2dStage.classList.remove("ready", "thinking", "talking");
    }

    if (botAvatar) {
        botAvatar.classList.remove("hidden");
    }

    if (reason) {
        console.error("Live2D render initialization skipped", reason);
    }
}

async function initLive2D() {
    const modelPath = "/live2d-models/mao_pro/runtime/mao_pro.model3.json";

    try {
        setLive2DRenderStatus("Live2D Render: loading...");

        if (!live2dStage || !live2dCanvas) {
            setLive2DRenderStatus("Live2D Render: Failed - canvas missing", "error");
            keepPngFallback("canvas element not found");
            return;
        }

        const pixi = window.PIXI;
        if (!pixi) {
            setLive2DRenderStatus("Live2D Render: Failed - PIXI missing", "error");
            keepPngFallback("window.PIXI is not defined");
            return;
        }

        if (!pixi.live2d || !pixi.live2d.Live2DModel) {
            setLive2DRenderStatus("Live2D Render: Failed - Live2DModel missing", "error");
            keepPngFallback("PIXI.live2d.Live2DModel is not defined");
            return;
        }

        const width = live2dStage.clientWidth || 142;
        const height = live2dStage.clientHeight || 180;

        live2dApp = new pixi.Application({
            view: live2dCanvas,
            width,
            height,
            transparent: true,
            backgroundAlpha: 0,
            antialias: true,
            autoStart: true
        });

        const model = await pixi.live2d.Live2DModel.from(modelPath);
        model.scale.set(0.16);
        model.x = Math.max((width - model.width) / 2, -40);
        model.y = height - model.height + 16;

        live2dApp.stage.addChild(model);
        live2dReady = true;
        live2dStage.classList.add("ready");

        if (botAvatar) {
            botAvatar.classList.add("hidden");
        }

        setLive2DRenderStatus("Live2D Render: OK", "ok");
    } catch (error) {
        setLive2DRenderStatus("Live2D Render: Failed", "error");
        keepPngFallback();
        console.error("Live2D render failed", error);
    }
}

chatbotToggle.addEventListener("click", () => {
    setChatbotOpen(!chatbotPanel.classList.contains("open"));
});

closeChatbot.addEventListener("click", () => {
    setChatbotOpen(false);
});

chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const content = messageInput.value.trim();
    if (!content) {
        return;
    }

    const userMessage = { role: "user", content };
    messages.push(userMessage);
    appendMessage("user", content);

    messageInput.value = "";
    setWaiting(true);

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ messages })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const reply = typeof data.reply === "string" ? data.reply : "응답을 읽지 못했어요.";

        messages.push({ role: "assistant", content: reply });
        appendMessage("assistant", reply);
        speechBubble.textContent = reply;
    } catch (error) {
        const errorMessage = "서버 응답을 받지 못했어요. 잠시 후 다시 시도해 주세요.";
        appendMessage("error", errorMessage);
        speechBubble.textContent = errorMessage;
    } finally {
        setWaiting(false);
        messageInput.focus();
    }
});

document.addEventListener("DOMContentLoaded", () => {
    checkLive2dAssets();
    initLive2D();
});
