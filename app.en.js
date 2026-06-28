const presets = {
  a3: { width: 297, height: 420, distance: "close" },
  a2: { width: 420, height: 594, distance: "poster" },
  a1: { width: 594, height: 841, distance: "poster" },
  "business-card": { width: 90, height: 54, distance: "close" },
  banner: { width: 3000, height: 900, distance: "far" },
};

// Decide the acceptable effective-DPI threshold based on the actual longest output edge (mm).
// Print-shop reality: normal output is always treated as 300 DPI; only large-format output relaxes this,
// because hitting 300 would make the file so big the computer chokes, and from a distance you don't need it anyway.
// Going above 300 won't look sharper, it just gives you room to scale up or down; for small sizes the threshold tops out at 300 too.
function getDpiTargets(widthMm, heightMm) {
  const longest = Math.max(Number(widthMm) || 1, Number(heightMm) || 1);
  if (longest <= 1000) return { green: 300, yellow: 250, tier: "standard" };
  if (longest <= 2000) return { green: 180, yellow: 120, tier: "large" };
  if (longest <= 5000) return { green: 120, yellow: 80, tier: "xlarge" };
  return { green: 80, yellow: 50, tier: "huge" };
}

const state = {
  fileName: "",
  image: null,
  bitmap: null,
  metrics: null,
  fixPlan: null,
  fixPlanSignature: "",
  activeFixIndex: 0,
  currentFix: null,
  guideTrigger: null,
};

const els = {
  dropZone: document.querySelector("#dropZone"),
  fileInput: document.querySelector("#fileInput"),
  pickFile: document.querySelector("#pickFile"),
  loadSample: document.querySelector("#loadSample"),
  previewImage: document.querySelector("#previewImage"),
  previewFrame: document.querySelector("#previewFrame"),
  printSim: document.querySelector("#printSim"),
  simActual: document.querySelector("#simActual"),
  simDivider: document.querySelector("#simDivider"),
  simSlider: document.querySelector("#simSlider"),
  simTagLeft: document.querySelector("#simTagLeft"),
  simTagRight: document.querySelector("#simTagRight"),
  simCaption: document.querySelector("#simCaption"),
  emptyState: document.querySelector("#emptyState"),
  preset: document.querySelector("#preset"),
  widthMm: document.querySelector("#widthMm"),
  heightMm: document.querySelector("#heightMm"),
  bleedMm: document.querySelector("#bleedMm"),
  isLogoAsset: document.querySelector("#isLogoAsset"),
  needsEditableLayers: document.querySelector("#needsEditableLayers"),
  analyzeButton: document.querySelector("#analyzeButton"),
  infoPixels: document.querySelector("#infoPixels"),
  infoTarget: document.querySelector("#infoTarget"),
  infoDpi: document.querySelector("#infoDpi"),
  infoUse: document.querySelector("#infoUse"),
  workflowSummary: document.querySelector("#workflowSummary"),
  workflowSteps: document.querySelector("#workflowSteps"),
  canvas: document.querySelector("#analysisCanvas"),
  scoreBand: document.querySelector("#scoreBand"),
  scoreLabel: document.querySelector("#scoreLabel"),
  scoreValue: document.querySelector("#scoreValue"),
  dpiMetric: document.querySelector("#dpiMetric"),
  dpiStatus: document.querySelector("#dpiStatus"),
  sharpMetric: document.querySelector("#sharpMetric"),
  sharpStatus: document.querySelector("#sharpStatus"),
  noiseMetric: document.querySelector("#noiseMetric"),
  noiseStatus: document.querySelector("#noiseStatus"),
  bleedMetric: document.querySelector("#bleedMetric"),
  bleedStatus: document.querySelector("#bleedStatus"),
  size300: document.querySelector("#size300"),
  size150: document.querySelector("#size150"),
  size72: document.querySelector("#size72"),
  adviceList: document.querySelector("#adviceList"),
  fixCard: document.querySelector("#fixCard"),
  fixTitle: document.querySelector("#fixTitle"),
  fixSummary: document.querySelector("#fixSummary"),
  fixSteps: document.querySelector("#fixSteps"),
  fixTabs: document.querySelector("#fixTabs"),
  fixStepLabel: document.querySelector("#fixStepLabel"),
  fixStepTitle: document.querySelector("#fixStepTitle"),
  fixStepSummary: document.querySelector("#fixStepSummary"),
  fixStepTrustNote: document.querySelector("#fixStepTrustNote"),
  fixStepList: document.querySelector("#fixStepList"),
  fixExtraGuides: document.querySelector("#fixExtraGuides"),
  fixLink: document.querySelector("#fixLink"),
  fixPrev: document.querySelector("#fixPrev"),
  fixNext: document.querySelector("#fixNext"),
  reuploadFixed: document.querySelector("#reuploadFixed"),
  openVectorModal: document.querySelector("#openVectorModal"),
  openVectorTutorial: document.querySelector("#openVectorTutorial"),
  vectorModal: document.querySelector("#vectorModal"),
  closeVectorModal: document.querySelector("#closeVectorModal"),
  vectorModalDone: document.querySelector("#vectorModalDone"),
  openVectorTutorialFromModal: document.querySelector("#openVectorTutorialFromModal"),
  guideModal: document.querySelector("#guideModal"),
  closeGuideModal: document.querySelector("#closeGuideModal"),
  guideModalDone: document.querySelector("#guideModalDone"),
  guideModalEyebrow: document.querySelector("#guideModalEyebrow"),
  guideModalTitle: document.querySelector("#guideModalTitle"),
  guideModalSummary: document.querySelector("#guideModalSummary"),
  guideModalContent: document.querySelector("#guideModalContent"),
  toolDialog: document.querySelector("#toolDialog"),
  dialogTitle: document.querySelector("#dialogTitle"),
  dialogSummary: document.querySelector("#dialogSummary"),
  dialogTrustNote: document.querySelector("#dialogTrustNote"),
  confirmOpenTool: document.querySelector("#confirmOpenTool"),
};

els.pickFile.addEventListener("click", () => els.fileInput.click());
els.loadSample.addEventListener("click", loadSampleImage);
els.reuploadFixed.addEventListener("click", () => els.fileInput.click());
els.fixLink.addEventListener("click", openToolDialog);
els.fixPrev.addEventListener("click", () => setActiveFix(state.activeFixIndex - 1));
els.fixNext.addEventListener("click", () => setActiveFix(state.activeFixIndex + 1));
els.openVectorModal.addEventListener("click", openVectorModal);
els.openVectorTutorial.addEventListener("click", openVectorTutorialGuide);
els.closeVectorModal.addEventListener("click", closeVectorModal);
els.vectorModalDone.addEventListener("click", closeVectorModal);
els.openVectorTutorialFromModal.addEventListener("click", openVectorTutorialGuide);
els.vectorModal.addEventListener("click", (event) => {
  if (event.target === els.vectorModal) closeVectorModal();
});
els.closeGuideModal.addEventListener("click", closeGuideModal);
els.guideModalDone.addEventListener("click", closeGuideModal);
els.guideModal.addEventListener("click", (event) => {
  if (event.target === els.guideModal) closeGuideModal();
});
els.confirmOpenTool.addEventListener("click", confirmOpenTool);
els.fileInput.addEventListener("change", (event) => loadFile(event.target.files[0]));
els.analyzeButton.addEventListener("click", analyze);
els.simSlider.addEventListener("input", (event) => setSimSlider(Number(event.target.value)));
window.addEventListener("resize", () => {
  if (state.metrics) renderPrintSim(state.metrics);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !els.guideModal.hidden) {
    closeGuideModal();
    return;
  }

  if (event.key === "Escape" && !els.vectorModal.hidden) {
    closeVectorModal();
  }
});

