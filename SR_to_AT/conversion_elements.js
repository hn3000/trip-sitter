module.exports = {

  generateCrouch: function generateCrouch(currentElement, json) {

    // modify element to have an additional "custom" slideType
    currentElement.slideType = -1

    // business as usual
    return this.generateBarrier(currentElement, json)
  },

  generateBarrier: function generateBarrier(currentElement, json) {

    var conversion_math = require('./conversion_math')

    var event = new Object()

    event.type = 0

    event.position = new Object()

    event.position.x = 0 // not used for barriers
    event.position.y = 0 // vertical offset of the barrier

    switch (currentElement.slideType) {
      case 0:
        event.hand = "right"
        event.position.y = 0.3
        event.position.z = -90
        // barrier right side
        break
      case 1:
        event.hand = "left"
        event.position.z = 90
        event.position.y = 0.3
        // barrier left side        
        break
      case 2:
        event.hand = "right diag"
        event.position.y = 0.2
        event.position.z = -60
        break;
      case 3:
        event.hand = "center"
        // barrier center
        break;
      case 4:
        event.hand = "left diag"
        event.position.z = 60
        event.position.y = 0.2
        // barrier left diagonal                
        break
      case -1:
        // only possible via generateCrouch()
        event.hand = "crouch"
        event.position.y = 0.4 // a bit higher than shoulder level
        event.position.z = 0   // no rotation = horizontal
        break;
    }

    var time = currentElement.position[2]

    if (!isFinite(time)) {
      time = conversion_math.calcZFromMS(currentElement.time)
    }

    event.hasGuide = false
    event.sortkey = time
    event.beatDivision = 2
    event.broadcastEventID = 0
    
    {
      const { time, position, slideType } = currentElement;
      event.src = { time, position, slideType };
    }

    var ms = conversion_math.calcMSFromZ(time)
    event.time = conversion_math.calcBeatFromMillis(ms, json.bpm, json.offSetMS || 0)

    event.gemType = "barrier"

    if (event.time.beat == null) {
      console.log(`converted barrier at ${JSON.stringify(event.time)}`, event, currentElement);
    }
    return event;
  },

  generateEvent: function generateEvent(currentElement, json) {

    var conversion_math = require('./conversion_math')

    var event = new Object()

    event.position = new Object()

    event.position.z = 0

    switch (currentElement.Type) {
      case 0:
        event.type = 2
        event.hand = "right"
        break
      case 1:
        event.type = 1
        event.hand = "left"
        break
      case 2:
        event.hand = "one any"
        break;
      case 3:
        event.hand = "both"
        break;
    }

    event.hasGuide = false
    event.sortkey = currentElement.Position[2]
    //event.beatDivision = 2
    //event.broadcastEventID = 0

    var convertedCoords = conversion_math.calcXY(currentElement.Position[0].toFixed(2), currentElement.Position[1].toFixed(2))

    event.position.x = convertedCoords.x
    event.position.y = convertedCoords.y

    event.time = conversion_math.calcBeatFromMillis(conversion_math.calcMSFromZ(currentElement.Position[2]), json.bpm, json.offSetMS)

    event.position.z = 0

    event.subPositions = []

    // if there are no segments, the event type is gem and we are finished
    if (currentElement.Segments == null) {
      event.gemType = "gem"
      //event.hasGuide = true

      return event;
    }

    // otherwise, this is a ribbon
    event.type += 2
    event.gemType = "ribbon"


    var first = {
      x: currentElement.Position[0],
      y: currentElement.Position[1],
      z: 0,
      t: conversion_math.calcMSFromZ(currentElement.Position[2]),
    };

    // map Segments to subPosition-like structure
    var segments = currentElement.Segments.map(function(o) { 
      return ({ 
        x: o[0] - first.x,
        y: o[1] -first.y,
        z: 0,
        t: conversion_math.calcMSFromZ(o[2])
      });
    });

    segments.push({...first, x: 0, y: 0});

    segments.sort(function(a,b) { return a.t - b.t; });

    var start = Math.round(conversion_math.calcMSFromZ(currentElement.Position[2]));
    var end = segments[segments.length - 1].t;
    var length = end - start;
    var gaps = (segments.length-1);
    var deltas = {};
    var minDelta = Number.MAX_SAFE_INTEGER;
    var maxDelta = 0;
    for (var i = 1, n = segments.length; i < n; ++i) {
      var delta = Math.round(segments[i].t - segments[i-1].t);
      segments[i].delta = delta;
      segments[i].div = Number((60000 / (json.bpm * delta)).toFixed(3));

      if (null != deltas[delta]) {
        deltas[delta] += 1;
      } else {
        deltas[delta] = 1;
      }
      minDelta = Math.min(minDelta, delta);
      maxDelta = Math.max(maxDelta, delta);
    }
    var mfrqDelta = 0;
    var deltasByFreq = Object.keys(deltas).sort(function(a,b) { return deltas[b]-deltas[a]});
    if (deltasByFreq.length) {
      mfrqDelta = deltasByFreq[0];
    }

    var divR = (delta) => 60000 / (json.bpm * delta);

    var divRaw = divR(minDelta);
    var div = Math.round(divRaw);

    var beatDivisionPrecision = 0;

    if (Math.abs(divRaw - div) > 0.1) {
      //console.warn(`ribbon uses non-integer divisions`, divRaw, divR(minDelta), divR(maxDelta), Math.abs(length - minDelta*gaps), Math.abs(length - maxDelta*gaps));
      //console.warn(`all deltas(*): ${segments.map(s => s.delta).join(',')}`);
      beatDivisionPrecision = 1;
      div = Number(divRaw.toFixed(beatDivisionPrecision));
      console.warn(`non-integer beatDivision in ribbon. ${segments.length} segments, ${div} @${(start/1e3).toFixed(0)}s / beat ${event.time.beat}`);
    }

    if (different(maxDelta, minDelta, 0.02)) {
      divRaw = 60000 / (json.bpm * minDelta);
      div = Number(divRaw.toFixed(beatDivisionPrecision));
      //console.warn(`maxDelta ${maxDelta} != minDelta ${minDelta}; mfrqDelta ${mfrqDelta}`);
      //console.warn(`divRaw: ${divRaw}; minDiv ${60000 / (json.bpm * maxDelta)}; maxDiv ${60000 / (json.bpm * minDelta)}`)
      //console.warn(`old deltas(0): ${segments.map(s => s.delta).join(',')}`);
      var i = 1, n = segments.length;
      while (i < n) {
        if (greater(segments[i].delta, minDelta, 0.04)) {
          var a = segments[i-1]; 
          var b = segments[i];
          
          var j = 1, m = Math.floor(b.delta / minDelta);
          if (j < m) {
            // remove b
            segments.splice(i, 1);
            //console.warn(`new deltas(1): ${segments.map(s => s.delta).join(',')}`);
            --n;
            
            for (; j <= m; ++j) {
              var pos = j / m;
              var x = a.x + pos * (b.x-a.x) - segments[i-1].x;
              var y = a.y + pos * (b.y-a.y) - segments[i-1].x;
              segments.splice(i, 0, { x, y, z: 0, delta: minDelta });
              //console.warn(`new deltas(2): ${segments.map(s => s.delta).join(',')}`);
              ++i;
              ++n;
            }
          } else {
            ++i;
          }
        } else {
          ++i;
        }
      }
      //console.warn(`new deltas(3): ${segments.map(s => s.delta).join(',')}`);
    }


    event.beatDivision = div;
    segments[0].x = segments[0].y = 0;
    event.subPositions = segments;

    /*



    // add starting point of the spline
    event.subPositions.push(
      {
        "x": 0,
        "y": 0,
        "z": 0
      }
    )

    // get start and end position of the ribbon
    var start = currentElement.Position[2]
    var max = Math.max.apply(Math, currentElement.Segments.map(function (o) { return o[2]; }))
    var length = max - start

    var length_ms = conversion_math.calcMSFromZ(length)

    // for short ribbons (< 1 beat) we may need additional positions, so we increase beatdivision
    if (conversion_math.calcBeatFromMillis(length_ms, json.bpm, json.offSetMS).beat == 0) {
      event.beatDivision = 4
    }

    var length_beatDivision = (60000 / json.bpm).toFixed(0) / event.beatDivision

    var checkPoints = new Array()

    // go through the length of the ribbon and mark the spots (in ms) for new checkpoints
    while (length_ms > length_beatDivision) {

      length_ms -= length_beatDivision

      checkPoints.push(length_ms)
    }

    for (var checkpoint in checkPoints) {

      var currentCheckpoint = checkPoints[checkpoint]

      // find the nearest checkpoint in SynthRiders' format
      var goal = conversion_math.calcZFromMS(currentCheckpoint) + start

      var mindiff
      var prevmin = -1
      var closest

      for (var tmp_segment in currentElement.Segments) {
        var currentZ = currentElement.Segments[tmp_segment][2]

        // get the absolute difference between the current element and the goal
        mindiff = Math.abs(currentZ - goal)

        // if the diff grew, exit the loop -> prevmin is our result!
        if (mindiff > prevmin && prevmin != -1) {
          continue; // was break; (revert if this breaks anything)
        } else {
          prevmin = mindiff
          closest = currentElement.Segments[tmp_segment]
        }
      }

      var subPosition = new Object()

      var XY = conversion_math.calcXY(closest[0], closest[1], true)
      subPosition.x = XY.x;
      subPosition.y = XY.y;
      subPosition.z = 0;

      event.subPositions.push(subPosition)
    }
    */

    return event;
  },

  splitGem: function splitGem(event) {

    // clone base element
    var supportEvent = JSON.parse(JSON.stringify(event))
    var offsetX = 0.01
    var ribbon = event.gemType == "ribbon"

    // supportEvent will be left, the original event right
    supportEvent.position.x -= offsetX
    supportEvent.type = ribbon ? 3 : 1
    supportEvent.hand = "left (split)"

    event.position.x += offsetX
    event.type = ribbon ? 4 : 2
    event.hand = "right (split)"

    return supportEvent

  },

}

function different(a, b, relEpsilon) {
  const delta = Math.abs(a - b);
  const epsilon = delta / Math.max(a,b);
  const result = relEpsilon < epsilon;
  //result && console.warn(`too different: ${a} != ${b} by ${epsilon} >= ${relEpsilon}`);
  return result;
}

function greater(a, b, relEpsilon) {
  const delta = a - b;
  const epsilon = delta / a;
  const result = relEpsilon < epsilon;
  //!result && console.warn(`not greater: ${a} > ${b} by ${epsilon} >= ${relEpsilon}`);
  return result;
}
