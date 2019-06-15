import debug from 'electron-debug'
import { app, globalShortcut } from 'electron'
import ScreenShot from './shortcut-capture'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'

app.on('ready', () => {
  installExtension(VUEJS_DEVTOOLS).catch(err => {
    console.log('Unable to install `vue-devtools`: \n', err)
  })
  const sc = new ScreenShot()
  globalShortcut.register('ctrl+shift+a', () => sc.screenShot())
  sc.on('Screenshot', ({ dataURL, bounds }) => console.log('capture', bounds))
  debug({ showDevTools: 'undocked' })
  sc.on('saveFile', () => {})
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
