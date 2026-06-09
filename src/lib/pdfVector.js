// ── Vector PDF export helpers ─────────────────────────────────
// Draws pages directly via jsPDF API (no html2canvas).
// Raster elements: product images, mat tile images, logos (via pdf.addImage).
// Everything else (text, shapes, borders) → jsPDF vector primitives.

// ── Utilities ────────────────────────────────────────────────
const shade = (hex, amt) => {
  try {
    const n = parseInt(hex.replace('#',''), 16);
    const r = (n>>16)+amt, g = (n>>8&255)+amt, b = (n&255)+amt;
    return '#' + (
      (Math.max(0,Math.min(255,r))<<16 | Math.max(0,Math.min(255,g))<<8 | Math.max(0,Math.min(255,b)))
    ).toString(16).padStart(6,'0');
  } catch { return hex; }
};

const hr = hex => {
  try {
    const v = hex.replace('#','');
    return [parseInt(v.slice(0,2),16), parseInt(v.slice(2,4),16), parseInt(v.slice(4,6),16)];
  } catch { return [0,0,0]; }
};

const NAVY = '#1B2E5C';
const INK3 = '#6B6660';
const fmtOf = src => src?.startsWith('data:image/png') ? 'PNG' : src?.startsWith('data:image/gif') ? 'GIF' : 'JPEG';

// Blend hex color with white at given opacity (0–1) → [r,g,b]
const blendWhite = (hex, opacity) => {
  const [r,g,b] = hr(hex);
  return [
    Math.round(255*(1-opacity) + r*opacity),
    Math.round(255*(1-opacity) + g*opacity),
    Math.round(255*(1-opacity) + b*opacity),
  ];
};

// Set fill opacity via GState (falls back silently)
const setFillOpacity = (pdf, opacity) => {
  try { pdf.setGState(new pdf.constructor.GState({'fill-opacity': opacity})); } catch(_) {}
};
const resetOpacity = pdf => {
  try { pdf.setGState(new pdf.constructor.GState({'fill-opacity': 1, 'stroke-opacity': 1})); } catch(_) {}
};

// ── Image loading / cache ─────────────────────────────────────
const iC = {};
const li = src => {
  if(!src) return Promise.resolve(null);
  if(iC[src]) return iC[src];
  return (iC[src] = new Promise(res => {
    const m = new Image();
    m.onload = () => res(m);
    m.onerror = () => res(null);
    m.src = src;
  }));
};

// ── objectFit:contain + cZoom/cX/cY → {x, y, w, h} in mm ────
const fitContain = (aX, aY, aW, aH, nw, nh, zoom=90, cx=50, cy=50) => {
  const sc = Math.min(aW/nw, aH/nh);
  const fw = nw * sc, fh = nh * sc;
  const fx = aX + (aW - fw) / 2;
  const fy = aY + (aH - fh) / 2;
  const z = zoom / 100;
  const ox = aX + aW * cx / 100;
  const oy = aY + aH * cy / 100;
  return { x: ox-(ox-fx)*z, y: oy-(oy-fy)*z, w: fw*z, h: fh*z };
};

// Add image safely — skips on null/undefined src
const addImg = (pdf, src, x, y, w, h, alias) => {
  if(!src || w<=0 || h<=0) return;
  try { pdf.addImage(src, fmtOf(src), x, y, w, h, alias||undefined, 'FAST'); } catch(_) {}
};

// Strip HTML to plain text for notes
const stripHtml = html => (!html ? '' : html
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<\/p>/gi, '\n')
  .replace(/<\/div>/gi, '\n')
  .replace(/<li>/gi, '\n• ')
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/\n{3,}/g, '\n\n')
  .trim()
);

// ── Right stripe (content pages) ─────────────────────────────
// Draws white bg + colored left border + ABRANE logo + client logo.
// Navigation buttons are added separately by addPdfLinks.
const drawContentStripe = async (pdf, W, H, state, isRing, brandCtx) => {
  const p = state.palette;
  const sX = 0.90 * W;
  const sW = 0.10 * W;
  // White background
  pdf.setFillColor(255,255,255);
  pdf.rect(sX, 0, sW, H, 'F');
  // Left border (3px on canvas ≈ 3/1123*W mm)
  const bw = 3 / (W > 250 ? 1123 : 794) * W;
  pdf.setDrawColor(...hr(p.c2));
  pdf.setLineWidth(bw);
  pdf.line(sX, 0, sX, H);

  const padT = 0.05 * H;
  const logoMaxW = sW * 0.75;
  const logoX = sX + (sW - logoMaxW) / 2;
  let curY = padT;

  // ABRANE logo
  const abrLogo = brandCtx?.officialLogo;
  if(abrLogo) {
    const img = await li(abrLogo);
    if(img) {
      const ratio = img.naturalWidth / img.naturalHeight;
      const lW = logoMaxW;
      const lH = lW / ratio;
      addImg(pdf, abrLogo, logoX, curY, lW, lH, 'abrane-logo');
      curY += lH + 2;
    }
  } else {
    // Vertical ABRANE letter box
    const fs = 6;
    const letters = ['A','B','R','A','N','E'];
    const boxW = logoMaxW * 0.65;
    const letterH = fs * 0.353;
    const gap = 1.2;
    const boxH = letters.length * (letterH + gap) + gap * 2;
    const boxX = sX + (sW - boxW) / 2;
    pdf.setFillColor(...hr(NAVY));
    try { pdf.roundedRect(boxX, curY, boxW, boxH, 1.5, 1.5, 'F'); } catch(_) { pdf.rect(boxX, curY, boxW, boxH, 'F'); }
    pdf.setTextColor(255,255,255);
    pdf.setFont('helvetica','bold');
    pdf.setFontSize(fs);
    letters.forEach((c, i) => {
      pdf.text(c, sX + sW/2, curY + gap*1.5 + (letterH + gap) * i + letterH, {align:'center'});
    });
    curY += boxH + 3;
  }

  // Client logo
  if(state.clientLogoUrl) {
    const img = await li(state.clientLogoUrl);
    if(img) {
      const scale = (state.stripeLogoScale||80) / 100;
      const mT = ((state.stripeLogoY||0) / 100) * H;
      const lW = logoMaxW * scale;
      const ratio = img.naturalWidth / img.naturalHeight;
      const lH = lW / ratio;
      const lX = sX + (sW - lW) / 2;
      addImg(pdf, state.clientLogoUrl, lX, curY + mT, lW, lH, 'client-logo');
    }
  }
};

