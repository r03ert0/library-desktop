// Modules to control application life and create native browser window
const { app, BrowserWindow } = require('electron')
const path = require('path')

const liveServer = require("live-server");
const library = require(__dirname + "/library/library.js");
const clients = [];
const os = require('os');
const homedir = path.join(os.homedir(), "/");
const monk = require('monk');
const MONGO_DB = '127.0.0.1:27017/library';
const db = monk(MONGO_DB);
console.log({ homedir });


function createWindow() {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 1400,
        height: 700,
        webPreferences: {
            webSecurity: false,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadURL('https://127.0.0.1:8090/list.html')
}

const getUId = () => {
    const uid = Math.random().toString(16)
        .slice(2, 8);

    return uid;
};

/**
 * Websocket interaction
 */

const broadcast = (msg) => {
    console.log("broadcast message:", msg);
    for (const uid in clients) {
        console.log("broadcast to uid:", uid)
        if (clients.hasOwnProperty(uid)) {
            clients[uid].ws.send(msg);
        }
    }
}

// eslint-disable-next-line max-statements
const wsmessage = (uid, event) => {
    const msg = event.data;
    const parts = msg.split(" ");
    const [key] = parts; // gets 1st element only
    const val = parts.slice(1).join(" ");

    console.log("received message:", key);

    switch (key) {
        case "echo":
            console.log("VR>", msg);
            break;
        case "greet":
            clients[uid].ws.send("Greetings for the day");
            break;
        case "open":
            broadcast(parts[1]);
            break;
        case "monk":
            {
                const [, callbackId, fn, ...rest] = parts;
                console.log("callbackId:", callbackId);
                console.log("func:", fn);
                const args = rest ? JSON.parse(rest.join(" ")) : [];
                console.log("args:", args);
                const collection = db.get("library");
                collection[fn](...args).then((content) => {
                    clients[uid].ws.send(JSON.stringify({
                        type: "book",
                        callbackId,
                        content
                    }));
                });
                break;
            }
        default:
            console.log("Unknown message", msg);
    }
};

let originalOnopenFn;
let originalOncloseFn;
const params = {
    port: 8090,
    root: __dirname + "/library",
    ignorePattern: /.*\.git.*/,
    wait: 500,
    cors: true,
    open: false,
    setws: (client) => {
        (function(ws, uid) {
            console.log("new user:", uid);
            clients[uid] = { ws, homedir };
            originalOnmessageFn = ws.onmessage;
            originalOnopenFn = ws.onopen;
            originalOncloseFn = ws.onclose;
            ws.onmessage = (msg) => {
                wsmessage(uid, msg);
            };
            ws.onopen = (e) => {
                console.log(">> onopen", uid);
                originalOnopenFn();
            }
            ws.onclose = (e) => {
                console.log(">> onclose", uid);
                delete clients[uid];
                originalOncloseFn();
            }
            console.log("new websocket client added in app.js");
        }(client, getUId()));
    },
    middleware: [library],
    https: __dirname + "/https.conf.js"
};
liveServer.start(params);
console.log("rolling on own live-server");

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
// app.whenReady().then(() => {
//     createWindow();

//     app.on('activate', function() {
//         // On macOS it's common to re-create a window in the app when the
//         // dock icon is clicked and there are no other windows open.
//         if (BrowserWindow.getAllWindows().length === 0) createWindow()
//     })
// })


// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
// app.on('window-all-closed', function() {
//     if (process.platform !== 'darwin') app.quit()
// })

app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    console.log("GOT CERT ERROR!!");
    console.log({ url, error });
    event.preventDefault();
    callback(true);
});