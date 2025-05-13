export class SceneManager {
  constructor(renderer) {
    this.renderer = renderer;
    this.currentScene = null;
    this.camera = null;
  }

  setScene(scene) {
    this.currentScene = scene;
    this.camera = scene.camera;
  }

  update() {
    if (this.currentScene && this.currentScene.update) {
      this.currentScene.update();
    }
  }

  render() {
    if (this.currentScene && this.camera) {
      this.renderer.render(this.currentScene, this.camera);
    }
  }
} 