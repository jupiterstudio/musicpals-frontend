// src/pages/EarTrainingPage.tsx - Enhanced with Adaptive Difficulty
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, ChevronRight, Brain, Target, TrendingUp, Rocket } from 'lucide-react';
import { Synth, start } from 'tone';
import Layout from '../components/Layout';
import { exerciseAPI, progressAPI } from '../services/api';
import { useEnhancedProgress, useExerciseSession } from '../hooks/useEnhancedProgress';

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

  // Enhanced progress tracking
  const {
    isLoading: progressLoading,
    error: progressError,
    getAdaptiveDifficultyRecommendation,
    getLearningInsights,
    getPersonalizedRecommendations,
  } = useEnhancedProgress();

  const {
    isSessionActive,
    startSession,
    recordMistake,
    recordHintUsed,
    completeSession,
    getNextDifficulty,
    getSessionStats,
  } = useExerciseSession('EarTraining', 'intervals');

  // New state for adaptive features
  const [adaptiveRecommendation, setAdaptiveRecommendation] = useState<any>(null);
  const [learningInsights, setLearningInsights] = useState<any>(null);
  const [personalizedRecommendations, setPersonalizedRecommendations] = useState<any>(null);
  const [showAdaptiveHint, setShowAdaptiveHint] = useState(false);
  const [streakCount, setStreakCount] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);

  // Legacy state for API integration
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

    // Start new session tracking
    if (!sessionStarted) {
      startNewSession();
    }
  }, [selectedDifficulty, selectedExerciseType]);

  // Load adaptive recommendations and insights
  useEffect(() => {
    loadAdaptiveData();
  }, []);

  // Map frontend exercise types to backend enum values
  const mapExerciseType = (exerciseType: string): string => {
    const mapping: { [key: string]: string } = {
      'Intervals': 'interval_recognition',
      'Chords': 'chord_identification', 
      'Notes': 'pitch_matching',
      'Scales': 'sight_reading'
    };
    return mapping[exerciseType] || 'interval_recognition';
  };

  // Ensure difficulty level has correct capitalization
  const mapDifficultyLevel = (difficulty: string): string => {
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
  };

  const startNewSession = () => {
    const exerciseType = mapExerciseType(selectedExerciseType);
    const difficultyLevel = mapDifficultyLevel(selectedDifficulty);
    startSession(exerciseType, difficultyLevel);
    setSessionStarted(true);
    setStreakCount(0);
  };

  const loadAdaptiveData = async () => {
    try {
      // Get adaptive difficulty recommendation
      const recommendation = await getAdaptiveDifficultyRecommendation('EarTraining', 'intervals');
      setAdaptiveRecommendation(recommendation);

      // Get learning insights
      const insights = await getLearningInsights(30);
      setLearningInsights(insights);

      // Get personalized recommendations
      const personalizedRecs = await getPersonalizedRecommendations('EarTraining');
      setPersonalizedRecommendations(personalizedRecs);

      // If user has adaptive recommendation that differs from selected difficulty, show hint
      if (recommendation && recommendation.recommendedLevel !== selectedDifficulty) {
        setShowAdaptiveHint(true);
      }
    } catch (error) {
      console.error('Error loading adaptive data:', error);
    }
  };

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
      setStreakCount(prev => prev + 1);
    } else {
      // Record mistake for adaptive learning
      recordMistake(selectedExerciseType);
      setStreakCount(0);

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

  // Function to provide adaptive hints based on exercise type
  const getAdaptiveHint = (): string => {
    if (!currentChallenge) return 'Keep trying!';

    switch (selectedExerciseType) {
      case 'Intervals':
        if (currentChallenge.semitones <= 2) {
          return 'This interval sounds very close together!';
        } else if (currentChallenge.semitones >= 10) {
          return 'This interval sounds very far apart!';
        } else {
          return 'Listen for how the two notes relate to each other.';
        }
      case 'Chords':
        if (currentChallenge.name.includes('Major')) {
          return 'This chord sounds happy and bright!';
        } else if (currentChallenge.name.includes('Minor')) {
          return 'This chord sounds sad or mysterious!';
        } else {
          return 'Listen to the overall mood of the chord.';
        }
      case 'Notes':
        return `This note is in the ${currentChallenge.difficulty} category!`;
      case 'Scales':
        if (currentChallenge.name.includes('Major')) {
          return 'This scale sounds bright and cheerful!';
        } else if (currentChallenge.name.includes('Minor')) {
          return 'This scale has a darker, more mysterious sound!';
        } else {
          return 'Listen to the unique character of this scale!';
        }
      default:
        return 'Focus on the distinctive sound qualities!';
    }
  };

  // Function to go to next challenge
  const handleNextChallenge = async () => {
    console.log('Next Adventure clicked!', {
      selectedOption,
      feedback,
      isSubmitting,
      currentChallengeNumber,
      totalChallenges,
    });

    if (isSubmitting) return; // Prevent double-clicks

    setIsSubmitting(true);
    try {
      if (currentChallengeNumber < totalChallenges) {
        console.log('Moving to next challenge:', currentChallengeNumber + 1);
        setCurrentChallengeNumber(prev => prev + 1);
        generateNewChallenge();
        console.log('New challenge generated');

        // Update score if answer was correct
        if (feedback?.startsWith('Correct')) {
          // Score was already updated in handleOptionSelect
        }
      } else {
        // Completed all challenges
        const accuracy = Math.round((score / totalChallenges) * 100);
        alert(`🎉 Training complete!\nScore: ${score}/${totalChallenges} (${accuracy}%)`);

        // Reset for a new training session
        setCurrentChallengeNumber(1);
        setScore(0);
        generateNewChallenge();
        completedExercises.clear();
      }
    } catch (error) {
      console.error('Error handling next challenge:', error);
      alert('Error moving to next challenge. Please try again.');
    } finally {
      setIsSubmitting(false);
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
        className="container mx-auto py-8 px-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Page Header */}
        <motion.div className="kid-welcome-section" variants={itemVariants}>
          <div
            className="flex justify-between items-center"
            style={{ position: 'relative', zIndex: 2 }}
          >
            <div>
              <h2 className="kid-title text-3xl mb-2">Ear Training Fun! 👂🎵</h2>
              <p className="kid-subtitle text-lg">
                Can you guess the mystery sounds? Let's train your super hearing powers!
              </p>

              {/* Session stats */}
              {isSessionActive && (
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm bg-blue-100 px-2 py-1 rounded-full">
                    ⏱️ {Math.floor((getSessionStats()?.timeElapsed || 0) / 60)}:
                    {((getSessionStats()?.timeElapsed || 0) % 60).toString().padStart(2, '0')}
                  </span>
                  {streakCount > 0 && (
                    <span className="text-sm bg-orange-100 px-2 py-1 rounded-full">
                      🔥 Streak: {streakCount}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="musical-icon text-6xl">🕵️</div>
          </div>
        </motion.div>

        {/* Adaptive Difficulty Hint */}
        <AnimatePresence>
          {showAdaptiveHint && adaptiveRecommendation && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-4 p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl border-4 border-purple-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Brain className="text-purple-600" size={24} />
                  <div>
                    <h4 className="font-bold text-purple-800">🤖 AI Recommendation</h4>
                    <p className="text-sm text-purple-700">
                      Based on your progress, try{' '}
                      <strong>{adaptiveRecommendation.recommendedLevel}</strong> difficulty!
                      {adaptiveRecommendation.reasoning}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedDifficulty(adaptiveRecommendation.recommendedLevel);
                      setShowAdaptiveHint(false);
                    }}
                    className="px-3 py-1 bg-purple-500 text-white rounded-full text-sm font-bold hover:bg-purple-600"
                  >
                    Try It!
                  </button>
                  <button
                    onClick={() => setShowAdaptiveHint(false)}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded-full text-sm font-bold hover:bg-gray-400"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Difficulty Selection with Adaptive Recommendations */}
        <motion.div className="mt-6 kid-welcome-section" variants={itemVariants}>
          <div className="flex flex-col items-center" style={{ position: 'relative', zIndex: 2 }}>
            <h3 className="kid-title text-xl mb-4">Choose Your Challenge Level! 🎯</h3>

            {/* Show adaptive recommendation if available */}
            {adaptiveRecommendation && (
              <div className="mb-4 p-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl border-2 border-blue-200">
                <div className="flex items-center gap-2 justify-center">
                  <Brain size={16} className="text-blue-600" />
                  <span className="text-sm font-bold text-blue-800">
                    AI suggests:{' '}
                    <span className="text-purple-600">
                      {adaptiveRecommendation.recommendedLevel}
                    </span>
                  </span>
                  <span className="text-xs text-blue-600">
                    ({Math.round(adaptiveRecommendation.confidenceScore * 100)}% confidence)
                  </span>
                </div>
              </div>
            )}

            <div className="flex space-x-4 flex-wrap justify-center">
              {difficultyLevels.map((level, index) => {
                const isRecommended = adaptiveRecommendation?.recommendedLevel === level;
                return (
                  <motion.button
                    key={level}
                    className={`py-3 px-6 rounded-full font-bold text-lg relative ${
                      selectedDifficulty === level
                        ? 'kid-button'
                        : 'bg-white border-4 border-pink-200 text-gray-700 hover:border-pink-300 hover:bg-pink-50'
                    } transition-all shadow-lg ${
                      isRecommended ? 'ring-2 ring-purple-400 ring-offset-2' : ''
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedDifficulty(level)}
                  >
                    {isRecommended && (
                      <motion.div
                        className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5, type: 'spring' }}
                      >
                        <Brain size={12} className="text-white" />
                      </motion.div>
                    )}
                    {index === 0 && '🌟 '}
                    {index === 1 && '⭐ '}
                    {index === 2 && '🚀 '}
                    {level}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Exercise Type Selection */}
        <motion.div className="mt-4 kid-welcome-section" variants={itemVariants}>
          <div className="flex flex-col items-center" style={{ position: 'relative', zIndex: 2 }}>
            <h3 className="kid-title text-xl mb-4">
              What Musical Mystery Do You Want to Solve? 🔍
            </h3>
            <div className="flex items-center flex-wrap justify-center gap-3">
              {exerciseTypes.map((type, index) => {
                const emojis = ['🎵', '🎼', '🎹', '🎶', '🎭'];
                return (
                  <motion.button
                    key={type}
                    className={`py-3 px-6 rounded-full font-bold text-base ${
                      selectedExerciseType === type
                        ? 'kid-button'
                        : 'bg-white border-4 border-teal-200 text-gray-700 hover:border-teal-300 hover:bg-teal-50'
                    } transition-all shadow-lg`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedExerciseType(type)}
                  >
                    {emojis[index]} {type}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Enhanced Audio Player */}
        <motion.div className="mt-6 kid-welcome-section" variants={itemVariants}>
          <h3
            className="activity-title text-center mb-4"
            style={{ position: 'relative', zIndex: 2 }}
          >
            🎧 Listen and Identify! 🎧
          </h3>

          <div className="flex flex-col items-center" style={{ position: 'relative', zIndex: 2 }}>
            <p className="text-center kid-subtitle mb-6">
              {selectedExerciseType === 'Intervals' &&
                '🎵 Listen to the musical interval and pick the right answer! Can you hear the magic? ✨'}
              {selectedExerciseType === 'Chords' &&
                '🎹 Listen to the chord and choose the correct one! Feel the harmony! 🌈'}
              {selectedExerciseType === 'Notes' &&
                '🎶 Listen to the note and find its name! Every note has a story! 📖'}
              {selectedExerciseType === 'Scales' &&
                '🎼 Listen to the scale and select the right one! Climb the musical ladder! 🪜'}
            </p>

            {/* Challenge Title */}
            <div className="w-full max-w-lg mb-6 text-center">
              <p className="text-sm text-gray-500">
                Listen carefully and select the correct answer below
              </p>
            </div>

            <motion.button
              className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg mb-6"
              style={{
                background: 'linear-gradient(45deg, #FF6B9D, #4ECDC4)',
                color: 'white',
              }}
              onClick={playChallenge}
              disabled={isPlaying}
              whileHover={{ scale: 1.1, boxShadow: '0 15px 40px rgba(255, 107, 157, 0.4)' }}
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
                    className="w-1 rounded-full"
                    style={{ backgroundColor: '#FF6B9D' }}
                    initial={{ height: 5 }}
                    animate={{
                      height: value * 40,
                      backgroundColor: ['#FF6B9D', '#4ECDC4', '#FFE66D'],
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
                  className={`p-4 rounded-2xl text-center font-bold kid-subtitle ${
                    feedback.startsWith('Correct')
                      ? 'bg-green-100 text-green-700 border-4 border-green-300'
                      : 'bg-red-100 text-red-700 border-4 border-red-300'
                  }`}
                >
                  {feedback.startsWith('Correct') ? '🎉 ' : '😅 '}
                  {feedback}

                  {/* Adaptive hint after incorrect answer */}
                  {!feedback.startsWith('Correct') && attemptCount > 1 && (
                    <div className="mt-2 p-3 bg-yellow-100 rounded-lg border-2 border-yellow-300">
                      <button
                        onClick={() => {
                          recordHintUsed();
                          setFeedback(`${feedback} 💡 Hint: ${getAdaptiveHint()}`);
                        }}
                        className="text-sm bg-yellow-400 px-3 py-1 rounded-full hover:bg-yellow-500 transition-colors"
                      >
                        💡 Get Hint
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* API Error Message */}
            {apiError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl text-center bg-red-100 text-red-700 border-4 border-red-300 font-bold kid-subtitle mt-2"
              >
                😅 {apiError}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Answer Options */}
        <motion.div className="mt-6 kid-welcome-section" variants={itemVariants}>
          <h3
            className="activity-title text-center mb-6"
            style={{ position: 'relative', zIndex: 2 }}
          >
            🎯 Pick Your Answer! 🎯
          </h3>
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            style={{ position: 'relative', zIndex: 2 }}
          >
            {options.map((option, index) => (
              <motion.div
                key={index}
                className={`kid-card cursor-pointer ${
                  selectedOption === index
                    ? option.name === currentChallenge.name
                      ? 'ring-4 ring-green-400 bg-green-50'
                      : 'ring-4 ring-red-400 bg-red-50'
                    : ''
                }`}
                variants={itemVariants}
                whileHover={{ y: -10, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOptionSelect(index)}
              >
                <div className="activity-title text-lg text-center mb-2">{option.name}</div>

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
                        <div
                          className="w-4 bg-gray-800 rounded-sm"
                          style={{ height: '40px' }}
                        ></div>
                        <div
                          className="w-4 bg-gray-800 rounded-sm"
                          style={{ height: `${40 + option.semitones * 3}px` }}
                        ></div>
                      </div>
                    ) : (
                      <div className="flex items-end h-16 space-x-2">
                        <div
                          className="w-4 bg-gray-800 rounded-sm"
                          style={{ height: '40px' }}
                        ></div>
                        <div
                          className="w-4 bg-gray-800 rounded-sm"
                          style={{ height: '40px' }}
                        ></div>
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
        </motion.div>

        {/* Navigation and Progress */}
        <motion.div className="mt-8 kid-welcome-section" variants={itemVariants}>
          <div
            className="flex flex-col md:flex-row justify-between items-center gap-4"
            style={{ position: 'relative', zIndex: 2 }}
          >
            <div className="flex items-center flex-1">
              <span className="kid-subtitle font-bold mr-4">
                🌟 Challenge Progress: {currentChallengeNumber}/{totalChallenges} 🌟
              </span>
              <div className="kid-progress-bar flex-1">
                <motion.div
                  className="kid-progress-fill progress-ear-training"
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentChallengeNumber / totalChallenges) * 100}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>

            <motion.button
              className={`kid-button ${
                !feedback || isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              whileHover={{
                scale: !feedback || isSubmitting ? 1 : 1.1,
              }}
              whileTap={{
                scale: !feedback || isSubmitting ? 1 : 0.95,
              }}
              onClick={handleNextChallenge}
              disabled={!feedback || isSubmitting}
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
                  ✨ Saving Magic...
                </>
              ) : (
                <>
                  <Rocket size={24} className="mr-1" />
                  Next Adventure!
                  <ChevronRight size={16} className="ml-1" />
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Enhanced Session Stats */}
        <motion.div className="mt-4 kid-welcome-section" variants={itemVariants}>
          <div
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
            style={{ position: 'relative', zIndex: 2 }}
          >
            <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-4 rounded-2xl border-4 border-green-200">
              <div className="flex items-center gap-3">
                <Target className="text-green-600" size={24} />
                <div>
                  <div className="font-bold text-green-800">🏆 Score</div>
                  <div className="text-sm text-green-600">
                    {score}/{currentChallengeNumber - 1}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-100 to-yellow-100 p-4 rounded-2xl border-4 border-orange-200">
              <div className="flex items-center gap-3">
                <TrendingUp className="text-orange-600" size={24} />
                <div>
                  <div className="font-bold text-orange-800">🔥 Streak</div>
                  <div className="text-sm text-orange-600">{streakCount} correct</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-4 rounded-2xl border-4 border-purple-200">
              <div className="flex items-center gap-3">
                <Brain className="text-purple-600" size={24} />
                <div>
                  <div className="font-bold text-purple-800">⭐ Adventures</div>
                  <div className="text-sm text-purple-600">{completedExercises.size} completed</div>
                </div>
              </div>
            </div>
          </div>

          {/* Learning Insights Display */}
          {learningInsights && (
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl border-4 border-blue-200">
              <h4 className="font-bold text-blue-800 mb-2">📊 Your Learning Journey</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-bold text-blue-700">Practice Time</div>
                  <div className="text-blue-600">
                    {Math.round(learningInsights.totalPracticeTime / 60)}min
                  </div>
                </div>
                <div>
                  <div className="font-bold text-blue-700">Avg Score</div>
                  <div className="text-blue-600">{Math.round(learningInsights.averageScore)}%</div>
                </div>
                <div>
                  <div className="font-bold text-blue-700">Strongest Skill</div>
                  <div className="text-blue-600">
                    {learningInsights.strongestSkills?.[0] || 'Building up!'}
                  </div>
                </div>
                <div>
                  <div className="font-bold text-blue-700">Progress</div>
                  <div className="text-blue-600">{learningInsights.engagementTrend}</div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.main>
    </Layout>
  );
};

export default EarTrainingPage;
