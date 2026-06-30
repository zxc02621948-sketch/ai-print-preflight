const presets = {
  a3: { width: 297, height: 420, distance: "close" },
  a2: { width: 420, height: 594, distance: "poster" },
  a1: { width: 594, height: 841, distance: "poster" },
  "business-card": { width: 90, height: 54, distance: "close" },
  banner: { width: 3000, height: 900, distance: "far" },
};

// 依「實際輸出最長邊（mm）」決定可接受的有效 DPI 門檻。
// 印刷店實務：一般輸出一律以 300 DPI 為標準；只有大圖輸出才放寬，
// 因為做到 300 檔案會大到電腦跑不動，而且看的距離遠本來就不需要。
// 超過 300 不會更清楚，只是放大縮小的彈性空間；小尺寸門檻最高也是 300。
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
  unit: document.querySelector("#unit"),
  unitLabels: document.querySelectorAll(".unit-label"),
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

// 內部一律以 mm 計算；輸入框可切 mm / cm，此係數把「輸入值」換回 mm。
function unitFactor() {
  return els.unit && els.unit.value === "cm" ? 10 : 1;
}

function roundInput(value) {
  return Math.round(value * 100) / 100;
}

els.preset.addEventListener("change", () => {
  if (els.preset.value !== "custom") {
    const preset = presets[els.preset.value];
    const factor = unitFactor();
    els.widthMm.value = roundInput(preset.width / factor);
    els.heightMm.value = roundInput(preset.height / factor);
  }
  analyze();
});

els.unit.addEventListener("change", () => {
  // 切換單位時換算現有數值，讓實際尺寸維持不變（30mm ↔ 3cm）。
  const toCm = els.unit.value === "cm";
  const convert = toCm ? 0.1 : 10;
  els.widthMm.value = roundInput((Number(els.widthMm.value) || 0) * convert);
  els.heightMm.value = roundInput((Number(els.heightMm.value) || 0) * convert);
  const step = toCm ? "0.1" : "1";
  els.widthMm.step = step;
  els.heightMm.step = step;
  els.unitLabels.forEach((label) => {
    label.textContent = els.unit.value;
  });
  analyze();
});

