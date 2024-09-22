import { app, BrowserWindow, Tray, Menu, Notification, ipcMain, screen, globalShortcut,dialog } from 'electron';
import path from 'path';
import Store from 'electron-store';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { gnpSendAndGetReply } from './lib/read_gnp.mjs';
import { requestAI } from './lib/open_ai.mjs';
import { balance_bot } from './lib/balance_bot.mjs';
import pkg from 'microsoft-cognitiveservices-speech-sdk';
const SpeechSDK = pkg;
import clipboardy from 'clipboardy';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow;
let tray;
let recognitionSwitch = true;
let dialogWindow;
let gameWindow;
let gameStaus = false;
const store = new Store();
let question = [];
let childProcess = null;
let intervalId
let teamsButtonPress = true


function createWindow() {
    mainWindow = new BrowserWindow({
        icon: path.join(__dirname, 'f3.ico'),
        width: 800,
        height: 600,
        webPreferences: {
            sandbox: false,
            preload: path.join(__dirname, 'preload.mjs'),
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: true
        }
    });

    mainWindow.loadFile('main.html');
    mainWindow.hide();

    tray = new Tray(path.join(__dirname, 'f3.png'));
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Show App', click: () => mainWindow.show() },
        { label: 'Quit', click: () => {
            if (dialogWindow) {
                dialogWindow.close();
                dialogWindow = null;
            }
            app.quit();
            
            }
        }
    ]);
    tray.setContextMenu(contextMenu);
    tray.setToolTip('My Electron App');

    tray.on('click', () => {
        mainWindow.show();
    });
    
    
    ipcMain.on('play_end', (event) => {
        recognitionSwitch = true;
    })

    ipcMain.on('recognized-initail-complete', (event, text) => {
        showNotification('Initialization Complete', 'Your application is ready to use.');
    });


    ipcMain.on('play_waterflow', (event) => {

        gameWindow.webContents.send('play_waterflow');
        
    })

    ipcMain.on('recogning-text', async (event, text) => {
        if(dialogWindow){
            dialogWindow.webContents.send('set-text', text);
        }
    });

    ipcMain.on('recognized-text', async (event, text) => {
        console.log('recognized-text', text);
        console.log('recognitionSwitch', recognitionSwitch);
        if (recognitionSwitch &&text.length > 0) 
            {
            dialogWindow.webContents.send('confirm-text', text);
            balance_bot(text,dialogWindow,mainWindow)         

            // balance_bot(text,dialogWindow,mainWindow)         
            }
        }
    );

    ipcMain.on('creat_game_window', (event) => {
        gameStaus = true;
        dialogWindow.close();
        dialogWindow = null;
        mainWindow.webContents.send('stop_voice');
        gameWindow = new BrowserWindow({
            icon: path.join(__dirname, 'f3.ico'),
            width: 1,
            height: 1,
            frame: false,
            transparent: true,
            webPreferences: {
                nodeIntegration: true,
                preload: path.join(__dirname, 'preload.mjs'),
                contextIsolation: true,
                nodeIntegration: true,
            }
        });
        gameWindow.loadFile(path.join(__dirname, 'game.html'));
        gameWindow.webContents.send('play-sound');
        
    });
}
        
    

function showNotification(title, body) {
    new Notification({ title, body }).show();
}

function parseContent(arr) {
    let result = '';

    arr.forEach(item => {
        if (item.role === 'user') {
          result += `ask: ${item.content[0].text} `;
        } else if (item.role === 'system') {
          result += `answer: ${item.content[0].text}`;
        }
      });
      
    return result;
  }

function buildMessge(text) {
    let chatTempHistory = []
    let message = {
        role: 'user',
        content: [{
            type: 'text',
            text: text
        }]
    };
    chatTempHistory.push(message);
    question = chatTempHistory.map(entry => ({
        role: entry.role,
        content: entry.content
    }));
    return question;
}



app.whenReady().then(() => {
    gnpSendAndGetReply(`${path.join(__dirname, 'gnp', 'GNpSend.exe').replace("app.asar\\","")} Request 04 00 22 46 04 37`, (result,error) => {
        console.log('result', result);
        if (result.x.toString() === "NaN") {
            new Notification({ body: 'Initialization fail' }).show();

            dialog.showMessageBox({
                type: 'error',
                title: 'GN device not recognized',
                message: `${JSON.stringify(result)}`,
                buttons: ['OK']
            }).then(() => {
                console.log('ahnk');
                mainWindow.close();
                app.quit();
            });
            return;
        }else{
            new Notification({ body: 'Initialization complete' }).show();
        }
    });
    
    createWindow();

    let x, y, z;

    // Loop to call gnpSendAndGetReply every 5 seconds
    intervalId = setInterval(() => {
        if (mainWindow.isDestroyed()) return; // 检查对象是否已销毁

        gnpSendAndGetReply(`${path.join(__dirname, 'gnp', 'GNpSend.exe').replace("app.asar\\","")} Request 04 00 22 46 04 37`, (result,error) => {
            // console.log('result', result);
            if (result.toString().includes("Error: Command faile")) {
                app.quit(); 
                return;
            }
            if (result.keyPress === true && teamsButtonPress){
                
                teamsButtonPress = false;
                if (gameWindow && gameStaus) {
                    mainWindow.webContents.send('stop_voice');
                    console.log('close gameWindow');
                    gameWindow.close();
                    gameWindow = null;
                }
                if (!gameStaus) {
                
                    if (dialogWindow && !gameStaus) {
                        console.log('close dialogWindow!!!!!!!!!');
                        let chatTempHistory = store.get('chatTempHistory');
                        let message = buildMessge(parseContent(chatTempHistory)+ " Add a title to the conversation"  )
                        console.log('message', message);
                        requestAI(message, (result) => {
                            console.log('title', result);

                        })
                        store.set('chatHistory', []);
                        console.log('close dialogWindow');

                        mainWindow.webContents.send('stop_voice');

                        dialogWindow.close();
                        dialogWindow = null;
                        } else {
                            mainWindow.webContents.send('start_voice');
                            recognitionSwitch = true
                            clipboardy.write("");
                            store.set('chatTempHistory', []);
                            const { width, height } = screen.getPrimaryDisplay().workAreaSize;
                            dialogWindow = new BrowserWindow({
                                icon: path.join(__dirname, 'f3.ico'),
                                width: 400,
                                height: 300,
                                x: width - 400,
                                y: height - 200,
                                backgroundColor: '#313940',
                                frame: true,
                                alwaysOnTop: true,
                                webPreferences: {
                                    sandbox: false,
                                    preload: path.join(__dirname, 'preload.mjs'),
                                    contextIsolation: true,
                                    nodeIntegration: true,
                                }
                            });
                            dialogWindow.loadFile(path.join(__dirname, 'dialog.html'));
                            dialogWindow.once('ready-to-show', () => {
                                mainWindow.webContents.send('play_prompt',  'what_can_i_do' );

                            })

                        }
                    }
            }

            x = result.x;
            y = result.y;
            z = result.z;
            if(gameWindow){
                console.log('send gnp_data ',x, y, z);
                gameWindow.webContents.send('gnp_data', { x, y, z });
            }else{
                gameStaus = false;
            }
            teamsButtonPress = true;
        });
    }, 100);

    
    app.on('activate', () => {
      
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('will-quit', () => {
    // 注销所有快捷键
    globalShortcut.unregisterAll();
    if (childProcess) {
        childProcess.kill();
        childProcess = null;
    }
    if (dialogWindow) {
        dialogWindow.close();
        dialogWindow = null;
    }
});


app.on('before-quit', () => {
    clearInterval(intervalId);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }

});