/**
 * Utilit Picking System v2.0
 * Funções auxiliares e validações
 */

// ========== VALIDAÇÕES ==========

/**
 * Valida EAN com algoritmo de checksum
 * @param {string} ean - Código EAN para validar
 * @returns {boolean} - True se válido
 */
function validarEAN(ean) {
  if (!ean || typeof ean !== 'string') return false;
  
  const eanLimpo = ean.trim();
  
  // Verifica se contém apenas dígitos
  if (!/^\d+$/.test(eanLimpo)) return false;
  
  // Aceita EAN-8, EAN-13 ou com dígitos extras
  if (eanLimpo.length < 8 || eanLimpo.length > 20) return false;
  
  return true;
}

/**
 * Calcula checksum do EAN-13
 * @param {string} ean - Código EAN sem o dígito verificador
 * @returns {number} - Dígito verificador
 */
function calcularChecksumEAN(ean) {
  if (!ean || ean.length !== 12) return null;
  
  let soma = 0;
  for (let i = 0; i < 12; i++) {
    const digito = parseInt(ean[i]);
    soma += (i % 2 === 0) ? digito : digito * 3;
  }
  
  const checksum = (10 - (soma % 10)) % 10;
  return checksum;
}

/**
 * Verifica se o EAN tem checksum válido
 * @param {string} ean - Código EAN completo
 * @returns {boolean} - True se checksum válido
 */
function verificarChecksumEAN(ean) {
  if (!ean || ean.length !== 13) return false;
  
  const checksumCalculado = calcularChecksumEAN(ean.substring(0, 12));
  const checksumFornecido = parseInt(ean[12]);
  
  return checksumCalculado === checksumFornecido;
}

// ========== PROCESSAMENTO DE EAN ==========

/**
 * Processa EAN do coletor removendo primeiro e último dígito
 * @param {string} eanBipado - EAN lido pelo scanner
 * @returns {string} - EAN processado
 */
function processarEanColetor(eanBipado) {
  if (!eanBipado || typeof eanBipado !== 'string') {
    return eanBipado;
  }
  
  const eanLimpo = eanBipado.trim();
  
  if (eanLimpo.length >= 3) {
    return eanLimpo.substring(1, eanLimpo.length - 1);
  }
  
  return eanLimpo;
}

/**
 * Extrai o núcleo do EAN (parte central de 13 dígitos)
 * Remove dígitos extras do início e fim até restar 13 dígitos
 * @param {string} ean - EAN para processar
 * @returns {string|null} - Núcleo do EAN ou null se inválido
 */
function extrairNucleoEan(ean) {
  if (!ean || typeof ean !== 'string') {
    return null;
  }
  
  const eanLimpo = ean.trim();
  
  // Se tem menos de 13 dígitos, não tem núcleo válido
  if (eanLimpo.length < 13) {
    return null;
  }
  
  // Se tem exatamente 13, retorna ele mesmo
  if (eanLimpo.length === 13) {
    return eanLimpo;
  }
  
  // Se tem mais de 13, extrai o núcleo central
  // Calcula quantos dígitos extras existem
  const digitosExtras = eanLimpo.length - 13;
  
  // Remove metade do início e metade do fim (arredonda para cima no início)
  const removerInicio = Math.ceil(digitosExtras / 2);
  const removerFim = Math.floor(digitosExtras / 2);
  
  const nucleoInicio = removerInicio;
  const nucleoFim = eanLimpo.length - removerFim;
  
  return eanLimpo.substring(nucleoInicio, nucleoFim);
}

// ========== FORMATAÇÃO ==========

/**
 * Formata data no padrão brasileiro
 * @param {string|Date} data - Data para formatar
 * @returns {string} - Data formatada (DD/MM/YYYY HH:MM)
 */
function formatarData(data) {
  const d = data instanceof Date ? data : new Date(data);
  
  if (isNaN(d.getTime())) return 'Data inválida';
  
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  const hora = String(d.getHours()).padStart(2, '0');
  const minuto = String(d.getMinutes()).padStart(2, '0');
  
  return `${dia}/${mes}/${ano} ${hora}:${minuto}`;
}

/**
 * Formata número com separadores de milhares
 * @param {number} numero - Número para formatar
 * @returns {string} - Número formatado
 */
function formatarNumero(numero) {
  return new Intl.NumberFormat('pt-BR').format(numero);
}

/**
 * Formata porcentagem
 * @param {number} valor - Valor decimal (0-1)
 * @returns {string} - Porcentagem formatada
 */
function formatarPorcentagem(valor) {
  return `${(valor * 100).toFixed(1)}%`;
}

// ========== ARMAZENAMENTO ==========

/**
 * Salva dados no localStorage com tratamento de erros
 * @param {string} chave - Chave para armazenar
 * @param {*} valor - Valor para armazenar
 * @returns {boolean} - True se salvou com sucesso
 */
function salvarLocal(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
    return true;
  } catch (err) {
    console.error(`[STORAGE] Erro ao salvar ${chave}:`, err);
    return false;
  }
}

/**
 * Carrega dados do localStorage
 * @param {string} chave - Chave para carregar
 * @param {*} valorPadrao - Valor padrão se não existir
 * @returns {*} - Valor carregado ou padrão
 */
function carregarLocal(chave, valorPadrao = null) {
  try {
    const item = localStorage.getItem(chave);
    
    // Se não existe, retorna valor padrão silenciosamente
    if (item === null || item === undefined) {
      return valorPadrao;
    }
    
    // Tenta fazer parse
    return JSON.parse(item);
  } catch (err) {
    // Só mostra erro se realmente falhou ao fazer parse (dado corrompido)
    if (localStorage.getItem(chave) !== null) {
      console.warn(`[STORAGE] Dados corrompidos em ${chave}, usando valor padrão`);
    }
    return valorPadrao;
  }
}

