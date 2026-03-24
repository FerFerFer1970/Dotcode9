const el = (id) => document.getElementById(id);

const payloadEl = el('payload');
const replaceEl = el('replaceText');
const emptyEl = el('emptyCellText');

const singleModeEl = el('singleGridTextMode');
const singleTextEl = el('singleGridText');

const useGs1El = el('useGs1');
const repeatEl = el('repeatReplaceText');
const fullGridEl = el('fillFullGrid');
const showGridEl = el('showGrid');

const outerRowsTopEl = el('outerRowsTop');
const outerRowsBottomEl = el('outerRowsBottom');
const outerColsLeftEl = el('outerColsLeft');
const outerColsRightEl = el('outerColsRight');
const outerOnBaseEl = el('outerOnBase');

const cellSizeMmEl = el('cellSizeMm');
const gridWidthMmEl = el('gridWidthMm');
const gridHeightMmEl = el('gridHeightMm');

const dotOffsetXmmEl = el('dotOffsetXmm');
const dotOffsetYmmEl = el('dotOffsetYmm');
const dotTextOffsetXmmEl = el('dotTextOffsetXmm');
const dotTextOffsetYmmEl = el('dotTextOffsetYmm');
const emptyTextOffsetXmmEl = el('emptyTextOffsetXmm');
const emptyTextOffsetYmmEl = el('emptyTextOffsetYmm');
const dotImageOffsetXmmEl = el('dotImageOffsetXmm');
const dotImageOffsetYmmEl = el('dotImageOffsetYmm');
const emptyImageOffsetXmmEl = el('emptyImageOffsetXmm');
const emptyImageOffsetYmmEl = el('emptyImageOffsetYmm');
const dotDiameterRatioEl = el('dotDiameterRatio');

const metricColsEl = el('metricCols');
const metricRowsEl = el('metricRows');
const metricWidthMmEl = el('metricWidthMm');
const metricHeightMmEl = el('metricHeightMm');
const metricWidthPxEl = el('metricWidthPx');
const metricHeightPxEl = el('metricHeightPx');

const scaleEl = el('scale');
const paddingEl = el('padding');
const finalSizeEl = el('finalSize');
const outputDpiEl = el('outputDpi');
const outputDpiMirrorEl = el('outputDpiMirror');

const dotFontSizeMmEl = el('dotFontSizeMm');
const emptyFontSizeMmEl = el('emptyFontSizeMm');

const dotFontFamilyEl = el('dotFontFamily');
const emptyFontFamilyEl = el('emptyFontFamily');

const useEmbeddedFontsEl = el('useEmbeddedFonts');
const dotFontFileLabelEl = el('dotFontFileLabel');
const emptyFontFileLabelEl = el('emptyFontFileLabel');

const dotTextStrokeWidthMmEl = el('dotTextStrokeWidthMm');
const emptyTextStrokeWidthMmEl = el('emptyTextStrokeWidthMm');
const dotTextStrokeColorEl = el('dotTextStrokeColor');
const emptyTextStrokeColorEl = el('emptyTextStrokeColor');
const textStrokeJoinEl = el('textStrokeJoin');

const showRulersEl = el('showRulers');
const rulerStepMmEl = el('rulerStepMm');
const rulerMajorTickMmEl = el('rulerMajorTickMm');

const useImagesEl = el('useImages');
const dotUseImageEl = el('dotUseImage');
const emptyUseImageEl = el('emptyUseImage');

const dotImageScaleEl = el('dotImageScale');
const emptyImageScaleEl = el('emptyImageScale');
const dotImageFitEl = el('dotImageFit');
const emptyImageFitEl = el('emptyImageFit');

const dotImageRotateEl = el('dotImageRotate');
const emptyImageRotateEl = el('emptyImageRotate');
const dotImageOpacityEl = el('dotImageOpacity');
const emptyImageOpacityEl = el('emptyImageOpacity');

const dotImageLabelEl = el('dotImageLabel');
const emptyImageLabelEl = el('emptyImageLabel');

