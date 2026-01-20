/**
 * SSW Authentication Service
 * Handles login and session management with SSW system
 */

const SSW_BASE_URL = '/ssw'; // Use proxy
const SSW_LOGIN_ENDPOINT = '/bin/menu01';

/**
 * Check if user already has active SSW session
 * @returns {Promise<boolean>} - True if session exists
 */
export const checkSSWSession = async () => {
  try {
    // Tentar fazer uma requisição simples ao SSW
    const formData = new URLSearchParams({
      'act': 'SSU',
      'dummy': Date.now().toString()
    });

    const response = await fetch(`${SSW_BASE_URL}${SSW_LOGIN_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': '*/*',
      },
      body: formData.toString(),
      credentials: 'include',
    });

    // Se retornar 200, o usuário já está logado
    if (response.ok) {
      const text = await response.text();
      // Verificar se não é uma página de login
      if (!text.includes('senha') && !text.includes('password')) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Erro ao verificar sessão SSW:', error);
    return false;
  }
};

/**
 * Login to SSW system
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<Object>} - Session data including cookies and token
 */
export const loginSSW = async (username, password) => {
  if (!username || !password) {
    throw new Error('Usuário e senha são obrigatórios');
  }

  try {
    // Preparar dados de login
    const formData = new URLSearchParams({
      'act': 'SSU',
      'dummy': Date.now().toString(),
      'usuario': username,
      'senha': password
    });

    const response = await fetch(`${SSW_BASE_URL}${SSW_LOGIN_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': '*/*',
        'Origin': SSW_BASE_URL,
        'Referer': `${SSW_BASE_URL}/bin/menu01`,
      },
      body: formData.toString(),
      credentials: 'include', // Important for cookies
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Usuário ou senha inválidos');
      } else if (response.status === 403) {
        throw new Error('Acesso negado');
      } else {
        throw new Error(`Erro ao fazer login: ${response.status}`);
      }
    }

    // Extrair cookies da resposta
    const cookies = response.headers.get('set-cookie');
    const data = await response.text();

    // Tentar extrair token se vier em JSON
    let sessionData = {
      success: true,
      cookies: cookies,
      username: username,
      loginTime: new Date().toISOString()
    };

    // Se a resposta for JSON, parsear
    try {
      const jsonData = JSON.parse(data);
      sessionData = { ...sessionData, ...jsonData };
    } catch (e) {
      // Se não for JSON, usar como está
      sessionData.response = data;
    }

    // Salvar sessão no localStorage
    saveSession(sessionData);

    return sessionData;
  } catch (error) {
    if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
      throw new Error('Erro de conexão. Verifique sua internet ou configuração de CORS');
    }
    throw error;
  }
};

/**
 * Save session data to localStorage
 * @param {Object} sessionData - Session data to save
 */
export const saveSession = (sessionData) => {
  localStorage.setItem('ssw_session', JSON.stringify(sessionData));
  localStorage.setItem('ssw_session_time', Date.now().toString());
};

/**
 * Get saved session from localStorage
 * @returns {Object|null} - Session data or null
 */
export const getSession = () => {
  const sessionStr = localStorage.getItem('ssw_session');
  const sessionTime = localStorage.getItem('ssw_session_time');
  
  if (!sessionStr || !sessionTime) {
    return null;
  }

  // Check if session expired (1 hour)
  const elapsed = Date.now() - parseInt(sessionTime);
  const ONE_HOUR = 60 * 60 * 1000;
  
  if (elapsed > ONE_HOUR) {
    clearSession();
    return null;
  }

  try {
    return JSON.parse(sessionStr);
  } catch (e) {
    return null;
  }
};

/**
 * Check if user is logged in
 * @returns {boolean} - True if logged in
 */
export const isLoggedIn = () => {
  return getSession() !== null;
};

/**
 * Clear session (logout)
 */
export const clearSession = () => {
  localStorage.removeItem('ssw_session');
  localStorage.removeItem('ssw_session_time');
};

/**
 * Logout from SSW system
 */
export const logoutSSW = () => {
  clearSession();
  // Optionally call SSW logout endpoint
};
