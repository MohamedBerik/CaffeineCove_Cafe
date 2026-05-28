export default function SummaryCard({ messages, t }) {
  if (!Array.isArray(messages) || !messages.length) return null;
  return (
    <div className="summary-card">
      <div className="summary-header">
        <span>🧠 {t("Smart Summary")}</span>
      </div>
      <div className="summary-body">
        {messages.map((msg, i) => (
          <div key={i} className={`summary-item ${msg.type}`}>
            <span className="icon">
              {msg.type === "positive"
                ? "📈"
                : msg.type === "negative"
                  ? "📉"
                  : "⚠️"}
            </span>
            <span>{msg.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
