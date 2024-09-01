var fs = require('fs');
const { exec } = require("child_process")

/** @typedef {{ name: string, url: string }} LayerType */

/**
 * 
 * @param {LayerType} layer 
 */
async function installLayer(layer) {
    exec(`git clone ${layer.url}`)
}

(async () => {
    var obj = JSON.parse(fs.readFileSync('layers.json', 'utf8'));

    if (!obj || !(obj?.layers)) {
        throw new Error("Invalid layers specification file format")
    }

    const layers = obj.layers;

    for (const layer of layers) {
        const r = await installLayer(layer)
        console.log(r)
    }
})()