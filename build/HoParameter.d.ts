import { PSQData } from "./main";
export declare type HVector = string[];
export declare class HoParameterSet {
    lowQueryParam: HoParameter[];
    highQueryParam: HoParameter[];
    mitabCouples: PSQData[][];
    visible: boolean;
    toString(): string;
    remove(): void;
    readonly depth: number;
    readonly length: number;
    readonly isEmpty: boolean;
    readonly templates: [string[], string[]];
    add(x: HVector, y: HVector): void;
    trim(simPct?: number, idPct?: number, cvPct?: number, eValue?: number, definitive?: boolean): void;
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
