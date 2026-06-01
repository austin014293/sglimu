import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// --- Simulation Global State ---
const SIM_STATE = {
    speed: 0,
    distance: 300,
    lux: 1500,
    autoLight: true,
    manualLightOn: false,
    lightActive: false,
    timeOfDay: 'day', // 'day', 'sunset', 'night'
    isSliderOverridden: false,
    overriddenLux: 1500
};

// 1. Setup Scene, Camera, Renderer
const canvas = document.getElementById('webgl-canvas');
const scene = new THREE.Scene();

// Store car parts for exploded view
let carShell = new THREE.Group(); 
let carFrame = new THREE.Group(); 
let wheels = [];
let mcuGroup = null;

// Anchors for 3D label tags
let anchorPCB, anchorESP32, anchorSensor, anchorRelay;

// Fog for atmospheric control (configured as a dark premium void instead of a bright haze)
scene.fog = new THREE.FogExp2(0x0a0e17, 0.002);
scene.background = scene.fog.color; // Infinite clean horizon blend

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(4, 1.2, 5);

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Post-processing setup
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.25;
bloomPass.strength = 1.2;
bloomPass.radius = 0.6;

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// 2. Create Environment (Road and Tunnel)
const roadCanvas = document.createElement('canvas');
roadCanvas.width = 1024;
roadCanvas.height = 1024;
const roadCtx = roadCanvas.getContext('2d');

// Asphalt background color
roadCtx.fillStyle = '#1e1e21';
roadCtx.fillRect(0, 0, 1024, 1024);

// Noise for asphalt texture
for (let i = 0; i < 15000; i++) {
    roadCtx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.06)';
    roadCtx.fillRect(Math.random() * 1024, Math.random() * 1024, 3, 3);
}

// Side lines (White solid)
roadCtx.fillStyle = '#ffffff';
roadCtx.fillRect(50, 0, 20, 1024);
roadCtx.fillRect(1024 - 70, 0, 20, 1024);

// Center dashed line (Yellow)
roadCtx.fillStyle = '#ffaa00';
for(let i = 0; i < 1024; i += 128) {
    roadCtx.fillRect(1024 / 2 - 10, i, 20, 64);
}

const roadTexture = new THREE.CanvasTexture(roadCanvas);
roadTexture.wrapS = THREE.RepeatWrapping;
roadTexture.wrapT = THREE.RepeatWrapping;
roadTexture.repeat.set(1, 100);
if (renderer.capabilities.getMaxAnisotropy() > 0) {
    roadTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
}

// Road
const roadGeometry = new THREE.PlaneGeometry(20, 2000);
const roadMaterial = new THREE.MeshStandardMaterial({ 
    map: roadTexture,
    roughness: 0.95, 
    metalness: 0.05
});
const road = new THREE.Mesh(roadGeometry, roadMaterial);
road.rotation.x = -Math.PI / 2;
road.position.z = -1000; 
scene.add(road);

// Tunnel Group
const tunnelGroup = new THREE.Group();
const tunnelLength = 1000;
const tunnelRadius = 15;
const tunnelStartZ = -700;

// Tunnel Entrance Arch (Distinct Orange Torus)
const entranceGeo = new THREE.TorusGeometry(15, 1.5, 16, 50, Math.PI);
const entranceMat = new THREE.MeshStandardMaterial({ color: 0xe65c00, roughness: 0.7 });
const entranceArch = new THREE.Mesh(entranceGeo, entranceMat);
entranceArch.position.z = tunnelStartZ;
entranceArch.rotation.z = Math.PI;
tunnelGroup.add(entranceArch);

// Warning lights on the entrance arch
const warnLightGeo = new THREE.CircleGeometry(0.8, 32);
const warnLightMat = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffaa00, emissiveIntensity: 2.5 });

const leftWarn = new THREE.Mesh(warnLightGeo, warnLightMat);
leftWarn.position.set(-14, 2, tunnelStartZ + 0.1);
tunnelGroup.add(leftWarn);

const rightWarn = new THREE.Mesh(warnLightGeo, warnLightMat);
rightWarn.position.set(14, 2, tunnelStartZ + 0.1);
tunnelGroup.add(rightWarn);

// Main tunnel tube (BackSide)
const tubeGeometry = new THREE.CylinderGeometry(tunnelRadius, tunnelRadius, tunnelLength, 32, 1, true);
const tubeMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xc8c8c8, 
    roughness: 0.85,
    metalness: 0.15,
    side: THREE.BackSide 
});
const tunnelTube = new THREE.Mesh(tubeGeometry, tubeMaterial);
tunnelTube.rotation.x = Math.PI / 2;
tunnelTube.position.z = tunnelStartZ - (tunnelLength / 2);
tunnelTube.position.y = 0;
tunnelGroup.add(tunnelTube);

// Tunnel Ceiling Lights (Fluorescent strips)
const stripGeo = new THREE.PlaneGeometry(3, 0.8);
const stripMat = new THREE.MeshStandardMaterial({ 
    color: 0xdddddd, 
    emissive: 0xffffff, 
    emissiveIntensity: 2.0 
});
for (let i = 0; i < 40; i++) {
    const strip = new THREE.Mesh(stripGeo, stripMat);
    strip.position.y = tunnelRadius - 0.5;
    strip.position.z = tunnelStartZ - (i * 25);
    strip.rotation.x = Math.PI / 2;
    tunnelGroup.add(strip);
}

