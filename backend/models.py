
from sqlalchemy import Column, Integer, Float, DateTime, String
from datetime import datetime
from database import Base

class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    air_temperature = Column(Float)
    humidity = Column(Float)
    water_temperature = Column(Float)
    distance = Column(Float)

    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    status = Column(String, default="NORMAL")
    created_at = Column(DateTime, default=datetime.utcnow)

