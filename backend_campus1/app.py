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

# DIRECTORY CONFIG
MODELS_DIR = os.path.join(os.getcwd(), 'models')
os.makedirs(MODELS_DIR, exist_ok=True)
GLOBAL_MODEL_SAVE_PATH = os.path.join(MODELS_DIR, 'main_model.pkl')

# --- HELPER: GET NEXT VERSION NUMBER ---
def get_next_version():
    existing_files = glob.glob(os.path.join(MODELS_DIR, 'local_model_campus1_v*.pkl'))
    versions = []
    for f in existing_files:
        try:
            # Extract number from "local_model_campus1_vX.pkl"
            basename = os.path.basename(f)
            v_str = basename.replace('local_model_campus1_v', '').replace('.pkl', '')
            versions.append(int(v_str))
        except ValueError:
            pass
    return max(versions) + 1 if versions else 1


@app.route('/api/status', methods=['GET'])
def get_status():
    return jsonify({"status": "Online", "message": "Campus 1 Node Active"}), 200

# --- CENTRAL AGGREGATION VIEWS ---
@app.route('/api/download_model', methods=['GET'])
def download_model():
    # Central Hub expects this exact file name without the version tag
    filename = 'local_model_campus1.pkl' 
    return send_from_directory(MODELS_DIR, filename, as_attachment=True)

@app.route('/api/retrieve_global_model', methods=['GET'])
def retrieve_global_model():
    main_hub_url = "http://localhost:5000/api/download_global_model"
    try:
        response = requests.get(main_hub_url)
        if response.status_code == 200:
            with open(GLOBAL_MODEL_SAVE_PATH, 'wb') as f:
                f.write(response.content)
            return jsonify({"status": "success", "message": "Successfully downloaded the aggregated global model. Ready for evaluation."}), 200
        else:
            return jsonify({"status": "error", "message": "Failed to download global model from central hub. Ensure aggregation is complete."}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": f"Network Error contacting main hub: {str(e)}"}), 500

# --- NEW: EVALUATE GLOBAL MODEL ---
@app.route('/api/evaluate', methods=['POST'])
def evaluate_model():
    data = request.json or {}
    sample_size = data.get('sample_size', 50)

    if not os.path.exists(GLOBAL_MODEL_SAVE_PATH):
        return jsonify({"status": "error", "message": "Global model not found. Retrieve it first."}), 404

    try:
        # Load the global model using joblib
        global_model = joblib.load(GLOBAL_MODEL_SAVE_PATH)

        # Load your actual test dataset
        test_path = os.path.join(os.getcwd(), 'set2_test.csv') # Or set2_test.csv depending on your file!
        df_test = pd.read_csv(test_path)

        # Take the requested number of samples
        df_sample = df_test.head(sample_size)

        # Assuming the last column in your CSV is the target/label
        X_test = df_sample.iloc[:, :-1]
        y_test = df_sample.iloc[:, -1]

        # Evaluate (We use .values to strip feature names and prevent warnings)
        preds = global_model.predict(X_test.values)
        
        acc = accuracy_score(y_test, preds)
        f1 = f1_score(y_test, preds, average='weighted')

        return jsonify({
            "status": "success",
            "global_metrics": {
                "accuracy": round(acc, 4),
                "f1": round(f1, 4)
            }
        }), 200
        
    except AttributeError as e:
        # THIS CATCHES THE EMPTY MODEL ERROR!
        if "n_classes_" in str(e) or "estimators_" in str(e):
            return jsonify({
                "status": "error", 
                "message": "Global model is untrained. Please retrain local nodes and aggregate on the Hub first!"
            }), 400
        return jsonify({"status": "error", "message": str(e)}), 500
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# --- MODIFIED: LOCAL TRAINING SEQUENCE ---
@app.route('/api/retrain', methods=['POST'])
def train_model():
    latest_filename = 'local_model_campus1.pkl'
    latest_path = os.path.join(MODELS_DIR, latest_filename)
    
    test_path = os.path.join(os.getcwd(), 'set2_test.csv')
    dataset_path = os.path.join(os.getcwd(), 'set2_train.csv')
    
    # 1. Run your existing training logic, saving to the standard filename
    result = run_local_training(dataset_path, test_path, latest_path)
    
    if result["status"] == "success":
        # 2. Figure out the next version number and create a historical copy
        next_v = get_next_version()
        versioned_filename = f'local_model_campus1_v{next_v}.pkl'
        versioned_path = os.path.join(MODELS_DIR, versioned_filename)
        
        shutil.copy(latest_path, versioned_path)

        # 3. Format the response so the React frontend maps the metrics perfectly
        # We grab the dictionary that was ALREADY created in training_logic.py
        training_metrics = result.get("local_metrics", {})

        return jsonify({
            "status": "success",
            "message": f"Local model retrained and historically saved as v{next_v}.",
            "local_metrics": {
                # We pull from training_metrics, or default to 0 if not found
                "accuracy": training_metrics.get("accuracy", 0),
                "f1": training_metrics.get("f1", 0) 
            }
        }), 200
    else:
        return jsonify(result), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)