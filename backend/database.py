from pymongo import MongoClient

MONGO_URL_LOCAL = "mongodb://localhost:27017"
MONGO_URL_SERVER = ""
DB_NAME = "ElReyDeliveriesDB"

client = MongoClient(MONGO_URL_SERVER)
db = client[DB_NAME]