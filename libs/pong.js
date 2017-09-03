var renderer;
var scene;
var camera;
var spotLight;

function init()
{
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(35,
    window.innerWidth / window.innerHeight, 0.1, 1000);

  renderer = new THREE.WebGLRenderer();
  renderer.setClearColor(0x000000, 1.0);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMapEnabled = true;

  camera.position.x = 0;
  camera.position.y = -30;
  camera.position.z = 15;
  camera.lookAt(scene.position);

  loadSounds();
  createField();
  createWalls();
  createPaddles();
  createBall();
  addSpotLight();

  // Output to the stream
  document.body.appendChild(renderer.domElement);

  // Call render
  render();
}

function render()
{
  moveBallAndMaintainPaddles();

  // Request animation frame
  requestAnimationFrame(render);

  // Call render()
  renderer.render(scene, camera);
}

function addSpotLight()
{
  spotLight = new THREE.SpotLight(0xffffff);
  spotLight.position.set(10, 20, 20);
  spotLight.shadowCameraNear = 20;
  spotLight.shadowCameraFar = 50;
  spotLight.castShadow = true;
  scene.add(spotLight);
}

var field;
function createField()
{
  var width = 100; // 10;
  var height = 200; // 20;

  var fieldColor = 0x4BD121;

  field = new THREE.Mesh(new THREE.PlaneGeometry(width, height, 10, 10),
                         new THREE.MeshLambertMaterial({color: fieldColor}));
  scene.add(field);
}

var wall = []; // [0] = left wall, [1] = right wall
function createWalls()
{
  var wallWidth = 0.5; // Width
  var wallHeight = 20; // Length
  var wallDepth = 2.5; // Height
  var wallColor = 'cornsilk';

  var distance = 5; // Distance from center of room to each wall

  var geometry = new THREE.BoxGeometry(wallWidth, wallHeight, wallDepth);
  var material = new THREE.MeshBasicMaterial({color:wallColor});

  for (var i = 0; i < 2; i++)
  {
    wall[i] = new THREE.Mesh(geometry, material);
    wall[i].position.x = (i % 2 === 0 ? -1 : 1) * 5;
    wall[i].position.z = wallDepth / 2;
    scene.add(wall[i]);
    scene.add(new THREE.EdgesHelper(wall[i], 0x555555));
  }
}

var paddle = []; // [0] = Computer, [1] = Player
function createPaddles()
{
  var padWidth = 2;
  var padHeight = .33;
  var padDepth = 1.5; // Height of each paddle
  var padColor = ['blue', 'red'];

  // Distance from center of room to each paddle
  var distance = (wall[0].geometry.parameters.height / 2) - (padHeight / 2);

  var geometry = new THREE.BoxGeometry(padWidth, padHeight, padDepth);

  for (var i = 0; i < 2; i++)
  {
    paddle.push(new THREE.Mesh(geometry,
                               new THREE.MeshBasicMaterial({color:padColor[i]})));
    paddle[i].position.y = (i % 2 === 0 ? 1 : -1) * distance;
    paddle[i].position.z = padDepth / 2;
    scene.add(paddle[i]);
    scene.add(new THREE.EdgesHelper(paddle[i], 0x000000));
  }
}

var ball;
function createBall()
{
  var ballRadius = 0.5;
  var ballColor = 0xb2ff00;

  ball = new THREE.Mesh(new THREE.SphereGeometry(ballRadius, 32, 32),
                        new THREE.MeshBasicMaterial({color: ballColor}));
  ball.position.z = ballRadius;
  scene.add(ball);
  // scene.add(new THREE.EdgesHelper(ball, 0x000000)); // Crazy!
}

var v_x = randVelocity(-0.1, 0.1, -0.01, 0.01); // - west, + east
var v_y = randVelocity(-0.1, 0.1, -0.04, 0.04); // + north, - south
function moveBallAndMaintainPaddles()
{
  // Ball movements/bounces
  var wallBound = wall[1].position.x
                  - (wall[1].geometry.parameters.width / 2)
                  - ball.geometry.parameters.radius;
  var padPos = paddle[0].position.y
               - (paddle[0].geometry.parameters.height / 2)
               - ball.geometry.parameters.radius;
  var goalBound = (wall[0].geometry.parameters.height / 2)
                  + ball.geometry.parameters.radius;

  ball.position.x += v_x;
  ball.position.y += v_y;

  // Ball hits walls
  if(ball.position.x <= -wallBound || ball.position.x >= wallBound)
  {
    v_x = -v_x;
    // three.play();
  }

  // Ball hits paddle or scores
  if(ball.position.y < -padPos && v_y < 0) // Ball is @ or past player's pad
  {
    v_y = -v_y;

    if(Math.abs(paddle[1].position.x - ball.position.x) <= 2)
    {
      // v_x = -v_x; // x direction should NOT change
      // one.play();
    }
    else
    {
      ball.position.x = ball.position.y = 0;
      paddle[0].position.x = paddle[1].position.x = 0;

      v_x = randVelocity(-0.1, 0.1, -0.01, 0.01);
      v_y = randVelocity(-0.1, 0.1, -0.04, 0.04);
      // explode.play();
    }
  }
  else if(ball.position.y > padPos && v_y > 0) // Ball is @ or past comp's pad
  {
    v_y = -v_y;

    if(Math.abs(paddle[0].position.x - ball.position.x) <= 2)
    {
      // v_x = -v_x; // x direction should NOT change
      // two.play();
    }
    else
    {
      ball.position.x = ball.position.y = 0;
      v_x = randVelocity(-0.1, 0.1, -0.01, 0.01);
      v_y = randVelocity(-0.1, 0.1, -0.04, 0.04);
      // explode.play();
    }
  }


  // Player's paddle movements (incl. keyboard controls)
  var padSpeed = 0.05;
  var padBound = wall[1].position.x
                 - (wall[1].geometry.parameters.width / 2)
                 - (paddle[1].geometry.parameters.width / 2);

  if (paddle[1].position.x > -padBound && paddle[1].position.x < padBound)
  {
    if (Key.isDown(Key.A) || Key.isDown(Key.LEFTARROW))
      paddle[1].position.x -= padSpeed;
    else if (Key.isDown(Key.D) || Key.isDown(Key.RIGHTARROW))
      paddle[1].position.x += padSpeed;
  }
  else if (paddle[1].position.x === -padBound)
  {
    if (Key.isDown(Key.D) || Key.isDown(Key.RIGHTARROW))
      paddle[1].position.x += padSpeed;
  }
  else if (paddle[1].position.x === padBound)
  {
    if (Key.isDown(Key.A) || Key.isDown(Key.LEFTARROW))
      paddle[1].position.x -= padSpeed;
  }
  else if (paddle[1].position.x < -padBound)
    paddle[1].position.x = -padBound;
  else
    paddle[1].position.x = padBound;


  // Computer's paddle movements
  if (ball.position.x > -padBound && ball.position.x < padBound)
    paddle[0].position.x = ball.position.x;
}

var explode, one, two, three, four, five;
function loadSounds()
{
  explode = new Audio("sounds/Explosion.mp3");
  one = new Audio("sounds/1.mp3");
  two = new Audio("sounds/2.mp3");
  three = new Audio("sounds/3.mp3");
  four = new Audio("sounds/4.mp3");
  five = new Audio("sounds/5.mp3");
}

function randVelocity(min, max, excludeLower, excludeUpper)
{
  var result = 0;

  while (result >= excludeLower && result <= excludeUpper)
    result = min + (Math.random() * (max - min));

  return result;
}

window.onload = init;

