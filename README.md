# asynciterable

[![Travis Build Status](https://img.shields.io/travis/parro-it/asynciterable/master.svg)](http://travis-ci.org/parro-it/asynciterable)
[![NPM downloads](https://img.shields.io/npm/dt/asynciterable.svg)](https://npmjs.org/package/asynciterable)

> Async iterable class

AsyncIterable is a class that implement the `async iterable` JavaScript pattern,
using a semantic similar to the promise one.

## Usage

Create an async iterable that emit three numbers:

```js
import AsyncIterable from 'asynciterable';

const numbers = new AsyncIterable((write, end, error) => {
  write(1);
  write(2);
  write(3);
  end();
});

for await (const n of numbers) {
  console.log(n)
}

// Output: 1\n2\n3\n
```

## API

## Install

With [npm](https://npmjs.org/) installed, run

```bash
npm install --save asynciterable
```

## See Also

* [`noffle/common-readme`](https://github.com/noffle/common-readme)

## License

MIT