// Distance Signposts
function createDistanceMarker(text, zPos) {
    const markerGroup = new THREE.Group();
    
    // Sign post
    const postGeo = new THREE.CylinderGeometry(0.1, 0.1, 5);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x3d3d3d, metalness: 0.5 });
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.y = 2.5;
    markerGroup.add(post);

    // Sign board (Canvas Texture)
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Background (Highway Blue)
    ctx.fillStyle = '#0a3d62';
    ctx.fillRect(0, 0, 512, 256);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 12;
    ctx.strokeRect(20, 20, 472, 216);
    
    // Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 110px Noto Sans KR, Arial';
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
    markerGroup.rotation.y = -Math.PI / 6;
    scene.add(markerGroup);
}

createDistanceMarker("300m", tunnelStartZ + 300);
createDistanceMarker("200m", tunnelStartZ + 200);
createDistanceMarker("100m", tunnelStartZ + 100);
createDistanceMarker("50m", tunnelStartZ + 50);

scene.add(tunnelGroup);

// 3. Create Vehicle (Realistic 3D Model Group)
const carGroup = new THREE.Group();
carGroup.position.y = 0.5;
scene.add(carGroup);
carGroup.add(carShell);
carGroup.add(carFrame);

// Temporary placeholder box
const bodyGeo = new THREE.BoxGeometry(2, 1, 4);
const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0c0c0e });
const placeholder = new THREE.Mesh(bodyGeo, bodyMat);
placeholder.position.y = 0.5;
carShell.add(placeholder);

// Load GLTF Car Model (Ferrari)
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/gltf/');

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);
loader.load('ferrari.glb', function(gltf) {
    const model = gltf.scene;
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
        const worldPos = new THREE.Vector3();
        child.getWorldPosition(worldPos);

        if (name.includes('wheel') || name.includes('tire') || name.includes('rim')) {
            child.initialX = child.position.x;
            carFrame.attach(child); 
            wheels.push(child);
        } else if (worldPos.y > 0.6) {
            carShell.attach(child); 
        } else {
            carFrame.attach(child);
        }
    });
    
    scene.remove(model);
    
    if (carShell.children.length > 0) {
        carShell.remove(placeholder); 
    }
    
    createMCU();
    runIntro();
}, undefined, (error) => {
    console.error('Error loading car model:', error);
    gsap.set(".slide#slide-0 .content", { opacity: 1, y: 0 });
    initSlideAnimations();
    init3DAnimations();
});

// --- Create Procedural ESP32 MCU ---
function createMCU() {
    mcuGroup = new THREE.Group();
    mcuGroup.scale.set(0, 0, 0); 
    carGroup.add(mcuGroup);

    // Anchors for holographic floating text label projection (positioned relative to circuit.png diagram layout)
    anchorPCB = new THREE.Object3D();
    anchorPCB.position.set(0, 0.4, 0.02); // Upper-center Buck Converter / PCB
    mcuGroup.add(anchorPCB);

    anchorESP32 = new THREE.Object3D();
    anchorESP32.position.set(0.1, -0.1, 0.02); // Center ESP32 module
    mcuGroup.add(anchorESP32);

    anchorSensor = new THREE.Object3D();
    anchorSensor.position.set(0.5, -0.9, 0.02); // Bottom-right Lux sensor (조도센서)
    mcuGroup.add(anchorSensor);

    anchorRelay = new THREE.Object3D();
    anchorRelay.position.set(-0.6, 0.2, 0.02); // Left breadboard MOSFET control / driver circuitry
    mcuGroup.add(anchorRelay);

    // Create Plane with the user's circuit schematic texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('circuit.png', (texture) => {
        texture.minFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;

        const planeGeo = new THREE.PlaneGeometry(3.2, 2.769);
        const planeMat = new THREE.MeshBasicMaterial({ 
            map: texture, 
            transparent: true, 
            side: THREE.DoubleSide,
            fog: false, // Prevents fog from graying out or brightening the diagram
            color: 0x8c8c8c // Controls maximum brightness to prevent UnrealBloomPass glow washout
        });
        const plane = new THREE.Mesh(planeGeo, planeMat);
        plane.position.set(0, 0, 0);
        mcuGroup.add(plane);
    });

    mcuGroup.position.y = 0.9; // Centered to match camera lookAt target for a flat, parallel view
}

// --- Dynamic Headlights and Taillights ---

// 1. Taillights (Ferrari Rear Circles)
const taillightGeo = new THREE.CircleGeometry(0.12, 32);
const taillightMat = new THREE.MeshStandardMaterial({ 
    color: 0x220000, 
    emissive: 0x000000, // Start completely black (OFF)
    emissiveIntensity: 0.0
});

const leftOuter = new THREE.Mesh(taillightGeo, taillightMat);
leftOuter.position.set(-0.78, 0.85, 2.31); 
carGroup.add(leftOuter);

const leftInner = new THREE.Mesh(taillightGeo, taillightMat);
leftInner.position.set(-0.52, 0.85, 2.31); 
carGroup.add(leftInner);

const rightInner = new THREE.Mesh(taillightGeo, taillightMat);
rightInner.position.set(0.52, 0.85, 2.31); 
carGroup.add(rightInner);

const rightOuter = new THREE.Mesh(taillightGeo, taillightMat);
rightOuter.position.set(0.78, 0.85, 2.31); 
carGroup.add(rightOuter);

// Red glow point lights on the road behind
const tailPointLightLeft = new THREE.PointLight(0xff0000, 0, 20);
tailPointLightLeft.position.set(-0.65, 0.85, 2.5);
carGroup.add(tailPointLightLeft);

