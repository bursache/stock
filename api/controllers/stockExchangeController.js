const extract = require('extract-zip');
const qrCode = require('qrcode-reader');
const async = require('async');
const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');

let extractPath;

const _getBestBuy = (arr) => arr.reduce((tuples, curr, i, all) => {
        const sell = all.slice(Math.min(i + 2 - all.length, -1))
            .sort((a, b) => b - a)
            .slice(0, 1)[0] || 0;

        return tuples.concat([[curr, sell, sell - curr]]);
    }, [])
    .sort((a, b) => b[2] - a[2])
    .map(item => {
        return {
            buyPoint: item[0] && Number(item[0]) >= 0 ? Number(item[0]) : null,
            sellPoint: item[1] && Number(item[1]) >= 0 ? Number(item[1]) : null,
        }
    })[0];

const _extractDataFromPath = (fileObj, cb) => {
    extract(fileObj.path, {dir: extractPath}, err => cb(err));
}

const _readFilesFromDirectory = (cb) => {
    fs.readdir(extractPath, (err, fileNames) => {
        if (err) {
            return cb(err);
        }

        return async.map(fileNames, _readFile, (err, results) => cb(err, Object.assign({}, ...results)));
    });
};

const _readFile = (fileName, cb) => {
    const buffer = fs.readFileSync(`${extractPath}/${fileName}`);

    Jimp.read(buffer, (err, image) => {
        if (err) {
            return cb(err);
        }

        const qr = new qrCode();

        qr.callback = (err, value) => {
            if (err) {
                return cb(err);
            }

            return cb(null, {
                [fileName]: _getBestBuy(value.result.split(' '))
            });
        };

        qr.decode(image.bitmap);
    });
};

const _sanitizeResults = (results, cb) => {
    const validResults = Object.values(results)
        .filter(val => val.buyPoint !== null && val.sellPoint !== null);

    _sanitizeData(results);

    return cb(null, validResults);
};

const _sanitizeData = () => {
    const removeFiles = (path, isDirectory) => {
        if (fs.existsSync(path)) {
            fs.readdirSync(path).forEach(function(file){
                const currentPath = `${path}/${file}`;

                if (fs.lstatSync(currentPath).isDirectory()) {
                    removeFiles(currentPath, !isDirectory);
                } else {
                    fs.unlinkSync(currentPath);
                }
            });

            if (isDirectory) {
                fs.rmdirSync(path);
            }
        }
    };

    removeFiles(`${process.cwd()}/extracted/`, false);
    removeFiles(`${process.cwd()}/uploads/`, false);
};


const compute = (request, requestCallback) => {
    if (request.file && request.file.path) {
        extractPath = `${process.cwd()}/extracted/${request.file.filename}`;

        async.waterfall([
            (cb) => cb(null, request.file),
            _extractDataFromPath,
            _readFilesFromDirectory,
            _sanitizeResults
        ], (err, result) => {
            return requestCallback(err, result)
        });
    } else {
        return requestCallback(true);
    }
};

module.exports = {
    compute
};