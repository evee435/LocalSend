const { Bonjour } = require('bonjour-service');

const bonjour = new Bonjour();
const browser = bonjour.find({ type: 'minisend' });

browser.on('up', (s) => {
  const ipv4 = s.addresses?.filter((ip) => !ip.includes(':'));
  console.log(`➕ ${s.name} → ${ipv4.join(', ')}:${s.port}`);
});

browser.on('down', (s) => {
  console.log(`➖ ${s.name} se fue`);
});

console.log('🔍 Buscando dispositivos _minisend._tcp...');