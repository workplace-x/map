import React, { useState } from "react";

function useRfpGptAsk() {
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [sources, setSources] = useState([]);
  const [error, setError] = useState(null);

  const ask = async (question) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/rfp-gpt/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setAnswer(data.answer);
      setSources(data.sources || []);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return { ask, answer, sources, loading, error };
}

export function TangramGptPage() {
  const [question, setQuestion] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [comment, setComment] = useState("");
  const { ask, answer, sources, loading, error } = useRfpGptAsk();

  const submitFeedback = async (rating) => {
    await fetch("/api/rfp-gpt/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, answer, rating, comment }),
    });
    setFeedback(rating);
  };

  return (
    <div>
      <input
        value={question}
        onChange={e => setQuestion(e.target.value)}
        placeholder="Ask a question about RFPs..."
      />
      <button onClick={() => ask(question)} disabled={loading}>
        Ask
      </button>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}
      {answer && (
        <div>
          <h3>Answer</h3>
          <div>{answer}</div>
          <h4>Sources</h4>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Chunk Preview</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((src, i) => (
                <tr key={i}>
                  <td>{src.id}</td>
                  <td>{src.title}</td>
                  <td>{src.chunk}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div>
            <button onClick={() => submitFeedback("up")} disabled={feedback === "up"}>👍</button>
            <button onClick={() => submitFeedback("down")} disabled={feedback === "down"}>👎</button>
            <input
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Add a comment (optional)"
            />
          </div>
        </div>
      )}
    </div>
  );
} 