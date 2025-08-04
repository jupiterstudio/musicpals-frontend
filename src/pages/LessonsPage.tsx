// src/pages/LessonsPage.tsx - Enhanced with Adaptive Learning
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  BookOpen,
  Play,
  Brain,
  Target,
  TrendingUp,
  Lightbulb,
  Award,
  Clock,
  CheckCircle,
  Music4,
  Bot,
} from 'lucide-react';
import Layout from '../components/Layout';
import { progressAPI, exerciseAPI, achievementAPI } from '../services/api';
import { useEnhancedProgress, useExerciseSession } from '../hooks/useEnhancedProgress';
import { EnhancedAudioPlayer } from '../components/EnhancedAudioPlayer';
import InteractiveMusicTheory from '../components/InteractiveMusicTheory';

// Define interactive quiz questions for each chapter
const chapterQuizzes = [
  {
    chapterId: 0,
    questions: [
      {
        question: 'How many lines does a musical staff have?',
        options: ['3', '4', '5', '6'],
        correct: 2,
        explanation: 'A musical staff has exactly 5 lines and 4 spaces between them.',
      },
      {
        question: 'Which note lasts the longest?',
        options: ['Quarter note', 'Half note', 'Whole note', 'Eighth note'],
        correct: 2,
        explanation: 'A whole note lasts for 4 beats, making it the longest common note value.',
      },
      {
        question: 'What does the treble clef tell us?',
        options: ['Volume level', 'Note pitches', 'Song tempo', 'Key signature'],
        correct: 1,
        explanation:
          'The treble clef tells us which pitches correspond to each line and space on the staff.',
      },
    ],
  },
  {
    chapterId: 1,
    questions: [
      {
        question: 'In 4/4 time, how many quarter note beats are in each measure?',
        options: ['2', '3', '4', '6'],
        correct: 2,
        explanation: '4/4 time means 4 quarter note beats per measure.',
      },
      {
        question: 'What type of music commonly uses 3/4 time?',
        options: ['Rock music', 'Waltz', 'Hip-hop', 'Blues'],
        correct: 1,
        explanation:
          "Waltzes traditionally use 3/4 time, giving them their characteristic 'ONE-two-three' feel.",
      },
    ],
  },
  {
    chapterId: 2,
    questions: [
      {
        question: 'What is the pattern of steps in a major scale?',
        options: ['W-W-H-W-W-W-H', 'W-H-W-W-H-W-W', 'H-W-W-H-W-W-W', 'W-W-W-H-W-W-H'],
        correct: 0,
        explanation:
          'The major scale follows the pattern: Whole-Whole-Half-Whole-Whole-Whole-Half.',
      },
      {
        question: 'Which scale has no sharps or flats?',
        options: ['G major', 'F major', 'C major', 'D major'],
        correct: 2,
        explanation:
          'C major scale (C-D-E-F-G-A-B-C) uses only white keys and has no sharps or flats.',
      },
    ],
  },
];