const includePayloadInFilenameEl = el('includePayloadInFilename');
const printPayloadLegendEl = el('printPayloadLegend');
const legendFontSizeMmEl = el('legendFontSizeMm');
const legendMarginMmEl = el('legendMarginMm');

const enableLoupeEl = el('enableLoupe');
const loupeZoomEl = el('loupeZoom');
const loupeSizePxEl = el('loupeSizePx');

const bgColorEl = el('bgColor');
const dotColorEl = el('dotColor');
const emptyColorEl = el('emptyColor');
const gridColorEl = el('gridColor');

const sequenceModeEl = el('sequenceMode');
const sequenceStrategyEl = el('sequenceStrategy');
const sequenceStartEl = el('sequenceStart');
const sequenceCountEl = el('sequenceCount');
const sequenceStepEl = el('sequenceStep');
const sequenceWidthEl = el('sequenceWidth');
const sequenceSliceStartEl = el('sequenceSliceStart');
const sequenceSliceLengthEl = el('sequenceSliceLength');
const sequencePrefixEl = el('sequencePrefix');
const sequenceSuffixEl = el('sequenceSuffix');
const sequenceNumberStartEl = el('sequenceNumberStart');

const outputFormatEl = el('outputFormat');
const outputPrefixEl = el('outputPrefix');

const outDirEl = el('outDir');
const statusEl = el('status');
const frame = el('previewFrame');
const previewBox = el('previewBox');
const loupe = el('loupe');
const loupeFrame = el('loupeFrame');

const tabReplaced = el('tabReplaced');
const tabBase = el('tabBase');

let outDir = null;
let activeView = 'replaced';
let lastSvgs = { baseSvg: null, replacedSvg: null };
let lastMetrics = null;

let dotImage = null;
let emptyImage = null;
let dotEmbeddedFont = null;
let emptyEmbeddedFont = null;

function setStatus(msg) {
  statusEl.textContent = msg;
}

function syncDpiInputs(source, target) {
  target.value = source.value;
}

outputDpiEl.addEventListener('input', () => syncDpiInputs(outputDpiEl, outputDpiMirrorEl));
outputDpiMirrorEl.addEventListener('input', () => syncDpiInputs(outputDpiMirrorEl, outputDpiEl));

function setTab(view) {
  activeView = view;
  tabReplaced.classList.toggle('active', view === 'replaced');
  tabBase.classList.toggle('active', view === 'base');
  renderPreview();
}

tabReplaced.onclick = () => setTab('replaced');
tabBase.onclick = () => setTab('base');

