import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// 1. Setup Scene, Camera, Renderer
const canvas = document.getElementById('webgl-canvas');
const scene = new THREE.Scene();
// Store car parts for exploded view
let carShell = new THREE.Group(); 
let carFrame = new THREE.Group(); 
let wheels = [];
let mcuGroup = null;
let modelsLoaded = 0; 

// Initial setup: Add shell and frame to the main car group
// This ensures they move together automatically!

// Fog for daytime atmosphere
scene.fog = new THREE.FogExp2(0x99aab5, 0.0015); // Darker, more muted fog color

// Load Background Texture directly into Scene
const textureLoader = new THREE.TextureLoader();
textureLoader.load('background_day.png', (texture) => {
    scene.background = texture;
    scene.backgroundIntensity = 0.2; // Significantly darkened
});

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// Start MUCH closer to the car (Lower, tighter angle)
camera.position.set(4, 1.2, 5);

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Post-processing setup
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.2;
bloomPass.strength = 1.0;
bloomPass.radius = 0.5;

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// 2. Create Environment (Road and Tunnel)
// Create Realistic Road Texture with Canvas
const roadCanvas = document.createElement('canvas');
roadCanvas.width = 1024;
roadCanvas.height = 1024;
const roadCtx = roadCanvas.getContext('2d');

// Asphalt background color
roadCtx.fillStyle = '#222225'; // Much darker asphalt
roadCtx.fillRect(0, 0, 1024, 1024);

// Add subtle noise for asphalt texture
for (let i = 0; i < 15000; i++) {
    roadCtx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.05)';
    roadCtx.fillRect(Math.random() * 1024, Math.random() * 1024, 3, 3);
}

// Side lines (White solid)
roadCtx.fillStyle = '#ffffff';
roadCtx.fillRect(50, 0, 20, 1024); // Left side line
roadCtx.fillRect(1024 - 70, 0, 20, 1024); // Right side line

// Center dashed line (Yellow)
roadCtx.fillStyle = '#ffb700';
for(let i = 0; i < 1024; i += 128) {
    roadCtx.fillRect(1024 / 2 - 10, i, 20, 64);
}

const roadTexture = new THREE.CanvasTexture(roadCanvas);
roadTexture.wrapS = THREE.RepeatWrapping;
roadTexture.wrapT = THREE.RepeatWrapping;
roadTexture.repeat.set(1, 100); // Repeat length-wise
if (renderer.capabilities.getMaxAnisotropy() > 0) {
    roadTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
}

// Road (Increased length for more information space)
const roadGeometry = new THREE.PlaneGeometry(20, 2000);
const roadMaterial = new THREE.MeshStandardMaterial({ 
    map: roadTexture,
    roughness: 1.0, 
    metalness: 0.0  
});
const road = new THREE.Mesh(roadGeometry, roadMaterial);
road.rotation.x = -Math.PI / 2;
road.position.z = -1000; 
scene.add(road);

// Solid Tunnel (Moved further back to create more space)
const tunnelGroup = new THREE.Group();
const tunnelLength = 1000;
const tunnelRadius = 15;
const tunnelStartZ = -700; // Increased distance to tunnel entrance

// Tunnel Entrance Arch (Distinct color to stand out)
const entranceGeo = new THREE.TorusGeometry(15, 1.5, 16, 50, Math.PI);
const entranceMat = new THREE.MeshStandardMaterial({ color: 0xcc5500, roughness: 0.8 }); // Distinct orange color
const entranceArch = new THREE.Mesh(entranceGeo, entranceMat);
entranceArch.position.z = tunnelStartZ;
entranceArch.rotation.z = Math.PI; // Arch goes over the road
tunnelGroup.add(entranceArch);

// Warning lights on the entrance arch
const warnLightGeo = new THREE.CircleGeometry(0.8, 32);
const warnLightMat = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffaa00, emissiveIntensity: 2 });

const leftWarn = new THREE.Mesh(warnLightGeo, warnLightMat);
leftWarn.position.set(-14, 2, tunnelStartZ + 0.1); // Slightly in front of the arch
tunnelGroup.add(leftWarn);

const rightWarn = new THREE.Mesh(warnLightGeo, warnLightMat);
rightWarn.position.set(14, 2, tunnelStartZ + 0.1);
tunnelGroup.add(rightWarn);

