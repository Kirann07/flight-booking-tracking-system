from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np

app = Flask(__name__)
CORS(app)

# Load trained model
with open("model.pkl", "rb") as f:
    model = pickle.load(f)

# Convert cab type to number
cab_map = {
    "bike": 0,
    "auto": 1,
    "cab": 2
}

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json

    distance = data.get("distance")
    cab_type = data.get("cab_type")
    hour = data.get("hour")
    demand = data.get("demand")

    # Convert cab type
    cab_type_num = cab_map.get(cab_type, 2)

    # Prepare input
    features = np.array([[distance, cab_type_num, hour, demand]])

    # Predict
    price = model.predict(features)[0]

    return jsonify({
        "predicted_price": round(price)
    })

if __name__ == "__main__":
    app.run(debug=True)