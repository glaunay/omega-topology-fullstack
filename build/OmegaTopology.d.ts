import HomologTree, { HomologChildren } from "./HomologyTree";
import { Graph } from "graphlib";
import { HoParameterSet, HoParameter } from "./HoParameter";
import { MDTree } from './MDTree';
import { MitabTopology } from "./MitabTopology";
export default class OmegaTopology {
    protected hData: HomologTree;
    protected ajdTree: MDTree<HoParameterSet>;
    protected baseTopology?: MitabTopology;
    /**
     * GRAPH
     * Node type: string
     * Node data / label: NodeGraphComponent
     * Edge data / label: HoParameterSet
     */
    protected G: Graph;
    constructor(homologyTree: HomologTree, mitabObj?: MitabTopology);
    init(): Promise<void>;
    prune(renew?: boolean, max_distance?: number, ...seeds: string[]): Graph;
    [Symbol.iterator](): IterableIterator<[string, string, HoParameterSet]>;
    iterVisible(): IterableIterator<[string, string, HoParameterSet]>;
    templatePairs(): IterableIterator<[HoParameter, HoParameter]>;
    dump(): {
        nodes: any[];
        links: {
            source: string;
            target: string;
            data: HoParameterSet;
        }[];
    };
    dumpGraph(trim_invalid?: boolean): string;
    serialize(with_homology_tree?: boolean): string;
    static from(serialized: string): OmegaTopology;
    protected makeGraph(): Graph;
    readonly edgeNumber: number;
    readonly nodeNumber: number;
    readonly nodes: {
        [id: string]: Set<any>;
    };
    protected showNode(node: string): void;
    protected hideNode(node: string): void;
    readonly length: number;
    readonly hDataLength: number;
    buildEdgesReverse(bar: any /** Progress bar (any for not importing Progress in clients) */): Promise<void>;
    buildEdges(): void;
    definitiveTrim(simPic?: number, idPct?: number, cvPct?: number): [number, number];
    trimEdges(simPic?: number, idPct?: number, cvPct?: number): [number, number];
    toString(): string;
    getEdgeSet(...args: any[]): IterableIterator<[string, string, HoParameterSet]> | undefined;
    addEdgeSet(dataNewA: HomologChildren, dataNewB: HomologChildren): void;
    templateZipPair(): MDTree<boolean>;
    protected weightProjector(): void;
}