// Main tunnel tube (using BackSide so we see the inside)
const tubeGeometry = new THREE.CylinderGeometry(tunnelRadius, tunnelRadius, tunnelLength, 32, 1, true);
const tubeMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xcccccc, // Bright concrete color for inner walls
    roughness: 0.9,
    metalness: 0.1,
    side: THREE.BackSide 
});
const tunnelTube = new THREE.Mesh(tubeGeometry, tubeMaterial);
tunnelTube.rotation.x = Math.PI / 2; // Lie along Z axis
tunnelTube.position.z = tunnelStartZ - (tunnelLength / 2); // Start at z = -300
tunnelTube.position.y = 0; // The road plane will visually cut the bottom half
tunnelGroup.add(tunnelTube);

// Tunnel Ceiling Lights (Fluorescent strips)
const stripGeo = new THREE.PlaneGeometry(3, 0.8);
const stripMat = new THREE.MeshStandardMaterial({ 
    color: 0xdddddd, 
    emissive: 0xffffff, 
    emissiveIntensity: 1.5 
});
for (let i = 0; i < 40; i++) {
    const strip = new THREE.Mesh(stripGeo, stripMat);
    strip.position.y = tunnelRadius - 0.5; // Near ceiling
    strip.position.z = tunnelStartZ - (i * 20); // Spaced evenly inside
    strip.rotation.x = Math.PI / 2; // Face downwards
    tunnelGroup.add(strip);
}
// --- New: Create Highway Distance Markers ---
function createDistanceMarker(text, zPos) {
    const markerGroup = new THREE.Group();
    
    // Sign post
    const postGeo = new THREE.CylinderGeometry(0.1, 0.1, 5);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.y = 2.5;
    markerGroup.add(post);

    // Sign board (Canvas Texture)
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Background (Highway Blue)
    ctx.fillStyle = '#004488';
    ctx.fillRect(0, 0, 512, 256);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 15;
    ctx.strokeRect(20, 20, 472, 216);
    
    // Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 120px Outfit, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 128);
    
    const texture = new THREE.CanvasTexture(canvas);
    const boardGeo = new THREE.PlaneGeometry(5, 2.5);
    const boardMat = new THREE.MeshStandardMaterial({ map: texture, side: THREE.DoubleSide });
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.y = 5;
    markerGroup.add(board);
    
    markerGroup.position.set(12, 0, zPos);
    markerGroup.rotation.y = -Math.PI / 6; // Angled slightly towards the driver
    scene.add(markerGroup);
}

// Add markers relative to tunnelStartZ (-700)
createDistanceMarker("300m", tunnelStartZ + 300);
createDistanceMarker("200m", tunnelStartZ + 200);
createDistanceMarker("100m", tunnelStartZ + 100);
createDistanceMarker("50m", tunnelStartZ + 50);

scene.add(tunnelGroup);

// 3. Create Vehicle (Realistic 3D Model)
const carGroup = new THREE.Group();
carGroup.position.y = 0.5; // Lift to sit on the road
scene.add(carGroup);
carGroup.add(carShell);
carGroup.add(carFrame);

// Placeholder box while loading (Add to shell)
const bodyGeo = new THREE.BoxGeometry(2, 1, 4);
const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a });
const placeholder = new THREE.Mesh(bodyGeo, bodyMat);
placeholder.position.y = 0.5;
carShell.add(placeholder);

// Load Ferrari
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/gltf/');

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);
loader.load('ferrari.glb', function(gltf) {
    const model = gltf.scene;
    
    // Add model to scene temporarily to compute world transforms
    scene.add(model);
    model.updateMatrixWorld();

    const meshes = [];
    model.traverse((child) => {
        if (child.isMesh) {
            meshes.push(child);
        }
    });

    meshes.forEach((child) => {
        child.castShadow = true;
        child.receiveShadow = true;
        
        const name = child.name.toLowerCase();
        // Get world position for heuristic
        const worldPos = new THREE.Vector3();
        child.getWorldPosition(worldPos);

        if (name.includes('wheel') || name.includes('tire') || name.includes('rim')) {
            child.initialX = child.position.x;
            carFrame.attach(child); 
            wheels.push(child);
        } else if (worldPos.y > 0.6) {
            // Use world position to decide Shell vs Frame
            carShell.attach(child); 
        } else {
            carFrame.attach(child);
        }
    });
    
    scene.remove(model); // Clean up temporary model
    
    // Replace placeholder
    if (carShell.children.length > 0) {
        carShell.remove(placeholder); 
    }
    
    createMCU();
    
    // Immediately start since we only need the car
    runIntro();
    initSlideAnimations();
    init3DAnimations(); 
}, undefined, (error) => {
    console.error('Error loading car model:', error);
    initSlideAnimations(); // Still allow text scrolling if car fails
});

