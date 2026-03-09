import { useState } from "react";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

export default function App() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const askGroq = async () => {
    if (!input) return;
    setLoading(true);
    setResponse("");
    try {
      const result = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: input }],
      });
      setResponse(result.choices[0].message.content);
    } catch (error) {
      setResponse("Error: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div>
      <h1>Groq AI Chat</h1>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask something..."
      />
      <button onClick={askGroq} disabled={loading}>
        {loading ? "Loading..." : "Ask Groq"}
      </button>
      {response && <p>{response}</p>}
    </div>
  );
}
