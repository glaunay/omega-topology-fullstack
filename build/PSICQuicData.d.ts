export declare class PSQData {
    data: PSQDatum[];
    hash: string;
    raw: string;
    static readonly PSQ_FIELDS: string[];
    constructor(raw: string, keep_raw?: boolean);
    readonly ids: string[];
    equal(other: PSQData): boolean;
    toString(): string;
    readonly [Symbol.toStringTag]: string;
    readonly taxid: [string, string];
    readonly pmid: string;
    readonly source: string;
    readonly interactionDetectionMethod: string;
    readonly species: string[];
    readonly full_species: string[];
    protected uniprotCapture(str: string): string;
    readonly uniprotPair: [string, string] | undefined;
    readonly json: string;
    readonly interactors: [[string, string][], [string, string][]];
    swapInteractors(to: any, iSlot?: string): void;
    hasInteractors(mode?: string): boolean;
    getNames(): void;
    getPartners(): void;
}
export declare class PSQDatum {
    data: PSQField[];
    constructor(colomn: string);
    equal(datum: PSQDatum): boolean;
    toString(): string;
    readonly [Symbol.toStringTag]: string;
    [Symbol.iterator](): IterableIterator<PSQField>;
    entries(): IterableIterator<[number, PSQField]>;
    at(key: string): string[];
    readonly content: [string, string][];
    readonly value: string;
}
export declare class PSQField {
    static readonly fieldParser: RegExp;
    value: string;
    type: string | undefined;
    annotation: string | undefined;
    constructor(element: string);
    equal(field: PSQField): boolean;
    toString(): string;
    readonly [Symbol.toStringTag]: string;
}
