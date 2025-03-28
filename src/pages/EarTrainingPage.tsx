// src/pages/EarTrainingPage.tsx - With API Integration
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, ChevronRight } from 'lucide-react';
import { Synth, start } from 'tone';
import Layout from '../components/Layout';
import { exerciseAPI, progressAPI } from '../services/api';

// Define the difficulty levels
const difficultyLevels = ['Easy', 'Medium', 'Hard'];

// Define the exercise types
const exerciseTypes = ['Notes', 'Intervals', 'Chords', 'Scales', 'Melody'];

// Define the intervals with their names and semitone counts
const intervals = [
  { name: 'Unison', semitones: 0, difficulty: 'Easy' },
  { name: 'Minor Second', semitones: 1, difficulty: 'Medium' },
  { name: 'Major Second', semitones: 2, difficulty: 'Easy' },
  { name: 'Minor Third', semitones: 3, difficulty: 'Medium' },
  { name: 'Major Third', semitones: 4, difficulty: 'Easy' },
  { name: 'Perfect Fourth', semitones: 5, difficulty: 'Medium' },
  { name: 'Tritone', semitones: 6, difficulty: 'Hard' },
  { name: 'Perfect Fifth', semitones: 7, difficulty: 'Easy' },
  { name: 'Minor Sixth', semitones: 8, difficulty: 'Medium' },
  { name: 'Major Sixth', semitones: 9, difficulty: 'Medium' },
  { name: 'Minor Seventh', semitones: 10, difficulty: 'Hard' },
  { name: 'Major Seventh', semitones: 11, difficulty: 'Hard' },
  { name: 'Octave', semitones: 12, difficulty: 'Easy' },
];

// Define the chords with their names and semitone patterns
const chords = [
  { name: 'Major Triad', pattern: [0, 4, 7], difficulty: 'Easy' },
  { name: 'Minor Triad', pattern: [0, 3, 7], difficulty: 'Easy' },
  { name: 'Augmented Triad', pattern: [0, 4, 8], difficulty: 'Medium' },
  { name: 'Diminished Triad', pattern: [0, 3, 6], difficulty: 'Medium' },
  { name: 'Dominant Seventh', pattern: [0, 4, 7, 10], difficulty: 'Medium' },
  { name: 'Major Seventh', pattern: [0, 4, 7, 11], difficulty: 'Hard' },
  { name: 'Minor Seventh', pattern: [0, 3, 7, 10], difficulty: 'Hard' },
  { name: 'Half-Diminished Seventh', pattern: [0, 3, 6, 10], difficulty: 'Hard' },
];

// Define the note names
const notes = [
  { name: 'C', difficulty: 'Easy' },
  { name: 'D', difficulty: 'Easy' },
  { name: 'E', difficulty: 'Easy' },
  { name: 'F', difficulty: 'Easy' },
  { name: 'G', difficulty: 'Easy' },
  { name: 'A', difficulty: 'Easy' },
  { name: 'B', difficulty: 'Easy' },
  { name: 'C#', difficulty: 'Medium' },
  { name: 'D#', difficulty: 'Medium' },
  { name: 'F#', difficulty: 'Medium' },
  { name: 'G#', difficulty: 'Medium' },
  { name: 'A#', difficulty: 'Medium' },
];

// Define the scales
const scales = [
  { name: 'Major Scale', pattern: [0, 2, 4, 5, 7, 9, 11, 12], difficulty: 'Easy' },
  { name: 'Natural Minor Scale', pattern: [0, 2, 3, 5, 7, 8, 10, 12], difficulty: 'Easy' },
  { name: 'Harmonic Minor Scale', pattern: [0, 2, 3, 5, 7, 8, 11, 12], difficulty: 'Medium' },
  { name: 'Melodic Minor Scale', pattern: [0, 2, 3, 5, 7, 9, 11, 12], difficulty: 'Medium' },
  { name: 'Dorian Mode', pattern: [0, 2, 3, 5, 7, 9, 10, 12], difficulty: 'Hard' },
  { name: 'Phrygian Mode', pattern: [0, 1, 3, 5, 7, 8, 10, 12], difficulty: 'Hard' },
  { name: 'Lydian Mode', pattern: [0, 2, 4, 6, 7, 9, 11, 12], difficulty: 'Hard' },
  { name: 'Mixolydian Mode', pattern: [0, 2, 4, 5, 7, 9, 10, 12], difficulty: 'Hard' },
];

