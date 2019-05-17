/**
 * Create a new set that contains elements contained in current set and given set
 */
export declare function setIntersection(current: Set<any>, other: Set<any>): Set<any>;
/**
 * Add every element in given iterables and the elements of the current set in a new set
 */
export declare function setUnion(current: Set<any>, ...iterables: Iterable<any>[]): Set<any>;
/**
 * Count the lines in a file.
 * Warning : This should be call in a Node.js context !
 *
 * @param {string} filePath
 * @returns {Promise<number>}
 */
export declare function countFileLines(filePath: string): Promise<number>;
