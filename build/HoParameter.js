"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const python_zip_1 = __importDefault(require("python-zip"));
const python_enumerate_1 = __importDefault(require("python-enumerate"));
const TAXON_EVERY = 0;
const TAXON_SOME = 1;
class HoParameterSet {
    constructor() {
        this.lowQueryParam = [];
        this.highQueryParam = [];
        this.mitabCouples = [];
        this.visible = true;
    }
    toString() {
        const mitabCouples = [];
        return JSON.stringify({
            lowQueryParam: this.lowQueryParam.filter((e, index) => {
                if (e.valid && String(index) in this.mitabCouples) {
                    mitabCouples.push(this.mitabCouples[index]);
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
        ];
    }
    get full_templates() {
        return [
            this.lowQueryParam.map(e => e.template),
            this.highQueryParam.map(e => e.template)
        ];
    }
    add(x, y) {
        this.lowQueryParam.push(new HoParameter(x));
        this.highQueryParam.push(new HoParameter(y));
        this.mitabCouples.push([]);
    }
    /**
     *
     * @param Object Variables **exp_methods** and **taxons** are undefined OR Set of strings.
     */
    trim({ simPct = 0, idPct = 0, cvPct = 0, eValue = 1, exp_methods = undefined, taxons = undefined, definitive = false } = {}) {
        this.visible = true;
        const to_remove = [];
        for (const [index, parameters] of python_enumerate_1.default(this)) {
            const [loHparam, hiHparam] = parameters;
            loHparam.valid = loHparam.simPct >= simPct && loHparam.idPct >= idPct && loHparam.cvPct >= cvPct && loHparam.eValue <= eValue;
            hiHparam.valid = hiHparam.simPct >= simPct && hiHparam.idPct >= idPct && hiHparam.cvPct >= cvPct && hiHparam.eValue <= eValue;
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
                        if ((exp_methods && exp_methods.has(line.interactionDetectionMethod)) ||
                            !exp_methods) {
                            // Si on recherche les taxons
                            if (taxons) {
                                valid = HoParameterSet.DEFAULT_TAXON_SEARCH_MODE === TAXON_EVERY ?
                                    line.taxid.every(e => taxons.has(e)) :
                                    line.taxid.some(e => taxons.has(e));
                            }
                            else {
                                valid = true;
                                break;
                            }
                        }
                    }
                }
                loHparam.valid = hiHparam.valid = valid;
            }
            if (!loHparam.valid || !hiHparam.valid) {
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
    *[Symbol.iterator]() {
        // @ts-ignore
        for (const values of python_zip_1.default(this.lowQueryParam, this.highQueryParam, this.mitabCouples)) {
            yield values;
        }
    }
}
HoParameterSet.DEFAULT_TAXON_SEARCH_MODE = TAXON_EVERY;
exports.HoParameterSet = HoParameterSet;
class HoParameter {
    constructor(hVector) {
        this.valid = true;
        this.data = hVector;
    }
    get length() {
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
exports.HoParameter = HoParameter;
