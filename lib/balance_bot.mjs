import { requestAI } from './open_ai.mjs';
import { getAppPath } from './get_app_path.mjs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const clipboardy = await import('clipboardy');
import { keyboard, Key } from "@nut-tree/nut-js";
import { exec } from 'child_process';

export async function balance_bot(text, dialogWindow, mainWindow) {
    let  context = '';
    try {
        // 读取剪贴板内容
        context = clipboardy.readSync();
    } catch (error) {
        console.error('读取或写入剪贴板时出错:');
    }
    let reference = context ? `reference ${context}` : "";

    let question = [
        {   
            "role": "user",
            "content": [
            {
                "type": "text",
                "text": `
                my text is "${text}",
                if my text is about negative induced emotion:
                    please Answer me 1.relax
                if my text is about open app:
                    please Answer me 2.open app
                if my text is about wanna write/rewrite text or code:
                    please Answer me "3.write text ", then return text or code about "${text} ${reference}" (only Answer text or code!)
                else:
                    please Answer me 4.unknown
                `
            }
            ]
        }
    ];

    requestAI(question, async (result) => {
        let answer = result.answer;
        console.log(answer);

        if (answer.includes('4.unknown')) {
            mainWindow.webContents.send('play_prompt', 'unknown');
            dialogWindow.webContents.send('answer-question', "I can't do this yet. Let me try something else.");

        } else if (answer.includes('1.relax')) {
            console.log('open game');
            mainWindow.webContents.send('play_game');
        } else if (answer.includes('3.write text')) {
            const _answer = answer.replace("3.write text", '');
            const code = _answer.replace(/```.*?\n([\s\S]*?)\n```/, '$1');
            clipboardy.writeSync(code);
            await keyboard.pressKey(Key.LeftControl, Key.V);
            await keyboard.releaseKey(Key.LeftControl, Key.V);
            clipboardy.writeSync('');
        } else if (answer.includes('2.open app')) {
            let appPath = getAppPath();
            console.log('appPath', appPath);
            let question = [
                {
                    "role": "system",
                    "content": [
                    {
                        "type": "text",
                        "text": `I wanna "${text}", only return app path text in ${appPath} without other text`
                    }
                    ]
                }
            ];
            requestAI(question, (result) => {
                dialogWindow.webContents.send('answer-question', "I wanna open app!");
                const cleanedText = result.answer.replace(/```|\n/g, '');
                console.log('appPath', cleanedText);
                let path = cleanedText.replace('plaintext', '');
                exec(`start "" "${path}"`, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`Error opening app: The application was not found`);
                        return;
                    }
                    console.log(`App opened: ${stdout}`);
                });
            });
        }
    });
}




