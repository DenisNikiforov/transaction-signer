/*
 * Copyright D3 Ledger, Inc. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
'use strict'

import { app, protocol, BrowserWindow, Menu, dialog } from 'electron'
import {
  createProtocol,
  installVueDevtools
} from 'vue-cli-plugin-electron-builder/lib'

const isDevelopment = process.env.NODE_ENV !== 'production'
const appName = process.env.APP_NAME || 'D3Ledger'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

// Standard scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{
  scheme: 'app',
  privileges: {
    standart: true,
    secure: true,
    supportFetchAPI: true
  }
}])

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({
    width: 800,
    height: 600,
    resizable: false,
    title: `${appName} OTS`,
    webPreferences: {
      nodeIntegration: true
    }
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }

  win.on('closed', () => {
    win = null
  })

  addEditMenu(win)
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installVueDevtools()
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}

/**
 * enable copy & paste
 * c.f. https://github.com/electron/electron/issues/4068
 *
*/
function addEditMenu (window) {
  const appMenu = Menu.buildFromTemplate([
    {
      label: `${appName} OTS`,
      submenu: [
        {
          label: 'Version',
          click () {
            dialog.showMessageBox({
              type: 'info',
              title: 'Version',
              message: `
                Short version: ${process.env.COMMIT_HASH_SHORT}
                Application version: ${process.env.COMMIT_HASH}
              `
            })
          }
        },
        { type: 'separator' },
        {
          role: 'quit',
          label: `Quit ${appName} OTS`
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:' },
        { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
        { label: 'Select All', accelerator: 'CmdOrCtrl+A', selector: 'selectAll:' }
      ]
    }
  ])
  const selectionMenu = Menu.buildFromTemplate([
    {
      label: 'Copy',
      accelerator: 'CmdOrCtrl+C',
      role: 'copy'
    }
  ])
  const inputMenu = Menu.buildFromTemplate([
    {
      label: 'Copy',
      accelerator: 'CmdOrCtrl+C',
      role: 'copy'
    },
    {
      label: 'Paste',
      accelerator: 'CmdOrCtrl+V',
      role: 'paste'
    },
    {
      label: 'Select All',
      accelerator: 'CmdOrCtrl+A',
      role: 'selectAll'
    }
  ])
  Menu.setApplicationMenu(appMenu)

  window.webContents.on('context-menu', (e, props) => {
    const { selectionText, isEditable } = props
    if (isEditable) {
      inputMenu.popup(window)
    } else if (selectionText && selectionText.trim() !== '') {
      selectionMenu.popup(window)
    }
  })
}
