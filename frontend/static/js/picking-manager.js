/**
 * Picking Manager v2.0
 * Gerencia estado da aplicação e lógica de negócio
 */

class PickingManager {
  constructor() {
    this.ctrcAtual = null;
    this.itens = [];
    this.unidadesPorCaixa = {}; // Armazena quantas unidades vêm por caixa para produtos UN
    this.historicoPickings = [];
    this.callbacks = {
      onUpdate: [],
      onItemBipado: [],
      onFinalizacao: [],
      onErro: []
    };
    
    // Silencia avisos durante a inicialização (primeira vez não tem dados)
    const modoSilenciosoAnterior = Utils.Logger.silencioso;
    Utils.Logger.silencioso = true;
    
    this.carregarProgresso();
    this.carregarHistorico();
    this.carregarUnidadesPorCaixa();
    
    // Restaura modo de log
    Utils.Logger.silencioso = modoSilenciosoAnterior;
    
    Utils.Logger.info('PickingManager inicializado', {
      temProgresso: !!this.ctrcAtual,
      historicoTotal: this.historicoPickings.length,
      produtosConfigurados: Object.keys(this.unidadesPorCaixa).length
    });
  }
  
  // ========== GERENCIAMENTO DE CALLBACKS ==========
  
  on(evento, callback) {
    if (this.callbacks[evento]) {
      this.callbacks[evento].push(callback);
    }
  }
  
  emit(evento, dados) {
    if (this.callbacks[evento]) {
      this.callbacks[evento].forEach(cb => cb(dados));
    }
  }
  
  // ========== GERENCIAMENTO DE CTRC ==========
  
  carregarCTRC(dadosCtrc) {
    try {
      Utils.Logger.info('Carregando CTRC', { ctrc: dadosCtrc.ctrc });
      
      this.ctrcAtual = {
        ctrc: dadosCtrc.ctrc,
        filial: dadosCtrc.filial || '',
        remetente: dadosCtrc.remetente || '',
        destinatario: dadosCtrc.destinatario || '',
        cidade: dadosCtrc.cidade || '',
        prev_entrega: dadosCtrc.prev_entrega || '',
        status: dadosCtrc.status || 'Em Separação',
        conferente: dadosCtrc.conferente || '',
        dataInicio: new Date().toISOString()
      };
      
      this.itens = (dadosCtrc.itens || []).map(item => ({
        codigo: item.codigo || '',
        ean: item.ean || '',
        produto: item.produto || '',
        quantidade: parseInt(item.quantidade) || 0,
        qtd_bipada: parseInt(item.qtd_bipada) || 0,
        qtd_restante: parseInt(item.quantidade) - parseInt(item.qtd_bipada || 0),
        unid: item.unid || '',
        status: this.calcularStatusItem(parseInt(item.qtd_bipada) || 0, parseInt(item.quantidade) || 0),
        unidadesPorCaixa: null, // Será definido na primeira bipagem para itens UN
        ultimaBipagem: null
      }));
      
      this.salvarProgresso();
      this.emit('onUpdate', this.getEstado());
      
      return true;
    } catch (err) {
      Utils.Logger.erro('Erro ao carregar CTRC', err);
      this.emit('onErro', { mensagem: 'Erro ao carregar CTRC', erro: err });
      return false;
    }
  }
  
  getEstado() {
    return {
      ctrc: this.ctrcAtual,
      itens: this.itens,
      totais: this.calcularTotais(),
      progresso: this.calcularProgresso()
    };
  }
  
  calcularStatusItem(bipado, total) {
    if (bipado >= total) return 'Finalizado';
    if (bipado > 0) return 'Parcial';
    return 'Pendente';
  }
  
  calcularTotais() {
    return {
      linhas: this.itens.length,
      linhasFinalizadas: this.itens.filter(i => i.status === 'Finalizado').length,
      quantidade_total: this.itens.reduce((acc, i) => acc + i.quantidade, 0),
      qtd_bipada_total: this.itens.reduce((acc, i) => acc + i.qtd_bipada, 0),
      qtd_restante_total: this.itens.reduce((acc, i) => acc + i.qtd_restante, 0)
    };
  }
  
