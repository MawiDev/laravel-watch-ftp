const fs = require('fs');
const path = require('path');

// Directory e file da creare
const watcherFtpDir = 'watcher-ftp';
const configFilePath = path.join(watcherFtpDir, 'config.json');

// Contenuto del file di configurazione
const configContent = JSON.stringify({
  // Inserisci qui le tue opzioni di configurazione predefinite
}, null, 2);

// Creazione della directory e del file
try {
  fs.mkdirSync(watcherFtpDir);
  fs.writeFileSync(configFilePath, configContent);
  console.log('Laravel Watch FTP configurato con successo!');
} catch (err) {
  console.error('Errore durante la configurazione di Laravel Watch FTP:', err);
}
