"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const python_zip_1 = __importDefault(require("python-zip"));
const python_enumerate_1 = __importDefault(require("python-enumerate"));
const TAXON_EVERY = 0;
const TAXON_SOME = 1;
/**
 * Save the homology data of a link
 */
class HoParameterSet {
    constructor() {
        /** Store the homology data of the node with the lowest MD5 hash */
        this.lowQueryParam = [];
        /** Store the homology data of the node with the highest MD5 hash */
        this.highQueryParam = [];
        /** Store the interaction data support of the link */
        this.mitabCouples = [];
        /** If not visible, link will be hidden in the representation */
        this.visible = true;
    }
    /** Serialize the object */
    toString() {
        const mitabCouples = [];
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
    /** Clear this instance */
    remove() {
        this.lowQueryParam = [];
        this.highQueryParam = [];
        this.visible = false;
    }
    get depth() {
        return this.length;
    }
    /** Number of valid homologies */
    get length() {
        return this.lowQueryParam.filter(e => e.valid).length;
    }
    /** True if any homology support is valid */
    get isEmpty() {
        return this.length === 0;
    }
    /** All valid templates (accession number of the homologs) */
    get templates() {
        return [
            this.lowQueryParam.filter(e => e.valid).map(e => e.template),
            this.highQueryParam.filter(e => e.valid).map(e => e.template)
        ];
    }
    /** Templates, but unfiltered */
    get full_templates() {
        return [
            this.lowQueryParam.map(e => e.template),
            this.highQueryParam.map(e => e.template)
        ];
    }
    /** Add a new homology support */
    add(x, y) {
        this.lowQueryParam.push(new HoParameter(x));
        this.highQueryParam.push(new HoParameter(y));
        this.mitabCouples.push([]);
    }
    /**
     * Apply filters to the homology support or the interaction data.
     * After a trim, check if the HoParameterSet is still valid with `.isEmpty`.
     *
     * @param Object
     * **simPct**, **idPct** and **cvPct**, respectively similiarity, identity and coverage, are in *percentage* (0 to 100).
     * Setting a value for those settings will invalidate homology supports *below* the threshold.
     *
     * Setting a **eValue** will invalidate homology supports *above* the threshold.
     *
     * Variables **exp_methods** and **taxons** are undefined OR Set of strings. They must *NOT* be arrays of string !
     *
     * If you want reasons for what have been discarded by filters, you can enable the **logged** parameter with `true`.
     * This function will return a array of tuples ([lowQuery, highQuery]) with fail information.
     * Otherwise, return value will be an empty array.
     *
     * **destroy_identical** will identify identical identities parameter and filter them (at the end, there will be only one).
     * This step is CPU-intensive, do not enable it everytime you filter !
     * It is recommanded to activate both **destroy_identical** and **definitive** in order to permanently remove duplicated homology support.
     */
    trim({ simPct = 0, idPct = 0, cvPct = 0, eValue = 1, exp_methods = undefined, taxons = undefined, definitive = false, logged = false, destroy_identical = false } = {}) {
        this.visible = true;
        const reasons = [];
        const to_remove = [];
        const hashes = {};
        for (const [index, parameters] of python_enumerate_1.default(this)) {
            const [loHparam, hiHparam] = parameters;
            if (logged) {
                const reason = {
                    identity: false,
                    e_value: false,
                    similarity: false,
                    coverage: false
                };
                const highReason = Object.assign({}, reason);
                loHparam.valid = true;
                if (loHparam.simPct < simPct) {
                    reason.similarity = `${loHparam.simPct}, expected higher than ${simPct}`;
                    loHparam.valid = false;
                }
                if (loHparam.idPct < idPct) {
                    reason.identity = `${loHparam.idPct}, expected higher than ${idPct}`;
                    loHparam.valid = false;
                }
                if (loHparam.cvPct < cvPct) {
                    reason.coverage = `${loHparam.cvPct}, expected higher than ${cvPct}`;
                    loHparam.valid = false;
                }
                if (loHparam.eValue > eValue) {
                    reason.e_value = `${loHparam.eValue}, expected lower than ${eValue}`;
                    loHparam.valid = false;
                }
                hiHparam.valid = true;
                if (hiHparam.simPct < simPct) {
                    highReason.similarity = `${hiHparam.simPct}, expected higher than ${simPct}`;
                    hiHparam.valid = false;
                }
                if (hiHparam.idPct < idPct) {
                    highReason.identity = `${hiHparam.idPct}, expected higher than ${idPct}`;
                    hiHparam.valid = false;
                }
                if (hiHparam.cvPct < cvPct) {
                    highReason.coverage = `${hiHparam.cvPct}, expected higher than ${cvPct}`;
                    hiHparam.valid = false;
                }
                if (hiHparam.eValue > eValue) {
                    highReason.e_value = `${hiHparam.eValue}, expected lower than ${eValue}`;
                    hiHparam.valid = false;
                }
                reasons.push([reason, highReason]);
            }
            else {
                loHparam.valid = loHparam.simPct >= simPct && loHparam.idPct >= idPct && loHparam.cvPct >= cvPct && loHparam.eValue <= eValue;
                hiHparam.valid = hiHparam.simPct >= simPct && hiHparam.idPct >= idPct && hiHparam.cvPct >= cvPct && hiHparam.eValue <= eValue;
            }
            // Remise à 0 des lignes mitab
            if (!exp_methods && this.mitabCouples[index])
                for (const m of this.mitabCouples[index]) {
                    m.valid = true;
                }
            // Si on cherche à valider taxon ou méthode de détection exp.
            if ((exp_methods || taxons) && loHparam.valid && hiHparam.valid) {
                const mitab_lines_of = this.mitabCouples[index];
                // Si une des lignes mitab décrivant l'interaction contient une des méthodes expérimentales de détection choisies 
                // ET si le taxon d'où provient l'observation de cette interaction est valide
                if (mitab_lines_of) {
                    if (exp_methods) {
                        mitab_lines_of.forEach(l => l.valid = exp_methods.has(l.data.interactionDetectionMethod));
                    }
                    if (taxons) {
                        mitab_lines_of.forEach(l => l.valid = (!l.valid ?
                            false :
                            (HoParameterSet.DEFAULT_TAXON_SEARCH_MODE === TAXON_EVERY ?
                                l.data.taxid.every(e => taxons.has(e)) :
                                l.data.taxid.some(e => taxons.has(e)))));
                    }
                }
                loHparam.valid = hiHparam.valid = mitab_lines_of.filter(e => e.valid).length > 0;
            }
            if (!loHparam.valid || !hiHparam.valid) {
                loHparam.valid = hiHparam.valid = false;
                if (this.mitabCouples[index]) {
                    this.mitabCouples[index].forEach(m => m.valid = false);
                }
                to_remove.push(index);
            }
            if (destroy_identical) {
                // Mini-hash
                const hash = loHparam.data.join('') + '~' + hiHparam.data.join('');
                if (hash in hashes) {
                    to_remove.push(index);
                }
                else {
                    hashes[hash] = true;
                }
            }
        }
        if (definitive) {
            this.lowQueryParam = this.lowQueryParam.filter((_, index) => !to_remove.includes(index));
            this.highQueryParam = this.highQueryParam.filter((_, index) => !to_remove.includes(index));
            this.mitabCouples = this.mitabCouples.filter((_, index) => !to_remove.includes(index));
        }
        return reasons;
    }
    /** Unserialize a HoParameterSet */
    static from(obj) {
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
    /** Iterate through the homology support and the interaction data */
    *full_iterator(visible_only = false) {
        // @ts-ignore
        for (const values of python_zip_1.default(this.lowQueryParam, this.highQueryParam, this.mitabCouples)) {
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
    /** Iterate through the homology support */
    *[Symbol.iterator]() {
        for (const values of python_zip_1.default(this.lowQueryParam, this.highQueryParam)) {
            yield values;
        }
    }
}
/** How to search taxons in taxons search */
HoParameterSet.DEFAULT_TAXON_SEARCH_MODE = TAXON_EVERY;
exports.HoParameterSet = HoParameterSet;
/** Encapsulate PSQData to store validity */
class MitabParameter {
    constructor(d) {
        /** If the PSQData is valid or not */
        this.valid = true;
        this.data = d;
    }
}
exports.MitabParameter = MitabParameter;
/** Store one homology support */
class HoParameter {
    constructor(hVector) {
        this.valid = true;
        this.data = hVector;
    }
    /** Homolog sequence length */
    get length() {
        return parseInt(this.data[3]) - parseInt(this.data[2]) + 1;
    }
    /** Identifier (accession number) of the homolog */
    get template() {
        return this.data[0];
    }
    /** Sequence similarity percentage */
    get simPct() {
        return 100 * Number(this.data[7]) / this.length;
    }
    /** Sequence identity percentage */
    get idPct() {
        return 100 * Number(this.data[8]) / this.length;
    }
    /** Sequence coverage percentage */
    get cvPct() {
        return 100 * this.length / parseInt(this.data[1]);
    }
    /** E-value computed by PSI-BLAST */
    get eValue() {
        return Number(this.data[9]);
    }
}
exports.HoParameter = HoParameter;
