// src/pages/SightSingingPage.tsx
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Play, ChevronRight, Music, List, Award } from 'lucide-react';
import { Synth, start } from 'tone';
import Layout from '../components/Layout';
import { exerciseAPI, progressAPI, achievementAPI } from '../services/api';

// Import a pitch detection library
import Pitchfinder from 'pitchfinder';

// Proper VexFlow import for version 4.x
import * as Vex from 'vexflow';

// Helper to convert frequency to note name
const getNoteName = (frequency: number | null): string => {
  if (!frequency) return 'No pitch detected';

  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const a4 = 440;
  const a4Index = 57; // A4 is the 57th note on a standard 88-key piano

  // Calculate how many half steps away from A4
  const halfStepsFromA4 = 12 * Math.log2(frequency / a4);

  // Round to the nearest integer to get the number of half steps
  const halfStepsRounded = Math.round(halfStepsFromA4);

  // Calculate the index in the noteNames array
  let noteIndex = (a4Index + halfStepsRounded) % 12;
  if (noteIndex < 0) {
    noteIndex += 12;
  }

  // Calculate the octave
  const octave = Math.floor((a4Index + halfStepsRounded) / 12) - 1;

  return `${noteNames[noteIndex]}${octave}`;
};

// Helper for converting note names to VexFlow format
const noteToVexflow = (noteName: string): string => {
  if (!noteName || noteName === 'No pitch detected') return 'c/4';

  // Convert from format like "C4" to "c/4"
  const note = noteName.slice(0, -1).toLowerCase();
  const octave = noteName.slice(-1);

  return `${note}/${octave}`;
};

// Helper to compare two notes (letter and octave only)
const compareNotes = (note1: string, note2: string): boolean => {
  const note1Letter = note1.charAt(0);
  const note1Octave = note1.slice(-1);
  const note2Letter = note2.charAt(0);
  const note2Octave = note2.slice(-1);

  return note1Letter === note2Letter && note1Octave === note2Octave;
};

// Simple singing exercises with sequence of notes
const exercises = [
  {
    name: 'Simple Scale',
    notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
    durations: ['q', 'q', 'q', 'q', 'q', 'q', 'q', 'q'],
    difficulty: 'Easy',
    exerciseType: 'Scales',
  },
  {
    name: 'Basic Intervals',
    notes: ['C4', 'E4', 'G4', 'C5', 'G4', 'E4', 'C4'],
    durations: ['q', 'q', 'q', 'h', 'q', 'q', 'h'],
    difficulty: 'Easy',
    exerciseType: 'Intervals',
  },
  {
    name: 'Simple Melody',
    notes: ['C4', 'D4', 'E4', 'C4', 'E4', 'F4', 'G4'],
    durations: ['q', 'q', 'q', 'q', 'q', 'q', 'h'],
    difficulty: 'Medium',
    exerciseType: 'Melody',
  },
  {
    name: 'Major Triad Arpeggios',
    notes: ['C4', 'E4', 'G4', 'C5', 'G4', 'E4', 'C4'],
    durations: ['q', 'q', 'q', 'q', 'q', 'q', 'h'],
    difficulty: 'Medium',
    exerciseType: 'Notes',
  },
  {
    name: 'Minor Scale',
    notes: ['A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4'],
    durations: ['q', 'q', 'q', 'q', 'q', 'q', 'q', 'q'],
    difficulty: 'Hard',
    exerciseType: 'Scales',
  },
  {
    name: 'Chromatic Pattern',
    notes: ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4'],
    durations: ['q', 'q', 'q', 'q', 'q', 'q', 'q', 'q'],
    difficulty: 'Hard',
    exerciseType: 'Notes',
  },
];

// Interface for audio processing objects
interface AudioRef {
  stream?: MediaStream;
  audioContext?: AudioContext;
  analyser?: AnalyserNode;
  source?: MediaStreamAudioSourceNode;
  animationFrame?: number;
}

// Interface for recorded note tracking
interface RecordedNote {
  note: string;
  timestamp: number;
  isCorrect?: boolean;
}

// Interface for user progress
interface UserProgress {
  moduleType: string;
  progress: number;
  exercises: {
    id: number | string;
    name: string;
    score: number;
    completedDate: string;
  }[];
}

