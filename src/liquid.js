const $ = require("jquery");
const THREE = require('three');
import Stats from 'three/examples/jsm/libs/stats.module.js';

const mainShader = `
void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
`;

const heightVertexShader = `
		uniform vec2 iResolution;
		uniform vec4 iMouse;
		uniform float iTime;
		uniform int iFrame;
		uniform sampler2D iChannel0;
		uniform sampler2D iChannel1;
		uniform sampler2D iChannel2;
		uniform sampler2D iChannel3;
		uniform vec3 iChannelResolution0;
		uniform vec3 iChannelResolution1;
		uniform vec3 iChannelResolution2;
		uniform vec3 iChannelResolution3;

    varying vec2 vUV;

    void main() {
      vUV = uv;

			float height = tanh(texture(iChannel1, uv).z);
			vec3 pos = position;
			pos.y = 0.1 * height;
      vec4 modelViewPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * modelViewPosition;
    }
`;

const commonShader = require('webpack-glsl-loader!./fragments3d/common.frag');
const bufferAShader = require('webpack-glsl-loader!./fragments3d/bufferA.frag') + mainShader;
const bufferBShader = require('webpack-glsl-loader!./fragments3d/bufferB.frag') + mainShader;
const bufferCShader = require('webpack-glsl-loader!./fragments3d/bufferC.frag') + mainShader;
const fragmentShader = require('webpack-glsl-loader!./fragments3d/image.frag') + mainShader;

const heightShader = require('webpack-glsl-loader!./fragments3d/height.frag') + mainShader;

/*
let camera, scene, renderer;
let geometry, material, mesh;

function init(width, height) {
	camera = new THREE.PerspectiveCamera(70, width / height, 0.01, 10);
	camera.position.z = 1;

	scene = new THREE.Scene();

	geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
	material = new THREE.MeshNormalMaterial();

	mesh = new THREE.Mesh(geometry, material);
	scene.add(mesh);

	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(width, height);
	renderer.setAnimationLoop(animation);
	return renderer.domElement;
}

function animation( time ) {
	mesh.rotation.x = time / 2000;
	mesh.rotation.y = time / 1000;

	renderer.render(scene, camera);
}
*/

