//==================================== ECS =====================================

var ECS = { 
  Entities:[],
  Components:{},
  Assemblages:{},
  Systems:{
    input: function() {
    },
    
    movement: function() {
      for(var id in ECS.Entities) {
        var entity = ECS.Entities[id];
        if(entity.components.mover) {
            entity.components.mover.move();
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
              
              if(Math.sqrt(dx * dx + dy * dy) < 
                  entity.components.collider.radius +
                  entity2.components.collider.radius) {
                entity.components.collider.collide(entity2);
                entity2.components.collider.collide(entity);
              }
            }
          }
        }
      }
    },
    
    cleanUp: function() {
      for(var i = 0; i < ECS.Entities.length; i++) {
        var entity = ECS.Entities[i];
        entity.print();
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

//Takes a circle collider radius and a FUNCTION that takes a collider
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

//================================ Assemblages =================================

function assembleTest(x,y,s,r) {
  var entity = new ECS.Entity();
  entity.addComponent( new ECS.Components.Health(1) );
  entity.addComponent( new ECS.Components.Position(x,y));
  entity.addComponent( new ECS.Components.Renderer(function() {
    ctx.beginPath();
    ctx.rect(entity.components.position.x - r,
             entity.components.position.y - r,2*r,2*r);
    ctx.strokeStyle = "rgba(30, 30, 105, 0.95)";
    ctx.stroke();
    ctx.closePath();
  }));
  entity.addComponent( new ECS.Components.Mover(s, function(){
    entity.components.position.x += this.speed;
    console.log("3");
  }));
  return entity;
}


//================================ Canvas Code =================================

function createCanvas() {
  var canvas = document.createElement("Canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight - 2;
  canvas.style.zIndex = 10;
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
  
  initCanvas();
  setInterval(update, 17); //60 fps
}

function initCanvas() {
  ECS.Entities.push(assembleTest(30,40,2,8));
  ECS.Entities.push(assembleTest(350,420,1,2));
  ECS.Entities.push(assembleTest(130,40,-1,10));
  ECS.Entities.push(assembleTest(130,140,12,5));
  
  ctx.beginPath();
  ctx.rect(20, 40, 50, 50);
  ctx.fillStyle = "#FF0000";
  ctx.fill();
  ctx.closePath();

  ctx.beginPath();
  ctx.arc(240, 160, 20, 0, Math.PI*2, false);
  ctx.fillStyle = "green";
  ctx.fill();
  ctx.closePath();
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