const { Bonjour } = require('bonjour-service');

const evee = process.argv[2] || 'Cool Apple';
const PORT = 53318;

const bonjour = new Bonjour();

bonjour.publish({
  name: evee,        // nombre que verán los demás
  type: 'minisend',   // se publica como _minisend._tcp
  port: PORT,         // puerto donde recibiremos archivos (aún no existe)
  txt: { deviceType: 'desktop' }, // datos extra opcionales
});

console.log(`📡 Anunciando "${evee}" como _minisend._tcp en el puerto ${PORT}`);

// Al cerrar, avisamos a la red que nos vamos
process.on('SIGINT', () => {
  bonjour.unpublishAll(() => {
    bonjour.destroy();
    process.exit(0);
  });
});