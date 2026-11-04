
import sqlite3
import os
import json
import joblib
import numpy as np
import pandas as pd

from sklearn.ensemble import ExtraTreesRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# -----------------------------
# CONFIGURATION
# -----------------------------

DB_PATH = "glacier.db"
MODEL_DIR = "ml_models"

os.makedirs(MODEL_DIR, exist_ok=True)

MODEL_PATH = os.path.join(MODEL_DIR, "environment_model.joblib")
METRICS_PATH = os.path.join(MODEL_DIR, "environment_metrics.json")

SENSORS = [
    "air_temperature",
    "humidity",
    "water_temperature"
]

LAGS = [1, 2, 3, 6, 12]

# -----------------------------
# LOAD REAL ESP32 DATA
# -----------------------------

print("\nGLACIERA ENVIRONMENTAL ML TRAINING")
print("=" * 45)

conn = sqlite3.connect(DB_PATH)

df = pd.read_sql_query("""
    SELECT
        air_temperature,
        humidity,
        water_temperature,
        created_at
    FROM sensor_readings
    WHERE created_at IS NOT NULL
    ORDER BY created_at ASC
""", conn)

conn.close()

if len(df) < 100:
    raise ValueError("Not enough sensor records for training.")

df["created_at"] = pd.to_datetime(
    df["created_at"], errors="coerce"
)

df = df.dropna(subset=["created_at"])

for col in SENSORS:
    df[col] = pd.to_numeric(df[col], errors="coerce")

df = df.dropna(subset=SENSORS)

# Keep valid environmental measurements.
# Zero is preserved because it can be a genuine reading.

print("Records loaded:", len(df))
print("First timestamp:", df["created_at"].min())
print("Last timestamp:", df["created_at"].max())

# -----------------------------
# CREATE TIME-SERIES FEATURES
# -----------------------------

data = df[SENSORS].copy()

features = pd.DataFrame(index=df.index)

for sensor in SENSORS:
    for lag in LAGS:
        features[f"{sensor}_lag_{lag}"] = data[sensor].shift(lag)

    features[f"{sensor}_mean_6"] = (
        data[sensor].shift(1).rolling(6).mean()
    )

    features[f"{sensor}_mean_12"] = (
        data[sensor].shift(1).rolling(12).mean()
    )

    features[f"{sensor}_std_6"] = (
        data[sensor].shift(1).rolling(6).std()
    )

# Next recorded sensor observation is the target.
targets = data.shift(-1)
targets.columns = [f"next_{col}" for col in SENSORS]

dataset = pd.concat([features, targets], axis=1)
dataset = dataset.replace([np.inf, -np.inf], np.nan).dropna()

if len(dataset) < 100:
    raise ValueError("Insufficient usable rows after feature creation.")

X = dataset[features.columns]
y = dataset[targets.columns]

print("Training samples:", len(dataset))
print("Input features:", len(X.columns))

# -----------------------------
# CHRONOLOGICAL TRAIN/TEST SPLIT
# -----------------------------

split = int(len(dataset) * 0.80)

X_train = X.iloc[:split]
X_test = X.iloc[split:]

y_train = y.iloc[:split]
y_test = y.iloc[split:]

# -----------------------------
# TRAIN MODEL
# -----------------------------

print("\nTraining Extra Trees model...")

model = ExtraTreesRegressor(
    n_estimators=200,
    max_depth=12,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1
)

model.fit(X_train, y_train)

# -----------------------------
# EVALUATE MODEL
# -----------------------------

predictions = model.predict(X_test)

metrics = {}

for i, sensor in enumerate(SENSORS):
    actual = y_test.iloc[:, i]
    predicted = predictions[:, i]

    mae = mean_absolute_error(actual, predicted)
    rmse = np.sqrt(mean_squared_error(actual, predicted))

    r2 = (
        r2_score(actual, predicted)
        if len(actual) > 1
        else None
    )

    metrics[sensor] = {
        "MAE": round(float(mae), 4),
        "RMSE": round(float(rmse), 4),
        "R2": round(float(r2), 4) if r2 is not None else None
    }

    print(f"\n{sensor}")
    print("MAE:", round(float(mae), 4))
    print("RMSE:", round(float(rmse), 4))
    print("R2:", metrics[sensor]["R2"])

# -----------------------------
# SAVE MODEL AND METADATA
# -----------------------------

artifact = {
    "model": model,
    "features": list(X.columns),
    "sensors": SENSORS,
    "lags": LAGS,
    "trained_records": len(dataset),
    "training_samples": len(X_train),
    "testing_samples": len(X_test),
    "last_training_timestamp": str(df["created_at"].max()),
    "prediction_target": "next_sensor_observation"
}

joblib.dump(artifact, MODEL_PATH)

with open(METRICS_PATH, "w", encoding="utf-8") as file:
    json.dump(metrics, file, indent=4)

print("\n" + "=" * 45)
print("TRAINING COMPLETED")
print("Model saved:", MODEL_PATH)
print("Metrics saved:", METRICS_PATH)
print("Prediction target: next sensor observation")
print("=" * 45)
