const http = require('node:http');
const path = require('node:path');
const readline = require('node:readline');
const { WebSocketServer } = require('ws');
const { Bonjour } = require('bonjour-service');

const ALIAS = process.argv[2] || 'Mi PC';
const PORT = 53318;

// NUEVO: para preguntarle al usuario por la terminal
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(`Hola, soy ${ALIAS}`);
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  console.log(`🔗 Conexión desde ${req.socket.remoteAddress}`);
  ws.send(JSON.stringify({ type: 'hello', alias: ALIAS }));

  ws.on('message', (data) => {
    // NUEVO: interpretar el mensaje como JSON
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      console.log('⚠️ Mensaje inválido, lo ignoro');
      return;
    }

    // NUEVO: actuar según el tipo de mensaje
    if (msg.type === 'offer') {
      handleOffer(ws, msg);
    } else {
      console.log(`📩 Mensaje desconocido: ${msg.type}`);
    }
  });

  ws.on('close', () => console.log('🔌 Se cerró la conexión'));
});

// NUEVO: manejar una oferta de archivo
function handleOffer(ws, msg) {
  // basename descarta cualquier ruta: "../../x.exe" queda como "x.exe"
  const name = path.basename(String(msg.name || ''));
  const size = Number(msg.size);

  if (!name || !Number.isFinite(size) || size < 0) {
    ws.send(JSON.stringify({ type: 'reject', reason: 'oferta inválida' }));
    return;
  }

  const mb = (size / 1024 / 1024).toFixed(2);
  console.log(`📦 Oferta: "${name}" (${mb} MB)`);

  // El flujo SE DETIENE aquí hasta que la persona responda
  rl.question('¿Aceptas? (s/n): ', (answer) => {
    const accepted = answer.trim().toLowerCase() === 's';
    ws.send(JSON.stringify({ type: accepted ? 'accept' : 'reject' }));
    console.log(accepted ? '✅ Aceptado' : '❌ Rechazado');
  });
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚪 Servidor escuchando en el puerto ${PORT}`);

  const bonjour = new Bonjour();
  bonjour.publish({
    name: ALIAS,
    type: 'minisend',
    port: PORT,
    txt: { deviceType: 'desktop' },
  });
  console.log(`📡 Anunciando "${ALIAS}"`);

  process.on('SIGINT', () => {
    bonjour.unpublishAll(() => {
      bonjour.destroy();
      process.exit(0);
    });
  });
});