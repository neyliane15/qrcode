// Tipos de QR Code: campos do formulário, como montar o conteúdo e o visual padrão de cada um.
(function () {
  const onlyDigits = (s) => String(s || '').replace(/\D/g, '');
  const ensureUrl = (s) => {
    s = String(s || '').trim();
    if (!s) return '';
    return /^[a-z][a-z0-9+.-]*:\/\//i.test(s) ? s : 'https://' + s;
  };
  const isUrl = (s) => {
    try { const u = new URL(ensureUrl(s)); return /\./.test(u.hostname); } catch (e) { return false; }
  };
  const hostOf = (s) => {
    try { return new URL(ensureUrl(s)).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
  };

  function formatPhoneBR(digits) {
    let d = digits.startsWith('55') && digits.length > 11 ? digits.slice(2) : digits;
    if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return digits;
  }
  function waNumber(phone) {
    const d = onlyDigits(phone);
    if (d.length === 10 || d.length === 11) return '55' + d;
    return d;
  }

  // ---------- Pix (BR Code estático, padrão EMV do Banco Central) ----------
  function crc16(str) {
    let crc = 0xffff;
    for (let i = 0; i < str.length; i++) {
      crc ^= str.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }
  const emv = (id, v) => id + String(v.length).padStart(2, '0') + v;
  const plain = (s, max) => String(s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 .\-]/g, '').trim().toUpperCase().slice(0, max);

  function pixKey(type, raw) {
    raw = String(raw || '').trim();
    switch (type) {
      case 'cpf': return onlyDigits(raw);
      case 'phone': {
        const d = onlyDigits(raw);
        return d ? '+' + (d.startsWith('55') && d.length > 11 ? d : '55' + d) : '';
      }
      case 'email': return raw.toLowerCase();
      default: return raw;
    }
  }
  function pixKeyValid(type, key) {
    switch (type) {
      case 'cpf': return key.length === 11 || key.length === 14;
      case 'phone': return /^\+55\d{10,11}$/.test(key);
      case 'email': return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key);
      default: return key.length >= 8 && key.length <= 77;
    }
  }
  function parseAmount(s) {
    s = String(s || '').trim();
    if (!s) return null;
    s = s.replace(/[^\d,.]/g, '');
    if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    const n = Number(s);
    return isFinite(n) && n > 0 ? n : null;
  }
  function pixPayload(d) {
    const key = pixKey(d.keyType, d.key);
    if (!pixKeyValid(d.keyType, key) || !plain(d.name, 25) || !plain(d.city, 15)) return null;
    let gui = emv('00', 'br.gov.bcb.pix') + emv('01', key);
    const desc = plain(d.desc, 99 - gui.length - 4);
    if (desc) gui += emv('02', desc);
    const amount = parseAmount(d.amount);
    const txid = String(d.txid || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***';
    let p = emv('00', '01') + emv('26', gui) + emv('52', '0000') + emv('53', '986');
    if (amount) p += emv('54', amount.toFixed(2));
    p += emv('58', 'BR') + emv('59', plain(d.name, 25)) + emv('60', plain(d.city, 15));
    p += emv('62', emv('05', txid)) + '6304';
    return p + crc16(p);
  }

  const wifiEsc = (s) => String(s || '').replace(/([\\;,:"])/g, '\\$1');

  window.LUCRE_TYPES = [
    {
      id: 'whatsapp', label: 'WhatsApp', icon: 'whatsapp',
      color: '#25D366', colorDark: '#075E54',
      headline: 'Fale com a gente', sub: 'pelo WhatsApp',
      cta: 'Aponte a câmera e mande um “oi”',
      dots: 'rounded', corners: 'extra-rounded', cornerDots: 'dot',
      fields: [
        { key: 'phone', label: 'Número com DDD', type: 'tel', placeholder: '(11) 99999-9999' },
        { key: 'message', label: 'Mensagem pronta (opcional)', type: 'textarea', placeholder: 'Olá! Vim pela plaquinha da Lucre 😊' },
      ],
      example: { phone: '11999999999', message: '' },
      build(d) {
        const n = waNumber(d.phone);
        if (n.length < 12) return null;
        return 'https://wa.me/' + n + (d.message ? '?text=' + encodeURIComponent(d.message) : '');
      },
      info: (d) => formatPhoneBR(onlyDigits(d.phone)),
    },
    {
      id: 'instagram', label: 'Instagram', icon: 'instagram',
      color: '#DD2A7B', colorDark: '#515BD4',
      gradient: ['#FEDA75', '#FA7E1E', '#D62976', '#962FBF', '#4F5BD5'],
      qrGradient: ['#F58529', '#DD2A7B', '#8134AF', '#515BD4'],
      headline: 'Siga a gente', sub: 'no Instagram',
      cta: 'Aponte a câmera e siga',
      dots: 'dots', corners: 'extra-rounded', cornerDots: 'dot',
      fields: [
        { key: 'user', label: 'Usuário do Instagram', type: 'text', placeholder: '@lucre' },
      ],
      example: { user: 'lucre' },
      build(d) {
        const u = String(d.user || '').trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/\/.*$/, '');
        return /^[A-Za-z0-9._]{1,30}$/.test(u) ? 'https://instagram.com/' + u : null;
      },
      info: (d) => '@' + String(d.user || '').trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/\/.*$/, ''),
    },
    {
      id: 'google', label: 'Avaliação Google', icon: 'google',
      color: '#4285F4', colorDark: '#1A3E8C',
      googleColors: ['#4285F4', '#EA4335', '#FBBC05', '#34A853'],
      headline: 'Gostou?', sub: 'Avalie a gente no Google',
      cta: 'Leva só 1 minutinho. Obrigado! 💛',
      stars: true,
      dots: 'classy-rounded', corners: 'extra-rounded', cornerDots: 'dot',
      fields: [
        { key: 'place', label: 'Link de avaliação ou Place ID', type: 'text', placeholder: 'https://g.page/r/XXXX/review  ou  ChIJ...',
          help: 'No Perfil da Empresa no Google: “Pedir avaliações” → copie o link. Ou use o <a href="https://developers.google.com/maps/documentation/places/web-service/place-id" target="_blank" rel="noopener">localizador de Place ID</a>.' },
      ],
      example: { place: 'ChIJN1t_tDeuEmsRUsoyG83frY4' },
      build(d) {
        const v = String(d.place || '').trim();
        if (!v) return null;
        if (/^https?:\/\//i.test(v) || /\.(com|page|gl|br)\b/i.test(v)) return isUrl(v) ? ensureUrl(v) : null;
        return /^[A-Za-z0-9_-]{10,}$/.test(v) ? 'https://search.google.com/local/writereview?placeid=' + v : null;
      },
      info: () => 'Sua opinião faz a diferença',
    },
    {
      id: 'pix', label: 'Pix', icon: 'pix',
      color: '#32BCAD', colorDark: '#0E5E57',
      headline: 'Pague com Pix', sub: 'rápido, fácil e seguro',
      cta: 'Abra o app do banco e escaneie',
      dots: 'rounded', corners: 'extra-rounded', cornerDots: 'dot', imageSize: 0.24,
      fields: [
        { key: 'keyType', label: 'Tipo de chave', type: 'select', options: [['cpf', 'CPF / CNPJ'], ['phone', 'Celular'], ['email', 'E-mail'], ['random', 'Chave aleatória']] },
        { key: 'key', label: 'Chave Pix', type: 'text', placeholder: 'Sua chave' },
        { key: 'name', label: 'Nome do recebedor', type: 'text', placeholder: 'LUCRE LTDA' },
        { key: 'city', label: 'Cidade', type: 'text', placeholder: 'São Paulo' },
        { key: 'amount', label: 'Valor fixo (opcional)', type: 'text', placeholder: 'Em branco = cliente digita o valor' },
        { key: 'desc', label: 'Descrição (opcional)', type: 'text', placeholder: '' },
      ],
      example: { keyType: 'email', key: 'pix@lucre.com.br', name: 'Lucre', city: 'Sao Paulo' },
      defaults: { keyType: 'cpf' },
      build: pixPayload,
      info(d) {
        const k = pixKey(d.keyType, d.key);
        if (d.keyType === 'phone') return 'Chave: ' + formatPhoneBR(onlyDigits(k));
        if (d.keyType === 'cpf' && k.length === 14) return 'CNPJ: ' + k.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
        if (d.keyType === 'cpf' && k.length === 11) return 'CPF: ' + k.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        return 'Chave: ' + k;
      },
      hint: 'Confira sempre com um app de banco antes de mandar imprimir.',
    },
    {
      id: 'site', label: 'Site', icon: 'globe',
      color: null, // usa a cor da marca
      headline: 'Conheça nosso site', sub: 'novidades e muito mais',
      cta: 'Aponte a câmera do celular',
      dots: 'classy', corners: 'extra-rounded', cornerDots: 'square',
      fields: [{ key: 'url', label: 'Endereço do site', type: 'url', placeholder: 'www.lucre.com.br' }],
      example: { url: 'lucre.com.br' },
      build: (d) => (isUrl(d.url) ? ensureUrl(d.url) : null),
      info: (d) => hostOf(d.url),
    },
    {
      id: 'system', label: 'Sistema', icon: 'system',
      color: null,
      headline: 'Acesse o sistema', sub: 'faça seu login',
      cta: 'Escaneie para entrar',
      dots: 'square', corners: 'square', cornerDots: 'square',
      fields: [
        { key: 'url', label: 'Link do sistema', type: 'url', placeholder: 'app.lucre.com.br' },
        { key: 'name', label: 'Nome do sistema (opcional)', type: 'text', placeholder: 'Portal Lucre' },
      ],
      example: { url: 'app.lucre.com.br' },
      build: (d) => (isUrl(d.url) ? ensureUrl(d.url) : null),
      info: (d) => d.name || hostOf(d.url),
    },
    {
      id: 'wifi', label: 'Wi-Fi', icon: 'wifi', extra: true,
      color: '#5B6CFF', colorDark: '#22267A',
      headline: 'Wi-Fi grátis', sub: 'conecte-se sem digitar senha',
      cta: 'Aponte a câmera para conectar',
      dots: 'extra-rounded', corners: 'extra-rounded', cornerDots: 'dot',
      fields: [
        { key: 'ssid', label: 'Nome da rede', type: 'text', placeholder: 'Lucre_Clientes' },
        { key: 'pass', label: 'Senha', type: 'text', placeholder: '' },
        { key: 'sec', label: 'Segurança', type: 'select', options: [['WPA', 'WPA/WPA2'], ['WEP', 'WEP'], ['nopass', 'Sem senha']] },
      ],
      example: { ssid: 'Lucre_Clientes', pass: '12345678', sec: 'WPA' },
      defaults: { sec: 'WPA' },
      build(d) {
        if (!d.ssid) return null;
        const sec = d.sec || 'WPA';
        return `WIFI:T:${sec};S:${wifiEsc(d.ssid)};${sec !== 'nopass' ? 'P:' + wifiEsc(d.pass) + ';' : ''};`;
      },
      info: (d) => 'Rede: ' + (d.ssid || ''),
    },
  ];
})();
