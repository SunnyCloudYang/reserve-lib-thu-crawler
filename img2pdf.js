const fs = require('fs');
const PDFDocument = require('pdfkit');
const { promisify } = require('util');

// const bookId = '00010472';
// const imageFolder = `./${bookId}/imgs`;
// const pdfFile = `./${bookId}/pdf/${bookId}.pdf`;

async function img2pdf(imageFolder, pdfFile) {
    try {
        const doc = new PDFDocument();
        const { outline } = doc;
        const topLevel = outline.addItem('目录');

        const readdir = promisify(fs.readdir);
        const files = await readdir(imageFolder);

        let sortedFiles = files.sort((a, b) => {
            const chapterA = parseInt(a.split('-')[0]);
            const chapterB = parseInt(b.split('-')[0]);
            const pageA = parseInt(a.split('-')[1].split('.')[0]);
            const pageB = parseInt(b.split('-')[1].split('.')[0]);
            if (chapterA === chapterB) {
                return pageA - pageB;
            }
            else {
                return chapterA - chapterB;
            }
        });
       
        let chapter = 0;
        let prevChapter = 0;

        for (const file of sortedFiles) {
            if (file.endsWith('.jpg') || file.endsWith('.png')) {
                const imagePath = `${imageFolder}/${file}`;
                chapter = parseInt(file.split('-')[0]);
                try {
                    await doc.image(imagePath, 0, 0, {
                        fit: [595, 842],
                        align: 'center',
                        valign: 'center'
                    });
                    // add bookmark for each chapter
                    if (chapter !== prevChapter) {
                        const chapterName = `第${chapter}章`;
                        const chapterItem = topLevel.addItem(chapterName);
                        // chapterItem.addPage(doc.page);
                        prevChapter = chapter;
                    }
                    doc.addPage({size: 'A4'});
                }
                catch (error) {
                    console.error(`无法读取图片文件: ${imagePath}，已跳过`);
                }
            }
        }

        const pdfStream = fs.createWriteStream(pdfFile);
        doc.pipe(pdfStream);
        doc.end();

        await new Promise((resolve, reject) => {
            pdfStream.on('finish', () => {
                console.log('PDF 文件生成完成:', pdfFile.slice(2));
                resolve();
            });
            pdfStream.on('error', () => {
                reject(new Error('PDF 文件生成失败'));
            });
        });
    } catch (error) {
        console.error('无法读取文件夹或生成PDF文件:', error);
    }
}

// img2pdf(imageFolder, pdfFile);

module.exports = {
    img2pdf
};