// ── Page background with clipping rect ───────────────────────
const withClip = (pdf, x, y, w, h, fn) => {
  try {
    pdf.saveGraphicsState();
    pdf.rect(x, y, w, h);
    pdf.clip();
    pdf.discardPath?.();
    fn();
    pdf.restoreGraphicsState();
  } catch(_) { fn(); }
};

// ── ADV_STATUSES (copy from App.jsx) ─────────────────────────
const ADV_STATUSES = [
  {v:'AF',  l:'À faire',                  color:'#6B7280'},
  {v:'EC',  l:'En cours',                 color:'#3B82F6'},
  {v:'DEV', l:'En développement',         color:'#8B5CF6'},
  {v:'ATT', l:'En attente',               color:'#F97316'},
  {v:'EAV', l:'En attente de validation', color:'#EAB308'},
  {v:'AV',  l:'À valider',               color:'#64748B'},
  {v:'VAL', l:'Validé',                   color:'#16A34A'},
  {v:'REF', l:'Refusé',                   color:'#EF4444'},
  {v:'BLOQ',l:'Bloqué',                   color:'#DC2626'},
  {v:'TEST',l:'Tests en cours',           color:'#06B6D4'},
  {v:'CORR',l:'Correction en cours',      color:'#F59E0B'},
  {v:'TERM',l:'Terminé',                  color:'#15803D'},
  {v:'LIV', l:'Livré',                    color:'#0D9488'},
  {v:'ARCH',l:'Archivé',                  color:'#9CA3AF'},
  {v:'NONE',l:'Aucun badge',              color:'#9CA3AF'},
];

