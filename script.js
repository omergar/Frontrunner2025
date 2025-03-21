       // Global variables
       let scene, camera, renderer, plane, skyline;
       let spaceship, fireballs = [], enemies = [], enemyFireballs = [];
       let spaceshipModel;
       const textureSize = 2000;
       const shipStates = ['center', 'up', 'up-right', 'right', 'down-right', 'down', 'down-left', 'left', 'up-left'];
       let currentShipState = 'center';
       let lastFireTime = 0;
       let isPlayerAlive = true;
       let playerRespawnTime = 0;
       let playerHealth = 60; // Reduced max health to 60
       let lastEnemyFireTime = 0;
       let lastHealthIncreaseTime = Date.now();
       let healthBar;
       let isGameOver = false;
       let planeSpeed = 0.02;
       let gameOverExplosion = null;
       let lastIntelligentEnemyTime = 0;
       let score = 0;
       let scoreElement;
       let rocks = [];
let isScoreBlinking = false;
let scoreBlinkTimeout = null;
let tanks = [];
const MAX_TANKS = 3;
// Add these variables with your other global variables
let isMobileDevice = false;
let touchControls = null;
let fireButton = null;
let touchStartX = 0;
let touchStartY = 0;
let touchThreshold = 10; // Minimum pixels moved to register as movement



// Function to detect mobile devices
function detectMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Create mobile controls
function createMobileControls() {
    // Create container for touch controls
    touchControls = document.createElement('div');
    touchControls.style.position = 'absolute';
    touchControls.style.top = '0';
    touchControls.style.left = '0';
    touchControls.style.width = '100%';
    touchControls.style.height = '100%';
    touchControls.style.zIndex = '10';
    touchControls.style.touchAction = 'none'; // Prevent default touch actions
    document.body.appendChild(touchControls);
    
    // Create fire button
    fireButton = document.createElement('div');
    fireButton.style.position = 'absolute';
    fireButton.style.bottom = '30px';
    fireButton.style.right = '30px';
    fireButton.style.width = '70px';
    fireButton.style.height = '70px';
    fireButton.style.borderRadius = '50%';
    fireButton.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
    fireButton.style.border = '2px solid rgba(255, 255, 255, 0.6)';
    fireButton.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.5)';
    fireButton.style.display = 'flex';
    fireButton.style.justifyContent = 'center';
    fireButton.style.alignItems = 'center';
    fireButton.style.zIndex = '20';
    
    // Add fire icon
    const fireIcon = document.createElement('div');
    fireIcon.innerHTML = '🔥';
    fireIcon.style.fontSize = '30px';
    fireButton.appendChild(fireIcon);
    
    document.body.appendChild(fireButton);
    
    // Add touch event listeners for movement
    touchControls.addEventListener('touchstart', handleTouchStart, false);
    touchControls.addEventListener('touchmove', handleTouchMove, false);
    touchControls.addEventListener('touchend', handleTouchEnd, false);
    
    // Add touch event for fire button
    fireButton.addEventListener('touchstart', handleFireTouch, false);
}

// Touch handlers
function handleTouchStart(event) {
    // Store starting position
    if (event.touches.length === 1) {
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
    }
}

function handleTouchMove(event) {
    // Prevent default behavior to avoid scrolling
    event.preventDefault();
    
    if (!isPlayerAlive || isGameOver) return;
    
    if (event.touches.length === 1) {
        const touchX = event.touches[0].clientX;
        const touchY = event.touches[0].clientY;
        
        // Calculate the difference from the start position
        const deltaX = touchX - touchStartX;
        const deltaY = touchY - touchStartY;
        
        // Reset current ship state
        currentShipState = 'center';
        
        // Determine horizontal movement
        if (deltaX < -touchThreshold) {
            currentShipState = 'left';
        } else if (deltaX > touchThreshold) {
            currentShipState = 'right';
        }
        
        // Determine vertical movement
        if (deltaY < -touchThreshold) {
            if (currentShipState === 'center') {
                currentShipState = 'up';
            } else {
                currentShipState += '-up';
            }
        } else if (deltaY > touchThreshold) {
            if (currentShipState === 'center') {
                currentShipState = 'down';
            } else {
                currentShipState += '-down';
            }
        }
        
        // Update ship state
        updateSpaceshipState();
        
        // Update start positions for smoother control
        // Only update if significant movement has occurred
        if (Math.abs(deltaX) > 50 || Math.abs(deltaY) > 50) {
            touchStartX = touchX;
            touchStartY = touchY;
        }
    }
}

function handleTouchEnd(event) {
    // Reset ship state when touch ends
    currentShipState = 'center';
    updateSpaceshipState();
}

function handleFireTouch(event) {
    // Prevent default to avoid any unwanted behavior
    event.preventDefault();
    
    // Fire!
    shootFireball();
    
    // Visual feedback
    fireButton.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
    setTimeout(() => {
        fireButton.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
    }, 100);
}

// Initialize mobile controls if on mobile device
function initMobileControls() {
    isMobileDevice = detectMobileDevice();
    
    if (isMobileDevice) {
        console.log("Mobile device detected, adding touch controls");
        createMobileControls();
        
        // Add CSS to prevent unwanted behaviors on mobile
        const mobileStyle = document.createElement('style');
        mobileStyle.textContent = `
            body {
                overflow: hidden;
                position: fixed;
                width: 100%;
                height: 100%;
                touch-action: none;
                -webkit-overflow-scrolling: none;
                overscroll-behavior: none;
            }
        `;
        document.head.appendChild(mobileStyle);
    }
}

