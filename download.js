const fs = require('fs');
const request = require('request');

const exampleUrl = 'http://reserves.lib.tsinghua.edu.cn/book4//00010472/00010472000/mobile/index.html';
const baseUrl = 'http://reserves.lib.tsinghua.edu.cn/';

const useragent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36 Edg/109.0.1518.61'

async function downloadImage(imageUrl, outputPath, retryCount = 0) {
    return new Promise((resolve, reject) => {
        request.head(
            {
                url: imageUrl,
                headers: {
                    'User-Agent': useragent
                }
            },
            (err, res, body) => {
                if (err) {
                    reject(err);
                    return;
                }

                const stream = request({
                    url: imageUrl,
                    headers: {
                        'User-Agent': useragent
                    }
                });

                stream.pipe(fs.createWriteStream(outputPath));
                // check status code
                stream.on('response', (response) => {
                    if (response.statusCode !== 200) {
                        reject(new Error(`Download failed with status code ${response.statusCode}: ${imageUrl}`));
                    }
                });
                stream.on('end', () => resolve());

                stream.on('error', () => {
                    // Download failed, retry up to three times
                    if (retryCount < 3) {
                        console.log(`Download failed, retrying: ${imageUrl}`);
                        downloadImage(imageUrl, outputPath, retryCount + 1)
                            .then(resolve)
                            .catch(reject);
                    } else {
                        // Give up after three failed attempts
                        reject(new Error(`Download failed after three attempts: ${imageUrl}`));
                    }
                });
            }
        );
    });
}

function getBookCode(url) {
    // match 'http://reserves.lib.tsinghua.edu.cn/book5//00000827/00000827000/mobile/index.html' to 'book5//00000827/00000827'
    const pattern = /book\d\/\/(\d{8})\/\d{8}/;
    const matches = url.match(pattern);
    // console.log(matches);
    if (matches && matches.length >= 2) {
        return matches[0];
    }
    return null;
}

