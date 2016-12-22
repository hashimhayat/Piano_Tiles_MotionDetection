/*
Interactive Computing - Final Exam 
by Hashim Hayat

Project Name: Piano Tiles - play in the air

The platform is an adoption of the famous mobile based game "Piano Tiles".
Play with the motion gestures using hand/finger to press a piano note.

References:
-Parts of the program were taken from provided sample codes.
-Hearts were taken from one of my personal projects I did for fun: http://i6.cims.nyu.edu/~hh1316/hearts/
-Motion Tracking was adopted from class samples and my final project

How to Play:

1) The platform uses the web came to track user's motion in defined regions that are the dard boxes with gifts.

2) If you hover a dark key using your hand in the BOTTOM ROW, it will be considered as pressed and a note will be played and the keys will shift
down.

3) After every 100 points. You will see greeting hearts coming out of the bottom.

*/

var motionDetector;
var screenW = 414;
var screenH = 720;
var canvas;
var points = 0;
var heartCount = 0;
var board;

// taken from the p5js sound example page (https://p5js.org/examples/sound-note-envelope.html)
var osc, envelope, fft;
var scaleArray = [60, 62, 64, 65, 67, 69, 71, 72];
var note = 0;

var gifts,g1,g2,g3,g4;
var heart_img,h1,h2,h3,hearts = [];

function preload(){
  g1 = loadImage("images/g1.png"); 
  g2 = loadImage("images/g2.png"); 
  g3 = loadImage("images/g3.png"); 
  g4 = loadImage("images/g4.png"); 
  
  gifts = [g1,g2,g3,g4];
  
  h1 = loadImage('images/heart.png');
  h2 = loadImage('images/heartL.png');
  h3 = loadImage('images/heartR.png');
  heart_img = [h1,h2,h3];
}

function setup() {
  
  canvas = createCanvas(screenW, screenH);
  
  // Sound Setup - Thanks to Prof Craig
  envelope = new p5.Env();
  envelope.setADSR(0.001, 0.5, 0.1, 0.5);
  envelope.setRange(1, 0);
  osc = new p5.SinOsc();
  osc.start();
  fft = new p5.FFT();
  
  init_hearts();
  
  motionDetector = new MotionDetector(screenW, 671, true, true, 50, 0.5);
  
  board = new Grid(667,screenW,0,67);
  
}

function draw() {
  background('#FDEBD0');
  
  // Thanks professor
  motionDetector.startProcessFrame();
  motionDetector.endProcessFrame(true, 0, 0, screenW, 673);
  
  Header();
  
  board.display();
  
  if (heartCount % 100 == 0){
    hearts = [];
    init_hearts();
    heartCount += 1;
  }
  
  for (var h = 0; h < hearts.length; h++){
      hearts[h].display();
      hearts[h].move();
  }
  
}

function Grid(w,h,x,y){
  
  this.row = 5;
  this.col = 4;
  this.grid = [];
  this.colors = ['#B0171F','#EEE0E5'];
  this.state = 0;
  this.framesToStayInState = 30;
  this.framesInState = 0;
  this.backend = [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,1,0],[0,0,0,1]];
  
  for (var c = 0; c < this.row; c++){
    var tmp = [];
    this.grid.push(tmp);
  }
  
  for (var r = 0; r < this.row; r++){
    for (var c = 0; c < this.col; c++){
      this.grid[r][c] = false;
    }
  }
  var note;
  var touch = false;
  this.display = function(){
  
    for (var c = 0; c < this.col; c++){
      for (var r = 0; r < this.row; r++){
        
        var val = this.backend[r][c];
        
        noStroke();
        if (val == 1) {
          
          fill(176,23,31,20); 
          image(gifts[int(random(0,4))] ,(25+x+c*104),(30+y+r*122));
          
          if (r == 4){
            note = new Note((x+c*104), (y+r*122),102,120, scaleArray[int(random(scaleArray.length))]);  
            touch = note.displayAndHandleTouches();
            
            if (touch)
              this.grid[r][c] = true; 
          }
          this.state = 0;
        } else {
          fill(238,224,229,100);
        }
        
        if (this.grid[r][c]){
          fill('black',0,0,100);
          points++;
          heartCount++;
          
          this.slideDown();
          this.grid[r][c] = false;
        }
        
        rect((x+c*104), (y+r*122),102,120);
      }
    }
    
    this.difficulty(1);
    
  }
  
  this.slideDown = function(){
    
    for (var c = 0; c < this.col; c++){
      this.backend[4][c] = this.backend[3][c];
      this.backend[3][c] = this.backend[2][c];
      this.backend[2][c] = this.backend[1][c];
      this.backend[1][c] = this.backend[0][c];
    }
    
    var random_col = int(random(0,4));
    
    for (var c = 0; c < this.col; c++){
      if (random_col == c ){this.backend[0][c] = 1;}
      else {this.backend[0][c] = 0;}
    }
  }
  
  this.difficulty = function(level){
    
    // handle state changes
    this.framesInState += 1;
    
    if (this.framesInState >= this.framesToStayInState) {
      // time to switch!
      if (this.state == 0) {
        this.state = 1;
      }
      else {
        this.state = 0;
      }
      this.framesInState = 0;
    
    }
  }
}

