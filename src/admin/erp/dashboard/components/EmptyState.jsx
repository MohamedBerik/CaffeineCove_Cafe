export default function EmptyState({ text }) {
  return (
    <div className="empty-state">
      <i className="fas fa-inbox empty-icon"></i>
      <p className="empty-text">{text}</p>
    </div>
  );
}