// Create a single tank and add it to the scene
function createTank() {
   // Group to hold all tank parts
   const tank = new THREE.Group();
   
   // Materials
   const tankGreen = new THREE.MeshBasicMaterial({ color: 0x2D5D34 });
   const darkMetal = new THREE.MeshBasicMaterial({ color: 0x222222 });
   const trackMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
   
   // Create hull
   const hull = new THREE.Mesh(
       new THREE.BoxGeometry(3, 0.9, 7),
       tankGreen
   );
   hull.position.y = 0.6;
   tank.add(hull);
   
   // Front sloped armor
   const frontArmor = new THREE.Mesh(
       new THREE.BoxGeometry(3, 0.8, 1),
       tankGreen
   );
   frontArmor.position.set(0, 0.3, -3);
   frontArmor.rotation.x = Math.PI * 0.1;
   hull.add(frontArmor);
   
   // Side skirts
   const leftSkirt = new THREE.Mesh(
       new THREE.BoxGeometry(0.2, 0.4, 6.5),
       tankGreen
   );
   leftSkirt.position.set(-1.6, 0, 0);
   hull.add(leftSkirt);
   
   const rightSkirt = new THREE.Mesh(
       new THREE.BoxGeometry(0.2, 0.4, 6.5),
       tankGreen
   );
   rightSkirt.position.set(1.6, 0, 0);
   hull.add(rightSkirt);
   
   // Left track
   const leftTrack = new THREE.Mesh(
       new THREE.BoxGeometry(0.8, 0.6, 7),
       trackMaterial
   );
   leftTrack.position.set(-1.3, 0.3, 0);
   tank.add(leftTrack);
   
   // Right track
   const rightTrack = new THREE.Mesh(
       new THREE.BoxGeometry(0.8, 0.6, 7),
       trackMaterial
   );
   rightTrack.position.set(1.3, 0.3, 0);
   tank.add(rightTrack);
   
   // Add wheels (simplified)
   for (let i = -2.5; i <= 2.5; i += 1) {
       if (i !== 0) {
           // Left wheel
           const leftWheel = new THREE.Mesh(
               new THREE.CylinderGeometry(0.4, 0.4, 0.2, 8),
               darkMetal
           );
           leftWheel.position.set(-1.3, 0.4, i * 1.1);
           leftWheel.rotation.z = Math.PI / 2;
           tank.add(leftWheel);
           
           // Right wheel
           const rightWheel = new THREE.Mesh(
               new THREE.CylinderGeometry(0.4, 0.4, 0.2, 8),
               darkMetal
           );
           rightWheel.position.set(1.3, 0.4, i * 1.1);
           rightWheel.rotation.z = Math.PI / 2;
           tank.add(rightWheel);
       }
   }
   
   // Turret base
   const turretBase = new THREE.Mesh(
       new THREE.CylinderGeometry(1.4, 1.5, 0.5, 16),
       tankGreen
   );
   turretBase.position.y = 0.7;
   hull.add(turretBase);
   
   // Turret group for independent rotation
   const turretGroup = new THREE.Group();
   turretGroup.position.y = 0.7;
   hull.add(turretGroup);
   
   // Main turret
   const turret = new THREE.Mesh(
       new THREE.BoxGeometry(2.2, 0.7, 3),
       tankGreen
   );
   turret.position.y = 0.35;
   turretGroup.add(turret);
   
   // Turret front
   const turretFront = new THREE.Mesh(
       new THREE.BoxGeometry(2, 0.6, 0.8),
       tankGreen
   );
   turretFront.position.set(0, 0.35, 1.9);
   turretFront.rotation.x = -Math.PI * 0.15;
   turretGroup.add(turretFront);
   
   // Barrel group with 10 degree elevation
   const barrelGroup = new THREE.Group();
   barrelGroup.position.set(0, 0.35, 1.9);
   barrelGroup.rotation.x = -Math.PI * (10/180); // 10 degrees up
   turretGroup.add(barrelGroup);
   
   // Main gun barrel
   const barrel = new THREE.Mesh(
       new THREE.CylinderGeometry(0.15, 0.15, 6.5, 16),
       darkMetal
   );
   barrel.position.z = 3.25;
   barrel.rotation.x = Math.PI / 2;
   barrelGroup.add(barrel);
   
   // Barrel base
   const barrelBase = new THREE.Mesh(
       new THREE.CylinderGeometry(0.25, 0.25, 0.7, 16),
       darkMetal
   );
   barrelBase.position.z = 0.5;
   barrelBase.rotation.x = Math.PI / 2;
   barrelGroup.add(barrelBase);
   
   // Commander hatch
   const hatch = new THREE.Mesh(
       new THREE.CylinderGeometry(0.4, 0.4, 0.1, 8),
       darkMetal
   );
   hatch.position.set(0, 0.75, -0.7);
   turretGroup.add(hatch);


   // Make tank 50% larger
   tank.scale.set(1.8, 1.8, 1.8);
   
   
   // Position the tank on the ground
   tank.position.set(
       Math.random() * 160 - 80, // X position (spread across width)
       -19, // Y position (on ground, slightly above rocks)
       -Math.random() * 300 - 100 // Z position (ahead of player)
   );
   
   // Base rotation to face player (180 degrees) with some randomness
   // Pi is facing away from player, so 0 or 2*Pi is facing toward player
   // Add randomness of up to 30 degrees (0.5 radians) in either direction
   const randomRotation = (Math.random() * 0.5) - 0.25; // -0.25 to 0.25 radians (-15° to +15°)
   tank.rotation.y = randomRotation;
   
   // Random turret rotation (more limited than before, staying mostly forward)
   const turretRandomRotation = (Math.random() * 0.1) - 0.05; // -0.4 to 0.4 radians (-23° to +23°)
   turretGroup.rotation.y = turretRandomRotation;
   
   
   // Store turret reference for animation
   tank.userData.turret = turretGroup;
   tank.userData.lastTurretRotationTime = Date.now();
   tank.userData.turretRotationSpeed = 0; //(Math.random() * 0.004) + 0.001; // Random rotation speed
   tank.userData.turretRotationDirection = Math.random() > 0.5 ? 1 : -1; // Random direction
   
   // Add to scene
   scene.add(tank);
   
   return tank;
}

// Initialize the tank system
function initializeTanks() {
   // Clear any existing tanks
   for (let i = 0; i < tanks.length; i++) {
       if (tanks[i] && scene.getObjectById(tanks[i].id)) {
           scene.remove(tanks[i]);
       }
   }
   
   // Reset the tanks array
   tanks = [];
   
   // Create initial tanks
   for (let i = 0; i < MAX_TANKS; i++) {
       const tank = createTank();
       tanks.push(tank);
   }
}

// Update tanks in the game loop
function updateTanks() {
   // Current time for animations
   const now = Date.now();
   
   // Check for tanks that need replacing
   const tanksToRemove = [];
   
   // Update tank positions and check for removal
   for (let i = 0; i < tanks.length; i++) {
       const tank = tanks[i];
       
       // Move tank forward with the ground
       tank.position.z += planeSpeed * 40;
       
       // Animate turret rotation
       if (now - tank.userData.lastTurretRotationTime > 3000) {
           // Occasionally change direction
           if (Math.random() > 0.7) {
               tank.userData.turretRotationDirection *= -1;
               tank.userData.turretRotationSpeed = (Math.random() * 0.004) + 0.001;
           }
           tank.userData.lastTurretRotationTime = now;
       }
       
       // Apply turret rotation
       tank.userData.turret.rotation.y += 
           tank.userData.turretRotationSpeed * 
           tank.userData.turretRotationDirection;
       
       // Check if tank has passed the camera
       if (tank.position.z > 120) {
           tanksToRemove.push(i);
       }
   }
   
   // Remove tanks that have passed the camera
   for (let i = tanksToRemove.length - 1; i >= 0; i--) {
       const index = tanksToRemove[i];
       const tank = tanks[index];
       
       // Remove from scene
       scene.remove(tank);
       
       // Create a new tank to replace it
       const newTank = createTank();
       
       // Replace in the array
       tanks[index] = newTank;
   }
}