// ── OVERLAYS ─────────────────────────────────────────────────
export const drawOverlaysVector = async (pdf, W, H, state, page, pageIndex, totalPages, brandCtx) => {
  const { wmLogo, stampLogo } = brandCtx || {};
  const gx = state.groupX ?? state.sigX ?? 50;
  const gy = state.groupY ?? state.sigY ?? 85;
  const last = totalPages - 1;
  const match = (pl, spec) =>
    pl==='all' || (pl==='first'&&pageIndex===0) || (pl==='last'&&pageIndex===last) ||
    (pl==='content'&&page.type==='content') || (pl==='specific'&&pageIndex===spec);

  // ── Watermark ──
  if(state.wmEnabled) {
    const opacity = (state.wmOpacity ?? 10) / 100;
    if(wmLogo) {
      const img = await li(wmLogo);
      if(img) {
        const ratio = img.naturalWidth / img.naturalHeight;
        // Extended container: inset -80% from all sides
        const eX = -0.80 * W, eY = -0.80 * H;
        const eW = W * 2.6, eH = H * 2.6;
        const cols = 7, rows = 12;
        const cellW = eW / cols, cellH = eH / rows;
        const pivX = W / 2, pivY = H / 2;
        const ang = -40 * Math.PI / 180;
        const cos = Math.cos(ang), sin = Math.sin(ang);
        const tileW = cellW * 0.6;
        const tileH = tileW / ratio;

        pdf.saveGraphicsState();
        try { pdf.setGState(new pdf.constructor.GState({'fill-opacity': opacity})); } catch(_) {}
        for(let r=0; r<rows; r++) {
          for(let c=0; c<cols; c++) {
            const cx0 = eX + (c + 0.5) * cellW;
            const cy0 = eY + (r + 0.5) * cellH;
            const dx = cx0 - pivX, dy = cy0 - pivY;
            const px = pivX + dx*cos - dy*sin;
            const py = pivY + dx*sin + dy*cos;
            if(px > -tileW && px < W+tileW && py > -tileH && py < H+tileH) {
              try {
                pdf.addImage(wmLogo, fmtOf(wmLogo), px-tileW/2, py-tileH/2, tileW, tileH, 'wm-'+r+c, 'FAST', -40);
              } catch(_) {}
            }
          }
        }
        pdf.restoreGraphicsState();
      }
    } else {
      // Text watermark — use blended color (no GState needed)
      const [r,g,b] = blendWhite('#1A1F2E', opacity);
      const eX = -0.80 * W, eY = -0.80 * H;
      const eW = W * 2.6, eH = H * 2.6;
      const cols = 7, rows = 12;
      const cellW = eW / cols, cellH = eH / rows;
      const pivX = W / 2, pivY = H / 2;
      const ang = -40 * Math.PI / 180;
      const cos = Math.cos(ang), sin = Math.sin(ang);
      pdf.setTextColor(r, g, b);
      pdf.setFont('helvetica','bold');
      pdf.setFontSize(6);
      for(let row=0; row<rows; row++) {
        for(let col=0; col<cols; col++) {
          const cx0 = eX + (col + 0.5) * cellW;
          const cy0 = eY + (row + 0.5) * cellH;
          const dx = cx0 - pivX, dy = cy0 - pivY;
          const px = pivX + dx*cos - dy*sin;
          const py = pivY + dx*sin + dy*cos;
          if(px > -10 && px < W+10 && py > -5 && py < H+5) {
            pdf.text('ABRANE', px, py, {align:'center', angle: -40});
          }
        }
      }
    }
  }

  // ── Stamp ──
  if(state.stampEnabled && stampLogo && match(state.stampPlacement||'all')) {
    const img = await li(stampLogo);
    if(img) {
      const sw = (state.stampScale??25) / 100 * W;
      const sh = sw * (img.naturalHeight / img.naturalWidth);
      const sx = gx/100*W - sw/2;
      const sy = gy/100*H - sh/2;
      const op = (state.stampOpacity??70) / 100;
      pdf.saveGraphicsState();
      try { pdf.setGState(new pdf.constructor.GState({'fill-opacity': op})); } catch(_) {}
      addImg(pdf, stampLogo, sx, sy, sw, sh, 'stamp');
      pdf.restoreGraphicsState();
    }
  }

  // ── Signature ──
  if(state.sigEnabled && state.sigUrl && match(state.sigPlacement||'all')) {
    const img = await li(state.sigUrl);
    if(img) {
      const sw = (state.sigScale??30) / 100 * W;
      const sh = sw * (img.naturalHeight / img.naturalWidth);
      const sx = gx/100*W - sw/2;
      const sy = gy/100*H - sh/2;
      addImg(pdf, state.sigUrl, sx, sy, sw, sh, 'sig');
    }
  }

  // ── Advancement badge ──
  if(state.advEnabled && match(state.advPlacement||'all', (state.advPageNum??1)-1)) {
    const advSt = ADV_STATUSES.find(s=>s.v===((state.advPageStatuses?.[page?.key])||state.advStatus||'AF')) || ADV_STATUSES[0];
    if(advSt.v !== 'NONE') {
      const ax = (state.advX??85)/100*W;
      const ay = (state.advY??8)/100*H;
      const scale = (state.advScale??15)/100;
      const bW = W * scale;
      const bH = bW * 0.75;
      const bX = ax - bW/2;
      const bY = ay - bH/2;
      const [cr,cg,cb] = hr(advSt.color);
      pdf.setFillColor(cr,cg,cb,0.16);
      try { pdf.roundedRect(bX, bY, bW, bH, 2, 2, 'F'); } catch(_) { pdf.rect(bX, bY, bW, bH, 'F'); }
      pdf.setDrawColor(cr,cg,cb);
      pdf.setLineWidth(0.5);
      try { pdf.roundedRect(bX, bY, bW, bH, 2, 2, 'S'); } catch(_) { pdf.rect(bX, bY, bW, bH, 'S'); }
      pdf.setTextColor(cr,cg,cb);
      const advFs = (state.advFontScale??80)/100;
      pdf.setFont('helvetica','bold');
      pdf.setFontSize(Math.max(5, 9 * advFs));
      pdf.text(advSt.v, ax, ay + 1, {align:'center', baseline:'middle'});
      pdf.setFontSize(Math.max(4, 6 * advFs));
      pdf.setFont('helvetica','normal');
      pdf.text(advSt.l, ax, ay + bH*0.3, {align:'center', baseline:'middle'});
    }
  }

  // ── Symbol (warning triangle) ──
  if(state.symEnabled && match(state.symPlacement||'all', (state.symPageNum??1)-1)) {
    const sx = (state.symX??50)/100*W;
    const sy = (state.symY??50)/100*H;
    const scale = (state.symScale??20)/100;
    const triW = W * scale * 0.68;
    const triH = triW * 0.866;
    const tX = sx - triW/2;
    const tY = sy - triH/2;
    pdf.setFillColor(220,38,38);
    pdf.setDrawColor(255,255,255);
    pdf.setLineWidth(0.5);
    const points = [[sx, tY], [tX+triW, tY+triH], [tX, tY+triH]];
    pdf.triangle(points[0][0], points[0][1], points[1][0], points[1][1], points[2][0], points[2][1], 'FD');
    pdf.setTextColor(255,255,255);
    pdf.setFont('helvetica','bold');
    pdf.setFontSize(triH * 1.4);
    pdf.text('!', sx, tY + triH*0.85, {align:'center'});
    if(state.symText) {
      pdf.setFillColor(220,38,38);
      pdf.setTextColor(220,38,38);
      pdf.setFontSize(Math.max(5, triW * 0.18));
      pdf.setFont('helvetica','bold');
      pdf.text(state.symText, sx, tY + triH + 3, {align:'center'});
    }
  }

  // ── Disclaimer ──
  if(state.disclaimerEnabled && match(state.disclaimerPlacement||'all', (state.disclaimerPageNum??1)-1)) {
    const FR = 'Tous les dessins techniques et documents associés sont la propriété exclusive de ABRANE France S.A.S. Toute reproduction ou utilisation sans autorisation est interdite.';
    const EN = 'All technical drawings and associated documents are the exclusive property of ABRANE France S.A.S. Any reproduction or use without authorization is prohibited.';
    const lang = state.disclaimerLang || 'fr';
    const txt = lang==='both' ? FR+'\n'+EN : lang==='en' ? EN : FR;
    const dx = (state.disclaimerX??50)/100*W;
    const dy = (state.disclaimerY??95)/100*H;
    const sz = state.disclaimerSize ?? 6;
    pdf.setTextColor(0,0,0,0.3);
    pdf.setFont('helvetica','italic');
    pdf.setFontSize(sz);
    const lines = txt.split('\n');
    const lineH = sz * 0.353 * 1.5;
    lines.forEach((line, li) => {
      const wrapped = pdf.splitTextToSize(line, W*0.88);
      wrapped.forEach((wl, wi) => {
        pdf.text(wl, dx, dy + (li + wi) * lineH, {align:'center'});
      });
    });
  }
};