["dragenter", "dragover"].forEach((type) => {
  els.dropZone.addEventListener(type, (event) => {
    event.preventDefault();
    els.dropZone.classList.add("dragging");
  });
});

["dragleave", "drop"].forEach((type) => {
  els.dropZone.addEventListener(type, (event) => {
    event.preventDefault();
    els.dropZone.classList.remove("dragging");
  });
});

els.dropZone.addEventListener("drop", (event) => {
  loadFile(event.dataTransfer.files[0]);
});

els.preset.addEventListener("change", () => {
  if (els.preset.value !== "custom") {
    const preset = presets[els.preset.value];
    els.widthMm.value = preset.width;
    els.heightMm.value = preset.height;
  }
  analyze();
});

[els.widthMm, els.heightMm, els.bleedMm, els.isLogoAsset, els.needsEditableLayers].forEach((el) => {
  el.addEventListener("input", () => {
    els.preset.value = "custom";
    analyze();
  });
});

async function loadFile(file) {
  if (!file) return;

  if (!isSupportedRasterFile(file)) {
    resetForUnsupportedFile(file);
    return;
  }

  state.fileName = file.name;
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.onload = async () => {
    state.image = image;
    state.bitmap = await createImageBitmap(file);
    els.previewImage.src = url;
    els.previewImage.style.display = "block";
    els.emptyState.style.display = "none";
    els.simSlider.value = 50; // Every time a new image loads, the divider line goes back to the center
    els.analyzeButton.disabled = false;
    els.reuploadFixed.disabled = false;
    analyze();
  };
  image.src = url;
}

function isSupportedRasterFile(file) {
  return /^(image\/png|image\/jpeg|image\/webp)$/i.test(file.type) || /\.(png|jpe?g|webp)$/i.test(file.name || "");
}

function resetForUnsupportedFile(file) {
  state.fileName = file.name || "";
  state.image = null;
  state.bitmap = null;
  state.metrics = null;
  state.fixPlan = null;
  state.fixPlanSignature = "";
  state.activeFixIndex = 0;
  state.currentFix = null;

  els.previewImage.removeAttribute("src");
  hidePrintSim();
  els.emptyState.textContent = "Only PNG, JPG and WebP are supported right now. For SVG / PDF / AI files, check them in Inkscape, Illustrator, or with your print shop; to bring them back into this tool, save them as PNG, JPG or WebP first.";
  els.analyzeButton.disabled = true;
  els.reuploadFixed.disabled = true;

  els.scoreBand.className = "score-band";
  els.scoreLabel.textContent = "Format not supported";
  els.scoreValue.textContent = "--";
  setMetric(els.dpiMetric, els.dpiStatus, "--", { level: "", label: "Waiting for image" });
  setMetric(els.sharpMetric, els.sharpStatus, "--", { level: "", label: "Waiting for image" });
  setMetric(els.noiseMetric, els.noiseStatus, "--", { level: "", label: "Waiting for image" });
  setMetric(els.bleedMetric, els.bleedStatus, "--", { level: "", label: "Waiting for image" });
  els.infoPixels.textContent = "--";
  els.infoTarget.textContent = "--";
  els.infoDpi.textContent = "--";
  els.infoUse.textContent = "--";
  els.workflowSummary.textContent = "SVG / PDF / AI are vector or delivery files. Open them in a professional editor to zoom in and check, or export a raster image first and then bring that back into this tool to check the effective DPI.";
  els.workflowSteps.innerHTML = "<li>To check print resolution, export a PNG, JPG or WebP from your vector tool.</li><li>To hand off to a shop, use PDF, AI, TIFF, PNG, or whatever format the shop asks for.</li>";
  els.adviceList.innerHTML = "<li>This tool no longer scores SVG files, to avoid giving a number that doesn't really mean anything.</li>";
  els.fixTitle.textContent = "This format isn't supported";
  els.fixSummary.textContent = "Switch to PNG, JPG or WebP for the pre-print check.";
  els.fixSteps.innerHTML = "<li>For SVG / PDF / AI, go back to your vector software, or let the shop do the delivery check.</li>";
  els.fixTabs.innerHTML = "";
  els.fixStepLabel.textContent = "Format";
  els.fixStepTitle.textContent = "This format isn't supported";
  els.fixStepSummary.textContent = "These files are better confirmed in Inkscape, Illustrator, Acrobat, or your print shop's workflow.";
  els.fixStepTrustNote.textContent = "This tool focuses on checking the effective DPI, sharpness, noise and bleed of AI-generated raster images.";
  els.fixStepList.innerHTML = "<li>To bring it back into this tool to check resolution, save it as PNG, JPG or WebP first.</li><li>If it's already a final delivery file, let the print shop confirm the PDF/AI/TIFF/PNG format requirements.</li>";
  els.fixExtraGuides.innerHTML = "";
  els.fixLink.disabled = true;
  els.fixPrev.disabled = true;
  els.fixNext.disabled = true;
}

function loadSampleImage() {
  const canvas = document.createElement("canvas");
  canvas.width = 2200;
  canvas.height = 3200;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#1f8f7c");
  gradient.addColorStop(0.42, "#f4d35e");
  gradient.addColorStop(1, "#d83f87");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
  ctx.beginPath();
  ctx.arc(1100, 1320, 610, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#173b47";
  ctx.lineWidth = 28;
  ctx.beginPath();
  ctx.moveTo(570, 1390);
  ctx.bezierCurveTo(820, 820, 1400, 820, 1630, 1390);
  ctx.stroke();

  ctx.fillStyle = "#173b47";
  ctx.font = "700 190px Segoe UI, Arial";
  ctx.textAlign = "center";
  ctx.fillText("AI PRINT", 1100, 2360);
  ctx.font = "500 78px Segoe UI, Arial";
  ctx.fillText("RGB vivid sample", 1100, 2490);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const file = new File([blob], "sample-ai-print.png", { type: "image/png" });
    loadFile(file);
  }, "image/png");
}

function analyze() {
  if (!state.image) return;

  const print = getPrintSettings();
  const dpi = calculateDpi(state.image.naturalWidth, state.image.naturalHeight, print.widthMm, print.heightMm);
  const sampled = sampleImage(state.bitmap || state.image);
  const sharpness = estimateSharpness(sampled);
  const noise = estimateNoise(sampled);
  const bleedScore = print.bleedMm >= 3 ? 10 : print.bleedMm > 0 ? 7 : 3;

  const dpiScore = scoreDpi(dpi.effective, print.dpiTargets);
  const sharpScore = scoreSharpness(sharpness);
  const noiseScore = scoreNoise(noise);
  const rawTotal = clamp(Math.round(dpiScore + sharpScore + noiseScore + bleedScore), 0, 100);
  const total = normalizeTotal(rawTotal, { dpi, print, sharpness, noise });

  state.metrics = {
    fileName: state.fileName,
    pixelWidth: state.image.naturalWidth,
    pixelHeight: state.image.naturalHeight,
    print,
    dpi,
    sharpness,
    noise,
    scores: { total, dpiScore, sharpScore, noiseScore, bleedScore },
  };

  renderMetrics(state.metrics);
}

function getPrintSettings() {
  const widthMm = Number(els.widthMm.value) || 1;
  const heightMm = Number(els.heightMm.value) || 1;
  return {
    widthMm,
    heightMm,
    dpiTargets: getDpiTargets(widthMm, heightMm),
    bleedMm: Number(els.bleedMm.value) || 0,
    isLogoAsset: els.isLogoAsset.checked,
    needsEditableLayers: els.needsEditableLayers.checked,
  };
}

