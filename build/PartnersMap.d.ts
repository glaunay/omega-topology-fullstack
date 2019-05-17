export default class PartnersMap {
    protected interactions: {
        [id: string]: string[];
    };
    protected url: string;
    constructor({ filename, database_url }?: {
        filename?: any;
        database_url?: any;
    });
    classicGet(id: string): [string, string][];
    getAll(id: string): AsyncIterableIterator<[string, string]>;
    bulkGet(ids: Iterable<string>, packet_len?: number): AsyncIterableIterator<{
        [id: string]: {
            partners: string[];
        };
    }>;
}
