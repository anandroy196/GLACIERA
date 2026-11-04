from ml_api import router as ml_router
from database import engine, Base
import models
from fastapi import FastAPI
from datetime import datetime
from fastapi import Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="AI Glacier Melting Detection",
    description="Smart Glacier Monitoring System API",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
        allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "https://glaciera-pi.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
def sensor_data(db: Session = Depends(get_db)):
    readings = (
        db.query(models.SensorReading)
        .order_by(models.SensorReading.id.desc())
        .limit(50)
        .all()
    )

    if not readings:
        return {
            "message": "No sensor data available",
            "count": 0,
            "readings": []
        }

    return {
        "count": len(readings),
        "source": "esp32_database",
        "readings": [
            {
                "id": r.id,
                "air_temperature": r.air_temperature,
                "humidity": r.humidity,
                "water_temperature": r.water_temperature,
                "distance": r.distance,
                "latitude": r.latitude,
                "longitude": r.longitude,
                "status": r.status,
                "created_at": str(r.created_at)
            }
            for r in readings
        ]
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
app.include_router(ml_router)
