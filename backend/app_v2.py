from flask import Flask, jsonify, send_from_directory, request, render_template, Response
from flask_cors import CORS
from dotenv import load_dotenv
import os
import logging
from datetime import datetime
import json
import requests
import gzip

# Carrega variáveis de ambiente
load_dotenv()

# Configuração de logging estruturado
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('picking.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Define caminhos para templates e arquivos estáticos
base_dir = os.path.abspath(os.path.dirname(__file__))
template_dir = os.path.join(base_dir, '../frontend/templates')
static_dir = os.path.join(base_dir, '../frontend/static')
checklist_dir = os.path.join(base_dir, '../checklist/dist')

app = Flask(__name__,
            template_folder=template_dir,
            static_folder=static_dir,
            static_url_path='/static')

# Configuração CORS
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://127.0.0.1:8000", "http://localhost:8000", "http://192.168.18.6:8000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Rota para servir a aplicação principal (Picking)
@app.route('/')
def index():
    logger.info('Acesso à página inicial - Picking')
    return render_template('index_v2.html')

# Proxy para o Checklist (Vite dev server na porta 5173)
CHECKLIST_DEV_SERVER = 'http://localhost:5173'

def generic_proxy(target_url):
    """Função genérica para proxy de requisições"""
    try:
        query_string = request.query_string.decode('utf-8')
        if query_string:
            target_url += f"{'&' if '?' in target_url else '?'}{query_string}"

        # Repassa a requisição com o mesmo método e corpo (não usar stream=True para garantir decodificação automática)
        resp = requests.request(
            method=request.method,
            url=target_url,
            headers={key: value for (key, value) in request.headers if key.lower() != 'host'},
            data=request.get_data(),
            cookies=request.cookies,
            allow_redirects=True,
            timeout=30
        )

        # Remove headers que podem causar problemas (serão ajustados abaixo)
        excluded_headers = ['content-length', 'transfer-encoding', 'connection']
        final_headers = {name: value for (name, value) in resp.headers.items() if name.lower() not in excluded_headers}

        # Tentativas em caso de retorno incompleto do webhook (por exemplo: webhook iniciando stream)
        MAX_RETRIES = 3
        RETRY_DELAYS = [0.5, 1.0, 2.0]

        attempt = 0
        while True:
            # Trata compressao (gzip) caso necessário
            content = resp.content
            content_encoding = (resp.headers.get('content-encoding') or '').lower()
            decompressed = False

            try:
                if content_encoding == 'gzip' or (isinstance(content, (bytes, bytearray)) and content.startswith(b"\x1f\x8b")):
                    try:
                        content = gzip.decompress(content)
                        decompressed = True
                        logger.info(f"Decompressed gzip response from {target_url}")
                    except Exception as e:
                        logger.warning(f"Falha ao descompactar resposta gzip: {e}; will forward as gzip")
                        final_headers['Content-Encoding'] = 'gzip'

            except Exception as e:
                logger.warning(f"Erro inesperado ao tratar compressao: {e}")

            # Se descompactamos com sucesso, garantimos que o header Content-Encoding NÃO seja repassado
            if decompressed and 'Content-Encoding' in final_headers:
                final_headers.pop('Content-Encoding', None)

            # Se o content-type claramente indica JSON, tentamos validar que o conteúdo seja JSON decodificável
            content_type = resp.headers.get('content-type', '') or ''
            looks_like_json = 'application/json' in content_type.lower()

            if looks_like_json:
                try:
                    # Tenta decodificar como UTF-8 e carregar JSON
                    _ = json.loads(content.decode('utf-8'))
                    # sucesso -> vamos repassar a resposta
                    logger.info('Proxy verified valid JSON from upstream')
                    break
                except Exception as e:
                    # Se não é JSON e ainda temos tentativas, espera e tenta novamente
                    attempt += 1
                    logger.warning(f'Upstream returned invalid JSON (attempt {attempt}): {e}')
                    if attempt <= MAX_RETRIES:
                        delay = RETRY_DELAYS[min(attempt-1, len(RETRY_DELAYS)-1)]
                        logger.info(f'Retrying request to {target_url} after {delay}s')
                        import time
                        time.sleep(delay)
                        resp = requests.request(method=request.method, url=target_url, headers={key: value for (key, value) in request.headers if key.lower() != 'host'}, data=request.get_data(), cookies=request.cookies, allow_redirects=True, timeout=30)
                        # refresh headers list
                        final_headers = {name: value for (name, value) in resp.headers.items() if name.lower() not in excluded_headers}
                        continue
                    else:
                        # Log useful debug info: headers snippet and first bytes (safe-limited)
                        try:
                            snippet = resp.content[:1024]
                            # try decode for logging, fallback to repr
                            try:
                                snippet_text = snippet.decode('utf-8', errors='replace')
                            except Exception:
                                snippet_text = repr(snippet)
                        except Exception as e:
                            snippet_text = f'<could not read snippet: {e}>'

                        logger.error('Max retries reached and upstream did not return valid JSON. Upstream status: %s Headers: %s Snippet: %s', resp.status_code, dict(resp.headers), snippet_text)
                        break
            else:
                # Se não parece JSON, apenas repassamos o conteúdo (pode ser HTML ou outro tipo)
                break

        logger.info(f'Proxy response: {resp.status_code} content-type={resp.headers.get("content-type")} content-length={len(content)} decompressed={decompressed} attempts={attempt}')

        # Converte headers para lista de tuplas para resposta
        headers_list = [(k, v) for k, v in final_headers.items()]

        return Response(content, status=resp.status_code, headers=headers_list, content_type=resp.headers.get('content-type'))
    except requests.exceptions.ConnectionError:
        return jsonify({"error": "Servidor destino não disponível", "url": target_url}), 503

@app.route('/checklist')
@app.route('/checklist/')
def checklist_index():
    logger.info('Acesso à página do Checklist (gateway)')
    # Tenta usar o dev server do Vite, se estiver disponível
    try:
        probe = requests.get(CHECKLIST_DEV_SERVER, timeout=1)
        return generic_proxy(f'{CHECKLIST_DEV_SERVER}/checklist/')
    except requests.exceptions.RequestException:
        # Fallback: serve a build estática em checklist/dist se disponível
        logger.info('Dev server não disponível, tentando servir build de ./checklist/dist')
        index_file = os.path.join(checklist_dir, 'index.html')
        try:
            if os.path.exists(index_file):
                logger.info(f'Serving checklist index from {index_file}')
                from flask import send_file
                return send_file(index_file)
            else:
                logger.error(f'Checklist build index.html not found at {index_file}')
                return jsonify({"error": "Checklist não disponível"}), 503
        except Exception as e:
            logger.exception(f'Erro ao servir build do checklist: {e}')
            return jsonify({"error": "Checklist não disponível"}), 503

@app.route('/checklist/<path:path>')
def checklist_proxy(path):
    # Primeiro tenta proxy pro dev server, se falhar serve arquivos estáticos da build
    try:
        probe = requests.get(CHECKLIST_DEV_SERVER, timeout=1)
        return generic_proxy(f'{CHECKLIST_DEV_SERVER}/checklist/{path}')
    except requests.exceptions.RequestException:
        # Serve arquivos estáticos gerados pela build (dist)
        local_path = os.path.join(checklist_dir, path)
        try:
            if os.path.exists(local_path):
                return send_from_directory(checklist_dir, path)
            else:
                # If the requested path looks like a SPA route (no extension), serve index.html
                if '.' not in path:
                    index_file = os.path.join(checklist_dir, 'index.html')
                    if os.path.exists(index_file):
                        from flask import send_file
                        return send_file(index_file)
                logger.warning(f'Arquivo do checklist não encontrado no build: {path}')
                return jsonify({"error": "Arquivo do checklist não encontrado"}), 404
        except Exception as e:
            logger.exception(f'Erro ao servir arquivo do checklist: {e}')
            return jsonify({"error": "Erro ao acessar build do checklist"}), 500

# Rotas para recursos internos do Vite (evitar 404 no dev server proxied)
@app.route('/@react-refresh')
def vite_react_refresh():
    return generic_proxy(f'{CHECKLIST_DEV_SERVER}/@react-refresh')

@app.route('/@vite/<path:path>')
def vite_internal(path):
    return generic_proxy(f'{CHECKLIST_DEV_SERVER}/@vite/{path}')

@app.route('/@fs/<path:path>')
def vite_fs(path):
    return generic_proxy(f'{CHECKLIST_DEV_SERVER}/@fs/{path}')

@app.route('/src/<path:path>')
def vite_src(path):
    return generic_proxy(f'{CHECKLIST_DEV_SERVER}/src/{path}')

@app.route('/node_modules/<path:path>')
def vite_node_modules(path):
    return generic_proxy(f'{CHECKLIST_DEV_SERVER}/node_modules/{path}')

@app.route('/api/webhook/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE'])
def api_webhook_proxy(path):
    logger.info(f'Proxy API Webhook: {path}')
    return generic_proxy(f'https://tritton.dev.br/webhook/{path}')

