from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
# Allow React to communicate with this server
CORS(app)

@app.route('/api/status', methods=['GET'])
def get_status():
    return jsonify({
        "server": "Space-1 Campus-1",
        "status": "Online",
        "message": "Standing by for local Set-2 training."
    })

if __name__ == '__main__':
    # Running on Port 5001 to avoid conflicts
    app.run(debug=True, port=5001)