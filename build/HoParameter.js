"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const python_zip_1 = __importDefault(require("python-zip"));
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
    }
    trim(simPct = 0, idPct = 0, cvPct = 0, eValue = 1, definitive = false) {
        this.visible = true;
        const to_remove = [];
        let i = 0;
        for (const [loHparam, hiHparam] of this) {
            loHparam.valid = loHparam.simPct >= simPct && loHparam.idPct >= idPct && loHparam.cvPct >= cvPct && loHparam.eValue <= eValue;
            hiHparam.valid = hiHparam.simPct >= simPct && hiHparam.idPct >= idPct && hiHparam.cvPct >= cvPct && hiHparam.eValue <= eValue;
            ;
            if (!loHparam.valid || !hiHparam.valid) {
                loHparam.valid = hiHparam.valid = false;
                to_remove.push(i);
            }
            i++;
        }
        if (definitive) {
            this.lowQueryParam = this.lowQueryParam.filter((_, index) => !to_remove.includes(index));
            this.highQueryParam = this.highQueryParam.filter((_, index) => !to_remove.includes(index));
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
        for (const values of python_zip_1.default(this.lowQueryParam, this.highQueryParam)) {
            yield values;
        }
    }
}
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
