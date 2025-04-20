import { app, BrowserWindow, dialog, ipcMain, Menu } from "electron"
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
            backgroundThrottling: false,
        },
    })

    win.loadURL(mainURL)

    createMenu(win)
}

function createMenu(win: BrowserWindow) {
    const menu = [
        {
            label: "File",
            click: () => {
                const path = dialog.showOpenDialogSync(win, {
                    filters: [{ extensions: ["mid", "midi"], name: "midi" }],
                })

                win.webContents.send("open-midi", path)
            },
        },
        {
            label: "Dev",
            accelerator: "CmdOrCtrl+Shift+I",
            click: () => {
                win.webContents.isDevToolsOpened() ? win.webContents.closeDevTools() : win.webContents.openDevTools()
            },
        },
        {
            label: "Reload",
            accelerator: "CmdOrCtrl+R",
            click: () => {
                win.webContents.reload()
            },
        },
    ]

    Menu.setApplicationMenu(Menu.buildFromTemplate(menu))
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