const tailPointLightRight = new THREE.PointLight(0xff0000, 0, 20);
tailPointLightRight.position.set(0.65, 0.85, 2.5);
carGroup.add(tailPointLightRight);

// 2. Headlights (Ferrari Front Circles)
const headlightGeo = new THREE.CircleGeometry(0.12, 32);
const headlightMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    emissive: 0x000000, // Start completely black (OFF)
    emissiveIntensity: 0.0
});

const leftHeadlight = new THREE.Mesh(headlightGeo, headlightMat);
leftHeadlight.position.set(-0.75, 0.6, -2.1);
leftHeadlight.rotation.y = Math.PI; // Face forward
carGroup.add(leftHeadlight);

const rightHeadlight = new THREE.Mesh(headlightGeo, headlightMat);
rightHeadlight.position.set(0.75, 0.6, -2.1);
rightHeadlight.rotation.y = Math.PI;
carGroup.add(rightHeadlight);

// Spotlights projecting headlight beam onto the road
const spotlightLeft = new THREE.SpotLight(0xffffff, 0, 100, Math.PI / 4, 0.5, 1);
spotlightLeft.position.set(-0.75, 0.6, -2.2);
const spotlightTargetLeft = new THREE.Object3D();
spotlightTargetLeft.position.set(-0.75, 0.2, -40);
carGroup.add(spotlightTargetLeft);
spotlightLeft.target = spotlightTargetLeft;
carGroup.add(spotlightLeft);

const spotlightRight = new THREE.SpotLight(0xffffff, 0, 100, Math.PI / 4, 0.5, 1);
spotlightRight.position.set(0.75, 0.6, -2.2);
const spotlightTargetRight = new THREE.Object3D();
spotlightTargetRight.position.set(0.75, 0.2, -40);
carGroup.add(spotlightTargetRight);
spotlightRight.target = spotlightTargetRight;
carGroup.add(spotlightRight);


// 4. Default Environment Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(10, 50, 10);
scene.add(dirLight);


// 5. Animation Loop & Telemetry HUD Calculation
const clock = new THREE.Clock();

// Helper to project 3D local coordinates to HTML DOM
function updateTagPosition(elementId, anchorObject) {
    const element = document.getElementById(elementId);
    if (!element || !anchorObject) return;

    const tempV = new THREE.Vector3();
    anchorObject.getWorldPosition(tempV);

    // Project 3D vector to normalized device coordinates (-1 to +1)
    tempV.project(camera);

    // Behind camera check
    if (tempV.z > 1) {
        element.classList.remove('visible');
        return;
    }

    // Convert coordinates to screen space px
    const x = (tempV.x * 0.5 + 0.5) * window.innerWidth;
    const y = (tempV.y * -0.5 + 0.5) * window.innerHeight;

    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    element.classList.add('visible');
}

