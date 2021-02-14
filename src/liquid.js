const THREE = require('three');

const mainShader = `
void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
`;

const commonShader = require('webpack-glsl-loader!./fragments/common.frag');
const bufferAShader = require('webpack-glsl-loader!./fragments/bufferA.frag') + mainShader;
const bufferBShader = require('webpack-glsl-loader!./fragments/bufferB.frag') + mainShader;
const bufferCShader = require('webpack-glsl-loader!./fragments/bufferC.frag') + mainShader;
const fragmentShader = require('webpack-glsl-loader!./fragments/image.frag') + mainShader;

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

function main(canvas, width, height) {
  //const canvas = document.querySelector('#c');
  const renderer = new THREE.WebGLRenderer({canvas, width, height});
  renderer.autoClearColor = false;
	renderer.setSize(width, height);

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
  const texture = loader.load('./bayer.jpg');
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
	const bufferA = new THREE.WebGLRenderTarget(width, height, opts);
	const bufferB = new THREE.WebGLRenderTarget(width, height, opts);
	const bufferC = new THREE.WebGLRenderTarget(width, height, opts);
 
  const uniformsA = {
    iTime: { value: 0 },
    iFrame: { value: 0 },
    iResolution:  { value: new THREE.Vector3() },
    iChannel0: { value: bufferB.texture }
  };
  const materialA = new THREE.ShaderMaterial({
    fragmentShader: commonShader + bufferAShader,
    uniforms: uniformsA
  });

  const uniformsB = {
    iTime: { value: 0 },
    iFrame: { value: 0 },
    iResolution:  { value: new THREE.Vector3() },
    iChannel0: { value: bufferA.texture }
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
    time *= 0.001;  // convert to seconds

    resizeRendererToDisplaySize(renderer);

    const canvas = renderer.domElement;
    uniformsA.iResolution.value.set(canvas.width, canvas.height, 1);
    uniformsB.iResolution.value.set(canvas.width, canvas.height, 1);
    uniformsC.iResolution.value.set(canvas.width, canvas.height, 1);
    uniforms.iResolution.value.set(canvas.width, canvas.height, 1);
    if (texture.image !== undefined && texture.image.width > 0) {
      uniforms.iChannelResolution3.value.set(texture.image.width, texture.image.height, 0.0);
      uniforms.iChannelResolution3.needsUpdate = true;
    }
    uniformsA.iTime.value = time;
    uniformsB.iTime.value = time;
    uniformsC.iTime.value = time;
    uniforms.iTime.value = time;
    uniformsA.iFrame.value = frame;
    uniformsB.iFrame.value = frame;
    uniformsC.iFrame.value = frame;
    uniforms.iFrame.value = frame;

    for (let i = 0; i < 4; i++) {
      mesh.material = materialA;
      renderer.setRenderTarget(bufferA);
      renderer.render(scene, camera);

      mesh.material = materialB;
      renderer.setRenderTarget(bufferB);
      renderer.render(scene, camera);

      mesh.material = materialC;
      renderer.setRenderTarget(bufferC);
      renderer.render(scene, camera);
    }

    mesh.material = material;
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
    
    frame++;

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

module.exports = {
	init: main
};
