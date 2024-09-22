import clipboardy from 'clipboardy';

// 写入剪贴板
clipboardy.writeSync('你好，世界！');

// 从剪贴板读取
const clipboardText = clipboardy.readSync();
console.log(clipboardText); // 输出: 你好，世界！