// Define lesson chapters
const chapters = [
  {
    id: 0,
    title: 'Introduction to Music Notation',
    content: `
      <h4 class="text-lg font-semibold text-gray-800 mb-3">The Musical Staff</h4>
      <p class="text-gray-600 mb-6">
        The staff consists of five lines and four spaces. Each line and space corresponds to a musical pitch, 
        represented by a note. The higher the position on the staff, the higher the pitch.
      </p>
      <div id="musical-staff-container" class="mb-6"></div>
      <h4 class="text-lg font-semibold text-gray-800 mb-3 mt-6">Note Values</h4>
      <p class="text-gray-600 mb-6">
        Notes have different durations, indicated by their appearance. The most common note values are whole notes, 
        half notes, quarter notes, eighth notes, and sixteenth notes.
      </p>
      <div id="note-values-container" class="mb-6"></div>
    `,
  },
  // Other chapters remain the same
  {
    id: 1,
    title: 'Understanding Rhythm',
    content: `
      <h4 class="text-lg font-semibold text-gray-800 mb-3">Time Signatures</h4>
      <p class="text-gray-600 mb-6">
        Time signatures tell you how many beats are in each measure and which note value gets one beat. 
        The top number indicates the number of beats per measure, while the bottom number indicates the 
        note value that represents one beat.
      </p>
      <h4 class="text-lg font-semibold text-gray-800 mb-3 mt-6">Common Time Signatures</h4>
      <p class="text-gray-600 mb-6">
        4/4: Four quarter notes per measure (most common)<br>
        3/4: Three quarter notes per measure (waltz time)<br>
        6/8: Six eighth notes per measure (compound duple meter)<br>
        2/2: Two half notes per measure (cut time)
      </p>
    `,
  },
  {
    id: 2,
    title: 'Major and Minor Scales',
    content: `
      <h4 class="text-lg font-semibold text-gray-800 mb-3">The Major Scale</h4>
      <p class="text-gray-600 mb-6">
        The major scale is one of the most common scales in Western music. It follows a specific pattern of whole and 
        half steps: W-W-H-W-W-W-H. The C major scale (C-D-E-F-G-A-B-C) has no sharps or flats.
      </p>
      <h4 class="text-lg font-semibold text-gray-800 mb-3 mt-6">The Minor Scale</h4>
      <p class="text-gray-600 mb-6">
        The natural minor scale follows the pattern: W-H-W-W-H-W-W. The A minor scale (A-B-C-D-E-F-G-A) is the 
        relative minor of C major and also has no sharps or flats.
      </p>
    `,
  },
  {
    id: 3,
    title: 'Intervals and Harmony',
    content: `
      <h4 class="text-lg font-semibold text-gray-800 mb-3">Understanding Intervals</h4>
      <p class="text-gray-600 mb-6">
        An interval is the distance between two pitches. Intervals are named by their quality (perfect, major, minor, augmented, 
        diminished) and their numerical size (unison, second, third, etc.).
      </p>
      <h4 class="text-lg font-semibold text-gray-800 mb-3 mt-6">Common Intervals</h4>
      <p class="text-gray-600 mb-6">
        Perfect Unison: Same note (C to C)<br>
        Major Second: Whole step (C to D)<br>
        Major Third: Four half steps (C to E)<br>
        Perfect Fifth: Seven half steps (C to G)<br>
        Octave: Twelve half steps (C to C an octave higher)
      </p>
    `,
  },
  {
    id: 4,
    title: 'Reading and Playing Melodies',
    content: `
      <h4 class="text-lg font-semibold text-gray-800 mb-3">Elements of a Melody</h4>
      <p class="text-gray-600 mb-6">
        A melody is a sequence of single pitches that create a recognizable musical line. Melodies consist of 
        notes with different pitches and rhythms, organized to create musical phrases.
      </p>
      <h4 class="text-lg font-semibold text-gray-800 mb-3 mt-6">Reading a Melody</h4>
      <p class="text-gray-600 mb-6">
        When reading a melody, pay attention to:<br>
        - The key signature (sharps or flats)<br>
        - The time signature<br>
        - The contour (shape) of the melody<br>
        - The rhythmic patterns<br>
        - Any expression markings
      </p>
    `,
  },
  {
    id: 5,
    title: 'Introduction to Chords',
    content: `
      <h4 class="text-lg font-semibold text-gray-800 mb-3">Basic Chord Structure</h4>
      <p class="text-gray-600 mb-6">
        A chord is three or more notes played simultaneously. The most basic chord is a triad, which consists 
        of three notes: a root, a third, and a fifth.
      </p>
      <h4 class="text-lg font-semibold text-gray-800 mb-3 mt-6">Types of Triads</h4>
      <p class="text-gray-600 mb-6">
        Major Triad: Root, major third, perfect fifth (C-E-G)<br>
        Minor Triad: Root, minor third, perfect fifth (C-Eb-G)<br>
        Diminished Triad: Root, minor third, diminished fifth (C-Eb-Gb)<br>
        Augmented Triad: Root, major third, augmented fifth (C-E-G#)
      </p>
    `,
  },
  {
    id: 6,
    title: 'Musical Form and Structure',
    content: `
      <h4 class="text-lg font-semibold text-gray-800 mb-3">Basic Musical Forms</h4>
      <p class="text-gray-600 mb-6">
        Musical form refers to the overall structure of a piece of music. Common forms include binary (A-B), 
        ternary (A-B-A), rondo (A-B-A-C-A), and theme and variations.
      </p>
      <h4 class="text-lg font-semibold text-gray-800 mb-3 mt-6">Phrases and Periods</h4>
      <p class="text-gray-600 mb-6">
        A musical phrase is similar to a sentence in language. It typically spans about 4 measures and ends with 
        a cadence. Two or more phrases often form a period, which is like a complete musical paragraph.
      </p>
    `,
  },
];

// Note positions on the staff (for the visualization)
const notePositions = [
  { note: 'C4', position: 10 },
  { note: 'D4', position: 9 },
  { note: 'E4', position: 8 },
  { note: 'F4', position: 7 },
  { note: 'G4', position: 6 },
  { note: 'A4', position: 5 },
  { note: 'B4', position: 4 },
  { note: 'C5', position: 3 },
];

