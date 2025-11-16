import sqlite3
import os
from pathlib import Path

# Ruta a la base de datos SQLite del proyecto principal
DB_PATH = Path(__file__).parent.parent.parent / "data" / "users.db"

class UserDatabase:
    def __init__(self, db_path: str = None):
        self.db_path = db_path or str(DB_PATH)
        
    def get_connection(self):
        """Obtener conexión a la base de datos"""
        return sqlite3.connect(self.db_path)
    
    def get_user_by_email(self, email: str):
        """Buscar usuario por email"""
        conn = self.get_connection()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute(
            "SELECT * FROM users WHERE email = ?",
            (email,)
        )
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return dict(row)
        return None
    
    def get_all_users(self):
        """Obtener todos los usuarios"""
        conn = self.get_connection()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute(
            "SELECT id, name, email, role, is_active, created_at FROM users ORDER BY created_at DESC"
        )
        
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
    
    def search_users(self, query: str):
        """Buscar usuarios por nombre o email"""
        conn = self.get_connection()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        search_pattern = f"%{query}%"
        cursor.execute(
            """SELECT id, name, email, role, is_active, created_at 
               FROM users 
               WHERE name LIKE ? OR email LIKE ?
               ORDER BY created_at DESC""",
            (search_pattern, search_pattern)
        )
        
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
    
    def update_user_role(self, user_id: int, role: str):
        """Actualizar el rol de un usuario"""
        if role not in ['user', 'admin']:
            raise ValueError("Role must be 'user' or 'admin'")
        
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            "UPDATE users SET role = ? WHERE id = ?",
            (role, user_id)
        )
        
        conn.commit()
        affected_rows = cursor.rowcount
        conn.close()
        
        return affected_rows > 0
    
    def delete_user(self, user_id: int):
        """Eliminar un usuario"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            "DELETE FROM users WHERE id = ?",
            (user_id,)
        )
        
        conn.commit()
        affected_rows = cursor.rowcount
        conn.close()
        
        return affected_rows > 0

def get_user_db():
    """Obtener instancia de UserDatabase"""
    return UserDatabase()
