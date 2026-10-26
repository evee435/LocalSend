const { Bonjour } = require('bonjour-service');
const WebSocket = require('ws');

const bonjour = new Bonjour();
const browser = bonjour.find({ type: 'minisend' });

console.log('🔍 Buscando dispositivos...');

browser.once('up', (s) => {
  const ip = s.addresses.find((a) => !a.includes(':')); // solo IPv4
  console.log(`✅ Encontré "${s.name}" en ${ip}:${s.port}`);

  const ws = new WebSocket(`ws://${ip}:${s.port}`);

  ws.on('open', () => {
    console.log('🔗 Conectado');
    ws.send(JSON.stringify({ type: 'hola', from: 'cliente de prueba' }));
  });

  ws.on('message', (data) => {
    console.log(`📩 El servidor dijo: ${data.toString()}`);
    ws.close();
    browser.stop();
    bonjour.destroy();
  });
});