const fs = require('fs');
const path = require('path');
const util = require('util');

const writeFileAsync = util.promisify(fs.writeFile);
const readFileAsync = util.promisify(fs.readFile);
const unlinkAsync = util.promisify(fs.unlink);

class FileManagerHybrid {
    constructor(baseDir = './data-hybrid') {
        this.baseDir = baseDir;
        if (!fs.existsSync(baseDir)) {
            fs.mkdirSync(baseDir, { recursive: true });
        }
    }

    createFile(filename, content, callback) {
        const filePath = path.join(this.baseDir, filename);
        const promise = writeFileAsync(filePath, content, 'utf8').then(() => filePath);

        if (typeof callback === 'function') {
            promise
                .then(result => callback(null, result))
                .catch(err => callback(err, null));
            return;
        }
        return promise;
    }

    readFile(filename, callback) {
        const filePath = path.join(this.baseDir, filename);
        const promise = readFileAsync(filePath, 'utf8');

        if (typeof callback === 'function') {
            promise
                .then(data => callback(null, data))
                .catch(err => callback(err, null));
            return;
        }
        return promise;
    }

    deleteFile(filename, callback) {
        const filePath = path.join(this.baseDir, filename);
        const promise = unlinkAsync(filePath);

        if (typeof callback === 'function') {
            promise
                .then(() => callback(null))
                .catch(err => callback(err));
            return;
        }
        return promise;
    }
}

module.exports = FileManagerHybrid;