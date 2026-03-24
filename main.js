const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const bwipjs = require('bwip-js');
const PDFDocument = require('pdfkit');
const SVGtoPDF = require('svg-to-pdfkit');
const sharp = require('sharp');

const DOT_RADIUS = 3;

function escapeXml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function safeFilePart(s) {
  return String(s).replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
}

function mmToPx(mm, dpi) {
  return (Number(mm) / 25.4) * Number(dpi);
}

function setSvgSize(svg, width, height, unit = '') {
  let out = svg
    .replace(/\swidth="[^"]*"/g, '')
    .replace(/\sheight="[^"]*"/g, '');

  out = out.replace(
    /<svg\b/,
    `<svg width="${width}${unit}" height="${height}${unit}"`
  );

  return out;
}

function setSvgViewBox(svg, x, y, w, h) {
  if (/viewBox="[^"]*"/.test(svg)) {
    return svg.replace(/viewBox="[^"]*"/, `viewBox="${x} ${y} ${w} ${h}"`);
  }
  return svg.replace(/<svg\b/, `<svg viewBox="${x} ${y} ${w} ${h}"`);
}

function getUserDataFile() {
  return path.join(app.getPath('userData'), 'settings.json');
}

function loadSettingsSafe() {
  try {
    const p = getUserDataFile();
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function saveSettingsSafe(obj) {
  try {
    fs.writeFileSync(getUserDataFile(), JSON.stringify(obj, null, 2), 'utf8');
  } catch {}
}

function generateBaseSvg(opts) {
  const { payload, useGs1, scale, padding, finalSize } = opts;

  const baseSvgRaw = bwipjs.toSVG({
    bcid: useGs1 ? 'gs1dotcode' : 'dotcode',
    text: String(payload ?? '').trim(),
    scale: Number(scale) || 4,
    padding: Number(padding) || 10,
  });

  return setSvgSize(baseSvgRaw, Number(finalSize) || 300, Number(finalSize) || 300, '');
}

function extractGridFromBaseSvg(baseSvg) {
  const dMatch = baseSvg.match(/<path[^>]*\sd="([^"]+)"[^>]*\/>/);
  if (!dMatch) throw new Error('No se encontró <path d="..."/> en el SVG base.');

  const d = dMatch[1];
  const re = /M\s*([0-9.]+)\s*([0-9.]+)\s*C/g;
  const dots = [];
  let m;

  while ((m = re.exec(d)) !== null) {
    const xLeft = parseFloat(m[1]);
    const y = parseFloat(m[2]);
    dots.push({ x: xLeft + DOT_RADIUS, y });
  }

  if (!dots.length) throw new Error('No se detectaron dots en el símbolo.');

  const xs = [...new Set(dots.map(p => p.x))].sort((a, b) => a - b);
  const ys = [...new Set(dots.map(p => p.y))].sort((a, b) => a - b);
  const dotSet = new Set(dots.map(p => `${p.x}_${p.y}`));

  const dx = xs.length > 1 ? (xs[1] - xs[0]) : 6;
  const dy = ys.length > 1 ? (ys[1] - ys[0]) : 6;

  return { xs, ys, dotSet, dx, dy };
}

function expandGrid(xs, ys, dx, dy, opts) {
  const top = Math.max(0, Number(opts.outerRowsTop) || 0);
  const bottom = Math.max(0, Number(opts.outerRowsBottom) || 0);
  const left = Math.max(0, Number(opts.outerColsLeft) || 0);
  const right = Math.max(0, Number(opts.outerColsRight) || 0);

  let newXs = [...xs];
  let newYs = [...ys];

  if (left > 0 || right > 0) {
    const firstX = xs[0];
    const lastX = xs[xs.length - 1];
    const extraLeft = [];
    const extraRight = [];
    for (let i = left; i >= 1; i--) extraLeft.push(firstX - (dx * i));
    for (let i = 1; i <= right; i++) extraRight.push(lastX + (dx * i));
    newXs = [...extraLeft, ...xs, ...extraRight];
  }

  if (top > 0 || bottom > 0) {
    const firstY = ys[0];
    const lastY = ys[ys.length - 1];
    const extraTop = [];
    const extraBottom = [];
    for (let i = top; i >= 1; i--) extraTop.push(firstY - (dy * i));
    for (let i = 1; i <= bottom; i++) extraBottom.push(lastY + (dy * i));
    newYs = [...extraTop, ...ys, ...extraBottom];
  }

  return { xs: newXs, ys: newYs };
}

function computePhysicalGrid(xs, ys, opts) {
  const cols = xs.length;
  const rows = ys.length;

  let cellW = Number(opts.cellSizeMm) || 1.0;
  let cellH = Number(opts.cellSizeMm) || 1.0;

  const totalW = Number(opts.gridWidthMm) || 0;
  const totalH = Number(opts.gridHeightMm) || 0;

  if (totalW > 0) cellW = totalW / cols;
  if (totalH > 0) cellH = totalH / rows;

  const widthMm = totalW > 0 ? totalW : cols * cellW;
  const heightMm = totalH > 0 ? totalH : rows * cellH;

  return {
    cols,
    rows,
    cellW,
    cellH,
    widthMm,
    heightMm,
  };
}

function buildPhysicalCellCenters(xs, ys, opts) {
  const grid = computePhysicalGrid(xs, ys, opts);
  const centersX = [];
  const centersY = [];

  for (let i = 0; i < grid.cols; i++) centersX.push((i * grid.cellW) + (grid.cellW / 2));
  for (let j = 0; j < grid.rows; j++) centersY.push((j * grid.cellH) + (grid.cellH / 2));

  return { ...grid, centersX, centersY };
}

function buildMetrics(opts, payload) {
  const baseSvg = generateBaseSvg({ ...opts, payload });
  const grid = extractGridFromBaseSvg(baseSvg);
  const expanded = expandGrid(grid.xs, grid.ys, grid.dx, grid.dy, opts);
  const physical = buildPhysicalCellCenters(expanded.xs, expanded.ys, opts);
  const dpi = Number(opts.outputDpi) || 300;
  const legendExtraMm = opts.printPayloadLegend
    ? ((Number(opts.legendFontSizeMm) || 3.5)) + ((Number(opts.legendMarginMm) || 3.0) * 2)
    : 0;

  return {
    cols: physical.cols,
    rows: physical.rows,
    widthMm: physical.widthMm,
    heightMm: physical.heightMm + legendExtraMm,
    widthPx: mmToPx(physical.widthMm, dpi),
    heightPx: mmToPx(physical.heightMm + legendExtraMm, dpi),
  };
}

function fontFaceCss(fontObj) {
  if (!fontObj?.dataUrl || !fontObj?.family) return '';
  const format = fontObj.format || 'truetype';
  return `
@font-face {
  font-family: '${fontObj.family}';
  src: url('${fontObj.dataUrl}') format('${format}');
  font-weight: normal;
  font-style: normal;
}
`.trim();
}

function injectDefsAndStyle(svg, cssText) {
  if (!cssText?.trim()) return svg;
  const styleBlock = `<defs><style><![CDATA[\n${cssText}\n]]></style></defs>`;
  return svg.replace(/<svg\b([^>]*)>/, (m) => `${m}${styleBlock}`);
}

function buildEmbeddedFontCss(opts) {
  let css = '';
  if (opts.useEmbeddedFonts) {
    css += fontFaceCss(opts.dotEmbeddedFont) + '\n' + fontFaceCss(opts.emptyEmbeddedFont);
  }
  return css;
}

function buildRulersSvg(physical, opts) {
  if (!opts.showRulers) return '';

  const step = Math.max(0.1, Number(opts.rulerStepMm) || 1);
  const majorLen = Math.max(0.1, Number(opts.rulerMajorTickMm) || 1.5);
  const minorLen = majorLen * 0.55;
  const fontSize = 0.9;
  const color = '#444';

  let out = `<g stroke="${color}" fill="${color}" stroke-width="0.08">`;
  const width = physical.widthMm;
  const height = physical.heightMm;

  for (let x = 0; x <= width + 0.0001; x += step) {
    const isMajor = Math.round(x / step) % 5 === 0;
    const tick = isMajor ? majorLen : minorLen;
    out += `<line x1="${x}" y1="0" x2="${x}" y2="${tick}"/>`;
    out += `<line x1="${x}" y1="${height}" x2="${x}" y2="${height - tick}"/>`;

    if (isMajor) {
      out += `<text x="${x + 0.15}" y="${tick + 0.9}" font-size="${fontSize}" font-family="Arial">${Number(x).toFixed(0)}</text>`;
      out += `<text x="${x + 0.15}" y="${height - tick - 0.3}" font-size="${fontSize}" font-family="Arial">${Number(x).toFixed(0)}</text>`;
    }
  }

  for (let y = 0; y <= height + 0.0001; y += step) {
    const isMajor = Math.round(y / step) % 5 === 0;
    const tick = isMajor ? majorLen : minorLen;
    out += `<line x1="0" y1="${y}" x2="${tick}" y2="${y}"/>`;
    out += `<line x1="${width}" y1="${y}" x2="${width - tick}" y2="${y}"/>`;

    if (isMajor) {
      out += `<text x="${tick + 0.15}" y="${y - 0.1}" font-size="${fontSize}" font-family="Arial">${Number(y).toFixed(0)}</text>`;
      out += `<text x="${width - tick - 1.8}" y="${y - 0.1}" font-size="${fontSize}" font-family="Arial">${Number(y).toFixed(0)}</text>`;
    }
  }

  out += `</g>`;
  return out;
}

function addOuterFrameToBaseSvg(baseSvg, opts) {
  const { xs, ys, dotSet, dx, dy } = extractGridFromBaseSvg(baseSvg);
  const ex = expandGrid(xs, ys, dx, dy, opts);
  const bgColor = opts.style?.bgColor ?? '#ffffff';

  const physical = buildPhysicalCellCenters(ex.xs, ex.ys, opts);
  const radius = (Math.min(physical.cellW, physical.cellH) * (Number(opts.dotDiameterRatio) || 0.75)) / 2;
  const offX = Number(opts.dotOffsetXmm) || 0;
  const offY = Number(opts.dotOffsetYmm) || 0;

  let overlay = `<rect x="0" y="0" width="${physical.widthMm}" height="${physical.heightMm}" fill="${bgColor}"/>`;
  overlay += buildRulersSvg(physical, opts);
  overlay += `<g fill="#000000">`;

  const xIndexMap = new Map(ex.xs.map((v, i) => [v, i]));
  const yIndexMap = new Map(ex.ys.map((v, i) => [v, i]));

  for (const y of ys) {
    for (const x of xs) {
      if (dotSet.has(`${x}_${y}`)) {
        const ix = xIndexMap.get(x);
        const iy = yIndexMap.get(y);
        const cx = physical.centersX[ix] + offX;
        const cy = physical.centersY[iy] + offY;
        overlay += `<circle cx="${cx}" cy="${cy}" r="${radius}"/>`;
      }
    }
  }

  overlay += `</g>`;

  let out = baseSvg.replace(/<path[^>]*\/>/, overlay);
  out = injectDefsAndStyle(out, buildEmbeddedFontCss(opts));
  out = setSvgViewBox(out, 0, 0, physical.widthMm, physical.heightMm);
  out = setSvgSize(out, physical.widthMm, physical.heightMm, 'mm');
  return out;
}

function buildReplacedSvgAdvanced(baseSvg, opts) {
  const {
    replaceText,
    emptyCellText,
    repeatReplaceText,
    fillFullGrid,
    singleGridTextMode,
    singleGridText,
    dotFontSizeMm,
    emptyFontSizeMm,
    dotFontFamily,
    emptyFontFamily,
    useEmbeddedFonts,
    dotEmbeddedFont,
    emptyEmbeddedFont,
    dotTextStrokeWidthMm,
    emptyTextStrokeWidthMm,
    dotTextStrokeColor,
    emptyTextStrokeColor,
    textStrokeJoin,
    useImages,
    dotUseImage,
    emptyUseImage,
    dotImage,
    emptyImage,
    dotImageScale,
    emptyImageScale,
    dotImageFit,
    emptyImageFit,
    dotImageRotate,
    emptyImageRotate,
    dotImageOpacity,
    emptyImageOpacity,
    style,
    showGrid,
  } = opts;

  const bgColor = style?.bgColor ?? '#ffffff';
  const dotColor = style?.dotColor ?? '#000000';
  const emptyColor = style?.emptyColor ?? '#999999';
  const gridColor = style?.gridColor ?? '#c8c8c8';

  const grid = extractGridFromBaseSvg(baseSvg);
  const expanded = expandGrid(grid.xs, grid.ys, grid.dx, grid.dy, opts);

  const xs = expanded.xs;
  const ys = expanded.ys;
  const dotSet = grid.dotSet;
  const physical = buildPhysicalCellCenters(xs, ys, opts);

  const mainChars = [...String(replaceText ?? '').trim()];
  const emptyChars = [...String(emptyCellText ?? '').trim()];
  const singleChars = [...String(singleGridText ?? '').trim()];

  const dotFS = Number(dotFontSizeMm) || 0.8;
  const emptyFS = Number(emptyFontSizeMm) || 0.7;

  const dotFF = (useEmbeddedFonts && dotEmbeddedFont?.family) ? dotEmbeddedFont.family : (dotFontFamily || 'monospace');
  const emptyFF = (useEmbeddedFonts && emptyEmbeddedFont?.family) ? emptyEmbeddedFont.family : (emptyFontFamily || 'monospace');

  const dotSW = Math.max(0, Number(dotTextStrokeWidthMm) || 0);
  const emptySW = Math.max(0, Number(emptyTextStrokeWidthMm) || 0);
  const dotSC = dotTextStrokeColor || dotColor;
  const emptySC = emptyTextStrokeColor || emptyColor;
  const join = textStrokeJoin || 'round';

  const dotImgScale = Number(dotImageScale) || 1.0;
  const emptyImgScale = Number(emptyImageScale) || 1.0;

  const imgWdot = physical.cellW * dotImgScale;
  const imgHdot = physical.cellH * dotImgScale;
  const imgWempty = physical.cellW * emptyImgScale;
  const imgHempty = physical.cellH * emptyImgScale;

  const dotPAR = `xMidYMid ${dotImageFit || 'meet'}`;
  const emptyPAR = `xMidYMid ${emptyImageFit || 'meet'}`;

  const dotRot = Number(dotImageRotate) || 0;
  const emptyRot = Number(emptyImageRotate) || 0;
  const dotOp = Math.min(1, Math.max(0, Number(dotImageOpacity) || 1));
  const emptyOp = Math.min(1, Math.max(0, Number(emptyImageOpacity) || 1));

  const dotOffX = Number(opts.dotOffsetXmm) || 0;
  const dotOffY = Number(opts.dotOffsetYmm) || 0;
  const dotTextOffX = Number(opts.dotTextOffsetXmm) || 0;
  const dotTextOffY = Number(opts.dotTextOffsetYmm) || 0;
  const emptyTextOffX = Number(opts.emptyTextOffsetXmm) || 0;
  const emptyTextOffY = Number(opts.emptyTextOffsetYmm) || 0;
  const dotImageOffX = Number(opts.dotImageOffsetXmm) || 0;
  const dotImageOffY = Number(opts.dotImageOffsetYmm) || 0;
  const emptyImageOffX = Number(opts.emptyImageOffsetXmm) || 0;
  const emptyImageOffY = Number(opts.emptyImageOffsetYmm) || 0;

  let svgWithFonts = injectDefsAndStyle(baseSvg, buildEmbeddedFontCss(opts));
  svgWithFonts = setSvgViewBox(svgWithFonts, 0, 0, physical.widthMm, physical.heightMm);
  svgWithFonts = setSvgSize(svgWithFonts, physical.widthMm, physical.heightMm, 'mm');

  let overlay = `<rect x="0" y="0" width="${physical.widthMm}" height="${physical.heightMm}" fill="${bgColor}"/>`;
  overlay += buildRulersSvg(physical, opts);

  if (showGrid) {
    overlay += `<g fill="none" stroke="${gridColor}" stroke-width="0.05">`;
    for (let i = 0; i <= physical.cols; i++) {
      const x = i * physical.cellW;
      overlay += `<line x1="${x}" y1="0" x2="${x}" y2="${physical.heightMm}"/>`;
    }
    for (let j = 0; j <= physical.rows; j++) {
      const y = j * physical.cellH;
      overlay += `<line x1="0" y1="${y}" x2="${physical.widthMm}" y2="${y}"/>`;
    }
    overlay += `</g>`;
  }

  let dotIdx = 0;
  let emptyIdx = 0;
  let allIdx = 0;
  let content = '';

  for (let j = 0; j < ys.length; j++) {
    for (let i = 0; i < xs.length; i++) {
      const xOrig = xs[i];
      const yOrig = ys[j];
      const isDot = dotSet.has(`${xOrig}_${yOrig}`);

      if (!fillFullGrid && !isDot) continue;

      const baseCx = physical.centersX[i];
      const baseCy = physical.centersY[j];

      if (useImages) {
        if (isDot && (dotUseImage !== false) && dotImage?.dataUrl) {
          const cx = baseCx + dotImageOffX;
          const cy = baseCy + dotImageOffY;
          const ix = cx - imgWdot / 2;
          const iy = cy - imgHdot / 2;
          const tf = dotRot ? ` transform="rotate(${dotRot} ${cx} ${cy})"` : '';
          content += `<image x="${ix}" y="${iy}" width="${imgWdot}" height="${imgHdot}" href="${dotImage.dataUrl}" preserveAspectRatio="${dotPAR}" opacity="${dotOp}"${tf}/>`;
          continue;
        }

        if (!isDot && (emptyUseImage !== false) && emptyImage?.dataUrl) {
          const cx = baseCx + emptyImageOffX;
          const cy = baseCy + emptyImageOffY;
          const ix = cx - imgWempty / 2;
          const iy = cy - imgHempty / 2;
          const tf = emptyRot ? ` transform="rotate(${emptyRot} ${cx} ${cy})"` : '';
          content += `<image x="${ix}" y="${iy}" width="${imgWempty}" height="${imgHempty}" href="${emptyImage.dataUrl}" preserveAspectRatio="${emptyPAR}" opacity="${emptyOp}"${tf}/>`;
          continue;
        }
      }

      let ch = '';

      if (singleGridTextMode) {
        if (singleChars.length) {
          ch = singleChars[allIdx % singleChars.length];
          allIdx++;
        }
      } else if (isDot) {
        if (mainChars.length) {
          ch = repeatReplaceText !== false
            ? mainChars[dotIdx % mainChars.length]
            : (dotIdx < mainChars.length ? mainChars[dotIdx] : '');
        }
        dotIdx++;
      } else {
        if (emptyChars.length) {
          ch = emptyChars[emptyIdx % emptyChars.length];
        }
        emptyIdx++;
      }

      const fs = isDot ? dotFS : emptyFS;
      const fill = isDot ? dotColor : emptyColor;
      const ff = isDot ? dotFF : emptyFF;
      const sw = isDot ? dotSW : emptySW;
      const sc = isDot ? dotSC : emptySC;
      const cx = baseCx + (isDot ? dotTextOffX : emptyTextOffX);
      const cy = baseCy + (isDot ? dotTextOffY : emptyTextOffY);

      const strokeAttrs = sw > 0
        ? ` stroke="${sc}" stroke-width="${sw.toFixed(2)}" paint-order="stroke fill" stroke-linejoin="${join}"`
        : '';

      content += `<text x="${cx}" y="${cy}" fill="${fill}" font-size="${fs.toFixed(2)}" font-family="${escapeXml(ff)}" text-anchor="middle" dominant-baseline="middle"${strokeAttrs}>${escapeXml(ch)}</text>`;
    }
  }

  if (opts.outerOnBase) {
    const radius = (Math.min(physical.cellW, physical.cellH) * (Number(opts.dotDiameterRatio) || 0.75)) / 2;
    let circles = '<g fill="#000000">';
    for (let j = 0; j < ys.length; j++) {
      for (let i = 0; i < xs.length; i++) {
        const isDot = dotSet.has(`${xs[i]}_${ys[j]}`);
        if (!isDot) continue;
        circles += `<circle cx="${(physical.centersX[i] + dotOffX).toFixed(2)}" cy="${(physical.centersY[j] + dotOffY).toFixed(2)}" r="${radius.toFixed(2)}"/>`;
      }
    }
    circles += '</g>';
    overlay += circles;
  }

  overlay += `<g>${content}</g>`;
  return svgWithFonts.replace(/<path[^>]*\/>/, overlay);
}

function addLegendToSvg(svg, payload, opts) {
  if (!opts.printPayloadLegend) return svg;

  const legendFontSize = Math.max(0.1, Number(opts.legendFontSizeMm) || 3.5);
  const legendMargin = Math.max(0, Number(opts.legendMarginMm) || 3.0);

  const vb = svg.match(/viewBox="([^"]+)"/);
  if (!vb) return svg;

  const [x, y, w, h] = vb[1].split(/\s+/).map(Number);
  const extraH = legendFontSize + legendMargin * 2;

  svg = setSvgViewBox(svg, x, y, w, h + extraH);

  const legendY = y + h + legendMargin + legendFontSize * 0.8;
  const legendX = x + w / 2;
  const legend = `<text x="${legendX}" y="${legendY}" fill="#000000" font-size="${legendFontSize.toFixed(2)}" font-family="Arial" text-anchor="middle">${escapeXml(payload)}</text>`;

  return svg.replace(/<\/svg>\s*$/, `${legend}</svg>`);
}

