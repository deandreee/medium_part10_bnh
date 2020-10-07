const IndBase = require("../IndBase");
const { Queue } = require("../../strategies/utils");

/// This is an implementation of the 2-pole and 3-pole Butterworth Filters, as published by
/// John F. Ehlers in his book "Cybernetic Analysis for Stocks and Futures".

// defaults btw
// private int period = 20;
// private int poles = 3;

class SuperSmoother extends IndBase {
  constructor({ period, poles }, props) {
    if (poles !== 2 && poles !== 3) {
      throw new Error("SuperSmoother: poles should be between (2|3)");
    }

    if (!period) {
      throw new Error("SuperSmoother: period not defined: " + period);
    }

    // indicator itself uses, need to force
    super({ ...props, resultHistory: true });

    this.input = "price";
    this.period = period;
    this.poles = poles;

    this.calcCoeffs();

    this.age = 0;
    this.result = null;
    this.queue = new Queue(5); // 3 or 5 actually but whatever
  }

  reset() {
    this.result = null;
    this.queue = new Queue(5);
  }

  calcCoeffs() {
    const pi = Math.PI;
    const sq2 = Math.sqrt(2.0);
    const sq3 = Math.sqrt(3.0);
    if (this.poles === 2) {
      const a1 = Math.exp((-sq2 * pi) / this.period);
      const b1 = 2 * a1 * Math.cos((sq2 * pi) / this.period);
      this.coeff2 = b1;
      this.coeff3 = -a1 * a1;
      this.coeff1 = 1 - this.coeff2 - this.coeff3;
    } else if (this.poles === 3) {
      const a1 = Math.exp(-pi / this.period);
      const b1 = 2 * a1 * Math.cos((sq3 * pi) / this.period);
      const c1 = a1 * a1;

      this.coeff2 = b1 + c1;
      this.coeff3 = -(c1 + b1 * c1);
      this.coeff4 = c1 * c1;
      this.coeff1 = 1 - this.coeff2 - this.coeff3 - this.coeff4;
    }
  }

  getPrev(i) {
    const q = this.queue.values;
    if (q.length < i) {
      throw new Error(
        `SuperSmoother: getPrev(${i}) not enough candles (${q.length})`
      );
    }

    return q[q.length - i];
  }

  // not sure how this works with reset ...
  isReady() {
    return this.age >= this.period;
  }

  updateCore(price) {
    this.age++;

    if (this.queue.values.length < this.poles) {
      this.queue.enqueue(price);
      return price;
    }

    let recurrentPart;
    if (this.poles === 2) {
      recurrentPart =
        this.coeff2 * this.getPrev(1) + this.coeff3 * this.getPrev(2);
    } else if (this.poles === 3) {
      recurrentPart =
        this.coeff2 * this.getPrev(1) +
        this.coeff3 * this.getPrev(2) +
        this.coeff4 * this.getPrev(3);
    }

    this.result = recurrentPart + this.coeff1 * price;
    this.queue.enqueue(this.result);
    return this.result; // takes few 10s of results to run up to real price, we still need those results but should not show in chart ... :/
  }
}

module.exports = SuperSmoother;
