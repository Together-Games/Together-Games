export function setupSpeak(buttonId, checkAction) {
  const speakBtn = document.getElementById(buttonId);

  speakBtn.addEventListener("click", () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      console.log("You said:", transcript);
      if (transcript.includes("simon")) {
        checkAction("speak-simon");
      } else {
        alert("❌ Wrong word. Try again.");
      }
    };

    recognition.onerror = (e) => {
      console.error("Speech recognition error:", e.error);
    };
  });
}