const ftp = require("basic-ftp");
const fs = require("fs").promises;
const path = require("path");
const chokidar = require("chokidar");
const { config } = require("process");

class PromiseQueue {
  constructor() {
    this.queue = Promise.resolve();
  }

  enqueue(fn) {
    this.queue = this.queue
      .then(fn)
      .catch((err) => console.error("Error in queue:", err));
    return this.queue;
  }
}

async function readConfig() {
  try {
    const configFile = await fs.readFile(
      path.join(__dirname, "config.json"),
      "utf-8"
    );
    return JSON.parse(configFile);
  } catch (error) {
    console.error("Error reading configuration file:", error);
    process.exit(1);
  }
}

async function connect() {
  const client = new ftp.Client();
  const queue = new PromiseQueue();

  const config = await readConfig();

  try {
    console.log("Connecting to FTP server...");
    await client.access({
      host: config.ftp.host,
      port: config.ftp.port,
      user: config.ftp.user,
      password: config.ftp.password,
      secure: false,
      debug: console.log,
    });

    console.log("Connected to FTP server successfully.");

    watchDirectory(client, queue, config);
    setupTerminationHandlers(client);
  } catch (err) {
    handleConnectionError(err);
  }
}

function setupTerminationHandlers(client) {
  process.on("SIGINT", async () => {
    try {
      if (client && client instanceof ftp.Client && client.connected) {
        console.log("Closing FTP connection...");
        await client.quit();
        console.log("FTP connection closed successfully.");
      }
    } catch (err) {
      console.error("Error during FTP connection closure:", err);
    } finally {
      console.log("Script terminated.");
      process.exit();
    }
  });
}

function watchDirectory(client, queue, config) {
  const watcher = chokidar.watch(config.localFolder, config.chokidarOptions);

  console.log(`Waiting for changes in the directory: ${config.localFolder}`);

  watcher
    .on("add", (filePath) =>
      handleFileChange("Added", filePath, client, queue, config)
    )
    .on("change", (filePath) =>
      handleFileChange("Modified", filePath, client, queue, config)
    )
    .on("unlink", (filePath) =>
      handleFileDelete("Deleted", filePath, client, queue, config)
    )
    .on("unlinkDir", (dirPath) =>
      handleFolderDelete("Deleted", dirPath, client, queue, config)
    );
}

async function handleFileDelete(action, filePath, client, queue, config) {
  console.log(`${action}: ${filePath}`);

  const localRelativePath = path.relative(config.localFolder, filePath);
  const remoteFilePath = path.join("/", localRelativePath);

  try {
    await queue.enqueue(() => client.remove(remoteFilePath));
    console.log(`Remote file deleted: ${remoteFilePath}`);
  } catch (err) {
    if (
      err.code === 550 &&
      err.message.includes("File or directory does not exist")
    ) {
      console.log(`Remote file no longer exists: ${remoteFilePath}`);
    } else {
      console.error(
        `Error during remote file deletion: ${err.code} - ${err.message}`
      );
    }
  }
}

async function handleFolderDelete(action, dirPath, client, queue, config) {
  console.log(`${action}: ${dirPath}`);

  const localRelativePath = path.relative(config.localFolder, dirPath);
  const remoteDirPath = path.join("/", localRelativePath);

  try {
    const remoteDirDetails = await queue.enqueue(() =>
      client.list(remoteDirPath)
    );
    console.log("Deleting on the FTP server...");

    const remoteFiles = await queue.enqueue(() => client.list(remoteDirPath));
    for (const file of remoteFiles) {
      const remoteFilePath = path.join(remoteDirPath, file.name);
      await queue.enqueue(() => client.remove(remoteFilePath));
      console.log(`Remote file deleted: ${remoteFilePath}`);
    }

    await queue.enqueue(() => client.removeDir(remoteDirPath, true));

    console.log(`Remote folder deleted: ${remoteDirPath}`);
  } catch (err) {
    console.error(
      `Error during remote folder deletion: ${err.code} - ${err.message}`
    );
  }
}

async function handleFileChange(action, filePath, client, queue, config) {
  console.log(`${action}: ${filePath}`);

  const localRelativePath = path.relative(config.localFolder, filePath);
  const remoteFilePath = path.join("/", localRelativePath);

  try {
    if ((await fs.stat(filePath)).isFile()) {
      const remoteDir = path.dirname(remoteFilePath);
      await client.ensureDir(remoteDir);
      console.log(`Uploading to remote file: ${remoteFilePath}`);
      await queue.enqueue(() => client.uploadFrom(filePath, remoteFilePath));
    } else {
    }
  } catch (err) {
    console.error(
      `Error during change handling: ${err.code} - ${err.message}`
    );
  }
}

function handleConnectionError(err) {
  console.error("Error during connection:", err);
  process.exit(1);
}

connect();