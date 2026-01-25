# Configuração do Google Calendar

Para a sincronização funcionar, você precisa criar um **Client ID** no Google Cloud Console. É gratuito e rápido.

## Passo a Passo

1.  Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2.  **Crie um Projeto**:
    *   Clique no seletor de projetos no topo esquerdo e depois em "Novo Projeto".
    *   Dê o nome de "AgendaApp" (ou o que preferir) e crie.
3.  **Habilite a API**:
    *   No menu lateral, vá em **APIs e Serviços** > **Biblioteca**.
    *   Pesquise por "Google Calendar API".
    *   Clique nela e depois em **Ativar**.
4.  **Configure a Tela de Consentimento OAuth**:
    *   Vá em **APIs e Serviços** > **Tela de permissão OAuth**.
    *   Em **Branding**, preencha o Nome do App e email de suporte.
    *   **IMPORTANTE**: No menu lateral esquerdo (abaixo de Branding), clique em **Público-alvo** (ou Audience).
    *   Lá embaixo vai ter a seção **Usuários de teste** (Test users).
    *   Clique em **+ ADD USERS**.
    *   Digite o seu email (`hptecnologia02@gmail.com`).
    *   **Salve**. Se não fizer isso, dá erro 403!
5.  **Crie as Credenciais (O Client ID)**:
    *   Vá em **APIs e Serviços** > **Credenciais**.
    *   Clique em **+ Criar Credenciais** > **ID do cliente OAuth**.
    *   Tipo de aplicativo: **Aplicação da Web**.
    *   Em **Origens JavaScript autorizadas**, clique em ADICIONAR URI e coloque:
        *   `http://localhost:5173`
        *   `http://localhost:3000`
        *   `http://127.0.0.1:5173`
    *   Clique em **Criar**.
6.  **Domínio do App (Público)**:
    *   Se você quiser tirar do modo de teste para que QUALQUER UM possa acessar:
    *   Vá em **Tela de permissão OAuth**.
    *   Abaixo de "Status da publicação", clique no botão **PUBLICAR APLICATIVO** (Publish App).
    *   Confirme.
    *   **Aviso**: Seus usuários verão uma tela de "O Google não verificou este app". Eles precisarão clicar em "Avançado" > "Acessar (nome do app) não seguro" para continuar. Isso é normal até você passar pelo processo oficial de verificação do Google (que demora semanas).

## Solução de Erros Comuns

### Erro: "Acesso bloqueado: o app não concluiu o processo de verificação" (Erro 403)
1. Vá na **Tela de permissão OAuth**.
2. Clique na aba lateral **Público-alvo**.
3. Adicione seu email em **Usuários de teste**.

### Erro: "redirect_uri_mismatch" / "origin_mismatch"
1. Veja a mensagem de erro (ex: `origin=http://localhost:3000`).
2. Vá em Credenciais > Seu Client ID > Origens JavaScript autorizadas.
3. Adicione EXATAMENTE essa URL.
