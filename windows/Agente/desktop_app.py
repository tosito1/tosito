import webview
import threading
from app import app
import time

def start_flask():
    app.run(port=5000)

if __name__ == '__main__':
    # Start Flask in a separate thread
    flask_thread = threading.Thread(target=start_flask)
    flask_thread.daemon = True
    flask_thread.start()

    # Give Flask a second to start
    time.sleep(1)

    # Create a nice window
    window = webview.create_window(
        'AEGIS AI | Windows Agent',
        'http://localhost:5000',
        width=1200,
        height=800,
        resizable=True,
        min_size=(800, 600),
        background_color='#0a0a0c'
    )

    # Start the desktop app
    webview.start()
