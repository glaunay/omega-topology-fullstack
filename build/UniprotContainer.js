"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class UniprotContainer {
    constructor(url) {
        this.url = url;
        this.tiny = new Map();
        this.full = new Map();
    }
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
    async bulkTiny(...prot_ids) {
        // Garde uniquement les protéines qui n'existent pas dans tiny
        prot_ids = prot_ids.filter(p => !this.tiny.has(p));
        const req = await fetch(this.url + "/short", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: prot_ids })
        }).then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)));
        for (const p of req) {
            this.tiny.set(p.accession, p);
        }
    }
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
    getTiny(id) {
        return this.tiny.get(id);
    }
    clear() {
        this.tiny.clear();
        this.full.clear();
    }
    set uniprot_url(v) {
        this.url = v;
    }
    get uniprot_url() {
        return this.url;
    }
}
exports.UniprotContainer = UniprotContainer;
exports.default = UniprotContainer;
