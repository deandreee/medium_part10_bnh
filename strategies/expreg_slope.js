const { Advices, StratBase, validateSettings } = require("./StratBase");

const I = require("../../indicators");

class Strat extends StratBase {
  get toml() {
    return {
      reg_period: "1d",
    };
  }

  init() {
    super.init();

    const { reg_period } = this.settings;
    validateSettings("expreg_slope", this.settings, ["reg_period"]);

    this.ind.expReg = this.createInd(I.ExpReg, reg_period, {
      bcSize: this.batchSize,
    });
  }

  checkCore() {
    const { slope } = this.ind.expReg;
    if (!slope) {
      return Advices.NONE;
    }

    return slope > 0 ? Advices.LONG : Advices.SHORT;
  }
}

module.exports = new Strat();
