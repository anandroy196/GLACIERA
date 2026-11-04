
import os
import json
import joblib
import numpy as np
import pandas as pd

from fastapi import APIRouter, HTTPException
from sqlalchemy import text

from database import engine

router = APIRouter(prefix="/api/ml", tags=["Machine Learning"])

MODEL_PATH = "ml_models/environment_model.joblib"
METRICS_PATH = "ml_models/environment_metrics.json"
HUMIDITY_MODEL_PATH = "ml_models/humidity_experiment_model.joblib"


def load_model():
    if not os.path.exists(MODEL_PATH):
        return None
    return joblib.load(MODEL_PATH)


def get_sensor_history():
    try:
        query = text("""
            SELECT id, created_at, air_temperature,
                   humidity, water_temperature
            FROM sensor_readings
            ORDER BY id DESC
            LIMIT 12
        """)

        with engine.connect() as connection:
            df = pd.read_sql_query(query, connection)

        return df.sort_values("id").reset_index(drop=True)

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Database read error: {str(error)}"
        )


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
    if not os.path.exists(METRICS_PATH):
        raise HTTPException(
            status_code=404,
            detail="Model metrics not found"
        )

    with open(METRICS_PATH, "r", encoding="utf-8") as file:
        return json.load(file)


@router.get("/predict/next")
def predict_next():
    artifact = load_model()

    if artifact is None:
        raise HTTPException(
            status_code=503,
            detail="ML model is not trained"
        )

    df = get_sensor_history()

    if len(df) < 12:
        raise HTTPException(
            status_code=400,
            detail="Insufficient sensor history. Need 12 readings."
        )

    sensors = artifact["sensors"]
    lags = artifact["lags"]

    features = {}

    for sensor in sensors:
        values = pd.to_numeric(df[sensor], errors="coerce")

        if values.isna().any():
            raise HTTPException(
                status_code=400,
                detail=f"Invalid {sensor} readings"
            )

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
        "warning": (
            "Experimental short-term prediction. "
            "Not a 24-hour or 7-day forecast."
        )
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
    if not os.path.exists(HUMIDITY_MODEL_PATH):
        raise HTTPException(
            status_code=503,
            detail="Experimental humidity model not found"
        )

    artifact = joblib.load(HUMIDITY_MODEL_PATH)

    df = get_sensor_history()

    if len(df) < 12:
        raise HTTPException(
            status_code=400,
            detail="Insufficient sensor history"
        )

    df["created_at"] = pd.to_datetime(df["created_at"])

    sensors = [
        "humidity",
        "air_temperature",
        "water_temperature"
    ]

    features = {}

    for sensor in sensors:
        values = pd.to_numeric(df[sensor], errors="coerce")

        if values.isna().any():
            raise HTTPException(
                status_code=400,
                detail=f"Invalid {sensor} readings"
            )

        for lag in [1, 2, 3, 6, 12]:
            features[f"{sensor}_lag_{lag}"] = float(
                values.iloc[-lag]
            )

        features[f"{sensor}_rolling_mean"] = float(
            values.tail(6).mean()
        )

        features[f"{sensor}_rolling_std"] = float(
            values.tail(6).std()
        )

    intervals = (
        df["created_at"].diff().dt.total_seconds().dropna()
    )

    interval = (
        float(intervals.median()) if len(intervals) else 10
    )

    next_time = (
        df["created_at"].iloc[-1]
        + pd.Timedelta(seconds=interval)
    )

    features["hour"] = int(next_time.hour)
    features["minute"] = int(next_time.minute)

    input_df = pd.DataFrame(
        [features],
        columns=artifact["features"]
    )

    prediction = float(
        artifact["model"].predict(input_df)[0]
    )

    prediction = float(np.clip(prediction, 0, 100))

    return {
        "model": artifact["model_name"],
        "prediction_type": "experimental_humidity_next_reading",
        "predicted_humidity": round(prediction, 2),
        "forecast_horizon": "next_sensor_observation",
        "records_used": artifact["records_used"],
        "warning": (
            "Experimental prediction. "
            "Not a validated long-term humidity forecast."
        )
    }
