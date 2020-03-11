

var LoadingSpinner = {};
LoadingSpinner.canvas = null;
LoadingSpinner.context = null;

LoadingSpinner.PhaseTypeEnum = {
    COLLECTING : "collecting",
    TRAINING : "training"
};

LoadingSpinner.PHASE_PROGRESS_THRESHOLD = 1
LoadingSpinner.TIME_TO_PROGRESS = 64;

LoadingSpinner.initialize = function(config){
    //Initializing values
    var defaultConfig = {
        radius: 0.3,  //Float in range [0..1] where 1 is the maximum available size in the canvas
        collectingDotsColor: '#ffffff',
        collectingLineColor: '#0e3f51',
        collectingGlowColor: '#ffffff',
        trainingLineColor: '#986f81',
        trainingGlowColor: '#986f81',  
        // speed: how fast the wave moves from point to point
        // articulations: how many discrete pivotal points to draw
        // offsetAmplitude: how far wave 'jumps' will go
        // offsetProbability: frequency of the jumps
        // maxAmplitude: how far the waves can move from their position, as a % of canvas
        waves: [{
            speed: 5,     
            articulations: 128,  
            offsetAmplitude: 0,
            offsetProbability : 0.1, 
            maxAmplitude: 0.02
        },
        {
            speed: 10,     
            articulations: 64,  
            offsetAmplitude: 14,
            offsetProbability : 0.7, 
            maxAmplitude: 0.04
        },
        {
            speed: 16,     
            articulations: 32,
            offsetAmplitude: 18,
            offsetProbability : 0.4, 
            maxAmplitude: 0.05
        }],
    }

    this.config = LoadingSpinner.filterOptions(config, defaultConfig)

    this.points = [];
    this.pointsData = [];
    //this.pointsDestination = [];

    this.currentProgress = 0;
    
    this.setCanvas();
    if (!this.canvas){
        console.error("No canvas provided!");
        return;
    }
  
    this.lastTimestamp = 0;
    if(config){
        // set defaults if some values are undefined
        this.config.radius = config.radius || defaultConfig.radius;
        this.config.collectingDotsColor = config.collectingDotsColor || defaultConfig.collectingDotsColor;
        this.config.collectingLineColor = config.collectingLineColor || defaultConfig.collectingLineColor;
        this.config.collectingGlowColor = config.collectingGlowColor || defaultConfig.collectingGlowColor;
        this.config.trainingLineColor = config.trainingLineColor || defaultConfig.trainingLineColor;
        this.config.trainingGlowColor = config.trainingGlowColor || defaultConfig.trainingGlowColor;
        this.config.waves = config.waves || defaultConfig.waves;
    }
    this.context = this.canvas.getContext('2d');
    this.radius = this.canvas.width * this.config.radius;
    if (this.canvas.height < this.radius){
        this.radius = this.canvas.height * this.config.radius;
    }

    for(var i = 0; i < this.config.waves.length; i++){
        if (this.config.waves[i]){
            var pointsAux = [];
            var pointsDataAux = [];
            // var pointsDestinationAux = [];
            var arts = this.config.waves[i].articulations;
            for(var t = 0; t <= arts / 2; t++){
                var pointX = this.radius * Math.cos(t * 4 * Math.PI / arts) + this.canvas.width / 2;
                var pointY = this.radius * Math.sin(t * 4 * Math.PI / arts) + this.canvas.height / 2;
                pointsAux.push(pointX);
                pointsAux.push(pointY);
                pointsDataAux.push({ amplitude : 0, target: 0 });
                //pointsDestinationAux.push(pointX);
                //pointsDestinationAux.push(pointY);
            }
            this.pointsData.push(pointsDataAux);
            this.points.push(pointsAux);
            //this.pointsDestination.push(pointsDestinationAux);
        }
    }
      
    this.progress = 0;
    this.phase = LoadingSpinner.PhaseTypeEnum.COLLECTING;

    this.elapsedTime = 0;

    requestAnimationFrame(LoadingSpinner.animate);
}

LoadingSpinner.setProgress = function(progress){
    if (this.phase == this.PhaseTypeEnum.TRAINING){
        progress += 1;
    }
    this.progress = progress;
}

// setting the phase sets the progress as well.
LoadingSpinner.setPhase = function(phase){
    this.phase = phase;
    switch (this.phase){
        case this.PhaseTypeEnum.COLLECTING:
            this.progress = 0;
            break;
        case this.PhaseTypeEnum.TRAINING:
            this.progress = 1;
            break;
    }
}

LoadingSpinner.animate = function(timestamp){
    if( !LoadingSpinner.lastTimestamp){
        LoadingSpinner.lastTimestamp = timestamp;
    }

    var delta = (timestamp - LoadingSpinner.lastTimestamp) / 1000;    
    LoadingSpinner.lastTimestamp = timestamp;
    LoadingSpinner.elapsedTime += delta;

    // update progress up to the current progress (max in TIME_IN_PROGRESS)
    var estimatedTime = LoadingSpinner.TIME_TO_PROGRESS;
    if (LoadingSpinner.currentProgress < LoadingSpinner.progress){
        LoadingSpinner.currentProgress += (LoadingSpinner.progress - LoadingSpinner.currentProgress) * LoadingSpinner.elapsedTime / estimatedTime;
    }

    for (var i = 0; i < LoadingSpinner.config.waves.length;i++){
        if (LoadingSpinner.config.waves[i]){
            LoadingSpinner.updateWavePoints(delta, i);
        }
    }
    LoadingSpinner.updateDrawing();
    requestAnimationFrame(LoadingSpinner.animate);
}

