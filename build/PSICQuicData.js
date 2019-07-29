"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const md5_1 = __importDefault(require("md5"));
const python_zip_1 = __importDefault(require("python-zip"));
const python_enumerate_1 = __importDefault(require("python-enumerate"));
const PSQ_FIELDS = ["idA", "idB", "altA", "altB", "aliasA", "aliasB", "interactionDetectionMethod", "firstAuthor", "pubid", "taxidA", "taxidB",
    "interactionTypes", "sourceDatabases", "interactionIdentifiers", "confidenceScore", "complexExpansion", "biologicalRoleA",
    "biologicalRoleB", "experimentalRoleA", "experimentalRoleB", "interactorTypeA", "interactorTypeB", "xRefA", "xRefB",
    "xRefInteraction", "annotationA", "annotationB", "annotationInteraction", "taxidHost", "parameters", "creationDate",
    "updateDate", "checksumA", "checksumB", "negative", "featuresA", "featuresB", "stoichiometryA", "stoichiometryB",
    "identificationMethodA", "identificationMethodB"];
const INDEXED_PSQ_FIELD = {};
for (const [index, value] of PSQ_FIELDS) {
    INDEXED_PSQ_FIELD[index] = value;
    INDEXED_PSQ_FIELD[value] = index;
}
/**
 * Hold the data of one MI Tab line
 */
class PSQData {
    /**
     * Build a new PSQData object with a raw MI Tab line.
     *
     * @param raw Raw line
     * @param keep_raw If the line is meant to be saved in raw property
     */
    constructor(raw, keep_raw = false) {
        this.data = raw.split(/\t+/g).filter(str => str.trim().length > 0).map(str => new PSQDatum(str));
        this.hash = md5_1.default(raw);
        if (keep_raw) {
            this.raw = raw;
        }
        if (this.data.length !== 15 && this.data.length !== 42) {
            throw new Error("Uncorrect number of tabulated fields on input [" + this.data.length + "] at:\n" + raw);
        }
    }
    static create(fake) {
        const line = `${fake.id1}\t${fake.id2}\t-\t-\t-\t-\t${fake.mi_ids.map(e => e.startsWith('MI:') ? e : "MI:" + e).join('|')}\t-\t${fake.pubmed_ids.join('|')}\t${fake.tax_ids.join('|')}\t${fake.tax_ids.join('|')}\t-\t-\t-\t-`;
        return new PSQData(line);
    }
    /** The 2 protein IDs present in the line */
    get ids() {
        return [this.data[0].value.split(':', 2).pop(), this.data[1].value.split(':', 2).pop()];
    }
    /**
     * Test if two instances of PSQData are equals
     */
    equal(other) {
        return this.hash === other.hash;
    }
    toString() {
        return this.data.map(e => e.toString()).join("\t");
    }
    get [Symbol.toStringTag]() {
        return "PSQData";
    }
    /**
     * @alias species
     *
     * Taxonomic IDs of the two interactors
     */
    get taxid() {
        return [this.data[9].content[0][1], this.data[10].content[0][1]];
    }
    /**
     * Publication ID of the interaction
     */
    get pmid() {
        for (const field of this.data[8].data) {
            if (field.type === "pubmed:") {
                return field.value;
            }
        }
        return this.data[8].data[0].value;
    }
    /**
     * Source database of the interaction
     */
    get source() {
        return this.data[12].data[0].annotation ? this.data[12].data[0].annotation : this.data[12].data[0].value;
    }
    /**
     * Detection method of this interaction
     */
    get interactionDetectionMethod() {
        return this.data[6].data[0].value;
    }
    /**
     * @alias taxid
     *
     * Species of the two interactors (taxids)
     */
    get species() {
        return [this.data[9].data[0].value, this.data[10].data[0].value];
    }
    /**
     * Like species, but with the annotation, not only the name
     */
    get full_species() {
        let max_len = 0;
        let max_element = "";
        for (const d of this.data[9].data) {
            if (d.annotation && d.annotation.length > max_len) {
                max_element = d.annotation;
                max_len = d.annotation.length;
            }
        }
        max_len = 0;
        let max_element2 = "";
        for (const d of this.data[10].data) {
            if (d.annotation && d.annotation.length > max_len) {
                max_element2 = d.annotation;
                max_len = d.annotation.length;
            }
        }
        return [!max_element ? this.data[9].data[0].value : max_element, !max_element2 ? this.data[10].data[0].value : max_element2];
    }
    uniprotCapture(str) {
        const subString = str ? str.match(/[OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2}/) : undefined;
        if (subString)
            return subString[0];
        return undefined;
    }
    /**
     * UniProt IDs of the two interactors, but sorted
     */
    get uniprotPair() {
        const a = this.uniprotCapture(this.data[0].data[0].value) || this.uniprotCapture(this.data[2].data[0].value);
        const b = this.uniprotCapture(this.data[1].data[0].value) || this.uniprotCapture(this.data[3].data[0].value);
        if (a && b) {
            return b < a ? [b, a] : [a, b];
        }
        return undefined;
    }
    /**
     * JSON version of the PSQData
     */
    get json() {
        const obj = {};
        for (const [k, d] of python_zip_1.default(PSQData.PSQ_FIELDS, this.data)) {
            obj[k] = d.toString();
        }
        return JSON.stringify(obj);
    }
    /**
     * Interactors ID + alternates IDs
     *
     * @returns Tuple<[type, id1][], [type, id2][]>
     */
    get interactors() {
        return [this.data[0].content.concat(this.data[2].content), this.data[1].content.concat(this.data[3].content)];
    }
    /**
     * Get a MI Tab **raw** information by index (splitted by '\t')
     * @param i
     */
    index(i) {
        if (i in this.data) {
            return this.data[i].toString();
        }
        return undefined;
    }
    /**
     * Get the MI Tab **raw** information of a field by his name.
     *
     * You can explore field name in `PSQData.PSQ_FIELDS`.
     *
     * @param name Name of the field to get
     */
    rawField(name) {
        const field_index = PSQData.INDEXED_PSQ_FIELDS[name];
        if (field_index !== undefined) {
            return this.index(field_index);
        }
        return undefined;
    }
    /**
     * Get the `PSQDatum` by his name.
     *
     * You can explore field name in `PSQData.PSQ_FIELDS`.
     *
     * @param name Name of the field to get
     */
    field(name) {
        const field_index = PSQData.INDEXED_PSQ_FIELDS[name];
        if (field_index !== undefined) {
            return this.data[field_index];
        }
        return undefined;
    }
}
PSQData.PSQ_FIELDS = PSQ_FIELDS;
PSQData.INDEXED_PSQ_FIELDS = INDEXED_PSQ_FIELD;
exports.PSQData = PSQData;
/**
 * One field of a MI Tab line.
 * One field can held multiple values/informations (splitted by a pipe), this is why one "field" has multiple `PSQField`.
 */
