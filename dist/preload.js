"use strict";
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("electron", {
    loadFile: (filePath) => ipcRenderer.invoke("load-file", filePath),
    writeFile: (filePath, binary) => ipcRenderer.invoke("write-file", filePath, binary),
});
//# sourceMappingURL=preload.js.map