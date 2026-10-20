# Lucre · Estúdio de QR Codes

Gerador de QR Codes personalizados da **Lucre**, com arte pronta para plaquinha de acrílico.

**Canais:** WhatsApp · Instagram · Avaliação Google · Pix (BR Code oficial, com CRC) · Site · Sistema · Wi-Fi (bônus)

## O que dá pra fazer
- Cada canal tem visual próprio (cores, desenho dos pontos, ícone no centro do QR) e textos sugeridos editáveis.
- 4 estilos de fundo: **Lucre escuro**, **Creme**, **Cor do canal** e **Acrílico cristal** (fundo transparente).
- Tamanhos: 10×15 cm, 15×20 cm, A5, quadrada 12×12 cm e horizontal 15×10 cm.
- Prévia realista em acrílico com espaçadores; opção de sangria de 3 mm para a gráfica.
- Exporta **PNG em 300 dpi**, **QR vetorial (SVG)**, **impressão/PDF no tamanho exato** e o **kit completo** (todas as plaquinhas preenchidas de uma vez).
- Painel **Marca**: troca cores, frase do rodapé e envia a logo em imagem (fica salvo no navegador).

## Estrutura
Site estático, sem build — basta publicar a pasta.

```
index.html        página
styles.css        visual do app
js/brand.js       cores e logo padrão da Lucre  ← ajuste aqui
js/types.js       canais, campos e geração do conteúdo (Pix, WhatsApp…)
js/render.js      desenho da plaquinha
js/app.js         interface
vendor/           qr-code-styling (MIT)
```

Para testar localmente: `python3 -m http.server` e abra http://localhost:8000.

## Deploy na Vercel (automático)
1. Entre em https://vercel.com com sua conta do GitHub.
2. **Add New → Project** → importe o repositório `neyliane15/qrcode`.
3. Framework Preset: **Other** · Build Command: vazio · Output Directory: vazio (raiz) → **Deploy**.
4. A cada `git push`, a Vercel publica sozinha: o branch de produção (Settings → Git → Production Branch) vai para o link oficial; os outros branches geram links de prévia.
