const { Advices, StratBase, validateSettings } = require("../rx/StratBase");

const I = require("../../indicators");

// from here: https://github.com/Dodo33/gekko-supertrend-strategy

class Strat extends StratBase {
  get toml() {
    return {
      atrEma: 7,
      bandFactor: 3,
      atr_type: "raw",
    };
  }

  init() {
    super.init();

    const { atr_type, atrEma } = this.settings;
    if (atr_type === "raw") {
      this.ind.atr = this.createInd(I.ATR, atrEma);
    } else if (atr_type === "xm") {
      this.ind.atr = this.createXm(I.ATR, atrEma, 1440);
    } else if (atr_type === "round") {
      this.ind.atr = this.createRound(I.ATR, atrEma, 1440);
    } else {
      throw new Error("Unknown atr_type");
    }

    this.bought = 0;

    this.supertrend = {
      upperBandBasic: 0,
      lowerBandBasic: 0,
      upperBand: 0,
      lowerBand: 0,
      supertrend: 0,
    };
    this.lastSupertrend = {
      upperBandBasic: 0,
      lowerBandBasic: 0,
      upperBand: 0,
      lowerBand: 0,
      supertrend: 0,
    };
    this.lastCandleClose = 0;

    this.__hist = {
      supertrend: [],
      supertrend_upper: [],
      supertrend_lower: [],
    };
  }

  updateCore() {
    // hack to go through ind sanity length check
    if (!this.shouldCallCheck()) {
      this.__hist.supertrend.push(null);
      this.__hist.supertrend_upper.push(null);
      this.__hist.supertrend_lower.push(null);
    }
  }

  checkCore() {
    const candle = this.candle;
    const atrResult = this.ind.atr.result;

    this.supertrend.upperBandBasic =
      (candle.high + candle.low) / 2 + this.settings.bandFactor * atrResult;
    this.supertrend.lowerBandBasic =
      (candle.high + candle.low) / 2 - this.settings.bandFactor * atrResult;

    if (
      this.supertrend.upperBandBasic < this.lastSupertrend.upperBand ||
      this.lastCandleClose > this.lastSupertrend.upperBand
    )
      this.supertrend.upperBand = this.supertrend.upperBandBasic;
    else this.supertrend.upperBand = this.lastSupertrend.upperBand;

    if (
      this.supertrend.lowerBandBasic > this.lastSupertrend.lowerBand ||
      this.lastCandleClose < this.lastSupertrend.lowerBand
    )
      this.supertrend.lowerBand = this.supertrend.lowerBandBasic;
    else this.supertrend.lowerBand = this.lastSupertrend.lowerBand;

    if (
      this.lastSupertrend.supertrend == this.lastSupertrend.upperBand &&
      candle.close <= this.supertrend.upperBand
    )
      this.supertrend.supertrend = this.supertrend.upperBand;
    else if (
      this.lastSupertrend.supertrend == this.lastSupertrend.upperBand &&
      candle.close >= this.supertrend.upperBand
    )
      this.supertrend.supertrend = this.supertrend.lowerBand;
    else if (
      this.lastSupertrend.supertrend == this.lastSupertrend.lowerBand &&
      candle.close >= this.supertrend.lowerBand
    )
      this.supertrend.supertrend = this.supertrend.lowerBand;
    else if (
      this.lastSupertrend.supertrend == this.lastSupertrend.lowerBand &&
      candle.close <= this.supertrend.lowerBand
    )
      this.supertrend.supertrend = this.supertrend.upperBand;
    else this.supertrend.supertrend = 0;

    if (candle.close > this.supertrend.supertrend && this.bought == 0) {
      this.advice("long");
      this.bought = 1;
    }

    if (candle.close < this.supertrend.supertrend && this.bought == 1) {
      this.advice("short");
      this.bought = 0;
    }

    this.lastCandleClose = candle.close;
    this.lastSupertrend = {
      upperBandBasic: this.supertrend.upperBandBasic,
      lowerBandBasic: this.supertrend.lowerBandBasic,
      upperBand: this.supertrend.upperBand,
      lowerBand: this.supertrend.lowerBand,
      supertrend: this.supertrend.supertrend,
    };

    this.__hist.supertrend.push(this.supertrend.supertrend);
    this.__hist.supertrend_upper.push(this.supertrend.upperBand);
    this.__hist.supertrend_lower.push(this.supertrend.lowerBand);
  }

  getIndHistoryCore() {
    return {
      supertrend: this.__hist.supertrend,
      supertrend_upper: this.__hist.supertrend_upper,
      supertrend_lower: this.__hist.supertrend_lower,
    };
  }
}

module.exports = new Strat();
