/**
 * Store GO Terms and protein accession numbers related to them.
 */
export default class GoTermsContainer {
    protected data: Map<string, [string, Set<string>]>;
    /**
     * Add GOTerm associated to proteins.
     *
     * @param prots
     */
    add(prots: ProtGOTerms): void;
    /**
     * For a single GOTerm ID, return a list of proteins that matching this term
     * @param term Term ID
     */
    search(term: string): string[];
    /**
     * Returns all the proteins IDs that match one of the terms
     * @param terms
     */
    bulkSearch(terms: string[]): string[];
    /**
     * Return a list of GOTerm matching the query
     *
     * @param query
     */
    query(query: string | RegExp): string[];
    /**
     * For a protein ID, return a list of available GOTerm.
     *
     * This container is NOT designed to get those type of information,
     * use the standard Uniprot container for better results !
     *
     * @param prot_id
     */
    searchByProt(prot_id: string): string[];
    /**
     * Get the related name for a Go Term ID.
     *
     * @param term_id
     */
    getNameOfTerm(term_id: string): string;
    /** See instance.values() */
    [Symbol.iterator](): IterableIterator<[string, Set<string>]>;
    /**
     * Iterate through the container entries.
     * Keys: GO IDs; Values: Tuple<term_name, Set<Protein Accession Number>>
     */
    entries(): IterableIterator<[string, [string, Set<string>]]>;
    /**
     * Iterate through the values.
     * Values: Tuple<GO Id, Set<Protein Accession Number>>
     */
    values(): IterableIterator<[string, Set<string>]>;
    /**
     * Iterate through the keys.
     * Keys: GO IDs
     */
    keys(): IterableIterator<string>;
    /** Number of GO IDs stored in this container */
    readonly length: number;
    /** Empty the container */
    clear(): void;
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
