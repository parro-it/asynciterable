/**
 * A class that implement the `async iterable` JavaScript pattern,
 * using a semantic similar to the promise one.
 *
 *
 */
export default class AsyncIterable {
  write(chunk) {
    if (this._awaitingIteration) {
      // Resolve the awaiting iteration
      this._awaitingIteration.resolve({
        done: false,
        value: chunk
      });
      this._awaitingIteration = null;
    } else {
      // Buffer this chunk
      this._chunksBuffer.push(chunk);
    }
  }

  end(chunk) {
    if (typeof chunk !== "undefined") {
      this.write(chunk);
    }

    // All previously iteration promised should resolve
    // to done
    if (this._awaitingIteration && this._chunksBuffer.length === 0) {
      // Resolve the awaiting iteration
      this._awaitingIteration.resolve({
        done: true
      });

      this._awaitingIteration = null;
    }

    this._ended = true;
  }

  error(err) {
    // ? console.log({ err });
    // All previously iteration promised should be rejected
    if (this._awaitingIteration) {
      // ? console.log("_awaitingIteration", this._awaitingIteration);
      // Resolve the awaiting iteration
      this._awaitingIteration.reject(err);
      this._awaitingIteration = null;
    }
    // ? console.log("this._error");
    this._error = err;
  }

  /**
   * Create an AsyncIterable.
   *
   * @param {Function} executor A function that is passed with the arguments
   * write, end, error. The executor function is executed immediately by the
   * AsyncIterable implementation, passing write, end and error functions (the
   * executor is called before the AsyncIterable constructor even returns the created
   * object). The write function, when called, make the async iterable emit a new item.
   * The end function, when called, make the async iterable end. The error function make it
   * throw an error. The executor normally initiates some asynchronous work, and then,
   * once a new item is available, it emit it by calling the write function,
   * or else call the error function if an error occurred.
   * If an error is thrown in the executor function, any subsequent call to iterator next
   * is rejected with the same error.
   * The return value of the executor is ignored, unless if it is a promise. In this case,
   * when it fullfills to a rejection, error function is automatically called.
   */
  constructor(executor) {
    this._chunksBuffer = [];
    this._awaitingIteration = null;
    this._ended = false;

    const write = this.write.bind(this);
    const end = this.end.bind(this);
    const error = this.error.bind(this);

    const result = executor(write, end, error);
    if (result && typeof result.catch === "function") {
      result.catch(error);
    }
  }

  async next() {
    if (this._awaitingIteration) {
      return this._awaitingIteration.promise;
    }

    if (this._error) {
      // ? console.log("this._error throw!");

      throw this._error;
    }

    if (this._ended && this._chunksBuffer.length === 0) {
      // All previously iteration promised should resolve
      // to done
      if (this._awaitingIteration) {
        // Resolve the awaiting iteration
        this._awaitingIteration.resolve({
          done: true
        });

        this._awaitingIteration = null;
      }

      return {
        done: true
      };
    }

    if (this._chunksBuffer.length > 0) {
      return {
        value: this._chunksBuffer.shift(),
        done: false
      };
    }

    const iteration = {};

    iteration.promise = new Promise((resolve, reject) => {
      iteration.resolve = resolve;
      iteration.reject = reject;
    });
    this._awaitingIteration = iteration;

    return iteration.promise;
  }

  [Symbol.asyncIterator]() {
    return this;
  }
}