// --- New: Create Hyper-Realistic Procedural 3D ESP32 MCU ---
function createMCU() {
    mcuGroup = new THREE.Group();
    mcuGroup.scale.set(0, 0, 0); 
    carGroup.add(mcuGroup);

    // 1. PCB (Main Board) - Deep Dark Green/Black
    const pcbGeo = new THREE.BoxGeometry(1.2, 2.0, 0.1);
    const pcbMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.9, metalness: 0.1 });
    const pcb = new THREE.Mesh(pcbGeo, pcbMat);
    mcuGroup.add(pcb);

    // 2. Metal Shield (High Polish)
    const shieldGeo = new THREE.BoxGeometry(0.8, 1.0, 0.12);
    const shieldMat = new THREE.MeshStandardMaterial({ 
        color: 0xeeeeee, 
        metalness: 1.0, 
        roughness: 0.1 
    });
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    shield.position.z = 0.1;
    shield.position.y = 0.2;
    mcuGroup.add(shield);

    // 3. ESP32 Logo Label
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('esp32.png', (texture) => {
        const labelGeo = new THREE.PlaneGeometry(0.75, 0.95);
        const labelMat = new THREE.MeshBasicMaterial({ 
            map: texture, 
            transparent: true,
            side: THREE.DoubleSide
        });
        const label = new THREE.Mesh(labelGeo, labelMat);
        label.position.z = 0.165;
        label.position.y = 0.2;
        mcuGroup.add(label);
    });

    // 4. SMD Components (Resistors, Capacitors)
    const smdGeo = new THREE.BoxGeometry(0.08, 0.15, 0.05);
    const resMat = new THREE.MeshStandardMaterial({ color: 0x333333 }); // Resistor
    const capMat = new THREE.MeshStandardMaterial({ color: 0x964b00 }); // Capacitor (Tan)

    for (let i = 0; i < 12; i++) {
        const comp = new THREE.Mesh(smdGeo, Math.random() > 0.5 ? resMat : capMat);
        comp.position.set(
            (Math.random() - 0.5) * 0.8,
            (Math.random() - 0.5) * 1.5,
            0.06
        );
        comp.rotation.z = Math.random() * Math.PI;
        mcuGroup.add(comp);
    }

    // 5. Status LEDs (Power & Data)
    const ledGeo = new THREE.BoxGeometry(0.06, 0.06, 0.05);
    const powerLed = new THREE.Mesh(ledGeo, new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 2 }));
    powerLed.position.set(0.4, -0.6, 0.08);
    mcuGroup.add(powerLed);

    const dataLed = new THREE.Mesh(ledGeo, new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 2 }));
    dataLed.position.set(0.2, -0.6, 0.08);
    mcuGroup.add(dataLed);

    // 6. Push Buttons (Reset & Boot)
    const btnBaseGeo = new THREE.BoxGeometry(0.15, 0.15, 0.05);
    const btnCapGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.08, 8);
    const btnMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const silverMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8 });

    const createButton = (x, y) => {
        const btn = new THREE.Group();
        const base = new THREE.Mesh(btnBaseGeo, btnMat);
        const cap = new THREE.Mesh(btnCapGeo, silverMat);
        cap.rotation.x = Math.PI / 2;
        cap.position.z = 0.05;
        btn.add(base, cap);
        btn.position.set(x, y, 0.08);
        mcuGroup.add(btn);
    };
    createButton(-0.4, -0.85); // Reset
    createButton(0.4, -0.85);  // Boot

    // 7. Gold Pins
    const pinGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.25, 8);
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 1.0, roughness: 0.2 });
    for (let i = 0; i < 15; i++) {
        const yPos = -0.8 + (i * 0.12);
        const pinL = new THREE.Mesh(pinGeo, pinMat);
        pinL.rotation.z = Math.PI / 2;
        pinL.position.set(-0.55, yPos, 0);
        mcuGroup.add(pinL);
        const pinR = new THREE.Mesh(pinGeo, pinMat);
        pinR.rotation.z = Math.PI / 2;
        pinR.position.set(0.55, yPos, 0);
        mcuGroup.add(pinR);
    }

    // 8. USB-C Port
    const usbGeo = new THREE.BoxGeometry(0.4, 0.3, 0.15);
    const usbMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.9, roughness: 0.1 });
    const usb = new THREE.Mesh(usbGeo, usbMat);
    usb.position.y = -1.1; // Extends slightly off board
    usb.position.z = 0.05;
    mcuGroup.add(usb);

    mcuGroup.position.y = 0.5; 
}