function calculateDpi(pixelWidth, pixelHeight, widthMm, heightMm) {
  const widthIn = widthMm / 25.4;
  const heightIn = heightMm / 25.4;
  const dpiX = pixelWidth / widthIn;
  const dpiY = pixelHeight / heightIn;
  return { x: dpiX, y: dpiY, effective: Math.min(dpiX, dpiY) };
}

function sampleImage(source) {
  const maxSide = 420;
  const width = source.width || source.naturalWidth;
  const height = source.height || source.naturalHeight;
  const scale = Math.min(1, maxSide / Math.max(width, height));
  const sampleWidth = Math.max(1, Math.round(width * scale));
  const sampleHeight = Math.max(1, Math.round(height * scale));
  const ctx = els.canvas.getContext("2d", { willReadFrequently: true });
  els.canvas.width = sampleWidth;
  els.canvas.height = sampleHeight;
  ctx.drawImage(source, 0, 0, sampleWidth, sampleHeight);
  const data = ctx.getImageData(0, 0, sampleWidth, sampleHeight).data;
  return { data, width: sampleWidth, height: sampleHeight };
}

function estimateSharpness(sample) {
  const { data, width, height } = sample;
  let sum = 0;
  let count = 0;
  for (let y = 1; y < height - 1; y += 2) {
    for (let x = 1; x < width - 1; x += 2) {
      const center = gray(data, width, x, y);
      const laplace =
        -4 * center +
        gray(data, width, x - 1, y) +
        gray(data, width, x + 1, y) +
        gray(data, width, x, y - 1) +
        gray(data, width, x, y + 1);
      sum += Math.abs(laplace);
      count++;
    }
  }
  return count ? sum / count : 0;
}

function estimateNoise(sample) {
  const { data, width, height } = sample;
  let localContrast = 0;
  let highFreq = 0;
  let count = 0;
  for (let y = 1; y < height - 1; y += 3) {
    for (let x = 1; x < width - 1; x += 3) {
      const c = gray(data, width, x, y);
      const avg =
        (gray(data, width, x - 1, y) +
          gray(data, width, x + 1, y) +
          gray(data, width, x, y - 1) +
          gray(data, width, x, y + 1)) /
        4;
      const diff = Math.abs(c - avg);
      localContrast += diff;
      if (diff > 34) highFreq++;
      count++;
    }
  }
  return {
    average: count ? localContrast / count : 0,
    speckleRatio: count ? highFreq / count : 0,
  };
}

function gray(data, width, x, y) {
  const index = (y * width + x) * 4;
  return data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
}

function scoreDpi(dpi, target) {
  if (dpi >= target.green) return 40;
  if (dpi >= target.yellow) return 28 + ((dpi - target.yellow) / (target.green - target.yellow)) * 12;
  return clamp((dpi / target.yellow) * 28, 0, 28);
}

function scoreSharpness(sharpness) {
  if (sharpness >= 10) return 20;
  if (sharpness >= 5) return 12 + ((sharpness - 5) / 5) * 8;
  return clamp((sharpness / 5) * 12, 0, 12);
}

function scoreNoise(noise) {
  const penalty = noise.speckleRatio * 80 + Math.max(0, noise.average - 16) * 0.7;
  return clamp(10 - penalty, 2, 10);
}

function normalizeTotal(rawTotal, data) {
  const levels = [
    statusForDpi(data.dpi.effective, data.print.dpiTargets).level,
    statusForSharpness(data.sharpness).level,
    statusForNoise(data.noise).level,
    statusForBleed(data.print.bleedMm).level,
  ];

  if (levels.every((level) => level === "green")) {
    return Math.max(rawTotal, 88);
  }

  if (levels.some((level) => level === "red")) {
    return Math.min(rawTotal, 69);
  }

  return clamp(rawTotal, 70, 84);
}

function renderMetrics(metrics) {
  const { total } = metrics.scores;
  const band = total >= 85 ? "green" : total >= 70 ? "yellow" : "red";
  const label = total >= 85 ? "Green: ready for pre-print steps" : total >= 70 ? "Yellow: fix before printing" : "Red: not ready to print";
  els.scoreBand.className = `score-band ${band}`;
  els.scoreLabel.textContent = label;
  els.scoreValue.textContent = total;

  setMetric(els.dpiMetric, els.dpiStatus, `${Math.round(metrics.dpi.effective)} DPI`, statusForDpi(metrics.dpi.effective, metrics.print.dpiTargets));
  setMetric(els.sharpMetric, els.sharpStatus, sharpnessWord(metrics.sharpness), statusForSharpness(metrics.sharpness));
  setMetric(els.noiseMetric, els.noiseStatus, noiseWord(metrics.noise), statusForNoise(metrics.noise));
  setMetric(els.bleedMetric, els.bleedStatus, `${metrics.print.bleedMm} mm`, statusForBleed(metrics.print.bleedMm));
  renderImageInfo(metrics);
  renderPrintSim(metrics);
  renderPrintableSizes(metrics);
  renderWorkflowOrder(metrics);

  renderAdvice(metrics);
  renderFixRecommendation(metrics);
}

function renderWorkflowOrder(metrics) {
  const workflow = chooseWorkflow(metrics);
  els.workflowSummary.textContent = workflow.summary;
  els.workflowSteps.innerHTML = workflow.steps.map((step) => `<li>${step}</li>`).join("");
}

function chooseWorkflow(metrics) {
  if (metrics.print.needsEditableLayers && metrics.print.isLogoAsset) {
    return {
      summary: "If a logo / icon also needs object edits, handle the layout and layers first, then come back to check resolution; only vectorize for very large output, recoloring or splitting objects, or when the shop asks.",
      steps: [
        "First confirm the output size, orientation, proportions, margins and bleed.",
        "If you need to rearrange objects or change the layout, do it first with Canva Magic layers or Photopea / Illustrator.",
        "Come back to this tool to check the effective DPI; if it's too low, upscale with Upscayl first — this is the simplest route for most print jobs.",
        "Only consider Inkscape Trace Bitmap when you need very large sizes, long-term repeated use, recoloring or splitting objects, or the shop asks for a vector file.",
        "Finally, zoom to 100% and check edges, shadows and fine details.",
      ],
    };
  }

  if (metrics.print.needsEditableLayers) {
    return {
      summary: "When you need to split layers, do the things that change the layout first, then upscale; that keeps the file smaller and easier for Canva / Photopea to handle.",
      steps: [
        "First confirm the output size, orientation, proportions, margins and whether you need bleed.",
        "Use Canva Magic layers to roughly split out the objects.",
        "First tidy up the layers, rearrange the text, and adjust the objects and layout.",
        "Export a high-resolution PNG or PDF.",
        "Come back to this tool and re-check the effective DPI; if it's too low, upscale with Upscayl.",
        "Finally do a light denoise / sharpen, then zoom to 100% to check the details.",
      ],
    };
  }

  if (metrics.print.isLogoAsset) {
    return {
      summary: "For logos / icons / badges, go the high-resolution PNG/PDF route first; vectorizing is an advanced option, not a must for printing.",
      steps: [
        "First use this tool to confirm the effective DPI, bleed and color risks.",
        "If the DPI is too low, upscale with Upscayl first — usually faster than forcing a vector conversion.",
        "After upscaling, check that the edges, sharp corners and color blocks are clean.",
        "Only use Inkscape Trace Bitmap when you need very large output, long-term repeated use, recoloring or splitting objects, or the shop asks for a vector file.",
        "If the vectorized result gets dirty or needs a lot of node editing, go back to the high-resolution PNG/PDF route.",
        "Finally, confirm CMYK, PDF/X and bleed according to your print shop's specs.",
      ],
    };
  }

  return {
    summary: "For a typical AI poster or character image, handle the layout first, then upscale; do the print-output check last.",
    steps: [
      "First decide the output size, orientation and proportions, and confirm whether you need cropping, a background fill, or bleed.",
      "Do the things that change the layout first, such as cropping, filling in the background, or rearranging text or objects.",
      "Come back to this tool to check the effective DPI; if it's too low, upscale with Upscayl.",
      "After upscaling, do a light denoise and sharpen, so you don't finish your fixes and then have them ruined by upscaling.",
      "Zoom to 100% and check faces, edges, shadows and details.",
      "Finally, handle CMYK, PDF/X or other delivery formats according to your print shop's specs.",
    ],
  };
}