async function renderSvgs(opts) {
  if (!opts?.payload?.trim()) throw new Error('El payload está vacío.');

  let baseSvg = generateBaseSvg(opts);
  if (opts.outerOnBase) {
    baseSvg = addOuterFrameToBaseSvg(baseSvg, opts);
  }

  let replacedSvg = buildReplacedSvgAdvanced(baseSvg, opts);
  replacedSvg = addLegendToSvg(replacedSvg, opts.payload, opts);

  const metrics = buildMetrics(opts, opts.payload);
  return { baseSvg, replacedSvg, metrics };
}

function incrementPayloadNumericEnd(payload, step, index) {
  const m = String(payload).match(/^(.*?)(\d+)$/);
  if (!m) throw new Error('El payload inicial debe terminar en dígitos para modo "numeric-end".');

  const prefix = m[1];
  const digits = m[2];
  const width = digits.length;
  const startNum = parseInt(digits, 10);
  const value = startNum + (index * step);

  return prefix + String(value).padStart(width, '0');
}

function incrementPayloadNumericSlice(payload, sliceStart, sliceLength, step, index) {
  const text = String(payload);
  const start = Number(sliceStart);
  const length = Number(sliceLength);

  if (!Number.isInteger(start) || start < 0) throw new Error('Slice inicio inválido.');
  if (!Number.isInteger(length) || length <= 0) throw new Error('Slice longitud inválida.');
  if (start + length > text.length) throw new Error('El bloque numérico interno se sale del payload.');

  const before = text.slice(0, start);
  const block = text.slice(start, start + length);
  const after = text.slice(start + length);

  if (!/^\d+$/.test(block)) {
    throw new Error('El bloque seleccionado en "numeric-slice" no es numérico.');
  }

  const startNum = parseInt(block, 10);
  const value = startNum + (index * step);
  return before + String(value).padStart(length, '0') + after;
}

