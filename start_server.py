"""Start GTO Wizard server on port 8080 to avoid conflict with Hermes."""
import http.server
import json
import os, sys

PORT = 8080

class GTOHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            html = """<html>
<head><title>GTO Wizard Clone</title>
<style>
body{background:#030712;color:#f3f4f6;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;}
h1{font-size:2.5rem;color:#d4af37;margin-bottom:.5rem;}
p{color:#9ca3af;font-size:1.1rem;}
.badge{background:#1f2937;color:#d4af37;padding:4px 12px;border-radius:999px;font-size:.8rem;margin-top:1rem;display:inline-block;}
.stats{margin-top:2rem;text-align:left;background:#1f2937;padding:1rem 1.5rem;border-radius:12px;font-family:monospace;font-size:.9rem;color:#9ca3af;}
.stats span{color:#d4af37;}
</style></head>
<body><div style="text-align:center">
<h1>GTO Wizard Clone</h1>
<p>Training the world's best GTO bots from <span style="color:#d4af37">/tmp/gto-wizard-clone</span></p>
<div class="badge">wiz.codeovertcp.com</div>
<div class="stats">
89 commits &bull; 115 tests &bull; 18 API routers &bull; 6 frontend pages<br>
<span>v0.2.0</span> &bull; <span>89</span> commits on <span>main</span>
</div>
</div></body></html>"""
            self.wfile.write(html.encode())
        elif self.path == '/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "status": "healthy",
                "version": "0.2.0",
                "service": "gto-wizard-clone",
                "domain": "wiz.codeovertcp.com",
                "tunnel": "hermes-webui (93328a7a)",
                "dns": "CNAME -> 93328a7a.cfargotunnel.com"
            }).encode())
        else:
            super().do_GET()
    
    def log_message(self, *a):
        pass

server = http.server.HTTPServer(("0.0.0.0", PORT), GTOHandler)
print(f"GTO Wizard serving on port {PORT}")
server.serve_forever()
