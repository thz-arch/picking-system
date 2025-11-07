#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Servidor HTTP para Apresentação do Sistema de Picking
Porta: 9000
Autor: Thiago Alves / Analista Dev.
"""

import http.server
import socketserver
import os
import sys
import mimetypes

# Configurações
PORT = 9000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

# Adiciona MIME types para módulos JavaScript
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('application/javascript', '.mjs')
mimetypes.add_type('text/javascript', '.jsx')
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('video/mp4', '.mp4')
mimetypes.add_type('video/webm', '.webm')

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def guess_type(self, path):
        """Sobrescreve para garantir MIME types corretos"""
        mimetype, encoding = mimetypes.guess_type(path)
        
        # Garante que arquivos .js sejam servidos como JavaScript
        if path.endswith('.js') or path.endswith('.mjs'):
            mimetype = 'application/javascript'
        elif path.endswith('.jsx'):
            mimetype = 'text/javascript'
        elif path.endswith('.css'):
            mimetype = 'text/css'
        elif path.endswith('.mp4'):
            mimetype = 'video/mp4'
        elif path.endswith('.webm'):
            mimetype = 'video/webm'
        
        return mimetype, encoding
    
    def end_headers(self):
        # Adiciona headers CORS e cache
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        # Headers para forçar no-cache
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()
    
    def log_message(self, format, *args):
        # Log customizado
        print(f"[{self.log_date_time_string()}] {format % args}")

def run_server():
    """Inicia o servidor HTTP"""
    try:
        with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
            print("=" * 60)
            print("  SERVIDOR DE APRESENTAÇÃO - SISTEMA DE PICKING")
            print("=" * 60)
            print(f"  📊 Porta: {PORT}")
            print(f"  📁 Diretório: {DIRECTORY}")
            print(f"  🌐 URL Local: http://localhost:{PORT}/apresentacao.html")
            print(f"  🌐 URL Rede: http://[SEU-IP]:{PORT}/apresentacao.html")
            print("=" * 60)
            print("  Desenvolvido por: Thiago Alves / Analista Dev.")
            print("=" * 60)
            print("\n⚡ Servidor rodando... Pressione CTRL+C para parar\n")
            
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n\n🛑 Servidor encerrado pelo usuário")
        sys.exit(0)
    except OSError as e:
        if e.errno == 10048:  # Porta em uso (Windows)
            print(f"\n❌ ERRO: Porta {PORT} já está em uso!")
            print("   Feche o outro servidor ou use outra porta.\n")
        else:
            print(f"\n❌ ERRO: {e}\n")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ ERRO INESPERADO: {e}\n")
        sys.exit(1)

if __name__ == "__main__":
    run_server()
