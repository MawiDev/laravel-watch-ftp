const fs = require('fs').promises; // Utilizzo di fs.promises per gestire le promesse
const path = require('path');

async function createConfigDirectory() {
  const watcherFtpDir = path.join(__dirname, '..', '..', 'watcher-ftp');

  try {
    await fs.mkdir(watcherFtpDir);
    console.log('Directory "watcher-ftp" creata con successo.');
  } catch (error) {
    if (error.code === 'EEXIST') {
      console.log('La directory "watcher-ftp" esiste già.');
    } else {
      console.error('Errore durante la creazione della directory "watcher-ftp":', error);
    }
  }
}

async function createConfigFile() {
  const watcherFtpDir = path.join(__dirname, '..', '..', 'watcher-ftp');
  const configFilePath = path.join(watcherFtpDir, 'config.json');

  const configContent = JSON.stringify({
    "ftp": {
      "host": "",
      "port": 21,
      "user": "",
      "password": ""
    },
    "localFolder": "",
    "remoteFolder": "/",
    "chokidarOptions": {
      "ignored": "(^|[/\\\\])\\..*",
      "persistent": true
    }
  }, null, 2);

  try {
    await fs.writeFile(configFilePath, configContent);
    console.log('File di configurazione creato con successo.');
  } catch (error) {
    console.error('Errore durante la creazione del file di configurazione:', error);
  }
}


async function addWatchScriptToPackageJson() {
  const projectPackageJsonPath = path.join(process.cwd(),'..','..', 'package.json');
  const watchScript = 'node ./node_modules/laravel-watch-ftp/main.js';

  try {
    const projectPackageJson = require(projectPackageJsonPath);
    projectPackageJson.scripts = projectPackageJson.scripts || {};

    if (!projectPackageJson.scripts.watch) {
      projectPackageJson.scripts.watch = watchScript;
      await fs.writeFile(projectPackageJsonPath, JSON.stringify(projectPackageJson, null, 2));
      console.log('Script "watch" aggiunto al package.json con successo!');
    } else {
      console.log('Lo script "watch" è già presente nel package.json.');
    }
  } catch (error) {
    console.error('Errore durante l\'aggiunta dello script "watch" al package.json:', error);
  }
}

// Esegui le funzioni
(async () => {
  await createConfigDirectory();
  await createConfigFile();
  await addWatchScriptToPackageJson();
})();
