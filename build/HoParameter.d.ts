import { PSQData } from "./main";
export declare type HVector = string[];
interface TrimFailReason {
    identity: boolean | string;
    similarity: boolean | string;
    e_value: boolean | string;
    coverage: boolean | string;
}
/**
 * Save the homology data of a link
 */
export declare class HoParameterSet {
    /** Store the homology data of the node with the lowest MD5 hash */
    lowQueryParam: HoParameter[];
    /** Store the homology data of the node with the highest MD5 hash */
    highQueryParam: HoParameter[];
    /** Store the interaction data support of the link */
    mitabCouples: MitabParameter[][];
    /** If not visible, link will be hidden in the representation */
    visible: boolean;
    /** How to search taxons in taxons search */
    static DEFAULT_TAXON_SEARCH_MODE: number;
    /** Serialize the object */
    toString(): string;
    /** Clear this instance */
    remove(): void;
    readonly depth: number;
    /** Number of valid homologies */
    readonly length: number;
    /** True if any homology support is valid */
    readonly isEmpty: boolean;
    /** All valid templates (accession number of the homologs) */
    readonly templates: [string[], string[]];
    /** Templates, but unfiltered */
    readonly full_templates: [string[], string[]];
    /** Add a new homology support */
    add(x: HVector, y: HVector): void;
    /**
     * Apply filters to the homology support or the interaction data.
     * After a trim, check if the HoParameterSet is still valid with `.isEmpty`.
     *
     * @param Object
     * **simPct**, **idPct** and **cvPct**, respectively similiarity, identity and coverage, are in *percentage* (0 to 100).
     * Setting a value for those settings will invalidate homology supports *below* the threshold.
     *
     * Setting a **eValue** will invalidate homology supports *above* the threshold.
     *
     * Variables **exp_methods** and **taxons** are undefined OR Set of strings. They must *NOT* be arrays of string !
     *
     * If you want reasons for what have been discarded by filters, you can enable the **logged** parameter with `true`.
     * This function will return a array of tuples ([lowQuery, highQuery]) with fail information.
     * Otherwise, return value will be an empty array.
     *
     * **destroy_identical** will identify identical identities parameter and filter them (at the end, there will be only one).
     * This step is CPU-intensive, do not enable it everytime you filter !
     * It is recommanded to activate both **destroy_identical** and **definitive** in order to permanently remove duplicated homology support.
     */
    trim({ simPct, idPct, cvPct, eValue, exp_methods, taxons, definitive, logged, destroy_identical }?: {
        simPct?: number;
        idPct?: number;
        cvPct?: number;
        eValue?: number;
        exp_methods?: any;
        taxons?: any;
        definitive?: boolean;
        logged?: boolean;
        destroy_identical?: boolean;
    }): [TrimFailReason, TrimFailReason][];
    /** Unserialize a HoParameterSet */
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
    /** Iterate through the homology support and the interaction data */
    full_iterator(visible_only?: boolean): IterableIterator<[HoParameter, HoParameter, PSQData[]]>;
    /** Iterate through the homology support */
    [Symbol.iterator](): IterableIterator<[HoParameter, HoParameter]>;
}
/** Encapsulate PSQData to store validity */
export declare class MitabParameter {
    /** Hold the reald MI Tab data */
    data: PSQData;
    /** If the PSQData is valid or not */
    valid: boolean;
    constructor(d: PSQData);
}
/** Store one homology support */
export declare class HoParameter {
    data: HVector;
    valid: boolean;
    constructor(hVector: HVector);
    /** Homolog sequence length */
    readonly length: number;
    /** Identifier (accession number) of the homolog */
    readonly template: string;
    /** Sequence similarity percentage */
    readonly simPct: number;
    /** Sequence identity percentage */
    readonly idPct: number;
    /** Sequence coverage percentage */
    readonly cvPct: number;
    /** E-value computed by PSI-BLAST */
    readonly eValue: number;
}
export {};
