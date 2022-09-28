import {
  TilesRenderer,
} from '3d-tiles-renderer';
import {
  Scene,
  DirectionalLight,
  AmbientLight,
  WebGLRenderer,
  PerspectiveCamera,
  sRGBEncoding,
} from 'three';
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {DRACOLoader} from "three/examples/jsm/loaders/DRACOLoader";
import { FlyOrbitControls } from './FlyOrbitControls.js';

let camera, controls, scene, renderer;
let tilesRenderer, skyTiles;

init();
render();

function init() {

  scene = new Scene();

  // primary camera view
  renderer = new WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setClearColor( 0xd8cec0 );
  renderer.outputEncoding = sRGBEncoding;
  window['renderer'] = renderer;

  document.getElementById('app')?.appendChild( renderer.domElement );
  renderer.domElement.tabIndex = 1;

  camera = new PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 4000 );
  camera.position.set( 0, 2000, 0 );


  // controls
  controls = new FlyOrbitControls( camera, renderer.domElement );
  controls.screenSpacePanning = false;
  controls.minDistance = 1;
  controls.maxDistance = 2000;

  // lights
  const dirLight = new DirectionalLight( 0xffffff );
  dirLight.position.set( 1, 2, 3 );
  scene.add( dirLight );

  const ambLight = new AmbientLight( 0xffffff, 0.2 );
  scene.add( ambLight );

  onWindowResize();
  window.addEventListener( 'resize', onWindowResize, false );

  document.getElementById('create')?.addEventListener('click', () => {
    create()
  })
  document.getElementById('destroy')?.addEventListener('click', () => {
    destroy()
  })
  document.getElementById('newDestroy')?.addEventListener('click', () => {
    scene.remove(tilesRenderer.group)

    window['tiles'].lruCache.itemList.forEach( tile => {

      window['tiles'].disposeTile( tile );

    } );
    tilesRenderer.dispose()
    window['tiles'].lruCache.markAllUnused();
    window['tiles'].lruCache.itemSet.clear();
    window['tiles'].lruCache.itemList = [];
    window['tiles'].lruCache.callbacks.clear();
    window['tiles'].lruCache = null;
    window['tiles'].visibleTiles.clear();
    window['tiles'].activeTiles.clear();
    window['tiles'].downloadQueue.callbacks.clear();
    window['tiles'].downloadQueue.items = [];
    window['tiles'].downloadQueue = null;
    window['tiles'].parseQueue.callbacks.clear();
    window['tiles'].parseQueue.items = [];
    window['tiles'].parseQueue = null;
    clearGroup( window['tiles'].group );
    window['tiles'].cameraMap.clear();
    window['tiles'].cameras = [];
    window['tiles'].cameraInfo = [];
    window['tiles'].group = null;
    window['tiles'].tileSets = {};
    tilesRenderer = null;
  })

}
function clearGroup( group ) {

  group.traverse( ( item ) => {

    if ( item.isMesh ) {

      item.geometry.dispose();
      item.material.dispose();
      if ( item.material.texture && item.material.texture.dispose ) {

        item.material.texture.dispose();

      }

    }
    delete item.featureTable;
    delete item.batchTable;

  } );
  delete group.tilesRenderer;
  group.remove( ...group.children );

}
function create(){
  tilesRenderer = new TilesRenderer( './bl-2/tileset.json' );
  const gltfLoader = new GLTFLoader(tilesRenderer.manager)
  const dRACOLoader = new DRACOLoader()
  const dracoDecodePath = 'https://cdn.jsdelivr.net/npm/three@0.143/examples/js/libs/draco/'
  dRACOLoader.setDecoderPath(dracoDecodePath)
  gltfLoader.setDRACOLoader(dRACOLoader)
  tilesRenderer.downloadQueue.maxJobs = 6;
  tilesRenderer.parseQueue.maxJobs = 6;
  tilesRenderer.manager.addHandler(/\.gltf$/i, gltfLoader)
  tilesRenderer.fetchOptions.mode = 'cors';
  tilesRenderer.lruCache.minSize = 900;
  tilesRenderer.lruCache.maxSize = 1300;
  tilesRenderer.errorTarget = 12;
  window['tiles'] = tilesRenderer;
  scene.add(tilesRenderer.group);
}
function destroy(){
  scene.remove(tilesRenderer.group)
  tilesRenderer.dispose()
  tilesRenderer = null;
}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setPixelRatio( window.devicePixelRatio );

}

function render() {

  requestAnimationFrame( render );

  camera.updateMatrixWorld();

  if(tilesRenderer){
    tilesRenderer.setCamera( camera );
    tilesRenderer.setResolutionFromRenderer( camera, renderer );
    tilesRenderer.update();
  }
  renderer.render( scene, camera );

}
