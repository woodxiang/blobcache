import {
  OpenDBRequest2Promise,
  Transaction2Promise,
  Request2Promise,
} from './indexdbwrap';

/**
 * Data item to store in db.
 */
interface DataItem<T> {
  indexKey: string;
  lastAccess: number;
  data: T;
}

/**
 * Clas BlobCache to cache things in indexed db.
 */
export default class BlobCache<T> {
  db: IDBDatabase | undefined;

  dbName: string;

  storeName: string;

  dbVersion: number;

  /**
   * Constructor
   * @param dbName database name
   * @param dbVersion version, in integer
   */
  constructor(dbName: string, dbVersion: number) {
    this.dbName = dbName;
    this.storeName = 'cache-store';
    this.dbVersion = dbVersion;
  }

  /**
   * return ture is db was opened.
   */
  get opened(): boolean {
    return this.db !== undefined;
  }

  /**
   * Open DB
   */
  async openAsync(): Promise<IDBDatabase> {
    if (this.db !== undefined) {
      throw new Error('db already opened.');
    }
    const openReqest = indexedDB.open(this.dbName, this.dbVersion);
    const openPromise = OpenDBRequest2Promise(openReqest, (newdb) => {
      // create schema of the dabase.
      const store = newdb.createObjectStore(this.storeName, {
        keyPath: 'indexKey',
      });
      store.createIndex('lastAccess', 'lastAccess', { unique: false });
    });

    this.db = await openPromise;
    return this.db;
  }

  /**
   * Close the db
   */
  close(): void {
    if (this.db === undefined) {
      throw new Error('db was not opened.');
    }

    this.db.close();
  }

  /**
   *
   * @param days remove the data not accessed days ago.
   */
  async CleanToDate(days: number): Promise<number> {
    if (this.db === undefined) {
      await this.openAsync();
    }

    if (this.db === undefined) {
      throw Error('db not opened.');
    }

    const date = Date.now() - days * 24 * 3600 * 1000;

    const tranaction = this.db.transaction([this.storeName], 'readwrite');
    const dataStore = tranaction.objectStore(this.storeName);

    const index = dataStore.index('lastAccess');
    const toRemoves = await Request2Promise(
      index.getAll(IDBKeyRange.upperBound(date))
    );

    toRemoves.forEach(async (v) => {
      const item = v as DataItem<T>;
      await Request2Promise(dataStore.delete(item.indexKey));
    });

    await Transaction2Promise(tranaction);

    return toRemoves.length;
  }

  async getRecordCount(): Promise<number> {
    if (this.db === undefined) {
      await this.openAsync();
    }

    if (this.db === undefined) {
      throw Error('db not opened.');
    }

    const transaction = this.db.transaction([this.storeName], 'readonly');
    const promise = Transaction2Promise(transaction);

    const dataStore = transaction.objectStore(this.storeName);
    const result = await Request2Promise(dataStore.getAllKeys());

    if (await promise) {
      return result.length;
    }

    throw Error('get record count failed.');
  }

  /**
   * insert data into database.
   * @param key key of the data
   * @param data data
   */
  async insertAsync(key: string, data: T): Promise<boolean> {
    if (this.db === undefined) {
      await this.openAsync();
    }

    if (this.db === undefined) {
      throw Error('db not opened.');
    }

    // create transaction.
    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const promise = Transaction2Promise(transaction);
    promise.catch((reason) => {
      console.error('insert transaction failed.', reason);
    });

    const newItem: DataItem<T> = {
      indexKey: key,
      lastAccess: Date.now(),
      data,
    };

    const store = transaction.objectStore(this.storeName);

    // check data exists.
    const queriedKey = await Request2Promise(store.getKey(key));
    if (queriedKey !== undefined) {
      return false;
    }

    // add new data
    const addReq = store.add(newItem);

    const addRequestPromise = Request2Promise<IDBValidKey>(addReq);
    addRequestPromise.catch((reason) => {
      console.error('Add data failed.', (reason as DOMException).message);
    });

    await addRequestPromise;
    const ret = await promise;

    return ret;
  }

  /**
   * check exists key.
   * @param key the key of the data to query
   */
  async existAsync(key: string): Promise<boolean> {
    if (this.db === undefined) {
      await this.openAsync();
    }

    if (this.db === undefined) {
      throw new Error('db not open');
    }

    // create transaction
    const req = this.db.transaction([this.storeName], 'readwrite');
    const promise = Transaction2Promise(req);
    promise.catch((reason) => {
      console.error('get data failed.', reason);
    });

    const store = req.objectStore(this.storeName);

    // get key.
    const getReq = store.getKey(key);
    const result = await Request2Promise(getReq);
    await promise;
    return result !== undefined;
  }

  /**
   * pick data from database. by key.
   * @param key key of the data to pick
   */
  async pickAsync(key: string): Promise<T | undefined> {
    if (this.db === undefined) {
      await this.openAsync();
    }

    if (this.db === undefined) {
      throw new Error('db not open');
    }

    // create transaction
    const req = this.db.transaction([this.storeName], 'readwrite');
    const promise = Transaction2Promise(req);
    promise.catch((reason) => {
      console.error('get data failed.', reason);
    });

    const store = req.objectStore(this.storeName);

    // get data.
    const getReq = store.get(key);
    const result = await Request2Promise<DataItem<T>>(getReq);

    // update last access data
    if (result) {
      result.lastAccess = Date.now();
      const putReq = store.put(result);
      await Request2Promise<IDBValidKey>(putReq);
    }

    await promise;
    return Promise.resolve(result.data);
  }
}