// Add collision detection for tanks vs player fireballs
function checkTankFireballCollisions() {
   // Skip if game is over
   if (isGameOver) return;
   
   // Check each tank against each fireball
   for (let i = 0; i < tanks.length; i++) {
       const tank = tanks[i];
       
       for (let j = 0; j < fireballs.length; j++) {
           const fireball = fireballs[j].mesh;
           
           // Skip if either object doesn't exist
           if (!tank || !fireball) continue;
           
           // Calculate distance (using tank's center position)
           const distance = fireball.position.distanceTo(tank.position);
           
           // Check for collision (adjust radius as needed)
           if (distance < 5) {
               // Create explosion
               createExplosion(tank.position);
               
               // Add points
               updateScore(15); // Tanks worth more than regular enemies
               
               // Remove tank
               scene.remove(tank);
               
               // Create a new tank to replace it
               const newTank = createTank();
               tanks[i] = newTank;
               
               // Remove fireball
               scene.remove(fireball);
               fireballs.splice(j, 1);
               
               // Exit fireball loop
               break;
           }
       }
   }
}


       // Sky texture creation
       function createSkyTexture() {
           // Create a canvas for the sky texture
           const canvas = document.createElement('canvas');
           canvas.width = 1024;
           canvas.height = 1024;
           const ctx = canvas.getContext('2d');
           
           // Create gradient background
           const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
           gradient.addColorStop(0, '#649DCE'); // Light blue at top
           gradient.addColorStop(0.5, '#87CEEB'); // Sky blue in middle
           gradient.addColorStop(1, '#B0C4DE'); // Light steel blue near horizon
           
           ctx.fillStyle = gradient;
           ctx.fillRect(0, 0, canvas.width, canvas.height);
           
           // Add some light cloud-like noise
           ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
           for (let i = 0; i < 60; i++) {
               const x = Math.random() * canvas.width;
               const y = Math.random() * canvas.height;
               // Make most clouds smaller and more subtle
               const size = Math.random() * 40 + 20;
               const opacity = Math.random() * 0.15 + 0.05;
               
               ctx.beginPath();
               ctx.globalAlpha = opacity;
               ctx.arc(x, y, size, 0, Math.PI * 2);
               ctx.fill();
           }
           ctx.globalAlpha = 1.0;
           
           // Create texture
           const texture = new THREE.CanvasTexture(canvas);
           return texture;
       }
       
       // Add moon to the scene
       function addMoon(x, y, radius, color) {
           const moonGeometry = new THREE.SphereGeometry(radius, 32, 32);
           const moonMaterial = new THREE.MeshBasicMaterial({ color: color });
           const moon = new THREE.Mesh(moonGeometry, moonMaterial);
           moon.position.set(x, y, -300);
           scene.add(moon);
           
           // Add a subtle glow effect
           const glowGeometry = new THREE.SphereGeometry(radius * 1.2, 32, 32);
           const glowMaterial = new THREE.MeshBasicMaterial({ 
               color: color, 
               transparent: true, 
               opacity: 0.3 
           });
           const glow = new THREE.Mesh(glowGeometry, glowMaterial);
           glow.position.copy(moon.position);
           scene.add(glow);
           
           return moon;
       }
       
       // Add cloud to the scene
       function addCloud(x, y, z) {
           const cloudGroup = new THREE.Group();
           
           // Create several overlapping spheres to form a cloud
           const numPuffs = Math.floor(Math.random() * 5) + 3;
           const cloudWidth = Math.random() * 20 + 10;
           
           for (let i = 0; i < numPuffs; i++) {
               const puffSize = Math.random() * 5 + 3;
               const puffGeometry = new THREE.SphereGeometry(puffSize, 7, 7);
               const puffMaterial = new THREE.MeshBasicMaterial({
                   color: 0xffffff,
                   transparent: true,
                   opacity: 0.7
               });
               const puff = new THREE.Mesh(puffGeometry, puffMaterial);
               
               // Position the puff within the cloud width
               puff.position.x = (Math.random() - 0.5) * cloudWidth;
               puff.position.y = (Math.random() - 0.5) * 5;
               puff.position.z = (Math.random() - 0.5) * 10;
               
               cloudGroup.add(puff);
           }
           
           cloudGroup.position.set(x, y, z);
           scene.add(cloudGroup);
           
           return cloudGroup;
       }

       // Create explosion effect when hitting enemies or player
       function createExplosion(position, isPlayer = false) {
           const explosionGroup = new THREE.Group();
            const particles = [];

              // Reduce particle count on mobile
    const numParticles = isMobileDevice 
    ? (isPlayer ? 20 : 10) // Mobile - fewer particles
    : (isPlayer ? 40 : 20); // Desktop - normal particles

           
           // Create particles for the explosion
           for (let i = 0; i < numParticles; i++) {
               const size = Math.random() * (isPlayer ? 2.0 : 1.5) + 0.5;
               const geometry = new THREE.SphereGeometry(size, 8, 8);
               
               // Create different colored particles for the explosion
               let particleColor;
               if (Math.random() > 0.6) {
                   particleColor = 0xFF4500; // OrangeRed
               } else if (Math.random() > 0.3) {
                   particleColor = 0xFFD700; // Gold/yellow
               } else {
                   particleColor = 0xFF0000; // Red
               }
               
               const material = new THREE.MeshBasicMaterial({ 
                   color: particleColor,
                   transparent: true,
                   opacity: 1
               });
               
               const particle = new THREE.Mesh(geometry, material);
               
               // Random initial position slightly offset from the center
               const spreadFactor = isPlayer ? 4 : 2;
               particle.position.set(
                   position.x + (Math.random() - 0.5) * spreadFactor,
                   position.y + (Math.random() - 0.5) * spreadFactor,
                   position.z + (Math.random() - 0.5) * spreadFactor
               );
               
               // Random velocity for the particle
               const velocityFactor = isPlayer ? 3 : 2;
               particle.userData.velocity = new THREE.Vector3(
                   (Math.random() - 0.5) * velocityFactor,
                   (Math.random() - 0.5) * velocityFactor,
                   (Math.random() - 0.5) * velocityFactor
               );
               
               particle.userData.life = 1.0; // Life value from 1.0 to 0.0
               particles.push(particle);
               explosionGroup.add(particle);
           }
           
           scene.add(explosionGroup);
           
           // Create animation for the explosion
           const animate = function() {
               let allDead = true;
               
               particles.forEach(particle => {
                   if (particle.userData.life > 0) {
                       // Update position based on velocity
                       particle.position.add(particle.userData.velocity);
                       
                       // Reduce life and update opacity
                       particle.userData.life -= 0.02;
                       particle.material.opacity = particle.userData.life;
                       
                       // Slow down particles over time
                       particle.userData.velocity.multiplyScalar(0.95);
                       
                       allDead = false;
                   }
               });
               
               if (!allDead) {
                   requestAnimationFrame(animate);
               } else {
                   // Remove explosion group when all particles are dead
                   scene.remove(explosionGroup);
               }
           };
           
           animate();
           
           return explosionGroup;
       }

       // Add sky elements (moons and clouds)
       function addSkyElements() {
           // Set textured background
           scene.background = createSkyTexture();
           
           // Add two moons
           addMoon(50, 60, 15, 0xDDDDDD); // First moon, light gray
           addMoon(-80, 40, 10, 0xCCCCAA); // Second moon, slightly yellowish
           
           // Add some clouds
           for (let i = 0; i < 10; i++) {
               addCloud(
                   Math.random() * 300 - 150, // x
                   Math.random() * 30 + 30,   // y
                   -Math.random() * 100 - 150 // z
               );
           }
       }
       
       // Generate desert texture
       function generateDesertTexture(ctx) {
           const width = ctx.canvas.width;
           const height = ctx.canvas.height;

           // Base color
           ctx.fillStyle = 'rgb(210, 180, 140)';
           ctx.fillRect(0, 0, width, height);

           // Desert-like colors
           const colors = [
               'rgb(194, 178, 128)',
               'rgb(220, 200, 160)',
               'rgb(190, 140, 100)',
               'rgb(180, 120, 80)'
           ];

           // Generate pattern
           for (let i = 0; i < 20000; i++) {
               const x = Math.random() * width;
               const y = Math.random() * height;
               const size = Math.random() * 50 + 10;
               ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
               
               if (Math.random() > 0.7) {
                   // Draw dunes
                   ctx.beginPath();
                   ctx.moveTo(x, y);
                   ctx.quadraticCurveTo(x + size/2, y - size, x + size, y);
                   ctx.fill();
               } else {
                   // Draw rocks
                   ctx.beginPath();
                   ctx.arc(x, y, size / 4, 0, Math.PI * 2);
                   ctx.fill();
               }
           }

           // Apply noise
           const imageData = ctx.getImageData(0, 0, width, height);
           const data = imageData.data;
           for (let i = 0; i < data.length; i += 4) {
               const noise = Math.floor(Math.random() * 21) - 10;
               data[i] = Math.max(0, Math.min(255, data[i] + noise));
               data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
               data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
           }
           ctx.putImageData(imageData, 0, 0);
       }


       function createRock() {
   // Create rock with random properties
   const size = Math.random() * 5 + 2;
   const greyValue = Math.floor(Math.random() * 40) + 30;
   const rockColor = new THREE.Color(`rgb(${greyValue}, ${greyValue}, ${greyValue})`);
   
   // Create geometry
   let geometry;
   const rockType = Math.floor(Math.random() * 3);
   if (rockType === 0) {
       geometry = new THREE.SphereGeometry(size, 6, 6);
   } else if (rockType === 1) {
       geometry = new THREE.BoxGeometry(size, size * 0.7, size * 0.8);
   } else {
       geometry = new THREE.TetrahedronGeometry(size, 1);
   }
   
   const material = new THREE.MeshBasicMaterial({ color: rockColor });
   const rock = new THREE.Mesh(geometry, material);
   
   // Store the current texture offset for tracking
   rock.userData.initialTextureOffset = plane.material.map.offset.y;
   
   // Place rocks ahead of the player
   const distanceAhead = Math.random() * 30 + 270;
   
   rock.position.set(
       Math.random() * 160 - 80, // X position (spread across width)
       -19.5, // Y position (on ground)
       -distanceAhead // Z position (ahead of player)
   );
   
   // Add rotation for natural look
   rock.rotation.x = Math.random() * Math.PI;
   rock.rotation.y = Math.random() * Math.PI;
   rock.rotation.z = Math.random() * Math.PI;
   
   scene.add(rock);
   rocks.push(rock);
   
   return rock;
}


