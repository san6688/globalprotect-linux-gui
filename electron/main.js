const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

let mainWindow;
let vpnProcess;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'), // Preload script
    },
  });

  mainWindow.loadURL('http://localhost:5173'); // Vite dev server
});

ipcMain.on('end-vpn', (event) => {

  if (vpnProcess) {
    const pkexec = spawn('pkexec', ['kill', '-SIGINT', vpnProcess.pid]);

    pkexec.on('close', (code) => {
      event.sender.send('vpn-log', `VPN disconnected via pkexec (Exit code: ${code})`);
      vpnProcess = null;
    });

    pkexec.on('error', (err) => {
      event.sender.send('vpn-log', `Error using pkexec: ${err.message}`);
    });
  } else {
    event.sender.send('vpn-log', 'No active VPN connection to disconnect.');
  }
});

ipcMain.on('start-vpn', (event, { server, username, password }) => {
  vpnProcess = spawn('pkexec', [`openconnect`, server, '--user', username, '--passwd-on-stdin', `--authgroup=${server}`, '--protocol=gp'], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  // Write the sudo password to the stdin of the spawned process  
  vpnProcess.stdin.write(password + '\n');

  vpnProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(output);
    mainWindow.webContents.send('vpn-log', output);

    if (output.includes('Session authentication will expire')) {
      mainWindow.webContents.send('vpn-connected');
    }

    if (output.includes('Challenge')) {
      mainWindow.webContents.send('vpn-mfa-request');
    }
  });

  vpnProcess.stderr.on('data', (data) => {
    console.log('Error:', data.toString());
    mainWindow.webContents.send('vpn-log', data.toString());
  });

  vpnProcess.on('close', (code) => {
    console.log(`VPN process exited with code ${code}`);
    mainWindow.webContents.send('vpn-disconnected');
  });
});

ipcMain.on('send-mfa', (event, mfaCode) => {
  if (vpnProcess) {
    vpnProcess.stdin.write(mfaCode + '\n');
  }
});
