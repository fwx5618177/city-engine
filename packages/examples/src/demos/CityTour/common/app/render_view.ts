import * as THREE from 'three';

interface RenderViewInterface {
  resize: () => void;
  render: () => void;
  camera: () => THREE.Camera;
  domElement: () => HTMLElement;
  renderer: () => THREE.WebGLRenderer;
  makeDirty: () => void;
}

class RenderView implements RenderViewInterface {
  private readonly _renderer: THREE.WebGLRenderer;
  private readonly _camera: THREE.PerspectiveCamera;
  private readonly _scene: THREE.Scene;
  private _isDirty = true;

  constructor(containerEl: HTMLElement, scene: THREE.Scene) {
    this._scene = scene;

    this._renderer = new THREE.WebGLRenderer({ antialias: true });
    this._renderer.setPixelRatio(window.devicePixelRatio);
    this._renderer.setSize(containerEl.clientWidth, containerEl.clientHeight);
    containerEl.appendChild(this._renderer.domElement);

    this._camera = new THREE.PerspectiveCamera(
      45,
      containerEl.clientWidth / containerEl.clientHeight,
      0.1,
      10000,
    );
    this._camera.position.set(0, 150, 400);
    this._camera.lookAt(new THREE.Vector3(0, 0, 0));
  }

  public resize(): void {
    const containerEl = this._renderer.domElement.parentElement;
    if (!containerEl) return;

    const width = containerEl.clientWidth;
    const height = containerEl.clientHeight;

    this._camera.aspect = width / height;
    this._camera.updateProjectionMatrix();

    this._renderer.setSize(width, height);
    this.makeDirty();
  }

  public render(): void {
    if (this._isDirty) {
      this._renderer.render(this._scene, this._camera);
      this._isDirty = false;
    }
  }

  public camera(): THREE.Camera {
    return this._camera;
  }

  public domElement(): HTMLElement {
    return this._renderer.domElement;
  }

  public renderer(): THREE.WebGLRenderer {
    return this._renderer;
  }

  public makeDirty(): void {
    this._isDirty = true;
  }
}

export { RenderView, RenderViewInterface };