  calcularProgresso() {
    const totais = this.calcularTotais();
    return {
      porcentagemItens: totais.linhas > 0 ? totais.linhasFinalizadas / totais.linhas : 0,
      porcentagemQuantidade: totais.quantidade_total > 0 ? totais.qtd_bipada_total / totais.quantidade_total : 0
    };
  }
  
  // ========== BUSCA DE ITENS ==========
  
  encontrarItemPorEan(eanBipado) {
    Utils.Logger.info('Buscando item por EAN', { ean: eanBipado });
    Utils.Logger.info('EANs disponíveis na lista:', this.itens.map(i => ({ produto: i.produto, ean: i.ean })));
    
    // 1. Busca exata
    let item = this.itens.find(i => i.ean === eanBipado);
    if (item) {
      Utils.Logger.info('Item encontrado com EAN exato', { produto: item.produto });
      return item;
    }
    
    // 2. Busca com EAN processado (remove primeiro e último dígito)
    if (eanBipado.length > 13) {
      const eanProcessado = Utils.processarEanColetor(eanBipado);
      item = this.itens.find(i => i.ean === eanProcessado);
      if (item) {
        Utils.Logger.info('Item encontrado com EAN processado', { 
          eanOriginal: eanBipado, 
          eanProcessado, 
          produto: item.produto 
        });
        return item;
      }
    }
    
    // 3. Busca processando os EANs da lista
    item = this.itens.find(i => {
      if (i.ean.length > 13) {
        const eanListaProcessado = Utils.processarEanColetor(i.ean);
        return eanBipado === eanListaProcessado;
      }
      return false;
    });
    
    if (item) {
      Utils.Logger.info('Item encontrado processando EAN da lista', { produto: item.produto });
      return item;
    }
    
    // 4. Busca BIDIRECIONAL por inclusão (includes)
    // Verifica se um EAN contém o outro, independente de qual tenha dígitos extras
    item = this.itens.find(i => {
      const eanLista = i.ean;
      
      // Se ambos têm pelo menos 13 dígitos
      if (eanLista.length >= 13 && eanBipado.length >= 13) {
        // EAN da lista contido no bipado
        // Ex: Lista: 78911820018928, Bipado: 878911820018928
        if (eanBipado.includes(eanLista)) {
          return true;
        }
        
        // EAN bipado contido na lista
        // Ex: Lista: 878911820018928, Bipado: 78911820018928
        if (eanLista.includes(eanBipado)) {
          return true;
        }
      }
      
      return false;
    });
    
    if (item) {
      Utils.Logger.info('Item encontrado - busca bidirecional (includes)', { 
        eanLista: item.ean,
        eanBipado: eanBipado,
        listaNoBipado: eanBipado.includes(item.ean),
        bipadoNaLista: item.ean.includes(eanBipado),
        produto: item.produto 
      });
      return item;
    }
    
    // 5. Busca por NÚCLEO do EAN (compara parte central de 13 dígitos)
    // Funciona quando ambos têm dígitos extras diferentes nas pontas
    if (eanBipado.length >= 13) {
      item = this.itens.find(i => {
        if (i.ean.length >= 13) {
          // Extrai núcleo de 13 dígitos de ambos
          const nucleoLista = Utils.extrairNucleoEan(i.ean);
          const nucleoBipado = Utils.extrairNucleoEan(eanBipado);
          
          // Se conseguiu extrair núcleos válidos, compara
          if (nucleoLista && nucleoBipado) {
            // Compara os núcleos
            if (nucleoLista === nucleoBipado) {
              return true;
            }
            
            // Também testa se um núcleo contém o outro (para casos de tamanhos diferentes)
            if (nucleoLista.includes(nucleoBipado) || nucleoBipado.includes(nucleoLista)) {
              return true;
            }
          }
        }
        return false;
      });
      
      if (item) {
        Utils.Logger.info('Item encontrado - busca por núcleo do EAN', { 
          eanLista: item.ean,
          eanBipado: eanBipado,
          nucleoLista: Utils.extrairNucleoEan(item.ean),
          nucleoBipado: Utils.extrairNucleoEan(eanBipado),
          produto: item.produto 
        });
        return item;
      }
    }
    
    // 6. Busca por SUBSTRING COMUM (mínimo 12 dígitos consecutivos)
    // Encontra se há pelo menos 12 dígitos iguais consecutivos em ambos
    const TAMANHO_MINIMO_MATCH = 12;
    if (eanBipado.length >= TAMANHO_MINIMO_MATCH) {
      item = this.itens.find(i => {
        if (i.ean.length >= TAMANHO_MINIMO_MATCH) {
          // Procura por substrings comuns de tamanho decrescente (do maior ao menor)
          const tamanhoMax = Math.min(i.ean.length, eanBipado.length);
          
          for (let tamanho = tamanhoMax; tamanho >= TAMANHO_MINIMO_MATCH; tamanho--) {
            // Testa todas as posições possíveis no EAN da lista
            for (let posLista = 0; posLista <= i.ean.length - tamanho; posLista++) {
              const subLista = i.ean.substring(posLista, posLista + tamanho);
              
              // Verifica se essa substring existe no EAN bipado
              if (eanBipado.includes(subLista)) {
                return true;
              }
            }
          }
        }
        return false;
      });
      
      if (item) {
        // Encontra qual foi a substring que deu match para log
        let substringMatch = '';
        const tamanhoMax = Math.min(item.ean.length, eanBipado.length);
        for (let tamanho = tamanhoMax; tamanho >= TAMANHO_MINIMO_MATCH && !substringMatch; tamanho--) {
          for (let pos = 0; pos <= item.ean.length - tamanho && !substringMatch; pos++) {
            const sub = item.ean.substring(pos, pos + tamanho);
            if (eanBipado.includes(sub)) {
              substringMatch = sub;
            }
          }
        }
        
        Utils.Logger.info('Item encontrado - busca por substring comum', { 
          eanLista: item.ean,
          eanBipado: eanBipado,
          substringComum: substringMatch,
          tamanho: substringMatch.length,
          produto: item.produto 
        });
        return item;
      }
    }
    
    Utils.Logger.aviso('Item não encontrado', { ean: eanBipado });
    return null;
  }
  
