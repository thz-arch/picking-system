import { useState } from 'react';
import { LogIn, Loader2, Lock, User, ExternalLink } from 'lucide-react';

/**
 * LoginForm Component
 * Form for user authentication
 */
export default function LoginForm({ onLogin, isLoading }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Digite seu usuário');
      return;
    }

    if (!password.trim()) {
      setError('Digite sua senha');
      return;
    }

    onLogin(username.trim(), password);
  };

  const handleOpenSSW = () => {
    window.open('https://sistema.ssw.inf.br/bin/menu01', '_blank');
  };

  const handleSkipLogin = () => {
    // Simula login bem-sucedido sem verificar credenciais
    // Assumindo que o usuário já está logado no navegador
    localStorage.setItem('ssw_session', JSON.stringify({
      success: true,
      username: username || 'usuario',
      loginTime: new Date().toISOString(),
      skipped: true
    }));
    localStorage.setItem('ssw_session_time', Date.now().toString());
    onLogin(username || 'usuario', 'skipped');
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Lock className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Autenticação SSW</h2>
        <p className="text-gray-600 mt-2">Configure o acesso ao sistema</p>
      </div>

      {/* Instrução alternativa */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800 mb-3">
          <strong>Método Recomendado:</strong>
        </p>
        <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
          <li>Clique no botão abaixo para abrir o SSW em nova aba</li>
          <li>Faça login no sistema SSW normalmente</li>
          <li>Volte para esta aba e clique em "Já estou logado"</li>
        </ol>
        <button
          onClick={handleOpenSSW}
          className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          Abrir Sistema SSW
        </button>
      </div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">ou use suas credenciais</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username */}
        <div>
          <label 
            htmlFor="username" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Usuário
          </label>
          <div className="relative">
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) setError('');
              }}
              placeholder="Digite seu usuário"
              className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              disabled={isLoading}
              autoComplete="username"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <User className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Password */}
        <div>
          <label 
            htmlFor="password" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Senha
          </label>
          <div className="relative">
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              placeholder="Digite sua senha"
              className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              disabled={isLoading}
              autoComplete="current-password"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-2">
          <button
            type="button"
            onClick={handleSkipLogin}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
          >
            <LogIn className="h-5 w-5" />
            Já estou logado no SSW
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Entrando...
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                Entrar com credenciais
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