function getOpts() {
  return {
    payload: payloadEl.value,
    replaceText: replaceEl.value,
    emptyCellText: emptyEl.value,

    singleGridTextMode: singleModeEl.checked,
    singleGridText: singleTextEl.value,

    useGs1: useGs1El.checked,
    repeatReplaceText: repeatEl.checked,
    fillFullGrid: fullGridEl.checked,
    showGrid: showGridEl.checked,

    outerRowsTop: outerRowsTopEl.value,
    outerRowsBottom: outerRowsBottomEl.value,
    outerColsLeft: outerColsLeftEl.value,
    outerColsRight: outerColsRightEl.value,
    outerOnBase: outerOnBaseEl.checked,

    cellSizeMm: cellSizeMmEl.value,
    gridWidthMm: gridWidthMmEl.value,
    gridHeightMm: gridHeightMmEl.value,

    dotOffsetXmm: dotOffsetXmmEl.value,
    dotOffsetYmm: dotOffsetYmmEl.value,
    dotTextOffsetXmm: dotTextOffsetXmmEl.value,
    dotTextOffsetYmm: dotTextOffsetYmmEl.value,
    emptyTextOffsetXmm: emptyTextOffsetXmmEl.value,
    emptyTextOffsetYmm: emptyTextOffsetYmmEl.value,
    dotImageOffsetXmm: dotImageOffsetXmmEl.value,
    dotImageOffsetYmm: dotImageOffsetYmmEl.value,
    emptyImageOffsetXmm: emptyImageOffsetXmmEl.value,
    emptyImageOffsetYmm: emptyImageOffsetYmmEl.value,
    dotDiameterRatio: dotDiameterRatioEl.value,

    scale: scaleEl.value,
    padding: paddingEl.value,
    finalSize: finalSizeEl.value,
    outputDpi: outputDpiEl.value,

    dotFontSizeMm: dotFontSizeMmEl.value,
    emptyFontSizeMm: emptyFontSizeMmEl.value,

    dotFontFamily: dotFontFamilyEl.value,
    emptyFontFamily: emptyFontFamilyEl.value,

    useEmbeddedFonts: useEmbeddedFontsEl.checked,
    dotEmbeddedFont,
    emptyEmbeddedFont,

    dotTextStrokeWidthMm: dotTextStrokeWidthMmEl.value,
    emptyTextStrokeWidthMm: emptyTextStrokeWidthMmEl.value,
    dotTextStrokeColor: dotTextStrokeColorEl.value,
    emptyTextStrokeColor: emptyTextStrokeColorEl.value,
    textStrokeJoin: textStrokeJoinEl.value,

    showRulers: showRulersEl.checked,
    rulerStepMm: rulerStepMmEl.value,
    rulerMajorTickMm: rulerMajorTickMmEl.value,

    useImages: useImagesEl.checked,
    dotUseImage: dotUseImageEl.checked,
    emptyUseImage: emptyUseImageEl.checked,
    dotImage,
    emptyImage,
    dotImageScale: dotImageScaleEl.value,
    emptyImageScale: emptyImageScaleEl.value,
    dotImageFit: dotImageFitEl.value,
    emptyImageFit: emptyImageFitEl.value,
    dotImageRotate: dotImageRotateEl.value,
    emptyImageRotate: emptyImageRotateEl.value,
    dotImageOpacity: dotImageOpacityEl.value,
    emptyImageOpacity: emptyImageOpacityEl.value,

    includePayloadInFilename: includePayloadInFilenameEl.checked,
    printPayloadLegend: printPayloadLegendEl.checked,
    legendFontSizeMm: legendFontSizeMmEl.value,
    legendMarginMm: legendMarginMmEl.value,

    enableLoupe: enableLoupeEl.checked,
    loupeZoom: loupeZoomEl.value,
    loupeSizePx: loupeSizePxEl.value,

    style: {
      bgColor: bgColorEl.value,
      dotColor: dotColorEl.value,
      emptyColor: emptyColorEl.value,
      gridColor: gridColorEl.value,
    },

    sequenceMode: sequenceModeEl.checked,
    sequenceStrategy: sequenceStrategyEl.value,
    sequenceStart: sequenceStartEl.value,
    sequenceCount: sequenceCountEl.value,
    sequenceStep: sequenceStepEl.value,
    sequenceWidth: sequenceWidthEl.value,
    sequenceSliceStart: sequenceSliceStartEl.value,
    sequenceSliceLength: sequenceSliceLengthEl.value,
    sequencePrefix: sequencePrefixEl.value,
    sequenceSuffix: sequenceSuffixEl.value,
    sequenceNumberStart: sequenceNumberStartEl.value,

    outputFormat: outputFormatEl.value,
    outputPrefix: outputPrefixEl.value,
  };
}

function applyLoupeStyle() {
  const size = Math.max(80, Number(loupeSizePxEl.value) || 260);
  loupe.style.width = `${size}px`;
  loupe.style.height = `${size}px`;
}

