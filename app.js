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
  currentFix: null,
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
  hasText: document.querySelector("#hasText"),
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
  fixLink: document.querySelector("#fixLink"),
  reuploadFixed: document.querySelector("#reuploadFixed"),
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
els.confirmOpenTool.addEventListener("click", confirmOpenTool);
els.fileInput.addEventListener("change", (event) => loadFile(event.target.files[0]));
els.analyzeButton.addEventListener("click", analyze);
els.copyShopMessage.addEventListener("click", copyShopMessage);
els.downloadReport.addEventListener("click", downloadReport);

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

[els.widthMm, els.heightMm, els.viewDistance, els.bleedMm, els.hasText, els.isLogoAsset, els.needsEditableLayers].forEach((el) => {
  el.addEventListener("input", () => {
    els.preset.value = "custom";
    analyze();
  });
});

async function loadFile(file) {
  if (!file || !file.type.startsWith("image/")) return;

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
  const textRisk = els.hasText.checked ? 14 : 0;
  const bleedScore = print.bleedMm >= 3 ? 10 : print.bleedMm > 0 ? 7 : 3;

  const dpiScore = scoreDpi(dpi.effective, print.distance);
  const sharpScore = scoreSharpness(sharpness) - textRisk;
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
    hasText: els.hasText.checked,
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
    statusForSharpness(data.sharpness, data.print.hasText).level,
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
  const label = total >= 85 ? "綠燈：可送印前處理" : total >= 70 ? "黃燈：建議修正後送印" : "紅燈：不建議直接送印";
  els.scoreBand.className = `score-band ${band}`;
  els.scoreLabel.textContent = label;
  els.scoreValue.textContent = total;

  setMetric(els.dpiMetric, els.dpiStatus, `${Math.round(metrics.dpi.effective)} DPI`, statusForDpi(metrics.dpi.effective, metrics.print.distance));
  setMetric(els.sharpMetric, els.sharpStatus, metrics.sharpness.toFixed(1), statusForSharpness(metrics.sharpness, metrics.print.hasText));
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
      summary: "同時需要可編輯圖層與向量化時，先決定主要目的：要重排版面先分層；要無限放大 Logo 則先向量化。",
      steps: [
        "先判斷主要目的：改物件、改文字、重排版面時，先用 Canva 魔法圖層。",
        "如果主要目的是 Logo / 圖示無限放大，先用 Inkscape Trace Bitmap 向量化。",
        "完成分層或向量化後，再確認輸出比例、出血與安全邊界。",
        "若最後仍是點陣輸出，再回本工具檢查有效 DPI；不足時才做 Upscayl 放大。",
        "最後做必要的降噪、銳化、CMYK 規格確認與 100% 局部打樣。",
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
      summary: "Logo / 圖示 / 徽章通常先考慮向量化；成功向量化後，就不需要先放大點陣圖。",
      steps: [
        "先確認圖片邊界是否清楚、背景是否乾淨、色塊是否簡單。",
        "用 Inkscape Trace Bitmap 轉成 SVG。",
        "清理節點、碎色塊與不必要的細節。",
        "輸出 SVG；若要交給印刷店，可另存 PDF。",
        "如果向量化結果變髒或檔案很重，改用高解析 PNG/PDF，不要硬轉。",
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
      "做 100% 局部打樣，確認臉、細線、暗部與色彩。",
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

function statusForDpi(dpi, distance) {
  const target = targets[distance];
  if (dpi >= target.green) return { level: "green", label: "足夠" };
  if (dpi >= target.yellow) return { level: "yellow", label: "勉強" };
  return { level: "red", label: "不足" };
}

function statusForSharpness(sharpness, hasText) {
  const adjusted = sharpness - (hasText ? 2 : 0);
  if (adjusted >= 10) return { level: "green", label: "清楚" };
  if (adjusted >= 5) return { level: "yellow", label: "需檢查" };
  return { level: "red", label: "偏糊" };
}

function statusForNoise(noise) {
  if (noise.speckleRatio < 0.08) return { level: "green", label: "乾淨" };
  if (noise.speckleRatio < 0.18) return { level: "yellow", label: "可接受" };
  return { level: "red", label: "偏髒" };
}

function statusForColor(risk) {
  if (risk.riskyRatio < 0.03 && risk.vividRatio < 0.12) return { level: "green", label: "低風險" };
  if (risk.riskyRatio < 0.1 && risk.vividRatio < 0.25) return { level: "yellow", label: "需打樣" };
  return { level: "red", label: "高風險" };
}

function statusForBleed(bleed) {
  if (bleed >= 3) return { level: "green", label: "標準" };
  if (bleed > 0) return { level: "yellow", label: "偏少" };
  return { level: "red", label: "缺出血" };
}

function renderAdvice(metrics) {
  const advice = [];
  const dpiStatus = statusForDpi(metrics.dpi.effective, metrics.print.distance);
  const colorStatus = statusForColor(metrics.colorRisk);
  const sharpStatus = statusForSharpness(metrics.sharpness, metrics.print.hasText);
  const bleedStatus = statusForBleed(metrics.print.bleedMm);

  if (dpiStatus.level === "red") {
    advice.push("有效 DPI 不足。這是依輸出尺寸推算的結果，建議先做超解析放大，或降低輸出尺寸。");
  } else if (dpiStatus.level === "yellow") {
    advice.push("有效 DPI 位於可接受邊緣，建議產生 100% A4 裁切打樣確認細節。");
  } else {
    advice.push("以目前輸出尺寸推算，有效 DPI 已達此用途的基本門檻。");
  }

  if (sharpStatus.level !== "green") {
    advice.push("畫面銳利度仍可改善，若含小字、細線或角色臉部，請局部放大檢查並視情況做輕度銳化。");
  }

  const noiseStatus = statusForNoise(metrics.noise);
  if (noiseStatus.level === "yellow") {
    advice.push("壓縮/噪點為可接受但仍可改善，建議輸出前做輕度降噪；若 Photopea 的 Reduce Noise 沒反應，可改用 Surface Blur 或 Median。");
  } else if (noiseStatus.level === "red") {
    advice.push("壓縮/噪點偏高，建議先做降噪或改用較乾淨的原始圖；若 Photopea 的 Reduce Noise 沒反應，可先確認圖層已點陣化。");
  }

  if (colorStatus.level !== "green") {
    advice.push("偵測到高飽和 RGB 色彩，這只是 CMYK 色偏風險估算；正式轉色仍建議交由印刷廠依 ICC Profile 處理並打樣。");
  } else {
    advice.push("CMYK 色偏風險估算偏低，但正式輸出仍應依印刷廠規格處理 CMYK。");
  }

  if (bleedStatus.level !== "green") {
    advice.push("出血設定不足，常見海報、貼紙、名片建議至少 3 mm。");
  } else {
    advice.push("出血數值已達常見標準，但目前只檢查你設定的出血值，仍需確認背景有延伸到出血外框。");
  }

  if (metrics.print.hasText) {
    advice.push("圖片內若有小字，最好在 Illustrator/Figma 重新排成向量文字。");
  }

  if (metrics.print.isLogoAsset) {
    advice.push("此圖已標記為 Logo / 圖示 / 徽章素材，可考慮使用 Inkscape Trace Bitmap 免費轉成 SVG；複雜角色圖或厚塗圖不建議硬轉向量。");
  }

  if (metrics.print.needsEditableLayers) {
    advice.push("此圖已標記為需要拆成可編輯圖層，可考慮使用 Canva 魔法圖層做粗略分層；分層結果仍需人工檢查與整理。");
  }

  if (dpiStatus.level === "green" && colorStatus.level === "green" && bleedStatus.level === "green" && sharpStatus.level === "green" && noiseStatus.level === "green") {
    advice.push("所有主要指標皆為綠燈，建議下一步做 100% 局部打樣，確認暗部、細線與色彩後再正式送印。");
  }

  els.adviceList.innerHTML = advice.map((item) => `<li>${item}</li>`).join("");
}

function renderFixRecommendation(metrics) {
  const plan = chooseFixPlan(metrics);
  state.currentFix = plan.primaryFix;
  els.fixTitle.textContent = plan.title;
  els.fixSummary.textContent = plan.summary;
  els.fixSteps.innerHTML = plan.steps.map((step) => `<li>${step}</li>`).join("");
  els.fixLink.textContent = plan.primaryFix ? `查看：${plan.primaryFix.linkText}` : "目前不需工具";
  els.fixLink.disabled = !plan.primaryFix || !plan.primaryFix.url;
}

function openToolDialog() {
  const fix = state.currentFix;
  if (!fix || !fix.url) return;
  els.dialogTitle.textContent = fix.title;
  els.dialogSummary.textContent = fix.summary;
  els.dialogTrustNote.textContent = fix.trustNote;
  if (typeof els.toolDialog.showModal === "function") {
    els.toolDialog.showModal();
  } else {
    confirmOpenTool();
  }
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
  els.copyShopMessage.textContent = "已複製";
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
    `檔案像素為 ${metrics.pixelWidth} x ${metrics.pixelHeight} px，目標輸出尺寸為 ${metrics.print.widthMm} x ${metrics.print.heightMm} mm，目前依尺寸估算的有效 DPI 約 ${Math.round(metrics.dpi.effective)}。`,
    `目前設定出血 ${metrics.print.bleedMm} mm，但仍需確認背景是否有延伸到出血區。`,
    metrics.print.isLogoAsset ? "這張圖屬於 Logo / 圖示 / 徽章素材，也想確認是否適合轉成 SVG 向量檔。" : "這張圖目前以點陣圖印刷檢查為主，不一定需要轉向量。",
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
      title: "目前可進入打樣",
      summary: "主要風險都已低於警戒線，下一步建議做 100% 局部打樣，而不是再套更多修復。",
      steps: proof.steps,
      primaryFix: proof,
    };
  }

  return {
    title: "建議修復順序",
    summary: "以下依建議處理順序排列。先做會改版面或結構的步驟，再做放大與細節修正。",
    steps: fixes.map((fix) => `${fix.title}：${fix.summary}`),
    primaryFix,
  };
}

function collectFixes(metrics) {
  const dpiStatus = statusForDpi(metrics.dpi.effective, metrics.print.distance);
  const sharpStatus = statusForSharpness(metrics.sharpness, metrics.print.hasText);
  const colorStatus = statusForColor(metrics.colorRisk);
  const bleedStatus = statusForBleed(metrics.print.bleedMm);
  const noiseStatus = statusForNoise(metrics.noise);
  const fixes = [];

  if (metrics.print.needsEditableLayers) fixes.push(canvaFix());
  if (metrics.print.isLogoAsset) fixes.push(inkscapeFix());
  if (bleedStatus.level !== "green") fixes.push(bleedFix());
  if (dpiStatus.level === "red" || (dpiStatus.level === "yellow" && !metrics.print.isLogoAsset)) fixes.push(upscaleFix(metrics));
  if (sharpStatus.level === "red") fixes.push(sharpenFix());
  if (noiseStatus.level !== "green") fixes.push(noiseFix(metrics));
  if (colorStatus.level !== "green") fixes.push(colorFix());
  if (metrics.print.hasText) fixes.push(textFix());

  return fixes;
}

function upscaleFix(metrics) {
  const upscale = getUpscalePreset(metrics);
  return {
    title: "修解析度：下載 Upscayl 桌面版",
    summary: `目前有效 DPI 約 ${upscale.currentDpi}，此用途建議達到約 ${upscale.targetDpi} DPI。建議先用 ${upscale.scale}x 放大，預估可到約 ${upscale.expectedDpi} DPI。`,
    trustNote: "Upscayl 是免費開源的 AI 圖片放大桌面軟體，圖片在本機電腦處理，適合把低解析 AI 圖先放大到接近印刷需求。處理速度取決於你的電腦 CPU/GPU，若電腦較慢請先用 2x。",
    linkText: "下載免費桌面版",
    url: "https://upscayl.io/",
    steps: [
      "打開 Upscayl 下載頁，下載 Windows 桌面版。",
      "安裝後在電腦上開啟 Upscayl，不需要使用線上 Dashboard。",
      "如果畫面出現 credits、Start free trial 或 Upgrade，代表你在雲端版，請回到下載頁改拿桌面版。",
      "匯入原圖。",
      `Resolution Scale 建議先選 ${upscale.scale}x。預估輸出約 ${upscale.outputWidth} x ${upscale.outputHeight} px。`,
      upscale.caution,
      "Model 建議先用 Upscayl Standard；如果是角色臉部可再測另一個模型比較細節。",
      "Output Format 選 PNG，避免用低品質 JPG。",
      "輸出後請放大看臉、文字、線條和暗部，不要只看縮圖。",
      "回到本工具，點重新上傳修正版檢查分數。",
    ],
  };
}

function bleedFix() {
  return {
    title: "補出血：使用 Photopea 調整畫布",
    summary: "出血不足會讓裁切後邊緣露白。先把畫布加大並保留重要內容在安全範圍內。",
    trustNote: "Photopea 是瀏覽器上的影像編輯器，操作方式接近 Photoshop，適合做裁切、畫布尺寸、出血、簡單銳化與輸出。正式 CMYK 仍建議依印刷廠規格處理。",
    linkText: "前往 Photopea",
    url: "https://www.photopea.com/",
    steps: [
      "在 Photopea 使用 File > Open 開啟圖片。",
      "用 Image > Canvas Size 將畫布左右上下各加 3 mm。",
      "把背景或圖像延伸到出血區，文字和 Logo 不要貼邊。",
      "匯出 PNG 或 PDF 後回來重新評估。",
    ],
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
      "若要印刷，最後仍需確認尺寸、出血、解析度與印刷店輸出規格。",
    ],
  };
}

