

# Plano de Otimização SEO para "BETVIPMAX"

## Objetivo
Rankear em primeiro lugar no Google para buscas como "betvipmax", "bet vip max", "vipbetmax", "bettvipmax".

---

## O que já está implementado
- `index.html` com meta tags, Open Graph, Twitter Cards, JSON-LD (WebSite, Organization, BreadcrumbList, FAQPage)
- `SEOHead` component para meta tags dinâmicas
- `sitemap.xml` e `robots.txt`
- Conteúdo SEO-rich no footer e na página principal
- Canonical URLs configuradas

## Melhorias Técnicas a Implementar

### 1. Adicionar SEOHead em todas as páginas que não possuem
Atualmente só a Index usa o `SEOHead`. Adicionar em: **Sports**, **Auth**, **Deposit**, **Affiliate**, **GameDetail**, **Wallet**, **Withdraw**, **MyAccount** — cada uma com title/description únicos contendo variações da keyword "betvipmax".

### 2. Expandir JSON-LD Structured Data
- Adicionar **SoftwareApplication** schema no `index.html` para representar a plataforma como app
- Adicionar **GamesActivity** ou **Game** schema para os jogos
- Adicionar **SiteNavigationElement** para os links do menu

### 3. Melhorar meta tags no `index.html`
- Adicionar `<meta name="theme-color">` 
- Adicionar `<meta name="application-name" content="BetVipMax">`
- Adicionar `<meta name="apple-mobile-web-app-title">`
- Adicionar mais variações de keywords no meta keywords

### 4. Expandir o `sitemap.xml`
- Incluir URLs de jogos individuais (`/game/1`, `/game/2`, etc.)
- Incluir `/wallet`, `/withdraw`, `/my-account`
- Atualizar `lastmod` para data atual

### 5. Melhorar heading hierarchy e semântica HTML
- Garantir que cada página tenha `<h1>` único com a keyword
- Usar `<article>`, `<nav>`, `<main>`, `<section>` semanticamente
- Adicionar `aria-label` descritivos

### 6. Adicionar página de conteúdo SEO estático
- Criar uma seção expandida de "Perguntas Frequentes" na Index com mais perguntas e respostas ricas em keywords
- Expandir o bloco de texto SEO existente na Index

### 7. Otimizar GameDetail para SEO
- Adicionar SEOHead com título do jogo + "BetVipMax"
- Adicionar JSON-LD de Game/Product para cada jogo

---

## Sugestões Extras (fora do código)

Essas ações são feitas fora do Lovable mas são essenciais para rankear:

1. **Google Search Console** — Cadastrar o domínio `bettvipmax.com`, enviar o sitemap, e monitorar indexação
2. **Google My Business** — Se aplicável, criar perfil com o nome "BetVipMax"
3. **Backlinks** — Conseguir links de outros sites apontando para `bettvipmax.com` com anchor text "betvipmax"
4. **Redes sociais** — Criar perfis no Instagram, Twitter, YouTube com o nome "betvipmax" e linkar para o site
5. **Velocidade** — Garantir que imagens externas estejam otimizadas (já usa avif para locais, bom)
6. **HTTPS e WWW redirect** — Garantir que `bettvipmax.com` redireciona para `www.bettvipmax.com` (ou vice-versa) consistentemente
7. **Conteúdo periódico** — Blog ou seção de notícias com artigos sobre jogos, apostas, etc. ajuda muito no ranking

---

## Arquivos a modificar/criar

| Arquivo | Ação |
|---|---|
| `index.html` | Mais meta tags, mais JSON-LD schemas |
| `src/components/SEOHead.tsx` | Adicionar suporte a keywords customizadas |
| `src/pages/Sports.tsx` | Adicionar SEOHead |
| `src/pages/Auth.tsx` | Adicionar SEOHead |
| `src/pages/Deposit.tsx` | Adicionar SEOHead |
| `src/pages/Affiliate.tsx` | Adicionar SEOHead |
| `src/pages/GameDetail.tsx` | Adicionar SEOHead dinâmico por jogo |
| `src/pages/Wallet.tsx` | Adicionar SEOHead |
| `src/pages/Withdraw.tsx` | Adicionar SEOHead |
| `src/pages/MyAccount.tsx` | Adicionar SEOHead |
| `public/sitemap.xml` | Expandir com todas as URLs |
| `src/pages/Index.tsx` | Expandir FAQ e conteúdo SEO |

