import HomologTree, { HomologChildren } from "./HomologyTree";
import { Graph } from "graphlib";
import { HoParameterSet, HoParameter } from "./HoParameter";
import GoTermsContainer from './GoTermsContainer';
import UniprotContainer from './UniprotContainer';
import { MDTree } from './MDTree';
import PSICQuic from "./PSICQuic";
import { PSQData } from "./PSICQuicData";
export interface NodeGraphComponent {
    group: number;
    val: number;
}
export interface SerializedOmegaTopology {
    graph: Object;
    tree: string;
    homolog?: string;
    version: number;
    taxid?: string;
}
export interface ArtefactalEdgeData {
    source: string;
    target: string;
    support?: PSQData[];
}
export interface ArtefactualMitabData {
    /** Accession UniProt number of protein 1 */
    id1: string;
    /** Accession UniProt number of protein 2 */
    id2: string;
    /** Taxonomic IDs */
    tax_ids: string[];
    /** MI IDs (only MI:xxxx is required) */
    mi_ids: string[];
    /** Pubmed IDs */
    pubmed_ids: string[];
    /** Alternative IDs for protein 1; Format must be "database:identifier" */
    alternatives_id1?: string[];
    /** Alternative IDs for protein 2; Format must be "database:identifier" */
    alternatives_id2?: string[];
    /** Aliases for protein 1; Format must be "database:identifier" */
    aliases_id1?: string[];
    /** Aliases for protein 2; Format must be "database:identifier" */
    aliases_id2?: string[];
    /**
     * Free text **EXCEPT `\t`**.
     */
    first_authors?: string[];
    /** Interaction types; Format must be "database:identifier" */
    interaction_types?: string[];
    /** Interaction identifiers; Format must be "database:identifier" */
    interaction_identifiers?: string[];
    /** Source databases; Format must be "database:identifier" */
    source_dbs?: string[];
    /** Confidence score; Format must be "scoreType:value" */
    confidence_scores?: string[];
}
/**
 * Store all informations about a interolog network.
 *
 * Store homology data and link existence via a MDTree<HoParameterSet> constructed via a HomologyTree,
 * store interaction evidences via PSICQuic object,
 * store UniProt data via UniprotContainer and GoTermsContainer,
 * and can create a Graph object to represent the network.
 */
