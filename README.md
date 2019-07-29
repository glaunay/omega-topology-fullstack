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

## Node.js specification
If you are using Node.js, you need to install manually two packages: `node-fetch` and `progress` in order to run functions normally.

```bash
npm i omega-topology-fullstack node-fetch progress
```

## Warnings
- Some functions are only available in a Node.js context. They are flagged as `@nodeonly` in the code documentation.

- Some functions need a huge amount of RAM when used. They are flagged as `@rameater` in the code documentation. If you planned to use those functions, make sure to use the V8 parameter `--max-old-space-size={RAM}`.


## Containers

Short description of all the containers available in this library, and a quick overview of how to use them.

### HomologyTree

Store all homology data contained in the homology JSON file, output of the *divisomeFactory* pipeline.

You can instanciate the class with the filename of the file, and wait for initialization with the `.init()` method, which returns a `Promise`.

This container is meant to be given to a `OmegaTopology` instance, you should not manipulate it by yourself.

---

### PSICQuic and its children

The PSICQuic container is the interaction data (MI Tab) organizer and manager.

See [PSICQuic.md](readme/PSICQuic.md).

---

### HoParameter and HoParameterSet

HoParameterSet is the structure that hold homology data of the two supposed interactors.

See [HoParameter.md](readme/HoParameter.md).

---

### UniprotContainer and GoTermsContainer

Store UniProt data and quick access to GO Terms linked to proteins.

See [UniProtContainers.md](readme/UniProtContainers.md).

---

### OmegaTopology

Manager of all thoses classes, and can construct a interolog network with all the homology data, interaction data, link UniProt data to the proteins, and trim the graph links or nodes.

This class is fully documented, if you want to check the available methods, just check [OmegaTopology.ts](ts/src/OmegaTopology.ts) !

All the common use cases of `OmegaTopology` are documented below, in the section **Usages**.


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
If the list of interactors is already registred in the Couch database, you can build internal network from it and the homology file (you can skip the MI Tab read, which is a big saver of time and RAM usage).

You need to have the *omegalomodb* micro-service started.

Due to how the IDs are stored inside the database, this may cause doublons ! 
Make sure to do a `.trimEdges({ definitive: true, destroy_identical: true })` after calling this method.


```ts
import OmegaTopology, { HomologyTree } from 'omega-topology-fullstack';

const OMEGA_DB_URL = "http://localhost:3280/bulk";
const TREE_FILENAME = "source/homology/uniprot_R6_homology.json";

(async () => {
    // Instanciate the tree, then build OT with the tree
    const this_tree = new HomologyTree(TREE_FILENAME);
    await this_tree.init();
    const topo = new OmegaTopology(this_tree);
    await topo.init();

    // Compute the edges from a list of interactors stored in the database
    await topo.buildEdgesReverse(OMEGA_DB_URL);

    // Remove duplicates
    topo.trimEdges({ definitive: true, destroy_identical: true });

    // Generate the Graphlib graph inside OmegaTopology (usable later)
    const g = topo.constructGraph(true);

    // Excepted MI Tab records: 0 (not imported by buildEdgesReverse)
    console.log(`Nodes: ${g.nodeCount()}; Edges: ${g.edgeCount()}; MI Tab records: ${topo.psi.records.size}`);
})();
```

---

### Building a interolog network from a serialized object

OmegaTopology object is able to serialize itself (see next usage). To unserialize the object, you have two ways:

- Build a object from a local file

Use the `.from()` static method that take a `string` parameter and a optional `PSICQuic` object (in order to load MI Tab data).

```ts
import OmegaTopology from 'omega-topology-fullstack';
import fs from 'fs';

const FILENAME = "source/cache/uniprot_R6_homology.topology";

const filedata = fs.readFileSync(FILENAME, { encoding: 'utf-8' });
const topo = OmegaTopology.from(filedata);

// Mitab records should be 0, because any PSICQuic object is linked to topo object
console.log(`Nodes: ${topo.nodeNumber}; Edges: ${topo.edgeNumber}; MI Tab records: ${topo.psi.records.size}`);
```

