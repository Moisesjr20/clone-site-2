# Registro de Diretivas — Clone Site 2 (CMS Embutido)

> Índice vivo de todos os POPs deste projeto. Atualizar sempre que uma nova diretiva for criada.

---

## Spec Técnica

| Arquivo | Descrição | Versão | Status |
|---|---|---|---|
| `specs/cms-chave.md` | Especificação técnica completa do CMS Visual | 2.0 | Concluído |

---

## Diretivas Ativas

| Arquivo | Descrição | Versão | Status |
|---|---|---|---|
| `clone-site.md` | POP para clonar qualquer site estático com Python | 1.0 | Ativo |
| `cms-embed.md` | POP completo para construir CMS embutido em site clonado | 1.0 | Ativo |

---

## Corrections & Bugs Registrados

| Data | Arquivo afetado | Problema | Fix |
|---|---|---|---|
| 2026-07-19 | `clone_site.py` | Servidor retornava `Content-Encoding: br` (Brotli) ignorando `Accept-Encoding: gzip` — CSS e SVG corrompidos | `pip install brotli` — urllib3 passa a descomprimir Brotli automaticamente |
| 2026-07-19 | `server.js` | Porta 3000 travada por processo Python anterior que servia o site para preview | `Get-Process python | Stop-Process -Force` antes de reiniciar |
