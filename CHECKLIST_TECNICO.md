# Checklist Técnico - Ambiente de Staging e Produção

Use este checklist para garantir que a separação dos ambientes está correta após a configuração na Vercel.

## 1. Repositório e Branches
- [ ] O repositório está conectado ao GitHub.
- [ ] A branch `main` está protegida (opcional, mas recomendado).
- [ ] A branch `dev` existe e está atualizada com a `main`.

## 2. Configuração na Vercel
- [ ] Projeto importado na Vercel.
- [ ] **Production Branch** definida como `main` nas configurações (Settings > Git).
- [ ] **Environment Variables**:
    - [ ] Variáveis de **Production** configuradas (ex: chaves de API reais, banco de produção).
    - [ ] Variáveis de **Preview** configuradas (ex: chaves de teste, banco de dev).

## 3. Teste de Fluxo de Deploy
- [ ] **Teste de Staging**:
    1. Fazer uma alteração simples na branch `dev` (ex: mudar um texto no rodapé).
    2. Commit e Push para `dev`.
    3. Verificar se a Vercel gerou um link de Preview.
    4. Acessar o link e confirmar a alteração.
    5. Acessar o link de Produção e confirmar que a alteração **NÃO** está lá.
- [ ] **Teste de Produção**:
    1. Merge de `dev` para `main` via Git.
    2. Push para `main`.
    3. Verificar se a Vercel iniciou o deploy de Produção.
    4. Acessar o site de Produção e confirmar a alteração.

## 4. Segurança
- [ ] Arquivo `.env` NÃO está no GitHub.
- [ ] Pasta `node_modules` NÃO está no GitHub.
