from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
# Allow React to communicate with this server
CORS(app)

@app.route('/api/status', methods=['GET'])
def get_status():
    return jsonify({
        "server": "Space-2 Campus-2",
        "status": "Online",
        "message": "Standing by for local Set-3 training."
    })

if __name__ == '__main__':
    # Running on Port 5002 to avoid conflicts
    app.run(debug=True, port=5002)