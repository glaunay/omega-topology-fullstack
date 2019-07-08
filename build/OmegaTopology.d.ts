import HomologTree, { HomologChildren } from "./HomologyTree";
import { Graph } from "graphlib";
import { HoParameterSet, HoParameter } from "./HoParameter";
import GoTermsContainer from './GoTermsContainer';
import { MDTree } from './MDTree';
import PSICQuic from "./PSICQuic";
interface NodeGraphComponent {
    group: number;
    val: number;
}
interface SerializedOmegaTopology {
    graph: Object;
    tree: string;
    homolog?: string;
    version: number;
}
export default class OmegaTopology {
    protected uniprot_url?: string;
    /**
     * Represents all the blast hits of current used organism.
     */
    protected hData: HomologTree;
    /**
     * Represents all the edges / nodes held by OmegaTopology.
     */
    protected ajdTree: MDTree<HoParameterSet>;
    /**
     * Represents Mitab data held by current object.
     */
    protected baseTopology: PSICQuic;
    protected init_promise: Promise<void>;
    /** True if mitab is loaded */
    protected mitab_loaded: boolean;
    protected go_terms: GoTermsContainer;
    protected _uniprot_container: any;
    /**
     * GRAPH
     * Node type: string
     * Node data / label: NodeGraphComponent
     * Edge data / label: HoParameterSet
     */
    protected G: Graph;
    /**
     * Creates an instance of OmegaTopology.
     *
     * @param {HomologTree} [homologyTree] If you want to use a tree, specify it here. Required to build edges.
     * @param {MitabTopology} [mitabObj] If you want to have a custom Mitab object, specify it here. Otherwise, create a new object with a empty PSICQuic obj.
     */
    constructor(homologyTree?: HomologTree, mitabObj?: PSICQuic, uniprot_url?: string);
    /**
     * Resolve when OmegaTopology is ready.
     *
     * @returns {Promise<void>}
     */
    init(): Promise<void>;
    /**
     * Make all nodes "visible" (reverse a prune) then construct the graph.
     *
     * @param {string[]} seeds
     * @returns {Graph}
     * @memberof OmegaTopology
     */
    constructGraph(): Graph;
    /**
     * Prune and renew the graph.
     *
     * @param {number} [max_distance=5] If you want all the connex composants, use -1 or ±Infinity
     * @param {...string[]} seeds All the seeds you want to search
     * @returns {Graph}
     */
    prune(max_distance?: number, ...seeds: string[]): Graph;
    /**
     * Yield all the edges of internal tree (even not visible)
     * First and second string mean the edge label, HoParameterSet is the value.
     *
     * @yields {[string, string, HoParameterSet]}
     */
    [Symbol.iterator](): IterableIterator<[string, string, HoParameterSet]>;
    /**
     * Yields all the edges that are visible. See [[Iterator]].
     *
     * @yields {[string, string, HoParameterSet]}
     */
    iterVisible(): IterableIterator<[string, string, HoParameterSet]>;
    /**
     * Yields all the "template pairs": Couple of HoParameter.
     * If you want unique pairs of ID composed by the templates (pairs could be duplicated because of a non-filtered load),
     * Use the "uniqueTemplatePairs" function.
     *
     * @yields {[HoParameter, HoParameter]}
     */
    templatePairs(): IterableIterator<[HoParameter, HoParameter]>;
    /**
     * Get all the unique pairs in template pairs.
     * Pairs are 100% unique and reversible, it mean you **can't** have [id1, id2] then [id2, id1].
     *
     * @returns {[string, string][]}
     */
    uniqueTemplatePairs(fromVisible?: boolean): [string, string][];
    /**
     * Dump the current generated graph to string.
     *
     * @param {boolean} [trim_invalid=true]
     * @returns {string}
     */
    dumpGraph(trim_invalid?: boolean): string;
    /**
     * Serialize the OmegaTopology object.
     * To reduce the size of the save, you can omit the homology tree.
     * (Not required for usage when all the edges are built.)
     *
     * @param {boolean} [with_homology_tree=true]
     * @returns {string}
     */
    serialize(with_homology_tree?: boolean): string;
    /**
     * Init this object with a serialized representation of OmegaTopology.
     *
     * @param {SerializedOmegaTopology} obj JSON.parsed serialized string
     * @returns {this}
     */
    protected initFromSerialized(obj: SerializedOmegaTopology): this;
    /**
     * Create a new OmegaTopology object from a serialized string.
     * You can specify a Mitab object to attach to.
     *
     * @static
     * @param {string} serialized
     * @param {MitabTopology} [customMitab] Optional.
     * @returns {OmegaTopology}
     */
    static from(serialized: string, customMitab?: PSICQuic): OmegaTopology;
    /**
     * Check if the given object is a valid OmegaTopology serialized.
     *
     * @static
     * @param {*} obj
     */
    protected static checkSerializedObject(obj: any): void;
    /**
     * Return true if obj meets all required keys in a serialized OmegaTopology obj.
     * @static
     * @param {*} obj
     * @returns {boolean}
     */
    protected static isASerializedOmegaTopology(obj: any): boolean;
    /**
     * Download a serialized OmegaTopology from an URL, then
     * load the data in the current object.
     *
     * @param {string} url
     * @returns {Promise<void>}
     */
    fromDownload(url: string): Promise<void>;
    /**
     * Make a new graph using currently visible nodes/edges.
     *
     * @returns {Graph}
     */
    protected makeGraph(): Graph;
    downloadGoTerms(...protein_ids: string[]): Promise<void>;
    getProteinInfos(protein_id: string): Promise<any>;
    /**
     * Graph must have been already builded !
     */
    downloadNeededUniprotData(): Promise<void>;
    readonly go_container: GoTermsContainer;
    readonly uniprot_container: any;
    /**
     * Number of visible edges.
     */
    readonly edgeNumber: number;
    /**
     * Number of visible nodes.
     */
    readonly nodeNumber: number;
    /**
     * Get all the nodes.
     * Graph must have been constructed with .constructGraphFrom() or .prune()
     */
    readonly nodes: [string, NodeGraphComponent][];
    /**
     * Get all the links.
     * Graph must have been constructed with .constructGraphFrom() or .prune()
     */
    readonly links: [[string, string], HoParameterSet][];
    /**
     * Reference to the PSICQuic object used to add/delete Mitab lines.
     */
    readonly psi: PSICQuic;
    /**
     * Mitab lines must have been downloaded in PSICQuic object !
     */
    linkMitabLines(): void;
    /**
     * Read MI Tab lines and register then in PSICQuic object.
     * When you have finished to read lines, call **.linkMitabLines()** !
     *
     * @returns Number of read couples
     */
    read(lines: string[] | string[][]): number;
    /**
     * Make a node visible.
     * Warning: This function is NOT at constant complexity.
     *
     * @param {string} node
     */
    protected showNode(node: string): void;
    /**
     * Make a node hidden.
     * Warning: This function is NOT at constant complexity.
     *
     * @param {string} node
     */
    protected hideNode(node: string): void;
    /**
     * Length of the internal tree.
     */
    readonly length: number;
    /**
     * Length of the homology tree.
     */
    readonly hDataLength: number;
    readonly visible_experimental_methods_in_graph: Set<string>;
    readonly experimental_methods_in_graph: Set<string>;
    readonly visible_taxonomy_ids_in_graph: Set<string>;
    readonly taxonomy_ids_in_graph: Set<string>;
    /**
     * Build the edges using the "reverse" method:
     * Ask the CouchDB what is the partners of all the keys of homology tree.
     * Then, get the data from all the partners from tree,
     * then construct the internal tree using addEdgeSet.
     *
     * If you have imported a serialized string to create the OmegaTopology object,
     * you DON'T have to do this again !
     *
     * @param {string} url URL to the omegalomodb service (with endpoint).
     * @param {*} bar
     */
    buildEdgesReverse(url: string, bar?: any /** Progress bar (any for not importing Progress in clients) */): Promise<number>;
    /**
     * Build the edges using the full-stuffed Mitab Topology object.
     * You NEED to have a homology tree set, and a PSICQuic object with all the Mitab data.
     *
     * Classic processus is:
     * `const p = new PSICQuic` then
     * `await p.read(mitab_filename)` then
     * `const t = new OmegaTopology(hTree, p)` then
     * `t.buildEdges()`
     *
     */
    buildEdges(): void;
    /**
     * Trim edges that don't meet the threshold.
     * Trimmed edges won't be visible using iterVisible() and won't be
     * present during the next's prune() calls.
     *
     * This trim is not definitive, you can use to hide edges then make then visible again with a further call.
     *
     * If definitive = true, remove the nodes definitively from internal tree (useful for free RAM and speed up the prune process).
     *
     * @param [simPct=0] Similarity (default 0)
     * @param [idPct=0] Identity (default 0)
     * @param [cvPct=0] Coverage (default 0)
     * @param [eValue=1] E-value (default 1)
     * @param definitive Definitive trim (default false)
     * @param exp_det_methods Experimental detection methods required. Must be an array of **string**. Empty array if any type of detection is allowed.
     * @param taxons Valid taxons required. Must be an array of **string**. Empty array if any taxon is allowed.
     * @returns [number of deleted edges, total edges count]
     */
    trimEdges({ simPct, idPct, cvPct, eValue, exp_det_methods, taxons, definitive }?: {
        simPct?: number;
        idPct?: number;
        cvPct?: number;
        eValue?: number;
        exp_det_methods?: any[];
        taxons?: any[];
        definitive?: boolean;
    }): [number, number];
    toString(): string;
    /**
     * Add a couple of HomologChildren to internal tree.
     *
     * @param {HomologChildren} dataNewA
     * @param {HomologChildren} dataNewB
     */
    addEdgeSet(dataNewA: HomologChildren, dataNewB: HomologChildren): void;
}
export {};
