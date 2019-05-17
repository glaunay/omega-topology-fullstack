export interface HomologInfo {
    [psqId: string]: {
        [homologKey: string]: string[][];
    };
}
export interface HomologChildren {
    [homologKey: string]: string[];
}
/**
 * Permet de lire un arbre d'homologie (tel Homology_R6.json) au format JSON.
 *
 */
export default class HomologTree {
    data: HomologInfo;
    protected init_promise: Promise<void> | undefined;
    /**
     * @param filename Le fichier ne doit être précisé SEULEMENT si l'environnement est node.js
     */
    constructor(filename: string);
    /**
     * Promise symbolizing instance state
     */
    init(): Promise<void>;
    getChildrenData(psqId: string): HomologChildren;
    serialize(): string;
    readonly length: number;
    static from(serialized: string): HomologTree;
    [Symbol.iterator](): IterableIterator<string>;
}
