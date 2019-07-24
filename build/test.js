"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const main_1 = __importStar(require("./main"));
const MITAB_FILENAME = "merged_uniprot_safe.mitab";
const TREE_FILENAME = "uniprot_R6_homology.json";
const psq = new main_1.PSICQuic;
(async function () {
    await psq.read(MITAB_FILENAME);
    const homology_tree = new main_1.HomologyTree(TREE_FILENAME);
    await homology_tree.init();
    // Pas de uniprot url, pas besoin ici
    const topo = new main_1.default(homology_tree, psq);
    topo.buildEdges();
    topo.constructGraph(true);
})();