// Calculate rock Z position based on texture coordinates
function calculateRockPositionFromTexture() {
   // Generate a position ahead of the player
   const distanceAhead = Math.random() * 300 + 100;
   return -distanceAhead; // Negative Z is forward into the scene
}

function optimizeForMobile() {
    if (!isMobileDevice) return;
    
    // Reduce renderer resolution for better performance
    renderer.setPixelRatio(window.devicePixelRatio * 0.8);
    
    // Reduce the number of rocks for better performance
    const MAX_ROCKS_MOBILE = 15; // Half the number of rocks on mobile
    
    // If we already have rocks, reduce them
    if (rocks.length > MAX_ROCKS_MOBILE) {
        // Remove excess rocks
        for (let i = MAX_ROCKS_MOBILE; i < rocks.length; i++) {
            if (rocks[i]) {
                scene.remove(rocks[i]);
            }
        }
        rocks = rocks.slice(0, MAX_ROCKS_MOBILE);
    }
    
    // Set max rocks for future rock generation
    window.MAX_ROCKS = MAX_ROCKS_MOBILE;
    
    // Reduce shadow quality
    renderer.shadowMap.type = THREE.BasicShadowMap;
    
    // Add FPS counter (optional, for testing)
    if (false) { // Set to true only for performance testing
        const fpsCounter = document.createElement('div');
        fpsCounter.style.position = 'absolute';
        fpsCounter.style.top = '10px';
        fpsCounter.style.left = '10px';
        fpsCounter.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        fpsCounter.style.color = 'white';
        fpsCounter.style.padding = '5px';
        fpsCounter.style.borderRadius = '5px';
        fpsCounter.style.fontSize = '12px';
        fpsCounter.style.zIndex = '1000';
        document.body.appendChild(fpsCounter);
        
        let lastTime = performance.now();
        let frameCount = 0;
        
        function updateFPS() {
            frameCount++;
            const now = performance.now();
            if (now - lastTime > 1000) {
                fpsCounter.textContent = `FPS: ${Math.round(frameCount * 1000 / (now - lastTime))}`;
                frameCount = 0;
                lastTime = now;
            }
            requestAnimationFrame(updateFPS);
        }
        
        updateFPS();
    }
}