export function init(canvas, width, height) {
  //const canvas = document.querySelector('#c');
  const renderer = new THREE.WebGLRenderer({canvas, width, height});
  renderer.autoClearColor = false;
	renderer.setSize(width, height);
  
  const hdim = 4;
  const simWidth = 512 * hdim;
  const simHeight = 512 * hdim;

  const camera = new THREE.OrthographicCamera(
    -1, // left
     1, // right
     1, // top
    -1, // bottom
    -1, // near,
     1, // far
  );
  const scene = new THREE.Scene();
  const plane = new THREE.PlaneGeometry(2, 2);

  const loader = new THREE.TextureLoader();
  const texture = loader.load('./dist/background-shadertoy-tttfR2.jpg');
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  const opts = {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
    type: THREE.FloatType
  };
	const bufferAs = [];
	const bufferBs = [];
	//const bufferCs = [];
	//const bufferDs = [];

  let f = () => new THREE.WebGLRenderTarget(simWidth, simHeight, opts);
  const bufferA = f();
  const bufferB = f();
  const bufferC = f();
  const bufferD = f();

  const uniformsA = {
    iTime: { value: 0 },
    iFrame: { value: 0 },
    iResolution:  { value: new THREE.Vector3() },
    iChannel0: { value: null }
  };
  const materialA = new THREE.ShaderMaterial({
    fragmentShader: commonShader + bufferAShader,
    uniforms: uniformsA
  });

  const uniformsB = {
    iTime: { value: 0 },
    iFrame: { value: 0 },
    iResolution:  { value: new THREE.Vector3() },
    iChannel0: { value: null }
  };
  const materialB = new THREE.ShaderMaterial({
    fragmentShader: commonShader + bufferBShader,
    uniforms: uniformsB
  });

  const uniformsC = {
    iTime: { value: 0 },
    iFrame: { value: 0 },
    iResolution:  { value: new THREE.Vector3() },
    iChannel0: { value: bufferA.texture }
  };
  const materialC = new THREE.ShaderMaterial({
    fragmentShader: commonShader + bufferCShader,
    uniforms: uniformsC
  });

  const uniforms = {
    iResolution:  { value: new THREE.Vector3() },
    iMouse: { value: new THREE.Vector4() },
    iTime: { value: 0 },
    iFrame: { value: 0 },
    iChannel0: { value: bufferA.texture },
    iChannel1: { value: bufferC.texture },
    iChannel2: { value: bufferB.texture },
    iChannel3: { value: texture },
    iChannelResolution0: { value: new THREE.Vector3() },
    iChannelResolution1: { value: new THREE.Vector3() },
    iChannelResolution2: { value: new THREE.Vector3() },
    iChannelResolution3: { value: new THREE.Vector3() }
  };
  const material = new THREE.ShaderMaterial({
    fragmentShader: commonShader + fragmentShader,
    uniforms: uniforms
  });
  const mesh = new THREE.Mesh(plane, material);
  scene.add(mesh);

  // Add 3D scene on a separate object for easy visibility toggling
  const dataWidth = 256;
  const dataHeight = 256;
  const objects3d = new THREE.Object3D();
  scene.add(objects3d);
  const terrainPlane = new THREE.PlaneBufferGeometry(10, 10, dataWidth, dataHeight);
  terrainPlane.rotateX(-Math.PI * 0.5);
  //const terrainMaterial = new THREE.MeshStandardMaterial({ color: 0x008000 });
  const data = new Float32Array(4 * dataWidth * dataHeight);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random();
  }
  const heightMap = new THREE.DataTexture(data, dataWidth, dataHeight, THREE.RGBAFormat, THREE.FloatType);
  heightMap.needsUpdate = true;
  const uniforms3d = {
    iResolution:  { value: new THREE.Vector3() },
    iMouse: { value: new THREE.Vector4() },
    iTime: { value: 0 },
    iFrame: { value: 0 },
    iChannel0: { value: bufferD.texture },
    iChannel1: { value: bufferC.texture },
    iChannel2: { value: heightMap },
    iChannel3: { value: texture },
    iChannelResolution0: { value: new THREE.Vector3() },
    iChannelResolution1: { value: new THREE.Vector3() },
    iChannelResolution2: { value: new THREE.Vector3() },
    iChannelResolution3: { value: new THREE.Vector3() }
  };

  const terrainMaterial = new THREE.ShaderMaterial({
		vertexShader: heightVertexShader,
    fragmentShader: commonShader + heightShader,
    uniforms: uniforms3d
  });
  const terrainMesh = new THREE.Mesh(terrainPlane, terrainMaterial);
  //terrainMesh.rotation.set(-0.5 * Math.PI, 0.0, 0.0 * Math.PI);
  objects3d.add(terrainMesh);
  const camera3d = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  //objects3d.add(camera3d);
  camera3d.position.set(5, 20, 5);
  camera3d.lookAt(terrainMesh.position);
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
  objects3d.add(dirLight);
  dirLight.position.set(0.0, 10.0, 0.0);
  dirLight.lookAt(terrainMesh.position);

  const stats = new Stats();
  $("#subcontent").append(stats.dom);

  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  let frame = 0;

  function render(time) {
    stats.begin();

    time *= 0.001;  // convert to seconds

    const canvas = renderer.domElement;
    uniformsA.iResolution.value.set(simWidth, simHeight, 1);
    uniformsB.iResolution.value.set(simWidth, simHeight, 1);
    uniformsC.iResolution.value.set(simWidth, simHeight, 1);
    uniforms.iResolution.value.set(simWidth, simHeight, 1);
    if (texture.image !== undefined && texture.image.width > 0) {
      uniforms.iChannelResolution3.value.set(texture.image.width, texture.image.height, 0.0);
      uniforms.iChannelResolution3.needsUpdate = true;
    }
    uniformsA.iTime.value = time;
    uniformsB.iTime.value = time;
    uniformsC.iTime.value = time;
    uniforms.iTime.value = time;
    uniforms3d.iTime.value = time;
    uniformsA.iFrame.value = frame;
    uniformsB.iFrame.value = frame;
    uniformsC.iFrame.value = frame;
    uniforms.iFrame.value = frame;
    uniforms3d.iFrame.value = frame;

    renderer.setSize(simWidth, simHeight);
    objects3d.visible = false;
    mesh.visible = true;
    for (let r = 0; r < 4; r++) {
      uniformsA.iChannel0.value = bufferB.texture;
      mesh.material = materialA;
      renderer.setRenderTarget(bufferA);
      renderer.render(scene, camera);

      uniformsB.iChannel0.value = bufferA.texture;
      mesh.material = materialB;
      renderer.setRenderTarget(bufferB);
      renderer.render(scene, camera);
    }

    uniformsC.iChannel0.value = bufferA.texture;
    mesh.material = materialC;
    renderer.setRenderTarget(bufferC);
    renderer.render(scene, camera);

    uniforms.iChannel0.value = bufferA.texture;
    uniforms.iChannel2.value = bufferB.texture;
    mesh.material = material;
    renderer.setRenderTarget(bufferD);
    renderer.render(scene, camera);

    //resizeRendererToDisplaySize(renderer);
    renderer.setSize(width, height);
    mesh.visible = false;
    objects3d.visible = true;
    renderer.setRenderTarget(null);
    renderer.clear();
    renderer.render(scene, camera3d);

    frame++;

    stats.end();

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

/*module.exports = {
	init: main
};*/
