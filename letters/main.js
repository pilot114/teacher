const { app, BrowserWindow } = require('electron')
const path = require('path')

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        height: 563,
        width: 1000,
        useContentSize: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })

    mainWindow.loadFile('index.html')
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})