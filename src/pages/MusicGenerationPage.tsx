// src/pages/MusicGenerationPage.tsx
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Music,
  ZoomIn,
  ZoomOut,
  ChevronUp,
  ChevronDown,
  Save,
  Award,
} from 'lucide-react';
import Layout from '../components/Layout';
import { exerciseAPI, progressAPI, achievementAPI } from '../services/api';

// Import Magenta and music-related libraries
// Note: These imports might need adjustment based on your actual setup
let mvae: any = null;
let core: any = null;

// Try to dynamically import Magenta libraries
try {
  import('@magenta/music/es6/music_vae').then(module => {
    mvae = module;
  });

  import('@magenta/music/es6/core').then(module => {
    core = module;
  });
} catch (error) {
  console.error('Error importing Magenta libraries:', error);
}

// Sample melodies for the bottom section (in case generation isn't working)
const sampleMelodies = [
  {
    id: 0,
    name: 'Twinkle Little Star',
    notes: [
      { pitch: 60, startTime: 0.0, endTime: 0.5, velocity: 80 },
      { pitch: 60, startTime: 0.5, endTime: 1.0, velocity: 80 },
      { pitch: 67, startTime: 1.0, endTime: 1.5, velocity: 80 },
      { pitch: 67, startTime: 1.5, endTime: 2.0, velocity: 80 },
      { pitch: 69, startTime: 2.0, endTime: 2.5, velocity: 80 },
      { pitch: 69, startTime: 2.5, endTime: 3.0, velocity: 80 },
      { pitch: 67, startTime: 3.0, endTime: 4.0, velocity: 80 },
    ],
  },
  {
    id: 1,
    name: 'Happy Birthday',
    notes: [
      { pitch: 60, startTime: 0.0, endTime: 0.5, velocity: 80 },
      { pitch: 60, startTime: 0.5, endTime: 1.0, velocity: 80 },
      { pitch: 62, startTime: 1.0, endTime: 2.0, velocity: 80 },
      { pitch: 60, startTime: 2.0, endTime: 3.0, velocity: 80 },
      { pitch: 65, startTime: 3.0, endTime: 4.0, velocity: 80 },
      { pitch: 64, startTime: 4.0, endTime: 6.0, velocity: 80 },
    ],
  },
  {
    id: 2,
    name: 'Jingle Bells',
    notes: [
      { pitch: 64, startTime: 0.0, endTime: 0.5, velocity: 80 },
      { pitch: 64, startTime: 0.5, endTime: 1.0, velocity: 80 },
      { pitch: 64, startTime: 1.0, endTime: 2.0, velocity: 80 },
      { pitch: 64, startTime: 2.0, endTime: 2.5, velocity: 80 },
      { pitch: 64, startTime: 2.5, endTime: 3.0, velocity: 80 },
      { pitch: 64, startTime: 3.0, endTime: 4.0, velocity: 80 },
      { pitch: 64, startTime: 4.0, endTime: 4.5, velocity: 80 },
      { pitch: 67, startTime: 4.5, endTime: 5.0, velocity: 80 },
      { pitch: 60, startTime: 5.0, endTime: 5.5, velocity: 80 },
      { pitch: 62, startTime: 5.5, endTime: 6.0, velocity: 80 },
      { pitch: 64, startTime: 6.0, endTime: 8.0, velocity: 80 },
    ],
  },
  {
    id: 3,
    name: 'Fur Elise',
    notes: [
      { pitch: 76, startTime: 0.0, endTime: 0.5, velocity: 80 },
      { pitch: 75, startTime: 0.5, endTime: 1.0, velocity: 80 },
      { pitch: 76, startTime: 1.0, endTime: 1.5, velocity: 80 },
      { pitch: 75, startTime: 1.5, endTime: 2.0, velocity: 80 },
      { pitch: 76, startTime: 2.0, endTime: 2.5, velocity: 80 },
      { pitch: 71, startTime: 2.5, endTime: 3.0, velocity: 80 },
      { pitch: 74, startTime: 3.0, endTime: 3.5, velocity: 80 },
      { pitch: 72, startTime: 3.5, endTime: 4.0, velocity: 80 },
      { pitch: 69, startTime: 4.0, endTime: 5.0, velocity: 80 },
    ],
  },
];

// Define interface for note objects
interface Note {
  pitch: number;
  startTime: number;
  endTime: number;
  velocity: number;
  quantizedStartStep?: number;
  quantizedEndStep?: number;
}

