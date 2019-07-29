# PSICQuic and its children

The PSICQuic container is a big administrator of MI Tab interaction data.

A `PSICQuic` instance manage the MI Tab records, stored in the `.records` property.

The MI Tab records are, in fact, stored line by line in the container.
Each line is held by a `PSQData` instance, which store itself every field inside `PSQDatum` objects.

The tree structure of MI Tab storage can be simplified by this schema:

- PSICQuic instance : Manager, numerous methods
    - PSQData : One line, one record
        - PSQDatum : One field, but can hold multiple values of one field (differents alternate IDs, multiple publications...)
            - PSQField : One value of one field

In normal condition, you should not manipulate `PSQDatum` or `PSQField` instances, always and only refer to `PSQData`s or the `PSICQuic` manager when you want to get or parse MI Tab lines.

## The PSICQuic manager

### Properties

#### .records

You have a direct access to `PSQData` records using this accessor. Records are stored in a `ReversibleKeyMap`, a map with two keys and one value, that store the lines linked to a couple of interactors.

- records: `ReversibleKeyMap`
    - "P19320"+"Q27842"
        - line 1
        - line 2
        - ...
    - "P19320"+"O37242"
        - line 1
        - ...

The map let you access the data in two ways, when you know the two keys (access to every interaction implying two specific proteins) or with only one key (when you want to know the interactors of one protein).

Those two methods returns `undefined` if couple / protein does not exists in the container.

The order of the protein IDs when you look for a couple *is not relevant*.

```ts
let psi: PSICQuic;

// Get the lines associated with a specific couple
const lines: PSQData[] = psi.records.get("P19320", "Q27842");

// Get the interactors and lines associated to one protein
const ia: Map<string, PSQData[]> = psi.records.getAllFrom("P19320");
```

### Methods

Only the meaningfull methods for a end-user are showed.

#### .getCouple(id1: string, id2: string) : PSQData[]

You can get a specify couple using the `PSICQuic` instance itself.
Order of keys is not important.

```ts
// equivalent to psi.records.get()
// If couple does not exists, return a empty array.
const lines = psi.getCouple("P19320", "Q27842");
```

#### .get(id: string) : PSQData[]

You can also get all the `PSQData`s linked to a protein.

```ts
// If protein does not exists, return a empty array.
const lines = psi.get("P19320");
```

#### .has(id: string) : boolean

Test if a protein has at least one record inside the object.

```ts
psi.has("P19320"); // true
```

#### .hasCouple(id1: string, id2: string) : boolean

Test if a couple of interactors has at least one record inside the object.

```ts
psi.has("P19320", "Q27842"); // true
```

#### .read(filename: string, with_progress: boolean) : Promise&lt;any&gt;

This method is **Node.js only**.

Read a MI Tab file and load every line as a record inside the object.
This is **very** RAM unefficient and may be long (count around 30 to 60 seconds to load a 500 MB file).

The `with_progress` boolean is the activator of a load progress bar in stdout. `progress` package must be installed.

This method is asynchronous and return a `Promise`, which is fulfilled when read is over.

```ts
await psi.read("records.mitab", false);
```

#### .readLines(lines: string | string[]) : PSQData[]

Read raw MI Tab lines and register them inside records.

If `lines` parameter is a `string`, it will be splitted by `\n`. If `lines` is a array, it will assume that each value is a single MI Tab line.

Return inserted `PSQData` in the object (can be ignored).

```ts
const raw_lines = getBunchOfRawMitab();
psi.readLines(raw_lines);
```

#### .add(...psq: PSQData[]) : void

Add numerous `PSQData` objects to the container.

Useful if you get some records from other methods or if you create records by yourself.

```ts
psi.add(new PSQData(raw_line));
```

#### @@iterator

The iterator of `PSICQuic` allows you to see each stored `PSQData`.

```ts
for (const psq_data of psi) {
    // psq_data is a PSQData
}
```

#### .getAllLinesPaired() and .getAllPartnersPairs()

Useful to get a résumé of all the interactors stored inside the records object (see code documentation).

Note the `.getAllLinesPaired()` only work if you create the lines with `keep_raw` option activated.

## The PSQData container

One MI Tab line. Multiple possibilites.

### Properties

#### .data: PSQDatum[]

Contain all the `PSQDatum` of the container.

#### .ids: [string, string]

Tuple of the two interactors IDs.

```ts
data.ids; // ["P42432", "Q24232"]
```

#### .taxid: [string, string]

Taxonomic IDs of the two interactors.

#### .interactionDectectionMethod: string

Detection method ID of this interaction. 

### Methods

#### .equal(other: PSQData) : boolean

Return `true` if current and other PSQData are supposed to be equal.

#### .toString() : string

Try to restore the line as it used to be in raw format.

#### rawField(name: string) : string

Return a raw formatted MI Tab field, obtained by his name.

```ts
const p = new PSQData(raw_line);

p.rawField("idB"); // could be "P42942"
```
