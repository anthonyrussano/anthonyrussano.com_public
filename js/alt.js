// 3D Spherical Rotating Starfield Background Animation
// Creates stars distributed in a 3D sphere that rotate horizontally with mouse interaction

class StarField3D {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.stars = [];
        this.numStars = 400;
        this.sphereRadius = 400;
        this.rotationY = 0; // Horizontal rotation
        this.rotationX = 0; // Vertical tilt from mouse
        this.rotationZ = 0; // Roll from mouse
        this.baseRotationSpeed = 0.0002;
        this.currentRotationSpeed = this.baseRotationSpeed;
        this.centerX = 0;
        this.centerY = 0;
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetRotationX = 0;
        this.targetRotationZ = 0;
        
        this.init();
    }
    
    init() {
        // Create canvas element
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.zIndex = '-1';
        this.canvas.style.background = '#000000';
        
        // Add canvas to body
        document.body.appendChild(this.canvas);
        
        this.ctx = this.canvas.getContext('2d');
        
        // Set up event handlers
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        
        // Initial setup
        this.resize();
        this.createStars();
        this.animate();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        
        // Adjust sphere radius based on screen size
        this.sphereRadius = Math.min(this.canvas.width, this.canvas.height) * 0.4;
    }
    
    createStars() {
        this.stars = [];
        
        for (let i = 0; i < this.numStars; i++) {
            // Generate random point on sphere using spherical coordinates
            const theta = Math.random() * Math.PI * 2; // Azimuth angle (0 to 2π)
            const phi = Math.acos(2 * Math.random() - 1); // Polar angle (0 to π) - uniform distribution
            const radius = this.sphereRadius * (0.7 + Math.random() * 0.6); // Vary radius slightly
            
            // Convert spherical to cartesian coordinates
            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);
            
            this.stars.push({
                originalX: x,
                originalY: y,
                originalZ: z,
                x: x,
                y: y,
                z: z,
                size: Math.random() * 0.6 + 0.3, // Even smaller stars
                brightness: Math.random() * 0.4 + 0.2, // Dimmer overall
                twinkleSpeed: Math.random() * 0.008 + 0.002, // Much slower twinkling
                twinkleOffset: Math.random() * Math.PI * 2,
                color: this.getStarColor()
            });
        }
    }
    
    getStarColor() {
        const colors = [
            { r: 255, g: 255, b: 255 }, // White
            { r: 255, g: 248, b: 220 }, // Warm white
            { r: 173, g: 216, b: 230 }, // Light blue
            { r: 255, g: 223, b: 186 }, // Light orange
            { r: 230, g: 230, b: 250 }  // Lavender
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    handleMouseMove(e) {
        // Normalize mouse position to -1 to 1
        this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouseY = (e.clientY / window.innerHeight) * 2 - 1;
        
        // Calculate target rotations based on mouse position (minimal sensitivity)
        this.targetRotationX = this.mouseY * 0.03; // Further reduced
        this.targetRotationZ = this.mouseX * 0.02; // Further reduced
        
        // Adjust rotation speed based on horizontal mouse movement (minimal effect)
        this.currentRotationSpeed = this.baseRotationSpeed + (Math.abs(this.mouseX) * 0.0001); // Much less effect
    }
    
    rotatePoint3D(x, y, z, rotX, rotY, rotZ) {
        // Rotate around X axis (pitch)
        let cosX = Math.cos(rotX);
        let sinX = Math.sin(rotX);
        let y1 = y * cosX - z * sinX;
        let z1 = y * sinX + z * cosX;
        
        // Rotate around Y axis (yaw)
        let cosY = Math.cos(rotY);
        let sinY = Math.sin(rotY);
        let x2 = x * cosY + z1 * sinY;
        let z2 = -x * sinY + z1 * cosY;
        
        // Rotate around Z axis (roll)
        let cosZ = Math.cos(rotZ);
        let sinZ = Math.sin(rotZ);
        let x3 = x2 * cosZ - y1 * sinZ;
        let y3 = x2 * sinZ + y1 * cosZ;
        
        return { x: x3, y: y3, z: z2 };
    }
    
    projectTo2D(x, y, z) {
        // Simple perspective projection
        const distance = 600;
        const scale = distance / (distance + z);
        
        return {
            x: x * scale + this.centerX,
            y: y * scale + this.centerY,
            scale: scale
        };
    }
    
    draw() {
        // Clear canvas completely - no trails
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Sort stars by z-depth for proper rendering order
        const sortedStars = [...this.stars].sort((a, b) => b.z - a.z);
        
        sortedStars.forEach((star) => {
            const projected = this.projectTo2D(star.x, star.y, star.z);
            
            // Only draw stars that are on screen and in front
            if (projected.x >= -10 && projected.x <= this.canvas.width + 10 && 
                projected.y >= -10 && projected.y <= this.canvas.height + 10 &&
                projected.scale > 0.1) {
                
                // Calculate twinkling effect
                const twinkle = Math.sin(Date.now() * star.twinkleSpeed + star.twinkleOffset);
                const currentBrightness = star.brightness * (0.7 + 0.3 * twinkle) * projected.scale;
                
                // Adjust size based on distance - keep stars as small points
                const starSize = Math.max(star.size * projected.scale, 0.5);
                
                // Create color with alpha based on brightness and distance
                const alpha = Math.min(currentBrightness, 1);
                const color = `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, ${alpha})`;
                
                // Draw simple point of light
                this.ctx.fillStyle = color;
                this.ctx.beginPath();
                this.ctx.arc(projected.x, projected.y, starSize, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }
    
    update() {
        // Smooth interpolation towards target rotations (slower response)
        this.rotationX += (this.targetRotationX - this.rotationX) * 0.02; // Reduced from 0.05
        this.rotationZ += (this.targetRotationZ - this.rotationZ) * 0.02; // Reduced from 0.05
        
        // Continuous horizontal rotation
        this.rotationY += this.currentRotationSpeed;
        
        // Keep rotations in reasonable bounds
        if (this.rotationY > Math.PI * 2) {
            this.rotationY -= Math.PI * 2;
        }
        
        // Update star positions
        this.stars.forEach(star => {
            const rotated = this.rotatePoint3D(
                star.originalX,
                star.originalY, 
                star.originalZ,
                this.rotationX,
                this.rotationY,
                this.rotationZ
            );
            
            star.x = rotated.x;
            star.y = rotated.y;
            star.z = rotated.z;
        });
    }
    
    animate() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
    
    // Public methods to control the animation
    setRotationSpeed(speed) {
        this.baseRotationSpeed = speed;
    }
    
    setStarCount(count) {
        this.numStars = count;
        this.createStars();
    }
    
    setSphereRadius(radius) {
        this.sphereRadius = radius;
        this.createStars();
    }
    
    destroy() {
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.starField3D = new StarField3D();
    });
} else {
    window.starField3D = new StarField3D();
}