  encontrarItemPorCodigo(codigo) {
    return this.itens.find(i => i.codigo === codigo);
  }
  
  // ========== BIPAGEM ==========
  
  async biparItem(eanBipado) {
    try {
      const item = this.encontrarItemPorEan(eanBipado);
      
      if (!item) {
        this.emit('onErro', { 
          tipo: 'EAN_NAO_ENCONTRADO',
          mensagem: `EAN não encontrado: ${eanBipado}`,
          ean: eanBipado
        });
        return { sucesso: false, erro: 'EAN_NAO_ENCONTRADO' };
      }
      
      // Verifica se é produto em UN e se precisa definir unidades por caixa
      if (item.unid.toUpperCase() === 'UN' && item.unidadesPorCaixa === null) {
        // Retorna informação de que precisa confirmar unidades por caixa
        return {
          sucesso: false,
          precisaConfirmarUnidades: true,
          item: item
        };
      }
      
      // Verifica se já atingiu a quantidade máxima
      if (item.qtd_bipada >= item.quantidade) {
        this.emit('onErro', {
          tipo: 'QUANTIDADE_EXCEDIDA',
          mensagem: `Quantidade máxima já atingida para ${item.produto}`,
          item: item
        });
        return { 
          sucesso: false, 
          erro: 'QUANTIDADE_EXCEDIDA',
          precisaConfirmacao: false,
          item: item
        };
      }
      
      // Calcula quantidade a incrementar
      let incremento = 1;
      if (item.unid.toUpperCase() === 'UN' && item.unidadesPorCaixa) {
        incremento = item.unidadesPorCaixa;
      }
      
      // Atualiza quantidade
      item.qtd_bipada += incremento;
      item.qtd_restante = Math.max(0, item.quantidade - item.qtd_bipada);
      item.status = this.calcularStatusItem(item.qtd_bipada, item.quantidade);
      item.ultimaBipagem = new Date().toISOString();
      
      Utils.Logger.info('Item bipado com sucesso', {
        produto: item.produto,
        qtd_bipada: item.qtd_bipada,
        incremento: incremento
      });
      
      this.salvarProgresso();
      this.emit('onItemBipado', { item, incremento });
      this.emit('onUpdate', this.getEstado());
      
      return { 
        sucesso: true, 
        item: item,
        incremento: incremento
      };
      
    } catch (err) {
      Utils.Logger.erro('Erro ao bipar item', err);
      this.emit('onErro', { mensagem: 'Erro ao bipar item', erro: err });
      return { sucesso: false, erro: 'ERRO_INTERNO' };
    }
  }
  
