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
