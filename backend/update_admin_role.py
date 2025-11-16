import sqlite3
import os
from pathlib import Path

# Get the database path
BACKEND_DIR = Path(__file__).parent
PROJECT_ROOT = BACKEND_DIR.parent
DB_PATH = PROJECT_ROOT / 'data' / 'users.db'

print(f"📂 Database path: {DB_PATH}")

def run_migration():
    print('🔄 Starting role column migration...')
    
    try:
        # Connect to database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if role column exists
        cursor.execute("PRAGMA table_info(users)")
        columns = cursor.fetchall()
        column_names = [col[1] for col in columns]
        
        has_role_column = 'role' in column_names
        
        if not has_role_column:
            print('📝 Adding role column to users table...')
            
            # Add role column
            cursor.execute("""
                ALTER TABLE users 
                ADD COLUMN role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin'))
            """)
            
            conn.commit()
            print('✅ Role column added successfully')
        else:
            print('ℹ️  Role column already exists')
        
        # Set cd-pp@outlook.es to admin role
        target_email = 'cd-pp@outlook.es'
        
        # Check if user exists
        cursor.execute('SELECT * FROM users WHERE email = ?', (target_email,))
        user = cursor.fetchone()
        
        if user:
            print(f'👤 Found user: {target_email}')
            
            # Update user role to admin
            cursor.execute('UPDATE users SET role = ? WHERE email = ?', ('admin', target_email))
            conn.commit()
            
            if cursor.rowcount > 0:
                print('✅ User role updated to admin successfully')
            else:
                print('⚠️  No changes made to user role')
        else:
            print(f'❌ User with email {target_email} not found')
            print('\n💡 Available users:')
            cursor.execute('SELECT id, name, email FROM users')
            users = cursor.fetchall()
            for u in users:
                print(f'   - ID: {u[0]}, Name: {u[1]}, Email: {u[2]}')
        
        # Show current users with their roles
        print('\n📋 Current users:')
        cursor.execute('SELECT id, name, email, role FROM users')
        users = cursor.fetchall()
        
        for user in users:
            user_id, name, email, role = user
            admin_badge = ' 👑' if role == 'admin' else ''
            print(f'  ID: {user_id} | Name: {name} | Email: {email} | Role: {role}{admin_badge}')
        
        conn.close()
        print('\n🎉 Migration completed successfully!')
        
    except Exception as error:
        print(f'❌ Migration failed: {error}')
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == '__main__':
    exit(run_migration())