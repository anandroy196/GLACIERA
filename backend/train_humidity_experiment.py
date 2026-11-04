
import sqlite3
import json
import os
import numpy as np
import pandas as pd
import joblib

from sklearn.ensemble import ExtraTreesRegressor, RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

print("\nGLACIERA HUMIDITY MODEL EXPERIMENT")
print("=" * 45)

# Load original database without modifying it
conn = sqlite3.connect("glacier.db")

df = pd.read_sql_query("""
    SELECT created_at, air_temperature, humidity,
           water_temperature, distance
    FROM sensor_readings
    ORDER BY created_at
""", conn)

conn.close()

# Remove only invalid humidity zero readings.
# Keep high readings for now because they may be genuine.
df = df[df["humidity"].notna() & (df["humidity"] > 0)].copy()

df["created_at"] = pd.to_datetime(df["created_at"])

for col in ["air_temperature", "humidity",
            "water_temperature", "distance"]:
    df[col] = pd.to_numeric(df[col], errors="coerce")

df = df.dropna(subset=[
    "air_temperature", "humidity", "water_temperature"
]).reset_index(drop=True)

# Build past-only features
for col in ["humidity", "air_temperature", "water_temperature"]:
    for lag in [1, 2, 3, 6, 12]:
        df[f"{col}_lag_{lag}"] = df[col].shift(lag)

    df[f"{col}_rolling_mean"] = (
        df[col].shift(1).rolling(6).mean()
    )
    df[f"{col}_rolling_std"] = (
        df[col].shift(1).rolling(6).std()
    )

df["hour"] = df["created_at"].dt.hour
df["minute"] = df["created_at"].dt.minute

df = df.dropna().reset_index(drop=True)

feature_cols = [
    c for c in df.columns
    if "_lag_" in c or "_rolling_" in c
] + ["hour", "minute"]

X = df[feature_cols]
y = df["humidity"]

split = int(len(df) * 0.8)

X_train, X_test = X.iloc[:split], X.iloc[split:]
y_train, y_test = y.iloc[:split], y.iloc[split:]

models = {
    "ExtraTrees": ExtraTreesRegressor(
        n_estimators=300,
        min_samples_leaf=3,
        max_features=0.8,
        random_state=42,
        n_jobs=-1
    ),
    "RandomForest": RandomForestRegressor(
        n_estimators=300,
        min_samples_leaf=3,
        max_features=0.8,
        random_state=42,
        n_jobs=-1
    )
}

results = {}

# Persistence baseline: next reading equals latest reading
baseline = X_test["humidity_lag_1"].to_numpy()

results["Persistence"] = {
    "MAE": float(mean_absolute_error(y_test, baseline)),
    "RMSE": float(np.sqrt(mean_squared_error(y_test, baseline))),
    "R2": float(r2_score(y_test, baseline))
}

best_model = None
best_name = None
best_mae = float("inf")

for name, model in models.items():
    print(f"\nTraining {name}...")

    model.fit(X_train, y_train)
    predictions = model.predict(X_test)

    mae = mean_absolute_error(y_test, predictions)
    rmse = np.sqrt(mean_squared_error(y_test, predictions))
    r2 = r2_score(y_test, predictions)

    results[name] = {
        "MAE": float(mae),
        "RMSE": float(rmse),
        "R2": float(r2)
    }

    print("MAE:", round(mae, 4))
    print("RMSE:", round(rmse, 4))
    print("R2:", round(r2, 4))

    if mae < best_mae:
        best_mae = mae
        best_model = model
        best_name = name

print("\nPERSISTENCE BASELINE")
print(results["Persistence"])

print("\nALL MODEL RESULTS")
print(json.dumps(results, indent=2))

os.makedirs("ml_models", exist_ok=True)

with open("ml_models/humidity_experiment_metrics.json", "w") as f:
    json.dump({
        "best_model": best_name,
        "results": results,
        "records_used": len(df),
        "training_samples": len(X_train),
        "testing_samples": len(X_test),
        "excluded_zero_humidity": True
    }, f, indent=2)

print("\nBest experimental model:", best_name)
# Save experimental humidity model separately
humidity_artifact = {
    "model": best_model,
    "model_name": best_name,
    "features": feature_cols,
    "target": "humidity",
    "records_used": len(df),
    "training_samples": len(X_train),
    "testing_samples": len(X_test),
    "excluded_zero_humidity": True
}

joblib.dump(
    humidity_artifact,
    "ml_models/humidity_experiment_model.joblib"
)

print("Humidity model saved successfully.")
print("Metrics saved successfully.")
print("Original database and original model were not modified.")
