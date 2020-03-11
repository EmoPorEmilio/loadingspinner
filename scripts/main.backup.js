//Global Variables
var currentPhase;
var currentProgress;
var radius;
var points = [];
var points2 = [];
var delay1 = 0;
var delay2 = 0;
var firstRandom;

//Precondition: 'canvas' is the id of an HTML Canvas element
function loadingSpinner(canvas,progress){
    radius = canvas.width/3;
    currentProgress = progress;
    //First wave
    if(delay1%4==0){
        var meanX = radius*Math.cos(t*Math.PI/5)+canvas.width/2;
        var meanY = radius*Math.sin(t*Math.PI/5)+canvas.height/2;
        points = [];
        points.push(canvas.width/2+radius);
        points.push(canvas.height/2);
        var count = 1;
        for(var t = 1;t<10;t++){
            if(count%4!=2 && count%21!=2){
                points.push(radius*Math.cos(t*Math.PI/5)+canvas.width/2);
                points.push(radius*Math.sin(t*Math.PI/5)+canvas.height/2);
                count++;
            }
            else{
                var random = randomNormalDistribution(1,0.20);
                points.push(random*radius*Math.cos(t*Math.PI/5)+canvas.width/2);
                points.push(random*radius*Math.sin(t*Math.PI/5)+canvas.height/2);     
                count++;
            }
        }
        points.push(canvas.width/2+radius);
        points.push(canvas.height/2);
        count++;
        delay1++;
    }
    else{
        delay1++;
    }
    if(delay2%2==0){
    //Second Wave
        points2 = [];
        points2.push(canvas.width/2+radius);
        points2.push(canvas.height/2);
        var count = 1;
        for(var t = 1;t<40;t++){
            var random = randomNormalDistribution(1,0.02);
            points2.push(random*radius*Math.cos(t*Math.PI/20)+canvas.width/2);
            points2.push(random*radius*Math.sin(t*Math.PI/20)+canvas.height/2);     
            count++;
        }
        points2.push(canvas.width/2+radius);
        points2.push(canvas.height/2);
        count++;
        delay2++;
    }
    else{
        delay2++;
    }
    update(canvas);
}

//Draws according to the current progress for each frame. 
function update(canvas){
    context = canvas.getContext('2d');
	context.clearRect(0,0,canvas.width,canvas.height);
    if(canvas.height<radius){
        radius=canvas.height/3;
    }
    context.setLineDash([1, 15]);
    context.strokeStyle = "#ffffff";
    context.lineWidth = 0.5;
    context.shadowBlur = 0;
    context.beginPath();
    context.arc(canvas.width/2,canvas.height/2,radius,0,2*Math.PI);
    context.stroke();
    context.setLineDash([2, 0]);
    context.lineWidth = 1;
    context.strokeStyle = "#0e3f51";
    context.shadowColor = "transparent";
    context.shadowBlur = 0;
    context.beginPath();
    if(currentProgress>0.5){
        context.arc(canvas.width/2,canvas.height/2,radius,0,2*Math.PI);
    }
    else{
        context.arc(canvas.width/2,canvas.height/2,radius,0,2*Math.PI*currentProgress/0.5);
    }
    context.stroke();
    context.strokeStyle = "#986f81";
    context.shadowColor = "#986f81";
    context.shadowBlur = 20;
//First Wave
    context.beginPath();
    if(currentProgress>0.5){
        context.arc(canvas.width/2,canvas.height/2,radius,0,2*Math.PI*((currentProgress-0.5)/0.5));
    }
    context.stroke();
    context.stroke();
    context.stroke();
    context.stroke();
    context.stroke();
    context.beginPath();
    var myPoints = points;
    var tension = 0.85;
    if(currentProgress>0.5){
        var i = Math.ceil(myPoints.length*(currentProgress-0.5)*2);
        if (i%2 ==0){
            i ++;
        }
        drawCurve(context, myPoints.slice(0,i), tension);
    }
    context.stroke();
//Second Wave
    context.beginPath();
    myPoints = points2;
    tension = 0.85;
    if(currentProgress>0.5){
        var i = Math.ceil(myPoints.length*(currentProgress-0.5)*2);
        if (i%2 ==0){
            i ++;
        }
        drawCurve(context, myPoints.slice(0,i), tension);
    }
    context.stroke();
}

