from enum import Enum
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr

class UserRole(str, Enum):
    CLIENT = 'cliente'
    ADMIN = 'administrador'
    DRIVER = 'repartidor'
    
class User(BaseModel):
    _id: Optional[str] = None
    username: str
    fullname: str
    phone: int
    password: str
    email: EmailStr
    role: UserRole = UserRole.CLIENT
    register_date: Optional[datetime] = None

class UserResponse(BaseModel):
    _id: str
    username: str
    fullname: str
    phone: int
    email: EmailStr
    role: UserRole = UserRole.CLIENT
