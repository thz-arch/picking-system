# Instruções Docker (apresentação)

Para criar a imagem e rodar a apresentação em container:

```powershell
cd presentation
docker build -t picking-presentation:latest .
docker run -p 9000:9000 picking-presentation:latest
```

A aplicação ficará disponível em `http://localhost:9000`.
