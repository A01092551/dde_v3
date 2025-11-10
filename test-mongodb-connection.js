// Test de conexión a MongoDB
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function testConnection() {
  console.log('🔍 Probando conexión a MongoDB...\n');
  
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;
  
  if (!uri) {
    console.error('❌ MONGODB_URI no está configurada');
    process.exit(1);
  }
  
  console.log('📝 Variables de entorno:');
  console.log(`   MONGODB_URI: ${uri.substring(0, 30)}...`);
  console.log(`   MONGODB_DB: ${dbName}\n`);
  
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
  });
  
  try {
    console.log('🔌 Conectando...');
    await client.connect();
    console.log('✅ Conexión exitosa!\n');
    
    const db = client.db(dbName);
    
    // Listar colecciones
    console.log('📚 Colecciones disponibles:');
    const collections = await db.listCollections().toArray();
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    // Contar facturas
    console.log('\n📊 Estadísticas:');
    const facturasCount = await db.collection('facturas').countDocuments();
    console.log(`   Total de facturas: ${facturasCount}`);
    
    if (facturasCount > 0) {
      console.log('\n📄 Primeras 3 facturas:');
      const facturas = await db.collection('facturas')
        .find({})
        .limit(3)
        .toArray();
      
      facturas.forEach((f, i) => {
        console.log(`\n   ${i + 1}. ID: ${f._id}`);
        console.log(`      Número: ${f.numeroFactura || 'N/A'}`);
        console.log(`      Total: ${f.total || 'N/A'}`);
        console.log(`      Fecha: ${f.fecha || 'N/A'}`);
      });
    }
    
    console.log('\n✅ Test completado exitosamente!');
    
  } catch (error) {
    console.error('\n❌ Error de conexión:');
    console.error(`   ${error.message}`);
    
    if (error.message.includes('ENOTFOUND')) {
      console.error('\n💡 Sugerencia: Verifica que el hostname de MongoDB sea correcto');
    } else if (error.message.includes('authentication')) {
      console.error('\n💡 Sugerencia: Verifica el usuario y contraseña en MONGODB_URI');
    } else if (error.message.includes('timeout')) {
      console.error('\n💡 Sugerencia: Verifica tu conexión a internet o las reglas de firewall en MongoDB Atlas');
    }
    
    process.exit(1);
  } finally {
    await client.close();
  }
}

testConnection();