[els.widthMm, els.heightMm, els.isLogoAsset, els.needsEditableLayers].forEach((el) => {
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
    els.simSlider.value = 50; // 每次載入新圖，判定線回到正中央
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
  els.emptyState.textContent = "目前只支援 PNG、JPG、WebP。SVG / PDF / AI 請在 Inkscape、Illustrator 或交由印刷店檢查；若要回本工具評估，請另存成 PNG、JPG 或 WebP。";
  els.analyzeButton.disabled = true;
  els.reuploadFixed.disabled = true;

  els.scoreBand.className = "score-band";
  els.scoreLabel.textContent = "格式不支援";
  els.scoreValue.textContent = "--";
  setMetric(els.dpiMetric, els.dpiStatus, "--", { level: "", label: "待圖片" });
  setMetric(els.sharpMetric, els.sharpStatus, "--", { level: "", label: "待圖片" });
  setMetric(els.noiseMetric, els.noiseStatus, "--", { level: "", label: "待圖片" });
  els.infoPixels.textContent = "--";
  els.infoTarget.textContent = "--";
  els.infoDpi.textContent = "--";
  els.infoUse.textContent = "--";
  els.workflowSummary.textContent = "SVG / PDF / AI 屬於向量或交付檔，請用專業編輯工具放大檢查，或匯出點陣圖後再回本工具檢查有效 DPI。";
  els.workflowSteps.innerHTML = "<li>若要檢查印刷解析度，請從向量工具匯出 PNG、JPG 或 WebP。</li><li>若要交付給店家，建議使用 PDF、AI、TIFF、PNG 或店家指定格式。</li>";
  els.adviceList.innerHTML = "<li>此工具不再替 SVG 打分，避免給出沒有實質意義的分數。</li>";
  els.fixTitle.textContent = "不支援此格式";
  els.fixSummary.textContent = "請改用 PNG、JPG、WebP 進行印刷前檢查。";
  els.fixSteps.innerHTML = "<li>SVG / PDF / AI 請回向量軟體或交由店家做交付檢查。</li>";
  els.fixTabs.innerHTML = "";
  els.fixStepLabel.textContent = "Format";
  els.fixStepTitle.textContent = "不支援此格式";
  els.fixStepSummary.textContent = "這類檔案比較適合在 Inkscape、Illustrator、Acrobat 或印刷店流程中確認。";
  els.fixStepTrustNote.textContent = "本工具專注檢查 AI 生成點陣圖的有效 DPI、清晰度與顆粒髒點。";
  els.fixStepList.innerHTML = "<li>若想回本工具檢查解析度，請先另存 PNG、JPG 或 WebP。</li><li>若已是正式交付檔，請交由印刷店確認 PDF/AI/TIFF/PNG 等格式需求。</li>";
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
  const dpiScore = scoreDpi(dpi.effective, print.dpiTargets);
  const sharpScore = scoreSharpness(sharpness);
  const noiseScore = scoreNoise(noise);
  const rawTotal = clamp(Math.round(dpiScore + sharpScore + noiseScore), 0, 100);
  const total = normalizeTotal(rawTotal, { dpi, print, sharpness, noise });

  state.metrics = {
    fileName: state.fileName,
    pixelWidth: state.image.naturalWidth,
    pixelHeight: state.image.naturalHeight,
    print,
    dpi,
    sharpness,
    noise,
    scores: { total, dpiScore, sharpScore, noiseScore },
  };

  renderMetrics(state.metrics);
}

function getPrintSettings() {
  const factor = unitFactor();
  const widthMm = (Number(els.widthMm.value) || 1) * factor;
  const heightMm = (Number(els.heightMm.value) || 1) * factor;
  return {
    widthMm,
    heightMm,
    unit: els.unit.value,
    dpiTargets: getDpiTargets(widthMm, heightMm),
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
  const label = total >= 85 ? "綠燈：可送印前處理" : total >= 70 ? "黃燈：建議修正後送印" : "紅燈：不建議直接送印";
  els.scoreBand.className = `score-band ${band}`;
  els.scoreLabel.textContent = label;
  els.scoreValue.textContent = total;

  setMetric(els.dpiMetric, els.dpiStatus, `${Math.round(metrics.dpi.effective)} DPI`, statusForDpi(metrics.dpi.effective, metrics.print.dpiTargets));
  setMetric(els.sharpMetric, els.sharpStatus, sharpnessWord(metrics.sharpness), statusForSharpness(metrics.sharpness));
  setMetric(els.noiseMetric, els.noiseStatus, noiseWord(metrics.noise), statusForNoise(metrics.noise));
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
      summary: "Logo / 圖示若也需要改物件，先處理版面與圖層，再回來檢查解析度；向量化只在超大輸出、改色拆物件或店家要求時再做。",
      steps: [
        "先確認輸出尺寸、方向、比例與留白。",
        "如果要重排物件或改版面，先用 Canva 魔法圖層或 Photopea / Illustrator 處理。",
        "回本工具檢查有效 DPI；不足時先用 Upscayl 放大，這是多數送印情境最簡單的路線。",
        "只有需要超大尺寸、長期重複使用、改色拆物件或店家要求向量檔時，再考慮 Inkscape Trace Bitmap。",
        "最後放大 100% 檢查邊緣、暗部與細節。",
      ],
    };
  }

  if (metrics.print.needsEditableLayers) {
    return {
      summary: "需要拆圖層時，先做會改版面的事情，再做放大；這樣檔案比較小，Canva / Photopea 也比較好處理。",
      steps: [
        "先確認輸出尺寸、方向、比例與留白。",
        "用 Canva 魔法圖層粗略拆分物件。",
        "先整理圖層、重排文字、調整物件與版面。",
        "匯出高解析 PNG 或 PDF。",
        "回到本工具重新檢查有效 DPI；如果不足，再用 Upscayl 放大。",
        "最後輕微清一下顆粒 / 銳化，再放大 100% 檢查細節。",
      ],
    };
  }

  if (metrics.print.isLogoAsset) {
    return {
      summary: "Logo / 圖示 / 徽章先走高解析 PNG/PDF 路線；向量化是進階選項，不是送印必做。",
      steps: [
        "先用本工具確認有效 DPI 與清晰度。",
        "如果 DPI 不足，先用 Upscayl 放大，通常比硬轉向量更快。",
        "放大後檢查邊緣、尖角和色塊是否乾淨。",
        "只有需要超大輸出、長期重複使用、改色拆物件或店家要求向量檔時，再用 Inkscape Trace Bitmap。",
        "向量化結果如果變髒或需要大量修節點，就回到高解析 PNG/PDF 路線。",
        "最後再交給印刷店確認可印格式與裁切需求。",
      ],
    };
  }

  return {
    summary: "一般 AI 海報或角色圖建議先處理版面，再放大；最後才做印刷輸出檢查。",
    steps: [
      "先決定輸出尺寸、方向與比例，確認是否需要裁切或補背景。",
      "先做會改版面的事情，例如裁切、補背景、重排文字或物件。",
      "回到本工具檢查有效 DPI；不足時再用 Upscayl 放大。",
      "放大後再輕微清顆粒與銳化，避免先修完又被放大破壞。",
      "放大 100% 檢查臉、邊緣、暗部與細節。",
      "最後依印刷店規格處理 CMYK、PDF/X 或其他交付格式。",
    ],
  };
}

