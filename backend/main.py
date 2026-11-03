from database import engine, Base
import models
from fastapi import FastAPI
from datetime import datetime
from fastapi import Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db

app = FastAPI(
    title="AI Glacier Melting Detection",
    description="Smart Glacier Monitoring System API",
    version="1.0.0"
)
class SensorInput(BaseModel):
    air_temperature: float
    humidity: float
    water_temperature: Optional[float] = None
    distance: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: str = "NORMAL"
Base.metadata.create_all(bind=engine)
@app.get("/")
def home():
    return {
        "project": "AI Glacier Melting Detection",
        "message": "Backend is running successfully!",
        "status": "Online"
    }

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/sensors")
def sensor_data():
    return {
        "air_temperature": 5.5,
        "humidity": 65.0,
        "water_temperature": 2.4,
        "distance": 120.5,
        "latitude": None,
        "longitude": None,
        "source": "demo_data"
    }
@app.post("/api/sensors")
def save_sensor_data(
    data: SensorInput,
    db: Session = Depends(get_db)
):
    reading = models.SensorReading(
        air_temperature=data.air_temperature,
        humidity=data.humidity,
        water_temperature=data.water_temperature,
        distance=data.distance,
        latitude=data.latitude,
        longitude=data.longitude,
        status=data.status
    )

    db.add(reading)
    db.commit()
    db.refresh(reading)

    return {
        "message": "Sensor data saved successfully!",
        "id": reading.id
    }