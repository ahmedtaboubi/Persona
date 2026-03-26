console.log("SCRIPT START - v2.2");
document.addEventListener('DOMContentLoaded', () => {

    // --- LIGHT MODE TOGGLE (WALL SWITCH) ---
    const themeSwitch = document.getElementById('theme-switch');

    // 1. Check Saved Theme on Load
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-theme');
    } else {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-mode');
    }

    // Web Audio API Context (Lazy init)
    let audioCtx;

    function playSwitchSound() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const t = audioCtx.currentTime;

        // "DRY CLICK" - Short, sharp, filtered noise only (No low freq oscillators)
        const bufferSize = audioCtx.sampleRate * 0.05; // 50ms
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;

        // Bandpass filter to isolate the "plastic" frequency range (2kHz - 4kHz)
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2500; // Sharp snap frequency
        filter.Q.value = 1.0; // Moderate resonance

        const gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(1.0, t);
        gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.03); // Super fast decay (30ms)

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        noise.start(t);
    }

    if (themeSwitch) {
        themeSwitch.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');

            // 2. Save Preference
            const isLight = document.body.classList.contains('light-mode');
            localStorage.setItem('theme', isLight ? 'light' : 'dark');

            playSwitchSound(); // Play "Clack"
        });
    }

    // --- SCROLL ANIMATIONS ---
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    revealElements.forEach(el => observer.observe(el));

    // --- CUSTOM CURSOR ---
    const cursor = document.createElement('div');
    cursor.classList.add('cursor');
    document.body.appendChild(cursor);

    // --- SPOTLIGHT & CURSOR ---
    // --- SPOTLIGHT & CURSOR (OPTIMIZED LOOP) ---
    const spotlight = document.getElementById('spotlight');
    let mouseX = 0;
    let mouseY = 0;
    let isMoving = false;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        if (!isMoving) {
            isMoving = true;
            requestAnimationFrame(updateCursor);
        }
    });

    function updateCursor() {
        if (spotlight) {
            spotlight.style.setProperty('--x', mouseX + 'px');
            spotlight.style.setProperty('--y', mouseY + 'px');
        }
        cursor.style.left = mouseX + 'px';
        cursor.style.top = mouseY + 'px';

        isMoving = false; // Allow next frame triggers
    }

    // Hover effect for links & buttons (Scale up cursor, maybe brighten spotlight?)
    const interactiveElements = document.querySelectorAll('a, button, .glass-card');
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('hovered'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('hovered'));
    });
    // --- HOLOGRAPHIC TILT EFFECT (ADDED V18) ---
    const cards = document.querySelectorAll('.glass-card');

    // --- CONTACT FORM "HACKER" ANIMATION (ADDED V20) ---
    /* --- REAL CONTACT FORM SUBMIT (Updated) --- */
    const contactForm = document.querySelector('form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Prevent standard redirect
            const btn = contactForm.querySelector('button');
            const originalText = btn.innerText;

            // 1. UI: Lock & Start
            btn.disabled = true;
            btn.classList.add('btn-loading');
            btn.innerText = 'INITIALISATION...';
            btn.style.opacity = '1';

            // 2. Prepare Data (FormSubmit needs FormData)
            const formData = new FormData(contactForm);

            // 3. Fake "Encryption" delay for effect (800ms)
            setTimeout(() => {
                btn.innerText = 'ENCRYPTING [||||      ]';

                // 4. REAL SEND in background
                fetch("https://formsubmit.co/ajax/ahmed.taboubi@hotmail.fr", {
                    method: "POST",
                    body: formData
                })
                    .then(response => response.json())
                    .then(data => {
                        // Success Sequence
                        btn.innerText = 'UPLOADING  [||||||||||]';

                        setTimeout(() => {
                            console.log("Transmission Success:", data);
                            btn.classList.remove('btn-loading');
                            btn.classList.add('success');
                            btn.innerText = 'TRANSMISSION ÉTABLIE';
                            if (window.playSwitchSound) playSwitchSound()
                            // Reset Form
                            contactForm.reset();

                            // Return to normal
                            setTimeout(() => {
                                btn.classList.remove('success');
                                btn.innerText = originalText;
                                btn.disabled = false;
                            }, 4000);
                        }, 1000); // Short finish delay
                    })
                    .catch(error => {
                        // Error Sequence
                        console.error("Transmission Error:", error);
                        btn.classList.remove('btn-loading');
                        btn.style.background = 'red'; // Error color
                        btn.innerText = 'ECHEC TRANSMISSION';

                        setTimeout(() => {
                            btn.style.background = ''; // Reset
                            btn.innerText = originalText;
                            btn.disabled = false;
                        }, 3000);
                    });

            }, 800); // End of Encryption Delay
        });
    }

    cards.forEach(card => {
        // MOUSE INTERACTION (Desktop)
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Calculate rotation (Max 3deg - SUPER SUBTLE)
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -3;
            const rotateY = ((x - centerX) / centerX) * 3;

            // Apply Transform (NO SCALING to avoid "escaping" buttons)
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

            // Move Glare
            const glow = card.querySelector('.card-glow');
            if (glow) {
                glow.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.3), transparent 70%)`;
                glow.style.opacity = '1';
            }
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
            const glow = card.querySelector('.card-glow');
            if (glow) glow.style.opacity = '0';
        });
    });

    // GYROSCOPE INTERACTION (Mobile)
    function handleMobileTilt(event) {
        // Gamma: Left/Right tilt (-90 to 90) -> Maps to RotateY
        // Beta: Front/Back tilt (-180 to 180) -> Maps to RotateX
        const x = event.gamma || 0;
        const y = event.beta || 0;

        // Constraint tilt to avoid flipping
        const tiltX = Math.max(-20, Math.min(20, y));
        const tiltY = Math.max(-20, Math.min(20, x));

        cards.forEach(card => {
            // Invert logic for natural feel on mobile similar to "looking through a window"
            // RotateX negative when tilting forward (Beta positive)
            card.style.transform = `perspective(1000px) rotateX(${-tiltX}deg) rotateY(${tiltY}deg) scale3d(1.05, 1.05, 1.05)`;

            // For glare, we approximate position based on tilt
            const glow = card.querySelector('.card-glow');
            if (glow) {
                // Map tilt to percentage positions
                const glowX = 50 + (tiltY * 2); // Center + offset
                const glowY = 50 + (tiltX * 2);
                glow.style.background = `radial-gradient(circle at ${glowX}% ${glowY}%, rgba(255,255,255,0.3), transparent 70%)`;
                glow.style.opacity = '0.8';
            }
        });
    }

    // Check if device supports orientation and add listener conditionally
    if (window.DeviceOrientationEvent && 'ontouchstart' in window) {
        window.addEventListener('deviceorientation', handleMobileTilt, true);
    }

    // --- SCROLL SPY FOR NAVIGATION ---
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-links a');

    window.addEventListener('scroll', () => {
        let current = '';
        const homeLink = document.querySelector('.nav-links a[href="/"]');

        // Check if at top of page (Home)
        if (window.scrollY < 100) {
            navLinks.forEach(link => link.classList.remove('active'));
            if (homeLink) homeLink.classList.add('active');
            return;
        }

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= (sectionTop - sectionHeight / 3)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (current && link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    });
});

/* --- TUBELIGHT NAVBAR LOGIC (ADDED V26) --- */
document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');
    const navLamp = document.getElementById('nav-lamp');
    const activeItem = document.querySelector('.nav-item.active');

    function moveLamp(target) {
        if (!target || !navLamp) return;

        // Calculate position relative to container
        const left = target.offsetLeft;
        const width = target.offsetWidth;

        // Apply
        navLamp.style.left = `${left}px`;
        navLamp.style.width = `${width}px`;
        navLamp.style.opacity = '1';
    }

    // 1. Initial Position
    if (activeItem) {
        // Wait just a tick for layout
        setTimeout(() => moveLamp(activeItem), 50);
    }

    // 2. Hover/Click Effects
    navItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            moveLamp(item);
        });

        item.addEventListener('click', () => {
            // Update active class manually since page might not reload if hash
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            moveLamp(item);
        });
    });

    // 3. Reset to Active on Mouse Leave (Optional, keeps it cleaner)
    const navContainer = document.querySelector('.nav-container');
    if (navContainer) {
        navContainer.addEventListener('mouseleave', () => {
            const currentActive = document.querySelector('.nav-item.active');
            if (currentActive) moveLamp(currentActive);
        });
    }

    // 4. Handle Resize
    window.addEventListener('resize', () => {
        const currentActive = document.querySelector('.nav-item.active');
        if (currentActive) moveLamp(currentActive);
    });
});

/* --- AMBIENT GEN (Refined V27) --- */
class AmbientDrone {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.isPlaying = false;
        this.nodes = []; // Active oscillators
        this.scale = [196.00, 220.00, 261.63, 329.63, 392.00, 523.25]; // G Major Pentatonic (Soft/Dreamy)
        this.timer = null;
    }

    init() {
        if (this.ctx) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();

        // Master Chain: Limiter -> Master Volume
        const compressor = this.ctx.createDynamicsCompressor();
        compressor.threshold.value = -20;
        compressor.ratio.value = 4;

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0; // Start silent

        this.analyser = this.ctx.createAnalyser(); // Create analyser
        this.masterGain.connect(compressor);
        compressor.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);

        // EXPOSE FOR VISUALIZER
        window.audioAnalyser = this.analyser;
    }

    playNote() {
        if (!this.isPlaying) return;

        // Choose random note from scale (Pentatonic Minor for "Immersive/Cinematic" feel)
        // C Minor Pentatonic: C, Eb, F, G, Bb
        const scale = [130.81, 155.56, 174.61, 196.00, 233.08, 261.63, 311.13, 349.23];
        const freq = scale[Math.floor(Math.random() * scale.length)];

        // Occasional lower octave for "Deep Bass" piano weight
        const octave = Math.random() > 0.8 ? 0.5 : 1;
        const finalFreq = freq * octave;

        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();
        const pan = this.ctx.createStereoPanner();

        // Sound Design: "Soft Electric Piano / Glassy Pad"
        // Sine wave is much smoother/calmer than triangle
        osc.type = 'sine';
        osc.frequency.setValueAtTime(finalFreq, this.ctx.currentTime);

        // Random Pan (Stereo Width)
        pan.pan.value = (Math.random() * 1.5) - 0.75;

        // Piano Envelope: Immediate Attack, Exponential Decay
        const now = this.ctx.currentTime;
        const duration = 4 + Math.random() * 4; // Long tail (Reverb simulation)

        noteGain.gain.setValueAtTime(0, now);
        noteGain.gain.linearRampToValueAtTime(0.15, now + 0.05); // Soft Attack (not clicky)
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + duration); // Long, smooth fade out

        // Connection
        osc.connect(pan);
        pan.connect(noteGain);
        noteGain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + duration);

        // Cleanup
        setTimeout(() => {
            osc.disconnect();
            pan.disconnect();
            noteGain.disconnect();
        }, duration * 1000 + 100);

        // Schedule next note (Slower, more breathable tempo)
        // 2s to 5s gap = Very Ambient
        this.timer = setTimeout(() => this.playNote(), 2000 + Math.random() * 3000);
    }

    async start() {
        if (this.isPlaying) return;
        this.init();
        if (this.ctx.state === 'suspended') await this.ctx.resume();
        this.isPlaying = true;

        // Master Fade In
        const now = this.ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.linearRampToValueAtTime(1.0, now + 5);

        // Start Generative Loop
        this.playNote();
        this.playNote(); // Start two overlapping streams
    }

    stop() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        clearTimeout(this.timer);

        // Master Fade Out
        if (this.masterGain) {
            const now = this.ctx.currentTime;
            this.masterGain.gain.cancelScheduledValues(now);
            this.masterGain.gain.linearRampToValueAtTime(0, now + 3);
        }
    }
}

// Global drone instance
const ambientDrone = new AmbientDrone();

// Integrate with toggle
document.addEventListener('DOMContentLoaded', () => {
    const sw = document.getElementById('theme-switch');

    // AUTO-RESUME LOGIC (Fixed for Navigation)
    const shouldPlay = !document.body.classList.contains('light-mode');

    if (shouldPlay) {
        // Try autoplay immediately (often allowed after navigation)
        setTimeout(() => {
            ambientDrone.start().catch(e => {
                console.log("Autoplay blocked, waiting for interaction...");
                // Fallback: Wait for first interaction
                document.body.addEventListener('click', () => {
                    if (!ambientDrone.isPlaying) ambientDrone.start();
                }, { once: true });
            });
        }, 100);
    } else {
        // If light mode, wait for click to init silently if needed (optional)
    }

    if (sw) {
        sw.addEventListener('click', () => {
            // Toggle logic is already handled in main block, we just react to state
            // Let's give a small delay for the class to update
            setTimeout(() => {
                const isDark = !document.body.classList.contains('light-mode');
                if (isDark) {
                    ambientDrone.start();
                } else {
                    ambientDrone.stop();
                }
            }, 50);
        });
    }

    // --- MOBILE MENU LOGIC ---
    // (Moved outside)
});

// --- MOBILE MENU LOGIC (Global Scope) ---
function initMobileMenuGlobal() {
    console.log('Mobile Menu Init (Global)...');
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const nav = document.querySelector('.tubelight-nav');
    const navLinks = document.querySelectorAll('.nav-items-wrapper .nav-item');

    if (mobileBtn && nav) {
        console.log('Mobile Btn found, adding listener');

        // Clone to ensure clean listener
        const newBtn = mobileBtn.cloneNode(true);
        mobileBtn.parentNode.replaceChild(newBtn, mobileBtn);

        newBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Toggle class
            nav.classList.toggle('nav-open');
            console.log('Menu Toggled:', nav.classList.contains('nav-open'));
        });

        // Close when clicking a link
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('nav-open');
            });
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (nav.classList.contains('nav-open') && !nav.contains(e.target) && !newBtn.contains(e.target)) {
                nav.classList.remove('nav-open');
            }
        });
    } else {
        console.error('Mobile menu elements not found (Global)');
    }
}

// Run immediately (script is at end of body)
initMobileMenuGlobal();

// Also try on DOMContentLoaded just in case
document.addEventListener('DOMContentLoaded', initMobileMenuGlobal);
