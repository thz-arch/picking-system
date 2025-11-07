# 📊 Apresentação - Sistema de Picking# Picking Presentation (React)



Apresentação visual e interativa do sistema de picking desenvolvido para demonstração e treinamento.Esta pasta contém uma aplicação React mínima usada para apresentar as funcionalidades, escalonamento e integrações do sistema de picking.



## 🚀 Como Usar## Como rodar (desenvolvimento)



### Opção 1: Executável (Recomendado)1. Entre na pasta `presentation`:

```bash

# Apenas clique duas vezes no arquivo:```powershell

INICIAR-APRESENTACAO.batcd presentation

``````



### Opção 2: Linha de Comando2. Instale dependências:

```bash

cd presentation```powershell

python server.pynpm install

``````



### Opção 3: PowerShell3. Inicie o servidor de desenvolvimento (porta 9000):

```powershell

cd presentation```powershell

python .\server.pynpm run dev

``````



## 🌐 AcessandoA aplicação ficará disponível em http://localhost:9000



Após iniciar o servidor, acesse:## Build e preview

- **Local**: http://localhost:9000/apresentacao.html

- **Rede**: http://[SEU-IP]:9000/apresentacao.html```powershell

npm run build

## 📸 Screenshots Necessáriosnpm run preview

```

Veja o arquivo `CAPTURA-SCREENSHOTS.md` para instruções detalhadas.

## Docker (exemplo)

### Lista Rápida:

- ✅ 0. formulario-demo.mp4 (vídeo)```powershell

- ⬜ 1. selecao-filial.pngdocker build -t picking-presentation:latest .

- ⬜ 2. lista-ctrcs.pngdocker run -p 3001:3001 picking-presentation:latest

- ⬜ 3. tela-separacao.png e tela-separacao2.png```

- ⬜ 4. bipagem.png

- ⬜ 5. modal-unidades.png## Notas

- ⬜ 6. finalizacao.png- Esta app é separada do projeto principal e foi feita para ser servida em uma porta distinta (3001) para apresentações e demos.

- ⬜ 7. historico.png- Alterações adicionais (imagens, logos) podem ser feitas na pasta `src/assets` (não incluída nesta versão).

- ⬜ 8. restaurar.png

## 📂 Estrutura de Arquivos

```
presentation/
├── apresentacao.html          # Arquivo principal
├── presentation-styles.css    # Estilos
├── presentation-script.js     # Navegação
├── server.py                  # Servidor HTTP (porta 9000)
├── INICIAR-APRESENTACAO.bat   # Atalho
├── screenshots/               # Imagens
└── videos/                    # Vídeos
```

## 🎮 Navegação

- **Próximo**: Seta → ou botão "Próximo"
- **Anterior**: Seta ← ou botão "Anterior"
- **Ir para slide**: Clique nos indicadores

## 🎬 Recursos

- ✨ 14 slides informativos
- 📹 Suporte para vídeos MP4/WebM
- 🖼️ Carrossel automático de imagens
- 🎨 Status badges com cores reais
- 📱 Design responsivo
- ⌨️ Navegação por teclado

## 🔧 Requisitos

- Python 3.6+
- Navegador moderno (Chrome, Firefox, Edge)

## 🌍 Expondo na Internet

Configure proxy reverso (Nginx/Apache):

```nginx
location /apresentacao {
    proxy_pass http://localhost:9000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
}
```

## 🐛 Problemas Comuns

**Porta 9000 em uso**: Feche o outro servidor ou altere no `server.py`

**Imagens não aparecem**: Verifique pasta `screenshots/`

**Vídeo não reproduz**: Converta para MP4 (H.264)

## 👨‍💻 Desenvolvedor

**Thiago Alves / Analista Dev.**

---

© 2025 - Sistema de Picking