function Note(x, y, w, h, sound) {
  // store our position
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;

  // store our note value
  this.sound = sound;
  this.cooldown = 0;

  // display & handle touches
  this.displayAndHandleTouches = function() {
    // see if the user is touching this tile
    if (this.cooldown == 0 && motionDetector.detectMotion(this.x, this.y, this.w, this.h)) {
      // play our note
      var freqValue = midiToFreq(this.sound);
      osc.freq(freqValue);
      envelope.play(osc, 0, 0.1);
      
      return true;
      // set our cooldown to a positive number to prevent touch-spamming
      this.cooldown = 10;
    } else {

      if (this.cooldown > 0) { 
        this.cooldown -= 1;
      }
    }

  }
}

function Heart(){
  this.idx = int(random(heart_img.length));
  this.img = heart_img[this.idx];
  this.xPos = random(0,(screenW-100));
  this.yPos = random((screenH-200),screenH);
  this.noiseLocation = random(0,1000);
  this.offset = random(0.05,0.15);
  this.pull = random(20,30);
  
  this.display = function(){
    image(this.img, this.xPos, this.yPos);
  }
  
  this.move = function() {
    this.yPos -= this.pull;
    var xMovement = map( noise(this.noiseLocation), 0, 1, -1, 1 );
    this.xPos += xMovement;
    this.noiseLocation += 0.01;
  }

}

function Header(){
  
  var h = 35;
  var text_w;
  noStroke();
  fill('#FDEBD0');
  rect(0,0,screenW,h+30);
  
  fill('#C0392B');
  textSize(30);
  textFont("Symbol");
  var phrase = "Piano Tiles";
  text(phrase,20,h);
  fill('#C0392B');
  textSize(12);
  var phrase = "Play it in the air during holidays.";
  text(phrase,22,h+20);
  
  textFont("Helvetica");
  
  fill('#C0392B');
  textSize(12);
  var phrase = "Project by Hashim Hayat";
  text(phrase,140,screenH-27);
  
  fill('#C0392B');
  textSize(12);
  var phrase = "Interactive Computing with Craig Kapp - New York University";
  text(phrase,48,screenH-10);
  
  noStroke();
  fill("#F5B041");
  rect(screenW-125,10,100,43,20);
  
  fill('#FFF5EE');
  textSize(30);
  textFont("Helvetica");
  var phrase = str(points);
  if (phrase.length == 1){text_w = screenW-84}
  else if (phrase.length == 2){text_w = screenW-92}
  else if (phrase.length == 3){text_w = screenW-100}
  else {text_w = screenW-111}
  text(phrase,text_w,h+7);
}

