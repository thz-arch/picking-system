# Gerador de Checklist CTRC - PWA

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-61dafb.svg)
![Vite](https://img.shields.io/badge/Vite-5-646cff.svg)

Progressive Web App (PWA) para gerar checklists de CTRC em formato PDF a partir de dados obtidos via webhook.

## 🚀 Funcionalidades

- ✅ Busca de dados CTRC via API webhook
- ✅ Visualização prévia dos dados
- ✅ Geração de PDF formatado para impressão
- ✅ Aplicativo instalável (PWA)
- ✅ Interface responsiva (mobile e desktop)
- ✅ Modo offline básico
- ✅ Validação de entradas
- ✅ Tratamento de erros

## 🛠️ Tecnologias Utilizadas

- **React 18** - Framework UI
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Estilização
- **jsPDF** - Geração de PDFs
- **Lucide React** - Ícones
- **Vite PWA Plugin** - Funcionalidades PWA

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)

## 🔧 Instalação

1. **Clone o repositório (ou use o projeto atual):**
```bash
cd checklist
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as variáveis de ambiente:**

Copie o arquivo `.env.example` para `.env`:
```bash
copy .env.example .env
```

Edite o arquivo `.env` e configure:
```env
VITE_WEBHOOK_URL=https://api.seuservidor.com/webhook/ctrc
VITE_API_TOKEN=seu_token_de_api_aqui
```

> ⚠️ **IMPORTANTE**: Nunca commit o arquivo `.env` com dados sensíveis!

## 🚀 Executando o Projeto

### Modo Desenvolvimento

```bash
npm run dev
```

Acesse: [http://localhost:5173](http://localhost:5173)

### Build de Produção

```bash
npm run build
```

Os arquivos otimizados serão gerados na pasta `dist/`.

### Preview do Build

```bash
npm run preview
```

## 📱 Instalando como PWA

### Desktop (Chrome/Edge)

1. Acesse o app no navegador
2. Clique no ícone de instalação na barra de endereços
3. Ou vá em Menu → Instalar Gerador Checklist CTRC

### Mobile (Android/iOS)

**Android (Chrome):**
1. Acesse o app
2. Toque nos 3 pontos (menu)
3. Selecione "Instalar app" ou "Adicionar à tela inicial"

**iOS (Safari):**
1. Acesse o app
2. Toque no ícone de compartilhar
3. Selecione "Adicionar à Tela de Início"

## 📄 Estrutura do Projeto

```
checklist/
├── public/              # Arquivos estáticos e PWA
├── src/
│   ├── components/      # Componentes React
│   │   ├── SearchForm.jsx
│   │   ├── DataPreview.jsx
│   │   └── PDFGenerator.jsx
│   ├── services/        # Serviços de API
│   │   └── webhookService.js
│   ├── utils/           # Utilitários
│   │   └── pdfTemplate.js
│   ├── App.jsx          # Componente principal
│   ├── main.jsx         # Entry point
│   └── index.css        # Estilos globais
├── .env.example         # Exemplo de variáveis de ambiente
├── vite.config.js       # Configuração do Vite
├── tailwind.config.js   # Configuração do Tailwind
└── package.json         # Dependências
```

## 🔌 Configuração do Webhook

O app espera uma resposta JSON no seguinte formato:

**Endpoint:** `GET {VITE_WEBHOOK_URL}/{numero_ctrc}`

**Headers:**
```
Authorization: Bearer {VITE_API_TOKEN}
Content-Type: application/json
```

**Resposta esperada:**
```json
{
  "success": true,
  "data": {
    "ctrc": "958967",
    "notaFiscal": "958967",
    "cliente": "RAIA DROGASIL SA",
    "remetente": "Cory Brasil Comercio S.A",
    "volumes": "194",
    "codFiscal": "262780",
    "produtos": [
      {
        "descricao": "Produto exemplo",
        "quantidade": 10,
        "valor": 150.00
      }
    ],
    "totais": {
      "subtotal": 1500.00,
      "impostos": 300.00,
      "total": 1800.00
    }
  }
}
```

## 🚀 Deploy

### Vercel (Recomendado)

1. Instale a CLI da Vercel:
```bash
npm i -g vercel
```

2. Execute o deploy:
```bash
vercel
```

3. Configure as variáveis de ambiente no dashboard da Vercel

### Netlify

1. Instale a CLI da Netlify:
```bash
npm i -g netlify-cli
```

2. Execute o deploy:
```bash
netlify deploy --prod
```

### Servidor Próprio

1. Build do projeto:
```bash
npm run build
```

2. Suba a pasta `dist/` para seu servidor web (Apache/Nginx)

3. Configure HTTPS (obrigatório para PWA)

## 🧪 Testes

### Teste Manual

1. Inicie o servidor de desenvolvimento
2. Digite um número de CTRC válido
3. Verifique se os dados são carregados
4. Gere o PDF e verifique o conteúdo
5. Teste a instalação do PWA

### Teste com Mock de Dados

Para testar sem webhook, modifique temporariamente `src/services/webhookService.js`:

```javascript
export const fetchCTRC = async (ctrcNumber) => {
  // Mock data para testes
  return {
    ctrc: ctrcNumber,
    notaFiscal: "123456",
    cliente: "Cliente Teste",
    remetente: "Remetente Teste",
    volumes: "10",
    codFiscal: "123456",
    produtos: [
      { descricao: "Produto 1", quantidade: 5, valor: 100.00 }
    ],
    totais: {
      subtotal: 500.00,
      impostos: 100.00,
      total: 600.00
    }
  };
};
```

## 🔒 Segurança

- ✅ Tokens de API em variáveis de ambiente
- ✅ Validação de entradas do usuário
- ✅ Timeout em requisições
- ✅ Tratamento de erros
- ✅ HTTPS obrigatório em produção

## 🐛 Solução de Problemas

### Erro: "npm não é reconhecido"

Instale o Node.js: https://nodejs.org/

### Erro ao buscar CTRC

1. Verifique se o webhook URL está correto no `.env`
2. Confirme se o token de API é válido
3. Verifique sua conexão com a internet
4. Confira os logs do console do navegador (F12)

### PWA não instala

1. Certifique-se de estar usando HTTPS
2. Verifique se o manifest.json está acessível
3. Confirme se os ícones estão no lugar correto
4. Use o Chrome DevTools → Application → Manifest

## 📝 Changelog

### v1.0.0 (Janeiro 2026)
- ✅ Lançamento inicial
- ✅ Busca de CTRC via webhook
- ✅ Geração de PDF
- ✅ Funcionalidades PWA

## 📄 Licença

Este projeto está sob a licença MIT.

## 👨‍💻 Autor

Desenvolvido para CTRC Management System

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit suas mudanças: `git commit -m 'Adiciona nova funcionalidade'`
4. Push para a branch: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

## 📞 Suporte

Para problemas ou dúvidas:
- Abra uma issue no repositório
- Entre em contato com a equipe de desenvolvimento

---

**Desenvolvido com ❤️ usando React + Vite**