function inkscapeFix() {
  return {
    title: "向量化圖示：使用 Inkscape Trace Bitmap",
    summary: "Logo / 圖示 / 徽章若邊界清楚、色塊簡單，可先用 Inkscape 免費轉成 SVG。",
    trustNote: "Inkscape 是免費開源的向量繪圖軟體，內建 Trace Bitmap 可把點陣圖描成 SVG。它適合 Logo、剪影、徽章、圖示與扁平素材；不適合厚塗角色圖、照片、複雜光影或很多漸層的 AI 圖。",
    linkText: "下載 Inkscape",
    url: "https://inkscape.org/",
    steps: [
      "下載並安裝 Inkscape。",
      "用 File > Import 匯入圖片。",
      "點選圖片，使用 Path > Trace Bitmap。",
      "黑白 Logo 可先試 Single Scan；彩色徽章可試 Multiple Scans / Colors。",
      "預覽邊緣是否乾淨，避免產生太多碎色塊。",
      "按 Apply 後，把原本的點陣圖移開或刪除，只保留描出的向量。",
      "存成 SVG；若要交給印刷店，可再另存 PDF。",
      "若結果變髒或檔案很重，代表這張圖不適合硬轉向量，請改用高解析 PNG/PDF。",
    ],
  };
}

function noiseFix(metrics) {
  const preset = getNoisePreset(metrics.noise);
  return {
    title: "改善噪點：使用 Photopea 備用降噪流程",
    summary: `目前壓縮/噪點建議用${preset.label}降噪。Reduce Noise 若沒反應，通常是沒有選到圖片圖層；也可改用 Surface Blur 或 Median。`,
    trustNote: "Photopea 的濾鏡需要套在一般點陣圖層上；如果圖層是文字、形狀、智慧物件或特殊圖層，可能要先 Rasterize。降噪只能降低髒點和壓縮感，不能補回缺失細節。",
    linkText: "前往 Photopea",
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
      "回到本工具，重新上傳修正版檢查分數。",
    ],
  };
}