  async definirUnidadesPorCaixa(item, unidades) {
    try {
      const unidadesInt = parseInt(unidades);
      
      if (isNaN(unidadesInt) || unidadesInt <= 0) {
        return { sucesso: false, erro: 'UNIDADES_INVALIDAS' };
      }
      
      // Armazena nas configurações globais por EAN
      this.unidadesPorCaixa[item.ean] = unidadesInt;
      
      // Atualiza o item atual
      item.unidadesPorCaixa = unidadesInt;
      
      Utils.Logger.info('Unidades por caixa definidas', {
        ean: item.ean,
        produto: item.produto,
        unidades: unidadesInt
      });
      
      this.salvarUnidadesPorCaixa();
      
      return { sucesso: true, unidades: unidadesInt };
      
    } catch (err) {
      Utils.Logger.erro('Erro ao definir unidades por caixa', err);
      return { sucesso: false, erro: 'ERRO_INTERNO' };
    }
  }
  
  biparItemManual(item, quantidadeExtra = 1) {
    try {
      item.qtd_bipada += quantidadeExtra;
      item.qtd_restante = Math.max(0, item.quantidade - item.qtd_bipada);
      item.status = this.calcularStatusItem(item.qtd_bipada, item.quantidade);
      item.ultimaBipagem = new Date().toISOString();
      
      Utils.Logger.info('Bipagem manual', {
        produto: item.produto,
        quantidadeExtra
      });
      
      this.salvarProgresso();
      this.emit('onItemBipado', { item, manual: true });
      this.emit('onUpdate', this.getEstado());
      
      return { sucesso: true, item };
      
    } catch (err) {
      Utils.Logger.erro('Erro na bipagem manual', err);
      return { sucesso: false, erro: err };
    }
  }
  
  // ========== FINALIZAÇÃO ==========
  
