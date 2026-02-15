import React, {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  forwardRef
} from "react";

const WeatherAgent = forwardRef(function WeatherAgent({ weatherData, selectedCity }, ref) {
  const initialMessages = useMemo(
    () => [
      {
        role: "assistant",
        text: "Ask me about rain risk, outfit, best time to go out, or explain the forecast."
      }
    ],
    []
  );

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(initialMessages);
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const clearChat = () => setMessages(initialMessages);

  const sendMessage = async (msgRaw) => {
    const msg = (msgRaw ?? "").trim();
    if (!msg || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          weatherData,
          city: selectedCity
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Request failed");

      setMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Sorry—something went wrong talking to the agent." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Expose methods to parent (WeatherApp -> WeatherActions)
  useImperativeHandle(ref, () => ({
    sendPrompt: (promptText) => {
      sendMessage(promptText);
    },
    clear: () => clearChat()
  }));

  const onSend = async () => {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput("");
    await sendMessage(msg);
  };

  return (
    <>
      <div className="rail-header">
        <div>
          <div className="rail-title">AI Weather Agent</div>
          <div className="rail-subtitle">Ask questions based on the forecast</div>
        </div>

        <button type="button" className="ai-clear-btn" onClick={clearChat}>
          Clear
        </button>
      </div>

      <div className="ai-messages">
        {messages.map((m, i) => (
          <div key={i} className="ai-msg">
            <b>{m.role === "user" ? "You" : "Agent"}:</b> {m.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="ai-input-row">
        <input
          className="ai-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g., Do I need an umbrella in the next 3 hours?"
          onKeyDown={(e) => {
            if (e.key === "Enter") onSend();
          }}
        />
        <button className="ai-ask-btn" onClick={onSend} disabled={loading}>
          {loading ? "..." : "Ask"}
        </button>
      </div>
    </>
  );
});

export default WeatherAgent;