const LessonsPage = () => {
  const [activeChapter, setActiveChapter] = useState(0);
  const [userProgress, setUserProgress] = useState<{ [key: number]: boolean }>({});
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1000
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theoryScholarUnlocked, setTheoryScholarUnlocked] = useState(false);

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
  } = useExerciseSession('Lessons', 'theory');

  // New state for adaptive learning
  const [adaptiveRecommendation, setAdaptiveRecommendation] = useState<any>(null);
  const [learningInsights, setLearningInsights] = useState<any>(null);
  const [personalizedRecommendations, setPersonalizedRecommendations] = useState<any>(null);
  const [showAdaptiveHint, setShowAdaptiveHint] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [studyTime, setStudyTime] = useState(0);
  const [comprehensionScore, setComprehensionScore] = useState(0);
  const [interactiveMode, setInteractiveMode] = useState(false);
  const [quizMode, setQuizMode] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<any>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [showHints, setShowHints] = useState(false);
  const [showInteractiveTheory, setShowInteractiveTheory] = useState(false);
  const [theoryInteractions, setTheoryInteractions] = useState<any[]>([]);

  // Timer ref for study tracking
  const studyTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Fetch user progress and adaptive data
  useEffect(() => {
    const fetchUserProgress = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch progress data from API
        const response = await progressAPI.getUserProgress();
        const progressData = response.data;

        // Find lessons module progress
        const lessonsProgress = progressData.find((module: any) => module.moduleType === 'Lessons');

        if (lessonsProgress && lessonsProgress.exercises) {
          // Map exercises to chapter completion status
          const chapterStatus: { [key: number]: boolean } = {};

          lessonsProgress.exercises.forEach((exercise: any) => {
            // Assuming exercise.id maps to chapter ids
            const chapterId = parseInt(exercise.id);
            if (!isNaN(chapterId)) {
              chapterStatus[chapterId] = exercise.score >= 80; // Consider complete if score >= 80%
            }
          });

          setUserProgress(chapterStatus);
        } else {
          // Default progress - only first chapter completed
          setUserProgress({ 0: true });
        }

        // Check for "Theory Scholar" achievement
        const achievementsResponse = await achievementAPI.getUserAchievements();
        const achievements = achievementsResponse.data;

        const hasTheoryScholar = achievements.some(
          (achievement: any) => achievement.name === 'Theory Scholar'
        );

        setTheoryScholarUnlocked(hasTheoryScholar);
      } catch (err) {
        console.error('Failed to fetch user progress', err);
        setError('Failed to load your progress. Please try again later.');

        // Use default progress as fallback
        setUserProgress({ 0: true });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProgress();
    loadAdaptiveData();

    // Update window width on resize for responsive staff
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (studyTimerRef.current) {
        clearInterval(studyTimerRef.current);
      }
    };
  }, []);

  // Load adaptive learning data
  const loadAdaptiveData = async () => {
    try {
      // Get adaptive difficulty recommendation
      const recommendation = await getAdaptiveDifficultyRecommendation('Lessons', 'theory');
      setAdaptiveRecommendation(recommendation);

      // Get learning insights
      const insights = await getLearningInsights(30);
      setLearningInsights(insights);

      // Get personalized recommendations
      const personalizedRecs = await getPersonalizedRecommendations('Lessons');
      setPersonalizedRecommendations(personalizedRecs);

      // Show adaptive hint if recommendation differs from current approach
      if (recommendation && recommendation.recommendedLevel === 'interactive') {
        setShowAdaptiveHint(true);
      }
    } catch (error) {
      console.error('Error loading adaptive data:', error);
    }
  };

  // Start study session tracking
  const startStudySession = () => {
    if (!sessionStarted) {
      startSession(`chapter_${activeChapter}`, 'medium');
      setSessionStarted(true);
      setStudyTime(0);

      // Start timer for study time tracking
      studyTimerRef.current = setInterval(() => {
        setStudyTime(prev => prev + 1);
      }, 1000);
    }
  };

  // Stop study session
  const stopStudySession = async () => {
    if (studyTimerRef.current) {
      clearInterval(studyTimerRef.current);
    }

    if (sessionStarted) {
      try {
        await completeSession(comprehensionScore);
        setSessionStarted(false);
      } catch (error) {
        console.error('Error completing study session:', error);
      }
    }
  };

  // Render custom elements after chapter content is loaded
  useEffect(() => {
    // Only run for chapter 0
    if (activeChapter === 0) {
      // Render musical staff visualization
      const staffContainer = document.getElementById('musical-staff-container');
      if (staffContainer) {
        renderMusicalStaff(staffContainer);
      }

      // Render note values visualization
      const noteValuesContainer = document.getElementById('note-values-container');
      if (noteValuesContainer) {
        renderNoteValues(noteValuesContainer);
      }
    }
  }, [activeChapter]);

  // Render musical staff with notes
  const renderMusicalStaff = (container: HTMLElement) => {
    // Implementation remains the same
    // Clear previous content
    container.innerHTML = '';

    // Create wrapper div
    const wrapper = document.createElement('div');
    wrapper.className = 'bg-gray-50 p-6 rounded-lg border border-gray-200';
    container.appendChild(wrapper);

    // Create the staff container with proper positioning
    const staffContainer = document.createElement('div');
    staffContainer.className = 'relative h-60 w-full';
    wrapper.appendChild(staffContainer);

    // Add React components to the container using ReactDOM
    // Since we can't use ReactDOM directly here, we'll use plain HTML/SVG

    // 1. Render the staff lines
    const staffWidth = Math.min(windowWidth - 80, 600);
    const staffSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    staffSvg.setAttribute('width', staffWidth.toString());
    staffSvg.setAttribute('height', '120');
    staffSvg.style.position = 'absolute';
    staffSvg.style.top = '40px';
    staffSvg.style.left = '0px';

    // Add staff lines
    for (let i = 0; i < 5; i++) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', '0');
      line.setAttribute('y1', (i * 15).toString());
      line.setAttribute('x2', staffWidth.toString());
      line.setAttribute('y2', (i * 15).toString());
      line.setAttribute('stroke', '#333');
      line.setAttribute('stroke-width', '1');
      staffSvg.appendChild(line);
    }
    staffContainer.appendChild(staffSvg);

    // 2. Add treble clef
    const trebleClefSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    trebleClefSvg.setAttribute('width', '50');
    trebleClefSvg.setAttribute('height', '120');
    trebleClefSvg.setAttribute('viewBox', '0 0 100 170');
    trebleClefSvg.style.position = 'absolute';
    trebleClefSvg.style.top = '0px';
    trebleClefSvg.style.left = '10px';

    const trebleClefPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    trebleClefPath.setAttribute(
      'd',
      'M30,120 C50,70 15,30 30,15 C45,0 70,15 70,45 C70,75 45,90 30,105 C15,120 15,140 30,150'
    );
    trebleClefPath.setAttribute('stroke', '#3730A3');
    trebleClefPath.setAttribute('stroke-width', '6');
    trebleClefPath.setAttribute('fill', 'none');
    trebleClefSvg.appendChild(trebleClefPath);
    staffContainer.appendChild(trebleClefSvg);

    // 3. Add notes
    const notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];

    notes.forEach((note, index) => {
      // Find the position for this note
      const noteInfo = notePositions.find(pos => pos.note === note);
      if (!noteInfo) return;

      // Create note circle
      const noteSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      noteSvg.setAttribute('width', '35');
      noteSvg.setAttribute('height', '35');
      noteSvg.setAttribute('viewBox', '0 0 35 35');
      noteSvg.style.position = 'absolute';
      noteSvg.style.top = `${noteInfo.position * 7.5 + 18}px`;
      noteSvg.style.left = `${80 + index * 60}px`;

      // Create the ellipse for the note head
      const noteHead = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      noteHead.setAttribute('cx', '17.5');
      noteHead.setAttribute('cy', '17.5');
      noteHead.setAttribute('rx', '10');
      noteHead.setAttribute('ry', '7');
      noteHead.setAttribute('transform', 'rotate(-20 17.5 17.5)');
      noteHead.setAttribute('fill', '#333');
      noteSvg.appendChild(noteHead);

      staffContainer.appendChild(noteSvg);

      // Add note label
      const noteLabel = document.createElement('div');
      noteLabel.className = 'absolute text-sm text-center text-gray-600 font-medium';
      noteLabel.style.width = '30px';
      noteLabel.style.top = '120px';
      noteLabel.style.left = `${82 + index * 60}px`;
      noteLabel.textContent = note;
      staffContainer.appendChild(noteLabel);
    });
  };

  // Render note values visualization
  const renderNoteValues = (container: HTMLElement) => {
    // Implementation remains the same
    // Clear previous content
    container.innerHTML = '';

    // Create wrapper div
    const wrapper = document.createElement('div');
    wrapper.className = 'bg-gray-50 p-6 rounded-lg border border-gray-200';
    container.appendChild(wrapper);

    // Create a flex container for the notes
    const notesContainer = document.createElement('div');
    notesContainer.className = 'flex justify-around items-end flex-wrap gap-4';
    wrapper.appendChild(notesContainer);

    // Add different note types
    const noteTypes = [
      { name: 'Whole Note', render: renderWholeNote },
      { name: 'Half Note', render: renderHalfNote },
      { name: 'Quarter Note', render: renderQuarterNote },
      { name: 'Eighth Note', render: renderEighthNote },
      { name: 'Sixteenth Note', render: renderSixteenthNote },
    ];

    noteTypes.forEach(noteType => {
      const noteContainer = document.createElement('div');
      noteContainer.className = 'flex flex-col items-center mb-4';

      const noteWrapper = document.createElement('div');
      noteWrapper.className = 'h-32 flex items-center justify-center';
      noteContainer.appendChild(noteWrapper);

      noteType.render(noteWrapper);

      const label = document.createElement('div');
      label.className = 'text-sm text-gray-700 mt-2 font-medium';
      label.textContent = noteType.name;
      noteContainer.appendChild(label);

      notesContainer.appendChild(noteContainer);
    });
  };

  // Helper functions to render different note types (unchanged)
  const renderWholeNote = (container: HTMLElement) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '60');
    svg.setAttribute('height', '30');
    svg.setAttribute('viewBox', '0 0 60 30');

    const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    ellipse.setAttribute('cx', '30');
    ellipse.setAttribute('cy', '15');
    ellipse.setAttribute('rx', '20');
    ellipse.setAttribute('ry', '12');
    ellipse.setAttribute('transform', 'rotate(-20 30 15)');
    ellipse.setAttribute('stroke', '#333');
    ellipse.setAttribute('stroke-width', '2');
    ellipse.setAttribute('fill', 'white');

    svg.appendChild(ellipse);
    container.appendChild(svg);
  };

  const renderHalfNote = (container: HTMLElement) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '60');
    svg.setAttribute('height', '80');
    svg.setAttribute('viewBox', '0 0 60 80');

    const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    ellipse.setAttribute('cx', '30');
    ellipse.setAttribute('cy', '60');
    ellipse.setAttribute('rx', '16');
    ellipse.setAttribute('ry', '11');
    ellipse.setAttribute('transform', 'rotate(-20 30 60)');
    ellipse.setAttribute('stroke', '#333');
    ellipse.setAttribute('stroke-width', '2');
    ellipse.setAttribute('fill', 'white');

    const stem = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    stem.setAttribute('x1', '46');
    stem.setAttribute('y1', '60');
    stem.setAttribute('x2', '46');
    stem.setAttribute('y2', '10');
    stem.setAttribute('stroke', '#333');
    stem.setAttribute('stroke-width', '2');

    svg.appendChild(ellipse);
    svg.appendChild(stem);
    container.appendChild(svg);
  };

  const renderQuarterNote = (container: HTMLElement) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '60');
    svg.setAttribute('height', '80');
    svg.setAttribute('viewBox', '0 0 60 80');

    const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    ellipse.setAttribute('cx', '30');
    ellipse.setAttribute('cy', '60');
    ellipse.setAttribute('rx', '16');
    ellipse.setAttribute('ry', '11');
    ellipse.setAttribute('transform', 'rotate(-20 30 60)');
    ellipse.setAttribute('fill', '#333');

    const stem = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    stem.setAttribute('x1', '46');
    stem.setAttribute('y1', '60');
    stem.setAttribute('x2', '46');
    stem.setAttribute('y2', '10');
    stem.setAttribute('stroke', '#333');
    stem.setAttribute('stroke-width', '2');

    svg.appendChild(ellipse);
    svg.appendChild(stem);
    container.appendChild(svg);
  };

  const renderEighthNote = (container: HTMLElement) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '60');
    svg.setAttribute('height', '80');
    svg.setAttribute('viewBox', '0 0 60 80');

    const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    ellipse.setAttribute('cx', '30');
    ellipse.setAttribute('cy', '60');
    ellipse.setAttribute('rx', '16');
    ellipse.setAttribute('ry', '11');
    ellipse.setAttribute('transform', 'rotate(-20 30 60)');
    ellipse.setAttribute('fill', '#333');

    const stem = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    stem.setAttribute('x1', '46');
    stem.setAttribute('y1', '60');
    stem.setAttribute('x2', '46');
    stem.setAttribute('y2', '10');
    stem.setAttribute('stroke', '#333');
    stem.setAttribute('stroke-width', '2');

    const flag = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    flag.setAttribute('d', 'M46,10 C56,15 66,25 76,30');
    flag.setAttribute('stroke', '#333');
    flag.setAttribute('stroke-width', '2');
    flag.setAttribute('fill', 'none');

    svg.appendChild(ellipse);
    svg.appendChild(stem);
    svg.appendChild(flag);
    container.appendChild(svg);
  };

  const renderSixteenthNote = (container: HTMLElement) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '60');
    svg.setAttribute('height', '80');
    svg.setAttribute('viewBox', '0 0 60 80');

    const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    ellipse.setAttribute('cx', '30');
    ellipse.setAttribute('cy', '60');
    ellipse.setAttribute('rx', '16');
    ellipse.setAttribute('ry', '11');
    ellipse.setAttribute('transform', 'rotate(-20 30 60)');
    ellipse.setAttribute('fill', '#333');

    const stem = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    stem.setAttribute('x1', '46');
    stem.setAttribute('y1', '60');
    stem.setAttribute('x2', '46');
    stem.setAttribute('y2', '10');
    stem.setAttribute('stroke', '#333');
    stem.setAttribute('stroke-width', '2');

    const flag1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    flag1.setAttribute('d', 'M46,10 C56,15 66,25 76,30');
    flag1.setAttribute('stroke', '#333');
    flag1.setAttribute('stroke-width', '2');
    flag1.setAttribute('fill', 'none');

    const flag2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    flag2.setAttribute('d', 'M46,20 C56,25 66,35 76,40');
    flag2.setAttribute('stroke', '#333');
    flag2.setAttribute('stroke-width', '2');
    flag2.setAttribute('fill', 'none');

    svg.appendChild(ellipse);
    svg.appendChild(stem);
    svg.appendChild(flag1);
    svg.appendChild(flag2);
    container.appendChild(svg);
  };

  const handleChapterSelect = (id: number) => {
    // Stop current session if active
    if (sessionStarted) {
      stopStudySession();
    }

    setActiveChapter(id);
    setQuizMode(false);
    setCurrentQuiz(null);
    setQuizScore(0);
    setShowInteractiveTheory(false);
    setTheoryInteractions([]);
    setShowHints(false);

    // Start new study session for the chapter
    setTimeout(() => {
      startStudySession();
    }, 500);
  };

  const handleNextChapter = async () => {
    if (activeChapter < chapters.length - 1) {
      try {
        // Update progress for current chapter
        const updatedProgress = {
          ...userProgress,
          [activeChapter]: true,
        };
        setUserProgress(updatedProgress);

        // Record exercise completion in the API
        await exerciseAPI.recordExerciseCompletion(
          'Lessons',
          activeChapter.toString(),
          chapters[activeChapter].title,
          100, // Perfect score for completing a chapter
          'Easy'
        );

        // Update overall progress
        const completedChapters = Object.values(updatedProgress).filter(Boolean).length;
        const totalProgress = Math.round((completedChapters / chapters.length) * 100);

        await progressAPI.updateProgress('Lessons', totalProgress);

        // Check if all chapters are completed to unlock achievement
        const allChaptersCompleted = chapters.every((_, index) => updatedProgress[index] === true);

        if (allChaptersCompleted && !theoryScholarUnlocked) {
          // Unlock Theory Scholar achievement
          await achievementAPI.unlockAchievement(
            'Theory Scholar',
            'Complete all basic music theory lessons',
            'book-open'
          );

          setTheoryScholarUnlocked(true);

          // Show achievement notification (could be implemented better)
          alert('Achievement Unlocked: Theory Scholar!');
        }

        // Move to next chapter
        setActiveChapter(activeChapter + 1);
      } catch (err) {
        console.error('Failed to update progress', err);
        // Still move to next chapter even if API call fails
        setActiveChapter(activeChapter + 1);
      }
    }
  };

  const handlePractice = async () => {
    try {
      // Record a practice session for the current chapter
      await exerciseAPI.recordExerciseCompletion(
        'Lessons',
        activeChapter.toString(),
        `${chapters[activeChapter].title} - Practice`,
        85, // Score for practice (could be dynamic based on performance)
        'Easy'
      );

      alert(`Practice for ${chapters[activeChapter].title} recorded successfully!`);
    } catch (err) {
      console.error('Failed to record practice session', err);
      alert(`Practice for ${chapters[activeChapter].title} would start here.`);
    }
  };

  // Start interactive quiz for current chapter
  const startQuiz = () => {
    const quiz = chapterQuizzes.find(q => q.chapterId === activeChapter);
    if (quiz) {
      setCurrentQuiz({ ...quiz, currentQuestion: 0, userAnswers: [], showExplanation: false });
      setQuizMode(true);
      setQuizScore(0);
    }
  };

  // Handle quiz answer selection
  const handleQuizAnswer = (selectedOption: number) => {
    if (!currentQuiz) return;

    const question = currentQuiz.questions[currentQuiz.currentQuestion];
    const isCorrect = selectedOption === question.correct;

    // Update quiz state
    const updatedAnswers = [...currentQuiz.userAnswers, selectedOption];
    setCurrentQuiz((prev: any) => ({
      ...prev!,
      userAnswers: updatedAnswers,
      showExplanation: true,
    }));

    if (isCorrect) {
      setQuizScore(prev => prev + 1);
    } else {
      recordMistake('theory_quiz');
    }

    // Auto-advance to next question after showing explanation
    setTimeout(() => {
      if (currentQuiz.currentQuestion < currentQuiz.questions.length - 1) {
        setCurrentQuiz((prev: any) => ({
          ...prev!,
          currentQuestion: prev!.currentQuestion + 1,
          showExplanation: false,
        }));
      } else {
        // Quiz completed
        finishQuiz();
      }
    }, 3000);
  };

  // Finish quiz and calculate results
  const finishQuiz = async () => {
    if (!currentQuiz) return;

    const accuracy = Math.round((quizScore / currentQuiz.questions.length) * 100);
    setComprehensionScore(accuracy);

    try {
      // Record quiz completion
      await exerciseAPI.recordExerciseCompletion(
        'Lessons',
        `${activeChapter}_quiz`,
        `${chapters[activeChapter].title} - Interactive Quiz`,
        accuracy,
        'Medium'
      );

      // Complete study session with quiz score
      await completeSession(accuracy);

      setQuizMode(false);

      // Show completion message
      setTimeout(() => {
        alert(
          `🎉 Quiz completed! You scored ${quizScore}/${currentQuiz.questions.length} (${accuracy}%)`
        );
      }, 500);
    } catch (error) {
      console.error('Error recording quiz completion:', error);
    }
  };

  // Toggle interactive mode for enhanced learning
  const toggleInteractiveMode = () => {
    setInteractiveMode(!interactiveMode);
    if (!interactiveMode) {
      startStudySession();
    }
  };

  // Get adaptive hint for current chapter
  const getAdaptiveHint = () => {
    recordHintUsed();
    setShowHints(true);

    const hints = {
      0: '💡 Tip: Count the lines on the staff with your fingers! Each line represents a different musical note.',
      1: '💡 Tip: Clap along with different time signatures - feel the pattern of strong and weak beats!',
      2: '💡 Tip: Play the C major scale on a piano to hear how the whole and half steps create the familiar major sound.',
      3: '💡 Tip: Try singing intervals to better understand the distance between notes.',
      4: '💡 Tip: Practice reading simple melodies by following the contour (shape) first, then the exact notes.',
      5: '💡 Tip: Play basic chords on an instrument to hear how multiple notes create harmony.',
      6: '💡 Tip: Listen to your favorite songs and try to identify their form (verse, chorus, bridge).',
    };

    return hints[activeChapter as keyof typeof hints] || '💡 Keep studying and practicing!';
  };

  // Handle interactions from the interactive theory component
  const handleTheoryInteraction = (type: string, data: any) => {
    const interaction = {
      type,
      data,
      timestamp: new Date().toISOString(),
      chapterId: activeChapter,
    };

    setTheoryInteractions(prev => [...prev, interaction]);

    // Update comprehension score based on interactions
    if (type === 'scale_practice' && data.correct) {
      setComprehensionScore(prev => Math.min(100, prev + 10));
    } else if (type === 'chord_practice' && data.correct) {
      setComprehensionScore(prev => Math.min(100, prev + 15));
    } else if (type.includes('_played')) {
      setComprehensionScore(prev => Math.min(100, prev + 2));
    }

    // Record engagement for progress tracking
    if (sessionStarted) {
      // Don't record mistakes for theory interactions as they're learning tools
      if (type.includes('practice') && !data.correct) {
        recordMistake('interactive_theory');
      }
    }

    // Note: This would be for external interaction tracking if needed
  };

  // Toggle interactive theory panel
  const toggleInteractiveTheory = () => {
    setShowInteractiveTheory(!showInteractiveTheory);
    if (!showInteractiveTheory) {
      startStudySession();
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
            📚 Musical Stories & Adventures! 🎆
          </h1>
          <div className="musical-icon">🎩</div>
          <p className="kid-subtitle text-xl" style={{ position: 'relative', zIndex: 2 }}>
            Join our magical musical journey and learn amazing secrets about how music works!
          </p>
        </motion.div>

        {/* Show loading state */}
        {isLoading ? (
          <div className="kid-welcome-section flex justify-center">
            <div className="flex flex-col items-center" style={{ position: 'relative', zIndex: 2 }}>
              <div className="w-12 h-12 border-t-4 border-r-4 border-pink-500 rounded-full animate-spin mb-4"></div>
              <p className="kid-subtitle text-lg">Loading your magical lessons... ✨</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Enhanced Chapter Navigation */}
            <motion.div className="lg:w-72" variants={itemVariants}>
              <div className="kid-welcome-section">
                <div className="mb-3" style={{ position: 'relative', zIndex: 2 }}>
                  <h3 className="activity-title text-lg text-center">📜 Learning Chapters</h3>

                  {/* Adaptive Recommendation Panel */}
                  {adaptiveRecommendation && showAdaptiveHint && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl border-2 border-purple-200"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Brain size={16} className="text-purple-600" />
                        <span className="text-sm font-bold text-purple-800">🤖 AI Tutor</span>
                      </div>
                      <p className="text-xs text-purple-700 mb-2">
                        Try interactive mode for better learning!
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setInteractiveMode(true);
                            setShowAdaptiveHint(false);
                          }}
                          className="text-xs px-2 py-1 bg-purple-500 text-white rounded-full hover:bg-purple-600"
                        >
                          Try It!
                        </button>
                        <button
                          onClick={() => setShowAdaptiveHint(false)}
                          className="text-xs px-2 py-1 bg-gray-300 text-gray-700 rounded-full hover:bg-gray-400"
                        >
                          Later
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="space-y-1.5" style={{ position: 'relative', zIndex: 2 }}>
                  {chapters.map(chapter => {
                    const hasQuiz = chapterQuizzes.find(q => q.chapterId === chapter.id);
                    const isActive = activeChapter === chapter.id;

                    return (
                      <motion.div
                        key={chapter.id}
                        className={`cursor-pointer flex items-center p-2.5 rounded-xl border-2 transition-all ${
                          isActive
                            ? 'bg-yellow-100 border-yellow-400 ring-1 ring-yellow-300'
                            : 'bg-white bg-opacity-90 border-purple-200 hover:border-purple-300 hover:bg-purple-50'
                        }`}
                        onClick={() => handleChapterSelect(chapter.id)}
                        whileHover={{ x: 3, scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className="mr-2 flex-shrink-0">
                          {userProgress[chapter.id] ? (
                            <div className="text-base">✅</div>
                          ) : isActive ? (
                            <div className="text-base">📚</div>
                          ) : (
                            <div className="text-base">📖</div>
                          )}
                        </div>
                        <div className="flex-1">
                          <span className="kid-subtitle font-bold text-sm leading-tight break-words block">
                            {chapter.id + 1}. {chapter.title}
                          </span>
                          <div className="flex items-center gap-1 mt-1">
                            {hasQuiz && (
                              <span className="text-xs bg-pink-200 text-pink-700 px-1 py-0.5 rounded">
                                🧠 Quiz
                              </span>
                            )}
                            {interactiveMode && isActive && (
                              <span className="text-xs bg-purple-200 text-purple-700 px-1 py-0.5 rounded">
                                🤖 AI
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Learning Progress Summary */}
                <div className="mt-4 p-3 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl border-2 border-blue-200">
                  <h4 className="font-bold text-blue-800 text-sm mb-2">📊 Your Progress</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-blue-700">Completed:</span>
                      <span className="font-bold text-blue-800">
                        {Object.values(userProgress).filter(Boolean).length}/{chapters.length}
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${
                            (Object.values(userProgress).filter(Boolean).length / chapters.length) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    {theoryScholarUnlocked && (
                      <div className="flex items-center gap-1 text-xs text-yellow-700">
                        <Award size={12} />
                        <span>Theory Scholar!</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Lesson Content */}
            <motion.div
              className="flex-1 kid-welcome-section"
              variants={itemVariants}
              key={activeChapter} // Re-animate when chapter changes
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6" style={{ position: 'relative', zIndex: 2 }}>
                <h3 className="activity-title text-2xl text-center">
                  🌟 {chapters[activeChapter].title} 🌟
                </h3>
              </div>

              <div style={{ position: 'relative', zIndex: 2 }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`chapter-${activeChapter}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    dangerouslySetInnerHTML={{ __html: chapters[activeChapter].content }}
                    className="lesson-content kid-subtitle"
                    style={{
                      fontSize: '1.1rem',
                      lineHeight: '1.6',
                    }}
                  />
                </AnimatePresence>

                {/* Display errors if any */}
                {error && (
                  <div className="mt-4 bg-red-100 p-4 rounded-2xl border-4 border-red-300 text-red-700 text-center font-bold">
                    😅 {error}
                  </div>
                )}

                {/* Enhanced Session Stats */}
                {sessionStarted && (
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-3 rounded-2xl border-4 border-blue-200">
                      <div className="flex items-center gap-2">
                        <Clock className="text-blue-600" size={20} />
                        <div>
                          <div className="font-bold text-blue-800 text-sm">Study Time</div>
                          <div className="text-lg font-bold text-blue-600">
                            {Math.floor(studyTime / 60)}:
                            {(studyTime % 60).toString().padStart(2, '0')}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-3 rounded-2xl border-4 border-green-200">
                      <div className="flex items-center gap-2">
                        <Target className="text-green-600" size={20} />
                        <div>
                          <div className="font-bold text-green-800 text-sm">Comprehension</div>
                          <div className="text-lg font-bold text-green-600">
                            {comprehensionScore}%
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-3 rounded-2xl border-4 border-purple-200">
                      <div className="flex items-center gap-2">
                        <Brain className="text-purple-600" size={20} />
                        <div>
                          <div className="font-bold text-purple-800 text-sm">AI Mode</div>
                          <div className="text-sm font-bold text-purple-600">
                            {interactiveMode ? 'Active' : 'Standard'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-yellow-100 to-orange-100 p-3 rounded-2xl border-4 border-yellow-200">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="text-yellow-600" size={20} />
                        <div>
                          <div className="font-bold text-yellow-800 text-sm">Hints Used</div>
                          <div className="text-lg font-bold text-yellow-600">
                            {getSessionStats()?.hintsUsed || 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Adaptive Learning Insights */}
                {learningInsights && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-2xl border-4 border-indigo-200">
                    <h4 className="font-bold text-indigo-800 mb-2">📊 Your Learning Analytics</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="font-bold text-indigo-700">Study Sessions</div>
                        <div className="text-indigo-600">
                          {learningInsights.exercisesCompleted || 0}
                        </div>
                      </div>
                      <div>
                        <div className="font-bold text-indigo-700">Avg Score</div>
                        <div className="text-indigo-600">
                          {Math.round(learningInsights.averageScore || 0)}%
                        </div>
                      </div>
                      <div>
                        <div className="font-bold text-indigo-700">Best Topic</div>
                        <div className="text-indigo-600">
                          {learningInsights.strongestSkills?.[0] || 'Keep studying!'}
                        </div>
                      </div>
                      <div>
                        <div className="font-bold text-indigo-700">Learning Trend</div>
                        <div className="text-indigo-600">
                          {learningInsights.engagementTrend || 'stable'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Adaptive Hints */}
                {showHints && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl border-4 border-yellow-300"
                  >
                    <div className="flex items-start gap-3">
                      <Lightbulb className="text-yellow-600 mt-1" size={24} />
                      <div>
                        <h4 className="font-bold text-yellow-800">💡 AI Learning Tip</h4>
                        <p className="text-yellow-700">{getAdaptiveHint()}</p>
                      </div>
                      <button
                        onClick={() => setShowHints(false)}
                        className="ml-auto text-yellow-600 hover:text-yellow-800"
                      >
                        ✕
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Interactive Quiz Mode */}
                {quizMode && currentQuiz && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-6 p-6 bg-gradient-to-r from-pink-100 to-purple-100 rounded-2xl border-4 border-pink-300"
                  >
                    <h4 className="font-bold text-pink-800 text-xl mb-4">
                      🧠 Interactive Quiz - Question {currentQuiz.currentQuestion + 1} of{' '}
                      {currentQuiz.questions.length}
                    </h4>

                    <div className="mb-4">
                      <h5 className="font-bold text-lg text-gray-800 mb-4">
                        {currentQuiz.questions[currentQuiz.currentQuestion].question}
                      </h5>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {currentQuiz.questions[currentQuiz.currentQuestion].options.map(
                          (option: string, index: number) => {
                            const isSelected =
                              currentQuiz.userAnswers[currentQuiz.currentQuestion] === index;
                            const isCorrect =
                              index === currentQuiz.questions[currentQuiz.currentQuestion].correct;
                            const showResult = currentQuiz.showExplanation;

                            return (
                              <motion.button
                                key={index}
                                className={`p-4 rounded-xl border-2 font-bold text-left transition-all ${
                                  showResult
                                    ? isCorrect
                                      ? 'bg-green-100 border-green-400 text-green-800'
                                      : isSelected
                                      ? 'bg-red-100 border-red-400 text-red-800'
                                      : 'bg-gray-100 border-gray-300 text-gray-600'
                                    : 'bg-white border-purple-200 hover:border-purple-400 hover:bg-purple-50 text-gray-800'
                                }`}
                                onClick={() =>
                                  !currentQuiz.showExplanation && handleQuizAnswer(index)
                                }
                                disabled={currentQuiz.showExplanation}
                                whileHover={{ scale: currentQuiz.showExplanation ? 1 : 1.02 }}
                                whileTap={{ scale: currentQuiz.showExplanation ? 1 : 0.98 }}
                              >
                                {option}
                                {showResult && isCorrect && ' ✅'}
                                {showResult && isSelected && !isCorrect && ' ❌'}
                              </motion.button>
                            );
                          }
                        )}
                      </div>

                      {currentQuiz.showExplanation && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4 p-4 bg-blue-100 rounded-lg border-2 border-blue-300"
                        >
                          <h6 className="font-bold text-blue-800 mb-2">💡 Explanation:</h6>
                          <p className="text-blue-700">
                            {currentQuiz.questions[currentQuiz.currentQuestion].explanation}
                          </p>
                        </motion.div>
                      )}
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="font-bold text-purple-700">
                        Score: {quizScore}/{currentQuiz.questions.length}
                      </span>
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full transition-all"
                          style={{
                            width: `${
                              ((currentQuiz.currentQuestion + 1) / currentQuiz.questions.length) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Interactive Music Theory Component */}
                <AnimatePresence>
                  {showInteractiveTheory && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-6"
                    >
                      <InteractiveMusicTheory
                        chapterId={activeChapter}
                        onInteraction={handleTheoryInteraction}
                        adaptiveMode={interactiveMode}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Theory Interaction Summary */}
                {theoryInteractions.length > 0 && !showInteractiveTheory && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl border-4 border-green-200"
                  >
                    <h4 className="font-bold text-green-800 mb-2">🎼 Theory Lab Activity</h4>
                    <div className="text-sm text-green-700">
                      <p>You've practiced with {theoryInteractions.length} interactions!</p>
                      <p className="text-xs mt-1">
                        Last activity:{' '}
                        {theoryInteractions[theoryInteractions.length - 1]?.type.replace('_', ' ')}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Navigation Buttons */}
                <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex flex-wrap gap-3">
                    {/* Interactive Mode Toggle */}
                    <motion.button
                      className="kid-button"
                      style={{
                        background: interactiveMode
                          ? 'linear-gradient(45deg, #9B59B6, #FFE66D)'
                          : 'linear-gradient(45deg, #95E1D3, #4ECDC4)',
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={toggleInteractiveMode}
                    >
                      <Bot size={24} className="mr-1" />
                      {interactiveMode ? 'AI Mode ON' : 'AI Mode'}
                    </motion.button>

                    {/* Theory Lab Toggle */}
                    <motion.button
                      className="kid-button"
                      style={{
                        background: showInteractiveTheory
                          ? 'linear-gradient(45deg, #8E44AD, #3498DB)'
                          : 'linear-gradient(45deg, #E74C3C, #F39C12)',
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={toggleInteractiveTheory}
                    >
                      <Music4 size={24} className="mr-1" />
                      {showInteractiveTheory ? 'Hide' : 'Theory'} Lab
                    </motion.button>

                    {/* Quiz Button */}
                    {chapterQuizzes.find(q => q.chapterId === activeChapter) && !quizMode && (
                      <motion.button
                        className="kid-button"
                        style={{
                          background: 'linear-gradient(45deg, #FF6B9D, #9B59B6)',
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={startQuiz}
                      >
                        <Brain size={24} className="mr-1" />
                        Take Quiz!
                      </motion.button>
                    )}
                  </div>
                </div>
                <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="bg-white bg-opacity-80 rounded-full px-4 py-2 shadow-lg">
                    <span className="kid-subtitle font-bold">
                      🎆 Adventure Progress: {activeChapter + 1}/{chapters.length} 🎆
                    </span>
                  </div>
                  {/* Next Chapter Button */}
                  <motion.button
                    className="kid-button"
                    style={{
                      background:
                        activeChapter === chapters.length - 1
                          ? 'linear-gradient(45deg, #9CA3AF, #6B7280)'
                          : 'linear-gradient(45deg, #FF6B9D, #FFE66D)',
                      opacity: activeChapter === chapters.length - 1 ? 0.5 : 1,
                    }}
                    whileHover={{ scale: activeChapter === chapters.length - 1 ? 1 : 1.05 }}
                    whileTap={{ scale: activeChapter === chapters.length - 1 ? 1 : 0.95 }}
                    onClick={handleNextChapter}
                    disabled={activeChapter === chapters.length - 1}
                  >
                    {activeChapter === chapters.length - 1
                      ? '🏆 Adventure Complete!'
                      : '🚀 Next Adventure!'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </motion.main>
    </Layout>
  );
};

export default LessonsPage;
