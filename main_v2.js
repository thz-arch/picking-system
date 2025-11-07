/**
 * Picking System v2.0 - Main Application
 * Sistema completo de picking com melhorias
 */

// Inicialização
let pickingManager;
let filialSelecionada = null;
const API_URL = 'https://tritton.dev.br/webhook/picking-process';
const API_LOCAL = window.location.origin;

document.addEventListener('DOMContentLoaded', () => {
  Utils.Logger.info('🚀 Picking System v2.0 iniciado');
  
  // Inicializa o gerenciador
  pickingManager = new PickingManager();
  
  // Elementos do DOM
  const telaFiliais = document.getElementById('telaFiliais');
  const telaCtrcList = document.getElementById('telaCtrcList');
  const telaSeparacao = document.getElementById('telaSeparacao');
  const telaHistorico = document.getElementById('telaHistorico');
  const btnVoltar = document.getElementById('btnVoltar');
  const btnVoltarHistorico = document.getElementById('btnVoltarHistorico');
  const btnVoltarFiliais = document.getElementById('btnVoltarFiliais');
  const listaFiliaisEl = document.getElementById('listaFiliais');
  const filialAtualEl = document.getElementById('filialAtual');
  const listaCtrcsEl = document.getElementById('listaCtrcs');
  const resultadoEl = document.getElementById('resultado');
  const dadosCtrcEl = document.getElementById('dadosCtrc');
  const btnFinalizarPicking = document.getElementById('btnFinalizarPicking');
  const bipInputGlobal = document.getElementById('inputBipagemGlobal');
  
  // ========== CALLBACKS DO PICKING MANAGER ==========
  
  pickingManager.on('onUpdate', (estado) => {
    atualizarInterface(estado);
  });
  
  pickingManager.on('onItemBipado', (dados) => {
    const { item, incremento } = dados;
    UIComponents.atualizarLinhaTabela(item);
    
    let mensagem = `✓ ${item.produto}`;
    if (incremento > 1) {
      mensagem += ` (${incremento} unidades)`;
    }
    
    UIComponents.showSuccess(mensagem, 2000);
    verificarFinalizacao();
  });
  
  pickingManager.on('onErro', (dados) => {
    const { tipo, mensagem, item } = dados;
    
    if (tipo === 'QUANTIDADE_EXCEDIDA') {
      UIComponents.showWarning(mensagem, 3000);
    } else {
      UIComponents.showError(mensagem, 3000);
    }
  });
  
  pickingManager.on('onFinalizacao', (picking) => {
    UIComponents.showSuccess('Picking finalizado com sucesso!', 3000);
  });
  
  // ========== NAVEGAÇÃO ==========
  
  function mostrarTelaFiliais() {
    telaFiliais.style.display = 'block';
    telaCtrcList.style.display = 'none';
    telaSeparacao.style.display = 'none';
    telaHistorico.style.display = 'none';
    filialSelecionada = null;
    localStorage.removeItem('filial_selecionada');
    sessionStorage.setItem('tela_atual', 'filiais'); // Marca tela
  }
  
  function mostrarTelaCtrcList() {
    telaFiliais.style.display = 'none';
    telaCtrcList.style.display = 'block';
    telaSeparacao.style.display = 'none';
    telaHistorico.style.display = 'none';
    sessionStorage.setItem('tela_atual', 'ctrcs'); // Marca tela
    
    // Recoloca readonly IMEDIATAMENTE ao sair da tela de separação
    const input = document.getElementById('inputBipagemGlobal');
    if (input) {
      input.setAttribute('readonly', 'readonly');
      input.blur();
    }
    
    // Atualiza badge da filial
    if (filialSelecionada) {
      filialAtualEl.innerHTML = `${filialSelecionada.sigla} - ${filialSelecionada.nome}`;
      filialAtualEl.style.setProperty('--cor-filial', filialSelecionada.cor);
      filialAtualEl.style.setProperty('--cor-filial-dark', ajustarCor(filialSelecionada.cor, -20));
    }
  }
  
  function mostrarTelaSeparacao() {
    telaFiliais.style.display = 'none';
    telaCtrcList.style.display = 'none';
    telaSeparacao.style.display = 'block';
    telaHistorico.style.display = 'none';
    sessionStorage.setItem('tela_atual', 'separacao'); // Marca qual tela está ativa
    
    // Com nova abordagem, não precisa focar - captura acontece no document
    focarBipador(); // Apenas limpa o buffer
  }
  
  function mostrarTelaHistorico() {
    telaFiliais.style.display = 'none';
    telaCtrcList.style.display = 'none';
    telaSeparacao.style.display = 'none';
    telaHistorico.style.display = 'block';
    sessionStorage.setItem('tela_atual', 'historico'); // Marca tela
    
    // Recoloca readonly IMEDIATAMENTE ao sair da tela de separação
    const input = document.getElementById('inputBipagemGlobal');
    if (input) {
      input.setAttribute('readonly', 'readonly');
      input.blur();
    }
    
    renderizarHistorico();
  }
  
  // ========== GERENCIAMENTO DE FILIAIS ==========
  
  async function carregarFiliais() {
    try {
      UIComponents.showLoading('Carregando filiais...');
      
      const response = await fetch(`${API_LOCAL}/api/filiais`);
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const filiais = await response.json();
      renderizarFiliais(filiais);
      
      // Verifica se há filial já selecionada
      const filialSalva = localStorage.getItem('filial_selecionada');
      if (filialSalva) {
        try {
          filialSelecionada = JSON.parse(filialSalva);
          mostrarTelaCtrcList();
          listarCtrcs();
        } catch (e) {
          Utils.Logger.erro('Erro ao recuperar filial salva', e);
        }
      }
      
    } catch (err) {
      Utils.Logger.erro('Erro ao carregar filiais', err);
      UIComponents.showError('Erro ao carregar lista de filiais');
      listaFiliaisEl.innerHTML = '<div class="p-md text-center">Erro ao carregar filiais</div>';
    } finally {
      UIComponents.hideLoading();
    }
  }
  
  function renderizarFiliais(filiais) {
    Utils.limparElemento(listaFiliaisEl);
    
    if (!Array.isArray(filiais) || filiais.length === 0) {
      listaFiliaisEl.innerHTML = '<div class="p-md text-center">Nenhuma filial disponível</div>';
      return;
    }
    
    filiais.forEach(filial => {
      const card = Utils.criarElemento('button', {
        className: 'filial-card',
        onClick: () => selecionarFilial(filial)
      });
      
      // Define cores customizadas
      card.style.setProperty('--cor-filial', filial.cor);
      card.style.setProperty('--cor-filial-dark', ajustarCor(filial.cor, -20));
      
      const sigla = Utils.criarElemento('div', {
        className: 'filial-sigla'
      }, filial.sigla);
      
      const nome = Utils.criarElemento('div', {
        className: 'filial-nome'
      }, filial.nome);
      
      card.appendChild(sigla);
      card.appendChild(nome);
      listaFiliaisEl.appendChild(card);
    });
  }
  
  function selecionarFilial(filial) {
    filialSelecionada = filial;
    localStorage.setItem('filial_selecionada', JSON.stringify(filial));
    
    Utils.Logger.info(`Filial selecionada: ${filial.sigla} - ${filial.nome}`);
    UIComponents.showSuccess(`Filial ${filial.sigla} selecionada`, 1500);
    
    setTimeout(() => {
      mostrarTelaCtrcList();
      listarCtrcs();
    }, 500);
  }
  
  function ajustarCor(hex, percent) {
    // Remove o # se presente
    hex = hex.replace('#', '');
    
    // Converte para RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Ajusta o brilho
    const ajustar = (val) => {
      const novo = val + (val * percent / 100);
      return Math.max(0, Math.min(255, Math.round(novo)));
    };
    
    // Converte de volta para hex
    const toHex = (val) => {
      const hex = val.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(ajustar(r))}${toHex(ajustar(g))}${toHex(ajustar(b))}`;
  }
  
  // ========== LISTAGEM DE CTRCs ==========
  
  async function listarCtrcs() {
    if (!filialSelecionada) {
      Utils.Logger.erro('Nenhuma filial selecionada');
      UIComponents.showError('Selecione uma filial primeiro');
      mostrarTelaFiliais();
      return;
    }
    
    try {
      UIComponents.showLoading(`Carregando CTRCs da filial ${filialSelecionada.sigla}...`);
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          acao: 'listar_ctrcs',
          filial: filialSelecionada.sigla
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      renderizarListaCtrcs(data);
      
    } catch (err) {
      Utils.Logger.erro('Erro ao listar CTRCs', err);
      UIComponents.showError('Erro ao carregar lista de CTRCs');
      listaCtrcsEl.innerHTML = '<li class="p-md text-center">Erro ao carregar CTRCs</li>';
    } finally {
      UIComponents.hideLoading();
    }
  }
  
  function renderizarListaCtrcs(data) {
    Utils.limparElemento(listaCtrcsEl);
    
    // Verifica se há histórico disponível
    const temHistorico = pickingManager && 
                         pickingManager.historicoPickings && 
                         Array.isArray(pickingManager.historicoPickings) && 
                         pickingManager.historicoPickings.length > 0;
    
    if (!Array.isArray(data) || data.length === 0) {
      const mensagem = filialSelecionada 
        ? `Nenhum CTRC disponível para a filial ${filialSelecionada.sigla}`
        : 'Nenhum CTRC disponível';
      listaCtrcsEl.innerHTML = `<li class="p-md text-center">${mensagem}</li>`;
      
      // Adiciona botão de histórico mesmo sem CTRCs ativos
      if (temHistorico) {
        adicionarBotaoHistorico();
      }
      return;
    }
    
    // Filtra CTRCs pela filial selecionada (garantia extra)
    const ctrcsFiltrados = data.filter(row => {
      const filialCtrc = (row.filial || '').toUpperCase();
      return filialCtrc === filialSelecionada.sigla;
    });
    
    if (ctrcsFiltrados.length === 0) {
      listaCtrcsEl.innerHTML = `<li class="p-md text-center">Nenhum CTRC disponível para a filial ${filialSelecionada.sigla}</li>`;
      
      // Adiciona botão de histórico mesmo sem CTRCs ativos
      if (temHistorico) {
        adicionarBotaoHistorico();
      }
      return;
    }
    
    ctrcsFiltrados.forEach(row => {
      const li = Utils.criarElemento('li', { className: 'ctrc-item' });
      
      const ctrcNumero = row.ctrc || row.CTRC || '';
      const conferente = row.conferente || '';
      
      const btn = Utils.criarElemento('button', {
        className: 'select-ctrc-btn',
        onClick: () => selecionarCtrc(ctrcNumero, conferente)
      });
      
      const divCtrc = Utils.criarElemento('div', {
        className: 'ctrc-numero'
      }, ctrcNumero);
      btn.appendChild(divCtrc);
      
      if (conferente) {
        const divConferente = Utils.criarElemento('div', {
          className: 'conferente'
        }, `👤 ${conferente}`);
        btn.appendChild(divConferente);
      }
      
      li.appendChild(btn);
      listaCtrcsEl.appendChild(li);
    });
    
    // Adiciona botão de histórico
    adicionarBotaoHistorico();
  }
  
  // Função auxiliar para adicionar botão de histórico
  function adicionarBotaoHistorico() {
    // Verifica se há histórico disponível
    const temHistorico = pickingManager && 
                         pickingManager.historicoPickings && 
                         Array.isArray(pickingManager.historicoPickings) && 
                         pickingManager.historicoPickings.length > 0;
    
    if (!temHistorico) return;
    
    const liHistorico = Utils.criarElemento('li', { className: 'ctrc-item mt-md' });
    const btnHistorico = Utils.criarElemento('button', {
      className: 'select-ctrc-btn',
      style: { 
        background: 'linear-gradient(135deg, #757575 0%, #424242 100%)'
      },
      onClick: mostrarTelaHistorico
    });
    
    const divHistorico = Utils.criarElemento('div', {
      className: 'ctrc-numero'
    }, 'Ver Histórico de Pickings');
    btnHistorico.appendChild(divHistorico);
    liHistorico.appendChild(btnHistorico);
    listaCtrcsEl.appendChild(liHistorico);
  }
  
  // ========== SELEÇÃO DE CTRC ==========
  
  async function selecionarCtrc(ctrc, conferente = '') {
    try {
      // Verifica se há progresso salvo para este CTRC
      const progressoSalvo = Utils.carregarLocal('picking_progress_v2');
      
      if (progressoSalvo && progressoSalvo.ctrc && progressoSalvo.ctrc.ctrc === ctrc) {
        // Há progresso salvo, pergunta se quer restaurar
        const restaurar = await UIComponents.showConfirm(
          'Você tem progresso salvo neste CTRC.\n\n' +
          'Deseja continuar de onde parou?',
          'Restaurar Progresso?'
        );
        
        if (restaurar) {
          // Restaura o progresso
          const sucesso = pickingManager.carregarProgresso();
          
          if (sucesso) {
            UIComponents.showSuccess('Progresso restaurado!', 2000);
            
            // Restaura a filial
            const filial = pickingManager.ctrcAtual.filial || 
                           progressoSalvo.ctrc.filial || 
                           'SPO';
            filialSelecionada = { sigla: filial };
            
            mostrarTelaSeparacao();
            renderizarTelaSeparacao();
            return;
          } else {
            UIComponents.showWarning('Não foi possível restaurar. Carregando novo...', 2000);
          }
        }
        // Se não quis restaurar, continua para carregar novo (mantém progresso salvo)
      }
      
      // Carrega novo CTRC
      UIComponents.showLoading('Carregando itens...');
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'buscar_ctrc', ctrc })
      });
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Processa dados do webhook
      let dadosCtrc;
      
      if (Array.isArray(data) && data.length > 0) {
        if (data[0].ctrc && data[0].itens) {
          // Formato esperado
          dadosCtrc = data[0];
        } else if (data[0].ean || data[0].codigo) {
          // Array de itens sem wrapper
          dadosCtrc = {
            ctrc: ctrc,
            remetente: '',
            destinatario: '',
            cidade: '',
            prev_entrega: '',
            status: 'Em Separação',
            itens: data
          };
        }
      }
      
      if (!dadosCtrc) {
        throw new Error('Formato de dados inválido');
      }
      
      // Adiciona o conferente e filial aos dados do CTRC
      dadosCtrc.conferente = conferente;
      dadosCtrc.filial = filialSelecionada ? filialSelecionada.sigla : '';
      
      // Carrega no manager
      if (pickingManager.carregarCTRC(dadosCtrc)) {
        mostrarTelaSeparacao();
        renderizarTelaSeparacao();
      } else {
        throw new Error('Erro ao carregar CTRC');
      }
      
    } catch (err) {
      Utils.Logger.erro('Erro ao selecionar CTRC', err);
      UIComponents.showError('Erro ao carregar itens do CTRC');
    } finally {
      UIComponents.hideLoading();
    }
  }
  
  // ========== RENDERIZAÇÃO DA TELA DE SEPARAÇÃO ==========
  
  function renderizarTelaSeparacao() {
    const estado = pickingManager.getEstado();
    
    // Dados do CTRC
    dadosCtrcEl.innerHTML = `
      <strong>CTRC:</strong> ${estado.ctrc.ctrc}<br>
      <strong>Remetente:</strong> ${estado.ctrc.remetente || 'N/A'}<br>
      <strong>Destinatário:</strong> ${estado.ctrc.destinatario || 'N/A'}<br>
      <strong>Cidade:</strong> ${estado.ctrc.cidade || 'N/A'}<br>
      <strong>Previsão de Entrega:</strong> ${estado.ctrc.prev_entrega || 'N/A'}<br>
      <strong>Status:</strong> ${estado.ctrc.status}<br>
      <strong>Totais:</strong> ${estado.totais.linhas} linhas | 
        ${estado.totais.quantidade_total} unidades | 
        Bipadas: ${estado.totais.qtd_bipada_total} | 
        Restantes: ${estado.totais.qtd_restante_total}
    `;
    
    // Tabela de itens (busca removida - interferia com bipagem)
    Utils.limparElemento(resultadoEl);
    const tabela = UIComponents.renderizarTabela(estado.itens);
    resultadoEl.appendChild(tabela);
    
    // Verifica se pode finalizar
    verificarFinalizacao();
    
    // Configura bipador
    configurarBipador();
  }
  
  function atualizarInterface(estado) {
    // Atualiza totais
    dadosCtrcEl.innerHTML = `
      <strong>CTRC:</strong> ${estado.ctrc.ctrc}<br>
      <strong>Remetente:</strong> ${estado.ctrc.remetente || 'N/A'}<br>
      <strong>Destinatário:</strong> ${estado.ctrc.destinatario || 'N/A'}<br>
      <strong>Cidade:</strong> ${estado.ctrc.cidade || 'N/A'}<br>
      <strong>Previsão de Entrega:</strong> ${estado.ctrc.prev_entrega || 'N/A'}<br>
      <strong>Status:</strong> ${estado.ctrc.status}<br>
      <strong>Totais:</strong> ${estado.totais.linhas} linhas | 
        ${estado.totais.quantidade_total} unidades | 
        Bipadas: ${estado.totais.qtd_bipada_total} | 
        Restantes: ${estado.totais.qtd_restante_total}
    `;
  }
  
  // ========== BIPADOR ==========
  
  let scanBuffer = '';
  let scanTimer = null;
  const SCAN_TIMEOUT = 100;
  
  // Função para mostrar logs na tela
  function addDebugLog(msg) {
    const debugDiv = document.getElementById('debugLog');
    if (debugDiv) {
      const time = new Date().toLocaleTimeString();
      debugDiv.innerHTML += `${time} - ${msg}<br>`;
      debugDiv.scrollTop = debugDiv.scrollHeight;
      // Limita a 20 linhas
      const lines = debugDiv.innerHTML.split('<br>');
      if (lines.length > 20) {
        debugDiv.innerHTML = lines.slice(-20).join('<br>');
      }
    }
    console.log(msg);
  }
  
  function configurarBipador() {
    const input = document.getElementById('inputBipagemGlobal');
    
    addDebugLog('[INIT] Configurando bipador...');
    
    // Bloqueia colar
    input.addEventListener('paste', (e) => {
      e.preventDefault();
      UIComponents.showWarning('Colar não permitido. Use o leitor de código de barras.');
      return false;
    });
    
    // TESTE: Captura AMBOS - document E input
    // Logs vão mostrar qual funciona
    
    // Captura no document (tenta sem focus)
    document.addEventListener('keydown', (ev) => {
      addDebugLog(`[DOC] key=${ev.key} target=${ev.target.tagName}`);
    });
    
    // Captura no input (método original que funcionava)
    input.addEventListener('input', (ev) => {
      const chunk = ev.data || input.value;
      addDebugLog(`[INPUT] chunk="${chunk}" value="${input.value}"`);
      
      // Só processa se estiver na tela de separação
      if (telaSeparacao.style.display === 'none') return;
      if (document.querySelector('.modal-backdrop')) return;
      
      if (!chunk) return;
      
      scanBuffer += String(chunk);
      clearTimeout(scanTimer);
      
      scanTimer = setTimeout(() => {
        const val = scanBuffer.trim();
        addDebugLog(`[INPUT] Buffer completo: "${val}"`);
        if (val.length > 0) {
          processBipagem(val);
        }
        scanBuffer = '';
        input.value = '';
      }, SCAN_TIMEOUT);
    });
    
    // Enter para confirmar
    input.addEventListener('keydown', (ev) => {
      addDebugLog(`[INPUT-KEY] key=${ev.key} value="${input.value}"`);
      
      if (telaSeparacao.style.display === 'none') return;
      if (document.querySelector('.modal-backdrop')) return;
      
      if (ev.key === 'Enter') {
        ev.preventDefault();
        clearTimeout(scanTimer);
        const val = (scanBuffer.trim() || input.value.trim());
        addDebugLog(`[INPUT-KEY] Enter! valor="${val}"`);
        if (val.length > 0) {
          processBipagem(val);
        }
        scanBuffer = '';
        input.value = '';
      }
    });
    
    // Captura eventos genéricos para scanners diferentes
    document.addEventListener('keypress', (ev) => {
      if (telaSeparacao.style.display === 'none') return;
      if (document.querySelector('.modal-backdrop')) return;

      const char = ev.key;
      addDebugLog(`[GENERIC] keypress char="${char}"`);

      if (char === 'Enter') {
        clearTimeout(scanTimer);
        const val = scanBuffer.trim();
        addDebugLog(`[GENERIC] Enter! valor="${val}"`);
        if (val.length > 0) {
          processBipagem(val);
        }
        scanBuffer = '';
        return;
      }

      scanBuffer += char;
      clearTimeout(scanTimer);
      scanTimer = setTimeout(() => {
        const val = scanBuffer.trim();
        addDebugLog(`[GENERIC] Buffer timeout completo: "${val}"`);
        if (val.length > 0) {
          processBipagem(val);
        }
        scanBuffer = '';
      }, SCAN_TIMEOUT);
    });
    
    // IMPORTANTE: Precisa focar o input para receber eventos
    setTimeout(() => {
      input.removeAttribute('readonly');
      input.focus();
      addDebugLog(`[INIT] Input focado. Ativo: ${document.activeElement.id}`);
    }, 100);
  }
  
  function configurarFocoAutomatico(input) {
    // DESATIVADA - estava causando loops de focus indesejados
    // O focarBipador() agora gerencia todo o focus
    return;
    
    // Retorna foco quando perde
    input.addEventListener('blur', () => {
      // Não retorna foco se há modal aberto
      if (telaSeparacao.style.display !== 'none' && !document.querySelector('.modal-backdrop')) {
        setTimeout(() => input.focus(), 10);
      }
    });
    
    // Retorna foco ao clicar na tela
    document.addEventListener('click', (e) => {
      if (telaSeparacao.style.display !== 'none') {
        const isModal = e.target.closest('.modal-backdrop');
        const isButton = e.target.tagName === 'BUTTON';
        const isInput = e.target.tagName === 'INPUT';
        
        // Não foca se clicou em modal, botão ou input
        if (!isModal && !isButton && !isInput) {
          input.focus();
        }
      }
    });
  }
  
  function focarBipador() {
    // Com a nova abordagem de captura no document, não precisa mais focar
    console.log('[FOCO] Nova abordagem - captura no document, sem focus no input');
    // Apenas limpa o buffer para garantir estado limpo
    scanBuffer = '';
  }
  
  // ========== PROCESSAMENTO DE BIPAGEM ==========
  
  async function processBipagem(ean) {
    try {
      // Ignora se há modal aberto
      if (document.querySelector('.modal-backdrop')) {
        Utils.Logger.info('Bipagem ignorada - modal aberto', { ean });
        return;
      }
      
      Utils.Logger.info('Processando bipagem', { ean });
      
      const resultado = await pickingManager.biparItem(ean);
      
      if (resultado.sucesso) {
        // Bipagem bem-sucedida
        focarBipador();
        return;
      }
      
      // Item não encontrado
      if (!resultado.item) {
        UIComponents.showError('❌ Item não encontrado: ' + ean);
        focarBipador();
        return;
      }
      
      // Precisa confirmar unidades por caixa
      if (resultado.precisaConfirmarUnidades) {
        const item = resultado.item;
        
        // Verifica se já tem configuração salva
        if (pickingManager.unidadesPorCaixa[item.ean]) {
          item.unidadesPorCaixa = pickingManager.unidadesPorCaixa[item.ean];
          // Tenta novamente
          await processBipagem(ean);
          return;
        }
        
        // Pede confirmação
        const unidades = await UIComponents.showUnidadesPorCaixaModal(item);
        
        if (unidades) {
          await pickingManager.definirUnidadesPorCaixa(item, unidades);
          
          UIComponents.showSuccess(
            `Configurado: ${unidades} unidades por caixa para ${item.produto}`,
            3000
          );
          
          // Processa a bipagem novamente
          await processBipagem(ean);
          focarBipador(); // Refoca após processar
        } else {
          UIComponents.showWarning('Bipagem cancelada');
          focarBipador();
        }
        
        return;
      }
      
      // Quantidade excedida - pede confirmação
      if (resultado.erro === 'QUANTIDADE_EXCEDIDA') {
        UIComponents.showError('Quantidade máxima já atingida. Bipagem bloqueada.');
        Utils.Logger.warn('Tentativa de bipagem excedente bloqueada', { 
          ean, 
          item: resultado.item 
        });
        focarBipador();
        return;
      }
      
      // Outros erros já foram tratados pelo callback onErro
      focarBipador();
      
    } catch (err) {
      Utils.Logger.erro('Erro ao processar bipagem', err);
      UIComponents.showError('Erro ao processar bipagem');
      focarBipador();
    }
  }
  
  // ========== FINALIZAÇÃO ==========
  
  function verificarFinalizacao() {
    const estado = pickingManager.getEstado();
    const todosBipados = estado.itens.every(i => i.qtd_bipada >= i.quantidade);
    btnFinalizarPicking.disabled = !todosBipados;
  }
  
  btnFinalizarPicking.addEventListener('click', async () => {
    const confirmar = await UIComponents.showConfirm(
      'Deseja finalizar o picking e dar baixa em todos os itens?',
      'Finalizar Picking'
    );
    
    if (!confirmar) return;
    
    try {
      UIComponents.showLoading('Finalizando picking...');
      
      const resultado = await pickingManager.finalizarPicking();
      
      if (!resultado.sucesso) {
        if (resultado.erro === 'ITENS_PENDENTES') {
          UIComponents.showWarning('Ainda há itens pendentes de bipagem');
        } else {
          throw new Error('Erro ao finalizar picking');
        }
        return;
      }
      
      // Envia para o servidor
      const payload = {
        acao: 'dar_baixa',
        ctrc: resultado.picking.ctrc,
        itens: resultado.picking.itens.map(i => ({
          codigo: i.codigo,
          ean: i.ean,
          qtd: i.qtd_bipada,
          status: i.status
        }))
      };
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      UIComponents.showSuccess('Picking finalizado e registrado com sucesso!', 3000);
      
      // Volta para lista de CTRCs
      setTimeout(() => {
        mostrarTelaCtrcList();
        listarCtrcs();
      }, 1500);
      
    } catch (err) {
      Utils.Logger.erro('Erro ao finalizar picking', err);
      UIComponents.showError('Erro ao finalizar picking. Tente novamente.');
    } finally {
      UIComponents.hideLoading();
    }
  });
  
  // ========== BOTÃO VOLTAR ==========
  
  btnVoltar.addEventListener('click', () => {
    // O progresso permanece salvo no localStorage
    // A flag de separação é removida em mostrarTelaCtrcList()
    mostrarTelaCtrcList();
  });
  
  btnVoltarHistorico.addEventListener('click', () => {
    mostrarTelaCtrcList();
  });
  
  // ========== HISTÓRICO ==========
  
  function renderizarHistorico() {
    const historicoContainer = document.getElementById('historicoContainer');
    const historico = pickingManager.getHistorico();
    
    Utils.limparElemento(historicoContainer);
    
    if (historico.length === 0) {
      historicoContainer.innerHTML = '<p class="text-center p-lg">Nenhum picking no histórico</p>';
      return;
    }
    
    historico.forEach(picking => {
      const item = Utils.criarElemento('div', { className: 'historico-item' });
      
      const header = Utils.criarElemento('div', { className: 'historico-header' });
      const ctrc = Utils.criarElemento('div', { className: 'historico-ctrc' }, 
        `CTRC: ${picking.ctrc}`
      );
      const data = Utils.criarElemento('div', { className: 'historico-data' }, 
        Utils.formatarData(picking.dataFim)
      );
      
      header.appendChild(ctrc);
      header.appendChild(data);
      
      const stats = Utils.criarElemento('div', { className: 'historico-stats' });
      
      const conferenteInfo = picking.conferente ? `<span>👤 ${picking.conferente}</span>` : '';
      stats.innerHTML = `
        ${conferenteInfo}
        <span>📦 ${picking.totais.linhas} itens</span>
        <span>✓ ${picking.totais.qtd_bipada_total} unidades</span>
      `;
      
      item.appendChild(header);
      item.appendChild(stats);
      
      historicoContainer.appendChild(item);
    });
  }
  
  btnVoltarHistorico.addEventListener('click', () => {
    mostrarTelaCtrcList();
  });
  
  btnVoltarFiliais.addEventListener('click', async () => {
    const confirmar = await UIComponents.showConfirm(
      'Deseja trocar de filial? A lista de CTRCs será recarregada.',
      'Trocar Filial'
    );
    
    if (confirmar) {
      mostrarTelaFiliais();
    }
  });
  
  // ========== INICIALIZAÇÃO ==========
  
  // Verifica qual tela estava ativa antes do reload
  const telaAtual = sessionStorage.getItem('tela_atual');
  const progressoSalvo = Utils.carregarLocal('picking_progress_v2');
  
  // Só restaura se estava na tela de separação E tem progresso salvo
  if (telaAtual === 'separacao' && progressoSalvo && progressoSalvo.ctrc) {
    try {
      const sucesso = pickingManager.carregarProgresso();
      
      if (sucesso && pickingManager.ctrcAtual) {
        const filial = pickingManager.ctrcAtual.filial || 
                       progressoSalvo.ctrc.filial || 
                       pickingManager.ctrcAtual.cidade ||
                       'SPO';
        
        filialSelecionada = { sigla: filial };
        mostrarTelaSeparacao();
        renderizarTelaSeparacao();
      } else {
        throw new Error('Falha ao restaurar');
      }
    } catch (err) {
      Utils.removerLocal('picking_progress_v2');
      sessionStorage.removeItem('tela_atual');
      carregarFiliais();
    }
  } else if (telaAtual === 'ctrcs' && filialSelecionada) {
    // Estava na lista de CTRCs, restaura essa tela
    mostrarTelaCtrcList();
    listarCtrcs();
  } else if (telaAtual === 'historico') {
    // Estava no histórico, restaura essa tela
    mostrarTelaHistorico();
  } else {
    // Qualquer outro caso, volta para filiais
    carregarFiliais();
  }
  
  Utils.Logger.info('✓ Sistema inicializado com sucesso');
});

// Desabilita o F12 para evitar acesso às ferramentas de desenvolvedor
document.addEventListener('keydown', (event) => {
  if (event.key === 'F12') {
    event.preventDefault();
    addDebugLog('F12 bloqueado.');
  }
});
// Removido código duplicado - o foco é gerenciado em ui-components.js