// Initialize rocks
function initializeRocks() {

  
   // Create initial rocks distributed throughout the scene
   for (let i = 0; i < 30; i++) {
       // Create distribution from near to far
       const distanceFactor = i / 30; // 0 to almost 1
       const distanceAhead = 20 + distanceFactor * 300; // 100 to 400 units ahead
       
       const rock = createRock();
       
       // Manually position each initial rock at different distances
       rock.position.z = -distanceAhead;
   }
}

       // Add city skyline
       function addSkyline() {
           const canvas = document.createElement('canvas');
           canvas.width = 1000;
           canvas.height = 200;
           const ctx = canvas.getContext('2d');

           // Draw skyline with variety of buildings
           for (let i = 0; i < 20; i++) {
               const width = Math.random() * 50 + 20;
               const height = Math.random() * 150 + 50;
               const x = i * 50;
               const y = canvas.height - height;
               
               // Vary the building colors in grayscale
               const grayValue = Math.floor(Math.random() * 60) + 30; // 30-90 range for dark to medium gray
               const buildingColor = `rgba(${grayValue}, ${grayValue}, ${grayValue}, 0.8)`;
               ctx.fillStyle = buildingColor;
               
               // Randomly decide between rectangular or round-topped buildings
               if (Math.random() > 0.3) {
                   // Regular rectangular building
                   ctx.fillRect(x, y, width, height);
                   
                   // Add some window details
                   ctx.fillStyle = `rgba(${grayValue + 100}, ${grayValue + 100}, ${grayValue + 100}, 0.7)`;
                   for (let wy = y + 10; wy < y + height; wy += 10) {
                       for (let wx = x + 5; wx < x + width - 5; wx += 10) {
                           if (Math.random() > 0.3) {
                               ctx.fillRect(wx, wy, 3, 4);
                           }
                       }
                   }
               } else {
                   // Round-topped building
                   ctx.beginPath();
                   const radius = width / 2;
                   ctx.arc(x + radius, y, radius, Math.PI, 0, false);
                   ctx.rect(x, y, width, height);
                   ctx.fill();
                   
                   // Add some window details
                   ctx.fillStyle = `rgba(${grayValue + 100}, ${grayValue + 100}, ${grayValue + 100}, 0.7)`;
                   for (let wy = y + 10; wy < y + height; wy += 10) {
                       for (let wx = x + 5; wx < x + width - 5; wx += 10) {
                           if (Math.random() > 0.3) {
                               ctx.fillRect(wx, wy, 3, 4);
                           }
                       }
                   }
               }
           }

           const texture = new THREE.CanvasTexture(canvas);
           const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
           const geometry = new THREE.PlaneGeometry(200, 40);
           skyline = new THREE.Mesh(geometry, material);
           skyline.position.set(0, 11, -200); // Lowered by 2px from previous position
           scene.add(skyline);
       }

       // Load custom spaceship model
       function loadSpaceshipModel() {
           // Create a group to hold all parts of the spaceship
           spaceshipModel = new THREE.Group();
           
           // Main body
           const bodyGeometry = new THREE.ConeGeometry(3, 8, 8);
           const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0x3366cc });
           const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
           body.rotation.x = Math.PI / 2;
           spaceshipModel.add(body);
           
           // Wings
           const wingGeometry = new THREE.BoxGeometry(10, 0.5, 3);
           const wingMaterial = new THREE.MeshBasicMaterial({ color: 0x6699ff });
           const wings = new THREE.Mesh(wingGeometry, wingMaterial);
           wings.position.y = -1;
           spaceshipModel.add(wings);
           
           // Cockpit
           const cockpitGeometry = new THREE.SphereGeometry(1.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
           const cockpitMaterial = new THREE.MeshBasicMaterial({ color: 0xccddff });
           const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
           cockpit.position.z = 2;
           cockpit.rotation.x = Math.PI / 2;
           spaceshipModel.add(cockpit);
           
           // Rotate to face forward (toward player)
           spaceshipModel.rotation.y = 0;

           // const loader = new GLTFLoader();
           // loader.load(
           //     '/tripo_convert_07fdd9cf-cf98-4b76-98a1-4aca4d872246.glb',
           //     function (gltf) {
           //         scene.add(gltf.scene);
           //     },
           //     function (xhr) {
           //         console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
           //     },
           //     function (error) {
           //         console.error('An error happened', error);
           //     }
           // );
          
           
           // Create the player's spaceship
           spaceship = spaceshipModel.clone();
           spaceship.position.set(0, 20, 50);
           scene.add(spaceship);
       }

       // Update spaceship state based on controls
       function updateSpaceshipState() {
           if (!spaceship) return; // Add this check
           
           if (currentShipState.includes('left')) {
               spaceship.rotation.z = Math.PI / 6;
           } else if (currentShipState.includes('right')) {
               spaceship.rotation.z = -Math.PI / 6;
           } else {
               spaceship.rotation.z = 0;
           }
           
           if (currentShipState.includes('up')) {
               spaceship.rotation.x = -Math.PI / 6;
           } else if (currentShipState.includes('down')) {
               spaceship.rotation.x = Math.PI / 6;
           } else {
               spaceship.rotation.x = 0;
           }
       }

       // Shoot fireball
       function shootFireball() {
           if (!spaceship || !isPlayerAlive || isGameOver) return; // Add this check
           
           const now = Date.now();
           if (now - lastFireTime < 500) return;  // Limit firing rate
           lastFireTime = now;

           const geometry = new THREE.SphereGeometry(1, 32, 32);
           const material = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
           const fireball = new THREE.Mesh(geometry, material);
           fireball.position.copy(spaceship.position);
           fireball.position.z -= 10;  // Start slightly in front of the ship
           scene.add(fireball);
           fireballs.push({ mesh: fireball, createdAt: now });
       }

       // Spawn enemy ship with depth-based coloring
       function spawnEnemy(isIntelligent = false) {
           if (!spaceshipModel) return; // Add this check
           
           const enemy = spaceshipModel.clone();
           
           // Create more detailed enemy appearance with multiple parts and colors
           enemy.children.forEach(part => {
               if (part.material) {
                   part.material = part.material.clone();
                   
                   // Assign different base colors to different parts of the ship
                   if (part.geometry instanceof THREE.ConeGeometry) {
                       // Body - red with metallic tint or purple for intelligent enemies
                       part.material.color.set(isIntelligent ? 0x9932CC : 0xcc0000);
                   } else if (part.geometry instanceof THREE.BoxGeometry) {
                       // Wings - darker red or darker purple
                       part.material.color.set(isIntelligent ? 0x800080 : 0x880000);
                   } else {
                       // Cockpit - orange tinted glass or magenta for intelligent enemies
                       part.material.color.set(isIntelligent ? 0xFF00FF : 0xff6600);
                   }
                   
                   // Store the original color for depth-based adjustment
                   part.userData.originalColor = part.material.color.clone();
               }
           });
           
           enemy.position.set(
               Math.random() * 100 - 50,  // Random x position
               Math.random() * 20 + 10,   // Random y position
               -200                       // Start from far away
           );
           
           // Make sure enemies always face the player
           enemy.rotation.y = 0;
           
           // Add enemy-specific properties
           enemy.userData.distance = 300; // Used for depth-based color adjustment
           enemy.userData.moveDirection = {
               x: Math.random() > 0.5 ? 0.2 : -0.2,
               y: Math.random() > 0.5 ? 0.1 : -0.1
           };
           enemy.userData.lastDirectionChange = Date.now();
           enemy.userData.lastFireTime = Date.now();
           enemy.userData.isIntelligent = isIntelligent;
           
           // Add glowing aura for intelligent enemies
           if (isIntelligent) {
               const auraGeometry = new THREE.SphereGeometry(6, 32, 32);
               const auraMaterial = new THREE.MeshBasicMaterial({
                   color: 0xFF00FF,
                   transparent: true,
                   opacity: 0.2
               });
               const aura = new THREE.Mesh(auraGeometry, auraMaterial);
               aura.scale.y = 0.4; // Flatten the aura a bit
               enemy.add(aura);
           }
           
           scene.add(enemy);
           enemies.push(enemy);
           
           return enemy;
       }

       // Handle keydown events
       function onKeyDown(event) {
           switch(event.key) {
               case 'ArrowUp': currentShipState = 'up'; break;
               case 'ArrowDown': currentShipState = 'down'; break;
               case 'ArrowLeft': currentShipState = 'left'; break;
               case 'ArrowRight': currentShipState = 'right'; break;
               case ' ': shootFireball(); break;
           }
           updateSpaceshipState();
       }

       // Handle keyup events
       function onKeyUp(event) {
           if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
               currentShipState = 'center';
               updateSpaceshipState();
           }
       }

       // Function to create health bar
       function createHealthBar() {
           // Create a div for the health bar container
           const healthBarContainer = document.createElement('div');
           healthBarContainer.style.position = 'absolute';
           healthBarContainer.style.bottom = '20px';
           healthBarContainer.style.left = '50%';
           healthBarContainer.style.transform = 'translateX(-50%)';
           healthBarContainer.style.width = '300px';
           healthBarContainer.style.height = '15px';
           healthBarContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
           healthBarContainer.style.borderRadius = '10px';
           healthBarContainer.style.overflow = 'hidden';
           healthBarContainer.style.border = '2px solid rgba(255, 255, 255, 0.5)';
           healthBarContainer.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
           healthBarContainer.style.zIndex = '100';
           
           // Create the actual health bar with gradient
           healthBar = document.createElement('div');
           healthBar.style.width = '100%';
           healthBar.style.height = '100%';
           healthBar.style.background = 'linear-gradient(to right, #ff0000, #ffff00, #00ff00)';
           healthBar.style.transition = 'width 0.3s ease-in-out';
           
           healthBarContainer.appendChild(healthBar);
           document.body.appendChild(healthBarContainer);
           
           return healthBarContainer;
       }
       
       // Update health bar based on player health
       function updateHealthBar() {
           if (healthBar) {
               // Calculate percentage based on max health of 60
               const healthPercentage = (playerHealth / 60) * 100;
               healthBar.style.width = healthPercentage + '%';
               
               // Check if player health reaches zero
               if (playerHealth <= 0 && !isGameOver) {
                   startGameOverSequence();
               }
           }
       }

       // Function to create and display score element
