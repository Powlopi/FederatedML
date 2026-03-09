from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
# Allow React to communicate with this server
CORS(app)

@app.route('/api/status', methods=['GET'])
def get_status():
    return jsonify({
        "server": "Central Cloud-1 (Main Server)",
        "status": "Online",
        "message": "Ready to distribute and aggregate models!"
    })

if __name__ == '__main__':
    # Running on Port 5000 (The default Flask port)
    app.run(debug=True, port=5000)