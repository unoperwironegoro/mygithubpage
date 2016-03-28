//==================================== ECS =====================================
var canvasMoving = true;

var ECS = { 
  Entities:[],
  Components:{},
  Assemblages:{},
  Systems:{
    input: function() {
    },
    
    movement: function() {
      if(canvasMoving) {
        for(var id in ECS.Entities) {
          var entity = ECS.Entities[id];
          if(entity.components.mover) {
              entity.components.mover.move();
          }
        }
      }
    },
    
    collision: function() {
      for(var i = 0; i < ECS.Entities.length; i++) {
        var entity = ECS.Entities[i];
        if(entity.components.collider) {
          for(var j = i + 1; j < ECS.Entities.length; j++) {
            var entity2 = ECS.Entities[j];
            if(entity2.components.collider) {
              var pos1 = entity.components.position;
              var pos2 = entity2.components.position;
              var dx = pos1.x - pos2.x;
              var dy = pos1.y - pos2.y;
              var d = Math.sqrt(dx * dx + dy * dy);
              
              if(d < 
                  entity.components.collider.radius +
                  entity2.components.collider.radius) {
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

function assembleTest(e) {
  var s = Math.random() * 7;
  var r = Math.random() * 30;
  
  var x = Math.random() * this.canvas.width;
  var y = Math.random() * this.canvas.height;
  
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
  }));
  
  entity.addComponent( new ECS.Components.Renderer(function() {
    ctx.beginPath();
    ctx.arc(entity.components.position.x, 
            entity.components.position.y, r, 0, Math.PI*2, false);
    if(e !== null) {
      ctx.fillStyle = "white";
    } else {
      ctx.fillStyle = "rgb(180, 180, 255)";
    }
    ctx.fill();
    ctx.strokeStyle = "rgba(30, 30, 105, 0.95)";
    ctx.stroke();
    
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


//================================ Canvas Code =================================

function resetCanvas() {
  clearCanvas();
  populateCanvas();
}

function clearCanvas() {
  ECS.Entities = [];
}

function createCanvas() {
  var canvas = document.createElement("Canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight - 2;
  canvas.style.zIndex = 1;
  canvas.style.position = "absolute";
  canvas.style.border   = "1px solid";
  
  document.body.insertBefore(canvas, document.body.children[1]);
  
  this.canvas = canvas;
  this.ctx = canvas.getContext("2d");
  
  window.addEventListener("resize", function(event){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    drawEverything();
  });
  
  populateCanvas();
  setInterval(update, 17); //60 fps
}

function populateCanvas() {
  var e1 = assembleTest(null);
  var e2 = assembleTest(e1);
  
  var e3 = assembleTest(e2);
  var e4 = assembleTest(e3);
  
  var e5 = assembleTest(e3);
  var e6 = assembleTest(e5);
  
  ECS.Entities.push(e1);
  ECS.Entities.push(e2);
  ECS.Entities.push(e3);
  ECS.Entities.push(e4);
  ECS.Entities.push(e5);
  ECS.Entities.push(e6);
}

function drawEverything() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for(var id in ECS.Entities) {
    var entity = ECS.Entities[id];
    if(entity.components.renderer) {
      entity.components.renderer.render();
    }
  }
}