const { Advices, StratBase, validateSettings } = require("./StratBase");

const I = require("../../indicators");

class Strat extends StratBase {
  get toml() {
    return {
      candleSize: 120,
    };
  }

  init() {
    super.init();

    const stddev = this.settings.bb_stddev;
    const period = this.settings.bb_period;
    const xma = this.settings.bb_xma;
    const thr = this.settings.bb_thr;

    this.ind.bbands2 = this.createInd(I.BB4, {
      xma,
      period,
      stddev,
      bcSize: this.batchSize,
      thr,
    });

    const { bb_wt_period, bb_wt_thr = -1 } = this.settings;
    if (bb_wt_period) {
      this.ind.bbands_wt_zscore = new I.IndOnInd2({
        ind: new I.ZScore2(this.p(bb_wt_period)),
        // quick fix, I guess there are some NaNs for some XMAs in the beginning
        fn: () =>
          this.ind.bbands2.result &&
          !isNaN(this.ind.bbands2.result.upper) &&
          !isNaN(this.ind.bbands2.result.lower)
            ? this.ind.bbands2.result.upper - this.ind.bbands2.result.lower
            : null,
      });
    }

    const { vol_period, vol_z_period, vol_z_thr } = this.settings;
    if (vol_period) {
      this.ind.vol = this.createInd(I.Volume, vol_period);
      this.ind.vol_zscore = new I.IndOnInd2({
        ind: new I.ZScore(this.p(vol_z_period)),
        fn: () => this.ind.vol.result,
      });
    }
  }

  isHighVol() {
    if (!this.ind.vol_zscore) {
      return true;
    }

    const { vol_zscore } = this.ind;
    return vol_zscore.result > this.settings.vol_z_thr;
  }

  checkExitOn() {
    const { exit_on } = this.settings;
    if (!exit_on) {
      return false;
    }

    const { bbands2: bbands } = this.ind;
    const { upper_l, middle } = bbands;
    if (exit_on === "MID") {
      return this.candle.close < middle;
    }

    if (exit_on === "UPPER_L") {
      return this.candle.close < upper_l;
    }

    return false;
  }

  isBandsTight() {
    const { bb_wt_period } = this.settings;
    if (!bb_wt_period) {
      return true; // go for long
    }

    const { bbands_wt_zscore } = this.ind;
    return bbands_wt_zscore.result <= this.settings.bb_wt_thr;
  }

  checkCore() {
    const { bbands2: bbands } = this.ind;
    const { upper, lower } = bbands;

    const { core_no_short } = this.settings;

    // bbands ripped w/ volume
    const bbandsTight = this.isBandsTight();

    if (this.candle.close > upper && bbandsTight && this.isHighVol()) {
      return { advice: Advices.LONG, reason: "BOUT" };
    }

    if (this.checkExitOn() && bbandsTight && this.isHighVol()) {
      return { advice: Advices.SHORT, reason: this.settings.exit_on };
    }

    if (
      !core_no_short &&
      this.candle.close < lower &&
      bbandsTight &&
      this.isHighVol()
    ) {
      return { advice: Advices.SHORT, reason: "BOUT" };
    }
  }
}

module.exports = new Strat();
