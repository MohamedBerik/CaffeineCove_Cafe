// import { useEffect } from "react";
// import echoService from "../services/echo";

// export default function useActivityLogsSocket(companyId, branchId, onNewLog) {
//   useEffect(() => {
//     if (!companyId) return;

//     const echo = echoService.getInstance();

//     if (!echo) return;

//     const channelName =
//       branchId === "all"
//         ? `company.${companyId}.activity-logs`
//         : `company.${companyId}.branch.${branchId}.activity-logs`;

//     console.log("📡 Activity Logs Socket:", channelName);

//     const channel = echo.private(channelName);

//     channel.subscribed(() => {
//       console.log("✅ Activity Logs Subscribed");
//     });

//     channel.error((err) => {
//       console.error("❌ Activity Logs Error", err);
//     });

//     channel.listen(".activity-log.created", (event) => {
//       console.log("📜 Activity Log Received", event);

//       onNewLog?.(event);
//     });

//     return () => {
//       channel.stopListening(".activity-log.created");

//       echo.leave(`private-${channelName}`);
//     };
//   }, [companyId, onNewLog]);
// }
