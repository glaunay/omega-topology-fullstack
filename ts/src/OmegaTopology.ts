import HomologTree, { HomologChildren } from "./HomologyTree";
import { Graph, json as GraphJSON } from "graphlib";
import { HoParameterSet, HoParameter, MitabParameter } from "./HoParameter";
import GoTermsContainer, { ProtGOTerms } from './GoTermsContainer';
import UniprotContainer from './UniprotContainer';
import { MDTree } from './MDTree';
import PartnersMap from './PartnersMap';
import { setUnion } from './helpers';
import zip from 'python-zip';
import md5 from 'md5';
import PSICQuic from "./PSICQuic";
import { PSQData } from "./PSICQuicData";

interface NodeGraphComponent {
    group: number;
    val: number;
}

interface SerializedOmegaTopology {
    graph: Object;
    tree: string;
    homolog?: string;
    version: number
}

export interface ArtefactalEdgeData {
    source: string;
    target: string;
    support?: PSQData[];
}

export interface ArtefactualMitabData {
    id1: string;
    id2: string;
    tax_ids: string[];
    mi_ids: string[];
    pubmed_ids: string[];
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
    /* --- PROPERTIES --- */

    /**
     * Represents all the blast hits of current used organism.
     */
    protected hData: HomologTree;
    /**
     * Represents all the edges / nodes held by OmegaTopology.
     */
    protected ajdTree: MDTree<HoParameterSet> = new MDTree(false);
    /**
     * Represents Mitab data held by current object.
     */
    protected baseTopology: PSICQuic; 
    protected init_promise = Promise.resolve();

    /** True if mitab is loaded */
    public mitab_loaded = false;

    protected go_terms = new GoTermsContainer;
    protected _uniprot_container: UniprotContainer;
    
    /**
     * GRAPH
     * Node type: string
     * Node data / label: NodeGraphComponent
     * Edge data / label: HoParameterSet
     */
    protected G: Graph;

    
    /* --- INITIALISATION --- */

    /**
     * Creates an instance of OmegaTopology.
     * 
     * @param {HomologTree} [homologyTree] If you want to use a tree, specify it here. Required to build edges.
     * @param {PSICQuic} [mitabObj] If you want to have a custom Mitab object, specify it here. Otherwise, create a new object with a empty PSICQuic obj.
     */
    constructor(
        homologyTree?: HomologTree, 
        mitabObj?: PSICQuic, 
        protected uniprot_url?: string
    ) {
        this.hData = homologyTree;
        this.baseTopology = mitabObj ? mitabObj : new PSICQuic;
        this._uniprot_container = new UniprotContainer(uniprot_url);
        this.G = new Graph({ directed: false });
    }

    /**
     * Resolve when OmegaTopology is ready.
     *
     * @returns {Promise<void>}
     */
    init() {
        return this.init_promise;
    }

    /**
     * Init this object with a serialized representation of OmegaTopology.
     *
     * @param {SerializedOmegaTopology} obj JSON.parsed serialized string
     * @returns {this}
     */
    protected initFromSerialized(obj: SerializedOmegaTopology) {
        this.ajdTree = MDTree.from(obj.tree, (_, value) => {
            if (typeof value === "object" && "lowQueryParam" in value && "highQueryParam" in value) {
                return HoParameterSet.from(value);
            }
            return value;
        }) as MDTree<HoParameterSet>;
        this.G = GraphJSON.read(obj.graph);

        if (obj.homolog) {
            this.hData = HomologTree.from(obj.homolog);
        }

        return this;
    }

    /**
     * Download a serialized OmegaTopology from an URL, then
     * load the data in the current object.
     *
     * @param {string} url
     * @returns {Promise<void>}
     */
    fromDownload(url: string) {
        return this.init_promise = fetch(url)
            .then(r => r.json())
            .then(obj => {
                OmegaTopology.checkSerializedObject(obj);
                this.initFromSerialized(obj);
            });
    }


    /* --- SERIALIZATION --- */

