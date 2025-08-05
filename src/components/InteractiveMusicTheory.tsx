// src/components/InteractiveMusicTheory.tsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, RotateCcw, Info, Music, Target, Star } from 'lucide-react';
import { SuccessModal, ErrorModal } from './Modal';

interface InteractiveMusicTheoryProps {
  chapterId: number;
  onInteraction?: (type: string, data: any) => void;
  adaptiveMode?: boolean;
}

// Musical constants
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MAJOR_SCALE_PATTERN = [2, 2, 1, 2, 2, 2, 1]; // Whole and half steps
const MINOR_SCALE_PATTERN = [2, 1, 2, 2, 1, 2, 2];
const COMMON_CHORDS = {
  major: [0, 4, 7], // Root, Major 3rd, Perfect 5th
  minor: [0, 3, 7], // Root, Minor 3rd, Perfect 5th
  diminished: [0, 3, 6], // Root, Minor 3rd, Diminished 5th
  augmented: [0, 4, 8], // Root, Major 3rd, Augmented 5th
};

// Component names mapping - moved outside to prevent re-creation on each render
const COMPONENT_NAMES = {
  piano: '🎹 Piano',
  scales: '🎼 Scales',
  chords: '🎵 Chords',
  intervals: '🎶 Intervals',
  staff: '📝 Staff',
  noteValues: '🎵 Notes',
  rhythm: '🥁 Rhythm',
  timeSignature: '⏱️ Time',
  melody: '🎶 Melody',
  form: '📋 Form',
  analysis: '🔍 Analysis',
} as const;

// Piano key frequencies (starting from C4)
const getFrequency = (noteIndex: number, octave: number = 4) => {
  const A4_FREQ = 440;
  const semitonesFromA4 = (octave - 4) * 12 + (noteIndex - 9); // A is index 9
  return A4_FREQ * Math.pow(2, semitonesFromA4 / 12);
};

