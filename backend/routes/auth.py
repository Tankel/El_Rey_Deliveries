from fastapi import APIRouter, HTTPException
from models.auth import LoginRequest
from controllers import auth_controller

router = APIRouter(prefix = "/auth", tags = ["Auth"])
    
@router.post("/login")
def login(user: LoginRequest):
    return auth_controller.login(user) 
    