    /**
     * Dump the current generated graph to string.
     *
     * @param {boolean} [trim_invalid=true]
     * @returns {string}
     */
    dumpGraph(trim_invalid = true) {
        const graph: any = GraphJSON.write(this.G);

        if (trim_invalid) {
            // Trimming invalid
            for (const link of graph.edges) {
                // Copy link.value
                link.value = { ...link.value };

                // filter low query param & high query param
                link.value.lowQueryParam = link.value.lowQueryParam.filter(e => e.valid);
                link.value.highQueryParam = link.value.highQueryParam.filter(e => e.valid);
            }
        }

        return JSON.stringify(graph);
    }

    /**
     * Serialize the OmegaTopology object. 
     * To reduce the size of the save, you can omit the homology tree. 
     * (Not required for usage when all the edges are built.)
     *
     * @param {boolean} [with_homology_tree=true]
     * @returns {string}
     */
    serialize(with_homology_tree = true) : string {
        const obj: SerializedOmegaTopology = {
            graph: GraphJSON.write(this.G),
            tree: this.ajdTree.serialize(),
            version: 1
        };

        if (with_homology_tree) {
            obj.homolog = this.hData.serialize();
        }

        return JSON.stringify(obj);
    }

    /**
     * Check if the given object is a valid OmegaTopology serialized.
     *
     * @static
     * @param {*} obj
     */
    protected static checkSerializedObject(obj: any) {
        if (!OmegaTopology.isASerializedOmegaTopology(obj)) {
            throw new Error("Object is not omegatopology serialization");
        }

        const supported = [1];
        if (!supported.includes(obj.version)) {
            throw new Error("Unsupported OmegaTopology version: " + obj.version);
        }
    }

    /**
     * Return true if obj meets all required keys in a serialized OmegaTopology obj.
     * @static
     * @param {*} obj
     * @returns {boolean}
     */
    protected static isASerializedOmegaTopology(obj: any): boolean {
        return "version" in obj && "tree" in obj && "graph" in obj;
    }

    /**
     * Create a new OmegaTopology object from a serialized string.
     * You can specify a Mitab object to attach to.
     *
     * @static
     * @param {string} serialized
     * @param {PSICQuic} [customMitab] Optional.
     * @returns {OmegaTopology}
     */
    static from(serialized: string, customMitab?: PSICQuic) : OmegaTopology {
        const obj: SerializedOmegaTopology = JSON.parse(serialized);

        OmegaTopology.checkSerializedObject(obj);

        const newobj = new OmegaTopology(undefined, customMitab);
        
        return newobj.initFromSerialized(obj);
    }


    /* --- ITERATION --- */

    /**
     * Yield all the edges of internal tree (even not visible)
     * First and second string mean the edge label, HoParameterSet is the value.
     *
     * @yields {[string, string, HoParameterSet]}
     */
    *[Symbol.iterator]() : IterableIterator<[string, string, HoParameterSet]> {
        yield* this.ajdTree;
    }

    /**
     * Yields all the edges that are visible. See [[Iterator]].
     * 
     * @yields {[string, string, HoParameterSet]}
     */
    *iterVisible() : IterableIterator<[string, string, HoParameterSet]> {
        for (const [k1, k2, datum] of this) {
            if (!datum.isEmpty && datum.visible) {
                yield [k1, k2, datum];
            }
        }
    }

    /**
     * Yields all the "template pairs": Couple of HoParameter.
     * If you want unique pairs of ID composed by the templates (pairs could be duplicated because of a non-filtered load),
     * Use the "uniqueTemplatePairs" function.
     *
     * @yields {[HoParameter, HoParameter]}
     */
    *templatePairs() : IterableIterator<[HoParameter, HoParameter]> {
        for (const [, , set] of this) {
            yield* zip(set.lowQueryParam, set.highQueryParam) as IterableIterator<[HoParameter, HoParameter]>;
        }
    }


    /* --- NETWORK MANIPULATION --- */

