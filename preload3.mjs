import { contextBridge, ipcRenderer } from 'electron';
import { spawn } from 'child_process';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// const sdk = require("microsoft-cognitiveservices-speech-sdk");

contextBridge.exposeInMainWorld('electron', {
    on: (channel, listener) => ipcRenderer.on(channel, listener),
    spawn: (command, args) => spawn(command, args),
    send: (channel, ...args) => ipcRenderer.send(channel, ...args)
});


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const command = '.\\bin\\snsr-eval.exe';

const args = [
    '-t', path.resolve(__dirname, 'model', 'tpl-vad-lvcsr-3.10.0.snsr'),
    '-f', '0', path.resolve(__dirname, 'model','stt-enUS-automotive-small_medium-2.2.13-BBB-ff.snsr'),
    '-v'
];

let childProcess = null;

contextBridge.exposeInMainWorld('speechAPI', {
  startContinuousRecognition: (key, region, callback, statusCallback) => {
    console.log('start-process', command, args);

    childProcess = spawn(command, args);

    childProcess.stdout.on('data', (data) => {
      if (data.toString().includes('NLU intent')) {
        // console.log('解释', data.toString());
        const match = data.toString().match(/= (.*)/);
        if (match) {
          const result = match[1];
          console.log(result); // 输出: what can i do for you
          callback(result);
        }
      }
      else {
        console.log('recognizing');
        statusCallback('recognizing');
      }
    });

    childProcess.stderr.on('data', (data) => {
      console.log('stderr', data.toString());
      statusCallback('error');
    });

    childProcess.on('close', (code) => {
      console.log('close', code);
      statusCallback('closed');
    });
  },
  stopContinuousRecognition: () => {
    if (childProcess) {
      childProcess.kill();
      childProcess = null;
    }
  },
  isRecognizing: () => !!childProcess
});