// Interface for user progress
interface UserProgress {
  moduleType: string;
  progress: number;
  lastUpdated: string;
  exercises: any[];
}

// Interface for saved melody
interface SavedMelody {
  id: string;
  name: string;
  notes: Note[];
  dateCreated: string;
}

const MusicGenerationPage = () => {
  const [model, setModel] = useState<any | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedNotes, setGeneratedNotes] = useState<Note[]>([]);
  const [player, setPlayer] = useState<any | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [currentPlayingSample, setCurrentPlayingSample] = useState<number | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(
    'Loading Magenta libraries...'
  );

  // Piano roll visualization constants and state
  const [keyHeight, setKeyHeight] = useState(10); // Slightly increased for better visibility
  const [lowestMidiNote, setLowestMidiNote] = useState(48); // C3 - lower than before
  const NUM_KEYS = 36; // 3 octaves - increased range
  const SVG_HEIGHT = NUM_KEYS * keyHeight;
  const SVG_WIDTH = 800;
  const PIXELS_PER_SECOND = 100;

  // API-related state
  const [userId, setUserId] = useState<string>('demo-user-id');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [melodiesSaved, setMelodiesSaved] = useState<number>(0);
  const [savedMelodies, setSavedMelodies] = useState<SavedMelody[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveMelodyName, setSaveMelodyName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [melodyMakerUnlocked, setMelodyMakerUnlocked] = useState(false);
  const [showAchievementNotification, setShowAchievementNotification] = useState(false);

  // Reference for animation frame
  const playbackRef = useRef<number | null>(null);

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

  // Fetch user data and achievements
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch achievements to check if Melody Maker is already unlocked
        const achievementsResponse = await achievementAPI.getUserAchievements();
        const achievements = achievementsResponse.data;

        const hasMelodyMaker = achievements.some(
          (achievement: any) => achievement.name === 'Melody Maker'
        );

        setMelodyMakerUnlocked(hasMelodyMaker);

        // Fetch progress for Music Generation module
        const progressResponse = await progressAPI.getUserProgress();
        const progressData = progressResponse.data;

        const musicGenerationProgress = progressData.find(
          (module: any) => module.moduleType === 'MusicGeneration'
        );

        if (musicGenerationProgress) {
          setUserProgress(musicGenerationProgress);
          setMelodiesSaved(musicGenerationProgress.exercises.length);
        }

        // In a real app, you might fetch saved melodies from a dedicated API endpoint
        // For demo purposes, we'll use the exercises from progress
        if (musicGenerationProgress && musicGenerationProgress.exercises) {
          const mockSavedMelodies: SavedMelody[] = musicGenerationProgress.exercises.map(
            (exercise: any, index: number) => ({
              id: exercise.id.toString(),
              name: exercise.name,
              notes: sampleMelodies[index % sampleMelodies.length].notes, // Use sample notes as a placeholder
              dateCreated: exercise.completedDate,
            })
          );

          setSavedMelodies(mockSavedMelodies);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        // Non-blocking - continue with app functionality
      }
    };

    fetchUserData();
  }, []);

  // Load the MusicVAE model and player when component mounts
  useEffect(() => {
    const loadModel = async () => {
      if (!mvae || !core) {
        // If libraries aren't loaded yet, set a timer to try again
        const checkInterval = setInterval(() => {
          if (mvae && core) {
            clearInterval(checkInterval);
            actuallyLoadModel();
          }
        }, 500);

        return () => clearInterval(checkInterval);
      } else {
        actuallyLoadModel();
      }
    };

    const actuallyLoadModel = async () => {
      try {
        setLoadingMessage('Loading MusicVAE model...');

        // Initialize MusicVAE model
        // Reference URL might vary based on actual deployment location
        const musicVAE = new mvae.MusicVAE(
          'https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/mel_4bar_med_q2'
        );

        await musicVAE.initialize();
        setModel(musicVAE);
        setLoadingMessage('Loading SoundFont player...');

        // Initialize player
        const soundFontPlayer = new core.SoundFontPlayer(
          'https://storage.googleapis.com/magentadata/js/soundfonts/salamander'
        );

        await soundFontPlayer.loadSamples(core.sequences.createQuantizedNoteSequence());
        setPlayer(soundFontPlayer);
        setLoadingMessage(null);

        // Load sample notes for initial display
        setGeneratedNotes(sampleMelodies[0].notes);
      } catch (error) {
        console.error('Error loading model or player:', error);
        setLoadingMessage('Error loading Magenta. Using fallback mode.');

        // Load sample notes for initial display despite error
        setGeneratedNotes(sampleMelodies[0].notes);
      }
    };

    loadModel();

    // Clean up animation frames on unmount
    return () => {
      if (playbackRef.current !== null) {
        cancelAnimationFrame(playbackRef.current);
      }
    };
  }, []);

  // When notes change, adjust the visible range to ensure all notes are visible
  useEffect(() => {
    if (generatedNotes.length > 0) {
      // Find the highest and lowest pitch in the current notes
      const pitches = generatedNotes.map(note => note.pitch);
      const minPitch = Math.min(...pitches);
      const maxPitch = Math.max(...pitches);

      // Add some padding (one octave) to make sure we show context
      const desiredMinPitch = Math.max(21, minPitch - 12); // Don't go below A0 (21)
      const desiredMaxPitch = Math.min(108, maxPitch + 12); // Don't go above C8 (108)

      // Set the lowest note to show, ensuring we capture all notes plus padding
      // and that we show at least 3 octaves worth of keys
      const newLowestNote = Math.min(
        desiredMinPitch,
        desiredMaxPitch - 36 // Ensure we can fit at least 3 octaves
      );

      setLowestMidiNote(newLowestNote);
    }
  }, [generatedNotes]);

  // Extract note information from the sequence
  const processSequence = (sequence: any): Note[] => {
    if (!sequence || !sequence.notes) {
      console.log('No notes found in sequence');
      return [];
    }

    // Get the quantization info from the sequence
    const stepsPerQuarter = sequence.quantizationInfo?.stepsPerQuarter || 4;
    const qpm = sequence.tempos && sequence.tempos.length > 0 ? sequence.tempos[0].qpm || 120 : 120; // Default to 120 BPM if not specified

    // Calculate seconds per step (for conversion)
    const secondsPerStep = 60 / qpm / stepsPerQuarter;

    // Extract notes from the sequence
    const notes = sequence.notes.map((note: any) => {
      // If startTime and endTime are 0 or not set, calculate from quantized steps
      const startTime =
        note.startTime !== 0 && note.startTime != null
          ? note.startTime
          : (note.quantizedStartStep || 0) * secondsPerStep;

      const endTime =
        note.endTime !== 0 && note.endTime != null
          ? note.endTime
          : (note.quantizedEndStep || 0) * secondsPerStep;

      return {
        pitch: note.pitch ?? 0,
        startTime,
        endTime,
        velocity: note.velocity ?? 80,
        quantizedStartStep: note.quantizedStartStep ?? 0,
        quantizedEndStep: note.quantizedEndStep ?? 0,
      };
    });

    return notes;
  };

  // Generate and play a new melody
  const generateAndPlay = async () => {
    if (!model || !player) {
      console.error('Model or player not loaded');

      // Use a sample melody as fallback
      setGeneratedNotes(sampleMelodies[Math.floor(Math.random() * sampleMelodies.length)].notes);
      return;
    }

    setIsGenerating(true);
    setCurrentPlayingSample(null);

    try {
      // Generate one new melody
      const samples = await model.sample(1);
      const generatedSequence = samples[0];

      // Process and store the notes
      const notes = processSequence(generatedSequence);

      if (notes.length === 0) {
        throw new Error('No notes generated');
      }

      setGeneratedNotes(notes);

      // Play the melody
      setIsPlaying(true);
      setCurrentTime(0);

      // Start playback
      await player.start(generatedSequence);

      // Set up a timer to check when playback is done
      const checkPlaybackStatus = () => {
        if (player && !player.isPlaying()) {
          setIsPlaying(false);
          setCurrentTime(0);
        } else {
          setTimeout(checkPlaybackStatus, 500);
        }
      };

      checkPlaybackStatus();

      // Check for Melody Maker achievement if this is the first generation
      if (!melodyMakerUnlocked) {
        try {
          await achievementAPI.unlockAchievement(
            'Melody Maker',
            'Generate your first original melody',
            'music'
          );

          setMelodyMakerUnlocked(true);
          setShowAchievementNotification(true);

          // Hide notification after 5 seconds
          setTimeout(() => {
            setShowAchievementNotification(false);
          }, 5000);
        } catch (err) {
          console.error('Error unlocking achievement:', err);
        }
      }
    } catch (error) {
      console.error('Error generating music:', error);

      // Use a sample melody as fallback
      const randomSample = sampleMelodies[Math.floor(Math.random() * sampleMelodies.length)];
      setGeneratedNotes(randomSample.notes);
      setIsPlaying(false);
    } finally {
      setIsGenerating(false);
    }
  };

  // Save the current melody
  const handleSaveMelody = async () => {
    if (generatedNotes.length === 0) {
      alert('No melody to save! Generate a melody first.');
      return;
    }

    setShowSaveDialog(true);
  };

  // Confirm saving the melody
  const confirmSaveMelody = async () => {
    if (!saveMelodyName.trim()) {
      alert('Please enter a name for your melody');
      return;
    }

    setIsSaving(true);

    try {
      // Record exercise completion as a way to track saved melodies
      await exerciseAPI.recordExerciseCompletion(
        'MusicGeneration',
        Date.now().toString(), // Use timestamp as ID
        saveMelodyName,
        100, // Perfect score for saving
        'Medium'
      );

      // Update progress for the Music Generation module
      const newMelodiesSaved = melodiesSaved + 1;
      setMelodiesSaved(newMelodiesSaved);

      // Calculate new progress percentage
      // In a real app, this could be more sophisticated
      const newProgress = Math.min(100, Math.floor(newMelodiesSaved * 10)); // 10% per melody, up to 100%

      await progressAPI.updateProgress('MusicGeneration', newProgress);

      // Update saved melodies list
      const newSavedMelody: SavedMelody = {
        id: Date.now().toString(),
        name: saveMelodyName,
        notes: generatedNotes,
        dateCreated: new Date().toISOString(),
      };

      setSavedMelodies([newSavedMelody, ...savedMelodies]);

      // Success message
      alert(`"${saveMelodyName}" saved successfully!`);

      // Reset dialog
      setShowSaveDialog(false);
      setSaveMelodyName('');
    } catch (err) {
      console.error('Error saving melody:', err);
      alert('Failed to save melody. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Play/pause the current melody
  const togglePlayback = () => {
    if (isPlaying) {
      // Stop playback
      if (player) {
        player.stop();
      }
      setIsPlaying(false);
      setCurrentTime(0);

      // Stop the animation frame
      if (playbackRef.current !== null) {
        cancelAnimationFrame(playbackRef.current);
        playbackRef.current = null;
      }
    } else {
      // Start playback
      playCurrent();
    }
  };

  // Play the current melody
  const playCurrent = async (notesToPlay = generatedNotes) => {
    try {
      if (!player || notesToPlay.length === 0) return;

      setIsPlaying(true);
      setCurrentTime(0);

      // Create a note sequence for playback
      const noteSequence = {
        notes: notesToPlay.map(note => ({
          pitch: note.pitch,
          startTime: note.startTime,
          endTime: note.endTime,
          velocity: note.velocity,
        })),
        totalTime: Math.max(...notesToPlay.map(note => note.endTime)),
      };

      // Start playback
      await player.start(noteSequence);

      // Set up a timer to check when playback is done
      const checkPlaybackStatus = () => {
        if (player && !player.isPlaying()) {
          setIsPlaying(false);
          setCurrentTime(0);
        } else {
          setTimeout(checkPlaybackStatus, 500);
        }
      };

      checkPlaybackStatus();
    } catch (error) {
      console.error('Error playing melody:', error);
      setIsPlaying(false);
    }
  };

  // Play a sample melody
  const playSampleMelody = (id: number) => {
    if (isPlaying) {
      // Stop current playback
      if (player) {
        player.stop();
      }
      setIsPlaying(false);
      setCurrentTime(0);

      // Stop the animation frame
      if (playbackRef.current !== null) {
        cancelAnimationFrame(playbackRef.current);
        playbackRef.current = null;
      }
    }

    // Set the selected sample
    const sample = sampleMelodies.find(sample => sample.id === id);
    if (!sample) return;

    setGeneratedNotes(sample.notes);
    setCurrentPlayingSample(id);

    // Start playback with a small delay to allow state update
    setTimeout(() => {
      playCurrent(sample.notes);
    }, 100);
  };

  // Play a saved melody
  const playSavedMelody = (melody: SavedMelody) => {
    if (isPlaying) {
      // Stop current playback
      if (player) {
        player.stop();
      }
      setIsPlaying(false);
      setCurrentTime(0);

      // Stop the animation frame
      if (playbackRef.current !== null) {
        cancelAnimationFrame(playbackRef.current);
        playbackRef.current = null;
      }
    }

    setGeneratedNotes(melody.notes);
    setCurrentPlayingSample(null);

    // Start playback with a small delay to allow state update
    setTimeout(() => {
      playCurrent(melody.notes);
    }, 100);
  };

  // Animation frame to update currentTime during playback
  useEffect(() => {
    if (isPlaying) {
      let startTimestamp: number | null = null;
      const sequenceDuration =
        generatedNotes.length > 0 ? Math.max(...generatedNotes.map(note => note.endTime)) : 0;

      const updateTime = (timestamp: number) => {
        if (startTimestamp === null) {
          startTimestamp = timestamp;
        }

        // Calculate elapsed time in seconds
        const elapsed = (timestamp - startTimestamp) / 1000;
        setCurrentTime(elapsed);

        // Continue animation if still playing
        if (isPlaying) {
          // Stop if we've reached the end of the sequence
          if (elapsed >= sequenceDuration) {
            setIsPlaying(false);
            setCurrentTime(0);
            return;
          }

          playbackRef.current = requestAnimationFrame(updateTime);
        }
      };

      playbackRef.current = requestAnimationFrame(updateTime);

      // Cleanup function
      return () => {
        if (playbackRef.current !== null) {
          cancelAnimationFrame(playbackRef.current);
          playbackRef.current = null;
        }
      };
    }
  }, [isPlaying, generatedNotes]);

  // Get note name from MIDI pitch
  const getNoteNameFromPitch = (pitch: number) => {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteName = noteNames[pitch % 12];
    const octave = Math.floor(pitch / 12) - 1;
    return `${noteName}${octave}`;
  };

  // Determine the duration of the sequence to set SVG width
  const sequenceDuration =
    generatedNotes.length > 0 ? Math.max(...generatedNotes.map(note => note.endTime)) : 0;

  // Calculate SVG width based on sequence duration
  const svgWidth = Math.max(SVG_WIDTH, sequenceDuration * PIXELS_PER_SECOND);

  // Zoom in/out on the piano roll
  const handleZoomIn = () => {
    if (keyHeight < 20) {
      setKeyHeight(keyHeight + 2);
    }
  };

  const handleZoomOut = () => {
    if (keyHeight > 6) {
      setKeyHeight(keyHeight - 2);
    }
  };

  // Move the visible range up/down
  const handleMoveUp = () => {
    if (lowestMidiNote > 21) {
      // Don't go below A0
      setLowestMidiNote(lowestMidiNote - 12); // Move up by an octave
    }
  };

  const handleMoveDown = () => {
    if (lowestMidiNote + NUM_KEYS < 108) {
      // Don't go above C8
      setLowestMidiNote(lowestMidiNote + 12); // Move down by an octave
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (err) {
      return dateString; // Return original string if parsing fails
    }
  };

  return (
    <Layout>
      <motion.main
        className="container mx-auto py-8 px-6 sound-wave-background"
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
            <h2 className="text-2xl font-bold text-gray-800">Music Generation</h2>
            <p className="text-gray-600">Create and explore melodies with the piano roll</p>
          </div>
          <div className="text-indigo-600">
            <Music size={32} />
          </div>
        </motion.div>

        {/* Achievement Notification */}
        <AnimatePresence>
          {showAchievementNotification && (
            <motion.div
              className="fixed top-4 right-4 bg-yellow-50 border border-yellow-300 shadow-md rounded-lg p-4 z-50 flex items-center"
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
            >
              <Award className="text-yellow-500 mr-3" size={24} />
              <div>
                <h4 className="font-bold text-yellow-800">Achievement Unlocked!</h4>
                <p className="text-yellow-700">Melody Maker: Generate your first original melody</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generation Controls */}
        <motion.div className="mt-6 bg-white rounded-lg shadow-sm p-6" variants={itemVariants}>
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <span className="font-semibold text-gray-700 mr-4">Create New Melody:</span>
            </div>
            <motion.button
              className="py-2 px-8 rounded-full bg-indigo-600 text-white font-medium flex items-center transition-all"
              onClick={generateAndPlay}
              disabled={isGenerating || !model}
              whileHover={{ scale: 1.05, backgroundColor: '#4338ca' }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 1 }} // Ensure initial visibility
              animate={{ opacity: 1 }} // Maintain visibility in animated state
            >
              {isGenerating ? (
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
                  Generating...
                </>
              ) : (
                <>
                  <Music size={16} className="mr-2" />
                  Generate Melody
                </>
              )}
            </motion.button>
            {/* Save Button */}
            <motion.button
              className="py-2 px-6 rounded-full border border-indigo-600 text-indigo-600 font-medium flex items-center bg-white"
              onClick={handleSaveMelody}
              disabled={generatedNotes.length === 0 || isGenerating}
              whileHover={{ scale: 1.05, backgroundColor: '#f9fafb' }}
              whileTap={{ scale: 0.95 }}
            >
              <Save size={16} className="mr-2" />
              Save Melody
            </motion.button>

            {/* Total Melodies Saved */}
            <div className="ml-auto px-3 py-1 bg-indigo-50 rounded-full text-indigo-700 text-sm flex items-center">
              <Music size={14} className="mr-1" />
              <span>
                {melodiesSaved} {melodiesSaved === 1 ? 'Melody' : 'Melodies'} Saved
              </span>
            </div>
          </div>

          {loadingMessage && (
            <div className="mt-3 text-amber-600 font-medium text-sm">{loadingMessage}</div>
          )}

          {error && <div className="mt-3 text-red-600 text-sm">{error}</div>}
        </motion.div>

        {/* Piano Roll Display */}
        <motion.div className="mt-6 bg-white rounded-lg shadow-sm p-6" variants={itemVariants}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-700">Generated Melody:</h3>
            <div className="flex items-center space-x-2">
              {/* View Controls */}
              <div className="flex border border-gray-200 rounded-md mr-4">
                <button onClick={handleZoomIn} className="p-2 hover:bg-gray-100" title="Zoom In">
                  <ZoomIn size={16} className="text-gray-600" />
                </button>
                <button onClick={handleZoomOut} className="p-2 hover:bg-gray-100" title="Zoom Out">
                  <ZoomOut size={16} className="text-gray-600" />
                </button>
                <button
                  onClick={handleMoveUp}
                  className="p-2 hover:bg-gray-100"
                  title="Move Up (Show Higher Notes)"
                >
                  <ChevronUp size={16} className="text-gray-600" />
                </button>
                <button
                  onClick={handleMoveDown}
                  className="p-2 hover:bg-gray-100"
                  title="Move Down (Show Lower Notes)"
                >
                  <ChevronDown size={16} className="text-gray-600" />
                </button>
              </div>

              {/* Play/Pause Button */}
              <motion.button
                onClick={togglePlayback}
                className={`w-10 h-10 rounded-full ${
                  isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'
                } flex items-center justify-center text-white`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                disabled={generatedNotes.length === 0}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </motion.button>
            </div>
          </div>

          {/* Piano Roll */}
          <div className="piano-roll-container relative border border-gray-200 rounded-md overflow-hidden">
            <div className="flex">
              {/* Piano Keys */}
              <div className="piano-keys w-12 border-r border-gray-200 bg-white">
                {Array.from({ length: NUM_KEYS }).map((_, index) => {
                  const pitch = lowestMidiNote + NUM_KEYS - 1 - index;
                  const isBlackKey = [1, 3, 6, 8, 10].includes(pitch % 12);
                  const noteName = getNoteNameFromPitch(pitch);

                  return (
                    <div
                      key={pitch}
                      className={`flex items-center justify-end pr-1 text-xs ${
                        isBlackKey ? 'bg-gray-200 text-gray-800' : 'bg-white text-gray-600'
                      } border-b border-gray-300`}
                      style={{ height: `${keyHeight}px` }}
                    >
                      {/* Only show labels for C notes and white keys */}
                      {pitch % 12 === 0 && <span>{noteName}</span>}
                    </div>
                  );
                })}
              </div>

              {/* Piano Roll Visualization */}
              <div
                className="piano-grid relative overflow-x-auto"
                style={{ width: 'calc(100% - 3rem)' }}
              >
                <svg width={svgWidth} height={NUM_KEYS * keyHeight}>
                  {/* Background grid */}
                  {Array.from({ length: NUM_KEYS }).map((_, index) => {
                    const pitch = lowestMidiNote + NUM_KEYS - 1 - index;
                    const isBlackKey = [1, 3, 6, 8, 10].includes(pitch % 12);

                    return (
                      <rect
                        key={`bg-${pitch}`}
                        x="0"
                        y={index * keyHeight}
                        width={svgWidth}
                        height={keyHeight}
                        fill={isBlackKey ? '#f3f4f6' : '#ffffff'}
                        stroke="#e5e7eb"
                        strokeWidth="1"
                      />
                    );
                  })}

                  {/* Vertical lines for each second */}
                  {Array.from({ length: Math.ceil(sequenceDuration) + 1 }).map((_, second) => (
                    <line
                      key={`second-${second}`}
                      x1={second * PIXELS_PER_SECOND}
                      y1="0"
                      x2={second * PIXELS_PER_SECOND}
                      y2={NUM_KEYS * keyHeight}
                      stroke="#e5e7eb"
                      strokeWidth={second % 4 === 0 ? '2' : '1'}
                    />
                  ))}

                  {/* Notes */}
                  {generatedNotes.map((note, index) => {
                    // Calculate position based on current display range
                    const pitch = note.pitch;

                    // Check if the note is within the visible range
                    if (pitch < lowestMidiNote || pitch >= lowestMidiNote + NUM_KEYS) {
                      return null; // Skip notes outside the visible range
                    }

                    const y = (NUM_KEYS - 1 - (pitch - lowestMidiNote)) * keyHeight;
                    const x = note.startTime * PIXELS_PER_SECOND;
                    const width = (note.endTime - note.startTime) * PIXELS_PER_SECOND;

                    // Check if this note is currently playing
                    const isNoteActive =
                      isPlaying && currentTime >= note.startTime && currentTime < note.endTime;

                    return (
                      <rect
                        key={`note-${index}`}
                        x={x}
                        y={y + 1} // Add 1px margin
                        width={width}
                        height={keyHeight - 2} // Subtract 2px for margin
                        fill={isNoteActive ? '#ef4444' : '#4f46e5'}
                        stroke={isNoteActive ? '#b91c1c' : '#3730a3'}
                        strokeWidth={isNoteActive ? '2' : '1'}
                        rx="2"
                        ry="2"
                      />
                    );
                  })}

                  {/* Current time indicator (vertical line) */}
                  {isPlaying && (
                    <line
                      x1={currentTime * PIXELS_PER_SECOND}
                      y1="0"
                      x2={currentTime * PIXELS_PER_SECOND}
                      y2={NUM_KEYS * keyHeight}
                      stroke="#ef4444"
                      strokeWidth="2"
                    />
                  )}
                </svg>
              </div>
            </div>
          </div>

          {/* Note Count Indicator */}
          <div className="mt-2 text-sm text-gray-500 flex justify-between items-center">
            <div>
              {generatedNotes.length > 0 ? (
                <>
                  <span className="font-medium">Notes:</span> {generatedNotes.length} |
                  <span className="font-medium ml-2">Range:</span>{' '}
                  {getNoteNameFromPitch(Math.min(...generatedNotes.map(n => n.pitch)))} to{' '}
                  {getNoteNameFromPitch(Math.max(...generatedNotes.map(n => n.pitch)))} |
                  <span className="font-medium ml-2">Duration:</span> {sequenceDuration.toFixed(1)}s
                </>
              ) : (
                'No notes to display'
              )}
            </div>
            <div>
              <span className="text-xs text-gray-400">
                Use zoom and navigation controls to adjust view
              </span>
            </div>
          </div>

          {/* Playback Progress Bar */}
          {generatedNotes.length > 0 && (
            <div className="mt-4 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-indigo-600 rounded-full"
                style={{
                  width: `${Math.min(
                    100,
                    (currentTime / Math.max(...generatedNotes.map(n => n.endTime))) * 100
                  )}%`,
                }}
              ></motion.div>
            </div>
          )}
        </motion.div>

        {/* Saved Melodies Section (if available) */}
        {savedMelodies.length > 0 && (
          <motion.div className="mt-6 bg-white rounded-lg shadow-sm p-6" variants={itemVariants}>
            <h3 className="font-semibold text-gray-700 mb-4">Your Saved Melodies:</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {savedMelodies.map(melody => (
                <motion.div
                  key={melody.id}
                  className="bg-white border rounded-lg p-4 shadow-sm"
                  whileHover={{ y: -5, boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)' }}
                >
                  <h4 className="font-medium text-gray-800 mb-2">{melody.name}</h4>

                  {/* Mini Piano Roll */}
                  <div className="mini-piano-roll h-16 relative bg-gray-50 rounded border border-gray-200 mb-3 overflow-hidden">
                    {/* Notes visualization */}
                    {melody.notes.map((note, index) => {
                      const totalDuration = Math.max(...melody.notes.map(n => n.endTime));
                      const top = 100 - (note.pitch - 60) * 3; // Position notes vertically

                      return (
                        <div
                          key={index}
                          className="absolute h-2 rounded-sm bg-blue-500"
                          style={{
                            top: `${top}%`,
                            left: `${(note.startTime / totalDuration) * 100}%`,
                            width: `${((note.endTime - note.startTime) / totalDuration) * 100}%`,
                          }}
                        />
                      );
                    })}
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{formatDate(melody.dateCreated)}</span>

                    {/* Play button */}
                    <motion.button
                      className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white"
                      onClick={() => playSavedMelody(melody)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Play size={14} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Sample Melodies Section */}
        <motion.div className="mt-6 bg-white rounded-lg shadow-sm p-6" variants={itemVariants}>
          <h3 className="font-semibold text-gray-700 mb-4">Sample Melodies:</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sampleMelodies.map(sample => (
              <motion.div
                key={sample.id}
                className={`bg-white border rounded-lg p-4 shadow-sm ${
                  currentPlayingSample === sample.id ? 'ring-2 ring-indigo-500' : ''
                }`}
                whileHover={{ y: -5, boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)' }}
              >
                <h4 className="font-medium text-gray-800 mb-2">{sample.name}</h4>

                {/* Mini Piano Roll */}
                <div className="mini-piano-roll h-16 relative bg-gray-50 rounded border border-gray-200 mb-3 overflow-hidden">
                  {/* Piano keys indicator */}
                  <div className="absolute left-0 top-0 bottom-0 w-2 bg-gray-100 border-r border-gray-200"></div>

                  {/* Notes */}
                  {sample.notes.map((note, index) => {
                    const top = 100 - (note.pitch - 60) * 5; // Position notes vertically

                    return (
                      <div
                        key={index}
                        className={`absolute h-2 rounded-sm ${
                          currentPlayingSample === sample.id &&
                          isPlaying &&
                          currentTime >= note.startTime &&
                          currentTime < note.endTime
                            ? 'bg-red-500'
                            : 'bg-indigo-500'
                        }`}
                        style={{
                          top: `${top}%`,
                          left: `${(note.startTime / 8) * 100 + 2}%`, // Scale to 100% width
                          width: `${((note.endTime - note.startTime) / 8) * 100}%`,
                        }}
                      />
                    );
                  })}

                  {/* Playback position indicator */}
                  {currentPlayingSample === sample.id && isPlaying && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                      style={{
                        left: `${(currentTime / 8) * 100 + 2}%`,
                      }}
                    />
                  )}
                </div>

                {/* Play button */}
                <motion.button
                  className={`w-8 h-8 rounded-full ${
                    currentPlayingSample === sample.id && isPlaying
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  } flex items-center justify-center text-white`}
                  onClick={() => playSampleMelody(sample.id)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {currentPlayingSample === sample.id && isPlaying ? (
                    <Pause size={14} />
                  ) : (
                    <Play size={14} />
                  )}
                </motion.button>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Save Melody Dialog */}
        {showSaveDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Save Melody</h3>

              <div className="mb-4">
                <label htmlFor="melodyName" className="block text-gray-700 mb-2">
                  Melody Name:
                </label>
                <input
                  type="text"
                  id="melodyName"
                  className="w-full border border-gray-300 rounded-md p-2"
                  value={saveMelodyName}
                  onChange={e => setSaveMelodyName(e.target.value)}
                  placeholder="Enter a name for your melody"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
                  onClick={() => {
                    setShowSaveDialog(false);
                    setSaveMelodyName('');
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </button>

                <button
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md flex items-center"
                  onClick={confirmSaveMelody}
                  disabled={isSaving || !saveMelodyName.trim()}
                >
                  {isSaving ? (
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
                      <Save size={16} className="mr-2" />
                      Save Melody
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.main>
    </Layout>
  );
};

export default MusicGenerationPage;