  async finalizarPicking() {
    try {
      if (!this.ctrcAtual) {
        return { sucesso: false, erro: 'SEM_CTRC' };
      }
      
      const totais = this.calcularTotais();
      
      // Verifica se todos os itens foram bipados
      const todosBipados = this.itens.every(i => i.qtd_bipada >= i.quantidade);
      
      if (!todosBipados) {
        return {
          sucesso: false,
          erro: 'ITENS_PENDENTES',
          itensPendentes: this.itens.filter(i => i.qtd_bipada < i.quantidade)
        };
      }
      
      const picking = {
        ctrc: this.ctrcAtual.ctrc,
        conferente: this.ctrcAtual.conferente || '',
        dataInicio: this.ctrcAtual.dataInicio,
        dataFim: new Date().toISOString(),
        itens: this.itens.map(i => ({
          codigo: i.codigo,
          ean: i.ean,
          produto: i.produto,
          quantidade: i.quantidade,
          qtd_bipada: i.qtd_bipada,
          status: i.status
        })),
        totais: totais
      };
      
      // Adiciona ao histórico
      this.historicoPickings.unshift(picking);
      
      // Limita histórico a 50 itens
      if (this.historicoPickings.length > 50) {
        this.historicoPickings = this.historicoPickings.slice(0, 50);
      }
      
      this.salvarHistorico();
      
      Utils.Logger.info('Picking finalizado', { ctrc: picking.ctrc });
      
      this.emit('onFinalizacao', picking);
      
      // Limpa estado atual
      this.limparEstado();
      
      return { sucesso: true, picking };
      
    } catch (err) {
      Utils.Logger.erro('Erro ao finalizar picking', err);
      return { sucesso: false, erro: 'ERRO_INTERNO' };
    }
  }
  
  limparEstado() {
    this.ctrcAtual = null;
    this.itens = [];
    Utils.removerLocal('picking_progress_v2');
    sessionStorage.removeItem('tela_atual'); // Limpa marcador de tela
  }
  
  // ========== PERSISTÊNCIA ==========
  
  salvarProgresso() {
    if (!this.ctrcAtual) return;
    
    const estado = {
      ctrc: this.ctrcAtual,
      itens: this.itens,
      timestamp: new Date().toISOString()
    };
    
    Utils.salvarLocal('picking_progress_v2', estado);
  }
  
  carregarProgresso() {
    try {
      const estado = Utils.carregarLocal('picking_progress_v2');
      if (!estado || !estado.ctrc) return false;
      
      this.ctrcAtual = estado.ctrc;
      this.itens = Array.isArray(estado.itens) ? estado.itens : [];
      
      // Restaura unidadesPorCaixa para itens
      this.itens.forEach(item => {
        if (item.unid && item.unid.toUpperCase() === 'UN' && this.unidadesPorCaixa[item.ean]) {
          item.unidadesPorCaixa = this.unidadesPorCaixa[item.ean];
        }
      });
      
      return true;
    } catch (err) {
      this.ctrcAtual = null;
      this.itens = [];
      return false;
    }
  }
  
  salvarHistorico() {
    Utils.salvarLocal('picking_historico_v2', this.historicoPickings);
  }
  
  carregarHistorico() {
    try {
      const historico = Utils.carregarLocal('picking_historico_v2', []);
      this.historicoPickings = Array.isArray(historico) ? historico : [];
      
      if (this.historicoPickings.length > 0) {
        Utils.Logger.info('Histórico carregado', { total: this.historicoPickings.length });
      }
    } catch (err) {
      Utils.Logger.aviso('Erro ao carregar histórico, iniciando vazio', err);
      this.historicoPickings = [];
    }
  }
  
  salvarUnidadesPorCaixa() {
    try {
      Utils.salvarLocal('picking_unidades_caixa_v2', this.unidadesPorCaixa);
    } catch (err) {
      Utils.Logger.erro('Erro ao salvar unidades por caixa', err);
    }
  }
  
  carregarUnidadesPorCaixa() {
    try {
      const unidades = Utils.carregarLocal('picking_unidades_caixa_v2', {});
      this.unidadesPorCaixa = (typeof unidades === 'object' && unidades !== null) ? unidades : {};
      
      const total = Object.keys(this.unidadesPorCaixa).length;
      if (total > 0) {
        Utils.Logger.info('Unidades por caixa carregadas', { total });
      }
    } catch (err) {
      Utils.Logger.aviso('Erro ao carregar unidades por caixa, iniciando vazio', err);
      this.unidadesPorCaixa = {};
    }
  }
  
  getHistorico() {
    return this.historicoPickings;
  }
  
  getCtrcAtual() {
    return this.ctrcAtual;
  }
}

// Exporta globalmente
window.PickingManager = PickingManager;
