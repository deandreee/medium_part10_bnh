const { Advices, StratBase, validateSettings } = require("./StratBase");

const I = require("../../indicators");

class Strat extends StratBase {
  get toml() {
    return {
      xma: I.XMA.EMA,
      period: "7d",
      xma_non_wave: true,
    };
  }

  init() {
    super.init();

    const { period, xma, xma_non_wave } = this.settings;
    validateSettings("rx_xma_single", this.settings, ["period"]);

    if (xma_non_wave) {
      this.ind.ma = this.createInd(I.XMA, { xma, period });
    } else {
      this.ind.ma = this.createXMAWave(xma, period);
    }
  }

  checkCore() {
    const ma = this.ind.ma.result;
    if (!ma) {
      return Advices.NONE;
    }

    return this.candle.close > ma ? Advices.LONG : Advices.SHORT;
  }
}

module.exports = new Strat();
