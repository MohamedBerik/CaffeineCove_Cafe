// src/utils/activeBranch.js
let _activeBranchId = localStorage.getItem("selectedBranchId") || "all";

export const getActiveBranchId = () => _activeBranchId;

export const setActiveBranchId = (branchId) => {
  _activeBranchId = branchId;
  localStorage.setItem("selectedBranchId", branchId);
  // تحديث قيمة عالمية يمكن الوصول إليها
  window.__ACTIVE_BRANCH_ID__ = branchId;
  // إرسال حدث مخصص لإعلام باقي الأجزاء
  window.dispatchEvent(
    new CustomEvent("activeBranchChanged", { detail: { branchId } }),
  );
};

// تهيئة القيمة عند تحميل الصفحة
window.__ACTIVE_BRANCH_ID__ = _activeBranchId;