// Turn the center preview image into an "after-printing sharpness" comparison:
// left = the sharpness this size should have (the threshold DPI), right = your file's actual detail.
// The amount of blur is based on "the threshold for this size" (which already includes viewing distance), so a large image at low DPI isn't wrongly judged as very blurry.
function renderPrintSim(metrics) {
  const src = state.image;
  if (!src) return;

  const availW = Math.max(1, els.previewFrame.clientWidth - 4);
  const availH = Math.min(540, Math.round(window.innerHeight * 0.62)) || 540;
  const natW = src.naturalWidth;
  const natH = src.naturalHeight;
  const scale = Math.min(availW / natW, availH / natH);
  const dispW = Math.max(1, Math.round(natW * scale));
  const dispH = Math.max(1, Math.round(natH * scale));
  els.printSim.style.width = `${dispW}px`;
  els.printSim.style.height = `${dispH}px`;

  const target = metrics.print.dpiTargets.green;
  const ratio = clamp(metrics.dpi.effective / target, 0, 1);

  // The "your file's actual detail" layer uses the same <img>, applying a matching CSS blur based on how much resolution is missing (illustrative).
  // We no longer redraw a large image onto canvas, to avoid a huge image looking worse after downscaling than the left <img>.
  // When DPI is enough, blur = 0, so both layers are pixel-identical and you won't get a "looks blurrier even though it's fine" result.
  els.simActual.src = els.previewImage.src;
  const blurPx = ratio >= 0.999 ? 0 : clamp((1 - ratio) * dispW * 0.02, 0.4, 16);
  els.simActual.style.filter = blurPx ? `blur(${blurPx}px)` : "none";

  setSimSlider(Number(els.simSlider.value));
  renderSimCaption(metrics, ratio);
  els.printSim.hidden = false;
  els.simCaption.hidden = false;
  els.emptyState.style.display = "none";
}

function setSimSlider(value) {
  const val = clamp(value, 0, 100);
  els.previewImage.style.clipPath = `inset(0 ${100 - val}% 0 0)`;
  els.simDivider.style.left = `${val}%`;
  // Whichever half gets bigger, that side's label is clear; the shrinking half fades out and disappears at the very end (this replaces the instructions).
  els.simTagLeft.style.opacity = clamp((val / 100) * 1.6, 0, 1);
  els.simTagRight.style.opacity = clamp(((100 - val) / 100) * 1.6, 0, 1);
}

function renderSimCaption(metrics, ratio) {
  const eff = Math.round(metrics.dpi.effective);
  const target = metrics.print.dpiTargets.green;
  if (ratio >= 0.999) {
    els.simCaption.textContent = `Your image is ${eff} DPI, which already meets the ${target} DPI this size needs — the print will look almost the same as on screen, no blur.`;
  } else {
    const pct = Math.round(ratio * 100);
    els.simCaption.textContent = `Your image is ${eff} DPI, but this size really wants ${target} DPI — the print will be a bit softer than on screen, with only about ${pct}% of the detail left (illustrative only; the print shop has the final say).`;
  }
}

function hidePrintSim() {
  els.printSim.hidden = true;
  els.simCaption.hidden = true;
  els.emptyState.style.display = "block";
}

function renderImageInfo(metrics) {
  els.infoPixels.textContent = `${metrics.pixelWidth} x ${metrics.pixelHeight} px`;
  els.infoTarget.textContent = `${metrics.print.widthMm} x ${metrics.print.heightMm} mm`;
  els.infoDpi.textContent = `${Math.round(metrics.dpi.effective)} DPI`;
  els.infoUse.textContent = getUseLabel();
}

function getUseLabel() {
  const selected = els.preset.options[els.preset.selectedIndex];
  return selected ? selected.textContent : "Custom size";
}

function renderPrintableSizes(metrics) {
  els.size300.textContent = formatPrintSize(metrics.pixelWidth, metrics.pixelHeight, 300);
  els.size150.textContent = formatPrintSize(metrics.pixelWidth, metrics.pixelHeight, 150);
  els.size72.textContent = formatPrintSize(metrics.pixelWidth, metrics.pixelHeight, 72);
}

function formatPrintSize(pixelWidth, pixelHeight, dpi) {
  const widthCm = (pixelWidth / dpi) * 2.54;
  const heightCm = (pixelHeight / dpi) * 2.54;
  return `${widthCm.toFixed(1)} x ${heightCm.toFixed(1)} cm`;
}

function setMetric(valueEl, statusEl, value, status) {
  valueEl.textContent = value;
  statusEl.textContent = status.label;
  statusEl.className = status.level;
}

function statusForDpi(dpi, target) {
  if (dpi >= target.green) return { level: "green", label: "Enough" };
  if (dpi >= target.yellow) return { level: "yellow", label: "Borderline" };
  return { level: "red", label: "Too low" };
}

function statusForSharpness(sharpness) {
  if (sharpness >= 10) return { level: "green", label: "Good to go" };
  if (sharpness >= 5) return { level: "yellow", label: "Check closely" };
  return { level: "red", label: "Sharpen it" };
}

// Big label: a plain-language take on whether the source itself is sharp (separate from resolution — even at enough DPI, an image that was shot or drawn blurry still looks soft)
function sharpnessWord(sharpness) {
  if (sharpness >= 10) return "Sharp";
  if (sharpness >= 5) return "A bit soft";
  return "Soft/blurry";
}

function statusForNoise(noise) {
  if (noise.speckleRatio < 0.08) return { level: "green", label: "Good to go" };
  if (noise.speckleRatio < 0.18) return { level: "yellow", label: "Light denoise" };
  return { level: "red", label: "Denoise it" };
}

// Big label: a plain-language take on how much "AI noise / JPEG compression specks" there is (you can't see it in the comparison image, so it's judged separately)
function noiseWord(noise) {
  if (noise.speckleRatio < 0.08) return "Clean";
  if (noise.speckleRatio < 0.18) return "Some noise";
  return "Noisy";
}

function statusForBleed(bleed) {
  if (bleed >= 3) return { level: "green", label: "Standard" };
  if (bleed > 0) return { level: "yellow", label: "A bit short" };
  return { level: "red", label: "No bleed" };
}