// Function to get a note from MIDI number
const getNoteFromMidi = (midiNumber: number): string => {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midiNumber / 12) - 1;
  const noteName = noteNames[midiNumber % 12];
  return `${noteName}${octave}`;
};

// Used to track which exercises have been completed in this session
// to avoid recording the same exercise multiple times
const completedExercises = new Set<string>();

const EarTrainingPage = () => {
  const [selectedDifficulty, setSelectedDifficulty] = useState('Easy');
  const [selectedExerciseType, setSelectedExerciseType] = useState('Intervals');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentChallenge, setCurrentChallenge] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [totalChallenges, setTotalChallenges] = useState(10);
  const [currentChallengeNumber, setCurrentChallengeNumber] = useState(1);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);

  // New state for API integration
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [sessionProgress, setSessionProgress] = useState(0);

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

  // Waveform animation data (simplified representation)
  const waveform = Array.from({ length: 15 }, () => Math.random() * 0.5 + 0.3);

  // Initialize a challenge when component mounts or when difficulty/exercise type changes
  useEffect(() => {
    generateNewChallenge();
    // Reset the set of completed exercises when parameters change
    completedExercises.clear();
  }, [selectedDifficulty, selectedExerciseType]);

  // Function to generate a new challenge based on the selected difficulty and exercise type
  const generateNewChallenge = () => {
    setSelectedOption(null);
    setFeedback(null);
    setAttemptCount(0);

    let challenge, challengeOptions;

    switch (selectedExerciseType) {
      case 'Intervals':
        // Filter intervals based on selected difficulty
        {
          const filteredIntervals = intervals.filter(
            interval => interval.difficulty === selectedDifficulty
          );

          // Select a random interval from the filtered list
          challenge = filteredIntervals[Math.floor(Math.random() * filteredIntervals.length)];

          // Generate options (one correct, three incorrect)
          challengeOptions = generateOptions(intervals, challenge);
        }
        break;

      case 'Chords':
        {
          // Filter chords based on selected difficulty
          const filteredChords = chords.filter(chord => chord.difficulty === selectedDifficulty);

          // Select a random chord from the filtered list
          challenge = filteredChords[Math.floor(Math.random() * filteredChords.length)];

          // Generate options
          challengeOptions = generateOptions(chords, challenge);
        }
        break;

      case 'Notes':
        {
          // Filter notes based on selected difficulty
          const filteredNotes = notes.filter(note => note.difficulty === selectedDifficulty);

          // Select a random note from the filtered list
          challenge = filteredNotes[Math.floor(Math.random() * filteredNotes.length)];

          // Generate options
          challengeOptions = generateOptions(notes, challenge);
        }
        break;

      case 'Scales':
        {
          // Filter scales based on selected difficulty
          const filteredScales = scales.filter(scale => scale.difficulty === selectedDifficulty);

          // Select a random scale from the filtered list
          challenge = filteredScales[Math.floor(Math.random() * filteredScales.length)];

          // Generate options
          challengeOptions = generateOptions(scales, challenge);
        }
        break;

      default:
        challenge = intervals[0];
        challengeOptions = generateOptions(intervals, challenge);
    }

    setCurrentChallenge(challenge);
    setOptions(challengeOptions);
  };

  // Function to generate options for the challenge
  const generateOptions = (sourceArray: any[], correctOption: any) => {
    // Create a copy of the source array excluding the correct option
    const availableOptions = sourceArray.filter(item => item.name !== correctOption.name);

    // Shuffle the available options
    const shuffledOptions = [...availableOptions].sort(() => Math.random() - 0.5);

    // Take 3 random options and add the correct one
    const options = shuffledOptions.slice(0, 3);
    options.push(correctOption);

    // Shuffle again to randomize the position of the correct answer
    return options.sort(() => Math.random() - 0.5);
  };

  // Function to play the current challenge
  const playChallenge = async () => {
    setIsPlaying(true);

    try {
      // Start the audio context
      await start();

      const synth = new Synth().toDestination();

      // Determine what to play based on the exercise type
      if (selectedExerciseType === 'Intervals') {
        const rootNote = 'C4'; // Base note
        const interval = currentChallenge;

        // Convert note to frequency
        const secondNote = getNoteFromMidi(60 + interval.semitones); // C4 is MIDI 60

        // Play the interval
        synth.triggerAttackRelease(rootNote, '8n');
        setTimeout(() => {
          synth.triggerAttackRelease(secondNote, '8n');
        }, 500);
      } else if (selectedExerciseType === 'Chords') {
        const rootNote = 60; // C4 in MIDI
        const chord = currentChallenge;

        // Play chord notes sequentially first (arpeggio)
        chord.pattern.forEach((semitones: number, index: number) => {
          setTimeout(() => {
            const note = getNoteFromMidi(rootNote + semitones);
            synth.triggerAttackRelease(note, '8n');
          }, index * 300);
        });

        // Then play them together
        setTimeout(() => {
          // Create multiple synths for chord
          const chordNotes = chord.pattern.map((semitones: number) =>
            getNoteFromMidi(rootNote + semitones)
          );

          // Use a PolySynth in a real implementation
          chordNotes.forEach((note: string, index: number) => {
            setTimeout(() => {
              synth.triggerAttackRelease(note, '2n');
            }, index * 30); // Small delay between notes to avoid audio glitches
          });
        }, chord.pattern.length * 300 + 500);
      } else if (selectedExerciseType === 'Notes') {
        // Just play a single note
        const note = currentChallenge.name + '4'; // Add octave 4
        synth.triggerAttackRelease(note, '4n');
      } else if (selectedExerciseType === 'Scales') {
        const rootNote = 60; // C4 in MIDI
        const scale = currentChallenge;

        // Play scale notes sequentially
        scale.pattern.forEach((semitones: number, index: number) => {
          setTimeout(() => {
            const note = getNoteFromMidi(rootNote + semitones);
            synth.triggerAttackRelease(note, '8n');
          }, index * 250);
        });
      }

      // Set timeout to stop the isPlaying state
      setTimeout(() => {
        setIsPlaying(false);
      }, 3000);
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  const handleOptionSelect = (index: number) => {
    // Don't allow selecting the same option twice
    if (selectedOption === index) return;

    // If already selected a correct answer, don't allow changing
    if (feedback?.startsWith('Correct')) return;

    setSelectedOption(index);
    setAttemptCount(prev => prev + 1);

    const isCorrect = options[index].name === currentChallenge.name;

    if (isCorrect) {
      setFeedback('Correct!');
      setScore(score => score + 1);
    } else {
      // Show feedback but DON'T reset selectedOption to null
      // This ensures the Next button stays enabled
      setFeedback(`Incorrect. That was ${options[index].name}, not ${currentChallenge.name}.`);

      // We no longer need this timeout that was causing the button to disable itself
      // setTimeout(() => {
      //   setSelectedOption(null);
      // }, 1000);
    }
  };

  // NEW FUNCTION: Record exercise completion to the API
  const recordExerciseCompletion = async () => {
    // Create a unique identifier for this exercise to prevent duplicate submissions
    const exerciseId = `${selectedExerciseType}-${currentChallenge.name}-${selectedDifficulty}`;

    // Skip if we've already recorded this exercise in this session
    if (completedExercises.has(exerciseId)) {
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      // In a real implementation, use this API call:

      await exerciseAPI.recordExerciseCompletion(
        'EarTraining',
        exerciseId,
        `${selectedExerciseType} - ${currentChallenge.name}`,
        score > 0 ? 100 : 0, // 100% if correct, 0% if incorrect
        selectedDifficulty
      );

      // For demo, simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mark this exercise as completed in this session
      completedExercises.add(exerciseId);

      // Update session progress
      setSessionProgress(prev => prev + 1);

      // Every 5 completed exercises, update the overall module progress
      if (sessionProgress % 5 === 0) {
        updateModuleProgress();
      }
    } catch (error) {
      console.error('Error recording exercise completion:', error);
      setApiError('Failed to record progress. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // NEW FUNCTION: Update overall module progress
  const updateModuleProgress = async () => {
    try {
      // Calculate new progress value (this would normally come from the backend)
      // Here we're using a simple formula based on completed exercises and score
      const progressValue = Math.min(
        100,
        Math.round(sessionProgress * 2 + (score / currentChallengeNumber) * 10)
      );

      // In a real implementation, use this API call:

      await progressAPI.updateProgress('EarTraining', progressValue);

      // For demo, simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error('Error updating module progress:', error);
    }
  };

  // Function to go to next challenge
  const handleNextChallenge = async () => {
    // Record this exercise completion to the API
    await recordExerciseCompletion();

    if (currentChallengeNumber < totalChallenges) {
      setCurrentChallengeNumber(prev => prev + 1);
      generateNewChallenge();
    } else {
      // Completed all challenges - update final progress
      await updateModuleProgress();

      // Alert the user
      alert(`Training complete! Your score: ${score}/${totalChallenges}`);

      // Reset for a new training session
      setCurrentChallengeNumber(1);
      setScore(0);
      generateNewChallenge();
      completedExercises.clear();
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
            <h2 className="text-2xl font-bold text-gray-800">Ear Training</h2>
            <p className="text-gray-600">Train your ears to recognize musical elements</p>
          </div>
          <div className="text-indigo-600">
            <Volume2 size={32} />
          </div>
        </motion.div>

        {/* Difficulty Selection */}
        <motion.div className="mt-6 bg-white rounded-lg shadow-sm p-6" variants={itemVariants}>
          <div className="flex items-center">
            <span className="font-semibold text-gray-700 mr-4">Difficulty:</span>
            <div className="flex space-x-3">
              {difficultyLevels.map(level => (
                <motion.button
                  key={level}
                  className={`py-1.5 px-6 rounded-full ${
                    selectedDifficulty === level
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                  } text-sm font-medium`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedDifficulty(level)}
                >
                  {level}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Exercise Type Selection */}
        <motion.div className="mt-4 bg-white rounded-lg shadow-sm p-6" variants={itemVariants}>
          <div className="flex items-center flex-wrap">
            <span className="font-semibold text-gray-700 mr-4 mb-2">Exercise Type:</span>
            <div className="flex flex-wrap gap-3">
              {exerciseTypes.map(type => (
                <motion.button
                  key={type}
                  className={`py-1.5 px-6 rounded-full ${
                    selectedExerciseType === type
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                  } text-sm font-medium`}
                  whileHover={{
                    scale: 1.05,
                    backgroundColor: selectedExerciseType === type ? '#4338ca' : '#f3f4f6',
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedExerciseType(type)}
                >
                  {type}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Audio Player */}
        <motion.div className="mt-6 bg-white rounded-lg shadow-sm p-6" variants={itemVariants}>
          <h3 className="font-semibold text-gray-700 mb-2">Listen and Identify:</h3>

          <div className="flex flex-col items-center">
            <p className="text-center text-gray-600 mb-6">
              {selectedExerciseType === 'Intervals' &&
                'Listen to the interval and select the correct answer below'}
              {selectedExerciseType === 'Chords' &&
                'Listen to the chord and select the correct answer below'}
              {selectedExerciseType === 'Notes' &&
                'Listen to the note and select the correct answer below'}
              {selectedExerciseType === 'Scales' &&
                'Listen to the scale and select the correct answer below'}
            </p>

            <motion.button
              className="bg-indigo-600 text-white w-20 h-20 rounded-full flex items-center justify-center shadow-md mb-6"
              onClick={playChallenge}
              disabled={isPlaying}
              whileHover={{ scale: 1.05, boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.5)' }}
              whileTap={{ scale: 0.95 }}
            >
              <Volume2 size={32} />
            </motion.button>

            {/* Audio Waveform Visualization */}
            <div className="h-12 flex items-center justify-center gap-1 mb-4">
              {isPlaying &&
                waveform.map((value, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-indigo-500 rounded-full"
                    initial={{ height: 5 }}
                    animate={{
                      height: value * 40,
                      backgroundColor: [
                        'rgb(99, 102, 241)',
                        'rgb(79, 70, 229)',
                        'rgb(99, 102, 241)',
                      ],
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      repeatType: 'reverse',
                      delay: i * 0.05,
                    }}
                  />
                ))}
            </div>

            {/* Feedback message */}
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`p-2 rounded-md text-center ${
                    feedback.startsWith('Correct') ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {feedback}
                </motion.div>
              )}
            </AnimatePresence>

            {/* API Error Message */}
            {apiError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-2 rounded-md text-center text-red-600 mt-2"
              >
                {apiError}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Answer Options */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {options.map((option, index) => (
            <motion.div
              key={index}
              className={`bg-white rounded-lg shadow-sm p-4 cursor-pointer ${
                selectedOption === index
                  ? option.name === currentChallenge.name
                    ? 'ring-2 ring-green-500 bg-green-50'
                    : 'ring-2 ring-red-500 bg-red-50'
                  : ''
              }`}
              variants={itemVariants}
              whileHover={{ y: -5, boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)' }}
              onClick={() => handleOptionSelect(index)}
            >
              <div className="text-xl font-bold text-center text-gray-800 mb-2">{option.name}</div>

              {/* Visual representation based on exercise type */}
              {selectedExerciseType === 'Notes' && (
                <div className="flex flex-col items-center">
                  <div className="w-full h-32 flex flex-col justify-center relative">
                    <div className="border-t border-black absolute w-full top-1/4"></div>
                    <div className="border-t border-black absolute w-full top-1/3"></div>
                    <div className="border-t border-black absolute w-full top-1/2"></div>
                    <div className="border-t border-black absolute w-full top-2/3"></div>
                    <div className="border-t border-black absolute w-full top-3/4"></div>

                    {/* Note positioning (simplified) */}
                    <motion.div
                      className="w-5 h-5 bg-black rounded-full absolute left-1/2 transform -translate-x-1/2"
                      style={{
                        top: `${65 + index * 5}%`, // Just for visual variety in demo
                      }}
                      animate={selectedOption === index ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}

              {/* For intervals, we could show a visualization of the interval */}
              {selectedExerciseType === 'Intervals' && (
                <div className="flex justify-center items-center h-20">
                  {option.semitones ? (
                    <div className="flex items-end h-16 space-x-2">
                      <div className="w-4 bg-gray-800 rounded-sm" style={{ height: '40px' }}></div>
                      <div
                        className="w-4 bg-gray-800 rounded-sm"
                        style={{ height: `${40 + option.semitones * 3}px` }}
                      ></div>
                    </div>
                  ) : (
                    <div className="flex items-end h-16 space-x-2">
                      <div className="w-4 bg-gray-800 rounded-sm" style={{ height: '40px' }}></div>
                      <div className="w-4 bg-gray-800 rounded-sm" style={{ height: '40px' }}></div>
                    </div>
                  )}
                </div>
              )}

              {/* For chords, show a simplified chord diagram */}
              {selectedExerciseType === 'Chords' && option.pattern && (
                <div className="flex justify-center items-center h-20">
                  <div className="flex items-end h-16 space-x-1">
                    {option.pattern.map((semitone: number, i: number) => (
                      <div
                        key={i}
                        className="w-3 bg-gray-800 rounded-sm"
                        style={{ height: `${30 + semitone * 2}px` }}
                      ></div>
                    ))}
                  </div>
                </div>
              )}

              {/* For scales, show a simplified scale pattern */}
              {selectedExerciseType === 'Scales' && option.pattern && (
                <div className="flex justify-center items-center h-20">
                  <div className="flex items-end h-16 space-x-1">
                    {option.pattern.map((semitone: number, i: number) => (
                      <div
                        key={i}
                        className="w-2 bg-gray-800 rounded-sm"
                        style={{ height: `${20 + semitone * 1.5}px` }}
                      ></div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Navigation and Progress */}
        <motion.div className="mt-8 flex justify-between items-center" variants={itemVariants}>
          <div className="bg-white p-4 rounded-lg shadow-sm flex items-center w-3/4">
            <span className="text-gray-600 mr-4">
              Progress: {currentChallengeNumber}/{totalChallenges}
            </span>
            <div className="relative flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="absolute top-0 left-0 h-full bg-indigo-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(currentChallengeNumber / totalChallenges) * 100}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>

          <motion.button
            className={`bg-indigo-600 text-white py-2 px-6 rounded-lg flex items-center font-medium ${
              !selectedOption || isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            whileHover={{ backgroundColor: '#4338ca' }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNextChallenge}
            disabled={!selectedOption || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                Next Challenge
                <ChevronRight size={16} className="ml-1" />
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Session Stats */}
        <motion.div
          className="mt-4 bg-white rounded-lg shadow-sm p-4 text-sm text-gray-600"
          variants={itemVariants}
        >
          <div className="flex justify-between">
            <span>
              Session score: {score}/{currentChallengeNumber - 1}
            </span>
            <span>Exercises completed this session: {completedExercises.size}</span>
          </div>
        </motion.div>
      </motion.main>
    </Layout>
  );
};

export default EarTrainingPage;
