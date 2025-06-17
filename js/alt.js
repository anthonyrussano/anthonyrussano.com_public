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
        this.posts = [];
        this.hoveredStar = null;
        this.pinnedStar = null;
        this.tooltip = {
            visible: false,
            x: 0,
            y: 0,
            text: '',
            alpha: 0,
            targetAlpha: 0,
            width: 0,
            height: 0,
            isPinned: false
        };
        
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
        
        // Add click handler with debugging
        this.canvas.addEventListener('click', (e) => {
            console.log('StarField3D: Canvas click event triggered');
            this.handleClick(e);
        });
        
        // Also add to window as backup
        window.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            if (e.clientX >= rect.left && e.clientX <= rect.right && 
                e.clientY >= rect.top && e.clientY <= rect.bottom) {
                console.log('StarField3D: Window click event on canvas area');
                this.handleClick(e);
            }
        });
        
        this.canvas.style.cursor = 'default';
        this.canvas.style.pointerEvents = 'auto'; // Ensure canvas can receive events
        
        console.log('StarField3D: Event handlers set up, canvas style:', {
            position: this.canvas.style.position,
            zIndex: this.canvas.style.zIndex,
            pointerEvents: this.canvas.style.pointerEvents
        });
        
        // Load posts data
        this.loadPosts();
        
        // Initial setup
        this.resize();
        this.loadPosts();
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
            
            // Simple check: first N stars are clickable where N = number of posts
            const isClickable = i < this.posts.length;
            
            const star = {
                originalX: x,
                originalY: y,
                originalZ: z,
                x: x,
                y: y,
                z: z,
                size: isClickable ? Math.random() * 1.2 + 0.8 : Math.random() * 0.6 + 0.3,
                brightness: isClickable ? Math.random() * 0.6 + 0.6 : Math.random() * 0.4 + 0.2,
                twinkleSpeed: Math.random() * 0.008 + 0.002,
                twinkleOffset: Math.random() * Math.PI * 2,
                color: isClickable ? this.getClickableStarColor() : this.getStarColor(),
                isClickable: isClickable,
                postIndex: isClickable ? i : -1,
                starId: i // Add unique ID for debugging
            };
            
            // Debug log for clickable stars
            if (isClickable && this.posts[i]) {
                console.log(`StarField3D: Star ${i} linked to post: "${this.posts[i].title}" (${this.posts[i].url})`);
            }
            
            this.stars.push(star);
        }
        
        const clickableStars = this.stars.filter(s => s.isClickable);
        console.log(`StarField3D: Created ${clickableStars.length} clickable stars out of ${this.posts.length} posts`);
        
        // Log details of each clickable star
        clickableStars.forEach((star, index) => {
            console.log(`  Clickable Star ${star.starId}: postIndex=${star.postIndex}, post="${this.posts[star.postIndex]?.title}"}`);
        });
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
    
    getClickableStarColor() {
        const colors = [
            { r: 255, g: 215, b: 0 },   // Gold
            { r: 255, g: 165, b: 0 },   // Orange
            { r: 255, g: 105, b: 180 }, // Hot pink
            { r: 50, g: 205, b: 50 },   // Lime green
            { r: 135, g: 206, b: 235 }  // Sky blue
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    loadPosts() {
        this.posts = window.siteData && window.siteData.posts ? window.siteData.posts : [];
        console.log(`StarField3D: Loaded ${this.posts.length} posts`);
    }
    
    drawRoundedRect(ctx, x, y, width, height, radius) {
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
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
        
        // Check for star hover
        this.checkStarHover(e.clientX, e.clientY);
    }
    
    checkStarHover(mouseX, mouseY) {
        // Don't change hover state if we have a pinned star
        if (this.pinnedStar) {
            return;
        }
        
        this.hoveredStar = null;
        const hoverRadius = 20;
        
        for (let star of this.stars) {
            if (!star.isClickable) continue;
            
            const projected = this.projectTo2D(star.x, star.y, star.z);
            
            if (projected.scale > 0.1) {
                const distance = Math.sqrt(
                    Math.pow(mouseX - projected.x, 2) + 
                    Math.pow(mouseY - projected.y, 2)
                );
                
                if (distance <= hoverRadius) {
                    this.hoveredStar = star;
                    this.canvas.style.cursor = 'pointer';
                    const post = this.posts[star.postIndex];
                    if (post) {
                        this.showTooltip(projected.x, projected.y, post.title, false);
                    }
                    return;
                }
            }
        }
        
        this.canvas.style.cursor = 'default';
        this.hideTooltip();
    }
    
    showTooltip(x, y, text, isPinned = false) {
        this.tooltip.visible = true;
        this.tooltip.text = text;
        this.tooltip.isPinned = isPinned;
        this.tooltip.targetAlpha = 1;
        
        // Position tooltip to avoid edges
        const padding = 20;
        const tooltipWidth = this.ctx.measureText(text).width + 24;
        const tooltipHeight = 28;
        
        this.tooltip.width = tooltipWidth;
        this.tooltip.height = tooltipHeight;
        
        // Position tooltip above and to the right of star by default
        let tooltipX = x + 15;
        let tooltipY = y - 40;
        
        // Adjust if tooltip would go off screen
        if (tooltipX + tooltipWidth > this.canvas.width - padding) {
            tooltipX = x - tooltipWidth - 15; // Position to the left
        }
        if (tooltipY < padding) {
            tooltipY = y + 40; // Position below
        }
        
        this.tooltip.x = tooltipX;
        this.tooltip.y = tooltipY;
    }
    
    hideTooltip() {
        // Don't hide if tooltip is pinned
        if (this.tooltip.isPinned) {
            return;
        }
        
        this.tooltip.targetAlpha = 0;
        if (this.tooltip.alpha <= 0.05) {
            this.tooltip.visible = false;
        }
    }
    
    unpinTooltip() {
        this.tooltip.isPinned = false;
        this.pinnedStar = null;
        this.tooltip.targetAlpha = 0;
        if (this.tooltip.alpha <= 0.05) {
            this.tooltip.visible = false;
        }
    }
    
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const clickRadius = 30;
        
        // Check if clicking on pinned tooltip
        if (this.tooltip.isPinned && this.tooltip.visible && this.tooltip.alpha > 0.5) {
            if (mouseX >= this.tooltip.x && mouseX <= this.tooltip.x + this.tooltip.width &&
                mouseY >= this.tooltip.y && mouseY <= this.tooltip.y + this.tooltip.height) {
                // Navigate to pinned star's post
                if (this.pinnedStar) {
                    const post = this.posts[this.pinnedStar.postIndex];
                    if (post) {
                        console.log(`StarField3D: Clicking tooltip, navigating to: "${post.title}"`);
                        window.location.href = post.url;
                        return;
                    }
                }
            }
        }
        
        let clickedStar = null;
        let clickDistance = Infinity;
        
        // Find the closest clickable star within range
        for (let star of this.stars) {
            if (!star.isClickable) continue;
            
            const projected = this.projectTo2D(star.x, star.y, star.z);
            
            if (projected.scale > 0.1) {
                const distance = Math.sqrt(
                    Math.pow(mouseX - projected.x, 2) + 
                    Math.pow(mouseY - projected.y, 2)
                );
                
                if (distance <= clickRadius && distance < clickDistance) {
                    clickedStar = star;
                    clickDistance = distance;
                }
            }
        }
        
        if (clickedStar) {
            const post = this.posts[clickedStar.postIndex];
            if (!post) return;
            
            // If this star is already pinned, navigate to it
            if (this.pinnedStar === clickedStar) {
                console.log(`StarField3D: Clicking pinned star, navigating to: "${post.title}"`);
                window.location.href = post.url;
                return;
            }
            
            // Otherwise, pin this star
            this.unpinTooltip(); // Unpin any existing
            this.pinnedStar = clickedStar;
            this.hoveredStar = clickedStar; // Set as hovered for visual effect
            
            const projected = this.projectTo2D(clickedStar.x, clickedStar.y, clickedStar.z);
            this.showTooltip(projected.x, projected.y, post.title, true);
            
            console.log(`StarField3D: Pinned Star ${clickedStar.starId}, Post: "${post.title}"`);
        } else {
            // Clicked elsewhere, unpin if we have a pinned star
            if (this.pinnedStar) {
                console.log('StarField3D: Unpinning star');
                this.unpinTooltip();
            }
        }
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
                let currentBrightness = star.brightness * (0.7 + 0.3 * twinkle) * projected.scale;
                
                // Enhance brightness for hovered stars
                if (this.hoveredStar === star) {
                    currentBrightness = Math.min(currentBrightness * 1.5, 1);
                }
                
                // Adjust size based on distance - keep stars as small points
                let starSize = Math.max(star.size * projected.scale, 0.5);
                
                // Make clickable stars slightly larger and add glow effect when hovered or pinned
                if (star.isClickable) {
                    starSize *= 1.2;
                    
                    if (this.hoveredStar === star || this.pinnedStar === star) {
                        // Draw outer glow for hovered/pinned clickable stars
                        const glowSize = starSize * 3;
                        const glowAlpha = Math.min(currentBrightness * 0.4, 0.4);
                        const glowColor = `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, ${glowAlpha})`;
                        
                        this.ctx.fillStyle = glowColor;
                        this.ctx.beginPath();
                        this.ctx.arc(projected.x, projected.y, glowSize, 0, Math.PI * 2);
                        this.ctx.fill();
                        
                        // Draw expanded clickable area outline
                        const expandedRadius = 30;
                        const isPinned = this.pinnedStar === star;
                        const outlineAlpha = isPinned ? 0.6 : 0.3; // Brighter outline when pinned
                        const lineWidth = isPinned ? 2 : 1; // Thicker line when pinned
                        
                        this.ctx.strokeStyle = `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, ${outlineAlpha})`;
                        this.ctx.lineWidth = lineWidth;
                        this.ctx.beginPath();
                        this.ctx.arc(projected.x, projected.y, expandedRadius, 0, Math.PI * 2);
                        this.ctx.stroke();
                    }
                }
                
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
        
        // Draw tooltip
        this.drawTooltip();
    }
    
    drawTooltip() {
        if (!this.tooltip.visible || this.tooltip.alpha <= 0) return;
        
        const ctx = this.ctx;
        const tooltip = this.tooltip;
        
        // Save context
        ctx.save();
        
        // Set text properties
        ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        
        // Calculate text dimensions
        const textMetrics = ctx.measureText(tooltip.text);
        const padding = 12;
        const tooltipWidth = textMetrics.width + padding * 2;
        const tooltipHeight = 28;
        
        // Update tooltip dimensions
        tooltip.width = tooltipWidth;
        tooltip.height = tooltipHeight;
        
        // Draw tooltip background with rounded corners
        const radius = 6;
        const alpha = tooltip.alpha;
        
        ctx.fillStyle = `rgba(0, 0, 0, ${0.85 * alpha})`;
        ctx.beginPath();
        ctx.roundRect(tooltip.x, tooltip.y, tooltipWidth, tooltipHeight, radius);
        ctx.fill();
        
        // Draw tooltip border - different style for pinned tooltips
        if (tooltip.isPinned) {
            ctx.strokeStyle = `rgba(255, 215, 0, ${0.8 * alpha})`; // Gold border for pinned
            ctx.lineWidth = 2;
        } else {
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 * alpha})`;
            ctx.lineWidth = 1;
        }
        ctx.stroke();
        
        // Draw connection line from star to tooltip
        if (this.hoveredStar) {
            const projected = this.projectTo2D(this.hoveredStar.x, this.hoveredStar.y, this.hoveredStar.z);
            const connectionAlpha = 0.4 * alpha;
            
            ctx.strokeStyle = `rgba(${this.hoveredStar.color.r}, ${this.hoveredStar.color.g}, ${this.hoveredStar.color.b}, ${connectionAlpha})`;
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 3]);
            ctx.beginPath();
            ctx.moveTo(projected.x, projected.y);
            
            // Connect to the closest corner of tooltip
            const tooltipCenterX = tooltip.x + tooltipWidth / 2;
            const tooltipCenterY = tooltip.y + tooltipHeight / 2;
            
            if (projected.x < tooltipCenterX) {
                ctx.lineTo(tooltip.x, tooltipCenterY);
            } else {
                ctx.lineTo(tooltip.x + tooltipWidth, tooltipCenterY);
            }
            
            ctx.stroke();
            ctx.setLineDash([]); // Reset line dash
        }
        
        // Draw text
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fillText(tooltip.text, tooltip.x + padding, tooltip.y + tooltipHeight / 2);
        
        
        // Restore context
        ctx.restore();
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
        
        // Update tooltip alpha animation
        this.tooltip.alpha += (this.tooltip.targetAlpha - this.tooltip.alpha) * 0.15;
        if (Math.abs(this.tooltip.targetAlpha - this.tooltip.alpha) < 0.01) {
            this.tooltip.alpha = this.tooltip.targetAlpha;
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