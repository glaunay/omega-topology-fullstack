# omega-topology-fullstack

> Bring OmegaTopology content for both navigator and Node.js

**Warning**: If you're using node, you MUST install "node-fetch"

---

`omega-topology-fullstack` is a library, a collection of tools, objects and containers used to construct a interolog network inferred by homology.

The concept of MI Tab interaction data file and homology tree is explained in the [Divisome Factory](https://github.com/glaunay/divisomeFactory) pipeline.

## Capabilities
- Load a homology tree
- Read MI Tab records, extract interactors and parse specific data
- Link homology data to MI Tab interaction records
- Create a graph of interolog for a given specie
- Store and fetch UniProt data
- Organize GO Terms and link them to UniProt accession numbers
- Build a interolog network from a serialized version, or from a list of interactors

All the library code is fully documented and every public method should be correctly explained by a JSDoc comment.

## Containers

Short description of all the containers available in this library, and a quick overview of how to use them.

### HomologyTree

### PSICQuic and its children

### MDTree

### HoParameter and HoParameterSet

### OmegaTopology

### UniprotContainer

### GoTermsContainer



## Usages

This library fits different usages, from building a network from scratch to compute a real interolog graph to show on screen.

During all this examples, the specie used will be named as `R6`.

### Building a interolog network from homology file and interaction data
You can build the full OmegaTopology object straight from base files.

This process need a big amount of RAM, and it is recommanded to run your processus with the node option `--max-old-space-size=10000`.

First, you need two files, a homology JSON tree and a interaction dataset (MI Tab).

```ts
import OmegaTopology, { PSICQuic, HomologyTree } from 'omega-topology-fullstack';

const MITAB_FILENAME = "merged_uniprot_safe.mitab";
const TREE_FILENAME = "uniprot_R6_homology.json";

// To contain your MI Tab data before creating OmegaTopology, you need to instanciate a PSICQuic object
const psq = new PSICQuic;

(async function() {
    // Now, read the MI Tab (can be very long)
    // .read() returns a Promise
    await psq.read(MITAB_FILENAME);

    // Construct the homology tree
    const homology_tree = new HomologyTree(TREE_FILENAME);
    await homology_tree.init();

    // Instanciate omegatopology object using the created tree + MI Tab data
    const topo = new OmegaTopology(homology_tree, psq);

    // Compute the edges (link HomologyTree with PSICQuic records)
    topo.buildEdges();

    // Generate the Graphlib graph inside OmegaTopology (usable later)
    topo.constructGraph(true);
})();
```

---

### Building a interolog network from interactors list


---

### Building a interolog network from a serialized object


---

### Serialize a network


---

### Get the graph of interolog


---

### Filter the homology data or the interaction


---

### Get a subgraph from specific seeds (prune)

---

### Register MI Tab (interaction) data inside the object dynamically

---

### Register UniProt data

---

### Register GO Terms data

---

### Get informations about currently visible nodes and links (number)

---

### Iterate through the links

---

### Add artefactual data

---

### Access to UniProt or GO Terms data

---

### Get all the registred interactors, and the MI Tab lines