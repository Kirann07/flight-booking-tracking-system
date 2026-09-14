import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
import pickle

# Load dataset
df = pd.read_csv("cab_data.csv")

# Convert cab_type (text → number)
df["cab_type"] = df["cab_type"].map({
    "bike": 0,
    "auto": 1,
    "cab": 2
})

# Features (inputs)
X = df[["distance", "cab_type", "hour", "demand"]]

# Target (output)
y = df["price"]

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# Train model
model = LinearRegression()
model.fit(X_train, y_train)

# Save model
with open("model.pkl", "wb") as f:
    pickle.dump(model, f)

print("Model trained and saved as model.pkl")