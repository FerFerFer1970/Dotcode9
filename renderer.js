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

const outerRowsEl = el('outerRows');
const outerColsEl = el('outerCols');
const outerOnBaseEl = el('outerOnBase');

const cellSizeMmEl = el('cellSizeMm');
const gridWidthMmEl = el('gridWidthMm');
const gridHeightMmEl = el('gridHeightMm');

const dotOffsetXmmEl = el('dotOffsetXmm');
const dotOffsetYmmEl = el('dotOffsetYmm');
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

const fontSizeEl = el('fontSize');
const dotFontSizeEl = el('dotFontSize');
const emptyFontSizeEl = el('emptyFontSize');

const dotFontFamilyEl = el('dotFontFamily');
const emptyFontFamilyEl = el('emptyFontFamily');

const useEmbeddedFontsEl = el('useEmbeddedFonts');
const dotFontFileLabelEl = el('dotFontFileLabel');
const emptyFontFileLabelEl = el('emptyFontFileLabel');

const dotTextStrokeWidthEl = el('dotTextStrokeWidth');
const emptyTextStrokeWidthEl = el('emptyTextStrokeWidth');
const dotTextStrokeColorEl = el('dotTextStrokeColor');
const emptyTextStrokeColorEl = el('emptyTextStrokeColor');
const textStrokeJoinEl = el('textStrokeJoin');

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
const legendFontSizeEl = el('legendFontSize');
const legendMarginEl = el('legendMargin');

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
const outputDpiEl = el('outputDpi');
const outputPrefixEl = el('outputPrefix');

const outDirEl = el('outDir');
const statusEl = el('status');
const frame = el('previewFrame');

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

function setTab(view) {
  activeView = view;
  tabReplaced.classList.toggle('active', view === 'replaced');
  tabBase.classList.toggle('active', view === 'base');
  renderPreview();
}

tabReplaced?.addEventListener('click', () => setTab('replaced'));
tabBase?.addEventListener('click', () => setTab('base'));

function getOpts() {
  return {
    payload: payloadEl?.value ?? '',
    replaceText: replaceEl?.value ?? '',
    emptyCellText: emptyEl?.value ?? '',

    singleGridTextMode: !!singleModeEl?.checked,
    singleGridText: singleTextEl?.value ?? '',

    useGs1: !!useGs1El?.checked,
    repeatReplaceText: !!repeatEl?.checked,
    fillFullGrid: !!fullGridEl?.checked,
    showGrid: !!showGridEl?.checked,

    outerRows: outerRowsEl?.value ?? 0,
    outerCols: outerColsEl?.value ?? 0,
    outerOnBase: !!outerOnBaseEl?.checked,

    cellSizeMm: cellSizeMmEl?.value ?? 1,
    gridWidthMm: gridWidthMmEl?.value ?? 0,
    gridHeightMm: gridHeightMmEl?.value ?? 0,

    dotOffsetXmm: dotOffsetXmmEl?.value ?? 0,
    dotOffsetYmm: dotOffsetYmmEl?.value ?? 0,
    dotDiameterRatio: dotDiameterRatioEl?.value ?? 0.75,

    scale: scaleEl?.value ?? 4,
    padding: paddingEl?.value ?? 10,
    finalSize: finalSizeEl?.value ?? 300,

    fontSize: fontSizeEl?.value ?? 5,
    dotFontSize: dotFontSizeEl?.value ?? 5,
    emptyFontSize: emptyFontSizeEl?.value ?? 4,

    dotFontFamily: dotFontFamilyEl?.value ?? 'monospace',
    emptyFontFamily: emptyFontFamilyEl?.value ?? 'monospace',

    useEmbeddedFonts: !!useEmbeddedFontsEl?.checked,
    dotEmbeddedFont,
    emptyEmbeddedFont,

    dotTextStrokeWidth: dotTextStrokeWidthEl?.value ?? 0,
    emptyTextStrokeWidth: emptyTextStrokeWidthEl?.value ?? 0,
    dotTextStrokeColor: dotTextStrokeColorEl?.value ?? '#000000',
    emptyTextStrokeColor: emptyTextStrokeColorEl?.value ?? '#999999',
    textStrokeJoin: textStrokeJoinEl?.value ?? 'round',

    useImages: !!useImagesEl?.checked,
    dotUseImage: !!dotUseImageEl?.checked,
    emptyUseImage: !!emptyUseImageEl?.checked,
    dotImage,
    emptyImage,
    dotImageScale: dotImageScaleEl?.value ?? 1,
    emptyImageScale: emptyImageScaleEl?.value ?? 1,
    dotImageFit: dotImageFitEl?.value ?? 'meet',
    emptyImageFit: emptyImageFitEl?.value ?? 'meet',
    dotImageRotate: dotImageRotateEl?.value ?? 0,
    emptyImageRotate: emptyImageRotateEl?.value ?? 0,
    dotImageOpacity: dotImageOpacityEl?.value ?? 1,
    emptyImageOpacity: emptyImageOpacityEl?.value ?? 1,

    includePayloadInFilename: !!includePayloadInFilenameEl?.checked,
    printPayloadLegend: !!printPayloadLegendEl?.checked,
    legendFontSize: legendFontSizeEl?.value ?? 14,
    legendMargin: legendMarginEl?.value ?? 12,

    style: {
      bgColor: bgColorEl?.value ?? '#ffffff',
      dotColor: dotColorEl?.value ?? '#000000',
      emptyColor: emptyColorEl?.value ?? '#999999',
      gridColor: gridColorEl?.value ?? '#c8c8c8',
    },

    sequenceMode: !!sequenceModeEl?.checked,
    sequenceStrategy: sequenceStrategyEl?.value ?? 'numeric-end',
    sequenceStart: sequenceStartEl?.value ?? '',
    sequenceCount: sequenceCountEl?.value ?? 10,
    sequenceStep: sequenceStepEl?.value ?? 1,
    sequenceWidth: sequenceWidthEl?.value ?? 6,
    sequenceSliceStart: sequenceSliceStartEl?.value ?? 0,
    sequenceSliceLength: sequenceSliceLengthEl?.value ?? 1,
    sequencePrefix: sequencePrefixEl?.value ?? '',
    sequenceSuffix: sequenceSuffixEl?.value ?? '',
    sequenceNumberStart: sequenceNumberStartEl?.value ?? 1,

    outputFormat: outputFormatEl?.value ?? 'pdf',
    outputDpi: outputDpiEl?.value ?? 300,
    outputPrefix: outputPrefixEl?.value ?? 'dotcode',
  };
}

