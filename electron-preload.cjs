const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    sendNotification: (title, body) => {
        new Notification({ title, body }).show();
    }
});
