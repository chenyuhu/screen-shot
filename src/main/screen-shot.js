import path from 'path'
import Events from 'events'
import { ipcMain, clipboard, nativeImage, BrowserWindow, dialog } from 'electron'
import fs from 'fs'

export default class ScreenShot extends Events {
  /**
   * html文件路径地址
   */
  static URL =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:8080'
      : `file://${path.join(__dirname, './renderer/index.html')}`

  // 截图窗口对象
  $win = null

  /**
   * isUseClipboard是否把内容写入到剪切板
   * @param {*} params
   */
  constructor ({ isUseClipboard = true, isSaveFile = true } = {}) {
    super()
    this.onScreenShot(isUseClipboard)
    this.onsaveFile(isSaveFile)
    this.onShow()
    this.onHide()
  }

  /**
   * 初始化窗口
   */
  initWin () {
    const $win = new BrowserWindow({
      title: 'screen-shot',
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
      devTools: false,
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
        nodeIntegration: true
      }
    })

    // 清除simpleFullscreen状态
    $win.on('close', () => $win.setSimpleFullScreen(false))
    $win.loadURL(ScreenShot.URL)
    return $win
  }

  /**
   * 调用截图
   */
  screenShot () {
    if (this.$win) this.$win.close()
    this.$win = this.initWin()
  }

  /**
   * 绑定截图确定后的时间回调
   * @param {*} isUseClipboard
   */
  onScreenShot (isUseClipboard) {
    ipcMain.on('ScreenShot::CAPTURE', (e, data, bounds) => {
      if (isUseClipboard) {
        clipboard.writeImage(nativeImage.createFromDataURL(data.dataURL))
      }
      this.emit('capture', { ...data, bounds })
    })
  }

  /**
   * 保存图片
   * @param {*} isSaveFile
   */
  onsaveFile (isSaveFile) {
    ipcMain.on('ScreenShot::SAVEFILE', (e, dataURL) => {
      if (isSaveFile) {
        const buffer = Buffer.from(dataURL.replace('data:image/png;base64,', ''), 'base64')
        dialog.showSaveDialog({
          title: '保存图片',
          filters: [{ name: 'Images', extensions: ['png', 'jpg'] }],
          defaultPath: `私塾学府-${new Date().getTime()}` }, (path) => {
          if (path) {
            fs.writeFileSync(path, buffer)
          }
        })
      }
      this.emit('saveFile', { dataURL })
    })
  }

  /**
   * 绑定窗口显示事件
   */
  onShow () {
    ipcMain.on('ScreenShot::SHOW', (e, bounds) => {
      if (!this.$win) return
      this.$win.show()
      this.$win.setBounds(bounds)
      this.$win.focus()
      this.$win.on('show', () => {
        this.$win.setBounds(bounds)
        this.$win.focus()
      })
    })
  }

  /**
   * 绑定窗口隐藏事件
   */
  onHide () {
    ipcMain.on('ScreenShot::HIDE', (e, bounds) => {
      if (!this.$win) return
      this.$win.hide()
      this.$win.setSimpleFullScreen(false)
      this.$win.close()
      this.$win = null
    })
  }
}
