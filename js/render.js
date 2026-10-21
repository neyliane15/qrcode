// Desenha a plaquinha (canvas) a partir do tipo, dados e personalização.
(function () {
  const ICONS = window.LUCRE_ICONS;
  const DISPLAY = '"Archivo", "Arial Black", sans-serif';
  const BODY = '"Outfit", "Helvetica Neue", Arial, sans-serif';

  const SIZES = {
    a6: { label: '10 × 15 cm', w: 100, h: 150 },
    s1520: { label: '15 × 20 cm', w: 150, h: 200 },
    a5: { label: 'A5 · 14,8 × 21 cm', w: 148, h: 210 },
    q12: { label: 'Quadrada 12 × 12 cm', w: 120, h: 120 },
    h1510: { label: 'Horizontal 15 × 10 cm', w: 150, h: 100 },
  };
  const HOLE_OFFSET_MM = 7;
  const HOLE_CAP_MM = 9;

  const THEMES = {
    lucre: { label: 'Lucre escuro' },
    creme: { label: 'Creme' },
    canal: { label: 'Cor do canal' },
    cristal: { label: 'Cristal (fundo transparente)' },
  };

  function themeColors(theme, t, brand) {
    const accent = t.color || brand.secondary;
    switch (theme) {
      case 'creme':
        return { bg: ['#F8F5EC', '#ECE6D3'], text: brand.ink, sub: brand.ink, subAlpha: 0.72, kicker: brand.ink,
          kickerBg: brand.secondary, card: '#FFFFFF', cardShadow: 'rgba(10,43,34,.16)', pillBg: brand.ink, pillText: brand.cream,
          cta: brand.ink, footerBg: brand.ink, footerText: brand.secondary, deco: 'rgba(10,43,34,.05)', star: '#F4B400', logo: 'light' };
      case 'canal': {
        const g = t.gradient ? [t.gradient[1], t.gradient[3]] : t.color ? [t.color, t.colorDark] : [brand.secondary, '#6FBF2A'];
        const lightBg = !t.color;
        const fg = lightBg ? brand.ink : '#FFFFFF';
        return { bg: g, text: fg, sub: fg, subAlpha: 0.88, kicker: fg, kickerBg: lightBg ? 'rgba(10,43,34,.12)' : 'rgba(255,255,255,.18)',
          card: '#FFFFFF', cardShadow: 'rgba(0,0,0,.25)', pillBg: lightBg ? brand.ink : 'rgba(0,0,0,.22)', pillText: lightBg ? brand.cream : '#FFFFFF',
          cta: fg, footerBg: lightBg ? brand.ink : 'rgba(0,0,0,.22)', footerText: lightBg ? brand.secondary : '#FFFFFF',
          deco: lightBg ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.08)', star: '#FFD54A', logo: lightBg ? 'light' : 'dark' };
      }
      case 'cristal':
        return { bg: null, text: brand.ink, sub: brand.ink, subAlpha: 0.75, kicker: brand.ink, kickerBg: brand.secondary,
          card: '#FFFFFF', cardShadow: null, pillBg: brand.ink, pillText: brand.cream, cta: brand.ink,
          footerBg: null, footerText: brand.ink, deco: null, star: '#F4B400', logo: 'light' };
      default:
        return { bg: [brand.primary, brand.deep], text: brand.cream, sub: brand.secondary, subAlpha: 1, kicker: brand.secondary,
          kickerBg: null, card: '#FFFFFF', cardShadow: 'rgba(0,0,0,.35)', pillBg: 'rgba(255,255,255,.08)', pillText: brand.cream,
          pillBorder: 'rgba(184,242,106,.35)', cta: 'rgba(244,241,230,.75)', footerBg: brand.secondary, footerText: brand.primary,
          deco: 'rgba(184,242,106,.06)', star: brand.secondary, logo: 'dark', accent };
    }
  }

  // ---------- QR ----------
  function qrStyle(t, mode, brand) {
    const solid = (c) => ({ color: c });
    if (mode === 'marca' || !t.color) {
      return { dots: solid(brand.ink), corners: solid(brand.ink), cornerDots: solid(brand.ink) };
    }
    switch (t.id) {
      case 'whatsapp':
        return { dots: { gradient: lin(['#128C7E', '#075E54'], 0.8) }, corners: solid('#128C7E'), cornerDots: solid('#075E54') };
      case 'instagram':
        return { dots: { gradient: lin(['#E1306C', '#C13584', '#833AB4', '#5851DB'], 0.8) }, corners: { gradient: lin(['#D62976', '#962FBF'], 0.8) }, cornerDots: solid('#4F5BD5') };
      case 'google':
        return { dots: solid('#202124'), corners: solid('#4285F4'), cornerDots: solid('#EA4335') };
      case 'pix':
        return { dots: solid('#0E5E57'), corners: solid('#1E9C8F'), cornerDots: solid('#0E5E57') };
      case 'wifi':
        return { dots: { gradient: lin(['#3B47D6', '#22267A'], 0.8) }, corners: solid('#3B47D6'), cornerDots: solid('#22267A') };
      default:
        return { dots: solid(t.colorDark || brand.ink), corners: solid(t.colorDark || brand.ink), cornerDots: solid(t.colorDark || brand.ink) };
    }
  }
  function lin(colors, rotation) {
    return { type: 'linear', rotation: rotation || 0, colorStops: colors.map((color, i) => ({ offset: i / (colors.length - 1), color })) };
  }

  function centerIconSvg(t, brand) {
    const path = ICONS[t.icon];
    let bg, glyph = '#FFFFFF', defs = '';
    if (t.id === 'instagram') {
      defs = '<defs><linearGradient id="g" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#FEDA75"/><stop offset=".3" stop-color="#FA7E1E"/><stop offset=".6" stop-color="#D62976"/><stop offset="1" stop-color="#4F5BD5"/></linearGradient></defs>';
      bg = 'url(#g)';
    } else if (t.id === 'google') {
      bg = '#FFFFFF'; glyph = '#4285F4';
    } else if (!t.color) {
      bg = brand.primary; glyph = brand.secondary;
    } else {
      bg = t.color;
    }
    const border = t.id === 'google' ? ' stroke="#E3E3E3" stroke-width="1"' : '';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="256" height="256">${defs}` +
      `<rect x=".5" y=".5" width="31" height="31" rx="8" fill="${bg}"${border}/>` +
      `<g transform="translate(6.5 6.5) scale(.79)"><path fill="${glyph}" d="${path}"/></g></svg>`);
  }

  function qrOptions(t, payload, sizePx, mode, brand, type) {
    const st = qrStyle(t, mode, brand);
    return {
      type: type || 'canvas',
      width: sizePx, height: sizePx, margin: 0,
      data: payload,
      image: centerIconSvg(t, brand),
      qrOptions: { errorCorrectionLevel: 'H' },
      imageOptions: { hideBackgroundDots: true, imageSize: t.imageSize || 0.3, margin: Math.max(2, Math.round(sizePx * 0.012)) },
      dotsOptions: Object.assign({ type: t.dotsOverride || t.dots }, st.dots),
      cornersSquareOptions: Object.assign({ type: t.corners }, st.corners),
      cornersDotOptions: Object.assign({ type: t.cornerDots }, st.cornerDots),
      backgroundOptions: { color: '#FFFFFF' },
    };
  }

  const qrCache = new Map();
  async function qrBitmap(opts) {
    const key = JSON.stringify(opts);
    if (qrCache.has(key)) return qrCache.get(key);
    const p = (async () => {
      const qr = new QRCodeStyling(opts);
      const blob = await qr.getRawData('png');
      return createImageBitmap(blob);
    })();
    qrCache.set(key, p);
    if (qrCache.size > 40) qrCache.delete(qrCache.keys().next().value);
    return p;
  }

  // ---------- helpers de desenho ----------
  const font = (ctx, weight, size, fam) => { ctx.font = `${weight} ${size}px ${fam}`; };

  function spacedWidth(ctx, text, spacing) {
    let w = 0;
    for (const ch of text) w += ctx.measureText(ch).width + spacing;
    return w - spacing;
  }
  function drawSpaced(ctx, text, x, y, spacing, align) {
    const w = spacedWidth(ctx, text, spacing);
    let cx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    const prev = ctx.textAlign;
    ctx.textAlign = 'left';
    for (const ch of text) { ctx.fillText(ch, cx, y); cx += ctx.measureText(ch).width + spacing; }
    ctx.textAlign = prev;
    return w;
  }

  function wrap(ctx, text, maxW) {
    const words = String(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width <= maxW || !line) line = test;
      else { lines.push(line); line = w; }
    }
    if (line) lines.push(line);
    return lines;
  }
  function fitLines(ctx, text, maxW, size, maxLines, weight, fam) {
    let s = size, lines;
    for (let i = 0; i < 40; i++) {
      font(ctx, weight, s, fam);
      lines = wrap(ctx, text, maxW);
      if (lines.length <= maxLines && lines.every((l) => ctx.measureText(l).width <= maxW)) break;
      s *= 0.94;
    }
    return { size: s, lines: balance(ctx, lines) };
  }
  // Duas linhas com larguras parecidas ficam mais bonitas que "Fale com a / gente".
  function balance(ctx, lines) {
    if (lines.length !== 2) return lines;
    const words = (lines[0] + ' ' + lines[1]).split(' ');
    let best = lines, bestW = Infinity;
    for (let i = 1; i < words.length; i++) {
      const a = words.slice(0, i).join(' '), b = words.slice(i).join(' ');
      const w = Math.max(ctx.measureText(a).width, ctx.measureText(b).width);
      if (w < bestW) { bestW = w; best = [a, b]; }
    }
    return best;
  }
  function fitSize(ctx, text, maxW, size, weight, fam, spacing) {
    let s = size;
    for (let i = 0; i < 40; i++) {
      font(ctx, weight, s, fam);
      const w = spacing ? spacedWidth(ctx, text, spacing * s) : ctx.measureText(text).width;
      if (w <= maxW) break;
      s *= 0.95;
    }
    return s;
  }

  function iconPath(ctx, name, x, y, size, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size / 24, size / 24);
    ctx.fillStyle = color;
    ctx.fill(new Path2D(ICONS[name]));
    ctx.restore();
  }

  function drawWordmark(ctx, brand, x, y, h, align, variant, logoImg) {
    if (logoImg) {
      const ratio = logoImg.width / logoImg.height;
      const w = h * 1.25 * ratio;
      const hh = h * 1.25;
      const lx = align === 'center' ? x - w / 2 : x;
      ctx.drawImage(logoImg, lx, y - hh * 0.1, w, hh);
      return;
    }
    const name = (brand.name || 'LUCRE').toUpperCase();
    const split = Math.min(2, name.length);
    const a = name.slice(0, split), b = name.slice(split);
    font(ctx, 900, h, DISPLAY);
    ctx.textBaseline = 'top';
    const sp = h * 0.1;
    const total = spacedWidth(ctx, a + b, sp);
    let sx = align === 'center' ? x - total / 2 : x;
    ctx.fillStyle = variant === 'dark' ? brand.cream : brand.ink;
    const wa = drawSpaced(ctx, a, sx, y, sp, 'left');
    ctx.fillStyle = variant === 'dark' ? brand.secondary : brand.primary;
    if (variant !== 'dark') {
      // no fundo claro, o "CRE" ganha um marca-texto limão
      const wb = spacedWidth(ctx, b, sp);
      ctx.save();
      ctx.fillStyle = brand.secondary;
      ctx.beginPath();
      ctx.roundRect(sx + wa + sp * 0.4, y + h * 0.42, wb + sp * 0.2, h * 0.5, h * 0.08);
      ctx.fill();
      ctx.restore();
    }
    drawSpaced(ctx, b, sx + wa + sp, y, sp, 'left');
  }

  function drawStars(ctx, cx, y, size, color, align) {
    const gap = size * 0.18;
    const total = size * 5 + gap * 4;
    let x = align === 'left' ? cx : cx - total / 2;
    for (let i = 0; i < 5; i++) { iconPath(ctx, 'star', x, y, size, color); x += size + gap; }
  }

  function drawPill(ctx, t, th, text, cx, y, h, maxW, align, brand) {
    const iconBox = h * 0.72;
    const pad = h * 0.18;
    let fs = h * 0.42;
    fs = fitSize(ctx, text, maxW - iconBox - pad * 4, fs, 600, BODY);
    font(ctx, 600, fs, BODY);
    const tw = ctx.measureText(text).width;
    const w = pad + iconBox + pad * 1.4 + tw + pad * 2.2;
    const x = align === 'left' ? cx : cx - w / 2;
    ctx.save();
    ctx.fillStyle = th.pillBg;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fill();
    if (th.pillBorder) { ctx.strokeStyle = th.pillBorder; ctx.lineWidth = Math.max(1, h * 0.03); ctx.stroke(); }
    // ícone
    const ix = x + pad, iy = y + (h - iconBox) / 2;
    if (t.id === 'instagram') {
      const g = ctx.createLinearGradient(ix, iy + iconBox, ix + iconBox, iy);
      t.gradient.forEach((c, i) => g.addColorStop(i / (t.gradient.length - 1), c));
      ctx.fillStyle = g;
    } else if (t.id === 'google') ctx.fillStyle = '#FFFFFF';
    else ctx.fillStyle = t.color || brand.secondary;
    ctx.beginPath(); ctx.arc(ix + iconBox / 2, iy + iconBox / 2, iconBox / 2, 0, Math.PI * 2); ctx.fill();
    const glyphColor = t.id === 'google' ? '#4285F4' : t.color ? '#FFFFFF' : brand.primary;
    iconPath(ctx, t.icon, ix + iconBox * 0.22, iy + iconBox * 0.22, iconBox * 0.56, glyphColor);
    ctx.fillStyle = th.pillText;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(text, ix + iconBox + pad * 1.4, y + h / 2 + fs * 0.03);
    ctx.restore();
  }

  function drawBackground(ctx, th, W, H, t) {
    if (!th.bg) return;
    const g = ctx.createLinearGradient(0, 0, W * 0.4, H);
    g.addColorStop(0, th.bg[0]); g.addColorStop(1, th.bg[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    if (t.id === 'instagram' && th.bg[0] === t.gradient[1]) {
      const g2 = ctx.createLinearGradient(0, H, W, 0);
      t.gradient.forEach((c, i) => g2.addColorStop(i / (t.gradient.length - 1), c));
      ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);
    }
    if (th.deco) {
      ctx.save();
      ctx.strokeStyle = th.deco; ctx.fillStyle = th.deco;
      const r = Math.max(W, H);
      ctx.lineWidth = r * 0.05;
      ctx.beginPath(); ctx.arc(W * 1.02, -H * 0.02, r * 0.38, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(-W * 0.1, H * 0.78, r * 0.22, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  function drawHoles(ctx, x0, y0, tw, th_, mm) {
    const r = (HOLE_CAP_MM / 2) * mm, o = HOLE_OFFSET_MM * mm;
    for (const [cx, cy] of [[x0 + o, y0 + o], [x0 + tw - o, y0 + o], [x0 + o, y0 + th_ - o], [x0 + tw - o, y0 + th_ - o]]) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = r * 0.6; ctx.shadowOffsetY = r * 0.25;
      const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r);
      g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.45, '#C9CDD2'); g.addColorStop(1, '#7D838A');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = r * 0.08;
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.82, Math.PI * 1.1, Math.PI * 1.7); ctx.stroke();
    }
  }

  // ---------- plaquinha ----------
  async function renderPlaque(spec) {
    const { t, brand, payload, texts, custom, print, dpi, preview, logos } = spec;
    const size = SIZES[print.size] || SIZES.a6;
    const bleed = print.bleed ? 3 : 0;
    const mm = dpi / 25.4;
    const W = Math.round((size.w + bleed * 2) * mm), H = Math.round((size.h + bleed * 2) * mm);
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const x0 = bleed * mm, y0 = bleed * mm, tw = size.w * mm, th_ = size.h * mm;
    const theme = custom.theme || 'lucre';
    const th = themeColors(theme, t, brand);
    const logoImg = th.logo === 'dark' ? (logos.dark || logos.light) : (logos.light || logos.dark);

    drawBackground(ctx, th, W, H, t);

    const tt = Object.assign({}, t, { dotsOverride: custom.dots && custom.dots !== 'auto' ? custom.dots : null });
    const portrait = size.h / size.w >= 1.2;
    const u = portrait ? Math.min(tw / 100, th_ / 140) : Math.min(th_ / 100, tw / 150) * 1.0;

    const kicker = (texts.kicker || '').toUpperCase();
    const footerH = (th.footerBg || brand.tagline) ? 8 * u : 0;

    if (portrait) {
      const m = 9 * u;
      const maxW = tw - m * 2;
      const logoH = 6.4 * u;
      const kickerFs = 3 * u;
      const head = fitLines(ctx, texts.headline || '', maxW, 10 * u, 2, 900, DISPLAY);
      const headLH = head.size * 1.0;
      const sub = fitLines(ctx, texts.sub || '', maxW, 5.4 * u, 2, 500, BODY);
      const subLH = sub.size * 1.2;
      const starsH = t.stars ? 6 * u : 0;
      const pillH = 9.5 * u;
      const ctaFs = 3.4 * u;
      const textBlock = (kicker ? kickerFs + 2.4 * u : 0) + head.lines.length * headLH + (sub.lines.length ? 1.6 * u + sub.lines.length * subLH : 0) + (starsH ? 2.4 * u + starsH : 0);
      const after = (texts.info ? pillH + 3 * u : 0) + (texts.cta ? ctaFs * 1.3 : 0);
      const minGap = 3.6 * u;
      const avail = th_ - m - logoH - textBlock - after - footerH - minGap * 4 - 3 * u;
      const card = Math.max(20 * u, Math.min(maxW * 0.9, avail));
      const extra = Math.max(0, avail - card) / 4;
      const gap = minGap + extra;

      let y = y0 + m * 0.85;
      drawWordmark(ctx, brand, x0 + tw / 2, y, logoH, 'center', th.logo, logoImg);
      y += logoH + gap;

      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      if (kicker) {
        const ks = fitSize(ctx, kicker, maxW, kickerFs, 800, BODY, 0.22);
        font(ctx, 800, ks, BODY);
        if (th.kickerBg) {
          const kw = spacedWidth(ctx, kicker, ks * 0.22);
          ctx.fillStyle = th.kickerBg;
          ctx.beginPath(); ctx.roundRect(x0 + tw / 2 - kw / 2 - ks * 0.8, y - ks * 0.45, kw + ks * 1.6, ks * 1.9, ks * 0.95); ctx.fill();
        }
        ctx.fillStyle = th.kicker;
        drawSpaced(ctx, kicker, x0 + tw / 2, y, ks * 0.22, 'center');
        y += kickerFs + 2.4 * u;
      }
      font(ctx, 900, head.size, DISPLAY);
      ctx.fillStyle = th.text;
      for (const l of head.lines) { drawTight(ctx, l, x0 + tw / 2, y, head.size, 'center'); y += headLH; }
      if (sub.lines.length) {
        y += 1.6 * u;
        font(ctx, 500, sub.size, BODY);
        ctx.fillStyle = th.sub; ctx.globalAlpha = th.subAlpha;
        for (const l of sub.lines) { ctx.fillText(l, x0 + tw / 2, y); y += subLH; }
        ctx.globalAlpha = 1;
      }
      if (starsH) { y += 2.4 * u; drawStars(ctx, x0 + tw / 2, y, starsH, th.star, 'center'); y += starsH; }
      y += gap;

      await drawCard(ctx, tt, th, payload, x0 + (tw - card) / 2, y, card, custom, brand, dpi);
      y += card + gap;

      if (texts.info) { drawPill(ctx, t, th, texts.info, x0 + tw / 2, y, pillH, maxW, 'center', brand); y += pillH + 3 * u; }
      if (texts.cta) {
        const cs = fitSize(ctx, texts.cta, maxW, ctaFs, 500, BODY);
        font(ctx, 500, cs, BODY); ctx.fillStyle = th.cta; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText(texts.cta, x0 + tw / 2, y);
      }
    } else {
      const m = 8 * u;
      const cardMax = th_ - m * 2 - footerH;
      const card = Math.min(cardMax, tw * 0.44);
      const colW = tw - m * 3 - card;
      const lx = x0 + m;
      const logoH = 5.6 * u;
      const kickerFs = 2.8 * u;
      const head = fitLines(ctx, texts.headline || '', colW, 10 * u, 2, 900, DISPLAY);
      const sub = fitLines(ctx, texts.sub || '', colW, 4.8 * u, 2, 500, BODY);
      const starsH = t.stars ? 5.2 * u : 0;
      const pillH = 8.5 * u;
      const ctaFs = 3.1 * u;
      const blockH = logoH + 6 * u + (kicker ? kickerFs + 2.2 * u : 0) + head.lines.length * head.size + (sub.lines.length ? 1.4 * u + sub.lines.length * sub.size * 1.2 : 0)
        + (starsH ? 2.2 * u + starsH : 0) + (texts.info ? 4.5 * u + pillH : 0) + (texts.cta ? 2.4 * u + ctaFs * 1.3 : 0);
      let y = y0 + Math.max(m * 0.8, (th_ - footerH - blockH) / 2);
      drawWordmark(ctx, brand, lx, y, logoH, 'left', th.logo, logoImg);
      y += logoH + 6 * u;
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      if (kicker) {
        const ks = fitSize(ctx, kicker, colW, kickerFs, 800, BODY, 0.22);
        font(ctx, 800, ks, BODY);
        if (th.kickerBg) {
          const kw = spacedWidth(ctx, kicker, ks * 0.22);
          ctx.fillStyle = th.kickerBg;
          ctx.beginPath(); ctx.roundRect(lx - ks * 0.8, y - ks * 0.45, kw + ks * 1.6, ks * 1.9, ks * 0.95); ctx.fill();
          ctx.fillStyle = th.kicker; drawSpaced(ctx, kicker, lx, y, ks * 0.22, 'left');
        } else { ctx.fillStyle = th.kicker; drawSpaced(ctx, kicker, lx, y, ks * 0.22, 'left'); }
        y += kickerFs + 2.2 * u;
      }
      font(ctx, 900, head.size, DISPLAY); ctx.fillStyle = th.text;
      for (const l of head.lines) { drawTight(ctx, l, lx, y, head.size, 'left'); y += head.size; }
      if (sub.lines.length) {
        y += 1.4 * u; font(ctx, 500, sub.size, BODY); ctx.fillStyle = th.sub; ctx.globalAlpha = th.subAlpha;
        for (const l of sub.lines) { ctx.fillText(l, lx, y); y += sub.size * 1.2; }
        ctx.globalAlpha = 1;
      }
      if (starsH) { y += 2.2 * u; drawStars(ctx, lx, y, starsH, th.star, 'left'); y += starsH; }
      if (texts.info) { y += 4.5 * u; drawPill(ctx, t, th, texts.info, lx, y, pillH, colW, 'left', brand); y += pillH; }
      if (texts.cta) {
        y += 2.4 * u; const cs = fitSize(ctx, texts.cta, colW, ctaFs, 500, BODY);
        font(ctx, 500, cs, BODY); ctx.fillStyle = th.cta; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(texts.cta, lx, y);
      }
      await drawCard(ctx, tt, th, payload, x0 + tw - m - card, y0 + (th_ - footerH - card) / 2, card, custom, brand, dpi);
    }

    // rodapé
    if (footerH) {
      const fy = y0 + th_ - footerH;
      if (th.footerBg) { ctx.fillStyle = th.footerBg; ctx.fillRect(0, fy, W, H - fy); }
      if (brand.tagline) {
        const fs = fitSize(ctx, brand.tagline, tw * 0.7, 2.7 * u, 700, BODY, 0.2);
        font(ctx, 700, fs, BODY); ctx.fillStyle = th.footerText; ctx.textBaseline = 'middle';
        drawSpaced(ctx, brand.tagline, x0 + tw / 2, fy + footerH / 2, fs * 0.2, 'center');
      }
    }

    if (preview && print.holes) drawHoles(ctx, x0, y0, tw, th_, mm);
    if (preview && bleed) {
      ctx.save(); ctx.setLineDash([mm * 1.5, mm * 1]); ctx.strokeStyle = 'rgba(255,60,60,.8)'; ctx.lineWidth = Math.max(1, mm * 0.2);
      ctx.strokeRect(x0, y0, tw, th_); ctx.restore();
    }
    return canvas;
  }

  // Título com espaçamento apertado, como na landing page.
  function drawTight(ctx, text, x, y, size, align) {
    drawSpaced(ctx, text, x, y, -size * 0.035, align);
  }

  async function drawCard(ctx, t, th, payload, x, y, s, custom, brand, dpi) {
    const pad = s * 0.075;
    const r = s * 0.08;
    ctx.save();
    if (th.cardShadow) { ctx.shadowColor = th.cardShadow; ctx.shadowBlur = s * 0.08; ctx.shadowOffsetY = s * 0.03; }
    ctx.fillStyle = th.card;
    ctx.beginPath(); ctx.roundRect(x, y, s, s, r); ctx.fill();
    ctx.restore();
    if (!th.bg) { ctx.strokeStyle = 'rgba(10,43,34,.15)'; ctx.lineWidth = Math.max(1, s * 0.004); ctx.beginPath(); ctx.roundRect(x, y, s, s, r); ctx.stroke(); }
    const qs = Math.round(s - pad * 2);
    const bmp = await qrBitmap(qrOptions(t, payload, Math.min(qs, 2400), custom.qrColors || 'canal', brand));
    ctx.imageSmoothingEnabled = qs < bmp.width;
    ctx.drawImage(bmp, x + pad, y + pad, qs, qs);
    ctx.imageSmoothingEnabled = true;
  }

  window.LUCRE_RENDER = { renderPlaque, qrOptions, SIZES, THEMES, HOLE_OFFSET_MM };
})();
