from fastapi import FastAPI
from routes import auth, user, service, review, contract
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],  
)

# Routers correctos
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(service.router)
app.include_router(review.router)
app.include_router(contract.router)
