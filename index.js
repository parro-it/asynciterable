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
    // All previously iteration promised should be rejected
    if (this._awaitingIteration) {
      // Resolve the awaiting iteration
      this._awaitingIteration.reject(err);
      this._awaitingIteration = null;
    }
    this._error = err;
  }

  constructor(factory) {
    this._chunksBuffer = [];
    this._awaitingIteration = null;
    this._ended = false;
    factory(this.write.bind(this), this.end.bind(this), this.error.bind(this));
  }

  async next() {
    if (this._awaitingIteration) {
      return this._awaitingIteration.promise;
    }

    if (this._error) {
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
