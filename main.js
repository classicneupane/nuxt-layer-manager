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
        const dirPath = path.join(name)
        fs.rmSync(dirPath, { force: true, recursive: true })
    })
}

function cleanLayer() {
    const dirs = fs.readdirSync('./')
    for (const name of dirs) {
        removeLayerDir(name)
    }
}


/**
 * 
 * @param {string} url 
 * @returns {string}
 */

function formatGithubUrl(url){
    const AUTH_TOKEN = process.env.GIGET_AUTH;
    const urlParts = url.split('://');
        
    if (urlParts.length !== 2) {
        throw new Error('Invalid URL format');
    }
    
    const protocol = urlParts[0];
    const restOfUrl = urlParts[1];

    if(AUTH_TOKEN){
        return `${protocol}://${encodeURIComponent(AUTH_TOKEN)}@${restOfUrl}`;
    }

    return url
}



/**
 * 
 * @param {LayerType} layer 
 */
function installLayer(layer, force = false) {
    return new Promise((resolve, reject) => {
        const layerPath = layer.url.split("/").pop().split(".git")[0]
        const existsDir = fs.existsSync(layerPath)

        if(existsDir){
            if(!force){
                logger.log(`${layerPath} already exists`)
                return
            }
            removeLayerDir(layerPath)
        }

        logger.log(`Cloning: ${layer.url}`)
        exec(`git clone ${formatGithubUrl(layer.url)}`, (e) => {
            if(e){
                reject(e)
            }
            else{
                resolve(e)
                fs.rmSync(`./${layerPath}/tsconfig.json`, { force: true, recursive: true })
                fs.rmSync(`./${layerPath}/eslint.config.mjs`, { force: true, recursive: true })
            }
        })
    })
}

/**
 * 
 * @returns {Array<LayerType>}
 */
function readLayerConfig() {
    const FILE_NAME = 'layers.json'

    const filePath = path.join(FILE_NAME)

    const throwError = () => {
        throw new Error("layers.json not found")
    }

    if(!fs.existsSync(path.join(filePath))){
        throwError()
    }

    var obj = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (!obj || !(obj?.layers)) {
        throwError()
    }

    return obj.layers;
}

(async () => {
    const args = process.argv.slice(2);

    const forceInstall = args?.includes("-f")

    let layers = [];
    try{
        layers = readLayerConfig()
    }
    catch(e){
        logger.error(String(e))
        return
    }

    const promises = layers.map(i=>installLayer(i, forceInstall))
    await Promise.all(promises)
})()