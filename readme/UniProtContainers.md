# UniProtContainer

This container could store UniProt data, fetched from `omega-topology-uniprot` micro-service. For performances issues, only a bunch of information is loaded in normal utilisation, under the form of objets implementing `TinyProtein` interface.

If you want the full information, the container is able to download the full `UniprotProtein` objects.

This container has a cache for both types of objects, so a protein already downloaded will not be re-fetched if a second get call is made.

## Property

- `uniprot_url: string`: omega-topology-uniprot URL

## Methods

### .bulkTiny(...prot_ids: string[]) : Promise

Fetch and register `TinyProtein` objects inside the container. Useful if you want to get later UniProt informations or search by annotation.

```ts
let up: UniprotContainer;

// Load informations of some proteins
await up.bulkTiny("P24829", "Q29482", "P48223");
```

### .searchByAnnotation(query: string | RegExp) : string[]

Search inside keywords, gene or protein names. Returns protein IDs that match the query.

```ts
// Search proteins that match a query !
const matched = up.searchByAnnotation("DNA");
```

### .getTiny(id: string) : TinyProtein

Get a single `TinyProtein` object.
If not found, return `undefined`.

### .getFullProtein(id: string) : Promise<UniprotProtein>

Get a single `UniprotProtein` object, and fetch it automatically if needed.

```ts
const full_infos = await up.getFullProtein("P23483");
```


## Interfaces

`TinyProtein` or `UniprotProtein` interfaces and data are defined in `UniprotContainer.ts` (use the Jump to definition function of your favorite editor to get it !).

# GoTermsContainer

Store GO Terms and link the GO ID to protein IDs and GO Term name.

Main methods are:

- `add(prots: ProtGOTerms)`

- `search(term: string)`: Return a list of protein IDs that have the GO term `term`.

- `query(query: string | RegExp)`: Return a list of GO Terms where their name match the query.

- `getNameOfTerm(term_id: string)`: Get the name of a GO Term by its ID.

- `searchByProt(prot_id: string)`: Get all the GO Terms of a protein. **WARNING**: This function is `O(n)` complexity.