function createScoreDisplay() {
   // Create a div for the score
   scoreElement = document.createElement('div');
   scoreElement.style.position = 'absolute';
   scoreElement.style.top = '20px';
   scoreElement.style.left = '20px';
   scoreElement.style.color = 'white';
   scoreElement.style.fontSize = '24px';
   scoreElement.style.fontWeight = 'bold';
   scoreElement.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.7)';
   scoreElement.style.zIndex = '100';
   scoreElement.textContent = 'Score: 0';
   document.body.appendChild(scoreElement);
   
   return scoreElement;
}

// Update score and create blinking effect
function updateScore(points) {
   score += points;
   
   // Update score display
   if (scoreElement) {
       scoreElement.textContent = 'Score: ' + score;
   }
   
   // Cancel any ongoing blink animation
   if (scoreBlinkTimeout) {
       clearTimeout(scoreBlinkTimeout);
       scoreElement.style.color = 'white';
   }
   
   // Create blinking effect
   let blinkCount = 0;
   const maxBlinks = 6;
   
   function blinkScore() {
       if (blinkCount >= maxBlinks) {
           scoreElement.style.color = 'white';
           scoreBlinkTimeout = null;
           return;
       }
       
       scoreElement.style.color = blinkCount % 2 === 0 ? '#FFFF00' : 'white';
       blinkCount++;
       scoreBlinkTimeout = setTimeout(blinkScore, 100);
   }
   
   blinkScore();
}

// Add a function to handle app lifecycle on mobile (pause/resume)
function setupMobileAppLifecycle() {
    if (!isMobileDevice) return;
    
    // Handle page visibility change (when user switches apps)
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            // Game is paused (user switched apps or locked screen)
            console.log("Game paused - device inactive");
            // You could pause game logic here if needed
        } else {
            // Game is resumed
            console.log("Game resumed - device active");
            // Reset touch positions to prevent unwanted movement
            touchStartX = 0;
            touchStartY = 0;
            currentShipState = 'center';
            updateSpaceshipState();
        }
    });
    
    // Handle device orientation change
    window.addEventListener('orientationchange', function() {
        // Wait for orientation change to complete
        setTimeout(function() {
            onWindowResize();
        }, 200);
    });
}

       
       // Function to handle game over sequence
       function startGameOverSequence() {
           isGameOver = true;
           isPlayerAlive = false;
           
           // Create a bigger explosion at player position
           if (spaceship) {
               gameOverExplosion = createExplosion(spaceship.position, true);
               
               // Start ship crash animation
               animateShipCrash();
           }
       }
       
       // Animate ship crash to the ground
       function animateShipCrash() {
           if (!spaceship) return;
           
           // Store initial position for reference
           const initialY = spaceship.position.y;
           const initialZ = spaceship.position.z;
           const groundY = -15; // Position where ship hits the ground
           const finalZ = initialZ - 100; // Landing in front of the camera, not behind
           
           let crashProgress = 0;
           let rotationSpeed = 0;
           
           // Start slowing down the plane movement
           const slowDownInterval = setInterval(() => {
               planeSpeed = Math.max(0, planeSpeed - 0.001); // Slower deceleration
               if (planeSpeed <= 0) {
                   clearInterval(slowDownInterval);
                   
                   // Once plane stops, display game over and restart button
                   setTimeout(displayGameOver, 1500);
               }
           }, 100);
           
           // Animation function for crashing
           const crashAnimate = function() {
               if (!spaceship || !isGameOver) return;
               
               // Slow down the crash sequence
               crashProgress += 0.005; // Reduced for slower fall
               
               // Calculate new position with arc trajectory
               // Move ship towards ground with a slower descent
               const completionRatio = Math.min(1, crashProgress * 1.2);
               
               // Calculate Y position - slower descent
               const newY = initialY - (initialY - groundY) * Math.pow(completionRatio, 1.5);
               
               // Calculate Z position - move forward (negative Z is forward)
               const newZ = initialZ + (finalZ - initialZ) * completionRatio;
               
               // Update ship position
               spaceship.position.y = newY;
               spaceship.position.z = newZ;
               
               // Add rotation to simulate loss of control (slower rotation)
               rotationSpeed += 0.001; // Reduced for slower rotation
               spaceship.rotation.z += rotationSpeed;
               spaceship.rotation.x += rotationSpeed * 0.5;
               
               // Create smoke/fire trail
               if (crashProgress < 1 && Math.random() > 0.7) {
                   const smokeGeometry = new THREE.SphereGeometry(0.7, 8, 8);
                   const smokeMaterial = new THREE.MeshBasicMaterial({ 
                       color: Math.random() > 0.3 ? 0x888888 : 0xFF4500,
                       transparent: true,
                       opacity: 0.7
                   });
                   const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
                   smoke.position.copy(spaceship.position);
                   smoke.position.y -= 2;
                   scene.add(smoke);
                   
                   // Animate smoke
                   const smokeLife = 1.0;
                   const animateSmoke = function() {
                       if (smoke.userData.life <= 0) {
                           scene.remove(smoke);
                           return;
                       }
                       
                       smoke.position.y += 0.1;
                       smoke.scale.multiplyScalar(1.03);
                       smoke.material.opacity *= 0.95;
                       smoke.userData.life -= 0.05;
                       
                       requestAnimationFrame(animateSmoke);
                   };
                   
                   smoke.userData = { life: smokeLife };
                   animateSmoke();
               }
               
               // Create final explosion when hitting ground
               if (newY <= groundY && spaceship.visible) {
                   spaceship.visible = false;
                   createExplosion(spaceship.position, true);
                   
                   // Create multiple ground explosions
                   for (let i = 0; i < 5; i++) {
                       setTimeout(() => {
                           const explosionPos = new THREE.Vector3(
                               spaceship.position.x + (Math.random() - 0.5) * 10,
                               groundY,
                               spaceship.position.z + (Math.random() - 0.5) * 10
                           );
                           createExplosion(explosionPos, true);
                       }, i * 300);
                   }
                   
                   return; // Stop animation after ground hit
               }
               
               if (spaceship.visible) {
                   requestAnimationFrame(crashAnimate);
               }
           };
           
           crashAnimate();
       }
       
       // Display game over UI