function MotionDetector(w, h, mirror, showMotion, threshold, percentChangeNeeded) {
  // create a video object
  this.video = createCapture({
    video: {
      mandatory: {
        minWidth: w,
        minHeight: h,
        maxWidth: w,
        maxHeight: h
      }
    }
  });
  this.video.hide();

  // construct a changed frame image object
  this.compareFrame = new p5.Image(w, h);

  // store width and height
  this.vw = w;
  this.vh = h;

  // store our mirror preferences
  this.mirror = mirror;

  // store show motion preference
  this.showMotion = showMotion;

  // store threshold & percent change needed
  this.threshold = threshold;
  this.percentChangeNeeded = percentChangeNeeded;


  // process a frame of video (1/2)
  this.startProcessFrame = function() {

    // expose pixels
    this.video.loadPixels();
    this.compareFrame.loadPixels();

    // do we need to mirror the video?
    if (this.mirror) {
      // iterate over 1/2 of the width of the image & the full height of the image
      for (var x = 0; x < this.video.width / 2; x++) {
        for (var y = 0; y < this.video.height; y++) {
          // compute location here
          var loc1 = (x + y * this.video.width) * 4;
          var loc2 = (this.video.width - x + y * this.video.width) * 4;

          // swap pixels from left to right
          var tR = this.video.pixels[loc1];
          var tG = this.video.pixels[loc1 + 1];
          var tB = this.video.pixels[loc1 + 2];

          this.video.pixels[loc1] = this.video.pixels[loc2];
          this.video.pixels[loc1 + 1] = this.video.pixels[loc2 + 1];
          this.video.pixels[loc1 + 2] = this.video.pixels[loc2 + 2];

          this.video.pixels[loc2] = tR;
          this.video.pixels[loc2 + 1] = tG;
          this.video.pixels[loc2 + 2] = tB;


          // swap pixels from left to right (compareFrame)
          tR = this.compareFrame.pixels[loc1];
          tG = this.compareFrame.pixels[loc1 + 1];
          tB = this.compareFrame.pixels[loc1 + 2];

          this.compareFrame.pixels[loc1] = this.compareFrame.pixels[loc2];
          this.compareFrame.pixels[loc1 + 1] = this.compareFrame.pixels[loc2 + 1];
          this.compareFrame.pixels[loc1 + 2] = this.compareFrame.pixels[loc2 + 2];

          this.compareFrame.pixels[loc2] = tR;
          this.compareFrame.pixels[loc2 + 1] = tG;
          this.compareFrame.pixels[loc2 + 2] = tB;
        }
      }
    }
  }


  // detect motion in a specific region
  this.detectMotion = function(x, y, w, h) {

    // assume no motion
    var movedPixels = 0;

    // constrain motion rectangle, if necessary
    if (x < 0) {
      x = 0;
    } else if (x >= this.video.width) {
      x = this.video.width - 1;
    }
    if (y < 0) {
      y = 0;
    } else if (y >= this.video.height) {
      y = this.video.height - 1;
    }

    if (x + w >= this.video.width) {
      w = (this.video.width - 2) - x;
    }
    if (y + h >= this.video.height) {
      h = (this.video.height - 2) - y;
    }
    
    // iterate over the region in question
    for (var i = x; i < x + w; i++) {
      for (var j = y; j < y + h; j++) {
        // compute 1D location
        var loc = (i + j * this.video.width) * 4;

        // determine if there is motion here
        if (dist(this.video.pixels[loc], this.video.pixels[loc + 1], this.video.pixels[loc + 2], this.compareFrame.pixels[loc], this.compareFrame.pixels[loc + 1], this.compareFrame.pixels[loc + 2]) > this.threshold) {

          if (this.showMotion) {
            this.video.pixels[loc] = 0;
            this.video.pixels[loc + 1] = 255;
            this.video.pixels[loc + 2] = 0;
          }

          movedPixels += 1;
        }
      }
    }

    // evaluate whether motion occurred here
    if (movedPixels / (w + h) > this.percentChangeNeeded) {
      return true;
    }
    return false;
  }

  // process a frame of video (2/2)
  this.endProcessFrame = function(showVideo, x, y, w, h) {

    // update compareFrame
    this.compareFrame.copy(this.video, 0, 0, this.vw, this.vh, 0, 0, this.vw, this.vh);

    // save pixels
    this.video.updatePixels();

    // draw the video, if necessary
    if (showVideo) {
      image(this.video, x, y, w, h);
    }
  }
}

function init_hearts(){
  for (var h = 0; h < 20; h++){
   hearts.push(new Heart());
  }
}