// 把中間預覽圖變成「印刷後清晰度」對比：
// 左邊 = 此尺寸該有的清晰度（門檻 DPI），右邊 = 你的檔案實際細節。
// 模糊程度以「該尺寸的門檻」為基準（已含觀看距離），所以大圖低 DPI 不會被誤判成很糊。
function renderPrintSim(metrics) {
  const src = state.image;
  if (!src) return;

  const availW = Math.max(1, els.previewFrame.clientWidth - 4);
  const availH = Math.min(540, Math.round(window.innerHeight * 0.62)) || 540;
  // 預覽框依「輸出尺寸」的比例（而非原圖比例），讓使用者看到圖被印成這個形狀。
  // 兩層 <img> 都是 object-fit: fill，方形圖放進長方形框就會跟著變形。
  const aspect = (metrics.print.widthMm || 1) / (metrics.print.heightMm || 1);
  let dispW = availW;
  let dispH = Math.round(dispW / aspect);
  if (dispH > availH) {
    dispH = availH;
    dispW = Math.round(dispH * aspect);
  }
  dispW = Math.max(1, dispW);
  dispH = Math.max(1, dispH);
  els.printSim.style.width = `${dispW}px`;
  els.printSim.style.height = `${dispH}px`;

  const target = metrics.print.dpiTargets.green;
  const ratio = clamp(metrics.dpi.effective / target, 0, 1);

  // 「印出來的樣子」用「降採樣再放大」模擬真實的解析度不足：
  // 點不夠 = 細節變柔，但大形狀／輪廓仍清楚——這跟真實印刷一致。
  // 不再用高斯模糊（會無差別把整張圖抹霧，比實際印刷糊很多）。
  // DPI 足夠時直接用原圖，兩層像素級一致。
  els.simActual.style.filter = "none";
  if (ratio >= 0.999) {
    els.simActual.src = els.previewImage.src;
  } else {
    els.simActual.src = downsampleDataUrl(src, dispW, dispH, ratio);
  }

  setSimSlider(Number(els.simSlider.value));
  renderSimCaption(metrics, ratio);
  els.printSim.hidden = false;
  els.simCaption.hidden = false;
  els.emptyState.style.display = "none";
}

// 先把圖縮到「實際印得出來的細節量」（ratio×顯示尺寸），再放大回顯示尺寸。
// 大形狀保持清楚、只有細節變柔，比高斯模糊更接近真實低解析印刷。
function downsampleDataUrl(src, dispW, dispH, ratio) {
  const lowW = Math.max(1, Math.round(dispW * ratio));
  const lowH = Math.max(1, Math.round(dispH * ratio));
  const small = document.createElement("canvas");
  small.width = lowW;
  small.height = lowH;
  const sctx = small.getContext("2d");
  sctx.imageSmoothingEnabled = true;
  sctx.imageSmoothingQuality = "high";
  sctx.drawImage(src, 0, 0, lowW, lowH);

  const out = document.createElement("canvas");
  out.width = dispW;
  out.height = dispH;
  const octx = out.getContext("2d");
  octx.imageSmoothingEnabled = true;
  octx.imageSmoothingQuality = "high";
  octx.drawImage(small, 0, 0, lowW, lowH, 0, 0, dispW, dispH);
  return out.toDataURL("image/png");
}

