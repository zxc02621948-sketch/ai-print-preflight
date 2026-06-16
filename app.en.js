const presets = {
  a3: { width: 297, height: 420, distance: "close" },
  a2: { width: 420, height: 594, distance: "poster" },
  a1: { width: 594, height: 841, distance: "poster" },
  "business-card": { width: 90, height: 54, distance: "close" },
  banner: { width: 3000, height: 900, distance: "far" },
};

const targets = {
  close: { green: 300, yellow: 220 },
  poster: { green: 200, yellow: 150 },
  far: { green: 120, yellow: 72 },
};

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
  emptyState: document.querySelector("#emptyState"),
  preset: document.querySelector("#preset"),
  widthMm: document.querySelector("#widthMm"),
  heightMm: document.querySelector("#heightMm"),
  viewDistance: document.querySelector("#viewDistance"),
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
  colorMetric: document.querySelector("#colorMetric"),
  colorStatus: document.querySelector("#colorStatus"),
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
  copyShopMessage: document.querySelector("#copyShopMessage"),
  downloadReport: document.querySelector("#downloadReport"),
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
els.copyShopMessage.addEventListener("click", copyShopMessage);
els.downloadReport.addEventListener("click", downloadReport);

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
    els.viewDistance.value = preset.distance;
  }
  analyze();
});

