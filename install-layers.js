#!/usr/bin/env node

var fs = require('fs');
const path = require("path")
const { exec } = require("child_process")


const logger = {
    logs: [],
    displayLog: function () {
        const lastLog = this.logs[this.logs.length - 1];
        if (lastLog.type === 'info') {
            console.log(lastLog.message)
        }
        else if (lastLog.type === 'warn') {
            console.warn(lastLog.message)
        }
        else if (lastLog.type === 'error') {
            console.error(lastLog.message)
        }
    },

    log: function (message) {
        this.logs.push({
            type: 'info',
            message
        })
        this.displayLog()
    },
    error: function (message) {
        this.logs.push({
            type: 'error',
            message
        })
        this.displayLog()
    },
    warn: function (message) {
        this.logs.push({
            type: 'warn',
            message
        })
        this.displayLog()
    }
}

/** @typedef {{ name: string, url: string }} LayerType */

/**
 * 
 * @param {string} name 
 */
function removeLayerDir(name) {
    return new Promise((resolve, reject) => {
        if (!name.startsWith('layer-')) {
            return resolve()
        }
        logger.error(`Deleting: ${name}`)
        const dirPath = path.join(__dirname, name)
        fs.rmSync(dirPath, { force: true, recursive: true })
    })
}

function cleanLayer() {
    const dirs = fs.readdirSync(__dirname)
    for (const name of dirs) {
        removeLayerDir(name)
    }
}

/**
 * 
 * @param {LayerType} layer 
 */
function installLayer(layer) {
    return new Promise((resolve, reject) => {
        logger.log(`Cloning: ${layer.url}`)
        exec(`git clone ${layer.url}`, (e) => {
            if(e){
                reject(e)
            }
            else{
                resolve(e)
            }
        })
    })
}

/**
 * 
 * @returns {Array<LayerType>}
 */
function readLayerConfig() {
    var obj = JSON.parse(fs.readFileSync('layers.json', 'utf8'));

    if (!obj || !(obj?.layers)) {
        throw new Error("Invalid layers specification file format")
    }

    return obj.layers;
}

(async () => {
    cleanLayer()
    const layers = readLayerConfig()
    for (const layer of layers) {
        await installLayer(layer)
    }
})()