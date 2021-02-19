// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain} = require('electron')
const path = require('path')
const ProgressBar = require('electron-progressbar');

let progressBar;

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    icon: './assets/icon.png',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

function showProgressbar() {
  if (progressBar) {
    return;
  }
  
  progressBar = new ProgressBar({
    text: 'Estou fazendo o batimento',
    detail: 'Só um minuto...'
  });
  
  progressBar
    .on('completed', function() {
      progressBar.detail = 'Batimento completo, arquivo final gerado!';
      progressBar = null;
    })
    .on('aborted', function() {
      console.info(`aborted...`);
      progressBar = null;
    });

  }

  function setProgressbarCompleted() {
    if (progressBar) {
      progressBar.setCompleted();
    }
  }

  function setProgressbarAborted() {
    if (progressBar) {
      progressBar.close();
    }
  }

try {
  require('electron-reloader')(module)
} catch (_) {}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  ipcMain.on('show-progressbar', showProgressbar);
  ipcMain.on('set-progressbar-completed', setProgressbarCompleted);
  ipcMain.on('set-progressbar-aborted', setProgressbarAborted);

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
