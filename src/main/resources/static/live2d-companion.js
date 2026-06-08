(function () {
    const modelPath = "/live2d-models/mao_pro/runtime/mao_pro.model3.json";

    let companionLayer = null;
    let companionElement = null;
    let companionCanvas = null;
    let companionStatus = null;
    let companionSpeech = null;
    let summonButton = null;
    let hideButton = null;
    let dragHandle = null;
    let companionApp = null;
    let companionModel = null;
    let companionInitPromise = null;
    let refitTimer = null;
    let companionDragState = null;
    let companionSpeechText = "안녕하세요! MOMO Live예요.";
    let companionThinking = false;

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function setCompanionStatus(message, statusClass) {
        if (!companionStatus) {
            return;
        }

        companionStatus.classList.remove("ok", "error");

        if (statusClass) {
            companionStatus.classList.add(statusClass);
        }

        companionStatus.textContent = message;
    }

    function ensureCompanionSpeech() {
        if (companionSpeech || !companionElement) {
            return companionSpeech;
        }

        companionSpeech = document.getElementById("live2dCompanionSpeech");

        if (!companionSpeech) {
            companionSpeech = document.createElement("div");
            companionSpeech.id = "live2dCompanionSpeech";
            companionSpeech.className = "live2d-companion-speech";
            companionElement.appendChild(companionSpeech);
        }

        companionSpeech.textContent = companionSpeechText;
        return companionSpeech;
    }

    function isOpen() {
        return Boolean(companionLayer?.classList.contains("open"));
    }

    function isReady() {
        return Boolean(companionApp && companionModel);
    }

    function say(text) {
        const nextText = String(text || "").trim() || "안녕하세요! MOMO Live예요.";
        companionSpeechText = nextText;
        console.log("[MOMO_COMPANION_API] say", nextText);

        const speechElement = ensureCompanionSpeech();
        if (!speechElement) {
            return;
        }

        speechElement.textContent = nextText;
    }

    function setThinking(isThinking) {
        companionThinking = Boolean(isThinking);
        console.log("[MOMO_COMPANION_API] thinking", companionThinking);

        if (!companionLayer || !companionElement) {
            return;
        }

        companionLayer.classList.toggle("thinking", companionThinking && isOpen());
        companionElement.classList.toggle("thinking", companionThinking && isOpen());
    }

    function setError(message) {
        try {
            say(message || "앗, 응답을 받지 못했어요. 잠시 후 다시 시도해 주세요.");

            if (!companionElement || !isOpen()) {
                return;
            }

            companionElement.classList.add("error");
            window.setTimeout(() => {
                companionElement?.classList.remove("error");
            }, 1400);
        } catch (error) {
            console.error("[MOMO_COMPANION_API] setError failed", error);
        }
    }

    function rememberOriginalModelSize(model) {
        if (model.__originalWidth && model.__originalHeight) {
            return;
        }

        const scaleX = model.scale?.x || 1;
        const scaleY = model.scale?.y || 1;
        model.__originalWidth = model.width / scaleX;
        model.__originalHeight = model.height / scaleY;
    }

    function updateLive2DDragHitbox(model) {
        if (!model || !dragHandle || !companionElement) {
            return;
        }

        const bounds = model.getBounds?.();
        if (!bounds || bounds.width <= 0 || bounds.height <= 0) {
            return;
        }

        const stageWidth = companionElement.clientWidth;
        const stageHeight = companionElement.clientHeight;
        const canvasStyle = companionCanvas ? window.getComputedStyle(companionCanvas) : null;
        const matrix = canvasStyle?.transform && canvasStyle.transform !== "none"
            ? new DOMMatrixReadOnly(canvasStyle.transform)
            : null;
        const scaleX = Math.abs(matrix?.a || 1);
        const scaleY = Math.abs(matrix?.d || 1);
        const originX = stageWidth / 2;
        const originY = stageHeight;
        const visualLeft = originX + (bounds.x - originX) * scaleX;
        const visualTop = originY + (bounds.y - originY) * scaleY;
        const visualWidth = bounds.width * scaleX;
        const visualHeight = bounds.height * scaleY;
        const hitboxWidth = visualWidth * 0.58;
        const hitboxHeight = visualHeight * 0.72;

        dragHandle.style.left = `${visualLeft + (visualWidth - hitboxWidth) / 2}px`;
        dragHandle.style.top = `${visualTop + (visualHeight - hitboxHeight) / 2}px`;
        dragHandle.style.width = `${hitboxWidth}px`;
        dragHandle.style.height = `${hitboxHeight}px`;
        dragHandle.style.minWidth = "0";
        dragHandle.style.minHeight = "0";

        console.log("[LIVE2D_HITBOX] updated", {
            modelBounds: {
                x: bounds.x,
                y: bounds.y,
                width: bounds.width,
                height: bounds.height
            },
            visualBounds: {
                left: visualLeft,
                top: visualTop,
                width: visualWidth,
                height: visualHeight
            },
            hitbox: {
                left: dragHandle.style.left,
                top: dragHandle.style.top,
                width: dragHandle.style.width,
                height: dragHandle.style.height
            }
        });
    }

    function fitLive2DModelToStage(model, app, stageElement) {
        const rendererWidth = stageElement.clientWidth;
        const rendererHeight = stageElement.clientHeight;

        if (rendererWidth <= 0 || rendererHeight <= 0) {
            console.warn("[LIVE2D_COMPANION] refit skipped: stage size is zero", {
                width: rendererWidth,
                height: rendererHeight
            });
            return null;
        }

        app.renderer.resize(rendererWidth, rendererHeight);
        rememberOriginalModelSize(model);

        const originalWidth = model.__originalWidth;
        const originalHeight = model.__originalHeight;
        const targetHeight = rendererHeight * 0.82;
        const targetWidth = rendererWidth * 0.82;
        const scaleByHeight = targetHeight / originalHeight;
        const scaleByWidth = targetWidth / originalWidth;
        const appliedScale = clamp(Math.min(scaleByHeight, scaleByWidth), 0.05, 0.35);

        model.scale.set(appliedScale);

        if (model.anchor) {
            model.anchor.set(0.5, 1);
        }

        model.x = rendererWidth / 2;
        model.y = rendererHeight * 0.95;
        updateLive2DDragHitbox(model);

        console.log("[LIVE2D_COMPANION] fitted", {
            rendererWidth,
            rendererHeight,
            stageWidth: rendererWidth,
            stageHeight: rendererHeight,
            originalWidth,
            originalHeight,
            targetHeight,
            targetWidth,
            scaleByHeight,
            scaleByWidth,
            appliedScale,
            modelX: model.x,
            modelY: model.y,
            modelWidth: model.width,
            modelHeight: model.height
        });

        return {
            width: rendererWidth,
            height: rendererHeight,
            appliedScale,
            modelX: model.x,
            modelY: model.y
        };
    }

    function scheduleLive2DRefit() {
        window.clearTimeout(refitTimer);
        refitTimer = window.setTimeout(() => {
            if (!companionModel || !companionApp || !companionElement) {
                return;
            }

            requestAnimationFrame(() => {
                const fitResult = fitLive2DModelToStage(companionModel, companionApp, companionElement);

                if (!fitResult) {
                    return;
                }

                console.log("[LIVE2D_COMPANION] refit", {
                    width: fitResult.width,
                    height: fitResult.height,
                    appliedScale: fitResult.appliedScale,
                    modelX: fitResult.modelX,
                    modelY: fitResult.modelY
                });
            });
        }, 160);
    }

    function clampLive2DCompanionPosition(left, top) {
        if (!companionElement) {
            return { left, top };
        }

        const visibleSize = 120;
        const rect = companionElement.getBoundingClientRect();
        const width = rect.width || companionElement.offsetWidth;
        const height = rect.height || companionElement.offsetHeight;
        const minLeft = visibleSize - width;
        const maxLeft = window.innerWidth - visibleSize;
        const minTop = visibleSize - height;
        const maxTop = window.innerHeight - visibleSize;

        return {
            left: clamp(left, minLeft, maxLeft),
            top: clamp(top, minTop, maxTop)
        };
    }

    function applyLive2DCompanionPosition(left, top) {
        if (!companionElement) {
            return;
        }

        const nextPosition = clampLive2DCompanionPosition(left, top);
        companionElement.style.left = `${nextPosition.left}px`;
        companionElement.style.top = `${nextPosition.top}px`;
        companionElement.style.right = "auto";
        companionElement.style.bottom = "auto";
    }

    function startLive2DCompanionDrag(event) {
        if (!companionElement || event.currentTarget !== dragHandle) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        const rect = companionElement.getBoundingClientRect();
        companionDragState = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            startLeft: rect.left,
            startTop: rect.top
        };

        companionElement.style.left = `${rect.left}px`;
        companionElement.style.top = `${rect.top}px`;
        companionElement.style.right = "auto";
        companionElement.style.bottom = "auto";
        companionElement.classList.add("dragging");
        dragHandle?.setPointerCapture?.(event.pointerId);
        console.log("[LIVE2D_DRAG] start");
    }

    function moveLive2DCompanion(event) {
        if (!companionDragState) {
            return;
        }

        event.preventDefault();

        const nextLeft = companionDragState.startLeft + event.clientX - companionDragState.startX;
        const nextTop = companionDragState.startTop + event.clientY - companionDragState.startY;
        applyLive2DCompanionPosition(nextLeft, nextTop);
    }

    function stopLive2DCompanionDrag() {
        if (!companionDragState) {
            return;
        }

        dragHandle?.releasePointerCapture?.(companionDragState.pointerId);
        companionDragState = null;
        companionElement?.classList.remove("dragging");
        console.log("[LIVE2D_DRAG] end");
    }

    function keepLive2DCompanionInViewport() {
        if (!companionElement) {
            return;
        }

        const rect = companionElement.getBoundingClientRect();
        applyLive2DCompanionPosition(rect.left, rect.top);
    }

    function initLive2DCompanionDrag() {
        if (!dragHandle) {
            return;
        }

        dragHandle.addEventListener("pointerdown", startLive2DCompanionDrag);
        window.addEventListener("pointermove", moveLive2DCompanion);
        window.addEventListener("pointerup", stopLive2DCompanionDrag);
        window.addEventListener("pointercancel", stopLive2DCompanionDrag);
        window.addEventListener("resize", keepLive2DCompanionInViewport);
        console.log("[LIVE2D_DRAG] initialized");
    }

    function findLive2DModel() {
        return window.PIXI?.live2d?.Live2DModel || null;
    }

    async function initLive2DCompanion() {
        if (companionInitPromise) {
            return companionInitPromise;
        }

        companionInitPromise = (async () => {
            try {
                setCompanionStatus("Live2D Companion: checking libraries...");

                if (!companionCanvas || !companionElement) {
                    throw new Error("canvas missing");
                }

                const pixi = window.PIXI;
                if (!pixi) {
                    throw new Error("PIXI missing");
                }

                const Live2DModel = findLive2DModel();
                if (!Live2DModel) {
                    throw new Error("Live2DModel missing");
                }

                setCompanionStatus("Live2D Companion: checking model...");
                const modelResponse = await fetch(modelPath, { cache: "no-store" });
                if (!modelResponse.ok) {
                    throw new Error(`model3.json not reachable: HTTP ${modelResponse.status}`);
                }

                setCompanionStatus("Live2D Companion: creating renderer...");
                companionApp = new pixi.Application({
                    view: companionCanvas,
                    resizeTo: companionElement,
                    backgroundAlpha: 0,
                    antialias: true,
                    autoDensity: true
                });

                setCompanionStatus("Live2D Companion: loading model...");
                companionModel = await Live2DModel.from(modelPath);
                companionApp.stage.addChild(companionModel);
                rememberOriginalModelSize(companionModel);
                fitLive2DModelToStage(companionModel, companionApp, companionElement);

                setCompanionStatus("Live2D Companion: OK", "ok");
                console.log("[LIVE2D_COMPANION] loaded");
            } catch (error) {
                companionInitPromise = null;
                setCompanionStatus(`Live2D Companion: Failed - ${error.message}`, "error");
                console.error("[LIVE2D_COMPANION] failed", error);
            }
        })();

        return companionInitPromise;
    }

    function summonLive2DCompanion() {
        if (!companionLayer) {
            return;
        }

        companionLayer.classList.add("open");
        companionLayer.setAttribute("aria-hidden", "false");
        ensureCompanionSpeech();
        setThinking(companionThinking);
        initLive2DCompanion();
        scheduleLive2DRefit();
    }

    function hideLive2DCompanion() {
        if (!companionLayer) {
            return;
        }

        companionLayer.classList.remove("open");
        companionLayer.setAttribute("aria-hidden", "true");
        companionLayer.classList.remove("thinking");
        companionElement?.classList.remove("thinking", "error");
    }

    function requestLive2DCompanionHide() {
        const hideEvent = new CustomEvent("momo-live2d-hide-requested", {
            cancelable: true
        });

        const shouldContinue = window.dispatchEvent(hideEvent);
        if (shouldContinue) {
            hideLive2DCompanion();
        }
    }

    function bindCompanionDom() {
        companionLayer = document.getElementById("live2dCompanionLayer");
        companionElement = document.getElementById("live2dCompanion");
        companionCanvas = document.getElementById("live2dCompanionCanvas");
        companionStatus = document.getElementById("live2dCompanionStatus");
        companionSpeech = document.getElementById("live2dCompanionSpeech");
        summonButton = document.getElementById("summonLive2dButton");
        hideButton = document.getElementById("hideLive2dButton");
        dragHandle = document.getElementById("live2dDragHandle");
        ensureCompanionSpeech();

        if (summonButton) {
            summonButton.addEventListener("click", summonLive2DCompanion);
        }

        if (hideButton) {
            hideButton.addEventListener("click", requestLive2DCompanionHide);
        }

        initLive2DCompanionDrag();
        window.addEventListener("resize", scheduleLive2DRefit);
        window.addEventListener("orientationchange", scheduleLive2DRefit);
        document.addEventListener("fullscreenchange", scheduleLive2DRefit);
        console.log("[MOMO_COMPANION_API] ready");
        console.log("[LIVE2D_HITBOX] pointer policy applied");
    }

    window.MomoLive2DCompanion = {
        summon: summonLive2DCompanion,
        hide: hideLive2DCompanion,
        say,
        setThinking,
        setError,
        isOpen,
        isReady
    };

    document.addEventListener("DOMContentLoaded", bindCompanionDom);
})();
