import { exec } from 'child_process';
import { dialog, app } from 'electron';

function unsignedToSigned(unsignedVal) {
    const maxUnsigned8Bit = 2 ** 8 - 1;
    return unsignedVal >= 128 ? -(maxUnsigned8Bit - unsignedVal + 1) : unsignedVal;
}

export function gnpSendAndGetReply(read, callback) {
    exec(read, (error, stdout, stderr) => {
        // if (error) {
        //     const errorMessage = error.toString().substring(50);
        //     // dialog.showErrorBox('Error', "GN device not recognized", () => {
        //     //     app.quit();
        //     // });
        //     callback(error, null);
        // }

        const dataParse = stdout.trim().replace(/ /g, "");
        const lastFourteenDigits = dataParse.slice(-16);

        const firstTwoDigits = lastFourteenDigits.slice(0, 2);
        const gestureMap = {
            "01": "left",
            "02": "right",
            "03": "forward",
            "04": "backward",
            "05": "onHead",
            "06": "onHeadReverse"
        };
        const variable = gestureMap[firstTwoDigits] || "unknown";

        const xValue = parseInt(lastFourteenDigits.slice(2, 4), 16);
        const decimalValueX = unsignedToSigned(xValue);

        const yValue = parseInt(lastFourteenDigits.slice(6, 8), 16);
        const decimalValueY = unsignedToSigned(yValue);

        const zValue = parseInt(lastFourteenDigits.slice(10, 12), 16);
        const decimalValueZ = unsignedToSigned(zValue);

        const keyPress = lastFourteenDigits.slice(-2);

        callback({
            x: decimalValueX,
            y: decimalValueY,
            z: decimalValueZ,
            gesture: variable,
            keyPress: keyPress === "01"
        });
    });
}