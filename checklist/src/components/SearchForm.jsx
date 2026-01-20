import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { validateCTRCNumber } from '../services/webhookService';

/**
 * SearchForm Component
 * Form for searching CTRC by number
 */
export default function SearchForm({ onSearch, isLoading }) {
  const [documentNumber, setDocumentNumber] = useState('');
  const [error, setError] = useState('');
  const [selection, setSelection] = useState('CTRC'); // New state for selection

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (selection === 'CTRC' && !validateCTRCNumber(documentNumber)) {
      setError('Formato inválido. Use: BSB010093-5 ou DCX078534-2');
      return;
    }

    onSearch(documentNumber.trim(), selection);
  };

  const handleInputChange = (e) => {
    const value = e.target.value.toUpperCase();
    setDocumentNumber(value);
    if (error) setError('');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label 
            htmlFor="selection" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Tipo de Documento
          </label>
          <select
            id="selection"
            value={selection}
            onChange={(e) => setSelection(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <option value="CTRC">CTRC</option>
            <option value="Manifesto">Manifesto</option>
          </select>
        </div>

        <div>
          <label 
            htmlFor="documentNumber" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Número do Documento
          </label>
          <input
            type="text"
            id="documentNumber"
            value={documentNumber}
            onChange={handleInputChange}
            placeholder="Digite o número do documento"
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors font-mono ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading} // Disable when loading
            autoComplete="off"
          />
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || !documentNumber}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Buscando...
            </>
          ) : (
            <>
              <Search className="h-5 w-5" />
              Buscar {selection}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
