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

    const id1 = "P14292";
    const id2 = "P58393";
    const TAXID_SPECIE = "13832";

    // Create a edge with two interaction supports
    topo.createArtefactual({
        source: id1,
        target: id2
    }, [{
        // Specify the both IDs...
        id1, 
        id2, 
        // Specifiy the specie of the interaction (required)
        tax_ids: [TAXID_SPECIE],
        // Specify the detection method (required)
        mi_ids: ["MI:0676"],
        // Specify the publication (required)
        pubmed_ids: ["2482048"]
    }, {
        id1,
        id2,
        tax_ids: [TAXID_SPECIE],
        mi_ids: ["0114"],
        pubmed_ids: ["449221"]
    }]);
})();


