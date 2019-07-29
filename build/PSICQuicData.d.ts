import { ArtefactualMitabData } from "./OmegaTopology";
/**
 * Hold the data of one MI Tab line
 */
export declare class PSQData {
    /** Fields, indexed */
    data: PSQDatum[];
    /** Hash of the line */
    hash: string;
    /** Raw line (not stored if keep_raw is false) */
    raw: string;
    static readonly PSQ_FIELDS: string[];
    static readonly INDEXED_PSQ_FIELDS: {};
    /**
     * Build a new PSQData object with a raw MI Tab line.
     *
     * @param raw Raw line
     * @param keep_raw If the line is meant to be saved in raw property
     */
    constructor(raw: string, keep_raw?: boolean);
    /** Create a new PSQData from a JavaScript object, not from a real MI Tab line */
    static create(fake: ArtefactualMitabData): PSQData;
    /** The 2 protein IDs present in the line */
    readonly ids: [string, string];
    /**
     * Test if two instances of PSQData are equals
     */
    equal(other: PSQData): boolean;
    toString(): string;
    readonly [Symbol.toStringTag]: string;
    /**
     * @alias species
     *
     * Taxonomic IDs of the two interactors
     */
    readonly taxid: [string, string];
    /**
     * Publication ID of the interaction
     */
    readonly pmid: string;
    /**
     * Source database of the interaction
     */
    readonly source: string;
    /**
     * Detection method of this interaction
     */
    readonly interactionDetectionMethod: string;
    /**
     * @alias taxid
     *
     * Species of the two interactors (taxids)
     */
    readonly species: string[];
    /**
     * Like species, but with the annotation, not only the name
     */
    readonly full_species: string[];
    protected uniprotCapture(str: string): string;
    /**
     * UniProt IDs of the two interactors, but sorted
     */
    readonly uniprotPair: [string, string] | undefined;
    /**
     * JSON version of the PSQData
     */
    readonly json: string;
    /**
     * Interactors ID + alternates IDs
     *
     * @returns Tuple<[type, id1][], [type, id2][]>
     */
    readonly interactors: [[string, string][], [string, string][]];
    /**
     * Get a MI Tab **raw** information by index (splitted by '\t')
     * @param i
     */
    index(i: number): string;
    /**
     * Get the MI Tab **raw** information of a field by his name.
     *
     * You can explore field name in `PSQData.PSQ_FIELDS`.
     *
     * @param name Name of the field to get
     */
    rawField(name: string): string;
    /**
     * Get the `PSQDatum` by his name.
     *
     * You can explore field name in `PSQData.PSQ_FIELDS`.
     *
     * @param name Name of the field to get
     */
    field(name: string): PSQDatum;
}
/**
 * One field of a MI Tab line.
 * One field can held multiple values/informations (splitted by a pipe), this is why one "field" has multiple `PSQField`.
 */
export declare class PSQDatum {
    data: PSQField[];
    constructor(colomn: string);
    /**
     * Check equality between two fields.
     */
    equal(datum: PSQDatum): boolean;
    toString(): string;
    readonly [Symbol.toStringTag]: string;
    [Symbol.iterator](): IterableIterator<PSQField>;
    /**
     * Iterate through the PSQFields
     */
    entries(): IterableIterator<[number, PSQField]>;
    /**
     * Get field value where the type equals to key.
     *
     * @param key Type of field
     */
    at(key: string): string[];
    /**
     * Couples [type, value] of the PSQFields.
     */
    readonly content: [string, string][];
    /**
     * Values inside the PSQFields, joined with a pipe.
     */
    readonly value: string;
}
/**
 * Most basic datum of a MI Tab line.
 *
 * Hold one information of one field.
 */
export declare class PSQField {
    static readonly fieldParser: RegExp;
    /**
     * Value of the field. Should (generally) be an ID
     */
    value: string;
    /**
     * Type of the field, like uniprot:.
     *
     * The type contains the ":" !
     */
    type: string | undefined;
    /**
     * Annotation. Free text, can contain any type of characters (except tabulations or pipes).
     */
    annotation: string | undefined;
    /**
     * Construct the object with raw field data. Must not contain pipes.
     *
     * A complete field (with possible multiple informations) should be only given to `PSQDatum` class !
     *
     * @param element Field
     */
    constructor(element: string);
    /**
     * Check equality between this field and another one.
     */
    equal(field: PSQField): boolean;
    toString(): string;
    readonly [Symbol.toStringTag]: string;
}
