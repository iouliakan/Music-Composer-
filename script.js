// Εκτέλεση του κώδικα μόλις φορτωθεί το περιεχόμενο του εγγράφου
document.addEventListener('DOMContentLoaded', () => {
     // Δημιουργία του audio context
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    // Δημιουργία του προορισμού για καταγραφή ήχου
    const destination = audioContext.createMediaStreamDestination();

      // Επιλογή αρχικού οργάνου
    let selectedInstrument = 'sine';
     // Αρχικοποίηση των ενεργών εφέ
    const activeEffects = {
        reverb: false,
        delay: false,
        distortion: false,
        chorus: false
    };

     // Επιλογή των κουμπιών των οργάνων και των εφέ από το DOM
    const instrumentButtons = document.querySelectorAll('.instrument');
    const effectButtons = document.querySelectorAll('.effect');
    const saveButton = document.getElementById('save');
    const startRecordingButton = document.getElementById('startRecording');
    const stopRecordingButton = document.getElementById('stopRecording');

     // Μεταβλητές για την καταγραφή ήχου
    let mediaRecorder;
    let recordedChunks = [];

     // Πίνακες με τις νότες για το κάθε όργανο
    const oscillatorNotes = [
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

    const guitarNotes = [
        { note: 'A3', frequency: 220.00, key: 'n' },
        { note: 'B3', frequency: 246.94, key: 'm' },
        { note: 'B4', frequency: 493.88, key: 'j' },
        { note: 'C2', frequency: 65.41, key: 'q' },
        { note: 'C3', frequency: 130.81, key: 'z' },
        { note: 'D5', frequency: 587.33, key: 'k' },
        { note: 'E3', frequency: 164.81, key: 'c' },
        { note: 'E4', frequency: 329.63, key: 'd' },
        { note: 'F2', frequency: 87.31, key: 'w' },
        { note: 'G3', frequency: 196.00, key: 'b' },
        { note: 'G4', frequency: 392.00, key: 'g' }
    ];

    const pianoNotes = [
        { note: 'A0', frequency: 27.50, key: 'z' },
        { note: 'A1', frequency: 55.00, key: 'x' },
        { note: 'A2', frequency: 110.00, key: 'c' },
        { note: 'A3', frequency: 220.00, key: 'v' },
        { note: 'A4', frequency: 440.00, key: 'b' },
        { note: 'A5', frequency: 880.00, key: 'n' },
        { note: 'A6', frequency: 1760.00, key: 'm' },
        { note: 'A7', frequency: 3520.00, key: ',' },
        { note: 'C1', frequency: 32.70, key: 'a' },
        { note: 'C2', frequency: 65.41, key: 's' },
        { note: 'C3', frequency: 130.81, key: 'd' },
        { note: 'C4', frequency: 261.63, key: 'f' },
        { note: 'C5', frequency: 523.25, key: 'g' },
        // { note: 'D3', frequency: 164.81, key: 'h' },
        // { note: 'D4', frequency: 329.63, key: 'j' }
    ];

    // Χαρτογράφηση των νοτών σε αρχεία ήχου για κάθε όργανο
    const noteToFileMap = {
        'A3': 'A2_s2_01.wav',
        'B3': 'B3_s5_01.wav',
        'B4': 'B4_s6_01.wav',
        'C#6': 'C#6_s6_01.wav',
        'C2': 'C2_s1_01.wav',
        'C3': 'C3_s2_02.wav',
        'D5': 'D5_s6_01.wav',
        'E3': 'E3_s3_01.wav',
        'E4': 'E4_s6_01.wav',
        'F2': 'F2_s1_01.wav',
        'G#5': 'G#5_s6_03.wav',
        'G3': 'G3_s4_01.wav',
        'G4': 'G4_s6_01.wav'
    };

    const pianoNoteToFileMap = {
        'A0': 'A0vL.wav',
        'A1': 'A1vL.wav',
        'A2': 'A2vL.wav',
        'A3': 'A3vL.wav',
        'A4': 'A4vL.wav',
        'A5': 'A5vL.wav',
        'A6': 'A6vL.wav',
        'A7': 'A7vL.wav',
        'C1': 'C1vL.wav',
        'C2': 'C2vL.wav',
        'C3': 'C3vL.wav',
        'C4': 'C4vL.wav',
        'C5': 'C5vL.wav',
        // 'D3': 'D#3vL.wav',
        // 'D4': 'D#4vL.wav'
    };

      // Αρχικοποίηση του convolver node για την αντήχηση
    let convolverNode = null;

     // Φόρτωση του impulse response για την αντήχηση
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

    loadImpulseResponse('assets/724538__djericmark__00.wav');

     // Δημιουργία ενός oscillator με συγκεκριμένη συχνότητα και τύπο κυματομορφής
    function createOscillator(frequency, type) {
        const oscillator = audioContext.createOscillator();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        return oscillator;
    }

     // Δημιουργία ενός gain node
    function createGainNode() {
        return audioContext.createGain();
    }


    // Εφαρμογή των εφέ στον κόμβο ήχου
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
            const feedbackGainNode = audioContext.createGain();
            const mixGainNode = audioContext.createGain();
    
            // Ρυθμίσεις
            delayNode.delayTime.setValueAtTime(0.5, audioContext.currentTime);
            feedbackGainNode.gain.value = 0.5; // 50% feedback
            mixGainNode.gain.value = 0.5; // 50% mix
    
            // Σύνδεση
            currentNode.connect(delayNode);
            delayNode.connect(feedbackGainNode);
            feedbackGainNode.connect(delayNode); // Feedback loop
            feedbackGainNode.connect(audioContext.destination); // Output
    
            // Παράλληλη σύνδεση για mix
            currentNode.connect(mixGainNode);
            mixGainNode.connect(audioContext.destination);
    
            currentNode = mixGainNode; // Το mixGainNode γίνεται ο τρέχων κόμβος
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
    
            chorusOscillator.frequency.value = 1.5;
            chorusOscillator.connect(chorusDelay.delayTime);
            chorusDelay.delayTime.value = 0.005;
    
            currentNode.connect(chorusDelay).connect(chorusGain);
            currentNode = chorusGain;
    
            chorusOscillator.start();
        }
    
        return currentNode;
    }
    
// Δημιουργία της καμπύλης παραμόρφωσης
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

    // Αναπαραγωγή δείγματος νότας
    function playNoteSample(note, type) {
        let fileName;
        if (type === 'piano') {
            fileName = pianoNoteToFileMap[note];
            filePath = `assets/grandpiano/UprightPianoKW-SFZ-20220221 (1)/UprightPianoKW-SFZ-20220221/samples/${fileName}`;
        } else if (type === 'electric_guitar') {
            fileName = noteToFileMap[note];
            filePath = `assets/guitar/${fileName}`;
        }
    
        if (!fileName) {
            console.error(`No sample file found for note: ${note}`);
            return;
        }
    
        const url = filePath;
        console.log(`Loading sample from URL: ${url}`);
        const request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';
    
        request.onload = () => {
            console.log(`Loaded sample: ${url}`);
            audioContext.decodeAudioData(request.response, (buffer) => {
                console.log(`Decoded sample: ${note}`);
                const source = audioContext.createBufferSource();
                source.buffer = buffer;
                let currentNode = source;
    
                currentNode = applyEffects(currentNode);
    
                currentNode.connect(audioContext.destination);
                currentNode.connect(destination); // Connect to the recording destination
                source.start(0);
                source.stop(audioContext.currentTime + 1); // Ensure the note stops after 1 second
            }, (error) => console.error('Error decoding audio data:', error));
        };
    
        request.onerror = () => {
            console.error(`Failed to load sample: ${url}`);
        };
    
        request.send();
    }
    
    
// Αναπαραγωγή νότας
    function playNote(frequency, type) {
        if (type === 'electric_guitar' || type === 'piano') {
            const notesArray = type === 'electric_guitar' ? guitarNotes : pianoNotes;
            const noteName = frequencyToNoteName(frequency, notesArray);
            console.log(`Playing note: ${noteName} (${frequency} Hz)`);
            playNoteSample(noteName, type);
        } else {
            const oscillator = createOscillator(frequency, type);
            const gainNode = createGainNode();
            let currentNode = oscillator;
    
            currentNode = applyEffects(currentNode);
    
            currentNode.connect(gainNode).connect(destination);
            currentNode.connect(audioContext.destination);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 1); // Ensure the note stops after 1 second
        }
    }
    
    // Μετατροπή συχνότητας σε όνομα νότας

    function frequencyToNoteName(frequency, notesArray) {
        const note = notesArray.find(n => n.frequency === frequency);
        return note ? note.note : '';
    }

    // Δημιουργία πληκτρολογίου
    function createKeyboard() {
        const keyboard = document.getElementById('keyboard');
        let currentNotes;
        switch (selectedInstrument) {
            case 'electric_guitar':
                currentNotes = guitarNotes;
                break;
            case 'piano':
                currentNotes = pianoNotes;
                break;
            default:
                currentNotes = oscillatorNotes;
                break;
        }
        keyboard.innerHTML = '';
        currentNotes.forEach(note => {
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
    
 // Προσθήκη συμβάντος click στα κουμπιά των οργάνων
    instrumentButtons.forEach(button => {
        button.addEventListener('click', () => {
            instrumentButtons.forEach(btn => btn.classList.remove('active'));
            selectedInstrument = button.getAttribute('data-type');
            button.classList.add('active');
            console.log('Selected instrument:', selectedInstrument);
            createKeyboard();
        });
    });
// Προσθήκη συμβάντος click στα κουμπιά των εφέ
    effectButtons.forEach(button => {
        button.addEventListener('click', () => {
            const effectId = button.id;
            activeEffects[effectId] = !activeEffects[effectId];
            console.log('Toggled effect:', effectId, activeEffects[effectId]);
            button.classList.toggle('active');
        });
    });
// Προσθήκη συμβάντος keydown για την αναπαραγωγή νότας με το πληκτρολόγιο
    document.addEventListener('keydown', (event) => {
        const currentNotes = selectedInstrument === 'electric_guitar' ? guitarNotes : oscillatorNotes;
        const note = currentNotes.find(n => n.key === event.key);
        if (note) {
            playNote(note.frequency, selectedInstrument);
            const button = document.querySelector(`button[data-key="${event.key}"]`);
            if (button) {
                button.classList.add('active');
                setTimeout(() => button.classList.remove('active'), 200);
            }
        }
    });

    // Δημιουργία αρχικού πληκτρολογίου
    createKeyboard();

    // Έναρξη καταγραφής ήχου
    startRecordingButton.addEventListener('click', () => {
        recordedChunks = [];
        mediaRecorder = new MediaRecorder(destination.stream);

        mediaRecorder.ondataavailable = event => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            console.log('Recording stopped');
        };

        mediaRecorder.start();
        console.log('Recording started');
    });
 // Σταμάτημα καταγραφής ήχου
    stopRecordingButton.addEventListener('click', () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }
    });

    // Αποθήκευση του καταγεγραμμένου ήχου

    saveButton.addEventListener('click', () => {
        if (recordedChunks.length > 0) {
            const blob = new Blob(recordedChunks, { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            document.body.appendChild(a);
            a.style = 'display: none';
            a.href = url;
            a.download = 'composition.wav';
            a.click();
            window.URL.revokeObjectURL(url);
        } else {
            alert('No recording available to save.');
        }
    });
});