function animate() {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();
    const currentZ = carGroup.position.z;
    
    // Subtle road vibration camera shake removed for presentation stability

    // Idle vehicle suspension sway
    carGroup.position.y = Math.sin(elapsedTime * 12) * 0.008; 

    // Smoothly update camera direction
    const lookTarget = new THREE.Vector3(
        carGroup.position.x,
        carGroup.position.y + 0.9,
        carGroup.position.z - 8
    );
    camera.lookAt(lookTarget);

    // --- Dynamic Telemetry Calculations ---
    
    // 1. Velocity (Speed Profile mapping based on Z position)
    let targetSpeed = 0;
    if (currentZ > -100) {
        // Intro phase
        targetSpeed = gsap.utils.mapRange(0, -100, 0, 80, currentZ);
    } else if (currentZ <= -100 && currentZ > -400) {
        // MCU Reveal: Speed surge then drop
        let progress = gsap.utils.mapRange(-100, -400, 0, 1, currentZ);
        if (progress < 0.5) {
            targetSpeed = gsap.utils.mapRange(0, 0.5, 80, 120, progress);
        } else {
            targetSpeed = gsap.utils.mapRange(0.5, 1, 120, 80, progress);
        }
    } else if (currentZ <= -400 && currentZ > -700) {
        // Approaching tunnel: slowdown to safe speed
        targetSpeed = gsap.utils.mapRange(-400, -700, 80, 60, currentZ);
    } else {
        // Tunnel cruising
        targetSpeed = 70;
    }
    SIM_STATE.speed = Math.round(targetSpeed);

    // 2. Distance to Tunnel (Entrance is at Z = -700)
    // Fix: currentZ starts at -100 and goes negative to -1200. Tunnel is at -700.
    // So distance before tunnel is: currentZ - (-700) = currentZ + 700.
    SIM_STATE.distance = Math.max(0, Math.round(currentZ - tunnelStartZ));

    // 3. Ambient Light (Sensor Adaptation Lux)
    if (!SIM_STATE.isSliderOverridden) {
        let baseLux = 1500;
        if (SIM_STATE.timeOfDay === 'sunset') baseLux = 350;
        else if (SIM_STATE.timeOfDay === 'night') baseLux = 15;

        let tunnelLux = 60;
        if (SIM_STATE.timeOfDay === 'sunset') tunnelLux = 20;
        else if (SIM_STATE.timeOfDay === 'night') tunnelLux = 1;

        let currentLux = baseLux;
        if (currentZ < tunnelStartZ) {
            currentLux = tunnelLux;
        } else if (SIM_STATE.distance < 150) {
            // Drop linearly from 150m to tunnel mouth
            let progress = SIM_STATE.distance / 150; // 1 to 0
            currentLux = gsap.utils.mapRange(0, 1, tunnelLux, baseLux, progress);
        }
        SIM_STATE.lux = Math.round(currentLux);
    }

    // 4. Sidelight Activation Logical Matrix
    // Distance-based auto trigger starts at 300m, becoming fully active by 50m.
    if (SIM_STATE.autoLight) {
        SIM_STATE.lightActive = (SIM_STATE.lux < 500) || (SIM_STATE.distance <= 300);
    } else {
        SIM_STATE.lightActive = SIM_STATE.manualLightOn;
    }

    // Determine target intensity factor (0.0 to 1.0)
    let lightsIntensity = 0.0;
    if (SIM_STATE.lightActive) {
        if (SIM_STATE.autoLight && SIM_STATE.distance > 50 && SIM_STATE.distance <= 300) {
            // Gradual fade in based on distance: 0% at 300m -> 100% at 50m
            let progress = (300 - SIM_STATE.distance) / 250; // 0 to 1 over 250m span
            lightsIntensity = progress;
        } else {
            // Fully on inside 50m, or manual override, or dark lux
            lightsIntensity = 1.0;
        }
    }
    SIM_STATE.lightsIntensity = lightsIntensity; // Cache for HUD display

    // Taillights emissive color and intensity transition
    // Interpolate emissive color from black (0x000000) to red (0xff0000)
    const targetTaillightColor = new THREE.Color(SIM_STATE.lightActive ? 0xff0000 : 0x000000);
    taillightMat.emissive.lerp(targetTaillightColor, 0.15);
    taillightMat.emissiveIntensity = THREE.MathUtils.lerp(taillightMat.emissiveIntensity, lightsIntensity * 10, 0.15);
    
    tailPointLightLeft.intensity = THREE.MathUtils.lerp(tailPointLightLeft.intensity, lightsIntensity * 40, 0.1);
    tailPointLightRight.intensity = THREE.MathUtils.lerp(tailPointLightRight.intensity, lightsIntensity * 40, 0.1);
    
    // Headlights emissive color and intensity transition
    // Interpolate emissive color from black (0x000000) to warm white (0xfff0dd)
    const targetHeadlightColor = new THREE.Color(SIM_STATE.lightActive ? 0xfff0dd : 0x000000);
    headlightMat.emissive.lerp(targetHeadlightColor, 0.15);
    headlightMat.emissiveIntensity = THREE.MathUtils.lerp(headlightMat.emissiveIntensity, lightsIntensity * 5, 0.15);
    
    spotlightLeft.intensity = THREE.MathUtils.lerp(spotlightLeft.intensity, lightsIntensity * 25, 0.1);
    spotlightRight.intensity = THREE.MathUtils.lerp(spotlightRight.intensity, lightsIntensity * 25, 0.1);

    // Dynamic Weather/TOD Scene Lighting
    let targetAmbient = 0.35;
    let targetDir = 0.8;
    let targetFogColor = new THREE.Color(0x0a0e17);
    let targetFogDensity = 0.0015;

    // Base Weather lighting profiles
    if (SIM_STATE.timeOfDay === 'day') {
        targetAmbient = 0.35;
        targetDir = 0.8;
        targetFogColor.setHex(0x0a0e17);
    } else if (SIM_STATE.timeOfDay === 'sunset') {
        targetAmbient = 0.15;
        targetDir = 0.3;
        targetFogColor.setHex(0x140e1b);
    } else if (SIM_STATE.timeOfDay === 'night') {
        targetAmbient = 0.03;
        targetDir = 0.02;
        targetFogColor.setHex(0x04060a);
    }

    // Tunnel darkness logic (Z < -700 is inside, but transition starts from -550)
    if (currentZ < tunnelStartZ) {
        targetAmbient = 0.03;
        targetDir = 0.005;
        targetFogColor.setHex(0x040406);
        targetFogDensity = 0.006; // Dense fog inside tunnel to cut visibility
    } else if (currentZ < (tunnelStartZ + 150)) {
        // Smooth interpolation entering tunnel
        let progress = (tunnelStartZ + 150 - currentZ) / 150; // 0 to 1
        targetAmbient = gsap.utils.interpolate(targetAmbient, 0.03, progress);
        targetDir = gsap.utils.interpolate(targetDir, 0.005, progress);
        
        let insideColor = new THREE.Color(0x040406);
        targetFogColor.lerp(insideColor, progress);
        targetFogDensity = gsap.utils.interpolate(0.0015, 0.006, progress);
    }

    // Apply values smoothly
    ambientLight.intensity = THREE.MathUtils.lerp(ambientLight.intensity, targetAmbient, 0.1);
    dirLight.intensity = THREE.MathUtils.lerp(dirLight.intensity, targetDir, 0.1);
    scene.fog.color.lerp(targetFogColor, 0.05);
    scene.fog.density = THREE.MathUtils.lerp(scene.fog.density, targetFogDensity, 0.1);

    // Background image rendering disabled for a clean sky color matching the fog

    // Render HTML Telemetry HUD Displays
    updateHUDDisplays();

    // Render 3D Floating Labels for MCU PCB Components
    if (mcuGroup && mcuGroup.scale.x > 0.2) {
        document.getElementById('mcu-labels-container').style.opacity = 1;
        updateTagPosition('mcu-tag-pcb', anchorPCB);
        updateTagPosition('mcu-tag-esp32', anchorESP32);
        updateTagPosition('mcu-tag-sensor', anchorSensor);
        updateTagPosition('mcu-tag-relay', anchorRelay);
    } else {
        document.getElementById('mcu-labels-container').style.opacity = 0;
    }

    composer.render();
}
animate();

