from motor.motor_asyncio import AsyncIOMotorClient
from config import settings
import logging

logger = logging.getLogger(__name__)

class MongoDB:
    client: AsyncIOMotorClient = None
    
mongodb = MongoDB()

async def connect_to_mongo():
    """Conectar a MongoDB"""
    try:
        mongodb.client = AsyncIOMotorClient(settings.MONGODB_URI)
        # Verificar conexión
        await mongodb.client.admin.command('ping')
        logger.info("✅ Conectado a MongoDB")
    except Exception as e:
        logger.error(f"❌ Error al conectar a MongoDB: {e}")
        raise

async def close_mongo_connection():
    """Cerrar conexión a MongoDB"""
    if mongodb.client:
        mongodb.client.close()
        logger.info("🔌 Conexión a MongoDB cerrada")

def get_database():
    """Obtener la base de datos"""
    return mongodb.client[settings.MONGODB_DB]

def get_collection(collection_name: str):
    """Obtener una colección específica"""
    db = get_database()
    return db[collection_name]
