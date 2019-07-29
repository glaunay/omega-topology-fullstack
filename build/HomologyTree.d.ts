import { ArtefactalEdgeData } from "./OmegaTopology";
export interface HomologInfo {
    [homologId: string]: {
        [r6ProtId: string]: string[][];
    };
}
export interface HomologChildren {
    [homologKey: string]: string[];
}
/**
 * Allow to read a homology tree (like uniprot_R6_homology.json) formatted in JSON.
 */
export default class HomologyTree {
    data: HomologInfo;
    protected init_promise: Promise<void> | undefined;
    protected internal_tax_id: string;
    /**
     * HomologyTree constructor.
     *
     * @nodeonly If you specify a filename
     * @param filename File should be specifiy **ONLY** if you are in Node.js environnement
     */
    constructor(filename?: string);
    /**
     * Promise symbolizing instance state
     */
    init(): Promise<void>;
    /**
     * Add a unproved edge with fake data.
     * @param edge
     */
    addArtefactal(edge: ArtefactalEdgeData): [HomologChildren, HomologChildren];
    protected addPartialArtefactual(edge: ArtefactalEdgeData, source?: string): {
        [x: string]: any[];
    };
    /**
     * Get all the BLAST results for one protein identifier, ordered by homolog in R6 accession number
     * @param psqId
     */
    getChildrenData(psqId: string): HomologChildren;
    /**
     * Current taxid of the loaded homology tree specie.
     * Need a homology file that includes a taxid key.
     *
     * @readonly
     */
    readonly taxid: string;
    /**
     * Serialize the HomologyTree object
     */
    serialize(): string;
    /**
     * Number of homologs of R6 proteins
     *
     * @readonly
     */
    readonly length: number;
    /**
     * Instanciate a new HomologyTree object from a serialized string
     * @param serialized
     */
    static from(serialized: string): HomologyTree;
    [Symbol.iterator](): IterableIterator<string>;
}
