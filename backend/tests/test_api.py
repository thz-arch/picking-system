import pytest
import sys
import os

# Adiciona o diretório backend ao sys.path para importar o app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app_v2 import app
import app_v2

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_health(client):
    """Testa o endpoint de health check"""
    rv = client.get('/api/health')
    json_data = rv.get_json()
    assert rv.status_code == 200
    assert json_data['status'] == 'ok'

def test_config(client):
    """Testa o endpoint de configuração"""
    rv = client.get('/api/config')
    json_data = rv.get_json()
    assert rv.status_code == 200
    assert 'API_URL' in json_data
    assert json_data['VERSION'] == '2.0'

def test_filiais(client):
    """Testa o endpoint de listagem de filiais"""
    rv = client.get('/api/filiais')
    json_data = rv.get_json()
    assert rv.status_code == 200
    assert isinstance(json_data, list)
    assert len(json_data) > 0
    assert json_data[0]['sigla'] == 'GYN'


def test_api_webhook_proxy(client, monkeypatch):
    """Testa o proxy para /api/webhook usando mock de requests"""
    class DummyResp:
        def __init__(self):
            self.content = b'{"ok": true}'
            self.status_code = 200
            self.raw = type('r', (), {'headers': {'content-type': 'application/json'}})()
            self.headers = {'content-type': 'application/json'}

    def fake_request(method, url, headers=None, data=None, cookies=None, allow_redirects=False, stream=False, **kwargs):
        return DummyResp()

    monkeypatch.setattr(app_v2.requests, 'request', fake_request)

    rv = client.get('/api/webhook/test-path')
    assert rv.status_code == 200


def test_ssw_proxy(client, monkeypatch):
    """Testa o proxy para /ssw usando mock de requests"""
    class DummyResp:
        def __init__(self):
            self.content = b'OK'
            self.status_code = 200
            self.raw = type('r', (), {'headers': {'content-type': 'text/plain'}})()
            self.headers = {'content-type': 'text/plain'}

    def fake_request(method, url, headers=None, data=None, cookies=None, allow_redirects=False, stream=False, **kwargs):
        return DummyResp()

    monkeypatch.setattr(app_v2.requests, 'request', fake_request)

    rv = client.get('/ssw/some/path')
    assert rv.status_code == 200


def test_vite_internal_endpoints(client, monkeypatch):
    """Testa o proxy para endpoints internos do Vite"""
    class DummyRespHTML:
        def __init__(self):
            self.content = b'<html></html>'
            self.status_code = 200
            self.raw = type('r', (), {'headers': {'content-type': 'text/html'}})()
            self.headers = {'content-type': 'text/html'}

    class DummyRespJS:
        def __init__(self):
            self.content = b'console.log(1)'
            self.status_code = 200
            self.raw = type('r', (), {'headers': {'content-type': 'application/javascript'}})()
            self.headers = {'content-type': 'application/javascript'}

    def fake_request(method, url, headers=None, data=None, cookies=None, allow_redirects=False, stream=False, **kwargs):
        if '@react-refresh' in url:
            return DummyRespHTML()
        if url.endswith('/src/main.jsx') or '/src/' in url:
            return DummyRespJS()
        return DummyRespHTML()

    monkeypatch.setattr(app_v2.requests, 'request', fake_request)

    rv = client.get('/@react-refresh')
    assert rv.status_code == 200

    rv = client.get('/src/main.jsx')
    assert rv.status_code == 200

    rv = client.get('/@vite/client')
    assert rv.status_code == 200


def test_proxy_gzip_decompression(client, monkeypatch):
    """Testa que a proxy descomprime respostas gzip antes de repassar"""
    import gzip as _gzip

    class DummyGzipResp:
        def __init__(self):
            raw = b'{"ok": true}'
            self.content = _gzip.compress(raw)
            self.status_code = 200
            self.headers = {'content-type': 'application/json', 'content-encoding': 'gzip'}

    def fake_request(method, url, headers=None, data=None, cookies=None, allow_redirects=False, stream=False, timeout=None, **kwargs):
        return DummyGzipResp()

    monkeypatch.setattr(app_v2.requests, 'request', fake_request)

    rv = client.get('/api/webhook/test-gzip')
    assert rv.status_code == 200
    json_data = rv.get_json()
    assert json_data and json_data.get('ok') is True


def test_proxy_retries_until_json(client, monkeypatch):
    """Se o upstream retornar algo não JSON inicialmente, o proxy deve retry e aceitar quando virar JSON"""
    class Resp1:
        def __init__(self):
            self.content = b'NOT_JSON'
            self.status_code = 200
            self.headers = {'content-type': 'application/json'}

    class Resp2:
        def __init__(self):
            self.content = b'[{"ok": true}]'
            self.status_code = 200
            self.headers = {'content-type': 'application/json'}

    calls = {'n': 0}
    def fake_request(method, url, headers=None, data=None, cookies=None, allow_redirects=False, stream=False, timeout=None, **kwargs):
        calls['n'] += 1
        if calls['n'] == 1:
            return Resp1()
        else:
            return Resp2()

    monkeypatch.setattr(app_v2.requests, 'request', fake_request)

    rv = client.get('/api/webhook/test-retry')
    assert rv.status_code == 200
    # agora deve devolver JSON parseável (array)
    assert rv.get_json() and isinstance(rv.get_json(), list) and rv.get_json()[0].get('ok') is True
    assert calls['n'] >= 2


def test_proxy_forwards_gzip_when_decompress_fails(client, monkeypatch):
    """Se a descompressão falhar, o proxy deve repassar Content-Encoding: gzip para o cliente"""
    class DummyBrokenGzipResp:
        def __init__(self):
            # conteúdo inicia com bytes de GZIP, mas imaginemos que algo esteja corrompido
            self.content = b'\x1f\x8b' + b'BROKEN'
            self.status_code = 200
            self.headers = {}

    def fake_request(method, url, headers=None, data=None, cookies=None, allow_redirects=False, stream=False, timeout=None, **kwargs):
        return DummyBrokenGzipResp()

    # simula falha no gzip.decompress
    monkeypatch.setattr(app_v2, 'gzip', type('g', (), {'decompress': lambda x: (_ for _ in ()).throw(Exception('broken'))}))
    monkeypatch.setattr(app_v2.requests, 'request', fake_request)

    rv = client.get('/api/webhook/test-broken-gzip')
    assert rv.status_code == 200
    # Deve repassar header Content-Encoding: gzip para o cliente
    assert 'Content-Encoding' in rv.headers and rv.headers['Content-Encoding'].lower() == 'gzip'
