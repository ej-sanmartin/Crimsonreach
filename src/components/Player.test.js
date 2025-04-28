import { Player } from './Player';
import { controls } from '../utils/controls';

// Mock the controls module
jest.mock('../utils/controls', () => ({
  controls: {
    getInput: jest.fn()
  }
}));

describe('Player', () => {
  let player;
  let mockScene;
  
  beforeEach(() => {
    mockScene = {
      add: jest.fn()
    };
    player = new Player(mockScene);
    
    // Reset the mock before each test
    controls.getInput.mockReset();
  });
  
  test('creates a mesh with correct geometry and material', () => {
    expect(player.mesh.geometry.type).toBe('BoxGeometry');
    expect(player.mesh.material.color.getHex()).toBe(0xff0000);
  });
  
  test('updates position based on input', () => {
    const originalX = player.mesh.position.x;
    const originalY = player.mesh.position.y;
    
    // Mock input values
    controls.getInput.mockReturnValue({ x: 1, y: 1 });
    
    player.update();
    
    expect(player.mesh.position.x).not.toBe(originalX);
    expect(player.mesh.position.y).not.toBe(originalY);
    expect(player.mesh.position.x).toBe(0.1); // x should increase by 0.1 (1 * 0.1)
    expect(player.mesh.position.y).toBe(0.1); // y should increase by 0.1 (1 * 0.1)
  });
}); 