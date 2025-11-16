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

@router.get("/users", response_model=dict)
async def get_users(search: str = None):
    """
    Obtener lista de usuarios (requiere rol admin)
    """
    try:
        user_db = get_user_db()
        
        if search:
            users = user_db.search_users(search)
        else:
            users = user_db.get_all_users()
        
        # Remover contraseñas de la respuesta
        for user in users:
            user.pop('password', None)
        
        return {
            "success": True,
            "users": users
        }
        
    except Exception as e:
        logger.error(f"❌ Error obteniendo usuarios: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get users: {str(e)}"
        )

@router.put("/users/{user_id}/role", response_model=dict)
async def update_user_role(user_id: int, role_data: dict):
    """
    Actualizar el rol de un usuario (requiere rol admin)
    """
    try:
        role = role_data.get('role')
        if not role or role not in ['user', 'admin']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role must be 'user' or 'admin'"
            )
        
        user_db = get_user_db()
        success = user_db.update_user_role(user_id, role)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        logger.info(f"✅ Rol actualizado para usuario {user_id} a {role}")
        
        return {
            "success": True,
            "message": f"User role updated to {role}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error actualizando rol: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update role: {str(e)}"
        )

@router.delete("/users/{user_id}", response_model=dict)
async def delete_user(user_id: int):
    """
    Eliminar un usuario (requiere rol admin)
    """
    try:
        user_db = get_user_db()
        success = user_db.delete_user(user_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        logger.info(f"✅ Usuario {user_id} eliminado")
        
        return {
            "success": True,
            "message": "User deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error eliminando usuario: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete user: {str(e)}"
        )
