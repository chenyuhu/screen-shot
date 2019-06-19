import debug from 'electron-debug'
import { app, globalShortcut } from 'electron'
import ScreenShot from './screen-shot'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'

app.on('ready', () => {
  installExtension(VUEJS_DEVTOOLS).catch(err => {
    console.log('Unable to install `vue-devtools`: \n', err)
  })
  const sc = new ScreenShot()
  globalShortcut.register('ctrl+shift+a', () => sc.ScreenShot())
  sc.on('capture', ({ dataURL, bounds }) => console.log('capture', bounds))
  sc.on('saveFile', () => {})
  debug({ showDevTools: 'undocked' })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