// --- Update HTML HUD UI Elements ---
function updateHUDDisplays() {
    // 1. Speedometer Ring & Value
    const speedValEl = document.getElementById('speed-value');
    if (speedValEl) speedValEl.innerText = SIM_STATE.speed;

    const speedRing = document.getElementById('speed-ring');
    if (speedRing) {
        // Ring dash offset calculation (0 to 140 speed mapping to 283-0 offset)
        const circumference = 283;
        const maxSpeed = 140;
        const mappedOffset = circumference - (Math.min(SIM_STATE.speed, maxSpeed) / maxSpeed) * circumference;
        speedRing.style.strokeDashoffset = mappedOffset;
    }

    // 2. Distance value
    const distanceValEl = document.getElementById('distance-value');
    if (distanceValEl) {
        if (SIM_STATE.distance === 0) {
            distanceValEl.innerHTML = '<span style="font-size: 1.1rem; color: #ffaa00;">IN TUNNEL</span>';
        } else {
            distanceValEl.innerHTML = `${SIM_STATE.distance}<span class="unit">m</span>`;
        }
    }

    // 3. Lux value and Progress bar
    const luxValEl = document.getElementById('lux-value');
    if (luxValEl) luxValEl.innerText = `${SIM_STATE.lux} Lux`;

    const luxBar = document.getElementById('lux-bar');
    if (luxBar) {
        const percent = (SIM_STATE.lux / 2000) * 100;
        luxBar.style.width = `${Math.min(percent, 100)}%`;
        
        // Color transition for lux bar (dark yellow to bright orange)
        if (SIM_STATE.lux < 500) {
            luxBar.style.background = 'linear-gradient(90deg, #ff3333, #ff5e3a)';
            luxBar.style.boxShadow = '0 0 8px #ff3333';
        } else {
            luxBar.style.background = 'linear-gradient(90deg, #ffaa00, #ffcc00)';
            luxBar.style.boxShadow = '0 0 8px #ffaa00';
        }
    }

    // 4. Output Status Indicators
    const statusBox = document.getElementById('light-status-box');
    const statusLabel = document.getElementById('light-status-text');
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');

    if (SIM_STATE.lightActive) {
        if (statusBox) statusBox.classList.add('active');
        
        if (SIM_STATE.autoLight && SIM_STATE.distance > 50 && SIM_STATE.distance <= 300) {
            const pct = Math.round(SIM_STATE.lightsIntensity * 100);
            if (statusLabel) statusLabel.innerText = `AUTO DIMMING (${pct}%)`;
            if (statusText) statusText.innerText = `PRE-ACTIVATING: ${pct}% ON`;
            if (statusDot) statusDot.className = 'status-dot orange';
        } else {
            if (statusLabel) statusLabel.innerText = 'REAR LIGHTS AUTO ON';
            if (statusText) statusText.innerText = 'SYSTEM ACTIVE: LIGHTS ON';
            if (statusDot) statusDot.className = 'status-dot green';
        }
    } else {
        if (statusBox) statusBox.classList.remove('active');
        if (statusLabel) statusLabel.innerText = 'REAR LIGHTS OFF';
        
        if (statusDot) {
            statusDot.className = 'status-dot orange';
        }
        if (statusText) statusText.innerText = 'SYSTEM ON STANDBY';
    }
}

// --- Setup GSAP Intro Animation ---
function runIntro() {
    if (window.scrollY > 10) {
        // If already scrolled down, skip intro animation
        carGroup.position.z = -100;
        camera.position.set(4, 1.2, -94);
        gsap.set(".slide#slide-0 .content", { opacity: 1, y: 0 });
        initSlideAnimations();
        init3DAnimations();
        return;
    }

    // Disable scrolling during intro to make it look clean
    const originalOverflow = document.body.style.overflowY;
    document.body.style.overflowY = 'hidden';

    const introTl = gsap.timeline({
        onComplete: () => {
            document.body.style.overflowY = originalOverflow || '';
            initSlideAnimations();
            init3DAnimations();
        }
    });
    
    // Camera starts tight behind the car
    camera.position.set(0, 1.2, 10);
    
    introTl.to(carGroup.position, {
        z: -100,
        duration: 1.8,
        ease: "power3.inOut"
    }, 0)
    .to(camera.position, { 
        x: 4, y: 1.2, z: -94, 
        duration: 1.8, 
        ease: "power3.inOut" 
    }, 0)
    .to(".slide#slide-0 .content", {
        opacity: 1,
        y: 0,
        duration: 1.5,
        ease: "power2.out"
    }, 1.8);
}

// 6. Handle Window Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// 7. GSAP Presentation & Core Scroller Animations
gsap.registerPlugin(ScrollTrigger);

