"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Store UniProt data fetched from omega-topology-uniprot micro-service
 *
 * This container has a built-in cache system.
 */
class UniprotContainer {
    /**
     * Construct a new UniprotContainer object
     *
     * @param url Micro-service URL
     */
    constructor(url) {
        this.url = url;
        /** Storage for tiny protein objects */
        this.tiny = new Map();
        /** Storage for full protein objets */
        this.full = new Map();
    }
    /**
     * Get the full protein object for one accession number
     *
     * @param prot_id Protein accession number
     */
    async getFullProtein(prot_id) {
        if (this.full.has(prot_id)) {
            return this.full.get(prot_id);
        }
        // download full protein
        await this.downloadFullProteins(prot_id);
        if (this.full.has(prot_id)) {
            return this.full.get(prot_id);
        }
        return undefined;
    }
    /**
     * Download full protein objects
     */
    async downloadFullProteins(...prot_ids) {
        const req = await fetch(this.url + "/long", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: prot_ids })
        }).then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)));
        for (const p of req) {
            this.full.set(p.accession, p);
        }
    }
    /**
     * Download tiny protein objects
     */
    async bulkTiny(...prot_ids) {
        // Garde uniquement les protéines qui n'existent pas dans tiny
        prot_ids = prot_ids.filter(p => !this.tiny.has(p));
        if (prot_ids.length) {
            const req = await fetch(this.url + "/short", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: prot_ids })
            }).then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)));
            for (const p of req) {
                this.tiny.set(p.accession, p);
            }
        }
    }
    /**
     * Search the proteins using gene names, protein name and keywords given by UniProt.
     *
     * This method only search in the tiny container !
     *
     * @param query String or Regex
     *
     * @returns Array of protein IDs matching the query
     */
    searchByAnnotation(query) {
        const matching = new Set();
        for (const [prot_id, prot] of this.tiny) {
            if (prot.protein_names.some(e => !!e.match(query)) ||
                prot.gene_names.some(e => !!e.match(query)) ||
                prot.keywords.some(e => !!e.match(query))) {
                matching.add(prot_id);
            }
        }
        return [...matching];
    }
    /**
     * Get a tiny protein object. Does not fetch from Internet when the protein isn't present !
     */
    getTiny(id) {
        return this.tiny.get(id);
    }
    /**
     * Get tiny protein objects. If not present, fetch them.
     */
    async getOrFetchTiny(...ids) {
        const ids_to_fetch = ids.filter(e => !this.tiny.has(e));
        if (ids_to_fetch.length) {
            await this.bulkTiny(...ids_to_fetch);
        }
        return ids.map(e => this.tiny.get(e)).filter(e => e);
    }
    /**
     * Clear container data.
     */
    clear() {
        this.tiny.clear();
        this.full.clear();
    }
    set uniprot_url(v) {
        this.url = v;
    }
    /**
     * Micro-service omega-topology-uniprot URL
     */
    get uniprot_url() {
        return this.url;
    }
}
exports.UniprotContainer = UniprotContainer;
exports.default = UniprotContainer;
