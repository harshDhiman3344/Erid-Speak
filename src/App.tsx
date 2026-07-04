import { useState, useEffect, useRef, useMemo } from 'react';
import {
  rockyAudioEngine,
  translateEnglishToRocky,
  rockyDictionary
} from './services/rockyEngine';
import type { FunMode, WordTranslation } from './services/rockyEngine';
import { SheetMusic } from './components/SheetMusic';
import { Visualizer } from './components/Visualizer';
import {
  Mic,
  MicOff,
  Volume2,
  Play,
  Square,
  Download,
  BookOpen,
  Settings
} from 'lucide-react';

export default function App() {
  // Input State
  const [transcript, setTranscript] = useState<string>("Hello Rocky Friend");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [currentMode, setCurrentMode] = useState<FunMode>("canon");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Audio Playback State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playingWordIndex, setPlayingWordIndex] = useState<number>(-1);
  const [volume, setVolume] = useState<number>(0); // Starts at 0 dB (much louder)
  const [tempoWpm, setTempoWpm] = useState<number>(65);
  const [recordActive, setRecordActive] = useState<boolean>(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string>("");

  // UI overlays
  const [showDictionary, setShowDictionary] = useState<boolean>(false);

  // References
  const recognitionRef = useRef<any>(null);
  const playLoopRef = useRef<boolean>(false);

  // Translate inputs in real-time
  const translation = useMemo(() => {
    return translateEnglishToRocky(transcript, currentMode);
  }, [transcript, currentMode]);

  // Speech Recognition setup
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage("Voice recognition not supported in this browser. Please type message manually.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setErrorMessage("");
    };

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech') {
        setErrorMessage(`Mic Error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  // Update volume
  useEffect(() => {
    rockyAudioEngine.setVolume(volume);
  }, [volume]);

  // Abort control hook
  useEffect(() => {
    if (!isPlaying) {
      rockyAudioEngine.stopAll();
      setPlayingWordIndex(-1);
    }
  }, [isPlaying]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isPlaying) setIsPlaying(false);

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const startPlayback = async () => {
    if (isPlaying) {
      playLoopRef.current = false;
      setIsPlaying(false);
      return;
    }
    if (!translation || translation.items.length === 0) return;

    // Set play loop state directly and synchronously to prevent early abort
    playLoopRef.current = true;
    setIsPlaying(true);
    rockyAudioEngine.init();

    // Small spaceship activation beep
    const synthCtx = new window.AudioContext();
    const osc = synthCtx.createOscillator();
    const gainNode = synthCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1000, synthCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1500, synthCtx.currentTime + 0.08);
    gainNode.gain.setValueAtTime(0.05, synthCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, synthCtx.currentTime + 0.15);
    osc.connect(gainNode);
    gainNode.connect(synthCtx.destination);
    osc.start();
    osc.stop(synthCtx.currentTime + 0.15);

    if (recordActive) {
      rockyAudioEngine.startRecording();
    }

    // Play Rocky's chords sequentially
    for (let i = 0; i < translation.items.length; i++) {
      if (!playLoopRef.current) {
        break;
      }

      setPlayingWordIndex(i);
      const item = translation.items[i];

      let baseDuration = 0.5;
      if (currentMode === 'excited') baseDuration = 0.25;
      if (currentMode === 'sleepy') baseDuration = 1.4;
      if (currentMode === 'confused') baseDuration = 0.65;

      const scale = 60 / tempoWpm;
      const finalDuration = baseDuration * scale;

      rockyAudioEngine.playChord(item.notes, finalDuration);

      const gap = currentMode === 'sleepy' ? 0.3 : 0.12;
      await new Promise(resolve => setTimeout(resolve, (finalDuration + gap * scale) * 1000));
    }

    setPlayingWordIndex(-1);
    setIsPlaying(false);

    if (recordActive) {
      const url = await rockyAudioEngine.stopRecording();
      setRecordedAudioUrl(url);
    }
  };

  const playSingleWord = (item: WordTranslation) => {
    rockyAudioEngine.init();
    rockyAudioEngine.playChord(item.notes, 0.55);
  };

  // Avatar pulse
  const [avatarPulse, setAvatarPulse] = useState<number>(0);
  useEffect(() => {
    let id: number;
    const tick = () => {
      id = requestAnimationFrame(tick);
      if (isPlaying) {
        const speed = currentMode === 'excited' ? 40 : currentMode === 'sleepy' ? 12 : 24;
        setAvatarPulse(Math.sin(Date.now() / speed) * 8);
      } else {
        setAvatarPulse(Math.sin(Date.now() / 900) * 1.5);
      }
    };
    tick();
    return () => cancelAnimationFrame(id);
  }, [isPlaying, currentMode]);

  const themeColors = useMemo(() => {
    switch (currentMode) {
      case 'excited': return { glow: '#57ffb3', text: 'text-[#57ffb3]' };
      case 'confused': return { glow: '#ff4d4d', text: 'text-[#ff4d4d]' };
      case 'sleepy': return { glow: '#4da6ff', text: 'text-[#4da6ff]' };
      case 'jazz': return { glow: '#ff4da6', text: 'text-[#ff4da6]' };
      case 'scientific': return { glow: '#ff9d42', text: 'text-[#ff9d42]' };
      case 'curious': return { glow: '#e0b3ff', text: 'text-[#e0b3ff]' };
      case 'canon':
      default: return { glow: '#f5b971', text: 'text-[#f5b971]' };
    }
  }, [currentMode]);

  const avatarLimbPoints = useMemo(() => {
    const cx = 50;
    const cy = 50;
    const r = 24;
    const pts = [];
    const baseOffset = isPlaying ? (currentMode === 'excited' ? 1.5 : 0.6) : 0.15;

    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      const pulseMod = Math.sin(Date.now() / (isPlaying ? 35 : 450) + i * 2.3) * baseOffset;
      const currentRadius = r + pulseMod + (isPlaying ? avatarPulse : 0);
      pts.push({
        x: cx + currentRadius * Math.cos(angle),
        y: cy + currentRadius * Math.sin(angle)
      });
    }
    return pts;
  }, [avatarPulse, isPlaying, currentMode]);

  return (
    <div className="crt-screen h-screen overflow-hidden flex flex-col justify-between p-3 max-w-[1200px] w-full mx-auto text-xs">
      
      {/* 1. Header (Compact, No Grow) */}
      <header className="terminal-panel flex-shrink-0 w-full flex items-center justify-between py-2 px-3 mb-2">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-[#ff9d42] animate-ping" />
          <div>
            <h1 className="text-md md:text-lg m-0 text-white font-bold leading-none">Eridian Comms HUD</h1>
            <p className="text-[10px] font-digital tracking-widest text-[#f5b971]/60 leading-none mt-1">
              HAIL MARY CONSOLE v2.6 // COGNITIVE INTERFACE
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 font-digital text-[10px] text-[#f5b971]/60">
          <span>ATMOS SYNCED</span>
          <span>ORBITAL RATIO: 1.05</span>
        </div>
      </header>

      {/* 2. Main content height-bounded */}
      <main className="w-full flex-grow grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch min-h-0 overflow-hidden mb-2">
        
        {/* Left Column: Diagnostics (Avatar, Scope, Mood) */}
        <section className="lg:col-span-4 flex flex-col gap-3 h-full min-h-0 overflow-hidden">
          
          {/* Combined Biometrics and Scope Card */}
          <div className="terminal-panel flex flex-col justify-between p-3 flex-grow min-h-0 overflow-hidden">
            <h2 className="text-xs font-bold text-[#ff9d42] mb-1 leading-none uppercase flex-shrink-0">Signal Diagnostics</h2>
            
            {/* Split layout: Avatar Left, Scope Right */}
            <div className="flex items-center justify-around gap-2 my-2 flex-grow overflow-hidden">
              {/* Pentapod Radar */}
              <div className="w-[90px] h-[90px] flex items-center justify-center relative border border-[#f5b971]/10 rounded bg-[#05060d]/50 p-1 flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-[0_0_5px_rgba(255,157,66,0.25)]">
                  <polygon points="50,10 88,38 73,82 27,82 12,38" fill="none" stroke="rgba(245, 185, 113, 0.05)" strokeWidth="0.8" />
                  {avatarLimbPoints.map((pt, idx) => (
                    <line key={idx} x1="50" y1="50" x2={pt.x} y2={pt.y} stroke={themeColors.glow} strokeWidth="1" strokeOpacity="0.4" />
                  ))}
                  <polygon points={avatarLimbPoints.map(p => `${p.x},${p.y}`).join(' ')} fill="rgba(245, 185, 113, 0.05)" stroke={themeColors.glow} strokeWidth="1.5" />
                  <circle cx="50" cy="50" r="3" fill="#05060d" stroke={themeColors.glow} strokeWidth="1.5" />
                  {avatarLimbPoints.map((pt, idx) => (
                    <circle key={idx} cx={pt.x} cy={pt.y} r="2" fill={themeColors.glow} />
                  ))}
                </svg>
              </div>

              {/* Status metrics details */}
              <div className="flex-grow flex flex-col justify-center font-digital pl-2 overflow-hidden">
                <span className="text-[10px] text-[#f5b971]/50 uppercase leading-none">Rocky State</span>
                <span className={`text-sm font-bold tracking-wider ${themeColors.text} uppercase leading-normal mt-0.5 truncate`}>{currentMode}</span>
                
                <span className="text-[9px] text-[#f5b971]/40 uppercase mt-1 leading-none">Carapace Radar</span>
                <span className="text-[10px] text-white leading-normal">SYNC: OK</span>
              </div>
            </div>

            {/* Little Oscilloscope on the side */}
            <div className="border border-[#f5b971]/15 rounded overflow-hidden flex-shrink-0">
              <Visualizer />
            </div>
          </div>

          {/* Emotional Modes - Compact grid */}
          <div className="terminal-panel p-3 flex-shrink-0">
            <h2 className="text-xs font-bold text-[#ff9d42] mb-2 leading-none uppercase">Mood Matrix</h2>
            <div className="grid grid-cols-4 gap-1">
              {(['canon', 'scientific', 'curious', 'excited', 'confused', 'jazz', 'sleepy'] as FunMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setCurrentMode(mode);
                    if (isPlaying) setIsPlaying(false);
                  }}
                  className={`btn-console text-center py-1 px-1 text-[10px] truncate ${currentMode === mode ? 'btn-console-primary' : ''}`}
                  title={mode}
                >
                  {mode}
                </button>
              ))}
              <button
                onClick={() => setShowDictionary(prev => !prev)}
                className={`btn-console text-center py-1 px-1 text-[10px] border-[#ff9d42] text-[#ff9d42] flex items-center justify-center gap-0.5`}
              >
                <BookOpen size={9} />
                <span>Dict</span>
              </button>
            </div>
          </div>
        </section>

        {/* Right Column: Main Simplifed Interface (Enter -> Translate -> Transmit) */}
        <section className="lg:col-span-8 flex flex-col gap-3 h-full min-h-0 overflow-hidden">
          
          {/* Transmission card */}
          <div className="terminal-panel p-3 flex-grow flex flex-col justify-between min-h-0 overflow-hidden">
            <h2 className="text-xs font-bold text-[#ff9d42] mb-2 leading-none uppercase flex-shrink-0">Transmission HUB</h2>

            {/* 1. Enter Message (Unified Text Input + Mic Icon) */}
            <div className="flex flex-col gap-1 flex-shrink-0">
              <label className="text-[10px] font-mono text-[#f5b971]/60 uppercase leading-none mb-1">1. Enter English Message</label>
              <div className="relative w-full flex items-center">
                <input
                  type="text"
                  placeholder="Enter message to translate (e.g. hello friend science yes)..."
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  className="console-input w-full pr-10 text-sm font-mono"
                />
                <button
                  onClick={toggleListening}
                  type="button"
                  className={`absolute right-1 p-2 rounded-full transition-colors ${isListening ? 'text-[#ff4d4d] bg-[#ff4d4d]/10 animate-pulse' : 'text-[#f5b971]/70 hover:text-white'}`}
                  title="Voice dictation"
                >
                  {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
              </div>
            </div>

            {/* Dictionary Panel overlay inside Hub */}
            {showDictionary && (
              <div className="bg-[#05060d] border border-[#f5b971]/30 p-2 rounded text-[10px] font-mono my-1 max-h-[85px] overflow-y-auto flex-shrink-0">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1">
                  {Object.entries(rockyDictionary).map(([word, notes]) => (
                    <div
                      key={word}
                      onClick={() => {
                        setTranscript(prev => (prev ? prev + ' ' + word : word));
                        playSingleWord({ word, notes, symbols: '♫', glyphPath: '', glyphPoints: [] });
                      }}
                      className="cursor-pointer hover:bg-[#f5b971]/10 p-0.5 rounded border border-[#f5b971]/5 flex justify-between items-center"
                    >
                      <span className="text-white font-bold">{word}</span>
                      <span className="text-[#ff9d42] text-[8px] font-digital">{notes.join(' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Translated Notes (Live Amber Output Chords + Unicode + SVG Eridian glyphs) */}
            <div className="flex flex-col gap-1 flex-grow min-h-0 overflow-hidden my-1">
              <label className="text-[10px] font-mono text-[#f5b971]/60 uppercase leading-none mb-1 flex-shrink-0">2. Translated Eridian Resonance Chords</label>
              
              <div className="bg-[#05060d]/50 border border-[#f5b971]/15 p-2 rounded-lg flex flex-col gap-1.5 flex-grow min-h-0 overflow-hidden">
                {/* Notes and unicode symbols */}
                <div className="flex justify-between items-center border-b border-[#f5b971]/5 pb-1 flex-shrink-0">
                  <div className="font-digital text-sm text-[#ff9d42] tracking-wider font-bold">
                    {translation?.items.length > 0 ? (
                      translation.items.map((item, idx) => (
                        <span
                          key={idx}
                          onClick={() => playSingleWord(item)}
                          className={`cursor-pointer hover:underline mx-1 ${playingWordIndex === idx ? 'text-[#57ffb3] font-black' : ''}`}
                        >
                          {item.notes.join('')}
                        </span>
                      ))
                    ) : (
                      "AWAITING INPUT..."
                    )}
                  </div>
                  <div className="text-sm font-digital text-[#f5b971]/80 italic">
                    {translation?.symbols ? translation.symbols : ""}
                  </div>
                </div>

                {/* Eridian coordinates glyph rows */}
                {translation && translation.items.length > 0 && (
                  <div className="flex flex-wrap gap-2 py-1 flex-grow overflow-y-auto scrollbar-thin min-h-0">
                    {translation.items.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => playSingleWord(item)}
                        className={`flex items-center gap-1.5 p-1 rounded border cursor-pointer hover:bg-[#ff9d42]/10 transition-colors flex-shrink-0 ${playingWordIndex === idx ? 'border-[#57ffb3] bg-[#ff9d42]/5' : 'border-[#f5b971]/10'}`}
                      >
                        <svg viewBox="0 0 100 100" className="w-5 h-5 filter drop-shadow-[0_0_3px_rgba(255,157,66,0.3)]">
                          <polygon points="50,10 88,38 73,82 27,82 12,38" fill="none" stroke="rgba(245, 185, 113, 0.05)" strokeWidth="0.8" />
                          <path d={item.glyphPath} fill="none" stroke={playingWordIndex === idx ? '#57ffb3' : '#ff9d42'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                          {item.glyphPoints.map((pt, pIdx) => (
                            <circle key={pIdx} cx={pt.x} cy={pt.y} r="3" fill={playingWordIndex === idx ? '#57ffb3' : '#f5b971'} />
                          ))}
                        </svg>
                        <div className="flex flex-col text-[8px] font-mono leading-none">
                          <span className="text-white font-bold">{item.word}</span>
                          <span className="text-[#f5b971]/50">{item.notes.join(',')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 3. Musical sheet staff notation */}
            <div className="flex flex-col gap-1 flex-shrink-0 mb-1">
              <label className="text-[10px] font-mono text-[#f5b971]/60 uppercase leading-none mb-1">3. Sheet Notation</label>
              <div className="scale-95 origin-top-left transform-gpu">
                <SheetMusic chords={translation?.notes || []} />
              </div>
            </div>

            {/* 4. Play notes (Transmit controls) */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-t border-[#f5b971]/15 pt-2 flex-shrink-0">
              {/* Play buttons */}
              <div className="flex items-center gap-2 flex-grow">
                <button
                  onClick={startPlayback}
                  disabled={!translation || translation.items.length === 0}
                  className={`btn-console flex-grow py-2 flex items-center justify-center gap-1.5 text-xs ${isPlaying ? 'btn-console-danger' : 'btn-console-primary'}`}
                >
                  {isPlaying ? (
                    <>
                      <Square size={13} fill="currentColor" />
                      <span>Stop Transmission</span>
                    </>
                  ) : (
                    <>
                      <Play size={13} fill="currentColor" />
                      <span>Transmit Message</span>
                    </>
                  )}
                </button>
              </div>

              {/* Sliders and recorder downloads */}
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                {/* Volume slider */}
                <div className="flex items-center gap-2 bg-[#05060d]/50 px-2 py-1.5 rounded border border-[#f5b971]/10">
                  <Volume2 size={11} className="text-[#f5b971]" />
                  <input
                    type="range"
                    min="-25"
                    max="10"
                    step="1"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-16 h-1 bg-[#05060d] rounded-lg appearance-none cursor-pointer accent-[#ff9d42]"
                  />
                  <span className="w-6 text-right">{volume} dB</span>
                </div>

                {/* Tempo slider */}
                <div className="flex items-center gap-2 bg-[#05060d]/50 px-2 py-1.5 rounded border border-[#f5b971]/10">
                  <Settings size={11} className="text-[#f5b971]" />
                  <input
                    type="range"
                    min="30"
                    max="110"
                    step="5"
                    value={tempoWpm}
                    onChange={(e) => setTempoWpm(Number(e.target.value))}
                    className="w-16 h-1 bg-[#05060d] rounded-lg appearance-none cursor-pointer accent-[#ff9d42]"
                  />
                  <span className="w-8 text-right">{tempoWpm} WPM</span>
                </div>

                {/* Recorder Arm */}
                <div className="flex items-center gap-2 bg-[#05060d]/50 px-2 py-1 rounded border border-[#f5b971]/10">
                  <label htmlFor="recordToggle" className="cursor-pointer">REC WAV</label>
                  <input
                    type="checkbox"
                    checked={recordActive}
                    onChange={(e) => setRecordActive(e.target.checked)}
                    id="recordToggle"
                    disabled={isPlaying}
                    className="w-3.5 h-3.5 cursor-pointer accent-[#ff9d42]"
                  />
                  {recordedAudioUrl && (
                    <a
                      href={recordedAudioUrl}
                      download={`rocky_${currentMode}_message.webm`}
                      className="btn-console py-0.5 px-1.5 text-[9px] flex items-center gap-1 bg-[#ff9d42] text-[#05060d] hover:bg-[#ff9d42] border-[#ff9d42] rounded"
                      title="Download audio WAV"
                    >
                      <Download size={9} />
                      <span>Download</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="border border-[#ff4d4d]/30 bg-[#ff4d4d]/5 text-[10px] text-[#ff4d4d] p-1.5 rounded font-mono mt-2 leading-none">
                ⚠ {errorMessage}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
