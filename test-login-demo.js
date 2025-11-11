#!/usr/bin/env node

/**
 * Quick test script to verify login demo setup
 * Run with: node test-login-demo.js
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

console.log('🔍 Testing Login Demo Setup\n');
console.log('═══════════════════════════════════════════════════════\n');

// Check if database exists
const dbPath = path.join(__dirname, 'data', 'users.db');
console.log('📁 Checking database file...');
console.log('   Path:', dbPath);

if (!fs.existsSync(dbPath)) {
  console.log('❌ Database file not found!');
  console.log('   Please run the app first to create the database.');
  process.exit(1);
}
console.log('✅ Database file exists\n');

// Open database
console.log('🗄️  Opening database...');
const db = new Database(dbPath);
console.log('✅ Database opened successfully\n');

// Check users table
console.log('📊 Checking users table...');
try {
  const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
  
  if (!tableInfo) {
    console.log('❌ Users table not found!');
    process.exit(1);
  }
  console.log('✅ Users table exists\n');
} catch (error) {
  console.log('❌ Error checking table:', error.message);
  process.exit(1);
}

// List all users
console.log('👥 Users in database:');
console.log('═══════════════════════════════════════════════════════');
try {
  const users = db.prepare('SELECT id, name, email, role, is_active, created_at FROM users').all();
  
  if (users.length === 0) {
    console.log('⚠️  No users found in database!');
    console.log('\n💡 To create a test user, you can:');
    console.log('   1. Go to http://localhost:3000/signup');
    console.log('   2. Or run this SQL:');
    console.log('      INSERT INTO users (name, email, password, role)');
    console.log('      VALUES ("Test User", "test@example.com", "password123", "user");');
  } else {
    console.log(`\nFound ${users.length} user(s):\n`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. User ID: ${user.id}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.is_active ? 'Yes' : 'No'}`);
      console.log(`   Created: ${user.created_at}`);
      console.log('');
    });
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ Setup looks good! You can test with these credentials:\n');
    users.forEach((user, index) => {
      console.log(`Option ${index + 1}:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: [check your records - passwords are stored in plain text]`);
      console.log('');
    });
  }
} catch (error) {
  console.log('❌ Error reading users:', error.message);
  process.exit(1);
}

// Close database
db.close();

console.log('═══════════════════════════════════════════════════════');
console.log('🎯 Next Steps:');
console.log('   1. Start the dev server: npm run dev');
console.log('   2. Open browser: http://localhost:3000/login');
console.log('   3. Open browser console (F12)');
console.log('   4. Watch terminal for backend logs');
console.log('   5. Try logging in with a valid user');
console.log('═══════════════════════════════════════════════════════\n');
