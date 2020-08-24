const { Advices, StratBase, validateSettings } = require("./StratBase");

const { rangeClassify } = require("../utils");

const I = require("../../indicators");

class Strat extends StratBase {
  get toml() {
    return {
      xma: I.XMA.ZeroLagHATEMA,
      xma_non_wave: true,

      short: "1d",
      long: "30d",
      cooldown_period: "3h",
    };
  }

  init() {
    super.init();

    const { short, long, xma, xma_non_wave, xma_candle_size } = this.settings;
    validateSettings("rx_xma", this.settings, ["short", "long"]);

    if (xma_non_wave) {
      this.ind.short = this.createInd(I.XMA, { xma, period: short });
      this.ind.long = this.createInd(I.XMA, { xma, period: long });
    } else {
      this.ind.short = this.createXMAWave(xma, short, xma_candle_size);
      this.ind.long = this.createXMAWave(xma, long, xma_candle_size);
    }
  }

  checkCore() {
    return this.checkCoreStd();
  }

  checkCoreStd() {
    const short = this.ind.short.val;
    const long = this.ind.long.val;
    if (!short || !long) {
      return Advices.NONE;
    }

    if (short > long) {
      return Advices.LONG;
    } else if (short < long) {
      return Advices.SHORT;
    } else {
      return Advices.NONE;
    }
  }
}

module.exports = new Strat();
