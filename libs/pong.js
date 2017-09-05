var renderer;
var scene;
var camera;
var spotLight;

var field;
var room = {
             width  : 10,
             length : 24
           };
var wall = {
             arr       : [], // [0] = north, [1] = south, [2] = east, [3] = west
             line      : [],
             thickness : 0.2,
             height    : 2,
             color     : 'white',
             edgeColor : 'black'
           };
var pad = {
            arr       : [],   // [0] = Computer, [1] = Player
            line      : [],
            width     : 2,
            thickness : 0.4,
            height    : 1.5,
            dist      : 10,   // Distance from center of room to pad's surface
            speed     : 0.05, // Movement speed
            hit       : 0.02, // y-velocity increase on hit
            color     : ['blue', 'red'],
            edgeColor : 'black'
          };
var ball;
var rest = false;
var v_x = randVelocity(-0.1, 0.1, -0.01, 0.01); // - west, + east
var v_y = randVelocity(-0.1, 0.1, -0.04, 0.04); // + north, - south
var score = [0, 0];
var scoreboard;
var wallHit, padHit1, padHit2, ding, music;

function initPong3D()
{
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(35,
    window.innerWidth / window.innerHeight, 0.1, 1000);

  renderer = new THREE.WebGLRenderer();
  renderer.setClearColor(0x000000, 1.0);
  renderer.setSize(window.innerWidth - 16, window.innerHeight - 16);
  renderer.shadowMap.enabled = true;

  camera.position.x = 0;
  camera.position.y = -30;
  camera.position.z = 15;
  camera.lookAt(scene.position);

  loadSounds();
  createField();
  createWalls();
  createPads();
  createBall();
  playMusic();
  addSpotLight();

  // Output to the stream
  document.body.appendChild(renderer.domElement);

  // Call render
  render();
}

function updateScore()
{
  document.getElementById('scoreboard').innerHTML = "<p1>" + score[0] + "</p1> | <p2>" + score[1] + "</p2><br/>";
}

function render()
{
  moveBallAndMaintainPads();
  updateScore();

  // Request animation frame
  requestAnimationFrame(render);

  // Call render()
  renderer.render(scene, camera);
}

function addSpotLight()
{
  spotLight = new THREE.SpotLight(0xffffff, 1, 1, Math.PI/2, 0.99, 0);
  spotLight.position.set(0, 0, 15);
  spotLight.castShadow = true;
  scene.add(spotLight);
}

function createField()
{
  var width = 100;
  var height = 200;

  var fieldColor = 0x4BD121;

  field = new THREE.Mesh(new THREE.PlaneGeometry(width, height, 10, 10),
                         new THREE.MeshLambertMaterial({color: fieldColor}));
  scene.add(field);
}

function createWalls()
{
  var geoNS = new THREE.BoxGeometry(room.width, wall.thickness, wall.height);
  var geoEW = new THREE.BoxGeometry(wall.thickness, room.length
                                    + (wall.thickness * 2), wall.height);
  var mat = new THREE.MeshPhongMaterial({color: wall.color});
  var lineMat = new THREE.LineBasicMaterial({color: wall.edgeColor});

  for (var i = 0; i < 4; i++)
  {
    if (i < 2)
    {
      if (i != 1)
        wall.arr.push(new THREE.Mesh(geoNS, mat));
      else
        wall.arr.push(new THREE.Mesh(geoNS, new THREE.MeshPhongMaterial(
                                                  {color: wall.color,
                                                   opacity: 0.45,
                                                   transparent: true})));
      wall.line.push(new THREE.LineSegments(new THREE.EdgesGeometry(geoNS),
                                            lineMat));

      wall.arr[i].position.y = wall.line[i].position.y
        = (i % 2 === 0 ? 1 : -1) * ((room.length / 2) + (wall.thickness / 2));
      wall.arr[i].position.z = wall.line[i].position.z = wall.height / 2;
    }
    else
    {
      wall.arr.push(new THREE.Mesh(geoEW, mat));
      wall.line.push(new THREE.LineSegments(new THREE.EdgesGeometry(geoEW),
                                            lineMat));

      wall.arr[i].position.x = wall.line[i].position.x
        = (i % 2 === 0 ? -1 : 1) * ((room.width / 2) + (wall.thickness / 2));
      wall.arr[i].position.z = wall.line[i].position.z = wall.height / 2;
    }

    scene.add(wall.arr[i]);
    scene.add(wall.line[i]);
  }
}

function createPads()
{
  var geo = new THREE.BoxGeometry(pad.width, pad.thickness, pad.height);
  var lineMat = new THREE.LineBasicMaterial({color: pad.edgeColor});

  for (var i = 0; i < 2; i++)
  {
    pad.arr.push(new THREE.Mesh(geo, new THREE.MeshPhongMaterial(
                                                 {color:pad.color[i]})));
    pad.line.push(new THREE.LineSegments(new THREE.EdgesGeometry(geo),
                                         lineMat));

    pad.arr[i].position.y = pad.line[i].position.y
      = (i % 2 === 0 ? 1 : -1) * (pad.dist + (pad.thickness / 2));
    pad.arr[i].position.z = pad.line[i].position.z = pad.height / 2;

    scene.add(pad.arr[i]);
    scene.add(pad.line[i]);
  }
}