class PSQDatum {
    constructor(colomn) {
        this.data = colomn.split('|').map(e => new PSQField(e));
    }
    /**
     * Check equality between two fields.
     */
    equal(datum) {
        return this.toString() === datum.toString();
    }
    toString() {
        return this.data.map(e => e.toString()).join('|');
    }
    get [Symbol.toStringTag]() {
        return "PSQDatum";
    }
    *[Symbol.iterator]() {
        yield* this.data;
    }
    /**
     * Iterate through the PSQFields
     */
    *entries() {
        yield* python_enumerate_1.default(this.data);
    }
    /**
     * Get field value where the type equals to key.
     *
     * @param key Type of field
     */
    at(key) {
        return [...this].filter(e => e.type === key + ":").map(e => e.value);
    }
    /**
     * Couples [type, value] of the PSQFields.
     */
    get content() {
        return [...this].map(e => [e.type, e.value]);
    }
    /**
     * Values inside the PSQFields, joined with a pipe.
     */
    get value() {
        return this.data.map(e => e.value).join('|');
    }
}
exports.PSQDatum = PSQDatum;
/**
 * Most basic datum of a MI Tab line.
 *
 * Hold one information of one field.
 */
class PSQField {
    /**
     * Construct the object with raw field data. Must not contain pipes.
     *
     * A complete field (with possible multiple informations) should be only given to `PSQDatum` class !
     *
     * @param element Field
     */
    constructor(element) {
        const m = PSQField.fieldParser.exec(element);
        // this.raw = element;
        if (m) {
            this.type = m[1];
            this.value = m[2];
            this.annotation = m[3];
        }
        else {
            this.value = element;
            this.type = undefined;
            this.annotation = undefined;
        }
    }
    /**
     * Check equality between this field and another one.
     */
    equal(field) {
        return this.value === field.value && this.type === field.type && this.annotation === field.annotation;
    }
    toString() {
        return (this.type ? this.type : "") + (this.value ? `"${this.value}"` : "") + (this.annotation ? `(${this.annotation})` : "");
        // return this.raw;
    }
    get [Symbol.toStringTag]() {
        return "PSQField";
    }
}
// public static readonly fieldParser = /^([^:^"]+:){0,1}"{0,1}([^"\(]+)"{0,1}\({0,1}([^\)]+){0,1}\){0,1}$/;
PSQField.fieldParser = /^([^:^"\n]+:)?"?([^"\(\n]+)"?\(?(.+?)?\)?$/;
exports.PSQField = PSQField;