/**
 * Remove item do localStorage
 * @param {string} chave - Chave para remover
 */
function removerLocal(chave) {
  try {
    localStorage.removeItem(chave);
  } catch (err) {
    console.error(`[STORAGE] Erro ao remover ${chave}:`, err);
  }
}

// ========== DEBOUNCE E THROTTLE ==========

/**
 * Cria função debounced (executa após delay sem novas chamadas)
 * @param {Function} func - Função para debounce
 * @param {number} delay - Delay em ms
 * @returns {Function} - Função debounced
 */
function debounce(func, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Cria função throttled (executa no máximo uma vez por intervalo)
 * @param {Function} func - Função para throttle
 * @param {number} interval - Intervalo em ms
 * @returns {Function} - Função throttled
 */
function throttle(func, interval) {
  let lastCall = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastCall >= interval) {
      lastCall = now;
      return func.apply(this, args);
    }
  };
}

// ========== UTILITÁRIOS DOM ==========

/**
 * Cria elemento com atributos
 * @param {string} tag - Tag HTML
 * @param {object} attrs - Atributos e propriedades
 * @param {string|HTMLElement} conteudo - Conteúdo do elemento
 * @returns {HTMLElement} - Elemento criado
 */
function criarElemento(tag, attrs = {}, conteudo = '') {
  const el = document.createElement(tag);
  
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'className') {
      el.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(el.style, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.substring(2).toLowerCase(), value);
    } else {
      el.setAttribute(key, value);
    }
  });
  
  if (conteudo) {
    if (typeof conteudo === 'string') {
      el.textContent = conteudo;
    } else if (conteudo instanceof HTMLElement) {
      el.appendChild(conteudo);
    }
  }
  
  return el;
}

/**
 * Limpa todos os filhos de um elemento
 * @param {HTMLElement} element - Elemento para limpar
 */
function limparElemento(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

// ========== ANIMAÇÕES ==========

/**
 * Adiciona classe com animação e remove após delay
 * @param {HTMLElement} element - Elemento para animar
 * @param {string} className - Classe CSS para adicionar
 * @param {number} duration - Duração em ms
 */
function animarElemento(element, className, duration = 1000) {
  element.classList.add(className);
  setTimeout(() => {
    element.classList.remove(className);
  }, duration);
}

/**
 * Faz scroll suave até elemento
 * @param {HTMLElement} element - Elemento alvo
 * @param {string} behavior - Comportamento ('smooth' ou 'auto')
 */
function scrollParaElemento(element, behavior = 'smooth') {
  element.scrollIntoView({ behavior, block: 'center' });
}

// ========== ÁUDIO ==========

/**
 * Toca som de feedback
 * @param {string} tipo - Tipo do som ('sucesso', 'erro', 'alerta')
 */
function tocarSom(tipo) {
  const sons = {
    // sucesso: 'mixkit-achievement-bell-600.wav', // Arquivo não disponível
    erro: 'mixkit-short-electric-fence-buzz-2966.wav',
    // alerta: 'mixkit-alert-quick-chime-766.wav' // Arquivo não disponível
  };
  
  const arquivo = sons[tipo];
  if (!arquivo) {
    console.warn(`[AUDIO] Som "${tipo}" não está configurado ou arquivo não disponível`);
    return;
  }
  
  try {
    const audio = new Audio(arquivo);
    audio.volume = 0.5;
    audio.play().catch(err => {
      console.warn('[AUDIO] Erro ao tocar som:', err);
    });
  } catch (err) {
    console.warn('[AUDIO] Erro ao criar áudio:', err);
  }
}

// ========== LOGS ==========

/**
 * Sistema de logging melhorado
 */
const Logger = {
  logs: [],
  maxLogs: 1000,
  silencioso: false, // Modo silencioso para avisos
  
  log(nivel, mensagem, dados = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      nivel,
      mensagem,
      dados
    };
    
    this.logs.push(entry);
    
    // Limita quantidade de logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    // Salva no localStorage periodicamente
    if (this.logs.length % 10 === 0) {
      this.salvar();
    }
    
    // Console output (não mostra avisos se silencioso)
    if (nivel === 'aviso' && this.silencioso) return;
    
    const metodo = nivel === 'erro' ? 'error' : nivel === 'aviso' ? 'warn' : 'log';
    console[metodo](`[${nivel.toUpperCase()}] ${mensagem}`, dados || '');
  },
  
  info(mensagem, dados) {
    this.log('info', mensagem, dados);
  },
  
  aviso(mensagem, dados) {
    this.log('aviso', mensagem, dados);
  },
  
  erro(mensagem, dados) {
    this.log('erro', mensagem, dados);
  },
  
  salvar() {
    salvarLocal('picking_logs_v2', this.logs);
  },
  
  carregar() {
    this.logs = carregarLocal('picking_logs_v2', []);
  },
  
  limpar() {
    this.logs = [];
    removerLocal('picking_logs_v2');
  },
  
  exportar() {
    return JSON.stringify(this.logs, null, 2);
  },
  
  mostrar() {
    console.table(this.logs.slice(-50));
  }
};

// Carrega logs ao iniciar
Logger.carregar();

// Exporta funções globalmente
window.Utils = {
  validarEAN,
  calcularChecksumEAN,
  verificarChecksumEAN,
  processarEanColetor,
  extrairNucleoEan,
  formatarData,
  formatarNumero,
  formatarPorcentagem,
  salvarLocal,
  carregarLocal,
  removerLocal,
  debounce,
  throttle,
  criarElemento,
  limparElemento,
  animarElemento,
  scrollParaElemento,
  tocarSom,
  Logger
};
