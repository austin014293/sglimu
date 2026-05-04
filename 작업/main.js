import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

// 1. Setup Scene, Camera, Renderer
const canvas = document.getElementById('webgl-canvas');
const scene = new THREE.Scene();
// Fog to simulate tunnel darkness and hide road end
scene.fog = new THREE.FogExp2(0x050505, 0.005); // reduced fog density so we can see the far tunnel

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// Initial camera position (Start from the side to see the side profile)
camera.position.set(12, 1.5, 3);

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// 2. Create Environment (Road and Tunnel)
// Road
const roadGeometry = new THREE.PlaneGeometry(20, 1000);
const roadMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x777777, // Much brighter road
    roughness: 0.8,
    metalness: 0.2
});
const road = new THREE.Mesh(roadGeometry, roadMaterial);
road.rotation.x = -Math.PI / 2;
road.position.z = -480; // Extend forward
scene.add(road);

// Grid/Lines on road for motion perception
const gridHelper = new THREE.GridHelper(20, 200, 0x999999, 0x666666); // Lighter grid lines
gridHelper.position.y = 0.01;
gridHelper.position.z = -480;
gridHelper.scale.set(1, 1, 25); // stretch along Z
scene.add(gridHelper);

// Solid Tunnel (Real Tunnel Look)
const tunnelGroup = new THREE.Group();
const tunnelLength = 800;
const tunnelRadius = 15;
const tunnelStartZ = -300; // Moved much further back

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
scene.add(tunnelGroup);

// 3. Create Vehicle (Realistic 3D Model)
const carGroup = new THREE.Group();
scene.add(carGroup);

// Placeholder box while loading
const bodyGeo = new THREE.BoxGeometry(2, 1, 4);
const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a });
let carBody = new THREE.Mesh(bodyGeo, bodyMat);
carBody.position.y = 0.5;
carGroup.add(carBody);

// Load Ferrari
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/gltf/');

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

loader.load('ferrari.glb', function(gltf) {
    const model = gltf.scene;
    model.rotation.y = 0; 
    
    // Scale and position adjustment to sit on the ground
    model.position.y = 0;
    
    // Replace placeholder
    carGroup.remove(carBody);
    carGroup.add(model);
});

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

// Position car right before starting the journey
carGroup.position.set(0, 0, 0);


// 4. Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3); // Dim ambient light
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);

// 5. Animation Loop
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    
    const elapsedTime = clock.getElapsedTime();
    
    // Slight floating/vibration animation for the car
    carGroup.position.y = Math.sin(elapsedTime * 15) * 0.01; 
    
    // Always make camera look slightly ahead of the car to frame it perfectly
    const lookTarget = new THREE.Vector3(
        carGroup.position.x,
        carGroup.position.y + 1,
        carGroup.position.z - 5
    );
    camera.lookAt(lookTarget);
    
    renderer.render(scene, camera);
}
animate();

// 6. Handle Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 7. GSAP Scroll Animations
gsap.registerPlugin(ScrollTrigger);

// Setup HTML elements animations
const slides = document.querySelectorAll('.slide .content');
slides.forEach((slide, i) => {
    if (i === 0) {
        gsap.to(slide, {
            opacity: 1,
            y: 0,
            duration: 1,
            scrollTrigger: {
                trigger: slide.parentElement,
                start: "top bottom",
                end: "bottom 60%", 
                toggleActions: "play reverse play reverse"
            }
        });
    } else {
        gsap.to(slide, {
            opacity: 1,
            y: 0,
            duration: 1,
            scrollTrigger: {
                trigger: slide.parentElement,
                start: "top 60%", 
                end: "top 20%",
                toggleActions: "play reverse play reverse"
            }
        });
    }
});

// Setup 3D Scene animations based on total scroll
const tl = gsap.timeline({
    scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: 1 // Smooth scrubbing
    }
});

// Overall Camera and Car Movement
// We want to drive towards the tunnel (z = -300)
// As user scrolls, car and camera move forward smoothly without overlapping tweens

// Slide 1 to 2: Drive forward on the open road (Scroll progress 0 to 0.4)
tl.to(carGroup.position, {
    z: -150, // Approach the tunnel
    duration: 0.4,
    ease: "none"
}, 0);
tl.to(camera.position, {
    x: 0, // Sweep behind the car
    z: -135, // Follow behind
    y: 3,
    duration: 0.4,
    ease: "power1.inOut" // Smooth curved movement
}, 0);

// Slide 2 to 3: The Danger -> Solution (Scroll progress 0.4 to 0.7)
// Tunnel is at -300.
tl.to(carGroup.position, {
    z: -290, // Right at tunnel entrance
    duration: 0.3,
    ease: "none"
}, 0.4);
tl.to(camera.position, {
    z: -280,
    duration: 0.3,
    ease: "none"
}, 0.4);

// Lights turn on brightly right before entering! (Scroll progress 0.65 to 0.7)
tl.to(taillightMat, {
    emissiveIntensity: 10, // Bright red glow
    duration: 0.05,
    ease: "power2.in"
}, 0.65); 

tl.to(tailPointLightLeft, {
    intensity: 50,
    distance: 30,
    duration: 0.05,
    ease: "power2.in"
}, 0.65);

tl.to(tailPointLightRight, {
    intensity: 50,
    distance: 30,
    duration: 0.05,
    ease: "power2.in"
}, 0.65);

// Slide 3 to 4: Into the tunnel (Scroll progress 0.7 to 1.0)
tl.to(carGroup.position, {
    z: -450, // Deep into tunnel
    duration: 0.3,
    ease: "none"
}, 0.7);
tl.to(camera.position, {
    z: -440, // Camera follows deep
    duration: 0.3,
    ease: "none"
}, 0.7);