function getBookTitle(url) {
    return new Promise((resolve, reject) => {
        request(
            {
                url: url,
                headers: {
                    'User-Agent': useragent
                }
            },
            (error, response, body) => {
                if (error) {
                    reject(error);
                    return;
                }

                try {
                    const pattern = /图书在版编目 \(CIP\) 数据\s+.*\s+(.*) ISBN \d/;
                    // console.log(body);
                    const titleMatch = body.match(pattern);
                    if (titleMatch) {
                        //replace / with -, remove '编著' or '著' at the end
                        const title = titleMatch[0].slice(19).match(/\s+[\u4e00-\u9fa5\/]+\./)[0].trim().slice(0, -1).replace(/\//g, '-').replace(/编著|著$/, '');
                        // console.log(`Book title: ${title}`);
                        resolve(title);
                    } else {
                        reject(new Error('Book title not found'));
                    }
                } catch (err) {
                    reject(err);
                }
            }
        );
    });
}

function getPageCount(chapterConfigUrl) {
    // console.log(`Getting page count from: ${chapterConfigUrl}`);
    return new Promise((resolve, reject) => {
        request(
            {
                url: chapterConfigUrl,
                headers: {
                    'User-Agent': useragent
                }
            },
            (error, response, body) => {
                if (error) {
                    reject(error);
                    return;
                }

                try {
                    const pattern = /bookConfig\.totalPageCount=(\d+)/;
                    const pageCountMatch = body.match(pattern);
                    if (pageCountMatch) {
                        const pageCount = parseInt(pageCountMatch[1]);
                        // console.log(`Page count: ${pageCount}`);
                        resolve(pageCount);
                    } else {
                        reject(new Error('Page count not found'));
                    }
                } catch (err) {
                    reject(err);
                }
            }
        );
    });
}

async function download(textbookUrl = exampleUrl) {
    try {
        // textbookUrl: 'http://reserves.lib.tsinghua.edu.cn/book5//00000827/00000827000/mobile/index.html'
        // bookCode: 'book5//00000827/00000827'
        const bookCode = getBookCode(textbookUrl);
        if (!bookCode) {
            console.log('Unable to get book code from url');
            return;
        }

        const quality = ['thumb', 'page', 'large', 'mobile'];
        const qualityIndex = 3;
        let title = bookCode.slice(7, 15);

        try {
            // bookTitle: '复变函数/郑建华编著'
            const bookTitle = await getBookTitle(`${baseUrl}${bookCode}000/mobile/javascript/search_config.js`);
            title = bookTitle;
            // console.log(`Book title: ${bookTitle}`);        
        }
        catch (error) {
            console.log('Unable to get book title, using book code instead.');
        }
        // ask user whether to download
        console.log(`Are you sure to download book: ${title}?`);
        console.log('Press Enter to continue, Ctrl+C to exit');
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        await new Promise((resolve) => process.stdin.once('data', resolve));
    
        let dir = `./${title}`;
        if (!fs.existsSync(dir)) {
            console.log(`Creating directory ${dir}`);
            fs.mkdirSync(dir);
        }
        else {
            // if directory exists, ask whether to change a folder or rename it
            console.log(`Directory ${dir} already exists, do you want to rename it?`);
            console.log('Y/y to rename, Enter to use the existing folder, Ctrl+C to exit');
            process.stdin.resume();
            process.stdin.setEncoding('utf8');
            const answer = await new Promise((resolve) => process.stdin.once('data', resolve));
            if (answer.trim().toLowerCase() === 'y') {
                let newDir = `${dir}-${Date.now()}`;
                console.log(`Creating new directory ${newDir}`);
                dir = newDir;
                fs.mkdirSync(dir);
            }
            else {
                console.log(`Using existing directory ${dir}`);
            }
        }
        // make subdirectories
        if (!fs.existsSync(`${dir}/imgs`)) {
            fs.mkdirSync(`${dir}/imgs`);
        }
        if (!fs.existsSync(`${dir}/pdf`)) {
            fs.mkdirSync(`${dir}/pdf`);
        }

        let startChapter = Number(textbookUrl.match(/(\d{3})\/mobile/)[1]);
        if (startChapter !== 0) {
            console.log(`Start downloading from chapter ${startChapter}`);
        }
        let chapterCount = 0;
        let totalPageCount = 0;
        while (true) {
            try {
                // chapterUrl: 'http://reserves.lib.tsinghua.edu.cn/book5//00000827/00000827000/mobile/'
                const chapterUrl = `${baseUrl}${bookCode}${(startChapter + chapterCount).toString().padStart(3, '0')}/mobile/`;
                const pageCount = await getPageCount(chapterUrl + 'javascript/config.js');
                // console.log(chapterUrl + 'javascript/config.js');

                if (pageCount) {
                    console.log(`Chapter ${(startChapter + chapterCount)} has ${pageCount} pages`);
                }
                else {
                    console.log(`Chapter ${(startChapter + chapterCount)} not found, please check.`);
                    break;
                }

                const pages = Array.from({ length: pageCount }, (_, i) => (i + 1).toString());

                for (const page of pages) {
                    // imageUrl: 'http://reserves.lib.tsinghua.edu.cn/book5//00000827/00000827000/files/mobile/1.jpg'
                    const imageUrl = `${baseUrl}${bookCode}${(startChapter + chapterCount).toString().padStart(3, '0')}/files/${quality[qualityIndex]}/${page}.jpg`;

                    // outputPath: './00000827/0-1.jpg'
                    const outputPath = `${dir}/imgs/${(startChapter + chapterCount)}-${page}.jpg`;

                    // check if file exists
                    if (fs.existsSync(outputPath)) {
                        process.stdout.write("\r\x1b[K" + `Skipping: ${chapterCount}-${page}.jpg`);
                        continue;
                    }
                    process.stdout.write("\r\x1b[K" + `正在下载: ${(startChapter + chapterCount)}-${page}.jpg`);
                    await downloadImage(imageUrl, outputPath, 0);
                    totalPageCount++;
                    process.stdout.write("\r\x1b[K" + `下载完成: ${(startChapter + chapterCount)}-${page}.jpg`);

                    await new Promise((resolve) => setTimeout(resolve, 100));
                }
                console.log(`\nChapter ${(startChapter + chapterCount)} downloaded.`);
                chapterCount++;
            } catch (error) {
                console.log(`Chapter ${(startChapter + chapterCount)} not found, stop download.`);
                break;
            }

        }
        console.log(`Download finished. ${chapterCount} chapter(s) with ${totalPageCount} page(s) in total.`);
        
        return dir;
    } catch (error) {
        console.error('下载出错:', error);
    }
}

// process.argv.slice(2)[0] ? download(process.argv.slice(2)[0]) : download();
module.exports = {
    download
}