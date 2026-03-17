
from pydantic import BaseModel

class Product(BaseModel):
    _id: str
    name: str
    brand: str
    image_url: str
    price: float
    original_price: float
    stock: int
    unit: str
    pack_size: int
    package_type: str
    seller: str
    description: str
    