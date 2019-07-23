export class UniprotContainer {
    protected tiny = new Map<string, TinyProtein>();
    protected full = new Map<string, UniprotProtein>();

    constructor(
        protected url: string
    ) { }

    async getFullProtein(prot_id: string) {
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

    protected async downloadFullProteins(...prot_ids: string[]) {
        const req: UniprotProtein[] = await fetch(this.url + "/long", {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ ids: prot_ids })
        }).then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)));

        for (const p of req) {
            this.full.set(p.accession, p);
        }
    }

    async bulkTiny(...prot_ids: string[]) {
        // Garde uniquement les protéines qui n'existent pas dans tiny
        prot_ids = prot_ids.filter(p => !this.tiny.has(p));

        const req: TinyProtein[] = await fetch(this.url + "/short", {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ ids: prot_ids })
        }).then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)));

        for (const p of req) {
            this.tiny.set(p.accession, p);
        }
    }

    searchByAnnotation(query: string | RegExp) : string[] {
        const matching = new Set<string>();

        for (const [prot_id, prot] of this.tiny) {
            if (
                prot.protein_names.some(e => !!e.match(query)) || 
                prot.gene_names.some(e => !!e.match(query)) ||
                prot.keywords.some(e => !!e.match(query))
            ) {
                matching.add(prot_id);
            }
        }

        return [...matching];
    }

    getTiny(id: string) {
        return this.tiny.get(id);
    }
    
    clear() {
        this.tiny.clear();
        this.full.clear();
    }
}

export default UniprotContainer;

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
        names: { type: string, value: string }[];
        lineage: string[];
    };
    protein: {
        recommendedName?: UniprotProteinNameObject;
        alternativeName?: UniprotProteinNameObject[];
        submittedName?: UniprotProteinNameObject[];
    };
    gene: {
        name: UniprotValueEvidenceObject;
        olnNames: UniprotValueEvidenceObject[];
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
            publication: { submissionDatabase?: string, journalName?: string };
            location?: {
                volume: string;
                firstPage: string;
                lastPage: string;
            },
            dbReferences?: UniprotDbReference[];
        },
        source: {
            strain: UniprotValueObject[];
        },
        scope: string[];
    }[];
    sequence: [number, number, number, string, string] | {
        length: number,
        mass: number,
        modified: string,
        sequence: string,
        version: number
    };
}

interface UniprotValueObject { value: string }
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
    }
}
type UniprotEvidences = { code: string }[];