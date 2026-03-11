import { useState, useRef, useEffect } from "react";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

const PERSONAS = [
  { id: "assistant", label: "Assistant", icon: "🤖", prompt: "You are a helpful, friendly assistant." },
  { id: "teacher", label: "Teacher", icon: "📚", prompt: "You are an expert teacher. Explain things clearly with examples." },
  { id: "coder", label: "Coder", icon: "💻", prompt: "You are an expert programmer. Help with code, bugs, and technical problems." },
  { id: "writer", label: "Writer", icon: "✍️", prompt: "You are a creative writing expert. Help with writing, editing, and storytelling." },
];

const SUGGESTIONS = [
  "Explain quantum computing simply",
  "Write a Python web scraper",
  "Help me improve this paragraph",
  "What are today's best AI tools?",
];

function TypingDots() {
  return (
    <div className="flex gap-1 items-center py-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-violet-400"
          style={{ animation: `bounce 1.2s infinite`, animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}

function Message({ msg, isNew }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex mb-4 ${isUser ? "justify-end" : "justify-start"} ${isNew ? "animate-fade-in" : ""}`}>
      {!isUser && (
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-violet-400 flex items-center justify-center text-base mr-3 flex-shrink-0 shadow-lg shadow-violet-900/40">
          🤖
        </div>
      )}
      <div className={`max-w-[75%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words
        ${isUser
          ? "bg-gradient-to-br from-violet-600 to-indigo-700 text-white rounded-[18px_18px_4px_18px] shadow-lg shadow-violet-900/30"
          : "bg-white/5 border border-white/10 text-slate-200 rounded-[18px_18px_18px_4px]"
        }`}>
        {msg.content}
        <div className={`text-[11px] mt-1.5 ${isUser ? "text-violet-300/60 text-right" : "text-slate-500"}`}>
          {msg.time}
        </div>
      </div>
      {isUser && (
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-base ml-3 flex-shrink-0">
          👤
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [persona, setPersona] = useState(PERSONAS[0]);
  const [newMsgIndex, setNewMsgIndex] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const getTime = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { role: "user", content: input.trim(), time: getTime() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setNewMsgIndex(updatedMessages.length - 1);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setLoading(true);

    try {
      const result = await groq.chat.completions.create({
        model: "meta-llama/llama-4-maverick-17b-128e-instruct",
        messages: [
          {
            role: "system",
            content: `${persona.prompt} Today's date is ${new Date().toDateString()}. Be concise and helpful.`,
          },
          ...updatedMessages.map(({ role, content }) => ({ role, content })),
        ],
        max_tokens: 1024,
      });

      const aiMsg = {
        role: "assistant",
        content: result.choices[0].message.content,
        time: getTime(),
      };
      const final = [...updatedMessages, aiMsg];
      setMessages(final);
      setNewMsgIndex(final.length - 1);
    } catch (error) {
      const errMsg = {
        role: "assistant",
        content: error.message.includes("429")
          ? "⚠️ Rate limit hit. Please wait a moment and try again."
          : `❌ Error: ${error.message}`,
        time: getTime(),
      };
      setMessages((prev) => [...prev, errMsg]);
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setNewMsgIndex(null);
    inputRef.current?.focus();
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const userMsgCount = messages.filter((m) => m.role === "user").length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .animate-fade-in { animation: fadeIn 0.3s ease; }
        body { font-family: 'DM Sans', sans-serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.4); border-radius: 2px; }
        textarea { resize: none; }
        textarea:focus { outline: none; box-shadow: none; }
      `}</style>

      <div
        className="min-h-screen flex items-center justify-center p-5"
        style={{
          background:
            "radial-gradient(ellipse at 20% 20%, rgba(124,58,237,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(79,70,229,0.1) 0%, transparent 50%), #0a0a0f",
        }}
      >
        <div
          className="w-full max-w-3xl flex flex-col bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/[0.08] overflow-hidden shadow-2xl"
          style={{ height: "90vh" }}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-xl shadow-lg shadow-violet-900/50">
                ✦
              </div>
              <div>
                <div
                  className="font-bold text-lg text-slate-100 tracking-tight"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  Groq AI Chat
                </div>
                <div className="text-xs text-violet-400 flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"
                    style={{ animation: "pulse 2s infinite" }}
                  />
                  Llama 4 Maverick · Free Tier
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {PERSONAS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPersona(p)}
                  className={`px-3 py-1.5 rounded-full text-xs flex items-center gap-1 transition-all duration-200 border cursor-pointer
                    ${persona.id === p.id
                      ? "bg-violet-600/40 border-violet-500/60 text-violet-300"
                      : "bg-white/5 border-white/10 text-slate-400 hover:bg-violet-600/20 hover:text-violet-300"
                    }`}
                >
                  {p.icon} {p.label}
                </button>
              ))}
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="px-3 py-1.5 rounded-full text-xs border bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all duration-200 cursor-pointer"
                >
                  🗑 Clear
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col">
            {messages.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center animate-fade-in text-center">
                <div className="text-5xl mb-4">✦</div>
                <h2
                  className="text-2xl font-bold text-slate-100 mb-2"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  How can I help you?
                </h2>
                <p className="text-sm text-slate-500 mb-8">
                  Select a persona above and start chatting
                </p>
                <div className="flex flex-wrap gap-2.5 justify-center max-w-lg">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setInput(s);
                        inputRef.current?.focus();
                      }}
                      className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-400 text-sm hover:bg-violet-600/15 hover:border-violet-500/30 hover:text-violet-300 transition-all duration-200 text-left cursor-pointer"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <Message key={i} msg={msg} isNew={i === newMsgIndex} />
            ))}

            {loading && (
              <div className="flex items-center gap-3 mb-4 animate-fade-in">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-violet-400 flex items-center justify-center text-base shadow-lg shadow-violet-900/40">
                  🤖
                </div>
                <div className="px-4 py-3 rounded-[18px_18px_18px_4px] bg-white/[0.06] border border-white/10">
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-6 pt-4 pb-5 border-t border-white/[0.06] bg-white/[0.02]">
            <div className="flex gap-3 items-end bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3 focus-within:border-violet-500/40 transition-colors duration-200">
              <textarea
                ref={(el) => {
                  inputRef.current = el;
                  textareaRef.current = el;
                }}
                value={input}
                onChange={handleInput}
                onKeyDown={handleKey}
                placeholder={`Message ${persona.label}... (Enter to send, Shift+Enter for newline)`}
                rows={1}
                className="flex-1 bg-transparent text-slate-100 text-sm placeholder-slate-500 leading-relaxed overflow-y-auto"
                style={{ maxHeight: "120px", fontFamily: "'DM Sans', sans-serif" }}
              />
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <span className={`text-[11px] ${input.length > 800 ? "text-red-400" : "text-slate-600"}`}>
                  {input.length}/1000
                </span>
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-base transition-all duration-200
                    ${loading || !input.trim()
                      ? "bg-violet-600/20 opacity-40 cursor-not-allowed"
                      : "bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-900/40 hover:scale-105 cursor-pointer"
                    }`}
                >
                  {loading ? "⏳" : "➤"}
                </button>
              </div>
            </div>
            <p className="text-center text-[11px] text-slate-600 mt-2.5">
              Powered by Groq · Llama 4 Maverick · {userMsgCount} message{userMsgCount !== 1 ? "s" : ""} today
            </p>
          </div>
        </div>
      </div>
    </>
  );
}