LoadingSpinner.setCanvas = function(){
    if (this.config.canvas instanceof HTMLCanvasElement){
        this.canvas = this.config.canvas;
    }else if (this.config.canvas){
        this.canvas = document.getElementById(this.config.canvas);
    }
}

// Randomizes destination points of wave with id 'waveNumber' according to its configuration values
LoadingSpinner.updateWavePoints = function(delta, waveNumber){

    var wave = this.config.waves[waveNumber];

    var index = 1;
    var shownIndex = this.shownPointsIndex(waveNumber);

    for(var t = 2; t <= Math.min(shownIndex,wave.articulations - 1); t += 2){
        // sets the targets
        var p = this.pointsData[waveNumber][index];

        if (this.randomUniformDistribution(0, 1) < wave.offsetProbability * delta){ // 0.1 is the frequency per second of a deviation.
            var offset = this.randomNormalDistribution(0, wave.offsetAmplitude);
            p.target += offset;
            if (Math.abs(p.target) > this.canvas.width * wave.maxAmplitude)
                p.target = this.canvas.width * wave.maxAmplitude * Math.sign(p.target);
        }

        var targetCorrection = wave.speed / 2;
        if (p.target > 0){
            p.target -= targetCorrection * delta;
            if (p.target < 0)
                p.target = 0;
        }else if (p.amplitude < 0){
            p.target += targetCorrection * delta;
            if (p.target > 0)
                p.target = 0;
        }

        // now the amplitude should always chase the target
        var amplitudeDif = p.target - p.amplitude;
        if (amplitudeDif > 0){
            p.amplitude += wave.speed * 2 * delta;
            if (p.target - p.amplitude < 0)
                p.amplitude = p.target;
        }else if (amplitudeDif < 0){
            p.amplitude -= wave.speed * delta;
            if (p.target - p.amplitude > 0)
                p.amplitude = p.target;
        }

        var circumferencePoint = this.pointInCircumference(t, wave.articulations);
        var centerVector = { x : circumferencePoint.x - this.centerX(), y : circumferencePoint.y - this.centerY() };
        this.normalize(centerVector);

        this.points[waveNumber][t] = circumferencePoint.x + centerVector.x * p.amplitude;
        this.points[waveNumber][t + 1] = circumferencePoint.y + centerVector.y * p.amplitude;

        index++;

        /*
        if (this.pointsDestination[waveNumber][t] == -1){
            if (count % frequency == 0){ // to do: count could be randomized, moving along the circumference
                var targetAmp = this.randomNormalDistribution(1, amplitude);
                this.pointsDestination[waveNumber][t] = targetAmp * this.radius*Math.cos(2 * t * Math.PI / articulations) + this.canvas.width/2;
                this.pointsDestination[waveNumber][t + 1] = targetAmp * this.radius*Math.sin(2 * t * Math.PI / articulations) + this.canvas.height/2;
            }
            count++;
        }
        else{
            var difX = this.points[waveNumber][t] - this.pointsDestination[waveNumber][t];
            var difY = this.points[waveNumber][t+1] - this.pointsDestination[waveNumber][t+1];
            if(difX < 0.5 && difY < 0.5){ // if point is close to destination
                if (this.pointsDestination[waveNumber][t] == this.pointInCircumference(t, articulations).x &&  //If point is close to >baseline< destination
                    this.pointsDestination[waveNumber][t+1] == this.pointInCircumference(t, articulations).y){
                    this.points[waveNumber].splice(t, 2, this.pointInCircumference(t, articulations).x, this.pointInCircumference(t, articulations).y);
                    this.pointsDestination[waveNumber].splice(t,2,-1,-1);
                }
                else{ // if point is close to >random< destination
                    this.points[waveNumber].splice(t, 2, this.pointsDestination[waveNumber][t], this.pointsDestination[waveNumber][t+1]);
                    this.pointsDestination[waveNumber].splice(t, 2, this.radius*Math.cos(2*t*Math.PI/articulations)+this.canvas.width/2,this.radius*Math.sin(2*t*Math.PI/articulations)+this.canvas.height/2);
                }
            }
            else{
                // move towards the target
                difX = difX / speed;
                difY = difY / speed;
                var temporalX = this.points[waveNumber][t];
                var temporalY = this.points[waveNumber][t+1];
                this.points[waveNumber].splice(t,2,temporalX-difX,temporalY-difY);
            }
            count++;
        }
        */
    }
}

LoadingSpinner.centerX = function(){
    return this.canvas.width / 2;
}

LoadingSpinner.centerY = function(){
    return this.canvas.height / 2;
}

