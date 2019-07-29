import ReversibleKeyMap from 'reversible-key-map';
import { PSQData } from './PSICQuicData';
export declare type PSQDataHolder = ReversibleKeyMap<string, string, PSQData[]>;
export default class PSICQuic {
    protected mode: string;
    keep_raw: boolean;
    /**
     * Records of Mitab currently loaded.
     */
    records: PSQDataHolder;
    /**
     * Registered publications. (I don't know what it is, please be comprehensive)
     */
    registredPublications: {
        [pubId: string]: string;
    };
    /**
     * Creates an instance of PSICQuic.
     * @param {string} [mode="LOOSE"] >deprecated Unused.
     * @param {boolean} [keep_raw=false] Keep the raw line when creating PSQData children.
     */
    constructor(mode?: string, keep_raw?: boolean);
    /**
     * @deprecated
     * Instance is already ready !
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
     * @nodeonly Only for Node.js. Will fail if used inside a browser context.
     * @rameater This function, used with a big file, will require a huge amount of RAM.
     * Make sure to use the V8 `--max-old-space-size={RAM}` parameter when starting the script.
     *
     * @param {string} file Filename
     * @param {boolean} [with_progress=true] Create a progress bar of current read state.
     */
    read(file: string, with_progress?: boolean): Promise<{}>;
    /**
     * Add all the records of other to actual instance.
     *
     * @param {PSICQuic} other
     */
    plus(other: PSICQuic): void;
    /**
     * Check if PSQData is valid and register publications inside it.
     *
     * @protected
     * @param {PSQData} psqDataObj
     */
    protected checkPsqData(psqDataObj: PSQData): boolean;
    /**
     * Size of the records map.
     */
    readonly length: number;
    toString(): string;
    readonly [Symbol.toStringTag]: string;
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
     * @deprecated Alias for `.getCouple()`.
     * @alias .getCouple()
     * @see .getCouple()
     */
    getLines(id1: string, id2: string): PSQData[];
    /**
     * Get all the MI Tab lines and data associated to couple [id1, id2].
     *
     * @param {string} id1
     * @param {string} id2
     */
    getCouple(id1: string, id2: string): PSQData[];
    /**
     * @deprecated Alias for `.add()` with the support of only one PSQData at each call.
     * @alias .add()
     * @see .add()
     */
    update(psq: PSQData): void;
    /**
     * Register a PSQData in records.
     *
     * @param psq MI Tab data (one, or mulitple data)
     */
    add(...psqs: PSQData[]): void;
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
    /**
     * Make a JSON dump
     */
    json(): string;
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
    /**
     * Return all the PubMed IDs presents in the records
     */
    protected countPmid(): Set<string>;
    /**
     * Get all the protein IDs and the "links" currently makables with current records.
     *
     * @returns Tuple<Set of protein accession n., Map<ProtID1, ProtID2, MITab data>>
     */
    topology(): [Set<string>, Map<[string, string], PSQData[]>];
    /**
     * @deprecated
     */
    getBiomolecules(type?: string): string[];
    /**
     * Create a new PSICQuic object with current instance data who match the predicate or who match the given uniprot ids
     * @param uniprot
     * @param predicate
     */
    filter(uniprot?: string[], predicate?: Function): PSICQuic;
}