- Build a object from a distant serialized object

Instanciate a object, then load data with `.fromDownload()` method. First and only parameter is the URL of the serialized string.

```ts
import OmegaTopology from 'omega-topology-fullstack';

(async function () {
    const URL = "http://localhost:3455/tree/R6";

    const topo = new OmegaTopology;
    await topo.fromDownload(URL);

    // Mitab records should be 0, because any PSICQuic object is linked to topo object
    console.log(`Nodes: ${topo.nodeNumber}; Edges: ${topo.edgeNumber}; MI Tab records: ${topo.psi.records.size}`);
})();
```

---

### Serialize a network

You can serialize the current OmegaTopology object with `.serialize()`.

```ts
import { buildFromFile } from './build_from_file';
import { writeFileSync } from 'fs';

(async function() {
    // Create the OT object with the method you want...
    const topo = await buildFromFile();

    // You can choose if you include the HomologyTree with the serialized object 
    // (not needed to build a graph after un-serialization)
    const serialized = topo.serialize(false);

    // Save the file...
    writeFileSync("my_save.topology", serialized);
})();
```

---

### Get the graph of interolog

The most important part of the lib !
After building the network (with `.buildEdges()` or `buildEdgesReverse()`), you must construct the graph in order to access nodes and links data.

To construct the graph without any filter, use the `.constructGraph()` method.

After the graph is constructed, you have access to `.nodes` and `.links` accessors, to begin to use graph data. 

```ts
import { buildNetwork } from './some_file';

// Get the topology object from the method you want
const topology = buildNetwork();
topology.constructGraph();

// Nodes are a array of tuples [protein_accession_number, NodeGraphComponent][]
const nodes = topology.nodes;

// Links are a array of tuples [[id1, id2], HoParameterSet][]
const links = topology.links;
```

---

### Filter the homology data or the interaction

Most of all, what you want to do with the network is to filter it.

First, network must be builded. Let's do it.

```ts
import { buildNetwork } from './some_file';

// Get the topology object from the method you want
const topology = buildNetwork();
```

Now, all the core logic will be the usage of `.trimEdges()` method. It take a object of filters in parameter, with some default parameters. A call to this method without any filter will makes all links/nodes visibles in the internal network.

`.trimEdges()` do NOT build the graph automatically, you *must* make a call to `.constructGraph()` to refresh the current stored graph inside the `OmegaTopology` object.

```ts
// Applying some filters
topology.trimEdges({
    idPct: 30, // Minimum 30% identity
    simPct: 42, // Minimum 42% similarity
    definitive: true // Make the trim definitive (invalid links will be totally removed from the internal network)
});


// Constructing graph
topology.constructGraph();
```

Multiple filters are available for `.trimEdges()`:
- `idPct`: Identity (%, minimum, default `0`)
- `cvPct`: Coverage (%, minimum, default `0`)
- `simPct`: Similarity (%, minimum, default `0`)
- `eValue`: E-value (maximum, default `1`)
- `taxons`: Allowed taxonomic IDs (Array of string, empty array: no filter, inclusive, default `[]`)
- `exp_det_methods`: Allowed detection methods MI-IDs (Array of string, empty array: no filter, inclusive, default `[]`)

