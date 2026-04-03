
const { CosmosClient } = require('@azure/cosmos');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Cargar .env desde el directorio actual
const envPath = path.resolve(__dirname, '../.env');
console.log('Buscando .env en:', envPath);
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.error('.env no encontrado en la ruta especificada.');
}

async function checkHolidays() {
  const endpoint = process.env.COSMOS_DB_URL;
  const key = process.env.COSMOS_DB_KEY;
  const databaseId = process.env.COSMOS_DB_DATABASE || 'HorasExtrasDB';
  const containerId = 'system-config';

  console.log('Conectando a:', endpoint);
  const client = new CosmosClient({ endpoint, key });
  
  try {
    const database = client.database(databaseId);
    const container = database.container(containerId);

    const { resource: config } = await container.item('system-config', 'system-config').read();
    
    if (config) {
      console.log('--- CONFIGURACIÓN ENCONTRADA ---');
      console.log('ID:', config.id);
      console.log('Festivos registrados:', JSON.stringify(config.holidays || [], null, 2));
    } else {
      console.log('No se encontró el documento system-config.');
      
      // Intentar listar todos los items para ver qué hay
      console.log('Consultando todos los items del contenedor...');
      const { resources: items } = await container.items.query('SELECT * FROM c').fetchAll();
      console.log(`Encontrados ${items.length} items.`);
      items.forEach(item => console.log('- ID:', item.id));
    }
  } catch (error) {
    console.error('Error durante la ejecución:', error.message);
    if (error.code) console.error('Código de error:', error.code);
  }
}

checkHolidays();
