# POP — CMS Embutido em Site Clonado

> Versão: 1.0 · Status: Ativo · Última atualização: 2026-07-19  
> Projeto de referência: `clone-site-2/` (A Chave · Outsider School)

---

## Objetivo

Construir um CMS leve, sem banco de dados e sem framework frontend, que permita um usuário não-técnico customizar todos os elementos visuais e textuais de um site HTML estático clonado — sem tocar em código.

---

## Quando usar

- Você tem um site HTML/CSS/JS estático (clonado ou próprio)
- O cliente precisa trocar cores, textos, imagens e vídeos sem depender de dev
- Não há infraestrutura de banco de dados disponível (servidor VPS simples ou local)
- O acesso ao painel precisa ser protegido por senha

---

## Stack

| Camada | Tecnologia | Motivo |
|---|---|---|
| Servidor | Node.js + Express | Leve, sem build, roda em qualquer VPS |
| Persistência | `config.json` (arquivo local) | Zero banco de dados, fácil backup |
| Auth | `bcryptjs` + `jsonwebtoken` | Senha segura sem expor plain text |
| Upload | `multer` | Middleware padrão para multipart/form-data |
| Frontend site | HTML/CSS/JS puro | Sem build step, idêntico ao clone |
| Frontend painel | HTML/CSS/JS puro | Mesma filosofia, sem dependências |

```bash
npm install express multer jsonwebtoken bcryptjs
```

---

## Arquitetura de Arquivos

```
projeto/
├── server.js                  ← servidor Express (API + static)
├── package.json
├── config.json                ← tema ativo (editado pelo CMS)
├── config-defaults.json       ← cópia imutável dos valores originais
├── config-loader.js           ← script injetado no site que aplica o config
├── custom-assets/             ← uploads do usuário (no .gitignore)
│   └── .gitkeep
├── admin/
│   ├── index.html             ← painel CMS completo
│   ├── admin.css              ← estilo dark do painel
│   └── admin.js               ← lógica do painel (auth, seções, preview, save)
├── index.html                 ← site clonado instrumentado com data-cms*
└── [demais assets do site clonado]
```

---

## Padrão de Instrumentação do HTML (`data-cms*`)

Todo elemento editável no `index.html` recebe um atributo `data-cms*` que serve como "gancho" para o `config-loader.js` e o preview ao vivo do painel.

| Atributo | Uso | Exemplo |
|---|---|---|
| `data-cms="chave"` | Texto/HTML editável | `<span data-cms="brand-name">A CHAVE</span>` |
| `data-cms-img="chave"` | Imagem substituível | `<img data-cms-img="logo" src="..."/>` |
| `data-cms-href="chave"` | Link editável | `<a data-cms-href="whatsapp-url" href="...">` |
| `data-cms-cta="índice"` | Texto de botão CTA (array) | `<span data-cms-cta="0">Quero aplicar</span>` |

**Regra:** nunca colocar lógica de negócio nesses atributos — apenas chaves de lookup no `config.json`.

---

## config.json — Estrutura de Seções

```
config.json
├── colors        → variáveis CSS custom properties (--bg, --text, --accent, etc.)
├── buttons       → --radius*, textos dos CTAs, URLs WhatsApp
├── typography    → --font-body, --font-display, --fs-body, --fs-display-*-max
├── copy          → textos de interface (hero, modal, footer)
├── images        → paths dos uploads (null = usa o original do site)
├── video         → { "youtube-id": "XXXXXXXXXXX" }
└── seo           → title, description, og-title, og-description, og-image, favicon
```

**Princípio:** `null` em qualquer campo de imagem significa "usar o asset original do clone". O CMS só sobrescreve quando o usuário faz upload.

**config-defaults.json** é uma cópia idêntica criada na primeira vez e nunca sobrescrita — serve exclusivamente para o endpoint `/api/reset`.

---

## config-loader.js — Responsabilidades

Arquivo carregado no `<head>` do site (antes de `</head>`):

```html
<script src="/config-loader.js"></script>
```

Ordem de aplicação:

