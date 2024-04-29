import { useRef, useEffect } from 'react'
import { Ion, Math as CesiumMath, Terrain, Viewer, JulianDate, ClockRange } from 'cesium';
import * as THREE from "three";
import vertexShader from './shaders/vertex.glsl?raw';
import fragmentShader from './shaders/fragment.glsl?raw';
import "cesium/Build/Cesium/Widgets/widgets.css";
import './App.css'
import { TextureSequenceManager } from './TextureSequenceManager';


// @ts-ignore
window.CESIUM_BASE_URL = '/cesium';

const earthRadiusMeter = 6371 * 1000;
// Clouds are floating on top so we can go thru/under
const envelopeRadius = earthRadiusMeter * 1.01;


function App() {
  const isMounted = useRef<boolean>(false);
  const cesiumContainerRef = useRef<HTMLDivElement>(null);
  const threeContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if(isMounted.current) return;
    isMounted.current = true;

    (async () => {
      if (!cesiumContainerRef.current) return;

      Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiOGQxZWI1ZS00ZmI4LTQzNjUtYmVlMC1lZDk0NThlYTI1NWUiLCJpZCI6OTY4MzcsImlhdCI6MTcxMzkwMjExNH0.OeKVwevS_jVLxAh5zwVFrk3bKqWvdrd2kdrv2D_ixds";

      // Loading the cloud coverage textures
      const tsm = await TextureSequenceManager.fromList("./textures/texturelist.json", true);

      // Creating the Cesium viewer
      const viewer = new Viewer(cesiumContainerRef.current, {
        terrain: Terrain.fromWorldTerrain(),
      });

      // Creating the ThreeJS objects
      const renderer = new THREE.WebGLRenderer({
        alpha: true
      });
      threeContainerRef.current?.appendChild(renderer.domElement);
      renderer.setSize(cesiumContainerRef.current.clientWidth, cesiumContainerRef.current.clientHeight);

      const scene = new THREE.Scene();
      // @ts-ignore
      const camera = new THREE.PerspectiveCamera(CesiumMath.toDegrees(viewer.camera.frustum.fov), cesiumContainerRef.current.clientWidth / cesiumContainerRef.current.clientHeight, 100, viewer.camera.frustum.far);
      camera.matrixAutoUpdate = false;
      const geometry = new THREE.SphereGeometry(envelopeRadius, 128, 128);
      const material = new THREE.RawShaderMaterial( {
        glslVersion: "300 es",
        uniforms: {
          texA: { value: tsm.getStart().texture },
          texB: { value: tsm.getStart().texture },
          ratio: { value: 1 },
        },
        vertexShader,
        fragmentShader,
        side: THREE.FrontSide,
        transparent: true
      });

      const envelopeMesh = new THREE.Mesh(geometry, material);
      envelopeMesh.rotation.x = Math.PI / 2;
      scene.add(envelopeMesh);

      // Tune the date ranges
      const startJulian = JulianDate.fromDate(tsm.getStart().date);
      const endJulian = JulianDate.fromDate(tsm.getEnd().date);
      viewer.clock.currentTime = startJulian;
      viewer.clock.shouldAnimate = false;
      viewer.clock.startTime = startJulian;
      viewer.clock.stopTime = endJulian;
      viewer.clock.clockRange = ClockRange.LOOP_STOP;
      viewer.clock.multiplier = 8000;
      viewer.timeline.zoomTo(startJulian, endJulian);

      // Even when resizing the window
      window.addEventListener("resize", () => {        
        const width = cesiumContainerRef.current.clientWidth;
        const height = cesiumContainerRef.current.clientHeight;
        camera.aspect = width / height
        camera.updateProjectionMatrix()
        renderer.setSize( width, height );
        renderer.render(scene, camera);
      });


      // Synchronizing the cloud globe view with the Cesium globe view
      viewer.scene.preRender.addEventListener(() => {
        const civm = viewer.camera.inverseViewMatrix;
        camera.matrixWorld.set(
          civm[0], civm[4], civm[8 ], civm[12],
          civm[1], civm[5], civm[9 ], civm[13],
          civm[2], civm[6], civm[10], civm[14],
          civm[3], civm[7], civm[11], civm[15]
        );
        renderer.render(scene, camera);
      });

      // When the Cesium timeline runs, we sync the cloud motions
      viewer.clock.onTick.addEventListener((clock) => {
        const timestamp = + JulianDate.toDate(clock.currentTime);

        // Select the two right texture for the given timestamp
        const [texA, texB] = tsm.getTextures(timestamp);
        material.uniforms.texA.value = texA.texture;
        material.uniforms.texB.value = texB.texture;
        
        // Computing the ratio to create time-wise linear interpolation between frames
        const ratio = texB.timestamp === texA.timestamp ? 1 : (timestamp - texA.timestamp) / (texB.timestamp - texA.timestamp);
        material.uniforms.ratio.value = ratio;
        
        renderer.render(scene, camera);
      });

      // Startingthe animation only when Cesium is ready
      viewer.scene.globe.tileLoadProgressEvent.addEventListener(function(numberOfPendingRequests) {
        if (numberOfPendingRequests === 0) {
          viewer.clock.shouldAnimate = true;
        }
      });
      
    })()
    

  }, []);

  return (
    <>
      <span className="links">
      See source code on <a href="https://github.com/jonathanlurie/cesium-globe-weather">@jonathanlurie's GitHub</a><br></br>
      Total cloud coverage data from <a href="https://donneespubliques.meteofrance.fr/?fond=produit&id_produit=130&id_rubrique=51">Meteo France ARPEGE</a>
      </span>
      <div className="threeContainer" ref={threeContainerRef}></div>
      <div className="cesiumContainer" ref={cesiumContainerRef}></div>
    </>
  )
}

export default App
;