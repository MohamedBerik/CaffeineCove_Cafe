import { memo } from "react";

const EmptyState = ({ text }) => (
  <div className="empty-state">
    <i className="fas fa-inbox empty-icon"></i>
    <p className="empty-text">{text}</p>
  </div>
);

export default memo(EmptyState);
