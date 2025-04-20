"use strict";
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("electron", {
    loadFile: (filePath) => ipcRenderer.invoke("load-file", filePath),
    writeFile: (filePath, binary) => ipcRenderer.invoke("write-file", filePath, binary),
    onOpenMidi: (callback) => ipcRenderer.on("open-midi", (event, path) => callback(path)),
});
//# sourceMappingURL=preload.js.map