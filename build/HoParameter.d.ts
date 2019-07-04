import { PSQData } from "./main";
export declare type HVector = string[];
export declare class HoParameterSet {
    lowQueryParam: HoParameter[];
    highQueryParam: HoParameter[];
    mitabCouples: PSQData[][];
    visible: boolean;
    static DEFAULT_TAXON_SEARCH_MODE: number;
    toString(): string;
    remove(): void;
    readonly depth: number;
    readonly length: number;
    readonly isEmpty: boolean;
    readonly templates: [string[], string[]];
    readonly full_templates: [string[], string[]];
    add(x: HVector, y: HVector): void;
    /**
     *
     * @param Object Variables **exp_methods** and **taxons** are undefined OR Set of strings.
     */
    trim({ simPct, idPct, cvPct, eValue, exp_methods, taxons, definitive }?: {
        simPct?: number;
        idPct?: number;
        cvPct?: number;
        eValue?: number;
        exp_methods?: any;
        taxons?: any;
        definitive?: boolean;
    }): void;
    static from(obj: {
        lowQueryParam: {
            data: string[];
            valid: boolean;
        }[];
        highQueryParam: {
            data: string[];
            valid: boolean;
        }[];
        visible: boolean;
    }): HoParameterSet;
    full_iterator(visible_only?: boolean): IterableIterator<[HoParameter, HoParameter, PSQData[]]>;
    [Symbol.iterator](): IterableIterator<[HoParameter, HoParameter]>;
}
export declare class HoParameter {
    data: HVector;
    valid: boolean;
    constructor(hVector: HVector);
    readonly length: number;
    readonly template: string;
    readonly simPct: number;
    readonly idPct: number;
    readonly cvPct: number;
    readonly eValue: number;
}