@app.route('/ssw/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE'])
def ssw_proxy(path):
    logger.info(f'Proxy SSW: {path}')
    return generic_proxy(f'https://sistema.ssw.inf.br/{path}')

# API para fornecer configurações ao frontend
@app.route('/api/config')
def get_config():
    return jsonify({
        "API_URL": os.environ.get('API_URL', 'https://tritton.dev.br/webhook/picking-process'),
        "VERSION": "2.0"
    })

# API para verificar saúde do servidor
@app.route('/api/health')
def health():
    return jsonify({
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "version": "2.0"
    })

# API para listar filiais disponíveis
@app.route('/api/filiais')
def listar_filiais():
    """Retorna lista de filiais disponíveis"""
    logger.info('API /api/filiais acessada')
    
    # Filiais configuradas conforme banco de dados
    filiais = [
        {"sigla": "GYN", "nome": "Goiânia - GO", "cor": "#F58B00"},
        {"sigla": "SPO", "nome": "São Paulo - SP", "cor": "#7B1FA2"},
        {"sigla": "DCX", "nome": "Rio de Janeiro - RJ", "cor": "#080808"},
        {"sigla": "BSB", "nome": "Brasília - DF", "cor": "#FF0000"},
        {"sigla": "APS", "nome": "Anápolis - GO", "cor": "#1976D2"},
        {"sigla": "VIX", "nome": "Serra - ES", "cor": "#F8F400"},
        {"sigla": "ATM", "nome": "Altamira - PA", "cor": "#388E3C"}
    ]
    
    return jsonify(filiais)