function createBall()
{
  var ballRadius = 0.5;
  var ballColor = 'lightgreen';

  ball = new THREE.Mesh(new THREE.SphereGeometry(ballRadius, 32, 32),
                        new THREE.MeshStandardMaterial({color: ballColor}));
  ball.position.z = ballRadius;
  scene.add(ball);
}

function moveBallAndMaintainPads()
{
  // Ball movements/bounces
  var wallBoundX = (room.width / 2) - ball.geometry.parameters.radius;
  var wallBoundY = (room.length / 2) - ball.geometry.parameters.radius;
  var padPos = pad.dist - ball.geometry.parameters.radius;
  var goalBound = pad.dist + pad.thickness + ball.geometry.parameters.radius;

  if (Math.abs(ball.position.y) < wallBoundY) // When ball is within end walls
  {
    moveBallBy(v_x, v_y);

    // Ball hits side walls
    if (Math.abs(ball.position.x) >= wallBoundX)
    {
      v_x = -v_x;
      wallHit.play();
    }

    // Ball reaches paddle (or beyond)
    if (ball.position.y < -padPos && v_y < 0) // South side
    {
      if (ball.position.y >= -goalBound) // Can potentially be hit
      {
        if (Math.abs(pad.arr[1].position.x - ball.position.x) // Direct hit
            < (pad.width / 2))
        {
          v_y = pad.hit - v_y;
          padHit1.play();
        }
        else if (Math.abs(pad.arr[1].position.x - ball.position.x) // Corner hit
                 < ((pad.width / 2) + ball.geometry.parameters.radius))
        {
          v_y = pad.hit - v_y;
          padHit1.play();
        }
      }
      else // Miss
      {
        if (ball.position.y < -goalBound && !rest)
        {
          rest = true;
          // explode.play();
          pointScored(0);
        }
      }
    }
    else if (ball.position.y > padPos && v_y > 0) // North side
    {
      if (ball.position.y <= goalBound) // Can potentially be hit
      {
        if (Math.abs(pad.arr[0].position.x - ball.position.x) // Direct hit
            < (pad.width / 2))
        {
          v_y = -(pad.hit + v_y);
          padHit2.play();
        }
        else if (Math.abs(pad.arr[0].position.x - ball.position.x) // Corner hit
                 < ((pad.width / 2) + ball.geometry.parameters.radius))
        {
          v_y = -(pad.hit + v_y);
          padHit2.play();
        }
      }
      else // Miss
      {
        if (ball.position.y > goalBound && !rest)
        {
          rest = true;
          // explode.play();
          pointScored(1);
        }
      }
    }
  }


  // Player's paddle movements (incl. keyboard controls)
  var padBound = (room.width / 2) - (pad.width / 2);

  if (-padBound < pad.arr[1].position.x && pad.arr[1].position.x < padBound)
  {
    if (Key.isDown(Key.A) || Key.isDown(Key.LEFTARROW))
      movePadBy(1, -pad.speed);
    else if (Key.isDown(Key.D) || Key.isDown(Key.RIGHTARROW))
      movePadBy(1, pad.speed);
  }
  else if (pad.arr[1].position.x === -padBound)
  {
    if (Key.isDown(Key.D) || Key.isDown(Key.RIGHTARROW))
      movePadBy(1, pad.speed);
  }
  else if (pad.arr[1].position.x === padBound)
  {
    if (Key.isDown(Key.A) || Key.isDown(Key.LEFTARROW))
      movePadBy(1, -pad.speed);
  }
  else if (pad.arr[1].position.x < -padBound)
    movePadTo(1, -padBound);
  else if (padBound < pad.arr[1].position.x)
    movePadTo(1, padBound);


  // Computer's paddle movements
  if (-padBound < ball.position.x && ball.position.x < padBound)
  {
    movePadTo(0, ball.position.x);
  }
}

function loadSounds()
{
  wallHit = new Audio("sounds/wallHit.wav");
  padHit1 = new Audio("sounds/padHit1.wav");
  padHit2 = new Audio("sounds/padHit2.wav");
  ding = new Audio("sounds/ding.wav");
  music = new Audio("sounds/music.wav");
}

function movePadTo(player, x)
{ pad.arr[player].position.x = pad.line[player].position.x = x; }

function movePadBy(player, x)
{ pad.arr[player].position.x = pad.line[player].position.x += x; }

function moveBallBy(x, y)
{ ball.position.x += x; ball.position.y += y; }

function moveBallTo(x, y)
{ ball.position.x = x; ball.position.y = y; }

function randVelocity(min, max, excludeLower, excludeUpper)
{
  var result = 0;

  while (result >= excludeLower && result <= excludeUpper)
    result = min + (Math.random() * (max - min));

  return result;
}

function playMusic()
{
  music.addEventListener('ended', function()
  {
    this.currentTime = 0;
    this.play();
  }, false);
  music.play();
}

function pointScored(player)
{
  var timeout = 3000;

  score[player]++;
  ding.play();
  setTimeout(function () { reset(); rest = false; } , timeout);
}

function reset()
{
  moveBallTo(0, 0);
  //movePadTo(0, 0);
  //movePadTo(1, 0);

  v_x = randVelocity(-0.1, 0.1, -0.01, 0.01);
  v_y = randVelocity(-0.1, 0.1, -0.04, 0.04);
}

