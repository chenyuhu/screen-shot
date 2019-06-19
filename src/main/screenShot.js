const path = require('path')
const Events = require('events')
const { ipcMain, BrowserWindow, nativeImage, clipboard, dialog } = require('electron')
const fs = require('fs')
console.log(`file://${path.join(__dirname, '/renderer/index.html')}`, process.env.NODE_ENV)

export default class ScreenShot extends Events {
  /**
   * 是否使用剪切板
   * @param {*} param0
   */
  constructor ({ isUseClipboard = true } = {}) {
    super()
    this.onScreenShot(isUseClipboard)
    this.onSaveFile()
    this.onShow()
    this.onHide()
  }

  /**
   * 创建窗口时的打开的地址
   */
  static URL = process.env.NODE_ENV === 'development' ? 'http://localhost:8080' : `file://${path.join(__dirname, '/renderer/index.html')}`

  shotWin = null

  /**
   * 创建截图窗口对象
   */
  static initShotWin () {
    const shotWin = new BrowserWindow({
      title: 'ScreenShot',
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      type: 'desktop',
      useContentSize: true,
      frame: false,
      show: false,
      menu: false,
      autoHideMenuBar: true,
      transparent: process.platform === 'darwin' || process.platform === 'win32',
      resizable: false,
      movable: false,
      focusable: false,
      fullscreen: true,
      // 设为true mac全屏窗口没有桌面滚动效果
      simpleFullscreen: true,
      backgroundColor: '#30000000',
      titleBarStyle: 'hidden',
      alwaysOnTop: process.env.NODE_ENV === 'production' || process.platform === 'darwin',
      enableLargerThanScreen: true,
      skipTaskbar: process.env.NODE_ENV === 'production',
      minimizable: false,
      maximizable: false,
      webPreferences: {
        nodeIntegration: true,
        webSecurity: false
      }
    })

    /**
     * 清除simpleFullscreen状态
     */
    shotWin.on('closed', () => shotWin.setSimpleFullScreen(false))
    shotWin.loadURL(ScreenShot.URL)
    return shotWin
  }

  /**
   * 调用截图
   */
  screenShot () {
    if (this.shotWin) {
      this.shotWin.close()
    }
    this.shotWin = ScreenShot.initShotWin()
  }

  /**
   * 绑定截图后确定后的时间回调
   * @param {*} isUseClipboard
   */
  onScreenShot (isUseClipboard) {
    ipcMain.on('ScreenShot::SCREENSHOT', (e, dataURL, bounds) => {
      if (isUseClipboard) {
        clipboard.writeImage(nativeImage.createFromDataURL(dataURL))
      }
      this.emit('screenShot', { dataURL, bounds })
    })
  }

  /**
   * 保存图片
   * @param {*} isSaveFile
   */
  onSaveFile (isSaveFile) {
    ipcMain.on('ScreenShot::SAVEFILE', (e, dataURL) => {
      if (isSaveFile) {
        dialog.showSaveDialog(
          {
            title: '保存图片',
            filters: [
              {
                name: 'Images',
                extensions: ['png', 'jpg', 'gif']
              }
            ]
          },
          path => {
            const buffer = Buffer.from(dataURL.replace('data:image/png;base64,', ''), 'base64')
            fs.writeFileSync(path, buffer, e => {
              throw new Error(e)
            })
          }
        )
      }
      this.emit('saveFile')
    })
  }

  /**
   * 绑定窗口显示事件
   */
  onShow () {
    ipcMain.on('ScreenShot::SHOW', (e, bounds) => {
      if (!this.shotWin) return
      this.shotWin.show()
      this.shotWin.setBounds(bounds)
      this.shotWin.focus()
      this.shotWin.on('show', () => {
        this.shotWin.setBounds(bounds)
        this.shotWin.focus()
      })
    })
  }

  /**
   * 绑定窗口隐藏事件
   */
  onHide () {
    ipcMain.on('ScreenShot::HIDE', () => {
      if (!this.shotWin) return
      this.shotWin.hide()
      this.shotWin.setSimpleFullScreen(false)
      this.shotWin.close()
      this.shotWin = null
    })
  }
}
