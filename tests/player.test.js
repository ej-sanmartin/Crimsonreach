import { Player } from '../src/components/Player';

describe('Player', () => {
  let player;
  let mockScene;
  
  beforeEach(() => {
    mockScene = {
      add: jest.fn()
    };
    player = new Player(mockScene);
  });
  
  test('creates a mesh with correct geometry and material', () => {
    expect(player.mesh.geometry.type).toBe('BoxGeometry');
    expect(player.mesh.material.color.getHex()).toBe(0xff0000);
  });
  
  test('updates position based on input', () => {
    const originalX = player.mesh.position.x;
    const originalY = player.mesh.position.y;
    
    player.update();
    
    expect(player.mesh.position.x).not.toBe(originalX);
    expect(player.mesh.position.y).not.toBe(originalY);
  });
}); 