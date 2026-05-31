let _activeBranchId = localStorage.getItem("selectedBranchId") || "all";

export const getActiveBranchId = () => _activeBranchId;

export const setActiveBranchId = (branchId) => {
  _activeBranchId = branchId;
  localStorage.setItem("selectedBranchId", branchId);
  window.__ACTIVE_BRANCH_ID__ = branchId;
  // ✅ أطلق حدث مخصص
  window.dispatchEvent(
    new CustomEvent("activeBranchChanged", {
      detail: { branchId },
    }),
  );
};