const SightSingingPage = () => {
  const notationRef = useRef<HTMLDivElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [detectedPitch, setDetectedPitch] = useState<number | null>(null);
  const [detectedNote, setDetectedNote] = useState('No pitch detected');
  const [selectedDifficulty, setSelectedDifficulty] = useState('Medium');
  const [selectedExerciseType, setSelectedExerciseType] = useState('Melody');
  const [currentExercise, setCurrentExercise] = useState(0);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [accuracy, setAccuracy] = useState(0);
  const [micPermission, setMicPermission] = useState<boolean | null>(null);
  const [isPlayingReference, setIsPlayingReference] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  // New state variables for dual mode
  const [practiceMode, setPracticeMode] = useState<'note-by-note' | 'full-melody'>('note-by-note');
  const [recordedNotes, setRecordedNotes] = useState<RecordedNote[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [metronomeActive, setMetronomeActive] = useState(false);
  const [countdownActive, setCountdownActive] = useState(false);
  const [countdownCount, setCountdownCount] = useState(3);
  const [melodyResults, setMelodyResults] = useState<
    Array<{ note: string; sung: string; isCorrect: boolean }>
  >([]);
  const [showMelodyResults, setShowMelodyResults] = useState(false);

  // API-related state variables
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [perfectPitchUnlocked, setPerfectPitchUnlocked] = useState(false);

  // Reference to store audio processing objects
  const audioRef = useRef<AudioRef>({});

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: 'beforeChildren',
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // Get user progress from API
  useEffect(() => {
    const fetchUserProgress = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch sight singing progress from API
        const response = await progressAPI.getUserProgress();
        const progressData = response.data;

        // Find sight singing module progress
        const sightSingingProgress = progressData.find(
          (module: any) => module.moduleType === 'SightSinging'
        );

        if (sightSingingProgress) {
          setUserProgress(sightSingingProgress);
        }

        // Check if Perfect Pitch achievement is already unlocked
        const achievementsResponse = await achievementAPI.getUserAchievements();
        const achievements = achievementsResponse.data;

        const hasPerfectPitch = achievements.some(
          (achievement: any) => achievement.name === 'Perfect Pitch'
        );

        setPerfectPitchUnlocked(hasPerfectPitch);
      } catch (err) {
        console.error('Failed to fetch user progress', err);
        setError('Failed to load your progress. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProgress();
  }, []);

  // Filter exercises based on selected difficulty and exercise type
  const filteredExercises = exercises.filter(
    ex =>
      ex.difficulty === selectedDifficulty &&
      (selectedExerciseType === 'All' || ex.exerciseType === selectedExerciseType)
  );

  // Create a helper function to calculate pagination info
  const calculatePagination = (exercise: any) => {
    if (!exercise) return { totalPages: 1, notesPerPage: 4 };

    const notesPerPage = 4; // Show 4 notes per page/measure
    const totalPages = Math.ceil(exercise.notes.length / notesPerPage);
    const pageOfCurrentNote = Math.floor(currentNoteIndex / notesPerPage);

    return {
      notesPerPage,
      totalPages,
      pageOfCurrentNote,
      startIndex: currentPage * notesPerPage,
      endIndex: Math.min(exercise.notes.length, (currentPage + 1) * notesPerPage),
    };
  };

  const renderNotation = () => {
    if (!notationRef.current) return;

    try {
      // Clear previous notation
      notationRef.current.innerHTML = '';

      // Get current exercise
      const exercise = filteredExercises[currentExercise];
      if (!exercise) {
        console.error('No exercise found for index:', currentExercise);
        return;
      }

      // Get pagination info
      const { notesPerPage, startIndex, endIndex } = calculatePagination(exercise);

      // Get notes and durations for current page
      const displayNotes = exercise.notes.slice(startIndex, endIndex);
      const displayDurations = exercise.durations.slice(startIndex, endIndex);

      // Create renderer
      const renderer = new Vex.Renderer(notationRef.current, Vex.Renderer.Backends.SVG);
      renderer.resize(600, 120);
      const context = renderer.getContext();

      // Create stave
      const stave = new Vex.Stave(10, 0, 500);
      stave.addClef('treble');
      stave.setContext(context).draw();

      // Create notes with annotations
      const notes = displayNotes.map((note, index) => {
        const absoluteIndex = (startIndex ?? 0) + index;
        const vfNote = new Vex.StaveNote({
          keys: [noteToVexflow(note)],
          duration: displayDurations[index],
        });

        // In note-by-note mode, highlight the current note
        // In full-melody mode, don't highlight any specific note during recording
        if (practiceMode === 'note-by-note' && absoluteIndex === currentNoteIndex) {
          vfNote.setStyle({ fillStyle: 'blue', strokeStyle: 'blue' });
        }

        // If we're showing melody results, highlight correct/incorrect notes
        if (showMelodyResults && practiceMode === 'full-melody') {
          const result = melodyResults.find((r, i) => i === absoluteIndex);
          if (result) {
            vfNote.setStyle({
              fillStyle: result.isCorrect ? 'green' : 'red',
              strokeStyle: result.isCorrect ? 'green' : 'red',
            });
          }
        }

        // Add note name annotation below the note
        const annotation = new Vex.Annotation(note);
        annotation.setText(note);
        annotation.setVerticalJustification(Vex.Annotation.VerticalJustify.BOTTOM);

        // Set font properties safely
        try {
          let fontWeight = 'normal';
          let fontColor = '#666';

          if (practiceMode === 'note-by-note' && absoluteIndex === currentNoteIndex) {
            fontWeight = 'bold';
            fontColor = '#4f46e5';
          } else if (showMelodyResults && practiceMode === 'full-melody') {
            const result = melodyResults.find((r, i) => i === absoluteIndex);
            if (result) {
              fontWeight = 'bold';
              fontColor = result.isCorrect ? 'green' : 'red';
            }
          }

          annotation.setFont('Arial', 10, fontWeight);
          if (typeof annotation.setStyle === 'function') {
            annotation.setStyle({ fillStyle: fontColor });
          }
        } catch (e) {
          console.warn('Annotation styling not fully supported', e);
        }

        vfNote.addModifier(annotation);
        return vfNote;
      });

      // Create voice with exactly 4 beats to match a 4/4 measure
      const voice = new Vex.Voice({ numBeats: 4, beatValue: 4 });
      voice.addTickables(notes);

      // Format and draw
      new Vex.Formatter().joinVoices([voice]).format([voice], 400);
      voice.draw(context, stave);

      console.log('Successfully rendered notation');
    } catch (error) {
      console.error('Error rendering notation:', error);
      // Fallback to simple representation if VexFlow fails
      renderSimpleNotation();
    }
  };

  // Update the renderSimpleNotation function
  const renderSimpleNotation = () => {
    if (!notationRef.current) return;

    // Clear the notation area
    notationRef.current.innerHTML = '';

    // Get the current exercise
    const exercise = filteredExercises[currentExercise];
    if (!exercise) return;

    // Get pagination info
    const { startIndex, endIndex } = calculatePagination(exercise);

    // Get notes for current page
    const displayNotes = exercise.notes.slice(startIndex, endIndex);
    const displayDurations = exercise.durations.slice(startIndex, endIndex);

    // Create a simple representation using HTML
    const container = document.createElement('div');
    container.style.padding = '20px';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.flexWrap = 'wrap';
    container.style.gap = '15px';

    // Add a message
    const message = document.createElement('div');
    message.style.width = '100%';
    message.style.textAlign = 'center';
    message.style.marginBottom = '15px';
    message.style.color = '#666';
    message.textContent = 'Simple notation view (VexFlow rendering unavailable)';
    container.appendChild(message);

    // Add staff lines as a simple 5-line background
    const staffContainer = document.createElement('div');
    staffContainer.style.width = '100%';
    staffContainer.style.height = '70px';
    staffContainer.style.position = 'relative';
    staffContainer.style.marginBottom = '20px';

    for (let i = 0; i < 5; i++) {
      const line = document.createElement('div');
      line.style.position = 'absolute';
      line.style.left = '0';
      line.style.right = '0';
      line.style.height = '1px';
      line.style.backgroundColor = '#000';
      line.style.top = `${10 + i * 10}px`;
      staffContainer.appendChild(line);
    }

    // Add treble clef symbol
    const clef = document.createElement('div');
    clef.style.position = 'absolute';
    clef.style.left = '10px';
    clef.style.top = '0';
    clef.style.fontSize = '40px';
    clef.style.lineHeight = '60px';
    clef.textContent = '𝄞'; // Unicode treble clef symbol
    staffContainer.appendChild(clef);

    container.appendChild(staffContainer);

    // Add note representations for current page
    displayNotes.forEach((note, index) => {
      const absoluteIndex = (startIndex ?? 0) + index;
      const noteElement = document.createElement('div');
      noteElement.style.display = 'flex';
      noteElement.style.flexDirection = 'column';
      noteElement.style.alignItems = 'center';
      noteElement.style.padding = '8px';
      noteElement.style.borderRadius = '4px';

      // Handle highlighting based on mode and state
      let backgroundColor = 'transparent';
      let borderColor = 'transparent';
      let noteColor = '#333';

      if (practiceMode === 'note-by-note' && absoluteIndex === currentNoteIndex) {
        backgroundColor = '#e0e7ff';
        borderColor = '#4f46e5';
        noteColor = '#4f46e5';
      } else if (showMelodyResults && practiceMode === 'full-melody') {
        const result = melodyResults.find((r, i) => i === absoluteIndex);
        if (result) {
          backgroundColor = result.isCorrect ? '#dcfce7' : '#fee2e2';
          borderColor = result.isCorrect ? '#22c55e' : '#ef4444';
          noteColor = result.isCorrect ? '#16a34a' : '#dc2626';
        }
      }

      noteElement.style.backgroundColor = backgroundColor;
      noteElement.style.border = `1px solid ${borderColor}`;

      const noteCircle = document.createElement('div');
      noteCircle.style.width = '30px';
      noteCircle.style.height = '30px';
      noteCircle.style.borderRadius = '50%';
      noteCircle.style.backgroundColor =
        practiceMode === 'note-by-note' && absoluteIndex === currentNoteIndex
          ? '#4f46e5'
          : showMelodyResults && practiceMode === 'full-melody'
          ? (() => {
              const result = melodyResults.find((r, i) => i === absoluteIndex);
              return result ? (result.isCorrect ? '#22c55e' : '#ef4444') : '#d1d5db';
            })()
          : '#d1d5db';
      noteCircle.style.display = 'flex';
      noteCircle.style.alignItems = 'center';
      noteCircle.style.justifyContent = 'center';
      noteCircle.style.color =
        (practiceMode === 'note-by-note' && absoluteIndex === currentNoteIndex) ||
        (showMelodyResults &&
          practiceMode === 'full-melody' &&
          melodyResults.find((r, i) => i === absoluteIndex))
          ? 'white'
          : 'black';
      noteCircle.style.fontWeight = 'bold';
      noteCircle.textContent = note.charAt(0);

      const noteText = document.createElement('div');
      noteText.style.marginTop = '5px';
      noteText.style.fontSize = '14px';
      noteText.style.fontWeight = 'bold';
      noteText.style.color = noteColor;
      noteText.textContent = note;

      const durationText = document.createElement('div');
      durationText.style.fontSize = '10px';
      durationText.style.color = '#666';
      durationText.textContent =
        displayDurations[index] === 'q'
          ? '♩'
          : displayDurations[index] === 'h'
          ? '𝅗𝅥'
          : displayDurations[index] === 'w'
          ? '𝅝'
          : '♩';

      noteElement.appendChild(noteCircle);
      noteElement.appendChild(noteText);
      noteElement.appendChild(durationText);
      container.appendChild(noteElement);
    });

    notationRef.current.appendChild(container);
    console.log('Rendered simple notation fallback');
  };

  // Add this function to handle moving to the next page
  const handleNextPage = () => {
    const exercise = filteredExercises[currentExercise];
    if (!exercise) return;

    const { totalPages } = calculatePagination(exercise);
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Add this function to handle moving to the previous page
  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Add this function to automatically jump to the page containing the current note
  const ensureCurrentNoteVisible = () => {
    const exercise = filteredExercises[currentExercise];
    if (!exercise) return;

    const { pageOfCurrentNote } = calculatePagination(exercise);
    if (pageOfCurrentNote !== currentPage) {
      setCurrentPage(pageOfCurrentNote ?? 0);
    }
  };

  // Count down before recording in full melody mode
  const startCountdown = () => {
    setCountdownActive(true);
    setCountdownCount(3);

    const countdownInterval = setInterval(() => {
      setCountdownCount(prev => {
        const newCount = prev - 1;
        if (newCount <= 0) {
          clearInterval(countdownInterval);
          setCountdownActive(false);
          toggleRecording(); // Start recording when countdown reaches zero
          return 0;
        }
        return newCount;
      });
    }, 1000);
  };

  // Add this useEffect to ensure the current note is always visible
  useEffect(() => {
    if (practiceMode === 'note-by-note') {
      ensureCurrentNoteVisible();
    }
  }, [currentNoteIndex, practiceMode]);

  useEffect(() => {
    setCurrentPage(0);
    setCurrentNoteIndex(0); // Reset to the first note
    setShowMelodyResults(false);
    setFeedback('');
  }, [selectedDifficulty, selectedExerciseType]);

  useEffect(() => {
    setCurrentNoteIndex(0);
    setCurrentPage(0);
    setShowMelodyResults(false);
    setFeedback('');
    setHasRecorded(false);
  }, [currentExercise]);

  useEffect(() => {
    // Reset states when changing practice mode
    setShowMelodyResults(false);
    setHasRecorded(false);
    setFeedback('');
    if (isRecording) {
      stopRecording();
    }
  }, [practiceMode]);

  // Update dependencies for the notation rendering useEffect
  useEffect(() => {
    console.log('Attempting to render notation');
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      renderNotation();
    }, 100);

    return () => clearTimeout(timer);
  }, [
    currentExercise,
    currentNoteIndex,
    selectedDifficulty,
    currentPage,
    practiceMode,
    showMelodyResults,
    melodyResults,
  ]);

  // Play the reference note (note-by-note mode) or full melody (full-melody mode)
  const playReferenceNote = async () => {
    if (isPlayingReference) return;

    setIsPlayingReference(true);

    try {
      await start(); // Start audio context
      const synth = new Synth().toDestination();

      // Get the current exercise
      const exercise = filteredExercises[currentExercise];

      if (practiceMode === 'note-by-note') {
        // Play just the current note
        const note = exercise.notes[currentNoteIndex];
        synth.triggerAttackRelease(note, '2n');

        // Set timeout to reset state
        setTimeout(() => {
          setIsPlayingReference(false);
        }, 1000);
      } else {
        // Play the full melody with appropriate timing
        const notes = exercise.notes;
        const durations = exercise.durations;

        // Convert durations to actual time values in milliseconds (assuming 60 BPM)
        const durationTimes = durations.map(d => {
          switch (d) {
            case 'w':
              return 4000; // whole note - 4 beats
            case 'h':
              return 2000; // half note - 2 beats
            case 'q':
              return 1000; // quarter note - 1 beat
            case 'e':
              return 500; // eighth note - 1/2 beat
            default:
              return 1000; // default to quarter note
          }
        });

        // Play each note in sequence
        let timeOffset = 0;

        notes.forEach((note, index) => {
          setTimeout(() => {
            synth.triggerAttackRelease(note, '8n');

            // If this is the last note, reset the playing state
            if (index === notes.length - 1) {
              setTimeout(() => {
                setIsPlayingReference(false);
              }, 500);
            }
          }, timeOffset);

          timeOffset += durationTimes[index];
        });
      }
    } catch (error) {
      console.error('Error playing reference note:', error);
      setIsPlayingReference(false);
    }
  };

  // Handle recording and pitch detection
  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      stopRecording();

      // In full melody mode, analyze the recorded notes
      if (practiceMode === 'full-melody') {
        analyzeRecordedMelody();
      }
    } else {
      // Reset recorded notes
      setRecordedNotes([]);
      setShowMelodyResults(false);

      // Start recording
      try {
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // Initialize audio context
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContext();

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        // Store references
        audioRef.current = {
          stream,
          audioContext,
          analyser,
          source,
        };

        // Update state
        setIsRecording(true);
        setMicPermission(true);

        // Start pitch detection based on practice mode
        if (practiceMode === 'note-by-note') {
          detectPitchNoteByNote();
        } else {
          detectPitchFullMelody();
        }
      } catch (error) {
        console.error('Error accessing microphone:', error);
        setMicPermission(false);
      }
    }
  };

  // Stop recording and clean up
  const stopRecording = () => {
    if (audioRef.current.animationFrame) {
      cancelAnimationFrame(audioRef.current.animationFrame);
    }

    if (audioRef.current.stream) {
      audioRef.current.stream.getTracks().forEach(track => track.stop());
    }

    if (audioRef.current.source) {
      audioRef.current.source.disconnect();
    }

    audioRef.current = {};
    setIsRecording(false);

    // Only set hasRecorded to true for note-by-note mode here
    // For full-melody mode, we'll set it after analysis is complete
    if (practiceMode === 'note-by-note') {
      setHasRecorded(true);
      // Get random accuracy between 80-100% for demo
      setAccuracy(Math.floor(Math.random() * 20) + 80);
    }
  };

  // Pitch detection for note-by-note mode
  const detectPitchNoteByNote = () => {
    const analyser = audioRef.current.analyser;
    if (!analyser) return;

    try {
      const detectPitch = Pitchfinder.YIN({
        sampleRate: audioRef.current.audioContext?.sampleRate || 44100,
      });
      const buffer = new Float32Array(analyser.fftSize);

      const updatePitch = () => {
        analyser.getFloatTimeDomainData(buffer);
        const pitch = detectPitch(buffer);

        if (pitch && pitch > 50 && pitch < 2000) {
          // Filter out unrealistic pitch values
          setDetectedPitch(pitch);
          const note = getNoteName(pitch);
          setDetectedNote(note);

          // Compare with expected note
          checkNoteAccuracy(note);
        }

        audioRef.current.animationFrame = requestAnimationFrame(updatePitch);
      };

      audioRef.current.animationFrame = requestAnimationFrame(updatePitch);
    } catch (error) {
      console.error('Error in pitch detection:', error);
      stopRecording();
    }
  };

  // Pitch detection for full melody mode
  const detectPitchFullMelody = () => {
    const analyser = audioRef.current.analyser;
    if (!analyser) return;

    try {
      const detectPitch = Pitchfinder.YIN({
        sampleRate: audioRef.current.audioContext?.sampleRate || 44100,
      });
      const buffer = new Float32Array(analyser.fftSize);

      // Variables to track note changes
      let lastDetectedNote = '';
      let lastNoteChangeTime = Date.now();
      const minNoteDuration = 300; // Minimum time (ms) to consider a new note

      const updatePitch = () => {
        analyser.getFloatTimeDomainData(buffer);
        const pitch = detectPitch(buffer);

        if (pitch && pitch > 50 && pitch < 2000) {
          // Valid pitch detected
          setDetectedPitch(pitch);
          const note = getNoteName(pitch);
          setDetectedNote(note);

          // Check if this is a new note or a continuation
          const currentTime = Date.now();
          if (note !== lastDetectedNote && currentTime - lastNoteChangeTime > minNoteDuration) {
            // This is a new note that's been stable for the minimum duration
            lastDetectedNote = note;
            lastNoteChangeTime = currentTime;

            // Add to recorded notes
            setRecordedNotes(prev => [
              ...prev,
              {
                note,
                timestamp: currentTime,
              },
            ]);
          }
        }

        audioRef.current.animationFrame = requestAnimationFrame(updatePitch);
      };

      audioRef.current.animationFrame = requestAnimationFrame(updatePitch);
    } catch (error) {
      console.error('Error in pitch detection:', error);
      stopRecording();
    }
  };

  // Analyze recorded melody
  const analyzeRecordedMelody = async () => {
    setIsAnalyzing(true);

    const exercise = filteredExercises[currentExercise];
    if (!exercise || recordedNotes.length === 0) {
      setFeedback('No notes were detected. Please try again.');
      setIsAnalyzing(false);
      return;
    }

    // Get expected notes from exercise
    const expectedNotes = exercise.notes;

    // Create results array with detected and expected notes
    const results = expectedNotes.map((expectedNote, index) => {
      // Find the corresponding sung note (if any)
      const sungNote = recordedNotes[index]?.note || 'Not sung';

      // Check if the sung note is correct (only comparing letter and octave)
      const isCorrect = sungNote !== 'Not sung' && compareNotes(expectedNote, sungNote);

      return {
        note: expectedNote,
        sung: sungNote,
        isCorrect,
      };
    });

    // Calculate accuracy
    const correctNotes = results.filter(r => r.isCorrect).length;
    const calculatedAccuracy = Math.round((correctNotes / expectedNotes.length) * 100);

    // Set state with results
    setMelodyResults(results);
    setShowMelodyResults(true);
    setAccuracy(calculatedAccuracy);

    // Set feedback message
    if (calculatedAccuracy >= 80) {
      setFeedback(
        `Excellent! You sang ${correctNotes} out of ${expectedNotes.length} notes correctly!`
      );
    } else if (calculatedAccuracy >= 60) {
      setFeedback(
        `Good job! You sang ${correctNotes} out of ${expectedNotes.length} notes correctly. Keep practicing!`
      );
    } else if (calculatedAccuracy >= 40) {
      setFeedback(
        `You sang ${correctNotes} out of ${expectedNotes.length} notes correctly. Practice more to improve.`
      );
    } else {
      setFeedback(
        `You sang ${correctNotes} out of ${expectedNotes.length} notes correctly. Try slowing down and listening carefully.`
      );
    }

    // Record exercise completion in the API
    try {
      await exerciseAPI.recordExerciseCompletion(
        'SightSinging',
        `${currentExercise}`,
        exercise.name,
        calculatedAccuracy,
        exercise.difficulty
      );

      // Update overall progress
      // Calculate new progress based on all completed exercises
      // This is a simplified approach; in a real app, you might want more sophisticated progress tracking
      let newProgress = calculatedAccuracy;
      if (userProgress && userProgress.exercises && userProgress.exercises.length > 0) {
        // Calculate average of all exercise scores
        const allScores = [...userProgress.exercises.map(ex => ex.score), calculatedAccuracy];
        newProgress = Math.round(
          allScores.reduce((sum, score) => sum + score, 0) / allScores.length
        );
      }

      await progressAPI.updateProgress('SightSinging', newProgress);

      // Check for Perfect Pitch achievement (100% accuracy)
      if (calculatedAccuracy === 100 && !perfectPitchUnlocked) {
        await achievementAPI.unlockAchievement(
          'Perfect Pitch',
          'Score 100% on a Sight Singing exercise',
          'award'
        );

        setPerfectPitchUnlocked(true);

        // Show achievement notification
        setTimeout(() => {
          alert('Achievement Unlocked: Perfect Pitch!');
        }, 1000);
      }
    } catch (err) {
      console.error('Failed to record exercise completion', err);
      // Non-blocking error - continue with the UI flow
    }

    setIsAnalyzing(false);
    setHasRecorded(true);
  };

  // Check if sung note matches expected note in note-by-note mode
  const checkNoteAccuracy = (detectedNote: string) => {
    const exercise = filteredExercises[currentExercise];
    const expectedNote = exercise.notes[currentNoteIndex];

    // Only the note letter and octave matter (ignoring # and b for simplicity)
    const detectedLetter = detectedNote.charAt(0);
    const detectedOctave = detectedNote.slice(-1);
    const expectedLetter = expectedNote.charAt(0);
    const expectedOctave = expectedNote.slice(-1);

    if (detectedLetter === expectedLetter && detectedOctave === expectedOctave) {
      // Correct note!
      setFeedback(`Great! You sang ${detectedNote} correctly!`);

      // Move to next note after a short delay
      setTimeout(() => {
        if (currentNoteIndex < exercise.notes.length - 1) {
          setCurrentNoteIndex(currentNoteIndex + 1);
        } else {
          // Exercise completed
          setFeedback('Exercise completed! Great job!');
          stopRecording();

          // Record exercise completion
          (async () => {
            try {
              // Recording a perfect score in note-by-note mode
              // (since we only advance when the note is correct)
              await exerciseAPI.recordExerciseCompletion(
                'SightSinging',
                `${currentExercise}`,
                `${exercise.name} (Note-by-Note)`,
                100, // Perfect score in note-by-note mode
                exercise.difficulty
              );

              // Update overall progress
              let newProgress = 100; // Perfect score for this exercise
              if (userProgress && userProgress.exercises && userProgress.exercises.length > 0) {
                // Calculate average of all exercise scores
                const allScores = [...userProgress.exercises.map(ex => ex.score), 100];
                newProgress = Math.round(
                  allScores.reduce((sum, score) => sum + score, 0) / allScores.length
                );
              }

              await progressAPI.updateProgress('SightSinging', newProgress);

              // Check for Perfect Pitch achievement
              if (!perfectPitchUnlocked) {
                await achievementAPI.unlockAchievement(
                  'Perfect Pitch',
                  'Score 100% on a Sight Singing exercise',
                  'award'
                );

                setPerfectPitchUnlocked(true);

                // Show achievement notification
                setTimeout(() => {
                  alert('Achievement Unlocked: Perfect Pitch!');
                }, 1000);
              }
            } catch (err) {
              console.error('Failed to record exercise completion', err);
            }
          })();
        }
      }, 1000);
    } else {
      // Incorrect note
      setFeedback(`Try singing ${expectedNote} (you sang ${detectedNote})`);
    }
  };

  // Change exercise
  const handleExerciseChange = (index: number) => {
    setCurrentExercise(index);
    setCurrentNoteIndex(0);
    setFeedback('');
    setHasRecorded(false);
    setShowMelodyResults(false);
    if (isRecording) {
      stopRecording();
    }
  };

  // Next exercise
  const handleNextExercise = () => {
    const nextExerciseIndex = (currentExercise + 1) % filteredExercises.length;
    handleExerciseChange(nextExerciseIndex);
  };

  // Waveform animation data (random for visual effect)
  const generateWaveform = () => {
    return Array.from({ length: 40 }, () => Math.random() * 0.8 + 0.2);
  };

  const waveform = generateWaveform();

  // Get the current recording button text based on practice mode
  const getRecordButtonText = () => {
    if (isRecording) {
      return 'Stop Recording';
    }

    if (practiceMode === 'note-by-note') {
      return 'Record Your Singing';
    } else {
      return 'Record Full Melody';
    }
  };

  return (
    <Layout backgroundClass="sound-wave-background">
      <motion.main
        className="container mx-auto py-8 px-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Page Header */}
        <motion.div
          className="bg-white rounded-lg shadow-sm p-6 flex justify-between items-center"
          variants={itemVariants}
        >
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Sight Singing</h2>
            <p className="text-gray-600">
              Practice singing musical notation with real-time feedback
            </p>
          </div>
          <div className="text-indigo-600">
            <Mic size={32} />
          </div>
        </motion.div>

        {/* Loading State */}
        {isLoading ? (
          <div className="mt-6 bg-white rounded-lg shadow-sm p-8 flex justify-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-t-2 border-r-2 border-amber-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600">Loading your sight singing data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Difficulty Selection */}
            <motion.div className="mt-6 bg-white rounded-lg shadow-sm p-6" variants={itemVariants}>
              <div className="flex items-center">
                <span className="font-semibold text-gray-700 mr-4">Difficulty:</span>
                <div className="flex space-x-3">
                  <motion.button
                    className={`py-1.5 px-6 rounded-full ${
                      selectedDifficulty === 'Easy'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                    } text-sm font-medium`}
                    whileHover={{
                      scale: 1.05,
                      backgroundColor: selectedDifficulty === 'Easy' ? '#4338ca' : '#f3f4f6',
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedDifficulty('Easy')}
                  >
                    Easy
                  </motion.button>
                  <motion.button
                    className={`py-1.5 px-6 rounded-full ${
                      selectedDifficulty === 'Medium'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                    } text-sm font-medium`}
                    whileHover={{
                      scale: 1.05,
                      backgroundColor: selectedDifficulty === 'Medium' ? '#4338ca' : '#f3f4f6',
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedDifficulty('Medium')}
                  >
                    Medium
                  </motion.button>
                  <motion.button
                    className={`py-1.5 px-6 rounded-full ${
                      selectedDifficulty === 'Hard'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                    } text-sm font-medium`}
                    whileHover={{
                      scale: 1.05,
                      backgroundColor: selectedDifficulty === 'Hard' ? '#4338ca' : '#f3f4f6',
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedDifficulty('Hard')}
                  >
                    Hard
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Exercise Type Selection */}
            <motion.div className="mt-4 bg-white rounded-lg shadow-sm p-6" variants={itemVariants}>
              <div className="flex items-center flex-wrap">
                <span className="font-semibold text-gray-700 mr-4 mb-2">Exercise Type:</span>
                <div className="flex flex-wrap gap-3">
                  <motion.button
                    className={`py-1.5 px-6 rounded-full ${
                      selectedExerciseType === 'All'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                    } text-sm font-medium`}
                    whileHover={{
                      scale: 1.05,
                      backgroundColor: selectedExerciseType === 'All' ? '#4338ca' : '#f3f4f6',
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedExerciseType('All')}
                  >
                    All
                  </motion.button>
                  <motion.button
                    className={`py-1.5 px-6 rounded-full ${
                      selectedExerciseType === 'Notes'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                    } text-sm font-medium`}
                    whileHover={{
                      scale: 1.05,
                      backgroundColor: selectedExerciseType === 'Notes' ? '#4338ca' : '#f3f4f6',
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedExerciseType('Notes')}
                  >
                    Notes
                  </motion.button>
                  <motion.button
                    className={`py-1.5 px-6 rounded-full ${
                      selectedExerciseType === 'Intervals'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                    } text-sm font-medium`}
                    whileHover={{
                      scale: 1.05,
                      backgroundColor: selectedExerciseType === 'Intervals' ? '#4338ca' : '#f3f4f6',
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedExerciseType('Intervals')}
                  >
                    Intervals
                  </motion.button>
                  <motion.button
                    className={`py-1.5 px-6 rounded-full ${
                      selectedExerciseType === 'Scales'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                    } text-sm font-medium`}
                    whileHover={{
                      scale: 1.05,
                      backgroundColor: selectedExerciseType === 'Scales' ? '#4338ca' : '#f3f4f6',
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedExerciseType('Scales')}
                  >
                    Scales
                  </motion.button>
                  <motion.button
                    className={`py-1.5 px-6 rounded-full ${
                      selectedExerciseType === 'Melody'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                    } text-sm font-medium`}
                    whileHover={{
                      scale: 1.05,
                      backgroundColor: selectedExerciseType === 'Melody' ? '#4338ca' : '#f3f4f6',
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedExerciseType('Melody')}
                  >
                    Melody
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Practice Mode Selection */}
            <motion.div className="mt-4 bg-white rounded-lg shadow-sm p-6" variants={itemVariants}>
              <div className="flex flex-col sm:flex-row items-center justify-between">
                <span className="font-semibold text-gray-700 mb-3 sm:mb-0">Practice Mode:</span>
                <div className="flex bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
                  <button
                    className={`flex-1 sm:flex-initial px-4 py-2 rounded-md text-sm flex items-center justify-center ${
                      practiceMode === 'note-by-note'
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setPracticeMode('note-by-note')}
                  >
                    <List size={16} className="mr-2" />
                    Note by Note
                  </button>
                  <button
                    className={`flex-1 sm:flex-initial px-4 py-2 rounded-md text-sm flex items-center justify-center ${
                      practiceMode === 'full-melody'
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setPracticeMode('full-melody')}
                  >
                    <Music size={16} className="mr-2" />
                    Full Melody
                  </button>
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-500">
                {practiceMode === 'note-by-note'
                  ? 'Note-by-Note: Get feedback on each note as you sing. Good for beginners.'
                  : 'Full Melody: Sing the entire melody at once. Best for building musical fluency.'}
              </div>
            </motion.div>

            {/* Display any API errors */}
            {error && (
              <motion.div
                className="mt-4 bg-red-50 p-4 rounded-md text-red-600 text-sm"
                variants={itemVariants}
              >
                {error}
              </motion.div>
            )}

            {/* Music Notation */}
            <motion.div className="mt-6 bg-white rounded-lg shadow-sm p-6" variants={itemVariants}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-700">
                  {practiceMode === 'note-by-note'
                    ? `Sing This Note: ${filteredExercises[currentExercise]?.notes[currentNoteIndex]}`
                    : `Sing This ${
                        selectedExerciseType === 'All'
                          ? filteredExercises[currentExercise]?.exerciseType
                          : selectedExerciseType
                      }:`}
                </h3>
                <motion.button
                  className="text-indigo-600 p-2 rounded-full hover:bg-indigo-50 flex items-center"
                  whileTap={{ scale: 0.95 }}
                  onClick={playReferenceNote}
                  disabled={isPlayingReference}
                >
                  <Play size={16} />
                  <span className="ml-1 text-sm">
                    {practiceMode === 'note-by-note' ? 'Play Reference Note' : 'Play Full Melody'}
                  </span>
                </motion.button>
              </div>

              <div className="bg-gray-50 p-4 rounded-md mb-4">
                {/* Notation will be rendered here */}
                <div ref={notationRef} className="w-full overflow-x-auto h-32"></div>

                {/* Countdown overlay */}
                {countdownActive && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-md">
                    <div className="text-white text-5xl font-bold">{countdownCount}</div>
                  </div>
                )}

                {filteredExercises[currentExercise]?.notes.length > 4 && (
                  <div className="flex justify-between items-center mt-3">
                    <button
                      className={`px-3 py-1 rounded text-sm ${
                        currentPage > 0
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                      onClick={handlePrevPage}
                      disabled={currentPage === 0}
                    >
                      ← Previous
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage + 1} of{' '}
                      {Math.ceil(filteredExercises[currentExercise]?.notes.length / 4)}
                    </span>
                    <button
                      className={`px-3 py-1 rounded text-sm ${
                        currentPage <
                        Math.ceil(filteredExercises[currentExercise]?.notes.length / 4) - 1
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                      onClick={handleNextPage}
                      disabled={
                        currentPage >=
                        Math.ceil(filteredExercises[currentExercise]?.notes.length / 4) - 1
                      }
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>

              <div className="text-center text-gray-500 text-sm">
                {filteredExercises.length > 0 ? (
                  <p>
                    Exercise: {filteredExercises[currentExercise]?.name}
                    {practiceMode === 'note-by-note' && (
                      <>
                        {' '}
                        - Note {currentNoteIndex + 1} of{' '}
                        {filteredExercises[currentExercise]?.notes.length}
                      </>
                    )}
                  </p>
                ) : (
                  <p>No exercises available for the selected difficulty and type</p>
                )}
              </div>
            </motion.div>

            {/* Recording Interface */}
            <motion.div className="mt-6 bg-white rounded-lg shadow-sm p-6" variants={itemVariants}>
              <div className="flex flex-wrap justify-between items-start">
                {/* Microphone Button */}
                <div className="flex flex-col items-center mr-4">
                  {practiceMode === 'full-melody' && !isRecording ? (
                    <motion.button
                      className="w-20 h-20 rounded-full flex items-center justify-center shadow-md bg-red-500 hover:bg-red-600"
                      onClick={startCountdown}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={micPermission === false || countdownActive}
                    >
                      <Mic className="text-white" size={32} />
                    </motion.button>
                  ) : (
                    <motion.button
                      className={`w-20 h-20 rounded-full flex items-center justify-center shadow-md ${
                        isRecording ? 'bg-red-600' : 'bg-red-500 hover:bg-red-600'
                      }`}
                      onClick={toggleRecording}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={micPermission === false}
                    >
                      {isRecording ? (
                        <Square className="text-white" size={32} />
                      ) : (
                        <Mic className="text-white" size={32} />
                      )}
                    </motion.button>
                  )}
                  <span className="mt-2 text-gray-600 text-sm whitespace-nowrap">
                    {countdownActive ? `Starting in ${countdownCount}...` : getRecordButtonText()}
                  </span>
                </div>

                {/* Voice Visualization */}
                <div className="flex-1 mx-4">
                  <div className="bg-gray-100 p-3 rounded-md h-20 flex items-center justify-center">
                    {isRecording ? (
                      <div className="flex items-center h-full gap-1">
                        {waveform.map((value, i) => (
                          <motion.div
                            key={i}
                            className="w-1.5 bg-indigo-500 rounded-full"
                            initial={{ height: 5 }}
                            animate={{
                              height: value * 60,
                            }}
                            transition={{
                              duration: 0.2,
                              repeat: Infinity,
                              repeatType: 'reverse',
                              delay: i * 0.01,
                            }}
                          />
                        ))}
                      </div>
                    ) : hasRecorded ? (
                      <div className="flex items-center h-full gap-1">
                        {waveform.map((value, i) => (
                          <div
                            key={i}
                            className="w-1.5 bg-gray-400 rounded-full"
                            style={{ height: `${value * 60}px` }}
                          />
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Your recording will appear here</span>
                    )}
                  </div>
                  <div className="mt-2 text-center text-gray-500 text-sm">
                    {hasRecorded ? 'Your Recording' : 'Ready to record'}
                  </div>
                </div>

                {/* Score Display */}
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 w-48">
                  <AnimatePresence>
                    {hasRecorded && (
                      <motion.div
                        className="flex flex-col items-center"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      >
                        <motion.div
                          className="text-4xl font-bold text-indigo-600"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          {accuracy}%
                        </motion.div>
                        <div className="text-sm text-gray-500">Accuracy</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {!hasRecorded && (
                    <div className="h-16 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">Record to see your score</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Detected Note and Feedback */}
              <div className="mt-4 flex flex-col sm:flex-row justify-between">
                <div className="bg-gray-50 p-3 rounded-md text-center sm:w-1/3 mb-3 sm:mb-0">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Detected Note</h4>
                  <div className="text-xl font-semibold text-indigo-600">{detectedNote}</div>
                  {detectedPitch && (
                    <div className="text-xs text-gray-500">{detectedPitch.toFixed(1)} Hz</div>
                  )}
                </div>

                <div className="bg-gray-50 p-3 rounded-md flex-1 text-center">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Feedback</h4>
                  <div className="text-indigo-600">
                    {feedback ||
                      (isRecording
                        ? practiceMode === 'note-by-note'
                          ? `Sing the highlighted note: ${filteredExercises[currentExercise]?.notes[currentNoteIndex]}`
                          : 'Sing the entire melody'
                        : 'Press Record to start singing')}
                  </div>
                </div>
              </div>

              {/* Achievement Status */}
              {perfectPitchUnlocked && (
                <div className="mt-4 bg-yellow-50 p-3 rounded-md flex items-center">
                  <div className="bg-yellow-100 p-2 rounded-full mr-3">
                    <Award size={20} className="text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-yellow-800">
                      Achievement Unlocked: Perfect Pitch
                    </h4>
                    <p className="text-sm text-yellow-700">
                      You've earned the Perfect Pitch achievement by scoring 100% on a sight singing
                      exercise!
                    </p>
                  </div>
                </div>
              )}

              {/* Melody Results Table (only in full-melody mode when results are available) */}
              {practiceMode === 'full-melody' && showMelodyResults && (
                <div className="mt-4 overflow-x-auto">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Melody Performance:</h4>
                  <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Note #
                        </th>
                        <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Expected Note
                        </th>
                        <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Your Note
                        </th>
                        <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Result
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {melodyResults.map((result, index) => (
                        <tr key={index}>
                          <td className="py-2 px-4 whitespace-nowrap text-sm text-gray-900">
                            {index + 1}
                          </td>
                          <td className="py-2 px-4 whitespace-nowrap text-sm text-gray-900">
                            {result.note}
                          </td>
                          <td className="py-2 px-4 whitespace-nowrap text-sm text-gray-900">
                            {result.sung}
                          </td>
                          <td className="py-2 px-4 whitespace-nowrap text-sm">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                result.isCorrect
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {result.isCorrect ? 'Correct' : 'Incorrect'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Microphone Permission Error */}
              {micPermission === false && (
                <div className="mt-4 bg-red-50 text-red-600 p-4 rounded-md">
                  <p className="font-medium">Microphone access denied</p>
                  <p className="text-sm">
                    Please allow microphone access in your browser settings to use this feature.
                  </p>
                </div>
              )}
            </motion.div>

            {/* Exercise Selection and Navigation */}
            <motion.div className="mt-6 bg-white rounded-lg shadow-sm p-6" variants={itemVariants}>
              <h3 className="font-semibold text-gray-700 mb-3">Select Exercise:</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {filteredExercises.map((exercise, index) => (
                  <motion.button
                    key={index}
                    className={`p-3 rounded-md text-left ${
                      currentExercise === index
                        ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleExerciseChange(index)}
                  >
                    <div className="font-medium">{exercise.name}</div>
                    <div className="text-xs mt-1 text-gray-500">
                      {exercise.exerciseType} · {exercise.difficulty}
                    </div>
                  </motion.button>
                ))}
              </div>

              {filteredExercises.length === 0 && (
                <div className="text-center p-8 text-gray-500">
                  No exercises available for the selected criteria. Try changing the difficulty or
                  exercise type.
                </div>
              )}

              {/* Navigation Button */}
              <div className="flex justify-end">
                <motion.button
                  className={`bg-indigo-600 text-white py-2 px-6 rounded-lg flex items-center font-medium ${
                    !hasRecorded ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  whileHover={{ backgroundColor: '#4338ca' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNextExercise}
                  disabled={!hasRecorded}
                >
                  Next Exercise
                  <ChevronRight size={16} className="ml-1" />
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </motion.main>
    </Layout>
  );
};

export default SightSingingPage;