function setSimSlider(value) {
  const val = clamp(value, 0, 100);
  els.previewImage.style.clipPath = `inset(0 ${100 - val}% 0 0)`;
  els.simDivider.style.left = `${val}%`;
  // 哪半邊變大，那邊標籤就清楚；縮小的那半邊淡出，拉到底就消失（取代操作說明）。
  els.simTagLeft.style.opacity = clamp((val / 100) * 1.6, 0, 1);
  els.simTagRight.style.opacity = clamp(((100 - val) / 100) * 1.6, 0, 1);
}

function renderSimCaption(metrics, ratio) {
  const eff = Math.round(metrics.dpi.effective);
  const target = metrics.print.dpiTargets.green;
  if (ratio >= 0.999) {
    els.simCaption.textContent = `你的圖 ${eff} DPI，已達這尺寸需要的 ${target} DPI——印出來和螢幕上看到的幾乎一樣，不會糊。`;
  } else {
    const pct = Math.round(ratio * 100);
    els.simCaption.textContent = `你的圖 ${eff} DPI，這尺寸建議 ${target} DPI——印出來會比螢幕上看到的糊一點，只剩約 ${pct}% 細節（僅示意，實際以印刷店為準）。`;
  }
}

function hidePrintSim() {
  els.printSim.hidden = true;
  els.simCaption.hidden = true;
  els.emptyState.style.display = "block";
}

function renderImageInfo(metrics) {
  els.infoPixels.textContent = `${metrics.pixelWidth} x ${metrics.pixelHeight} px`;
  const unit = metrics.print.unit || "mm";
  const div = unit === "cm" ? 10 : 1;
  els.infoTarget.textContent = `${roundInput(metrics.print.widthMm / div)} x ${roundInput(metrics.print.heightMm / div)} ${unit}`;
  els.infoDpi.textContent = `${Math.round(metrics.dpi.effective)} DPI`;
  els.infoUse.textContent = getUseLabel();
}

function getUseLabel() {
  const selected = els.preset.options[els.preset.selectedIndex];
  return selected ? selected.textContent : "自訂尺寸";
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
  if (dpi >= target.green) return { level: "green", label: "足夠" };
  if (dpi >= target.yellow) return { level: "yellow", label: "勉強" };
  return { level: "red", label: "不足" };
}

function statusForSharpness(sharpness) {
  if (sharpness >= 10) return { level: "green", label: "可直接用" };
  if (sharpness >= 5) return { level: "yellow", label: "建議局部檢查" };
  return { level: "red", label: "建議銳化" };
}

// 大字：用白話描述「原圖本身夠不夠銳」（跟解析度無關，DPI 夠但拍糊/畫糊也會偏糊）
function sharpnessWord(sharpness) {
  if (sharpness >= 10) return "清楚";
  if (sharpness >= 5) return "略偏糊";
  return "偏糊";
}

function statusForNoise(noise) {
  if (noise.speckleRatio < 0.08) return { level: "green", label: "可直接用" };
  if (noise.speckleRatio < 0.18) return { level: "yellow", label: "輸出前清一下" };
  return { level: "red", label: "建議清掉" };
}

// 大字：用白話描述「AI 圖常有的顆粒 / 髒點」多不多（傳統印刷圖少見，對比圖也看不出來）
function noiseWord(noise) {
  if (noise.speckleRatio < 0.08) return "乾淨";
  if (noise.speckleRatio < 0.18) return "有點顆粒";
  return "顆粒偏多";
}

