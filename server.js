const express = require('express');
const cors = require('cors');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Middleware de tratamento de erro para nunca retornar HTML em falhas de JSON
app.use((err, req, res, next) => {
  if (err) {
    console.error('Erro de Middleware:', err.message);
    return res.status(400).json({ error: 'Erro no envio de dados.', details: err.message });
  }
  next();
});

app.use(express.static('public'));

// Função reutilizável de geração de PDF em PDFKit
function generateTermoPdfStream(data, res, isDownload = false) {
  const {
    cliente = 'MARIA EDUARDA DE ALMEIDA SANTOS',
    cpf = '523.187.198-29',
    plano = 'Plano de Saúde Individual / Familiar',
    acomodacao = 'Enfermaria',
    taxaAdesao = '150,00',
    dataContratacao = '20/09/2026',
    vigencia = '01/10/2026',
    consultor = 'Raylene da Silva Ramos',
    assinaturaBase64,
    modoAssinatura = 'draw',
    auditDocId = 'ELR-2026-894F2B',
    auditTimestamp = '01/09/2026 17:20:00 BRT',
    auditHash = '8f9a2b7c4d3e1f0a9b8c7d6e5f4a3b2c'
  } = data;

  const doc = new PDFDocument({
    size: 'A4',
    margin: 35,
    autoFirstPage: true,
    info: {
      Title: `Termo de Ciência DocuSign - ${cliente}`,
      Author: 'Elray Seguros - DocuSign Verified',
      Subject: 'Termo de Ciência - Análise, Redução e Isenção de Carências',
      Creator: 'Elray Digital Signature Engine (MP 2.200-2/2001)'
    }
  });

  const cleanName = cliente.trim().replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Termo_de_Ciencia_Elray_${cleanName}.pdf`;
  const dispositionType = isDownload ? 'attachment' : 'inline';

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `${dispositionType}; filename="${filename}"`);

  doc.pipe(res);

  // Cores padrão
  const COLOR_PRIMARY = '#0b2545';
  const COLOR_ACCENT = '#134074';
  const COLOR_TEXT = '#1d2a44';
  const COLOR_GRAY_BG = '#f4f7fa';
  const COLOR_BORDER = '#cbd5e1';

  function drawGridTable(doc, startY, rows, colWidths) {
    let currentY = startY;
    const startX = 35;

    rows.forEach((row) => {
      let currentX = startX;
      const rowHeight = row.height || 18;

      row.cols.forEach((col, colIdx) => {
        const width = colWidths[colIdx];
        
        if (col.bg) {
          doc.rect(currentX, currentY, width, rowHeight).fill(col.bg);
        }

        doc.rect(currentX, currentY, width, rowHeight).lineWidth(0.5).stroke(COLOR_BORDER);

        doc.fillColor(col.bold ? COLOR_PRIMARY : COLOR_TEXT)
           .font(col.bold ? 'Helvetica-Bold' : 'Helvetica')
           .fontSize(col.fontSize || 8.5)
           .text(col.text || '', currentX + 6, currentY + 4, {
             width: width - 12,
             align: col.align || 'left',
             lineBreak: false
           });

        currentX += width;
      });

      currentY += rowHeight;
    });

    return currentY;
  }

  // ==========================================
  // PÁGINA 1
  // ==========================================
  doc.rect(35, 30, 525, 32).fill(COLOR_PRIMARY);
  doc.fillColor('#ffffff')
     .font('Helvetica-Bold')
     .fontSize(14)
     .text('ELRAY SEGUROS', 45, 40);

  doc.fillColor('#ffffff')
     .font('Helvetica-Bold')
     .fontSize(10)
     .text('CNPJ 22.524.428/0001-76', 380, 42, { align: 'right', width: 170 });

  let y = 75;

  doc.fillColor(COLOR_PRIMARY)
     .font('Helvetica-Bold')
     .fontSize(15)
     .text('TERMO DE CIÊNCIA', 35, y, { align: 'center', width: 525 });

  y += 18;
  doc.fillColor(COLOR_ACCENT)
     .font('Helvetica-Bold')
     .fontSize(11)
     .text('ANÁLISE, REDUÇÃO E ISENÇÃO DE CARÊNCIAS', 35, y, { align: 'center', width: 525 });

  y += 25;

  const table1Rows = [
    {
      height: 20,
      cols: [
        { text: 'OPERADORA', bold: true, bg: COLOR_GRAY_BG, width: 120 },
        { text: 'Hapvida Saúde', bold: true, width: 180 },
        { text: 'CNPJ', bold: true, bg: COLOR_GRAY_BG, width: 65 },
        { text: '44.649.812/0001-38', width: 160 }
      ]
    },
    {
      height: 22,
      cols: [
        { text: 'ADMINISTRADORA', bold: true, bg: COLOR_GRAY_BG, width: 120 },
        { text: 'Affix Administradora de Benefícios Ltda', fontSize: 8, width: 180 },
        { text: 'CNPJ', bold: true, bg: COLOR_GRAY_BG, width: 65 },
        { text: '18.769.474/0001-68', width: 160 }
      ]
    },
    {
      height: 20,
      cols: [
        { text: 'PLANO', bold: true, bg: COLOR_GRAY_BG, width: 120 },
        { text: plano, width: 180 },
        { text: 'ACOMODAÇÃO', bold: true, bg: COLOR_GRAY_BG, width: 95 },
        { text: acomodacao, width: 130 }
      ]
    }
  ];

  y = drawGridTable(doc, y, table1Rows, [120, 180, 80, 145]);
  y += 16;

  doc.fillColor(COLOR_TEXT)
     .font('Helvetica')
     .fontSize(9);

  doc.text('Eu, ', 35, y, { continued: true });
  doc.font('Helvetica-Bold').text(cliente.toUpperCase(), { continued: true });
  doc.font('Helvetica').text(', inscrita no CPF nº ', { continued: true });
  doc.font('Helvetica-Bold').text(cpf, { continued: true });
  doc.font('Helvetica').text(', declaro, por meio deste termo, que fui devidamente informada e estou ciente das condições referentes à análise, redução e eventual isenção das carências do plano de saúde contratado, cuja operadora é a Hapvida Saúde e cuja administradora é a Affix.');

  y = doc.y + 12;

  doc.fillColor(COLOR_PRIMARY).font('Helvetica-Bold').fontSize(10).text('1. ANÁLISE DAS CARÊNCIAS', 35, y);
  y = doc.y + 4;
  doc.fillColor(COLOR_TEXT).font('Helvetica').fontSize(8.5).text(
    'A redução ou isenção das carências não ocorre de forma automática, ficando condicionada à análise documental, ao cumprimento dos requisitos estabelecidos e à aprovação da Hapvida Saúde e/ou Affix, conforme as regras aplicáveis à contratação.',
    35, y, { align: 'justify', width: 525 }
  );
  y = doc.y + 3;
  doc.text('Caso o beneficiário atenda integralmente aos critérios exigidos, poderá ser concedida a redução ou isenção das carências, ', 35, y, { continued: true, align: 'justify', width: 525 });
  doc.font('Helvetica-Bold').text('inclusive para parto', { continued: true });
  doc.font('Helvetica').text(', observadas as condições deste termo e a aprovação da operadora/administradora.');

  y = doc.y + 10;

  doc.fillColor(COLOR_PRIMARY).font('Helvetica-Bold').fontSize(10).text('2. DOENÇAS OU LESÕES PREEXISTENTES', 35, y);
  y = doc.y + 4;
  doc.fillColor(COLOR_TEXT).font('Helvetica').fontSize(8.5).text(
    'O cliente declara estar ciente de que doenças ou lesões preexistentes (DLP) não estão incluídas na garantia de redução ou isenção de carências prevista neste termo.',
    35, y, { align: 'justify', width: 525 }
  );
  y = doc.y + 3;
  doc.text(
    'As doenças ou lesões preexistentes estarão sujeitas às normas da Agência Nacional de Saúde Suplementar (ANS), à legislação vigente e às condições contratuais da Hapvida Saúde, inclusive com possibilidade de aplicação de Cobertura Parcial Temporária (CPT), quando legalmente cabível.',
    35, y, { align: 'justify', width: 525 }
  );
  y = doc.y + 3;
  doc.text(
    'Dessa forma, não há garantia de redução ou isenção para procedimentos relacionados a doenças ou lesões preexistentes.',
    35, y, { align: 'justify', width: 525 }
  );

  y = doc.y + 10;

  doc.fillColor(COLOR_PRIMARY).font('Helvetica-Bold').fontSize(10).text('3. GESTANTES', 35, y);
  y = doc.y + 4;
  doc.fillColor(COLOR_TEXT).font('Helvetica').fontSize(8.5);
  doc.text('Para esta condição específica de análise de redução ou isenção de carência para parto, serão aceitas gestantes com ', 35, y, { continued: true, align: 'justify', width: 525 });
  doc.font('Helvetica-Bold').text('até 6 (seis) meses de gestação', { continued: true });
  doc.font('Helvetica').text(' na data da contratação, desde que sejam cumpridos todos os requisitos exigidos pela Hapvida Saúde e/ou Affix.');
  
  y = doc.y + 3;
  doc.text(
    'A condição de gestante não representa aprovação automática da isenção de carência para parto, permanecendo obrigatória a análise e aprovação.',
    35, y, { align: 'justify', width: 525 }
  );

  y = doc.y + 10;

  doc.fillColor(COLOR_PRIMARY).font('Helvetica-Bold').fontSize(10).text('4. DATA-LIMITE PARA CONTRATAÇÃO E VIGÊNCIA', 35, y);
  y = doc.y + 4;
  doc.fillColor(COLOR_TEXT).font('Helvetica').fontSize(8.5);
  doc.text('A vigência do plano ocorrerá sempre no ', 35, y, { continued: true, align: 'justify', width: 525 });
  doc.font('Helvetica-Bold').text('dia 1º de cada mês.', { continued: false });

  y = doc.y + 3;
  doc.text('Para que a vigência tenha início no primeiro dia do mês seguinte, a contratação deverá estar integralmente concluída ', 35, y, { continued: true, align: 'justify', width: 525 });
  doc.font('Helvetica-Bold').text('até o dia 22 do mês anterior', { continued: true });
  doc.font('Helvetica').text(', incluindo a assinatura do contrato/proposta, o envio completo da documentação solicitada, o preenchimento das informações necessárias, o pagamento da taxa de adesão, quando aplicável, e o cumprimento das demais exigências da Hapvida Saúde e da Affix.');

  y = doc.y + 3;
  doc.text(
    'Contratações concluídas após o dia 22 poderão ter sua vigência transferida para o período subsequente, conforme as regras de implantação da administradora e da operadora.',
    35, y, { align: 'justify', width: 525 }
  );

  doc.fillColor('#888888')
     .font('Helvetica')
     .fontSize(8)
     .text('Termo de Ciência - Elray Seguros | Página 1', 35, 785, { align: 'center', width: 525 });

  // ==========================================
  // PÁGINA 2
  // ==========================================
  doc.addPage();

  doc.fillColor('#64748b')
     .font('Helvetica-Bold')
     .fontSize(8.5)
     .text('ELRAY SEGUROS | Termo de Ciência - Carências', 35, 30);

  doc.moveTo(35, 42).lineTo(560, 42).lineWidth(0.5).stroke('#cbd5e1');

  y = 48;

  doc.fillColor(COLOR_PRIMARY).font('Helvetica-Bold').fontSize(10).text('5. PRAZO E EFEITO DA ISENÇÃO DE CARÊNCIAS', 35, y);
  y = doc.y + 4;
  doc.fillColor(COLOR_TEXT).font('Helvetica').fontSize(8.5);
  doc.text('A análise e confirmação definitiva da redução ou isenção total das carências poderá ocorrer em ', 35, y, { continued: true, align: 'justify', width: 525 });
  doc.font('Helvetica-Bold').text('até 30 (trinta) dias corridos', { continued: true });
  doc.font('Helvetica').text(' após o início da vigência do plano.');

  y = doc.y + 3;
  doc.text('Caso a redução/isenção total de carências seja aprovada pela Hapvida Saúde e/ou Affix, após o período de até 30 (trinta) dias corridos contado da vigência, o beneficiário ', 35, y, { continued: true, align: 'justify', width: 525 });
  doc.font('Helvetica-Bold').text('ficará sem carência para os procedimentos abrangidos pela aprovação, inclusive para parto', { continued: true });
  doc.font('Helvetica').text(', ressalvadas as doenças ou lesões preexistentes e demais situações que, por lei ou pelas condições contratuais aplicáveis, não possam ser objeto de isenção.');

  y = doc.y + 3;
  doc.text(
    'Durante o período de análise, o beneficiário deverá observar as orientações e condições informadas pela Hapvida Saúde e pela Affix. Eventuais prazos operacionais de processamento ou atualização não poderão restringir direitos mínimos garantidos pela legislação aplicável.',
    35, y, { align: 'justify', width: 525 }
  );
  y = doc.y + 3;
  doc.text(
    'Em relação à cobertura de urgência e emergência, deverão ser respeitadas as normas legais, regulamentares e contratuais aplicáveis ao plano.',
    35, y, { align: 'justify', width: 525 }
  );

  y = doc.y + 8;

  doc.fillColor(COLOR_PRIMARY).font('Helvetica-Bold').fontSize(10).text('6. DEVOLUÇÃO DA TAXA DE ADESÃO', 35, y);
  y = doc.y + 4;
  doc.fillColor(COLOR_TEXT).font('Helvetica').fontSize(8.5);
  doc.text('Caso, após a análise da Hapvida Saúde e/ou Affix, a redução ou isenção das carências não seja aprovada nas condições apresentadas ao cliente no momento da contratação, a ', 35, y, { continued: true, align: 'justify', width: 525 });
  doc.font('Helvetica-Bold').text('ELRAY CORRETORA DE SEGUROS LTDA - ELRAY SEGUROS, CNPJ nº 22.524.428/0001-76', { continued: true });
  doc.font('Helvetica').text(', realizará a ');
  doc.font('Helvetica-Bold').text('devolução integral do valor pago referente à taxa de adesão', { continued: true });
  doc.font('Helvetica').text(', observados os procedimentos administrativos necessários para a restituição.');

  y = doc.y + 8;

  doc.fillColor(COLOR_PRIMARY).font('Helvetica-Bold').fontSize(10).text('7. DECLARAÇÃO DE CIÊNCIA', 35, y);
  y = doc.y + 4;

  const itensCiencia = [
    'a) a redução ou isenção das carências depende de análise e aprovação da Hapvida Saúde e/ou Affix;',
    'b) não há garantia antecipada de aprovação;',
    'c) doenças ou lesões preexistentes não possuem garantia de redução ou isenção e estarão sujeitas às normas da ANS e da operadora;',
    'd) gestantes serão aceitas para esta condição até o 6º mês de gestação, mediante análise;',
    'e) a contratação deverá estar concluída e assinada até o dia 22, para vigência prevista no dia 1º do mês seguinte;',
    'f) a confirmação da redução ou isenção poderá ocorrer em até 30 dias corridos após a vigência;',
    'g) caso a redução/isenção total seja aprovada, após o prazo de até 30 dias corridos da vigência o beneficiário ficará sem carência para os procedimentos abrangidos pela aprovação, inclusive parto, ressalvadas doenças ou lesões preexistentes e demais exceções legais/contratuais;',
    'h) caso a condição de redução ou isenção apresentada não seja aprovada, será realizada a devolução integral da taxa de adesão paga, conforme previsto neste termo.'
  ];

  doc.fillColor(COLOR_TEXT).font('Helvetica').fontSize(7.8);
  itensCiencia.forEach((item) => {
    doc.text(item, 35, y, { align: 'justify', width: 525 });
    y = doc.y + 1.5;
  });

  y += 3;
  doc.font('Helvetica-Bold').fontSize(8).text('Por estar devidamente informada e de acordo com as condições acima, a cliente assina o presente termo.', 35, y);

  y += 10;

  // Tabela Final com Dados Preenchidos da Cliente
  const table2Rows = [
    {
      height: 16,
      cols: [
        { text: 'Nome da Cliente', bold: true, bg: COLOR_GRAY_BG, width: 140 },
        { text: cliente, bold: true, width: 385 }
      ]
    },
    {
      height: 16,
      cols: [
        { text: 'CPF', bold: true, bg: COLOR_GRAY_BG, width: 140 },
        { text: cpf, bold: true, width: 385 }
      ]
    },
    {
      height: 16,
      cols: [
        { text: 'Plano contratado', bold: true, bg: COLOR_GRAY_BG, width: 140 },
        { text: plano, width: 385 }
      ]
    },
    {
      height: 16,
      cols: [
        { text: 'Operadora', bold: true, bg: COLOR_GRAY_BG, width: 140 },
        { text: 'Hapvida Saúde - CNPJ 44.649.812/0001-38', width: 385 }
      ]
    },
    {
      height: 16,
      cols: [
        { text: 'Administradora', bold: true, bg: COLOR_GRAY_BG, width: 140 },
        { text: 'Affix Administradora de Benefícios Ltda - CNPJ 18.769.474/0001-68', width: 385 }
      ]
    },
    {
      height: 16,
      cols: [
        { text: 'Valor do plano (R$)', bold: true, bg: COLOR_GRAY_BG, width: 140 },
        { text: `R$ ${taxaAdesao}`, width: 385 }
      ]
    },
    {
      height: 16,
      cols: [
        { text: 'Data da contratação', bold: true, bg: COLOR_GRAY_BG, width: 140 },
        { text: dataContratacao, width: 385 }
      ]
    },
    {
      height: 16,
      cols: [
        { text: 'Vigência prevista', bold: true, bg: COLOR_GRAY_BG, width: 140 },
        { text: vigencia, width: 385 }
      ]
    }
  ];

  y = drawGridTable(doc, y, table2Rows, [140, 385]);
  
  // ==========================================
  // BLOCO DE ASSINATURA POSICIONADO COM ESPAÇAMENTO PERFEITO
  // ==========================================
  // Posicionar a linha de assinatura em sigY = 660 (bem abaixo da tabela, sem qualquer sobreposição)
  const sigY = 660;
  const colLeftX = 55;
  const colRightX = 320;
  const boxWidth = 220;

  // 1. Imagem da Assinatura da Cliente (Esquerda - posicionada diretamente acima da linha)
  if (assinaturaBase64 && assinaturaBase64.startsWith('data:image')) {
    try {
      const base64Data = assinaturaBase64.replace(/^data:image\/\w+;base64,/, '');
      const imgBuffer = Buffer.from(base64Data, 'base64');
      doc.image(imgBuffer, colLeftX + 10, sigY - 35, { fit: [200, 32], align: 'center', valig: 'center' });
    } catch (err) {
      console.error('Erro ao processar imagem de assinatura da cliente:', err);
    }
  }

  // 2. Imagem da Assinatura Oficial da Consultora (Direita - Raylene da Silva Ramos)
  const consultantSigPath = path.join(__dirname, 'assets', 'assinatura_consultor.png');
  if (fs.existsSync(consultantSigPath)) {
    try {
      doc.image(consultantSigPath, colRightX + 10, sigY - 35, { fit: [200, 32], align: 'center', valig: 'center' });
    } catch (err) {
      console.error('Erro ao carregar assinatura oficial do consultor:', err);
    }
  }

  // Linhas de Assinatura
  doc.moveTo(colLeftX, sigY).lineTo(colLeftX + boxWidth, sigY).lineWidth(0.8).stroke(COLOR_PRIMARY);
  doc.moveTo(colRightX, sigY).lineTo(colRightX + boxWidth, sigY).lineWidth(0.8).stroke(COLOR_PRIMARY);

  // Rótulos abaixo das linhas
  doc.fillColor(COLOR_PRIMARY)
     .font('Helvetica-Bold')
     .fontSize(8.5)
     .text('Assinatura da Cliente', colLeftX, sigY + 5, { width: boxWidth, align: 'center' });

  doc.fillColor(COLOR_PRIMARY)
     .font('Helvetica-Bold')
     .fontSize(8.5)
     .text('Responsável pelo atendimento / Consultor(a)', colRightX, sigY + 5, { width: boxWidth, align: 'center' });

  // ==========================================
  // CARIMBO DIGITAL DE AUTENTICIDADE DOCUSIGN (RODAPÉ DA PÁGINA 2)
  // ==========================================
  const auditY = 695;

  doc.rect(35, auditY, 525, 45).lineWidth(0.8).stroke('#cbd5e1');
  doc.rect(35, auditY, 525, 45).fillAndStroke('#f8fafc', '#cbd5e1');

  doc.fillColor('#166534')
     .font('Helvetica-Bold')
     .fontSize(9)
     .text('✔ CERTIFICADO DE ASSINATURA ELETRÔNICA - DOCUSIGN / ELRAY SIGN', 45, auditY + 6);

  doc.fillColor('#475569')
     .font('Helvetica')
     .fontSize(7.5)
     .text(`Signatária: ${cliente} | CPF: ${cpf} | Modo: ${modoAssinatura.toUpperCase()}`, 45, auditY + 18);

  doc.text(`ID do Documento: ${auditDocId} | Carimbo Data/Hora: ${auditTimestamp}`, 45, auditY + 27);
  doc.text(`Hash SHA-256: ${auditHash} | MP 2.200-2/2001 (ICP-Brasil)`, 45, auditY + 35);

  doc.fillColor('#888888')
     .font('Helvetica')
     .fontSize(8)
     .text('Termo de Ciência - Elray Seguros | Página 2', 35, 785, { align: 'center', width: 525 });

  doc.end();
}

// Endpoint 1: Retorno Inline (para visualizador iframe na tela)
app.post('/api/gerar-termo', (req, res) => {
  try {
    generateTermoPdfStream(req.body, res, false);
  } catch (error) {
    console.error('Erro ao gerar PDF inline:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Erro ao gerar o Termo de Ciência em PDF.', details: error.message });
    }
  }
});

// Endpoint 2: Retorno Attachment Forçado (para o botão Baixar PDF)
app.post('/api/download-termo', (req, res) => {
  try {
    generateTermoPdfStream(req.body, res, true);
  } catch (error) {
    console.error('Erro no download do PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Erro ao baixar o Termo de Ciência em PDF.', details: error.message });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Servidor Elray Seguros rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
});
