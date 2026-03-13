import joblib
from sklearn.ensemble import RandomForestClassifier
import os
import copy

def create_aggregated_model(model1_path, model2_path, output_path):
    """
    Combines two local Random Forest models into a single global model
    by injecting the trees of model2 into a copy of model1.
    """
    try:
        # Load the two local picked files
        if not os.path.exists(model1_path) or not os.path.exists(model2_path):
            return {"status": "error", "message": "One or both local model files are missing on the central server."}

        model1 = joblib.load(model1_path)
        model2 = joblib.load(model2_path)

        # Standard check: Are they actually picked models of the same type?
        if not isinstance(model1, RandomForestClassifier) or not isinstance(model2, RandomForestClassifier):
            return {"status": "error", "message": "The picked files must contain RandomForestClassifier models."}

        # --- THE FIX: DONOR MODEL STRATEGY ---
        # 1. Make a deep copy of model1 to act as our "donor" shell. 
        # This preserves all the internal scikit-learn metadata (like .classes_ and .n_features_in_).
        global_model = copy.deepcopy(model1)
        
        # 2. Combine the trees (estimators) from both models
        combined_estimators = model1.estimators_ + model2.estimators_
        
        # 3. Inject the combined trees into the donor model
        global_model.estimators_ = combined_estimators
        global_model.n_estimators = len(combined_estimators)

        # Ensure directory exists and save the new picked file
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        joblib.dump(global_model, output_path)
        
        return {
            "status": "success", 
            "message": f"Federated Averaging complete. New global model v2 (Aggregated) with {global_model.n_estimators} trees saved as {os.path.basename(output_path)}."
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}