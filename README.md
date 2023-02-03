# reserve-lib-thu-crawler

## 教参平台爬虫（NodeJS版）v1.0

从清华教参平台爬取每一页的图片，免登录，不使用cookie。

### Pre-install

1. 需要安装node.js
2. 需要安装readline-sync
   ```npm install -g readline-sync```

### Usage

1. 登录教参平台，找到要下载的书籍，打开第一个想要下载的章节（如果想要下载全书，即为“阅读全文”下的第一个链接），默认下载到最后一章；
2. 复制下载开始章节的地址（下文以`http://reserves.lib.tsinghua.edu.cn/book4//00013243/00013243000/mobile/index.html`为例）
3. 打开命令行，导航至当前文件夹后输入

   ```sh
   node crawler.js http://reserves.lib.tsinghua.edu.cn/book4//00013243/00013243000/mobile/index.html
   ```

4. 如果链接地址格式正确，程序将提示按下回车以开始下载；如果链接地址格式有误，将提示检查并重新粘贴地址（只需重新输入正确链接地址即可）；
5. 下载的图片保存在`./00013243/imgs/`下；
6. 目前还不能自动合并为pdf文件，请用pdf编辑软件（如福昕等）自行添加文件夹合并。

### Speed

下载490页书籍（共245MB）大约需要1分45秒。

### Plan

1. 增加转换为pdf文件功能
2. 增加下载章节数选项
3. 增加网页插件
4. 重构代码
