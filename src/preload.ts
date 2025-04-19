const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("electron", {
    loadFile: (filePath: string) => ipcRenderer.invoke("load-file", filePath),
    writeFile: (filePath: string, binary: string) => ipcRenderer.invoke("write-file", filePath, binary),
})
