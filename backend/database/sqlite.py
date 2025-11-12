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

def get_user_db():
    """Obtener instancia de UserDatabase"""
    return UserDatabase()