// ── COVER PAGE ───────────────────────────────────────────────
export const drawCoverVector = async (pdf, W, H, state, isPortrait, isRing, brandCtx) => {
  const p = state.palette;
  const lPad = isRing ? W*0.12 : W*0.05;
  const rPad = W*0.13; // right section takes 8% + 5% padding
  const tPad = H*0.06, bPad = H*0.05;

  // White background
  pdf.setFillColor(255,255,255);
  pdf.rect(0, 0, W, H, 'F');

  // Right stripe (8% of W)
  const sX = W * 0.92;
  const bw = 3 / 1123 * W;
  pdf.setFillColor(255,255,255);
  pdf.rect(sX, 0, W-sX, H, 'F');
  pdf.setDrawColor(...hr(p.c2));
  pdf.setLineWidth(bw);
  pdf.line(sX, 0, sX, H);

  const contentW = sX - lPad - W*0.02;

  // ── Background pattern / image (26%–70% of H) ──
  const bgY = H * 0.26, bgH = H * 0.44;
  if(state.bgImageUrl) {
    const img = await li(state.bgImageUrl);
    if(img) {
      const bgScale = (state.bgScale??100)/100;
      const bgXpct = (state.bgX??50)/100;
      const bgYpct = (state.bgY??50)/100;
      const ratio = img.naturalWidth / img.naturalHeight;
      const bW = contentW * bgScale;
      const bH = bW / ratio;
      const bx = lPad + (contentW - bW) * bgXpct;
      const by = bgY + (bgH - bH) * bgYpct;
      pdf.saveGraphicsState();
      try { pdf.setGState(new pdf.constructor.GState({'fill-opacity': 0.20})); } catch(_) {}
      withClip(pdf, lPad, bgY, contentW, bgH, () => addImg(pdf, state.bgImageUrl, bx, by, bW, bH));
      pdf.restoreGraphicsState();
    }
  } else {
    // Diagonal stripe pattern — approximate as semi-transparent c1
    pdf.saveGraphicsState();
    try { pdf.setGState(new pdf.constructor.GState({'fill-opacity': 0.40})); } catch(_) {
      pdf.setFillColor(...blendWhite(p.c1, 0.40));
    }
    pdf.setFillColor(...hr(p.c1));
    withClip(pdf, lPad, bgY, contentW, bgH, () => {
      // Draw diagonal stripes
      const stripeW = 3.7; // ~14px at 1123px scale
      const totalLen = contentW + bgH;
      for(let i = -bgH; i < contentW + bgH; i += stripeW * 2) {
        pdf.setFillColor(...hr(p.c1));
        pdf.triangle(
          lPad + i, bgY,
          lPad + i + stripeW, bgY,
          lPad + i + stripeW - bgH, bgY + bgH,
          'F'
        );
        pdf.triangle(
          lPad + i, bgY,
          lPad + i + stripeW - bgH, bgY + bgH,
          lPad + i - bgH, bgY + bgH,
          'F'
        );
      }
    });
    pdf.restoreGraphicsState();
  }

  // ── ABRANE logo (top left) ──
  const logoZoneH = H * 0.20;
  const abrLogo = brandCtx?.officialLogo;
  if(abrLogo) {
    const img = await li(abrLogo);
    if(img) {
      const maxLH = logoZoneH * 0.8;
      const ratio = img.naturalWidth / img.naturalHeight;
      const lH = Math.min(maxLH, W * 0.18);
      const lW = lH * ratio;
      addImg(pdf, abrLogo, lPad, tPad + (logoZoneH*0.8 - lH)/2, lW, lH, 'abrane-logo');
    }
  } else {
    const fs = 12;
    const boxH = fs * 0.353 * 1.4 + 8;
    const boxW = fs * 0.353 * 8.5;
    pdf.setFillColor(...hr(NAVY));
    try { pdf.roundedRect(lPad, tPad + 2, boxW, boxH, 2, 2, 'F'); } catch(_) { pdf.rect(lPad, tPad + 2, boxW, boxH, 'F'); }
    pdf.setTextColor(255,255,255);
    pdf.setFont('helvetica','bold');
    pdf.setFontSize(fs);
    pdf.text('ABRANE', lPad + boxW/2, tPad + 2 + boxH*0.62, {align:'center'});
    pdf.setFontSize(6);
    pdf.setFont('helvetica','normal');
    pdf.setTextColor(255,255,255,0.5);
    pdf.text('LE FABRICANT DE MOBILIER', lPad + boxW/2, tPad + 2 + boxH*0.62 + 4, {align:'center'});
  }

  // ── Client logo (top right of left section) ──
  if(state.clientLogoUrl) {
    const img = await li(state.clientLogoUrl);
    if(img) {
      const scale = (state.logoScale ?? 30) / 100;
      const logoXpct = (state.logoX ?? 80) / 100;
      const logoYpct = (state.logoY ?? 5) / 100;
      const maxCH = logoZoneH * 0.9;
      const maxCW = contentW * 0.55;
      const ratio = img.naturalWidth / img.naturalHeight;
      const cH = Math.min(maxCH, maxCH * scale * 3);
      const cW = Math.min(maxCW, cH * ratio);
      const cH2 = Math.min(cH, cW / ratio);
      const cX = lPad + contentW * logoXpct - cW/2;
      const cY = tPad + logoZoneH * logoYpct - cH2/2;
      addImg(pdf, state.clientLogoUrl, Math.max(lPad, cX), Math.max(tPad, cY), Math.min(cW, maxCW), cH2, 'client-logo-cover');
    }
  }

  // ── Title area (bottom of left section) ──
  const titleAreaY = H * 0.72;
  const titleAreaH = H - titleAreaY - bPad;

  // Year
  if(state.year) {
    pdf.setFont('helvetica','normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...hr(shade(p.c3, 40)));
    pdf.text(String(state.year), lPad, titleAreaY + 4);
  }

  // Main title
  const titleLen = (state.mainTitle || '').length;
  const titleFsPt = Math.max(18, Math.min(42, Math.max(14, 38 - Math.max(0, titleLen-10)*1.2)));
  pdf.setFont('helvetica','bold');
  pdf.setFontSize(titleFsPt);
  pdf.setTextColor(...hr(p.c3));
  const titleLines = pdf.splitTextToSize(state.mainTitle || '', contentW);
  const titleLineH = titleFsPt * 0.353 * 0.88;
  titleLines.slice(0,3).forEach((line, i) => {
    pdf.text(line, lPad, titleAreaY + 12 + i * titleLineH * 1.0);
  });

  const afterTitle = titleAreaY + 12 + Math.min(titleLines.length, 3) * titleLineH * 1.05;

  // Subtitle
  if(state.subtitle) {
    pdf.setFont('helvetica','normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...hr(shade(p.c3, 40)));
    pdf.text(state.subtitle, lPad, afterTitle + 4);
  }

  // Bottom row
  const botRowY = H - bPad - 2;
  pdf.setFont('helvetica','normal');
  pdf.setFontSize(8);
  pdf.setTextColor(...hr(shade(p.c3, 50)));

  const revDate = [state.rev, state.projectDate].filter(Boolean).join(' · ');
  if(revDate) pdf.text(revDate, lPad, botRowY);
  if(state.client) pdf.text(state.client, sX - W*0.02, botRowY, {align:'right'});

  // Meta bits (quoteRef, internalRef, etc.)
  const bits = [];
  if(state.showQuoteRef && state.quoteRef)       bits.push({k:'Devis', v:state.quoteRef});
  if(state.showInternalRef && state.internalRef) bits.push({k:'Réf.', v:state.internalRef});
  if(state.showContact && state.contact)         bits.push({k:'Contact', v:state.contact});
  if(state.showSendDate && state.sendDate)       bits.push({k:'Envoi', v:state.sendDate});
  if(state.showProjectType && state.projectType) bits.push({k:'Type', v:state.projectType});
  if(bits.length > 0) {
    pdf.setFontSize(7);
    bits.slice().reverse().forEach((b, i) => {
      const txt = `${b.k}  ${b.v}`;
      pdf.text(txt, sX - W*0.02, botRowY - 5 - i * 5, {align:'right'});
    });
  }
};

// ── INDEX PAGE ───────────────────────────────────────────────
export const drawIndexVector = (pdf, W, H, state, isPortrait, isRing, pageIndex, allRows) => {
  const p = state.palette;
  const lPad = isRing ? W*0.12 : W*0.05;
  const tPad = H*0.05;
  const nIdxPages = Math.max(1, Math.ceil(allRows.length / 40));
  const pageRows = allRows.slice(pageIndex*40, (pageIndex+1)*40);
  const col1 = pageRows.slice(0, 20);
  const col2 = pageRows.slice(20, 40);

  // White background
  pdf.setFillColor(255,255,255);
  pdf.rect(0, 0, W, H, 'F');

  // Right stripe (7% of W, c1 background)
  const sX = W * 0.93;
  pdf.setFillColor(...hr(p.c1));
  pdf.rect(sX, 0, W-sX, H, 'F');
  pdf.setDrawColor(...hr(p.c2));
  pdf.setLineWidth(3/1123*W);
  pdf.line(sX, 0, sX, H);

  // "INDEX" title
  pdf.setFont('helvetica','bold');
  pdf.setFontSize(18);
  pdf.setTextColor(...hr(p.c3));
  const idxTitle = `INDEX${nIdxPages > 1 ? ` · ${pageIndex+1}/${nIdxPages}` : ''}`;
  pdf.text(idxTitle, lPad, tPad + H*0.035);

  // Rows
  const hasTwoCol = col2.length > 0;
  const rowAreaW = (sX - lPad - W*0.01);
  const colW = hasTwoCol ? (rowAreaW - W*0.04) / 2 : rowAreaW;
  const col2X = lPad + colW + W*0.04;
  const rowH = 6.0;
  const rowsY = tPad + H*0.07;
  const fs = 8.5;

  const drawRow = (r, x, y) => {
    const maxW = colW - 10;
    pdf.setFont('helvetica', r.isCat ? 'bold' : 'normal');
    pdf.setFontSize(fs);
    const nameColor = r.isCat ? hr(p.c2) : r.isAccessory ? [91,108,168] : hr(shade(p.c3, 15));
    pdf.setTextColor(...nameColor);
    pdf.text(r.name, x, y, {maxWidth: maxW});
    // Page number
    pdf.setTextColor(...(r.isCat ? hr(p.c2) : r.isAccessory ? [91,108,168] : hr(shade(p.c3, 30))));
    pdf.setFont('helvetica', r.isCat ? 'bold' : r.isAccessory ? 'bold' : 'normal');
    pdf.text(String(r.page).padStart(2,'0'), x + colW, y, {align:'right'});
    // Separator line
    pdf.setDrawColor(...(r.isCat ? hr(p.c2) : hr(shade(p.c1, -18))));
    pdf.setLineWidth(r.isCat ? 0.4 : 0.2);
    pdf.line(x, y + 1.2, x + colW, y + 1.2);
  };

  col1.forEach((r, i) => drawRow(r, lPad, rowsY + i * rowH));
  col2.forEach((r, i) => drawRow(r, col2X, rowsY + i * rowH));

  // Accessory legend
  if(state.contentOrder.some(it => it.isAccessory)) {
    const legY = H * 0.93;
    pdf.setDrawColor(...hr(shade(p.c2, -6)));
    pdf.setLineWidth(0.3);
    pdf.line(lPad, legY - 1, lPad + 35, legY - 1);
    pdf.setFont('helvetica','bold');
    pdf.setFontSize(7);
    pdf.setTextColor(91,108,168);
    pdf.text('Accessoire / Accessory', lPad + 3, legY + 1.5);
  }
};

// ── CATEGORY PAGE ────────────────────────────────────────────
export const drawCategoryVector = (pdf, W, H, state, catName, isPortrait, isRing) => {
  const p = state.palette;

  // White background
  pdf.setFillColor(255,255,255);
  pdf.rect(0, 0, W, H, 'F');

  // Top bar (16%)
  pdf.setFillColor(...hr(p.c1));
  pdf.rect(0, 0, W, H*0.16, 'F');
  pdf.setDrawColor(...hr(p.c2));
  pdf.setLineWidth(0.4);
  pdf.line(0, H*0.16, W, H*0.16);

  // Bottom bar (16%)
  pdf.setFillColor(...hr(p.c1));
  pdf.rect(0, H*0.84, W, H*0.16, 'F');
  pdf.line(0, H*0.84, W, H*0.84);

  const cX = isRing ? W*0.57 : W*0.50;
  const cY = H*0.50;

  // Category name — scale font to fit
  const maxW = isRing ? W*0.72 : W*0.84;
  let fsPt = 36;
  pdf.setFont('helvetica','bold');
  while(fsPt > 12) {
    pdf.setFontSize(fsPt);
    const tw = pdf.getTextWidth(catName.toUpperCase());
    if(tw <= maxW) break;
    fsPt -= 2;
  }
  pdf.setTextColor(...hr(p.c3));
  pdf.setFontSize(fsPt);
  pdf.text(catName.toUpperCase(), cX, cY - fsPt*0.353*0.15, {align:'center', letterSpacing: fsPt*0.003});

  // Divider line
  pdf.setDrawColor(...hr(p.c2));
  pdf.setLineWidth(1.5);
  pdf.line(cX - 30, cY + fsPt*0.353*0.8, cX + 30, cY + fsPt*0.353*0.8);

  // "SECTION" label
  pdf.setFont('helvetica','normal');
  pdf.setFontSize(8);
  pdf.setTextColor(...hr(p.c2));
  pdf.setCharSpace(2.5);
  pdf.text('SECTION', cX, cY + fsPt*0.353*0.8 + 5, {align:'center'});
  pdf.setCharSpace(0);
};

// ── CONTENT PAGE ─────────────────────────────────────────────
export const drawContentVector = async (pdf, W, H, state, page, isPortrait, isRing, brandCtx) => {
  const p = state.palette;
  const isNotes = state.pageFormat.includes('notes');

  // White background
  pdf.setFillColor(255,255,255);
  pdf.rect(0, 0, W, H, 'F');

  // Draw right stripe (background + logo)
  await drawContentStripe(pdf, W, H, state, isRing, brandCtx);

  const lPad = isRing ? W*0.14 : W*0.04;
  const rPad = W*0.13; // stripe takes up 10% + gap
  const tPad = H*0.03;

  // Accessories
  const accIds = state.pageAccessories?.[page.key] || [];
  const accItems = accIds.map(id => {
    const ord = state.contentOrder?.find(x => x.id===id && x.isAccessory);
    if(!ord) return null;
    const f = state.files?.find(x => x.id===ord.fileId);
    if(!f) return null;
    return {id, name: ord.label||f.name.replace(/\.[^.]+$/,''), url: f.pageUrls?.[0]||null};
  }).filter(Boolean);
  const hasAcc = accItems.length > 0;

  // Compat products (when page is an accessory)
  const thisOrd = state.contentOrder?.find(x => x.id===page.ordId);
  const isAcc = !!thisOrd?.isAccessory;
  const compatProducts = [];
  if(isAcc) {
    const allPages = [];
    // Simplified: use page map from navData isn't available here.
    // We'll just draw compat names without page numbers if we can't derive them.
    Object.entries(state.pageAccessories||{}).forEach(([pKey, ids]) => {
      if(!ids.includes(page.ordId)) return;
      const productOrdId = pKey.replace(/^f-/,'').replace(/-\d+$/,'');
      const ord = state.contentOrder?.find(x => x.id===productOrdId);
      if(!ord) return;
      const f = state.files?.find(x => x.id===ord.fileId);
      const name = ord.label || f?.name.replace(/\.[^.]+$/,'') || '';
      compatProducts.push({name});
    });
  }
  const hasCompat = compatProducts.length > 0;

  // Bottom padding for accessories / compat
  const botPct = isNotes ? 0.23 : 0.06;
  const extraBot = hasAcc ? H*0.145 : hasCompat ? H*0.095 : 0;
  const bPad = H*botPct + extraBot;

  // ── Product image ──
  const displayUrl = state.annotSnaps?.[page.key] || page.pageUrl;
  if(displayUrl) {
    const img = await li(displayUrl);
    if(img) {
      const aX = lPad, aY = tPad;
      const aW = W - rPad - lPad;
      const aH = H - tPad - bPad;
      const cZoom = state.contentZoom?.[page.key] ?? 90;
      const cX = state.contentPos?.[page.key]?.x ?? 50;
      const cY = state.contentPos?.[page.key]?.y ?? 50;
      const rot = page.rotation || 0;
      const fit = fitContain(aX, aY, aW, aH, img.naturalWidth, img.naturalHeight, cZoom, cX, cY);
      if(rot !== 0) {
        // Rotation: draw centered, then rotate — approximate via jsPDF addImage rotation
        const cx = fit.x + fit.w/2, cy = fit.y + fit.h/2;
        addImg(pdf, displayUrl, fit.x, fit.y, fit.w, fit.h, 'prod-'+page.key);
        // jsPDF addImage doesn't support per-image rotation centered — skip rotation for now
      } else {
        withClip(pdf, aX, aY, aW, aH, () => addImg(pdf, displayUrl, fit.x, fit.y, fit.w, fit.h, 'prod-'+page.key));
      }
    }
  } else {
    // Placeholder
    pdf.setFillColor(...hr(shade(p.c1, 4)));
    pdf.rect(lPad, tPad, W - rPad - lPad, H - tPad - bPad, 'F');
    pdf.setFont('helvetica','normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...hr(shade(p.c3, 60)));
    const fn = (page.file?.name||'').replace(/\.[^.]+$/,'');
    if(fn) pdf.text(fn, W/2, H/2, {align:'center'});
  }

  // ── Notes area (right side, when notes format) ──
  if(isNotes) {
    const nX = W * 0.62, nY = H * 0.04;
    const nW = W * 0.24;
    const noteHtml = state.pageNotes?.[page.key] || '';
    const noteText = stripHtml(noteHtml);
    if(noteText) {
      pdf.setFont('helvetica','normal');
      pdf.setFontSize(8);
      pdf.setTextColor(...hr(shade(p.c3, 20)));
      const lines = pdf.splitTextToSize(noteText, nW);
      pdf.text(lines, nX, nY + 4);
    }
  }

  // ── "Accessoires disponibles" label + thumbnails ──
  if(hasAcc) {
    const accY = H * (1 - botPct) - H*0.105;
    pdf.setFont('helvetica','bold');
    pdf.setFontSize(6);
    pdf.setTextColor(...hr(shade(p.c2, -5)));
    pdf.setCharSpace(1.5);
    pdf.text('ACCESSOIRES DISPONIBLES', lPad, accY - 1.5);
    pdf.setCharSpace(0);

    const thumbW = W * 0.071;
    const thumbH = thumbW;
    const gap = W * 0.005;

    for(let i=0; i<accItems.length; i++) {
      const {name, url} = accItems[i];
      const tX = lPad + i*(thumbW + gap);
      const tY = accY + 1;
      // Border + background
      pdf.setFillColor(255,255,255);
      pdf.setDrawColor(...hr(shade(p.c2,-5)));
      pdf.setLineWidth(0.5);
      pdf.rect(tX, tY, thumbW, thumbH, 'FD');
      // Image
      if(url) withClip(pdf, tX+0.5, tY+0.5, thumbW-1, thumbH-1, () => addImg(pdf, url, tX+0.5, tY+0.5, thumbW-1, thumbH-1));
      // Name below
      pdf.setFont('helvetica','normal');
      pdf.setFontSize(5);
      pdf.setTextColor(...hr(shade(p.c3, 20)));
      const shortName = name.length > 14 ? name.slice(0,13)+'.' : name;
      pdf.text(shortName, tX + thumbW/2, tY + thumbH + 2.5, {align:'center'});
    }
  }

  // ── Compat products (accessory page) ──
  if(hasCompat) {
    const compatY = H * (1 - botPct) - H*0.055;
    pdf.setFont('helvetica','normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(...hr(shade(p.c3, 20)));
    pdf.text('Compatible avec :', lPad, compatY);
    const names = compatProducts.map(c => c.name).join(' · ');
    pdf.setFont('helvetica','bold');
    pdf.setFontSize(6.5);
    pdf.text(names, lPad, compatY + 4, {maxWidth: W - rPad - lPad});
  }
};

// ── MATERIALS PAGE ───────────────────────────────────────────
export const drawMaterialsVector = async (pdf, W, H, state, isPortrait, isRing, pageIndex) => {
  const p = state.palette;
  const cols = isPortrait ? 4 : 6;
  const perPage = 12;
  const fixedRows = Math.ceil(perPage / cols);
  const totalPages = Math.max(1, Math.ceil(state.thumbCount / perPage));
  const start = pageIndex * perPage;
  const end = Math.min(start + perPage, state.thumbCount);
  const cells = (state.materials || []).slice(start, end).filter(Boolean);

  const lPad = isRing ? W*0.09 : W*0.02;
  const rPad = W*0.02;
  const tPad = H*0.03;
  const bPad = H*0.03;

  // White background
  pdf.setFillColor(255,255,255);
  pdf.rect(0, 0, W, H, 'F');

  // Title
  pdf.setFont('helvetica','normal');
  pdf.setFontSize(8);
  pdf.setTextColor(...hr(p.c3));
  pdf.setCharSpace(1.8);
  const matTitle = `MATÉRIAUX${totalPages > 1 ? ` · ${pageIndex+1}/${totalPages}` : ''}`;
  pdf.text(matTitle, lPad, tPad + 5);
  pdf.setCharSpace(0);

  // Grid dimensions
  const gridY = tPad + 8;
  const gridW = W - lPad - rPad;
  const gridH = H - gridY - bPad;
  const cellW = gridW / cols;
  const cellH = gridH / fixedRows;
  const labelH = 9; // mm for text label area at bottom of each cell
  const imgH = cellH - labelH;

  for(let i = 0; i < cells.length; i++) {
    const m = cells[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cX = lPad + col * cellW;
    const cY = gridY + row * cellH;

    // Cell border
    pdf.setDrawColor(...hr(p.c1));
    pdf.setLineWidth(0.3);
    pdf.rect(cX, cY, cellW, cellH, 'S');

    // Image area
    if(m.imgUrl) {
      const img = await li(m.imgUrl);
      if(img) {
        const ratio = img.naturalWidth / img.naturalHeight;
        // objectFit:cover — fill the area, crop if needed
        let dW = cellW, dH = dW / ratio;
        if(dH < imgH) { dH = imgH; dW = dH * ratio; }
        const dX = cX + (cellW - dW) / 2;
        const dY = cY + (imgH - dH) / 2;
        withClip(pdf, cX, cY, cellW, imgH, () => addImg(pdf, m.imgUrl, dX, dY, dW, dH));
      }
    } else {
      // Gradient placeholder
      pdf.setFillColor(...hr(shade(p.c1, 4)));
      pdf.rect(cX, cY, cellW, imgH, 'F');
    }

    // Label background
    pdf.setFillColor(255,255,255);
    pdf.setDrawColor(...hr(p.c1));
    pdf.setLineWidth(0.3);
    pdf.rect(cX, cY + imgH, cellW, labelH, 'FD');

    // Mat name
    pdf.setFont('helvetica','bold');
    pdf.setFontSize(6);
    pdf.setTextColor(...hr(p.c3));
    const matName = (m.mat||'').length > 20 ? (m.mat||'').slice(0,19)+'.' : (m.mat||'');
    pdf.text(matName, cX + 1.5, cY + imgH + 3.5);

    // Finish name
    pdf.setFont('helvetica','normal');
    pdf.setFontSize(5.5);
    pdf.setTextColor(...hr(shade(p.c3, 40)));
    const finName = (m.fin||'').length > 20 ? (m.fin||'').slice(0,19)+'.' : (m.fin||'');
    pdf.text(finName, cX + 1.5, cY + imgH + 7);
  }
};

// ── BACK PAGE ────────────────────────────────────────────────
export const drawBackVector = async (pdf, W, H, state, isPortrait, isRing, brandCtx) => {
  const p = state.palette;
  const lPad = isRing ? W*0.13 : W*0.04;

  // White background
  pdf.setFillColor(255,255,255);
  pdf.rect(0, 0, W, H, 'F');

  // Right stripe (8% of W)
  const sX = W * 0.92;
  pdf.setFillColor(255,255,255);
  pdf.rect(sX, 0, W-sX, H, 'F');
  pdf.setDrawColor(...hr(p.c2));
  pdf.setLineWidth(3/1123*W);
  pdf.line(sX, 0, sX, H);

  // Background image or diagonal pattern (bottom-right, 48% wide × 50% tall)
  const bgX = W * 0.44, bgY = H * 0.50;
  const bgW = W * 0.48, bgH = H * 0.50;
  if(state.bgImageUrl) {
    const img = await li(state.bgImageUrl);
    if(img) {
      pdf.saveGraphicsState();
      try { pdf.setGState(new pdf.constructor.GState({'fill-opacity': 0.45})); } catch(_) {}
      withClip(pdf, bgX, bgY, bgW, bgH, () => addImg(pdf, state.bgImageUrl, bgX, bgY, bgW, bgH));
      pdf.restoreGraphicsState();
    }
  } else {
    pdf.saveGraphicsState();
    try { pdf.setGState(new pdf.constructor.GState({'fill-opacity': 0.35})); } catch(_) {}
    pdf.setFillColor(...hr(p.c1));
    withClip(pdf, bgX, bgY, bgW, bgH, () => {
      pdf.rect(bgX, bgY, bgW, bgH, 'F');
    });
    pdf.restoreGraphicsState();
  }

  // Large decorative text (backDecor)
  if(state.backDecor) {
    let fsPt = 54;
    pdf.setFont('helvetica','bold');
    while(fsPt > 18) {
      pdf.setFontSize(fsPt);
      if(pdf.getTextWidth(state.backDecor) <= (sX - lPad) * 0.7) break;
      fsPt -= 4;
    }
    pdf.setTextColor(...hr(shade(p.c1, -8)));
    pdf.setFontSize(fsPt);
    pdf.text(state.backDecor, lPad, H*0.15 + fsPt*0.353);
  }

  // ABRANE logo (top right)
  const abrLogo = brandCtx?.officialLogo;
  const logoX = sX - W*0.18 - W*0.04;
  if(abrLogo) {
    const img = await li(abrLogo);
    if(img) {
      const lW = W * 0.15;
      const lH = lW * (img.naturalHeight / img.naturalWidth);
      addImg(pdf, abrLogo, logoX, H*0.06, lW, lH, 'abrane-logo');
    }
  } else {
    const fs = 9;
    const boxH = fs*0.353*1.5 + 6;
    const boxW = fs*0.353*8.5;
    pdf.setFillColor(...hr(NAVY));
    try { pdf.roundedRect(logoX, H*0.06, boxW, boxH, 2, 2, 'F'); } catch(_) { pdf.rect(logoX, H*0.06, boxW, boxH, 'F'); }
    pdf.setTextColor(255,255,255);
    pdf.setFont('helvetica','bold');
    pdf.setFontSize(fs);
    pdf.text('ABRANE', logoX + boxW/2, H*0.06 + boxH*0.65, {align:'center'});
  }

  // Back lines (contact info)
  if(state.backLines && state.backLines.some(Boolean)) {
    pdf.setFont('helvetica','normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...hr(shade(p.c3, 40)));
    state.backLines.filter(Boolean).forEach((line, i) => {
      pdf.text(line, sX - W*0.01, H*0.06 + 10 + i*5.5, {align:'right'});
    });
  }
};

// ── NOTES PAGE ───────────────────────────────────────────────
export const drawNotesVector = (pdf, W, H, state, isPortrait, isRing) => {
  const p = state.palette;
  const lPad = isRing ? W*0.14 : W*0.09;
  const tPad = H*0.09;

  // White background
  pdf.setFillColor(255,255,255);
  pdf.rect(0, 0, W, H, 'F');

  // "NOTES" title
  pdf.setFont('helvetica','normal');
  pdf.setFontSize(8);
  pdf.setTextColor(...hr(p.c3));
  pdf.setCharSpace(1.8);
  pdf.text('NOTES', lPad, tPad + 5);
  pdf.setCharSpace(0);

  // Note content
  const noteText = stripHtml(state.noteHtml || '');
  if(noteText) {
    pdf.setFont('helvetica','normal');
    pdf.setFontSize(9);
    pdf.setTextColor(34, 34, 34);
    const lines = pdf.splitTextToSize(noteText, W - lPad - W*0.05);
    pdf.text(lines, lPad, tPad + 12);
  }
};
