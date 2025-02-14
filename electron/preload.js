const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  startVPN: (config) => ipcRenderer.send('start-vpn', config),
  endVPN: () => ipcRenderer.send('end-vpn'),
  sendMFA: (mfaCode) => ipcRenderer.send('send-mfa', mfaCode),
  onVPNLog: (callback) => ipcRenderer.on('vpn-log', (_, data) => callback(data)),
  onMFARequest: (callback) => ipcRenderer.on('vpn-mfa-request', callback),
  onVPNConnected: (callback) => ipcRenderer.on('vpn-connected', callback),
  onVPNDisconnected: (callback) => ipcRenderer.on('vpn-disconnected', callback),
});
