import { useEffect } from "react";
import echoService from "../services/echo";

export default function useDashboardSocket(companyId, branchId, onUpdate) {
  useEffect(() => {
    if (!companyId || !branchId) return;

    const echo = echoService.getInstance();

    if (!echo) return;

    const channelName = `company.${companyId}.branch.${branchId}.dashboard`;

    const channel = echo.private(channelName);

    channel.listen(".dashboard.updated", (event) => {
      onUpdate?.(event);
    });

    return () => {
      channel.stopListening(".dashboard.updated");
      echo.leave(`private-${channelName}`);
    };
  }, [companyId, branchId, onUpdate]);
}
