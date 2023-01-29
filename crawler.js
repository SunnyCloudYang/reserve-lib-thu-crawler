const http = require('http');
const fs = require('fs');
const rlSync = require('readline-sync');
// const jsPDF = require('jspdf');
// const { pathToFileURL } = require('url');

// const doc = new jsPDF.jsPDF('', 'mm', 'a4');
const options = {
    headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36 Edg/109.0.1518.61'
    }
};

const rawURL = "http://reserves.lib.tsinghua.edu.cn/book5//00001034/00001034000/mobile/index.html";
const baseURL = "http://reserves.lib.tsinghua.edu.cn/";
const ext = ".jpg";


function checkURL(rawURL) {
    if (rawURL.match(/http:\/\/reserves\.lib\.tsinghua\.edu\.cn\/book\d\/\/\d{8}\/\d{11}\/mobile\/index\.html/))
        return true;
    else
        return false;
}

function parseURL(rawURL) {
    // e.g. book = 'book4//00014079/00014079'
    let book = rawURL.match(/book\d\/\/\d{8}\/\d{8}/)[0];
    let startChap = Number(rawURL.slice(60, 63));
    return [book, startChap];
}

function downloadSingleChap(book, curChap) {
    let pageCnt = 0;
    let chapCode = (curChap >= 0 && curChap < 10 ? "00" : curChap > 9 && curChap < 100 ? "0" : "") + curChap;
    let curChapURL = baseURL + book + chapCode + "/files/mobile/";
    let curChapConfig = baseURL + book + chapCode + "/mobile/javascript/config.js";

    http.get(curChapConfig, options, (res) => {
        let data = "";
        if (res.statusCode == 200) {
            res.setEncoding('utf-8');
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                if (!data.match(/bookConfig\.totalPageCount=\d+/)) {
                    console.log("Book download finished.");
                    // doc.save(book.slice(7, 15) + '/pdf/' + book.slice(7, 15) + '.pdf');
                    return;
                }
                pageCnt = Number(data.match(/bookConfig\.totalPageCount=\d+/)[0].slice(26,));

                console.log("Chap %d has %d pages in total:", curChap, pageCnt);

                downloadImgs(book, curChap, curChapURL, pageCnt, ext, 1);
                return pageCnt;
            })
        }
        else {
            return -1;
        }
    });
}

function downloadImgs(book, curChap, curChapURL, pageCnt, ext, cnt) {
    // console.log(book, curChapURL, pageCnt, cnt);
    setTimeout(() => {
        http.get(curChapURL + cnt + ext, options, (res) => {
            if (res.statusCode == 200) {
                let path = "./" + book.slice(7, 15) + "/imgs/" + curChap + "-" + cnt + ext;
                const img = fs.createWriteStream(path);
                res.pipe(img);
                img.on('finish', () => {
                    img.close();
                    // doc.addPage();
                    // doc.addImage(path, 'jpg', 0, 0, 210, 297);
                    console.log(curChap + "-" + cnt + ext + " downloaded.");
                })
            }
            else {
                console.log("Error: " + res.statusCode);
                return;
            }
        }).on('error', (err) => {
            console.log("Error: ", err.message);
        });
        if (cnt >= pageCnt) {
            console.log("Chapter %d finished.", Number(curChapURL.slice(60, 63)));
            downloadSingleChap(book, curChap + 1);
            return;
        }
        else {
            downloadImgs(book, curChap, curChapURL, pageCnt, ext, cnt + 1);
        }
    }, 200);
}

function geneURL(book, chap, page, ext) {
    let resultURL = baseURL + book + ((chap >= 0 && chap < 10 ? "00" : chap > 9 && chap < 100 ? "0" : "") + chap) + "/files/mobile/" + page + ext;
    return resultURL;
}

function main(rawURL) {
    while (!checkURL(rawURL)) {
        console.log("Usage: node crawler.js <url of the first chapter you want to download>");
        console.log("e.g.: node crawler.js http://reserves.lib.tsinghua.edu.cn/book4//00013243/00013243000/mobile/index.html");
        rawURL = rlSync.question("Invalid url, please check and paste the url again: ");
    }
    if (checkURL(rawURL)) {

        let book = parseURL(rawURL)[0];
        let startChap = parseURL(rawURL)[1];
        let chapStartURL = geneURL(book, startChap, 1, ext);
        let dir = book.slice(7, 15);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
            fs.mkdirSync(dir + "/imgs");
            // fs.mkdirSync(dir + "/pdf");
        }

        http.get(chapStartURL, options, (res) => {
            if (res.statusCode == 200) {
                downloadSingleChap(book, startChap);
            }
            else {
                console.log("Download start failed, please check your Internet.");
            }
        });
    }
}

process.argv.slice(2)[0] ? main(process.argv.slice(2)[0]) : main(rawURL);