function initSlideAnimations() {
    const slideSections = document.querySelectorAll('.slide');
    slideSections.forEach((section) => {
        if (section.id === "slide-0") return; // Skip title slide (handled by intro)

        const content = section.querySelector('.content');
        if (!content) return;

        // Select all display elements inside card to animate sequentially
        const children = content.querySelectorAll(
            'h2, h3, p, .index-list li, .team-member-card, .problem-box, .solution-box, ' +
            '.comparison-table th, .comparison-table tr, .stat-box-card, .patent-item-card, ' +
            '.qa-item, .media-box, .flow-box-v, .flow-block, .flow-arrow-h, .map-point, .map-line, ' +
            '.map-line-active, .map-line-full, .blueprint-grid-icon'
        );

        // Hide individual children and prepare slide offset
        gsap.set(children, { opacity: 0, y: 30 });
        gsap.set(content, { opacity: 1, y: 0 }); // Show card container immediately

        ScrollTrigger.create({
            trigger: section,
            start: "top 75%",
            end: "bottom 25%",
            toggleActions: "play reverse play reverse",
            onEnter: () => {
                gsap.to(children, {
                    opacity: 1,
                    y: 0,
                    duration: 1.2,
                    stagger: 0.2,
                    ease: "power3.out",
                    overwrite: "auto"
                });
            },
            onLeaveBack: () => {
                gsap.to(children, {
                    opacity: 0,
                    y: 30,
                    duration: 0.6,
                    stagger: 0.06,
                    ease: "power3.in",
                    overwrite: "auto"
                });
            },
            onEnterBack: () => {
                gsap.to(children, {
                    opacity: 1,
                    y: 0,
                    duration: 1.0,
                    stagger: 0.15,
                    ease: "power3.out",
                    overwrite: "auto"
                });
            },
            onLeave: () => {
                gsap.to(children, {
                    opacity: 0,
                    y: -30,
                    duration: 0.6,
                    stagger: 0.06,
                    ease: "power3.in",
                    overwrite: "auto"
                });
            }
        });
    });

    // Performance metrics count-up animation on scroll (Slide 9)
    ScrollTrigger.create({
        trigger: "#slide-9",
        start: "top 60%",
        onEnter: () => {
            const gpsObj = { value: 0 };
            gsap.to(gpsObj, {
                value: 92,
                duration: 1.6,
                ease: "power2.out",
                onUpdate: () => {
                    const el = document.getElementById("stat-gps-val");
                    if (el) el.innerText = `${Math.round(gpsObj.value)}%`;
                }
            });

            const testObj = { value: 0 };
            gsap.to(testObj, {
                value: 100,
                duration: 1.8,
                ease: "power2.out",
                onUpdate: () => {
                    const el = document.getElementById("stat-test-val");
                    if (el) el.innerText = `${Math.round(testObj.value)}%`;
                }
            });
        },
        onLeaveBack: () => {
            // Reset when scrolling back up
            const gpsEl = document.getElementById("stat-gps-val");
            if (gpsEl) gpsEl.innerText = "0%";
            const testEl = document.getElementById("stat-test-val");
            if (testEl) testEl.innerText = "0%";
        }
    });

    // Patent & Competition progress count-up animation on scroll (Slide 15)
    ScrollTrigger.create({
        trigger: "#slide-15",
        start: "top 60%",
        onEnter: () => {
            // Animate progress bar widths
            gsap.to("#patent-pct-fill", { width: "75%", duration: 1.5, ease: "power2.out" });
            gsap.to("#contest-pct-fill", { width: "60%", duration: 1.5, ease: "power2.out" });

            // Animate percentage numbers
            const patentObj = { value: 0 };
            gsap.to(patentObj, {
                value: 75,
                duration: 1.5,
                ease: "power2.out",
                onUpdate: () => {
                    const el = document.getElementById("patent-pct-val");
                    if (el) el.innerText = `${Math.round(patentObj.value)}% 진행`;
                }
            });

            const contestObj = { value: 0 };
            gsap.to(contestObj, {
                value: 60,
                duration: 1.5,
                ease: "power2.out",
                onUpdate: () => {
                    const el = document.getElementById("contest-pct-val");
                    if (el) el.innerText = `${Math.round(contestObj.value)}% 진행`;
                }
            });
        },
        onLeaveBack: () => {
            // Reset when scrolling back up
            gsap.set("#patent-pct-fill", { width: "0%" });
            gsap.set("#contest-pct-fill", { width: "0%" });
            const pVal = document.getElementById("patent-pct-val");
            if (pVal) pVal.innerText = "0% 진행";
            const cVal = document.getElementById("contest-pct-val");
            if (cVal) cVal.innerText = "0% 진행";
        }
    });
}