    /**
     * Add a couple of HomologChildren to internal tree.
     *
     * @param {HomologChildren} dataNewA
     * @param {HomologChildren} dataNewB
     */
    addEdgeSet(dataNewA: HomologChildren, dataNewB: HomologChildren) : HoParameterSet[] {
        const newAelements = Object.keys(dataNewA).map(e => [md5(e), e, dataNewA[e]]) as [string, string, string[]][];
        const newBelements = Object.keys(dataNewB).map(e => [md5(e), e, dataNewB[e]]) as [string, string, string[]][];
        const added = [];

        for (const [hA, idA, dA] of newAelements) {
            for (const [hB, idB, dB] of newBelements) {
                let dX: string[], dY: string[];
                if (hA < hB) {
                    dX = dA;
                    dY = dB;
                }
                else {
                    dX = dB;
                    dY = dA;
                }

                const HoParameterSetObj: HoParameterSet = this.ajdTree.getOrSet(idA, idB, new HoParameterSet);
                HoParameterSetObj.add(dX, dY);
                added.push(HoParameterSetObj);
            }
        }

        return added;
    }

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
    buildEdges() : void {
        if (!this.baseTopology) {
            throw new Error('OmegaTopology has not been initialized with base topo');
        }
    
        let nbBase = 0;

        for (const [baseIdA, baseIdB, ] of this.baseTopology.couples()) {
            const dataNewA = this.hData.getChildrenData(baseIdA);
            const dataNewB = this.hData.getChildrenData(baseIdB);
            this.addEdgeSet(dataNewA, dataNewB);
            nbBase++;
        }

        console.log(this.edgeNumber, "interactions unpacked from", nbBase);
    }

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
    async buildEdgesReverse(url: string, bar?: any /** Progress bar (any for not importing Progress in clients) */) {
        const inters = new PartnersMap({ 
            database_url: url
        });

        // let time = 0;
        let atime = 0;

        let timer = Date.now();

        // On itère sur des tas d'ID récupérés depuis un jeu d'ID initial (contenu dans
        // this.hData), on récupère ce tas d'ID par paquets (d'où l'itérateur async)
        for await (const ids of inters.bulkGet(this.hData)) {
            if (bar) bar.tick(Object.keys(ids).length);

            // Pour chaque couple ID => partners renvoyé
            for (const [children_id, p] of Object.entries(ids)) {
                // On construit des tuples ID => partner pour chaque partner disponible
                const tuple_interactors = p.partners.map(e => [children_id, e]);

                // On les ajoute dans l'arbre
                for (const [baseIdA, baseIdB] of tuple_interactors) {
                    const dataNewA = this.hData.getChildrenData(baseIdA);
                    const dataNewB = this.hData.getChildrenData(baseIdB);
                    this.addEdgeSet(dataNewA, dataNewB);
                }
            }
        }
        atime += (Date.now() - timer);
        return atime;
    }

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
    trimEdges({
        simPct = 0, 
        idPct = 0, 
        cvPct = 0, 
        eValue = 1, 
        exp_det_methods = [],
        taxons = [],
        definitive = false,
        logged_id = "",
        destroy_identical = false
    } = {}) : [number, number, any] {
        let nDel = 0;
        let nTot = 0;

        const logged = [];
        const enable_log = logged_id.length > 0;

        for (const [x, y, HoParameterSetObj] of this) {
            const is_logged = enable_log && [x, y].includes(logged_id);

            nTot++;
            const reasons = HoParameterSetObj.trim({
                simPct,
                idPct,
                cvPct,
                eValue,
                exp_methods: exp_det_methods.length ? new Set(exp_det_methods) : undefined,
                taxons: taxons.length ? new Set(taxons) : undefined,
                definitive,
                logged: is_logged,
                destroy_identical
            });

            if (HoParameterSetObj.isEmpty) {
                nDel++;

                if (is_logged) {
                    const reasons_logged = logged_id === x ? reasons.map(e => e[0]) : reasons.map(e => e[1]);
                    const reasons_not_logged = logged_id === x ? reasons.map(e => e[1]) : reasons.map(e => e[0]);

                    logged.push({ x, y, logged: reasons_logged, partner: reasons_not_logged });
                }

                if (definitive) {
                    this.ajdTree.remove(x, y);
                }
            }
        }

        return [nDel, nTot, logged];
    }