// Taillights (Small circular brake lights, sized for Ferrari)
const lightGeo = new THREE.CircleGeometry(0.12, 32); // Small circle
// Emissive material for the glowing effect
const taillightMat = new THREE.MeshStandardMaterial({ 
    color: 0x330000, 
    emissive: 0xff0000,
    emissiveIntensity: 0 // Start off
});

// Left Outer Light
const leftOuter = new THREE.Mesh(lightGeo, taillightMat);
leftOuter.position.set(-0.78, 0.85, 2.31); 
carGroup.add(leftOuter);

// Left Inner Light
const leftInner = new THREE.Mesh(lightGeo, taillightMat);
leftInner.position.set(-0.52, 0.85, 2.31); 
carGroup.add(leftInner);

// Right Inner Light
const rightInner = new THREE.Mesh(lightGeo, taillightMat);
rightInner.position.set(0.52, 0.85, 2.31); 
carGroup.add(rightInner);

// Right Outer Light
const rightOuter = new THREE.Mesh(lightGeo, taillightMat);
rightOuter.position.set(0.78, 0.85, 2.31); 
carGroup.add(rightOuter);

// Actual point lights to illuminate the road behind the car
const tailPointLightLeft = new THREE.PointLight(0xff0000, 0, 20);
tailPointLightLeft.position.set(-0.65, 0.85, 2.5);
carGroup.add(tailPointLightLeft);

const tailPointLightRight = new THREE.PointLight(0xff0000, 0, 20);
tailPointLightRight.position.set(0.65, 0.85, 2.5);
carGroup.add(tailPointLightRight);

// 4. Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3); // Dimmer ambient
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8); // Muted sunlight
dirLight.position.set(10, 50, 10);
scene.add(dirLight);

// 5. Animation Loop
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();
    
    const shakeAmount = Math.abs(carGroup.position.z) > 10 ? 0.02 : 0;
    camera.position.x += (Math.random() - 0.5) * shakeAmount;
    camera.position.y += (Math.random() - 0.5) * shakeAmount;

    // Apply movement to the whole group so children (Shell/Frame) follow
    carGroup.position.y = Math.sin(elapsedTime * 15) * 0.01; 
    
    // No need for manual sync anymore! They are children of carGroup.

    const lookTarget = new THREE.Vector3(
        carGroup.position.x,
        carGroup.position.y + 1,
        carGroup.position.z - 10 
    );
    camera.lookAt(lookTarget);
    
    composer.render();
}
animate();

function runIntro() {
    const introTl = gsap.timeline();
    
    // Start very close behind the car
    camera.position.set(0, 1.2, 10);
    
    introTl.to(carGroup.position, {
        z: -100,
        duration: 1.5,
        ease: "power2.inOut"
    }, 0)
    .to(camera.position, { 
        x: 4, y: 1.2, z: -94, // Even tighter follow (only 6 units behind)
        duration: 1.5, 
        ease: "power2.inOut" 
    }, 0)
    .to(".slide#slide-0 .content", {
        opacity: 1,
        y: 0,
        duration: 1.5,
        ease: "power2.out"
    }, 1.5);
}

// 6. Handle Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 7. GSAP Scroll Animations
gsap.registerPlugin(ScrollTrigger);

function initSlideAnimations() {
    const slides = document.querySelectorAll('.slide .content');
    slides.forEach((slide) => {
        if (slide.parentElement.id === "slide-0") return;
        gsap.to(slide, {
            opacity: 1,
            y: 0,
            duration: 1,
            scrollTrigger: {
                trigger: slide.parentElement,
                start: "top 80%",
                end: "bottom 20%",
                toggleActions: "play reverse play reverse"
            }
        });
    });
}

