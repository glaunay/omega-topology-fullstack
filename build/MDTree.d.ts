export interface MDNode<T> {
    [nodeId: string]: T;
}
export declare class MDTree<T> {
    autoAppendable: boolean;
    protected data: {
        [id: string]: {
            [secondId: string]: T;
        };
    };
    protected static mdCache: {
        [str: string]: string;
    };
    protected md5: typeof MDTree.md5;
    constructor(append?: boolean);
    static md5(str: string): string;
    readonly length: number;
    readonly full_tree: {
        [id: string]: {
            [secondId: string]: T;
        };
    };
    keys(): Set<string>;
    protected digest(k1: string, k2: string): [string, string];
    append(k1: string, k2: string, datum: T): void;
    protected getMaySet(x: string, y: string, value: T, force?: boolean): T;
    remove(x: string, y: string): void;
    protected push(x: string, y: string, datum: T): void;
    set(k1: string, k2: string, datum: T): void;
    get(k1: string, k2: string): T;
    getNode(k1: string): MDNode<T>;
    getOrSet(k1: string, k2: string, value: T): T;
    exists(x: string): boolean;
    protected testRef(x: string, y: string): boolean;
    [Symbol.iterator](): IterableIterator<[string, string, T]>;
    serialize(): string;
    static from(serialized: string, reviver?: (this: any, key: string, value: any) => any): MDTree<any>;
}
export declare class DNTree<T> extends MDTree<T> {
    weights: {
        [id: string]: number;
    };
    protected rank_storage: {
        [rankName: string]: number;
    };
    append(k1: string, k2: string, datum: T): void;
    getNode(k1: string): {
        [k: string]: T;
    };
    readonly rank: {
        [rankName: string]: number;
    };
    toString(): {
        [k: string]: MDNode<T>;
    };
    getNonDense(k1: string): MDNode<T>;
}
