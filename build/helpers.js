"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Create a new set that contains elements contained in current set and given set
 */
function setIntersection(current, other) {
    const set = new Set();
    for (const value of other) {
        if (current.has(value))
            set.add(value);
    }
    return set;
}
exports.setIntersection = setIntersection;
/**
 * Add every element in given iterables and the elements of the current set in a new set
 */
function setUnion(current, ...iterables) {
    const set = new Set(current);
    for (const it of iterables) {
        for (const value of it) {
            set.add(value);
        }
    }
    return set;
}
exports.setUnion = setUnion;
/**
 * Count the lines in a file.
 * Warning : This should be call in a Node.js context !
 *
 * @param {string} filePath
 * @returns {Promise<number>}
 */
function countFileLines(filePath) {
    return new Promise((resolve, reject) => {
        let lineCount = 0;
        const fs = require("fs");
        fs.createReadStream(filePath)
            .on("data", (buffer) => {
            let idx = -1;
            lineCount--; // Because the loop will run once for idx=-1
            do {
                idx = buffer.indexOf(10, idx + 1);
                lineCount++;
            } while (idx !== -1);
        }).on("end", () => {
            resolve(lineCount);
        }).on("error", reject);
    });
}
exports.countFileLines = countFileLines;
