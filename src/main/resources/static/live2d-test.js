const live2dStatus = document.getElementById("live2dStatus");
const live2dDebug = document.getElementById("live2dDebug");
const live2dStage = document.getElementById("live2dStage");
const live2dCanvas = document.getElementById("live2dCanvas");

let live2dTestStarted = false;
let live2dGlobalsResult = null;

function setLive2DStatus(message, statusClass) {
    if (!live2dStatus) {
        return;
    }

    live2dStatus.classList.remove("ok", "error");

    if (statusClass) {
        live2dStatus.classList.add(statusClass);
    }

    live2dStatus.textContent = message;
}

function setLive2DDebug(lines) {
    if (!live2dDebug) {
        return;
    }

    live2dDebug.textContent = Array.isArray(lines) ? lines.join("\n") : String(lines);
}

function diagnoseLive2DGlobals() {
    const pixi = window.PIXI;
    const result = {
        typeofWindowPIXI: typeof window.PIXI,
        hasWindowPIXI: Boolean(window.PIXI),
        hasPIXI_live2d: Boolean(window.PIXI?.live2d),
        hasPIXI_live2d_Live2DModel: Boolean(window.PIXI?.live2d?.Live2DModel),
        hasPIXI_live2d_Cubism4Model: Boolean(window.PIXI?.live2d?.Cubism4Model),
        hasWindowLive2DModel: Boolean(window.Live2DModel),
        hasPIXI_Live2DModel: Boolean(window.PIXI?.Live2DModel),
        typeofPIXI_live2d_Live2DModel: typeof window.PIXI?.live2d?.Live2DModel,
        typeofPIXI_live2d_Cubism4Model: typeof window.PIXI?.live2d?.Cubism4Model,
        scriptSrcList: Array.from(document.scripts).map((script) => script.src).filter(Boolean),
        windowLive2DKeys: Object.keys(window).filter((key) => key.toLowerCase().includes("live2d")),
        pixiTopLevelKeys: Object.keys(pixi || {}).slice(0, 80),
        pixiLive2DKeys: Object.keys(window.PIXI?.live2d || {})
    };

    live2dGlobalsResult = result;
    console.log("[LIVE2D_GLOBALS]", result);
    setLive2DDebug(JSON.stringify(result, null, 2));
    return result;
}

function failLive2DTest(reason, error, debugLines) {
    const message = `Live2D Test: Failed - ${reason}`;
    setLive2DStatus(message, "error");
    setLive2DDebug([
        `status: failed`,
        `reason: ${reason}`,
        ...(debugLines || []),
        `error: ${error && error.message ? error.message : String(error || reason)}`,
        "",
        "globals:",
        JSON.stringify(live2dGlobalsResult, null, 2)
    ]);
    console.error("[LIVE2D_TEST] failed", error || reason);
}

