// hooks/useActiveBranch.js

import { useEffect, useState } from "react";
import { getActiveBranchId } from "../utils/activeBranch";

export default function useActiveBranch() {
  const [branchId, setBranchId] = useState(getActiveBranchId());

  useEffect(() => {
    const handler = (e) => {
      setBranchId(e.detail.branchId);
    };

    window.addEventListener("activeBranchChanged", handler);

    return () => {
      window.removeEventListener("activeBranchChanged", handler);
    };
  }, []);

  return branchId;
}