[els.widthMm, els.heightMm, els.viewDistance, els.bleedMm, els.isLogoAsset, els.needsEditableLayers].forEach((el) => {
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
    els.analyzeButton.disabled = false;
    els.downloadReport.disabled = false;
    els.copyShopMessage.disabled = false;
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
  els.previewImage.style.display = "none";
  els.emptyState.style.display = "block";
  els.emptyState.textContent = "Only PNG, JPG and WebP are supported. For SVG / PDF / AI, check them in Inkscape, Illustrator or at the print shop; to evaluate here, save as PNG, JPG or WebP.";
  els.analyzeButton.disabled = true;
  els.downloadReport.disabled = true;
  els.copyShopMessage.disabled = true;
  els.reuploadFixed.disabled = true;

  els.scoreBand.className = "score-band";
  els.scoreLabel.textContent = "Format not supported";
  els.scoreValue.textContent = "--";
  setMetric(els.dpiMetric, els.dpiStatus, "--", { level: "", label: "Waiting" });
  setMetric(els.sharpMetric, els.sharpStatus, "--", { level: "", label: "Waiting" });
  setMetric(els.noiseMetric, els.noiseStatus, "--", { level: "", label: "Waiting" });
  setMetric(els.colorMetric, els.colorStatus, "--", { level: "", label: "Waiting" });
  setMetric(els.bleedMetric, els.bleedStatus, "--", { level: "", label: "Waiting" });
  els.infoPixels.textContent = "--";
  els.infoTarget.textContent = "--";
  els.infoDpi.textContent = "--";
  els.infoUse.textContent = "--";
  els.workflowSummary.textContent = "SVG / PDF / AI are vector or delivery files; inspect them zoomed-in with pro editing tools, or export a raster image and come back to check effective DPI.";
  els.workflowSteps.innerHTML = "<li>To check print resolution, export PNG, JPG or WebP from your vector tool.</li><li>To deliver to a shop, use PDF, AI, TIFF, PNG or the shop's required format.</li>";
  els.adviceList.innerHTML = "<li>This tool no longer scores SVG, to avoid giving a meaningless score.</li>";
  els.fixTitle.textContent = "Unsupported format";
  els.fixSummary.textContent = "Please use PNG, JPG or WebP for preflight checks.";
  els.fixSteps.innerHTML = "<li>For SVG / PDF / AI, go back to vector software or let the shop do a delivery check.</li>";
  els.fixTabs.innerHTML = "";
  els.fixStepLabel.textContent = "Format";
  els.fixStepTitle.textContent = "Unsupported format";
  els.fixStepSummary.textContent = "These files are better verified in Inkscape, Illustrator, Acrobat or the print shop's workflow.";
  els.fixStepTrustNote.textContent = "This tool focuses on checking the effective DPI, noise, color-shift risk and bleed setting of AI-generated raster images.";
  els.fixStepList.innerHTML = "<li>To check resolution here, save as PNG, JPG or WebP first.</li><li>If it is already a final delivery file, let the print shop confirm the PDF/AI/TIFF/PNG format requirements.</li>";
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
  const colorRisk = estimateCmykRisk(sampled);
  const bleedScore = print.bleedMm >= 3 ? 10 : print.bleedMm > 0 ? 7 : 3;

  const dpiScore = scoreDpi(dpi.effective, print.distance);
  const sharpScore = scoreSharpness(sharpness);
  const noiseScore = scoreNoise(noise);
  const colorScore = scoreColor(colorRisk);
  const rawTotal = clamp(Math.round(dpiScore + sharpScore + noiseScore + colorScore + bleedScore), 0, 100);
  const total = normalizeTotal(rawTotal, { dpi, print, sharpness, noise, colorRisk });

  state.metrics = {
    fileName: state.fileName,
    pixelWidth: state.image.naturalWidth,
    pixelHeight: state.image.naturalHeight,
    print,
    dpi,
    sharpness,
    noise,
    colorRisk,
    scores: { total, dpiScore, sharpScore, noiseScore, colorScore, bleedScore },
  };

  renderMetrics(state.metrics);
}

function getPrintSettings() {
  return {
    widthMm: Number(els.widthMm.value) || 1,
    heightMm: Number(els.heightMm.value) || 1,
    distance: els.viewDistance.value,
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

function estimateCmykRisk(sample) {
  const { data } = sample;
  let risky = 0;
  let vivid = 0;
  const total = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    const brightness = max;
    const isNeonGreen = g > 0.72 && r < 0.35 && b < 0.45;
    const isElectricBlue = b > 0.72 && g > 0.35 && r < 0.35;
    const isHotPurple = b > 0.6 && r > 0.55 && g < 0.32;
    const isHotRed = r > 0.8 && g < 0.22 && b < 0.22;
    if (saturation > 0.62 && brightness > 0.72) vivid++;
    if (isNeonGreen || isElectricBlue || isHotPurple || isHotRed) risky++;
  }
  return {
    vividRatio: vivid / total,
    riskyRatio: risky / total,
  };
}

function gray(data, width, x, y) {
  const index = (y * width + x) * 4;
  return data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
}

function scoreDpi(dpi, distance) {
  const target = targets[distance];
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

function scoreColor(risk) {
  const penalty = risk.riskyRatio * 45 + risk.vividRatio * 12;
  return clamp(10 - penalty, 2, 10);
}

function normalizeTotal(rawTotal, data) {
  const levels = [
    statusForDpi(data.dpi.effective, data.print.distance).level,
    statusForSharpness(data.sharpness).level,
    statusForNoise(data.noise).level,
    statusForColor(data.colorRisk).level,
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
  const label = total >= 85 ? "Green: ready for pre-print" : total >= 70 ? "Yellow: fix before printing" : "Red: not recommended to print as is";
  els.scoreBand.className = `score-band ${band}`;
  els.scoreLabel.textContent = label;
  els.scoreValue.textContent = total;

  setMetric(els.dpiMetric, els.dpiStatus, `${Math.round(metrics.dpi.effective)} DPI`, statusForDpi(metrics.dpi.effective, metrics.print.distance));
  setMetric(els.sharpMetric, els.sharpStatus, metrics.sharpness.toFixed(1), statusForSharpness(metrics.sharpness));
  setMetric(els.noiseMetric, els.noiseStatus, `${Math.round(metrics.noise.speckleRatio * 100)}%`, statusForNoise(metrics.noise));
  setMetric(els.colorMetric, els.colorStatus, `${Math.round(metrics.colorRisk.riskyRatio * 100)}%`, statusForColor(metrics.colorRisk));
  setMetric(els.bleedMetric, els.bleedStatus, `${metrics.print.bleedMm} mm`, statusForBleed(metrics.print.bleedMm));
  renderImageInfo(metrics);
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
      summary: "Logo / 圖示若也需要改物件，先處理版面與圖層，再回來檢查解析度；向量化只在超大輸出、改色拆物件或店家要求時再做。",
      steps: [
        "先確認輸出尺寸、方向、比例、留白與出血。",
        "如果要重排物件或改版面，先用 Canva 魔法圖層或 Photopea / Illustrator 處理。",
        "回本工具檢查有效 DPI；不足時先用 Upscayl 放大，這是多數送印情境最簡單的路線。",
        "只有需要超大尺寸、長期重複使用、改色拆物件或店家要求向量檔時，再考慮 Inkscape Trace Bitmap。",
        "最後做 100% 局部打樣，確認邊緣、暗部與色彩。",
      ],
    };
  }

  if (metrics.print.needsEditableLayers) {
    return {
      summary: "需要拆圖層時，先做會改版面的事情，再做放大；這樣檔案比較小，Canva / Photopea 也比較好處理。",
      steps: [
        "先確認輸出尺寸、方向、比例、留白與是否需要出血。",
        "用 Canva 魔法圖層粗略拆分物件。",
        "先整理圖層、重排文字、調整物件與版面。",
        "匯出高解析 PNG 或 PDF。",
        "回到本工具重新檢查有效 DPI；如果不足，再用 Upscayl 放大。",
        "最後做輕度降噪 / 銳化，並產生 100% 局部打樣。",
      ],
    };
  }

  if (metrics.print.isLogoAsset) {
    return {
      summary: "Logo / 圖示 / 徽章先走高解析 PNG/PDF 路線；向量化是進階選項，不是送印必做。",
      steps: [
        "先用本工具確認有效 DPI、出血和色彩風險。",
        "如果 DPI 不足，先用 Upscayl 放大，通常比硬轉向量更快。",
        "放大後檢查邊緣、尖角和色塊是否乾淨。",
        "只有需要超大輸出、長期重複使用、改色拆物件或店家要求向量檔時，再用 Inkscape Trace Bitmap。",
        "向量化結果如果變髒或需要大量修節點，就回到高解析 PNG/PDF 路線。",
        "最後再依印刷店規格確認 CMYK、PDF/X、出血與打樣。",
      ],
    };
  }

  return {
    summary: "一般 AI 海報或角色圖建議先處理版面，再放大；最後才做印刷輸出檢查。",
    steps: [
      "先決定輸出尺寸、方向與比例，確認是否需要裁切、補背景或加出血。",
      "先做會改版面的事情，例如裁切、補背景、重排文字或物件。",
      "回到本工具檢查有效 DPI；不足時再用 Upscayl 放大。",
      "放大後再做輕度降噪與銳化，避免先修完又被放大破壞。",
      "做 100% 局部打樣，確認臉、邊緣、暗部與色彩。",
      "最後依印刷店規格處理 CMYK、PDF/X 或其他交付格式。",
    ],
  };
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

function statusForDpi(dpi, distance) {
  const target = targets[distance];
  if (dpi >= target.green) return { level: "green", label: "Sufficient" };
  if (dpi >= target.yellow) return { level: "yellow", label: "Borderline" };
  return { level: "red", label: "Too low" };
}

function statusForSharpness(sharpness) {
  if (sharpness >= 10) return { level: "green", label: "Sharp" };
  if (sharpness >= 5) return { level: "yellow", label: "Check it" };
  return { level: "red", label: "Blurry" };
}

function statusForNoise(noise) {
  if (noise.speckleRatio < 0.08) return { level: "green", label: "Clean" };
  if (noise.speckleRatio < 0.18) return { level: "yellow", label: "Acceptable" };
  return { level: "red", label: "Noisy" };
}

function statusForColor(risk) {
  if (risk.riskyRatio < 0.03 && risk.vividRatio < 0.12) return { level: "green", label: "Low risk" };
  if (risk.riskyRatio < 0.1 && risk.vividRatio < 0.25) return { level: "yellow", label: "Proof it" };
  return { level: "red", label: "High risk" };
}

function statusForBleed(bleed) {
  if (bleed >= 3) return { level: "green", label: "Standard" };
  if (bleed > 0) return { level: "yellow", label: "A bit low" };
  return { level: "red", label: "No bleed" };
}

function renderAdvice(metrics) {
  const advice = [];
  const dpiStatus = statusForDpi(metrics.dpi.effective, metrics.print.distance);
  const colorStatus = statusForColor(metrics.colorRisk);
  const sharpStatus = statusForSharpness(metrics.sharpness);
  const bleedStatus = statusForBleed(metrics.print.bleedMm);

  if (dpiStatus.level === "red") {
    advice.push("Effective DPI is too low. This is estimated from the output size; upscale with super-resolution first, or reduce the output size.");
  } else if (dpiStatus.level === "yellow") {
    advice.push("Effective DPI is on the acceptable edge; make a 100% A4 crop proof to confirm details.");
  } else {
    advice.push("At the current output size, the effective DPI meets the basic threshold for this use.");
  }

  if (sharpStatus.level !== "green") {
    advice.push("Sharpness could still improve. For character faces, logo edges or key details, zoom in to inspect and apply light sharpening if needed.");
  }

  const noiseStatus = statusForNoise(metrics.noise);
  if (noiseStatus.level === "yellow") {
    advice.push("Compression/noise is acceptable but improvable; apply light denoising before export. If Photopea's Reduce Noise does nothing, try Surface Blur or Median.");
  } else if (noiseStatus.level === "red") {
    advice.push("Compression/noise is high; denoise first or use a cleaner source image. If Photopea's Reduce Noise does nothing, make sure the layer is rasterized.");
  }

  if (colorStatus.level !== "green") {
    advice.push("High-saturation RGB colors detected. This is only a CMYK color-shift risk estimate; for real conversion, let the printer handle it with an ICC profile and proof.");
  } else {
    advice.push("CMYK color-shift risk estimate is low, but final output should still handle CMYK to the printer's specs.");
  }

  if (bleedStatus.level !== "green") {
    advice.push("Bleed setting is too low; posters, stickers and business cards usually need at least 3 mm.");
  } else {
    advice.push("Bleed value meets the common standard, but this only checks the value you set; confirm the background extends past the bleed frame.");
  }

  if (metrics.print.isLogoAsset) {
    advice.push("This image is marked as a Logo / icon / badge asset; for most print cases a high-res PNG/PDF is enough. Only consider vectorizing for very large output, long-term reuse, recoloring/splitting objects, or when the shop requires it.");
  }

  if (metrics.print.needsEditableLayers) {
    advice.push("This image is marked as needing editable layers; you can use Canva Magic Layers for a rough split, but the result still needs manual checking and cleanup.");
  }

  if (dpiStatus.level === "green" && colorStatus.level === "green" && bleedStatus.level === "green" && sharpStatus.level === "green" && noiseStatus.level === "green") {
    advice.push("All main metrics are green; next, make a 100% partial proof to confirm shadows, edges and color before printing for real.");
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
    els.fixStepTitle.textContent = "Waiting for evaluation";
    els.fixStepSummary.textContent = "After upload, the full guide for each step appears here.";
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
  els.fixLink.textContent = fix.url ? `View: ${fix.linkText}` : "No tool needed";
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
  return `${note} 不同版本或語言介面的選單名稱可能略有差異；如果找不到選項，可以截圖詢問 ChatGPT、Gemini，或對照官方文件確認。`;
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
    "<p>依你的圖片類型選一個深入設定：</p>",
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
  const versionNote = guide.versionHint === false ? "" : '<p class="guide-version-note">不同版本或語言介面的選單名稱可能略有差異；如果找不到選項，可以截圖詢問 ChatGPT、Gemini，或對照官方文件確認。</p>';
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
    title: "我想轉向量：Inkscape SVG 教學",
    summary: "這是進階教學，不會進入本工具評分。適合真的需要 SVG / PDF 向量交付、超大輸出、改色拆物件或長期重複使用的人。",
    sections: [
      {
        title: "先判斷是否值得",
        items: [
          "適合：Logo、圖示、徽章、單色剪影、邊界清楚且色塊簡單的符號。",
          "不適合：厚塗角色圖、照片、煙霧、光影、漸層很多或細碎材質很多的 AI 插畫。",
          "如果只是一般海報、貼紙或帆布輸出，通常先用 Upscayl 放大成高解析 PNG/PDF 比轉向量更快。",
          "如果轉完後邊緣變髒、尖角被磨圓、檔案很重，就回到高解析 PNG/PDF 路線，不要硬轉。",
        ],
      },
      {
        title: "下載與開啟圖片",
        items: [
          '到 <a href="https://inkscape.org/release/inkscape-1.4.4/" target="_blank" rel="noopener noreferrer">Inkscape 1.4.4 官方下載頁</a>。',
          "Windows 使用者依序點 Windows > 64-bit > Windows Installer Package / msi。",
          "MSI 是 Windows 安裝包格式，不是微星顯卡，照一般安裝流程Next即可。",
          "開啟 Inkscape 後可點「瀏覽其他檔案...」或用「檔案（File）> 開啟（Open）」匯入圖片。",
          "看到匯入 JPEG/PNG 設定時，通常維持預設並按確定即可。",
        ],
      },
      {
        title: "描圖起始設定",
        items: [
          "選取圖片後，打開「路徑（Path）> 描摹點陣圖（Trace Bitmap）」。",
          "黑白 Logo / 單色圖示：用「單次掃描（Single Scan）」與「亮度截斷（Brightness cutoff）」，臨界值先試 0.55。",
          "彩色徽章 / 多色圖示：用「多次掃描（Multiple Scans）」與「顏色（Colors）」，掃描數先試 4 到 8 色。",
          "背景是白底或棋盤底時，可嘗試「移除背景（Remove background）」；若效果不好，描完後再分離群組手動刪除。",
          "預覽看起來乾淨再按「套用（Apply）」；如果預覽已經很髒，通常代表Do not force-convert。",
        ],
      },
      {
        title: "清理與輸出",
        items: [
          "套用後把向量圖拖開，確認下面是否還有原始 JPG、棋盤背景或浮水印。",
          "如果背景和主圖包在一起，先用「物件（Object）> 解散群組（Ungroup）」再刪除多餘物件。",
          "放大檢查尖角、細線、孔洞、顏色分區與浮水印殘留。",
          "用「檔案（File）> 另存新檔（Save As）」存成 SVG；若要交給印刷店，可另存 PDF，或請店家代轉 AI/PDF。",
          "轉完 SVG 不需要回本工具評分；請在 Inkscape / Illustrator 放大檢查，或交由印刷店確認交付格式與輸出規格。",
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

async function copyShopMessage() {
  if (!state.metrics) return;
  const text = buildShopMessage(state.metrics);
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
  } else {
    fallbackCopyText(text);
  }
  const original = els.copyShopMessage.textContent;
  els.copyShopMessage.textContent = "Copied";
  window.setTimeout(() => {
    els.copyShopMessage.textContent = original;
  }, 1400);
}

function fallbackCopyText(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function buildShopMessage(metrics) {
  return [
    `你好，我想印 ${getUseLabel()}。`,
    `檔案像素為 ${metrics.pixelWidth} x ${metrics.pixelHeight} px，Target output尺寸為 ${metrics.print.widthMm} x ${metrics.print.heightMm} mm，目前依尺寸估算的有效 DPI 約 ${Math.round(metrics.dpi.effective)}。`,
    `目前設定出血 ${metrics.print.bleedMm} mm，但仍需確認背景是否有延伸到出血區。`,
    metrics.print.isLogoAsset ? "這張圖屬於 Logo / 圖示 / 徽章素材；若直接輸出不夠乾淨，請協助判斷適合用高解析 PNG/PDF，或是否需要另外轉成貴店可印格式。" : "這張圖目前以點陣圖印刷檢查為主，不一定需要轉向量。",
    metrics.print.needsEditableLayers ? "我也想嘗試將圖片拆成可編輯圖層，方便後續調整文字、物件或版面。" : "目前沒有特別要求拆成可編輯圖層。",
    `CMYK 色偏風險為估算值，若需要 CMYK、PDF/X 或指定 ICC Profile，請協助轉檔或告知規格。`,
    "請問這樣適合送印嗎？如果需要調整解析度、出血、裁切或轉色，也請告訴我。",
  ].join("\n");
}

function getNoisePreset(noise) {
  if (noise.speckleRatio < 0.1) {
    return {
      label: "輕度",
      strength: 4,
      protectDetail: 45,
      colorNoise: 10,
      note: "目前屬於可接受噪點，先用輕度設定，重點是保留材質和細線。",
    };
  }
  if (noise.speckleRatio < 0.18) {
    return {
      label: "中度",
      strength: 6,
      protectDetail: 35,
      colorNoise: 15,
      note: "噪點已經會影響暗部，先用中度設定，再用預覽確認細節沒有被抹平。",
    };
  }
  return {
    label: "偏重",
    strength: 8,
    protectDetail: 25,
    colorNoise: 20,
    note: "噪點偏高，但仍不建議一次拉滿；先處理髒點，再檢查邊緣和文字。",
  };
}

function getUpscalePreset(metrics) {
  const currentDpi = metrics.dpi.effective;
  const target = targets[metrics.print.distance];
  const targetDpi = target.green;
  const needed = targetDpi / Math.max(currentDpi, 1);
  const scale = needed <= 1 ? 1 : needed <= 2 ? 2 : needed <= 4 ? 4 : 8;
  const expectedDpi = Math.round(currentDpi * scale);
  const outputWidth = metrics.pixelWidth * scale;
  const outputHeight = metrics.pixelHeight * scale;

  let caution = "2x 通常最自然，細節比較不容易出現 AI 放大痕跡。";
  if (scale === 4) {
    caution = "4x 可補足較大的 DPI 缺口，但請檢查臉部、文字、邊緣是否出現假細節。";
  } else if (scale === 8) {
    caution = "8x 很容易產生假細節或處理失敗，建議先確認是否能降低輸出尺寸；必要時才使用 8x。";
  } else if (scale === 1) {
    caution = "目前 DPI 已接近目標，通常不需要放大；若只是想更穩，可先做 100% 局部打樣。";
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
    const proof = proofFix();
    return {
      title: "Ready for proofing",
      summary: "Main risks are below the warning line; next, make a 100% partial proof instead of applying more fixes.",
      steps: [`${proof.title}：${proof.summary}`],
      fixes: [proof],
      primaryFix: proof,
    };
  }

  return {
    title: "Suggested fix order",
    summary: "Listed in the suggested order. Do steps that change layout or structure first, then upscaling and detail fixes.",
    steps: fixes.map((fix) => `${fix.title}：${fix.summary}`),
    fixes,
    primaryFix,
  };
}

function collectFixes(metrics) {
  const dpiStatus = statusForDpi(metrics.dpi.effective, metrics.print.distance);
  const sharpStatus = statusForSharpness(metrics.sharpness);
  const colorStatus = statusForColor(metrics.colorRisk);
  const bleedStatus = statusForBleed(metrics.print.bleedMm);
  const noiseStatus = statusForNoise(metrics.noise);
  const fixes = [];

  if (metrics.print.needsEditableLayers) fixes.push(canvaFix());
  if (bleedStatus.level !== "green") fixes.push(bleedFix());
  if (dpiStatus.level === "red" || dpiStatus.level === "yellow") fixes.push(upscaleFix(metrics));
  if (sharpStatus.level === "red") fixes.push(sharpenFix());
  if (noiseStatus.level !== "green") fixes.push(noiseFix(metrics));
  if (colorStatus.level !== "green") fixes.push(colorFix());

  return fixes;
}

function upscaleFix(metrics) {
  const upscale = getUpscalePreset(metrics);
  const isLogoAsset = metrics.print.isLogoAsset;
  const title = "Fix resolution: download Upscayl desktop";
  const summary = `目前有效 DPI 約 ${upscale.currentDpi}，此用途建議達到約 ${upscale.targetDpi} DPI。建議先用 ${upscale.scale}x 放大，預估可到約 ${upscale.expectedDpi} DPI。${
    isLogoAsset ? " 這是多數 Logo / 徽章送印情境最省事的主路線；向量化可留到需要超大輸出或改色拆物件時再做。" : ""
  }`;
  const trustNote = isLogoAsset
    ? "多數 Logo / 圖示若只是海報、貼紙或招牌輸出，高解析 PNG/PDF 通常已經足夠。只有需要長期重複使用、任意改色、拆物件或店家明確要求向量檔時，才需要另外做向量化。Upscayl 是免費開源的 AI 圖片放大桌面軟體，適合先把低解析圖拉到可送印門檻。"
    : "Upscayl 是免費開源的 AI 圖片放大桌面軟體，圖片在本機電腦處理，適合把低解析 AI 圖先放大到接近印刷需求。處理速度取決於你的電腦 CPU/GPU，若電腦較慢請先用 2x。";
  const steps = [
    "打開 Upscayl 下載頁，下載 Windows 桌面版。",
    "安裝後在電腦上開啟 Upscayl，不需要使用線上 Dashboard。",
    "如果畫面出現 credits、Start free trial 或 Upgrade，代表你在雲端版，請回到下載頁改拿桌面版。",
    "匯入原圖。",
    `Resolution Scale 建議先選 ${upscale.scale}x。預估輸出約 ${upscale.outputWidth} x ${upscale.outputHeight} px。`,
    upscale.caution,
    "Model 建議先用 Upscayl Standard；如果是角色臉部可再測另一個模型比較細節。",
    "Output Format 選 PNG，避免用低品質 JPG。",
    "輸出後請放大看臉、邊緣、線條和暗部，不要只看縮圖。",
    "回到本工具，點Re-upload fixed version檢查分數。",
  ];

  return {
    title,
    summary,
    trustNote,
    linkText: "Download free desktop version",
    url: "https://upscayl.io/",
    steps,
  };
}

function bleedFix() {
  return {
    title: "Add bleed: adjust canvas in Photopea",
    summary: "出血不足會讓裁切後邊緣露白。先把畫布加大並保留重要內容在安全範圍內。",
    trustNote: "Photopea 是瀏覽器上的影像編輯器，操作方式接近 Photoshop，適合做裁切、畫布尺寸、出血、簡單銳化與輸出。正式 CMYK 仍建議依印刷廠規格處理。",
    linkText: "Open Photopea",
    url: "https://www.photopea.com/",
    steps: [
      "在 Photopea 使用 File > Open 開啟圖片。",
      "用 Image > Canvas Size 將畫布左右上下各加 3 mm。",
      "把背景或圖像延伸到出血區，文字和 Logo 不要貼邊。",
      "匯出 PNG 或 PDF 後回來Re-evaluate。",
    ],
  };
}

function sharpenFix() {
  return {
    title: "Reduce blur: sharpen in Photopea",
    summary: "畫面偏糊時，印出來會更明顯。先做輕度銳化，並用 100% 局部檢查臉部、線條與文字。",
    trustNote: "Photopea 可直接在瀏覽器做基礎修圖，不需要安裝大型軟體。銳化只能改善邊緣觀感，不能真正補回不存在的細節。",
    linkText: "Open Photopea",
    url: "https://www.photopea.com/",
    steps: [
      "在 Photopea 開啟圖片。",
      "使用 Filter > Sharpen > Smart Sharpen 或 Sharpen。",
      "銳化不要過量，避免邊緣出現白邊或髒點。",
      "匯出 PNG 後回來Re-evaluate。",
    ],
  };
}

function canvaFix() {
  return {
    title: "Split into editable layers: Canva Magic Layers",
    summary: "先用 Canva 魔法圖層做粗略分層，再手動整理物件、文字與版面。",
    trustNote: "Canva 魔法圖層適合把圖片粗略拆成可編輯元素，方便後續重排、替換或微調。它不是專業向量化，也不保證能完美分離所有物件；複雜厚塗、煙霧、髮絲或細碎光效仍需要人工檢查。",
    linkText: "Open Canva",
    url: "https://www.canva.com/",
    steps: [
      "打開 Canva 並建立或開啟一個設計。",
      "上傳圖片並放到畫布上。",
      "點選圖片。",
      "點選編輯圖片或 Edit image。",
      "在工具中選擇魔法圖層。",
      "等待 Canva 粗略拆分圖層。",
      "檢查每個圖層是否拆得合理，必要時手動刪除、重排或修正。",
      "若要印刷，最後仍需確認尺寸、出血、解析度與印刷店輸出規格。",
    ],
  };
}

function inkscapeFix() {
  return {
    title: "Vectorize an icon: Inkscape Trace Bitmap",
    summary: "Logo / 圖示 / 徽章若邊界清楚、色塊簡單，可先用 Inkscape 免費轉成 SVG。",
    trustNote: "Inkscape 是免費、開源的向量繪圖軟體。開源代表程式原始碼公開，社群可以檢查與改進，比來路不明的轉檔網站更透明；仍建議只從 inkscape.org 官方頁下載。它內建 Trace Bitmap，可把點陣圖描成 SVG，適合 Logo、剪影、徽章、圖示與扁平素材；不適合厚塗角色圖、照片或複雜漸層。",
    linkText: "Open Inkscape 1.4.4 download page",
    url: "https://inkscape.org/release/inkscape-1.4.4/",
    steps: [
      "下載 Inkscape：選 Windows > 64-bit > Windows Installer Package / msi，安裝後開啟。",
      "如果看到開始畫面，切到「開始創作」，選「瀏覽其他檔案...」開圖片。",
      "如果已進入空白畫布，就用「檔案（File）> 匯入（Import）」把圖片放進畫布。",
      "先點一下圖片，確認圖片外框有選取框；如果沒選到，Trace Bitmap 可能不會作用。",
      "從上方選單選「路徑（Path）> 描摹點陣圖（Trace Bitmap）」。",
      "依圖片類型點下方深入設定：黑白 Logo、彩色徽章，或結果檢查。",
      "按「預覽（Preview）」先看結果；邊緣乾淨再按「套用（Apply）」。",
        "套用後把上層物件拖到旁邊檢查，確認哪個是原圖、哪個是向量結果。",
        "如果棋盤背景或浮水印也被描出來，可先分離/解散群組（Ungroup），再選取多餘背景物件刪除。",
        "用「檔案（File）> 另存新檔（Save As）」存成 SVG；若要交給印刷店，可另存 PDF。",
        "如果向量結果很髒、檔案很重或和原圖差很多，改用高解析 PNG/PDF，不要硬轉。",
    ],
    extraGuides: [
      {
        label: "黑白 Logo / 單色圖示",
        eyebrow: "Trace Bitmap",
        title: "黑白 Logo 或單色圖示怎麼設？",
        summary: "適合黑白商標、剪影、單色符號、邊界清楚的圖示。目標是取得乾淨外框，不追求保留原圖所有細節。",
        sections: [
          {
            title: "建議設定",
            items: [
              "在「描摹點陣圖（Trace Bitmap）」裡選「單次掃描（Single Scan）」。",
              "模式先用「亮度截斷（Brightness cutoff）」。",
              "「臨界值（Threshold）」先從 0.55 試；太瘦就提高到 0.60～0.65，太粗或黑成一片就降到 0.45～0.50。",
              "背景是白底時可勾「移除背景（Remove background）」，但不是必須；描完後也可以分離/解散群組再刪背景物件。",
              "邊緣鋸齒太明顯時，開「平滑（Smooth）」；節點太多時，再試「最佳化（Optimize）」。",
            ],
          },
          {
            title: "怎麼判斷成功",
            items: [
              "預覽看起來像一個乾淨剪影，邊緣沒有大量碎屑。",
              "小洞、尖角或細線沒有被吃掉。",
              "套用後拖開檢查，刪掉原圖只保留向量也能看懂圖案。",
            ],
          },
          {
            title: "不成功時",
            items: [
              "如果 Logo 原圖太糊，先換更清楚的來源圖，不要先放大再硬描。",
              "如果邊緣髒點很多，先在 Photopea 清白底或去噪，再回 Inkscape 描摹。",
              "如果只有背景被一起描出來，先試分離/解散群組後刪背景，不一定要重新描。",
              "如果有大量漸層、陰影或材質，這張圖可能不適合單色向量化。",
            ],
          },
        ],
      },
      {
        label: "彩色徽章 / 多色圖示",
        eyebrow: "Trace Bitmap",
        title: "彩色徽章或多色圖示怎麼設？",
        summary: "適合色塊清楚、顏色不多的徽章、遊戲圖示、UI icon。重點是先減少顏色，避免 SVG 變成一堆碎色塊。",
        sections: [
          {
            title: "建議設定",
            items: [
              "選「多重掃描（Multiple Scans）」或「顏色（Colors）」模式。",
              "「掃描數（Scans）」先試 8；顏色不夠再試 12 或 16。",
              "不要一開始就開太多顏色，顏色越多，檔案越重，也越難整理。",
              "如果有白底、棋盤格或透明底，可試「移除背景（Remove background）」，但也可以套用後分離/解散群組再刪背景色塊。",
              "邊緣太破碎時，試著開「平滑（Smooth）」或「最佳化（Optimize）」。",
            ],
          },
          {
            title: "怎麼判斷成功",
            items: [
              "主要形狀清楚，顏色分區看起來像設計稿，而不是碎玻璃感。",
              "放大看邊緣不髒，色塊沒有太多不必要的小碎片。",
              "檔案仍能流暢移動與儲存；如果卡頓明顯，通常代表節點太多。",
            ],
          },
          {
            title: "不成功時",
            items: [
              "把掃描數降低，先保留主色塊，不要追求完全像原圖。",
              "如果棋盤格背景被描進去，先分離/解散群組，再選取背景方塊或浮水印色塊刪除。",
              "如果徽章有厚重金屬材質、光暈或煙霧，改輸出高解析 PNG/PDF 會比較自然。",
              "如果印刷店只是需要可印檔，不一定需要 SVG；可以附Check report請店家代轉 PDF。",
            ],
          },
        ],
      },
      {
        label: "結果檢查 / 是否還要放大",
        eyebrow: "Vector Check",
        title: "向量化後怎麼判斷是否還要修解析度？",
        summary: "成功向量化後，Logo 或圖示本身通常不再看 DPI；但混合點陣素材時，還是要檢查那些點陣部分。",
        sections: [
          {
            title: "向量化成功時",
            items: [
              "把向量結果拖開後，刪掉原始點陣圖，只留向量仍然清楚。",
              "存成 SVG 或 PDF 後重新打開，邊緣仍然乾淨。",
              "這種純向量 Logo / 圖示本身通常不需要再用 Upscayl 放大。",
            ],
          },
          {
            title: "仍需要檢查 DPI 的情況",
            items: [
              "設計裡還有點陣背景、角色、照片、材質、陰影或 AI 厚塗圖。",
              "你最後不是交 SVG/PDF，而是輸出 PNG 或 JPG。",
              "向量化結果失敗，最後改用高解析 PNG/PDF。",
            ],
          },
          {
            title: "送印前最後確認",
            items: [
              "把純向量圖另存 SVG；若要給印刷店，可另存 PDF。",
              "如果包含點陣圖，回本工具重新上傳輸出檔，確認有效 DPI。",
              "大量印刷前仍建議先做小樣或局部 100% 打樣。",
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
    title: "Reduce noise: Photopea backup denoise flow",
    summary: `目前壓縮/噪點建議用${preset.label}降噪。Reduce Noise 若沒反應，通常是沒有選到圖片圖層；也可改用 Surface Blur 或 Median。`,
    trustNote: "Photopea 的濾鏡需要套在一般點陣圖層上；如果圖層是文字、形狀、智慧物件或特殊圖層，可能要先 Rasterize。降噪只能降低髒點和壓縮感，不能補回缺失細節。",
    linkText: "Open Photopea",
    url: "https://www.photopea.com/",
    steps: [
      "在 Photopea 開啟圖片。",
      "先在右側 Layers 面板點選圖片圖層；如果沒有選到圖層，濾鏡可能看起來沒反應。",
      "選 Filter > Noise > Reduce Noise，先確認 Preview 有勾選。",
      `建議起始值：Strength ${preset.strength}、Protect Detail ${preset.protectDetail}%、Reduce Color Noise ${preset.colorNoise}%。`,
      preset.note,
      "如果畫面變太塑膠或金線/碎片消失，把 Strength 降 1-2，或把 Protect Detail 提高 10%。",
      "如果雜點還很明顯，把 Strength 加 1，但不要一次拉到最高。",
      "Reduce Noise 仍無法使用時，改試 Filter > Blur > Surface Blur，或 Filter > Noise > Median，Median 從 1 或 2 開始。",
      "匯出 PNG，避免再次存成低品質 JPG。",
      "回到本工具，Re-upload fixed version檢查分數。",
    ],
  };
}

function colorFix() {
  return {
    title: "Check color shift: CMYK preview in Photopea",
    summary: "高飽和 RGB 顏色轉印刷時可能變暗或變灰。先做 CMYK 預覽，再決定是否交給印刷店轉色。",
    trustNote: "Photopea 可用來初步觀察 RGB 轉印刷色的落差，但不同印刷廠會使用不同 ICC Profile、紙材與油墨。這一步是風險預覽，不是保證色準。",
    linkText: "Open Photopea",
    url: "https://www.photopea.com/",
    steps: [
      "在 Photopea 開啟圖片。",
      "使用 Image > Mode 或色彩相關功能查看 CMYK/印刷預覽。",
      "特別檢查亮藍、亮綠、紫色與螢光感紅色。",
      "正式輸出前，仍建議依印刷廠 ICC Profile 處理。",
    ],
  };
}

function textFix() {
  return {
    title: "Re-typeset small text: Photopea or Illustrator",
    summary: "圖片內的小字最容易印糊。若這是正式海報或名片，最好把文字重新排成向量或高解析文字圖層。",
    trustNote: "AI 圖裡的小字常常不是乾淨字型，放大後也容易糊。用編輯工具重新排文字，通常比修原圖更可靠。",
    linkText: "Open Photopea",
    url: "https://www.photopea.com/",
    steps: [
      "開啟原圖作為底圖。",
      "用文字工具重新打上小字，不要直接依賴 AI 圖裡的字。",
      "文字離裁切邊至少保留安全距離。",
      "匯出後回到本工具Re-evaluate。",
    ],
  };
}

function proofFix() {
  return {
    title: "Ready for proofing",
    summary: "主要風險都已低於警戒線。Next建議產生 100% 局部打樣，確認細節和色彩。",
    trustNote: "數位評估只能預測風險，不能取代實體打樣。正式大量印刷前，最好先印 100% 局部小樣確認細節、暗部與色彩。",
    linkText: "View proofing notes",
    url: "https://helpx.adobe.com/tw/acrobat/using/printing-pdfs-custom-sizes.html",
    steps: [
      "挑選畫面中最重要的區域，例如臉、Logo、小字或暗部。",
      "用實際尺寸裁切一塊 A4 可印範圍。",
      "先印小樣確認細節，再印完整海報。",
      "送印時附上本工具的Check report。",
    ],
  };
}

function downloadReport() {
  if (!state.metrics) return;
  const m = state.metrics;
  const dpiStatus = statusForDpi(m.dpi.effective, m.print.distance);
  const sharpStatus = statusForSharpness(m.sharpness);
  const noiseStatus = statusForNoise(m.noise);
  const colorStatus = statusForColor(m.colorRisk);
  const bleedStatus = statusForBleed(m.print.bleedMm);
  const scoreLabel = m.scores.total >= 85 ? "Green: ready for pre-print" : m.scores.total >= 70 ? "Yellow: fix before printing" : "Red: not recommended to print as is";
  const target = targets[m.print.distance];
  const lines = [
    "AI 圖送印前檢查摘要",
    `產生日期：${new Date().toLocaleDateString("zh-TW")}`,
    "",
    "一、送印需求",
    `檔名：${m.fileName}`,
    `用途：${getUseLabel()}`,
    `輸出尺寸：${m.print.widthMm} x ${m.print.heightMm} mm`,
    `出血設定：${m.print.bleedMm} mm（${bleedStatus.label}；此工具只檢查設定值，仍需確認圖面背景是否延伸到出血區）`,
    `Logo / 圖示 / 徽章素材：${m.print.isLogoAsset ? "是" : "否"}`,
    "",
    "二、檔案資訊",
    `圖片像素：${m.pixelWidth} x ${m.pixelHeight} px`,
    `Effective DPI (estimated from output size)：${Math.round(m.dpi.effective)} DPI（${dpiStatus.label}；此用途建議約 ${target.yellow}-${target.green} DPI 以上）`,
    `300 DPI 可印尺寸：約 ${formatPrintSize(m.pixelWidth, m.pixelHeight, 300)}`,
    `150 DPI 可印尺寸：約 ${formatPrintSize(m.pixelWidth, m.pixelHeight, 150)}`,
    `72 DPI 可印尺寸：約 ${formatPrintSize(m.pixelWidth, m.pixelHeight, 72)}`,
    "",
    "三、初步風險估算",
    `整體評估：${scoreLabel}（${m.scores.total} 分）`,
    `解析度：${Math.round(m.dpi.effective)} DPI（${dpiStatus.label}）`,
    `Sharpness：${m.sharpness.toFixed(1)}（${sharpStatus.label}）`,
    `Compression / noise：${Math.round(m.noise.speckleRatio * 100)}%（${noiseStatus.label}）`,
    `CMYK color-shift risk estimate：${Math.round(m.colorRisk.riskyRatio * 100)}%（${colorStatus.label}）`,
    "",
    "四、請印刷店協助確認",
    "1. 我不是設計專業，想請貴店協助確認此檔案能否以目標尺寸輸出。",
    "2. 若需要轉成貴店可印的格式，請協助代為轉檔並告知是否需要加收處理費。",
    "3. 若解析度、出血、裁切、安全邊界或背景延伸不足，請直接告知需要補哪裡。",
    "4. 若畫面中的 Logo、徽章、邊緣或重要細節不適合直接輸出，請協助判斷是否要改用 PDF、AI、TIFF、PNG 或其他交付格式。",
    "5. 若正式大量印刷，請建議是否需要先做局部或小張打樣確認暗部、細節與色彩。",
    "",
    "備註",
    "此報告為客戶端初步數位檢查摘要，不保證實際印刷結果；正式輸出仍以印刷店規格、紙材、機台、ICC Profile、CMYK 轉換與打樣結果為準。",
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeFileStem(m.fileName)}-${dateStamp()}-print-check-report.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

function safeFileStem(fileName) {
  const stem = (fileName || "image").replace(/\.[^.]+$/, "");
  return stem.replace(/[\\/:*?"<>|]+/g, "-").slice(0, 80) || "image";
}

function dateStamp() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}
