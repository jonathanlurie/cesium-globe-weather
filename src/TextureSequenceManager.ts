import * as THREE from "three";
import { loadTextureAsync } from "./tools";

export type TextureInfo = {
  filepath: string,
  iso8601: string,
}

export type TextureInfoWithDate = TextureInfo & {
  date: Date,
  timestamp: number,
  /**
   * Unix epoch in milliseconds
   */
  texture?: THREE.Texture | null,
}


export class TextureSequenceManager {

  /**
   * Create an instance of TextureSequenceManager and optionally loads all the textures
   */
  static async fromList(listFilepath: string, loadTextures: boolean = false): Promise<TextureSequenceManager> {
    const res = await fetch(listFilepath);

    if (res.status !== 200) {
      throw new Error("Could not load texture sequence list.");
    }

    const list = await res.json();
    const tsm = new TextureSequenceManager(list);

    if (loadTextures) {
      await tsm.loadTextures();
    }

    return tsm;
  }
  

  private textureInfoWithDate: TextureInfoWithDate[] = [];
  private _isReady: boolean = false;

  constructor(textureInfos: TextureInfo[]) {
    this.textureInfoWithDate = textureInfos.map((ti: TextureInfo) => {
      const timestamp = Date.parse(ti.iso8601);
      const date = new Date(timestamp);
      return { ...ti, timestamp, date } as TextureInfoWithDate;
    });

    this.textureInfoWithDate.sort((a, b) => a.timestamp < b.timestamp ? -1 : 1);
  }

  
  /**
   * Loading all the texture in GPU. Not the wisest but ok for a PoC.
   */
  async loadTextures() {
    const textures = await Promise.allSettled( this.textureInfoWithDate.map(ti => loadTextureAsync(ti.filepath)) );
    console.log(textures);

    for (let i = 0; i < this.textureInfoWithDate.length; i +=1) {
      this.textureInfoWithDate[i].texture = textures[i].status === "fulfilled" ? (textures[i] as PromiseFulfilledResult<THREE.Texture>).value : null;
    }

    this.textureInfoWithDate = this.textureInfoWithDate.filter(ti => ti.texture);

    // If some texture are missing but some still made it, then we consider the sequence valid
    if (this.textureInfoWithDate.length) {
      this._isReady = true;
    }

    
  }

  isReady(): boolean {
    return this._isReady;
  }

  /**
   * For a given timestamp, returns the two textures necessary for the interpolation as
   * [before texture, after texture]
   */
  getTextures(timestamp: number): [TextureInfoWithDate, TextureInfoWithDate] {
    if (timestamp <= this.textureInfoWithDate[0].timestamp) {
      return [this.textureInfoWithDate[0], this.textureInfoWithDate[0]];
    }

    if (timestamp >= this.textureInfoWithDate.at(-1).timestamp) {
      return [this.textureInfoWithDate.at(-1), this.textureInfoWithDate.at(-1)];
    }

    for (let i = 1; i < this.textureInfoWithDate.length; i +=1) {
      if (this.textureInfoWithDate[i - 1].timestamp <= timestamp && this.textureInfoWithDate[i].timestamp >= timestamp) {
        return [this.textureInfoWithDate[i - 1], this.textureInfoWithDate[i]]
      }
    }
  }

  /**
   * Get the TextureInfoWithDate that starts the sequence
   */
  getStart(): TextureInfoWithDate {
    return this.textureInfoWithDate[0];
  }

  /**
   * Get the TextureInfoWithDate that ends the sequence
   */
  getEnd(): TextureInfoWithDate {
    return this.textureInfoWithDate.at(-1);
  }

}