function renderAdvice(metrics) {
  const advice = [];
  const dpiStatus = statusForDpi(metrics.dpi.effective, metrics.print.dpiTargets);
  const sharpStatus = statusForSharpness(metrics.sharpness);

  const dpiTargets = metrics.print.dpiTargets;
  if (dpiStatus.level === "red") {
    advice.push("有效 DPI 不足。這是依輸出尺寸推算的結果，建議先做超解析放大，或降低輸出尺寸。");
  } else if (dpiStatus.level === "yellow") {
    advice.push("有效 DPI 位於可接受邊緣，建議放大 100% 自己檢查臉、字與邊緣細節。");
  } else if (metrics.dpi.effective > dpiTargets.green * 1.5) {
    advice.push(`有效 DPI 已遠超過此尺寸所需（這個尺寸約 ${dpiTargets.green} DPI 就足夠）。多出來的解析度不會讓印刷更清楚，只是放大縮小的彈性空間，不用特地追更高——例如小圖做到 1000 DPI 並沒有幫助。`);
  } else {
    advice.push("以目前輸出尺寸推算，有效 DPI 已達此用途的門檻。");
  }

  if (sharpStatus.level !== "green") {
    advice.push("畫面銳利度仍可改善，若含角色臉部、Logo 邊緣或重要細節，請局部放大檢查並視情況做輕度銳化。");
  }

  const noiseStatus = statusForNoise(metrics.noise);
  if (noiseStatus.level === "yellow") {
    advice.push("畫面有一些顆粒/髒點（AI 圖常見），可接受但仍可改善，建議輸出前輕微清一下；用 Photopea 的 Reduce Noise（清顆粒）；若沒反應，可改用 Surface Blur 或 Median。");
  } else if (noiseStatus.level === "red") {
    advice.push("顆粒/髒點偏多（AI 圖常見），建議先用 Photopea 的 Reduce Noise（清顆粒）清掉，或改用較乾淨的原始圖；若沒反應，可先確認圖層已點陣化。");
  }

  advice.push("顏色本工具不評估：螢幕是 RGB，印出來通常會偏一點（亮藍、亮綠、螢光色最明顯），實際顏色以印刷店為準。");

  advice.push("出血是裁切用的預留邊，AI 圖通常沒有。如果要印到紙的最邊邊（名片、貼紙、滿版海報），送印時跟印刷店說一聲，請他們幫你留邊就好。");

  if (metrics.print.isLogoAsset) {
    advice.push("此圖已標記為 Logo / 圖示 / 徽章素材；多數送印情境先用高解析 PNG/PDF 即可。只有超大輸出、長期重複使用、改色拆物件或店家要求時，再考慮向量化。");
  }

  if (metrics.print.needsEditableLayers) {
    advice.push("此圖已標記為需要拆成可編輯圖層，可考慮使用 Canva 魔法圖層做粗略分層；分層結果仍需人工檢查與整理。");
  }

  if (dpiStatus.level === "green" && sharpStatus.level === "green" && noiseStatus.level === "green") {
    advice.push("主要指標皆為綠燈，放大 100% 檢查暗部、邊緣與細節沒問題就可以送印。");
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
      return `<button class="fix-tab" type="button" role="tab" aria-selected="${selected}" data-fix-index="${index}">第 ${index + 1} 步：${shortFixTitle(fix.title)}</button>`;
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
    els.fixStepTitle.textContent = "等待評估";
    els.fixStepSummary.textContent = "上傳圖片後會顯示單一步驟的完整教學。";
    els.fixStepTrustNote.textContent = "工具說明會顯示在這裡。";
    els.fixStepTrustNote.style.display = "block";
    els.fixStepList.innerHTML = "<li>先上傳一張 AI 圖。</li>";
    renderExtraGuides([]);
    els.fixLink.textContent = "查看工具";
    els.fixLink.disabled = true;
    els.fixPrev.disabled = true;
    els.fixNext.disabled = true;
    return;
  }

  const stepNumber = state.activeFixIndex + 1;
  els.fixStepLabel.textContent = `第 ${stepNumber} 步 / 共 ${fixes.length} 步`;
  els.fixStepTitle.textContent = fix.title;
  els.fixStepSummary.textContent = fix.summary;
  els.fixStepTrustNote.textContent = formatTrustNote(fix.trustNote, fix.versionHint);
  els.fixStepTrustNote.style.display = fix.trustNote ? "block" : "none";
  els.fixStepList.innerHTML = fix.steps.map((step) => `<li>${step}</li>`).join("");
  renderExtraGuides(fix.extraGuides || []);
  els.fixLink.textContent = fix.url ? `查看：${fix.linkText}` : "目前不需工具";
  els.fixLink.disabled = !fix.url;

  const previousFix = fixes[state.activeFixIndex - 1];
  const nextFix = fixes[state.activeFixIndex + 1];
  els.fixPrev.textContent = previousFix ? `上一步：${shortFixTitle(previousFix.title)}` : "上一步";
  els.fixNext.textContent = nextFix ? `下一步：${shortFixTitle(nextFix.title)}` : "下一步";
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
          "MSI 是 Windows 安裝包格式，不是微星顯卡，照一般安裝流程下一步即可。",
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
          "預覽看起來乾淨再按「套用（Apply）」；如果預覽已經很髒，通常代表不適合硬轉。",
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

function getNoisePreset(noise) {
  if (noise.speckleRatio < 0.1) {
    return {
      label: "輕度",
      strength: 4,
      protectDetail: 45,
      colorNoise: 10,
      note: "目前顆粒在可接受範圍，先用輕度設定，重點是保留材質和細線。",
    };
  }
  if (noise.speckleRatio < 0.18) {
    return {
      label: "中度",
      strength: 6,
      protectDetail: 35,
      colorNoise: 15,
      note: "顆粒已經會影響暗部，先用中度設定，再用預覽確認細節沒有被抹平。",
    };
  }
  return {
    label: "偏重",
    strength: 8,
    protectDetail: 25,
    colorNoise: 20,
    note: "顆粒偏多，但仍不建議一次拉滿；先處理髒點，再檢查邊緣和文字。",
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

  let caution = "2x 通常最自然，細節比較不容易出現 AI 放大痕跡。";
  if (scale === 4) {
    caution = "4x 可補足較大的 DPI 缺口，但請檢查臉部、文字、邊緣是否出現假細節。";
  } else if (scale === 8) {
    caution = "8x 很容易產生假細節或處理失敗，建議先確認是否能降低輸出尺寸；必要時才使用 8x。";
  } else if (scale === 1) {
    caution = "目前 DPI 已接近目標，通常不需要放大；若只是想更穩，可先放大 100% 自己檢查。";
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
      title: "目前可以送印",
      summary: "主要風險都已低於警戒線，送印前自己放大檢查一下重點區域就好。",
      steps: [`${ok.title}：${ok.summary}`],
      fixes: [ok],
      primaryFix: ok,
    };
  }

  return {
    title: "建議修復順序",
    summary: "以下依建議處理順序排列。先做會改版面或結構的步驟，再做放大與細節修正。",
    steps: fixes.map((fix) => `${fix.title}：${fix.summary}`),
    fixes,
    primaryFix,
  };
}

function collectFixes(metrics) {
  const dpiStatus = statusForDpi(metrics.dpi.effective, metrics.print.dpiTargets);
  const sharpStatus = statusForSharpness(metrics.sharpness);
  const noiseStatus = statusForNoise(metrics.noise);
  const fixes = [];

  if (metrics.print.needsEditableLayers) fixes.push(canvaFix());
  if (dpiStatus.level === "red" || dpiStatus.level === "yellow") fixes.push(upscaleFix(metrics));
  if (sharpStatus.level === "red") fixes.push(sharpenFix());
  if (noiseStatus.level !== "green") fixes.push(noiseFix(metrics));

  return fixes;
}

function upscaleFix(metrics) {
  const upscale = getUpscalePreset(metrics);
  const isLogoAsset = metrics.print.isLogoAsset;
  const title = "修解析度：下載 Upscayl 桌面版";
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
    "回到本工具，點重新上傳修正版檢查分數。",
  ];

  return {
    title,
    summary,
    trustNote,
    linkText: "下載免費桌面版",
    url: "https://upscayl.io/",
    steps,
  };
}