function findLive2DModelCandidate() {
    const candidates = [
        {
            name: "window.PIXI.live2d.Live2DModel",
            value: window.PIXI?.live2d?.Live2DModel
        },
        {
            name: "window.PIXI.live2d.Cubism4Model",
            value: window.PIXI?.live2d?.Cubism4Model
        },
        {
            name: "window.Live2DModel",
            value: window.Live2DModel
        },
        {
            name: "window.PIXI.Live2DModel",
            value: window.PIXI?.Live2DModel
        }
    ];
    const debugLines = [];

    for (const candidate of candidates) {
        const exists = Boolean(candidate.value);
        const fromType = typeof candidate.value?.from;
        debugLines.push(`${candidate.name}: exists=${exists}, typeof from=${fromType}`);

        if (exists && fromType === "function") {
            return {
                candidate: candidate.value,
                candidateName: candidate.name,
                debugLines
            };
        }

        if (exists) {
            debugLines.push(`${candidate.name}: candidate found but from() missing`);
        }
    }

    return {
        candidate: null,
        candidateName: null,
        debugLines
    };
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function serializeBounds(bounds) {
    return {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        right: bounds.x + bounds.width,
        bottom: bounds.y + bounds.height
    };
}

function fitLive2DModelToRenderer(model, rendererWidth, rendererHeight) {
    const minScale = 0.05;
    const maxScale = 0.35;
    const targetHeight = rendererHeight * 0.82;
    const targetWidth = rendererWidth * 0.82;
    const originalWidth = model.width;
    const originalHeight = model.height;
    const scaleByHeight = targetHeight / originalHeight;
    const scaleByWidth = targetWidth / originalWidth;
    const appliedScale = clamp(Math.min(scaleByHeight, scaleByWidth), minScale, maxScale);

    model.scale.set(appliedScale);

    if (model.anchor) {
        model.anchor.set(0.5, 1);
    }

    model.x = rendererWidth / 2;
    model.y = rendererHeight * 0.92;

    let boundsAfterScale = model.getBounds();

    if (boundsAfterScale.x < 0) {
        model.x += -boundsAfterScale.x;
    }

    if (boundsAfterScale.x + boundsAfterScale.width > rendererWidth) {
        model.x -= boundsAfterScale.x + boundsAfterScale.width - rendererWidth;
    }

    boundsAfterScale = model.getBounds();

    if (boundsAfterScale.y < 0) {
        model.y += -boundsAfterScale.y;
    }

    if (boundsAfterScale.y + boundsAfterScale.height > rendererHeight) {
        model.y -= boundsAfterScale.y + boundsAfterScale.height - rendererHeight;
    }

    const finalBounds = model.getBounds();
    const visibleCheck = {
        fitsLeft: finalBounds.x >= 0,
        fitsTop: finalBounds.y >= 0,
        fitsRight: finalBounds.x + finalBounds.width <= rendererWidth,
        fitsBottom: finalBounds.y + finalBounds.height <= rendererHeight
    };

    return {
        rendererWidth,
        rendererHeight,
        originalWidth,
        originalHeight,
        targetHeight,
        targetWidth,
        scaleByHeight,
        scaleByWidth,
        appliedScale,
        modelX: model.x,
        modelY: model.y,
        modelScaleX: model.scale.x,
        modelScaleY: model.scale.y,
        boundsAfterScale: serializeBounds(finalBounds),
        visibleCheck,
        isFullyVisible: Object.values(visibleCheck).every(Boolean)
    };
}

async function initLive2DTest() {
    if (live2dTestStarted) {
        return;
    }

    live2dTestStarted = true;
    const modelPath = "/live2d-models/mao_pro/runtime/mao_pro.model3.json";

    try {
        setLive2DStatus("Live2D Test: checking libraries...");
        setLive2DDebug([
            "status: checking libraries",
            `modelPath: ${modelPath}`
        ]);

        if (!live2dCanvas || !live2dStage) {
            failLive2DTest("canvas missing", "canvas missing", [
                `live2dCanvas: ${Boolean(live2dCanvas)}`,
                `live2dStage: ${Boolean(live2dStage)}`
            ]);
            return;
        }

        const pixi = window.PIXI;
        if (!pixi) {
            failLive2DTest("PIXI missing", "PIXI missing");
            return;
        }

        const candidateResult = findLive2DModelCandidate();
        const Live2DModel = candidateResult.candidate;

        if (!Live2DModel) {
            failLive2DTest("Live2DModel missing", "Live2DModel missing", [
                `PIXI.live2d exists: ${Boolean(window.PIXI?.live2d)}`,
                `PIXI.live2d.Live2DModel exists: ${Boolean(window.PIXI?.live2d?.Live2DModel)}`,
                `PIXI.live2d.Cubism4Model exists: ${Boolean(window.PIXI?.live2d?.Cubism4Model)}`,
                `window.Live2DModel exists: ${Boolean(window.Live2DModel)}`,
                `PIXI.Live2DModel exists: ${Boolean(window.PIXI?.Live2DModel)}`,
                ...candidateResult.debugLines
            ]);
            return;
        }

        setLive2DDebug([
            "Live2DModel candidate found",
            `candidateName: ${candidateResult.candidateName}`,
            `typeof candidate.from: ${typeof Live2DModel.from}`,
            ...candidateResult.debugLines
        ]);

        setLive2DStatus("Live2D Test: checking model3.json...");
        setLive2DDebug([
            "status: checking model3.json",
            `modelPath: ${modelPath}`,
            "Live2DModel candidate found",
            `candidateName: ${candidateResult.candidateName}`,
            `typeof candidate.from: ${typeof Live2DModel.from}`
        ]);

        const modelResponse = await fetch(modelPath, { cache: "no-store" });
        if (!modelResponse.ok) {
            failLive2DTest("model3.json not reachable", `HTTP ${modelResponse.status}`, [
                `modelPath: ${modelPath}`,
                `httpStatus: ${modelResponse.status}`
            ]);
            return;
        }

        setLive2DStatus("Live2D Test: creating PIXI application...");
        setLive2DDebug([
            "status: creating PIXI application",
            `modelPath: ${modelPath}`,
            `model3.json httpStatus: ${modelResponse.status}`,
            `candidateName: ${candidateResult.candidateName}`,
            `typeof candidate.from: ${typeof Live2DModel.from}`
        ]);

        const app = new pixi.Application({
            view: live2dCanvas,
            resizeTo: live2dStage,
            backgroundAlpha: 0,
            antialias: true,
            autoDensity: true
        });

        setLive2DStatus("Live2D Test: loading model...");
        setLive2DDebug([
            "status: loading model",
            `modelPath: ${modelPath}`,
            `model3.json httpStatus: ${modelResponse.status}`,
            `candidateName: ${candidateResult.candidateName}`,
            `typeof candidate.from: ${typeof Live2DModel.from}`,
            `renderer width: ${app.renderer.width}`,
            `renderer height: ${app.renderer.height}`
        ]);

        const model = await Live2DModel.from(modelPath);
        app.stage.addChild(model);

        const debugInfo = fitLive2DModelToRenderer(model, app.renderer.width, app.renderer.height);

        console.log("[LIVE2D_TEST] fitted", debugInfo);
        console.log("[LIVE2D_TEST] loaded");

        setLive2DStatus("Live2D Test: OK", "ok");
        setLive2DDebug([
            "status: ok",
            `modelPath: ${modelPath}`,
            `model3.json httpStatus: ${modelResponse.status}`,
            `candidateName: ${candidateResult.candidateName}`,
            `typeof candidate.from: ${typeof Live2DModel.from}`,
            `renderer width: ${debugInfo.rendererWidth}`,
            `renderer height: ${debugInfo.rendererHeight}`,
            `model original width: ${debugInfo.originalWidth}`,
            `model original height: ${debugInfo.originalHeight}`,
            `targetHeight: ${debugInfo.targetHeight}`,
            `targetWidth: ${debugInfo.targetWidth}`,
            `scaleByHeight: ${debugInfo.scaleByHeight}`,
            `scaleByWidth: ${debugInfo.scaleByWidth}`,
            `appliedScale: ${debugInfo.appliedScale}`,
            `model x: ${debugInfo.modelX}`,
            `model y: ${debugInfo.modelY}`,
            `model scale x: ${debugInfo.modelScaleX}`,
            `model scale y: ${debugInfo.modelScaleY}`,
            "bounds after scale:",
            JSON.stringify(debugInfo.boundsAfterScale, null, 2),
            "visible check result:",
            JSON.stringify(debugInfo.visibleCheck, null, 2),
            `is fully visible: ${debugInfo.isFullyVisible}`
        ]);
    } catch (error) {
        failLive2DTest("model load error", error, [
            `modelPath: ${modelPath}`
        ]);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    diagnoseLive2DGlobals();
    initLive2DTest();
});
