/**
 * Webhook Service
 * Handles communication with n8n webhook for CTRC data
 */

const WEBHOOK_URL = '/api/webhook/85228f5f-e727-4fbb-94ab-790654959eb3';

/**
 * Parse CTRC number (format: DCX078534-2)
 * @param {string} ctrcNumber - Full CTRC number
 * @returns {Object} - Parsed CTRC parts
 */
const parseCTRCNumber = (ctrcNumber) => {
  const match = ctrcNumber.match(/^([A-Z]+)(\d{6})-(\d)$/);
  if (!match) {
    throw new Error('Formato de CTRC inválido');
  }
  
  return {
    serie: match[1],      // DCX
    numero: match[2],     // 078534
    digito: match[3],     // 2
    numeroLimpo: parseInt(match[2], 10) // 78534 (sem zeros à esquerda)
  };
};

/**
 * Search CTRC in SSW system (Step 1)
 * @param {string} serie - CTRC series (e.g., DCX)
 * @param {string} numero - CTRC number (e.g., 078534)
 * @returns {Promise<Object>} - Search result with seq_ctrc
 */
const searchCTRC = async (serie, numero) => {
  const today = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(today.getMonth() - 6);
  
  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${year}${month}${day}`;
  };

  const formData = new URLSearchParams({
    'act': 'P1',
    't_ser_ctrc': serie,
    't_nro_ctrc': numero,
    't_data_ini': formatDate(sixMonthsAgo),
    't_data_fin': formatDate(today),
    'data_ini_inf': '30/12/99',
    'data_fin_inf': '30/12/99',
    'seq_ctrc': '0',
    'local': '',
    'FAMILIA': '',
    'dummy': Date.now().toString()
  });

  const response = await fetch(`${SSW_BASE_URL}${SSW_CTRC_ENDPOINT}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': '*/*',
    },
    body: formData.toString(),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Erro ao buscar CTRC: ${response.status}`);
  }

  const html = await response.text();
  
  // Extract seq_ctrc from HTML response
  const seqMatch = html.match(/seq_ctrc[="](\d+)/i);
  const familiaMatch = html.match(/FAMILIA[="]([A-Z]+)/i);
  const localMatch = html.match(/local[="]([A-Z])/i);
  
  if (!seqMatch) {
    throw new Error('CTRC não encontrado no sistema');
  }

  return {
    seq_ctrc: seqMatch[1],
    familia: familiaMatch ? familiaMatch[1] : 'BIN',
    local: localMatch ? localMatch[1] : 'Q',
    html: html
  };
};

/**
 * Get CTRC details (Step 2)
 * @param {Object} searchResult - Result from searchCTRC
 * @param {string} serie - CTRC series
 * @param {number} numeroLimpo - CTRC number without leading zeros
 * @returns {Promise<Object>} - CTRC details
 */
const getCTRCDetails = async (searchResult, serie, numeroLimpo) => {
  const today = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(today.getMonth() - 6);
  
  const formatDateBR = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  const formData = new URLSearchParams({
    'act': 'RELPROD',
    'aviso_resgate': '#aviso_resgate#',
    'g_ctrc_ser_ctrc': serie,
    'g_ctrc_nro_ctrc': numeroLimpo.toString(),
    'gw_nro_nf_ini': '0',
    'g_ctrc_nf_vol_ini': '0',
    'gw_ctrc_nr_sscc': '',
    'g_ctrc_nro_ctl_form': '0',
    'gw_ctrc_parc_nro_ctrc_parc': '0',
    'g_ctrc_c_chave_fis': '',
    'gw_gaiola_codigo': '0',
    'gw_pallet_codigo': '0',
    'local': searchResult.local,
    'data_ini_inf': formatDateBR(sixMonthsAgo),
    'data_fin_inf': formatDateBR(today),
    'seq_ctrc': searchResult.seq_ctrc,
    'FAMILIA': searchResult.familia,
    'web_body': '',
    'dummy': Date.now().toString()
  });

  const response = await fetch(`${SSW_BASE_URL}${SSW_CTRC_ENDPOINT}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': '*/*',
    },
    body: formData.toString(),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Erro ao obter detalhes do CTRC: ${response.status}`);
  }

  const html = await response.text();
  return parseSSWResponse(html, serie, numeroLimpo);
};

