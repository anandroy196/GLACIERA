
import os
import sqlite3
import joblib
import pandas as pd

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/ml", tags=["Machine Learning"])

DB_PATH = "glacier.db"
MODEL_PATH = "ml_models/environment_model.joblib"


def load_model():
    if not os.path.exists(MODEL_PATH):
        return None

    return joblib.load(MODEL_PATH)


@router.get("/status")
def model_status():
    artifact = load_model()

    if artifact is None:
        return {
            "model_available": False,
            "message": "Train the environmental model first."
        }

    return {
        "model_available": True,
        "model": "ExtraTreesRegressor",
        "trained_records": artifact["trained_records"],
        "training_samples": artifact["training_samples"],
        "testing_samples": artifact["testing_samples"],
        "last_training_timestamp": artifact["last_training_timestamp"],
        "prediction_target": artifact["prediction_target"]
    }


@router.get("/metrics")
def model_metrics():
    path = "ml_models/environment_metrics.json"

    if not os.path.exists(path):
        raise HTTPException(404, "Model metrics not found")

    import json

    with open(path, "r", encoding="utf-8") as file:
        return json.load(file)


@router.get("/predict/next")
def predict_next():
    artifact = load_model()

    if artifact is None:
        raise HTTPException(503, "ML model is not trained")

    conn = sqlite3.connect(DB_PATH)

    df = pd.read_sql_query("""
        SELECT air_temperature, humidity, water_temperature
        FROM sensor_readings
        ORDER BY id DESC
        LIMIT 12
    """, conn)

    conn.close()

    if len(df) < 12:
        raise HTTPException(400, "Insufficient sensor history")

    df = df.iloc[::-1].reset_index(drop=True)

    sensors = artifact["sensors"]
    lags = artifact["lags"]

    features = {}

    for sensor in sensors:
        values = df[sensor]

        for lag in lags:
            features[f"{sensor}_lag_{lag}"] = float(
                values.iloc[-lag]
            )

        features[f"{sensor}_mean_6"] = float(
            values.tail(6).mean()
        )

        features[f"{sensor}_mean_12"] = float(
            values.tail(12).mean()
        )

        features[f"{sensor}_std_6"] = float(
            values.tail(6).std()
        )

    input_df = pd.DataFrame(
        [features],
        columns=artifact["features"]
    )

    prediction = artifact["model"].predict(input_df)[0]

    return {
        "model": "ExtraTreesRegressor",
        "prediction_type": "next_sensor_observation",
        "forecast_horizon": "next_reading",
        "predictions": {
            sensor: round(float(value), 3)
            for sensor, value in zip(sensors, prediction)
        },
        "warning": "Experimental short-term prediction. Not a 24-hour or 7-day forecast."
    }


@router.get("/forecast")
def forecast_status():
    return {
        "24_hour": {
            "available": False,
            "reason": "Insufficient historical coverage for validated 24-hour forecasting."
        },
        "7_day": {
            "available": False,
            "reason": "Insufficient historical coverage for validated 7-day forecasting."
        },
        "glacier_melt": {
            "available": False,
            "reason": "Requires real glacier melt or mass-balance training labels."
        }
    }

@router.get("/predict/humidity/next")
def predict_humidity_next():
    import numpy as np

    path = "ml_models/humidity_experiment_model.joblib"

    if not os.path.exists(path):
        raise HTTPException(503, "Experimental humidity model not found")

    artifact = joblib.load(path)

    conn = sqlite3.connect(DB_PATH)

    df = pd.read_sql_query("""
        SELECT created_at, air_temperature, humidity, water_temperature
        FROM sensor_readings
        ORDER BY id DESC
        LIMIT 12
    """, conn)

    conn.close()

    if len(df) < 12:
        raise HTTPException(400, "Insufficient sensor history")

    df = df.iloc[::-1].reset_index(drop=True)
    df["created_at"] = pd.to_datetime(df["created_at"])

    sensors = ["humidity", "air_temperature", "water_temperature"]
    features = {}

    for sensor in sensors:
        values = pd.to_numeric(df[sensor], errors="coerce")

        if values.isna().any():
            raise HTTPException(400, f"Invalid {sensor} readings")

        for lag in [1, 2, 3, 6, 12]:
            features[f"{sensor}_lag_{lag}"] = float(values.iloc[-lag])

        features[f"{sensor}_rolling_mean"] = float(values.tail(6).mean())
        features[f"{sensor}_rolling_std"] = float(values.tail(6).std())

    intervals = df["created_at"].diff().dt.total_seconds().dropna()
    interval = float(intervals.median()) if len(intervals) else 10

    next_time = df["created_at"].iloc[-1] + pd.Timedelta(seconds=interval)

    features["hour"] = int(next_time.hour)
    features["minute"] = int(next_time.minute)

    input_df = pd.DataFrame(
        [features],
        columns=artifact["features"]
    )

    prediction = float(artifact["model"].predict(input_df)[0])
    prediction = float(np.clip(prediction, 0, 100))

    return {
        "model": artifact["model_name"],
        "prediction_type": "experimental_humidity_next_reading",
        "predicted_humidity": round(prediction, 2),
        "forecast_horizon": "next_sensor_observation",
        "records_used": artifact["records_used"],
        "warning": "Experimental prediction. Not a validated long-term humidity forecast."
    }