1. `GET /api/config` → lê o JSON
2. **CSS vars de cores** → `root.style.setProperty(k, v)` para todo `colors`
3. **CSS vars de tipografia** → `--font-body`, `--font-display`, `--fs-body`
4. **Clamp dinâmico** → `--fs-display-xl` e `--fs-display-lg` com `clamp(min, fluid, max)`
5. **CSS vars de radius** → `--radius`, `--radius-sm`, `--radius-lg`, `--radius-xl`
6. **Textos** → `[data-cms="chave"]` → `el.innerHTML = copy[chave]`
7. **Textos CTA** → `[data-cms-cta="idx"]` → `el.textContent = buttons['cta-texts'][idx]`
8. **Links WhatsApp** → `[data-cms-href="whatsapp-url"]` → `el.href = ...`
9. **Imagens** → `[data-cms-img="chave"]` → `el.src = images[chave]` (ignora se null)
10. **Vídeo YouTube** → `[data-video-id]` → `el.dataset.videoId = ytId` + thumb src
11. **SEO** → `document.title`, `meta[name]`, `meta[property]`, `link[rel=icon]`

---

## server.js — API REST

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `POST` | `/api/auth` | ✗ | Valida senha bcrypt → retorna JWT 1h |
| `GET` | `/api/config` | ✗ | Lê e retorna config.json (site precisa ler sem auth) |
| `POST` | `/api/config` | ✓ JWT | Sobrescreve config.json com o payload recebido |
| `POST` | `/api/upload/:field` | ✓ JWT | Upload de imagem → `custom-assets/` → atualiza `images[field]` no config |
| `POST` | `/api/reset` | ✓ JWT | Copia `config-defaults.json` → `config.json` |

**Rotas estáticas:**
- `/custom-assets/*` → arquivos de upload acessíveis publicamente
- `/admin/*` → painel CMS
- `/*` → site estático (fallback para `index.html`)

**Segurança:**
- Senha só validada no servidor; hash bcrypt nunca exposto
- JWT_SECRET gerado aleatoriamente a cada start (`crypto.randomBytes(64)`)
- Upload: validação MIME `image/*`, max 5MB, nome sanitizado (`[^a-zA-Z0-9._-]` → `_`)

---

## admin/admin.js — Responsabilidades do Painel

```
admin.js
├── login()         → POST /api/auth → armazena JWT em sessionStorage
├── logout()        → limpa token, exibe tela de login
├── loadConfig()    → GET /api/config → popula CFG (objeto global)
├── buildUI()       → chama todas as builders de seção
│   ├── buildColors()      → gera color-pickers + sync picker↔text
│   ├── buildButtons()     → sliders de radius + campos CTA + WhatsApp
│   ├── buildTypography()  → dropdowns fonte + sliders tamanho
│   ├── buildCopy()        → inputs [data-copy] mapeados ao config.copy
│   ├── buildImages()      → cards com thumbnail + upload + reset
│   ├── buildVideo()       → campo YouTube ID + preview thumbnail
│   └── buildSeo()         → campos SEO + upload OG image/favicon
├── applyToPreview() → injeta CSS vars + textos diretamente no iframe DOM
├── saveConfig()    → POST /api/config com CFG inteiro
├── resetConfig()   → POST /api/reset → recarrega config e rebuilda UI
└── toast(msg, type) → notificação temporária (ok/err) no canto inferior direito
```

**Preview ao vivo:** o iframe aponta para `/` (o próprio site). O `applyToPreview()` acessa `iframe.contentDocument` e injeta as mudanças diretamente no DOM — sem reload. Após salvar, o iframe é recarregado para refletir o `config-loader.js` com os valores persistidos.

---

## Painel CMS — Seções e Controles

| Seção | Controles |
|---|---|
| **Cores** | 18 color-pickers com sync picker↔hex text, agrupados (Fundos, Textos, Destaque, CTA, WhatsApp) |
| **Botões** | 3 sliders de radius, 6 campos de texto CTA, texto/URL WhatsApp e FAB |
| **Tipografia** | 2 dropdowns de fonte (corpo + títulos), 3 sliders de tamanho |
| **Textos** | 13 inputs/textareas mapeados ao copy (hero, modal, footer) |
| **Imagens** | 35+ cards com thumbnail, upload e reset individual por imagem |
| **Vídeo** | Campo ID YouTube com preview de thumbnail via `ytimg.com` |
| **SEO** | title, description, og-title, og-description, og-image (upload), favicon (upload) |
| **Preview** | iframe ao vivo (1/2 da tela), atualiza em tempo real a cada mudança |

