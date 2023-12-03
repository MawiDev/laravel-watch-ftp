# Laravel Watch FTP

Laravel Watch FTP is a tool that allows you to synchronize your local Laravel project with a remote FTP server. It monitors changes in your local directory and automatically uploads, deletes, or modifies files on the FTP server accordingly.

## Installation

To use Laravel Watch FTP in your project, install it via npm:

```bash
npm install laravel-watch-ftp
```

## Configuration

Create a configuration file in the root of your project named example.config.json.
Configure the FTP connection details, local folder, and any other settings in example.config.json.
Save and rename the file to config.json.

## Usage
To start watching and syncing your Laravel project with the FTP server, run the following command:

```bash
npm run watch
```

The script will connect to the FTP server and monitor changes in your local directory.
