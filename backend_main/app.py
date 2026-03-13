from flask import Flask, jsonify, send_file
from flask_cors import CORS
from aggregation_logic import create_aggregated_model
import os
import requests

app = Flask(__name__)
CORS(app)

# --- DIRECTORY CONFIG ---
MODELS_DIR = os.path.join(os.getcwd(), 'models')
os.makedirs(MODELS_DIR, exist_ok=True)

LOCAL_MODEL_1_PATH = os.path.join(MODELS_DIR, 'local_model_campus1.pkl')
LOCAL_MODEL_2_PATH = os.path.join(MODELS_DIR, 'local_model_campus2.pkl')
GLOBAL_MODEL_PATH = os.path.join(MODELS_DIR, 'main_model_v2.pkl')

# --- STATUS ROUTE ---
@app.route('/api/status', methods=['GET'])
def get_status():
    """
    Returns the network status and model presence for the dashboard.
    """
    return jsonify({
        "status": "Online", 
        "message": "Aggregation Hub Active",
        "models_present": {
            "campus1": os.path.exists(LOCAL_MODEL_1_PATH),
            "campus2": os.path.exists(LOCAL_MODEL_2_PATH),
            "global": os.path.exists(GLOBAL_MODEL_PATH)
        }
    }), 200

# --- MODEL RETRIEVAL ROUTE (PULL) ---
@app.route('/api/retrieve_local_model/<campus_id>', methods=['GET'])
def retrieve_local_model(campus_id):
    """
    Connects to a campus node and pulls its picked model file to the central server.
    """
    port_map = {"1": "5001", "2": "5002"}
    path_map = {"1": LOCAL_MODEL_1_PATH, "2": LOCAL_MODEL_2_PATH}
    
    if campus_id not in port_map:
        return jsonify({"status": "error", "message": "Invalid Campus ID"}), 400
    
    campus_url = f"http://localhost:{port_map[campus_id]}/api/download_model"
    local_save_path = path_map[campus_id]

    try:
        # Download the picked file
        response = requests.get(campus_url)
        
        if response.status_code == 200:
            # Save the file stream locally
            with open(local_save_path, 'wb') as f:
                f.write(response.content)
            return jsonify({"status": "success", "message": f"Successfully retrieved local model for Campus {campus_id} and saved on central server."}), 200
        else:
            return jsonify({"status": "error", "message": f"Failed to retrieve model from Campus {campus_id}."}), 500
            
    except Exception as e:
        return jsonify({"status": "error", "message": f"Network Error contacting Campus {campus_id}: {str(e)}"}), 500

@app.route('/api/download_global_model', methods=['GET'])
def download_global_model():
    try:
        # We use the exact filename from your successful aggregation!
        model_path = os.path.join(os.getcwd(),'models', 'main_model_v2.pkl') 
        
        if not os.path.exists(model_path):
            return {"error": "Global model not found on server."}, 404
            
        from flask import send_file
        return send_file(model_path, as_attachment=True)
    
    except Exception as e:
        return {"error": str(e)}, 500

# --- FEDERATED AVERAGING ROUTE ---
@app.route('/api/aggregate_models', methods=['GET'])
def aggregate_models():
    """
    Triggers the Federated Averaging algorithm to combine local models.
    """
    # Check if we are ready
    if not (os.path.exists(LOCAL_MODEL_1_PATH) and os.path.exists(LOCAL_MODEL_2_PATH)):
        return jsonify({"status": "error", "message": "Federated Averaging is NOT ready. Both Campus 1 and Campus 2 models must be retrieved first."}), 400

    result = create_aggregated_model(LOCAL_MODEL_1_PATH, LOCAL_MODEL_2_PATH, GLOBAL_MODEL_PATH)
    
    if result["status"] == "success":
        # At this stage, we would save the new metrics to EvaluationResults.json.
        return jsonify(result), 200
    else:
        return jsonify(result), 500

if __name__ == '__main__':
    # Aggregation Hub runs on port 5000
    app.run(port=5000, debug=True)