function incrementPayloadParts(prefix, numberStart, width, suffix, step, index) {
  const startNum = Number(numberStart);
  const w = Number(width);

  if (!Number.isFinite(startNum) || startNum < 0) throw new Error('Número inicial inválido en modo "parts".');
  if (!Number.isFinite(w) || w <= 0) throw new Error('Ancho numérico inválido en modo "parts".');

  const value = startNum + (index * step);
  return `${prefix || ''}${String(value).padStart(w, '0')}${suffix || ''}`;
}

function buildSequence(opts) {
  const count = Math.max(1, Number(opts.sequenceCount) || 1);
  const step = Math.max(1, Number(opts.sequenceStep) || 1);
  const strategy = opts.sequenceStrategy || 'numeric-end';
  const out = [];

  for (let i = 0; i < count; i++) {
    let payload;

    if (strategy === 'numeric-end') {
      payload = incrementPayloadNumericEnd(opts.sequenceStart || opts.payload, step, i);
    } else if (strategy === 'numeric-slice') {
      payload = incrementPayloadNumericSlice(
        opts.sequenceStart || opts.payload,
        opts.sequenceSliceStart,
        opts.sequenceSliceLength,
        step,
        i
      );
    } else if (strategy === 'parts') {
      payload = incrementPayloadParts(
        opts.sequencePrefix,
        opts.sequenceNumberStart,
        opts.sequenceWidth,
        opts.sequenceSuffix,
        step,
        i
      );
    } else {
      throw new Error(`Modo de secuencia no soportado: ${strategy}`);
    }

    out.push(payload);
  }

  return out;
}

