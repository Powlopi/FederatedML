import joblib
from sklearn.ensemble import RandomForestClassifier
import os
import copy

def create_aggregated_model(model1_path, model2_path, output_path):
    
    try:
        # Load the two local picked files
        if not os.path.exists(model1_path) or not os.path.exists(model2_path):
            return {"status": "error", "message": "One or both local model files are missing on the central server."}

        model1 = joblib.load(model1_path)
        model2 = joblib.load(model2_path)

        if not isinstance(model1, RandomForestClassifier) or not isinstance(model2, RandomForestClassifier):
            return {"status": "error", "message": "The picked files must contain RandomForestClassifier models."}

        global_model = copy.deepcopy(model1)
        
        combined_estimators = model1.estimators_ + model2.estimators_
        
        global_model.estimators_ = combined_estimators
        global_model.n_estimators = len(combined_estimators)

        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        joblib.dump(global_model, output_path)
        
        return {
            "status": "success", 
            "message": f"Federated Averaging complete. New global model v2 (Aggregated) with {global_model.n_estimators} trees saved as {os.path.basename(output_path)}."
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}