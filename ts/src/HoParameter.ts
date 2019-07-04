import zip from "python-zip";
import { PSQData } from "./main";
import enumerate from "python-enumerate";

export type HVector = string[];

const TAXON_EVERY = 0;
const TAXON_SOME = 1;

export class HoParameterSet {
    public lowQueryParam: HoParameter[] = [];
    public highQueryParam: HoParameter[] = [];
    public mitabCouples: MitabParameter[][] = [];
    public visible = true;

    public static DEFAULT_TAXON_SEARCH_MODE = TAXON_EVERY;

    toString() {
        const mitabCouples: PSQData[][] = [];

        return JSON.stringify({
            lowQueryParam: this.lowQueryParam.filter((e, index) => { 
                if (e.valid && String(index) in this.mitabCouples) {
                    mitabCouples.push(this.mitabCouples[index].filter(e => e.valid).map(e => e.data));
                }
                
                return e.valid; 
            }),
            highQueryParam: this.highQueryParam.filter(e => e.valid),
            mitabCouples
        });
    }

    remove() {
        this.lowQueryParam = [];
        this.highQueryParam = [];
        this.visible = false;
    }

    get depth() {
        return this.length;
    }

    get length() {
        return this.lowQueryParam.filter(e => e.valid).length;
    }

    get isEmpty() {
        return this.length === 0;
    }

    get templates() {
        return [
            this.lowQueryParam.filter(e => e.valid).map(e => e.template),
            this.highQueryParam.filter(e => e.valid).map(e => e.template)
        ] as [string[], string[]];
    }

    get full_templates() {
        return [
            this.lowQueryParam.map(e => e.template),
            this.highQueryParam.map(e => e.template)
        ] as [string[], string[]];
    }

    add(x: HVector, y: HVector) {
        this.lowQueryParam.push(new HoParameter(x));
        this.highQueryParam.push(new HoParameter(y));
        this.mitabCouples.push([]);
    }

    /**
     * 
     * @param Object Variables **exp_methods** and **taxons** are undefined OR Set of strings.  
     */
    trim({
        simPct = 0, 
        idPct = 0, 
        cvPct = 0, 
        eValue = 1, 
        exp_methods = undefined,
        taxons = undefined,
        definitive = false
    } = {}) {
        this.visible = true;

        const to_remove = [];

        for (const [index, parameters] of enumerate(this)) {
            const [loHparam, hiHparam] = parameters;

            loHparam.valid = loHparam.simPct >= simPct && loHparam.idPct >= idPct && loHparam.cvPct >= cvPct && loHparam.eValue <= eValue;
            hiHparam.valid = hiHparam.simPct >= simPct && hiHparam.idPct >= idPct && hiHparam.cvPct >= cvPct && hiHparam.eValue <= eValue;

            // Remise à 0 des lignes mitab
            if (this.mitabCouples[index])
                for (const m of this.mitabCouples[index]) {
                    m.valid = true;
                }

            // Si on cherche à valider taxon ou méthode de détection exp.
            if ((exp_methods || taxons) && loHparam.valid && hiHparam.valid) {
                const mitab_lines_of = this.mitabCouples[index];

                let valid = false;

                // Si une des lignes mitab décrivant l'interaction contient une des méthodes expérimentales de détection choisies 
                // ET si le taxon d'où provient l'observation de cette interaction est valide
                if (mitab_lines_of) {
                    for (const line of mitab_lines_of) {
                        // Si on recherche les méthodes expérimentales ET si l'actuelle est dans celles qu'on recherche
                        // OU si on ne les recherche pas
                        if (
                            (exp_methods && (exp_methods as Set<string>).has(line.data.interactionDetectionMethod)) || 
                            !exp_methods
                        ) {
                            // Si on recherche les taxons
                            if (taxons) {
                                valid = HoParameterSet.DEFAULT_TAXON_SEARCH_MODE === TAXON_EVERY ?
                                    line.data.taxid.every(e => (taxons as Set<string>).has(e)) :
                                    line.data.taxid.some(e => (taxons as Set<string>).has(e));
                            }
                            else {
                                valid = true;
                            }
                        }

                        line.valid = valid;
                    }
                }
                
                loHparam.valid = hiHparam.valid = mitab_lines_of.filter(e => e.valid).length > 0; 
            }

            if (!loHparam.valid || !hiHparam.valid) {
                loHparam.valid = hiHparam.valid = false;
                to_remove.push(index);
            }
        }

        if (definitive) {
            this.lowQueryParam = this.lowQueryParam.filter((_, index) => !to_remove.includes(index));
            this.highQueryParam = this.highQueryParam.filter((_, index) => !to_remove.includes(index));
            this.mitabCouples = this.mitabCouples.filter((_, index) => !to_remove.includes(index));
        }
    }

    static from(obj: { lowQueryParam: {data: string[], valid: boolean}[], highQueryParam: {data: string[], valid: boolean}[], visible: boolean }) {
        const param = new HoParameterSet;

        param.lowQueryParam = obj.lowQueryParam.map(l => {
            const low = new HoParameter(l.data);
            low.valid = l.valid;
            return low;
        });
        param.highQueryParam = obj.highQueryParam.map(l => {
            const low = new HoParameter(l.data);
            low.valid = l.valid;
            return low;
        });

        param.visible = obj.visible;

        return param;
    }

    *full_iterator(visible_only = false) : IterableIterator<[HoParameter, HoParameter, PSQData[]]> {
        // @ts-ignore
        for (const values of zip(this.lowQueryParam, this.highQueryParam, this.mitabCouples) as IterableIterator<[HoParameter, HoParameter, MitabParameter[]]>) {
            if (visible_only) {
                if (values[0].valid && values[1].valid) {
                    yield [values[0], values[1], values[2].filter(e => e.valid).map(e => e.data)];
                }
            }
            else {
                yield [values[0], values[1], values[2].map(e => e.data)];
            }
        }
    }

    *[Symbol.iterator]() : IterableIterator<[HoParameter, HoParameter]> {
        for (const values of zip(this.lowQueryParam, this.highQueryParam)) {
            yield values as [HoParameter, HoParameter];
        }
    }
}

export class MitabParameter {
    public data: PSQData;
    public valid = true;

    constructor(d: PSQData) {
        this.data = d;
    }
}

export class HoParameter {
    public data: HVector;
    public valid = true;

    constructor(hVector: HVector) {
        this.data = hVector;
    }

    get length() : number {
        return parseInt(this.data[3]) - parseInt(this.data[2]) + 1;
    }

    get template() {
        return this.data[0];
    }

    get simPct() {
        return 100 * Number(this.data[7]) / this.length;
    }

    get idPct() {
        return 100 * Number(this.data[8]) / this.length;
    }

    get cvPct() {
        return 100 * this.length / parseInt(this.data[1]);
    }

    get eValue() {
        return Number(this.data[9]);
    }
}