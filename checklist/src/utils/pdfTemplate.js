import jsPDF from 'jspdf';

/**
 * Generate PDF from CTRC data
 * @param {Object} data - The CTRC data
 * @param {string} logoDataUrl - Logo em base64 (opcional)
 * @returns {jsPDF} - The generated PDF document
 */
// Helper: desenha o cabeçalho e retorna o novo yPos (após cabeçalho e bloco de observações)
// options: { compact: boolean } - when compact=true draw only minimal header (CTRC)
const drawHeaderAndObservations = (doc, data, logoDataUrl, yStart = 10, options = {}) => {
  // Debug: confirmar campos usados no cabeçalho (logs removidos em produção)
  const grayBg = [200, 200, 200];
  const borderColor = [100, 100, 100];
  let yPos = yStart;

  // Página medidas e margens dinâmicas para suportar retrato/paisagem
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;
  const centerX = margin + contentWidth / 2;
  const rightEdge = margin + contentWidth;

  // Caixa superior com título (usa medidas dinâmicas)
  doc.setFillColor(...grayBg);
  doc.setDrawColor(...borderColor);
  doc.rect(margin, yPos, contentWidth, 30, 'FD');

  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('CHECK LIST FULL SERVICE', centerX, yPos + 16, { align: 'center' });

  // Logo
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', 12, yPos + 4, 36, 16);
    } catch (e) {
      // ignore
    }
  }

  // Emissão (canto direito)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const now = new Date();
  const emissao = `Emissão: ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear().toString().slice(-2)} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
  doc.text(emissao, rightEdge, yPos + 6, { align: 'right' });

  yPos += 34; // espaço após caixa principal
  // If compact mode is requested, draw only the CTRC number under the title and return
  if (options.compact) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`CTRC: ${data.ctrc || 'N/A'}`, margin + 2, yPos + 6);
    return yPos + 12;
  }

  // Bloco de informações (nota, volumes, remetente, cliente)
  doc.setDrawColor(...borderColor);
  const infoBoxHeight = 62;
  const infoBoxTop = yPos;
  doc.rect(margin, infoBoxTop, contentWidth, infoBoxHeight, 'D');

  // Content inside info box
  let innerY = infoBoxTop + 12;

  const leftX = margin + 2;
  const leftValueX = margin + 48;
  const rightColX = margin + Math.round(contentWidth * 0.65);
  const lineStart = rightColX + 28;
  const lineEnd = rightEdge;

  // Remetente (linha 1)
  // Remetente (linha 1)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Remetente:', leftX, innerY);
  doc.setFont('helvetica', 'bold');
  doc.text(data.remetente || 'N/A', leftValueX, innerY);

  innerY += 8;
  // Destinatário (linha 2)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Destinatário:', leftX, innerY);
  doc.text(data.destinatario || 'N/A', leftValueX, innerY);

  innerY += 12;
  // CTRC (linha atual)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('CTRC:', leftX, innerY);
  doc.text(data.ctrc || 'N/A', leftValueX, innerY);

  // Última linha do info box: Nota Fiscal e VOLUMES lado a lado (destaque)
  innerY += 14;
  // posições: nota à esquerda; volumes calculado para não invadir a coluna direita
  const notaLabelX = leftX;
  const notaValueX = leftValueX;
  const volumesMaxX = rightColX - 12; // limitar antes da coluna direita
  // mover volumes para linha abaixo da nota
  let volumesLabelX = notaLabelX;
  let volumesValueX = notaValueX + 60;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Nota Fiscal:', notaLabelX, innerY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(22);
  doc.text(`${data.notaFiscal || ''}`, notaValueX, innerY);

  // VOLUMES abaixo da nota
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('VOLUMES:', volumesLabelX, innerY + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(22);
  // colocar VOLUMES diretamente abaixo da Nota Fiscal (mesma coluna)
  doc.text(`${data.qvol || ''}`, notaValueX, innerY + 8);
  // Destino removido conforme solicitado

  // Coluna direita: campos em branco para preenchimento posterior
  let rightY = infoBoxTop + 18;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Paletes:', rightColX, rightY);
  doc.setFont('helvetica', 'normal');
  doc.setLineWidth(0.6);
  doc.line(lineStart, rightY + 2, lineEnd, rightY + 2);
  rightY += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Separador:', rightColX, rightY);
  doc.setFont('helvetica', 'normal');
  doc.line(lineStart, rightY + 2, lineEnd, rightY + 2);
  rightY += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Data:', rightColX, rightY);
  doc.setFont('helvetica', 'normal');
  doc.line(lineStart, rightY + 2, lineEnd, rightY + 2);
  rightY += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Assinatura:', rightColX, rightY);
  doc.setFont('helvetica', 'normal');
  doc.line(lineStart, rightY + 2, lineEnd, rightY + 2);

  // Observações - abaixo do info box
  // posiciona yPos usando a altura fixa da caixa de informações para evitar sobreposição
  yPos = infoBoxTop + infoBoxHeight + 4;

  const borderBoxHeight = 56;
  doc.setDrawColor(...borderColor);
  doc.rect(margin, yPos, contentWidth, borderBoxHeight, 'D');

  // variáveis de posição das colunas das observações — inicializadas para uso seguro
  let col1Y = 0;
  let col2Y = 0;
  let col3Y = 0;

  const obsSource = data.observacao || data.observacoes || null;
  if (obsSource) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('OBSERVAÇÕES:', leftX, yPos + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const obs = obsSource;
    col1Y = yPos + 10;
    col2Y = yPos + 10;
    col3Y = yPos + 10;

    const obsCol1 = leftX;
    const obsCol2 = leftX + Math.round(contentWidth * 0.35);
    const obsCol3 = leftX + Math.round(contentWidth * 0.7);

    if (obs['Perfil de Recebimento']) { doc.text(`Perfil de Recebimento: ${obs['Perfil de Recebimento']}`, obsCol1, col1Y); col1Y += 5; }
    if (obs['Separação']) { doc.text(`Separação: ${obs['Separação']}`, obsCol1, col1Y); col1Y += 5; }
    if (obs['Perfil de paletização']) { doc.text(`Paletização: ${obs['Perfil de paletização']}`, obsCol2, col2Y); col2Y += 5; }
    if (obs['Estabilização do palete']) { doc.text(`Estabilização: ${obs['Estabilização do palete']}`, obsCol2, col2Y); col2Y += 5; }
    if (obs['Altura do palete']) { doc.text(`Altura do palete: ${obs['Altura do palete']}m`, obsCol3, col3Y); col3Y += 5; }
    if (obs['Aceita Sobreposição']) { doc.text(`Aceita Sobreposição: ${obs['Aceita Sobreposição']}`, obsCol3, col3Y); col3Y += 5; }
  }
  // Instruções estáticas (sempre visíveis na área de observações)
  const staticLines = [
    'Separado por nota',
    'Carregar nas sequências para que todos os pallets fiquem próximo',
    'Toda mercadoria deve estar paletizada (PBR)',
    'Identificar todos os pallets com os números das notas',
    'PBR devem estar em bom estado de conservação'
  ];

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  // Calcular posição segura para as linhas estáticas: abaixo das observações dinâmicas
  const staticLineHeight = 4;
  const staticTotalHeight = staticLines.length * staticLineHeight;
  const boxBottomY = yPos + borderBoxHeight;

  // Determinar máxima Y usada pelas colunas dinâmicas
  const maxDynamicY = Math.max(col1Y || 0, col2Y || 0, col3Y || 0);

  // Posicionar as linhas estáticas: preferir ficar no final do box, mas nunca sobrepor as dinâmicas
  let staticStartY = Math.max(maxDynamicY + 3, boxBottomY - staticTotalHeight - 4);
  // Garantir que staticStartY fica dentro da borda do box
  if (staticStartY + staticTotalHeight > boxBottomY - 2) {
    staticStartY = boxBottomY - staticTotalHeight - 2;
  }

  let sy = staticStartY;
  for (const line of staticLines) {
    doc.text(`- ${line}`, 12, sy);
    sy += staticLineHeight;
  }

  return yPos + borderBoxHeight + 4; // return next y (gap reduzido)
};

export const generatePDF = (data, logoDataUrl = null) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const reservedBottom = 12; // space reserved at bottom for totals/footers
  const bottomLimit = pageHeight - margin - reservedBottom;

  let yPos = drawHeaderAndObservations(doc, data, logoDataUrl, 10);

  // ===== TABELA DE PRODUTOS =====
  // Cabeçalho da tabela
  const grayBg = [200, 200, 200];
  const borderColor = [100, 100, 100];
  doc.setFillColor(...grayBg);
  doc.setDrawColor(...borderColor);
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;
  const tableLeft = margin;
  const tableWidth = contentWidth;
  // columns (relative)
  const colSKU = tableLeft + 2;
  const colProduto = tableLeft + Math.round(contentWidth * 0.15);
  const colUMD = tableLeft + Math.round(contentWidth * 0.6);
  const colQuantidade = tableLeft + Math.round(contentWidth * 0.73);
  const colStatus = tableLeft + Math.round(contentWidth * 0.86);
  const colObs = tableLeft + Math.round(contentWidth * 0.95);

  doc.rect(tableLeft, yPos, tableWidth, 8, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('SKU', colSKU, yPos + 5);
  doc.text('PRODUTO', colProduto, yPos + 5);
  doc.text('UMD', colUMD, yPos + 5);
  doc.text('QTDE', colQuantidade, yPos + 5);
  doc.text('STATUS', colStatus, yPos + 5);
  doc.text('OBS', colObs, yPos + 5);

  yPos += 8;

  // Linhas dos produtos
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  let totalQuantidade = 0;

  const addTableHeader = () => {
    doc.setFillColor(...grayBg);
    doc.setDrawColor(...borderColor);
    doc.rect(tableLeft, yPos, tableWidth, 8, 'FD');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('SKU', colSKU, yPos + 5);
    doc.text('PRODUTO', colProduto, yPos + 5);
    doc.text('UMD', colUMD, yPos + 5);
    doc.text('QUANTIDADE', colQuantidade, yPos + 5);
    doc.text('STATUS', colStatus, yPos + 5);
    doc.text('OBS', colObs, yPos + 5);
    yPos += 8;
    // Reset font for table rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
  };

  if (data.produtos && data.produtos.length > 0) {
    data.produtos.forEach((produto) => {
      const rowHeight = 7;

      if (yPos + rowHeight + 12 > bottomLimit) { // leave space for total
        doc.addPage();
        yPos = drawHeaderAndObservations(doc, data, logoDataUrl, 10, { compact: true });
        addTableHeader();
      }

      const sku = produto.codigo || '-';
      const produtoTexto = produto.produto || '-';
      const unidade = produto.unidade || 'UN';
      const quantidade = produto.quantidade ? parseFloat(produto.quantidade).toFixed(0) : '0';

      totalQuantidade += parseFloat(produto.quantidade || 0);

      const produtoTruncado = produtoTexto.length > 80 ? produtoTexto.substring(0, 80) + '...' : produtoTexto;

      doc.text(sku, colSKU, yPos + 4);
      doc.text(produtoTruncado, colProduto, yPos + 4);
      doc.text(unidade, colUMD, yPos + 4);
      doc.text(quantidade, colQuantidade, yPos + 4);
      doc.text('', colStatus, yPos + 4);
      doc.text('', colObs, yPos + 4);

      doc.rect(tableLeft, yPos, tableWidth, rowHeight, 'D');
      yPos += rowHeight;
    });
  } else if (data.produto) {
    const rowHeight = 7;
    const sku = data.codigo || '-';
    const produto = data.produto || '-';
    const unidade = data.unidade || 'UN';
    const quantidade = data.quantidade ? parseFloat(data.quantidade).toFixed(0) : '0';

    totalQuantidade = parseFloat(data.quantidade || 0);

    const produtoTexto = produto.length > 80 ? produto.substring(0, 80) + '...' : produto;

    if (yPos + rowHeight + 12 > bottomLimit) {
      doc.addPage();
      yPos = drawHeaderAndObservations(doc, data, logoDataUrl, 10, { compact: true });
      addTableHeader();
    }

    doc.text(sku, colSKU, yPos + 4);
    doc.text(produtoTexto, colProduto, yPos + 4);
    doc.text(unidade, colUMD, yPos + 4);
    doc.text(quantidade, colQuantidade, yPos + 4);
    doc.text('', colStatus, yPos + 4);
    doc.text('', colObs, yPos + 4);

    doc.rect(tableLeft, yPos, tableWidth, rowHeight, 'D');
    yPos += rowHeight;
  }

  // Linha Total Geral
  if (yPos + 12 > bottomLimit) {
    doc.addPage();
    yPos = drawHeaderAndObservations(doc, data, logoDataUrl, 10, { compact: true });
  }

  doc.setFillColor(240, 240, 240);
  doc.rect(tableLeft, yPos, tableWidth, 7, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.text('Total Geral', colSKU, yPos + 4);
  doc.text(totalQuantidade.toFixed(0), colQuantidade, yPos + 4);

  // Adicionar numeração por página para este CTRC (1/N) abaixo da emissão
  try {
    const totalPages = doc.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;
    const rightEdge = margin + contentWidth;
    const pageNumY = 22; // posição abaixo da emissão
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      const pageIndex = p;
      doc.text(`${pageIndex}/${totalPages}`, rightEdge, pageNumY, { align: 'right' });
    }
  } catch (err) {
    // não bloquear geração por erros menores de paginação
  }

  return doc;
};

/**
 * Download PDF file
 * @param {jsPDF} doc - The PDF document
 * @param {string} filename - The filename for download
 */
export const downloadPDF = (doc, filename = 'checklist-ctrc.pdf') => {
  doc.save(filename);
};

/**
 * Load logo image and convert to base64
 * @returns {Promise<string>} - Logo em base64
 */
const loadLogo = () => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      } catch (error) {
        resolve(null);
      }
    };
    img.onerror = () => {
      resolve(null);
    };
    img.src = '/logo-binho.png';
  });
};

/**
 * Generate and download PDF from CTRC data
 * @param {Object} data - The CTRC data
 */
export const generateCombinedPDF = async (dataArray, logoDataUrl = null, extra = {}) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const { erroredCtrcs = [], erroredItems = [] } = extra || {};

  // Filter only items that have a valid CTRC and are not error-placeholders
  const ctrcItems = Array.isArray(dataArray) ? dataArray.filter((it) => it && it.ctrc && !it._erro) : [];

  // If there are errored CTRCs or erroredItems, add a summary page first
  if ((erroredCtrcs && erroredCtrcs.length) || (erroredItems && erroredItems.length)) {
    // Summary page
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo do Manifesto', 105, 20, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    let sy = 30;
    if (erroredCtrcs && erroredCtrcs.length) {
      doc.text('CTRCs faltantes:', 14, sy);
      doc.setFont('helvetica', 'normal');
      sy += 6;
      for (const c of erroredCtrcs) {
        doc.text(`- ${c}`, 18, sy);
        sy += 6;
        if (sy > 270) { doc.addPage(); sy = 20; }
      }
      sy += 4;
    }

    if (erroredItems && erroredItems.length) {
      doc.setFont('helvetica', 'bold');
      doc.text('Erros retornados:', 14, sy);
      doc.setFont('helvetica', 'normal');
      sy += 6;
      for (const it of erroredItems) {
        const msg = it && (it.message || it.raw_response || JSON.stringify(it));
        const wrapped = doc.splitTextToSize(String(msg), 180);
        for (const line of wrapped) {
          doc.text(line, 18, sy);
          sy += 6;
          if (sy > 270) { doc.addPage(); sy = 20; }
        }
        sy += 4;
      }
    }

    // If there are actual CTRC items to follow, add a page break before them
    if (ctrcItems.length > 0) doc.addPage();
  }

  for (let i = 0; i < ctrcItems.length; i++) {
    const data = ctrcItems[i];
    const startPage = doc.getNumberOfPages();

    const grayBg = [200, 200, 200];
    const borderColor = [100, 100, 100];
    const textColor = [0, 0, 0];

    // Use common header + observations rendering (keeps layout consistent)
    let yPos = drawHeaderAndObservations(doc, data, logoDataUrl, 10);


    // Observações e informações já foram desenhadas por drawHeaderAndObservations
    // apenas usa o yPos retornado para iniciar a tabela

    // ===== TABELA DE PRODUTOS =====
    doc.setFillColor(...grayBg);
    doc.setDrawColor(...borderColor);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const reservedBottom = 12;
    const rowHeight = 7;
    const contentWidth = pageWidth - margin * 2;
    const tableLeft = margin;
    const tableWidth = contentWidth;
    const colSKU = tableLeft + 2;
    const colProduto = tableLeft + Math.round(contentWidth * 0.15);
    const colUMD = tableLeft + Math.round(contentWidth * 0.6);
    const colQuantidade = tableLeft + Math.round(contentWidth * 0.73);
    const colStatus = tableLeft + Math.round(contentWidth * 0.86);
    const colObs = tableLeft + Math.round(contentWidth * 0.95);

    doc.rect(tableLeft, yPos, tableWidth, 8, 'FD');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('SKU', colSKU, yPos + 5);
    doc.text('PRODUTO', colProduto, yPos + 5);
    doc.text('UMD', colUMD, yPos + 5);
    doc.text('QTDE', colQuantidade, yPos + 5);
    doc.text('STATUS', colStatus, yPos + 5);
    doc.text('OBS', colObs, yPos + 5);

    yPos += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    let totalQuantidade = 0;
    
    if (data.produtos && data.produtos.length > 0) {
      data.produtos.forEach((produto) => {
        if (yPos + rowHeight + reservedBottom > pageHeight - margin) {
          doc.addPage();
          // compact header on continuation page (only CTRC)
          yPos = drawHeaderAndObservations(doc, data, logoDataUrl, 10, { compact: true });
          // redraw table header for new page
          doc.setFillColor(...grayBg);
          doc.setDrawColor(...borderColor);
          doc.rect(tableLeft, yPos, tableWidth, 8, 'FD');
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text('SKU', colSKU, yPos + 5);
          doc.text('PRODUTO', colProduto, yPos + 5);
          doc.text('UMD', colUMD, yPos + 5);
          doc.text('QTDE', colQuantidade, yPos + 5);
          doc.text('STATUS', colStatus, yPos + 5);
          doc.text('OBS', colObs, yPos + 5);
          yPos += 8;
          // Reset font for table rows after drawing header
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
        }

        const sku = produto.codigo || '-';
        const produtoTexto = produto.produto || '-';
        const unidade = produto.unidade || 'UN';
        const quantidade = produto.quantidade ? parseFloat(produto.quantidade).toFixed(0) : '0';
        
        totalQuantidade += parseFloat(produto.quantidade || 0);

        const produtoTruncado = produtoTexto.length > 80 ? produtoTexto.substring(0, 80) + '...' : produtoTexto;
        
        doc.text(sku, colSKU, yPos + 4);
        doc.text(produtoTruncado, colProduto, yPos + 4);
        doc.text(unidade, colUMD, yPos + 4);
        doc.text(quantidade, colQuantidade, yPos + 4);
        doc.text('', colStatus, yPos + 4);
        doc.text('', colObs, yPos + 4);

        doc.rect(tableLeft, yPos, tableWidth, rowHeight, 'D');
        yPos += rowHeight;
      });
    } else if (data.produto) {
      const sku = data.codigo || '-';
      const produto = data.produto || '-';
      const unidade = data.unidade || 'UN';
      const quantidade = data.quantidade ? parseFloat(data.quantidade).toFixed(0) : '0';
      
      totalQuantidade = parseFloat(data.quantidade || 0);
      
      const produtoTexto = produto.length > 80 ? produto.substring(0, 80) + '...' : produto;
      
      doc.text(sku, colSKU, yPos + 4);
      doc.text(produtoTexto, colProduto, yPos + 4);
      doc.text(unidade, colUMD, yPos + 4);
      doc.text(quantidade, colQuantidade, yPos + 4);
      doc.text('', colStatus, yPos + 4);
      doc.text('', colObs, yPos + 4);
      
      doc.rect(tableLeft, yPos, tableWidth, 7, 'D');
      yPos += 7;
    }

    doc.setFillColor(240, 240, 240);
    doc.rect(tableLeft, yPos, tableWidth, 7, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.text('Total Geral', colSKU, yPos + 4);
    doc.text(totalQuantidade.toFixed(0), colQuantidade, yPos + 4);

    // Adicionar numeração por página apenas para as páginas deste CTRC
    try {
      const endPage = doc.getNumberOfPages();
      const totalPages = endPage - startPage + 1;
      const pageWidthLocal = doc.internal.pageSize.getWidth();
      const marginLocal = 10;
      const contentWidthLocal = pageWidthLocal - marginLocal * 2;
      const rightEdgeLocal = marginLocal + contentWidthLocal;
      const pageNumY = 22;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      for (let p = startPage; p <= endPage; p++) {
        doc.setPage(p);
        const pageIndex = p - startPage + 1;
        doc.text(`${pageIndex}/${totalPages}`, rightEdgeLocal, pageNumY, { align: 'right' });
      }
    } catch (err) {
      // ignore
    }

    // Se não for o último ctrc, acrescentar página
    if (i < ctrcItems.length - 1) doc.addPage();
  }

  return doc;
};

export const generateAndDownloadPDF = async (inputData) => {
  const logoDataUrl = await loadLogo();

  // Support several input forms:
  // 1) legacy: inputData is a single object or an array of CTRC objects
  // 2) structured: inputData is { valid: [...], erroredCtrcs: [...], erroredItems: [...] }
  // 3) manifesto array: first element contains { concatenated_ctrc: 'A,B,C' } and subsequent
  //    elements are either error objects or CTRC objects — this branch prefers the Filter list
  let validData = null;
  let erroredCtrcs = [];
  let erroredItems = [];

  if (inputData && inputData.valid !== undefined) {
    validData = Array.isArray(inputData.valid) ? inputData.valid : [inputData.valid];
    erroredCtrcs = Array.isArray(inputData.erroredCtrcs) ? inputData.erroredCtrcs : [];
    erroredItems = Array.isArray(inputData.erroredItems) ? inputData.erroredItems : [];
  } else if (Array.isArray(inputData) && inputData.length > 0 && inputData[0] && inputData[0].concatenated_ctrc) {
    // New manifesto payload: first entry carries the expected list
    const first = inputData[0] || {};
    const expectedList = String(first.concatenated_ctrc || '').split(',').map((s) => s.trim()).filter(Boolean);

    const rest = inputData.slice(1);
    // valid items: require a non-empty `ctrc` value
    validData = rest.filter((it) => it && typeof it === 'object' && it.ctrc && String(it.ctrc).trim() !== '');
    // errored items: explicit error objects
    erroredItems = rest.filter((it) => it && it.error === true);
    // also consider objects without ctrc as errored (raw responses)
    const othersWithoutCtrc = rest.filter((it) => it && typeof it === 'object' && !it.ctrc && !it.error);
    if (othersWithoutCtrc.length > 0) erroredItems = erroredItems.concat(othersWithoutCtrc);

    const returnedCtrcs = validData.map((it) => String(it.ctrc).toUpperCase());
    // missing CTRCs are expected ones that didn't appear in returnedCtrcs
    erroredCtrcs = expectedList.filter((e) => !returnedCtrcs.includes(String(e).toUpperCase()));
  } else if (Array.isArray(inputData)) {
    validData = inputData;
  } else if (inputData) {
    validData = [inputData];
  } else {
    validData = [];
  }

  // Excluir placeholders de erro (_erro) das listas de 'validData' para que
  // a geração de PDF considere apenas CTRCs válidos.
  if (Array.isArray(validData)) {
    validData = validData.filter((it) => it && !it._erro);
  }

  // If only one valid CTRC and no errored entries, keep legacy single-PDF behavior
  if (validData.length === 1 && erroredCtrcs.length === 0) {
    const docSingle = generatePDF(validData[0], logoDataUrl);
    const filenameSingle = `checklist-ctrc-${validData[0].ctrc || 'sem-numero'}-${Date.now()}.pdf`;
    try {
      downloadPDF(docSingle, filenameSingle);
      try {
        const blob = docSingle.output('blob');
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } catch (openErr) {
        // ignore open errors
      }
    } catch (err) {
      throw err;
    }
    return;
  }

  // Generate combined PDF for valid CTRCs (or produce a summary-only PDF if none valid)
  let doc;
  if (!validData || validData.length === 0) {
    doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    // Draw a simple header and then a clean summary listing missing CTRCs
    drawHeaderAndObservations(doc, { ctrc: 'MANIFESTO' }, logoDataUrl, 10);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo do Manifesto', 14, 60);

    let y = 70;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (erroredCtrcs && erroredCtrcs.length > 0) {
      doc.text('CTRCs faltando:', 14, y);
      y += 6;
      erroredCtrcs.forEach((c) => {
        doc.text(`- ${c}`, 16, y);
        y += 6;
        if (y > doc.internal.pageSize.getHeight() - 30) { doc.addPage(); y = 20; }
      });
    }

    if (erroredItems && erroredItems.length > 0) {
      if (y + 8 > doc.internal.pageSize.getHeight() - 30) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'bold');
      doc.text('Erros retornados:', 14, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      erroredItems.forEach((it) => {
        const msg = it ? (it.message || JSON.stringify(it)) : 'Erro desconhecido';
        const wrapped = doc.splitTextToSize(msg, doc.internal.pageSize.getWidth() - 28);
        for (const line of wrapped) {
          doc.text(line, 16, y);
          y += 6;
          if (y > doc.internal.pageSize.getHeight() - 30) { doc.addPage(); y = 20; }
        }
        y += 2;
      });
    }
  } else {
    doc = await generateCombinedPDF(validData, logoDataUrl);

    // We intentionally do not append pages for errored CTRCs or errored items.
    // The UI will show placeholders for errored CTRCs; PDF export includes only valid CTRCs.
  }

  const filename = `checklist-manifesto-${Date.now()}.pdf`;
  try {
    downloadPDF(doc, filename);
    try {
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (openErr) {
      // ignore
    }
  } catch (err) {
    throw err;
  }
};

/**
 * Generate multiple PDFs from an array of CTRC data
 * @param {Array<Object>} dataArray - The array of CTRC data
 * @param {string} logoDataUrl - Logo em base64 (opcional)
 * @returns {Promise<Array<jsPDF>>} - The array of generated PDF documents
 */
export const generateMultiplePDFs = async (dataArray, logoDataUrl = null) => {
  const pdfs = [];
  // ensure only real CTRC objects are processed (exclude placeholders with _erro)
  const ctrcItems = Array.isArray(dataArray) ? dataArray.filter((it) => it && it.ctrc && !it._erro) : [];

  for (const data of ctrcItems) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const grayBg = [200, 200, 200];
    const borderColor = [100, 100, 100];
    const textColor = [0, 0, 0];

    // Use common header + observations rendering (keeps layout consistent)
    let yPos = drawHeaderAndObservations(doc, data, logoDataUrl, 10);

    // Observações já sendo desenhadas no helper; continuar a partir do yPos retornado

    // ===== TABELA DE PRODUTOS =====
    // Cabeçalho da tabela
    doc.setFillColor(...grayBg);
    doc.setDrawColor(...borderColor);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const reservedBottom = 12;
    const rowHeight = 7;
    const contentWidth = pageWidth - margin * 2;
    const tableLeft = margin;
    const tableWidth = contentWidth;
    const colSKU = tableLeft + 2;
    const colProduto = tableLeft + Math.round(contentWidth * 0.15);
    const colUMD = tableLeft + Math.round(contentWidth * 0.6);
    const colQuantidade = tableLeft + Math.round(contentWidth * 0.73);
    const colStatus = tableLeft + Math.round(contentWidth * 0.86);
    const colObs = tableLeft + Math.round(contentWidth * 0.95);

    doc.rect(tableLeft, yPos, tableWidth, 8, 'FD');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('SKU', colSKU, yPos + 5);
    doc.text('PRODUTO', colProduto, yPos + 5);
    doc.text('UMD', colUMD, yPos + 5);
    doc.text('QTDE', colQuantidade, yPos + 5);
    doc.text('STATUS', colStatus, yPos + 5);
    doc.text('OBS', colObs, yPos + 5);
    
    yPos += 8;

    // Linhas dos produtos
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    let totalQuantidade = 0;
    
    if (data.produtos && data.produtos.length > 0) {
      // Múltiplos produtos
      data.produtos.forEach((produto, index) => {
        if (yPos + rowHeight + reservedBottom > pageHeight - margin) {
          doc.addPage();
          // compact header for continuation pages
          yPos = drawHeaderAndObservations(doc, data, logoDataUrl, 10, { compact: true });
          // redraw table header for new page
          doc.setFillColor(...grayBg);
          doc.setDrawColor(...borderColor);
          doc.rect(tableLeft, yPos, tableWidth, 8, 'FD');
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text('SKU', colSKU, yPos + 5);
          doc.text('PRODUTO', colProduto, yPos + 5);
          doc.text('UMD', colUMD, yPos + 5);
          doc.text('QTDE', colQuantidade, yPos + 5);
          doc.text('STATUS', colStatus, yPos + 5);
          doc.text('OBS', colObs, yPos + 5);
          yPos += 8;
          // Reset font for table rows after drawing header
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
        }

        const sku = produto.codigo || '-';
        const produtoTexto = produto.produto || '-';
        const unidade = produto.unidade || 'UN';
        const quantidade = produto.quantidade ? parseFloat(produto.quantidade).toFixed(0) : '0';
        
        totalQuantidade += parseFloat(produto.quantidade || 0);

        // Truncar produto se muito longo
        const produtoTruncado = produtoTexto.length > 80 ? produtoTexto.substring(0, 80) + '...' : produtoTexto;
        
        doc.text(sku, colSKU, yPos + 4);
        doc.text(produtoTruncado, colProduto, yPos + 4);
        doc.text(unidade, colUMD, yPos + 4);
        doc.text(quantidade, colQuantidade, yPos + 4);
        doc.text('', colStatus, yPos + 4); // Status vazio
        doc.text('', colObs, yPos + 4); // OBS vazia
        
        doc.rect(tableLeft, yPos, tableWidth, rowHeight, 'D');
        yPos += rowHeight;
      });
    } else if (data.produto) {
      // Produto único
      const sku = data.codigo || '-';
      const produto = data.produto || '-';
      const unidade = data.unidade || 'UN';
      const quantidade = data.quantidade ? parseFloat(data.quantidade).toFixed(0) : '0';
      
      totalQuantidade = parseFloat(data.quantidade || 0);
      
      const produtoTexto = produto.length > 80 ? produto.substring(0, 80) + '...' : produto;
      
      doc.text(sku, colSKU, yPos + 4);
      doc.text(produtoTexto, colProduto, yPos + 4);
      doc.text(unidade, colUMD, yPos + 4);
      doc.text(quantidade, colQuantidade, yPos + 4);
      doc.text('', colStatus, yPos + 4);
      doc.text('', colObs, yPos + 4);
      
      doc.rect(tableLeft, yPos, tableWidth, 7, 'D');
      yPos += 7;
    }

    // Linha Total Geral
    doc.setFillColor(240, 240, 240);
    doc.rect(tableLeft, yPos, tableWidth, 7, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.text('Total Geral', colSKU, yPos + 4);
    doc.text(totalQuantidade.toFixed(0), colQuantidade, yPos + 4);

    // Adicionar numeração por página para este documento (1/N) abaixo da emissão
    try {
      const totalPages = doc.getNumberOfPages();
      const pageWidthLocal = doc.internal.pageSize.getWidth();
      const marginLocal = 10;
      const contentWidthLocal = pageWidthLocal - marginLocal * 2;
      const rightEdgeLocal = marginLocal + contentWidthLocal;
      const pageNumY = 22;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.text(`${p}/${totalPages}`, rightEdgeLocal, pageNumY, { align: 'right' });
      }
    } catch (err) {
      // ignore small errors
    }

    pdfs.push(doc);
  }

  return pdfs;
};
