import { useEffect, useState } from "react";

export default function useActiveBranch() {
  // 🚀 يفضل البدء بأحدث قيمة مباشرة مخزنة محلياً لضمان عدم حدوث تجميد بيانات قديمة
  const [branchId, setBranchId] = useState(
    () => localStorage.getItem("selectedBranchId") || "all",
  );

  useEffect(() => {
    // 🎯 الاستماع للاسم الصحيح للحدث الذي يطلقه الـ Navbar وهو branchChanged
    const handler = (e) => {
      if (e.detail && e.detail.branchId) {
        setBranchId(e.detail.branchId);
      }
    };

    window.addEventListener("branchChanged", handler);

    return () => {
      window.removeEventListener("branchChanged", handler);
    };
  }, []);

  return branchId;
}
