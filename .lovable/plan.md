

## Plano: Trocar o favicon do site

O favicon atual é `public/favicon.ico`. Vamos substituí-lo pela imagem que você enviou (`logo.avif`).

### Passos

1. **Copiar a imagem** enviada para `public/favicon.avif`
2. **Atualizar `index.html`** para referenciar o novo favicon:
   ```html
   <link rel="icon" href="/favicon.avif" type="image/avif">
   ```

Isso fará com que o ícone da aba do navegador mude para o logo que você anexou.

