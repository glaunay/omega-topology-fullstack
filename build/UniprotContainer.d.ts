/**
 * Store UniProt data fetched from omega-topology-uniprot micro-service
 *
 * This container has a built-in cache system.
 */
export declare class UniprotContainer {
    protected url: string;
    /** Storage for tiny protein objects */
    protected tiny: Map<string, TinyProtein>;
    /** Storage for full protein objets */
    protected full: Map<string, UniprotProtein>;
    /**
     * Construct a new UniprotContainer object
     *
     * @param url Micro-service URL
     */
    constructor(url: string);
    /**
     * Get the full protein object for one accession number
     *
     * @param prot_id Protein accession number
     */
    getFullProtein(prot_id: string): Promise<UniprotProtein>;
    /**
     * Download full protein objects
     */
    protected downloadFullProteins(...prot_ids: string[]): Promise<void>;
    /**
     * Download tiny protein objects
     */
    bulkTiny(...prot_ids: string[]): Promise<void>;
    searchByAnnotation(query: string | RegExp, match_type?: "all"): string[];
    searchByAnnotation(query: string | RegExp, match_type?: "classified"): ProteinMatches;
    protected searchByAnnotationAll(query: string | RegExp): string[];
    protected searchByAnnotationCategory(query: string | RegExp): ProteinMatches;
    /**
     * Get a tiny protein object. Does not fetch from Internet when the protein isn't present !
     */
    getTiny(id: string): TinyProtein;
    /**
     * Get tiny protein objects. If not present, fetch them.
     */
    getOrFetchTiny(...ids: string[]): Promise<TinyProtein[]>;
    /**
     * Clear container data.
     */
    clear(): void;
    /**
    * Micro-service omega-topology-uniprot URL
    */
    uniprot_url: string;
}
export default UniprotContainer;
export interface ProteinMatches {
    accession: string[];
    keywords: string[];
    gene_names: string[];
    protein_names: string[];
}
export interface TinyProtein {
    accession: string;
    id: string;
    protein_names: string[];
    gene_names: string[];
    created_at: string;
    modified_at: string;
    keywords: string[];
    organisms: string[];
}
export interface UniprotProtein {
    accession: string;
    id: string;
    proteinExistence: string;
    info: {
        type: string;
        created: string;
        modified: string;
        version: number;
    };
    organism: {
        taxonomy: number;
        names: {
            type: string;
            value: string;
        }[];
        lineage: string[];
    };
    protein: {
        recommendedName?: UniprotProteinNameObject;
        alternativeName?: UniprotProteinNameObject[];
        submittedName?: UniprotProteinNameObject[];
    };
    gene: {
        name: UniprotValueEvidenceObject;
        olnNames?: UniprotValueEvidenceObject[];
    }[];
    comments: {
        type: string;
        text?: {
            value: string;
            evidences?: UniprotEvidences;
        }[];
        reaction?: {
            name: string;
            dbReferences: UniprotDbReference[];
            ecNumber: string;
        };
        temperatureDependence: UniprotValueObject[];
    }[];
    features: {
        type: string;
        category: string;
        ftId?: string;
        description: string;
        begin: string;
        end: string;
        evidences?: UniprotEvidences;
    }[];
    dbReferences: UniprotDbReference[];
    keywords: UniprotValueObject[];
    references: {
        citation: {
            type: string;
            publicationDate: string;
            authors: string[];
            title?: string;
            publication: {
                submissionDatabase?: string;
                journalName?: string;
            };
            location?: {
                volume: string;
                firstPage: string;
                lastPage: string;
            };
            dbReferences?: UniprotDbReference[];
        };
        source: {
            strain: UniprotValueObject[];
        };
        scope: string[];
    }[];
    sequence: [number, number, number, string, string] | {
        length: number;
        mass: number;
        modified: string;
        sequence: string;
        version: number;
    };
}
interface UniprotValueObject {
    value: string;
}
interface UniprotValueEvidenceObject extends UniprotValueObject {
    evidences?: UniprotEvidences;
}
interface UniprotProteinNameObject {
    fullName: UniprotValueObject;
    ecNumber?: UniprotValueEvidenceObject[];
}
interface UniprotDbReference {
    type: string;
    id: string;
    properties?: {
        "molecule type"?: string;
        "protein sequence ID"?: string;
        "entry name"?: string;
        term?: string;
        source?: string;
        "match status"?: string;
    };
}
declare type UniprotEvidences = {
    code: string;
}[];
