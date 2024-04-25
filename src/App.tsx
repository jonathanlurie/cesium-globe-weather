import { useState, useRef, useEffect } from 'react'
import { Cartesian3, Ion, Math as CesiumMath, Terrain, Viewer } from 'cesium';
import * as THREE from "three";
import vertexShader from './shaders/vertex.glsl?raw';
import fragmentShader from './shaders/fragment.glsl?raw';
import "cesium/Build/Cesium/Widgets/widgets.css";
import './App.css'

console.log(vertexShader, fragmentShader);


// @ts-ignore
window.CESIUM_BASE_URL = '/cesium';

function App() {
  // const [count, setCount] = useState(0)
  const isMounted = useRef<boolean>(false);
  const cesiumContainerRef = useRef<HTMLDivElement>(null);
  const threeContainerRef = useRef<HTMLDivElement>(null);
  

  useEffect(() => {
    if(isMounted.current) return;

    isMounted.current = true;

    (async () => {
      if (!cesiumContainerRef.current) return;

      Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiOGQxZWI1ZS00ZmI4LTQzNjUtYmVlMC1lZDk0NThlYTI1NWUiLCJpZCI6OTY4MzcsImlhdCI6MTcxMzkwMjExNH0.OeKVwevS_jVLxAh5zwVFrk3bKqWvdrd2kdrv2D_ixds";

      const viewer = new Viewer(cesiumContainerRef.current, {
        terrain: Terrain.fromWorldTerrain(),
      });


      const earthRadiusMeter = 6371 * 1000;
      const envelopeRadius = earthRadiusMeter * 1.01;

      const renderer = new THREE.WebGLRenderer({
        alpha: true
      });
      threeContainerRef.current?.appendChild(renderer.domElement);
      renderer.setSize(window.innerWidth, window.innerHeight);

      const scene = new THREE.Scene();

      // @ts-ignore
      const fovDeg = CesiumMath.toDegrees(viewer.camera.frustum.fov)
      const camera = new THREE.PerspectiveCamera(fovDeg, window.innerWidth / window.innerHeight, 100, viewer.camera.frustum.far);
      camera.matrixAutoUpdate = false;

      // Some basic texture to test globe alignment
      const texture = new THREE.TextureLoader().load('textures/total-cloud_2024-04-20T00-00-00Z.jpg' ); 

      const geometry = new THREE.SphereGeometry(envelopeRadius, 128, 128);
      // const material = new THREE.MeshBasicMaterial({side: THREE.FrontSide, opacity: 0.8, transparent: true, map:texture});

      const material = new THREE.RawShaderMaterial( {
        glslVersion: "300 es",
        uniforms: {
          tex: { value: texture }
        },
        vertexShader,
        fragmentShader,
        side: THREE.FrontSide,
        transparent: true
      } );


      const envelopeMesh = new THREE.Mesh(geometry, material);
      envelopeMesh.rotation.x = Math.PI / 2;
      
      scene.add(envelopeMesh);

      viewer.scene.preRender.addEventListener(() => {
        const civm = viewer.camera.inverseViewMatrix;

        camera.matrixWorld.set(
          civm[0], civm[4], civm[8 ], civm[12],
          civm[1], civm[5], civm[9 ], civm[13],
          civm[2], civm[6], civm[10], civm[14],
          civm[3], civm[7], civm[11], civm[15]
        );

        renderer.render(scene, camera);
      })
    })()
    

  }, []);

  return (
    <>
      <div className="threeContainer" ref={threeContainerRef}></div>
      <div className="cesiumContainer" ref={cesiumContainerRef}></div>
    </>
  )
}

export default App
;