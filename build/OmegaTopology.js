"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const HomologyTree_1 = __importDefault(require("./HomologyTree"));
const graphlib_1 = require("graphlib");
const HoParameter_1 = require("./HoParameter");
const GoTermsContainer_1 = __importDefault(require("./GoTermsContainer"));
const UniprotContainer_1 = __importDefault(require("./UniprotContainer"));
const MDTree_1 = require("./MDTree");
const PartnersMap_1 = __importDefault(require("./PartnersMap"));
const helpers_1 = require("./helpers");
const python_zip_1 = __importDefault(require("python-zip"));
const md5_1 = __importDefault(require("md5"));
const PSICQuic_1 = __importDefault(require("./PSICQuic"));
class OmegaTopology {
    /**
     * Creates an instance of OmegaTopology.
     *
     * @param {HomologTree} [homologyTree] If you want to use a tree, specify it here. Required to build edges.
     * @param {MitabTopology} [mitabObj] If you want to have a custom Mitab object, specify it here. Otherwise, create a new object with a empty PSICQuic obj.
     */
    constructor(homologyTree, mitabObj, uniprot_url) {
        this.uniprot_url = uniprot_url;
        /**
         * Represents all the edges / nodes held by OmegaTopology.
         */
        this.ajdTree = new MDTree_1.MDTree(false);
        this.init_promise = Promise.resolve();
        /** True if mitab is loaded */
        this.mitab_loaded = false;
        this.go_terms = new GoTermsContainer_1.default;
        this.hData = homologyTree;
        this.baseTopology = mitabObj ? mitabObj : new PSICQuic_1.default;
        this._uniprot_container = new UniprotContainer_1.default(uniprot_url);
        this.G = new graphlib_1.Graph({ directed: false });
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
     * Make all nodes "visible" (reverse a prune) then construct the graph.
     *
     * @param {string[]} seeds
     * @returns {Graph}
     * @memberof OmegaTopology
     */
    constructGraph() {
        // Set all nodes visible
        for (const [, , datum] of this) {
            datum.visible = true;
        }
        return this.G = this.makeGraph();
    }
    /**
     * Prune and renew the graph.
     *
     * @param {number} [max_distance=5] If you want all the connex composants, use -1 or ±Infinity
     * @param {...string[]} seeds All the seeds you want to search
     * @returns {Graph}
     */
    prune(max_distance = 5, ...seeds) {
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
        console.log("Sets has been constructed in", (Date.now() - t) / 1000, "seconds");
        t = Date.now();
        if (seeds.length === 0) {
            console.warn("No seed to prune");
        }
        else {
            // Gettings neighboors for a specific distance
            const getAvailableNeighboors = (initial, distance) => {
                const node = this.G.node(initial);
                if (!node) {
                    return new Set;
                }
                let to_visit = new Set(this.G.neighbors(initial));
                let visited = new Set([initial]);
                while (distance !== 0 && to_visit.size) {
                    let tampon = new Set();
                    // Ajout de chaque voisin des voisins
                    for (const visitor of to_visit) {
                        if (!visited.has(visitor)) {
                            // Si ce noeud n'est pas encore visité
                            // On l'ajoute pour ne jamais le revisiter
                            visited.add(visitor);
                            // On regarde ses voisins
                            // Et ajout de tous dans les noeuds à visiter
                            tampon = helpers_1.setUnion(tampon, this.G.neighbors(visitor));
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
            let global_set = new Set();
            for (const seed of seed_set) {
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
        console.log("Paths found in", (Date.now() - t) / 1000, "seconds");
        t = Date.now();
        // Exploring degree for all nodes
        // TODO TOCHECK
        for (const node of this.G.nodes()) {
            const node_value = this.G.node(node);
            const edges = this.G.nodeEdges(node);
            if (edges) {
                node_value.val = edges.length;
            }
        }
        console.log("Degrees has been set in", (Date.now() - t) / 1000, "seconds");
        return this.G;
    }
    /**
     * Yield all the edges of internal tree (even not visible)
     * First and second string mean the edge label, HoParameterSet is the value.
     *
     * @yields {[string, string, HoParameterSet]}
     */
    *[Symbol.iterator]() {
        yield* this.ajdTree;
    }
    /**
     * Yields all the edges that are visible. See [[Iterator]].
     *
     * @yields {[string, string, HoParameterSet]}
     */
    *iterVisible() {
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
    *templatePairs() {
        for (const [, , set] of this) {
            yield* python_zip_1.default(set.lowQueryParam, set.highQueryParam);
        }
    }
    /**
     * Get all the unique pairs in template pairs.
     * Pairs are 100% unique and reversible, it mean you **can't** have [id1, id2] then [id2, id1].
     *
     * @returns {[string, string][]}
     */
    uniqueTemplatePairs(fromVisible = false) {
        const templateColl = new MDTree_1.MDTree(false);
        const gen = fromVisible ? this.iterVisible() : this[Symbol.iterator]();
        for (const [, , e] of gen) {
            const templates = fromVisible ? e.templates : e.full_templates;
            for (const [t1, t2] of python_zip_1.default(...templates)) {
                templateColl.getOrSet(t1, t2, true);
            }
        }
        const unique_pairs = [];
        for (const id in templateColl.full_tree) {
            unique_pairs.push(...Object.keys(templateColl.full_tree[id]).map(k => [id, k]));
        }
        return unique_pairs;
    }
    /**
     * Dump the current generated graph to string.
     *
     * @param {boolean} [trim_invalid=true]
     * @returns {string}
     */
    dumpGraph(trim_invalid = true) {
        const graph = graphlib_1.json.write(this.G);
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
    serialize(with_homology_tree = true) {
        const obj = {
            graph: graphlib_1.json.write(this.G),
            tree: this.ajdTree.serialize(),
            version: 1
        };
        if (with_homology_tree) {
            obj.homolog = this.hData.serialize();
        }
        return JSON.stringify(obj);
    }
    /**
     * Init this object with a serialized representation of OmegaTopology.
     *
     * @param {SerializedOmegaTopology} obj JSON.parsed serialized string
     * @returns {this}
     */
    initFromSerialized(obj) {
        this.ajdTree = MDTree_1.MDTree.from(obj.tree, (_, value) => {
            if (typeof value === "object" && "lowQueryParam" in value && "highQueryParam" in value) {
                return HoParameter_1.HoParameterSet.from(value);
            }
            return value;
        });
        this.G = graphlib_1.json.read(obj.graph);
        if (obj.homolog) {
            this.hData = HomologyTree_1.default.from(obj.homolog);
        }
        return this;
    }
    /**
     * Create a new OmegaTopology object from a serialized string.
     * You can specify a Mitab object to attach to.
     *
     * @static
     * @param {string} serialized
     * @param {MitabTopology} [customMitab] Optional.
     * @returns {OmegaTopology}
     */
    static from(serialized, customMitab) {
        const obj = JSON.parse(serialized);
        OmegaTopology.checkSerializedObject(obj);
        const newobj = new OmegaTopology(undefined, customMitab);
        return newobj.initFromSerialized(obj);
    }
    /**
     * Check if the given object is a valid OmegaTopology serialized.
     *
     * @static
     * @param {*} obj
     */
    static checkSerializedObject(obj) {
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
    static isASerializedOmegaTopology(obj) {
        return "version" in obj && "tree" in obj && "graph" in obj;
    }
    /**
     * Download a serialized OmegaTopology from an URL, then
     * load the data in the current object.
     *
     * @param {string} url
     * @returns {Promise<void>}
     */
    fromDownload(url) {
        return this.init_promise = fetch(url)
            .then(r => r.json())
            .then(obj => {
            OmegaTopology.checkSerializedObject(obj);
            this.initFromSerialized(obj);
        });
    }
    /**
     * Make a new graph using currently visible nodes/edges.
     *
     * @returns {Graph}
     */
    makeGraph() {
        const g = new graphlib_1.Graph({ directed: false });
        for (const [n1, n2, edgeData] of this.iterVisible()) {
            g.setNode(n1, { group: 0, val: 0 }).setNode(n2, { group: 0, val: 0 }).setEdge(n1, n2, edgeData);
        }
        return g;
    }
    async downloadGoTerms(...protein_ids) {
        const req = await fetch(this.uniprot_url + "/go", {
            method: 'POST',
            body: JSON.stringify({ ids: protein_ids })
        }).then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)));
        this.go_terms.add(req);
    }
    async getProteinInfos(protein_id) {
        return this.uniprot_container.getFullProtein(protein_id);
    }
    /**
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
    /**
     * Number of visible edges.
     */
    get edgeNumber() {
        return [...this.iterVisible()].length;
    }
    /**
     * Number of visible nodes.
     */
    get nodeNumber() {
        return Object.keys(this.nodes).length;
    }
    /**
     * Get all the nodes.
     * Graph must have been constructed with .constructGraphFrom() or .prune()
     */
    get nodes() {
        return this.G.nodes().map(n => [n, this.G.node(n)]);
    }
    /**
     * Get all the links.
     * Graph must have been constructed with .constructGraphFrom() or .prune()
     */
    get links() {
        return this.G.edges().map(e => [[e.v, e.w], this.G.edge(e)]);
    }
    /**
     * Reference to the PSICQuic object used to add/delete Mitab lines.
     */
    get psi() {
        return this.baseTopology;
    }
    /**
     * Mitab lines must have been downloaded in PSICQuic object !
     */
    linkMitabLines() {
        for (const [, , ho_parameter_set] of this) {
            const lines_for_this_parameter = [];
            for (const [ho_a, ho_b] of ho_parameter_set) {
                const [id_a, id_b] = [ho_a.template, ho_b.template];
                lines_for_this_parameter.push(this.psi.getLines(id_a, id_b));
            }
            ho_parameter_set.mitabCouples = lines_for_this_parameter.map(e => e.map(d => new HoParameter_1.MitabParameter(d)));
        }
        this.mitab_loaded = true;
    }
    /**
     * Read MI Tab lines and register then in PSICQuic object.
     * When you have finished to read lines, call **.linkMitabLines()** !
     *
     * @returns Number of read couples
     */
    read(lines) {
        if (lines.length > 0) {
            if (Array.isArray(lines[0])) {
                this.psi.readLines([].concat(...lines));
            }
            else {
                this.psi.readLines(lines);
            }
        }
        return lines.length;
    }
    /**
     * Make a node visible.
     * Warning: This function is NOT at constant complexity.
     *
     * @param {string} node
     */
    showNode(node) {
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
    hideNode(node) {
        const node_value = Object.entries(this.ajdTree.getNode(node));
        for (const [, edge] of node_value) {
            edge.visible = false;
        }
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
    get visible_experimental_methods_in_graph() {
        const exp = new Set();
        for (const [, , parameter] of this.iterVisible()) {
            for (const [, , lines] of parameter.full_iterator(true)) {
                for (const line of lines) {
                    exp.add(line.interactionDetectionMethod);
                }
            }
        }
        return exp;
    }
    get experimental_methods_in_graph() {
        const exp = new Set();
        for (const [, , parameter] of this.iterVisible()) {
            for (const [, , lines] of parameter.full_iterator()) {
                for (const line of lines) {
                    exp.add(line.interactionDetectionMethod);
                }
            }
        }
        return exp;
    }
    get visible_taxonomy_ids_in_graph() {
        const exp = new Set();
        for (const [, , parameter] of this.iterVisible()) {
            for (const [, , lines] of parameter.full_iterator(true)) {
                for (const line of lines) {
                    const tax_ids = line.taxid;
                    exp.add(tax_ids[0]).add(tax_ids[1]);
                }
            }
        }
        return exp;
    }
    get taxonomy_ids_in_graph() {
        const exp = new Set();
        for (const [, , parameter] of this.iterVisible()) {
            for (const [, , lines] of parameter.full_iterator()) {
                for (const line of lines) {
                    const tax_ids = line.taxid;
                    exp.add(tax_ids[0]).add(tax_ids[1]);
                }
            }
        }
        return exp;
    }
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
    async buildEdgesReverse(url, bar /** Progress bar (any for not importing Progress in clients) */) {
        const inters = new PartnersMap_1.default({
            database_url: url,
        });
        // let time = 0;
        let atime = 0;
        let timer = Date.now();
        // On itère sur des tas d'ID récupérés depuis un jeu d'ID initial (contenu dans
        // this.hData), on récupère ce tas d'ID par paquets (d'où l'itérateur async)
        for await (const ids of inters.bulkGet(this.hData)) {
            if (bar)
                bar.tick(Object.keys(ids).length);
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
    buildEdges() {
        if (!this.baseTopology) {
            throw new Error('OmegaTopology has not been initialized with base topo');
        }
        let nbBase = 0;
        for (const [baseIdA, baseIdB,] of this.baseTopology.couples()) {
            const dataNewA = this.hData.getChildrenData(baseIdA);
            const dataNewB = this.hData.getChildrenData(baseIdB);
            this.addEdgeSet(dataNewA, dataNewB);
            nbBase++;
        }
        console.log(this.edgeNumber, "interactions unpacked from", nbBase);
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
     * @param [simPct=0] Similarity (default 0)
     * @param [idPct=0] Identity (default 0)
     * @param [cvPct=0] Coverage (default 0)
     * @param [eValue=1] E-value (default 1)
     * @param definitive Definitive trim (default false)
     * @param exp_det_methods Experimental detection methods required. Must be an array of **string**. Empty array if any type of detection is allowed.
     * @param taxons Valid taxons required. Must be an array of **string**. Empty array if any taxon is allowed.
     * @returns [number of deleted edges, total edges count]
     */
    trimEdges({ simPct = 0, idPct = 0, cvPct = 0, eValue = 1, exp_det_methods = [], taxons = [], definitive = false } = {}) {
        let nDel = 0;
        let nTot = 0;
        for (const [x, y, HoParameterSetObj] of this) {
            nTot++;
            HoParameterSetObj.trim({
                simPct,
                idPct,
                cvPct,
                eValue,
                exp_methods: exp_det_methods.length ? new Set(exp_det_methods) : undefined,
                taxons: taxons.length ? new Set(taxons) : undefined,
                definitive
            });
            if (HoParameterSetObj.isEmpty) {
                nDel++;
                if (definitive) {
                    this.ajdTree.remove(x, y);
                }
            }
        }
        return [nDel, nTot];
    }
    toString() {
        return JSON.stringify(Array.from(this.iterVisible()));
    }
    /**
     * Add a couple of HomologChildren to internal tree.
     *
     * @param {HomologChildren} dataNewA
     * @param {HomologChildren} dataNewB
     */
    addEdgeSet(dataNewA, dataNewB) {
        const newAelements = Object.keys(dataNewA).map(e => [md5_1.default(e), e, dataNewA[e]]);
        const newBelements = Object.keys(dataNewB).map(e => [md5_1.default(e), e, dataNewB[e]]);
        for (const [hA, idA, dA] of newAelements) {
            for (const [hB, idB, dB] of newBelements) {
                let dX, dY;
                if (hA < hB) {
                    dX = dA;
                    dY = dB;
                }
                else {
                    dX = dB;
                    dY = dA;
                }
                const HoParameterSetObj = this.ajdTree.getOrSet(idA, idB, new HoParameter_1.HoParameterSet);
                HoParameterSetObj.add(dX, dY);
            }
        }
    }
}
exports.default = OmegaTopology;