LoadingSpinner.normalize = function(vector){
    var m = this.module(vector);
    vector.x = vector.x / m || 0;
    vector.y = vector.y / m || 0;
    return vector;
}   

LoadingSpinner.module = function(vector){
    return Math.sqrt(vector.x * vector.x + vector.y * vector.y); 
}

LoadingSpinner.pointInCircumference = function(t, articulationCount){
    var point = {};
    point.x = this.radius * Math.cos(2 * t * Math.PI / articulationCount) + this.centerX();
    point.y = this.radius * Math.sin(2 * t * Math.PI / articulationCount) + this.centerY();
    return point;
}

//Draws according to the current progress for each frame. 
LoadingSpinner.updateDrawing = function(){
    //Cleaning
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    //Drawing dotted circumference
    this.context.setLineDash([1, 15]);
    this.context.strokeStyle = this.config.collectingDotsColor;
    this.context.lineWidth = 0.5;
    this.context.shadowBlur = 0;
    this.context.beginPath();
    this.context.arc(this.canvas.width / 2, this.canvas.height / 2, this.radius, 0, 2 * Math.PI);
    this.context.stroke();

    //Drawing collecting line
    this.context.setLineDash([2, 0]);
    this.context.lineWidth = 1;
    this.context.strokeStyle = this.config.collectingLineColor;
    this.context.shadowColor = this.config.collectingGlowColor;
    this.context.shadowBlur = 20;
    this.context.beginPath();
    this.context.arc(this.canvas.width / 2, this.canvas.height / 2, this.radius, 0, 2 * Math.PI * this.phaseAnimationProgress(this.PhaseTypeEnum.COLLECTING));
    this.context.stroke();

    if (this.phase == this.PhaseTypeEnum.TRAINING && this.phaseAnimationProgress(this.PhaseTypeEnum.TRAINING) > 0){

        //Generating and drawing waves
        this.context.strokeStyle = this.config.trainingLineColor;
        this.context.shadowColor = this.config.trainingGlowColor;
        this.context.shadowBlur = 20;
        for(var i = 0; i < this.config.waves.length; i++){
            this.context.beginPath();
            var tension = 0.6;
            var pointsToDraw = this.points[i];

            var shownIndex = this.shownPointsIndex(i);
            pointsToDraw = pointsToDraw.slice(0, shownIndex);
            
            var currentProgress = this.phaseAnimationProgress(this.PhaseTypeEnum.TRAINING);
            if (currentProgress < 1){
                var circumferencePoint = this.pointInCircumference(currentProgress, 1);
                pointsToDraw.push(circumferencePoint.x);
                pointsToDraw.push(circumferencePoint.y);   
            }

            // push current X,Y coordinates into pointsToDraw so the wave does not jump from discrete point to discrete point?
            this.drawCurve(this.context, pointsToDraw, tension);
            this.context.stroke();        
            if (currentProgress < 1){
                pointsToDraw.splice(shownIndex, 2);
            }
        }
    }

}

LoadingSpinner.shownPointsIndex = function(waveNumber){
    var j = Math.ceil(this.points[waveNumber].length * (this.phaseAnimationProgress(this.PhaseTypeEnum.TRAINING)));
    if (j % 2 != 0) 
        j++;
    return j;
}

LoadingSpinner.phaseAnimationProgress = function(phase){
    switch (phase){
        case this.PhaseTypeEnum.COLLECTING:
            return Math.min(this.currentProgress, 1);
        case this.PhaseTypeEnum.TRAINING:
            return Math.max(this.currentProgress - 1, 0);
    }
}


/////////////////////
//AUXILIARY FUNCTIONS
/////////////////////

LoadingSpinner.drawCurve = function(ctx, ptsa, tension, isClosed, numOfSegments, showPoints) {

    ctx.beginPath();
    this.drawLines(ctx, this.getCurvePoints(ptsa, tension, isClosed, numOfSegments));

    if (showPoints) {
        ctx.beginPath();
        for(var i=0;i<ptsa.length-1;i+=2) 
            ctx.rect(ptsa[i] - 2, ptsa[i+1] - 2, 4, 4);
    }

    ctx.stroke();
}

LoadingSpinner.getCurvePoints = function(pts, tension, isClosed, numOfSegments) {

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

LoadingSpinner.clamp = function(a, min, max){
    return Math.max(Math.min(a, max), min);
}

LoadingSpinner.drawLines = function(ctx, pts) {
    ctx.moveTo(pts[0], pts[1]);
    for(i=2;i<pts.length-1;i+=2) ctx.lineTo(pts[i], pts[i+1]);
}

LoadingSpinner.randomNormalDistribution = function(mean, stdev) {
    return (((Math.random()*2-1)+(Math.random()*2-1)+(Math.random()*2-1))*stdev+mean);
}

LoadingSpinner.randomUniformDistribution = function(minValue, maxValue){
    var intervalSize = maxValue - minValue;
    return (minValue + Math.random() * intervalSize);
}


LoadingSpinner.filterOptions = function(config, defaultConfig){
    var currentConfig = config || defaultConfig;
    return currentConfig;
}