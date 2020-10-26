import * as wrapper from '../indexdbwrap';
import 'fake-indexeddb/auto';

test('raw indexdb api test', async () => {
  interface DataItem<T> {
    indexKey: string;
    lastAccess: Date;
    data: T;
  }
  const dbName = 'rawIndexDb';
  const storeName = 'storeName';
  const openPromise = wrapper.OpenDBRequest2Promise(
    indexedDB.open(dbName, 1),
    (newdb) => {
      const store = newdb.createObjectStore(storeName, { keyPath: 'indexKey' });
      store.createIndex('lastAccess', 'lastAccess', { unique: false });
    }
  );

  const db = await openPromise;

  {
    // add test data
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    const newData1: DataItem<string> = {
      indexKey: 'data 1',
      lastAccess: new Date(2020, 1, 1),
      data: 'data content 1',
    };

    const newData2: DataItem<string> = {
      indexKey: 'data 2',
      lastAccess: new Date(2020, 1, 2),
      data: 'data content 2',
    };

    await wrapper
      .Request2Promise(store.add(newData1))
      .then(() => {
        console.log('new data added.');
      })
      .catch((reason) => {
        console.error('add data failed', (reason as DOMException).message);
      });

    await wrapper
      .Request2Promise(store.add(newData2))
      .then(() => {
        console.log('new data added.');
      })
      .catch((reason) => {
        console.error('add data failed', (reason as DOMException).message);
      });

    const bRet = await wrapper.Transaction2Promise(transaction);
    expect(bRet).toBeTruthy();
  }

  {
    // test get data
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    const index = store.index('lastAccess');
    const result = await wrapper.Request2Promise(
      index.getAll(IDBKeyRange.upperBound(new Date(2020, 1, 1)))
    );

    result.forEach(async (v) => {
      const item = v as DataItem<string>;
      console.log(`to remove ${item.indexKey}`);
      await wrapper.Request2Promise(store.delete(item.indexKey));
    });

    // check remained data
    const result2 = await wrapper.Request2Promise(store.getAllKeys());

    expect(result2.length).toEqual(1);

    const bRet = await wrapper.Transaction2Promise(transaction);
    expect(bRet).toBeTruthy();
  }

  {
    // test get data failed.
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    let isSucceeded = false;
    const result = await wrapper
      .Request2Promise(store.getKey('not exists'))
      .then((v) => {
        console.log(`the result is ${v}`);
        isSucceeded = v !== undefined;
      })
      .catch((v) => {
        console.log(`the result is ${v}`);
        isSucceeded = false;
      });

    expect(isSucceeded).toBeFalsy();
    expect(result).toBeUndefined();
  }

  db.close();
});