export default class OmegaTopology {
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
    mitab_loaded: boolean;
    protected go_terms: GoTermsContainer;
    protected _uniprot_container: UniprotContainer;
    protected taxid: string;
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
     * @param {PSICQuic} [mitabObj] If you want to have a custom Mitab object, specify it here. Otherwise, create a new object with a empty PSICQuic obj.
     */
    constructor(homologyTree?: HomologTree, mitabObj?: PSICQuic, uniprot_url?: string);
    /**
     * Resolve when OmegaTopology is ready.
     *
     * @returns {Promise<void>}
     */
    init(): Promise<void>;
    /**
     * Init this object with a serialized representation of OmegaTopology.
     *
     * @param {SerializedOmegaTopology} obj JSON.parsed serialized string
     * @returns {this}
     */
    protected initFromSerialized(obj: SerializedOmegaTopology): this;
    /**
     * Download a serialized OmegaTopology from an URL, then
     * load the data in the current object.
     *
     * @param {string} url
     * @returns {Promise<void>}
     */
    fromDownload(url: string): Promise<void>;
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
     * Create a new OmegaTopology object from a serialized string.
     * You can specify a Mitab object to attach to.
     *
     * @static
     * @param {string} serialized
     * @param {PSICQuic} [customMitab] Optional.
     * @returns {OmegaTopology}
     */
    static from(serialized: string, customMitab?: PSICQuic): OmegaTopology;
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
     * Add a couple of HomologChildren to internal tree.
     *
     * @param {HomologChildren} dataNewA
     * @param {HomologChildren} dataNewB
     */
    protected addEdgeSet(dataNewA: HomologChildren, dataNewB: HomologChildren): HoParameterSet[];
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
     * Build the edges using the "reverse" method:
     * Ask the CouchDB what is the partners of all the keys of homology tree.
     * Then, get the data from all the partners from tree,
     * then construct the internal tree using addEdgeSet.
     *
     * Due to how the IDs are stored inside the database, this may cause doublons !
     * Make sure to do a `.trimEdges({ definitive: true, destroy_identical: true })`
     * after calling this method.
     *
     * If you have imported a serialized string to create the OmegaTopology object,
     * you DON'T have to do this again !
     *
     * @param {string} url URL to the omegalomodb service (with endpoint).
     * @param {*} bar
     */
    buildEdgesReverse(url: string, bar?: any /** Progress bar (any for not importing Progress in clients) */): Promise<number>;
    /**
     * Trim edges that don't meet the threshold.
     * Trimmed edges won't be visible using iterVisible() and won't be
     * present during the next's prune() calls.
     *
     * This trim is not definitive, you can use to hide edges then make then visible again with a further call.
     *
     * If definitive = true, remove the nodes definitively from internal tree (useful for free RAM and speed up the prune process).
     *
     * @param [simPct=0] Similarity, in percentage (default 0)
     * @param [idPct=0] Identity, in percentage (default 0)
     * @param [cvPct=0] Coverage, in percentage (default 0)
     * @param [eValue=1] E-value (default 1)
     * @param definitive Definitive trim (default false)
     * @param exp_det_methods Experimental detection methods required. Must be an array of **string**. Empty array if any type of detection is allowed.
     * @param taxons Valid taxons required. Must be an array of **string**. Empty array if any taxon is allowed.
     * @returns [number of deleted edges, total edges count]
     */
    trimEdges({ simPct, idPct, cvPct, eValue, exp_det_methods, taxons, definitive, logged_id, destroy_identical }?: {
        simPct?: number;
        idPct?: number;
        cvPct?: number;
        eValue?: number;
        exp_det_methods?: any[];
        taxons?: any[];
        definitive?: boolean;
        logged_id?: string;
        destroy_identical?: boolean;
    }): [number, number, any];
    /**
     * Prune and renew the graph.
     *
     * @param {number} [max_distance] If you want all the connex composants, use -1 or ±Infinity
     * @param {...string[]} seeds All the seeds you want to search
     * @returns {Graph}
     */
    prune(max_distance?: number, ...seeds: string[]): Graph;
    /**
     * Add a fake edge to the internal graph. You must rebuild the graph with `.constructGraph()`
     * in order to see the new artefactal edge.
     * @param edgeData
     */
    protected addArtefactualEdge(edgeData: ArtefactalEdgeData): void;
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
     * Get all the unique pairs in template pairs.
     * Pairs are 100% unique and reversible, it mean you **can't** have [id1, id2] then [id2, id1].
     *
     * @returns {[string, string][]}
     */
    uniqueTemplatePairs(fromVisible?: boolean): [string, string][];
    /**
     * Find proteins matching the query (in their annotation) and returns their IDs.
     *
     * Graph must have be constructed with `.constructGraph()` !
     *
     * @param query Query, in string or regexp
     */
    searchInGraphByAnnotation(query: string | RegExp): string[];
    /**
     * Find proteins matching the query (in their annotation) and returns their IDs,
     * classified with where they've matched.
     *
     * Graph must have be constructed with `.constructGraph()` !
     *
     * @param query Query, in string or regexp
     */
    advancedSearchInGraphByAnnotation(query: string | RegExp): import("./UniprotContainer").ProteinMatches;
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
     * Graph must have been constructed with .constructGraph() or .prune()
     */
    readonly nodes: [string, NodeGraphComponent][];
    /**
     * Get all the links.
     * Graph must have been constructed with .constructGraph() or .prune()
     */
    readonly links: [[string, string], HoParameterSet][];
    /**
     * Length of the internal tree.
     */
    readonly length: number;
    /**
     * Length of the homology tree.
     */
    readonly hDataLength: number;
    /**
     * Get experimental method available in visible graph.
     */
    readonly visible_experimental_methods_in_graph: Set<string>;
    /**
     * Get available taxonomic ids in visible graph.
     */
    readonly visible_taxonomy_ids_in_graph: Set<string>;
    /**
     * Make all nodes "visible" (reverse a prune) then construct the graph.
     *
     * @param {string[]} seeds
     * @returns {Graph}
     * @memberof OmegaTopology
     */
    constructGraph(build_edges_number?: boolean): Graph;
    /**
     * Make a new graph using currently visible nodes/edges.
     */
    protected makeGraph(build_edges_number?: boolean): Graph;
    /**
     * Read MI Tab lines and register then in PSICQuic object.
     * When you have finished to read lines, call **.linkMitabLines()** !
     *
     * @returns Number of read couples
     */
    read(lines: string[] | string[][]): number;
    /**
     * Link MI Tab lines held by PSICQuic object inside the HoParameterSets
     *
     * Mitab lines must have been downloaded in PSICQuic object !
     */
    linkMitabLines(): void;
    /**
     * Reference to the PSICQuic object used to add/delete Mitab lines.
     */
    readonly psi: PSICQuic;
    downloadGoTerms(...protein_ids: string[]): Promise<void>;
    downloadNeededGoTerms(): Promise<void>;
    getProteinInfos(protein_id: string): Promise<import("./UniprotContainer").UniprotProtein>;
    /**
     * Download the UniProt data for all nodes.
     *
     * Graph must have been already builded !
     */
    downloadNeededUniprotData(): Promise<void>;
    readonly go_container: GoTermsContainer;
    readonly uniprot_container: UniprotContainer;
    uniprot_url: string;
    /**
     * Create an artefactal link, with additionnal interaction support.
     *
     * You must rebuild the graph with `.constructGraph()`
     * in order to see the new artefactal edge.
     */
    createArtefactual(edgeData: ArtefactalEdgeData, mitabs?: ArtefactualMitabData[]): void;
    readonly taxomic_id: string;
    toString(): string;
}
