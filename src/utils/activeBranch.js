let _activeBranchId = localStorage.getItem("selectedBranchId") || "all";

export const getActiveBranchId = () => _activeBranchId;

export const setActiveBranchId = (branchId) => {
  _activeBranchId = branchId;

  localStorage.setItem("selectedBranchId", branchId);

  window.__ACTIVE_BRANCH_ID__ = branchId;

  window.dispatchEvent(
    new CustomEvent("activeBranchChanged", {
      detail: { branchId },
    }),
  );

  window.dispatchEvent(
    new CustomEvent("branchChanged", {
      detail: { branchId },
    }),
  );
};
