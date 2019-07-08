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
     * @param term
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
    getNameOfTerm(term_id: string): string;
    [Symbol.iterator](): IterableIterator<[string, Set<string>]>;
    keys(): IterableIterator<string>;
    readonly length: number;
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
