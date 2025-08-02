// src/pages/SightSingingPage.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
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
    name: 'Medium Intervals',
    notes: ['C4', 'E4', 'G4', 'E4', 'A4', 'F4', 'D4'],
    durations: ['q', 'q', 'q', 'q', 'q', 'q', 'h'],
    difficulty: 'Medium',
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
  const calculatePagination = useCallback(
    (exercise: any) => {
      if (!exercise) return { totalPages: 1, notesPerPage: 4 };

      const beatsPerPage = 4; // Target 4 beats per page (standard 4/4 measure)
      const notes = exercise.notes;
      const durations = exercise.durations;

      // Calculate where to break pages based on accumulated beats
      let currentBeats = 0;
      const pageBreakIndices: any[] = [];

      durations.forEach((duration: string, index: any) => {
        let beatValue = 1; // Default quarter note
        switch (duration) {
          case 'w':
            beatValue = 4;
            break; // Whole note
          case 'h':
            beatValue = 2;
            break; // Half note
          case 'q':
            beatValue = 1;
            break; // Quarter note
          case 'e':
            beatValue = 0.5;
            break; // Eighth note
          default:
            beatValue = 1;
            break;
        }

        // If adding this note would exceed the beats per page, add a page break
        if (currentBeats + beatValue > beatsPerPage && index > 0) {
          pageBreakIndices.push(index);
          currentBeats = beatValue; // Reset with current note
        } else {
          currentBeats += beatValue;
        }
      });

      // Add final page break if needed
      if (
        pageBreakIndices.length === 0 ||
        pageBreakIndices[pageBreakIndices.length - 1] !== notes.length
      ) {
        pageBreakIndices.push(notes.length);
      }

      // Find which page contains the current note
      let pageOfCurrentNote = 0;
      for (let i = 0; i < pageBreakIndices.length; i++) {
        if (currentNoteIndex < pageBreakIndices[i]) {
          pageOfCurrentNote = i;
          break;
        }
      }

      // Calculate start and end indices for the current page
      const startIndex = currentPage === 0 ? 0 : pageBreakIndices[currentPage - 1];
      const endIndex = pageBreakIndices[currentPage] || notes.length;

      return {
        totalPages: pageBreakIndices.length,
        pageOfCurrentNote,
        startIndex,
        endIndex,
      };
    },
    [currentNoteIndex, currentPage]
  );

  // Update the renderSimpleNotation function
  const renderSimpleNotation = useCallback(() => {
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
  }, [
    calculatePagination,
    currentExercise,
    currentNoteIndex,
    filteredExercises,
    melodyResults,
    practiceMode,
    showMelodyResults,
  ]);

  const renderNotation = useCallback(() => {
    if (!notationRef.current) {
      console.error('Notation ref is not available');
      return;
    }

    try {
      // Clear previous notation
      notationRef.current.innerHTML = '';

      // Check if we have exercises to render
      if (filteredExercises.length === 0) {
        console.warn('No exercises available to render');
        notationRef.current.innerHTML =
          '<div class="p-4 text-gray-500">No exercises available</div>';
        return;
      }

      // Get current exercise with additional safety check
      const exercise = filteredExercises[currentExercise];
      if (!exercise) {
        console.error('No exercise found for index:', currentExercise);
        notationRef.current.innerHTML = '<div class="p-4 text-gray-500">Exercise not found</div>';
        return;
      }

      // Get pagination info
      const { startIndex, endIndex } = calculatePagination(exercise);

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

      try {
        // Create notes with annotations
        const notes = displayNotes.map((note, index) => {
          const absoluteIndex = (startIndex ?? 0) + index;
          const vfNote = new Vex.StaveNote({
            keys: [noteToVexflow(note)],
            duration: displayDurations[index],
          });

          // In note-by-note mode, highlight the current note
          if (practiceMode === 'note-by-note' && absoluteIndex === currentNoteIndex) {
            vfNote.setStyle({ fillStyle: 'blue', strokeStyle: 'blue' });
          }

          // Add note name annotation below the note
          const annotation = new Vex.Annotation(note);
          annotation.setText(note);
          annotation.setVerticalJustification(Vex.Annotation.VerticalJustify.BOTTOM);

          vfNote.addModifier(annotation);
          return vfNote;
        });

        // Fix for "Too many ticks" error - use a more flexible voice setup
        // Creating a voice without strict time constraints
        const voice = new Vex.Voice({
          numBeats: 4,
          beatValue: 4,
        });

        // Use setStrict(false) instead of setMode(SOFT) for newer VexFlow versions
        voice.setStrict(false);

        // Add the notes to the voice
        voice.addTickables(notes);

        // Format and draw
        new Vex.Formatter().joinVoices([voice]).format([voice], 400);

        voice.draw(context, stave);

        console.log('Successfully rendered notation');
      } catch (err) {
        console.error('Error creating notes or voice:', err);
        throw err; // Re-throw to trigger fallback
      }
    } catch (error) {
      console.error('Error rendering notation:', error);
      // Fallback to simple representation if VexFlow fails
      renderSimpleNotation();
    }
  }, [
    calculatePagination,
    currentExercise,
    currentNoteIndex,
    filteredExercises,
    practiceMode,
    renderSimpleNotation,
  ]);

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

    // Increase the delay to give DOM more time to fully initialize
    const timer = setTimeout(() => {
      if (notationRef.current) {
        // Force a clear of any previous content
        notationRef.current.innerHTML = '';

        // Small additional delay to ensure DOM is really ready
        setTimeout(() => {
          renderNotation();
        }, 50);
      }
    }, 300); // Increased from 100ms to 300ms

    return () => clearTimeout(timer);
  }, [
    currentExercise,
    currentNoteIndex,
    selectedDifficulty,
    currentPage,
    practiceMode,
    showMelodyResults,
    melodyResults,
    renderNotation,
  ]);

  useEffect(() => {
    // Force a re-render after component mount
    const initialRenderTimer = setTimeout(() => {
      // This small state update will trigger a re-render
      setCurrentPage(0);
    }, 500);

    return () => clearTimeout(initialRenderTimer);
  }, []); // Empty dependency array means this runs once on mount

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
    <Layout backgroundClass="">
      {/* Floating musical notes background */}
      <div className="floating-notes">
        <div className="note">🎵</div>
        <div className="note">🎶</div>
        <div className="note">🎼</div>
        <div className="note">🎹</div>
        <div className="note">🎺</div>
        <div className="note">🎸</div>
        <div className="note">🥁</div>
        <div className="note">🎤</div>
      </div>

      <motion.main
        className="py-8 px-4"
        style={{
          maxWidth: '1000px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 10
        }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Page Header */}
        <motion.div
          className="kid-welcome-section"
          variants={itemVariants}
        >
          <h1 className="kid-title text-4xl md:text-5xl mb-4" style={{ position: 'relative', zIndex: 2 }}>
            🎤 Singing Star Studio! ✨
          </h1>
          <div className="musical-icon">🎆</div>
          <p className="kid-subtitle text-xl" style={{ position: 'relative', zIndex: 2 }}>
            Sing along with the notes and watch them light up! Become the next big singing sensation!
          </p>
        </motion.div>

        {/* Loading State */}
        {isLoading ? (
          <div className="kid-welcome-section flex justify-center">
            <div className="flex flex-col items-center" style={{ position: 'relative', zIndex: 2 }}>
              <div className="w-12 h-12 border-t-4 border-r-4 border-pink-500 rounded-full animate-spin mb-4"></div>
              <p className="kid-subtitle text-lg">Getting your singing stage ready... 🎤✨</p>
            </div>
          </div>
        ) : (
          <>
            {/* Difficulty Selection */}
            <motion.div className="kid-welcome-section" variants={itemVariants}>
              <div className="text-center" style={{ position: 'relative', zIndex: 2 }}>
                <h3 className="activity-title text-2xl mb-4">🎆 Choose Your Challenge Level! 🎆</h3>
                <div className="flex justify-center flex-wrap gap-4">
                  <motion.button
                    className="kid-button"
                    style={{
                      background: selectedDifficulty === 'Easy'
                        ? 'linear-gradient(45deg, #95E1D3, #4ECDC4)'
                        : 'linear-gradient(45deg, #E5E5E5, #CCCCCC)',
                      opacity: selectedDifficulty === 'Easy' ? 1 : 0.7
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedDifficulty('Easy')}
                  >
                    🌱 Easy Peasy!
                  </motion.button>
                  <motion.button
                    className="kid-button"
                    style={{
                      background: selectedDifficulty === 'Medium'
                        ? 'linear-gradient(45deg, #FFE66D, #FF6B9D)'
                        : 'linear-gradient(45deg, #E5E5E5, #CCCCCC)',
                      opacity: selectedDifficulty === 'Medium' ? 1 : 0.7
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedDifficulty('Medium')}
                  >
                    🎆 Medium Fun!
                  </motion.button>
                  <motion.button
                    className="kid-button"
                    style={{
                      background: selectedDifficulty === 'Hard'
                        ? 'linear-gradient(45deg, #FF6B9D, #9B59B6)'
                        : 'linear-gradient(45deg, #E5E5E5, #CCCCCC)',
                      opacity: selectedDifficulty === 'Hard' ? 1 : 0.7
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedDifficulty('Hard')}
                  >
                    🔥 Super Challenge!
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Exercise Type Selection */}
            <motion.div className="kid-welcome-section" variants={itemVariants}>
              <div className="text-center" style={{ position: "relative", zIndex: 2 }}>
                <h3 className="activity-title text-2xl mb-4">🎵 Pick Your Singing Adventure! 🎵</h3>
                <div className="flex justify-center flex-wrap gap-3">
                  <motion.button
                    className="kid-button"
                    style={{
                      background: selectedExerciseType === "All"
                        ? "linear-gradient(45deg, #FF6B9D, #FFE66D)"
                        : "linear-gradient(45deg, #E5E5E5, #CCCCCC)",
                      opacity: selectedExerciseType === "All" ? 1 : 0.7,
                      fontSize: "0.9rem",
                      padding: "0.75rem 1.5rem"
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedExerciseType("All")}
                  >
                    🌈 Everything!
                  </motion.button>
                  <motion.button
                    className="kid-button"
                    style={{
                      background: selectedExerciseType === "Notes"
                        ? "linear-gradient(45deg, #4ECDC4, #95E1D3)"
                        : "linear-gradient(45deg, #E5E5E5, #CCCCCC)",
                      opacity: selectedExerciseType === "Notes" ? 1 : 0.7,
                      fontSize: "0.9rem",
                      padding: "0.75rem 1.5rem"
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedExerciseType("Notes")}
                  >
                    🎵 Single Notes
                  </motion.button>
                  <motion.button
                    className="kid-button"
                    style={{
                      background: selectedExerciseType === "Intervals"
                        ? "linear-gradient(45deg, #FFE66D, #95E1D3)"
                        : "linear-gradient(45deg, #E5E5E5, #CCCCCC)",
                      opacity: selectedExerciseType === "Intervals" ? 1 : 0.7,
                      fontSize: "0.9rem",
                      padding: "0.75rem 1.5rem"
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedExerciseType("Intervals")}
                  >
                    🎶 Note Jumps
                  </motion.button>
                  <motion.button
                    className="kid-button"
                    style={{
                      background: selectedExerciseType === "Scales"
                        ? "linear-gradient(45deg, #95E1D3, #FF6B9D)"
                        : "linear-gradient(45deg, #E5E5E5, #CCCCCC)",
                      opacity: selectedExerciseType === "Scales" ? 1 : 0.7,
                      fontSize: "0.9rem",
                      padding: "0.75rem 1.5rem"
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedExerciseType("Scales")}
                  >
                    🎼 Note Ladders
                  </motion.button>
                  <motion.button
                    className="kid-button"
                    style={{
                      background: selectedExerciseType === "Melody"
                        ? "linear-gradient(45deg, #9B59B6, #FFE66D)"
                        : "linear-gradient(45deg, #E5E5E5, #CCCCCC)",
                      opacity: selectedExerciseType === "Melody" ? 1 : 0.7,
                      fontSize: "0.9rem",
                      padding: "0.75rem 1.5rem"
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedExerciseType("Melody")}
                  >
                    🎵 Fun Songs
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Practice Mode Selection */}
            <motion.div className="kid-welcome-section" variants={itemVariants}>
              <div className="text-center" style={{ position: "relative", zIndex: 2 }}>
                <h3 className="activity-title text-2xl mb-4">🎯 Choose Your Practice Style! 🎯</h3>
                <div className="flex justify-center flex-wrap gap-4 mb-4">
                  <motion.button
                    className="kid-button"
                    style={{
                      background: practiceMode === "note-by-note"
                        ? "linear-gradient(45deg, #4ECDC4, #95E1D3)"
                        : "linear-gradient(45deg, #E5E5E5, #CCCCCC)",
                      opacity: practiceMode === "note-by-note" ? 1 : 0.7
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPracticeMode("note-by-note")}
                  >
                    🎵 One Note at a Time!
                  </motion.button>
                  <motion.button
                    className="kid-button"
                    style={{
                      background: practiceMode === "full-melody"
                        ? "linear-gradient(45deg, #FFE66D, #FF6B9D)"
                        : "linear-gradient(45deg, #E5E5E5, #CCCCCC)",
                      opacity: practiceMode === "full-melody" ? 1 : 0.7
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPracticeMode("full-melody")}
                  >
                    🎶 Whole Song!
                  </motion.button>
                </div>
                <div className="bg-white bg-opacity-80 rounded-2xl px-4 py-2 inline-block">
                  <p className="kid-subtitle text-sm">
                    {practiceMode === "note-by-note"
                      ? "🌟 Perfect for beginners! Get help with each note!"
                      : "🚀 Ready for a challenge? Sing the whole melody!"}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Display any API errors */}
            {error && (
              <motion.div
                className="kid-welcome-section"
                variants={itemVariants}
              >
                <div className="text-center" style={{ position: 'relative', zIndex: 2 }}>
                  <p className="kid-subtitle text-lg font-bold text-red-600">
                    😅 {error}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Music Notation */}
            <motion.div className="kid-welcome-section" variants={itemVariants}>
              <div className="flex justify-between items-center mb-4" style={{ position: 'relative', zIndex: 2 }}>
                <h3 className="activity-title text-2xl">
                  {practiceMode === 'note-by-note'
                    ? `🎵 Sing This Note: ${filteredExercises[currentExercise]?.notes[currentNoteIndex]} 🎵`
                    : `🎶 Sing This ${
                        selectedExerciseType === 'All'
                          ? filteredExercises[currentExercise]?.exerciseType
                          : selectedExerciseType
                      }! 🎶`}
                </h3>
                <motion.button
                  className="kid-button"
                  style={{
                    background: 'linear-gradient(45deg, #4ECDC4, #95E1D3)',
                    fontSize: '0.9rem',
                    padding: '0.75rem 1.5rem',
                    opacity: isPlayingReference ? 0.5 : 1
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={playReferenceNote}
                  disabled={isPlayingReference}
                >
                  {practiceMode === 'note-by-note' ? '🎵 Hear the Note!' : '🎶 Play Full Song!'}
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

                {filteredExercises[currentExercise]?.notes.length > 4 && (() => {
                  const { totalPages } = calculatePagination(filteredExercises[currentExercise]);
                  const isLastPage = currentPage >= totalPages - 1;
                  const isFirstPage = currentPage === 0;
                  
                  return (
                    <div className="flex justify-between items-center mt-3">
                      <motion.button
                        className={`kid-button text-sm ${
                          isFirstPage
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                        }`}
                        style={{
                          background: !isFirstPage 
                            ? 'linear-gradient(45deg, #FF6B9D, #FFE66D)' 
                            : 'linear-gradient(45deg, #9CA3AF, #6B7280)',
                          fontSize: '0.9rem',
                          padding: '0.5rem 1rem'
                        }}
                        whileHover={{ scale: !isFirstPage ? 1.05 : 1 }}
                        whileTap={{ scale: !isFirstPage ? 0.95 : 1 }}
                        onClick={handlePrevPage}
                        disabled={isFirstPage}
                      >
                        ← Previous Page
                      </motion.button>
                      <span className="kid-subtitle font-bold">
                        🎵 Page {currentPage + 1} of {totalPages} 🎵
                      </span>
                      <motion.button
                        className={`kid-button text-sm ${
                          isLastPage
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                        }`}
                        style={{
                          background: !isLastPage
                            ? 'linear-gradient(45deg, #FF6B9D, #FFE66D)' 
                            : 'linear-gradient(45deg, #9CA3AF, #6B7280)',
                          fontSize: '0.9rem',
                          padding: '0.5rem 1rem'
                        }}
                        whileHover={{ scale: !isLastPage ? 1.05 : 1 }}
                        whileTap={{ scale: !isLastPage ? 0.95 : 1 }}
                        onClick={handleNextPage}
                        disabled={isLastPage}
                      >
                        Next Page →
                      </motion.button>
                    </div>
                  );
                })()}
              </div>

              <div className="text-center" style={{ position: 'relative', zIndex: 2 }}>
                {filteredExercises.length > 0 ? (
                  <p className="kid-subtitle font-bold">
                    🎼 Exercise: {filteredExercises[currentExercise]?.name} 🎼
                    {practiceMode === 'note-by-note' && (
                      <>
                        {' '}
                        🎵 Note {currentNoteIndex + 1} of{' '}
                        {filteredExercises[currentExercise]?.notes.length} 🎵
                      </>
                    )}
                  </p>
                ) : (
                  <p className="kid-subtitle font-bold text-red-600">
                    😅 No musical adventures available for the selected settings! Try different options! 🎯
                  </p>
                )}
              </div>
            </motion.div>

            {/* Recording Interface */}
            <motion.div className="kid-welcome-section" variants={itemVariants}>
              <h3 className="activity-title text-center mb-6" style={{ position: 'relative', zIndex: 2 }}>🎤 Time to Sing Your Heart Out! 🎤</h3>
              <div className="flex flex-wrap justify-between items-start" style={{ position: 'relative', zIndex: 2 }}>
                {/* Microphone Button */}
                <div className="flex flex-col items-center mr-4">
                  {practiceMode === 'full-melody' && !isRecording ? (
                    <motion.button
                      className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
                      style={{
                        background: micPermission === false || countdownActive 
                          ? 'linear-gradient(45deg, #9CA3AF, #6B7280)'
                          : 'linear-gradient(45deg, #FF6B9D, #FFE66D)',
                        opacity: micPermission === false || countdownActive ? 0.5 : 1
                      }}
                      onClick={startCountdown}
                      whileHover={{ scale: micPermission === false || countdownActive ? 1 : 1.1 }}
                      whileTap={{ scale: micPermission === false || countdownActive ? 1 : 0.95 }}
                      disabled={micPermission === false || countdownActive}
                    >
                      <Mic className="text-white" size={32} />
                    </motion.button>
                  ) : (
                    <motion.button
                      className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
                      style={{
                        background: micPermission === false 
                          ? 'linear-gradient(45deg, #9CA3AF, #6B7280)'
                          : isRecording 
                            ? 'linear-gradient(45deg, #EF4444, #DC2626)'
                            : 'linear-gradient(45deg, #FF6B9D, #FFE66D)',
                        opacity: micPermission === false ? 0.5 : 1
                      }}
                      onClick={toggleRecording}
                      whileHover={{ scale: micPermission === false ? 1 : 1.1 }}
                      whileTap={{ scale: micPermission === false ? 1 : 0.95 }}
                      disabled={micPermission === false}
                    >
                      {isRecording ? (
                        <Square className="text-white" size={32} />
                      ) : (
                        <Mic className="text-white" size={32} />
                      )}
                    </motion.button>
                  )}
                  <span className="mt-2 kid-subtitle font-bold text-center">
                    {countdownActive ? `✨ Starting in ${countdownCount}... ✨` : getRecordButtonText()}
                  </span>
                </div>

                {/* Voice Visualization */}
                <div className="flex-1 mx-4">
                  <div className="bg-white bg-opacity-80 p-4 rounded-2xl border-4 border-pink-200 h-24 flex items-center justify-center shadow-lg">
                    {isRecording ? (
                      <div className="flex items-center h-full gap-1">
                        {waveform.map((value, i) => (
                          <motion.div
                            key={i}
                            className="w-1.5 rounded-full"
                            style={{ backgroundColor: '#FF6B9D' }}
                            initial={{ height: 5 }}
                            animate={{
                              height: value * 60,
                              backgroundColor: [
                                '#FF6B9D',
                                '#4ECDC4',
                                '#FFE66D',
                              ],
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
                            className="w-1.5 rounded-full"
                            style={{ 
                              height: `${value * 60}px`,
                              backgroundColor: '#4ECDC4'
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <span className="kid-subtitle font-bold text-gray-600">🎵 Your magical voice waves will appear here! 🎵</span>
                    )}
                  </div>
                  <div className="mt-2 text-center kid-subtitle font-bold">
                    {hasRecorded ? '🎶 Your Amazing Recording! 🎶' : '✨ Ready to Record! ✨'}
                  </div>
                </div>

                {/* Score Display */}
                <div className="bg-white bg-opacity-90 border-4 border-yellow-300 rounded-2xl shadow-lg p-4 w-48">
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
                          className="text-4xl font-bold"
                          style={{ 
                            background: 'linear-gradient(45deg, #FF6B9D, #4ECDC4)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                          }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          {accuracy}%
                        </motion.div>
                        <div className="kid-subtitle font-bold">🎯 Accuracy! 🎯</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {!hasRecorded && (
                    <div className="h-16 flex items-center justify-center">
                      <span className="kid-subtitle font-bold text-center">🎤 Record to see your magical score! ✨</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Detected Note and Feedback */}
              <div className="mt-4 flex flex-col sm:flex-row justify-between gap-4" style={{ position: 'relative', zIndex: 2 }}>
                <div className="bg-white bg-opacity-80 p-4 rounded-2xl border-4 border-teal-200 text-center sm:w-1/3 shadow-lg">
                  <h4 className="activity-title text-lg mb-2">🎵 Note Detected! 🎵</h4>
                  <div className="text-2xl font-bold kid-subtitle" style={{ color: '#4ECDC4' }}>{detectedNote || '---'}</div>
                  {detectedPitch && (
                    <div className="kid-subtitle text-sm text-gray-600">{detectedPitch.toFixed(1)} Hz</div>
                  )}
                </div>

                <div className="bg-white bg-opacity-80 p-4 rounded-2xl border-4 border-purple-200 flex-1 text-center shadow-lg">
                  <h4 className="activity-title text-lg mb-2">💭 Feedback! 💭</h4>
                  <div className="kid-subtitle font-bold" style={{ color: '#9966CC' }}>
                    {feedback ||
                      (isRecording
                        ? practiceMode === 'note-by-note'
                          ? `🎶 Sing the highlighted note: ${filteredExercises[currentExercise]?.notes[currentNoteIndex]} 🎶`
                          : '🎵 Sing the entire melody! You can do it! 🎵'
                        : '🎤 Press Record to start your musical adventure! ✨')}
                  </div>
                </div>
              </div>

              {/* Achievement Status */}
              {perfectPitchUnlocked && (
                <motion.div 
                  className="mt-4 bg-gradient-to-r from-yellow-100 to-yellow-200 p-4 rounded-2xl border-4 border-yellow-400 flex items-center shadow-lg"
                  style={{ position: 'relative', zIndex: 2 }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <div className="bg-yellow-300 p-3 rounded-full mr-4 border-2 border-yellow-500">
                    <Award size={24} className="text-yellow-700" />
                  </div>
                  <div>
                    <h4 className="activity-title text-lg text-yellow-800">
                      🏆 Achievement Unlocked: Perfect Pitch! 🏆
                    </h4>
                    <p className="kid-subtitle font-bold text-yellow-700">
                      ✨ Amazing! You scored 100% on a sight singing exercise! You're a true musical star! 🌟
                    </p>
                  </div>
                </motion.div>
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
                <div className="mt-4 bg-red-100 p-4 rounded-2xl border-4 border-red-300 shadow-lg" style={{ position: 'relative', zIndex: 2 }}>
                  <p className="activity-title text-lg text-red-700">😅 Microphone Access Needed! 😅</p>
                  <p className="kid-subtitle font-bold text-red-600">
                    🎤 Please allow microphone access in your browser so we can hear your beautiful voice! ✨
                  </p>
                </div>
              )}
            </motion.div>

            {/* Exercise Selection and Navigation */}
            <motion.div className="kid-welcome-section" variants={itemVariants}>
              <h3 className="activity-title text-2xl mb-6 text-center" style={{ position: 'relative', zIndex: 2 }}>🎯 Choose Your Song! 🎯</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6" style={{ position: 'relative', zIndex: 2 }}>
                {filteredExercises.map((exercise, index) => (
                  <motion.button
                    key={index}
                    className={`kid-card text-left ${
                      currentExercise === index
                        ? 'ring-4 ring-yellow-400 bg-yellow-50'
                        : ''
                    }`}
                    style={{
                      background: currentExercise === index 
                        ? 'linear-gradient(45deg, rgba(255, 230, 109, 0.3), rgba(255, 255, 255, 0.9))'
                        : 'rgba(255, 255, 255, 0.9)',
                      padding: '1rem'
                    }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleExerciseChange(index)}
                  >
                    <div className="activity-title text-base">{exercise.name}</div>
                    <div className="kid-subtitle text-sm mt-1">
                      🎵 {exercise.exerciseType} • {exercise.difficulty} 🎵
                    </div>
                  </motion.button>
                ))}
              </div>

              {filteredExercises.length === 0 && (
                <div className="text-center p-8" style={{ position: 'relative', zIndex: 2 }}>
                  <p className="kid-subtitle font-bold text-red-600">
                    😅 No musical adventures available for your current settings! Try changing the difficulty or song type! 🎯
                  </p>
                </div>
              )}

              {/* Navigation Button */}
              <div className="flex justify-end" style={{ position: 'relative', zIndex: 2 }}>
                <motion.button
                  className={`kid-button ${
                    !hasRecorded ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  style={{
                    background: hasRecorded 
                      ? 'linear-gradient(45deg, #FF6B9D, #FFE66D)' 
                      : 'linear-gradient(45deg, #9CA3AF, #6B7280)'
                  }}
                  whileHover={{ scale: hasRecorded ? 1.1 : 1 }}
                  whileTap={{ scale: hasRecorded ? 0.95 : 1 }}
                  onClick={handleNextExercise}
                  disabled={!hasRecorded}
                >
                  🚀 Next Adventure!
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
