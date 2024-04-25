import * as THREE from "three";

export async function loadTextureAsync(filepath): Promise<THREE.Texture> {
  // const texture = new THREE.TextureLoader().load(filepath); 

  return new Promise((resolve, reject) => {
    new THREE.TextureLoader()
      .load(
        filepath, 
        
        // on load
        (texture: THREE.Texture) => {
          resolve(texture);
        },

        // on progress
        null,

        // on error
        (err: Error) => {
          reject(err);
        }
      ); 
  })

}