// src/components/InteractiveMusicTheory.tsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  const [selectedNotes, setSelectedNotes] = useState<number[]>([]);
  const [currentScale, setCurrentScale] = useState<{ root: number; type: 'major' | 'minor' }>({ root: 0, type: 'major' });
  const [currentChord, setCurrentChord] = useState<{ root: number; type: keyof typeof COMMON_CHORDS }>({ root: 0, type: 'major' });
  const [showInfo, setShowInfo] = useState(false);
  const [userScore, setUserScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  
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
    setActiveComponent(getDefaultComponent(chapterId));
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
                key={`white-${noteIndex}`}
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
                return <div key={`spacer-${whiteKeyIndex}`} className="w-12" />; // Spacer with unique key
              }
              
              return (
                <motion.button
                  key={`black-${blackKeyIndex}`}
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

  // Interactive Staff Component
  const InteractiveStaff = () => {
    const [staffNotes, setStaffNotes] = useState<{note: string, position: number}[]>([]);
    const [selectedNote, setSelectedNote] = useState<string>('C');
    
    const addNoteToStaff = (note: string) => {
      const notePositions: {[key: string]: number} = {
        'C': 10, 'D': 9, 'E': 8, 'F': 7, 'G': 6, 'A': 5, 'B': 4, 'C5': 3
      };
      
      const newNote = {
        note,
        position: notePositions[note] || 8
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
      <div>
        <h4 className="text-lg font-bold text-purple-800 mb-4 text-center">📝 Interactive Musical Staff</h4>
        
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
              <text x="60" y="50" fontSize="40" fill="#8B5CF6">𝄞</text>
              
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
              onClick={() => {
                if (staffNotes.length === 0) {
                  alert('Add some notes to the staff first!');
                  return;
                }
                
                staffNotes.forEach((noteObj, index) => {
                  setTimeout(() => {
                    const noteIndex = NOTES.indexOf(noteObj.note.replace('5', ''));
                    if (noteIndex !== -1) {
                      playNote(noteIndex, 0.8, noteObj.note.includes('5') ? 5 : 4);
                    }
                  }, index * 600);
                });
                
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
    );
  };

  // Interactive Note Values Component
  const InteractiveNoteValues = () => {
    const [playingNote, setPlayingNote] = useState<string | null>(null);
    
    const noteValues = [
      { 
        name: 'Whole Note', 
        symbol: '○', 
        description: 'A hollow circle',
        duration: 4, 
        color: 'from-red-400 to-red-600',
        textColor: 'text-red-700'
      },
      { 
        name: 'Half Note', 
        symbol: '♩', 
        description: 'Hollow with stem',
        duration: 2, 
        color: 'from-orange-400 to-orange-600',
        textColor: 'text-orange-700'
      },
      { 
        name: 'Quarter Note', 
        symbol: '♪', 
        description: 'Filled with stem',
        duration: 1, 
        color: 'from-yellow-400 to-yellow-600',
        textColor: 'text-yellow-700'
      },
      { 
        name: 'Eighth Note', 
        symbol: '♫', 
        description: 'Has one flag',
        duration: 0.5, 
        color: 'from-green-400 to-green-600',
        textColor: 'text-green-700'
      },
      { 
        name: 'Sixteenth Note', 
        symbol: '♬', 
        description: 'Has two flags',
        duration: 0.25, 
        color: 'from-blue-400 to-blue-600',
        textColor: 'text-blue-700'
      }
    ];
    
    const playNoteValue = (noteValue: typeof noteValues[0]) => {
      setPlayingNote(noteValue.name);
      playNote(4, noteValue.duration); // Play E note for the duration
      
      setTimeout(() => {
        setPlayingNote(null);
      }, noteValue.duration * 1000);
      
      onInteraction?.('note_value_played', { 
        name: noteValue.name, 
        duration: noteValue.duration 
      });
    };
    
    return (
      <div>
        <h4 className="text-lg font-bold text-purple-800 mb-4 text-center">🎵 Interactive Note Values</h4>
        
        <div className="bg-gradient-to-r from-green-100 to-blue-100 p-6 rounded-xl">
          <p className="text-center text-green-800 mb-6 font-bold text-lg">
            Click on each note to hear how long it lasts! 🎶
          </p>
          
          <div className="space-y-4">
            {noteValues.map((noteValue) => (
              <motion.button
                key={noteValue.name}
                className={`w-full p-6 rounded-2xl border-4 transition-all shadow-lg ${
                  playingNote === noteValue.name
                    ? 'border-purple-500 bg-purple-50 scale-102 shadow-xl'
                    : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50 hover:shadow-lg'
                }`}
                onClick={() => playNoteValue(noteValue)}
                disabled={playingNote === noteValue.name}
                whileHover={{ scale: playingNote === noteValue.name ? 1.02 : 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center justify-between">
                  {/* Left Side - Note Symbol */}
                  <div className="flex items-center gap-6">
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${noteValue.color} flex items-center justify-center shadow-lg`}>
                      <span className="text-4xl text-white drop-shadow-lg">
                        {noteValue.symbol}
                      </span>
                    </div>
                    
                    {/* Note Info */}
                    <div className="text-left">
                      <h5 className={`font-bold text-2xl mb-1 ${noteValue.textColor}`}>
                        {noteValue.name}
                      </h5>
                      <p className="text-gray-600 text-sm mb-2">
                        {noteValue.description}
                      </p>
                      <div className={`inline-block px-4 py-2 rounded-full bg-gradient-to-r ${noteValue.color} text-white text-sm font-bold shadow-md`}>
                        {noteValue.duration} {noteValue.duration === 1 ? 'beat' : 'beats'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Side - Play Button & Status */}
                  <div className="flex items-center gap-4">
                    <div className={`px-6 py-3 rounded-full border-2 transition-all ${
                      playingNote === noteValue.name
                        ? 'border-purple-500 bg-purple-100'
                        : `border-gray-300 bg-white hover:${noteValue.color.split(' ')[0]} hover:${noteValue.color.split(' ')[1]} hover:text-white`
                    }`}>
                      <Play size={24} className={playingNote === noteValue.name ? 'text-purple-600' : 'text-gray-600'} />
                    </div>
                    
                    {/* Playing Indicator */}
                    {playingNote === noteValue.name && (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                        <p className="text-purple-600 font-bold">Playing...</p>
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
                Each note value is half the duration of the previous one. A whole note = 2 half notes = 4 quarter notes = 8 eighth notes!
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border-4 border-green-200 shadow-lg">
              <h6 className="font-bold text-green-800 mb-3 text-lg flex items-center gap-2">
                ⏱️ Time Signatures
              </h6>
              <p className="text-green-700 text-sm leading-relaxed">
                In 4/4 time (most common), a whole note fills an entire measure, while a quarter note gets one beat out of four!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Interactive Rhythm Component
  const InteractiveRhythm = () => {
    const rhythmPatterns = useMemo(() => [
      { name: '4/4 Basic', pattern: [1, 1, 1, 1], description: 'Four quarter notes' },
      { name: 'Syncopated', pattern: [1, 0.5, 0.5, 1, 1], description: 'Quarter, two eighths, two quarters' },
      { name: 'Triplet Feel', pattern: [0.67, 0.33, 0.67, 0.33, 1], description: 'Swing rhythm pattern' },
      { name: 'Complex', pattern: [1, 0.5, 0.25, 0.25, 0.5, 1], description: 'Mixed note values' }
    ], []);

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

    const selectPattern = useCallback((patternIndex: number) => {
      const pattern = rhythmPatterns[patternIndex];
      setSelectedPatternIndex(patternIndex);
      setCurrentPattern([...pattern.pattern]); // Create a new array to avoid reference issues
      console.log('Pattern selected:', pattern.name, pattern.pattern);
    }, [rhythmPatterns]);

    const addToCustomPattern = useCallback((duration: number) => {
      setCustomPattern(prev => [...prev, duration]);
    }, []);

    const clearCustomPattern = useCallback(() => {
      setCustomPattern([]);
    }, []);

    return (
      <div>
        <h4 className="text-lg font-bold text-purple-800 mb-4 text-center">🥁 Interactive Rhythm Patterns</h4>
        
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
                    {duration === 1 ? 'Quarter' : duration === 0.5 ? 'Eighth' : duration === 0.25 ? '16th' : duration === 0.67 ? 'Triplet' : duration === 0.33 ? 'Triplet' : `${duration}x`}
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
                {[1, 0.5, 0.25].map((duration) => (
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
  };

  // Interactive Time Signature Component
  const InteractiveTimeSignature = () => {
    const [currentTimeSignature, setCurrentTimeSignature] = useState<{top: number, bottom: number}>({top: 4, bottom: 4});
    const [isPlayingMeter, setIsPlayingMeter] = useState(false);

    const timeSignatures = [
      { top: 4, bottom: 4, name: 'Four-Four', description: 'Most common - 4 quarter note beats per measure' },
      { top: 3, bottom: 4, name: 'Three-Four', description: 'Waltz time - 3 quarter note beats per measure' },
      { top: 2, bottom: 4, name: 'Two-Four', description: 'March time - 2 quarter note beats per measure' },
      { top: 6, bottom: 8, name: 'Six-Eight', description: 'Compound time - 6 eighth note beats, felt in 2' },
      { top: 5, bottom: 4, name: 'Five-Four', description: 'Irregular meter - 5 quarter note beats per measure' },
      { top: 7, bottom: 8, name: 'Seven-Eight', description: 'Complex meter - 7 eighth note beats per measure' }
    ];

    const playTimeSignature = async (timeSignature: {top: number, bottom: number}) => {
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
        <h4 className="text-lg font-bold text-purple-800 mb-4 text-center">⏱️ Interactive Time Signatures</h4>
        
        <div className="bg-gradient-to-r from-indigo-100 to-purple-100 p-6 rounded-xl">
          {/* Current Time Signature Display */}
          <div className="text-center mb-8">
            <div className="inline-block p-8 bg-white rounded-3xl border-4 border-indigo-300 shadow-lg">
              <div className="text-center">
                <div className="text-6xl font-bold text-indigo-800 mb-2">
                  {currentTimeSignature.top}
                </div>
                <hr className="border-4 border-indigo-600 w-16 mx-auto mb-2"/>
                <div className="text-6xl font-bold text-indigo-800">
                  {currentTimeSignature.bottom}
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <h5 className="text-xl font-bold text-indigo-800 mb-2">
                {timeSignatures.find(ts => ts.top === currentTimeSignature.top && ts.bottom === currentTimeSignature.bottom)?.name || 'Custom'}
              </h5>
              <p className="text-indigo-600 max-w-md mx-auto">
                {timeSignatures.find(ts => ts.top === currentTimeSignature.top && ts.bottom === currentTimeSignature.bottom)?.description || 'Custom time signature'}
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
                  currentTimeSignature.top === timeSignature.top && currentTimeSignature.bottom === timeSignature.bottom
                    ? 'border-indigo-500 bg-indigo-100'
                    : 'border-gray-300 bg-white hover:border-indigo-300'
                }`}
                onClick={() => setCurrentTimeSignature({top: timeSignature.top, bottom: timeSignature.bottom})}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="text-center">
                  <div className="mb-3">
                    <div className="text-3xl font-bold text-indigo-800">{timeSignature.top}</div>
                    <hr className="border-2 border-indigo-600 w-8 mx-auto"/>
                    <div className="text-3xl font-bold text-indigo-800">{timeSignature.bottom}</div>
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
                The top number tells you how many beats are in each measure. The bottom number tells you what type of note gets one beat (4 = quarter note, 8 = eighth note).
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl border-4 border-green-200">
              <h6 className="font-bold text-green-800 mb-3 text-lg flex items-center gap-2">
                🎵 Common Uses
              </h6>
              <p className="text-green-700 text-sm leading-relaxed">
                4/4 is used in pop, rock, and most modern music. 3/4 is perfect for waltzes and ballads. 6/8 creates a flowing, lilting feel!
              </p>
            </div>
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
      case 'staff':
        return <InteractiveStaff />;
      case 'noteValues':
        return <InteractiveNoteValues />;
      case 'rhythm':
        return <InteractiveRhythm />;
      case 'timeSignature':
        return <InteractiveTimeSignature />;
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