function renderPreview() {
  const svg = activeView === 'base' ? lastSvgs.baseSvg : lastSvgs.replacedSvg;
  if (!svg || !frame) return;

  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  frame.src = url;

  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function updateMetrics(metrics) {
  if (!metrics) return;
  if (metricColsEl) metricColsEl.textContent = String(metrics.cols ?? '-');
  if (metricRowsEl) metricRowsEl.textContent = String(metrics.rows ?? '-');
  if (metricWidthMmEl) metricWidthMmEl.textContent = Number(metrics.widthMm ?? 0).toFixed(2);
  if (metricHeightMmEl) metricHeightMmEl.textContent = Number(metrics.heightMm ?? 0).toFixed(2);
  if (metricWidthPxEl) metricWidthPxEl.textContent = String(Math.round(metrics.widthPx ?? 0));
  if (metricHeightPxEl) metricHeightPxEl.textContent = String(Math.round(metrics.heightPx ?? 0));
}

let t = null;
function refreshPreviewDebounced() {
  clearTimeout(t);
  t = setTimeout(refreshPreviewNow, 250);
}

async function refreshPreviewNow() {
  try {
    if (!window.api) {
      throw new Error('window.api no está disponible. Revisa preload.js');
    }

    setStatus('Renderizando vista previa...');
    const res = await window.api.render(getOpts());
    lastSvgs = {
      baseSvg: res.baseSvg,
      replacedSvg: res.replacedSvg,
    };
    lastMetrics = res.metrics || null;
    updateMetrics(lastMetrics);
    setStatus('✅ Vista previa actualizada');
    renderPreview();
    await window.api.saveSettings(getOpts());
  } catch (e) {
    setStatus(`❌ ${e.message || e}`);
  }
}

(async () => {
  try {
    if (!window.api) {
      throw new Error('window.api no está disponible. Revisa preload.js y main.js');
    }

    const saved = await window.api.loadSettings();
    if (saved) {
      const map = {
        payload: payloadEl,
        replaceText: replaceEl,
        emptyCellText: emptyEl,
        singleGridText: singleTextEl,

        outerRows: outerRowsEl,
        outerCols: outerColsEl,

        cellSizeMm: cellSizeMmEl,
        gridWidthMm: gridWidthMmEl,
        gridHeightMm: gridHeightMmEl,
        dotOffsetXmm: dotOffsetXmmEl,
        dotOffsetYmm: dotOffsetYmmEl,
        dotDiameterRatio: dotDiameterRatioEl,

        scale: scaleEl,
        padding: paddingEl,
        finalSize: finalSizeEl,

        fontSize: fontSizeEl,
        dotFontSize: dotFontSizeEl,
        emptyFontSize: emptyFontSizeEl,

        dotFontFamily: dotFontFamilyEl,
        emptyFontFamily: emptyFontFamilyEl,

        dotTextStrokeWidth: dotTextStrokeWidthEl,
        emptyTextStrokeWidth: emptyTextStrokeWidthEl,
        dotTextStrokeColor: dotTextStrokeColorEl,
        emptyTextStrokeColor: emptyTextStrokeColorEl,
        textStrokeJoin: textStrokeJoinEl,

        dotImageScale: dotImageScaleEl,
        emptyImageScale: emptyImageScaleEl,
        dotImageFit: dotImageFitEl,
        emptyImageFit: emptyImageFitEl,
        dotImageRotate: dotImageRotateEl,
        emptyImageRotate: emptyImageRotateEl,
        dotImageOpacity: dotImageOpacityEl,
        emptyImageOpacity: emptyImageOpacityEl,

        legendFontSize: legendFontSizeEl,
        legendMargin: legendMarginEl,

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
        outputDpi: outputDpiEl,
        outputPrefix: outputPrefixEl,
      };

      for (const [k, v] of Object.entries(saved)) {
        if (map[k] !== undefined && map[k] !== null && v !== undefined) {
          map[k].value = v;
        }
      }

      if (useGs1El) useGs1El.checked = !!saved.useGs1;
      if (repeatEl) repeatEl.checked = saved.repeatReplaceText !== false;
      if (fullGridEl) fullGridEl.checked = saved.fillFullGrid !== false;
      if (showGridEl) showGridEl.checked = !!saved.showGrid;
      if (singleModeEl) singleModeEl.checked = !!saved.singleGridTextMode;

      if (outerOnBaseEl) outerOnBaseEl.checked = saved.outerOnBase !== false;

      if (useEmbeddedFontsEl) useEmbeddedFontsEl.checked = !!saved.useEmbeddedFonts;
      dotEmbeddedFont = saved.dotEmbeddedFont ?? null;
      emptyEmbeddedFont = saved.emptyEmbeddedFont ?? null;
      if (dotFontFileLabelEl) dotFontFileLabelEl.textContent = dotEmbeddedFont?.name ?? '(ninguna)';
      if (emptyFontFileLabelEl) emptyFontFileLabelEl.textContent = emptyEmbeddedFont?.name ?? '(ninguna)';

      if (useImagesEl) useImagesEl.checked = !!saved.useImages;
      if (dotUseImageEl) dotUseImageEl.checked = saved.dotUseImage !== false;
      if (emptyUseImageEl) emptyUseImageEl.checked = saved.emptyUseImage !== false;
      dotImage = saved.dotImage ?? null;
      emptyImage = saved.emptyImage ?? null;
      if (dotImageLabelEl) dotImageLabelEl.textContent = dotImage?.name ?? '(ninguna)';
      if (emptyImageLabelEl) emptyImageLabelEl.textContent = emptyImage?.name ?? '(ninguna)';

      if (includePayloadInFilenameEl) includePayloadInFilenameEl.checked = saved.includePayloadInFilename !== false;
      if (printPayloadLegendEl) printPayloadLegendEl.checked = !!saved.printPayloadLegend;

      if (sequenceModeEl) sequenceModeEl.checked = !!saved.sequenceMode;

      if (saved.style) {
        if (bgColorEl) bgColorEl.value = saved.style.bgColor ?? bgColorEl.value;
        if (dotColorEl) dotColorEl.value = saved.style.dotColor ?? dotColorEl.value;
        if (emptyColorEl) emptyColorEl.value = saved.style.emptyColor ?? emptyColorEl.value;
        if (gridColorEl) gridColorEl.value = saved.style.gridColor ?? gridColorEl.value;
      }
    }

    await refreshPreviewNow();
  } catch (e) {
    setStatus(`❌ ${e.message || e}`);
  }
})();

const watchedIds = [
  'payload', 'replaceText', 'emptyCellText', 'singleGridText',
  'useGs1', 'repeatReplaceText', 'fillFullGrid', 'showGrid', 'singleGridTextMode',
  'outerRows', 'outerCols', 'outerOnBase',
  'cellSizeMm', 'gridWidthMm', 'gridHeightMm',
  'dotOffsetXmm', 'dotOffsetYmm', 'dotDiameterRatio',
  'scale', 'padding', 'finalSize', 'fontSize', 'dotFontSize', 'emptyFontSize',
  'dotFontFamily', 'emptyFontFamily', 'useEmbeddedFonts',
  'dotTextStrokeWidth', 'emptyTextStrokeWidth', 'dotTextStrokeColor', 'emptyTextStrokeColor', 'textStrokeJoin',
  'useImages', 'dotUseImage', 'emptyUseImage',
  'dotImageScale', 'emptyImageScale', 'dotImageFit', 'emptyImageFit',
  'dotImageRotate', 'emptyImageRotate', 'dotImageOpacity', 'emptyImageOpacity',
  'includePayloadInFilename', 'printPayloadLegend', 'legendFontSize', 'legendMargin',
  'bgColor', 'dotColor', 'emptyColor', 'gridColor',
  'sequenceMode', 'sequenceStrategy', 'sequenceStart', 'sequenceCount', 'sequenceStep',
  'sequenceWidth', 'sequenceSliceStart', 'sequenceSliceLength', 'sequencePrefix', 'sequenceSuffix', 'sequenceNumberStart',
  'outputFormat', 'outputDpi', 'outputPrefix'
];

for (const id of watchedIds) {
  const node = el(id);
  if (!node) continue;
  node.addEventListener('input', refreshPreviewDebounced);
  node.addEventListener('change', refreshPreviewDebounced);
}

el('choose')?.addEventListener('click', async () => {
  try {
    if (!window.api) throw new Error('window.api no está disponible.');
    const folder = await window.api.chooseFolder();
    if (!folder) return;
    outDir = folder;
    if (outDirEl) outDirEl.textContent = outDir;
  } catch (e) {
    setStatus(`❌ ${e.message || e}`);
  }
});

el('chooseDotImage')?.addEventListener('click', async () => {
  try {
    const r = await window.api.chooseImage();
    if (!r) return;
    dotImage = r;
    if (dotImageLabelEl) dotImageLabelEl.textContent = r.name;
    refreshPreviewDebounced();
  } catch (e) {
    setStatus(`❌ ${e.message || e}`);
  }
});

el('chooseEmptyImage')?.addEventListener('click', async () => {
  try {
    const r = await window.api.chooseImage();
    if (!r) return;
    emptyImage = r;
    if (emptyImageLabelEl) emptyImageLabelEl.textContent = r.name;
    refreshPreviewDebounced();
  } catch (e) {
    setStatus(`❌ ${e.message || e}`);
  }
});

el('chooseDotFontFile')?.addEventListener('click', async () => {
  try {
    const r = await window.api.chooseFont();
    if (!r) return;
    dotEmbeddedFont = r;
    if (dotFontFileLabelEl) dotFontFileLabelEl.textContent = r.name;
    refreshPreviewDebounced();
  } catch (e) {
    setStatus(`❌ ${e.message || e}`);
  }
});

el('chooseEmptyFontFile')?.addEventListener('click', async () => {
  try {
    const r = await window.api.chooseFont();
    if (!r) return;
    emptyEmbeddedFont = r;
    if (emptyFontFileLabelEl) emptyFontFileLabelEl.textContent = r.name;
    refreshPreviewDebounced();
  } catch (e) {
    setStatus(`❌ ${e.message || e}`);
  }
});

el('saveSvg')?.addEventListener('click', async () => {
  try {
    if (!window.api) throw new Error('window.api no está disponible.');
    if (!outDir) throw new Error('Elige carpeta de salida primero.');
    setStatus('Guardando SVGs...');
    const res = await window.api.saveSvgs({ ...getOpts(), outDir });
    setStatus(`✅ Guardados:\n${res.basePath}\n${res.replacedPath}`);
  } catch (e) {
    setStatus(`❌ ${e.message || e}`);
  }
});

el('saveSequence')?.addEventListener('click', async () => {
  try {
    if (!window.api) throw new Error('window.api no está disponible.');
    if (!outDir) throw new Error('Elige carpeta de salida primero.');
    setStatus('Generando secuencia...');
    const res = await window.api.saveSequence({ ...getOpts(), outDir });
    setStatus(`✅ Secuencia generada:\n${res.outputPath}`);
  } catch (e) {
    setStatus(`❌ ${e.message || e}`);
  }
});