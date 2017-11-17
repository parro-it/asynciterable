import test from "tape-async";
import AsyncIterable from ".";
import isIterable from "is-iterable";

function intoAsyncIterable(source) {
  if (isIterable(source)) {
    return new AsyncIterable((write, end) => {
      source.forEach(write);
      end();
    });
  }
}

test("write chunk async", async t => {
  const result = [];
  const numbers = new AsyncIterable((write, end) => {
    const w = n => setTimeout(() => write(n), n * 100);
    w(3);
    w(1);
    w(2);
    setTimeout(end, 400);
  });
  for await (const n of numbers) {
    result.push(n);
  }

  t.is(numbers._chunksBuffer.length, 0);
  t.is(numbers._awaitingIteration, null);
  t.true(numbers._ended);

  t.deepEqual(result, [1, 2, 3]);
});

test("write chunk sinc", async t => {
  const result = [];
  const numbers = intoAsyncIterable([1, 2, 3]);

  for await (const n of numbers) {
    result.push(n);
  }

  t.is(numbers._chunksBuffer.length, 0);
  t.is(numbers._awaitingIteration, null);
  t.true(numbers._ended);

  t.deepEqual(result, [1, 2, 3]);
});

test("end accept a last chunk", async t => {
  const result = [];
  const numbers = intoAsyncIterable([1, 2, 3]);
  for await (const n of numbers) {
    result.push(n);
  }

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
