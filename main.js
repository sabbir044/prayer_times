const { app, BrowserWindow, ipcMain } = require('electron');

var fs = require('fs');
const schedule = require('node-schedule');


//load json file
var jsonObj
var currentFileName = ""
var lastUpdatedFileName = ""

function loadFileToJsonObj() {
    try {
        console.log("trying to load praer_times json file")
        fileName = `${__dirname}/prayer_times.json`
        year = new Date().getFullYear()
        yearFileName = `${__dirname}/prayer_times_${year}.json`
        fileName = yearFileName
        if (currentFileName !== fileName) {
            if (app.commandLine.hasSwitch('file') === true) {
                fileName = app.commandLine.getSwitchValue('file')
                console.log("fileswitch value: " + fileName)
            }
            console.log("loading new file: " + fileName)
            var jsonStr = fs.readFileSync(fileName, 'utf8')
            jsonObj = JSON.parse(jsonStr);
            currentFileName = fileName
        }
    } catch (error) {
        console.log("Unable to open file")
        console.log(error)
    }
}

loadFileToJsonObj()

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

const createWindow = () => {

    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        kiosk: false
    });

    // and load the index.html of the app.
    mainWindow.loadURL(`file://${__dirname}/index.html`);

    // Open the DevTools.
    //mainWindow.webContents.openDevTools();

    // Emitted when the window is closed.
    mainWindow.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });

    mainWindow.webContents.on('did-finish-load', () => {
        if (jsonObj != null) {
            mainWindow.webContents.send('prayer-times-start', jsonObj);
            lastUpdatedFileName = currentFileName
        } else {
            console.log("jsonObj is null")
        }
    });
    mainWindow.maximize()

};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

// try to load file every day at 12 AM if needed
const job = schedule.scheduleJob('0 0 0 * *', function(){
    loadFileToJsonObj()
   // mainWindow.webContents.send('updated-prayer-times', jsonObj);
    if (lastUpdatedFileName !== "" && lastUpdatedFileName !== currentFileName) {
        console.log("sending updated-prayer-times with new file name" + currentFileName)
        mainWindow.webContents.send('updated-prayer-times', jsonObj);
        lastUpdatedFileName = currentFileName
    }
});
