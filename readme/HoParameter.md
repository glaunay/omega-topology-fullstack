# HoParameterSet and HoParameter

## HoParameterSet

### What's the point of this structure ?

The `HoParameterSet` object is an manager of homology data, more specificly the manager of the homology of the two *supposed* interactors.

For this reason, this is the information contained in a link of a interolog network.

The homology data is the information stored in the homology file (also called homology tree), so this structure contains the same data (BLAST hits).

This structure allow to filter (trim) the contained homologs are mark them "invalid". 
If one homolog of a couple is invalid, so the couple is too.
If any couple is valid, the `HoParameterSet` is empty / invalid.

### Instanciation

The instanciation and the management of this structure should not importunate you: Only `OmegaTopology` should create this type of object. If fact, `HoParameterSet` does not have any sort of constructor.


### Structure

`HoParameterSet` maintain three arrays, `lowQueryParam`, `highQueryParam` and `mitabCouples` inside the object.
All those arrays have the same length, the length of the homology data contained inside.

- lowQueryParam and highQueryParam are two linked arrays containing the homology information (the `HoParameter`) of respectivly, the lower md5 of the two protein IDs for **lowQueryParam**, and the higher md5 for **highQueryParam**.

- mitabCouples is a array containing the MI Tab lines (`MitabParameter[]`) that "proves" the interaction between the two interactors.

**`MitabParameter` is just a `PSQData` container, that can hold a `valid` status.**

---

`lowQueryParam`: `HoParameter[]`

`highQueryParam`: `HoParameter[]`

`mitabCouples`: `MitabParameter[][]` (each pairs of homolog can contain multiple interaction evidences)

---

For example,

If `P13284` and `P24932` are proteins of the specie of interest,

Supposing `P13284` is the lower ID and `P24932` the highest,

`lowQueryParam[0]` could be `O29472`, an homolog of `P13284`,

`highQueryParam[0]` could be `Q23849`, an homolog of `P24932`,

and `mitabCouples[0]` are the MI Tab lines that support the interaction between `O29472` and `Q23849`.

By inference and homology, we could determine that `P13284` and `P24932` interact.


---

`mitabCouples` array contains empty arrays by default, until the `OmegaTopology`'s method `.linkMitabLines()` is called (see [Register dynamically MI Tab interactions](../README.md#register_dyna) usage).


### Properties

Some properties are important, and you've already seen them.

`lowQueryParam` and `highQueryParam` store homology information, `mitabCouples` store interaction information of the homologs.

- `visible: boolean` property (**readonly**) tells if the link of the network is visible or not.

- `length: number` count the number of valid homologs in this instance

- `isEmpty: boolean` is `true` if none of the homologs is valid

- `templates: [string[], string[]]` gives you all the accession numbers of the valid homologs (first value of tuple: homologs of lowID, second: homologs of highID).

### Methods

- `add(x: HVector, y: HVector)`: Add a new couple of homologs. This do **NOT** add interaction support, they need to be added later with `OmegaTopology`'s `.linkMitabLines()`.
`HVector` is a array of string, the same present in the homology tree file, **but with the accessor of the homolog added in the first position**.

- `trim(TrimParameters)`: Trim the data of `HoParameterSet`. You should NOT use this function, it is the role of `OmegaTopology`'s `.trimEdges()` method !

- *static* `from(obj: object): HoParameterSet`: Unserialize an `HoParameterSet`.

### Iteration

- `@@iterator`: The classic iterator iterates through the homology data together. **Warning**: It iterates through valid and invalid couples, so take care of check if there's valid !

```ts
let hs: HoParameterSet;

for (const [lowQ, highQ] of hs) {
    // lowQ and highQ are HoParameter objects
    // lowQ and highQ are interactants homologs
}
```

- `full_iterator(visible_only = false)`: Iterator through homology data and interaction data. Use `visible_only = true` when you want to iterates on visible `HoParameter` only.

```ts
for (const [lowQ, highQ, interaction_support] of hs.full_iterator(true)) {
    // lowQ and highQ are valid HoParameters
    // interaction_support is a array of valid PSQDatas
}
```

## HoParameter

This container hold one homology support of one homolog.

You can use it to check homology details, have access to protein IDs, and more.

### Properties

- `valid: boolean`: True if the `HoParameter` is valid (if the `HoParameter` has passed through the last trim filters).

- `length: number`: Sequence length of the homolog

- `template: string`: Accession number

- `simPct: number`: Similarity sequence percentage

- `idPct: number`: Identity sequence percentage

- `cvPct: number`: Coverage sequence percentage

- `eValue: number`: BLAST computed e-value
