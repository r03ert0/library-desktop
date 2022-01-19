const { async } = require("three");

module.exports = {
    packagerConfig: {},
    makers: [{
        name: "@electron-forge/maker-zip",
        platforms: ["darwin", "arm64"]
    }],
    hooks: {
        packageAfterPrune: async (forgeConfig, buildPath, electronVersion, platform, arch, callback) => {
            console.log("\n[packageAfterPrune hook] Copying threejs to src");
            const { exec } = require("child_process");
            await new Promise((resolve, reject) => {
                exec(
                    `mkdir -p ${buildPath}/src/library/node_modules/three`,
                    (err, stdout, stderr) => {
                        console.log("[packageAfterPrune hook] create threejs directory");
                        if (err) { return reject(err); }
                        return resolve(stdout);
                    }
                );
            });
            await new Promise((resolve, reject) => {
                exec(
                    `cp -r ${buildPath}/node_modules/three ${buildPath}/src/library/node_modules`,
                    (err, stdout, stderr) => {
                        console.log("[packageAfterPrune hook] copy threejs");
                        if (err) { return reject(err); }
                        return resolve(stdout);
                    }
                );
            });
        }
    },
    buildIdentifier: 'my-library-build'
};