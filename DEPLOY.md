# Fluxo de Deploy - Staging e Produção

Este projeto utiliza um fluxo de trabalho Git otimizado para Vercel, separando o ambiente de desenvolvimento (Preview) do ambiente de produção.

## Estrutura de Branches

- **`main`**: Branch de **PRODUÇÃO**. O código aqui reflete exatamente o que está acessível para os usuários finais. **Nunca commite diretamente na main.**
- **`dev`**: Branch de **STAGING/PREVIEW**. Todo o desenvolvimento e testes acontecem aqui.

## Como Realizar Deploys

### 1. Desenvolvimento
Desenvolva novas features ou correções na branch `dev` (ou em feature branches que fazem merge na `dev`).

```bash
# Garantir que está na branch dev
git checkout dev

# Fazer alterações...
git add .
git commit -m "feat: minha nova feature"
git push origin dev
```

Quando você faz o push para `dev`, a Vercel criará automaticamente um **Preview Deployment**. Você receberá um link (ex: `projeto-git-dev-usuario.vercel.app`) para testar as alterações online.

### 2. Promoção para Produção
Após validar as alterações no ambiente de Preview, faça o merge da `dev` para a `main` para lançar em Produção.

```bash
# Ir para branch dev e garantir que está atualizada
git checkout dev
git pull origin dev

# Ir para branch main
git checkout main
git pull origin main

# Fazer merge da dev na main
git merge dev

# Enviar para produção
git push origin main
```

A Vercel importará automaticamente o commit na `main` e atualizará o site de produção.

## Variáveis de Ambiente
Certifique-se de configurar as variáveis no painel da Vercel para cada ambiente:
- **Production**: Variáveis usadas pela aplicação real.
- **Preview**: Variáveis para testes (pode usar banco de dados de teste, chaves de API de sandbox, etc.).

---
**Importante**: Não use deploy manual (`vercel deploy`). O fluxo deve ser sempre via git push.