function renderAdvice(metrics) {
  const advice = [];
  const dpiStatus = statusForDpi(metrics.dpi.effective, metrics.print.dpiTargets);
  const sharpStatus = statusForSharpness(metrics.sharpness);
  const bleedStatus = statusForBleed(metrics.print.bleedMm);

  const dpiTargets = metrics.print.dpiTargets;
  if (dpiStatus.level === "red") {
    advice.push("The effective DPI is too low. This is estimated from the output size; upscale with super-resolution first, or reduce the output size.");
  } else if (dpiStatus.level === "yellow") {
    advice.push("The effective DPI is right at the edge of acceptable; zoom to 100% yourself and check faces, text and edge details.");
  } else if (metrics.dpi.effective > dpiTargets.green * 1.5) {
    advice.push(`The effective DPI is already far above what this size needs (this size only needs about ${dpiTargets.green} DPI). The extra resolution won't make the print sharper — it just gives you room to scale up or down — so there's no need to chase higher; for example, taking a small image up to 1000 DPI doesn't help.`);
  } else {
    advice.push("At the current output size, the effective DPI meets the threshold for this use.");
  }

  if (sharpStatus.level !== "green") {
    advice.push("There's still room to improve the sharpness; if it includes character faces, logo edges or important details, zoom in locally to check, and apply a light sharpen if needed.");
  }

  const noiseStatus = statusForNoise(metrics.noise);
  if (noiseStatus.level === "yellow") {
    advice.push("Compression/noise is acceptable but could still be improved; do a light denoise before output. If Photopea's Reduce Noise does nothing, try Surface Blur or Median instead.");
  } else if (noiseStatus.level === "red") {
    advice.push("Compression/noise is on the high side; denoise first, or use a cleaner source image. If Photopea's Reduce Noise does nothing, first make sure the layer is rasterized.");
  }

  advice.push("This tool doesn't judge color: screens are RGB and prints usually shift a little (bright blue, bright green and neon colors are the most obvious), so the print shop has the final say on actual color.");

  if (bleedStatus.level !== "green") {
    advice.push("The bleed isn't enough; for common posters, stickers and business cards, at least 3 mm is recommended.");
  } else {
    advice.push("The bleed value meets the common standard, but this only checks the bleed value you entered — you still need to make sure the background extends past the bleed line.");
  }

  if (metrics.print.isLogoAsset) {
    advice.push("This image is marked as a logo / icon / badge asset; for most print jobs a high-resolution PNG/PDF is enough. Only consider vectorizing for very large output, long-term repeated use, recoloring or splitting objects, or when the shop asks.");
  }

  if (metrics.print.needsEditableLayers) {
    advice.push("This image is marked as needing editable layers; you could use Canva Magic layers for a rough split, but the result still needs manual review and tidying.");
  }

  if (dpiStatus.level === "green" && bleedStatus.level === "green" && sharpStatus.level === "green" && noiseStatus.level === "green") {
    advice.push("All the main metrics are green; zoom to 100% and check shadows, edges and details — if it's fine, it's ready to print.");
  }

  els.adviceList.innerHTML = advice.map((item) => `<li>${item}</li>`).join("");
}

function renderFixRecommendation(metrics) {
  const plan = chooseFixPlan(metrics);
  const fixes = plan.fixes || [];
  const signature = fixes.map((fix) => fix.title).join("|");
  const planChanged = signature !== state.fixPlanSignature;

  state.fixPlan = plan;
  state.fixPlanSignature = signature;
  els.fixTitle.textContent = plan.title;
  els.fixSummary.textContent = plan.summary;
  els.fixSteps.innerHTML = plan.steps.map((step) => `<li>${step}</li>`).join("");

  const nextIndex = planChanged ? 0 : state.activeFixIndex;
  setActiveFix(nextIndex);
}

function setActiveFix(index) {
  if (!state.fixPlan) return;
  const fixes = state.fixPlan.fixes || [];
  state.activeFixIndex = clamp(index, 0, Math.max(fixes.length - 1, 0));
  renderFixTabs(fixes);
  renderActiveFix(fixes);
}

function renderFixTabs(fixes) {
  if (!fixes.length) {
    els.fixTabs.innerHTML = "";
    return;
  }

  els.fixTabs.innerHTML = fixes
    .map((fix, index) => {
      const selected = index === state.activeFixIndex ? "true" : "false";
      return `<button class="fix-tab" type="button" role="tab" aria-selected="${selected}" data-fix-index="${index}">Step ${index + 1}: ${shortFixTitle(fix.title)}</button>`;
    })
    .join("");

  els.fixTabs.querySelectorAll(".fix-tab").forEach((button) => {
    button.addEventListener("click", () => setActiveFix(Number(button.dataset.fixIndex)));
  });
}

function renderActiveFix(fixes) {
  const fix = fixes[state.activeFixIndex] || null;
  state.currentFix = fix;

  if (!fix) {
    els.fixStepLabel.textContent = "Step 1";
    els.fixStepTitle.textContent = "Waiting for analysis";
    els.fixStepSummary.textContent = "After you upload an image, the full walkthrough for each single step will show up here.";
    els.fixStepTrustNote.textContent = "Tool notes will appear here.";
    els.fixStepTrustNote.style.display = "block";
    els.fixStepList.innerHTML = "<li>Upload an AI image first.</li>";
    renderExtraGuides([]);
    els.fixLink.textContent = "View tool";
    els.fixLink.disabled = true;
    els.fixPrev.disabled = true;
    els.fixNext.disabled = true;
    return;
  }

  const stepNumber = state.activeFixIndex + 1;
  els.fixStepLabel.textContent = `Step ${stepNumber} of ${fixes.length}`;
  els.fixStepTitle.textContent = fix.title;
  els.fixStepSummary.textContent = fix.summary;
  els.fixStepTrustNote.textContent = formatTrustNote(fix.trustNote, fix.versionHint);
  els.fixStepTrustNote.style.display = fix.trustNote ? "block" : "none";
  els.fixStepList.innerHTML = fix.steps.map((step) => `<li>${step}</li>`).join("");
  renderExtraGuides(fix.extraGuides || []);
  els.fixLink.textContent = fix.url ? `View: ${fix.linkText}` : "No tool needed right now";
  els.fixLink.disabled = !fix.url;

  const previousFix = fixes[state.activeFixIndex - 1];
  const nextFix = fixes[state.activeFixIndex + 1];
  els.fixPrev.textContent = previousFix ? `Previous: ${shortFixTitle(previousFix.title)}` : "Previous";
  els.fixNext.textContent = nextFix ? `Next: ${shortFixTitle(nextFix.title)}` : "Next";
  els.fixPrev.disabled = !previousFix;
  els.fixNext.disabled = !nextFix;
}

function formatTrustNote(note, versionHint = true) {
  if (!note) return "";
  if (!versionHint) return note;
  return `${note} Menu names may differ slightly across versions or interface languages; if you can't find an option, take a screenshot and ask ChatGPT or Gemini, or check it against the official docs.`;
}

function shortFixTitle(title) {
  return title.split("：")[0].trim();
}

