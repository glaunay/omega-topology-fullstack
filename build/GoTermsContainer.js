"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class GoTermsContainer {
    constructor() {
        this.data = new Map();
    }
    /**
     * Add GOTerm associated to proteins.
     *
     * @param prots
     */
    add(prots) {
        for (const [prot_id, terms] of Object.entries(prots)) {
            for (const [id, term] of Object.entries(terms)) {
                if (!this.data.has(id)) {
                    this.data.set(id, [term.term, new Set]);
                }
                this.data.get(id)[1].add(prot_id);
            }
        }
    }
    /**
     * For a single GOTerm ID, return a list of proteins that matching this term
     * @param term
     */
    search(term) {
        if (!term.startsWith('GO:')) {
            term = "GO:" + term;
        }
        if (this.data.has(term)) {
            return [...this.data.get(term)[1]];
        }
        return [];
    }
    /**
     * Returns all the proteins IDs that match one of the terms
     * @param terms
     */
    bulkSearch(terms) {
        // For each term, search the matching proteins,
        // then flatten the array of array of string
        const flat = [].concat(...terms.map(t => this.search(t)));
        // Make strings unique and returns it as an array
        return [...new Set(flat)];
    }
    /**
     * Return a list of GOTerm matching the query
     *
     * @param query
     */
    query(query) {
        const matching = new Set();
        for (const term of this.data) {
            if (term[1][0].match(query)) {
                matching.add(term[0]);
            }
        }
        return [...matching];
    }
    /**
     * For a protein ID, return a list of available GOTerm.
     *
     * This container is NOT designed to get those type of information,
     * use the standard Uniprot container for better results !
     *
     * @param prot_id
     */
    searchByProt(prot_id) {
        const terms = new Set();
        for (const term of this.data) {
            if (term[1][1].has(prot_id)) {
                terms.add(term[0]);
            }
        }
        return [...terms];
    }
    getNameOfTerm(term_id) {
        if (this.data.has(term_id)) {
            return this.data.get(term_id)[0];
        }
        return undefined;
    }
    *[Symbol.iterator]() {
        yield* this.values();
    }
    *entries() {
        yield* this.data.entries();
    }
    *values() {
        for (const [id, v] of this.data) {
            yield [id, v[1]];
        }
    }
    *keys() {
        yield* this.data.keys();
    }
    get length() {
        return this.data.size;
    }
    clear() {
        this.data.clear();
    }
}
exports.default = GoTermsContainer;
