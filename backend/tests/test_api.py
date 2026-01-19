import pytest
import sys
import os

# Adiciona o diretório backend ao sys.path para importar o app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app_v2 import app

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