function sharpenFix() {
  return {
    title: "改善模糊：使用 Photopea 銳化",
    summary: "畫面偏糊時，印出來會更明顯。先做輕度銳化，並用 100% 局部檢查臉部、線條與文字。",
    trustNote: "Photopea 可直接在瀏覽器做基礎修圖，不需要安裝大型軟體。銳化只能改善邊緣觀感，不能真正補回不存在的細節。",
    linkText: "前往 Photopea",
    url: "https://www.photopea.com/",
    steps: [
      "在 Photopea 開啟圖片。",
      "使用 Filter > Sharpen > Smart Sharpen 或 Sharpen。",
      "銳化不要過量，避免邊緣出現白邊或髒點。",
      "匯出 PNG 後回來重新評估。",
    ],
  };
}

function canvaFix() {
  return {
    title: "拆成可編輯圖層：使用 Canva 魔法圖層",
    summary: "先用 Canva 魔法圖層做粗略分層，再手動整理物件、文字與版面。",
    trustNote: "Canva 魔法圖層適合把圖片粗略拆成可編輯元素，方便後續重排、替換或微調。它不是專業向量化，也不保證能完美分離所有物件；複雜厚塗、煙霧、髮絲或細碎光效仍需要人工檢查。",
    linkText: "前往 Canva",
    url: "https://www.canva.com/",
    steps: [
      "打開 Canva 並建立或開啟一個設計。",
      "上傳圖片並放到畫布上。",
      "點選圖片。",
      "點選編輯圖片或 Edit image。",
      "在工具中選擇魔法圖層。",
      "等待 Canva 粗略拆分圖層。",
      "檢查每個圖層是否拆得合理，必要時手動刪除、重排或修正。",
      "若要印刷，最後仍需確認尺寸、解析度與印刷店輸出規格。",
    ],
  };
}