---

## Checklist para Replicar em Novo Projeto

### Fase 1 — Clone do site
- [ ] Rodar `clone_site.py` conforme `directives/clone-site.md`
- [ ] Validar clone com `file://` no browser

### Fase 2 — Instrumentação do HTML
- [ ] Adicionar `<script src="/config-loader.js"></script>` antes de `</head>`
- [ ] Mapear todos os textos editáveis → `data-cms="chave"`
- [ ] Mapear todos os botões CTA → `data-cms-cta="índice"` (0-based)
- [ ] Mapear todas as imagens → `data-cms-img="chave"` em `<img>` e `<source>`
- [ ] Mapear links WhatsApp → `data-cms-href="whatsapp-url"` e `"whatsapp-fab-url"`

### Fase 3 — Configuração
- [ ] Criar `config.json` com todas as seções e valores padrão do site
- [ ] Copiar como `config-defaults.json` (nunca sobrescrever manualmente)
- [ ] Criar `custom-assets/.gitkeep`

### Fase 4 — Servidor
- [ ] Criar `server.js` com os 5 endpoints da API + static serving
- [ ] Definir `PLAIN_PASSWORD` e gerar `PASSWORD_HASH` com bcrypt
- [ ] Criar `package.json` com as 4 dependências

### Fase 5 — config-loader.js
- [ ] Criar o script seguindo a ordem de 11 passos documentada acima
- [ ] Testar abrindo o site via `node server.js` e conferindo o DevTools → Network

### Fase 6 — Painel CMS
- [ ] Criar `admin/index.html` com login + shell + sidebar nav + iframe preview
- [ ] Criar `admin/admin.css` com dark UI
- [ ] Criar `admin/admin.js` com todas as builders e applyToPreview()

### Fase 7 — Testes
- [ ] Login com senha correta → token retornado
- [ ] Alterar uma cor → preview ao vivo atualiza
- [ ] Salvar → config.json modificado no disco
- [ ] Upload de imagem → aparece em `custom-assets/`, `config.json.images[field]` atualizado
- [ ] Reset → `config.json` volta ao estado de `config-defaults.json`
- [ ] Expiração de token → redirect automático para login

### Fase 8 — Git
- [ ] Criar `.gitignore` com `node_modules/` e `custom-assets/*` (exceto `.gitkeep`)
- [ ] `git init`, `git add`, `git commit`, `git push`

---

## Edge Cases e Decisões

| Situação | Decisão tomada |
|---|---|
| Imagem com valor `null` no config | Não substituir — mantém o asset original do clone |
| Upload de SEO og-image e favicon | Tratados separadamente de `config.images`, salvos em `config.seo` |
| Cores em formato `rgba()` | Color picker recebe aproximação hex; o campo texto mantém o valor real |
| JWT expirado durante sessão | `authMiddleware` retorna 401; `admin.js` redireciona para login |
| Reset com confirm() | Usa `window.confirm()` nativo — sem modal customizado para manter simplicidade |
| Preview cross-origin | `applyToPreview()` envolto em try/catch silencioso — falha graciosamente se iframe ainda carregando |

---

## Limitações Conhecidas

- **Sem versionamento de config**: cada save sobrescreve. Para histórico, adicionar um `configs/backup-TIMESTAMP.json` no endpoint POST.
- **Auth stateless**: logout só limpa o sessionStorage local — o JWT ainda é válido até expirar (1h). Aceitável para uso single-user.
- **Preview limitado**: mudanças em SEO e title não aparecem no iframe (navegador não atualiza o `<title>` do iframe pai).
- **Fontes externas no dropdown**: se a fonte selecionada não estiver no CSS do site original, ela não vai renderizar (não há carregamento dinâmico de Google Fonts no painel).
