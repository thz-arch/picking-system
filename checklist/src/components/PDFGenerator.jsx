import { useState } from 'react';
import { FileDown, Eye, Loader2 } from 'lucide-react';
import { generateAndDownloadPDF } from '../utils/pdfTemplate';

/**
 * PDFGenerator Component
 * Handles PDF generation and download
 */
export default function PDFGenerator({ data, erroredCtrcs = [], erroredItems = [] }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfMessage, setPdfMessage] = useState('');

  const handleGeneratePDF = async () => {
    
    setPdfMessage('');
    setIsGenerating(true);
    
    try {
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      await generateAndDownloadPDF({ valid: data, erroredCtrcs, erroredItems });
      
      setPdfMessage('PDF gerado. Verifique a aba de downloads ou a nova aba aberta.');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente. Veja o console para mais detalhes.');
      setPdfMessage('Erro ao gerar PDF. Ver console para detalhes.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!data) return null;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 text-center">
          Gerar Checklist PDF
        </h3>
        
        <p className="text-sm text-gray-600 text-center">
          Clique no botão abaixo para gerar e baixar o checklist em PDF
        </p>

        <div className="space-y-3">
          <button
            onClick={handleGeneratePDF}
            disabled={isGenerating}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Gerando PDF...
              </>
            ) : (
              <>
                <FileDown className="h-5 w-5" />
                Baixar PDF
              </>
            )}
          </button>

          {pdfMessage && (
            <p className="text-sm text-center text-gray-700">{pdfMessage}</p>
          )}

          <div className="text-xs text-gray-500 text-center space-y-1">
            <p>✓ Formato A4</p>
            <p>✓ Pronto para impressão</p>
            <p>✓ Inclui todos os dados do CTRC</p>
          </div>
        </div>
      </div>
    </div>
  );
}
