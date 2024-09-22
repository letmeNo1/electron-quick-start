import { contextBridge, ipcRenderer } from 'electron';
import { spawn } from 'child_process';
const sdk = require("microsoft-cognitiveservices-speech-sdk");

contextBridge.exposeInMainWorld('electron', {
    on: (channel, listener) => ipcRenderer.on(channel, listener),
    spawn: (command, args) => spawn(command, args),
    send: (channel, ...args) => ipcRenderer.send(channel, ...args)
});


let recognizer;
let recognizing = false;

contextBridge.exposeInMainWorld('speechAPI', {
    startContinuousRecognition: (key, region, callback, statusCallback) => {
      if (!recognizer) {
        const speechConfig = sdk.SpeechConfig.fromSubscription(key, region);
        const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
        recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
  
        recognizer.recognizing = (s, e) => {
          if (e.result.reason === sdk.ResultReason.RecognizingSpeech) {
            statusCallback('recognizing');
          }
        };
  
        recognizer.recognized = (s, e) => {
          if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
            callback(e.result.text);
          }
        };
      }
      recognizer.startContinuousRecognitionAsync();
      recognizing = true;
    },
    stopContinuousRecognition: () => {
      if (recognizer) {
        recognizer.stopContinuousRecognitionAsync();
        recognizing = false;
      }
    },
    isRecognizing: () => recognizing
  });