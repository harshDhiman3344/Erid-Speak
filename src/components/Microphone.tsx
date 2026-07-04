import { useState, useEffect, useRef } from "react";

export default function Microphone() {
  const [transcript, setTranscript] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Access the browser's speech API
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage("Speech recognition not supported in this browser. Please use Chrome or Edge.");
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
      setErrorMessage(`Error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

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

  return (
    <div style={{ textAlign: "center", margin: "2rem" }}>
      <button
        onClick={toggleListening}
        style={{
          background: isListening ? "#ff4d4d" : "#f5b971",
          color: "#05060d",
          border: "none",
          padding: "1rem 2rem",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "1.2rem",
          fontWeight: "bold",
          boxShadow: "0 0 10px rgba(0,0,0,0.5)"
        }}
      >
        {isListening ? "🛑 STOP LISTENING" : "🎙️ START SPEAKING"}
      </button>

      {isListening && <p style={{ color: "#f5b971" }}>Awaiting Human Input...</p>}
      {errorMessage && <p style={{ color: "#ff4d4d" }}>{errorMessage}</p>}

      {transcript && (
        <div style={{ marginTop: "2rem", padding: "1rem", border: "1px dashed #f5b971" }}>
          <p style={{ fontSize: "0.8rem", color: "#8aa" }}>HUMAN TRANSCRIPT:</p>
          <p style={{ fontSize: "1.3rem", fontStyle: "italic" }}>"{transcript}"</p>
        </div>
      )}
    </div>
  );
}