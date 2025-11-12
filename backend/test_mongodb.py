"""
Script para verificar conexión a MongoDB y listar facturas
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

async def test_connection():
    print("=" * 60)
    print("🔍 VERIFICANDO CONEXIÓN A MONGODB")
    print("=" * 60)
    
    # Conectar a MongoDB
    print(f"\n📡 Conectando a: {settings.MONGODB_URI[:50]}...")
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    
    try:
        # Verificar conexión
        await client.admin.command('ping')
        print("✅ Conexión exitosa a MongoDB")
        
        # Obtener base de datos
        db = client[settings.MONGODB_DB]
        print(f"\n📊 Base de datos: {settings.MONGODB_DB}")
        
        # Listar colecciones
        collections = await db.list_collection_names()
        print(f"\n📁 Colecciones encontradas ({len(collections)}):")
        for col in collections:
            count = await db[col].count_documents({})
            print(f"   - {col}: {count} documentos")
        
        # Verificar colección 'invoices' (la que usa el backend)
        print(f"\n🔍 Verificando colección 'invoices':")
        facturas_collection = db["invoices"]
        total_facturas = await facturas_collection.count_documents({})
        print(f"   Total de facturas: {total_facturas}")
        
        if total_facturas > 0:
            print(f"\n📄 Primeras 3 facturas:")
            cursor = facturas_collection.find().limit(3)
            async for factura in cursor:
                print(f"   - ID: {factura.get('_id')}")
                print(f"     Número: {factura.get('numeroFactura', 'N/A')}")
                print(f"     Fecha: {factura.get('fecha', 'N/A')}")
                print(f"     Total: {factura.get('total', 'N/A')}")
                metadata = factura.get('metadata', {})
                print(f"     Metadata:")
                print(f"       - fileName: {metadata.get('fileName', 'N/A')}")
                print(f"       - s3Key: {metadata.get('s3Key', 'N/A')}")
                print(f"       - s3Url: {metadata.get('s3Url', 'N/A')}")
                print()
        else:
            print("   ⚠️  No hay facturas en la colección 'facturas'")
            print("\n💡 Posibles razones:")
            print("   1. Las facturas están en otra colección")
            print("   2. Las facturas están en otra base de datos")
            print("   3. Aún no se han guardado facturas desde el nuevo backend")
        
        print("\n" + "=" * 60)
        print("✅ VERIFICACIÓN COMPLETADA")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(test_connection())
