from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
from training_logic import run_local_training
import os
import requests
import glob
import shutil
import pandas as pd
import pickle
import joblib
from sklearn.metrics import accuracy_score, f1_score

app = Flask(__name__)
CORS(app)

# --- DIRECTORY CONFIG ---
MODELS_DIR = os.path.join(os.getcwd(), 'models')
os.makedirs(MODELS_DIR, exist_ok=True)
GLOBAL_MODEL_SAVE_PATH = os.path.join(MODELS_DIR, 'main_model.pkl')

# --- NETWORKING CONFIG ---
# Points to the Main Hub. Defaults to localhost for local dev.
MAIN_HUB_URL = os.getenv("MAIN_HUB_URL", "https://main-hub.railway.internal:5000")

# --- HELPER: GET NEXT VERSION NUMBER ---
def get_next_version():
    existing_files = glob.glob(os.path.join(MODELS_DIR, 'local_model_campus1_v*.pkl'))
    versions = []
    for f in existing_files:
        try:
            basename = os.path.basename(f)
            v_str = basename.replace('local_model_campus2_v', '').replace('.pkl', '')
            versions.append(int(v_str))
        except ValueError:
            pass
    return max(versions) + 1 if versions else 1

@app.route('/api/status', methods=['GET'])
def get_status():
    return jsonify({"status": "Online", "message": "Campus 2 Node Active"}), 200

@app.route('/api/download_model', methods=['GET'])
def download_model():
    # File name expected by the Main Hub
    filename = 'local_model_campus2.pkl' 
    return send_from_directory(MODELS_DIR, filename, as_attachment=True)

@app.route('/api/retrieve_global_model', methods=['GET'])
def retrieve_global_model():
    # Dynamic URL using the environment variable
    target_url = f"{MAIN_HUB_URL}/api/download_global_model"
    try:
        response = requests.get(target_url)
        if response.status_code == 200:
            with open(GLOBAL_MODEL_SAVE_PATH, 'wb') as f:
                f.write(response.content)
            return jsonify({"status": "success", "message": "Global model downloaded to Campus 2."}), 200
        else:
            return jsonify({"status": "error", "message": "Global model not found on Hub."}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": f"Connection Error: {str(e)}"}), 500

@app.route('/api/evaluate', methods=['POST'])
def evaluate_model():
    data = request.json or {}
    
    # 1. DYNAMIC TYPE CASTING: Converts whatever the UI sends into a safe integer.
    try:
        # Grab the sample_size, default to 100 if missing, and FORCE it to be an int
        raw_size = data.get('sample_size', 100)
        sample_size = int(raw_size)
        
        # Security check: Prevent 0 or negative numbers
        if sample_size <= 0:
            sample_size = 100 
    except (ValueError, TypeError):
        # Fallback just in case bad data (like text) gets sent
        sample_size = 100

    if not os.path.exists(GLOBAL_MODEL_SAVE_PATH):
        return jsonify({"status": "error", "message": "No Global model to evaluate."}), 404

    try:
        global_model = joblib.load(GLOBAL_MODEL_SAVE_PATH)
        
        # NOTE: Make sure this file matches the campus!
        # Campus 1 = 'set2_test.csv', Campus 2 = 'set3_test.csv'
        test_path = os.path.join(os.getcwd(), 'set3_test.csv') 
        df_test = pd.read_csv(test_path)
        
        # 2. DYNAMIC SLICING: Safely slice the exact number requested
        df_sample = df_test.head(sample_size)

        X_test = df_sample.iloc[:, :-1]
        y_test = df_sample.iloc[:, -1]

        preds = global_model.predict(X_test.values)
        acc = accuracy_score(y_test, preds)
        f1 = f1_score(y_test, preds, average='weighted')

        return jsonify({
            "status": "success",
            "samples_tested": len(df_sample), # Tell the frontend exactly how many we tested
            "global_metrics": {"accuracy": round(acc, 4), "f1": round(f1, 4)}
        }), 200
        
    except Exception as e:
        print(f"EVALUATION CRASH: {str(e)}") # Prints exactly what went wrong in Railway logs
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/retrain', methods=['POST'])
def train_model():
    latest_filename = 'local_model_campus2.pkl'
    latest_path = os.path.join(MODELS_DIR, latest_filename)
    test_path = os.path.join(os.getcwd(), 'set3_test.csv')
    dataset_path = os.path.join(os.getcwd(), 'set3_train.csv')
    
    result = run_local_training(dataset_path, test_path, latest_path)
    
    if result["status"] == "success":
        next_v = get_next_version()
        versioned_path = os.path.join(MODELS_DIR, f'local_model_campus2_v{next_v}.pkl')
        shutil.copy(latest_path, versioned_path)
        return jsonify(result), 200
    return jsonify(result), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5002))
    app.run(host='0.0.0.0', port=port)