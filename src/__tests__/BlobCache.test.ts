import BlobCache from '../BlobCache';
import 'fake-indexeddb/auto';
import delay from '../delay';

test('BlobCache Create', () => {
  expect(new BlobCache('testdb', 2)).toBeInstanceOf(BlobCache);
});

test('BlobCache open', async () => {
  const blobCache1 = new BlobCache<string>('testdb', 2);
  await blobCache1.openAsync();
  expect(blobCache1.opened).toEqual(true);

  const blobCache2 = new BlobCache<string>('testdb', 2);
  await blobCache2.openAsync();
  expect(blobCache2.opened).toEqual(true);
});

test('BlobCache insert into same db', async () => {
  const blobCache1 = new BlobCache<string>('testdb', 2);
  await blobCache1.openAsync();
  expect(blobCache1.opened).toEqual(true);

  const blobCache2 = new BlobCache<string>('testdb', 2);
  await blobCache2.openAsync();
  expect(blobCache2.opened).toEqual(true);

  const s1 = await blobCache1.insertAsync('test data 1', 'test data 1');
  const s2 = await blobCache2.insertAsync('test data 2', 'test data 2');

  expect(s1).toEqual(true);
  expect(s2).toEqual(true);
});

test('BlobCache insert into different db', async () => {
  const blobCache1 = new BlobCache<string>('testdb1', 2);
  await blobCache1.openAsync();
  expect(blobCache1.opened).toEqual(true);

  const blobCache2 = new BlobCache<string>('testdb2', 2);
  await blobCache2.openAsync();
  expect(blobCache2.opened).toEqual(true);

  const s1 = await blobCache1.insertAsync('test data 1', 'test data 1');
  const s2 = await blobCache2.insertAsync('test data 2', 'test data 2');

  expect(s1).toEqual(true);
  expect(s2).toEqual(true);

  const dataCount = await blobCache1.getRecordCount();
  expect(dataCount).toEqual(1);
});

test('BlobCache delete', async () => {
  const blobCache1 = new BlobCache<string>('testdb1', 2);
  await blobCache1.openAsync();
  expect(blobCache1.opened).toEqual(true);

  await delay(1200);
  const s1 = await blobCache1.insertAsync('test data 3', 'test data 3');

  expect(s1).toEqual(true);

  const result = await blobCache1.CleanToDate(1 / (24 * 3600));
  expect(result).toEqual(1);
});