function drawCurve(ctx, ptsa, tension, isClosed, numOfSegments, showPoints) {

  ctx.beginPath();

  drawLines(ctx, getCurvePoints(ptsa, tension, isClosed, numOfSegments));
  
  if (showPoints) {
    ctx.beginPath();
    for(var i=0;i<ptsa.length-1;i+=2) 
      ctx.rect(ptsa[i] - 2, ptsa[i+1] - 2, 4, 4);
  }

  ctx.stroke();
}





function getCurvePoints(pts, tension, isClosed, numOfSegments) {

  // use input value if provided, or use a default value	 
  tension = (typeof tension != 'undefined') ? tension : 0.5;
  isClosed = isClosed ? isClosed : false;
  numOfSegments = numOfSegments ? numOfSegments : 16;

  var _pts = [], res = [],	// clone array
      x, y,			// our x,y coords
      t1x, t2x, t1y, t2y,	// tension vectors
      c1, c2, c3, c4,		// cardinal points
      st, t, i;		// steps based on num. of segments

  // clone array so we don't change the original
  //
  _pts = pts.slice(0);

  // The algorithm require a previous and next point to the actual point array.
  // Check if we will draw closed or open curve.
  // If closed, copy end points to beginning and first points to end
  // If open, duplicate first points to befinning, end points to end
  if (isClosed) {
    _pts.unshift(pts[pts.length - 1]);
    _pts.unshift(pts[pts.length - 2]);
    _pts.unshift(pts[pts.length - 1]);
    _pts.unshift(pts[pts.length - 2]);
    _pts.push(pts[0]);
    _pts.push(pts[1]);
  }
  else {
    _pts.unshift(pts[1]);	//copy 1. point and insert at beginning
    _pts.unshift(pts[0]);
    _pts.push(pts[pts.length - 2]);	//copy last point and append
    _pts.push(pts[pts.length - 1]);
  }

  // ok, lets start..

  // 1. loop goes through point array
  // 2. loop goes through each segment between the 2 pts + 1e point before and after
  for (i=2; i < (_pts.length - 4); i+=2) {
    for (t=0; t <= numOfSegments; t++) {

      // calc tension vectors
      t1x = (_pts[i+2] - _pts[i-2]) * tension;
      t2x = (_pts[i+4] - _pts[i]) * tension;

      t1y = (_pts[i+3] - _pts[i-1]) * tension;
      t2y = (_pts[i+5] - _pts[i+1]) * tension;

      // calc step
      st = t / numOfSegments;

      // calc cardinals
      c1 =   2 * Math.pow(st, 3) 	- 3 * Math.pow(st, 2) + 1; 
      c2 = -(2 * Math.pow(st, 3)) + 3 * Math.pow(st, 2); 
      c3 = 	   Math.pow(st, 3)	- 2 * Math.pow(st, 2) + st; 
      c4 = 	   Math.pow(st, 3)	- 	  Math.pow(st, 2);

      // calc x and y cords with common control vectors
      x = c1 * _pts[i]	+ c2 * _pts[i+2] + c3 * t1x + c4 * t2x;
      y = c1 * _pts[i+1]	+ c2 * _pts[i+3] + c3 * t1y + c4 * t2y;

      //store points in array
      res.push(x);
      res.push(y);

    }
  }

  return res;
}

function drawLines(ctx, pts) {
  ctx.moveTo(pts[0], pts[1]);
  for(i=2;i<pts.length-1;i+=2) ctx.lineTo(pts[i], pts[i+1]);
}

function randomNormalDistribution(mean, stdev) {
    return (((Math.random()*2-1)+(Math.random()*2-1)+(Math.random()*2-1))*stdev+mean);
  }