Parameters for the trimming are available:
- `definitive`: Trimming will remove permanently the invalid ones (by default, they're just hidden, default: `false`)
- `logged_id`: Specify a protein accession number to log (will cause a huge performance impact, default: `""`)
- `destroy_identical`: Will search the identical BLAST hits and remove them (will cause a huge performance impact, default: `false`)

---

### Get a subgraph from specific seeds (prune)

You're looking for the connex components of a nodes ? You want to see only the nearest neighboors of a node ? The `.prune()` method is here for you !

This will help you to get a sub-graph of the original graph. This function will **automatically** rebuild the graph, you **don't** need to call `.constructGraph()` (in fact, this would even reverse the prune) !

You must specify maximum distance from the seeds you want (if you want the full connex component, use `Infinity`), then the seeds. The "seed" is specifiy by the Node ID, protein accession number.

```ts
import { buildNetwork } from './some_file';

// Get the topology object from the method you want
const topology = buildNetwork();

// Let's prune from a specific seed !
topology.prune(Infinity, "P13413");
// You have now access to topology.nodes, topology.links...

// You can specify any number of seeds you want
topology.prune(Infinity, "P13413", "Q81424", "P58203");

// You can look for only the first level of neighboors from a node
topology.prune(1, "P13413");
```

To cancel a prune, call `.constructGraph()` or `.prune()` without any parameter.

---

### <a id="register_dyna"></a> Register MI Tab (interaction) data inside the object dynamically

When you load a network without the MI Tab file (serialized, or via the database of interactors), you don't have any MI Tab record.

But, you can, dynamically, load MI Tab informations inside the object, using the `.read()` method (it takes only `string` arrays).

```ts
import { buildNetwork, getMitabLines, getPSQData } from './some_file';

// Get the topology object from the method you want
const topology = buildNetwork();

// You get MI Tab lines from another method...
const lines = getMitabLines();

// You can register then with .read
topology.read(lines);

// Even if the lines are read, they're not linked to the HoParameterSet objects ! You must call .linkMitabLines after reading ALL you lines
topology.linkMitabLines();
```

If you already have `PSQData` objects, load them inside the `PSICQuic` object (with the `.psi` accessor).

```ts
const my_psidata: PSQData[] = getPSQData();

// Link every line with .add method of the PSICQuic object
topology.psi.add(...my_psidata);

// Don't forget to link lines
topology.linkMitabLines();
```

After all the insertions, you need to call `.linkMitabLines()` to link MI Tab objects inside the `HoParameterSet` objects (link support). 

This function refresh **ALL** the `HoParameterSet`s (even if they already contain MI Tab data), so please take care of don't calling it too much...

---

### Register UniProt data

OmegaTopology has an internal UniProt data container, able to cache and dynamically fetch UniProt informations for one or multiple proteins.

UniProt container is built at the construction of the OmegaTopology object, and the URL of the UniProt fetcher (*micro-service* **omega-topology-uniprot**).

If you want to set the URL dynamically, you can use the `.uniprot_url` accessor.

```ts
topology.uniprot_url = "http://localhost:3289";
```

When the network is loaded successfully inside the object, **and the graph constructed using `.constructGraph()`**, you can download all the "tiny" information of every protein present in graph, with `.downloadNeededUniprotData()`.

```ts
// Graph construction is needed
topology.constructGraph();

// Download the "tiny" protein object for every node
await topology.downloadNeededUniprotData();
```

You can get full protein data (not the "tiny" object) with the `.getProteinInfos()` method (returns a `Promise<UniprotProtein>`).

```ts
const infos = await topology.getProteinInfos("P14823");
```

In case you want specifiy data from the container, you can access to the container and directly use its method via the `.uniprot_container` accessor.

```ts
topology.uniprot_container.searchByAnnotation("DNA")
```

---

### Register GO Terms data

A GO Terms container is accessible inside the OmegaTopology object. 

You can automatically download all the needed terms (**after the graph has been built**) with `.downloadNeededGoTerms()`.

```ts
// Graph construction is needed
topology.constructGraph();

// Register the existing GO Terms for every node
await topology.downloadNeededGoTerms();
```

Also, you could start a terms download with `.downloadGoTerms()` (which take a list of protein accession numbers in parameter).

```ts
// Download GO Terms for "P14729" and "Q28947"
// The terms are stored inside the GO Terms container
await topology.downloadGoTerms("P14729", "Q28947");
```

You can access GO Terms data container with the `.go_terms` accessor.

```ts
// List available terms for "Q28947"
let go_ids = topology.go_terms.searchByProt("Q28947");

// Get the terms names
go_ids = go_ids.map(t => topology.go_terms.getNameOfTerm(t));
```

---

### Get informations about currently visible nodes and links (number)

Access through numerical information about the graph with  the `.nodeNumber` and `.edgeNumber` accessors.

The benefic of those accessor is that they don't require to construct the graph (they're using the internal network).

