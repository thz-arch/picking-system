import { Package, User, Building2, Hash, Calendar, Ruler, Weight } from 'lucide-react';

export default function DataPreview({ data }) {

  if (!data || data.length === 0) return null;

  const renderItem = (ctrc, index) => {
    const isError = !!ctrc._erro;
    return (
      <div key={index} className={`border-b pb-4 mb-4 ${isError ? 'bg-yellow-50 border-yellow-200' : ''}`}>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">CTRC: {ctrc.ctrc}</h3>
        {isError && (
          <div className="mb-3 p-2 rounded text-sm bg-yellow-100 text-yellow-800 border border-yellow-200">
            <strong>Erro:</strong> {ctrc._erroMessage || 'Sem dados retornados'}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoCard icon={<Hash className="h-5 w-5" />} label="CTRC" value={ctrc.ctrc} />
          <InfoCard icon={<User className="h-5 w-5" />} label="Remetente" value={ctrc.remetente} />
          <InfoCard icon={<Building2 className="h-5 w-5" />} label="Destinatário" value={ctrc.destinatario} />
          <InfoCard icon={<Package className="h-5 w-5" />} label="Volumes" value={ctrc.qvol} />
          <InfoCard icon={<Weight className="h-5 w-5" />} label="Peso Real (kg)" value={ctrc.kgreal} />
          <InfoCard icon={<Weight className="h-5 w-5" />} label="Peso Calculado (kg)" value={ctrc.kgcalc} />
          <InfoCard icon={<Ruler className="h-5 w-5" />} label="M³" value={ctrc.m3} />
          <InfoCard icon={<Calendar className="h-5 w-5" />} label="Previsão Entrega" value={ctrc.prev_entrega} />
        </div>

        {(ctrc.endereco || ctrc.bairro || ctrc.cidade) && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Endereço de Entrega</h3>
            <p className="text-sm text-gray-900">
              {ctrc.endereco && <span>{ctrc.endereco}</span>}
              {ctrc.bairro && <span> - {ctrc.bairro}</span>}
              {ctrc.cidade && <span><br />{ctrc.cidade}</span>}
            </p>
          </div>
        )}

        {(ctrc.produtos && ctrc.produtos.length > 0) ? (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800">Produtos ({ctrc.produtos.length})</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantidade</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ctrc.produtos.map((produto, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{produto.codigo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{produto.produto}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{produto.quantidade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Nenhum produto encontrado.</p>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 border-b pb-3">
        Dados do Documento
      </h2>
      {data.map(renderItem)}
    </div>
  );
}

function InfoCard({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
      <div className="text-blue-600 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-base font-semibold text-gray-900 truncate">{value || 'N/A'}</p>
      </div>
    </div>
  );
}
