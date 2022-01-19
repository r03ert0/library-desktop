# Library VR

This is the desktop version of `library` using Electron.

All the extra code required by electron is in `src`, as well as the certificate files.

The library code is added as a git module.

To build the application, use `npm run make`.

Making the desktop version uses `electron-forge`, which itself calls `electron-packager`. The configuration file for `electron-forge` is setup in `package.json`, under "forge". It points to the file `forge.config.js`. That file contains in particular a list of "hooks". The `library` codes uses `three` from within the `node_modules` directory. However, in the current configuration that directory is not within `/src` but at the root of the project. In consequence, the code is unable to find `three`. For solving this, we need to copy `node_modules/three` to `/src`.
