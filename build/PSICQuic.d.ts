import ReversibleKeyMap from 'reversible-key-map';
import { PSQData } from './PSICQuicData';
export declare type PSQDataHolder = ReversibleKeyMap<string, string, PSQData[]>;
export default class PSICQuic {
    protected mode: string;
    protected keep_raw: boolean;
    /**
     * Records of Mitab currently loaded.
     */
    records: PSQDataHolder;
    /**
     * Registered publications.
     */
    registredPublications: {
        [pubId: string]: string;
    };
    protected init_promise: Promise<void>;
    /**
     * Creates an instance of PSICQuic.
     * @param {string} [mode="LOOSE"] >deprecated Unused.
     * @param {boolean} [keep_raw=false] Keep the raw line when creating PSQData children.
     * @param {boolean} [offline=true] >deprecated Always be true. Unused
     */
    constructor(mode?: string, keep_raw?: boolean, offline?: boolean);
    /**
     * Promise symbolizing the instance state. Resolved when ready.
     */
    init(): Promise<void>;
    /**
     * Read one or multiple Mitab lines and register then in records.
     *
     * @param {(string | string[])} str
     */
    readLines(str: string | string[]): PSQData[];
    /**
     * Asynchronously read a Mitabfile. (use streams !)
     *
     * @param {string} file Filename
     * @param {boolean} [with_progress=true] Create a progress bar of current read state.
     */
    read(file: string, with_progress?: boolean): Promise<{}>;
    /**
     * @deprecated SHOULD MOVE IT
     *
     * @param {string[]} ids
     */
    protected static bulkGetWrap(ids: string[]): any;
    /**
     * Clone current object. Warning, does NOT clone the records map, they will be shared.
     */
    clone(): void;
    /**
     * Add all the records of other to actual instance.
     *
     * @param {PSICQuic} other
     */
    plus(other: PSICQuic): void;
    /**
     * Check if PSQData is valid.
     *
     * @protected
     * @param {PSQData} psqDataObj
     */
    protected checkPsqData(psqDataObj: PSQData): boolean;
    /**
     * Get the size of the records map.
     */
    readonly length: number;
    toString(): string;
    readonly [Symbol.toStringTag]: string;
    /**
     * Get a PSQData by index.
     * This is REALLY not recommanded, get using id instead !
     *
     * @param {number} i Index
     */
    getByIndex(i: number): PSQData;
    /**
     * Returns true of id exists in records.
     *
     * @param {string} id
     */
    has(id: string): boolean;
    /**
     * Returns true if couple [id1, id2] exists in records.
     *
     * @param {string} id1
     * @param {string} id2
     */
    hasCouple(id1: string, id2: string): boolean;
    /**
     * Get all the lines associated to id.
     *
     * @param {string} id
     */
    get(id: string): PSQData[];
    /**
     * Get all the lines associated to couple [id1, id2].
     *
     * @param {string} id1
     * @param {string} id2
     */
    getLines(id1: string, id2: string): PSQData[];
    /**
     * Register a PSQData in records.
     *
     * @param {PSQData} psq
     */
    update(psq: PSQData): void;
    /**
     * Yields through the recorded PSQData.
     *
     * @yields {PSQData}
     */
    [Symbol.iterator](): IterableIterator<PSQData>;
    /**
     * Yields though the couples in records, with the form [id1, id2, lines_from_couple].
     *
     * @yields {[string, string, PSQData[]]}
     */
    couples(): IterableIterator<[string, string, PSQData[]]>;
    /**
     * Get all the existing pairs with the form id => partners[].
     * Pairs will exists in both forms : id1 => [id2, id3] and id2 => [id1] and id3 => [id1]
     */
    getAllPartnersPairs(): {
        [id: string]: string[];
    };
    /**
     * Get all the lines represented with the couple {id1 => id2 => string[], ...}
     */
    getAllLinesPaired(): {
        [id: string]: {
            [coupledId: string]: string[];
        };
    };
    /**
     * Delete every raw line contained in this instance, then disable keep_raw.
     */
    flushRaw(): void;
    /**
     * Clear every Mitab records and publications saved.
     */
    clear(): void;
    json(): string;
    dump(): string;
    /**
     * Parse multiple lines then add then into the instance.
     *
     * @param {string[]} buffer Lines into a string[] object.
     */
    protected parse(buffer: string[]): void;
    /**
     * Parse one line.
     *
     * @param {string} line
     * @param {PSQData[]} [added] Optional. Used to monitor which line is added.
     */
    protected parseLine(line: string, added?: PSQData[]): void;
    protected countPmid(): Set<string>;
    topology(type?: string): [Set<string>, Map<[string, string], PSQData[]>];
    getBiomolecules(type?: string): string[];
    filter(uniprot?: string[], predicate?: Function): PSICQuic;
}
