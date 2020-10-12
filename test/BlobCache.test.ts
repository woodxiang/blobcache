import BlobCache from "../src/BlobCache";

test("BlobCache Create", () => {
  expect(new BlobCache("testdb", "teststore", 2)).toBeInstanceOf(BlobCache);
});
