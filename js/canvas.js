//==================================== ECS =====================================
var canvasMoving = true;

var ECS = { 
  Entities:[],
  Components:{},
  Assemblages:{},
  Systems:{
    input: function() {
      if(isCharging) {
        return;
      }
      
      for(var id in ECS.Entities) {
        var entity = ECS.Entities[id];
        if(entity.components.collider) {
          var pos = entity.components.position;
          var dx = pos.x - mouse.x;
          var dy = pos.y - mouse.y;
          var d = Math.sqrt(dx * dx + dy * dy);
          
          if(d < entity.components.collider.radius) {
            targetEntity = entity;
            return;
          }
        }
      }
    },
    
    movement: function() {
      if(canvasMoving) {
        for(var id in ECS.Entities) {
          var entity = ECS.Entities[id];
          if(entity.components.mover) {
            entity.components.mover.move();
          }
          if(entity.components.position) {
            var position = entity.components.position;
            if(position.x > canvas.width) {
              position.x -= canvas.width;
            } else if(position.x < 0) {
              position.x += canvas.width;
            }
            
            if(position.y > canvas.height) {
              position.y -= canvas.height;
            } else if(position.y < 0) {
              position.y += canvas.height;
            }
          }
        }
      }
    },
    
    collision: function() {
      if(!canvasMoving) {
        return;
      }
      
      for(var i = 0; i < ECS.Entities.length; i++) {
        var entity = ECS.Entities[i];
        if(entity.components.collider) {
          for(var j = i + 1; j < ECS.Entities.length; j++) {
            var entity2 = ECS.Entities[j];
            if(entity2.components.collider) {
              var pos1 = entity.components.position;
              var pos2 = entity2.components.position;
              
              var dx = pos1.x - pos2.x;
              var dlx = pos1.x - canvas.width - pos2.x;
              var drx = pos1.x + canvas.width - pos2.x;
              
              var dy = pos1.y - pos2.y;
              var ddy = pos1.y - canvas.height - pos2.y;
              var duy = pos1.y + canvas.height - pos2.y;
              
              var d = magnitude({x: dx, y: dy});
              var dd = magnitude({x: dx, y: ddy});
              var du = magnitude({x: dx, y: duy});
              var dl = magnitude({x: dlx, y: dy});
              var dld = magnitude({x: dlx, y: ddy});
              var dlu = magnitude({x: dlx, y: duy});
              var dr = magnitude({x: drx, y: dy});
              var drd = magnitude({x: drx, y: ddy});
              var dru = magnitude({x: drx, y: duy});
              var minCollD = entity.components.collider.radius +
                             entity2.components.collider.radius;
                             
                             
              
              if(d < minCollD || dd < minCollD || du < minCollD
                  || dl < minCollD || dld < minCollD || dlu < minCollD
                  || dr < minCollD || drd < minCollD || dru < minCollD) {
                entity.components.collider.collide(entity2, d);
                entity2.components.collider.collide(entity, d);
              }
            }
          }
        }
      }
    },
    
    cleanUp: function() {
      for(var i = 0; i < ECS.Entities.length; i++) {
        var entity = ECS.Entities[i];
        if(entity.components.health && entity.components.health.value < 0) {
          ECS.Entities.splice(i,1);
        }
      }
    },
    
    render: drawEverything
  }
};

function update() {
  for(var system in ECS.Systems) {
    ECS.Systems[system]();
  }
}

//http://vasir.net/blog/game-development/how-to-build-entity-component-system-in-javascript
//A very good source for the entity-component-system approach to making games

ECS.Entity = function Entity() {
  this.id = (+new Date()).toString(16) + 
  (Math.random() * 100000000 | 0).toString(16) +
  ECS.Entity.prototype._count;
  
  ECS.Entity.prototype._count++;
 
  this.components = {};
 
  return this;
};
 // keep track of entities created
ECS.Entity.prototype._count = 0;

ECS.Entity.prototype.addComponent = function addComponent(component){
 // NOTE: The component must have a name property (which is defined as 
 // a prototype prototype of a component function)
 this.components[component.name] = component;
 return this;
};

ECS.Entity.prototype.removeComponent = function removeComponent(componentName){
 // Remove component data by removing the reference to it.
 // Allows either a component function or a string of a component name to be
 // passed in
 var name = componentName; // assume a string was passed in
 
 if(typeof componentName === 'function'){ 
 // get the name from the prototype of the passed component function
 name = componentName.prototype.name;
 }
 
 delete this.components[name];
 return this;
};

