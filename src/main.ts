import { app, BrowserWindow, dialog, ipcMain } from "electron"
import path from "path"
import fs from "fs"

let win: BrowserWindow

function createWindow() {
    const mainURL = path.join(__dirname, `index.html`)

    // main.jsの絶対パス
    // console.log(__dirname)

    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
        },
    })

    win.loadURL(mainURL)
}

app.whenReady().then(() => {
    createWindow()
})

ipcMain.handle("load-file", (e, filePath: string) => {
    try {
        return fs.readFileSync(filePath, "binary")
    } catch (error) {
        dialog.showErrorBox("そんなファイルはない", "" + error)
    }
})

ipcMain.handle("write-file", (e, filePath: string, binary: string) => {
    fs.writeFileSync(filePath, binary, "binary")
})