function init3DAnimations() {
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: ".presentation",
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
            onUpdate: (self) => {
                // Update Top Progress Bar
                const progBar = document.getElementById('presentation-progress');
                if (progBar) {
                    progBar.style.width = `${self.progress * 100}%`;
                }
            }
        }
    });

    // --- Timeline Setup (Partitioned for 17 Slides: total duration 1.0) ---

    // 1. Slide 0 to Slide 4 (0.0 to 0.25): Car remains assembled at Z = -100
    tl.to(carGroup.position, { z: -100, duration: 0.25 }, 0);

    // 2. Slide 4 -> Slide 5 (0.25 to 0.3125): Car disassembles & MCU zoomed-in
    tl.to(camera.position, {
        x: 1.5, 
        z: -93.5, 
        y: 0.9, 
        duration: 0.0625,
        ease: "power2.inOut" 
    }, 0.25);

    tl.to(camera, {
        fov: 85,
        duration: 0.0625,
        onUpdate: () => camera.updateProjectionMatrix()
    }, 0.25);

    // A. Lift Shell
    tl.to(carShell.position, { y: 6.0, duration: 0.0625, ease: "back.out(1.8)" }, 0.25);
    tl.to(carShell.rotation, { z: 0.15, x: 0.05, duration: 0.0625 }, 0.25);

    // B. Lower Frame
    tl.to(carFrame.position, { y: -1.2, duration: 0.0625, ease: "power2.out" }, 0.25);
    
    // C. Wheels outwards
    if (wheels.length > 0) {
        wheels.forEach((wheel, i) => {
            const directionX = wheel.position.x > 0 ? 1 : -1;
            const directionZ = i < 2 ? -1 : 1; 
            tl.to(wheel.position, { 
                x: wheel.position.x + (5.5 * directionX), 
                y: 1.5,
                z: wheel.position.z + (3.0 * directionZ),
                duration: 0.0625, 
                ease: "power2.out" 
            }, 0.25);
            tl.to(wheel.rotation, { x: Math.PI, z: Math.PI, duration: 0.0625 }, 0.25);
        });
    }

    // D. Scale up MCU
    if (mcuGroup) {
        tl.to(mcuGroup.scale, { x: 2.0, y: 2.0, z: 2.0, duration: 0.05, ease: "power2.out" }, 0.2525);
        tl.to(mcuGroup.rotation, { x: 0, y: 0.358, z: 0, duration: 0.01 }, 0.2525);
    }

    // Keep camera stable, parallel on slide 5
    tl.to(camera.position, {
        x: 1.5,
        y: 0.9,
        z: -93.5,
        duration: 0.0625
    }, 0.3125);

    // 3. Slide 5 -> Slide 6 (0.3125 to 0.375): Reassemble car & return camera
    if (mcuGroup) {
        tl.to(mcuGroup.scale, { x: 0, y: 0, z: 0, duration: 0.05, ease: "power2.in" }, 0.3125);
    }
    
    if (wheels.length > 0) {
        wheels.forEach((wheel) => {
            tl.to(wheel.position, { x: wheel.initialX || 0, y: 0, z: 0, duration: 0.045, ease: "power2.in" }, 0.33);
            tl.to(wheel.rotation, { x: 0, z: 0, duration: 0.045 }, 0.33);
        });
    }

    tl.to(carShell.position, { y: 0, duration: 0.045, ease: "bounce.out" }, 0.33);
    tl.to(carShell.rotation, { z: 0, x: 0, duration: 0.045 }, 0.33);
    tl.to(carFrame.position, { y: 0, duration: 0.045, ease: "power2.in" }, 0.33);
    
    tl.to(camera, {
        fov: 75,
        duration: 0.0625,
        onUpdate: () => camera.updateProjectionMatrix()
    }, 0.3125);

    tl.to(camera.position, {
        x: 4,
        y: 1.2,
        z: -94,
        duration: 0.0625,
        ease: "power2.inOut"
    }, 0.3125);

    // 4. Slide 6 to Slide 16 (0.375 to 1.0): Car remains assembled and static at Z = -100
    // Disabled climax driving animation to focus purely on content.
    tl.to(carGroup.position, { z: -100, duration: 0.625 }, 0.375);

    ScrollTrigger.refresh();
}

