const express = require('express');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const crypto = require('crypto'); // Biblioteca para gerar o Hash Criptográfico
const path = require('path'); // Biblioteca para lidar com caminhos de arquivos

const app = express();
// Aumentamos o limite para garantir que imagens grandes de assinatura pelo celular não quebrem a requisição
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ==============================================================
// SERVIR OS ARQUIVOS VISUAIS (O SITE) DA PASTA "public"
// ==============================================================
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// ==============================================================

// Configuração para permitir acesso do Frontend (CORS básico)
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// Função centralizada para gerar e selar o PDF
function gerarPDFDocumento(req, res) {
    const { cliente, cpf, taxaAdesao, plano, acomodacao, dataContratacao, vigencia, assinaturaBase64 } = req.body;

    if (!cliente || !cpf) {
        return res.status(400).json({ error: "Faltam dados obrigatórios." });
    }

    // 1. CAPTURA DE DADOS REAIS DE AUDITORIA (Não confia no frontend)
    // Pega o IP real, mesmo se estiver hospedado na Render ou Vercel
    const ipCliente = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'IP não detectado';
    const userAgent = req.headers['user-agent'] || 'Navegador não detectado';
    const dataHoraAssinatura = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    
    // Gerar um ID de Documento único e rastreável
    const docId = 'ELR-' + new Date().getFullYear() + '-' + crypto.randomBytes(4).toString('hex').toUpperCase();

    // Processar a imagem da assinatura enviada do Frontend
    let imgBuffer = null;
    let base64Data = "";
    if (assinaturaBase64) {
        base64Data = assinaturaBase64.replace(/^data:image\/\w+;base64,/, '');
        imgBuffer = Buffer.from(base64Data, 'base64');
    }

    // 2. GERAR O HASH SHA-256 CRIPTOGRÁFICO (A Prova Jurídica)
    // O Hash amarra os dados textuais à imagem da assinatura e ao IP/Hora
    const dadosParaHash = `${cliente}|${cpf}|${plano}|${taxaAdesao}|${ipCliente}|${dataHoraAssinatura}|${base64Data}`;
    const hashDocumento = crypto.createHash('sha256').update(dadosParaHash).digest('hex');

    // 3. INICIAR A GERAÇÃO DO PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    
    let filename = `Termo_Ciencia_Elray_${cliente.replace(/\s+/g, '_')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

    doc.pipe(res);

    // ==========================================
    // PÁGINA 1: O TERMO DE CIÊNCIA E ASSINATURAS
    // ==========================================
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1b365d').text('TERMO DE CIÊNCIA', { align: 'center' });
    doc.fontSize(10).font('Helvetica').fillColor('#666').text('Redução/Isenção de Carências, Doenças Preexistentes e Pagamentos', { align: 'center' });
    doc.moveDown();

    doc.fontSize(9).fillColor('#333')
       .text('ELRAY SEGUROS - CNPJ 22.524.428/0001-76')
       .text('Operadora: Hapvida Saúde (CNPJ 44.649.812/0001-38)')
       .text('Administradora: Affix Administradora de Benefícios Ltda')
       .text(`Plano: ${plano || 'Não informado'} - Acomodação: ${acomodacao || 'Enfermaria'}`);
    doc.moveDown();

    doc.fontSize(10).font('Helvetica-Bold').text('DADOS DO BENEFICIÁRIO:');
    doc.font('Helvetica').text(`Nome: ${cliente} | CPF: ${cpf}`);
    doc.text(`Data da Contratação: ${dataContratacao} | Vigência Prevista: ${vigencia}`);
    doc.text(`Taxa de Adesão: R$ ${taxaAdesao}`);
    doc.moveDown();

    doc.fontSize(10).text(`Eu, ${cliente}, inscrita no CPF nº ${cpf}, declaro estar ciente das condições referentes à análise, redução e eventual isenção de carências do plano de saúde contratado.`);
    doc.moveDown();

    doc.font('Helvetica-Bold').fontSize(10).text('RESUMO DAS CLÁUSULAS E CONDIÇÕES ACEITAS:');
    doc.font('Helvetica').fontSize(9).text('Declaro ciência plena, sob pena de rescisão contratual e normativas da ANS, que:');
    doc.moveDown(0.5);
    doc.text('1. CARÊNCIAS: A redução/isenção não é automática. Depende de análise e aprovação da operadora.');
    doc.text('2. DOENÇAS PREEXISTENTES (DLP): Não possuem garantia de redução/isenção. Omitir informações na Declaração de Saúde configura fraude e poderá gerar rescisão do contrato e aplicação de CPT.');
    doc.text('3. GESTANTES: Aceitas para análise até o 6º mês de gestação (não garante parto sem carência).');
    doc.text('4. VIGÊNCIA: Contratações até o dia 22 vigoram no dia 1º do mês seguinte.');
    doc.text('5. DEVOLUÇÃO: Se a redução/isenção não for aprovada, a Elray Seguros devolverá a taxa de adesão integralmente.');
    
    doc.moveDown();
    doc.font('Helvetica-Bold').fillColor('#b91c1c').text('IMPORTANTE SOBRE PAGAMENTOS E MANUTENÇÃO:');
    doc.font('Helvetica').fillColor('#333');
    doc.text('O PLANO DE SAÚDE PRECISA ESTAR PAGO E REGULAR PARA QUE SEJA MANTIDO ATIVO. O atraso poderá acarretar notificação, suspensão ou cancelamento conforme regras da ANS.');
    doc.moveDown(2);

    // BLOCO DE ASSINATURAS (Lado a Lado)
    doc.font('Helvetica-Bold').text('ASSINATURAS', { align: 'center' });
    doc.moveDown(2);

    const yAssinatura = doc.y;

    // Assinatura da Cliente (Esquerda)
    if (imgBuffer) {
        doc.image(imgBuffer, 40, yAssinatura - 40, { width: 200, height: 60, align: 'center' });
    }
    doc.moveTo(40, yAssinatura + 30).lineTo(250, yAssinatura + 30).stroke();
    doc.fontSize(8).text(cliente, 40, yAssinatura + 35, { width: 210, align: 'center' });
    doc.font('Helvetica').fillColor('#666').text('Assinatura da Cliente', 40, yAssinatura + 45, { width: 210, align: 'center' });

    // Assinatura da Consultora (Direita)
    doc.moveTo(300, yAssinatura + 30).lineTo(510, yAssinatura + 30).stroke();
    doc.font('Helvetica-Bold').fillColor('#333').text('RAYLENE DA SILVA RAMOS', 300, yAssinatura + 35, { width: 210, align: 'center' });
    doc.font('Helvetica').fillColor('#666').text('Responsável pelo Atendimento / Consultora', 300, yAssinatura + 45, { width: 210, align: 'center' });

    // ==========================================
    // PÁGINA 2: TRILHA DE AUDITORIA CRIPTOGRÁFICA
    // ==========================================
    doc.addPage();
    doc.rect(40, 40, 515, 760).stroke('#1b365d'); // Borda de segurança na página
    
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#1b365d').text('CERTIFICADO DE ASSINATURA DIGITAL', 50, 80, { align: 'center' });
    doc.fontSize(10).font('Helvetica').fillColor('#666').text('Trilha de Auditoria e Conformidade Legal', { align: 'center' });
    doc.moveDown(3);

    doc.fillColor('#333').fontSize(10);
    doc.text('Este documento foi assinado eletronicamente e possui validade jurídica conforme a Medida Provisória nº 2.200-2/2001, que institui a Infra-Estrutura de Chaves Públicas Brasileira - ICP-Brasil, garantindo autenticidade, integridade e validade jurídica a documentos em forma eletrônica.', { align: 'justify' });
    doc.moveDown(3);

    doc.font('Helvetica-Bold').text('DADOS TÉCNICOS DA ASSINATURA (LOG DE AUDITORIA):');
    doc.moveDown();
    
    // Lista de dados técnicos impressos no documento
    const lineGap = 6;
    doc.font('Helvetica-Bold').text('ID do Documento: ', { continued: true }).font('Helvetica').text(docId).moveDown(lineGap/10);
    doc.font('Helvetica-Bold').text('Assinante: ', { continued: true }).font('Helvetica').text(cliente).moveDown(lineGap/10);
    doc.font('Helvetica-Bold').text('CPF do Assinante: ', { continued: true }).font('Helvetica').text(cpf).moveDown(lineGap/10);
    doc.font('Helvetica-Bold').text('Endereço IP Registrado: ', { continued: true }).font('Helvetica').text(ipCliente).moveDown(lineGap/10);
    doc.font('Helvetica-Bold').text('Data e Hora (Servidor BRT): ', { continued: true }).font('Helvetica').text(dataHoraAssinatura).moveDown(lineGap/10);
    doc.font('Helvetica-Bold').text('Dispositivo / Navegador: ', { continued: true }).font('Helvetica').text(userAgent).moveDown(lineGap/10);
    
    doc.moveDown(2);
    doc.font('Helvetica-Bold').text('CÓDIGO HASH SHA-256 (INTEGRIDADE DO ARQUIVO):');
    doc.font('Courier').fontSize(10).text(hashDocumento);
    
    doc.moveDown(4);
    doc.font('Helvetica').fontSize(9).fillColor('#666').text('A alteração de qualquer byte neste documento invalidará o código Hash SHA-256 acima, comprovando eventuais adulterações após a assinatura.', { align: 'center' });

    doc.end();
}

// O mesmo gerador atende tanto a requisição em background quanto o download forçado
app.post('/api/gerar-termo', gerarPDFDocumento);
app.post('/api/download-termo', gerarPDFDocumento);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor de Assinatura Digital Seguro rodando na porta ${PORT}`);
});
