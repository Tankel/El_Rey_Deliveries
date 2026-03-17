
from pydantic import BaseModel
from models.user import UserResponse

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse():
    token: str
    user: UserResponse