ECS.Entity.prototype.print = function print() {
 // Function to print / log information about the entity
 console.log(JSON.stringify(this, null, 4));
 return this;
};

//================================ Components ==================================
ECS.Components.Health = function ComponentHealth(value){
 value = value || 20;
 this.value = value;
 return this;
};
ECS.Components.Health.prototype.name = 'health';

ECS.Components.Position = function ComponentPosition(valueX, valueY){
 valueX = valueX || 50;
 valueY = valueY || 50;
 this.x = valueX;
 this.y = valueY;
 return this;
};
ECS.Components.Position.prototype.name = 'position';

//Takes a movement speed and a movement FUNCTION
ECS.Components.Mover = function ComponentMover(speed, move){
 this.move = move;
 this.speed = speed;
 return this;
};
ECS.Components.Mover.prototype.name = 'mover';

//Takes a circle collider radius and a FUNCTION that takes a collider and distance
ECS.Components.Collider = function ComponentCollider(radius,collide){
 this.radius = radius;
 this.collide = collide;
 return this;
};
ECS.Components.Collider.prototype.name = 'collider';

//Takes a render FUNCTION
ECS.Components.Renderer = function ComponentRenderer(renderer){
 this.render = renderer;
 return this;
};
ECS.Components.Renderer.prototype.name = 'renderer';

//Takes a position component
ECS.Components.Targeter = function ComponentTargeter(position){
 this.position = position;
 return this;
};
ECS.Components.Targeter.prototype.name = 'targeter';

//================================ Assemblages =================================
var keys = [0 ,  4,  7,  
            12, 16, 19,
            24, 28, 31,
            36, 40, 43,
            48, 52, 55];
var maxKeyShift = 55;
function assembleRandom(rootNote, e) {
  var x = Math.random() * this.canvas.width;
  var y = Math.random() * this.canvas.height;
  
  var s = Math.random() * 7;
  var key = rootNote + keys[Math.floor(Math.random() * keys.length)];
  var r = maxCircleSize * (1 - key / numKeys);
  
  return assembleCircle(x,y,s,r,e);
}

function assembleCircle(x,y,s,r,e) {
  var entity = new ECS.Entity();
  entity.addComponent( new ECS.Components.Health(1) );
  entity.addComponent( new ECS.Components.Position(x,y));
  
  if(e !== null){
    entity.addComponent( new ECS.Components.Targeter(e.components.position));
  }
  entity.addComponent( new ECS.Components.Mover(s, function(){
    if(e !== null) {
      var target = entity.components.targeter.position;
      var position = entity.components.position;
      var dx = target.x - position.x;
      var dy = target.y - position.y;
      var d = Math.sqrt(dx * dx + dy * dy);
      position.x += this.speed * dx / d
      position.y += this.speed * dy / d
    }
  }));
  
  
  entity.addComponent( new ECS.Components.Collider(r, function(ce, d) {
    var cposition = ce.components.position;
    var position = entity.components.position;
    var dx = cposition.x - position.x;
    var dy = cposition.y - position.y;
    
    cposition.x += entity.components.mover.speed * dx/d;
    cposition.y += entity.components.mover.speed * dy/d;
    
    if(soundPlaying) {
      createOscillatorFromSize(r);
    }
  }));
  
  entity.addComponent( new ECS.Components.Renderer(function() {
    drawCircle(entity.components.position.x, entity.components.position.y, r, e);
    drawCircle(entity.components.position.x - canvas.width, entity.components.position.y, r, e);
    drawCircle(entity.components.position.x + canvas.width, entity.components.position.y, r, e);
    drawCircle(entity.components.position.x, entity.components.position.y - canvas.height, r, e);
    drawCircle(entity.components.position.x, entity.components.position.y + canvas.height, r, e);
    
    drawCircle(entity.components.position.x - canvas.width, entity.components.position.y - canvas.height, r, e);
    drawCircle(entity.components.position.x - canvas.width, entity.components.position.y + canvas.height, r, e);
    drawCircle(entity.components.position.x + canvas.width, entity.components.position.y - canvas.height, r, e);
    drawCircle(entity.components.position.x + canvas.width, entity.components.position.y + canvas.height, r, e);
    
    ctx.beginPath();
    if(e != null) {
      ctx.moveTo(entity.components.position.x,entity.components.position.y);
      ctx.lineTo(entity.components.targeter.position.x,
                 entity.components.targeter.position.y);
      ctx.stroke();
    }
    
    ctx.closePath();
  }));
  
  return entity;
}