function colorFix() {
  return {
    title: "檢查色偏：使用 Photopea 做 CMYK 預覽",
    summary: "高飽和 RGB 顏色轉印刷時可能變暗或變灰。先做 CMYK 預覽，再決定是否交給印刷店轉色。",
    trustNote: "Photopea 可用來初步觀察 RGB 轉印刷色的落差，但不同印刷廠會使用不同 ICC Profile、紙材與油墨。這一步是風險預覽，不是保證色準。",
    linkText: "前往 Photopea",
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

function proofFix() {
  return {
    title: "目前可進入打樣",
    summary: "主要風險都已低於警戒線。下一步建議產生 100% 局部打樣，確認細節和色彩。",
    trustNote: "數位評估只能預測風險，不能取代實體打樣。正式大量印刷前，最好先印 100% 局部小樣確認細節、暗部與色彩。",
    linkText: "查看打樣說明",
    url: "https://helpx.adobe.com/tw/acrobat/using/printing-pdfs-custom-sizes.html",
    steps: [
      "挑選畫面中最重要的區域，例如臉、Logo、小字或暗部。",
      "用實際尺寸裁切一塊 A4 可印範圍。",
      "先印小樣確認細節，再印完整海報。",
      "送印時附上本工具的檢查報告。",
    ],
  };
}

function downloadReport() {
  if (!state.metrics) return;
  const m = state.metrics;
  const workflow = chooseWorkflow(m);
  const fixPlan = chooseFixPlan(m);
  const fix = fixPlan.primaryFix || proofFix();
  const lines = [
    "AI 圖印刷前檢查與修復報告",
    `檔名：${m.fileName}`,
    `圖片像素：${m.pixelWidth} x ${m.pixelHeight} px`,
    `輸出尺寸：${m.print.widthMm} x ${m.print.heightMm} mm`,
    `有效 DPI：${Math.round(m.dpi.effective)}`,
    `總分：${m.scores.total}`,
    `出血：${m.print.bleedMm} mm`,
    `含小字/細線：${m.print.hasText ? "是" : "否"}`,
    `Logo / 圖示 / 徽章素材：${m.print.isLogoAsset ? "是" : "否"}`,
    `需要拆成可編輯圖層：${m.print.needsEditableLayers ? "是" : "否"}`,
    `銳利度估計：${m.sharpness.toFixed(2)}`,
    `高風險 RGB 色彩比例：${Math.round(m.colorRisk.riskyRatio * 100)}%`,
    `300 DPI 可印：約 ${formatPrintSize(m.pixelWidth, m.pixelHeight, 300)}`,
    `150 DPI 可印：約 ${formatPrintSize(m.pixelWidth, m.pixelHeight, 150)}`,
    `72 DPI 可印：約 ${formatPrintSize(m.pixelWidth, m.pixelHeight, 72)}`,
    "",
    "處理順序建議：",
    workflow.summary,
    ...workflow.steps.map((step, index) => `${index + 1}. ${step}`),
    "",
    "建議修復順序：",
    fixPlan.summary,
    ...fixPlan.steps.map((step, index) => `${index + 1}. ${step}`),
    "",
    `第一步工具：${fix.title}`,
    `工具說明：${fix.trustNote}`,
    "",
    "第一步操作：",
    ...fix.steps.map((step, index) => `${index + 1}. ${step}`),
    "",
    "給印刷店備註：",
    "此檔案為 AI 生成圖片的印刷前數位評估，不保證實際印刷結果。正式 CMYK 轉換請依店內 ICC Profile、紙材、總墨量與 PDF/X 規格處理。",
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
  
  function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
