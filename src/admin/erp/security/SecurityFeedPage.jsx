import { useState } from "react";
import useSecurityFeedSocket from "../../../hooks/useSecurityFeedSocket";

export default function SecurityFeedPage() {
  const [events, setEvents] = useState([]);

  useSecurityFeedSocket((event) => {
    setEvents((prev) => [
      {
        ...event,
        received_at: new Date(),
      },
      ...prev,
    ]);
  });

  return (
    <div className="container py-4">
      <h2 className="mb-4">🚨 Security Feed</h2>

      {events.length === 0 ? (
        <div className="alert alert-secondary">No security events yet.</div>
      ) : (
        events.map((event, index) => (
          <div key={index} className="card mb-3 border-danger">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h5 className="text-danger">{event.title}</h5>

                  <div>
                    <strong>Type:</strong> {event.type}
                  </div>

                  {event.email && (
                    <div>
                      <strong>Email:</strong> {event.email}
                    </div>
                  )}

                  {event.ip && (
                    <div>
                      <strong>IP:</strong> {event.ip}
                    </div>
                  )}

                  {event.user_name && (
                    <div>
                      <strong>User:</strong> {event.user_name}
                    </div>
                  )}
                </div>

                <small className="text-muted">
                  {event.received_at.toLocaleString()}
                </small>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
