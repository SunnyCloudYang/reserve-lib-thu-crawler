# 教参平台爬虫（NodeJS版）v2.0

**注意：由于教参平台验证方式发生变化，此工具已不保证能正常使用！！**

从清华教参平台爬取教材每一页的图片并生成pdf，免登录，不使用cookie。

## 需要什么

1. 需要[安装node.js](https://nodejs.org/zh-cn/download)
2. 需要[安装PDFKit](http://pdfkit.org/)：`npm install -g pdfkit`

## 如何使用

1. **登录**教参平台，找到要下载的书籍（下文以《概率论与数理统计》为例），打开第一个想要下载的章节链接（如果想要下载全书，即为“阅读全文”下的第一个链接），默认从当前章节下载到最后一章；
2. 复制当前章节的地址（如`http://reserves.lib.tsinghua.edu.cn/book4//00013243/00013243000/mobile/index.html`）；
3. 打开命令行，导航至`main.js`所在文件夹后输入

   ```sh
   node main.js http://reserves.lib.tsinghua.edu.cn/book4//00013243/00013243000/mobile/index.html
   ```

4. 如果链接地址格式正确，按提示操作即可开始下载；如果提示链接地址格式有误，请检查并重新粘贴地址（只需重新输入正确链接地址即可）；
5. 如果足够幸运，这本书在录入时有书名信息（以`${title}`替代）的话，下载的文件夹将在当前目录下以`${title}-${author}`的格式命名，否则将以书籍编号（如`00013243`）命名；
6. 下载的图片保存在`./${title}-${author}/imgs/`下，格式为`${chapter}-${page}.jpg` (e.g. `114-514.jpg`即为第114章的第514页)；
7. <del>目前还不能自动合并为pdf文件，请用pdf编辑软件（如福昕等）自行添加文件夹合并。</del>生成的pdf文件保存在`./${title}-${author}/pdf/`下，如果教参平台的链接中分有章节，pdf中会自动生成对应的章节书签；
8. 下载完成后程序会自动退出，如果下载过程中出现错误，程序<del>大概率</del>也会自动退出并提示错误信息，此时可以在排除错误后重新运行程序，如果需要终止程序，请按下`Ctrl + C`；
9. 下载的图片文件并不会自动删除，建议在检查pdf没有问题后自行斟酌是否需要删除，以免占用过多空间。

## 高级用法

1. 修改`download.js`文件中`download()`函数内定义的的qualityIndex，可以选择下载图片的质量，从0到2分别对应低、中、高质量，默认为1；
2. 主程序在`main.js`中，通过调用`download.js`下载图片，调用`img2pdf.js`生成pdf文件，可以根据需要自行修改，`crawler.js`已弃用。

## 下载速度

<del>下载490页书籍（共245MB）大约需要1分45秒。</del>
大大提升了下载速度，具体时间取决于网络环境，校园网环境下通常在4MB/s左右。

## 计划工作

- [x] 增加转换为pdf文件功能
- [ ] 增加下载章节数选项
- [ ] 增加更多配置参数
- [ ] 增加网页插件
- [ ] 重构代码

## 更新日志

### v2.0 —— 2023.9.3

- [x] 重构代码，提高下载速度
- [x] 增加转换为pdf功能

### v1.0 —— 2023.1.29

- [x] 完成基本功能

## 免责声明

本项目仅供清华大学学生下载课内教参，方便学习生活。**请勿将下载的文件传播或售与他人，否则引起的版权及其他后果由使用者自负。**

## 联系作者

在使用中如果有任何问题，欢迎[联系我](mailto:sunnycloudyang@outlook.com)。