// Modify your displayGameOver function to work well on mobile
function displayGameOver() {
    // Create game over container
    const gameOverContainer = document.createElement('div');
    gameOverContainer.style.position = 'absolute';
    gameOverContainer.style.top = '50%';
    gameOverContainer.style.left = '50%';
    gameOverContainer.style.transform = 'translate(-50%, -50%)';
    gameOverContainer.style.textAlign = 'center';
    gameOverContainer.style.color = 'white';
    gameOverContainer.style.fontSize = isMobileDevice ? '28px' : '36px';
    gameOverContainer.style.textShadow = '2px 2px 8px rgba(0, 0, 0, 0.8)';
    gameOverContainer.style.zIndex = '1000';
    
    // Game over text
    const gameOverText = document.createElement('div');
    gameOverText.textContent = 'GAME OVER';
    gameOverText.style.marginBottom = '30px';
    gameOverText.style.fontWeight = 'bold';
    gameOverText.style.fontSize = isMobileDevice ? '36px' : '48px';
    
    // Score display
    const finalScoreText = document.createElement('div');
    finalScoreText.textContent = 'Score: ' + score;
    finalScoreText.style.marginBottom = '30px';
    finalScoreText.style.fontSize = isMobileDevice ? '28px' : '36px';
    finalScoreText.style.color = '#FFFF00';
    
    // Restart button
    const restartButton = document.createElement('button');
    restartButton.textContent = 'RESTART';
    restartButton.style.padding = isMobileDevice ? '15px 40px' : '15px 40px';
    restartButton.style.fontSize = isMobileDevice ? '20px' : '24px';
    restartButton.style.backgroundColor = '#ff4500';
    restartButton.style.color = 'white';
    restartButton.style.border = 'none';
    restartButton.style.borderRadius = '10px';
    restartButton.style.cursor = 'pointer';
    restartButton.style.fontWeight = 'bold';
    restartButton.style.boxShadow = '0 0 15px rgba(255, 69, 0, 0.7)';
    restartButton.style.transition = 'all 0.2s ease';
    
    // Hover effect for non-mobile
    if (!isMobileDevice) {
        restartButton.onmouseover = function() {
            this.style.backgroundColor = '#ff6a33';
            this.style.transform = 'scale(1.05)';
        };
        restartButton.onmouseout = function() {
            this.style.backgroundColor = '#ff4500';
            this.style.transform = 'scale(1)';
        };
    }
    
    // Click event to restart the game
    restartButton.onclick = function() {
        location.reload();
    };
    
    gameOverContainer.appendChild(gameOverText);
    gameOverContainer.appendChild(finalScoreText);
    gameOverContainer.appendChild(restartButton);
    document.body.appendChild(gameOverContainer);
    
    // Hide mobile controls if they exist
    if (isMobileDevice) {
        if (touchControls) touchControls.style.display = 'none';
        if (fireButton) fireButton.style.display = 'none';
    }
}
       
       // Update health bar position on resize
       function updateHealthBarPosition() {
           const healthBarContainer = healthBar.parentElement;
           if (healthBarContainer) {
               healthBarContainer.style.left = '50%';
           }
       }
       
       // Enemy shoot fireball function
       function enemyShootFireball(enemy) {
           const geometry = new THREE.SphereGeometry(1, 32, 32);
           const material = new THREE.MeshBasicMaterial({ color: 0x00FFFF }); // Cyan color for enemy fireballs
           const fireball = new THREE.Mesh(geometry, material);
           fireball.position.copy(enemy.position);
           fireball.position.z += 5; // Start slightly in front of the enemy ship
           scene.add(fireball);
           
           // Make enemy fireballs more visible
           const glowGeometry = new THREE.SphereGeometry(1.5, 16, 16);
           const glowMaterial = new THREE.MeshBasicMaterial({
               color: 0x00FFFF,
               transparent: true,
               opacity: 0.3
           });
           const glow = new THREE.Mesh(glowGeometry, glowMaterial);
           glow.position.copy(fireball.position);
           fireball.add(glow);
           
           // Calculate direction vector towards player
           const direction = new THREE.Vector3();
           if (spaceship) {
               direction.subVectors(spaceship.position, enemy.position).normalize();
           } else {
               direction.set(0, 0, 1); // Default direction if player doesn't exist
           }
           
           // Store direction with the fireball
           fireball.userData.direction = direction;
           
           enemyFireballs.push({
               mesh: fireball,
               createdAt: Date.now(),
               direction: direction
           });
       }

       // Initialize the scene
       function init() {
           // Create scene, camera, and renderer
           scene = new THREE.Scene();
           camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
           renderer = new THREE.WebGLRenderer();
           renderer.setSize(window.innerWidth, window.innerHeight);
           document.body.appendChild(renderer.domElement);

           // Set up sky and background
           addSkyElements();

           // Create desert texture
           const canvas = document.createElement('canvas');
           canvas.width = textureSize;
           canvas.height = textureSize;
           const ctx = canvas.getContext('2d');
           generateDesertTexture(ctx);

           const texture = new THREE.CanvasTexture(canvas);
           texture.wrapS = THREE.RepeatWrapping;
           texture.wrapT = THREE.RepeatWrapping;
           texture.repeat.set(20, 10); // Increased horizontal repeat

           // Create plane geometry - increased width for wider horizon
           const geometry = new THREE.PlaneGeometry(780, 400, 10, 10);
           const material = new THREE.MeshBasicMaterial({ map: texture });
           plane = new THREE.Mesh(geometry, material);

           // Rotate and position the plane
           plane.rotation.x = -Math.PI / 2;
           plane.position.y = -20;
           plane.position.z = -100;

           scene.add(plane);

           // Add skyline
           addSkyline();

           // Position camera
           camera.position.y = 30;
           camera.position.z = 100;
           camera.lookAt(0, 0, -100);

           // Load spaceship model
           loadSpaceshipModel();

           // Initialize rocks
initializeRocks();

// After rocks initialization
initializeTanks();
           
           // Create health bar
           createHealthBar();

               
   // Create score display
   createScoreDisplay();

   initMobileControls();

   optimizeForMobile();


           // Set up event listeners
           document.addEventListener('keydown', onKeyDown);
           document.addEventListener('keyup', onKeyUp);

           // Start animation loop
           animate();
       }

       // Animation loop
       function animate() {
           requestAnimationFrame(animate);

           // Move the texture to create flying effect
           plane.material.map.offset.y += planeSpeed;

           // Update spaceship position based on current state
           const moveAmount = 0.5;
           if (spaceship && isPlayerAlive && !isGameOver) {
               if (currentShipState.includes('up')) spaceship.position.y = Math.min(35, spaceship.position.y + moveAmount);
               if (currentShipState.includes('down')) spaceship.position.y = Math.max(5, spaceship.position.y - moveAmount);
               if (currentShipState.includes('left')) spaceship.position.x = Math.max(-50, spaceship.position.x - moveAmount);
               if (currentShipState.includes('right')) spaceship.position.x = Math.min(50, spaceship.position.x + moveAmount);
           }

           // Update fireballs
           const now = Date.now();
           fireballs = fireballs.filter(fireball => {
               const age = now - fireball.createdAt;
               if (age > 2000) {
                   scene.remove(fireball.mesh);
                   return false;
               }
               
               // Move fireball towards the horizon
               fireball.mesh.position.z -= 3;
               
               // Add some trail/glow effect
               if (Math.random() > 0.7) {
                   const trailGeometry = new THREE.SphereGeometry(0.5, 8, 8);
                   const trailMaterial = new THREE.MeshBasicMaterial({ 
                       color: 0xffff00,
                       transparent: true,
                       opacity: 0.7
                   });
                   const trail = new THREE.Mesh(trailGeometry, trailMaterial);
                   trail.position.copy(fireball.mesh.position);
                   scene.add(trail);
                   
                   // Remove trail after short time
                   setTimeout(() => {
                       scene.remove(trail);
                   }, 300);
               }
               
               // Scale down the fireball as it moves away
               const scale = Math.max(0.1, 1 - age / 2000);
               fireball.mesh.scale.set(scale, scale, scale);
               
               // Check for collisions with enemies
               for (let i = enemies.length - 1; i >= 0; i--) {
                   const enemy = enemies[i];
                   const distance = fireball.mesh.position.distanceTo(enemy.position);
                   
                   if (distance < 5) {
                       // Collision detected - create explosion effect
                       createExplosion(enemy.position);
                       
               // Add points based on enemy type
       const pointsToAdd = enemy.userData.isIntelligent ? 10 : 5;
       updateScore(pointsToAdd);
 
       // Remove both fireball and enemy
                       scene.remove(fireball.mesh);
                       scene.remove(enemy);
                       enemies.splice(i, 1);
                       return false;
                   }
               }
               
               return true;
           });

           // Update enemies
           for (let i = enemies.length - 1; i >= 0; i--) {
               const enemy = enemies[i];
               
               // Move towards the player
               enemy.position.z += 0.7;  // Changed from 1.0 to 0.7
               
               const now = Date.now();
               
               // Intelligent enemy tracking behavior
               if (enemy.userData.isIntelligent && spaceship && isPlayerAlive) {
                   // Calculate direction to player
                   const directionToPlayer = new THREE.Vector3();
                   directionToPlayer.subVectors(spaceship.position, enemy.position).normalize();
                   
                   // Update movement based on player position
                   enemy.position.x += directionToPlayer.x * 0.3;
                   enemy.position.y += directionToPlayer.y * 0.2;
                   
                   // Fire more frequently (every 0.7 seconds)
                   if (now - enemy.userData.lastFireTime > 700 && enemy.position.z < 0) {
                       enemyShootFireball(enemy);
                       enemy.userData.lastFireTime = now;
                   }
               } else {
                   // Regular enemy behavior
                   // Randomly change direction every few seconds
                   if (now - enemy.userData.lastDirectionChange > 3000) {
                       enemy.userData.moveDirection = {
                           x: (Math.random() - 0.5) * 0.4,
                           y: (Math.random() - 0.5) * 0.2
                       };
                       enemy.userData.lastDirectionChange = now;
                   }
                   
                   // Apply movement in x and y directions
                   enemy.position.x += enemy.userData.moveDirection.x;
                   enemy.position.y += enemy.userData.moveDirection.y;
                   
                   // Regular firing logic
                   if (now - enemy.userData.lastFireTime > 2000 && Math.random() < 0.5 && enemy.position.z < 0) {
                       enemyShootFireball(enemy);
                       enemy.userData.lastFireTime = now;
                   }
               }
               
               // Keep enemies within bounds
               enemy.position.x = Math.max(-50, Math.min(50, enemy.position.x));
               enemy.position.y = Math.max(5, Math.min(35, enemy.position.y));
               
               // Update distance for depth calculation
               const distanceFromPlayer = 300 - (enemy.position.z + 200);
               enemy.userData.distance = distanceFromPlayer;
               
               // Update color based on distance (brightness adjustment)
               enemy.children.forEach(part => {
                   if (part.material && part.userData.originalColor) {
                       // Calculate brightness factor based on distance
                       // Distant ships are lighter/desaturated, closer ones are more vibrant
                       const brightnessFactor = Math.min(1, 0.4 + (distanceFromPlayer / 300) * 0.6);
                       const saturationFactor = Math.min(1, 0.5 + (1 - distanceFromPlayer / 300) * 0.5);
                       
                       // Get original color and adjust it
                       const originalColor = part.userData.originalColor;
                       let r = originalColor.r;
                       let g = originalColor.g;
                       let b = originalColor.b;
                       
                       // Apply brightness adjustment (higher for distant objects)
                       r = r * saturationFactor + (1 - saturationFactor);
                       g = g * saturationFactor + (1 - saturationFactor);
                       b = b * saturationFactor + (1 - saturationFactor);
                       
                       // Set the adjusted color
                       part.material.color.setRGB(r, g, b);
                   }
               });
               
               // Check for collision with player
               if (spaceship && isPlayerAlive && !isGameOver && enemy.position.z > 40 && enemy.position.z < 60) {
                   const distance = enemy.position.distanceTo(spaceship.position);
                   if (distance < 7) {
                       // Collision with player!
                       createExplosion(spaceship.position, true);
                       playerHealth = Math.max(0, playerHealth - 30);
                       updateHealthBar();
                       
                       // Remove the enemy
                       scene.remove(enemy);
                       enemies.splice(i, 1);
                       
                       continue;
                   }
               }
               
               if (enemy.position.z > 100) {
                   scene.remove(enemy);
                   enemies.splice(i, 1);
               }
           }
           
           // Update enemy fireballs
           enemyFireballs = enemyFireballs.filter(fireball => {
               const age = now - fireball.createdAt;
               if (age > 2000) {
                   scene.remove(fireball.mesh);
                   return false;
               }
               
               // Move fireball towards the player (reduced from 4.5 to 3.15 - 30% slower)
               fireball.mesh.position.z += 3.15;
               
               // Add some trail/glow effect for enemy fireballs
               if (Math.random() > 0.7) {
                   const trailGeometry = new THREE.SphereGeometry(0.5, 8, 8);
                   const trailMaterial = new THREE.MeshBasicMaterial({ 
                       color: 0x00ffff,
                       transparent: true,
                       opacity: 0.7
                   });
                   const trail = new THREE.Mesh(trailGeometry, trailMaterial);
                   trail.position.copy(fireball.mesh.position);
                   scene.add(trail);
                   
                   // Remove trail after short time
                   setTimeout(() => {
                       scene.remove(trail);
                   }, 300);
               }
               
               // Check for collision with player
               if (spaceship && isPlayerAlive && !isGameOver) {
                   const distance = fireball.mesh.position.distanceTo(spaceship.position);
                   if (distance < 5) {
                       // Hit player!
                       createExplosion(spaceship.position, true);
                       playerHealth = Math.max(0, playerHealth - 10);
                       updateHealthBar();
                       
                       // Remove the fireball
                       scene.remove(fireball.mesh);
                       return false;
                   }
               }
               
               return true;
           });
           
           // Increase player health over time (1 point per second) if not game over
           if (!isGameOver && now - lastHealthIncreaseTime > 1000 && playerHealth < 60) {
               playerHealth = Math.min(60, playerHealth + 1);
               updateHealthBar();
               lastHealthIncreaseTime = now;
           }
           
           // Check if we should spawn an intelligent enemy (every ~5 seconds)
           if (now - lastIntelligentEnemyTime > 5000 && Math.random() < 0.2) {
               spawnEnemy(true); // Spawn an intelligent enemy
               lastIntelligentEnemyTime = now;
           }

           // Spawn new enemies
           if (Math.random() < 0.02) {  // 2% chance each frame
               spawnEnemy();
           }

// Update rocks
updateRocks();

updateTanks();
checkTankFireballCollisions();

;



// Add this function to your code
function updateRocks() {
   // Count rocks to remove
   let rocksRemoved = 0;
   
   // Update existing rocks
   rocks = rocks.filter(rock => {
       // Move rock forward
       rock.position.z += planeSpeed * 40;
       
       // If rock has passed camera, remove it
       if (rock.position.z > 120) {
           scene.remove(rock);
           rocksRemoved++;
           return false;
       }
       
       return true;
   });
   
   // Create new rocks to replace removed ones
   for (let i = 0; i < rocksRemoved; i++) {
       const newRock = createRock();
  }
   

}


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Update health bar position if it exists
    updateHealthBarPosition();
    
    // Reposition mobile controls if they exist
    if (isMobileDevice && fireButton) {
        fireButton.style.bottom = '30px';
        fireButton.style.right = '30px';
    }
}


renderer.render(scene, camera);
       }

       // Handle window resizing
       window.addEventListener('resize', function() {
           camera.aspect = window.innerWidth / window.innerHeight;
           camera.updateProjectionMatrix();
           renderer.setSize(window.innerWidth, window.innerHeight);
           updateHealthBarPosition();
       }, false);

       // Start the simulation
       init();