/**
 * Parse SSW HTML response to extract CTRC data
 * @param {string} html - HTML response
 * @param {string} serie - CTRC series
 * @param {number} numero - CTRC number
 * @returns {Object} - Parsed CTRC data
 */
const parseSSWResponse = (html, serie, numero) => {
  // Basic parsing - adjust based on actual HTML structure
  const data = {
    ctrc: `${serie}${String(numero).padStart(6, '0')}`,
    notaFiscal: extractField(html, /nota.*fiscal.*?(\d+)/i),
    cliente: extractField(html, /cliente.*?<.*?>([^<]+)/i),
    remetente: extractField(html, /remetente.*?<.*?>([^<]+)/i),
    volumes: extractField(html, /volumes?.*?(\d+)/i),
    codFiscal: extractField(html, /c[óo]d.*fiscal.*?(\d+)/i),
    produtos: [],
    rawHtml: html
  };

  return data;
};

/**
 * Extract field from HTML using regex
 * @param {string} html - HTML content
 * @param {RegExp} regex - Regex pattern
 * @returns {string|null} - Extracted value
 */
const extractField = (html, regex) => {
  const match = html.match(regex);
  return match ? match[1].trim() : null;
};

/**
 * Fetch CTRC data from n8n webhook
 * @param {string} ctrcNumber - The CTRC number (format: DCX078534-2)
 * @returns {Promise<Object>} - The CTRC data
 */
export const fetchCTRC = async ({ ctrcNumber, selection }) => {
  if (!ctrcNumber || ctrcNumber.trim() === '') {
    throw new Error('Número do CTRC é obrigatório');
  }

  try {
    // Enviar POST para n8n com o número do CTRC e seleção
    const payload = {
      ctrc: ctrcNumber.trim().toUpperCase(),
      timestamp: new Date().toISOString(),
      action: selection === 'Manifesto' ? 'selecionar_manifesto' : 'buscar_ctrc',
    };

    // payload enviado para o servidor (logs removidos em produção)
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(60000), // 60 segundos de timeout
    });

    // resposta do servidor (logs removidos em produção)

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('CTRC não encontrado');
      } else if (response.status === 500) {
        throw new Error('Erro no servidor. Tente novamente mais tarde');
      } else {
        throw new Error(`Erro ao buscar CTRC: ${response.status}`);
      }
    }

    let data;
    try {
      data = await response.json();
    } catch (err) {
      // Tentar obter o texto bruto para debug e jogar um erro mais amigável
      const text = await response.text().catch(() => null);
      console.error('Invalid JSON from webhook', { status: response.status, snippet: text ? text.slice(0, 1000) : null });
      throw new Error('Resposta inválida do webhook: não foi possível decodificar JSON. Veja o console para detalhes.');
    }

    // Se n8n retornar array, pode ser lista de CTRCs (manifesto) ou lista de produtos
    if (Array.isArray(data) && data.length > 0) {
      // Caso seja um manifesto (itens são CTRCs com propriedade `ctrc`), devolvemos o array diretamente
      if (data[0] && data[0].ctrc !== undefined) {
        return data;
      }

      // Caso contrário, processamos como lista de produtos/observações (formato antigo)
      const produtos = [];
      let observacao = null;
      let dadosCtrc = null;

      data.forEach(item => {
        if (item.row_number !== undefined) {
          // É o item de observação/informações extras
          observacao = item;
        } else if (item.seq_ctrc !== undefined) {
          // É o item com dados do CTRC (nota fiscal, seq_ctrc, cnpj)
          dadosCtrc = item;
        } else if (item.produto) {
          // É um produto
          produtos.push(item);
        }
      });

      return { produtos, observacao, dadosCtrc };
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar CTRC:', error);
    throw error;
  }
};

/**
 * Fetch Manifesto data from n8n webhook
 * @param {Object} params - Parameters containing manifesto data
 * @param {string} params.manifestoData - The manifesto data
 * @returns {Promise<Object>} - The Manifesto data
 */
