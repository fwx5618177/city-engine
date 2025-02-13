import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';

export class CoreEngine {
  private scene: BABYLON.Scene;
  private canvas: HTMLCanvasElement;
  private engine: BABYLON.Engine;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.engine = new BABYLON.Engine(this.canvas, true);
    this.scene = new BABYLON.Scene(this.engine);

    // Add a camera to the scene
    const camera = new BABYLON.ArcRotateCamera(
      'camera',
      0,
      0,
      5,
      BABYLON.Vector3.Zero(),
      this.scene,
    );
    camera.attachControl(this.canvas, true);

    // Add a light to the scene
    const light = new BABYLON.HemisphericLight(
      'light',
      new BABYLON.Vector3(0, 1, 0),
      this.scene,
    );
    console.log('CoreEngine created:', light);

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });

    window.addEventListener('resize', () => {
      this.engine.resize();
    });
  }

  public loadModel(url: string) {
    BABYLON.SceneLoader.ImportMesh('', '', url, this.scene, (loadedMeshes) => {
      // do something with the loadedMeshes
      console.log('loadModel:', loadedMeshes);
    });
  }
}
