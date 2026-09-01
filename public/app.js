document.addEventListener('DOMContentLoaded', () => {
  // Configurar URL da API (Suporta Live Server local porta 5500 e Produção Render/Vercel)
  const isLocalLiveServer = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') && window.location.port !== '3000';
  const API_BASE_URL = isLocalLiveServer ? 'http://localhost:3000' : '';

  // Elementos do DOM
  const canvas = document.getElementById('signatureCanvas');
  const ctx = canvas.getContext('2d');
  const canvasPlaceholder = document.getElementById('canvasPlaceholder');
  const btnClear = document.getElementById('btnClearCanvas');
  const btnSubmit = document.getElementById('btnSubmit');
  const btnText = document.getElementById('btnText');
  const btnSpinner = document.getElementById('btnSpinner');
  const resultSection = document.getElementById('resultSection');
  const btnDownloadPdf = document.getElementById('btnDownloadPdf');
  const btnPreviewPdf = document.getElementById('btnPreviewPdf');
  const pdfViewerContainer = document.getElementById('pdfViewerContainer');
  const pdfIframe = document.getElementById('pdfIframe');

  // Elementos do Fluxo de Leitura (Etapa 1)
  const clienteInput = document.getElementById('cliente');
  const cpfInput = document.getElementById('cpf');
  const displayClienteName = document.getElementById('displayClienteName');
  const displayCpf = document.getElementById('displayCpf');
  const btnProceedToSignature = document.getElementById('btnProceedToSignature');
  const signatureSection = document.getElementById('signatureSection');

  // Elementos DocuSign Tabs (Etapa 2)
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  let currentTab = 'draw'; // 'draw' | 'type' | 'upload'

  // Elementos Modo Digitar
  const typedNameInput = document.getElementById('typedNameInput');
  const typedSignatureDisplay = document.getElementById('typedSignatureDisplay');
  const fontOptions = document.querySelectorAll('.font-option');
  let selectedFontFamily = 'Dancing Script';

  // Elementos Modo Upload
  const dropzone = document.getElementById('dropzone');
  const signatureFileInput = document.getElementById('signatureFileInput');
  const uploadPreviewWrapper = document.getElementById('uploadPreviewWrapper');
  const uploadPreviewImg = document.getElementById('uploadPreviewImg');
  const btnRemoveUpload = document.getElementById('btnRemoveUpload');
  let uploadedImageBase64 = null;

  // Audit Metadata
  const auditDocId = document.getElementById('auditDocId');
  const auditTimestamp = document.getElementById('auditTimestamp');
  const auditHash = document.getElementById('auditHash');
  const consentCheckbox = document.getElementById('consentCheckbox');

  // Guardar último payload enviado com sucesso
  let lastSubmittedPayload = null;

  // Sincronizar dados em tempo real no leitor do documento
  clienteInput.addEventListener('input', (e) => {
    const val = e.target.value.trim() || 'MARIA EDUARDA DE ALMEIDA SANTOS';
    displayClienteName.textContent = val.toUpperCase();
    typedNameInput.value = val;
    updateTypedSignatureDisplay();
  });

  cpfInput.addEventListener('input', (e) => {
    displayCpf.textContent = e.target.value.trim() || '523.187.198-29';
  });

  btnProceedToSignature.addEventListener('click', () => {
    signatureSection.scrollIntoView({ behavior: 'smooth' });
    signatureSection.style.transition = 'box-shadow 0.4s ease';
    signatureSection.style.boxShadow = '0 0 0 4px rgba(234, 179, 8, 0.5)';
    setTimeout(() => {
      signatureSection.style.boxShadow = 'var(--shadow)';
    }, 1500);
  });

  function generateAuditMetadata() {
    const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase();
    const docId = `ELR-2026-${randomHex}`;
    const hash = Array.from({length: 32}, () => Math.floor(Math.random() * 16).toString(16)).join('');
    
    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR') + ' BRT';

    if (auditDocId) auditDocId.textContent = docId;
    if (auditTimestamp) auditTimestamp.textContent = formattedDate;
    if (auditHash) auditHash.textContent = hash.substring(0, 16) + '...';

    return { docId, timestamp: formattedDate, hash };
  }

  const currentAudit = generateAuditMetadata();

  let isDrawing = false;
  let hasCanvasSignature = false;
  let lastX = 0;
  let lastY = 0;
  let currentPdfBlob = null;
  let currentPdfBlobUrl = null;

  typedNameInput.addEventListener('input', () => {
    updateTypedSignatureDisplay();
  });

  function updateTypedSignatureDisplay() {
    const val = typedNameInput.value.trim() || 'Sua Assinatura';
    typedSignatureDisplay.textContent = val;
    document.querySelectorAll('.font-preview').forEach(el => {
      el.textContent = val.length > 18 ? val.substring(0, 15) + '...' : val;
    });
  }

  fontOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      fontOptions.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      const radio = opt.querySelector('input[type="radio"]');
      radio.checked = true;
      selectedFontFamily = radio.value;

      typedSignatureDisplay.className = 'typed-display';
      if (selectedFontFamily === 'Dancing Script') typedSignatureDisplay.classList.add('font-dancing');
      else if (selectedFontFamily === 'Great Vibes') typedSignatureDisplay.classList.add('font-greatvibes');
      else if (selectedFontFamily === 'Alex Brush') typedSignatureDisplay.classList.add('font-alexbrush');
      else if (selectedFontFamily === 'Caveat') typedSignatureDisplay.classList.add('font-caveat');
    });
  });

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.add('hidden'));

      btn.classList.add('active');
      currentTab = btn.getAttribute('data-tab');

      if (currentTab === 'draw') {
        document.getElementById('tabContentDraw').classList.remove('hidden');
        setupCanvas();
      } else if (currentTab === 'type') {
        document.getElementById('tabContentType').classList.remove('hidden');
      } else if (currentTab === 'upload') {
        document.getElementById('tabContentUpload').classList.remove('hidden');
      }
    });
  });

  function setupCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.scale(dpr, dpr);
    ctx.strokeStyle = '#0b2545';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  setupCanvas();
  window.addEventListener('resize', setupCanvas);
  window.addEventListener('orientationchange', () => setTimeout(setupCanvas, 200));

  function getCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  function startDrawing(e) {
    e.preventDefault();
    isDrawing = true;
    const { x, y } = getCoordinates(e);
    lastX = x;
    lastY = y;

    if (!hasCanvasSignature) {
      hasCanvasSignature = true;
      canvasPlaceholder.classList.add('hidden');
    }
  }

  function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();

    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

    lastX = x;
    lastY = y;
  }

  function stopDrawing(e) {
    if (isDrawing) {
      isDrawing = false;
    }
  }

  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseleave', stopDrawing);

  canvas.addEventListener('touchstart', startDrawing, { passive: false });
  canvas.addEventListener('touchmove', draw, { passive: false });
  canvas.addEventListener('touchend', stopDrawing, { passive: false });

  btnClear.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasCanvasSignature = false;
    canvasPlaceholder.classList.remove('hidden');
  });

  dropzone.addEventListener('click', () => signatureFileInput.click());

  signatureFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (PNG ou JPG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      uploadedImageBase64 = evt.target.result;
      uploadPreviewImg.src = uploadedImageBase64;
      uploadPreviewWrapper.classList.remove('hidden');
      dropzone.classList.add('hidden');
    };
    reader.readAsDataURL(file);
  });

  btnRemoveUpload.addEventListener('click', () => {
    uploadedImageBase64 = null;
    signatureFileInput.value = '';
    uploadPreviewWrapper.classList.add('hidden');
    dropzone.classList.remove('hidden');
  });

  function renderTypedSignatureToPNG(text, fontFamily) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 600;
    tempCanvas.height = 150;
    const tCtx = tempCanvas.getContext('2d');

    tCtx.fillStyle = '#ffffff';
    tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    tCtx.font = `bold 42px "${fontFamily}", cursive, sans-serif`;
    tCtx.fillStyle = '#0b2545';
    tCtx.textAlign = 'center';
    tCtx.textBaseline = 'middle';
    tCtx.fillText(text, tempCanvas.width / 2, tempCanvas.height / 2);

    return tempCanvas.toDataURL('image/png');
  }

  // Download do PDF via submissão dinâmica para API_BASE_URL/api/download-termo
  function triggerDirectAttachmentDownload(payload) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `${API_BASE_URL}/api/download-termo`;
    form.style.display = 'none';

    for (const key in payload) {
      if (payload[key] !== undefined && payload[key] !== null) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = payload[key];
        form.appendChild(input);
      }
    }

    document.body.appendChild(form);
    form.submit();
    setTimeout(() => {
      document.body.removeChild(form);
    }, 1000);
  }

  // Submeter e Gerar Termo Assinado
  btnSubmit.addEventListener('click', async (e) => {
    e.preventDefault();

    if (!consentCheckbox.checked) {
      alert('Você precisa aceitar os termos de uso da assinatura eletrônica para prosseguir.');
      return;
    }

    let finalSignatureBase64 = null;

    if (currentTab === 'draw') {
      if (!hasCanvasSignature) {
        alert('Por favor, desenhe sua assinatura no quadro.');
        return;
      }
      finalSignatureBase64 = canvas.toDataURL('image/png');
    } else if (currentTab === 'type') {
      const typedText = typedNameInput.value.trim();
      if (!typedText) {
        alert('Por favor, digite o nome para a assinatura.');
        return;
      }
      finalSignatureBase64 = renderTypedSignatureToPNG(typedText, selectedFontFamily);
    } else if (currentTab === 'upload') {
      if (!uploadedImageBase64) {
        alert('Por favor, selecione e envie uma imagem da sua assinatura.');
        return;
      }
      finalSignatureBase64 = uploadedImageBase64;
    }

    const cliente = clienteInput.value.trim();
    const cpf = cpfInput.value.trim();
    const taxaAdesao = document.getElementById('taxaAdesao').value.trim();
    const plano = document.getElementById('plano').value.trim();
    const acomodacao = document.getElementById('acomodacao').value;
    const dataContratacao = document.getElementById('dataContratacao').value.trim();
    const vigencia = document.getElementById('vigencia').value.trim();

    if (!cliente || !cpf) {
      alert('Por favor, preencha o Nome da Cliente e o CPF.');
      return;
    }

    lastSubmittedPayload = {
      cliente,
      cpf,
      taxaAdesao,
      plano,
      acomodacao,
      dataContratacao,
      vigencia,
      assinaturaBase64: finalSignatureBase64,
      modoAssinatura: currentTab,
      auditDocId: currentAudit.docId,
      auditTimestamp: currentAudit.timestamp,
      auditHash: currentAudit.hash
    };

    // UI State
    btnSubmit.disabled = true;
    btnText.textContent = 'Autenticando e Gerando PDF DocuSign...';
    btnSpinner.classList.remove('hidden');

    try {
      const response = await fetch(`${API_BASE_URL}/api/gerar-termo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(lastSubmittedPayload)
      });

      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || !contentType.includes('application/pdf')) {
        const errorText = await response.text();
        let errorObj;
        try { errorObj = JSON.parse(errorText); } catch(errEvt) {}
        throw new Error(errorObj?.error || errorObj?.details || 'O servidor Node.js não respondeu. Certifique-se de que o backend está ativo.');
      }

      const arrayBuffer = await response.arrayBuffer();
      currentPdfBlob = new Blob([arrayBuffer], { type: 'application/pdf' });

      if (currentPdfBlobUrl) {
        URL.revokeObjectURL(currentPdfBlobUrl);
      }

      currentPdfBlobUrl = URL.createObjectURL(currentPdfBlob);

      resultSection.classList.remove('hidden');
      pdfViewerContainer.classList.remove('hidden');
      pdfIframe.src = currentPdfBlobUrl;

      // Disparar o download com nome de arquivo .pdf garantido via HTTP attachment
      triggerDirectAttachmentDownload(lastSubmittedPayload);

      resultSection.scrollIntoView({ behavior: 'smooth' });

    } catch (err) {
      console.error(err);
      alert('Erro ao processar assinatura: ' + err.message);
    } finally {
      btnSubmit.disabled = false;
      btnText.textContent = 'Adotar e Assinar Termo (DocuSign PDF)';
      btnSpinner.classList.add('hidden');
    }
  });

  btnDownloadPdf.addEventListener('click', () => {
    if (!lastSubmittedPayload) return;
    triggerDirectAttachmentDownload(lastSubmittedPayload);
  });

  btnPreviewPdf.addEventListener('click', () => {
    pdfViewerContainer.classList.toggle('hidden');
    if (!pdfViewerContainer.classList.contains('hidden')) {
      pdfViewerContainer.scrollIntoView({ behavior: 'smooth' });
    }
  });
});
