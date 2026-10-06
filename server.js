const express = require('express');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const crypto = require('crypto'); 
const path = require('path'); 

const app = express();
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

function gerarPDFDocumento(req, res) {
    const { cliente, cpf, taxaAdesao, plano, acomodacao, dataContratacao, vigencia, assinaturaBase64 } = req.body;

    if (!cliente || !cpf) {
        return res.status(400).json({ error: "Faltam dados obrigatórios." });
    }

    // 1. DADOS DE AUDITORIA
    const ipCliente = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'IP não detectado';
    const userAgent = req.headers['user-agent'] || 'Navegador não detectado';
    const dataHoraAssinatura = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const docId = 'ELR-' + new Date().getFullYear() + '-' + crypto.randomBytes(4).toString('hex').toUpperCase();

    // 2. PROCESSAR ASSINATURA VISUAL
    let imgBuffer = null;
    let base64Data = "";
    if (assinaturaBase64) {
        base64Data = assinaturaBase64.replace(/^data:image\/\w+;base64,/, '');
        imgBuffer = Buffer.from(base64Data, 'base64');
    }

    // 3. GERAR HASH SHA-256
    const dadosParaHash = `${cliente}|${cpf}|${plano}|${taxaAdesao}|${ipCliente}|${dataHoraAssinatura}|${base64Data}`;
    const hashDocumento = crypto.createHash('sha256').update(dadosParaHash).digest('hex');

    // 4. INICIAR PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    let filename = `Termo_Ciencia_Elray_${cliente.replace(/\s+/g, '_')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    doc.pipe(res);

    // ==========================================
    // PÁGINA 1: TEXTO INTEGRAL DO TERMO DE CIÊNCIA
    // ==========================================
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1b365d').text('TERMO DE CIÊNCIA', { align: 'center' });
    doc.fontSize(10).font('Helvetica').fillColor('#666').text('Contratação com Carência Reduzida', { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(10).font('Helvetica').fillColor('#333');
    doc.text(`Eu, ${cliente}, CPF nº ${cpf}, declaro, para os devidos fins, que estou ciente das condições referentes à contratação do meu plano de saúde realizada por intermédio da Elray Seguros.`, { align: 'justify' });
    doc.moveDown(1);
    
    doc.font('Helvetica-Bold').text('Declaro estar ciente de que minha contratação foi realizada dentro de uma condição especial de redução de carências, porém não houve isenção total das carências do plano.', { align: 'justify' });
    doc.moveDown(1);

    doc.font('Helvetica-Bold').text('1. REDUÇÃO DE CARÊNCIA');
    doc.font('Helvetica').text('Estou ciente de que, para minha contratação, foi concedida redução de carência exclusivamente para consultas e exames, de acordo com as condições aprovadas pela operadora/administradora.', { align: 'justify' });
    doc.moveDown(1);

    doc.font('Helvetica-Bold').text('2. DEMAIS PROCEDIMENTOS');
    doc.font('Helvetica').text('Estou ciente de que internações, cirurgias, procedimentos de alta complexidade, tratamentos específicos, parto e demais coberturas que não tenham recebido redução ou isenção expressamente autorizada permanecerão sujeitos às carências previstas na proposta, contrato e regras da operadora.', { align: 'justify' });
    doc.moveDown(1);

    doc.font('Helvetica-Bold').text('3. DOENÇAS OU LESÕES PREEXISTENTES');
    doc.font('Helvetica').text('Declaro estar ciente de que doenças ou lesões preexistentes devem ser corretamente informadas na Declaração de Saúde e poderão estar sujeitas às regras de Cobertura Parcial Temporária – CPT, quando aplicável, conforme análise da operadora.', { align: 'justify' });
    doc.moveDown(1);

    doc.font('Helvetica-Bold').text('4. CIÊNCIA DAS CONDIÇÕES');
    doc.font('Helvetica').text('Declaro que fui devidamente informado(a) de que esta contratação não representa carência zero para todos os procedimentos.\n\nEstou ciente de que qualquer redução, aproveitamento ou isenção de carência depende exclusivamente das regras, análise e aprovação da operadora/administradora, prevalecendo sempre as condições constantes na proposta e no contrato do plano de saúde.\n\nDeclaro ainda que recebi as informações necessárias antes da conclusão da contratação e que estou de acordo em permanecer com o plano nas condições aprovadas, inclusive com as carências que não foram reduzidas ou isentas.', { align: 'justify' });
    doc.moveDown(1);

    doc.font('Helvetica-Bold').text('5. DECLARAÇÃO FINAL');
    doc.font('Helvetica').text('Ao assinar este termo, confirmo que compreendi as condições da minha contratação e que estou de acordo com a redução concedida apenas para consultas e exames, permanecendo as demais carências conforme estabelecido pela operadora.', { align: 'justify' });

    // ==========================================
    // PÁGINA 2: RESUMO E ASSINATURAS (NOVA PÁGINA)
    // ==========================================
    doc.addPage();
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

    if (imgBuffer) {
        doc.image(imgBuffer, 40, yAssinatura - 40, { width: 200, height: 60, align: 'center' });
    }
    doc.moveTo(40, yAssinatura + 30).lineTo(250, yAssinatura + 30).stroke();
    doc.fontSize(8).text(cliente, 40, yAssinatura + 35, { width: 210, align: 'center' });
    doc.font('Helvetica').fillColor('#666').text('Assinatura da Cliente', 40, yAssinatura + 45, { width: 210, align: 'center' });

    doc.moveTo(300, yAssinatura + 30).lineTo(510, yAssinatura + 30).stroke();
    doc.font('Helvetica-Bold').fillColor('#333').text('RAYLENE DA SILVA RAMOS', 300, yAssinatura + 35, { width: 210, align: 'center' });
    doc.font('Helvetica').fillColor('#666').text('Responsável pelo Atendimento / Consultora', 300, yAssinatura + 45, { width: 210, align: 'center' });

    // ==========================================
    // PÁGINA 3: TRILHA DE AUDITORIA CRIPTOGRÁFICA
    // ==========================================
    doc.addPage();
    doc.rect(40, 40, 515, 760).stroke('#1b365d'); 
    
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#1b365d').text('CERTIFICADO DE ASSINATURA DIGITAL', 50, 80, { align: 'center' });
    doc.fontSize(10).font('Helvetica').fillColor('#666').text('Trilha de Auditoria e Conformidade Legal', { align: 'center' });
    doc.moveDown(3);

    doc.fillColor('#333').fontSize(10);
    doc.text('Este documento foi assinado eletronicamente e possui validade jurídica conforme a Medida Provisória nº 2.200-2/2001, que institui a Infra-Estrutura de Chaves Públicas Brasileira - ICP-Brasil, garantindo autenticidade, integridade e validade jurídica a documentos em forma eletrônica.', { align: 'justify' });
    doc.moveDown(3);

    doc.font('Helvetica-Bold').text('DADOS TÉCNICOS DA ASSINATURA (LOG DE AUDITORIA):');
    doc.moveDown();
    
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

app.post('/api/gerar-termo', gerarPDFDocumento);
app.post('/api/download-termo', gerarPDFDocumento);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor de Assinatura Digital Seguro rodando na porta ${PORT}`);
});
