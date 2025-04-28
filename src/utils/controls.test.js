import { controls } from './controls';

// Mock event objects
const mockMouseEvent = {
  clientX: 400,
  clientY: 300
};

const mockTouchEvent = {
  preventDefault: jest.fn(),
  touches: [{
    clientX: 400,
    clientY: 300
  }]
};

describe('Controls', () => {
  let addEventListenerSpy;
  let removeEventListenerSpy;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Reset controls state
    controls.input = { x: 0, y: 0 };
    controls.isTouching = false;
    
    // Mock window properties
    Object.defineProperty(window, 'innerWidth', { value: 800, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 600, writable: true });
    
    // Define properties we want to mock
    Object.defineProperty(window, 'ontouchstart', { 
      value: undefined,
      writable: true,
      configurable: true,
      enumerable: true
    });
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: 0,
      writable: true,
      configurable: true
    });
    
    // Spy on event listeners
    addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    // Clean up spies
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  describe('Device Detection', () => {
    it('should detect touch device when ontouchstart exists', () => {
      window.ontouchstart = true;
      controls.init();
      
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'touchstart',
        expect.any(Function),
        { passive: true }
      );
      expect(addEventListenerSpy).not.toHaveBeenCalledWith(
        'mousemove',
        expect.any(Function)
      );
    });

    it('should detect touch device when maxTouchPoints > 0', () => {
      navigator.maxTouchPoints = 1;
      controls.init();
      
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'touchstart',
        expect.any(Function),
        { passive: true }
      );
      expect(addEventListenerSpy).not.toHaveBeenCalledWith(
        'mousemove',
        expect.any(Function)
      );
    });

    it('should detect non-touch device', () => {
      // For non-touch device, we need to ensure 'ontouchstart' is not in window
      delete window.ontouchstart;
      navigator.maxTouchPoints = 0;
      controls.init();
      
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'mousemove',
        expect.any(Function),
        { passive: true }
      );
      expect(addEventListenerSpy).not.toHaveBeenCalledWith(
        'touchstart',
        expect.any(Function)
      );
    });
  });

  describe('Mouse Controls', () => {
    beforeEach(() => {
      // For non-touch device, we need to ensure 'ontouchstart' is not in window
      delete window.ontouchstart;
      navigator.maxTouchPoints = 0;
      controls.init();
    });

    it('should handle mouse movement correctly', () => {
      const mouseMoveHandler = addEventListenerSpy.mock.calls.find(
        call => call[0] === 'mousemove'
      )[1];
      
      mouseMoveHandler(mockMouseEvent);
      
      // Expected values:
      // x = (400/800) * 2 - 1 = 0
      // y = -(300/600) * 2 + 1 = 0
      expect(controls.input).toEqual({ x: 0, y: 0 });
    });

    it('should handle mouse movement at screen edges', () => {
      const mouseMoveHandler = addEventListenerSpy.mock.calls.find(
        call => call[0] === 'mousemove'
      )[1];
      
      // Test left edge
      mouseMoveHandler({ ...mockMouseEvent, clientX: 0 });
      expect(controls.input.x).toBe(-1);
      
      // Test right edge
      mouseMoveHandler({ ...mockMouseEvent, clientX: 800 });
      expect(controls.input.x).toBe(1);
      
      // Test top edge
      mouseMoveHandler({ ...mockMouseEvent, clientY: 0 });
      expect(controls.input.y).toBe(1);
      
      // Test bottom edge
      mouseMoveHandler({ ...mockMouseEvent, clientY: 600 });
      expect(controls.input.y).toBe(-1);
    });
  });

  describe('Touch Controls', () => {
    beforeEach(() => {
      window.ontouchstart = true;
      controls.init();
    });

    it('should handle touch start correctly', () => {
      const touchStartHandler = addEventListenerSpy.mock.calls.find(
        call => call[0] === 'touchstart'
      )[1];
      
      touchStartHandler(mockTouchEvent);
      
      expect(controls.isTouching).toBe(true);
      expect(controls.input).toEqual({ x: 0, y: 0 });
    });

    it('should handle touch move correctly', () => {
      const touchStartHandler = addEventListenerSpy.mock.calls.find(
        call => call[0] === 'touchstart'
      )[1];
      const touchMoveHandler = addEventListenerSpy.mock.calls.find(
        call => call[0] === 'touchmove'
      )[1];
      
      touchStartHandler(mockTouchEvent);
      touchMoveHandler(mockTouchEvent);
      
      expect(mockTouchEvent.preventDefault).toHaveBeenCalled();
      expect(controls.input).toEqual({ x: 0, y: 0 });
    });

    it('should handle touch end correctly', () => {
      const touchStartHandler = addEventListenerSpy.mock.calls.find(
        call => call[0] === 'touchstart'
      )[1];
      const touchEndHandler = addEventListenerSpy.mock.calls.find(
        call => call[0] === 'touchend'
      )[1];
      
      touchStartHandler(mockTouchEvent);
      touchEndHandler();
      
      expect(controls.isTouching).toBe(false);
      expect(controls.input).toEqual({ x: 0, y: 0 });
    });

    it('should not process touch move when not touching', () => {
      const touchMoveHandler = addEventListenerSpy.mock.calls.find(
        call => call[0] === 'touchmove'
      )[1];
      
      touchMoveHandler(mockTouchEvent);
      
      expect(mockTouchEvent.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should remove all event listeners on cleanup', () => {
      controls.init();
      controls.cleanup();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'mousemove',
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'touchstart',
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'touchmove',
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'touchend',
        expect.any(Function)
      );
    });
  });
}); 