async function svgToPngBuffer(svg, dpi, widthPx, heightPx) {
  let pipeline = sharp(Buffer.from(svg), { density: Number(dpi) || 300 });
  if (widthPx && heightPx) {
    pipeline = pipeline.resize({
      width: Math.round(widthPx),
      height: Math.round(heightPx),
      fit: 'fill'
    });
  }
  return await pipeline.png().toBuffer();
}

async function svgToTiff1BitBuffer(svg, dpi, widthPx, heightPx) {
  let pipeline = sharp(Buffer.from(svg), { density: Number(dpi) || 300 });
  if (widthPx && heightPx) {
    pipeline = pipeline.resize({
      width: Math.round(widthPx),
      height: Math.round(heightPx),
      fit: 'fill'
    });
  }

  return await pipeline
    .flatten({ background: '#ffffff' })
    .threshold(128)
    .tiff({ compression: 'ccittfax4' })
    .toBuffer();
}

async function saveSequenceOutput(opts) {
  const format = opts.outputFormat || 'pdf';
  const dpi = Number(opts.outputDpi) || 300;
  const prefix = (opts.outputPrefix || 'dotcode').trim() || 'dotcode';

  const payloads = opts.sequenceMode ? buildSequence(opts) : [opts.payload];

  if (!opts.outDir?.trim()) throw new Error('No se ha seleccionado carpeta de salida.');

  const metrics = buildMetrics(opts, payloads[0]);

  if (format === 'pdf') {
    const outputPath = path.join(opts.outDir, `${prefix}.pdf`);
    const doc = new PDFDocument({ autoFirstPage: false });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    for (const payload of payloads) {
      const renderOpts = { ...opts, payload };
      const { replacedSvg } = await renderSvgs(renderOpts);

      const ptW = metrics.widthMm * 72 / 25.4;
      const ptH = metrics.heightMm * 72 / 25.4;

      doc.addPage({ size: [ptW, ptH], margin: 0 });
      SVGtoPDF(doc, replacedSvg, 0, 0, {
        width: ptW,
        height: ptH,
        preserveAspectRatio: 'xMidYMid meet'
      });
    }

    doc.end();

    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    return { outputPath };
  }

  if (format === 'png') {
    const dir = path.join(opts.outDir, `${prefix}_png`);
    fs.mkdirSync(dir, { recursive: true });

    for (let i = 0; i < payloads.length; i++) {
      const payload = payloads[i];
      const renderOpts = { ...opts, payload };
      const { replacedSvg } = await renderSvgs(renderOpts);
      const png = await svgToPngBuffer(replacedSvg, dpi, metrics.widthPx, metrics.heightPx);

      const base = opts.includePayloadInFilename
        ? `${prefix}_${safeFilePart(payload)}`
        : `${prefix}_${String(i + 1).padStart(4, '0')}`;

      fs.writeFileSync(path.join(dir, `${base}.png`), png);
    }

    return { outputPath: dir };
  }

  if (format === 'tiff1') {
    const dir = path.join(opts.outDir, `${prefix}_tiff1`);
    fs.mkdirSync(dir, { recursive: true });

    for (let i = 0; i < payloads.length; i++) {
      const payload = payloads[i];
      const renderOpts = { ...opts, payload };
      const { replacedSvg } = await renderSvgs(renderOpts);
      const tiff = await svgToTiff1BitBuffer(replacedSvg, dpi, metrics.widthPx, metrics.heightPx);

      const base = opts.includePayloadInFilename
        ? `${prefix}_${safeFilePart(payload)}`
        : `${prefix}_${String(i + 1).padStart(4, '0')}`;

      fs.writeFileSync(path.join(dir, `${base}.tif`), tiff);
    }

    return { outputPath: dir };
  }

  throw new Error(`Formato no soportado: ${format}`);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('choose-folder', async () => {
  const r = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory']
  });
  if (r.canceled || !r.filePaths?.[0]) return null;
  return r.filePaths[0];
});

