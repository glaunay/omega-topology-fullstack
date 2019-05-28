"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const HomologyTree_1 = __importDefault(require("./HomologyTree"));
const graphlib_1 = require("graphlib");
const HoParameter_1 = require("./HoParameter");
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
    constructor(homologyTree, mitabObj) {
        /**
         * Represents all the edges / nodes held by OmegaTopology.
         */
        this.ajdTree = new MDTree_1.MDTree(false);
        this.init_promise = Promise.resolve();
        this.hData = homologyTree;
        this.baseTopology = mitabObj ? mitabObj : new PSICQuic_1.default;
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
     * Prune and renew the graph.
     *
     * @param {number} [max_distance=5] If you want all the connex composants, use -1
     * @param {...string[]} seeds All the seeds you want to search
     * @returns {Graph}
     */
    prune(max_distance = 5, ...seeds) {
        console.log(seeds);
        // Set all nodes visible
        for (const [, , datum] of this) {
            datum.visible = true;
        }
        this.G = this.makeGraph();
        let t = Date.now();
        console.log("Graph has", this.G.nodeCount(), "nodes and", this.G.edgeCount(), "edges");
        const _seeds = new Set(seeds);
        const seed_set = [];
        const other_set = [];
        for (const n of this.G.nodes()) {
            // this.showNode(n);
            if (_seeds.has(n)) {
                this.G.setNode(n, { group: 1 });
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
                    let tampon = new Set;
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
            for (const seed of seed_set) {
                const paths_f_seed = getAvailableNeighboors(seed, max_distance);
                for (const node of other_set) {
                    if (!paths_f_seed.has(node)) {
                        this.G.removeNode(node);
                        this.hideNode(node);
                    }
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
            const templates = e.templates;
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
     * @deprecated
     */
    olduniqueTemplatePairs() {
        const set_pairs = {};
        for (const [pair1, pair2] of this.templatePairs()) {
            const [p1, p2] = [pair1.data[0], pair2.data[0]];
            const master_id = p1 > p2 ? p1 : p2;
            const lower_id = p1 > p2 ? p2 : p1;
            if (master_id in set_pairs) {
                set_pairs[master_id].add(lower_id);
            }
            else {
                set_pairs[master_id] = new Set([lower_id]);
            }
        }
        // Unification
        const unique_pairs = [];
        for (const id in set_pairs) {
            unique_pairs.push(...Array.from(set_pairs[id]).map(e => [id, e]));
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
     * Get all the visible nodes in OmegaTopology object.
     */
    get nodes() {
        const nodes = {};
        for (const [n1, n2, e] of this.iterVisible()) {
            const templates = e.templates;
            nodes[n1] = nodes[n1] ? nodes[n1] : new Set;
            for (const element of templates[0]) {
                nodes[n1].add(element);
            }
            nodes[n2] = nodes[n2] ? nodes[n2] : new Set;
            for (const element of templates[1]) {
                nodes[n2].add(element);
            }
        }
        return nodes;
    }
    /**
     * Reference to the PSICQuic object used to add/delete Mitab lines.
     */
    get psi() {
        return this.baseTopology;
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
     * Like trimEdges(), but remove the nodes definitively from internal tree.
     * (Useful for free RAM and speed up the prune process)
     *
     * @param {number} [simPic=0]
     * @param {number} [idPct=0]
     * @param {number} [cvPct=0]
     * @returns {[number, number]} [number of deleted edges, total edges count]
     */
    definitiveTrim(simPic = 0, idPct = 0, cvPct = 0) {
        let nDel = 0;
        let nTot = 0;
        for (const [x, y, HoParameterSetObj] of this) {
            nTot++;
            HoParameterSetObj.trim(simPic, idPct, cvPct, undefined, true);
            if (HoParameterSetObj.isEmpty) {
                nDel++;
                this.ajdTree.remove(x, y);
            }
        }
        return [nDel, nTot];
    }
    /**
     * Trim edges that don't meet the threshold.
     * Trimmed edges won't be visible using iterVisible() and won't be
     * present during the next's prune() calls.
     *
     * This trim is not definitive, you can use to hide edges then make then visible again with a further call.
     *
     * @param {number} [simPic=0] Similarity threshold
     * @param {number} [idPct=0] Identity threshold
     * @param {number} [cvPct=0] Coverage threshold
     * @returns {[number, number]} [number of deleted edges, total edges count]
     */
    trimEdges(simPic = 0, idPct = 0, cvPct = 0) {
        let nDel = 0;
        let nTot = 0;
        for (const [, , HoParameterSetObj] of this) {
            nTot++;
            HoParameterSetObj.trim(simPic, idPct, cvPct);
            if (HoParameterSetObj.isEmpty) {
                nDel++;
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
