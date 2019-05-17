import { PSQData } from "./PSICQuicData";
import PSICQuic from "./PSICQuic";
export declare class MitabTopology {
    protected psiq: PSICQuic;
    constructor(psqObject: PSICQuic);
    keys(): IterableIterator<string>;
    [Symbol.iterator](): IterableIterator<[string, string, PSQData[]]>;
    readonly length: number;
    get(k1: string): PSQData[];
    readonly [Symbol.toStringTag]: string;
}
export default class LocalMitab extends MitabTopology {
    protected url: string;
    protected couple_url: string;
    protected empty_nodes: Set<any>;
    protected _remaining: number;
    protected _dls: number;
    protected cache: {};
    constructor(url: string, couple_url: string);
    fetch(k1: string): Promise<PSQData[]>;
    fetchCouple(k1: string, k2: string): Promise<any>;
    getMitabLines(k1: string, k2?: string): Promise<string[]>;
    getTemplatePairs(pairs: [string, string][]): Promise<void>;
    readonly remaining: number;
    readonly downloaded: number;
    protected bulkForEach(ids: Iterable<[string, string]>, cb: (lines: PSQData[][]) => PSQData[][], packet_len?: number): Promise<Promise<PSQData[][]>[]>;
}