export const fetchManifesto = async ({ manifestoData, expectedList = null }) => {
  if (!manifestoData || manifestoData.trim() === '') {
    throw new Error('Manifesto é obrigatório');
  }

  try {
    const payload = {
      manifesto: manifestoData.trim().toUpperCase(),
      timestamp: new Date().toISOString(),
      action: 'selecionar_manifesto',
    };

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(120000), // aumentar timeout para manifestos grandes
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar manifesto');
    }

    let data;
    try {
      data = await response.json();
    } catch (err) {
      const text = await response.text().catch(() => null);
      console.error('Invalid JSON from webhook (manifesto)', { status: response.status, snippet: text ? text.slice(0, 1000) : null });
      throw new Error('Resposta inválida do webhook: não foi possível decodificar JSON. Veja o console para detalhes.');
    }

    // Normalize several possible manifesto response shapes.
    // Some webhook flows return an array with a single object containing
    // { returnedCtrcs, rawItems, missing, errors, foundCount, expectedCount }
    if (Array.isArray(data) && data.length === 1 && data[0] && data[0].returnedCtrcs !== undefined) {
      const doc = data[0];

      const returnedCtrcs = Array.isArray(doc.returnedCtrcs)
        ? doc.returnedCtrcs.map((s) => s.toString().toUpperCase())
        : [];

      const rawItems = Array.isArray(doc.rawItems) ? doc.rawItems : [];

      // Separate error objects and valid CTRC objects from rawItems
      const itemErrors = rawItems.filter((it) => it && it.error === true);
      const validItems = rawItems.filter((it) => it && it.ctrc);

      // Merge doc.errors and itemErrors, deduplicate by message+statusCode
      const rawErrors = Array.isArray(doc.errors) ? doc.errors.slice() : [];
      const combined = rawErrors.concat(itemErrors);
      const seen = new Set();
      const errors = [];
      for (const e of combined) {
        try {
          const key = `${String(e.message || '')}::${String(e.statusCode || '')}`;
          if (!seen.has(key)) {
            seen.add(key);
            errors.push(e);
          }
        } catch (err) {
          // fallback to stringify
          const key = JSON.stringify(e);
          if (!seen.has(key)) {
            seen.add(key);
            errors.push(e);
          }
        }
      }

      const missing = Array.isArray(doc.missing) ? doc.missing : [];

      // Compute errored CTRCs:
      // - CTRCs present in returnedCtrcs but not in validItems
      // - CTRCs explicitly mentioned in error objects (if any)
      const validCtrcSet = new Set(validItems.map((it) => (it.ctrc || '').toString().toUpperCase()));
      const erroredFromReturned = returnedCtrcs.filter((c) => c && !validCtrcSet.has(c));
      const erroredFromErrors = errors
        .map((e) => (e && e.ctrc ? e.ctrc.toString().toUpperCase() : null))
        .filter(Boolean)
        .filter((c) => !validCtrcSet.has(c));

      const erroredCtrcsSet = new Set(erroredFromReturned.concat(erroredFromErrors));
      const erroredCtrcs = Array.from(erroredCtrcsSet);

      return {
        data: validItems,
        returnedCtrcs,
        missing,
        errors,
        erroredCtrcs,
        foundCount: typeof doc.foundCount === 'number' ? doc.foundCount : validItems.length,
        expectedCount: typeof doc.expectedCount === 'number' ? doc.expectedCount : (Array.isArray(doc.expectedList) ? doc.expectedList.length : 0),
      };
    }

    // If the caller passed an expected list, compute missing against returned array/string list.
    if (expectedList && Array.isArray(expectedList)) {
      const returned = Array.isArray(data) ? data : [];
      const foundSet = new Set(
        returned.map((r) => {
          if (!r) return '';
          return (typeof r === 'string' ? r : r.ctrc || '').toString().toUpperCase();
        })
      );

      const normalizedExpected = expectedList.map((s) => s.toString().toUpperCase());
      const missing = normalizedExpected.filter((c) => !foundSet.has(c));

      return { data: returned, missing, foundCount: returned.length, expectedCount: normalizedExpected.length };
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar manifesto:', error);
    throw error;
  }
};

/**
 * Validate CTRC number format
 * @param {string} ctrcNumber - The CTRC number to validate
 * @returns {boolean} - True if valid
 * @description Formato aceito: BSB010093-5 (3 letras + 6 dígitos + hífen + 1 dígito)
 */
export const validateCTRCNumber = (ctrcNumber) => {
  const cleaned = ctrcNumber.trim().toUpperCase();
  // Formato: 3 letras + 6 dígitos + hífen + 1 dígito verificador
  return /^[A-Z]{3}\d{6}-\d{1}$/.test(cleaned);
};
