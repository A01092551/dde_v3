from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import invoices, auth
from database.mongodb import connect_to_mongo, close_mongo_connection
from config import settings
import uvicorn
import logging

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Invoice Extraction API",
    description="API para extracción de datos de facturas usando OpenAI GPT-4o",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configurar CORS para permitir comunicación con el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Eventos de startup/shutdown
@app.on_event("startup")
async def startup_event():
    """Conectar a MongoDB al iniciar"""
    logger.info("🚀 Iniciando aplicación...")
    await connect_to_mongo()
    logger.info("✅ Aplicación lista")

@app.on_event("shutdown")
async def shutdown_event():
    """Cerrar conexiones al apagar"""
    logger.info("🛑 Cerrando aplicación...")
    await close_mongo_connection()
    logger.info("✅ Aplicación cerrada")

# Incluir routers
app.include_router(invoices.router, prefix="/api/invoices", tags=["invoices"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])

@app.get("/")
async def root():
    return {
        "message": "Invoice Extraction API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/health"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Invoice Extraction API",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
        log_level="info"
    )