function drawCircle(x,y,r,e) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI*2, false);
    if(e !== null) {
      ctx.fillStyle = "white";
    } else {
      ctx.fillStyle = "rgb(180, 180, 255)";
    }
    ctx.fill();
    ctx.strokeStyle = "rgba(30, 30, 105, 0.95)";
    ctx.stroke();
    ctx.closePath();
}
//================================ Canvas Code =================================
var targetEntity = null;
var mouse = { 
  x: null, 
  y: null,
  lx: null,
  lx: null,
  rx: null,
  ry: null
};
var isCharging = false;
var pixelsPerSpeed = 40;
var circleSize = 3;
var maxCircleSize = 100;
var circleSpeed = 3;
var axisLength = 10;

function resetCanvas() {
  clearCanvas();
  populateCanvas();
}

function clearCanvas() {
  ECS.Entities = [];
  $("canvas").hide().fadeIn(2000);
}

function createCanvas() {
  initSound();
  
  var canvas = document.createElement("Canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight - 2;
  canvas.style.zIndex = 1;
  canvas.style.position = "absolute";
  canvas.style.border   = "1px solid";

  document.body.insertBefore(canvas, document.body.children[1]);
  
  $("canvas").hide().fadeIn(1000);
  
  this.canvas = canvas;
  this.ctx = canvas.getContext("2d");
  
  $(window).resize(function(e){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 2;
    
    drawEverything();
  });
  
  $("canvas").mousedown(function(e) {
    e.preventDefault();
    
    isCharging = true;
    mouse.x = e.pageX;
    mouse.y = e.pageY;
    mouse.lx = e.pageX;
    mouse.ly = e.pageY;
  });

  $("canvas").mouseup(function(e) {
    e.preventDefault();
    
    isCharging = false;
    
    var r = circleSize;
    var s = circleSpeed  / pixelsPerSpeed;
    
    var entity = assembleCircle(mouse.x, mouse.y, s, r, targetEntity);
    ECS.Entities.push(entity);
    mouse.lx = null;
    mouse.ly = null;
    mouse.x = e.pageX;
    mouse.y = e.pageY;
  });

  $("canvas").mousemove(function(e) {
    e.preventDefault();
    
    if(mouse.lx !== null && mouse.ly !== null) {
      mouse.lx = e.pageX;
      mouse.ly = e.pageY;
      
      var basisVec = getSizeBasis();
      var mouseVec = getMouseVec();
      
      var sizeProj = project(basisVec, mouseVec);
      var speedProj = project(rot90(basisVec), mouseVec);
      
      circleSize = Math.min(maxCircleSize, magnitude(sizeProj));
      circleSpeed = magnitude(speedProj);
      
    } else {
      mouse.x = e.pageX;// - this.offset.left;
      mouse.y = e.pageY;// - this.offset.top;
    }
  });
  
  $("canvas").mouseleave(function(e) {
    e.preventDefault();
    
    targetEntity = null;
    isCharging = false;
    mouse.x = null;
    mouse.y = null;
    mouse.lx = null;
    mouse.ly = null;
  });
  
  populateCanvas();
  setInterval(update, 17); //~=60 fps
}

function populateCanvas() {
  var rootNote = Math.floor(Math.random() * (numKeys - maxKeyShift));
  
  var e1 = assembleRandom(rootNote, null);
  var e2 = assembleRandom(rootNote, e1);
  
  var e3 = assembleRandom(rootNote, e2);
  var e4 = assembleRandom(rootNote, e3);
  
  var e5 = assembleRandom(rootNote, e3);
  
  ECS.Entities.push(e1);
  ECS.Entities.push(e2);
  ECS.Entities.push(e3);
  ECS.Entities.push(e4);
  ECS.Entities.push(e5);
}

function drawEverything() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for(var id in ECS.Entities) {
    var entity = ECS.Entities[id];
    if(entity.components.renderer) {
      entity.components.renderer.render();
    }
  }
  
  if(targetEntity !== null) {
    ctx.beginPath();
    ctx.moveTo(mouse.x, mouse.y);
    ctx.lineTo(targetEntity.components.position.x,
               targetEntity.components.position.y);
    ctx.closePath();
    ctx.strokeStyle = "rgba(30, 30, 105, 0.3)";
    ctx.stroke();
  }
  
  if(mouse.lx !== null && mouse.ly !== null) {
    ctx.beginPath();
    if(targetEntity !== null){
      var targPos = targetEntity.components.position;
      var arrowPoint = getIntermediatePoint(mouse.x, targPos.x, mouse.y, targPos.y,
                        circleSpeed / distance(targPos.x, mouse.x, targPos.y, mouse.y));
    }
    
    var perpNormTargetVec = rot90(norm(getTargetVec()));
    var startX = mouse.x - perpNormTargetVec.x * circleSpeed;
    var startY = mouse.y - perpNormTargetVec.y * circleSpeed;
    var endX = mouse.x + perpNormTargetVec.x * circleSpeed;
    var endY = mouse.y + perpNormTargetVec.y * circleSpeed;
    
    ctx.moveTo(startX, startY);
    if(targetEntity !== null) {
      ctx.lineTo(arrowPoint.x, arrowPoint.y);
    }
    ctx.lineTo(endX, endY);
    ctx.closePath();
    ctx.strokeStyle = "rgba(80, 80, 165, 0.5)";
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, circleSize, 0, Math.PI*2, false);
    if(targetEntity !== null) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    } else {
      ctx.fillStyle = "rgba(180, 180, 255, 0.5)";
    }
    ctx.fill();
    ctx.closePath();
    ctx.strokeStyle = "rgba(30, 30, 105, 0.5)";
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(mouse.x - axisLength, mouse.y);
    ctx.lineTo(mouse.x + axisLength, mouse.y);
    ctx.closePath();
    ctx.strokeStyle = "rgba(105, 30, 105, 0.5)";
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(mouse.x, mouse.y - axisLength);
    ctx.lineTo(mouse.x, mouse.y + axisLength);
    ctx.closePath();
    ctx.strokeStyle = "rgba(105, 30, 105, 0.5)";
    ctx.stroke();
  }
}