    /**
     * Prune and renew the graph.
     * 
     * @param {number} [max_distance=5] If you want all the connex composants, use -1 or ±Infinity
     * @param {...string[]} seeds All the seeds you want to search
     * @returns {Graph}
     */
    prune(max_distance: number = 5, ...seeds: string[]) : Graph {
        this.constructGraph();

        let t = Date.now();
        console.log("Graph has", this.G.nodeCount(), "nodes and", this.G.edgeCount(), "edges");

        const _seeds = new Set(seeds);

        const seed_set = [];
        const other_set = [];

        for (const n of this.G.nodes()) {
            // this.showNode(n);

            if (_seeds.has(n)) {
                this.G.setNode(n, { group: 1, val: 0 });
                seed_set.push(n);
            }
            else {
                other_set.push(n);
            }
        }

        console.log("Sets has been constructed in", (Date.now() - t)/1000, "seconds");
        t = Date.now();

        if (seeds.length === 0) {
            console.warn("No seed to prune");
        }
        else {
            // Gettings neighboors for a specific distance
            const getAvailableNeighboors = (initial: string, distance: number) : Set<string> => {
                const node = this.G.node(initial);
                if (!node) {
                    return new Set;
                }

                let to_visit = new Set(this.G.neighbors(initial) as string[]);
                let visited = new Set([initial]);

                while (distance !== 0 && to_visit.size) {
                    let tampon = new Set<string>();
                    // Ajout de chaque voisin des voisins
                    for (const visitor of to_visit) {
                        if (!visited.has(visitor)) {
                            // Si ce noeud n'est pas encore visité
                            // On l'ajoute pour ne jamais le revisiter
                            visited.add(visitor);

                            // On regarde ses voisins
                            // Et ajout de tous dans les noeuds à visiter
                            tampon = setUnion(tampon, this.G.neighbors(visitor) as string[]);
                        }
                    }

                    // Mise à jour de to_visit avec le set tampon
                    to_visit = tampon;

                    distance--;
                }

                console.log("Visited nodes: ", visited);

                return visited;
            };

            // console.log(this.G);
            let global_set = new Set<string>();
            for (const seed of seed_set) {
                if (max_distance === Infinity && global_set.has(seed)) {
                    // Si la seed est déjà dans les voisins trouvés et 
                    // que distance infinie: 
                    // pas besoin de chercher les voisins de celui là !
                    continue;
                }

                for (const el of getAvailableNeighboors(seed, max_distance)) {
                    global_set.add(el);
                }
            }

            for (const node of other_set) {
                if (!global_set.has(node)) {
                    this.G.removeNode(node);
                    this.hideNode(node);
                }
            }
        }

        console.log("Paths found in", (Date.now() - t)/1000, "seconds");
        t = Date.now();

        // Exploring degree for all nodes
        for (const node of this.G.nodes()) {
            const node_value = this.G.node(node) as NodeGraphComponent;
            const edges = this.G.nodeEdges(node);

            if (edges) {
                node_value.val = edges.length;
            }
        }

        console.log("Degrees has been set in", (Date.now() - t)/1000, "seconds");

        return this.G;
    }

    /**
     * Add a fake edge to the internal graph. You must rebuild the graph with `.constructGraph()`
     * in order to see the new artefactal edge.
     * @param edgeData 
     */
    addArtefactualEdge(edgeData: ArtefactalEdgeData) {
        const node1 = edgeData.target;
        const node2 = edgeData.source;

        // Test if link already exists
        if (this.ajdTree.get(node1, node2)) {
            return;
        }

        if (!this.hData) {
            this.hData = new HomologTree("");
        }
        // Create fake homology data
        const [dataNewA, dataNewB] = this.hData.addArtefactal(edgeData);

        const params = this.addEdgeSet(dataNewA, dataNewB);
        this.constructGraph(true);
        
        if (edgeData.support) {
            for (const l of edgeData.support) {
                this.psi.update(l);
            }
            // Updating mitab lines
            for (const p of params) {
                const lines_for_this_parameter: PSQData[][] = [];
    
                for (const [ho_a, ho_b] of p) {
                    const [id_a, id_b] = [ho_a.template, ho_b.template];
    
                    lines_for_this_parameter.push(this.psi.getLines(id_a, id_b));
                }
    
                p.mitabCouples = lines_for_this_parameter.map(e => e.map(d => new MitabParameter(d)));
            }
        }
    }

