document.addEventListener('DOMContentLoaded', () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    let selectedInstrument = 'sine';
    const activeEffects = {
        reverb: false,
        delay: false,
        distortion: false,
        chorus: false
    };

    const instrumentButtons = document.querySelectorAll('.instrument');
    const effectButtons = document.querySelectorAll('.effect');
    const saveButton = document.getElementById('save');

    const notes = [
        { note: 'C3', frequency: 130.81, key: 'z' },
        { note: 'D3', frequency: 146.83, key: 'x' },
        { note: 'E3', frequency: 164.81, key: 'c' },
        { note: 'F3', frequency: 174.61, key: 'v' },
        { note: 'G3', frequency: 196.00, key: 'b' },
        { note: 'A3', frequency: 220.00, key: 'n' },
        { note: 'B3', frequency: 246.94, key: 'm' },
        { note: 'C4', frequency: 261.63, key: 'a' },
        { note: 'D4', frequency: 293.66, key: 's' },
        { note: 'E4', frequency: 329.63, key: 'd' },
        { note: 'F4', frequency: 349.23, key: 'f' },
        { note: 'G4', frequency: 392.00, key: 'g' },
        { note: 'A4', frequency: 440.00, key: 'h' },
        { note: 'B4', frequency: 493.88, key: 'j' },
        { note: 'C5', frequency: 523.25, key: 'k' }
    ];

    let convolverNode = null;

    // Function to load impulse response
    function loadImpulseResponse(url) {
        fetch(url)
            .then(response => response.arrayBuffer())
            .then(data => audioContext.decodeAudioData(data))
            .then(buffer => {
                convolverNode = audioContext.createConvolver();
                convolverNode.buffer = buffer;
                console.log('Reverb impulse response loaded');
            })
            .catch(error => console.error('Error loading impulse response:', error));
    }

    // Load a default impulse response for reverb
    loadImpulseResponse('assets/724538__djericmark__00.wav');

    function createOscillator(frequency, type) {
        const oscillator = audioContext.createOscillator();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        return oscillator;
    }

    function createGainNode() {
        return audioContext.createGain();
    }

    function applyEffects(node) {
        let currentNode = node;

        if (activeEffects.reverb && convolverNode) {
            console.log('Applying reverb');
            currentNode.connect(convolverNode);
            currentNode = convolverNode;
        }

        if (activeEffects.delay) {
            console.log('Applying delay');
            const delayNode = audioContext.createDelay();
            delayNode.delayTime.setValueAtTime(0.5, audioContext.currentTime); // 0.5 seconds delay
            currentNode.connect(delayNode);
            currentNode = delayNode;
        }

        if (activeEffects.distortion) {
            console.log('Applying distortion');
            const distortionNode = audioContext.createWaveShaper();
            distortionNode.curve = makeDistortionCurve(400);
            distortionNode.oversample = '4x';
            currentNode.connect(distortionNode);
            currentNode = distortionNode;
        }

        if (activeEffects.chorus) {
            console.log('Applying chorus');
            const chorusGain = audioContext.createGain();
            const chorusDelay = audioContext.createDelay();
            const chorusOscillator = audioContext.createOscillator();

            chorusOscillator.frequency.value = 1.5; // Vibrato frequency
            chorusOscillator.connect(chorusDelay.delayTime);
            chorusDelay.delayTime.value = 0.005; // Base delay time

            currentNode.connect(chorusDelay).connect(chorusGain);
            currentNode = chorusGain;

            chorusOscillator.start();
        }

        return currentNode;
    }

    function makeDistortionCurve(amount) {
        const k = typeof amount === 'number' ? amount : 50;
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;
        for (let i = 0; i < n_samples; ++i) {
            const x = i * 2 / n_samples - 1;
            curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
        }
        return curve;
    }

    function playNote(frequency, type) {
        const oscillator = createOscillator(frequency, type);
        const gainNode = createGainNode();
        let currentNode = oscillator;

        currentNode = applyEffects(currentNode);

        currentNode.connect(gainNode).connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 1); // Play note for 1 second
    }

    function createKeyboard() {
        const keyboard = document.getElementById('keyboard');
        notes.forEach(note => {
            const button = document.createElement('button');
            button.textContent = note.note;
            button.dataset.frequency = note.frequency;
            button.dataset.key = note.key;
            button.addEventListener('mousedown', () => {
                playNote(note.frequency, selectedInstrument);
                button.classList.add('active');
                setTimeout(() => button.classList.remove('active'), 200);
            });
            keyboard.appendChild(button);
        });
    }

    // Event listeners for instrument buttons
    instrumentButtons.forEach(button => {
        button.addEventListener('click', () => {
            instrumentButtons.forEach(btn => btn.classList.remove('active'));
            selectedInstrument = button.getAttribute('data-type');
            button.classList.add('active');
            console.log('Selected instrument:', selectedInstrument);
        });
    });

    // Event listeners for effect buttons
    effectButtons.forEach(button => {
        button.addEventListener('click', () => {
            const effectId = button.id;
            activeEffects[effectId] = !activeEffects[effectId];
            console.log('Toggled effect:', effectId, activeEffects[effectId]);
            button.classList.toggle('active');
        });
    });

    // Event listener for keyboard keys
    document.addEventListener('keydown', (event) => {
        const note = notes.find(n => n.key === event.key);
        if (note) {
            playNote(note.frequency, selectedInstrument);
            const button = document.querySelector(`button[data-key="${event.key}"]`);
            if (button) {
                button.classList.add('active');
                setTimeout(() => button.classList.remove('active'), 200);
            }
        }
    });

    createKeyboard();

    saveButton.addEventListener('click', () => {
        alert('Save functionality to be implemented');
    });
});





