import { useState } from "react";

export default function Microphone() {
  const [transcript, setTranscript] = useState("");

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
    };

    recognition.start();
  };

  return (
    <div>
      <button onClick={startListening}>
        🎤 Speak
      </button>

      <p>{transcript || "Waiting for speech..."}</p>
    </div>
  );
}

