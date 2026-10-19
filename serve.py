"""Loopback preview server that refreshes the photograph catalog on request."""
import argparse
import errno
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import threading
from urllib.parse import urlsplit
from build_gallery import ROOT, build

lock = threading.Lock()

class GalleryHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        path = urlsplit(self.path).path
        if path.startswith(('/saiphotobook.env/', '/.git/', '/.vscode/')):
            self.send_error(404)
            return
        if path in {'/', '/index.html', '/photos.js', '/catalog.json'}:
            with lock:
                build()
        try:
            super().do_GET()
        except (BrokenPipeError, ConnectionResetError):
            pass

    def end_headers(self):
        if urlsplit(self.path).path in {'/', '/index.html', '/photos.js', '/catalog.json', '/assets/js/script.js', '/assets/js/animations.js'}:
            self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def log_message(self, format, *args):
        if len(args) > 1 and str(args[1]) not in {'200', '304'}:
            super().log_message(format, *args)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8000)
    args = parser.parse_args()
    build()
    try:
        server = ThreadingHTTPServer(('127.0.0.1', args.port), GalleryHandler)
    except OSError as error:
        if error.errno != errno.EADDRINUSE:
            raise
        server = ThreadingHTTPServer(('127.0.0.1', 0), GalleryHandler)
    print(f'Photo book ready: http://127.0.0.1:{server.server_port}/', flush=True)
    print('Drop photos into nature, landscapes, life, or recent. Changes appear within five seconds.', flush=True)
    print('Keep this window open. Press Control+C to stop.', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
