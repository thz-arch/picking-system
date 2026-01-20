/**
 * UI Components v2.0
 * Componentes de interface do usuário
 */

class UIComponents {
  // ========== LOADING ==========
  
  static showLoading(mensagem = 'Carregando...') {
    const existing = document.querySelector('.loading-overlay');
    if (existing) return;
    
    const overlay = Utils.criarElemento('div', { className: 'loading-overlay' });
    const container = Utils.criarElemento('div', { className: 'loading-content' });
    
    const spinner = Utils.criarElemento('div', { className: 'loading-spinner' });
    const text = Utils.criarElemento('div', { className: 'loading-text' }, mensagem);
    
    container.appendChild(spinner);
    container.appendChild(text);
    overlay.appendChild(container);
    document.body.appendChild(overlay);
  }
  
  static hideLoading() {
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) {
      overlay.remove();
    }
  }
  
  // ========== NOTIFICAÇÕES ==========
  
  static showNotification(mensagem, tipo = 'info', duracao = 3000) {
    const icons = {
      success: '✓',
      error: '✗',
      warning: '⚠',
      info: 'ℹ'
    };
    
    const notification = Utils.criarElemento('div', { 
      className: `notification ${tipo}` 
    });
    
    const icon = Utils.criarElemento('div', { className: 'notification-icon' }, icons[tipo] || 'ℹ');
    const message = Utils.criarElemento('div', { className: 'notification-message' }, mensagem);
    
    notification.appendChild(icon);
    notification.appendChild(message);
    document.body.appendChild(notification);
    
    // Toca som apropriado
    if (tipo === 'success') Utils.tocarSom('sucesso');
    if (tipo === 'error') Utils.tocarSom('erro');
    if (tipo === 'warning') Utils.tocarSom('alerta');
    
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translate(-50%, -40px)';
      setTimeout(() => notification.remove(), 300);
    }, duracao);
  }
  
  static showSuccess(mensagem, duracao) {
    this.showNotification(mensagem, 'success', duracao);
  }
  
  static showError(mensagem, duracao) {
    this.showNotification(mensagem, 'error', duracao);
  }
  
  static showWarning(mensagem, duracao) {
    this.showNotification(mensagem, 'warning', duracao);
  }
  
  static showInfo(mensagem, duracao) {
    this.showNotification(mensagem, 'info', duracao);
  }
  
  // ========== MODAIS ==========
  
  static async showModal(opcoes) {
    return new Promise((resolve) => {
      const backdrop = Utils.criarElemento('div', { className: 'modal-backdrop' });
      const modal = Utils.criarElemento('div', { className: 'modal' });
      
      // Header
      if (opcoes.titulo) {
        const header = Utils.criarElemento('div', { className: 'modal-header' }, opcoes.titulo);
        modal.appendChild(header);
      }
      
      // Body
      if (opcoes.mensagem) {
        const body = Utils.criarElemento('div', { className: 'modal-body' }, opcoes.mensagem);
        modal.appendChild(body);
      }
      
      // Custom content
      if (opcoes.conteudo instanceof HTMLElement) {
        const body = Utils.criarElemento('div', { className: 'modal-body' });
        body.appendChild(opcoes.conteudo);
        modal.appendChild(body);
      }
      
      // Footer com botões
      const footer = Utils.criarElemento('div', { className: 'modal-footer' });
      
      const botoes = opcoes.botoes || [
        { texto: 'Cancelar', classe: 'btn-secondary', valor: false },
        { texto: 'Confirmar', classe: 'btn-success', valor: true }
      ];
      
      botoes.forEach(botao => {
        const btn = Utils.criarElemento('button', {
          className: `btn ${botao.classe || ''}`,
          onClick: () => {
            const telaSeparacao = document.getElementById('telaSeparacao');
            const estaEmSeparacao = telaSeparacao && telaSeparacao.style.display !== 'none';
            
            backdrop.remove();
            resolve(botao.valor);
            
            // Se está na tela de separação, força o retorno do foco de forma mais agressiva
            if (estaEmSeparacao) {
              const forcarFoco = () => {
                const inputBipagem = document.getElementById('inputBipagemGlobal');
                if (inputBipagem) {
                  inputBipagem.removeAttribute('readonly');
                  inputBipagem.disabled = false;
                  inputBipagem.value = '';
                  inputBipagem.focus();
                  inputBipagem.click();
                  
                  // Verifica se o foco realmente foi aplicado
                  setTimeout(() => {
                    if (document.activeElement !== inputBipagem) {
                      inputBipagem.focus();
                    }
                  }, 50);
                }
              };
              
              // Executa imediatamente e mais algumas vezes com delays
              forcarFoco();
              setTimeout(forcarFoco, 100);
              setTimeout(forcarFoco, 200);
              setTimeout(forcarFoco, 300);
            }
          }
        }, botao.texto);
        
        footer.appendChild(btn);
      });
      
      modal.appendChild(footer);
      backdrop.appendChild(modal);
      document.body.appendChild(backdrop);
      
      // Fecha ao clicar fora
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop && opcoes.fecharAoClicarFora !== false) {
          const telaSeparacao = document.getElementById('telaSeparacao');
          const estaEmSeparacao = telaSeparacao && telaSeparacao.style.display !== 'none';
          
          backdrop.remove();
          resolve(false);
          
          // Se está na tela de separação, força o retorno do foco
          if (estaEmSeparacao) {
            const forcarFoco = () => {
              const inputBipagem = document.getElementById('inputBipagemGlobal');
              if (inputBipagem) {
                inputBipagem.removeAttribute('readonly');
                inputBipagem.disabled = false;
                inputBipagem.value = '';
                inputBipagem.focus();
                inputBipagem.click();
                
                setTimeout(() => {
                  if (document.activeElement !== inputBipagem) {
                    inputBipagem.focus();
                  }
                }, 50);
              }
            };
            
            forcarFoco();
            setTimeout(forcarFoco, 100);
            setTimeout(forcarFoco, 200);
            setTimeout(forcarFoco, 300);
          }
        }
      });
      
      // Foca no primeiro botão
      const primeiroBtn = footer.querySelector('button');
      if (primeiroBtn) primeiroBtn.focus();
    });
  }
  
  static async showConfirm(mensagem, titulo = 'Confirmação') {
    return await this.showModal({
      titulo,
      mensagem,
      botoes: [
        { texto: 'Não', classe: 'btn-secondary', valor: false },
        { texto: 'Sim', classe: 'btn-success', valor: true }
      ]
    });
  }
  
  static async showPrompt(mensagem, titulo = 'Digite', valorPadrao = '') {
    return new Promise((resolve) => {
      const input = Utils.criarElemento('input', {
        type: 'text',
        value: valorPadrao,
        style: { width: '100%', marginTop: '8px' }
      });
      
      const conteudo = Utils.criarElemento('div');
      const label = Utils.criarElemento('div', {}, mensagem);
      conteudo.appendChild(label);
      conteudo.appendChild(input);
      
      this.showModal({
        titulo,
        conteudo,
        botoes: [
          { texto: 'Cancelar', classe: 'btn-secondary', valor: null },
          { texto: 'OK', classe: 'btn-success', valor: 'ok' }
        ]
      }).then(result => {
        resolve(result === 'ok' ? input.value : null);
      });
      
      // Foca no input
      setTimeout(() => input.focus(), 100);
      
      // Enter para confirmar
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          document.querySelector('.modal-backdrop').remove();
          resolve(input.value);
        }
      });
    });
  }
  
  // ========== MODAL DE UNIDADES POR CAIXA ==========
  
  static async showUnidadesPorCaixaModal(item) {
    return new Promise((resolve) => {
      // Remove readonly do input de bipagem para permitir teclado virtual
      const inputBipagem = document.getElementById('inputBipagemGlobal');
      if (inputBipagem) {
        inputBipagem.removeAttribute('readonly');
        inputBipagem.disabled = true;
        inputBipagem.blur();
      }
      
      const conteudo = Utils.criarElemento('div');
      
      const mensagem = Utils.criarElemento('p', {}, 
        `Produto: ${item.produto}`
      );
      
      const pergunta = Utils.criarElemento('p', { 
        style: { marginTop: '12px', fontWeight: '600' } 
      }, 'Quantas unidades vêm nesta caixa?');
      
      const input = Utils.criarElemento('input', {
        type: 'number',
        min: '1',
        placeholder: 'Ex: 12',
        style: { width: '100%', marginTop: '8px', fontSize: '1.2em', textAlign: 'center' },
        id: 'inputUnidadesCaixa'
      });
      
      const info = Utils.criarElemento('p', {
        style: { marginTop: '8px', fontSize: '0.9em', color: '#757575' }
      }, 'Esta configuração será salva para próximas bipagens deste produto.');
      
      conteudo.appendChild(mensagem);
      conteudo.appendChild(pergunta);
      conteudo.appendChild(input);
      conteudo.appendChild(info);
      
      const finalizarModal = (valor) => {
        // Força o retorno do foco para o input de bipagem de forma agressiva
        const forcarFoco = () => {
          const inputBipagem = document.getElementById('inputBipagemGlobal');
          const telaSeparacao = document.getElementById('telaSeparacao');
          
          if (inputBipagem && telaSeparacao && telaSeparacao.style.display !== 'none') {
            inputBipagem.removeAttribute('readonly');
            inputBipagem.disabled = false;
            inputBipagem.value = '';
            inputBipagem.focus();
            inputBipagem.click();
            
            setTimeout(() => {
              if (document.activeElement !== inputBipagem) {
                inputBipagem.focus();
              }
            }, 50);
          }
        };
        
        forcarFoco();
        setTimeout(forcarFoco, 100);
        setTimeout(forcarFoco, 200);
        setTimeout(forcarFoco, 300);
        
        resolve(valor);
      };
      
      this.showModal({
        titulo: '📦 Configurar Unidades por Caixa',
        conteudo,
        botoes: [
          { texto: 'Cancelar', classe: 'btn-secondary', valor: null },
          { texto: 'Confirmar', classe: 'btn-success', valor: 'confirmar' }
        ],
        fecharAoClicarFora: false
      }).then(result => {
        const valor = parseInt(input.value);
        if (result === 'confirmar' && valor > 0) {
          finalizarModal(valor);
        } else {
          finalizarModal(null);
        }
      });
      
      // Foca no input do modal
      setTimeout(() => {
        input.focus();
        input.select();
      }, 150);
      
      // Enter para confirmar
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          
          if (input.value) {
            const valor = parseInt(input.value);
            if (valor > 0) {
              const backdrop = document.querySelector('.modal-backdrop');
              if (backdrop) backdrop.remove();
              finalizarModal(valor);
            }
          }
        }
      });
      
      // Mantém foco preso no input do modal
      input.addEventListener('blur', () => {
        setTimeout(() => {
          if (document.querySelector('.modal-backdrop')) {
            input.focus();
          }
        }, 10);
      });
    });
  }
  
  // ========== RENDERIZAÇÃO DE TABELA ==========
  
  static renderizarTabela(itens) {
    const table = Utils.criarElemento('table');
    
    // Header
    const thead = Utils.criarElemento('thead');
    const headerRow = Utils.criarElemento('tr');
    
    const colunas = [
      { titulo: 'Cód.', largura: '80px' },
      { titulo: 'EAN', largura: '140px' },
      { titulo: 'Qtd/Bip.', largura: '140px' },
      { titulo: 'Unid.', largura: '60px' },
      { titulo: 'Status', largura: '100px' },
      { titulo: 'Produto', largura: 'auto' }
    ];
    
    colunas.forEach(col => {
      const th = Utils.criarElemento('th', {
        style: { width: col.largura }
      }, col.titulo);
      headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Body
    const tbody = Utils.criarElemento('tbody');
    
    itens.forEach(item => {
      const row = Utils.criarElemento('tr', {
        className: item.status.toLowerCase(),
        'data-ean': item.ean
      });
      
      // Código
      const tdCodigo = Utils.criarElemento('td', {}, item.codigo || '');
      row.appendChild(tdCodigo);
      
      // EAN
      const tdEan = Utils.criarElemento('td', {}, item.ean || '');
      row.appendChild(tdEan);
      
      // Quantidade/Bipada com barra de progresso (estrutura vertical centralizada)
      const tdQtd = Utils.criarElemento('td', { className: 'qtdbip' });
      
      const containerQtd = Utils.criarElemento('div', { className: 'qtd-container' });
      
      const textoQtd = Utils.criarElemento('div', { className: 'qtd-text' }, 
        `${item.qtd_bipada}/${item.quantidade}`
      );
      
      const progressBar = Utils.criarElemento('div', { className: 'progress-bar' });
      const progressFill = Utils.criarElemento('div', { 
        className: 'progress-fill',
        style: {
          width: `${Math.round((item.qtd_bipada / item.quantidade) * 100)}%`
        }
      });
      progressBar.appendChild(progressFill);
      
      containerQtd.appendChild(textoQtd);
      containerQtd.appendChild(progressBar);
      tdQtd.appendChild(containerQtd);
      row.appendChild(tdQtd);
      
      // Unidade
      const tdUnid = Utils.criarElemento('td', { 
        style: { textAlign: 'center' }
      }, item.unid || '');
      row.appendChild(tdUnid);
      
      // Status
      const spanStatus = Utils.criarElemento('span', {
        className: `status-${item.status.toLowerCase()}`
      }, item.status);
      
      const tdStatus = Utils.criarElemento('td', {
        className: 'status-cell',
        style: { textAlign: 'center' }
      });
      tdStatus.appendChild(spanStatus);
      row.appendChild(tdStatus);
      
      // Produto
      const tdProduto = Utils.criarElemento('td', {}, item.produto || '');
      row.appendChild(tdProduto);
      
      tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    return table;
  }
  
  // ========== ATUALIZAR LINHA DA TABELA ==========
  
  static atualizarLinhaTabela(item) {
    const row = document.querySelector(`tr[data-ean="${item.ean}"]`);
    if (!row) return;
    
    // Atualiza classe de status
    row.className = item.status.toLowerCase();
    
    // Atualiza quantidade bipada (nova estrutura: qtd-text)
    const qtdText = row.querySelector('.qtd-text');
    if (qtdText) {
      qtdText.textContent = `${item.qtd_bipada}/${item.quantidade}`;
    }
    
    // Atualiza barra de progresso
    const progressFill = row.querySelector('.progress-fill');
    if (progressFill) {
      const porcentagem = Math.round((item.qtd_bipada / item.quantidade) * 100);
      progressFill.style.width = `${porcentagem}%`;
    }
    
    // Atualiza status
    const statusCell = row.querySelector('.status-cell');
    if (statusCell) {
      const spanStatus = statusCell.querySelector('span') || Utils.criarElemento('span');
      spanStatus.textContent = item.status;
      spanStatus.className = `status-${item.status.toLowerCase()}`;
      
      if (!statusCell.querySelector('span')) {
        statusCell.innerHTML = '';
        statusCell.appendChild(spanStatus);
      }
    }
    
    // Animação de feedback
    Utils.animarElemento(row, 'flash-success', 1000);
  }
  
  // ========== BUSCA/FILTRO ==========
  
  static criarCampoBusca(onSearch) {
    const container = Utils.criarElemento('div', { className: 'search-container' });
    
    const icon = Utils.criarElemento('span', { className: 'search-icon' }, '🔍');
    
    const input = Utils.criarElemento('input', {
      type: 'search',
      id: 'searchInput',
      placeholder: 'Buscar por código, EAN ou produto...'
    });
    
    const debouncedSearch = Utils.debounce((valor) => {
      onSearch(valor);
    }, 300);
    
    input.addEventListener('input', (e) => {
      debouncedSearch(e.target.value);
    });
    
    container.appendChild(icon);
    container.appendChild(input);
    
    return container;
  }
  
  static filtrarTabela(termo) {
    const rows = document.querySelectorAll('tbody tr');
    const termoLower = termo.toLowerCase();
    
    rows.forEach(row => {
      const texto = row.textContent.toLowerCase();
      if (texto.includes(termoLower)) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  }
}

window.UIComponents = UIComponents;
