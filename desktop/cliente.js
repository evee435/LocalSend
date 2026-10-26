const fs = require('node:fs');
const path = require('node:path');
const { Bonjour } = require('bonjour-service');
const WebSocket = require('ws');

const filePath = process.argv[2];
if (!filePath || !fs.existsSync(filePath)) {
  console.log('Uso: bun run cliente.js <ruta-del-archivo>');
  process.exit(1);
}

// Solo leemos nombre y tamaño. No abrimos el contenido.
const stats = fs.statSync(filePath);
const name = path.basename(filePath);

const bonjour = new Bonjour();
const browser = bonjour.find({ type: 'minisend' });

console.log('🔍 Buscando dispositivos...');

function finish() {
  browser.stop();
  bonjour.destroy();
}

browser.once('up', (s) => {
  const ip = s.addresses.find((a) => !a.includes(':'));
  console.log(`✅ Encontré "${s.name}" en ${ip}:${s.port}`);

  const ws = new WebSocket(`ws://${ip}:${s.port}`);

  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());

    if (msg.type === 'hello') {
      console.log(`👋 Saludo de ${msg.alias}. Ofrezco "${name}"...`);
      ws.send(JSON.stringify({ type: 'offer', name, size: stats.size }));
    } else if (msg.type === 'accept') {
      console.log('✅ Aceptaron. (Todavía no enviamos nada)');
      ws.close();
      finish();
    } else if (msg.type === 'reject') {
      console.log(`❌ Rechazaron${msg.reason ? `: ${msg.reason}` : ''}`);
      ws.close();
      finish();
    }
  });

  ws.on('error', (err) => {
    console.log(`⚠️ Error de conexión: ${err.message}`);
    finish();
  });
});