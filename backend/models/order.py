from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

class OrderStatus(str, Enum):
    PENDING = "Pendiente"
    CONFIRMED = "Confirmado"
    PREPARING = "En preparación"
    ASSIGNED = "Asignado"
    ACCEPTED = "Aceptado"
    ON_THE_WAY = "En camino"
    DELIVERED = "Entregado"

class TimelineEvent(BaseModel):
    status: OrderStatus
    timestamp: datetime = datetime.now
    
class Order(BaseModel):
    _id: str
    folio: str
    creation_date: datetime
    address: str
    total: float
    current_status: OrderStatus = OrderStatus.PENDING
    timeline: List[TimelineEvent] = []