"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Permet de lire un arbre d'homologie (tel uniprot_R6_homology.json) au format JSON.
 */
class HomologTree {
    /**
     * @param filename Le fichier ne doit être précisé SEULEMENT si l'environnement est node.js
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
                    resolve(void (this.data = JSON.parse(data)));
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
     * Serialize the HomologyTree object
     */
    serialize() {
        return JSON.stringify({ data: this.data, version: 1 });
    }
    /**
     * Get the number of homologs of R6 proteins
     *
     * @readonly
     * @memberof HomologTree
     */
    get length() {
        return Object.keys(this.data).length;
    }
    /**
     * Instanciate a new HomologyTree object from a serialized string
     * @param serialized
     */
    static from(serialized) {
        const newobj = new HomologTree("");
        const homolog_data = JSON.parse(serialized);
        const supported = [1];
        if (!supported.includes(homolog_data.version)) {
            throw new Error("Unsupported HomologTree version: " + homolog_data.version);
        }
        newobj.data = homolog_data.data;
        return newobj;
    }
    *[Symbol.iterator]() {
        yield* Object.keys(this.data);
    }
}
exports.default = HomologTree;
