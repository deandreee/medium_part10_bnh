const { Advices, StratBase, validateSettings } = require("./StratBase");

const { rangeClassify } = require("../utils");

const I = require("../../indicators");

class Strat extends StratBase {
  get toml() {
    return {
      candleSize: 30,

      check_var: "SL_EXIT",
      batchSize: 30,
      high_multi: -3,
      high_period: "1d",
      high_source: "HILO",
    };
  }

  init() {
    super.init();

    const { high_period, high_multi, high_source } = this.settings;
    validateSettings("hilo", this.settings, ["high_period", "high_multi"]);

    this.ind.high = this.createInd(I.High, high_period, {
      high_multi,
      high_source,
    });
    this.ind.low = this.createInd(I.Low, high_period, {
      high_multi,
      high_source,
    });

    const { dx_period, dx_candleSize, dx_thr } = this.settings;
    if (dx_period) {
      this.ind.dx2 = this.createXm(I.DX2, dx_period, dx_candleSize);
    }
  }

  dxOK() {
    if (!this.ind.dx2) {
      return true;
    }

    return this.ind.dx2.result > this.settings.dx_thr;
  }

  checkCore() {
    return this.checkCoreStd();
  }

  checkCoreStd() {
    if (this.ind.high.isNew()) {
      return Advices.LONG;
    } else if (this.ind.low.isNew()) {
      return Advices.SHORT;
    }
    return Advices.NONE;
  }
}

module.exports = new Strat();