function renderExtraGuides(guides) {
  if (!guides.length) {
    els.fixExtraGuides.innerHTML = "";
    els.fixExtraGuides.hidden = true;
    return;
  }

  els.fixExtraGuides.hidden = false;
  els.fixExtraGuides.innerHTML = [
    "<p>Pick one in-depth setup based on your image type:</p>",
    '<div class="guide-chip-list">',
    ...guides.map((guide, index) => `<button class="guide-chip" type="button" data-guide-index="${index}">${guide.label}</button>`),
    "</div>",
  ].join("");

  els.fixExtraGuides.querySelectorAll(".guide-chip").forEach((button) => {
    button.addEventListener("click", () => openGuideModal(guides[Number(button.dataset.guideIndex)], button));
  });
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function openToolDialog() {
  const fix = state.currentFix;
  if (!fix || !fix.url) return;
  els.dialogTitle.textContent = fix.title;
  els.dialogSummary.textContent = fix.summary;
  els.dialogTrustNote.textContent = formatTrustNote(fix.trustNote, fix.versionHint);
  if (typeof els.toolDialog.showModal === "function") {
    els.toolDialog.showModal();
  } else {
    confirmOpenTool();
  }
}

function openVectorModal() {
  els.vectorModal.hidden = false;
  document.body.classList.add("modal-open");
  els.vectorModalDone.focus();
}

function openVectorTutorialGuide(event) {
  const trigger = event && event.currentTarget === els.openVectorTutorialFromModal ? els.openVectorTutorial : event?.currentTarget || els.openVectorTutorial;
  if (!els.vectorModal.hidden) {
    els.vectorModal.hidden = true;
  }
  openGuideModal(vectorTutorialGuide(), trigger);
}

function closeVectorModal() {
  els.vectorModal.hidden = true;
  document.body.classList.remove("modal-open");
  els.openVectorModal.focus();
}

function openGuideModal(guide, trigger) {
  if (!guide) return;
  state.guideTrigger = trigger || null;
  els.guideModalEyebrow.textContent = guide.eyebrow || "Guide";
  els.guideModalTitle.textContent = guide.title;
  els.guideModalSummary.textContent = guide.summary || "";
  const versionNote = guide.versionHint === false ? "" : '<p class="guide-version-note">Menu names may differ slightly across versions or interface languages; if you can\'t find an option, take a screenshot and ask ChatGPT or Gemini, or check it against the official docs.</p>';
  els.guideModalContent.innerHTML = versionNote + guide.sections
    .map((section) => {
      const items = section.items.map((item) => `<li>${item}</li>`).join("");
      return `<section><h3>${section.title}</h3><ul>${items}</ul></section>`;
    })
    .join("");
  els.guideModal.hidden = false;
  document.body.classList.add("modal-open");
  els.guideModalDone.focus();
}

function closeGuideModal() {
  els.guideModal.hidden = true;
  document.body.classList.remove("modal-open");
  if (state.guideTrigger) {
    state.guideTrigger.focus();
    state.guideTrigger = null;
  }
}

function vectorTutorialGuide() {
  return {
    eyebrow: "Advanced SVG",
    title: "I want to vectorize: Inkscape SVG tutorial",
    summary: "This is an advanced tutorial and won't go into this tool's scoring. It's for people who genuinely need an SVG / PDF vector delivery, very large output, recoloring or splitting objects, or long-term repeated use.",
    sections: [
      {
        title: "First decide whether it's worth it",
        items: [
          "Good fit: logos, icons, badges, single-color silhouettes, and symbols with clear edges and simple color blocks.",
          "Bad fit: heavily painted character art, photos, smoke, lighting, lots of gradients, or AI illustrations with lots of fine texture.",
          "For a normal poster, sticker or canvas print, upscaling to a high-resolution PNG/PDF with Upscayl is usually faster than vectorizing.",
          "If after converting the edges get dirty, sharp corners get rounded off, or the file is very heavy, go back to the high-resolution PNG/PDF route instead of forcing it.",
        ],
      },
      {
        title: "Download and open the image",
        items: [
          'Go to the <a href="https://inkscape.org/release/inkscape-1.4.4/" target="_blank" rel="noopener noreferrer">official Inkscape 1.4.4 download page</a>.',
          "Windows users click Windows > 64-bit > Windows Installer Package / msi in order.",
          "MSI is a Windows installer format, not an MSI graphics card; just follow the normal install steps and click Next.",
          "After opening Inkscape, click \"Open other file...\" or use \"File > Open\" to import the image.",
          "When you see the JPEG/PNG import settings, you can usually keep the defaults and click OK.",
        ],
      },
      {
        title: "Trace starting settings",
        items: [
          "With the image selected, open \"Path > Trace Bitmap\".",
          "Black-and-white logo / single-color icon: use \"Single Scan\" with \"Brightness cutoff\", and start the threshold at 0.55.",
          "Color badge / multi-color icon: use \"Multiple Scans\" with \"Colors\", and start with 4 to 8 colors.",
          "When the background is white or a checkerboard, try \"Remove background\"; if it doesn't work well, ungroup after tracing and delete it by hand.",
          "When the preview looks clean, click \"Apply\"; if the preview already looks dirty, it usually means it's not a good fit for forcing a conversion.",
        ],
      },
      {
        title: "Clean up and export",
        items: [
          "After applying, drag the vector aside and check whether the original JPG, checkerboard background or watermark is still underneath.",
          "If the background and the main subject are grouped together, use \"Object > Ungroup\" first, then delete the extra objects.",
          "Zoom in to check sharp corners, thin lines, holes, color regions and any leftover watermark.",
          "Use \"File > Save As\" to save as SVG; to hand off to a print shop, you can save as PDF, or ask the shop to convert to AI/PDF for you.",
          "A converted SVG doesn't need this tool's scoring; check it by zooming in within Inkscape / Illustrator, or let the print shop confirm the delivery format and output specs.",
        ],
      },
    ],
  };
}

function confirmOpenTool() {
  const fix = state.currentFix;
  if (!fix || !fix.url) return;
  window.open(fix.url, "_blank", "noopener,noreferrer");
  if (els.toolDialog.open) {
    els.toolDialog.close();
  }
}

function getNoisePreset(noise) {
  if (noise.speckleRatio < 0.1) {
    return {
      label: "light",
      strength: 4,
      protectDetail: 45,
      colorNoise: 10,
      note: "The noise is currently acceptable, so use a light setting; the priority is keeping the texture and thin lines.",
    };
  }
  if (noise.speckleRatio < 0.18) {
    return {
      label: "medium",
      strength: 6,
      protectDetail: 35,
      colorNoise: 15,
      note: "The noise is already affecting the shadows, so use a medium setting, then use the preview to make sure details aren't smeared away.",
    };
  }
  return {
    label: "heavy",
    strength: 8,
    protectDetail: 25,
    colorNoise: 20,
    note: "The noise is on the high side, but still don't max it out in one go; deal with the specks first, then check edges and text.",
  };
}

function getUpscalePreset(metrics) {
  const currentDpi = metrics.dpi.effective;
  const target = metrics.print.dpiTargets;
  const targetDpi = target.green;
  const needed = targetDpi / Math.max(currentDpi, 1);
  const scale = needed <= 1 ? 1 : needed <= 2 ? 2 : needed <= 4 ? 4 : 8;
  const expectedDpi = Math.round(currentDpi * scale);
  const outputWidth = metrics.pixelWidth * scale;
  const outputHeight = metrics.pixelHeight * scale;

  let caution = "2x is usually the most natural and less likely to show AI-upscaling artifacts in the detail.";
  if (scale === 4) {
    caution = "4x can make up a bigger DPI gap, but check faces, text and edges for fake detail.";
  } else if (scale === 8) {
    caution = "8x easily produces fake detail or fails outright; see if you can reduce the output size first, and only use 8x when you have to.";
  } else if (scale === 1) {
    caution = "The DPI is already close to the target, so you usually don't need to upscale; if you just want to be safer, zoom to 100% and check it yourself.";
  }

  return {
    currentDpi: Math.round(currentDpi),
    targetDpi,
    scale,
    expectedDpi,
    outputWidth,
    outputHeight,
    caution,
  };
}

function chooseFixPlan(metrics) {
  const fixes = collectFixes(metrics);
  const actionable = fixes.filter((fix) => fix.url);
  const primaryFix = actionable[0] || null;

  if (fixes.length === 0) {
    const ok = finalCheckFix();
    return {
      title: "Ready to print",
      summary: "The main risks are all below the warning line; before printing, just zoom in and check the key areas yourself.",
      steps: [`${ok.title}：${ok.summary}`],
      fixes: [ok],
      primaryFix: ok,
    };
  }

  return {
    title: "Suggested fix order",
    summary: "The following is in the suggested order. Do the steps that change the layout or structure first, then upscaling and detail fixes.",
    steps: fixes.map((fix) => `${fix.title}：${fix.summary}`),
    fixes,
    primaryFix,
  };
}

function collectFixes(metrics) {
  const dpiStatus = statusForDpi(metrics.dpi.effective, metrics.print.dpiTargets);
  const sharpStatus = statusForSharpness(metrics.sharpness);
  const bleedStatus = statusForBleed(metrics.print.bleedMm);
  const noiseStatus = statusForNoise(metrics.noise);
  const fixes = [];

  if (metrics.print.needsEditableLayers) fixes.push(canvaFix());
  if (bleedStatus.level !== "green") fixes.push(bleedFix());
  if (dpiStatus.level === "red" || dpiStatus.level === "yellow") fixes.push(upscaleFix(metrics));
  if (sharpStatus.level === "red") fixes.push(sharpenFix());
  if (noiseStatus.level !== "green") fixes.push(noiseFix(metrics));

  return fixes;
}

function upscaleFix(metrics) {
  const upscale = getUpscalePreset(metrics);
  const isLogoAsset = metrics.print.isLogoAsset;
  const title = "Fix resolution: download the Upscayl desktop app";
  const summary = `The current effective DPI is about ${upscale.currentDpi}, and this use wants around ${upscale.targetDpi} DPI. Start with a ${upscale.scale}x upscale, which should reach about ${upscale.expectedDpi} DPI.${
    isLogoAsset ? " For most logo / badge print jobs this is the simplest main route; you can leave vectorizing for when you need very large output or to recolor / split objects." : ""
  }`;
  const trustNote = isLogoAsset
    ? "For most logos / icons, if it's just a poster, sticker or signage output, a high-resolution PNG/PDF is usually enough. You only need to vectorize separately when you need long-term repeated use, free recoloring, splitting objects, or the shop explicitly asks for a vector file. Upscayl is a free, open-source AI image-upscaling desktop app, good for getting a low-resolution image up to the printable threshold first."
    : "Upscayl is a free, open-source AI image-upscaling desktop app; images are processed on your own computer, and it's good for getting a low-resolution AI image up close to print requirements first. Speed depends on your computer's CPU/GPU, so if your computer is on the slow side, use 2x first.";
  const steps = [
    "Open the Upscayl download page and download the Windows desktop app.",
    "After installing, open Upscayl on your computer; you don't need to use the online Dashboard.",
    "If you see credits, Start free trial or Upgrade on screen, you're on the cloud version — go back to the download page and get the desktop app instead.",
    "Import the original image.",
    `For Resolution Scale, start with ${upscale.scale}x. The output should be about ${upscale.outputWidth} x ${upscale.outputHeight} px.`,
    upscale.caution,
    "For Model, start with Upscayl Standard; for character faces you can also try another model and compare the detail.",
    "Set Output Format to PNG; avoid low-quality JPG.",
    "After exporting, zoom in to check faces, edges, lines and shadows — don't just look at the thumbnail.",
    "Come back to this tool and click re-upload the fixed version to check the score.",
  ];

  return {
    title,
    summary,
    trustNote,
    linkText: "Download the free desktop app",
    url: "https://upscayl.io/",
    steps,
  };
}

function bleedFix() {
  return {
    title: "Add bleed: adjust the canvas in Photopea",
    summary: "Too little bleed leaves a white edge after trimming. Enlarge the canvas first and keep important content within the safe area.",
    trustNote: "Photopea is a browser-based image editor that works much like Photoshop, good for cropping, canvas size, bleed, simple sharpening and export. For proper CMYK, still follow your print shop's specs.",
    linkText: "Go to Photopea",
    url: "https://www.photopea.com/",
    steps: [
      "In Photopea, use File > Open to open the image.",
      "Use Image > Canvas Size to add 3 mm on each side (left, right, top, bottom).",
      "Extend the background or image into the bleed area; keep text and logos away from the edge.",
      "Export a PNG or PDF, then come back and re-check.",
    ],
  };
}

function sharpenFix() {
  return {
    title: "Fix blur: sharpen in Photopea",
    summary: "When the image is soft, it shows up even more in print. Do a light sharpen first, and check faces, lines and text at 100%.",
    trustNote: "Photopea lets you do basic retouching right in the browser, with no big software to install. Sharpening can only improve how the edges look — it can't truly bring back detail that isn't there.",
    linkText: "Go to Photopea",
    url: "https://www.photopea.com/",
    steps: [
      "Open the image in Photopea.",
      "Use Filter > Sharpen > Smart Sharpen or Sharpen.",
      "Don't over-sharpen, to avoid white halos or specks on the edges.",
      "Export a PNG, then come back and re-check.",
    ],
  };
}

function canvaFix() {
  return {
    title: "Split into editable layers: use Canva Magic layers",
    summary: "Use Canva Magic layers for a rough split first, then manually tidy up the objects, text and layout.",
    trustNote: "Canva Magic layers are good for roughly splitting an image into editable elements, making it easier to rearrange, replace or tweak afterward. It isn't professional vectorizing and won't perfectly separate every object; complex heavy painting, smoke, hair strands or fine lighting still need manual review.",
    linkText: "Go to Canva",
    url: "https://www.canva.com/",
    steps: [
      "Open Canva and create or open a design.",
      "Upload the image and place it on the canvas.",
      "Click the image.",
      "Click Edit image.",
      "In the tools, choose Magic layers.",
      "Wait for Canva to roughly split the layers.",
      "Check whether each layer was split sensibly, and manually delete, rearrange or fix as needed.",
      "If it's for print, you still need to confirm the size, bleed, resolution and the print shop's output specs at the end.",
    ],
  };
}

function inkscapeFix() {
  return {
    title: "Vectorize the icon: use Inkscape Trace Bitmap",
    summary: "If a logo / icon / badge has clear edges and simple color blocks, you can convert it to SVG for free in Inkscape first.",
    trustNote: "Inkscape is free, open-source vector drawing software. Open-source means the source code is public, so the community can inspect and improve it — more transparent than a sketchy file-conversion website; still, only download from the official inkscape.org page. Its built-in Trace Bitmap can trace a raster image into SVG, good for logos, silhouettes, badges, icons and flat assets; not good for heavily painted character art, photos or complex gradients.",
    linkText: "Go to the Inkscape 1.4.4 download page",
    url: "https://inkscape.org/release/inkscape-1.4.4/",
    steps: [
      "Download Inkscape: choose Windows > 64-bit > Windows Installer Package / msi, install it, and open it.",
      "If you see the start screen, switch to \"Start creating\" and choose \"Open other file...\" to open the image.",
      "If you're already on a blank canvas, use \"File > Import\" to place the image on the canvas.",
      "Click the image once and confirm it has a selection box; if it isn't selected, Trace Bitmap may not work.",
      "From the top menu choose \"Path > Trace Bitmap\".",
      "Click the in-depth setup below based on your image type: black-and-white logo, color badge, or result check.",
      "Click \"Preview\" to see the result first; when the edges are clean, click \"Apply\".",
        "After applying, drag the top object aside and check which one is the original and which is the vector result.",
        "If the checkerboard background or watermark also got traced, ungroup first, then select and delete the extra background objects.",
        "Use \"File > Save As\" to save as SVG; to hand off to a print shop, you can save as PDF.",
        "If the vector result is very dirty, the file is very heavy, or it looks very different from the original, switch to high-resolution PNG/PDF instead of forcing it.",
    ],
    extraGuides: [
      {
        label: "Black-and-white logo / single-color icon",
        eyebrow: "Trace Bitmap",
        title: "How to set up a black-and-white logo or single-color icon?",
        summary: "Good for black-and-white marks, silhouettes, single-color symbols and icons with clear edges. The goal is a clean outline, not preserving every detail of the original.",
        sections: [
          {
            title: "Suggested settings",
            items: [
              "In \"Trace Bitmap\", choose \"Single Scan\".",
              "For mode, start with \"Brightness cutoff\".",
              "For \"Threshold\", start at 0.55; if it's too thin, raise it to 0.60–0.65, and if it's too thick or goes solid black, lower it to 0.45–0.50.",
              "When the background is white, you can tick \"Remove background\", but it's not required; you can also ungroup after tracing and delete the background object.",
              "When the edges are too jagged, turn on \"Smooth\"; when there are too many nodes, try \"Optimize\".",
            ],
          },
          {
            title: "How to tell it worked",
            items: [
              "The preview looks like a clean silhouette, with no lots of debris on the edges.",
              "Small holes, sharp corners or thin lines weren't eaten away.",
              "After applying, drag it aside, delete the original, and the pattern still makes sense with only the vector left.",
            ],
          },
          {
            title: "When it doesn't work",
            items: [
              "If the original logo is too blurry, switch to a clearer source first; don't upscale and then force a trace.",
              "If there are lots of edge specks, clean the white background or denoise in Photopea first, then trace in Inkscape.",
              "If only the background got traced along with it, try ungrouping and deleting the background first; you don't necessarily have to re-trace.",
              "If there are lots of gradients, shadows or texture, this image may not be a good fit for single-color vectorizing.",
            ],
          },
        ],
      },
      {
        label: "Color badge / multi-color icon",
        eyebrow: "Trace Bitmap",
        title: "How to set up a color badge or multi-color icon?",
        summary: "Good for badges, game icons and UI icons with clear color blocks and not too many colors. The key is to reduce colors first so the SVG doesn't turn into a pile of tiny color fragments.",
        sections: [
          {
            title: "Suggested settings",
            items: [
              "Choose \"Multiple Scans\" or \"Colors\" mode.",
              "For \"Scans\", start with 8; if there aren't enough colors, try 12 or 16.",
              "Don't open too many colors right away — the more colors, the heavier the file and the harder it is to tidy.",
              "If there's a white, checkerboard or transparent background, try \"Remove background\"; or apply first, then ungroup and delete the background color blocks.",
              "When the edges are too fragmented, try turning on \"Smooth\" or \"Optimize\".",
            ],
          },
          {
            title: "How to tell it worked",
            items: [
              "The main shapes are clear and the color regions look like the design draft, not like shattered glass.",
              "Zoom in and the edges aren't dirty, with no excessive tiny fragments in the color blocks.",
              "The file still moves and saves smoothly; obvious lag usually means too many nodes.",
            ],
          },
          {
            title: "When it doesn't work",
            items: [
              "Lower the scan count, keep the main color blocks first, and don't chase a perfect match to the original.",
              "If the checkerboard background got traced in, ungroup first, then select and delete the background squares or watermark color blocks.",
              "If the badge has heavy metallic texture, glow or smoke, exporting a high-resolution PNG/PDF looks more natural.",
              "If the print shop just needs a printable file, you don't necessarily need an SVG; you can hand the original file to the shop and ask them to convert it to PDF.",
            ],
          },
        ],
      },
      {
        label: "Result check / whether to still upscale",
        eyebrow: "Vector Check",
        title: "After vectorizing, how do you tell whether resolution still needs fixing?",
        summary: "After a successful vectorization, the logo or icon itself usually no longer cares about DPI; but when raster assets are mixed in, you still need to check those raster parts.",
        sections: [
          {
            title: "When vectorizing succeeds",
            items: [
              "After dragging the vector result aside, delete the original raster image, and the vector alone is still clear.",
              "After saving as SVG or PDF and reopening, the edges are still clean.",
              "A pure-vector logo / icon like this usually doesn't need upscaling with Upscayl.",
            ],
          },
          {
            title: "Cases where you still need to check DPI",
            items: [
              "The design still has a raster background, character, photo, texture, shadow or AI heavy-painted image.",
              "In the end you're not delivering SVG/PDF, but exporting PNG or JPG.",
              "The vectorization failed and you ended up using high-resolution PNG/PDF instead.",
            ],
          },
          {
            title: "Final check before printing",
            items: [
              "Save the pure-vector image as SVG; to give it to a print shop, you can save as PDF.",
              "If it includes raster images, re-upload the output file to this tool and confirm the effective DPI.",
              "Before a large print run, zoom to 100% yourself and check the key areas.",
            ],
          },
        ],
      },
    ],
  };
}

function noiseFix(metrics) {
  const preset = getNoisePreset(metrics.noise);
  return {
    title: "Fix noise: use Photopea's fallback denoise flow",
    summary: `For the current compression/noise, a ${preset.label} denoise is recommended. If Reduce Noise does nothing, it usually means no image layer is selected; you can also try Surface Blur or Median.`,
    trustNote: "Photopea's filters need to be applied to a normal raster layer; if the layer is text, a shape, a smart object or a special layer, you may need to Rasterize it first. Denoising can only reduce the specks and the compressed look — it can't bring back missing detail.",
    linkText: "Go to Photopea",
    url: "https://www.photopea.com/",
    steps: [
      "Open the image in Photopea.",
      "First click the image layer in the Layers panel on the right; if no layer is selected, the filter may look like it does nothing.",
      "Choose Filter > Noise > Reduce Noise, and first make sure Preview is checked.",
      `Suggested starting values: Strength ${preset.strength}, Protect Detail ${preset.protectDetail}%, Reduce Color Noise ${preset.colorNoise}%.`,
      preset.note,
      "If the image gets too plastic or thin gold lines / fragments disappear, lower Strength by 1-2, or raise Protect Detail by 10%.",
      "If the specks are still obvious, raise Strength by 1, but don't crank it to the max in one go.",
      "If Reduce Noise still isn't usable, try Filter > Blur > Surface Blur, or Filter > Noise > Median, starting Median at 1 or 2.",
      "Export a PNG; avoid re-saving as a low-quality JPG.",
      "Come back to this tool and re-upload the fixed version to check the score.",
    ],
  };
}

function textFix() {
  return {
    title: "Redo small text: use Photopea or Illustrator",
    summary: "Small text inside an image is the easiest thing to print blurry. If this is a real poster or business card, it's best to re-typeset the text as vector or a high-resolution text layer.",
    trustNote: "Small text in AI images is often not a clean typeface and easily goes blurry when scaled up. Re-typesetting the text in an editor is usually more reliable than fixing the original.",
    linkText: "Go to Photopea",
    url: "https://www.photopea.com/",
    steps: [
      "Open the original image as the base layer.",
      "Use the text tool to re-type the small text; don't just rely on the text in the AI image.",
      "Keep the text at least a safe distance from the trim edge.",
      "After exporting, come back to this tool and re-check.",
    ],
  };
}

function finalCheckFix() {
  return {
    title: "Ready to print: just zoom in and check yourself",
    summary: "The main risks all pass. Before printing, just put the image at 100% and look over the key areas once.",
    trustNote: "A digital check can only estimate risk — it doesn't guarantee the print result; the final output still depends on the print shop's specs and the actual run.",
    steps: [
      "Zoom the image to 100% and check faces, text, logos, edges and shadows.",
      "Make sure the background extends into the bleed area and important content isn't against the edge.",
      "If it's all fine, you can hand the file to the print shop for output.",
    ],
  };
}
