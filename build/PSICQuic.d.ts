import ReversibleKeyMap from 'reversible-key-map';
import { PSQData } from './PSICQuicData';
export declare type PSQDataHolder = ReversibleKeyMap<string, string, PSQData[]>;
export default class PSICQuic {
    protected mode: string;
    protected keep_raw: boolean;
    static mitabLvls: string[];
    records: ReversibleKeyMap<string, string, PSQData[]>;
    registredPublications: {
        [pubId: string]: string;
    };
    protected init_promise: Promise<void>;
    constructor(mode?: string, keep_raw?: boolean, offline?: boolean);
    init(): Promise<void>;
    readLines(str: string | string[]): PSQData[];
    read(file: string, with_progress?: boolean): Promise<{}>;
    protected static bulkGetWrap(ids: string[]): any;
    clone(): void;
    plus(other: PSICQuic): PSQData[];
    protected checkPsqData(psqDataObj: PSQData): boolean;
    readonly length: number;
    toString(): string;
    readonly [Symbol.toStringTag]: string;
    getByIndex(i: number): PSQData;
    has(id: string): boolean;
    hasCouple(id1: string, id2: string): boolean;
    get(id: string): PSQData[];
    getLines(id1: string, id2: string): PSQData[];
    update(psq: PSQData): void;
    [Symbol.iterator](): IterableIterator<PSQData>;
    couples(): IterableIterator<[string, string, PSQData[]]>;
    getAllPartnersPairs(): {
        [id: string]: Iterable<string>;
    };
    getAllLinesPaired(): {
        [id: string]: {
            [coupledId: string]: string[];
        };
    };
    flushRaw(): void;
    clear(): void;
    json(): string;
    dump(): string;
    protected parse(buffer: string[], encoder?: string): void;
    protected parseLine(line: string, added?: PSQData[]): void;
    protected countPmid(): Set<string>;
    topology(type?: string): [Set<string>, Map<[string, string], PSQData[]>];
    getBiomolecules(type?: string): string[];
    filter(uniprot?: any[], predicate?: Function): PSICQuic;
}