ipcMain.handle('choose-image', async () => {
  const r = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'] }]
  });
  if (r.canceled || !r.filePaths?.[0]) return null;

  const filePath = r.filePaths[0];
  const name = path.basename(filePath);
  const buf = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase().replace('.', '');

  const mime =
    ext === 'png' ? 'image/png' :
    ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
    ext === 'webp' ? 'image/webp' :
    ext === 'gif' ? 'image/gif' :
    ext === 'svg' ? 'image/svg+xml' :
    'application/octet-stream';

  return {
    name,
    dataUrl: `data:${mime};base64,${buf.toString('base64')}`
  };
});

ipcMain.handle('choose-font', async () => {
  const r = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Fonts', extensions: ['ttf', 'otf', 'woff', 'woff2'] }]
  });
  if (r.canceled || !r.filePaths?.[0]) return null;

  const filePath = r.filePaths[0];
  const name = path.basename(filePath);
  const buf = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase().replace('.', '');

  const mime =
    ext === 'ttf' ? 'font/ttf' :
    ext === 'otf' ? 'font/otf' :
    ext === 'woff' ? 'font/woff' :
    ext === 'woff2' ? 'font/woff2' :
    'application/octet-stream';

  const format =
    ext === 'ttf' ? 'truetype' :
    ext === 'otf' ? 'opentype' :
    ext === 'woff' ? 'woff' :
    ext === 'woff2' ? 'woff2' :
    'truetype';

  const family = `EMB_${name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]+/g, '_')}`;

  return {
    name,
    family,
    dataUrl: `data:${mime};base64,${buf.toString('base64')}`,
    format
  };
});

ipcMain.handle('load-settings', async () => loadSettingsSafe());

ipcMain.handle('save-settings', async (_evt, settings) => {
  saveSettingsSafe(settings);
  return { ok: true };
});

ipcMain.handle('render', async (_evt, opts) => {
  return await renderSvgs(opts);
});

ipcMain.handle('save-svgs', async (_evt, opts) => {
  if (!opts?.outDir?.trim()) throw new Error('No se ha seleccionado carpeta de salida.');

  const { baseSvg, replacedSvg } = await renderSvgs(opts);

  const basePath = path.join(opts.outDir, 'dotcode.svg');
  const replacedName = opts.includePayloadInFilename
    ? `dotcode_reemplazado_${safeFilePart(opts.payload)}.svg`
    : 'dotcode_reemplazado.svg';
  const replacedPath = path.join(opts.outDir, replacedName);

  fs.writeFileSync(basePath, baseSvg, 'utf8');
  fs.writeFileSync(replacedPath, replacedSvg, 'utf8');

  return { ok: true, basePath, replacedPath };
});

ipcMain.handle('save-sequence', async (_evt, opts) => {
  return await saveSequenceOutput(opts);
});