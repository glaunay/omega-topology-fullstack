import { ArtefactalEdgeData } from "./OmegaTopology";

export interface HomologInfo {
    [homologId: string]: {
        [r6ProtId: string]: string[][];
    }
}

export interface HomologChildren {
    [homologKey: string]: string[];
}

/**
 * Permet de lire un arbre d'homologie (tel Homology_R6.json) au format JSON.
 *
 */
export default class HomologTree {
    public data: HomologInfo = {};
    protected init_promise: Promise<void> | undefined;

    /**
     * @param filename Le fichier ne doit être précisé SEULEMENT si l'environnement est node.js
     */
    constructor(filename: string) {
        if (!filename) {
            this.init_promise = Promise.resolve();
        }
        else {
            // @ts-ignore CECI ne doit QUE être atteint par Node
            const fs = require("fs");

            this.init_promise = new Promise((resolve, reject) => {
                fs.readFile(filename, { encoding: 'utf-8' }, (err, data) => {
                    if (err) { reject(err); return; }
    
                    // Parse le JSON, l'enregistre dans this.data 
                    // et résoud la promesse sans aucune donnée
                    resolve(void (this.data = JSON.parse(data)));
                })
            });
        }
    }

    /**
     * Promise symbolizing instance state
     */
    init() {
        return this.init_promise;
    }

    addArtefactal(edge: ArtefactalEdgeData) : [HomologChildren, HomologChildren] {
        return [
            this.addPartialArtefactual(edge),
            this.addPartialArtefactual(edge, 'target')
        ];
    }

    addPartialArtefactual(edge: ArtefactalEdgeData, source = "source") {
        const edge1 = edge[source], edge2 = edge[source === 'source' ? 'target' : 'source'];
        if (!(edge1 in this.data)) {
            this.data[edge1] = {};
        }

        const l = String(edge.length);
        const l_P_1 = String(Number(l) + 1);

        if (!(edge2 in this.data[edge1])) {
            this.data[edge1][edge2] = [[l, "1", l_P_1, l, "1", l_P_1, l, l, "1e-150"]];
        }

        return {
            [edge2]: [edge1, ...this.data[edge1][edge2][0]]
        };
    }

    getChildrenData(psqId: string) : HomologChildren {
        if (!(psqId in this.data)) {
            return {};
        }

        const result: HomologChildren = {};

        for (const homologKey in this.data[psqId]) {
            result[homologKey] = [psqId];
            const hVector = this.data[psqId][homologKey][0]; // Tableau de résultat blast (ne prend que le premier)

            for (const e of hVector) {
                result[homologKey].push(e);
            }
        }

        return result;
    }

    serialize() : string {
        return JSON.stringify({ data: this.data, version: 1 });
    }

    get length() {
        return Object.keys(this.data).length;
    }

    static from(serialized: string) : HomologTree {
        const newobj = new HomologTree("");
        const homolog_data = JSON.parse(serialized);

        const supported = [1];
        if (!supported.includes(homolog_data.version)) {
            throw new Error("Unsupported HomologTree version: " + homolog_data.version);
        }

        newobj.data = homolog_data.data;
        return newobj;
    }

    public *[Symbol.iterator]() {
        yield* Object.keys(this.data);
    }
}