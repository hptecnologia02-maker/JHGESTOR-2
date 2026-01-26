# Como Criar seu App no Facebook (Meta for Developers)

Para que seu sistema SaaS possa puxar dados do Meta Ads, você precisa criar um "Aplicativo" no painel da Meta. É esse App que vai fornecer o **App ID**.

## Passo 1: Criar o App

1. Acesse [developers.facebook.com](https://developers.facebook.com/) e faça login.
2. Clique em **"Meus Apps"** (My Apps) no canto superior direito.
3. Clique no botão verde **"Criar App"** (Create App).
4. Escolha **"Outro"** (Other) > Avançar.
5. Selecione o Tipo de App: **"Empresa"** (Business) > Avançar.
6. Preencha:
   - **Nome do App**: Ex: `JHGestor SaaS`
   - **Email de contato**: Seu email.
   - **Conta Empresarial**: Selecione sua conta business (opcional, mas recomendado).
7. Clique em **"Criar App"**.

## Passo 2: Configurar o Login do Facebook

1. No painel do seu novo App, procure por **"Login do Facebook"** e clique em **Configurar**.
2. Escolha **Web** (WWW).
3. Em "URL do Site", coloque a URL onde seu sistema vai rodar.
   - Para teste local, coloque: `http://localhost:5173/`
   - **Importante**: Se for publicar, adicione a URL real depois.
4. Clique em **Save** e depois em **Continue**. (Pode pular o resto do tutorial do Facebook).
5. **CRITICO**: Ainda em "Login do Facebook" > **Configurações**:
   - Ative a opção **"Login com o SDK do JavaScript"** (Login with JavaScript SDK).
   - Em "Domínios permitidos para o SDK do JavaScript", adicione:
     - `http://localhost:5173`
     - `https://jhgestor-2.vercel.app/`
   - Clique em **Salvar alterações**.

## Passo 3: Configurar Permissões (Marketing API)

1. No menu lateral esquerdo, vá em **Revisão do App** > **Permissões e Recursos**.
2. Procure por estas duas permissões e peça "Acesso Avançado" (ou verifique se já tem o Padrão):
   - `public_profile` (Padrão)
   - `email` (Padrão)
   - `ads_read` (Leitura de Anúncios)
   - `ads_management` (Opcional, se fosse criar anúncios)
   - `read_insights` (Leitura de Métricas/Relatórios) -> **ESSENCIAL**

> **Nota**: Para uso próprio ou teste (enquanto o App está em "Modo de Desenvolvimento"), você não precisa passar pela Revisão do Facebook. Você e os administradores do App conseguem usar todas as permissões imediatamente.

## Passo 4: Pegar o ID do App

1. No menu lateral, vá em **Configurações** > **Básico**.
2. Copie o **ID do Aplicativo** (App ID).
   - Exemplo: `123456789012345`
3. Esse é o número que você vai colocar no arquivo de configuração do sistema (`constants.ts`).

---

## ⚠️ Atenção (Modo de Desenvolvimento)

Enquanto seu App estiver em **"Em Desenvolvimento"** (topo da tela), **APENAS VOCÊ** (e quem você adicionar como "Testador" no menu "Funções") conseguirá conectar.

Para vender o SaaS para o mundo todo, você precisará mudar para **"Ao Vivo"**. Nesse momento, o Facebook pode pedir para revisar seu App (explicar por que você precisa ler os anúncios dos usuários).
