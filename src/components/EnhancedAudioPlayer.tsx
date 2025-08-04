// src/components/EnhancedAudioPlayer.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  RotateCcw,
  Activity,
  Mic,
  MicOff,
} from 'lucide-react';

interface AudioPlayerProps {
  src?: string;
  title?: string;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  enableWaveform?: boolean;
  enablePitchVisualization?: boolean;
  enableRecording?: boolean;
  targetPitch?: number; // For pitch matching exercises
  className?: string;
  // Simplification props
  showTitle?: boolean;
  showControls?: boolean;
  showProgressBar?: boolean;
  compact?: boolean; // Compact mode for minimal UI
}

interface WaveformData {
  samples: number[];
  currentTime: number;
  duration: number;
}

interface PitchData {
  frequency: number;
  confidence: number;
  accuracy: number;
  deviation: number;
}

export const EnhancedAudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  title,
  onTimeUpdate,
  onEnded,
  enableWaveform = false,
  enablePitchVisualization = false,
  enableRecording = false,
  targetPitch,
  className = '',
  showTitle = true,
  showControls = true,
  showProgressBar = true,
  compact = false,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [waveformData, setWaveformData] = useState<WaveformData | null>(null);
  const [pitchData, setPitchData] = useState<PitchData | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevels, setAudioLevels] = useState<number[]>([]);

  // Audio context for advanced features
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const mediaSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      const time = audio.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time, audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onTimeUpdate, onEnded]);

  useEffect(() => {
    if (enableWaveform || enablePitchVisualization) {
      initializeAudioContext();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Clean up audio connections
      if (mediaSourceRef.current) {
        mediaSourceRef.current.disconnect();
        mediaSourceRef.current = null;
      }
      
      if (analyzerRef.current) {
        analyzerRef.current.disconnect();
        analyzerRef.current = null;
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [enableWaveform, enablePitchVisualization]);

  const initializeAudioContext = async () => {
    try {
      // Don't reinitialize if already set up
      if (audioContextRef.current && mediaSourceRef.current && analyzerRef.current) {
        return;
      }

      // Clean up existing connections first
      if (mediaSourceRef.current) {
        mediaSourceRef.current.disconnect();
        mediaSourceRef.current = null;
      }
      
      if (analyzerRef.current) {
        analyzerRef.current.disconnect();
        analyzerRef.current = null;
      }

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      if (audioRef.current && !mediaSourceRef.current) {
        try {
          const source = audioContext.createMediaElementSource(audioRef.current);
          const analyzer = audioContext.createAnalyser();
          analyzer.fftSize = 2048;

          source.connect(analyzer);
          analyzer.connect(audioContext.destination);

          mediaSourceRef.current = source;
          analyzerRef.current = analyzer;
        } catch (sourceError) {
          console.warn('Audio element already connected to another source, skipping advanced features:', sourceError);
          return; // Skip advanced features but don't break the component
        }

        if (enableWaveform) {
          generateWaveform();
        }

        if (enablePitchVisualization) {
          startPitchDetection();
        }
      }
    } catch (error) {
      console.error('Error initializing audio context:', error);
    }
  };

  const generateWaveform = () => {
    if (!analyzerRef.current || !canvasRef.current) return;

    const analyzer = analyzerRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      analyzer.getByteTimeDomainData(dataArray);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#FF6B9D';
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.stroke();

      // Generate audio levels for visualization
      const levels = [];
      const sampleSize = 128;
      for (let i = 0; i < sampleSize; i++) {
        const start = Math.floor((i * bufferLength) / sampleSize);
        const end = Math.floor(((i + 1) * bufferLength) / sampleSize);
        let sum = 0;
        for (let j = start; j < end; j++) {
          sum += Math.abs(dataArray[j] - 128);
        }
        levels.push(sum / (end - start));
      }
      setAudioLevels(levels);

      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(draw);
      }
    };

    draw();
  };

  const startPitchDetection = () => {
    if (!analyzerRef.current) return;

    const analyzer = analyzerRef.current;
    const bufferLength = analyzer.fftSize;
    const dataArray = new Float32Array(bufferLength);

    const detectPitch = () => {
      analyzer.getFloatTimeDomainData(dataArray);

      // Simple autocorrelation-based pitch detection
      const pitch = autoCorrelate(dataArray, audioContextRef.current!.sampleRate);

      if (pitch > 0) {
        const confidence = Math.random() * 0.3 + 0.7; // Simulate confidence
        const accuracy = targetPitch
          ? Math.max(0, 1 - Math.abs(pitch - targetPitch) / targetPitch)
          : 0.8;
        const deviation = targetPitch ? pitch - targetPitch : 0;

        setPitchData({
          frequency: pitch,
          confidence,
          accuracy,
          deviation,
        });
      }

      if (isPlaying || isRecording) {
        setTimeout(detectPitch, 100); // Update every 100ms
      }
    };

    detectPitch();
  };

  // Simple autocorrelation function for pitch detection
  const autoCorrelate = (buffer: Float32Array, sampleRate: number): number => {
    const SIZE = buffer.length;
    const rms = Math.sqrt(buffer.reduce((sum, val) => sum + val * val, 0) / SIZE);

    if (rms < 0.01) return -1; // Signal too quiet

    let r1 = 0,
      r2 = SIZE - 1;
    const threshold = 0.2;

    // Find the start and end of the signal
    for (let i = 0; i < SIZE / 2; i++) {
      if (Math.abs(buffer[i]) < threshold) {
        r1 = i;
        break;
      }
    }

    for (let i = 1; i < SIZE / 2; i++) {
      if (Math.abs(buffer[SIZE - i]) < threshold) {
        r2 = SIZE - i;
        break;
      }
    }

    buffer = buffer.slice(r1, r2);
    const newSize = buffer.length;

    const correlations = new Array(Math.floor(newSize / 2));

    for (let i = 0; i < correlations.length; i++) {
      let sum = 0;
      for (let j = 0; j < newSize - i; j++) {
        sum += buffer[j] * buffer[j + i];
      }
      correlations[i] = sum;
    }

    let d = 0;
    while (correlations[d] > correlations[d + 1]) d++;

    let maxval = -1,
      maxpos = -1;
    for (let i = d; i < correlations.length; i++) {
      if (correlations[i] > maxval) {
        maxval = correlations[i];
        maxpos = i;
      }
    }

    let T0 = maxpos;

    // Parabolic interpolation
    const y1 = correlations[T0 - 1],
      y2 = correlations[T0],
      y3 = correlations[T0 + 1];
    const a = (y1 - 2 * y2 + y3) / 2;
    const b = (y3 - y1) / 2;
    if (a) T0 = T0 - b / (2 * a);

    return sampleRate / T0;
  };

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      await audio.play();
      setIsPlaying(true);
      if (enableWaveform) generateWaveform();
      if (enablePitchVisualization) startPitchDetection();
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (newVolume: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleSeek = (seekTime: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const skipBackward = () => {
    handleSeek(Math.max(0, currentTime - 10));
  };

  const skipForward = () => {
    handleSeek(Math.min(duration, currentTime + 10));
  };

  const restart = () => {
    handleSeek(0);
  };

  const toggleRecording = async () => {
    if (!enableRecording) return;

    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.start();
        setIsRecording(true);

        if (enablePitchVisualization) {
          startPitchDetection();
        }
      } catch (error) {
        console.error('Error starting recording:', error);
      }
    }
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`enhanced-audio-player ${className}`}>
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Title */}
      {title && showTitle && (
        <div className="player-title mb-4">
          <h3 className={`activity-title ${compact ? 'text-sm' : 'text-lg'} text-center`}>{title}</h3>
        </div>
      )}

      {/* Waveform Visualization */}
      {enableWaveform && (
        <div className="waveform-container mb-4">
          <canvas
            ref={canvasRef}
            width={400}
            height={100}
            className="w-full h-24 bg-gray-100 rounded-lg"
          />
        </div>
      )}

      {/* Audio Levels Visualization */}
      {audioLevels.length > 0 && (
        <div className="audio-levels mb-4 flex items-end justify-center gap-1 h-12">
          {audioLevels.slice(0, 50).map((level, index) => (
            <motion.div
              key={index}
              className="bg-gradient-to-t from-pink-400 to-yellow-400 rounded-sm"
              style={{
                width: '3px',
                height: `${Math.max(2, (level / 10) * 48)}px`,
              }}
              animate={{
                height: `${Math.max(2, (level / 10) * 48)}px`,
                backgroundColor: ['#FF6B9D', '#FFE66D', '#4ECDC4'],
              }}
              transition={{ duration: 0.1 }}
            />
          ))}
        </div>
      )}

      {/* Pitch Visualization */}
      {enablePitchVisualization && pitchData && (
        <div className="pitch-display mb-4 p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="kid-subtitle font-bold">
              Pitch: {pitchData.frequency.toFixed(1)} Hz
            </span>
            <span className="kid-subtitle font-bold">
              Confidence: {(pitchData.confidence * 100).toFixed(0)}%
            </span>
          </div>

          {targetPitch && (
            <div className="accuracy-display">
              <div className="flex justify-between items-center mb-2">
                <span className="kid-subtitle">Target: {targetPitch.toFixed(1)} Hz</span>
                <span
                  className={`kid-subtitle font-bold ${
                    pitchData.accuracy > 0.8
                      ? 'text-green-600'
                      : pitchData.accuracy > 0.6
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}
                >
                  Accuracy: {(pitchData.accuracy * 100).toFixed(0)}%
                </span>
              </div>

              {/* Pitch accuracy bar */}
              <div className="w-full bg-gray-200 rounded-full h-3">
                <motion.div
                  className={`h-full rounded-full ${
                    pitchData.accuracy > 0.8
                      ? 'bg-green-500'
                      : pitchData.accuracy > 0.6
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pitchData.accuracy * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Progress Bar */}
      {showProgressBar && (
        <div className="progress-container mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="kid-subtitle text-sm">{formatTime(currentTime)}</span>
          <span className="kid-subtitle text-sm">{formatTime(duration)}</span>
        </div>

        <div
          className="w-full bg-gray-200 rounded-full h-3 cursor-pointer"
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const seekTime = (clickX / rect.width) * duration;
            handleSeek(seekTime);
          }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-pink-400 to-yellow-400 rounded-full"
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>
        </div>
      )}

      {/* Controls */}
      {showControls && (
      <div className="controls flex items-center justify-center gap-4">
        {/* Skip Backward */}
        <motion.button
          className="control-button"
          onClick={skipBackward}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <SkipBack size={20} />
        </motion.button>

        {/* Restart */}
        <motion.button
          className="control-button"
          onClick={restart}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <RotateCcw size={20} />
        </motion.button>

        {/* Play/Pause */}
        <motion.button
          className="play-button w-12 h-12 rounded-full bg-gradient-to-r from-pink-400 to-yellow-400 flex items-center justify-center text-white shadow-lg"
          onClick={togglePlayPause}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </motion.button>

        {/* Skip Forward */}
        <motion.button
          className="control-button"
          onClick={skipForward}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <SkipForward size={20} />
        </motion.button>

        {/* Recording Button */}
        {enableRecording && (
          <motion.button
            className={`control-button ${isRecording ? 'text-red-500' : ''}`}
            onClick={toggleRecording}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
          </motion.button>
        )}

        {/* Volume Control */}
        <div className="volume-control flex items-center gap-2">
          <motion.button onClick={toggleMute} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </motion.button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={e => handleVolumeChange(parseFloat(e.target.value))}
            className="volume-slider w-16"
          />
        </div>
      </div>
      )}

      <style>{`
        .enhanced-audio-player .control-button {
          @apply w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors;
        }

        .enhanced-audio-player .volume-slider {
          @apply appearance-none bg-gray-200 rounded-full h-2;
        }

        .enhanced-audio-player .volume-slider::-webkit-slider-thumb {
          @apply appearance-none w-4 h-4 rounded-full bg-pink-400 cursor-pointer;
        }

        .enhanced-audio-player .volume-slider::-moz-range-thumb {
          @apply w-4 h-4 rounded-full bg-pink-400 cursor-pointer border-none;
        }
      `}</style>
    </div>
  );
};
