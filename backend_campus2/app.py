from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
from training_logic import run_local_training
import os
import requests
import glob
import shutil
import pandas as pd
import joblib
from sklearn.metrics import accuracy_score, f1_score

app = Flask(__name__)
CORS(app)

MODELS_DIR = os.path.join(os.getcwd(), 'models')
os.makedirs(MODELS_DIR, exist_ok=True)
GLOBAL_MODEL_SAVE_PATH = os.path.join(MODELS_DIR, 'main_model.pkl')

# --- NETWORKING CONFIG ---
MAIN_HUB_URL = os.getenv("MAIN_HUB_URL", "http://localhost:5000")

def get_next_version():
    existing_files = glob.glob(os.path.join(MODELS_DIR, 'local_model_campus2_v*.pkl'))
    versions = [int(os.path.basename(f).replace('local_model_campus2_v', '').replace('.pkl', '')) for f in existing_files]
    return max(versions) + 1 if versions else 1

@app.route('/api/status', methods=['GET'])
def get_status():
    return jsonify({"status": "Online", "message": "Campus 2 Node Active"}), 200

@app.route('/api/download_model', methods=['GET'])
def download_model():
    filename = 'local_model_campus2.pkl' 
    return send_from_directory(MODELS_DIR, filename, as_attachment=True)

@app.route('/api/retrieve_global_model', methods=['GET'])
def retrieve_global_model():
    target_url = f"{MAIN_HUB_URL}/api/download_global_model"
    try:
        response = requests.get(target_url)
        if response.status_code == 200:
            with open(GLOBAL_MODEL_SAVE_PATH, 'wb') as f:
                f.write(response.content)
            return jsonify({"status": "success", "message": "Global model downloaded to Campus 2."}), 200
        return jsonify({"status": "error", "message": "Global model not found on Hub."}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/evaluate', methods=['POST'])
def evaluate_model():
    data = request.json or {}
    if not os.path.exists(GLOBAL_MODEL_SAVE_PATH):
        return jsonify({"status": "error", "message": "No model found."}), 404
    try:
        global_model = joblib.load(GLOBAL_MODEL_SAVE_PATH)
        df_test = pd.read_csv(os.path.join(os.getcwd(), 'set3_test.csv'))
        df_sample = df_test.head(data.get('sample_size', 50))
        preds = global_model.predict(df_sample.iloc[:, :-1].values)
        acc = accuracy_score(df_sample.iloc[:, -1], preds)
        return jsonify({"status": "success", "global_metrics": {"accuracy": round(acc, 4)}}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/retrain', methods=['POST'])
def train_model():
    latest_path = os.path.join(MODELS_DIR, 'local_model_campus2.pkl')
    result = run_local_training(os.path.join(os.getcwd(), 'set3_train.csv'), 
                                os.path.join(os.getcwd(), 'set3_test.csv'), 
                                latest_path)
    if result["status"] == "success":
        shutil.copy(latest_path, os.path.join(MODELS_DIR, f'local_model_campus2_v{get_next_version()}.pkl'))
        return jsonify(result), 200
    return jsonify(result), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5002))
    app.run(host='0.0.0.0', port=port)