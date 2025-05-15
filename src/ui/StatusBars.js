import { UIElement } from './UIElement';

/**
 * StatusBars UI component that displays health and magic
 * @class StatusBars
 * @extends UIElement
 */
export class StatusBars extends UIElement {
  /**
   * Create status bars for health and magic
   * @param {Object} options - Configuration options
   * @param {number} options.healthMax - Maximum health value (default: 100)
   * @param {number} options.healthCurrent - Current health value (default: 100)
   * @param {number} options.magicMax - Maximum magic value (default: 100)
   * @param {number} options.magicCurrent - Current magic value (default: 100)
   */
  constructor(options = {}) {
    super();
    
    this.options = {
      healthMax: options.healthMax || 100,
      healthCurrent: options.healthCurrent || 100,
      magicMax: options.magicMax || 100,
      magicCurrent: options.magicCurrent || 100
    };
    
    // Create SVG filter for pixelation effect
    this._createPixelationFilter();
    
    // Create outer flex container
    this.outerContainer = document.createElement('div');
    this.outerContainer.style.position = 'fixed';
    this.outerContainer.style.top = '24px';
    this.outerContainer.style.left = '24px';
    this.outerContainer.style.zIndex = '1000';
    this.outerContainer.style.pointerEvents = 'none';
    this.outerContainer.style.display = 'flex';
    this.outerContainer.style.flexDirection = 'row';
    this.outerContainer.style.alignItems = 'center';
    this.outerContainer.style.padding = '0';
    // Remove pixel filter for full visibility
    this.outerContainer.style.filter = 'brightness(.8) contrast(1)';

    // Create gothic spire with number
    this.spire = document.createElement('div');
    this.spire.className = 'gothic-spire';
    this.spire.innerHTML = '<span class=\'gothic-spire-number\'>100</span>';
    this.spire.style.position = 'relative';
    this.spire.style.left = '0';
    this.spire.style.top = '0';
    this.spire.style.transform = 'none';
    this.spire.style.width = '38px';
    this.spire.style.height = '60px';
    this.spire.style.display = 'flex';
    this.spire.style.alignItems = 'center';
    this.spire.style.justifyContent = 'center';
    this.spire.style.zIndex = '2';
    this.spire.style.marginRight = '14px';
    this.outerContainer.appendChild(this.spire);

    // Create gothic border container for the bars
    this.barsBorderContainer = document.createElement('div');
    this._applyGothicBorder(this.barsBorderContainer);
    this.barsBorderContainer.style.display = 'flex';
    this.barsBorderContainer.style.flexDirection = 'column';
    this.barsBorderContainer.style.justifyContent = 'center';
    this.barsBorderContainer.style.alignItems = 'flex-start';
    this.barsBorderContainer.style.padding = '0';

    // Create inner container for bars
    this.container = document.createElement('div');
    this.container.style.padding = '3px';
    this.container.style.background = 'rgba(20, 20, 25, 0.7)';
    this.container.style.borderRadius = '2px';
    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'column';
    this.container.style.justifyContent = 'center';
    this.container.style.alignItems = 'flex-start';
    
    // Create health bar
    this.healthBarContainer = this._createBarContainer();
    this.healthBar = this._createBar('#ff0000');
    this.healthBarContainer.appendChild(this.healthBar);
    
    // Create magic bar
    this.magicBarContainer = this._createBarContainer();
    this.magicBar = this._createBar('#0055ff');
    this.magicBarContainer.appendChild(this.magicBar);
    
    // Add bars to container
    this.container.appendChild(this.healthBarContainer);
    this.container.appendChild(this.magicBarContainer);
    
    // Add container to gothic border container
    this.barsBorderContainer.appendChild(this.container);
    
    // Add both spire and bordered bars to the outer flex container
    this.outerContainer.appendChild(this.barsBorderContainer);
    
    // Add container to document body
    document.body.appendChild(this.outerContainer);
    
    // Add SVG gothic spire tip
    if (!this.spire.querySelector('.gothic-spire-tip')) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '38');
      svg.setAttribute('height', '22');
      svg.setAttribute('viewBox', '0 0 38 22');
      svg.classList.add('gothic-spire-tip');
      svg.style.position = 'absolute';
      svg.style.top = '-20px';
      svg.style.left = '0';
      svg.style.zIndex = '3';
      svg.innerHTML = `
        <path d="M1,22 Q19,0 37,22 Q28,10 19,22 Q10,10 1,22 Z" fill="#44464a" stroke="#23232a" stroke-width="2"/>
      `;
      this.spire.appendChild(svg);
    }
    
    // Add gothic spire CSS if not present
    if (!document.getElementById('gothic-spire-style')) {
      const style = document.createElement('style');
      style.id = 'gothic-spire-style';
      style.textContent = `
        .gothic-spire {
          background: linear-gradient(to top, #23232a 80%, #888 100%);
          border-left: 3px solid #44464a;
          border-right: 3px solid #44464a;
          border-radius: 10px 10px 16px 16px / 20px 20px 40px 40px;
          box-shadow: 0 0 10px #000a, 0 0 0 2px #23232a inset;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .gothic-spire-number {
          color: #fff;
          font-family: 'Cinzel', serif;
          font-size: 1.2rem;
          font-weight: bold;
          text-shadow: 0 0 2px #23232a, 0 0 4px #888, 1px 1px 0 #444;
          -webkit-text-stroke: 1px #bbb;
          text-stroke: 1px #bbb;
          letter-spacing: 1px;
          z-index: 2;
          margin-top: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Set initial values
    this.setHealth(this.options.healthCurrent);
    this.setMagic(this.options.magicCurrent);
  }
  
  /**
   * Create SVG filter for pixelation effect
   * @private
   */
  _createPixelationFilter() {
    if (!document.getElementById('ps1-ui-filters')) {
      const svgFilter = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svgFilter.id = 'ps1-ui-filters';
      svgFilter.style.width = '0';
      svgFilter.style.height = '0';
      svgFilter.style.position = 'absolute';
      svgFilter.style.zIndex = '-1000';
      svgFilter.innerHTML = `
        <filter id="pixel-filter">
          <feGaussianBlur stdDeviation="0.2" />
          <feTurbulence type="fractalNoise" baseFrequency="0.4" numOctaves="1" stitchTiles="stitch" result="noise"/>
          <feComposite operator="arithmetic" k1="0" k2="0.02" k3="0" k4="0" in="SourceGraphic" in2="noise"/>
        </filter>
      `;
      document.body.appendChild(svgFilter);
    }
  }
  
  /**
   * Apply gothic border style to an element
   * @param {HTMLElement} element - The element to style
   * @private
   */
  _applyGothicBorder(element) {
    if (!document.getElementById('gothic-border-style')) {
      const style = document.createElement('style');
      style.id = 'gothic-border-style';
      style.textContent = `
        .gothic-border {
          background-color: #111216;
          border: 3px solid #44464a;
          box-shadow: 0 0 20px 2px #000a, 0 0 0 4px #23232a inset;
          position: relative;
        }
        /* Spikes and embellishments */
        .gothic-border:before, .gothic-border:after {
          content: '';
          position: absolute;
          width: 30px;
          height: 10px;
          background: linear-gradient(to right, transparent 40%, #44464a 50%, transparent 60%);
          top: -13px;
          left: 20px;
          z-index: 2;
          border-radius: 0 0 10px 10px;
        }
        .gothic-border:after {
          top: auto;
          bottom: -13px;
          left: 200px;
          transform: scaleY(-1);
        }
        .gothic-border-inner:before, .gothic-border-inner:after {
          content: '';
          position: absolute;
          width: 18px;
          height: 18px;
          border-color: #23232a;
          border-style: solid;
        }
        .gothic-border-inner:before {
          bottom: -3px;
          left: -3px;
          border-width: 0 0 3px 3px;
        }
        .gothic-border-inner:after {
          bottom: -3px;
          right: -3px;
          border-width: 0 3px 3px 0;
        }
        /* Pointed corners */
        .gothic-border .gothic-corner {
          position: absolute;
          width: 18px;
          height: 18px;
          background: none;
        }
        .gothic-border .gothic-corner.tl {
          top: -10px; left: -10px;
          border-left: 6px solid #44464a;
          border-top: 12px solid #23232a;
        }
        .gothic-border .gothic-corner.tr {
          top: -10px; right: -10px;
          border-right: 6px solid #44464a;
          border-top: 12px solid #23232a;
        }
        .gothic-border .gothic-corner.bl {
          bottom: -10px; left: -10px;
          border-left: 6px solid #44464a;
          border-bottom: 12px solid #23232a;
        }
        .gothic-border .gothic-corner.br {
          bottom: -10px; right: -10px;
          border-right: 6px solid #44464a;
          border-bottom: 12px solid #23232a;
        }
      `;
      document.head.appendChild(style);
    }
    element.classList.add('gothic-border');
    // Add inner element for bottom corners
    const innerBorder = document.createElement('div');
    innerBorder.classList.add('gothic-border-inner');
    innerBorder.style.position = 'absolute';
    innerBorder.style.top = '0';
    innerBorder.style.left = '0';
    innerBorder.style.width = '100%';
    innerBorder.style.height = '100%';
    innerBorder.style.pointerEvents = 'none';
    element.appendChild(innerBorder);
    // Add pointed corners
    ['tl','tr','bl','br'].forEach(pos => {
      const corner = document.createElement('div');
      corner.className = `gothic-corner ${pos}`;
      element.appendChild(corner);
    });
  }
  
  /**
   * Create a container for a bar
   * @returns {HTMLElement} - The bar container
   * @private
   */
  _createBarContainer() {
    const container = document.createElement('div');
    container.style.width = '250px';
    container.style.height = '15px';
    container.style.marginBottom = '5px';
    container.style.background = 'rgba(0, 0, 0, 0.7)';
    container.style.borderRadius = '2px';
    container.style.overflow = 'hidden';
    return container;
  }
  
  /**
   * Create a bar with the given color
   * @param {string} color - The color of the bar in hex or CSS format
   * @returns {HTMLElement} - The bar element
   * @private
   */
  _createBar(color) {
    const bar = document.createElement('div');
    bar.style.width = '100%';
    bar.style.height = '100%';
    bar.style.transition = 'width 0.2s ease-out';
    bar.style.borderRadius = '2px';
    // Pseudo-3D gradient effect
    if (color === '#ff0000') {
      bar.style.background = 'linear-gradient(to bottom, #ff6666 0%, #ff0000 100%)';
    } else if (color === '#0055ff') {
      bar.style.background = 'linear-gradient(to bottom, #66aaff 0%, #0055ff 100%)';
    } else {
      bar.style.background = color;
    }
    return bar;
  }
  
  /**
   * Update the health bar
   * @param {number} value - New health value
   */
  setHealth(value) {
    this.options.healthCurrent = Math.min(Math.max(0, value), this.options.healthMax);
    const percentage = (this.options.healthCurrent / this.options.healthMax) * 100;
    this.healthBar.style.width = `${percentage}%`;
  }
  
  /**
   * Update the magic bar
   * @param {number} value - New magic value
   */
  setMagic(value) {
    this.options.magicCurrent = Math.min(Math.max(0, value), this.options.magicMax);
    const percentage = (this.options.magicCurrent / this.options.magicMax) * 100;
    this.magicBar.style.width = `${percentage}%`;
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    if (this.outerContainer && this.outerContainer.parentNode) {
      this.outerContainer.parentNode.removeChild(this.outerContainer);
    }
    
    // Clean up the SVG filter if this is the last UI element using it
    const otherUIElements = document.querySelectorAll('[style*="url(#pixel-filter)"]');
    if (otherUIElements.length === 0) {
      const filter = document.getElementById('ps1-ui-filters');
      if (filter && filter.parentNode) {
        filter.parentNode.removeChild(filter);
      }
    }
  }
} 