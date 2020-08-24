const { Advices, StratBase, validateSettings } = require("./StratBase");

const I = require("../../indicators");

class Strat extends StratBase {
  get toml() {
    return {
      xma: I.XMA.EMA,
      xma_period: "7d",
      reg_period: "1d",
    };
  }

  init() {
    super.init();

    const { xma, xma_period, reg_period } = this.settings;
    validateSettings("rx_xma_slope", this.settings, [
      "xma",
      "xma_period",
      "reg_period",
    ]);

    this.ind.exp_reg_xma = this.createInd(I.ExpRegXMA, {
      xma,
      xma_period,
      reg_period,
    });
  }

  checkCore() {
    const { slope } = this.ind.exp_reg_xma.result;
    if (!slope) {
      return Advices.NONE;
    }

    return slope > 0 ? Advices.LONG : Advices.SHORT;
  }
}

module.exports = new Strat();
