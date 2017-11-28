import test from "tape-async";
import AsyncIterable from ".";
import isIterable from "is-iterable";
import concat from "ai-concat";

function intoAsyncIterable(source) {
  if (isIterable(source)) {
    return new AsyncIterable((write, end) => {
      for (const item of source) {
        write(item);
      }
      end();
    });
  }
}

test("throw sync if exception in factory", async t => {
  t.throws(
    () =>
      new AsyncIterable(() => {
        throw new Error("test");
      }),
    Error,
    "test"
  );
});

test("throw async in first iteration if error called", async t => {
  const iterable = new AsyncIterable((write, end, error) => {
    error(new Error("test"));
  });

  const err = await iterable.next().catch(err => err);

  t.is(err.message, "test");
});

test("throw async in first iteration if factory rejected", async t => {
  const iterable = new AsyncIterable(async () => {
    throw new Error("test");
  });

  const err = await iterable.next().catch(err => err);

  t.is(err.message, "test");
});

test("write chunk async", async t => {
  const numbers = new AsyncIterable((write, end) => {
    const w = n => setTimeout(() => write(n), n * 100);
    w(3);
    w(1);
    w(2);
    setTimeout(end, 400);
  });
  const result = await concat.obj(numbers);

  t.is(numbers._chunksBuffer.length, 0);
  t.is(numbers._awaitingIteration, null);
  t.true(numbers._ended);

  t.deepEqual(result, [1, 2, 3]);
});

test("write chunk sinc", async t => {
  const numbers = intoAsyncIterable([1, 2, 3]);

  const result = await concat.obj(numbers);

  t.is(numbers._chunksBuffer.length, 0);
  t.is(numbers._awaitingIteration, null);
  t.true(numbers._ended);

  t.deepEqual(result, [1, 2, 3]);
});

test("end accept a last chunk", async t => {
  const numbers = intoAsyncIterable([1, 2, 3]);
  const result = await concat.obj(numbers);

  t.is(numbers._chunksBuffer.length, 0);
  t.is(numbers._awaitingIteration, null);
  t.true(numbers._ended);
  t.deepEqual(result, [1, 2, 3]);
});

test("next can be called sync", async t => {
  const numbers = new AsyncIterable((write, end) => {
    write(1);
    end();
  });

  const firstIteration = numbers.next();
  const secondIteration = numbers.next();
  const thirdIteration = numbers.next();

  const [first, second, third] = await Promise.all([
    firstIteration,
    secondIteration,
    thirdIteration
  ]);

  t.is(numbers._chunksBuffer.length, 0);
  t.is(numbers._awaitingIteration, null);
  t.true(numbers._ended);

  t.deepEqual(
    [first, second, third],
    [{ done: false, value: 1 }, { done: true }, { done: true }]
  );
});
