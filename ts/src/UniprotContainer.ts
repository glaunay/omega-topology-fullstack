/**
 * Store UniProt data fetched from omega-topology-uniprot micro-service
 * 
 * This container has a built-in cache system.
 */
export class UniprotContainer {
    /** Storage for tiny protein objects */
    protected tiny = new Map<string, TinyProtein>();
    /** Storage for full protein objets */
    protected full = new Map<string, UniprotProtein>();

    /**
     * Construct a new UniprotContainer object
     * 
     * @param url Micro-service URL
     */
    constructor(
        protected url: string
    ) { }

    /**
     * Get the full protein object for one accession number
     * 
     * @param prot_id Protein accession number
     */
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

    /**
     * Download full protein objects
     */
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

    /**
     * Download tiny protein objects
     */
    async bulkTiny(...prot_ids: string[]) {
        // Garde uniquement les protéines qui n'existent pas dans tiny
        prot_ids = prot_ids.filter(p => !this.tiny.has(p));

        if (prot_ids.length) {
            const req: TinyProtein[] = await fetch(this.url + "/short", {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
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

    /**
     * Get a tiny protein object. Does not fetch from Internet when the protein isn't present !
     */
    getTiny(id: string) {
        return this.tiny.get(id);
    }

    /**
     * Get tiny protein objects. If not present, fetch them.
     */
    async getOrFetchTiny(...ids: string[]) : Promise<TinyProtein[]> {
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

    set uniprot_url(v: string) {
        this.url = v;
    }

    /**
     * Micro-service omega-topology-uniprot URL
     */
    get uniprot_url() {
        return this.url;
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