// -------------------------------------------------------------
// INTERACTIVE CONTROL PANEL BINDINGS
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // 1. Auto-Drive Scroll controller
    let isAutoDriving = false;
    let autoDriveTween = null;
    const btnAutoDrive = document.getElementById('btn-autodrive');

    if (btnAutoDrive) {
        btnAutoDrive.addEventListener('click', () => {
            if (isAutoDriving) {
                if (autoDriveTween) autoDriveTween.kill();
                isAutoDriving = false;
                btnAutoDrive.innerText = 'START AUTO-DRIVE';
                btnAutoDrive.classList.remove('active-run');
            } else {
                isAutoDriving = true;
                btnAutoDrive.innerText = 'STOP AUTO-DRIVE';
                btnAutoDrive.classList.add('active-run');
                
                const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
                
                // If already at the bottom, reset to start first
                if (maxScroll - window.scrollY < 15) {
                    window.scrollTo(0, 0);
                }

                const scrollObj = { y: window.scrollY };
                autoDriveTween = gsap.to(scrollObj, {
                    y: maxScroll,
                    duration: 25 * (1 - (window.scrollY / maxScroll)),
                    ease: "none",
                    onUpdate: () => {
                        // Kill auto-drive if user scrolls manually
                        if (Math.abs(scrollObj.y - window.scrollY) > 10) {
                            autoDriveTween.kill();
                            isAutoDriving = false;
                            btnAutoDrive.innerText = 'START AUTO-DRIVE';
                            btnAutoDrive.classList.remove('active-run');
                            return;
                        }
                        window.scrollTo(0, scrollObj.y);
                    },
                    onComplete: () => {
                        isAutoDriving = false;
                        btnAutoDrive.innerText = 'START AUTO-DRIVE';
                        btnAutoDrive.classList.remove('active-run');
                    }
                });
            }
        });
    }

    // Cancel auto-drive on manual mousewheel interaction
    window.addEventListener('wheel', () => {
        if (isAutoDriving && autoDriveTween) {
            autoDriveTween.kill();
            isAutoDriving = false;
            if (btnAutoDrive) {
                btnAutoDrive.innerText = 'START AUTO-DRIVE';
                btnAutoDrive.classList.remove('active-run');
            }
        }
    }, { passive: true });

    // 2. Auto / Manual Switch
    const btnModeAuto = document.getElementById('btn-mode-auto');
    const btnModeManual = document.getElementById('btn-mode-manual');
    const manualLightRow = document.getElementById('manual-light-row');
    const btnLightSwitch = document.getElementById('btn-light-switch');

    if (btnModeAuto && btnModeManual) {
        btnModeAuto.addEventListener('click', () => {
            SIM_STATE.autoLight = true;
            btnModeAuto.classList.add('active');
            btnModeManual.classList.remove('active');
            if (manualLightRow) {
                manualLightRow.style.opacity = '0.4';
                manualLightRow.style.pointerEvents = 'none';
            }
        });

        btnModeManual.addEventListener('click', () => {
            SIM_STATE.autoLight = false;
            btnModeAuto.classList.remove('active');
            btnModeManual.classList.add('active');
            if (manualLightRow) {
                manualLightRow.style.opacity = '1.0';
                manualLightRow.style.pointerEvents = 'auto';
            }
        });
    }

    // 3. Manual Light Switch
    if (btnLightSwitch) {
        btnLightSwitch.addEventListener('click', () => {
            if (SIM_STATE.autoLight) return; // Ignore if in auto mode

            SIM_STATE.manualLightOn = !SIM_STATE.manualLightOn;
            if (SIM_STATE.manualLightOn) {
                btnLightSwitch.innerText = 'TURN OFF LIGHTS';
                btnLightSwitch.classList.add('active-run');
            } else {
                btnLightSwitch.innerText = 'TURN ON LIGHTS';
                btnLightSwitch.classList.remove('active-run');
            }
        });
    }

    // 4. Ambient Lux Override Slider
    const sliderLux = document.getElementById('slider-lux');
    const sliderLuxVal = document.getElementById('slider-lux-val');

    if (sliderLux && sliderLuxVal) {
        sliderLux.addEventListener('input', (e) => {
            SIM_STATE.isSliderOverridden = true;
            SIM_STATE.lux = parseInt(e.target.value);
            sliderLuxVal.innerText = `${SIM_STATE.lux} Lux`;
        });
    }

    // 5. Time of Day weather buttons
    const btnTodDay = document.getElementById('btn-tod-day');
    const btnTodSunset = document.getElementById('btn-tod-sunset');
    const btnTodNight = document.getElementById('btn-tod-night');

    const updateTODUI = (selectedBtn) => {
        [btnTodDay, btnTodSunset, btnTodNight].forEach(btn => {
            if (btn) btn.classList.remove('active');
        });
        if (selectedBtn) selectedBtn.classList.add('active');
        
        // Reset slider override to match new TOD weather
        SIM_STATE.isSliderOverridden = false;
        let baseLux = 1500;
        if (SIM_STATE.timeOfDay === 'sunset') baseLux = 350;
        else if (SIM_STATE.timeOfDay === 'night') baseLux = 15;
        
        if (sliderLux && sliderLuxVal) {
            sliderLux.value = baseLux;
            sliderLuxVal.innerText = `${baseLux} Lux`;
        }
    };

    if (btnTodDay) {
        btnTodDay.addEventListener('click', () => {
            SIM_STATE.timeOfDay = 'day';
            updateTODUI(btnTodDay);
        });
    }
    if (btnTodSunset) {
        btnTodSunset.addEventListener('click', () => {
            SIM_STATE.timeOfDay = 'sunset';
            updateTODUI(btnTodSunset);
        });
    }
    if (btnTodNight) {
        btnTodNight.addEventListener('click', () => {
            SIM_STATE.timeOfDay = 'night';
            updateTODUI(btnTodNight);
        });
    }

    // 6. Auto play/pause demo video on scroll
    const demoVideo = document.querySelector('#slide-11 video');
    if (demoVideo) {
        ScrollTrigger.create({
            trigger: "#slide-11",
            start: "top center",
            end: "bottom center",
            onEnter: () => {
                demoVideo.play().catch(err => console.log("Video auto-play blocked:", err));
            },
            onEnterBack: () => {
                demoVideo.play().catch(err => console.log("Video auto-play blocked:", err));
            },
            onLeave: () => {
                demoVideo.pause();
            },
            onLeaveBack: () => {
                demoVideo.pause();
            }
        });
    }

    // 7. Embedded Code Viewer Tab Switching Bindings
    const codeTabs = document.querySelectorAll('.code-tab');
    const codePanes = document.querySelectorAll('.code-pane');
    if (codeTabs.length > 0) {
        codeTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.getAttribute('data-tab');
                codeTabs.forEach(t => t.classList.remove('active'));
                codePanes.forEach(p => p.classList.remove('active'));
                
                tab.classList.add('active');
                const activePane = document.getElementById(`code-pane-${tabId}`);
                if (activePane) activePane.classList.add('active');

                // Switch screenshot gallery active state
                const galleryGroups = document.querySelectorAll('.gallery-group');
                galleryGroups.forEach(group => {
                    group.classList.remove('active');
                });
                const activeGroup = document.querySelector(`.group-${tabId}`);
                if (activeGroup) activeGroup.classList.add('active');
            });
        });
    }

    // 8. Slide 11 Demo View Tabs Switching Bindings
    const demoTabs = document.querySelectorAll('.demo-tab');
    const demoPanes = document.querySelectorAll('.demo-pane');
    if (demoTabs.length > 0) {
        demoTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const demoId = tab.getAttribute('data-demo');
                demoTabs.forEach(t => {
                    t.classList.remove('active');
                });
                demoPanes.forEach(p => {
                    p.classList.remove('active');
                });
                
                tab.classList.add('active');
                const activePane = document.getElementById(`demo-pane-${demoId}`);
                if (activePane) activePane.classList.add('active');
            });
        });
    }
});
