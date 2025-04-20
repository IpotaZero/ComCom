"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
let win;
function createWindow() {
    const mainURL = path_1.default.join(__dirname, `index.html`);
    // main.jsの絶対パス
    // console.log(__dirname)
    win = new electron_1.BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path_1.default.join(__dirname, "preload.js"),
            backgroundThrottling: false,
        },
    });
    win.loadURL(mainURL);
    createMenu(win);
}
function createMenu(win) {
    const menu = [
        {
            label: "File",
            click: () => {
                const path = electron_1.dialog.showOpenDialogSync(win, {
                    filters: [{ extensions: ["mid", "midi"], name: "midi" }],
                });
                win.webContents.send("open-midi", path);
            },
        },
        {
            label: "Dev",
            accelerator: "CmdOrCtrl+Shift+I",
            click: () => {
                win.webContents.isDevToolsOpened() ? win.webContents.closeDevTools() : win.webContents.openDevTools();
            },
        },
        {
            label: "Reload",
            accelerator: "CmdOrCtrl+R",
            click: () => {
                win.webContents.reload();
            },
        },
    ];
    electron_1.Menu.setApplicationMenu(electron_1.Menu.buildFromTemplate(menu));
}
electron_1.app.whenReady().then(() => {
    createWindow();
});
electron_1.ipcMain.handle("load-file", (e, filePath) => {
    try {
        return fs_1.default.readFileSync(filePath, "binary");
    }
    catch (error) {
        electron_1.dialog.showErrorBox("そんなファイルはない", "" + error);
    }
});
electron_1.ipcMain.handle("write-file", (e, filePath, binary) => {
    fs_1.default.writeFileSync(filePath, binary, "binary");
});
//# sourceMappingURL=main.js.map