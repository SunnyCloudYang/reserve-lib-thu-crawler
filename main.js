const download = require('./download.js');
const img2pdf = require('./img2pdf.js');

let textbookUrl = process.argv[2];

function checkUrl(url) {
    const pattern = /^http:\/\/reserves\.lib\.tsinghua\.edu\.cn\/book\d\/\/\d{8}\/\d{11}\/mobile\/index\.html/;
    if (pattern.test(url)) {
        return true;
    }
    else {
        return false;
    }
}

async function main() {
    while (!checkUrl(textbookUrl)) {
        console.log('输入的网址不正确，请重新输入');
        process.stdin.resume();
        textbookUrl = await new Promise((resolve, reject) => {
            process.stdin.once('data', data => {
                resolve(data.toString().trim());
            });
        });
    }
    const dir = await download.download(textbookUrl);
    // const dir = './00001034'
    console.log('下载完成:', dir.slice(2));
    console.log('正在生成 PDF 文件...');
    await img2pdf.img2pdf(`${dir}/imgs`, `${dir}/pdf/${dir.slice(2)}.pdf`);
    console.log('全部完成，程序退出');
    process.exit(0);
}

main();