// src/pages/LessonsPage.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, BookOpen, Play } from 'lucide-react';
import Layout from '../components/Layout';
import { progressAPI, exerciseAPI, achievementAPI } from '../services/api';

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

  // Fetch user progress from API
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

    // Update window width on resize for responsive staff
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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
    setActiveChapter(id);
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
          'Basic'
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
        'Basic'
      );

      alert(`Practice for ${chapters[activeChapter].title} recorded successfully!`);
    } catch (err) {
      console.error('Failed to record practice session', err);
      alert(`Practice for ${chapters[activeChapter].title} would start here.`);
    }
  };

  return (
    <Layout backgroundClass="music-app-background">
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
            <h2
              className="text-2xl font-bold text-gray-800"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Music Lessons
            </h2>
            <p className="text-gray-600" style={{ fontFamily: 'Lato, sans-serif' }}>
              Learn music theory and practice with structured lessons
            </p>
          </div>
          <div className="text-green-600">
            {/* Replace with the TrebleClef component in a real implementation */}
            <BookOpen size={32} />
          </div>
        </motion.div>

        {/* Decorative Music Staff */}
        <div className="mt-4 opacity-10">
          {/* This would be the MusicalStaff component in a real implementation */}
          <div className="h-6 relative">
            {[0, 1, 2, 3, 4].map(i => (
              <div
                key={`decorative-staff-${i}`}
                className="absolute w-full h-px bg-green-800"
                style={{ top: `${i * 6}px` }}
              />
            ))}
          </div>
        </div>

        {/* Show loading state */}
        {isLoading ? (
          <div className="mt-6 bg-white rounded-lg shadow-sm p-8 flex justify-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-t-2 border-r-2 border-green-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600">Loading your lessons...</p>
            </div>
          </div>
        ) : (
          <div className="mt-2 flex flex-col md:flex-row gap-6">
            {/* Chapter Navigation */}
            <motion.div
              className="md:w-72 bg-white rounded-lg shadow-sm overflow-hidden border-l-4 border-green-600"
              variants={itemVariants}
            >
              <div className="bg-gray-50 p-4 border-b border-gray-200">
                <h3
                  className="text-lg font-semibold text-gray-800"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  Lesson Chapters
                </h3>
              </div>

              <div className="p-3">
                {chapters.map(chapter => (
                  <motion.div
                    key={chapter.id}
                    className={`p-3 rounded-md mb-2 cursor-pointer flex items-center ${
                      activeChapter === chapter.id
                        ? 'bg-green-50 text-green-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => handleChapterSelect(chapter.id)}
                    whileHover={{
                      backgroundColor: activeChapter === chapter.id ? '#ecfdf5' : '#f9fafb',
                    }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="mr-3">
                      {userProgress[chapter.id] ? (
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-5 h-5 border border-gray-300 rounded-full" />
                      )}
                    </div>
                    <span style={{ fontFamily: 'Lato, sans-serif' }}>
                      {chapter.id + 1}. {chapter.title}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Lesson Content */}
            <motion.div
              className="flex-1 bg-white rounded-lg shadow-sm overflow-hidden border-l-4 border-green-600"
              variants={itemVariants}
              key={activeChapter} // Re-animate when chapter changes
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-gray-50 p-4 border-b border-gray-200">
                <h3
                  className="text-lg font-semibold text-gray-800"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  {chapters[activeChapter].title}
                </h3>
              </div>

              <div className="p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`chapter-${activeChapter}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    dangerouslySetInnerHTML={{ __html: chapters[activeChapter].content }}
                    className="lesson-content"
                    style={{ fontFamily: 'Lato, sans-serif' }}
                  />
                </AnimatePresence>

                {/* Display errors if any */}
                {error && (
                  <div className="mt-4 bg-red-50 p-4 rounded-md text-red-600 text-sm">{error}</div>
                )}

                {/* Navigation Buttons */}
                <div className="mt-8 flex justify-between items-center">
                  <div className="bg-white border border-gray-200 rounded-md p-3">
                    <span className="text-gray-600">
                      Lesson Progress: {activeChapter + 1}/{chapters.length}
                    </span>
                  </div>

                  <div className="flex gap-3">
                    <motion.button
                      className="bg-white border border-green-600 text-green-600 py-2 px-6 rounded-md flex items-center"
                      whileHover={{ backgroundColor: '#f9fafb' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handlePractice}
                    >
                      <Play size={16} className="mr-1" />
                      Practice
                    </motion.button>

                    <motion.button
                      className="bg-green-600 text-white py-2 px-6 rounded-md flex items-center"
                      whileHover={{ backgroundColor: '#16a34a' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleNextChapter}
                      disabled={activeChapter === chapters.length - 1}
                    >
                      Next Lesson
                      <ChevronRight size={16} className="ml-1" />
                    </motion.button>
                  </div>
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