const InteractiveMusicTheory: React.FC<InteractiveMusicTheoryProps> = React.memo(
  ({ chapterId, onInteraction, adaptiveMode = false }) => {
    // Set default component based on chapter
    const getDefaultComponent = (chapterId: number) => {
      switch (chapterId) {
        case 1: // Understanding Rhythm
          return 'rhythm';
        case 2: // Major and Minor Scales
          return 'scales';
        case 3: // Intervals and Harmony
          return 'intervals';
        case 4: // Reading and Playing Melodies
          return 'melody';
        case 5: // Introduction to Chords
          return 'chords';
        case 6: // Musical Form and Structure
          return 'form';
        default:
          return 'piano';
      }
    };

    const [activeComponent, setActiveComponent] = useState<string>(getDefaultComponent(chapterId));
    const [isPlaying, setIsPlaying] = useState(false);
    const [showInfo, setShowInfo] = useState(false);

    // Rhythm component state - lifted up to prevent reset on re-renders
    const [rhythmCurrentPattern, setRhythmCurrentPattern] = useState<number[]>([1, 1, 1, 1]);
    const [rhythmSelectedPatternIndex, setRhythmSelectedPatternIndex] = useState(0);
    const [rhythmIsPlayingPattern, setRhythmIsPlayingPattern] = useState(false);
    const [rhythmCustomPattern, setRhythmCustomPattern] = useState<number[]>([]);
    const [rhythmSelectedDuration, setRhythmSelectedDuration] = useState<number>(1);

    const audioContextRef = useRef<AudioContext | null>(null);
    const oscillatorsRef = useRef<OscillatorNode[]>([]);

    // Update active component when chapter changes
    useEffect(() => {
      const defaultComponent = getDefaultComponent(chapterId);
      setActiveComponent(defaultComponent);
    }, [chapterId]);

    // Initialize Web Audio API
    useEffect(() => {
      if (typeof window !== 'undefined') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      return () => {
        stopAllSounds();
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
      };
    }, []);

    // Component options based on chapter - memoized to prevent re-computation
    const getComponentOptions = useMemo(() => {
      switch (chapterId) {
        case 0: // Introduction to Music Notation
          return ['piano', 'staff', 'noteValues'];
        case 1: // Understanding Rhythm
          return ['rhythm', 'timeSignature'];
        case 2: // Major and Minor Scales
          return ['scales', 'piano'];
        case 3: // Intervals and Harmony
          return ['intervals', 'piano'];
        case 4: // Reading and Playing Melodies
          return ['melody', 'staff', 'piano'];
        case 5: // Introduction to Chords
          return ['chords', 'piano', 'melody'];
        case 6: // Musical Form and Structure
          return ['form', 'analysis'];
        default:
          return ['piano'];
      }
    }, [chapterId]);

    // Play a single note
    const playNote = (noteIndex: number, duration: number = 1.0, octave: number = 4) => {
      if (!audioContextRef.current) return;

      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      oscillator.frequency.setValueAtTime(
        getFrequency(noteIndex, octave),
        audioContextRef.current.currentTime
      );
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContextRef.current.currentTime + duration
      );

      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + duration);

      oscillatorsRef.current.push(oscillator);

      // Clean up after the note finishes
      setTimeout(() => {
        const index = oscillatorsRef.current.indexOf(oscillator);
        if (index > -1) {
          oscillatorsRef.current.splice(index, 1);
        }
      }, duration * 1000);

      // Report interaction
      onInteraction?.('note_played', { noteIndex, duration, octave });
    };

    // Play multiple notes (chord)
    const playChord = (noteIndices: number[], duration: number = 2.0) => {
      noteIndices.forEach(noteIndex => {
        playNote(noteIndex, duration);
      });
      onInteraction?.('chord_played', { noteIndices, duration });
    };

    // Stop all currently playing sounds
    const stopAllSounds = () => {
      oscillatorsRef.current.forEach(osc => {
        try {
          osc.stop();
        } catch (e) {
          // Oscillator might already be stopped
        }
      });
      oscillatorsRef.current = [];
      setIsPlaying(false);
    };

    // Generate scale notes
    const generateScale = (root: number, pattern: number[]) => {
      const notes = [root];
      let currentNote = root;

      for (const interval of pattern.slice(0, -1)) {
        currentNote = (currentNote + interval) % 12;
        notes.push(currentNote);
      }

      return notes;
    };

    // Play scale
    const playScale = async (root: number, type: 'major' | 'minor') => {
      const pattern = type === 'major' ? MAJOR_SCALE_PATTERN : MINOR_SCALE_PATTERN;
      const scaleNotes = generateScale(root, pattern);

      setIsPlaying(true);

      for (let i = 0; i < scaleNotes.length; i++) {
        playNote(scaleNotes[i], 0.8);
        await new Promise(resolve => setTimeout(resolve, 600));
        if (!isPlaying) break;
      }

      setIsPlaying(false);
      onInteraction?.('scale_played', { root, type, notes: scaleNotes });
    };

    // Interactive Piano Component
    const InteractivePiano = React.memo(() => {
      const [selectedNotes, setSelectedNotes] = useState<number[]>([]);
      const whiteKeys = [0, 2, 4, 5, 7, 9, 11]; // C, D, E, F, G, A, B
      const blackKeys = [1, 3, 6, 8, 10]; // C#, D#, F#, G#, A#

      return (
        <div className="relative">
          <h4 className="text-lg font-bold text-purple-800 mb-4 text-center">
            🎹 Interactive Piano
          </h4>

          <div className="relative bg-gray-800 p-4 rounded-xl">
            {/* White Keys */}
            <div className="flex gap-1">
              {whiteKeys.map((noteIndex, index) => (
                <motion.button
                  key={`white-${noteIndex}`}
                  className={`relative w-12 h-32 bg-white border-2 border-gray-300 rounded-b-lg font-bold text-gray-800 flex items-end justify-center pb-2 ${
                    selectedNotes.includes(noteIndex)
                      ? 'bg-yellow-200 border-yellow-400'
                      : 'hover:bg-gray-100'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    playNote(noteIndex);
                    setSelectedNotes([noteIndex]);
                  }}
                >
                  <span className="text-xs">{NOTES[noteIndex]}</span>
                </motion.button>
              ))}
            </div>

            {/* Black Keys */}
            <div className="absolute top-4 left-4 flex">
              {[0, 1, 2, 3, 4, 5, 6].map(whiteKeyIndex => {
                const blackKeyIndex = whiteKeys[whiteKeyIndex] + 1;
                if (!blackKeys.includes(blackKeyIndex)) {
                  return <div key={`spacer-${whiteKeyIndex}`} className="w-12" />; // Spacer with unique key
                }

                return (
                  <motion.button
                    key={`black-${blackKeyIndex}`}
                    className={`w-8 h-20 bg-gray-900 rounded-b-lg ml-2 mr-2 font-bold text-white flex items-end justify-center pb-2 ${
                      selectedNotes.includes(blackKeyIndex) ? 'bg-yellow-600' : 'hover:bg-gray-700'
                    }`}
                    style={{
                      marginLeft: whiteKeyIndex === 2 || whiteKeyIndex === 6 ? '4rem' : '0.5rem',
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      playNote(blackKeyIndex);
                      setSelectedNotes([blackKeyIndex]);
                    }}
                  >
                    <span className="text-xs">{NOTES[blackKeyIndex]}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-center gap-2 mt-4">
            <button
              onClick={stopAllSounds}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
            >
              <Pause size={16} />
              Stop
            </button>
          </div>
        </div>
      );
    });

    // Interactive Scale Builder
    const InteractiveScales = React.memo(() => {
      const [practiceMode, setPracticeMode] = useState(false);
      const [practiceRoot, setPracticeRoot] = useState<number | null>(null);
      const [practiceType, setPracticeType] = useState<'major' | 'minor' | null>(null);
      const [currentScale, setCurrentScale] = useState<{ root: number; type: 'major' | 'minor' }>({
        root: 0,
        type: 'major',
      });
      const [selectedNotes, setSelectedNotes] = useState<number[]>([]);
      const [userScore, setUserScore] = useState(0);
      const [attempts, setAttempts] = useState(0);
      const [showSuccessModal, setShowSuccessModal] = useState(false);
      const [showErrorModal, setShowErrorModal] = useState(false);
      const [modalMessage, setModalMessage] = useState('');
      

      const startPractice = () => {
        const randomRoot = Math.floor(Math.random() * 12);
        const randomType = Math.random() > 0.5 ? 'major' : 'minor';
        setPracticeRoot(randomRoot);
        setPracticeType(randomType);
        setPracticeMode(true);
        setSelectedNotes([]);
        setAttempts(prev => prev + 1);
      };

      const checkAnswer = () => {
        if (practiceRoot === null || practiceType === null) {
          return;
        }

        const pattern = practiceType === 'major' ? MAJOR_SCALE_PATTERN : MINOR_SCALE_PATTERN;
        const correctNotes = generateScale(practiceRoot, pattern);
        const sortedSelected = [...selectedNotes].sort((a, b) => a - b);
        const sortedCorrect = [...correctNotes].sort((a, b) => a - b);

        const isCorrect =
          sortedSelected.length === sortedCorrect.length &&
          sortedSelected.every((note, index) => note === sortedCorrect[index]);

        if (isCorrect) {
          setUserScore(prev => prev + 10);
          setModalMessage('Great job building that scale! You got it right!');
          setShowSuccessModal(true);
          // Note: Audio playback temporarily disabled to prevent parent re-renders
        } else {
          const correctNotesText = correctNotes.map(n => NOTES[n]).join(', ');
          const selectedNotesText = selectedNotes.map(n => NOTES[n]).join(', ');
          setModalMessage(`You selected: ${selectedNotesText}

          Correct ${practiceType} scale: ${correctNotesText}

          Try again!`);
          setShowErrorModal(true);
          // Note: Audio playback temporarily disabled to prevent parent re-renders
        }

        onInteraction?.('scale_practice', {
          correct: isCorrect,
          attempted: selectedNotes,
          expected: correctNotes,
          root: practiceRoot,
          type: practiceType,
        });
      };

      // Memoized onChange handlers to prevent re-renders
      const handleScaleRootChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setCurrentScale(prev => ({ ...prev, root: parseInt(e.target.value) }));
      }, []);

      const handleScaleTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setCurrentScale(prev => ({ ...prev, type: e.target.value as 'major' | 'minor' }));
      }, []);

      // Memoized note options to prevent re-creation on every render
      const noteOptions = useMemo(
        () =>
          NOTES.map((note, index) => (
            <option key={index} value={index}>
              {note}
            </option>
          )),
        []
      );

      const scaleTypeOptions = useMemo(
        () => (
          <>
            <option value="major">Major</option>
            <option value="minor">Minor</option>
          </>
        ),
        []
      );

      return (
        <>
          <div>
            <h4 className="text-lg font-bold text-purple-800 mb-4 text-center">
              🎼 Interactive Scale Builder
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Scale Player */}
              <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-4 rounded-xl">
                <h5 className="font-bold text-blue-800 mb-3">🎵 Scale Player</h5>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-bold text-blue-700 mb-1">Root Note:</label>
                    <select
                      value={currentScale.root}
                      onChange={handleScaleRootChange}
                      className="w-full p-2 border rounded-lg"
                    >
                      {noteOptions}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-blue-700 mb-1">
                      Scale Type:
                    </label>
                    <select
                      value={currentScale.type}
                      onChange={handleScaleTypeChange}
                      className="w-full p-2 border rounded-lg"
                    >
                      {scaleTypeOptions}
                    </select>
                  </div>

                  <button
                    onClick={() => playScale(currentScale.root, currentScale.type)}
                    disabled={isPlaying}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 flex items-center justify-center gap-2"
                  >
                    <Play size={16} />
                    Play {NOTES[currentScale.root]} {currentScale.type}
                  </button>
                </div>
              </div>

              {/* Practice Mode */}
              <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-4 rounded-xl">
                <h5 className="font-bold text-green-800 mb-3">🎯 Scale Practice</h5>

                {!practiceMode ? (
                  <div className="text-center">
                    <p className="text-green-700 mb-4">Test your scale knowledge!</p>
                    <button
                      onClick={startPractice}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2 mx-auto"
                    >
                      <Target size={16} />
                      Start Practice
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-green-700 mb-2">
                      Build a{' '}
                      <strong>
                        {NOTES[practiceRoot!]} {practiceType!}
                      </strong>{' '}
                      scale
                    </p>
                    <p className="text-sm text-green-600 mb-2">
                      Click the notes below to build the scale. You need to select all 7 notes in
                      the scale.
                    </p>
                    <p className="text-xs text-green-500 mb-4">
                      💡 Tip: A {practiceType} scale has a specific pattern of whole and half steps.
                      Click notes to toggle them on/off.
                    </p>

                    {/* Mini Piano for Scale Practice */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="relative">
                        {/* White Keys */}
                        <div className="flex gap-1 justify-center">
                          {[0, 2, 4, 5, 7, 9, 11].map(noteIndex => (
                            <button
                              key={noteIndex}
                              className={`w-8 h-16 bg-white border border-gray-400 rounded-b text-xs font-bold flex items-end justify-center pb-1 ${
                                selectedNotes.includes(noteIndex)
                                  ? 'bg-green-200 border-green-500'
                                  : 'hover:bg-gray-100'
                              }`}
                              onClick={() => {
                                playNote(noteIndex);
                                setSelectedNotes(prev =>
                                  prev.includes(noteIndex)
                                    ? prev.filter(n => n !== noteIndex)
                                    : [...prev, noteIndex]
                                );
                              }}
                            >
                              {NOTES[noteIndex]}
                            </button>
                          ))}
                        </div>

                        {/* Black Keys */}
                        <div
                          className="absolute top-0 flex justify-center"
                          style={{ left: '0.25rem' }}
                        >
                          {[1, 3, -1, 6, 8, 10, -1].map((noteIndex, index) =>
                            noteIndex === -1 ? (
                              <div key={`spacer-${index}`} className="w-8" />
                            ) : (
                              <button
                                key={noteIndex}
                                className={`w-6 h-10 bg-gray-800 text-white text-xs font-bold rounded-b flex items-end justify-center pb-1 ${
                                  selectedNotes.includes(noteIndex)
                                    ? 'bg-green-600'
                                    : 'hover:bg-gray-600'
                                }`}
                                onClick={() => {
                                  playNote(noteIndex);
                                  setSelectedNotes(prev =>
                                    prev.includes(noteIndex)
                                      ? prev.filter(n => n !== noteIndex)
                                      : [...prev, noteIndex]
                                  );
                                }}
                              >
                                {NOTES[noteIndex]}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-bold">
                        Selected notes ({selectedNotes.length}/7):
                      </p>
                      <p className="text-green-700">
                        {selectedNotes.length > 0
                          ? selectedNotes.map(n => NOTES[n]).join(', ')
                          : 'None'}
                      </p>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={checkAnswer}
                        className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                      >
                        Check Answer
                      </button>
                      <button
                        onClick={() => {
                          setSelectedNotes([]);
                        }}
                        className="px-3 py-1 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm"
                      >
                        Clear Notes
                      </button>
                      <button
                        onClick={() => {
                          setPracticeMode(false);
                          setSelectedNotes([]);
                        }}
                        className="px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
                      >
                        Exit Practice
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-4 text-center">
                  <p className="text-sm text-green-600">
                    Score: {userScore} | Attempts: {attempts}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Success Modal */}
          <SuccessModal
            isOpen={showSuccessModal}
            onClose={() => {
              console.log('Success modal closing');
              setShowSuccessModal(false);
            }}
            title="Perfect Scale!"
            message={modalMessage}
            icon="🎵"
          />

          {/* Error Modal */}
          <ErrorModal
            isOpen={showErrorModal}
            onClose={() => {
              console.log('Error modal closing');
              setShowErrorModal(false);
            }}
            title="Not Quite Right"
            message={modalMessage}
          />
        </>
      );
    });

    // Interactive Chord Builder
    const InteractiveChords = React.memo(() => {
      const [practiceMode, setPracticeMode] = useState(false);
      const [practiceChord, setPracticeChord] = useState<{
        root: number;
        type: keyof typeof COMMON_CHORDS;
      } | null>(null);
      const [currentChord, setCurrentChord] = useState<{
        root: number;
        type: keyof typeof COMMON_CHORDS;
      }>({ root: 0, type: 'major' });
      const [selectedNotes, setSelectedNotes] = useState<number[]>([]);
      const [userScore, setUserScore] = useState(0);
      const [attempts, setAttempts] = useState(0);
      const [showSuccessModal, setShowSuccessModal] = useState(false);
      const [showErrorModal, setShowErrorModal] = useState(false);
      const [modalMessage, setModalMessage] = useState('');

      // Memoized onChange handlers to prevent re-renders
      const handleChordRootChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setCurrentChord(prev => ({ ...prev, root: parseInt(e.target.value) }));
      }, []);

      const handleChordTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setCurrentChord(prev => ({ ...prev, type: e.target.value as keyof typeof COMMON_CHORDS }));
      }, []);

      // Memoized note options to prevent re-creation on every render
      const chordNoteOptions = useMemo(
        () =>
          NOTES.map((note, index) => (
            <option key={index} value={index}>
              {note}
            </option>
          )),
        []
      );

      const chordTypeOptions = useMemo(
        () =>
          Object.keys(COMMON_CHORDS).map(type => (
            <option key={type} value={type}>
              {type}
            </option>
          )),
        []
      );

      const startChordPractice = () => {
        const randomRoot = Math.floor(Math.random() * 12);
        const chordTypes = Object.keys(COMMON_CHORDS) as (keyof typeof COMMON_CHORDS)[];
        const randomType = chordTypes[Math.floor(Math.random() * chordTypes.length)];
        setPracticeChord({ root: randomRoot, type: randomType });
        setPracticeMode(true);
        setSelectedNotes([]);
        setAttempts(prev => prev + 1);
      };

      const checkChordAnswer = () => {
        if (!practiceChord) return;

        const correctNotes = COMMON_CHORDS[practiceChord.type].map(
          interval => (practiceChord.root + interval) % 12
        );

        const sortedSelected = [...selectedNotes].sort((a, b) => a - b);
        const sortedCorrect = [...correctNotes].sort((a, b) => a - b);

        const isCorrect =
          sortedSelected.length === sortedCorrect.length &&
          sortedSelected.every((note, index) => note === sortedCorrect[index]);

        if (isCorrect) {
          setUserScore(prev => prev + 15);
          setModalMessage('Perfect chord! Well done! You got all the notes right!');
          setShowSuccessModal(true);
          // Note: Audio playback temporarily disabled to prevent parent re-renders
        } else {
          const correctNotesText = correctNotes.map(n => NOTES[n]).join(', ');
          const selectedNotesText = selectedNotes.map(n => NOTES[n]).join(', ');
          setModalMessage(`You selected: ${selectedNotesText}

Correct ${practiceChord.type} chord: ${correctNotesText}

Try again!`);
          setShowErrorModal(true);
          // Note: Audio playback temporarily disabled to prevent parent re-renders
        }

        onInteraction?.('chord_practice', {
          correct: isCorrect,
          attempted: selectedNotes,
          expected: correctNotes,
          root: practiceChord.root,
          type: practiceChord.type,
        });
      };

      return (
        <>
          <div>
            <h4 className="text-lg font-bold text-purple-800 mb-4 text-center">
              🎼 Interactive Chord Builder
            </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chord Player */}
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-4 rounded-xl">
              <h5 className="font-bold text-purple-800 mb-3">🎵 Chord Player</h5>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-bold text-purple-700 mb-1">Root Note:</label>
                  <select
                    value={currentChord.root}
                    onChange={handleChordRootChange}
                    className="w-full p-2 border rounded-lg"
                  >
                    {chordNoteOptions}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-purple-700 mb-1">
                    Chord Type:
                  </label>
                  <select
                    value={currentChord.type}
                    onChange={handleChordTypeChange}
                    className="w-full p-2 border rounded-lg"
                  >
                    {chordTypeOptions}
                  </select>
                </div>

                <button
                  onClick={() => {
                    const chordNotes = COMMON_CHORDS[currentChord.type].map(
                      interval => (currentChord.root + interval) % 12
                    );
                    playChord(chordNotes);
                  }}
                  className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center justify-center gap-2"
                >
                  <Play size={16} />
                  Play {NOTES[currentChord.root]} {currentChord.type}
                </button>
              </div>
            </div>

            {/* Chord Practice */}
            <div className="bg-gradient-to-r from-orange-100 to-red-100 p-4 rounded-xl">
              <h5 className="font-bold text-orange-800 mb-3">🎯 Chord Practice</h5>

              {!practiceMode ? (
                <div className="text-center">
                  <p className="text-orange-700 mb-4">Test your chord knowledge!</p>
                  <button
                    onClick={startChordPractice}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2 mx-auto"
                  >
                    <Target size={16} />
                    Start Practice
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-orange-700 mb-2">
                    Build a{' '}
                    <strong>
                      {NOTES[practiceChord!.root]} {practiceChord!.type}
                    </strong>{' '}
                    chord
                  </p>
                  <p className="text-sm text-orange-600 mb-2">
                    Click the piano keys to select the chord notes
                  </p>
                  <p className="text-xs text-orange-500 mb-4">
                    💡 Tip: A {practiceChord!.type} chord has 3 notes. Click notes to toggle them on/off.
                  </p>

                  {/* Mini Piano for Chord Practice */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="relative">
                      {/* White Keys */}
                      <div className="flex gap-1 justify-center">
                        {[0, 2, 4, 5, 7, 9, 11].map(noteIndex => (
                          <button
                            key={noteIndex}
                            className={`w-8 h-16 bg-white border border-gray-400 rounded-b text-xs font-bold flex items-end justify-center pb-1 ${
                              selectedNotes.includes(noteIndex)
                                ? 'bg-orange-200 border-orange-500'
                                : 'hover:bg-gray-100'
                            }`}
                            onClick={() => {
                              playNote(noteIndex);
                              setSelectedNotes(prev =>
                                prev.includes(noteIndex)
                                  ? prev.filter(n => n !== noteIndex)
                                  : [...prev, noteIndex]
                              );
                            }}
                          >
                            {NOTES[noteIndex]}
                          </button>
                        ))}
                      </div>

                      {/* Black Keys */}
                      <div
                        className="absolute top-0 flex justify-center"
                        style={{ left: '0.25rem' }}
                      >
                        {[1, 3, -1, 6, 8, 10, -1].map((noteIndex, index) =>
                          noteIndex === -1 ? (
                            <div key={`spacer-${index}`} className="w-8" />
                          ) : (
                            <button
                              key={noteIndex}
                              className={`w-6 h-10 bg-gray-800 text-white text-xs font-bold rounded-b flex items-end justify-center pb-1 ${
                                selectedNotes.includes(noteIndex)
                                  ? 'bg-orange-600'
                                  : 'hover:bg-gray-600'
                              }`}
                              onClick={() => {
                                playNote(noteIndex);
                                setSelectedNotes(prev =>
                                  prev.includes(noteIndex)
                                    ? prev.filter(n => n !== noteIndex)
                                    : [...prev, noteIndex]
                                );
                              }}
                            >
                              {NOTES[noteIndex]}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-bold">Selected notes ({selectedNotes.length}/3):</p>
                    <p className="text-orange-700">
                      {selectedNotes.length > 0
                        ? selectedNotes.map(n => NOTES[n]).join(', ')
                        : 'None'}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={checkChordAnswer}
                      className="px-3 py-1 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm"
                    >
                      Check Answer
                    </button>
                    <button
                      onClick={() => {
                        setPracticeMode(false);
                        setSelectedNotes([]);
                      }}
                      className="px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          </div>
          
          {/* Success Modal */}
          <SuccessModal
            isOpen={showSuccessModal}
            onClose={() => setShowSuccessModal(false)}
            title="Perfect Chord!"
            message={modalMessage}
            icon="🎵"
          />
          
          {/* Error Modal */}
          <ErrorModal
            isOpen={showErrorModal}
            onClose={() => setShowErrorModal(false)}
            title="Not Quite Right"
            message={modalMessage}
          />
        </>
      );
    });

    // Interval Recognition Component
    const InteractiveIntervals = React.memo(() => {
      const intervals = [
        { name: 'Unison', semitones: 0 },
        { name: 'Minor 2nd', semitones: 1 },
        { name: 'Major 2nd', semitones: 2 },
        { name: 'Minor 3rd', semitones: 3 },
        { name: 'Major 3rd', semitones: 4 },
        { name: 'Perfect 4th', semitones: 5 },
        { name: 'Tritone', semitones: 6 },
        { name: 'Perfect 5th', semitones: 7 },
        { name: 'Minor 6th', semitones: 8 },
        { name: 'Major 6th', semitones: 9 },
        { name: 'Minor 7th', semitones: 10 },
        { name: 'Major 7th', semitones: 11 },
        { name: 'Octave', semitones: 12 },
      ];

      const [selectedInterval, setSelectedInterval] = useState(intervals[4]); // Major 3rd

      const playInterval = (semitones: number) => {
        const root = 4; // E
        const upper = (root + semitones) % 12;

        // Play root first, then both together
        playNote(root, 1.0);
        setTimeout(() => {
          playNote(upper, 1.0);
          setTimeout(() => {
            playNote(root, 2.0);
            playNote(upper, 2.0);
          }, 1000);
        }, 1000);

        onInteraction?.('interval_played', { root, upper, semitones, name: selectedInterval.name });
      };

      return (
        <div>
          <h4 className="text-lg font-bold text-purple-800 mb-4 text-center">
            🎵 Interactive Intervals
          </h4>

          <div className="bg-gradient-to-r from-teal-100 to-cyan-100 p-6 rounded-xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {intervals.slice(0, 12).map(interval => (
                <motion.button
                  key={interval.name}
                  className={`p-3 rounded-lg font-bold text-sm border-2 transition-all ${
                    selectedInterval.name === interval.name
                      ? 'bg-teal-500 text-white border-teal-600'
                      : 'bg-white text-teal-700 border-teal-300 hover:border-teal-500 hover:bg-teal-50'
                  }`}
                  onClick={() => setSelectedInterval(interval)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {interval.name}
                </motion.button>
              ))}
            </div>

            <div className="text-center">
              <p className="text-teal-700 mb-4">
                Selected: <strong>{selectedInterval.name}</strong> ({selectedInterval.semitones}{' '}
                semitones)
              </p>

              <button
                onClick={() => playInterval(selectedInterval.semitones)}
                className="px-6 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 flex items-center gap-2 mx-auto"
              >
                <Play size={16} />
                Play {selectedInterval.name}
              </button>
            </div>
          </div>
        </div>
      );
    });

    // Interactive Staff Component
    const InteractiveStaff = React.memo(() => {
      const [staffNotes, setStaffNotes] = useState<{ note: string; position: number }[]>([]);
      const [selectedNote, setSelectedNote] = useState<string>('C');
      const [showErrorModal, setShowErrorModal] = useState(false);

      const addNoteToStaff = (note: string) => {
        const notePositions: { [key: string]: number } = {
          C: 10,
          D: 9,
          E: 8,
          F: 7,
          G: 6,
          A: 5,
          B: 4,
          C5: 3,
        };

        const newNote = {
          note,
          position: notePositions[note] || 8,
        };

        setStaffNotes(prev => [...prev, newNote]);

        // Play the note
        const noteIndex = NOTES.indexOf(note.replace('5', ''));
        if (noteIndex !== -1) {
          playNote(noteIndex, 1.0, note.includes('5') ? 5 : 4);
        }

        onInteraction?.('staff_note_added', { note, position: newNote.position });
      };

      return (
        <>
          <div>
            <h4 className="text-lg font-bold text-purple-800 mb-4 text-center">
              📝 Interactive Musical Staff
            </h4>

            <div className="bg-gradient-to-r from-yellow-100 to-orange-100 p-6 rounded-xl">
              {/* Staff Lines */}
              <div className="relative mb-8">
                <svg width="100%" height="120" className="border rounded">
                  {/* Staff Lines */}
                  {[0, 1, 2, 3, 4].map(lineIndex => (
                    <line
                      key={lineIndex}
                      x1="50"
                      y1={20 + lineIndex * 15}
                      x2="90%"
                      y2={20 + lineIndex * 15}
                      stroke="#333"
                      strokeWidth="2"
                    />
                  ))}

                  {/* Treble Clef */}
                  <text x="60" y="50" fontSize="40" fill="#8B5CF6">
                    𝄞
                  </text>

                  {/* Notes on Staff */}
                  {staffNotes.map((noteObj, index) => (
                    <g key={index}>
                      {/* Note Head */}
                      <ellipse
                        cx={120 + index * 40}
                        cy={noteObj.position * 7.5 + 12.5}
                        rx="8"
                        ry="6"
                        fill="#FF6B9D"
                        stroke="#E91E63"
                        strokeWidth="2"
                      />
                      {/* Note Label */}
                      <text
                        x={120 + index * 40}
                        y={noteObj.position * 7.5 + 45}
                        fontSize="12"
                        textAnchor="middle"
                        fill="#666"
                        fontWeight="bold"
                      >
                        {noteObj.note}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>

              {/* Note Selection */}
              <div className="grid grid-cols-4 md:grid-cols-8 gap-2 mb-4">
                {['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C5'].map(note => (
                  <motion.button
                    key={note}
                    className={`p-3 rounded-lg font-bold text-sm border-2 transition-all ${
                      selectedNote === note
                        ? 'bg-yellow-500 text-white border-yellow-600'
                        : 'bg-white text-yellow-700 border-yellow-300 hover:border-yellow-500'
                    }`}
                    onClick={() => {
                      setSelectedNote(note);
                      addNoteToStaff(note);
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {note}
                  </motion.button>
                ))}
              </div>

              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setStaffNotes([])}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  Clear Staff
                </button>
                <button
                  onClick={async () => {
                    if (staffNotes.length === 0) {
                      setShowErrorModal(true);
                      return;
                    }

                    // Play each note in sequence with proper timing
                    for (let i = 0; i < staffNotes.length; i++) {
                      const noteObj = staffNotes[i];
                      const noteIndex = NOTES.indexOf(noteObj.note.replace('5', ''));
                      if (noteIndex !== -1) {
                        playNote(noteIndex, 0.8, noteObj.note.includes('5') ? 5 : 4);
                      }

                      // Wait before playing the next note
                      if (i < staffNotes.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 600));
                      }
                    }

                    onInteraction?.('melody_played', { notes: staffNotes });
                  }}
                  disabled={staffNotes.length === 0}
                  className={`px-4 py-2 rounded-lg ${
                    staffNotes.length === 0
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-yellow-500 text-white hover:bg-yellow-600'
                  }`}
                >
                  Play Melody
                </button>
              </div>
            </div>
          </div>

          {/* Error Modal */}
          <ErrorModal
            isOpen={showErrorModal}
            onClose={() => setShowErrorModal(false)}
            title="No Notes to Play"
            message="Add some notes to the staff first! Click on the note buttons above to add notes to your melody."
          />
        </>
      );
    });

    // Interactive Note Values Component
    const InteractiveNoteValues = React.memo(() => {
      const [playingNote, setPlayingNote] = useState<string | null>(null);

      const noteValues = [
        {
          name: 'Whole Note',
          symbol: '○',
          description: 'A hollow circle',
          duration: 4,
          color: 'from-red-400 to-red-600',
          textColor: 'text-red-700',
        },
        {
          name: 'Half Note',
          symbol: '♩',
          description: 'Hollow with stem',
          duration: 2,
          color: 'from-orange-400 to-orange-600',
          textColor: 'text-orange-700',
        },
        {
          name: 'Quarter Note',
          symbol: '♪',
          description: 'Filled with stem',
          duration: 1,
          color: 'from-yellow-400 to-yellow-600',
          textColor: 'text-yellow-700',
        },
        {
          name: 'Eighth Note',
          symbol: '♫',
          description: 'Has one flag',
          duration: 0.5,
          color: 'from-green-400 to-green-600',
          textColor: 'text-green-700',
        },
        {
          name: 'Sixteenth Note',
          symbol: '♬',
          description: 'Has two flags',
          duration: 0.25,
          color: 'from-blue-400 to-blue-600',
          textColor: 'text-blue-700',
        },
      ];

      const playNoteValue = (noteValue: (typeof noteValues)[0]) => {
        setPlayingNote(noteValue.name);
        playNote(4, noteValue.duration); // Play E note for the duration

        setTimeout(() => {
          setPlayingNote(null);
        }, noteValue.duration * 1000);

        onInteraction?.('note_value_played', {
          name: noteValue.name,
          duration: noteValue.duration,
        });
      };

      return (
        <div>
          <h4 className="text-lg font-bold text-purple-800 mb-4 text-center">
            🎵 Interactive Note Values
          </h4>

          <div className="bg-gradient-to-r from-green-100 to-blue-100 p-6 rounded-xl">
            <p className="text-center text-green-800 mb-6 font-bold text-lg">
              Click on each note to hear how long it lasts! 🎶
            </p>

            <div className="space-y-4">
              {noteValues.map(noteValue => (
                <motion.button
                  key={noteValue.name}
                  className={`w-full p-4 sm:p-6 rounded-2xl border-4 transition-all shadow-lg overflow-hidden ${
                    playingNote === noteValue.name
                      ? 'border-purple-500 bg-purple-50 scale-102 shadow-xl'
                      : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50 hover:shadow-lg'
                  }`}
                  onClick={() => playNoteValue(noteValue)}
                  disabled={playingNote === noteValue.name}
                  whileHover={{ scale: playingNote === noteValue.name ? 1.02 : 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                    {/* Note Symbol - Fixed size to prevent overflow */}
                    <div
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${noteValue.color} flex items-center justify-center shadow-lg flex-shrink-0`}
                    >
                      <span className="text-2xl sm:text-4xl text-white drop-shadow-lg overflow-hidden">
                        {noteValue.symbol}
                      </span>
                    </div>

                    {/* Note Info - Responsive layout */}
                    <div className="flex-1 text-center sm:text-left min-w-0">
                      <h5
                        className={`font-bold text-xl sm:text-2xl mb-1 ${noteValue.textColor} truncate`}
                      >
                        {noteValue.name}
                      </h5>
                      <p className="text-gray-600 text-xs sm:text-sm mb-2">
                        {noteValue.description}
                      </p>
                      <div
                        className={`inline-block px-3 py-1 sm:px-4 sm:py-2 rounded-full bg-gradient-to-r ${noteValue.color} text-white text-xs sm:text-sm font-bold shadow-md`}
                      >
                        {noteValue.duration} {noteValue.duration === 1 ? 'beat' : 'beats'}
                      </div>
                    </div>

                    {/* Play Button & Status - Responsive */}
                    <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                      <div
                        className={`px-4 py-2 sm:px-6 sm:py-3 rounded-full border-2 transition-all ${
                          playingNote === noteValue.name
                            ? 'border-purple-500 bg-purple-100'
                            : `border-gray-300 bg-white hover:${
                                noteValue.color.split(' ')[0]
                              } hover:${noteValue.color.split(' ')[1]} hover:text-white`
                        }`}
                      >
                        <Play
                          size={20}
                          className={
                            playingNote === noteValue.name ? 'text-purple-600' : 'text-gray-600'
                          }
                        />
                      </div>

                      {/* Playing Indicator */}
                      {playingNote === noteValue.name && (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                          <p className="text-purple-600 font-bold text-sm hidden sm:block">
                            Playing...
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Educational Info */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-2xl border-4 border-blue-200 shadow-lg">
                <h6 className="font-bold text-blue-800 mb-3 text-lg flex items-center gap-2">
                  🎼 How Note Values Work
                </h6>
                <p className="text-blue-700 text-sm leading-relaxed">
                  Each note value is half the duration of the previous one. A whole note = 2 half
                  notes = 4 quarter notes = 8 eighth notes!
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border-4 border-green-200 shadow-lg">
                <h6 className="font-bold text-green-800 mb-3 text-lg flex items-center gap-2">
                  ⏱️ Time Signatures
                </h6>
                <p className="text-green-700 text-sm leading-relaxed">
                  In 4/4 time (most common), a whole note fills an entire measure, while a quarter
                  note gets one beat out of four!
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    });

    // Interactive Rhythm Component
    const InteractiveRhythm = React.memo(() => {
      const rhythmPatterns = useMemo(
        () => [
          { name: '4/4 Basic', pattern: [1, 1, 1, 1], description: 'Four quarter notes' },
          {
            name: 'Syncopated',
            pattern: [1, 0.5, 0.5, 1, 1],
            description: 'Quarter, two eighths, two quarters',
          },
          {
            name: 'Triplet Feel',
            pattern: [0.67, 0.33, 0.67, 0.33, 1],
            description: 'Swing rhythm pattern',
          },
          {
            name: 'Complex',
            pattern: [1, 0.5, 0.25, 0.25, 0.5, 1],
            description: 'Mixed note values',
          },
        ],
        []
      );

      // Use lifted state from parent component
      const currentPattern = rhythmCurrentPattern;
      const setCurrentPattern = setRhythmCurrentPattern;
      const selectedPatternIndex = rhythmSelectedPatternIndex;
      const setSelectedPatternIndex = setRhythmSelectedPatternIndex;
      const isPlayingPattern = rhythmIsPlayingPattern;
      const setIsPlayingPattern = setRhythmIsPlayingPattern;
      const customPattern = rhythmCustomPattern;
      const setCustomPattern = setRhythmCustomPattern;
      const selectedDuration = rhythmSelectedDuration;
      const setSelectedDuration = setRhythmSelectedDuration;

      const playRhythmPattern = async (pattern: number[]) => {
        setIsPlayingPattern(true);
        let currentTime = 0;

        for (const duration of pattern) {
          setTimeout(() => {
            playNote(4, 0.1); // Short percussive sound
          }, currentTime * 600); // 600ms per beat
          currentTime += duration;
        }

        setTimeout(() => {
          setIsPlayingPattern(false);
        }, currentTime * 600);

        onInteraction?.('rhythm_played', { pattern, totalDuration: currentTime });
      };

      const selectPattern = useCallback(
        (patternIndex: number) => {
          const pattern = rhythmPatterns[patternIndex];
          setSelectedPatternIndex(patternIndex);
          setCurrentPattern([...pattern.pattern]); // Create a new array to avoid reference issues
          console.log('Pattern selected:', pattern.name, pattern.pattern);
        },
        [rhythmPatterns]
      );

      const addToCustomPattern = useCallback((duration: number) => {
        setCustomPattern(prev => [...prev, duration]);
      }, []);

      const clearCustomPattern = useCallback(() => {
        setCustomPattern([]);
      }, []);

      return (
        <div>
          <h4 className="text-lg font-bold text-purple-800 mb-4 text-center">
            🥁 Interactive Rhythm Patterns
          </h4>

          <div className="bg-gradient-to-r from-orange-100 to-red-100 p-6 rounded-xl">
            {/* Preset Patterns */}
            <div className="mb-8">
              <h5 className="font-bold text-orange-800 mb-4 text-lg">📋 Preset Rhythm Patterns</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rhythmPatterns.map((rhythmPattern, index) => (
                  <motion.button
                    key={index}
                    className={`p-4 rounded-xl border-4 transition-all ${
                      selectedPatternIndex === index
                        ? 'border-orange-500 bg-orange-100'
                        : 'border-gray-300 bg-white hover:border-orange-300'
                    }`}
                    onClick={() => selectPattern(index)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="text-left">
                      <h6 className="font-bold text-orange-700 mb-2">{rhythmPattern.name}</h6>
                      <p className="text-orange-600 text-sm mb-3">{rhythmPattern.description}</p>

                      {/* Visual Pattern */}
                      <div className="flex gap-1 mb-3">
                        {rhythmPattern.pattern.map((duration, beatIndex) => (
                          <div
                            key={beatIndex}
                            className={`h-8 bg-orange-400 rounded flex items-center justify-center text-white text-xs font-bold`}
                            style={{ width: `${Math.max(duration * 48, 40)}px` }}
                          >
                            {duration}
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Current Pattern Display */}
            <div className="mb-8 p-6 bg-white rounded-xl border-4 border-orange-200">
              <h5 className="font-bold text-orange-800 mb-4 text-lg">🎵 Current Pattern</h5>
              <div className="flex gap-2 mb-4 justify-center flex-wrap">
                {currentPattern.map((duration, index) => (
                  <div key={index} className="text-center">
                    <div
                      className={`h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg`}
                      style={{ width: `${Math.max(duration * 60, 48)}px` }}
                    >
                      {duration}
                    </div>
                    <p className="text-orange-600 text-xs mt-1">
                      {duration === 1
                        ? 'Quarter'
                        : duration === 0.5
                        ? 'Eighth'
                        : duration === 0.25
                        ? '16th'
                        : duration === 0.67
                        ? 'Triplet'
                        : duration === 0.33
                        ? 'Triplet'
                        : `${duration}x`}
                    </p>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <button
                  onClick={() => playRhythmPattern(currentPattern)}
                  disabled={isPlayingPattern}
                  className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 mx-auto ${
                    isPlayingPattern
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-orange-500 text-white hover:bg-orange-600'
                  }`}
                >
                  <Play size={20} />
                  {isPlayingPattern ? 'Playing...' : 'Play Pattern'}
                </button>
              </div>
            </div>

            {/* Custom Pattern Builder */}
            <div className="p-6 bg-white rounded-xl border-4 border-red-200">
              <h5 className="font-bold text-red-800 mb-4 text-lg">🎨 Build Your Own Pattern</h5>

              {/* Duration Selector */}
              <div className="mb-4">
                <p className="text-red-700 mb-2 font-bold">Select note duration:</p>
                <div className="flex gap-2 justify-center">
                  {[1, 0.5, 0.25].map(duration => (
                    <motion.button
                      key={duration}
                      className={`px-4 py-2 rounded-lg font-bold ${
                        selectedDuration === duration
                          ? 'bg-red-500 text-white'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                      onClick={() => setSelectedDuration(duration)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {duration === 1 ? 'Quarter' : duration === 0.5 ? 'Eighth' : 'Sixteenth'}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Custom Pattern Display */}
              {customPattern.length > 0 && (
                <div className="mb-4">
                  <p className="text-red-700 mb-2 font-bold">Your pattern:</p>
                  <div className="flex gap-1 justify-center mb-3">
                    {customPattern.map((duration, index) => (
                      <div
                        key={index}
                        className={`h-12 bg-red-400 rounded flex items-center justify-center text-white text-xs font-bold`}
                        style={{ width: `${Math.max(duration * 48, 40)}px` }}
                      >
                        {duration}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => addToCustomPattern(selectedDuration)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-bold"
                >
                  Add Note
                </button>
                <button
                  onClick={() => playRhythmPattern(customPattern)}
                  disabled={customPattern.length === 0 || isPlayingPattern}
                  className={`px-4 py-2 rounded-lg font-bold ${
                    customPattern.length === 0 || isPlayingPattern
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  Play Custom
                </button>
                <button
                  onClick={clearCustomPattern}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-bold"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    });

    // Interactive Time Signature Component
    const InteractiveTimeSignature = React.memo(() => {
      const [currentTimeSignature, setCurrentTimeSignature] = useState<{
        top: number;
        bottom: number;
      }>({ top: 4, bottom: 4 });
      const [isPlayingMeter, setIsPlayingMeter] = useState(false);

      const timeSignatures = [
        {
          top: 4,
          bottom: 4,
          name: 'Four-Four',
          description: 'Most common - 4 quarter note beats per measure',
        },
        {
          top: 3,
          bottom: 4,
          name: 'Three-Four',
          description: 'Waltz time - 3 quarter note beats per measure',
        },
        {
          top: 2,
          bottom: 4,
          name: 'Two-Four',
          description: 'March time - 2 quarter note beats per measure',
        },
        {
          top: 6,
          bottom: 8,
          name: 'Six-Eight',
          description: 'Compound time - 6 eighth note beats, felt in 2',
        },
        {
          top: 5,
          bottom: 4,
          name: 'Five-Four',
          description: 'Irregular meter - 5 quarter note beats per measure',
        },
        {
          top: 7,
          bottom: 8,
          name: 'Seven-Eight',
          description: 'Complex meter - 7 eighth note beats per measure',
        },
      ];

      const playTimeSignature = async (timeSignature: { top: number; bottom: number }) => {
        setIsPlayingMeter(true);
        const beatDuration = 600; // ms per beat
        const accentVolume = 0.3;
        const regularVolume = 0.15;

        for (let beat = 0; beat < timeSignature.top; beat++) {
          setTimeout(() => {
            // First beat is accented (higher pitch and volume)
            const isAccent = beat === 0;
            const noteIndex = isAccent ? 7 : 4; // G for accent, E for regular
            const volume = isAccent ? accentVolume : regularVolume;

            playNote(noteIndex, 0.2);
          }, beat * beatDuration);
        }

        setTimeout(() => {
          setIsPlayingMeter(false);
        }, timeSignature.top * beatDuration);

        onInteraction?.('time_signature_played', timeSignature);
      };

      return (
        <div>
          <h4 className="text-lg font-bold text-purple-800 mb-4 text-center">
            ⏱️ Interactive Time Signatures
          </h4>

          <div className="bg-gradient-to-r from-indigo-100 to-purple-100 p-6 rounded-xl">
            {/* Current Time Signature Display */}
            <div className="text-center mb-8">
              <div className="inline-block p-8 bg-white rounded-3xl border-4 border-indigo-300 shadow-lg">
                <div className="text-center">
                  <div className="text-6xl font-bold text-indigo-800 mb-2">
                    {currentTimeSignature.top}
                  </div>
                  <hr className="border-4 border-indigo-600 w-16 mx-auto mb-2" />
                  <div className="text-6xl font-bold text-indigo-800">
                    {currentTimeSignature.bottom}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <h5 className="text-xl font-bold text-indigo-800 mb-2">
                  {timeSignatures.find(
                    ts =>
                      ts.top === currentTimeSignature.top &&
                      ts.bottom === currentTimeSignature.bottom
                  )?.name || 'Custom'}
                </h5>
                <p className="text-indigo-600 max-w-md mx-auto">
                  {timeSignatures.find(
                    ts =>
                      ts.top === currentTimeSignature.top &&
                      ts.bottom === currentTimeSignature.bottom
                  )?.description || 'Custom time signature'}
                </p>
              </div>

              <button
                onClick={() => playTimeSignature(currentTimeSignature)}
                disabled={isPlayingMeter}
                className={`mt-4 px-6 py-3 rounded-lg font-bold flex items-center gap-2 mx-auto ${
                  isPlayingMeter
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-indigo-500 text-white hover:bg-indigo-600'
                }`}
              >
                <Play size={20} />
                {isPlayingMeter ? 'Playing Meter...' : 'Play Time Signature'}
              </button>
            </div>

            {/* Time Signature Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {timeSignatures.map((timeSignature, index) => (
                <motion.button
                  key={index}
                  className={`p-4 rounded-xl border-4 transition-all ${
                    currentTimeSignature.top === timeSignature.top &&
                    currentTimeSignature.bottom === timeSignature.bottom
                      ? 'border-indigo-500 bg-indigo-100'
                      : 'border-gray-300 bg-white hover:border-indigo-300'
                  }`}
                  onClick={() =>
                    setCurrentTimeSignature({
                      top: timeSignature.top,
                      bottom: timeSignature.bottom,
                    })
                  }
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-center">
                    <div className="mb-3">
                      <div className="text-3xl font-bold text-indigo-800">{timeSignature.top}</div>
                      <hr className="border-2 border-indigo-600 w-8 mx-auto" />
                      <div className="text-3xl font-bold text-indigo-800">
                        {timeSignature.bottom}
                      </div>
                    </div>
                    <h6 className="font-bold text-indigo-700 mb-2">{timeSignature.name}</h6>
                    <p className="text-indigo-600 text-sm">{timeSignature.description}</p>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Educational Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-xl border-4 border-blue-200">
                <h6 className="font-bold text-blue-800 mb-3 text-lg flex items-center gap-2">
                  🔢 Understanding Time Signatures
                </h6>
                <p className="text-blue-700 text-sm leading-relaxed">
                  The top number tells you how many beats are in each measure. The bottom number
                  tells you what type of note gets one beat (4 = quarter note, 8 = eighth note).
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border-4 border-green-200">
                <h6 className="font-bold text-green-800 mb-3 text-lg flex items-center gap-2">
                  🎵 Common Uses
                </h6>
                <p className="text-green-700 text-sm leading-relaxed">
                  4/4 is used in pop, rock, and most modern music. 3/4 is perfect for waltzes and
                  ballads. 6/8 creates a flowing, lilting feel!
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    });

    // Interactive Melody Component
    const InteractiveMelody = React.memo(() => {
      const [melodyNotes, setMelodyNotes] = useState<{note: string, duration: number}[]>([]);
      const [selectedNote, setSelectedNote] = useState<string>('C');
      const [selectedDuration, setSelectedDuration] = useState<number>(1);
      const [isPlayingMelody, setIsPlayingMelody] = useState(false);
      const [showErrorModal, setShowErrorModal] = useState(false);

      const noteDurations = [
        { name: 'Whole', value: 4, symbol: '○' },
        { name: 'Half', value: 2, symbol: '♩' },
        { name: 'Quarter', value: 1, symbol: '♪' },
        { name: 'Eighth', value: 0.5, symbol: '♫' }
      ];

      const addNoteToMelody = (note: string, duration: number) => {
        const newNote = { note, duration };
        setMelodyNotes(prev => [...prev, newNote]);
        
        // Play the note
        const noteIndex = NOTES.indexOf(note);
        if (noteIndex !== -1) {
          playNote(noteIndex, Math.min(duration * 0.5, 2.0));
        }
        
        onInteraction?.('melody_note_added', { note, duration });
      };

      const playMelody = async () => {
        if (melodyNotes.length === 0) {
          setShowErrorModal(true);
          return;
        }

        setIsPlayingMelody(true);
        let totalTime = 0;

        for (let i = 0; i < melodyNotes.length; i++) {
          const noteObj = melodyNotes[i];
          const noteIndex = NOTES.indexOf(noteObj.note);
          
          if (noteIndex !== -1) {
            setTimeout(() => {
              playNote(noteIndex, Math.min(noteObj.duration * 0.5, 2.0));
            }, totalTime * 600);
          }
          
          totalTime += noteObj.duration;
        }

        setTimeout(() => {
          setIsPlayingMelody(false);
        }, totalTime * 600);

        onInteraction?.('melody_played', { notes: melodyNotes, totalDuration: totalTime });
      };

      return (
        <>
          <div>
            <h4 className="text-lg font-bold text-purple-800 mb-4 text-center">🎶 Interactive Melody Builder</h4>
            
            <div className="bg-gradient-to-r from-pink-100 to-purple-100 p-6 rounded-xl">
              {/* Melody Display */}
              <div className="mb-6 p-4 bg-white rounded-xl border-2 border-pink-200">
                <h5 className="font-bold text-pink-800 mb-3">🎵 Your Melody</h5>
                {melodyNotes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {melodyNotes.map((noteObj, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-r from-pink-400 to-purple-400 text-white px-3 py-2 rounded-lg font-bold text-sm flex items-center gap-2"
                      >
                        <span>{noteObj.note}</span>
                        <span className="text-xs opacity-75">
                          {noteDurations.find(d => d.value === noteObj.duration)?.symbol || '♪'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-pink-600 text-center italic">Add notes to build your melody!</p>
                )}
              </div>

              {/* Note Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Note Picker */}
                <div className="bg-white p-4 rounded-xl border-2 border-pink-200">
                  <h6 className="font-bold text-pink-800 mb-3">🎼 Choose Note</h6>
                  <div className="grid grid-cols-4 gap-2">
                    {NOTES.slice(0, 7).map(note => (
                      <motion.button
                        key={note}
                        className={`p-3 rounded-lg font-bold text-sm border-2 transition-all ${
                          selectedNote === note
                            ? 'bg-pink-500 text-white border-pink-600'
                            : 'bg-white text-pink-700 border-pink-300 hover:border-pink-500'
                        }`}
                        onClick={() => setSelectedNote(note)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {note}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Duration Picker */}
                <div className="bg-white p-4 rounded-xl border-2 border-purple-200">
                  <h6 className="font-bold text-purple-800 mb-3">⏱️ Choose Duration</h6>
                  <div className="grid grid-cols-2 gap-2">
                    {noteDurations.map(duration => (
                      <motion.button
                        key={duration.value}
                        className={`p-3 rounded-lg font-bold text-sm border-2 transition-all flex items-center justify-center gap-2 ${
                          selectedDuration === duration.value
                            ? 'bg-purple-500 text-white border-purple-600'
                            : 'bg-white text-purple-700 border-purple-300 hover:border-purple-500'
                        }`}
                        onClick={() => setSelectedDuration(duration.value)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className="text-lg">{duration.symbol}</span>
                        <span className="text-xs">{duration.name}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center gap-3 flex-wrap">
                <motion.button
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-bold flex items-center gap-2"
                  onClick={() => addNoteToMelody(selectedNote, selectedDuration)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Music size={20} />
                  Add {selectedNote} Note
                </motion.button>

                <motion.button
                  className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 ${
                    isPlayingMelody || melodyNotes.length === 0
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-blue-500 text-white hover:shadow-lg'
                  }`}
                  onClick={playMelody}
                  disabled={isPlayingMelody || melodyNotes.length === 0}
                  whileHover={!isPlayingMelody && melodyNotes.length > 0 ? { scale: 1.05 } : {}}
                  whileTap={!isPlayingMelody && melodyNotes.length > 0 ? { scale: 0.95 } : {}}
                >
                  <Play size={20} />
                  {isPlayingMelody ? 'Playing...' : 'Play Melody'}
                </motion.button>

                <motion.button
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-bold flex items-center gap-2"
                  onClick={() => setMelodyNotes([])}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <RotateCcw size={20} />
                  Clear Melody
                </motion.button>
              </div>

              {/* Educational Info */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border-2 border-blue-200">
                  <h6 className="font-bold text-blue-800 mb-2 text-sm flex items-center gap-2">
                    🎵 What is a Melody?
                  </h6>
                  <p className="text-blue-700 text-xs leading-relaxed">
                    A melody is a sequence of musical notes that creates a tune. It's the part of music you sing along with!
                  </p>
                </div>
                
                <div className="bg-white p-4 rounded-xl border-2 border-green-200">
                  <h6 className="font-bold text-green-800 mb-2 text-sm flex items-center gap-2">
                    ⏱️ Note Durations
                  </h6>
                  <p className="text-green-700 text-xs leading-relaxed">
                    Different note durations create rhythm in your melody. Try mixing short and long notes!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Error Modal */}
          <ErrorModal
            isOpen={showErrorModal}
            onClose={() => setShowErrorModal(false)}
            title="No Notes to Play"
            message="Add some notes to your melody first! Choose notes and durations, then click 'Add Note' to build your melody."
          />
        </>
      );
    });

    // Interactive Form Component  
    const InteractiveForm = React.memo(() => {
      const [selectedForm, setSelectedForm] = useState<string>('ABA');
      const [currentSection, setCurrentSection] = useState<string>('A');
      const [formSequence, setFormSequence] = useState<string[]>(['A']);
      const [isPlayingForm, setIsPlayingForm] = useState(false);

      const musicalForms = [
        {
          name: 'ABA (Ternary)',
          pattern: ['A', 'B', 'A'],
          description: 'Statement - Contrast - Return',
          example: 'Many folk songs and classical pieces',
          color: 'from-blue-400 to-blue-600'
        },
        {
          name: 'ABAB (Binary)',
          pattern: ['A', 'B', 'A', 'B'],
          description: 'Alternating sections',
          example: 'Verse-Chorus songs',
          color: 'from-green-400 to-green-600'
        },
        {
          name: 'ABACA (Rondo)',
          pattern: ['A', 'B', 'A', 'C', 'A'],
          description: 'Main theme returns repeatedly',
          example: 'Classical rondo movements',
          color: 'from-purple-400 to-purple-600'
        },
        {
          name: 'AABA (Song Form)',
          pattern: ['A', 'A', 'B', 'A'],
          description: 'Verse-Verse-Bridge-Verse',
          example: 'Popular songs and standards',
          color: 'from-orange-400 to-orange-600'
        }
      ];

      const sectionMelodies = {
        A: [4, 5, 4, 2], // E, F, E, D
        B: [7, 6, 5, 4], // G, F#, F, E
        C: [9, 7, 5, 4]  // A, G, F, E
      };

      const addSection = (section: string) => {
        setFormSequence(prev => [...prev, section]);
        onInteraction?.('form_section_added', { section, sequence: [...formSequence, section] });
      };

      const playFormSection = (section: string) => {
        const melody = sectionMelodies[section as keyof typeof sectionMelodies];
        melody.forEach((noteIndex, i) => {
          setTimeout(() => {
            playNote(noteIndex, 0.5);
          }, i * 300);
        });
      };

      const playCompleteForm = async () => {
        setIsPlayingForm(true);
        let totalTime = 0;

        for (let i = 0; i < formSequence.length; i++) {
          const section = formSequence[i];
          const melody = sectionMelodies[section as keyof typeof sectionMelodies];
          
          setTimeout(() => {
            melody.forEach((noteIndex, j) => {
              setTimeout(() => {
                playNote(noteIndex, 0.4);
              }, j * 250);
            });
          }, totalTime);
          
          totalTime += melody.length * 250 + 500; // Add pause between sections
        }

        setTimeout(() => {
          setIsPlayingForm(false);
        }, totalTime);

        onInteraction?.('complete_form_played', { sequence: formSequence, totalTime });
      };

      const loadPresetForm = (form: typeof musicalForms[0]) => {
        setSelectedForm(form.name);
        setFormSequence([...form.pattern]);
      };

      return (
        <div>
          <h4 className="text-lg font-bold text-purple-800 mb-4 text-center">📋 Interactive Musical Form</h4>
          
          <div className="bg-gradient-to-r from-indigo-100 to-cyan-100 p-6 rounded-xl">
            {/* Current Form Display */}
            <div className="mb-6 p-4 bg-white rounded-xl border-2 border-indigo-200">
              <h5 className="font-bold text-indigo-800 mb-3">🎵 Your Musical Form</h5>
              {formSequence.length > 0 ? (
                <div className="flex flex-wrap gap-2 justify-center">
                  {formSequence.map((section, index) => (
                    <motion.div
                      key={index}
                      className="bg-gradient-to-r from-indigo-400 to-purple-400 text-white px-4 py-2 rounded-lg font-bold text-lg shadow-lg"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      {section}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-indigo-600 text-center italic">Build your musical form by adding sections!</p>
              )}
            </div>

            {/* Preset Forms */}
            <div className="mb-6">
              <h5 className="font-bold text-indigo-800 mb-3">📚 Common Musical Forms</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {musicalForms.map((form, index) => (
                  <motion.button
                    key={index}
                    className={`p-4 rounded-xl border-4 transition-all text-left ${
                      selectedForm === form.name
                        ? 'border-indigo-500 bg-indigo-100'
                        : 'border-gray-300 bg-white hover:border-indigo-300'
                    }`}
                    onClick={() => loadPresetForm(form)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <h6 className="font-bold text-indigo-700 mb-2">{form.name}</h6>
                    <div className="flex gap-1 mb-2">
                      {form.pattern.map((section, i) => (
                        <div
                          key={i}
                          className={`w-8 h-8 bg-gradient-to-r ${form.color} text-white rounded-lg flex items-center justify-center font-bold text-sm`}
                        >
                          {section}
                        </div>
                      ))}
                    </div>
                    <p className="text-indigo-600 text-sm mb-1">{form.description}</p>
                    <p className="text-indigo-500 text-xs">{form.example}</p>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Section Builder */}
            <div className="mb-6 p-4 bg-white rounded-xl border-2 border-cyan-200">
              <h5 className="font-bold text-cyan-800 mb-3">🎼 Build Your Own Form</h5>
              <div className="flex justify-center gap-3 mb-4">
                {['A', 'B', 'C'].map(section => (
                  <motion.button
                    key={section}
                    className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-bold flex items-center gap-2"
                    onClick={() => addSection(section)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Music size={16} />
                    Add Section {section}
                  </motion.button>
                ))}
              </div>
              
              <div className="flex justify-center gap-3">
                <motion.button
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg font-bold"
                  onClick={() => setFormSequence([])}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Clear Form
                </motion.button>
                
                <motion.button
                  className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${
                    isPlayingForm || formSequence.length === 0
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                  onClick={playCompleteForm}
                  disabled={isPlayingForm || formSequence.length === 0}
                  whileHover={!isPlayingForm && formSequence.length > 0 ? { scale: 1.05 } : {}}
                  whileTap={!isPlayingForm && formSequence.length > 0 ? { scale: 0.95 } : {}}
                >
                  <Play size={16} />
                  {isPlayingForm ? 'Playing...' : 'Play Form'}
                </motion.button>
              </div>
            </div>

            {/* Section Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['A', 'B', 'C'].map(section => (
                <div key={section} className="bg-white p-4 rounded-xl border-2 border-gray-200">
                  <h6 className="font-bold text-gray-800 mb-2">Section {section}</h6>
                  <p className="text-gray-600 text-sm mb-3">
                    {section === 'A' && 'Main theme - Memorable melody'}
                    {section === 'B' && 'Contrasting section - Different melody'}  
                    {section === 'C' && 'Another contrast - Third melody'}
                  </p>
                  <button
                    className="px-3 py-1 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600"
                    onClick={() => playFormSection(section)}
                  >
                    Preview {section}
                  </button>
                </div>
              ))}
            </div>

            {/* Educational Info */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border-2 border-blue-200">
                <h6 className="font-bold text-blue-800 mb-2 text-sm flex items-center gap-2">
                  📋 What is Musical Form?
                </h6>
                <p className="text-blue-700 text-xs leading-relaxed">
                  Musical form is the structure of a piece - how different sections are organized and repeated to create a complete musical work.
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-xl border-2 border-green-200">
                <h6 className="font-bold text-green-800 mb-2 text-sm flex items-center gap-2">
                  🎵 Why Forms Matter
                </h6>
                <p className="text-green-700 text-xs leading-relaxed">
                  Forms help organize music so listeners can follow along and remember melodies. Repetition and contrast keep music interesting!
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    });

    // Interactive Analysis Component
    const InteractiveAnalysis = React.memo(() => {
      const [selectedPiece, setSelectedPiece] = useState<string>('twinkle');
      const [analysisMode, setAnalysisMode] = useState<'form' | 'rhythm' | 'melody'>('form');
      const [showAnalysis, setShowAnalysis] = useState(false);

      const musicPieces = {
        'twinkle': {
          name: 'Twinkle, Twinkle, Little Star',  
          form: 'AABA',
          rhythm: '4/4 time with quarter notes',
          melody: 'Uses scale degrees 1-2-3-5-6 in C major',
          sections: [
            { section: 'A', description: 'Twinkle, twinkle, little star' },
            { section: 'A', description: 'How I wonder what you are' },
            { section: 'B', description: 'Up above the world so high' },
            { section: 'A', description: 'Like a diamond in the sky' }
          ],
          notes: [0, 0, 7, 7, 9, 9, 7] // C, C, G, G, A, A, G
        },
        'mary': {
          name: 'Mary Had a Little Lamb',
          form: 'AABA',
          rhythm: '4/4 time with quarter and half notes',
          melody: 'Simple descending and ascending patterns',
          sections: [
            { section: 'A', description: 'Mary had a little lamb' },
            { section: 'A', description: 'Little lamb, little lamb' },  
            { section: 'B', description: 'Mary had a little lamb' },
            { section: 'A', description: 'Its fleece was white as snow' }
          ],
          notes: [4, 2, 0, 2, 4, 4, 4] // E, D, C, D, E, E, E
        },
        'happy': {
          name: 'Happy Birthday',
          form: 'AABA',
          rhythm: '3/4 time (waltz feel)',
          melody: 'Wide interval jumps and stepwise motion',
          sections: [
            { section: 'A', description: 'Happy birthday to you' },
            { section: 'A', description: 'Happy birthday to you' },
            { section: 'B', description: 'Happy birthday dear [name]' },
            { section: 'A', description: 'Happy birthday to you' }
          ],
          notes: [0, 0, 2, 0, 5, 4] // C, C, D, C, F, E
        }
      };

      const currentPiece = musicPieces[selectedPiece as keyof typeof musicPieces];

      const playMelody = async () => {
        const notes = currentPiece.notes;
        for (let i = 0; i < notes.length; i++) {
          setTimeout(() => {
            playNote(notes[i], 0.6);
          }, i * 400);
        }
        onInteraction?.('analysis_melody_played', { piece: selectedPiece, notes });
      };

      const analyzeSection = (section: string) => {
        setShowAnalysis(true);
        onInteraction?.('section_analyzed', { piece: selectedPiece, section, mode: analysisMode });
      };

      return (
        <div>
          <h4 className="text-lg font-bold text-purple-800 mb-4 text-center">🔍 Interactive Musical Analysis</h4>
          
          <div className="bg-gradient-to-r from-emerald-100 to-teal-100 p-6 rounded-xl">
            {/* Piece Selection */}
            <div className="mb-6 p-4 bg-white rounded-xl border-2 border-emerald-200">
              <h5 className="font-bold text-emerald-800 mb-3">🎵 Choose a Piece to Analyze</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {Object.entries(musicPieces).map(([key, piece]) => (
                  <motion.button
                    key={key}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedPiece === key
                        ? 'border-emerald-500 bg-emerald-100'
                        : 'border-gray-300 bg-white hover:border-emerald-300'
                    }`}
                    onClick={() => setSelectedPiece(key)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <h6 className="font-bold text-emerald-700 text-sm">{piece.name}</h6>
                    <p className="text-emerald-600 text-xs">{piece.form} form</p>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Analysis Mode Selection */}
            <div className="mb-6 p-4 bg-white rounded-xl border-2 border-teal-200">
              <h5 className="font-bold text-teal-800 mb-3">🔍 Analysis Focus</h5>
              <div className="flex gap-3 justify-center">
                {[
                  { key: 'form', label: 'Form Structure', icon: '📋' },
                  { key: 'rhythm', label: 'Rhythm Patterns', icon: '🥁' },
                  { key: 'melody', label: 'Melodic Movement', icon: '🎼' }
                ].map(mode => (
                  <motion.button
                    key={mode.key}
                    className={`px-4 py-2 rounded-lg border-2 transition-all flex items-center gap-2 ${
                      analysisMode === mode.key
                        ? 'border-teal-500 bg-teal-100'
                        : 'border-gray-300 bg-white hover:border-teal-300'
                    }`}
                    onClick={() => setAnalysisMode(mode.key as 'form' | 'rhythm' | 'melody')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {mode.icon} {mode.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Current Piece Analysis */}
            <div className="mb-6 p-4 bg-white rounded-xl border-2 border-blue-200">
              <div className="flex justify-between items-center mb-4">
                <h5 className="font-bold text-blue-800">📊 Analysis: {currentPiece.name}</h5>
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                  onClick={playMelody}
                >
                  <Play size={16} />
                  Play Melody
                </button>
              </div>

              {analysisMode === 'form' && (
                <div>
                  <h6 className="font-bold text-blue-700 mb-2">Form Structure: {currentPiece.form}</h6>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-blue-600 text-sm mb-3">Section breakdown:</p>
                      {currentPiece.sections.map((section, index) => (
                        <div key={index} className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-blue-500 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                            {section.section}
                          </div>
                          <span className="text-blue-700 text-sm">{section.description}</span>
                        </div>
                      ))}
                    </div>
                    <div className="text-center">
                      <div className="flex gap-1 justify-center mb-3">
                        {currentPiece.form.split('').map((letter, i) => (
                          <div
                            key={i}
                            className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 text-white rounded-lg flex items-center justify-center font-bold"
                          >
                            {letter}
                          </div>
                        ))}
                      </div>
                      <p className="text-blue-600 text-xs">Visual form pattern</p>
                    </div>
                  </div>
                </div>
              )}

              {analysisMode === 'rhythm' && (
                <div>
                  <h6 className="font-bold text-blue-700 mb-2">Rhythm Analysis</h6>
                  <p className="text-blue-600 mb-3">{currentPiece.rhythm}</p>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-blue-700 text-sm">
                      Listen to how the rhythm creates a steady pulse that makes the melody easy to follow and remember.
                    </p>
                  </div>
                </div>
              )}

              {analysisMode === 'melody' && (
                <div>
                  <h6 className="font-bold text-blue-700 mb-2">Melodic Analysis</h6>
                  <p className="text-blue-600 mb-3">{currentPiece.melody}</p>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-blue-700 text-sm">
                      The melody uses simple intervals and repetition to create a memorable tune that's easy to sing.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Educational Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border-2 border-purple-200">
                <h6 className="font-bold text-purple-800 mb-2 text-sm flex items-center gap-2">
                  🔍 Musical Analysis
                </h6>
                <p className="text-purple-700 text-xs leading-relaxed">
                  Analyzing music helps us understand how composers create memorable and effective pieces by examining structure, rhythm, and melody.
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-xl border-2 border-pink-200">
                <h6 className="font-bold text-pink-800 mb-2 text-sm flex items-center gap-2">
                  📚 Learning Benefits
                </h6>
                <p className="text-pink-700 text-xs leading-relaxed">
                  Understanding musical patterns helps you recognize similar structures in other pieces and even compose your own music!
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    });

    // Render different components based on active selection with conditional rendering to preserve state

    const availableComponents = getComponentOptions;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        {/* Component Selector */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-purple-800 mb-4 text-center">
            🎼 Interactive Music Theory Lab
          </h3>

          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {availableComponents.map(component => (
              <motion.button
                key={component}
                className={`px-4 py-2 rounded-full font-bold text-sm border-2 transition-all ${
                  activeComponent === component
                    ? 'bg-purple-500 text-white border-purple-600'
                    : 'bg-white text-purple-700 border-purple-300 hover:border-purple-500 hover:bg-purple-50'
                }`}
                onClick={() => setActiveComponent(component)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {COMPONENT_NAMES[component as keyof typeof COMPONENT_NAMES] || component}
              </motion.button>
            ))}
          </div>

          {/* Info Panel */}
          <AnimatePresence>
            {showInfo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-blue-100 p-4 rounded-xl border-2 border-blue-300 mb-4"
              >
                <div className="flex items-start gap-3">
                  <Info className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h4 className="font-bold text-blue-800 mb-2">Learning Tip</h4>
                    <p className="text-blue-700 text-sm">
                      Try playing different combinations of notes to hear how they sound together.
                      Each component helps you understand different aspects of music theory!
                    </p>
                  </div>
                  <button
                    onClick={() => setShowInfo(false)}
                    className="text-blue-600 hover:text-blue-800 ml-auto"
                  >
                    ✕
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Active Component */}
        <div className="bg-white bg-opacity-90 rounded-2xl p-6 border-4 border-purple-200 shadow-lg">
          {availableComponents.includes('piano') && (
            <div style={{ display: activeComponent === 'piano' ? 'block' : 'none' }}>
              <InteractivePiano />
            </div>
          )}
          {availableComponents.includes('scales') && (
            <div style={{ display: activeComponent === 'scales' ? 'block' : 'none' }}>
              <InteractiveScales />
            </div>
          )}
          {availableComponents.includes('chords') && (
            <div style={{ display: activeComponent === 'chords' ? 'block' : 'none' }}>
              <InteractiveChords />
            </div>
          )}
          {availableComponents.includes('intervals') && (
            <div style={{ display: activeComponent === 'intervals' ? 'block' : 'none' }}>
              <InteractiveIntervals />
            </div>
          )}
          {availableComponents.includes('staff') && (
            <div style={{ display: activeComponent === 'staff' ? 'block' : 'none' }}>
              <InteractiveStaff />
            </div>
          )}
          {availableComponents.includes('noteValues') && (
            <div style={{ display: activeComponent === 'noteValues' ? 'block' : 'none' }}>
              <InteractiveNoteValues />
            </div>
          )}
          {availableComponents.includes('rhythm') && (
            <div style={{ display: activeComponent === 'rhythm' ? 'block' : 'none' }}>
              <InteractiveRhythm />
            </div>
          )}
          {availableComponents.includes('timeSignature') && (
            <div style={{ display: activeComponent === 'timeSignature' ? 'block' : 'none' }}>
              <InteractiveTimeSignature />
            </div>
          )}
          {availableComponents.includes('melody') && (
            <div style={{ display: activeComponent === 'melody' ? 'block' : 'none' }}>
              <InteractiveMelody />
            </div>
          )}
          {availableComponents.includes('form') && (
            <div style={{ display: activeComponent === 'form' ? 'block' : 'none' }}>
              <InteractiveForm />
            </div>
          )}
          {availableComponents.includes('analysis') && (
            <div style={{ display: activeComponent === 'analysis' ? 'block' : 'none' }}>
              <InteractiveAnalysis />
            </div>
          )}
        </div>

        {/* Control Panel */}
        <div className="mt-4 flex justify-center gap-3">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
          >
            <Info size={16} />
            {showInfo ? 'Hide' : 'Show'} Tips
          </button>

          <button
            onClick={stopAllSounds}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
          >
            <RotateCcw size={16} />
            Stop All Sounds
          </button>

          {adaptiveMode && (
            <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg border border-green-300 flex items-center gap-2">
              <Star size={16} />
              AI Mode Active
            </div>
          )}
        </div>
      </motion.div>
    );
  }
);

export default InteractiveMusicTheory;
