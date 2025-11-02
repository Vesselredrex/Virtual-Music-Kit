const notes = [
  { key: "A", sound: "C4", frequency: 261.63 },
  { key: "S", sound: "D4", frequency: 293.66 },
  { key: "D", sound: "E4", frequency: 329.63 },
  { key: "F", sound: "F4", frequency: 349.23 },
  { key: "G", sound: "G4", frequency: 392.0 },
  { key: "H", sound: "A4", frequency: 440.0 },
  { key: "J", sound: "B4", frequency: 493.88 },
  { key: "K", sound: "C5", frequency: 523.25 },
];

let keyMap = {};
notes.forEach((note) => {
  keyMap[note.key] = note;
});

let isPlaying = false;
let currentEditingIndex = null;
let activeKeys = new Set();
let audioContext = null;

// Глобальні змінні для елементів
let editInputContainer;
let editInput;
let sequenceInput;
let playBtn;

function initAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playSound(frequency) {
  initAudioContext();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = "sine";

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.01,
    audioContext.currentTime + 0.5
  );

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
}

function createPianoKey(note, index) {
  const wrapper = document.createElement("div");
  wrapper.className = "key-wrapper";

  const key = document.createElement("div");
  key.className = "piano-key";
  key.dataset.index = index;

  const label = document.createElement("div");
  label.className = "key-label";
  label.textContent = note.key;

  const editBtn = document.createElement("button");
  editBtn.className = "edit-btn";
  editBtn.textContent = "Edit";
  editBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    showEditInput(index);
  });

  key.appendChild(label);
  key.appendChild(editBtn);

  key.addEventListener("mousedown", () => {
    if (!isPlaying) {
      activateKey(key, note.frequency);
    }
  });

  key.addEventListener("mouseup", () => {
    deactivateKey(key);
  });

  key.addEventListener("mouseleave", () => {
    deactivateKey(key);
  });

  wrapper.appendChild(key);
  return wrapper;
}

function activateKey(keyElement, frequency) {
  if (!keyElement.classList.contains("active")) {
    keyElement.classList.add("active");
    playSound(frequency);
  }
}

function deactivateKey(keyElement) {
  keyElement.classList.remove("active");
}

function showEditInput(index) {
  currentEditingIndex = index;
  const note = notes[index];

  editInputContainer.classList.add("visible");
  editInput.value = note.key;
  editInput.focus();
  editInput.select();
}

function updateKey(newKey) {
  newKey = newKey.toUpperCase();

  if (!/^[A-Z]$/.test(newKey)) {
    return;
  }

  const existingNote = Object.values(keyMap).find((n) => n.key === newKey);
  if (existingNote && notes[currentEditingIndex].key !== newKey) {
    alert("This key is already assigned to another sound!");
    return;
  }

  delete keyMap[notes[currentEditingIndex].key];
  notes[currentEditingIndex].key = newKey;
  keyMap[newKey] = notes[currentEditingIndex];

  const keyElement = document.querySelector(
    `[data-index="${currentEditingIndex}"]`
  );
  const label = keyElement.querySelector(".key-label");
  label.textContent = newKey;

  editInputContainer.classList.remove("visible");
  currentEditingIndex = null;
}

function handleKeyDown(e) {
  if (isPlaying) return;

  if (editInputContainer.classList.contains("visible")) {
    if (e.key === "Enter") {
      updateKey(editInput.value);
    }
    return;
  }

  const key = e.key.toUpperCase();

  if (activeKeys.has(key)) {
    return;
  }

  const note = keyMap[key];
  if (note) {
    activeKeys.add(key);
    const index = notes.indexOf(note);
    const keyElement = document.querySelector(`[data-index="${index}"]`);
    activateKey(keyElement, note.frequency);
  }
}

function handleKeyUp(e) {
  const key = e.key.toUpperCase();
  activeKeys.delete(key);

  const note = keyMap[key];
  if (note) {
    const index = notes.indexOf(note);
    const keyElement = document.querySelector(`[data-index="${index}"]`);
    deactivateKey(keyElement);
  }
}

async function playSequence() {
  const sequence = sequenceInput.value.toUpperCase();
  if (sequence.length === 0) return;

  isPlaying = true;
  sequenceInput.disabled = true;
  playBtn.disabled = true;

  for (let char of sequence) {
    const note = keyMap[char];
    if (note) {
      const index = notes.indexOf(note);
      const keyElement = document.querySelector(`[data-index="${index}"]`);

      keyElement.classList.add("active");
      playSound(note.frequency);

      await new Promise((resolve) => setTimeout(resolve, 400));

      keyElement.classList.remove("active");
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  isPlaying = false;
  sequenceInput.disabled = false;
  playBtn.disabled = false;
}

// Ініціалізація після завантаження DOM
function init() {
  const container = document.createElement("div");
  container.className = "container";

  const title = document.createElement("h1");
  title.className = "title";
  title.textContent = "Virtual Piano Kit";

  const pianoContainer = document.createElement("div");
  pianoContainer.className = "piano-container";

  notes.forEach((note, index) => {
    pianoContainer.appendChild(createPianoKey(note, index));
  });

  editInputContainer = document.createElement("div");
  editInputContainer.className = "edit-input-container";

  const editInstruction = document.createElement("div");
  editInstruction.className = "edit-instruction";
  editInstruction.textContent = "Enter a new key and press Enter";

  editInput = document.createElement("input");
  editInput.className = "edit-input";
  editInput.type = "text";
  editInput.maxLength = 1;

  editInputContainer.appendChild(editInstruction);
  editInputContainer.appendChild(editInput);

  const sequenceContainer = document.createElement("div");
  sequenceContainer.className = "sequence-container";

  const sequenceTitle = document.createElement("h2");
  sequenceTitle.className = "sequence-title";
  sequenceTitle.textContent = "Play a Sequence";

  sequenceInput = document.createElement("input");
  sequenceInput.className = "sequence-input";
  sequenceInput.type = "text";
  sequenceInput.placeholder = "Type your sequence (e.g., ASDFGHJ)";
  sequenceInput.maxLength = notes.length * 2;

  sequenceInput.addEventListener("input", (e) => {
    const filtered = e.target.value
      .toUpperCase()
      .split("")
      .filter((char) => keyMap[char])
      .join("");
    e.target.value = filtered;
  });

  playBtn = document.createElement("button");
  playBtn.className = "play-btn";
  playBtn.textContent = "Play Sequence";
  playBtn.addEventListener("click", playSequence);

  sequenceContainer.appendChild(sequenceTitle);
  sequenceContainer.appendChild(sequenceInput);
  sequenceContainer.appendChild(playBtn);

  container.appendChild(title);
  container.appendChild(pianoContainer);
  container.appendChild(sequenceContainer);
  container.appendChild(editInputContainer);

  document.body.appendChild(container);

  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);

  editInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      updateKey(editInput.value);
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
