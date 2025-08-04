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
import { exerciseAPI, progressAPI, achievementAPI, musicGenerationAPI } from '../services/api';
import { useEnhancedProgress, useExerciseSession } from '../hooks/useEnhancedProgress';
import { SuccessModal, ErrorModal } from '../components/Modal';

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

  // Modal state
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    icon?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    icon: '🎉',
  });

  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  // Reference for animation frame
  const playbackRef = useRef<number | null>(null);

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
  } = useExerciseSession('MusicGeneration', 'composition');

  // AI Generation State
  const [aiGenerationOptions, setAiGenerationOptions] = useState({
    genre: 'pop',
    mood: 'happy',
    tempo: 120,
    complexity: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    duration: 8,
  });
  const [showAiOptions, setShowAiOptions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [sessionStarted, setSessionStarted] = useState(false);

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

  // Modal helper functions
  const showSuccessModal = (title: string, message: string, icon: string = '🎉') => {
    setSuccessModal({
      isOpen: true,
      title,
      message,
      icon,
    });
  };

  const showErrorModal = (title: string, message: string) => {
    setErrorModal({
      isOpen: true,
      title,
      message,
    });
  };

  const closeSuccessModal = () => {
    setSuccessModal(prev => ({ ...prev, isOpen: false }));
  };

  const closeErrorModal = () => {
    setErrorModal(prev => ({ ...prev, isOpen: false }));
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
          setMelodiesSaved(musicGenerationProgress.exercises?.length || 0);
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
    loadAiSuggestions();
  }, []);

  // Load AI suggestions and recommendations
  const loadAiSuggestions = async () => {
    try {
      const suggestions = await musicGenerationAPI.getPersonalizedSuggestions();
      setAiSuggestions(suggestions.data.data);

      // Update AI generation options based on suggestions
      if (suggestions.data.data?.nextComplexityLevel) {
        setAiGenerationOptions(prev => ({
          ...prev,
          complexity: suggestions.data.data.nextComplexityLevel,
        }));
      }
    } catch (error) {
      console.error('Error loading AI suggestions:', error);
    }
  };

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

  // Generate melody using AI service
  const generateWithAI = async () => {
    setIsGenerating(true);
    setCurrentPlayingSample(null);

    try {
      // Start session tracking
      if (!sessionStarted) {
        // Map complexity to valid difficulty enum values and use valid exercise type
        const difficultyMap = {
          beginner: 'Easy',
          intermediate: 'Medium',
          advanced: 'Hard',
        };
        startSession(
          'melody_composition',
          difficultyMap[aiGenerationOptions.complexity] || 'Medium'
        );
        setSessionStarted(true);
      }

      // Get user progress for personalized generation
      const userProgress = await getLearningInsights(30);

      // Call AI generation service
      const response = await musicGenerationAPI.generateMelody({
        ...aiGenerationOptions,
        userProgress,
      });

      if (response.data?.data?.notes) {
        const notes = response.data.data.notes.map((note: any) => ({
          pitch: note.pitch,
          startTime: note.startTime,
          endTime: note.endTime,
          velocity: note.velocity,
          quantizedStartStep: note.quantizedStartStep,
          quantizedEndStep: note.quantizedEndStep,
        }));

        setGeneratedNotes(notes);

        // Play the generated melody
        setTimeout(() => {
          playCurrent(notes);
        }, 100);

        // Check for achievements
        await checkAchievements();

        showSuccessModal(
          'AI Melody Generated!',
          `Successfully created a ${response.data.data.metadata?.genre} melody in ${response.data.data.metadata?.keySignature}! 🎵`,
          '🤖'
        );
      } else {
        throw new Error('No notes received from AI service');
      }
    } catch (error) {
      console.error('Error generating AI music:', error);

      // Fallback to algorithmic generation
      await generateAndPlay();
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate and play a new melody (enhanced version)
  const generateAndPlay = async () => {
    // Use AI generation if options are set, otherwise use Magenta
    if (showAiOptions) {
      return generateWithAI();
    }

    if (!model || !player) {
      console.error('Model or player not loaded');

      // Use a sample melody as fallback
      setGeneratedNotes(sampleMelodies[Math.floor(Math.random() * sampleMelodies.length)].notes);
      return;
    }

    setIsGenerating(true);
    setCurrentPlayingSample(null);

    try {
      // Start session tracking
      if (!sessionStarted) {
        startSession('melody_composition', 'Medium');
        setSessionStarted(true);
      }

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

      // Check for achievements
      await checkAchievements();
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

  // Check and unlock achievements
  const checkAchievements = async () => {
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
  };

  // Save the current melody
  const handleSaveMelody = async () => {
    if (generatedNotes.length === 0) {
      showErrorModal('No Melody Found', 'Please generate a melody first before saving! 🎵');
      return;
    }

    setShowSaveDialog(true);
  };

  // Confirm saving the melody
  const confirmSaveMelody = async () => {
    if (!saveMelodyName.trim()) {
      showErrorModal('Name Required', 'Please enter a name for your melody before saving! ✏️');
      return;
    }

    setIsSaving(true);

    try {
      // Use AI music service to save melody
      const melodyData = {
        name: saveMelodyName,
        notes: generatedNotes,
        metadata: {
          genre: aiGenerationOptions.genre,
          mood: aiGenerationOptions.mood,
          tempo: aiGenerationOptions.tempo,
          duration: Math.max(...generatedNotes.map(n => n.endTime)),
          complexity: aiGenerationOptions.complexity,
        },
        isAiGenerated: showAiOptions,
      };

      // Save to AI service
      await musicGenerationAPI.saveMelody(melodyData);

      // Also record as exercise completion for progress tracking
      const difficultyMap = {
        beginner: 'Easy',
        intermediate: 'Medium',
        advanced: 'Hard',
      };
      await exerciseAPI.recordExerciseCompletion(
        'MusicGeneration',
        Date.now().toString(),
        saveMelodyName,
        100, // Perfect score for saving
        difficultyMap[aiGenerationOptions.complexity] || 'Medium'
      );

      // Complete session with high score
      if (sessionStarted) {
        await completeSession(95); // High score for successful creation
        setSessionStarted(false);
      }

      // Update progress for the Music Generation module
      const newMelodiesSaved = melodiesSaved + 1;
      setMelodiesSaved(newMelodiesSaved);

      // Calculate new progress percentage based on complexity
      const complexityMultiplier = {
        beginner: 5,
        intermediate: 8,
        advanced: 12,
      };
      const progressIncrease = complexityMultiplier[aiGenerationOptions.complexity];
      const newProgress = Math.min(100, Math.floor(newMelodiesSaved * progressIncrease));

      await progressAPI.updateProgress('MusicGeneration', newProgress);

      // Update saved melodies list
      const newSavedMelody: SavedMelody = {
        id: Date.now().toString(),
        name: saveMelodyName,
        notes: generatedNotes,
        dateCreated: new Date().toISOString(),
      };

      setSavedMelodies([newSavedMelody, ...savedMelodies]);

      // Success message with AI insights
      if (showAiOptions) {
        try {
          const analysis = await musicGenerationAPI.analyzeMelody(generatedNotes);
          showSuccessModal(
            'Melody Saved!',
            `"${saveMelodyName}" saved successfully!\n🎼 Analysis: ${
              analysis.data.data.dominantScale
            } with ${analysis.data.data.rhythmicComplexity > 0.5 ? 'complex' : 'simple'} rhythm`,
            '💾'
          );
        } catch {
          showSuccessModal('Melody Saved!', `"${saveMelodyName}" saved successfully!`, '💾');
        }
      } else {
        showSuccessModal('Melody Saved!', `"${saveMelodyName}" saved successfully!`, '💾');
      }

      // Reset dialog
      setShowSaveDialog(false);
      setSaveMelodyName('');
    } catch (err) {
      console.error('Error saving melody:', err);
      showErrorModal('Save Failed', 'Failed to save melody. Please try again! 🔄');
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
          zIndex: 10,
        }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Page Header */}
        <motion.div className="kid-welcome-section" variants={itemVariants}>
          <h1
            className="kid-title text-4xl md:text-5xl mb-4"
            style={{ position: 'relative', zIndex: 2 }}
          >
            🎼 Your Musical Creation! 🌟
          </h1>
          <div className="musical-icon">🎵</div>
          <p className="kid-subtitle text-xl" style={{ position: 'relative', zIndex: 2 }}>
            Create amazing melodies and let your creativity shine!
          </p>
        </motion.div>

        {/* Achievement Notification */}
        <AnimatePresence>
          {showAchievementNotification && (
            <motion.div
              className="fixed top-4 right-4 bg-yellow-50 border border-yellow-300 shadow-md rounded-lg p-4 z-50 flex items-center"
              style={{
                maxWidth: '400px',
                minWidth: '320px',
              }}
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
            >
              <Award className="text-yellow-500 mr-3" size={24} />
              <div>
                <h4 className="activity-title text-yellow-800">Achievement Unlocked! 🎉</h4>
                <p className="kid-subtitle font-bold text-yellow-700">
                  You're now a Melody Maker! 🎵✨
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generation Controls */}
        <motion.div className="mt-6 kid-welcome-section" variants={itemVariants}>
          <h3
            className="activity-title text-center mb-6"
            style={{ position: 'relative', zIndex: 2 }}
          >
            🎵 Create Your Musical Melody! ✨
          </h3>

          {/* AI Options Toggle */}
          <div className="text-center mb-4" style={{ position: 'relative', zIndex: 2 }}>
            <motion.button
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-purple-300 bg-white hover:bg-purple-50"
              onClick={() => setShowAiOptions(!showAiOptions)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              🤖 {showAiOptions ? 'Hide' : 'Show'} AI Options
            </motion.button>
          </div>

          {/* AI Generation Options */}
          <AnimatePresence>
            {showAiOptions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl border-4 border-purple-200"
                style={{ position: 'relative', zIndex: 2 }}
              >
                <h4 className="font-bold text-purple-800 mb-4 text-center">
                  🎼 AI Music Generation Settings
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-bold text-purple-700 mb-2">🎭 Genre</label>
                    <select
                      value={aiGenerationOptions.genre}
                      onChange={e =>
                        setAiGenerationOptions({ ...aiGenerationOptions, genre: e.target.value })
                      }
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="pop">Pop</option>
                      <option value="classical">Classical</option>
                      <option value="jazz">Jazz</option>
                      <option value="folk">Folk</option>
                      <option value="blues">Blues</option>
                      <option value="country">Country</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-purple-700 mb-2">😊 Mood</label>
                    <select
                      value={aiGenerationOptions.mood}
                      onChange={e =>
                        setAiGenerationOptions({ ...aiGenerationOptions, mood: e.target.value })
                      }
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="happy">Happy</option>
                      <option value="peaceful">Peaceful</option>
                      <option value="energetic">Energetic</option>
                      <option value="mysterious">Mysterious</option>
                      <option value="romantic">Romantic</option>
                      <option value="adventurous">Adventurous</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-purple-700 mb-2">
                      🎯 Complexity
                    </label>
                    <select
                      value={aiGenerationOptions.complexity}
                      onChange={e =>
                        setAiGenerationOptions({
                          ...aiGenerationOptions,
                          complexity: e.target.value as any,
                        })
                      }
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-purple-700 mb-2">
                      🥁 Tempo: {aiGenerationOptions.tempo} BPM
                    </label>
                    <input
                      type="range"
                      min="60"
                      max="180"
                      value={aiGenerationOptions.tempo}
                      onChange={e =>
                        setAiGenerationOptions({
                          ...aiGenerationOptions,
                          tempo: parseInt(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-purple-700 mb-2">
                      ⏱️ Duration: {aiGenerationOptions.duration}s
                    </label>
                    <input
                      type="range"
                      min="4"
                      max="16"
                      value={aiGenerationOptions.duration}
                      onChange={e =>
                        setAiGenerationOptions({
                          ...aiGenerationOptions,
                          duration: parseInt(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>
                </div>

                {/* AI Suggestions */}
                {aiSuggestions && (
                  <div className="mt-4 p-3 bg-white bg-opacity-80 rounded-xl">
                    <h5 className="font-bold text-purple-800 mb-2">🎯 AI Recommendations</h5>
                    <div className="text-sm text-purple-700">
                      <p>
                        <strong>Recommended Genres:</strong>{' '}
                        {aiSuggestions.recommendedGenres?.join(', ')}
                      </p>
                      <p>
                        <strong>Suggested Complexity:</strong> {aiSuggestions.nextComplexityLevel}
                      </p>
                      {aiSuggestions.inspirationPrompts && (
                        <p>
                          <strong>Inspiration:</strong> {aiSuggestions.inspirationPrompts[0]}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div
            className="flex flex-wrap justify-center items-center gap-4"
            style={{ position: 'relative', zIndex: 2 }}
          >
            <motion.button
              className="kid-button"
              style={{
                background: isGenerating
                  ? 'linear-gradient(45deg, #9CA3AF, #6B7280)'
                  : showAiOptions
                  ? 'linear-gradient(45deg, #8B5CF6, #A855F7)'
                  : 'linear-gradient(45deg, #FF6B9D, #FFE66D)',
                opacity: isGenerating ? 0.5 : 1,
              }}
              onClick={generateAndPlay}
              disabled={isGenerating}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isGenerating ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
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
                  ✨ Creating Magic...
                </>
              ) : showAiOptions ? (
                <>🤖 Generate with AI!</>
              ) : (
                <>🎵 Generate New Melody!</>
              )}
            </motion.button>

            {/* Save Button */}
            <motion.button
              className="kid-button"
              style={{
                background: 'linear-gradient(45deg, #4ECDC4, #95E1D3)',
                opacity: generatedNotes.length === 0 || isGenerating ? 0.5 : 1,
              }}
              onClick={handleSaveMelody}
              disabled={generatedNotes.length === 0 || isGenerating}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              💾 Save My Creation!
            </motion.button>
          </div>

          {/* Session Statistics */}
          {sessionStarted && (
            <div
              className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4"
              style={{ position: 'relative', zIndex: 2 }}
            >
              <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-3 rounded-2xl border-4 border-blue-200">
                <div className="text-center">
                  <div className="font-bold text-blue-800 text-sm">Active Session</div>
                  <div className="text-lg font-bold text-blue-600">
                    {showAiOptions ? '🤖 AI Mode' : '🎵 Creative Mode'}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-3 rounded-2xl border-4 border-green-200">
                <div className="text-center">
                  <div className="font-bold text-green-800 text-sm">Complexity</div>
                  <div className="text-lg font-bold text-green-600 capitalize">
                    {aiGenerationOptions.complexity}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-3 rounded-2xl border-4 border-purple-200">
                <div className="text-center">
                  <div className="font-bold text-purple-800 text-sm">Session Score</div>
                  <div className="text-lg font-bold text-purple-600">
                    {Math.max(0, 100 - (getSessionStats()?.mistakesMade || 0) * 10)}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Melodies Saved Counter */}
          <div className="mt-6 text-center" style={{ position: 'relative', zIndex: 2 }}>
            <div className="inline-flex items-center gap-2 bg-white bg-opacity-80 rounded-full px-6 py-3 shadow-lg">
              <span className="text-2xl">🎵</span>
              <span className="kid-subtitle font-bold text-lg">
                {melodiesSaved} {melodiesSaved === 1 ? 'Melody' : 'Melodies'} Created!
              </span>
              <span className="text-2xl">🎉</span>
            </div>
          </div>

          {loadingMessage && (
            <div
              className="mt-4 text-center text-yellow-600 font-bold"
              style={{ position: 'relative', zIndex: 2 }}
            >
              {loadingMessage} 🎼
            </div>
          )}
          {error && (
            <div
              className="mt-4 text-center text-red-600 font-bold"
              style={{ position: 'relative', zIndex: 2 }}
            >
              {error} 😅
            </div>
          )}
        </motion.div>

        {/* Piano Roll Display */}
        <motion.div className="mt-6 kid-welcome-section" variants={itemVariants}>
          <div
            className="flex justify-between items-center mb-4"
            style={{ position: 'relative', zIndex: 2 }}
          >
            <h3 className="activity-title text-xl">🎼 Your Musical Creation!</h3>
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
                className="kid-button"
                style={{
                  background: isPlaying
                    ? 'linear-gradient(45deg, #ef4444, #f87171)'
                    : 'linear-gradient(45deg, #FF6B9D, #FFE66D)',
                  opacity: generatedNotes.length === 0 ? 0.5 : 1,
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={generatedNotes.length === 0}
              >
                {isPlaying ? (
                  <Pause size={24} className="mr-1" />
                ) : (
                  <Play size={24} className="mr-1" />
                )}
                {isPlaying ? 'Stop Music' : 'Play My Song!'}
              </motion.button>
            </div>
          </div>

          {/* Piano Roll */}
          <div
            className="piano-roll-container relative border border-gray-200 rounded-md overflow-hidden"
            style={{ position: 'relative', zIndex: 2 }}
          >
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
          <div
            className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md"
            style={{ position: 'relative', zIndex: 2 }}
          >
            <div className="flex justify-between items-center text-sm">
              <div>
                {generatedNotes.length > 0 ? (
                  <>
                    <span className="kid-subtitle font-bold">🎵 Notes:</span>{' '}
                    {generatedNotes.length} |
                    <span className="kid-subtitle font-bold ml-2">🎹 Range:</span>{' '}
                    {getNoteNameFromPitch(Math.min(...generatedNotes.map(n => n.pitch)))} to{' '}
                    {getNoteNameFromPitch(Math.max(...generatedNotes.map(n => n.pitch)))} |
                    <span className="kid-subtitle font-bold ml-2">⏱️ Duration:</span>{' '}
                    {sequenceDuration.toFixed(1)}s
                  </>
                ) : (
                  <span className="kid-subtitle font-bold">
                    🌟 Generate a melody to see the magic!
                  </span>
                )}
              </div>
              <div>
                <span className="kid-subtitle text-sm">
                  Use zoom and navigation controls to adjust view
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Saved Melodies Section (if available) */}
        {savedMelodies.length > 0 && (
          <motion.div className="mt-6 kid-welcome-section" variants={itemVariants}>
            <h3 className="activity-title text-xl mb-4" style={{ position: 'relative', zIndex: 2 }}>
              🏆 Your Saved Melodies
            </h3>

            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
              style={{ position: 'relative', zIndex: 2 }}
            >
              {savedMelodies.map(melody => (
                <motion.div
                  key={melody.id}
                  className="kid-card music-generation"
                  whileHover={{ y: -10, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <h4 className="activity-title text-lg mb-2">{melody.name} ✨</h4>

                  {/* Mini Piano Roll */}
                  <div className="mini-piano-roll h-16 relative bg-gray-50 rounded-md border border-gray-200 mb-3 overflow-hidden">
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
                    <span className="kid-subtitle text-sm font-bold">
                      {formatDate(melody.dateCreated)}
                    </span>

                    {/* Play button */}
                    <motion.button
                      className="kid-button text-sm px-4 py-2"
                      style={{
                        background: 'linear-gradient(45deg, #4ECDC4, #95E1D3)',
                      }}
                      onClick={() => playSavedMelody(melody)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Play size={24} className="mr-1" />
                      Play
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Sample Melodies Section */}
        <motion.div className="mt-6 kid-welcome-section" variants={itemVariants}>
          <h3 className="activity-title text-xl mb-4" style={{ position: 'relative', zIndex: 2 }}>
            🎵 Sample Melodies
          </h3>

          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            style={{ position: 'relative', zIndex: 2 }}
          >
            {sampleMelodies.map(sample => (
              <motion.div
                key={sample.id}
                className={`kid-card music-generation ${
                  currentPlayingSample === sample.id ? 'ring-4 ring-pink-400' : ''
                }`}
                whileHover={{ y: -10, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <h4 className="activity-title text-lg mb-2">{sample.name} 🎶</h4>

                {/* Mini Piano Roll */}
                <div className="mini-piano-roll h-16 relative bg-gray-50 rounded-md border border-gray-200 mb-3 overflow-hidden">
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
                  className="kid-button text-sm px-4 py-2"
                  style={{
                    background:
                      currentPlayingSample === sample.id && isPlaying
                        ? 'linear-gradient(45deg, #ef4444, #f87171)'
                        : 'linear-gradient(45deg, #FF6B9D, #4ECDC4)',
                  }}
                  onClick={() => playSampleMelody(sample.id)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {currentPlayingSample === sample.id && isPlaying ? (
                    <>
                      <Pause size={24} className="mr-1" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Play size={24} className="mr-1" />
                      Play
                    </>
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
              <h3 className="activity-title text-xl mb-4">💾 Save Your Melody! ✨</h3>
              <div className="mb-4">
                <label htmlFor="melodyName" className="block kid-subtitle font-bold mb-2">
                  🎵 Melody Name:
                </label>
                <input
                  type="text"
                  id="melodyName"
                  className="w-full border border-gray-300 rounded-md p-2"
                  value={saveMelodyName}
                  onChange={e => setSaveMelodyName(e.target.value)}
                  placeholder="My Amazing Melody! 🎶"
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
                      Saving... ✨
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      Save Melody! 🎉
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.main>

      {/* Modals */}
      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={closeSuccessModal}
        title={successModal.title}
        message={successModal.message}
        icon={successModal.icon}
      />

      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={closeErrorModal}
        title={errorModal.title}
        message={errorModal.message}
      />
    </Layout>
  );
};

export default MusicGenerationPage;
