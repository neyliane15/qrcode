// Interface do estúdio de plaquinhas.
(function () {
  const TYPES = window.LUCRE_TYPES;
  const R = window.LUCRE_RENDER;
  const ICONS = window.LUCRE_ICONS;
  const BRAND_DEFAULT = window.LUCRE_BRAND;
  const STORAGE_KEY = 'lucre-qr-studio-v1';
  const $ = (s, el = document) => el.querySelector(s);

  const DOT_STYLES = [
    ['auto', 'Padrão do canal'], ['square', 'Quadrado'], ['rounded', 'Arredondado'], ['extra-rounded', 'Bem arredondado'],
    ['dots', 'Bolinhas'], ['classy', 'Elegante'], ['classy-rounded', 'Elegante arredondado'],
  ];

  // ---------- estado ----------
  function freshState() {
    const s = { type: 'whatsapp', brand: Object.assign({}, BRAND_DEFAULT), data: {}, custom: {}, print: { size: 'a6', bleed: false, holes: true } };
    for (const t of TYPES) {
      s.data[t.id] = Object.assign({}, t.defaults || {});
      s.custom[t.id] = { theme: 'lucre', qrColors: 'canal', dots: 'auto', headline: null, sub: null, kicker: null, info: null, cta: null };
    }
    s.custom.google.theme = 'creme';
    s.custom.pix.theme = 'creme';
    return s;
  }
  function load() {
    const s = freshState();
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved) {
        if (saved.type && TYPES.some((t) => t.id === saved.type)) s.type = saved.type;
        Object.assign(s.brand, saved.brand || {});
        Object.assign(s.print, saved.print || {});
        for (const t of TYPES) {
          Object.assign(s.data[t.id], (saved.data || {})[t.id] || {});
          Object.assign(s.custom[t.id], (saved.custom || {})[t.id] || {});
        }
      }
    } catch (e) { /* armazenamento indisponível */ }
    return s;
  }
  let state = load();
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* cheio ou bloqueado */ }
  }

  const typeById = (id) => TYPES.find((t) => t.id === id);
  const cur = () => typeById(state.type);

  function resolve(t, useExample) {
    const data = state.data[t.id];
    let payload = t.build(data);
    let example = false;
    let d = data;
    if (!payload && useExample) { d = Object.assign({}, data, t.example); payload = t.build(d); example = true; }
    const c = state.custom[t.id];
    const pick = (k, def) => (c[k] !== null && c[k] !== undefined ? c[k] : def);
    const texts = {
      kicker: pick('kicker', t.id === 'system' && data.name ? data.name : t.label),
      headline: pick('headline', t.headline),
      sub: pick('sub', t.sub),
      info: pick('info', payload ? t.info(d) : ''),
      cta: pick('cta', t.cta),
    };
    return { payload, example, texts, custom: c };
  }

  // ---------- logos ----------
  const logoCache = {};
  function loadImg(src) {
    if (!src) return Promise.resolve(null);
    if (logoCache[src]) return logoCache[src];
    logoCache[src] = new Promise((res) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => res(null);
      im.src = src;
    });
    return logoCache[src];
  }
  async function logos() {
    return { light: await loadImg(state.brand.logoLight), dark: await loadImg(state.brand.logoDark) };
  }

  async function render(t, dpi, preview) {
    const r = resolve(t, true);
    return R.renderPlaque({ t, brand: state.brand, payload: r.payload, texts: r.texts, custom: r.custom, print: state.print, dpi, preview, logos: await logos() });
  }

  // ---------- UI: tipos ----------
  function iconSvg(name, cls) {
    return `<svg class="${cls || ''}" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[name]}"/></svg>`;
  }
  function buildTypeNav() {
    const nav = $('#types');
    nav.innerHTML = TYPES.map((t) => `
      <button class="type-btn" data-type="${t.id}" style="--c:${t.color || 'var(--lime)'}">
        <span class="type-ico ${t.id}">${iconSvg(t.icon)}</span>
        <span class="type-name">${t.label}</span>
        <span class="type-status" aria-hidden="true"></span>
        ${t.extra ? '<span class="type-tag">bônus</span>' : ''}
      </button>`).join('');
    nav.addEventListener('click', (e) => {
      const b = e.target.closest('.type-btn');
      if (!b) return;
      state.type = b.dataset.type;
      save();
      buildEditor();
      scheduleRender(true);
    });
  }
  function refreshTypeNav() {
    for (const b of document.querySelectorAll('.type-btn')) {
      const t = typeById(b.dataset.type);
      b.classList.toggle('active', t.id === state.type);
      b.classList.toggle('ready', !!t.build(state.data[t.id]));
    }
  }

  // ---------- UI: editor ----------
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function fieldHtml(t, f) {
    const v = state.data[t.id][f.key] || '';
    const id = `f-${t.id}-${f.key}`;
    let input;
    if (f.type === 'select') {
      input = `<select id="${id}" data-field="${f.key}">${f.options.map(([val, lab]) => `<option value="${val}" ${val === v ? 'selected' : ''}>${lab}</option>`).join('')}</select>`;
    } else if (f.type === 'textarea') {
      input = `<textarea id="${id}" data-field="${f.key}" rows="2" placeholder="${esc(f.placeholder)}">${esc(v)}</textarea>`;
    } else {
      input = `<input id="${id}" data-field="${f.key}" type="${f.type === 'tel' ? 'tel' : 'text'}" inputmode="${f.type === 'tel' ? 'tel' : f.type === 'url' ? 'url' : 'text'}" placeholder="${esc(f.placeholder)}" value="${esc(v)}" autocomplete="off">`;
    }
    return `<label class="field" for="${id}"><span>${f.label}</span>${input}${f.help ? `<small>${f.help}</small>` : ''}</label>`;
  }

  function textFieldHtml(t, key, label, def) {
    const c = state.custom[t.id];
    const v = c[key] !== null && c[key] !== undefined ? c[key] : def;
    return `<label class="field"><span>${label}</span><input data-text="${key}" type="text" value="${esc(v)}" placeholder="(vazio = não mostrar)"></label>`;
  }

  function buildEditor() {
    const t = cur();
    const c = state.custom[t.id];
    const r = resolve(t, false);
    const sizeOpts = Object.entries(R.SIZES).map(([k, s]) => `<option value="${k}" ${k === state.print.size ? 'selected' : ''}>${s.label}</option>`).join('');
    const dotOpts = DOT_STYLES.map(([k, l]) => `<option value="${k}" ${k === (c.dots || 'auto') ? 'selected' : ''}>${l}</option>`).join('');
    const themes = Object.entries(R.THEMES).map(([k, th]) => `
      <button class="theme-chip ${k === c.theme ? 'active' : ''}" data-theme="${k}" title="${th.label}">
        <span class="swatch sw-${k}" style="--c1:${t.color || 'var(--lime)'};--c2:${t.colorDark || '#6FBF2A'}"></span>${th.label}
      </button>`).join('');

    $('#editor').innerHTML = `
      <div class="panel">
        <div class="panel-head">
          <span class="type-ico big ${t.id}" style="--c:${t.color || 'var(--lime)'}">${iconSvg(t.icon)}</span>
          <div><h2>${t.label}</h2><p class="muted">Preencha os dados que o QR Code vai abrir.</p></div>
        </div>
        <div class="fields">${t.fields.map((f) => fieldHtml(t, f)).join('')}</div>
        ${t.hint ? `<p class="hint">💡 ${t.hint}</p>` : ''}
        <div class="payload" id="payload"></div>
      </div>

      <div class="panel">
        <h3>Textos da plaquinha</h3>
        <div class="fields two">
          ${textFieldHtml(t, 'kicker', 'Etiqueta', t.id === 'system' && state.data[t.id].name ? state.data[t.id].name : t.label)}
          ${textFieldHtml(t, 'headline', 'Título', t.headline)}
          ${textFieldHtml(t, 'sub', 'Subtítulo', t.sub)}
          ${textFieldHtml(t, 'info', 'Informação (selo)', r.payload ? t.info(state.data[t.id]) : '')}
          ${textFieldHtml(t, 'cta', 'Chamada final', t.cta)}
        </div>
        <button class="link-btn" id="reset-texts">↺ Voltar aos textos sugeridos</button>
      </div>

      <div class="panel">
        <h3>Estilo</h3>
        <div class="themes">${themes}</div>
        <div class="fields two">
          <label class="field"><span>Desenho dos pontos</span><select id="dots">${dotOpts}</select></label>
          <label class="field"><span>Cores do QR</span>
            <select id="qrColors">
              <option value="canal" ${c.qrColors === 'canal' ? 'selected' : ''}>Cores do canal</option>
              <option value="marca" ${c.qrColors === 'marca' ? 'selected' : ''}>Verde Lucre</option>
            </select></label>
        </div>
      </div>

      <div class="panel">
        <h3>Impressão no acrílico <small class="muted">(vale para todas)</small></h3>
        <div class="fields two">
          <label class="field"><span>Tamanho</span><select id="size">${sizeOpts}</select></label>
          <div class="checks">
            <label class="check"><input type="checkbox" id="holes" ${state.print.holes ? 'checked' : ''}> Prever furos dos espaçadores</label>
            <label class="check"><input type="checkbox" id="bleed" ${state.print.bleed ? 'checked' : ''}> Sangria de 3 mm (gráfica)</label>
          </div>
        </div>
      </div>`;

    const ed = $('#editor');
    ed.querySelectorAll('[data-field]').forEach((el) => el.addEventListener('input', () => {
      state.data[t.id][el.dataset.field] = el.value;
      // informação do selo acompanha os dados enquanto não for editada à mão
      save(); updatePayload(); refreshAutoInfo(); scheduleRender();
    }));
    ed.querySelectorAll('[data-text]').forEach((el) => el.addEventListener('input', () => {
      state.custom[t.id][el.dataset.text] = el.value;
      save(); scheduleRender();
    }));
    $('#reset-texts').addEventListener('click', () => {
      Object.assign(state.custom[t.id], { headline: null, sub: null, kicker: null, info: null, cta: null });
      save(); buildEditor(); scheduleRender();
    });
    ed.querySelectorAll('.theme-chip').forEach((b) => b.addEventListener('click', () => {
      c.theme = b.dataset.theme; save();
      ed.querySelectorAll('.theme-chip').forEach((x) => x.classList.toggle('active', x === b));
      scheduleRender();
    }));
    $('#dots').addEventListener('change', (e) => { c.dots = e.target.value; save(); scheduleRender(); });
    $('#qrColors').addEventListener('change', (e) => { c.qrColors = e.target.value; save(); scheduleRender(); });
    $('#size').addEventListener('change', (e) => { state.print.size = e.target.value; save(); scheduleRender(); });
    $('#holes').addEventListener('change', (e) => { state.print.holes = e.target.checked; save(); scheduleRender(); });
    $('#bleed').addEventListener('change', (e) => { state.print.bleed = e.target.checked; save(); scheduleRender(); });
    updatePayload();
    refreshTypeNav();
  }

  function refreshAutoInfo() {
    const t = cur();
    const c = state.custom[t.id];
    const r = resolve(t, false);
    if (c.info === null) { const el = $('[data-text="info"]'); if (el) el.value = r.payload ? t.info(state.data[t.id]) : ''; }
    if (c.kicker === null && t.id === 'system') { const el = $('[data-text="kicker"]'); if (el) el.value = state.data[t.id].name || t.label; }
  }

  function updatePayload() {
    const t = cur();
    const r = resolve(t, false);
    const box = $('#payload');
    if (!box) return;
    if (!r.payload) {
      box.className = 'payload empty';
      box.innerHTML = 'Preencha os dados acima. Enquanto isso, a prévia mostra um <b>exemplo</b>.';
    } else {
      const isLink = /^https?:\/\//.test(r.payload);
      box.className = 'payload ok';
      box.innerHTML = `
        <span class="payload-label">${t.id === 'pix' ? 'Pix Copia e Cola' : isLink ? 'Link do QR Code' : 'Conteúdo do QR Code'}</span>
        <code>${esc(r.payload)}</code>
        <div class="payload-actions">
          <button class="mini" id="copy">Copiar</button>
          ${isLink ? `<a class="mini" href="${esc(r.payload)}" target="_blank" rel="noopener">Testar ↗</a>` : ''}
        </div>`;
      $('#copy').addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(r.payload); toast('Copiado!'); } catch (e) { toast('Não foi possível copiar'); }
      });
    }
    refreshTypeNav();
    refreshExportState();
  }

  function refreshExportState() {
    const r = resolve(cur(), false);
    const ok = !!r.payload;
    document.querySelectorAll('[data-needs-data]').forEach((b) => { b.disabled = !ok; });
    $('#preview-badge').hidden = ok;
    const ready = TYPES.filter((t) => t.build(state.data[t.id])).length;
    $('#kit-count').textContent = ready;
    $('#kit-btn').disabled = !ready;
  }

  // ---------- prévia ----------
  let renderTimer = null, renderSeq = 0;
  function scheduleRender(now) {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(doRender, now ? 0 : 120);
  }
  async function doRender() {
    const seq = ++renderSeq;
    const t = cur();
    const size = R.SIZES[state.print.size];
    const stage = $('#stage');
    const maxW = stage.clientWidth - 48, maxH = Math.min(window.innerHeight * 0.68, 720);
    const bleed = state.print.bleed ? 6 : 0;
    const scale = Math.min(maxW / (size.w + bleed), maxH / (size.h + bleed));
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const dpi = scale * 25.4 * dpr;
    const canvas = await render(t, dpi, true);
    if (seq !== renderSeq) return;
    const out = $('#plaque');
    out.width = canvas.width; out.height = canvas.height;
    out.getContext('2d').drawImage(canvas, 0, 0);
    out.style.width = canvas.width / dpr + 'px';
    out.style.height = canvas.height / dpr + 'px';
    const wrap = $('#plaque-wrap');
    wrap.className = 'plaque-wrap theme-' + state.custom[t.id].theme;
    wrap.style.setProperty('--r', (3 * scale) + 'px');
    $('#spec').innerHTML = `<b>${size.label}</b> · arte em 300 dpi${state.print.bleed ? ' + 3 mm de sangria' : ''}${state.print.holes ? ` · furos a ${R.HOLE_OFFSET_MM} mm das bordas` : ''}`;
  }

  // ---------- exportação ----------
  const fileBase = (t) => `lucre-${t.id}-${R.SIZES[state.print.size].label.replace(/[^\dx×]/gi, '').replace('×', 'x')}`;

  function downloadBlob(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  async function exportPNG() {
    const t = cur();
    busy(true, 'Gerando PNG em alta…');
    try {
      const canvas = await render(t, 300, false);
      const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
      downloadBlob(blob, fileBase(t) + '.png');
      toast('PNG pronto para a gráfica ✔');
    } finally { busy(false); }
  }

  async function exportSVG() {
    const t = cur();
    const r = resolve(t, false);
    if (!r.payload) return;
    const qr = new QRCodeStyling(R.qrOptions(Object.assign({}, t, { dotsOverride: r.custom.dots !== 'auto' ? r.custom.dots : null }), r.payload, 1000, r.custom.qrColors, state.brand, 'svg'));
    const blob = await qr.getRawData('svg');
    downloadBlob(blob, `lucre-${t.id}-qrcode.svg`);
    toast('QR Code vetorial baixado ✔');
  }

  async function printTypes(list) {
    if (!list.length) return;
    busy(true, list.length > 1 ? `Preparando ${list.length} plaquinhas…` : 'Preparando impressão…');
    try {
      const size = R.SIZES[state.print.size];
      const b = state.print.bleed ? 6 : 0;
      const w = size.w + b, h = size.h + b;
      const area = $('#print-area');
      area.innerHTML = '';
      for (const t of list) {
        const canvas = await render(t, 300, false);
        const img = new Image();
        img.src = canvas.toDataURL('image/png');
        img.style.width = w + 'mm'; img.style.height = h + 'mm';
        area.appendChild(img);
        await img.decode().catch(() => {});
      }
      $('#page-style').textContent = `@page { size: ${w}mm ${h}mm; margin: 0; }`;
    } finally { busy(false); }
    window.print();
  }

  // ---------- painel da marca ----------
  function buildBrandDialog() {
    const dlg = $('#brand-dialog');
    const f = $('#brand-form');
    const fill = () => {
      f.name.value = state.brand.name; f.primary.value = state.brand.primary; f.secondary.value = state.brand.secondary;
      f.cream.value = state.brand.cream; f.tagline.value = state.brand.tagline || '';
      $('#logo-light-prev').src = state.brand.logoLight || ''; $('#logo-dark-prev').src = state.brand.logoDark || '';
      $('#logo-light-prev').hidden = !state.brand.logoLight; $('#logo-dark-prev').hidden = !state.brand.logoDark;
    };
    $('#brand-btn').addEventListener('click', () => { fill(); dlg.showModal(); });
    f.addEventListener('input', (e) => {
      const k = e.target.name;
      if (['name', 'primary', 'secondary', 'cream', 'tagline'].includes(k)) {
        state.brand[k] = e.target.value;
        if (k === 'primary') state.brand.ink = e.target.value;
        save(); applyBrandCss(); scheduleRender();
      }
    });
    for (const [inputId, key] of [['logo-light', 'logoLight'], ['logo-dark', 'logoDark']]) {
      $('#' + inputId).addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const rd = new FileReader();
        rd.onload = () => { state.brand[key] = rd.result; save(); fill(); scheduleRender(); };
        rd.readAsDataURL(file);
      });
    }
    $('#logo-clear').addEventListener('click', () => { state.brand.logoLight = BRAND_DEFAULT.logoLight; state.brand.logoDark = BRAND_DEFAULT.logoDark; save(); fill(); scheduleRender(); });
    $('#brand-reset').addEventListener('click', () => { state.brand = Object.assign({}, BRAND_DEFAULT); save(); fill(); applyBrandCss(); scheduleRender(); });
  }
  function applyBrandCss() {
    const s = document.documentElement.style;
    s.setProperty('--green', state.brand.primary);
    s.setProperty('--lime', state.brand.secondary);
    s.setProperty('--cream', state.brand.cream);
  }

  // ---------- utilidades ----------
  let toastTimer;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }
  function busy(on, msg) {
    const el = $('#busy');
    el.hidden = !on;
    if (msg) $('#busy-msg').textContent = msg;
  }

  // ---------- início ----------
  async function init() {
    applyBrandCss();
    buildTypeNav();
    buildEditor();
    buildBrandDialog();
    $('#png-btn').addEventListener('click', exportPNG);
    $('#svg-btn').addEventListener('click', exportSVG);
    $('#print-btn').addEventListener('click', () => printTypes([cur()]));
    $('#kit-btn').addEventListener('click', () => printTypes(TYPES.filter((t) => t.build(state.data[t.id]))));
    window.addEventListener('resize', () => scheduleRender());
    try {
      await Promise.all(['900 40px Archivo', '800 20px Outfit', '700 20px Outfit', '600 20px Outfit', '500 20px Outfit'].map((f) => document.fonts.load(f)));
    } catch (e) { /* segue com as fontes do sistema */ }
    scheduleRender(true);
  }
  document.addEventListener('DOMContentLoaded', init);
})();
