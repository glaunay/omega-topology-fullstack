"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @deprecated Unused.
 * No utility, PSICQuic object is ok.
 *
 * To follow MI Tab download, FrontTopology has been implemented into the client side of the project.
 */
class MitabTopology {
    constructor(psiq, url, couple_url) {
        this.psiq = psiq;
        this.url = url;
        this.couple_url = couple_url;
        this.empty_nodes = new Set;
        this._remaining = 0;
        this._dls = 0;
        this.cache = {};
    }
    /**
     * Get keys of all the records.
     *
     * @yields {string}
     */
    *keys() {
        yield* this.psiq.records.keys();
    }
    /**
     * Iterate through all the existing couples in the records.
     *
     * @yields {[string, string, PSQData[]]}
     */
    *[Symbol.iterator]() {
        yield* this.psiq.couples();
    }
    /**
     * Get length of the records.
     */
    get length() {
        return this.psiq.length;
    }
    /**
     * Get all the corresponding lines from an ID
     * @param {string} k1
     */
    get(k1) {
        return this.psiq.get(k1);
    }
    /**
     * Get all the corresponding lines from a couple of IDs
     * @param {string} k1
     * @param {string} k2
     */
    couple(k1, k2) {
        return this.psiq.getLines(k1, k2);
    }
    get [Symbol.toStringTag]() {
        return "MitabTopology";
    }
    /**
     * Returns the PSICQuic object held by the Mitab object
     */
    get psi() {
        return this.psiq;
    }
    async fetch(k1) {
        if (this.empty_nodes.has(k1)) {
            return undefined;
        }
        const node = this.get(k1);
        if (Object.keys(node).length === 0) {
            // Le noeud n'existe pas. On fetch !
            const lines = await this.getMitabLines(k1);
            this.psiq.readLines(lines);
        }
        else {
            // Récupérer les données mitab existantes pour K1
            return node;
        }
    }
    async fetchCouple(k1, k2) {
        const node = await this.fetch(k1);
        if (Object.keys(node).length === 0) {
            // Ce noeud est vide, il faut le marquer
            this.empty_nodes.add(k1);
        }
        // On recherche si le couple existe
        if (k2 in node) {
            return node[k2];
        }
        // Sinon, l'association n'existe pas
        return undefined;
    }
    async getMitabLines(k1, k2) {
        // Get lines for ONE interactors (all corresponding lines) if k2 = undefined
        // else: Get lines holding k1 & k2
        const do_request = async () => {
            // On les récupère
            const partners = await fetch(this.url, {
                method: "POST",
                body: JSON.stringify({ keys: [k1] }),
                headers: { "Content-Type": "application/json" }
            }).then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)));
            const result = partners.request[0];
            return result;
        };
        const ids = await do_request();
        if (Object.keys(ids).length > 0) {
            if (!k2) {
                // Renvoie toutes les lignes associées à k1
                return [].concat(...Object.values(ids.data));
            }
            if (k2 in ids.data) {
                return ids.data[k2];
            }
        }
        else {
            return [];
        }
    }
    async getTemplatePairs(pairs) {
        this._remaining = pairs.length;
        await this.bulkForEach(pairs, lines => {
            this._remaining -= lines.length;
            this._dls += lines.length;
            return lines;
        });
        this._dls = pairs.length;
        this._remaining = 0;
    }
    get remaining() {
        return this._remaining;
    }
    get downloaded() {
        return this._dls;
    }
    async bulkForEach(ids, cb, packet_len = 128) {
        let cache = [];
        const do_request = async () => {
            // On les récupère
            const partners = await fetch(this.couple_url, {
                method: "POST",
                body: JSON.stringify({ keys: cache }),
                headers: { "Content-Type": "application/json" }
            }).then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)));
            const result_array = partners.request;
            const return_obj = [];
            for (const id_map in result_array) {
                const bothids = id_map.split('~', 2);
                return_obj.push([bothids, result_array[id_map]]);
            }
            // Add every line in psq
            const final_psq = [];
            for (const [, lines] of return_obj) {
                final_psq.push(this.psiq.readLines(lines));
            }
            return final_psq;
        };
        const promises = [];
        const dl_lines = [];
        // Parcours de l'itérable
        for (const id of ids) {
            if (cache.length >= packet_len) {
                // Le cache est plein, on flush avec do_request
                // On les yield pour les passer à l'itérateur
                promises.push(do_request().then(cb));
                // On vide le cache
                cache = [];
            }
            if (this.psiq.hasCouple(id[0], id[1])) {
                dl_lines.push(this.psiq.getLines(id[0], id[1]));
            }
            else {
                // On pousse l'ID actuel dans le cache
                cache.push(id);
            }
        }
        // Si il y avait des lignes déjà téléchargées
        if (dl_lines.length) {
            promises.push(Promise.resolve(cb(dl_lines)));
        }
        // Si il a encore des éléments en cache (si l'itérateur n'était pas vide), 
        // alors on flush une dernière fois
        if (cache.length) {
            promises.push(do_request().then(cb));
        }
        return promises;
    }
}
exports.default = MitabTopology;
