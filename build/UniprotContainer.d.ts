export default class UniprotContainer {
    protected url: string;
    protected tiny: Map<string, TinyProtein>;
    protected full: Map<string, UniprotProtein>;
    constructor(url: string);
    getFullProtein(prot_id: string): Promise<UniprotProtein>;
    protected downloadFullProteins(...prot_ids: string[]): Promise<void>;
    bulkTiny(...prot_ids: string[]): Promise<void>;
    searchByAnnotation(query: string | RegExp): string[];
    getTiny(id: string): TinyProtein;
    clear(): void;
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
        recommandedName: UniprotProteinNameObject;
        alternativeName: UniprotProteinNameObject[];
        submittedName: UniprotProteinNameObject[];
    };
    gene: {
        name: UniprotValueEvidenceObject;
        oldNames: UniprotValueEvidenceObject[];
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
    sequence: [number, number, number, string, string];
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
export {};
