from fastapi import APIRouter, HTTPException, status
from models.user import UserLogin, UserResponse
from database.sqlite import get_user_db
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/login", response_model=dict)
async def login(credentials: UserLogin):
    """
    Endpoint de autenticación
    """
    try:
        logger.info(f"🔐 Intento de login: {credentials.email}")
        
        # Obtener usuario de SQLite
        user_db = get_user_db()
        user = user_db.get_user_by_email(credentials.email)
        
        if not user:
            logger.warning(f"❌ Usuario no encontrado: {credentials.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Verificar si la cuenta está activa
        if not user.get('is_active', True):
            logger.warning(f"❌ Cuenta desactivada: {credentials.email}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is disabled"
            )
        
        # Verificar contraseña (sin hash - igual que en Next.js)
        if user['password'] != credentials.password:
            logger.warning(f"❌ Contraseña incorrecta: {credentials.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        logger.info(f"✅ Login exitoso: {credentials.email}")
        
        return {
            "success": True,
            "message": "Login successful",
            "user": {
                "id": user['id'],
                "name": user['name'],
                "email": user['email'],
                "role": user['role']
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error en login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@router.post("/signup", response_model=dict)
async def signup(user_data: dict):
    """
    Endpoint de registro (placeholder)
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Signup not implemented yet"
    )
