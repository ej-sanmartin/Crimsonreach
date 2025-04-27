/**
 * WebSocket client for multiplayer functionality
 */
export class Network {
  constructor(url = 'ws://localhost:8080') {
    this.socket = new WebSocket(url);
    this.connected = false;
    
    this.socket.onopen = () => {
      this.connected = true;
      console.log('Connected to server');
    };
    
    this.socket.onclose = () => {
      this.connected = false;
      console.log('Disconnected from server');
    };
  }
  
  sendState(state) {
    if (this.connected) {
      this.socket.send(JSON.stringify(state));
    }
  }
  
  onMessage(callback) {
    this.socket.onmessage = (event) => {
      callback(JSON.parse(event.data));
    };
  }
} 