    /**
     * Make a node visible.
     * Warning: This function is NOT at constant complexity.
     *
     * @param {string} node
     */
    protected showNode(node: string) {
        const node_value = Object.entries(this.ajdTree.getNode(node));

        for (const [, edge] of node_value) {
            edge.visible = true;
        }
    }

    /**
     * Make a node hidden.
     * Warning: This function is NOT at constant complexity.
     *
     * @param {string} node
     */
    protected hideNode(node: string) {
        const node_value = Object.entries(this.ajdTree.getNode(node));

        for (const [, edge] of node_value) {
            edge.visible = false;
        }
    }


    /* --- GET GRAPH INFORMATIONS --- */

    /**
     * Get all the unique pairs in template pairs. 
     * Pairs are 100% unique and reversible, it mean you **can't** have [id1, id2] then [id2, id1].
     *
     * @returns {[string, string][]}
     */
    uniqueTemplatePairs(fromVisible = false) : [string, string][] {
        const templateColl = new MDTree<boolean>(false);
        const gen = fromVisible ? this.iterVisible() : this[Symbol.iterator]();

        for (const [, , e] of gen) {
            const templates = fromVisible ? e.templates : e.full_templates;

            for (const [t1, t2] of zip(...templates)) {
                templateColl.getOrSet(t1, t2, true);
            }
        }

        const unique_pairs: [string, string][] = [];

        for (const id in templateColl.full_tree) {
            unique_pairs.push(...Object.keys(templateColl.full_tree[id]).map(k => [id, k]) as [string, string][]);
        }

        return unique_pairs;
    }

    /**
     * Number of visible edges.
     */
    get edgeNumber() : number {
        return [...this.iterVisible()].length;
    }

    /**
     * Number of visible nodes. (must have constructed graph with `.constructGraph()` before)
     */
    get nodeNumber() : number {
        return Object.keys(this.nodes).length;
    }

    /**
     * Get all the nodes.
     * Graph must have been constructed with .constructGraph() or .prune()
     */
    get nodes() : [string, NodeGraphComponent][] {
        return this.G.nodes().map(n => [n, this.G.node(n)]);
    }

    /**
     * Get all the links.
     * Graph must have been constructed with .constructGraph() or .prune()
     */
    get links() : [[string, string], HoParameterSet][] {
        return this.G.edges().map(e => [[e.v, e.w], this.G.edge(e)]);
    }

    /**
     * Length of the internal tree.
     */
    get length() {
        return this.ajdTree.length;
    }

    /**
     * Length of the homology tree.
     */
    get hDataLength() {
        return this.hData ? this.hData.length : 0;
    }

    /**
     * Get experimental method available in visible graph.
     */
    get visible_experimental_methods_in_graph() {
        const exp = new Set<string>();

        for (const [,, parameter] of this.iterVisible()) {
            for (const [,, lines] of parameter.full_iterator(true)) {
                for (const line of lines) {
                    exp.add(line.interactionDetectionMethod);
                }
            }
        }

        return exp;
    }

    /**
     * Get available taxonomic ids in visible graph.
     */
    get visible_taxonomy_ids_in_graph() {
        const exp = new Set<string>();

        for (const [,, parameter] of this.iterVisible()) {
            for (const [,, lines] of parameter.full_iterator(true)) {
                for (const line of lines) {
                    const tax_ids = line.taxid;
                    exp.add(tax_ids[0]).add(tax_ids[1]);
                }
            }
        }

        return exp;
    }