# API para obter filial selecionada do localStorage
@app.route('/api/filial/atual')
def filial_atual():
    """Retorna informações da filial atual"""
    filial_sigla = request.args.get('sigla', '').upper()
    
    if not filial_sigla:
        return jsonify({"error": "Sigla da filial não informada"}), 400
    
    logger.info(f'Filial selecionada: {filial_sigla}')
    
    return jsonify({
        "sigla": filial_sigla,
        "timestamp": datetime.now().isoformat()
    })

# Exemplo de API para lidar com /api/live/ws
@app.route('/api/live/ws')
def live_ws():
    logger.info('API /api/live/ws acessada')
    return jsonify({"message": "API v2.0 funcionando!", "version": "2.0"})

# Validação de dados
def validar_ean(ean):
    """Valida formato básico do EAN"""
    if not ean or not isinstance(ean, str):
        return False
    # Remove espaços
    ean = ean.strip()
    # Verifica se contém apenas dígitos
    if not ean.isdigit():
        return False
    # Verifica comprimento (EAN-8, EAN-13, ou com dígitos extras)
    if len(ean) < 8 or len(ean) > 20:
        return False
    return True

def validar_ctrc(ctrc):
    """Valida formato básico do CTRC"""
    if not ctrc or not isinstance(ctrc, str):
        return False
    return len(ctrc.strip()) > 0

# Rota para favicon e outros arquivos na raiz se necessário
@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.static_folder, 'img'), 'binho.ico')

@app.errorhandler(404)
def page_not_found(e):
    logger.warning(f'Página não encontrada: {request.url}')
    return jsonify({
        "error": "Página não encontrada",
        "status": 404,
        "path": request.path
    }), 404

@app.errorhandler(500)
def internal_error(e):
    logger.error(f'Erro interno do servidor: {str(e)}')
    return jsonify({
        "error": "Erro interno do servidor",
        "status": 500,
        "message": str(e)
    }), 500

# Middleware para log de requisições
@app.before_request
def log_request():
    logger.info(f'{request.method} {request.path} - IP: {request.remote_addr}')

@app.after_request
def log_response(response):
    logger.info(f'{request.method} {request.path} - Status: {response.status_code}')
    
    # Adiciona headers para desabilitar cache
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    
    return response

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    logger.info(f'Iniciando servidor Picking v2.0 na porta {port}')
    app.run(host='0.0.0.0', port=port, debug=False)
