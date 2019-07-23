import OmegaTopology, { PSICQuic, HomologyTree } from './main';

const MITAB_FILENAME = "merged_uniprot_safe.mitab"
const TREE_FILENAME = "uniprot_R6_homology.json"

const psq = new PSICQuic;

(async function() {
    await psq.read(MITAB_FILENAME);
    const homology_tree = new HomologyTree(TREE_FILENAME);
    await homology_tree.init();

    // Pas de uniprot url, pas besoin ici
    const topo = new OmegaTopology(homology_tree, psq);

    topo.buildEdges();

    topo.constructGraph(true);
})();


