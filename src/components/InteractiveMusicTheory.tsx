// src/components/InteractiveMusicTheory.tsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, RotateCcw, Info, Music, Target, Star } from 'lucide-react';

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
  major: [0, 4, 7],    // Root, Major 3rd, Perfect 5th
  minor: [0, 3, 7],    // Root, Minor 3rd, Perfect 5th
  diminished: [0, 3, 6], // Root, Minor 3rd, Diminished 5th
  augmented: [0, 4, 8]   // Root, Major 3rd, Augmented 5th
};

// Piano key frequencies (starting from C4)
const getFrequency = (noteIndex: number, octave: number = 4) => {
  const A4_FREQ = 440;
  const semitonesFromA4 = (octave - 4) * 12 + (noteIndex - 9); // A is index 9
  return A4_FREQ * Math.pow(2, semitonesFromA4 / 12);
};

const InteractiveMusicTheory: React.FC<InteractiveMusicTheoryProps> = ({
  chapterId,
  onInteraction,
  adaptiveMode = false
}) => {
  const [activeComponent, setActiveComponent] = useState<string>('piano');
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<number[]>([]);
  const [currentScale, setCurrentScale] = useState<{ root: number; type: 'major' | 'minor' }>({ root: 0, type: 'major' });
  const [currentChord, setCurrentChord] = useState<{ root: number; type: keyof typeof COMMON_CHORDS }>({ root: 0, type: 'major' });
  const [showInfo, setShowInfo] = useState(false);
  const [userScore, setUserScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);

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

  // Component options based on chapter
  const getComponentOptions = () => {
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
        return ['chords', 'piano'];
      case 6: // Musical Form and Structure
        return ['form', 'analysis'];
      default:
        return ['piano'];
    }
  };

  // Play a single note
  const playNote = (noteIndex: number, duration: number = 1.0, octave: number = 4) => {
    if (!audioContextRef.current) return;

    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    
    oscillator.frequency.setValueAtTime(getFrequency(noteIndex, octave), audioContextRef.current.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration);
    
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
  const InteractivePiano = () => {
    const whiteKeys = [0, 2, 4, 5, 7, 9, 11]; // C, D, E, F, G, A, B
    const blackKeys = [1, 3, 6, 8, 10]; // C#, D#, F#, G#, A#
    
    return (
      <div className="relative">
        <h4 className="text-lg font-bold text-purple-800 mb-4 text-center">🎹 Interactive Piano</h4>
        
        <div className="relative bg-gray-800 p-4 rounded-xl">
          {/* White Keys */}
          <div className="flex gap-1">
            {whiteKeys.map((noteIndex, index) => (
              <motion.button
                key={noteIndex}
                className={`relative w-12 h-32 bg-white border-2 border-gray-300 rounded-b-lg font-bold text-gray-800 flex items-end justify-center pb-2 ${
                  selectedNotes.includes(noteIndex) ? 'bg-yellow-200 border-yellow-400' : 'hover:bg-gray-100'
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
            {[0, 1, 2, 3, 4, 5, 6].map((whiteKeyIndex) => {
              const blackKeyIndex = whiteKeys[whiteKeyIndex] + 1;
              if (!blackKeys.includes(blackKeyIndex)) {
                return <div key={whiteKeyIndex} className="w-12" />; // Spacer
              }
              
              return (
                <motion.button
                  key={blackKeyIndex}
                  className={`w-8 h-20 bg-gray-900 rounded-b-lg ml-2 mr-2 font-bold text-white flex items-end justify-center pb-2 ${
                    selectedNotes.includes(blackKeyIndex) ? 'bg-yellow-600' : 'hover:bg-gray-700'
                  }`}
                  style={{ marginLeft: whiteKeyIndex === 2 || whiteKeyIndex === 6 ? '4rem' : '0.5rem' }}
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
  };

  // Interactive Scale Builder
  const InteractiveScales = () => {
    const [practiceMode, setPracticeMode] = useState(false);
    const [practiceRoot, setPracticeRoot] = useState<number | null>(null);
    const [practiceType, setPracticeType] = useState<'major' | 'minor' | null>(null);
    
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
      if (practiceRoot === null || practiceType === null) return;
      
      const pattern = practiceType === 'major' ? MAJOR_SCALE_PATTERN : MINOR_SCALE_PATTERN;
      const correctNotes = generateScale(practiceRoot, pattern);
      const sortedSelected = [...selectedNotes].sort((a, b) => a - b);
      const sortedCorrect = [...correctNotes].sort((a, b) => a - b);
      
      const isCorrect = sortedSelected.length === sortedCorrect.length && 
                       sortedSelected.every((note, index) => note === sortedCorrect[index]);
      
      if (isCorrect) {
        setUserScore(prev => prev + 10);
        alert('🎉 Correct! Great job building that scale!');
        playScale(practiceRoot, practiceType);
      } else {
        alert(`❌ Not quite right. Try again! You selected: ${selectedNotes.map(n => NOTES[n]).join(', ')}`);
        playScale(practiceRoot, practiceType); // Play the correct scale
      }
      
      onInteraction?.('scale_practice', { 
        correct: isCorrect, 
        attempted: selectedNotes, 
        expected: correctNotes,
        root: practiceRoot,
        type: practiceType
      });
    };
    
    return (
      <div>
        <h4 className="text-lg font-bold text-purple-800 mb-4 text-center">🎼 Interactive Scale Builder</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Scale Player */}
          <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-4 rounded-xl">
            <h5 className="font-bold text-blue-800 mb-3">🎵 Scale Player</h5>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-bold text-blue-700 mb-1">Root Note:</label>
                <select
                  value={currentScale.root}
                  onChange={(e) => setCurrentScale({...currentScale, root: parseInt(e.target.value)})}
                  className="w-full p-2 border rounded-lg"
                >
                  {NOTES.map((note, index) => (
                    <option key={index} value={index}>{note}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-blue-700 mb-1">Scale Type:</label>
                <select
                  value={currentScale.type}
                  onChange={(e) => setCurrentScale({...currentScale, type: e.target.value as 'major' | 'minor'})}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="major">Major</option>
                  <option value="minor">Minor</option>
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
                  Build a <strong>{NOTES[practiceRoot!]} {practiceType!}</strong> scale
                </p>
                <p className="text-sm text-green-600 mb-4">
                  Click the piano keys to select the notes in this scale
                </p>
                
                <div className="mb-4">
                  <p className="text-sm font-bold">Selected notes:</p>
                  <p className="text-green-700">
                    {selectedNotes.length > 0 ? selectedNotes.map(n => NOTES[n]).join(', ') : 'None'}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={checkAnswer}
                    className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                  >
                    Check Answer
                  </button>
                  <button
                    onClick={() => {setPracticeMode(false); setSelectedNotes([]);}}
                    className="px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
                  >
                    Reset
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
    );
  };

  // Interactive Chord Builder
  const InteractiveChords = () => {
    const [practiceMode, setPracticeMode] = useState(false);
    const [practiceChord, setPracticeChord] = useState<{root: number, type: keyof typeof COMMON_CHORDS} | null>(null);
    
    const startChordPractice = () => {
      const randomRoot = Math.floor(Math.random() * 12);
      const chordTypes = Object.keys(COMMON_CHORDS) as (keyof typeof COMMON_CHORDS)[];
      const randomType = chordTypes[Math.floor(Math.random() * chordTypes.length)];
      setPracticeChord({root: randomRoot, type: randomType});
      setPracticeMode(true);
      setSelectedNotes([]);
      setAttempts(prev => prev + 1);
    };
    
    const checkChordAnswer = () => {
      if (!practiceChord) return;
      
      const correctNotes = COMMON_CHORDS[practiceChord.type].map(interval => 
        (practiceChord.root + interval) % 12
      );
      
      const sortedSelected = [...selectedNotes].sort((a, b) => a - b);
      const sortedCorrect = [...correctNotes].sort((a, b) => a - b);
      
      const isCorrect = sortedSelected.length === sortedCorrect.length && 
                       sortedSelected.every((note, index) => note === sortedCorrect[index]);
      
      if (isCorrect) {
        setUserScore(prev => prev + 15);
        alert('🎉 Perfect chord! Well done!');
        playChord(correctNotes);
      } else {
        alert(`❌ Not quite right. The correct notes are: ${correctNotes.map(n => NOTES[n]).join(', ')}`);
        playChord(correctNotes);
      }
      
      onInteraction?.('chord_practice', {
        correct: isCorrect,
        attempted: selectedNotes,
        expected: correctNotes,
        root: practiceChord.root,
        type: practiceChord.type
      });
    };
    
    return (
      <div>
        <h4 className="text-lg font-bold text-purple-800 mb-4 text-center">🎼 Interactive Chord Builder</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chord Player */}
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-4 rounded-xl">
            <h5 className="font-bold text-purple-800 mb-3">🎵 Chord Player</h5>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-bold text-purple-700 mb-1">Root Note:</label>
                <select
                  value={currentChord.root}
                  onChange={(e) => setCurrentChord({...currentChord, root: parseInt(e.target.value)})}
                  className="w-full p-2 border rounded-lg"
                >
                  {NOTES.map((note, index) => (
                    <option key={index} value={index}>{note}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-purple-700 mb-1">Chord Type:</label>
                <select
                  value={currentChord.type}
                  onChange={(e) => setCurrentChord({...currentChord, type: e.target.value as keyof typeof COMMON_CHORDS})}
                  className="w-full p-2 border rounded-lg"
                >
                  {Object.keys(COMMON_CHORDS).map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={() => {
                  const chordNotes = COMMON_CHORDS[currentChord.type].map(interval => 
                    (currentChord.root + interval) % 12
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
                  Build a <strong>{NOTES[practiceChord!.root]} {practiceChord!.type}</strong> chord
                </p>
                <p className="text-sm text-orange-600 mb-4">
                  Click the piano keys to select the chord notes
                </p>
                
                <div className="mb-4">
                  <p className="text-sm font-bold">Selected notes:</p>
                  <p className="text-orange-700">
                    {selectedNotes.length > 0 ? selectedNotes.map(n => NOTES[n]).join(', ') : 'None'}
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
                    onClick={() => {setPracticeMode(false); setSelectedNotes([]);}}
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
    );
  };

  // Interval Recognition Component
  const InteractiveIntervals = () => {
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
      { name: 'Octave', semitones: 12 }
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
        <h4 className="text-lg font-bold text-purple-800 mb-4 text-center">🎵 Interactive Intervals</h4>
        
        <div className="bg-gradient-to-r from-teal-100 to-cyan-100 p-6 rounded-xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {intervals.slice(0, 12).map((interval) => (
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
              Selected: <strong>{selectedInterval.name}</strong> ({selectedInterval.semitones} semitones)
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
  };

  // Render different components based on active selection
  const renderComponent = () => {
    switch (activeComponent) {
      case 'piano':
        return <InteractivePiano />;
      case 'scales':
        return <InteractiveScales />;
      case 'chords':
        return <InteractiveChords />;
      case 'intervals':
        return <InteractiveIntervals />;
      default:
        return <InteractivePiano />;
    }
  };

  const availableComponents = getComponentOptions();

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
          {availableComponents.map((component) => {
            const componentNames = {
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
              analysis: '🔍 Analysis'
            };
            
            return (
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
                {componentNames[component as keyof typeof componentNames] || component}
              </motion.button>
            );
          })}
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
        {renderComponent()}
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
          onClick={() => {
            setSelectedNotes([]);
            setUserScore(0);
            setAttempts(0);
            stopAllSounds();
          }}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
        >
          <RotateCcw size={16} />
          Reset
        </button>
        
        {adaptiveMode && (
          <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg border border-green-300 flex items-center gap-2">
            <Star size={16} />
            AI Mode: Score {userScore}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default InteractiveMusicTheory;