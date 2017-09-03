var renderer;
var scene;
var camera;
var spotLight;

function init()
{
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
  // frustum vertical view         aspect ratio							 frustum near plane     frustum far plane
    45,                          window.innerWidth / window.innerHeight, 0.1,                   1000 );

  renderer = new THREE.WebGLRenderer();
  //						color     alpha
  renderer.setClearColor( 0x000000, 1.0 );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.shadowMapEnabled = true;

  camera.position.x = 0;
  camera.position.y = 0;
  camera.position.z = 30;
  camera.lookAt( scene.position );

  loadSounds();
  createPlayBottom();
  createBoundingWalls();
  createPaddles();
  createBall();
  addSpotLight();

  // Output to the stream
  document.body.appendChild( renderer.domElement );

  // Call render
  render();
}

function render()
{
  moveBallAndMaintainPaddles();

  // Request animation frame
  requestAnimationFrame( render );

  // Call render()
  renderer.render( scene, camera );
}

function addSpotLight()
{
  spotLight = new THREE.SpotLight( 0xffffff );
      spotLight.position.set( 10, 20, 20 );
      spotLight.shadowCameraNear = 20;
      spotLight.shadowCameraFar = 50;
      spotLight.castShadow = true;
      scene.add(spotLight);
}

function createPlayBottom()
{
  var planeGeometry = new THREE.PlaneGeometry( 10, 20, 10, 10 );
  var planeMaterial = new THREE.MeshLambertMaterial({color:0x4BD121});
  var plane = new THREE.Mesh( planeGeometry, planeMaterial );
  scene.add(plane);
}

function createBoundingWalls()
{
  var leftWall = new THREE.BoxGeometry( 1, 18, 5 );
  var wallMaterial = new THREE.MeshBasicMaterial({color:'yellow'});
  var wall1 = new THREE.Mesh( leftWall, wallMaterial );
  wall1.position.x = -5;
  scene.add( wall1 );

  var edges1 = new THREE.EdgesHelper( wall1, 0x5555555 );
  scene.add( edges1 );

  var rightWall = new THREE.BoxGeometry( 1, 18, 5 );
  var wall2 = new THREE.Mesh( rightWall, wallMaterial );
  wall2.position.x = 5;
  scene.add( wall2 );

  var edges2 = new THREE.EdgesHelper( wall2, 0x555555 );
  scene.add( edges2 );
}

var paddle1, paddle2;
function createPaddles()
{
  var opponentPaddle = new THREE.BoxGeometry( 2, .5, 3 );
  var paddleMaterial = new THREE.MeshBasicMaterial({color:'salmon'});
  paddle1 = new THREE.Mesh( opponentPaddle, paddleMaterial );
  paddle1.position.y = 9;
  scene.add( paddle1 );

  var edges1 = new THREE.EdgesHelper( paddle1, 0x000000 );
  scene.add( edges1 );

  var playerPaddle = new THREE.BoxGeometry( 2, .5, 3 );
  paddle2 = new THREE.Mesh( playerPaddle, paddleMaterial );
  paddle2.position.y = -9;
  scene.add( paddle2 );

  var edges2 = new THREE.EdgesHelper( paddle2, 0x000000 );
  scene.add( edges2 );
}

var ball;
function createBall()
{
  var ballSphere = new THREE.SphereGeometry( .5 );
  var ballMaterial = new THREE.MeshBasicMaterial({color:'blue'});
  ball = new THREE.Mesh( ballSphere, ballMaterial );
  scene.add( ball );
}

var xDir = .02;
var yDir = .04;
function moveBallAndMaintainPaddles()
{
  ball.position.x += xDir;
  ball.position.y += yDir;

  if( Key.isDown( Key.A ) )
  {
    paddle2.position.x -= 0.02;
  }
  else if( Key.isDown( Key.D ) )
  {
    paddle2.position.x += 0.02;
  }

  if( ball.position.x < -4 )
  {
    xDir = .02;
    three.play();
  }
  else if( ball.position.x > 4 )
  {
    xDir = -0.02;
    four.play();
  }

  if( ball.position.y < -8.5 && yDir < 0 )
  {
    yDir = 0.04;

    if( Math.abs( paddle2.position.x - ball.position.x ) <= 2 )
    {
      xDir = -xDir;
      one.play();
    }
    else
    {
      ball.position.x = ball.position.y = 0;
      explode.play();
    }
  }
  else if( ball.position.y > 8.5 && yDir > 0 )
  {
    yDir = -0.04;

    if( Math.abs( paddle1.position.x - ball.position.x ) <= 2 )
    {
      xDir = -xDir;
      two.play();
    }
    else
    {
      ball.position.x = ball.position.y = 0;
      explode.play();
    }
  }

  paddle1.position.x = ball.position.x;
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

window.onload = init;

