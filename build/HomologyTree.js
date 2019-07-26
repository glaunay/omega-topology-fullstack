"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Allow to read a homology tree (like uniprot_R6_homology.json) formatted in JSON.
 */
class HomologyTree {
    /**
     * HomologyTree constructor.
     *
     * @nodeonly If you specify a filename
     * @param filename File should be specifiy **ONLY** if you are in Node.js environnement
     */
    constructor(filename) {
        this.data = {};
        if (!filename) {
            this.init_promise = Promise.resolve();
        }
        else {
            // @ts-ignore CECI ne doit QUE être atteint par Node
            const fs = require("fs");
            this.init_promise = new Promise((resolve, reject) => {
                fs.readFile(filename, { encoding: 'utf-8' }, (err, data) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    // Parse le JSON, l'enregistre dans this.data 
                    // et résoud la promesse sans aucune donnée
                    const filedata = JSON.parse(data);
                    if ("taxid" in filedata) {
                        this.data = filedata.data;
                        this.internal_tax_id = typeof filedata.taxid === 'string' ? filedata.taxid : String(filedata.taxid);
                    }
                    else {
                        this.data = filedata;
                    }
                    resolve();
                });
            });
        }
    }
    /**
     * Promise symbolizing instance state
     */
    init() {
        return this.init_promise;
    }
    /**
     * Add a unproved edge with fake data.
     * @param edge
     */
    addArtefactal(edge) {
        return [
            this.addPartialArtefactual(edge),
            this.addPartialArtefactual(edge, 'target')
        ];
    }
    addPartialArtefactual(edge, source = "source") {
        const edge1 = edge[source], edge2 = edge[source === 'source' ? 'target' : 'source'];
        if (!(edge1 in this.data)) {
            this.data[edge1] = {};
        }
        const l = "100";
        const l_P_1 = String(Number(l) + 1);
        if (!(edge2 in this.data[edge1])) {
            this.data[edge1][edge2] = [[l, "1", l_P_1, l, "1", l_P_1, l, l, "1e-150"]];
        }
        return {
            [edge2]: [edge1, ...this.data[edge1][edge2][0]]
        };
    }
    /**
     * Get all the BLAST results for one protein identifier, ordered by homolog in R6 accession number
     * @param psqId
     */
    getChildrenData(psqId) {
        if (!(psqId in this.data)) {
            return {};
        }
        const result = {};
        for (const homologKey in this.data[psqId]) {
            result[homologKey] = [psqId];
            const hVector = this.data[psqId][homologKey][0]; // Tableau de résultat blast (ne prend que le premier)
            result[homologKey].push(...hVector);
        }
        return result;
    }
    /**
     * Current taxid of the loaded homology tree specie.
     * Need a homology file that includes a taxid key.
     *
     * @readonly
     */
    get taxid() {
        return this.internal_tax_id;
    }
    /**
     * Serialize the HomologyTree object
     */
    serialize() {
        return JSON.stringify({ data: this.data, taxid: this.taxid, version: 2 });
    }
    /**
     * Number of homologs of R6 proteins
     *
     * @readonly
     */
    get length() {
        return Object.keys(this.data).length;
    }
    /**
     * Instanciate a new HomologyTree object from a serialized string
     * @param serialized
     */
    static from(serialized) {
        const newobj = new HomologyTree("");
        const homolog_data = JSON.parse(serialized);
        const supported = [2];
        if (!supported.includes(homolog_data.version)) {
            throw new Error("Unsupported HomologTree version: " + homolog_data.version);
        }
        newobj.data = homolog_data.data;
        newobj.internal_tax_id = homolog_data.taxid;
        return newobj;
    }
    *[Symbol.iterator]() {
        yield* Object.keys(this.data);
    }
}
exports.default = HomologyTree;
