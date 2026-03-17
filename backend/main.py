from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(Path(__file__).resolve().parent / '.env')

from routes import auth, orders, products, profiles, user

app = FastAPI(title='El Rey Deliveries API', version='1.0.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.get('/health')
def health():
    return {'ok': True, 'service': 'el-rey-deliveries-api'}


app.include_router(auth.router)
app.include_router(user.router)
app.include_router(products.router)
app.include_router(profiles.router)
app.include_router(orders.router)
