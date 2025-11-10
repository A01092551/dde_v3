// Script para cargar facturas de ejemplo en MongoDB
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

const facturasEjemplo = [
  {
    numeroFactura: "F-001",
    fecha: "2024-11-09",
    fechaVencimiento: "2024-12-09",
    proveedor: {
      nombre: "Proveedor Ejemplo S.A. de C.V.",
      rfc: "PEJ850101ABC",
      direccion: "Av. Principal 123, Ciudad de México"
    },
    cliente: {
      nombre: "Cliente Demo",
      rfc: "CDE900101XYZ",
      direccion: "Calle Secundaria 456"
    },
    items: [
      {
        descripcion: "Producto A",
        cantidad: 10,
        precioUnitario: 1500.00,
        total: 15000.00
      },
      {
        descripcion: "Producto B",
        cantidad: 5,
        precioUnitario: 500.00,
        total: 2500.00
      }
    ],
    subtotal: 17500.00,
    iva: 2800.00,
    total: 20300.00,
    moneda: "MXN",
    formaPago: "Transferencia",
    metodoPago: "PUE",
    observaciones: "Factura de ejemplo generada automáticamente",
    metadata: {
      fileName: "factura_ejemplo_1.pdf",
      fileSize: 125000,
      processedAt: new Date(),
      model: "seed-script",
      validatedAt: new Date(),
      validatedBy: "system"
    }
  },
  {
    numeroFactura: "F-002",
    fecha: "2024-11-08",
    fechaVencimiento: "2024-12-08",
    proveedor: {
      nombre: "Servicios Profesionales XYZ",
      rfc: "SPX920202DEF",
      direccion: "Blvd. Reforma 789, Guadalajara"
    },
    cliente: {
      nombre: "Empresa ABC",
      rfc: "EAB880303GHI",
      direccion: "Av. Juárez 321"
    },
    items: [
      {
        descripcion: "Servicio de Consultoría",
        cantidad: 1,
        precioUnitario: 15000.00,
        total: 15000.00
      }
    ],
    subtotal: 15000.00,
    iva: 2400.00,
    total: 17400.00,
    moneda: "MXN",
    formaPago: "Efectivo",
    metodoPago: "PPD",
    observaciones: "Pago en parcialidades",
    metadata: {
      fileName: "factura_ejemplo_2.pdf",
      fileSize: 98000,
      processedAt: new Date(),
      model: "seed-script",
      validatedAt: new Date(),
      validatedBy: "system"
    }
  },
  {
    numeroFactura: "F-003",
    fecha: "2024-11-07",
    fechaVencimiento: "2024-12-07",
    proveedor: {
      nombre: "Distribuidora Nacional",
      rfc: "DIN870404JKL",
      direccion: "Calle Comercio 555, Monterrey"
    },
    cliente: {
      nombre: "Tienda Retail",
      rfc: "TRE910505MNO",
      direccion: "Plaza Central 100"
    },
    items: [
      {
        descripcion: "Mercancía General",
        cantidad: 50,
        precioUnitario: 200.00,
        total: 10000.00
      },
      {
        descripcion: "Envío",
        cantidad: 1,
        precioUnitario: 500.00,
        total: 500.00
      }
    ],
    subtotal: 10500.00,
    iva: 1680.00,
    total: 12180.00,
    moneda: "MXN",
    formaPago: "Tarjeta de Crédito",
    metodoPago: "PUE",
    observaciones: "Incluye envío express",
    metadata: {
      fileName: "factura_ejemplo_3.pdf",
      fileSize: 110000,
      processedAt: new Date(),
      model: "seed-script",
      validatedAt: new Date(),
      validatedBy: "system"
    }
  }
];

async function seedFacturas() {
  console.log('🌱 Cargando facturas de ejemplo...\n');
  
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;
  
  if (!uri) {
    console.error('❌ MONGODB_URI no está configurada');
    process.exit(1);
  }
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db(dbName);
    const collection = db.collection('facturas');
    
    // Verificar si ya hay facturas
    const count = await collection.countDocuments();
    if (count > 0) {
      console.log(`⚠️  Ya hay ${count} facturas en la base de datos`);
      console.log('¿Deseas continuar y agregar más? (Ctrl+C para cancelar)\n');
      // Esperar 3 segundos
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Insertar facturas
    console.log(`📝 Insertando ${facturasEjemplo.length} facturas...\n`);
    
    for (let i = 0; i < facturasEjemplo.length; i++) {
      const factura = facturasEjemplo[i];
      
      // Verificar si ya existe
      const existing = await collection.findOne({ numeroFactura: factura.numeroFactura });
      
      if (existing) {
        console.log(`⏭️  Factura ${factura.numeroFactura} ya existe, omitiendo...`);
        continue;
      }
      
      // Insertar
      const result = await collection.insertOne(factura);
      console.log(`✅ ${i + 1}. Factura ${factura.numeroFactura} insertada`);
      console.log(`   ID: ${result.insertedId}`);
      console.log(`   Total: $${factura.total.toFixed(2)} ${factura.moneda}`);
      console.log(`   Proveedor: ${factura.proveedor.nombre}\n`);
    }
    
    // Mostrar resumen
    const totalCount = await collection.countDocuments();
    console.log('\n🎉 Proceso completado!');
    console.log(`📊 Total de facturas en la base de datos: ${totalCount}`);
    
    // Mostrar las primeras facturas
    console.log('\n📄 Facturas en la base de datos:');
    const facturas = await collection.find({}).sort({ createdAt: -1 }).limit(5).toArray();
    
    facturas.forEach((f, i) => {
      console.log(`\n${i + 1}. ${f.numeroFactura}`);
      console.log(`   Total: $${f.total} ${f.moneda}`);
      console.log(`   Fecha: ${f.fecha}`);
      console.log(`   Proveedor: ${f.proveedor?.nombre || 'N/A'}`);
    });
    
    console.log('\n✅ Ahora puedes ver las facturas en: http://localhost:3000/facturas');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seedFacturas();