    /* --- GRAPHLIB MANIPULATION --- */

    /**
     * Make all nodes "visible" (reverse a prune) then construct the graph.
     *
     * @param {string[]} seeds
     * @returns {Graph}
     * @memberof OmegaTopology
     */
    constructGraph(build_edges_number = false) : Graph {
        // Set all nodes visible
        for (const [, , datum] of this) {
            datum.visible = true;
        }

        return this.G = this.makeGraph(build_edges_number);
    }

    /**
     * Make a new graph using currently visible nodes/edges.
     */
    protected makeGraph(build_edges_number = false) {
        const g = new Graph({ directed: false });

        for (const [n1, n2, edgeData] of this.iterVisible()) {
            // Test if edge exists already
            if (!g.edge(n1, n2)) {
                g.setNode(n1, { group: 0, val: 0 }).setNode(n2, { group: 0, val: 0 }).setEdge(n1, n2, edgeData);
            }
        }

        if (build_edges_number)
            for (const node of g.nodes()) {
                const node_value = g.node(node) as NodeGraphComponent;
                const edges = g.nodeEdges(node);

                if (edges) {
                    node_value.val = edges.length;
                }
            }

        return g;
    }


    /* --- MITAB DATA INTERACTION --- */

    /**
     * Read MI Tab lines and register then in PSICQuic object.
     * When you have finished to read lines, call **.linkMitabLines()** !
     * 
     * @returns Number of read couples
     */
    read(lines: string[] | string[][]) {
        if (lines.length > 0) {
            if (Array.isArray(lines[0])) {
                this.psi.readLines([].concat(...lines));
            }
            else {
                this.psi.readLines(lines as string[]);
            }
        }

        return lines.length;
    }

    /**
     * Link MI Tab lines held by PSICQuic object inside the HoParameterSets
     * 
     * Mitab lines must have been downloaded in PSICQuic object !
     */
    linkMitabLines() {
        for (const [, , ho_parameter_set] of this) {
            const lines_for_this_parameter: PSQData[][] = [];

            for (const [ho_a, ho_b] of ho_parameter_set) {
                const [id_a, id_b] = [ho_a.template, ho_b.template];

                lines_for_this_parameter.push(this.psi.getLines(id_a, id_b));
            }

            ho_parameter_set.mitabCouples = lines_for_this_parameter.map(e => e.map(d => new MitabParameter(d)));
        }

        this.mitab_loaded = true;
    }

    /**
     * Reference to the PSICQuic object used to add/delete Mitab lines.
     */
    get psi() {
        return this.baseTopology;
    }


    /* --- UNIPROT DATA --- */

    async downloadGoTerms(...protein_ids: string[]) {
        const req: ProtGOTerms = await fetch(this.uniprot_url + "/go", {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ ids: protein_ids })
        }).then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)));

        this.go_terms.add(req);
    }

    async getProteinInfos(protein_id: string) {
        return this.uniprot_container.getFullProtein(protein_id);
    }

    /**
     * Download the UniProt data for all nodes.
     * 
     * Graph must have been already builded !
     */
    async downloadNeededUniprotData() {
        // Get all proteins ids
        const nodes = this.G.nodes();

        // Bulk download
        await this.uniprot_container.bulkTiny(...nodes);
    }

    get go_container() {
        return this.go_terms;
    }

    get uniprot_container() {
        return this._uniprot_container;
    }

    
    /* --- UTILITIES --- */

    /**
     * Create artefactal data + mitab
     * 
     * @param edgeData 
     * @param mitabs 
     */
    createArtefactual(edgeData: ArtefactalEdgeData, mitabs: ArtefactualMitabData[] = []) {
        if (mitabs.length) {
            edgeData.support = [];
        }
        for (const m of mitabs) {
            edgeData.support.push(PSQData.create(m));
        }

        this.addArtefactualEdge(edgeData);
    }
    
    toString() : string {
        return JSON.stringify(Array.from(this.iterVisible()));
    }    
}