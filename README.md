<div align="center">

  # 🛡️ Elray Seguros — Portal de Assinatura Digital
  ### Sistema Eletrônico de Validação e Emissão do Termo de Ciência (Hapvida & Affix)
  
  ![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
  ![Express](https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express&logoColor=white)
  ![PDFKit](https://img.shields.io/badge/PDFKit-PDF_Engine-ff69b4?style=for-the-badge&logo=adobeacrobatreader&logoColor=white)
  ![DocuSign Style](https://img.shields.io/badge/DocuSign-Verified_Audit-ffc820?style=for-the-badge&logo=docusign&logoColor=black)
  ![Responsive](https://img.shields.io/badge/Layout-100%25_Responsive-blueviolet?style=for-the-badge)

</div>

---

## 📋 Sobre o Projeto

O **Portal de Assinatura Digital da Elray Seguros** é uma plataforma web full-stack desenvolvida para automatizar o preenchimento, a revisão legal e a assinatura eletrônica do **Termo de Ciência (Análise, Redução e Isenção de Carências)** para planos de saúde em parceria com a **Hapvida Saúde (CNPJ 44.649.812/0001-38)** e a **Affix Benefícios (CNPJ 18.769.474/0001-68)**.

O sistema gera automaticamente documentos em **PDF formatados em padrão A4 de 2 páginas**, incluindo todas as cláusulas jurídicas obrigatórias, a garantia de devolução integral da taxa de adesão pela **Elray Seguros (CNPJ 22.524.428/0001-76)**, a assinatura eletrônica da cliente, a assinatura manuscrita oficial da consultora **Raylene da Silva Ramos** e o carimbo de Certificado Digital de Auditoria (conforme **MP 2.200-2/2001 - ICP-Brasil**).

---

## ⚡ Principais Funcionalidades

- **📄 Fluxo Guiado em 2 Etapas (DocuSign Style):**
  - **Etapa 1 (Revisão):** Formulário dinâmico de contratação integrado com o **Leitor de Papel A4 Digital**, permitindo que a cliente leia e confirme todas as 7 cláusulas do termo antes de assinar.
  - **Etapa 2 (Assinatura):** Módulo com 3 opções de assinatura (Desenhar em tela touch/mouse, Digitar com fontes caligráficas exclusivas ou Enviar imagem).
- **✍️ Assinatura Oficial da Consultora:** Estampa automática da assinatura manuscrita oficial da consultora **Raylene da Silva Ramos** no lado direito do documento.
- **🔒 Trilha de Auditoria Digital & Certificado:** Geração automática de ID do Documento, Carimbo de Data/Hora (BRT) e Hash criptográfico SHA-256 no rodapé do PDF.
- **🛡️ Garantia de Devolução da Taxa de Adesão:** Cláusula 6 em destaque prevendo a restituição integral do valor pago pela Elray Seguros caso as carências não sejam aprovadas.
- **📱 Design 100% Responsivo:** Otimizado para smartphones (iOS/Android), tablets e computadores desktop.
- **📥 Download e Visualização em PDF Genuíno:** Emissão direta via backend sem perda de formatação ou nome de arquivo.

---

## 🛠️ Tecnologias Utilizadas

- **Backend:** Node.js, Express, PDFKit, CORS, Body-Parser.
- **Frontend:** HTML5 Semântico, Vanilla CSS3 (Design Tokens, Glassmorphic UI, CSS Grid/Flexbox), JavaScript (ES6+).
- **Fontes Caligráficas:** Google Fonts (*Dancing Script*, *Great Vibes*, *Alex Brush*, *Caveat*, *Plus Jakarta Sans*).

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js instalado (v16 ou superior).

### Passo a Passo
1. Clone este repositório:
   ```bash
   git clone https://github.com/PedroMacedo0/Assinador-digital.git
   cd Assinador-digital
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Inicie o servidor:
   ```bash
   npm start
   ```

4. Acesse no seu navegador:
   ```text
   http://localhost:3000
   ```

---

## ☁️ Implantação e Publicação Gratuita (Render.com)

Esta aplicação está preparada para ser publicada gratuitamente em plataformas como **Render**, **Vercel** ou **Railway**:

1. Crie um repositório público no GitHub com este código.
2. Acesse o [Render.com](https://render.com) e crie um novo **Web Service**.
3. Conecte com o seu repositório do GitHub.
4. Configure os comandos:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. Clique em **Deploy**!

---

## ⚖️ Direitos e Licença

**Elray Corretora de Seguros LTDA** — CNPJ: 22.524.428/0001-76  
Parceria oficial **Hapvida Saúde** e **Affix Benefícios**.  
Todos os direitos reservados.