function init3DAnimations() {
    // --- 3D Scene Scroll Timeline ---
    // Only create this once we have real objects to animate
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: ".presentation",
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
        }
    });

    // Slide 1 to 2: High Speed Drive + DYNAMIC EXPLODED VIEW Reveal
    tl.to(carGroup.position, {
        z: -400, 
        duration: 0.4,
        ease: "none"
    }, 0);
    
    // Extreme Zoom-in on MCU
    tl.to(camera.position, {
        x: 1.5, 
        z: -396, // Close to the car's Z position (-400)
        y: 1.2, 
        duration: 0.4,
        ease: "none" 
    }, 0);

    // --- MULTI-LAYER DISASSEMBLY ANIMATION ---
    // Lift Shell (Upper Body)
    tl.to(carShell.position, { y: 6, duration: 0.2, ease: "back.out(2)" }, 0.1);
    tl.to(carShell.rotation, { z: 0.2, x: 0.1, duration: 0.2 }, 0.1);

    // Lower Frame (Lower Chassis)
    tl.to(carFrame.position, { y: -1, duration: 0.2, ease: "power2.out" }, 0.1);
    
    if (wheels.length > 0) {
        wheels.forEach((wheel, i) => {
            const directionX = wheel.position.x > 0 ? 1 : -1;
            const directionZ = i < 2 ? -1 : 1; 
            tl.to(wheel.position, { 
                x: wheel.position.x + (5 * directionX), 
                y: 1.5,
                z: wheel.position.z + (3 * directionZ),
                duration: 0.2, 
                ease: "power2.out" 
            }, 0.1);
            tl.to(wheel.rotation, { x: Math.PI, z: Math.PI, duration: 0.2 }, 0.1);

            // Reassembly
            tl.to(wheel.position, { x: wheel.initialX || 0, y: 0, z: 0, duration: 0.2, ease: "power2.in" }, 0.3);
            tl.to(wheel.rotation, { x: 0, z: 0, duration: 0.2 }, 0.3);
        });
    }

    // Reveal Banana Pi Nano MCU
    if (mcuGroup) {
        tl.to(mcuGroup.scale, { x: 2.5, y: 2.5, z: 2.5, duration: 0.25, ease: "elastic.out(1, 0.5)" }, 0.15);
        tl.to(mcuGroup.rotation, { y: Math.PI * 6, duration: 0.4, ease: "none" }, 0.15);
        tl.to(mcuGroup.scale, { x: 0, y: 0, z: 0, duration: 0.15 }, 0.3);
    }

    // Reassemble Shell and Frame
    tl.to(carShell.position, { y: 0, duration: 0.2, ease: "bounce.out" }, 0.3);
    tl.to(carShell.rotation, { z: 0, x: 0, duration: 0.2 }, 0.3);
    tl.to(carFrame.position, { y: 0, duration: 0.2, ease: "power2.in" }, 0.3);

    // Increase FOV for speed sensation
    tl.to(camera, {
        fov: 90,
        duration: 0.4,
        onUpdate: () => camera.updateProjectionMatrix()
    }, 0);

    // Slide 2 to 3: Approach Tunnel Entrance
    tl.to(carGroup.position, {
        z: -690, 
        duration: 0.3,
        ease: "none"
    }, 0.4);
    tl.to(camera.position, {
        x: 0, 
        z: -684, // Tighter follow
        y: 2, 
        duration: 0.3,
        ease: "none"
    }, 0.4);
    tl.to(camera, {
        fov: 75, 
        duration: 0.3,
        onUpdate: () => camera.updateProjectionMatrix()
    }, 0.4);

    // Progressive Braking Lights (300m to 50m)
    // Starts at 0.4 (z=-400) and reaches max by 0.66 (z=-650)
    tl.to(taillightMat, { emissiveIntensity: 10, duration: 0.26, ease: "power1.in" }, 0.4); 
    tl.to(tailPointLightLeft, { intensity: 50, duration: 0.26, ease: "power1.in" }, 0.4);
    tl.to(tailPointLightRight, { intensity: 50, duration: 0.26, ease: "power1.in" }, 0.4);

    // Into the tunnel
    tl.to(carGroup.position, { z: -1200, duration: 0.3, ease: "none" }, 0.7);
    tl.to(camera.position, { z: -1194, duration: 0.3, ease: "none" }, 0.7);
    
    // Final refresh
    ScrollTrigger.refresh();
}

// --- Start the System ---
// initSlideAnimations(); 
// runIntro();
// These are now called inside the car loader for perfect sync
