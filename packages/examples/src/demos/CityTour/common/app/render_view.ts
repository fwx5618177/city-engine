import * as THREE from 'three';

export class RenderView {
  private readonly _renderer: THREE.WebGLRenderer;
  private readonly _camera: THREE.PerspectiveCamera;

  constructor(containerEl: HTMLElement, scene: THREE.Scene) {
    // Create renderer with proper settings
    this._renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });

    // Set renderer size and pixel ratio
    this._renderer.setSize(
      containerEl.clientWidth,
      containerEl.clientHeight,
      false,
    );
    this._renderer.setPixelRatio(window.devicePixelRatio);

    // Configure renderer
    this._renderer.setClearColor(0x000000, 0);
    this._renderer.shadowMap.enabled = true;
    this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Clear container and append canvas
    while (containerEl.firstChild) {
      containerEl.removeChild(containerEl.firstChild);
    }
    containerEl.appendChild(this._renderer.domElement);

    // Create and configure camera
    this._camera = new THREE.PerspectiveCamera(
      45, // Field of view
      containerEl.clientWidth / containerEl.clientHeight, // Aspect ratio
      0.1, // Near plane
      10000, // Far plane
    );

    // Set initial camera position and orientation
    this._camera.position.set(0, 150, 150);
    this._camera.lookAt(new THREE.Vector3(0, 0, 0));
    this._camera.updateProjectionMatrix();

    // Perform initial render
    this._renderer.render(scene, this._camera);

    // Log initialization
    console.log('RenderView initialized:', {
      containerSize: `${containerEl.clientWidth}x${containerEl.clientHeight}`,
      pixelRatio: window.devicePixelRatio,
      cameraPosition: this._camera.position,
    });

    // Bind resize handler
    this.resize = this.resize.bind(this);
  }

  public resize = (): void => {
    const containerEl = this._renderer.domElement.parentElement;
    if (!containerEl) return;

    const width = containerEl.clientWidth;
    const height = containerEl.clientHeight;

    this._camera.aspect = width / height;
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(width, height, false);
  };

  public render(scene: THREE.Scene): void {
    if (!scene) {
      console.warn('Attempting to render with null scene');
      return;
    }
    this._renderer.render(scene, this._camera);
  }

  public camera(): THREE.Camera {
    return this._camera;
  }

  public renderer(): THREE.WebGLRenderer {
    return this._renderer;
  }

  public domElement(): HTMLElement {
    return this._renderer.domElement;
  }
}
