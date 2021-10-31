module.exports = {

  reduce: function reduce(numerator, denominator) {

    // shamelessly stolen from https://stackoverflow.com/a/4652513
    var gcd = function gcd(a, b) {
      return b ? gcd(b, a % b) : a;
    };

    gcd = gcd(numerator, denominator);

    return [numerator / gcd, denominator / gcd];
  },

  calcBeatFromMillis: function calcBeatFromMillis(ms, bpm, offSetMS) {

    // 3 decimal places -> microseconds. Very precise
    // 0 decimal places -> milliseconds. Precise enough
    var precision = 1;

    // calculate the ms per beat
    var beat_interval = (60000 / bpm).toFixed(precision)

    // calculate the beat of the input ms (including offSet)
    var beat = Math.floor((ms-offSetMS) / beat_interval)

    // now calculate the remainder to get the sub-beat
    var remainder = ms % beat_interval;

    // default to the "whole beat" specification
    var reduced = [0, 1]

    if (remainder != 0) {
      // convert the remainder to a fracture of 1, which return an inexact float value (eg. 0.7499~)
      var remainderRelative = remainder / beat_interval

      // round the inexact remainder to the nearest 1/16th 
      var possibleFractionsPerBeat = 32
      var roundedNum = (Math.round(remainderRelative * possibleFractionsPerBeat) / possibleFractionsPerBeat).toFixed(5)

      // multiply by "possibleFractionsPerBeat" to convert the fracture of 1 to a numerator for a denominator of 16
      var numerator = roundedNum * possibleFractionsPerBeat

      // reduce to the smallest denominator by finding the 
      var reduced = this.reduce(numerator, possibleFractionsPerBeat)
    }

    if (reduced[0] == reduced[1]) {
      console.log(`both sides equal: ${reduced[0]} / ${reduced[1]}`);
      reduced[0] = 0
      reduced[1] = 1
    }

    return {
      "beat": beat,
      "numerator": reduced[0],
      "denominator": reduced[1],
    }
  },

  calcMSFromZ: function calcMSFromZ(z) {
    // https://github.com/klugeinteractive/synth-riders-editor/blob/master/Assets/MikuEditor/Scripts/MiKu/NET/Track.cs#L4331
    return (z / 20) * 1000
  },

  calcZFromMS: function calcZFromMS(ms) {
    return (ms / 1000) * 20
  },

  calcXY: function calcXY(srX, srY, relative = false) {

    /*
      This function converts the coordinates of SynthRiders to AudioTrip
    */
    /*
      (SR) The center of the arena is (0|0).
      (AT) The center of the arena is (0|1.1) (measured by directly comparing SR choreo and AT editor)

      Both seem to measure in meters, SR is centered around the players 
      breastbone, AT has 0,0 at the player's feet.

      x_at = x_sr
      y_at = y_sr + 1.1

    */

    var atX = +((1*srX).toFixed(2))
    var atY = +((1*srY + (relative ? 0.0 : 1.1)).toFixed(2))

    //console.log("(" + (x>=0 ? " " : "") + x + " |" + (y>=0 ? " " : "") + y + ")\t->\t(" + (resultX>=0 ? " " : "") + resultX + "|" + (resultY>=0 ? " " : "") + resultY + ")")

    return {
      x: atX,
      y: atY
    }
  },

  convertOldToNewFormat: function convertMSToNewFormat(ms, slideType) {
    var tmp = new Object

    tmp.time = 0.0
    tmp.position = [0.0, 0.0, this.calcZFromMS(ms)]
    tmp.initialized = true
    tmp.slideType = slideType == null ? 5 : slideType

    return tmp
  }
}

