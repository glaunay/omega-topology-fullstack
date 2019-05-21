import { PSQData } from "./PSICQuicData";
import PSICQuic from "./PSICQuic";
/**
 * @deprecated *USE ONLY MitabTopology*
 *
 * @export
 * @class LocalMitab
 * @extends {MitabTopology}
 */
export default class MitabTopology {
    protected psiq: PSICQuic;
    protected url: string;
    protected couple_url: string;
    protected empty_nodes: Set<any>;
    protected _remaining: number;
    protected _dls: number;
    protected cache: {};
    constructor(psiq: PSICQuic, url: string, couple_url: string);
    /**
     * Get keys of all the records.
     *
     * @yields {string}
     */
    keys(): IterableIterator<string>;
    /**
     * Iterate through all the existing couples in the records.
     *
     * @yields {[string, string, PSQData[]]}
     */
    [Symbol.iterator](): IterableIterator<[string, string, PSQData[]]>;
    /**
     * Get length of the records.
     */
    readonly length: number;
    /**
     * Get all the corresponding lines from an ID
     * @param {string} k1
     */
    get(k1: string): PSQData[];
    /**
     * Get all the corresponding lines from a couple of IDs
     * @param {string} k1
     * @param {string} k2
     */
    couple(k1: string, k2: string): PSQData[];
    readonly [Symbol.toStringTag]: string;
    /**
     * Returns the PSICQuic object held by the Mitab object
     */
    readonly psi: PSICQuic;
    fetch(k1: string): Promise<PSQData[]>;
    fetchCouple(k1: string, k2: string): Promise<any>;
    getMitabLines(k1: string, k2?: string): Promise<string[]>;
    getTemplatePairs(pairs: [string, string][]): Promise<void>;
    readonly remaining: number;
    readonly downloaded: number;
    protected bulkForEach(ids: Iterable<[string, string]>, cb: (lines: PSQData[][]) => PSQData[][], packet_len?: number): Promise<Promise<PSQData[][]>[]>;
}
