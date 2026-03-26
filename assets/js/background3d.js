document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.querySelector('#webgl-bg');
    if (!canvas) return;

    // --- THREE.JS SETUP ---
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 10;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true, // Transparent background
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // --- LIGHTING ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 5, 10);
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0x706FD3, 1.5); // Purple
    pointLight2.position.set(-10, -5, 5);
    scene.add(pointLight2);

    // --- SHAPE GENERATION ---
    function createMaskShape(expression = 'neutral') {
        const shape = new THREE.Shape();

        // Face Contour
        shape.moveTo(0, -1.2);
        shape.bezierCurveTo(1.5, -0.8, 1.5, 0.8, 0.8, 1.2);
        shape.bezierCurveTo(0.4, 1.4, -0.4, 1.4, -0.8, 1.2);
        shape.bezierCurveTo(-1.5, 0.8, -1.5, -0.8, 0, -1.2);

        // Eye Holes
        const leftEye = new THREE.Path();
        leftEye.absellipse(-0.5, 0.3, 0.25, 0.15, 0, Math.PI * 2, true);
        shape.holes.push(leftEye);

        const rightEye = new THREE.Path();
        rightEye.absellipse(0.5, 0.3, 0.25, 0.15, 0, Math.PI * 2, true);
        shape.holes.push(rightEye);

        // Mouth
        const mouth = new THREE.Path();
        if (expression === 'smile') {
            mouth.moveTo(-0.4, -0.5);
            mouth.quadraticCurveTo(0, -0.8, 0.4, -0.5);
            mouth.quadraticCurveTo(0, -0.6, -0.4, -0.5);
        } else if (expression === 'frown') {
            mouth.moveTo(-0.4, -0.6);
            mouth.quadraticCurveTo(0, -0.3, 0.4, -0.6);
            mouth.quadraticCurveTo(0, -0.5, -0.4, -0.6);
        }
        shape.holes.push(mouth);

        return shape;
    }

    // --- MESH CREATION & PHYSICS SETUP ---
    const extrudeSettings = {
        steps: 1, // Reduced from 2
        depth: 0.1, // Thinner
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.02,
        bevelSegments: 1, // Reduced from 3 (Low Poly-ish)
        curveSegments: 6 // Reduced for performance
    };

    const masks = [];

    function createMask(type, color, x, y, z) {
        const geometry = new THREE.ExtrudeGeometry(createMaskShape(type), extrudeSettings);
        geometry.center();

        // OPTIMIZATION: Use StandardMaterial instead of Physical (No heavy transmission/glass calc)
        const material = new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.3,
            roughness: 0.4,
            transparent: true,
            opacity: 0.9,
            emissive: color,
            emissiveIntensity: 0.2
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);

        // --- DYNAMIC LIGHTING: Attach Light to Mask ---
        // This makes the mask itself a moving light source
        const maskLight = new THREE.PointLight(color, 2, 10); // Color, Intensity, Distance
        maskLight.position.set(0, 0, 1); // Slightly in front of mask
        mesh.add(maskLight);

        // Add a "Glow" Sprite for volumetric effect
        // (Optional: can be added if PointLight isn't visual enough, but let's stick to light first)

        // PHYSICS DATA
        mesh.userData = {
            velocity: new THREE.Vector3(0, 0, 0),
            basePosition: new THREE.Vector3(x, y, z),
            rotationSpeed: (Math.random() - 0.5) * 0.02
        };

        scene.add(mesh);
        masks.push(mesh);
    }

    // Create 3 independent masks spread out
    createMask('smile', 0x33D9B2, -4, 1, 0);   // Left (Cyan)
    createMask('frown', 0xFF5252, 4, -1, -2); // Right (Red)
    createMask('smile', 0x706FD3, 0, 3, -4);  // Top Center (Purple, distant)

    // --- INTERACTION (RAYCASTING) ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-10, -10); // Start off-screen

    document.addEventListener('mousemove', (event) => {
        // Normalize mouse coordinates to -1 to +1
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    // --- MOBILE TOUCH SWIPE ---
    document.addEventListener('touchstart', (event) => {
        if (event.touches.length > 0) {
            mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
        }
    }, { passive: true });

    document.addEventListener('touchmove', (event) => {
        if (event.touches.length > 0) {
            mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
        }
    }, { passive: true });

    document.addEventListener('touchend', () => {
        mouse.set(-10, -10); // Reset off-screen after swipe
    });

    // --- GYROSCOPE GRAVITY (DEVICE ORIENTATION) ---
    let tiltX = 0;
    let tiltY = 0;

    window.addEventListener('deviceorientation', (event) => {
        if (event.gamma !== null && event.beta !== null) {
            // Gamma (left/right tilt) [-90, 90] -> Normalize [-1, 1] over 30deg range
            tiltX = Math.max(-1, Math.min(1, event.gamma / 30));
            // Beta (front/back tilt) [-180, 180] -> 45deg is 'natural' tilt
            tiltY = Math.max(-1, Math.min(1, (event.beta - 45) / 30));
        }
    });

    // --- ANIMATION LOOP ---
    const clock = new THREE.Clock();

    // --- SPOTLIGHT SYNC SETUP ---
    // We update CSS variables to control the global #spotlight mask
    // instead of moving individual divs.

    // Helper to project 3D to 2D
    const tempV = new THREE.Vector3();
    function updateMaskCSSVariables(mask, index) {
        // 1. Get 3D position
        mask.updateWorldMatrix(true, false);
        mask.getWorldPosition(tempV);

        // 2. Project to 2D screen space
        tempV.project(camera);

        // 3. Convert to Percentage (0% to 100%) for CSS Gradients
        const x = (tempV.x * .5 + .5) * 100;
        const y = (tempV.y * -.5 + .5) * 100;

        // 4. Update Global CSS Variables
        document.documentElement.style.setProperty(`--mx${index + 1}`, `${x}%`);
        document.documentElement.style.setProperty(`--my${index + 1}`, `${y}%`);
    }

    function animate() {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        const time = clock.getElapsedTime();

        // 1. RAYCASTING (Check collisions)
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(masks);

        // 2. APPLY PHYSICS & SYNC SPOTLIGHTS
        masks.forEach((mask, index) => {
            // A. Base Floating Animation (Sine wave drift)
            const floatY = Math.sin(time + mask.id) * 0.005;
            mask.position.y += floatY;

            // B. GYROSCOPE GRAVITY (DRIFT)
            const gravityForce = new THREE.Vector3(tiltX * 0.005, -tiltY * 0.005, 0);
            mask.userData.velocity.add(gravityForce);

            // Continuous gentle rotation
            let baseRotation = 0.002;
            let extraScale = 1;

            // --- AUDIO REACTION (RESTORED) ---
            if (window.audioAnalyser) {
                const dataArray = new Uint8Array(window.audioAnalyser.frequencyBinCount);
                window.audioAnalyser.getByteFrequencyData(dataArray);

                let intensity = 0;
                if (index === 0) intensity = dataArray[2] / 255;
                if (index === 1) intensity = dataArray[12] / 255;
                if (index === 2) intensity = dataArray[25] / 255;

                if (intensity > 0) {
                    baseRotation += intensity * 0.02;
                    extraScale = 1 + (intensity * 0.3);
                }
            }

            mask.rotation.z += baseRotation;
            mask.rotation.y += mask.userData.rotationSpeed;

            // Apply scale pulse (smoothly blended)
            mask.scale.lerp(new THREE.Vector3(extraScale, extraScale, extraScale), 0.1);

            // B. MOUSE INTERACTION (PUSH)
            let isHovered = false;
            for (let i = 0; i < intersects.length; i++) {
                if (intersects[i].object === mask) {
                    isHovered = true;
                    // Push Force
                    const pushForce = new THREE.Vector3(
                        (Math.random() - 0.5) * 0.5,
                        (Math.random() - 0.5) * 0.5,
                        -0.5
                    );
                    mask.userData.velocity.add(pushForce);
                    mask.userData.rotationSpeed += 0.05;
                    break;
                }
            }

            // C. PHYSICS UPDATE
            mask.position.add(mask.userData.velocity);
            mask.userData.velocity.multiplyScalar(0.92); // Friction

            // D. RETURN SPRING
            const displacement = new THREE.Vector3().subVectors(mask.position, mask.userData.basePosition);
            const springStrength = 0.01;
            if (!isHovered) {
                const springForce = displacement.multiplyScalar(-springStrength);
                mask.userData.velocity.add(springForce);
                mask.userData.rotationSpeed *= 0.95;
                if (Math.abs(mask.userData.rotationSpeed) < 0.002) mask.userData.rotationSpeed = 0.002;
            }

            // E. UPDATE CORRESPONDING CSS VARS
            updateMaskCSSVariables(mask, index);
        });

        renderer.render(scene, camera);
    }


    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});