function renderPreview() {
  const svg = activeView === 'base' ? lastSvgs.baseSvg : lastSvgs.replacedSvg;
  if (!svg) return;

  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  frame.src = url;
  loupeFrame.src = url;

  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function updateMetrics(metrics) {
  if (!metrics) return;
  metricColsEl.textContent = String(metrics.cols);
  metricRowsEl.textContent = String(metrics.rows);
  metricWidthMmEl.textContent = Number(metrics.widthMm).toFixed(2);
  metricHeightMmEl.textContent = Number(metrics.heightMm).toFixed(2);
  metricWidthPxEl.textContent = String(Math.round(metrics.widthPx));
  metricHeightPxEl.textContent = String(Math.round(metrics.heightPx));
}

function updateLoupePosition(clientX, clientY) {
  if (!enableLoupeEl.checked || activeView !== 'replaced') {
    loupe.style.display = 'none';
    return;
  }

  const rect = previewBox.getBoundingClientRect();
  const localX = clientX - rect.left;
  const localY = clientY - rect.top;

  if (localX < 0 || localY < 0 || localX > rect.width || localY > rect.height) {
    loupe.style.display = 'none';
    return;
  }

  loupe.style.display = 'block';
  applyLoupeStyle();

  const zoom = Math.max(1, Number(loupeZoomEl.value) || 4);
  const size = Math.max(80, Number(loupeSizePxEl.value) || 260);

  const iframeWidth = previewBox.clientWidth;
  const iframeHeight = previewBox.clientHeight;

  loupeFrame.style.width = `${iframeWidth}px`;
  loupeFrame.style.height = `${iframeHeight}px`;

  const tx = -(localX * zoom - size / 2);
  const ty = -(localY * zoom - size / 2);

  loupeFrame.style.transform = `translate(${tx}px, ${ty}px) scale(${zoom})`;
}

previewBox.addEventListener('mousemove', (e) => updateLoupePosition(e.clientX, e.clientY));
previewBox.addEventListener('mouseleave', () => {
  loupe.style.display = 'none';
});

let t = null;
function refreshPreviewDebounced() {
  clearTimeout(t);
  t = setTimeout(refreshPreviewNow, 250);
}

async function refreshPreviewNow() {
  try {
    setStatus('Renderizando vista previa...');
    const res = await window.api.render(getOpts());
    lastSvgs = { baseSvg: res.baseSvg, replacedSvg: res.replacedSvg };
    lastMetrics = res.metrics || null;
    updateMetrics(lastMetrics);
    setStatus('✅ Vista previa actualizada');
    renderPreview();
    window.api.saveSettings(getOpts());
  } catch (e) {
    setStatus(`❌ ${e.message || e}`);
  }
}

(async () => {
  const saved = await window.api.loadSettings();
  if (saved) {
    const map = {
      payload: payloadEl,
      replaceText: replaceEl,
      emptyCellText: emptyEl,
      singleGridText: singleTextEl,

      outerRowsTop: outerRowsTopEl,
      outerRowsBottom: outerRowsBottomEl,
      outerColsLeft: outerColsLeftEl,
      outerColsRight: outerColsRightEl,

      cellSizeMm: cellSizeMmEl,
      gridWidthMm: gridWidthMmEl,
      gridHeightMm: gridHeightMmEl,

      dotOffsetXmm: dotOffsetXmmEl,
      dotOffsetYmm: dotOffsetYmmEl,
      dotTextOffsetXmm: dotTextOffsetXmmEl,
      dotTextOffsetYmm: dotTextOffsetYmmEl,
      emptyTextOffsetXmm: emptyTextOffsetXmmEl,
      emptyTextOffsetYmm: emptyTextOffsetYmmEl,
      dotImageOffsetXmm: dotImageOffsetXmmEl,
      dotImageOffsetYmm: dotImageOffsetYmmEl,
      emptyImageOffsetXmm: emptyImageOffsetXmmEl,
      emptyImageOffsetYmm: emptyImageOffsetYmmEl,
      dotDiameterRatio: dotDiameterRatioEl,

      scale: scaleEl,
      padding: paddingEl,
      finalSize: finalSizeEl,
      outputDpi: outputDpiEl,

      dotFontSizeMm: dotFontSizeMmEl,
      emptyFontSizeMm: emptyFontSizeMmEl,

      dotFontFamily: dotFontFamilyEl,
      emptyFontFamily: emptyFontFamilyEl,

      dotTextStrokeWidthMm: dotTextStrokeWidthMmEl,
      emptyTextStrokeWidthMm: emptyTextStrokeWidthMmEl,
      dotTextStrokeColor: dotTextStrokeColorEl,
      emptyTextStrokeColor: emptyTextStrokeColorEl,
      textStrokeJoin: textStrokeJoinEl,

      rulerStepMm: rulerStepMmEl,
      rulerMajorTickMm: rulerMajorTickMmEl,

      dotImageScale: dotImageScaleEl,
      emptyImageScale: emptyImageScaleEl,
      dotImageFit: dotImageFitEl,
      emptyImageFit: emptyImageFitEl,
      dotImageRotate: dotImageRotateEl,
      emptyImageRotate: emptyImageRotateEl,
      dotImageOpacity: dotImageOpacityEl,
      emptyImageOpacity: emptyImageOpacityEl,

      legendFontSizeMm: legendFontSizeMmEl,
      legendMarginMm: legendMarginMmEl,

      loupeZoom: loupeZoomEl,
      loupeSizePx: loupeSizePxEl,

      sequenceStrategy: sequenceStrategyEl,
      sequenceStart: sequenceStartEl,
      sequenceCount: sequenceCountEl,
      sequenceStep: sequenceStepEl,
      sequenceWidth: sequenceWidthEl,
      sequenceSliceStart: sequenceSliceStartEl,
      sequenceSliceLength: sequenceSliceLengthEl,
      sequencePrefix: sequencePrefixEl,
      sequenceSuffix: sequenceSuffixEl,
      sequenceNumberStart: sequenceNumberStartEl,

      outputFormat: outputFormatEl,
      outputPrefix: outputPrefixEl,
    };

    for (const [k, v] of Object.entries(saved)) {
      if (map[k] !== undefined && map[k] !== null && v !== undefined) {
        map[k].value = v;
      }
    }

    outputDpiMirrorEl.value = outputDpiEl.value;

    useGs1El.checked = !!saved.useGs1;
    repeatEl.checked = saved.repeatReplaceText !== false;
    fullGridEl.checked = saved.fillFullGrid !== false;
    showGridEl.checked = !!saved.showGrid;
    singleModeEl.checked = !!saved.singleGridTextMode;

    outerOnBaseEl.checked = saved.outerOnBase !== false;

    useEmbeddedFontsEl.checked = !!saved.useEmbeddedFonts;
    dotEmbeddedFont = saved.dotEmbeddedFont ?? null;
    emptyEmbeddedFont = saved.emptyEmbeddedFont ?? null;
    dotFontFileLabelEl.textContent = dotEmbeddedFont?.name ?? '(ninguna)';
    emptyFontFileLabelEl.textContent = emptyEmbeddedFont?.name ?? '(ninguna)';

    showRulersEl.checked = !!saved.showRulers;

    useImagesEl.checked = !!saved.useImages;
    dotUseImageEl.checked = saved.dotUseImage !== false;
    emptyUseImageEl.checked = saved.emptyUseImage !== false;
    dotImage = saved.dotImage ?? null;
    emptyImage = saved.emptyImage ?? null;
    dotImageLabelEl.textContent = dotImage?.name ?? '(ninguna)';
    emptyImageLabelEl.textContent = emptyImage?.name ?? '(ninguna)';

    includePayloadInFilenameEl.checked = saved.includePayloadInFilename !== false;
    printPayloadLegendEl.checked = !!saved.printPayloadLegend;

    enableLoupeEl.checked = !!saved.enableLoupe;
    sequenceModeEl.checked = !!saved.sequenceMode;

    if (saved.style) {
      bgColorEl.value = saved.style.bgColor ?? bgColorEl.value;
      dotColorEl.value = saved.style.dotColor ?? dotColorEl.value;
      emptyColorEl.value = saved.style.emptyColor ?? emptyColorEl.value;
      gridColorEl.value = saved.style.gridColor ?? gridColorEl.value;
    }
  }

  applyLoupeStyle();
  await refreshPreviewNow();
})();

const watchedIds = [
  'payload', 'replaceText', 'emptyCellText', 'singleGridText',
  'useGs1', 'repeatReplaceText', 'fillFullGrid', 'showGrid', 'singleGridTextMode',
  'outerRowsTop', 'outerRowsBottom', 'outerColsLeft', 'outerColsRight', 'outerOnBase',
  'cellSizeMm', 'gridWidthMm', 'gridHeightMm',
  'dotOffsetXmm', 'dotOffsetYmm',
  'dotTextOffsetXmm', 'dotTextOffsetYmm',
  'emptyTextOffsetXmm', 'emptyTextOffsetYmm',
  'dotImageOffsetXmm', 'dotImageOffsetYmm',
  'emptyImageOffsetXmm', 'emptyImageOffsetYmm',
  'dotDiameterRatio',
  'scale', 'padding', 'finalSize', 'outputDpi', 'outputDpiMirror',
  'dotFontSizeMm', 'emptyFontSizeMm',
  'dotFontFamily', 'emptyFontFamily', 'useEmbeddedFonts',
  'dotTextStrokeWidthMm', 'emptyTextStrokeWidthMm', 'dotTextStrokeColor', 'emptyTextStrokeColor', 'textStrokeJoin',
  'showRulers', 'rulerStepMm', 'rulerMajorTickMm',
  'useImages', 'dotUseImage', 'emptyUseImage',
  'dotImageScale', 'emptyImageScale', 'dotImageFit', 'emptyImageFit',
  'dotImageRotate', 'emptyImageRotate', 'dotImageOpacity', 'emptyImageOpacity',
  'includePayloadInFilename', 'printPayloadLegend', 'legendFontSizeMm', 'legendMarginMm',
  'enableLoupe', 'loupeZoom', 'loupeSizePx',
  'bgColor', 'dotColor', 'emptyColor', 'gridColor',
  'sequenceMode', 'sequenceStrategy', 'sequenceStart', 'sequenceCount', 'sequenceStep',
  'sequenceWidth', 'sequenceSliceStart', 'sequenceSliceLength', 'sequencePrefix', 'sequenceSuffix', 'sequenceNumberStart',
  'outputFormat', 'outputPrefix'
];

for (const id of watchedIds) {
  const node = el(id);
  if (!node) continue;
  node.addEventListener('input', refreshPreviewDebounced);
  node.addEventListener('change', refreshPreviewDebounced);
}

el('choose').addEventListener('click', async () => {
  const folder = await window.api.chooseFolder();
  if (!folder) return;
  outDir = folder;
  outDirEl.textContent = outDir;
});

el('chooseDotImage').addEventListener('click', async () => {
  const r = await window.api.chooseImage();
  if (!r) return;
  dotImage = r;
  dotImageLabelEl.textContent = r.name;
  refreshPreviewDebounced();
});

el('chooseEmptyImage').addEventListener('click', async () => {
  const r = await window.api.chooseImage();
  if (!r) return;
  emptyImage = r;
  emptyImageLabelEl.textContent = r.name;
  refreshPreviewDebounced();
});

el('chooseDotFontFile').addEventListener('click', async () => {
  const r = await window.api.chooseFont();
  if (!r) return;
  dotEmbeddedFont = r;
  dotFontFileLabelEl.textContent = r.name;
  refreshPreviewDebounced();
});

el('chooseEmptyFontFile').addEventListener('click', async () => {
  const r = await window.api.chooseFont();
  if (!r) return;
  emptyEmbeddedFont = r;
  emptyFontFileLabelEl.textContent = r.name;
  refreshPreviewDebounced();
});

el('saveSvg').addEventListener('click', async () => {
  try {
    if (!outDir) throw new Error('Elige carpeta de salida primero.');
    setStatus('Guardando SVGs...');
    const res = await window.api.saveSvgs({ ...getOpts(), outDir });
    setStatus(`✅ Guardados:\n${res.basePath}\n${res.replacedPath}`);
  } catch (e) {
    setStatus(`❌ ${e.message || e}`);
  }
});

el('saveSequence').addEventListener('click', async () => {
  try {
    if (!outDir) throw new Error('Elige carpeta de salida primero.');
    setStatus('Generando secuencia...');
    const res = await window.api.saveSequence({ ...getOpts(), outDir });
    setStatus(`✅ Secuencia generada:\n${res.outputPath}`);
  } catch (e) {
    setStatus(`❌ ${e.message || e}`);
  }
});