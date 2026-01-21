from flask import Flask, jsonify, send_from_directory
import os

app = Flask(__name__, static_folder='.', static_url_path='')

# Rota para servir arquivos estáticos
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

# Exemplo de API para lidar com /api/live/ws
@app.route('/api/live/ws')
def live_ws():
    return jsonify({"message": "API funcionando!"})

# Rota para outros arquivos estáticos
@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)

@app.errorhandler(404)
def page_not_found(e):
    return "Página não encontrada", 404

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    app.run(host='0.0.0.0', port=port)