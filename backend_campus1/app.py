from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from training_logic import run_local_training
import os
import requests

app = Flask(__name__)
CORS(app)

# DIRECTORY CONFIG
MODELS_DIR = os.path.join(os.getcwd(), 'models')
os.makedirs(MODELS_DIR, exist_ok=True)
GLOBAL_MODEL_SAVE_PATH = os.path.join(MODELS_DIR, 'main_model.pkl')

@app.route('/api/status', methods=['GET'])
def get_status():
    # You can customize the message for Campus 1/2
    return jsonify({"status": "Online", "message": "Campus 1 Worker Node Active"}), 200

# --- MODIFIED: CENTRAL AGGREGATION VIEWS ---
@app.route('/api/download_model', methods=['GET'])
def download_model():
    directory = MODELS_DIR
    # Ensure to use the correct local picked filename for each campus
    # i.e., local_model_campus1.pkl OR local_model_campus2.pkl
    filename = 'local_model_campus1.pkl' 
    return send_from_directory(directory, filename, as_attachment=True)

@app.route('/api/retrieve_global_model', methods=['GET'])
def retrieve_global_model():
    """
    Triggered from the frontend to have the node download the new global model.
    """
    main_hub_url = "http://localhost:5000/api/download_global_model"
    try:
        response = requests.get(main_hub_url)
        if response.status_code == 200:
            with open(GLOBAL_MODEL_SAVE_PATH, 'wb') as f:
                f.write(response.content)
            return jsonify({"status": "success", "message": "Successfully downloaded the aggregated global model v2. ready for retraining. "}), 200
        else:
            return jsonify({"status": "error", "message": "Failed to download global model from central hub. Ensure aggregation is complete."}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": f"Network Error contacting main hub: {str(e)}"}), 500

# --- UNCHANGED: LOCAL TRAINING SEQUENCE ---
@app.route('/api/train', methods=['POST'])
def train_model():
    # Ensure you are pointing to the correct local picked filename for output_model_path
    # i.e., local_model_campus1.pkl OR local_model_campus2.pkl
    output_model_path = os.path.join(MODELS_DIR, 'local_model_campus1.pkl')
    test_path = os.path.join(os.getcwd(),'set2_test.csv')
    dataset_path = os.path.join(os.getcwd(), 'set2_train.csv')
    result = run_local_training(dataset_path, test_path, output_model_path)
    if result["status"] == "success":
        return jsonify(result), 200
    else:
        return jsonify(result), 500

if __name__ == '__main__':
    # Adjust port for each campus node
    app.run(port=5001, debug=True)