//=============================== Sound ========================================
var soundPlaying = true;
var audioContext;
var gainNode;
var volume = 0.05;
var fullSpectrum = false;
var numKeys = 68;
var initialKey = 20;

function initSound() {
  try {
    // Fix up for prefixing
    audioContext = new (window.AudioContext||window.webkitAudioContext)();
  }
  catch(e) {
    alert('Web Audio API is not supported in this browser');
  }
  gainNode = audioContext.createGain();
  gainNode.gain.value = volume;
  gainNode.connect(audioContext.destination);
}

function createOscillatorFromSize(r) {
  var key = numKeys * (1 - r/maxCircleSize) + initialKey;
  if(!fullSpectrum) {
    key = Math.floor(key);
  }
  var freq = Math.pow(2, (key - 49)/12) * 440; 
  //https://en.wikipedia.org/wiki/Piano_key_frequencies
  var osc = audioContext.createOscillator();
  
  osc.type = "triangle";
  osc.frequency.value = freq;
  osc.start(audioContext.currentTime);
  osc.stop(audioContext.currentTime + 0.2);
  osc.connect(gainNode);
}

//============================ Helper Functions ================================
function norm(vec) {
  var r = magnitude(vec);
  return {
          x: vec.x / r,
          y: vec.y / r
        };
}

function magnitude(vec) {
  return Math.sqrt(vec.x * vec.x + vec.y * vec.y);
}

function rot90(vec) {
  var rotVec = {
    x: -1 * vec.y,
    y:  1 * vec.x
  }
  return rotVec;
}

function project(basis, vec) {
  var proj = {};
  var magnBasis = distance(0, basis.x, 0, basis.y);
  var scalar = (basis.x * vec.x + basis.y * vec.y) 
              / (magnBasis * magnBasis);
  proj.x = basis.x * scalar;
  proj.y = basis.y * scalar;
  return proj;
}

function distance(x1,x2,y1,y2) {
  var dx = x1 - x2;
  var dy = y1 - y2;
  return Math.sqrt(dx * dx + dy * dy);
}

function getIntermediatePoint(x1,x2,y1,y2,fraction) {
  var point = {};
  point.x = fraction * (x2 - x1) + x1;
  point.y = fraction * (y2 - y1) + y1;
  return point;
}

function getTargetVec() {
  var targVec = {};
  if(targetEntity !== null) {
    targVec = {
      x: targetEntity.components.position.x - mouse.x,
      y: targetEntity.components.position.y - mouse.y
    }
  } else {
    targVec = {
      x: 1,
      y: 0
    }
  }
  return targVec;
}

function getSizeBasis() {
  return {
          x: 1,
          y: 0
        }
}

function getMouseVec() {
  return  {
          x: mouse.lx - mouse.x,
          y: mouse.ly - mouse.y
        }
}