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
 
  const [transcript, setTranscript] = useState<string>("Hello Rocky Friend");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [currentMode, setCurrentMode] = useState<FunMode>("canon");
  const [errorMessage, setErrorMessage] = useState<string>("");


  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playingWordIndex, setPlayingWordIndex] = useState<number>(-1);
  const [volume, setVolume] = useState<number>(0); // 0 dB is standard full volume
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
    <div className="crt-screen app-wrapper">
      
      {/* 1. Header (Compact, No Grow) */}
      <header className="terminal-panel header-bar">
        <div className="header-title-box">
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff9d42' }} />
          <div>
            <h1 style={{ fontSize: '13px', margin: 0, color: '#fff', fontWeight: 'bold', lineHeight: '1' }}>Eridian Comms HUD</h1>
            <p className="font-digital" style={{ fontSize: '9px', color: 'rgba(245, 185, 113, 0.6)', letterSpacing: '1.5px', lineHeight: '1', marginTop: '3px' }}>
              HAIL MARY CONSOLE v2.6 // COGNITIVE INTERFACE
            </p>
          </div>
        </div>
        <div className="header-status-box">
          <span>ATMOS SYNCED</span>
          <span>ORBITAL RATIO: 1.05</span>
        </div>
      </header>

      {/* 2. Main layout splits left and right columns */}
      <main className="main-layout">
        
        {/* Left Column: Diagnostics (Avatar, Scope, Mood) */}
        <section className="diagnostics-col">
          
          {/* Combined Biometrics and Scope Card */}
          <div className="terminal-panel diagnostics-card">
            <h2 style={{ fontSize: '10px', fontWeight: 'bold', color: '#ff9d42', textTransform: 'uppercase', lineHeight: '1', position: 'absolute', top: '10px', left: '10px' }}>Signal Diagnostics</h2>
            
            {/* TV Screen scope in the corner */}
            <div className="tv-scope">
              <Visualizer />
            </div>

            {/* Centered Avatar and Status metrics below title */}
            <div className="avatar-status-container">
              {/* Pentapod Radar */}
              <div className="radar-wrapper">
                <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
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
              <div className="status-details">
                <span style={{ fontSize: '9px', color: 'rgba(245, 185, 113, 0.5)', textTransform: 'uppercase', lineHeight: '1' }}>Rocky State</span>
                <span className={themeColors.text} style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', lineHeight: '1.2', marginTop: '2px' }}>{currentMode}</span>
                
                <span style={{ fontSize: '8px', color: 'rgba(245, 185, 113, 0.4)', textTransform: 'uppercase', marginTop: '5px', lineHeight: '1' }}>Carapace Radar</span>
                <span style={{ fontSize: '9px', color: '#57ffb3', fontWeight: 'bold', lineHeight: '1.2' }}>SYNC: ACTIVE</span>
              </div>
            </div>
          </div>

          {/* Emotional Modes - Compact grid */}
          <div className="terminal-panel mood-matrix-card">
            <h2 style={{ fontSize: '10px', fontWeight: 'bold', color: '#ff9d42', textTransform: 'uppercase', lineHeight: '1' }}>Mood Matrix</h2>
            <div className="mood-grid">
              {(['canon', 'scientific', 'curious', 'excited', 'confused', 'jazz', 'sleepy'] as FunMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setCurrentMode(mode);
                    if (isPlaying) setIsPlaying(false);
                  }}
                  className={`btn-console ${currentMode === mode ? 'btn-console-primary' : ''}`}
                  title={mode}
                >
                  {mode}
                </button>
              ))}
              <button
                onClick={() => setShowDictionary(prev => !prev)}
                className="btn-console"
                style={{ borderColor: '#ff9d42', color: '#ff9d42', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}
              >
                <BookOpen size={9} />
                <span>Dict</span>
              </button>
            </div>
          </div>
        </section>

        {/* Right Column: Main Simplifed Interface (Enter -> Translate -> Transmit) */}
        <section className="hub-col">
          
          {/* Transmission card */}
          <div className="terminal-panel hub-card">
            <h2 style={{ fontSize: '10px', fontWeight: 'bold', color: '#ff9d42', textTransform: 'uppercase', lineHeight: '1' }}>Transmission HUB</h2>

            {/* 1. Enter Message (Unified Text Input + Mic Icon) */}
            <div className="input-row">
              <label style={{ fontSize: '8px', fontFamily: 'monospace', color: 'rgba(245, 185, 113, 0.6)', textTransform: 'uppercase', lineHeight: '1', marginBottom: '2px' }}>1. Enter English Message</label>
              <div className="input-with-icon">
                <input
                  type="text"
                  placeholder="Enter message to translate (e.g. hello friend science yes)..."
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  className="console-input"
                />
                <button
                  onClick={toggleListening}
                  type="button"
                  className={`input-mic-btn ${isListening ? 'input-mic-btn-active' : ''}`}
                  title="Voice dictation"
                >
                  {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                </button>
              </div>
            </div>

            {/* Dictionary Panel overlay inside Hub */}
            {showDictionary && (
              <div className="dict-panel-overlay">
                <div className="dict-grid">
                  {Object.entries(rockyDictionary).map(([word, notes]) => (
                    <div
                      key={word}
                      onClick={() => {
                        setTranscript(prev => (prev ? prev + ' ' + word : word));
                        playSingleWord({ word, notes, symbols: '♫', glyphPath: '', glyphPoints: [] });
                      }}
                      className="dict-item"
                    >
                      <span style={{ color: '#fff', fontWeight: 'bold' }}>{word}</span>
                      <span className="font-digital" style={{ color: '#ff9d42', fontSize: '8px' }}>{notes.join(' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Translated Notes (Live Amber Output Chords + Unicode + SVG Eridian glyphs) */}
            <div className="chords-panel">
              <label style={{ fontSize: '8px', fontFamily: 'monospace', color: 'rgba(245, 185, 113, 0.6)', textTransform: 'uppercase', lineHeight: '1', marginBottom: '2px' }}>2. Translated Eridian Resonance Chords</label>
              
              <div className="chords-display-box">
                {/* Notes and unicode symbols */}
                <div className="chords-text-row">
                  <div className="font-digital" style={{ fontSize: '13px', color: '#ff9d42', letterSpacing: '1px', fontWeight: 'bold' }}>
                    {translation?.items.length > 0 ? (
                      translation.items.map((item, idx) => (
                        <span
                          key={idx}
                          onClick={() => playSingleWord(item)}
                          style={{
                            cursor: 'pointer',
                            margin: '0 4px',
                            textDecoration: playingWordIndex === idx ? 'underline' : 'none',
                            color: playingWordIndex === idx ? '#57ffb3' : '#ff9d42',
                            fontWeight: playingWordIndex === idx ? '900' : 'bold'
                          }}
                        >
                          {item.notes.join('')}
                        </span>
                      ))
                    ) : (
                      "AWAITING INPUT..."
                    )}
                  </div>
                  <div className="font-digital" style={{ fontSize: '12px', color: 'rgba(245, 185, 113, 0.8)', fontStyle: 'italic' }}>
                    {translation?.symbols ? translation.symbols : ""}
                  </div>
                </div>

                {/* Eridian coordinates glyph rows */}
                {translation && translation.items.length > 0 && (
                  <div className="glyphs-row">
                    {translation.items.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => playSingleWord(item)}
                        className={`glyph-item-btn ${playingWordIndex === idx ? 'glyph-item-btn-active' : ''}`}
                      >
                        <svg viewBox="0 0 100 100" style={{ width: '22px', height: '22px' }}>
                          <polygon points="50,10 88,38 73,82 27,82 12,38" fill="none" stroke="rgba(245, 185, 113, 0.05)" strokeWidth="0.8" />
                          <path d={item.glyphPath} fill="none" stroke={playingWordIndex === idx ? '#57ffb3' : '#ff9d42'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                          {item.glyphPoints.map((pt, pIdx) => (
                            <circle key={pIdx} cx={pt.x} cy={pt.y} r="3" fill={playingWordIndex === idx ? '#57ffb3' : '#f5b971'} />
                          ))}
                        </svg>
                        <div style={{ display: 'flex', flexDirection: 'column', fontSize: '8px', fontFamily: 'monospace', lineHeight: '1' }}>
                          <span style={{ color: '#fff', fontWeight: 'bold' }}>{item.word}</span>
                          <span style={{ color: 'rgba(245, 185, 113, 0.5)' }}>{item.notes.join(',')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 3. Musical sheet staff notation */}
            <div className="sheet-notation-row">
              <label style={{ fontSize: '8px', fontFamily: 'monospace', color: 'rgba(245, 185, 113, 0.6)', textTransform: 'uppercase', lineHeight: '1', marginBottom: '2px' }}>3. Sheet Notation</label>
              <div className="sheet-scale-wrap">
                <SheetMusic chords={translation?.notes || []} />
              </div>
            </div>

            {/* 4. Play notes (Transmit controls) */}
            <div className="control-bar">
              {/* Play buttons */}
              <div style={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                <button
                  onClick={startPlayback}
                  disabled={!translation || translation.items.length === 0}
                  className={`btn-console ${isPlaying ? 'btn-console-danger' : 'btn-console-primary'}`}
                  style={{ flexGrow: 1, padding: '8px 16px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  {isPlaying ? (
                    <>
                      <Square size={12} fill="currentColor" />
                      <span>Stop Transmission</span>
                    </>
                  ) : (
                    <>
                      <Play size={12} fill="currentColor" />
                      <span>Transmit Message</span>
                    </>
                  )}
                </button>
              </div>

              {}
              <div className="control-bar-widgets">
                {/* Volume slider */}
                <div className="widget-box">
                  <Volume2 size={11} style={{ color: '#f5b971' }} />
                  <input
                    type="range"
                    min="-25"
                    max="10"
                    step="1"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    style={{ width: '60px', height: '4px', background: '#05060d', borderRadius: '4px', appearance: 'none', cursor: 'pointer' }}
                  />
                  <span style={{ width: '32px', textAlign: 'right' }}>{volume} dB</span>
                </div>

                {/* Tempo slider */}
                <div className="widget-box">
                  <Settings size={11} style={{ color: '#f5b971' }} />
                  <input
                    type="range"
                    min="30"
                    max="110"
                    step="5"
                    value={tempoWpm}
                    onChange={(e) => setTempoWpm(Number(e.target.value))}
                    style={{ width: '60px', height: '4px', background: '#05060d', borderRadius: '4px', appearance: 'none', cursor: 'pointer' }}
                  />
                  <span style={{ width: '42px', textAlign: 'right' }}>{tempoWpm} WPM</span>
                </div>

                {/* Recorder Arm */}
                <div className="widget-box">
                  <label htmlFor="recordToggle" style={{ cursor: 'pointer' }}>REC WAV</label>
                  <input
                    type="checkbox"
                    checked={recordActive}
                    onChange={(e) => setRecordActive(e.target.checked)}
                    id="recordToggle"
                    disabled={isPlaying}
                    style={{ cursor: 'pointer' }}
                  />
                  {recordedAudioUrl && (
                    <a
                      href={recordedAudioUrl}
                      download={`rocky_${currentMode}_message.webm`}
                      className="btn-console"
                      style={{ padding: '2px 6px', fontSize: '9px', background: '#ff9d42', color: '#05060d', borderColor: '#ff9d42', display: 'flex', alignItems: 'center', gap: '3px', borderRadius: '3px' }}
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
              <div style={{ border: '1px solid rgba(255, 77, 77, 0.3)', background: 'rgba(255, 77, 77, 0.05)', fontSize: '9px', color: '#ff4d4d', padding: '6px', borderRadius: '4px', fontFamily: 'monospace', marginTop: '6px', lineHeight: '1' }}>
                ⚠ {errorMessage}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
































































