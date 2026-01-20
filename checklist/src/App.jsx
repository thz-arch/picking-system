import { useState } from 'react';
import { FileText, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import SearchForm from './components/SearchForm';
import DataPreview from './components/DataPreview';
import PDFGenerator from './components/PDFGenerator';
import { fetchCTRC, fetchManifesto } from './services/webhookService';

function App() {
  const [ctrcData, setCtrcData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [missingCtrcs, setMissingCtrcs] = useState([]);
  const [erroredItems, setErroredItems] = useState([]);
  const [erroredCtrcs, setErroredCtrcs] = useState([]);

  const handleSearch = async (documentNumber, selection) => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    setCtrcData(null);

    try {
      // support passing expected CTRC list after manifesto id using `MANIFESTO|CTRC1,CTRC2,...`
      let expectedList = null;
      let manifestoId = documentNumber;
      if (selection === 'Manifesto' && typeof documentNumber === 'string' && documentNumber.includes('|')) {
        const parts = documentNumber.split('|');
        manifestoId = parts[0].trim();
        expectedList = parts[1] ? parts[1].split(',').map(s => s.trim()).filter(Boolean) : null;
      }

      const rawResponse = selection === 'Manifesto'
        ? await fetchManifesto({ manifestoData: manifestoId, expectedList })
        : await fetchCTRC({ ctrcNumber: documentNumber, selection });

      // If fetchManifesto returned an object with `data` and `missing`, unpack it
      let data = rawResponse;
      // use local variables to hold arrays because setState is async
      let localMissing = [];
      let localErroredItems = [];
      let localErroredCtrcs = [];
      if (rawResponse && rawResponse.data !== undefined) {
        data = rawResponse.data;
        localMissing = Array.isArray(rawResponse.missing) ? rawResponse.missing : [];
        localErroredItems = Array.isArray(rawResponse.errors) ? rawResponse.errors : [];
        localErroredCtrcs = Array.isArray(rawResponse.erroredCtrcs) ? rawResponse.erroredCtrcs : [];
      }

      // Normalize response into array of CTRC objects with consistent shape
      const rawArray = Array.isArray(data) ? data : [data];

      const processedData = rawArray.map((item) => {
        const cadastro = item.cadastro_destinatario || item.cliente || {};
        const notas = item.notas_fiscais || [];

        const observacao = {
          'Perfil de Recebimento': (
            cadastro['Perfil de Recebimento'] || cadastro.Perfil_de_Recebimento || cadastro.perfil_recebimento || cadastro.perfilRecebimento || null
          ),
          'Separação': (
            cadastro['Separação'] || cadastro.separacao || cadastro.separacao_camadas || cadastro.separacao || null
          ),
          'Perfil de paletização': (
            cadastro['Perfil de paletização'] || cadastro.perfil_paletizacao || cadastro.perfilPaletizacao || null
          ),
          'Estabilização do palete': (
            cadastro['Estabilização do palete'] || cadastro.estabilizacao_palete || cadastro.estabilizacaoPalete || null
          ),
          'Altura do palete': (
            cadastro['Altura do palete'] || cadastro.altura_palete || cadastro.alturaPalete || null
          ),
          'Aceita Sobreposição': (
            cadastro['Aceita Sobreposição'] || cadastro.aceita_sobreposicao || cadastro.aceitaSobreposicao || null
          ),
        };

        return {
          ctrc: item.ctrc || item.ctrc_num || null,
          remetente: item.remetente || 'N/A',
          destinatario: cadastro['Razão Social'] || item.destinatario || 'N/A',
          qvol: Number(item.qvol) || Number(item.total_volume_produtos) || 0,
          kgreal: Number(item.kgreal) || Number(item.kgreal) || 0,
          kgcalc: Number(item.kgcalc) || Number(item.kgcalc) || 0,
          m3: Number(item.m3) || 0,
          prev_entrega: item.prev_entrega || item.previsao || 'N/A',
          endereco: cadastro['Endereço'] || item.endereco || 'N/A',
          bairro: item.bairro || cadastro['Bairro'] || 'N/A',
          cidade: cadastro['Cidade'] || item.cidade || item.destino || 'N/A',
          produtos: item.produtos || [],
          observacao,
          notaFiscal: notas[0]?.nota_fiscal || item.notaFiscal || null,
          seq_ctrc: item.seq_ctrc || null,
          total_itens: item.total_itens || (item.produtos ? item.produtos.length : 0),
        };
      });

      // If the webhook returned a manifesto header with `concatenated_ctrc`,
      // compute missing CTRCs (expected - returned) so we can show placeholders.
      if ((rawArray[0] && rawArray[0].concatenated_ctrc) && (!localErroredCtrcs || localErroredCtrcs.length === 0)) {
        const expected = rawArray[0].concatenated_ctrc.split(',').map(s => s.trim()).filter(Boolean).map(s => s.toUpperCase());
        const returned = processedData.map(d => (d && d.ctrc) ? d.ctrc.toString().toUpperCase() : null).filter(Boolean);
        const missingFromExpected = expected.filter(e => !returned.includes(e));
        if (missingFromExpected.length > 0) {
          localErroredCtrcs = missingFromExpected;
        }
      }

      
      // If there are CTRCs identified as errored/missing, add placeholders so UI shows their IDs
      let finalData = processedData;
      if (localErroredCtrcs && localErroredCtrcs.length > 0) {
        const placeholders = localErroredCtrcs.map((c) => {
          // try to find a matching errored item message
          const matched = (localErroredItems || []).find((it) => it && (it.ctrc || '').toString().toUpperCase() === (c || '').toString().toUpperCase());
          const message = matched ? (matched.message || matched.raw_response || JSON.stringify(matched)) : 'Sem dados retornados (erro)';
          return {
            ctrc: c,
            remetente: `Erro: ${message}`,
            destinatario: 'Sem dados',
            qvol: 'N/D',
            kgreal: 'N/D',
            kgcalc: 'N/D',
            m3: 'N/D',
            prev_entrega: 'N/D',
            endereco: null,
            bairro: null,
            cidade: null,
            produtos: [],
            _erro: true,
            _erroMessage: message,
          };
        });
        // Prepend placeholders so they appear first in the UI
        finalData = placeholders.concat(processedData);
      }

      // remove any items that don't have a CTRC (they will be represented by placeholders)
      const filtered = finalData.filter((d) => d && d.ctrc);
      setCtrcData(filtered);
      // now commit the local arrays into state
      setMissingCtrcs(localMissing);
      setErroredItems(localErroredItems);
      setErroredCtrcs(localErroredCtrcs);
      setSuccessMessage(Array.isArray(data) ? 'Manifesto encontrado com sucesso!' : 'CTRC encontrado com sucesso!');

      // Build a deduplicated error message list for the banner
      const bannerMsgs = [];
      if (localMissing && localMissing.length > 0) {
        bannerMsgs.push(`Foram retornados ${processedData.length} CTRCs. CTRCs faltantes: ${localMissing.join(', ')}.`);
      }

      if (localErroredItems && localErroredItems.length > 0) {
        const msgs = localErroredItems.map((e, i) => {
          // prefer message + optional ctrc
          const ctrc = e && (e.ctrc || e.ctrc_num || e.ctrc_numero);
          return ctrc ? `${ctrc}: ${e.message || JSON.stringify(e)}` : (e.message || `Erro ${i + 1}`);
        });
        bannerMsgs.push(...msgs);
      }

      if (localErroredCtrcs && localErroredCtrcs.length > 0) {
        bannerMsgs.push(`CTRCs com erro: ${localErroredCtrcs.join(', ')}`);
      }

      // Deduplicate banner messages
      const uniqueBanner = Array.from(new Set(bannerMsgs));
      if (uniqueBanner.length > 0) setError(uniqueBanner.join(' | '));

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Erro ao buscar documento. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderCtrcData = () => {
    if (!ctrcData || ctrcData.length === 0) {
      return (
        <p className="text-center text-gray-500">Nenhum dado encontrado.</p>
      );
    }

    return ctrcData.map((ctrc, index) => (
      <div key={index} className="bg-white shadow rounded-lg p-4 mb-4">
        <h2 className="text-lg font-bold text-gray-800 mb-2">Dados do CTRC</h2>
        <p><strong>CTRC:</strong> {ctrc.ctrc}</p>
        <p><strong>Remetente:</strong> {ctrc.remetente}</p>
        <p><strong>Destinatário:</strong> {ctrc.destinatario}</p>
        <p><strong>Volumes:</strong> {ctrc.qvol}</p>
        <p><strong>Peso Real (kg):</strong> {ctrc.kgreal}</p>
        <p><strong>Peso Calculado (kg):</strong> {ctrc.kgcalc}</p>
        <p><strong>M³:</strong> {ctrc.m3}</p>
        <p><strong>Previsão de Entrega:</strong> {ctrc.prev_entrega}</p>
      </div>
    ));
  };

  const handleNewSearch = () => {
    setCtrcData(null);
    setError('');
    setSuccessMessage('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <FileText className="h-10 w-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              Gerador de Checklist CTRC
            </h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Busque informações de CTRC via ssw e gere checklists em PDF
          </p>
        </header>

        {/* Success Message */}
        {successMessage && (
          <div className="max-w-md mx-auto bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 animate-fade-in">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
            <p className="text-green-800 text-sm font-medium">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="max-w-md mx-auto bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Search Form */}
        {!ctrcData && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <SearchForm onSearch={handleSearch} isLoading={isLoading} />
          </div>
        )}

        {/* Results */}
        {ctrcData && (
          <div className="space-y-6">
            {/* Errored items from webhook (if any) */}
            {erroredItems && erroredItems.length > 0 && (
              <div className="max-w-4xl mx-auto bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-yellow-800 mb-2">Itens com erro no manifesto</h3>
                <ul className="text-sm text-yellow-800 list-disc list-inside">
                  {erroredItems.map((e, i) => {
                    // Try to display an associated CTRC if present, otherwise fall back to erroredCtrcs list
                    const ctrc = e.ctrc || erroredCtrcs[i] || (erroredCtrcs.length === 1 ? erroredCtrcs[0] : null);
                    return (
                      <li key={i}>
                        <strong>{ctrc ? `${ctrc}: ` : ''}</strong>
                        {e.message || JSON.stringify(e)}
                      </li>
                    );
                  })}
                </ul>
                {erroredCtrcs && erroredCtrcs.length > 0 && (
                  <p className="mt-2 text-sm text-yellow-800">CTRCs identificados com erro: {erroredCtrcs.join(', ')}</p>
                )}
              </div>
            )}

            {/* Data Preview */}
            <DataPreview data={ctrcData} />

            {/* PDF Generator */}
            <PDFGenerator data={ctrcData} erroredCtrcs={erroredCtrcs} erroredItems={erroredItems} />

            {/* New Search Button */}
            <div className="text-center">
              <button
                onClick={handleNewSearch}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm underline transition-colors"
              >
                Fazer nova busca
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-sm text-gray-500 pt-8 border-t border-gray-200">
          <p>
            Gerador de Checklist CTRC © {new Date().getFullYear()} 
            {' '}- Aplicativo PWA instalável
          </p>
          <p className="mt-2 flex items-center justify-center gap-2">
            <Download className="h-4 w-4" />
            Instale este app no seu dispositivo para acesso rápido
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
