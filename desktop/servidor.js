const http = require('node:http');
const { WebSocketServer } = require('ws');
const { Bonjour } = require('bonjour-service');

const evee = process.argv[2] || 'Mi PC';
const PORT = 53318;

// 1. Servidor HTTP: responde a quien abra la dirección en un navegador
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(`Hola, soy ${evee}`);
});

// 2. WebSocket montado sobre el mismo servidor
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  console.log(`🔗 Conexión desde ${req.socket.remoteAddress}`);

  ws.send(JSON.stringify({ type: 'hello', alias: evee }));

  ws.on('message', (data) => {
    console.log(`📩 Recibí: ${data.toString()}`);
  });

  ws.on('close', () => console.log('🔌 Se cerró la conexión'));
});

// 3. Escuchar y, cuando esté listo, anunciarse en la red
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚪 Servidor escuchando en el puerto ${PORT}`);

  const bonjour = new Bonjour();
  bonjour.publish({
    name: evee,
    type: 'minisend',
    port: PORT,
    txt: { deviceType: 'desktop' },
  });
  console.log(`📡 Anunciando "${evee}"`);

  process.on('SIGINT', () => {
    bonjour.unpublishAll(() => {
      bonjour.destroy();
      process.exit(0);
    });
  });
});