function inkscapeFix() {
  return {
    title: "向量化圖示：使用 Inkscape Trace Bitmap",
    summary: "Logo / 圖示 / 徽章若邊界清楚、色塊簡單，可先用 Inkscape 免費轉成 SVG。",
    trustNote: "Inkscape 是免費、開源的向量繪圖軟體。開源代表程式原始碼公開，社群可以檢查與改進，比來路不明的轉檔網站更透明；仍建議只從 inkscape.org 官方頁下載。它內建 Trace Bitmap，可把點陣圖描成 SVG，適合 Logo、剪影、徽章、圖示與扁平素材；不適合厚塗角色圖、照片或複雜漸層。",
    linkText: "前往 Inkscape 1.4.4 下載頁",
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
              "如果印刷店只是需要可印檔，不一定需要 SVG；可以直接把原檔交給店家，請他們代轉 PDF。",
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
              "大量印刷前先自己放大 100% 檢查重點區域。",
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
    title: "清掉顆粒髒點：使用 Photopea（Reduce Noise）",
    summary: `畫面有 AI 圖常見的顆粒/髒點，建議用${preset.label}強度清掉。Photopea 的 Reduce Noise（清顆粒）若沒反應，通常是沒有選到圖片圖層；也可改用 Surface Blur 或 Median。`,
    trustNote: "Photopea 的濾鏡需要套在一般點陣圖層上；如果圖層是文字、形狀、智慧物件或特殊圖層，可能要先 Rasterize。清顆粒只能降低髒點和壓縮感，不能補回缺失細節。",
    linkText: "前往 Photopea",
    url: "https://www.photopea.com/",
    steps: [
      "在 Photopea 開啟圖片。",
      "先在右側 Layers 面板點選圖片圖層；如果沒有選到圖層，濾鏡可能看起來沒反應。",
      "選 Filter > Noise > Reduce Noise，先確認 Preview 有勾選。",
      `建議起始值：Strength ${preset.strength}、Protect Detail ${preset.protectDetail}%、Reduce Color Noise ${preset.colorNoise}%。`,
      preset.note,
      "如果畫面變太塑膠或金線/碎片消失，把 Strength 降 1-2，或把 Protect Detail 提高 10%。",
      "如果顆粒還很明顯，把 Strength 加 1，但不要一次拉到最高。",
      "Reduce Noise 仍無法使用時，改試 Filter > Blur > Surface Blur，或 Filter > Noise > Median，Median 從 1 或 2 開始。",
      "匯出 PNG，避免再次存成低品質 JPG。",
      "回到本工具，重新上傳修正版檢查分數。",
    ],
  };
}

function textFix() {
  return {
    title: "重排小字：使用 Photopea 或 Illustrator",
    summary: "圖片內的小字最容易印糊。若這是正式海報或名片，最好把文字重新排成向量或高解析文字圖層。",
    trustNote: "AI 圖裡的小字常常不是乾淨字型，放大後也容易糊。用編輯工具重新排文字，通常比修原圖更可靠。",
    linkText: "前往 Photopea",
    url: "https://www.photopea.com/",
    steps: [
      "開啟原圖作為底圖。",
      "用文字工具重新打上小字，不要直接依賴 AI 圖裡的字。",
      "文字離裁切邊至少保留安全距離。",
      "匯出後回到本工具重新評估。",
    ],
  };
}

function finalCheckFix() {
  return {
    title: "可以送印：自己放大檢查一下",
    summary: "主要風險都過關了。送印前自己把圖放到 100% 看一遍重點區域就好。",
    trustNote: "數位檢查只能估風險，不代表保證印刷結果；正式輸出仍以印刷店規格與實際輸出為準。",
    steps: [
      "把圖放大到 100%，檢查臉、文字、Logo、邊緣和暗部。",
      "確認重要的字、Logo 沒有貼到紙的最邊邊。",
      "沒問題就可以把圖檔交給印刷店輸出。",
    ],
  };
}
