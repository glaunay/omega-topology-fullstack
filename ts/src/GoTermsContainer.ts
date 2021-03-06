/**
 * Store GO Terms and protein accession numbers related to them.
 */
export default class GoTermsContainer {
    protected data = new Map<string, [string, Set<string>]>();

    /**
     * Add GOTerm associated to proteins.
     * 
     * @param prots 
     */
    add(prots: ProtGOTerms) {
        for (const [prot_id, terms] of Object.entries(prots)) {
            for (let [id, term] of Object.entries(terms)) {
                if (!id.startsWith('GO:')) {
                    id = "GO:" + id;
                }

                if (!this.data.has(id)) {
                    this.data.set(id, [term.term, new Set]);
                }
    
                this.data.get(id)[1].add(prot_id);
            }
        }
    }

    /**
     * For a single GOTerm ID, return a list of proteins that matching this term
     * @param term Term ID 
     */    
    search(term: string) : string[] {
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
    bulkSearch(terms: string[]) : string[] {
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
    query(query: string | RegExp) : string[] {
        const matching = new Set<string>();

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
    searchByProt(prot_id: string) : string[] {
        const terms = new Set<string>();

        for (const term of this.data) {
            if (term[1][1].has(prot_id)) {
                terms.add(term[0]);
            }
        }

        return [...terms];
    }

    /**
     * Get the related name for a Go Term ID.
     * 
     * @param term_id 
     */
    getNameOfTerm(term_id: string) {
        if (!term_id.startsWith('GO:')) {
            term_id = "GO:" + term_id;
        }

        if (this.data.has(term_id)) {
            return this.data.get(term_id)[0];
        }

        return undefined;
    }

    /** See instance.values() */
    *[Symbol.iterator]() : IterableIterator<[string, Set<string>]> {
        yield* this.values();
    }

    /**
     * Iterate through the container entries.
     * Keys: GO IDs; Values: Tuple<term_name, Set<Protein Accession Number>>
     */
    *entries() {
        yield* this.data.entries();
    }

    /**
     * Iterate through the values.
     * Values: Tuple<GO Id, Set<Protein Accession Number>>
     */
    *values() : IterableIterator<[string, Set<string>]> {
        for (const [id, v] of this.data) {
            yield [id, v[1]];
        }
    }

    /**
     * Iterate through the keys.
     * Keys: GO IDs
     */
    *keys() {
        yield* this.data.keys();
    }

    /** Number of GO IDs stored in this container */
    get length() {
        return this.data.size;
    }

    /** Empty the container */
    clear() {
        this.data.clear();
    }
}

export interface ProtGOTerms {
    [proteinId: string]: GOTerms;
}

export interface GOTerms {
    [GoId: string]: GOTerm;
}

export interface GOTerm {
    term: string;
    source: string;
}