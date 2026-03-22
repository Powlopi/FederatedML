from flask import Flask, jsonify, send_file
from flask_cors import CORS
from aggregation_logic import create_aggregated_model
import os
import requests
import pandas as pd
import pickle
import joblib
import datetime
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

app = Flask(__name__)
CORS(app)

# --- DIRECTORY CONFIG ---
MODELS_DIR = os.path.join(os.getcwd(), 'models')
os.makedirs(MODELS_DIR, exist_ok=True)

LOCAL_MODEL_1_PATH = os.path.join(MODELS_DIR, 'local_model_campus1.pkl')
LOCAL_MODEL_2_PATH = os.path.join(MODELS_DIR, 'local_model_campus2.pkl')
GLOBAL_MODEL_PATH = os.path.join(MODELS_DIR, 'main_model_v2.pkl')

# --- CAMPUS NETWORKING CONFIG ---
CAMPUS_1_URL = os.getenv("CAMPUS_1_URL", "http://campus-1.railway.internal:5001")
CAMPUS_2_URL = os.getenv("CAMPUS_2_URL", "http://campus-2.railway.internal:5002")

# --- STATUS ROUTE ---
@app.route('/api/status', methods=['GET'])
def get_status():
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
    Connects to a campus node and pulls its pickled model file to the central server.
    """
    # Mapping IDs to the dynamic URLs defined at the top
    url_map = {"1": CAMPUS_1_URL, "2": CAMPUS_2_URL}
    path_map = {"1": LOCAL_MODEL_1_PATH, "2": LOCAL_MODEL_2_PATH}
    
    if campus_id not in url_map:
        return jsonify({"status": "error", "message": "Invalid Campus ID"}), 400
    
    # Construct the endpoint URL for the specific campus
    campus_endpoint = f"{url_map[campus_id]}/api/download_model"
    local_save_path = path_map[campus_id]

    try:
        # Download the pickled file
        response = requests.get(campus_endpoint)
        
        if response.status_code == 200:
            with open(local_save_path, 'wb') as f:
                f.write(response.content)
            return jsonify({"status": "success", "message": f"Successfully retrieved local model for Campus {campus_id}."}), 200
        else:
            return jsonify({"status": "error", "message": f"Failed to retrieve model from {campus_endpoint}."}), 500
            
    except Exception as e:
        return jsonify({"status": "error", "message": f"Network Error contacting Campus {campus_id}: {str(e)}"}), 500

@app.route('/api/download_global_model', methods=['GET'])
def download_global_model():
    try:
        if not os.path.exists(GLOBAL_MODEL_PATH):
            return {"error": "Global model not found on server."}, 404
        return send_file(GLOBAL_MODEL_PATH, as_attachment=True)
    except Exception as e:
        return {"error": str(e)}, 500

# --- FEDERATED AVERAGING ROUTE ---
@app.route('/api/aggregate_models', methods=['GET'])
def aggregate_models():
    if not (os.path.exists(LOCAL_MODEL_1_PATH) and os.path.exists(LOCAL_MODEL_2_PATH)):
        return jsonify({"status": "error", "message": "Both models must be retrieved first."}), 400

    result = create_aggregated_model(LOCAL_MODEL_1_PATH, LOCAL_MODEL_2_PATH, GLOBAL_MODEL_PATH)
    return jsonify(result), (200 if result["status"] == "success" else 500)

@app.route('/api/metrics', methods=['GET'])
def get_all_metrics():
    test_data_path = os.path.join(os.getcwd(), 'global_test.csv') 
    if not os.path.exists(test_data_path):
        return jsonify({"error": "global_test.csv not found on the server."}), 404

    try:
        df = pd.read_csv(test_data_path)
        X_test = df.iloc[:, :-1]
        y_test = df.iloc[:, -1]

        def evaluate_model(path, model_id, name, status_label):
            if not os.path.exists(path):
                return {"id": model_id, "name": name, "accuracy": "0.0000", "status": "Awaiting Data"}
            
            model = joblib.load(path)
            predictions = model.predict(X_test)
            acc = accuracy_score(y_test, predictions)
            prec = precision_score(y_test, predictions, average='weighted', zero_division=0)
            rec = recall_score(y_test, predictions, average='weighted', zero_division=0)
            f1 = f1_score(y_test, predictions, average='weighted', zero_division=0)
            
            return {
                "id": model_id, "name": name, "accuracy": f"{acc:.4f}",
                "precision": f"{prec:.4f}", "recall": f"{rec:.4f}",
                "f1": f"{f1:.4f}", "status": status_label
            }

        MAIN_MODEL_V1_PATH = os.path.join(os.getcwd(), 'main_model.pkl')

        metrics_data = [
            evaluate_model(MAIN_MODEL_V1_PATH, 1, "Main Model v1", "Baseline"),
            evaluate_model(LOCAL_MODEL_1_PATH, 2, "Campus-1 v2", "Local Node"),
            evaluate_model(LOCAL_MODEL_2_PATH, 3, "Campus-2 v2", "Local Node"),
            evaluate_model(GLOBAL_MODEL_PATH,  4, "Main Model v2", "Global Result")
        ]
        return jsonify(metrics_data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/global_metrics', methods=['GET'])
def get_global_metrics():
    if not os.path.exists(GLOBAL_MODEL_PATH):
        return jsonify({"status": "error", "message": "Global model not found."}), 404

    test_data_path = os.path.join(os.getcwd(), 'global_test.csv') 
    if not os.path.exists(test_data_path):
        return jsonify({"status": "success", "version": "RFC v2.0", "accuracy": "--", "message": "No test data found."})

    try:
        model = joblib.load(GLOBAL_MODEL_PATH)
        df = pd.read_csv(test_data_path)
        X_test = df.iloc[:, :-1]
        y_test = df.iloc[:, -1]

        predictions = model.predict(X_test)
        acc = accuracy_score(y_test, predictions)
        f1 = f1_score(y_test, predictions, average='weighted')

        timestamp = os.path.getmtime(GLOBAL_MODEL_PATH)
        dt_object = datetime.datetime.fromtimestamp(timestamp)
        formatted_time = dt_object.strftime("%B %d, %Y • %I:%M %p")

        return jsonify({
            "status": "success", "version": "RFC v2.0", 
            "accuracy": acc, "f1": f1, "last_sync": formatted_time
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)