```ts
topology.nodeNumber;
topology.edgeNumber;
```

---

### Iterate through the network

Iteration through the network do not require to build a graph.

Two iteration modes are available:

- Iterate through all links, even hidden/invalids

Use the iterator built inside the object (`Symbol.iterator`).

```ts
for (const [source, target, link_data] of topology) {
    // source and target are strings (protein accession numbers)
    // link_data is a HoParameterSet

    // To check if the current link is valid, use .visible and .isEmpty
    if (link_data.visible && !link_data.isEmpty) {
        // Link is visible and valid !
    }
}
```

- Iterate through visible links

Use the `.iterVisible()` method.

```ts
for (const [source, target, link_data] of topology.iterVisible()) {
    // Link is visible and valid
}
```

---

### Iterate through the nodes or links

If the graph is built, with `.constructGraph()` method, you can iterate directly through the nodes and links of the graph.

When you iterate through the graph, you **only have access to visible and valid nodes and links.**

```ts
topology.constructGraph();

for (const [id, data] of topology.nodes) {
    // id is the protein accession number,
    // data is a NodeGraphComponent object
}

for (const [nodes, data] of topology.links) {
    // nodes is a tuple of two strings, source and target nodes
    // data is a HoParameterSet
}
```

---

### Add artefactual data

You can add "fakes" edges and nodes in the network. A fake edge is an edge that is destroyed in a object rebuild.

The method `createArtefactual(edgeData: ArtefactalEdgeData, mitabs?: ArtefactualMitabData[])` is built for that, and create one additionnal edge. If the linked nodes does not exists, so they're created too.

In order to see the additionnal edge, you must reconstruct the graph with `.constructGraph()` after.

```ts
let topo: OmegaTopology;

// Defining specification of the proteins and specie
const id1 = "P14292";
const id2 = "P58393";
const TAXID_SPECIE = "13832";

// Create a edge with two interaction supports
topo.createArtefactual({ /** First, the edge data */
    source: id1,
    target: id2
}, [{ /** Then, optional interaction support */
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

// Reconstructing the graph
topo.constructGraph();
```

---

### Access to UniProt or GO Terms data

Use the `.uniprot_container` and the `.go_terms` accessor to access respectively to UniProt data and GO terms data (see **Register (GO Terms/UniProt) data** usage).

---

### Get all the registred interactors in the network

The registred interactors are stored inside the `PSICQuic` object. An accessor is available over a `OmegaTopology` instance with `.psi`.

If you want to iterate over the records, you just have to do:

```ts
for (const line of topology.psi) {
    // line is a PSQData
    // Do whatever you want with the line !
}
```

You can get all the existing interactors (inside the interolog network) in the `OmegaTopology` object with `.uniqueTemplatePairs()`.
It will give you every interacting homolog pairs.

```ts
// pairs is a [string, string][]
const pairs = topology.uniqueTemplatePairs();
```

If you have already downloaded the MI Tab lines, you can get lines linked to a couple of interactors.

```ts
for (const [id1, id2] of pairs) {
    // Lines for those two interactors
    // lines is a PSQData[]
    const lines = topology.psi.getCouple(id1, id2);
}
```

### Get all the registered interactors in the MI Tab container

Once you've built a `PSICQuic` object, you can obtain all the pairs of partners of this instance, with `.getAllPartnersPairs()`.

```ts
// pairs will be an object { [interactorId: string]: Array<string> }
const pairs = psi.getAllPartnersPairs();
```

Remember that you can iterate over the couples inside the object with `.couples()` iterator.

```ts
for (const [id1, id2, lines] of psi.couples()) {
    // do smth with lines..
}
```
