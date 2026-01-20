# 🚀 Guia de Instalação do Node.js e Execução do Projeto

## ⚠️ Pré-requisito: Instalar Node.js

O Node.js não foi detectado no seu sistema. Siga os passos abaixo:

### Opção 1: Instalação via Site Oficial (Recomendado)

1. **Baixe o Node.js:**
   - Acesse: https://nodejs.org/
   - Clique em "Download Node.js (LTS)" - versão recomendada
   - Escolha a versão **LTS** (Long Term Support) - atualmente v20.x ou superior

2. **Execute o instalador:**
   - Abra o arquivo `.msi` baixado
   - Siga o assistente de instalação
   - ✅ Marque a opção "Automatically install necessary tools"
   - Clique em "Next" até finalizar

3. **Verifique a instalação:**
   - Abra um NOVO terminal PowerShell (feche o atual e abra novamente)
   - Execute:
   ```powershell
   node --version
   npm --version
   ```
   - Deve exibir as versões instaladas (ex: v20.11.0 e 10.2.4)

### Opção 2: Instalação via Winget (Windows 11)

```powershell
winget install OpenJS.NodeJS.LTS
```

### Opção 3: Instalação via Chocolatey

```powershell
choco install nodejs-lts
```

---

## 📦 Após Instalar o Node.js

### 1. Instale as Dependências do Projeto

No terminal, na pasta do projeto, execute:

```powershell
npm install
```

Isso instalará:
- React 18
- Vite
- Tailwind CSS
- jsPDF
- Lucide React
- Vite PWA Plugin
- E todas as outras dependências

### 2. Configure o Arquivo .env

Copie o arquivo de exemplo:

```powershell
Copy-Item .env.example .env
```

Edite o arquivo `.env` e configure suas credenciais:

```env
VITE_WEBHOOK_URL=https://api.seuservidor.com/webhook/ctrc
VITE_API_TOKEN=seu_token_de_api_aqui
```

### 3. Execute o Projeto

**Modo Desenvolvimento:**
```powershell
npm run dev
```

Acesse: http://localhost:5173

**Build de Produção:**
```powershell
npm run build
```

**Preview do Build:**
```powershell
npm run preview
```

---

## 🛠️ Comandos Úteis

```powershell
# Ver versão do Node.js
node --version

# Ver versão do npm
npm --version

# Limpar cache do npm (se tiver problemas)
npm cache clean --force

# Reinstalar dependências do zero
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install

# Atualizar dependências
npm update

# Verificar dependências desatualizadas
npm outdated
```

---

## ❌ Solução de Problemas

### Erro: "npm não é reconhecido"

**Causa:** Node.js não instalado ou não está no PATH

**Solução:**
1. Instale o Node.js (veja acima)
2. Feche e reabra o terminal
3. Se ainda não funcionar, adicione ao PATH manualmente:
   - Caminho típico: `C:\Program Files\nodejs\`

### Erro: "EPERM: operation not permitted"

**Causa:** Permissões do Windows

**Solução:**
```powershell
# Execute o PowerShell como Administrador
npm install --force
```

### Erro: "Module not found"

**Causa:** Dependências não instaladas

**Solução:**
```powershell
npm install
```

### Erro: "Port 5173 already in use"

**Causa:** Porta já está sendo usada

**Solução:**
```powershell
# Pare o processo que está usando a porta ou use outra:
npm run dev -- --port 3000
```

---

## 📚 Recursos Adicionais

- **Documentação Node.js:** https://nodejs.org/docs
- **Documentação npm:** https://docs.npmjs.com/
- **Documentação Vite:** https://vitejs.dev/
- **Documentação React:** https://react.dev/

---

## ✅ Checklist de Instalação

- [ ] Node.js instalado (v18+)
- [ ] npm instalado (vem com Node.js)
- [ ] Terminal fechado e reaberto
- [ ] Versões verificadas com `node --version` e `npm --version`
- [ ] Navegou até a pasta do projeto
- [ ] Executou `npm install`
- [ ] Criou arquivo `.env` com configurações
- [ ] Executou `npm run dev`
- [ ] App aberto no navegador em http://localhost:5173

---

**Após completar esses passos, seu projeto estará pronto para uso! 🎉**
