import { useState } from "react";
import axios from "../../../services/axios";
import { useTranslation } from "react-i18next";

export default function RadiologyUploader({ patientId, onUploadSuccess }) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [toothNumber, setToothNumber] = useState("");
  const [fileType, setFileType] = useState("xray");
  const [capturedAt, setCapturedAt] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const fileTypes = [
    {
      value: "xray",
      label: t("X-Ray Image"),
      icon: "fas fa-x-ray",
      accept: "image/*",
    },
    {
      value: "panorama",
      label: t("Panorama"),
      icon: "fas fa-tooth",
      accept: "image/*",
    },
    { value: "cbct", label: t("CBCT"), icon: "fas fa-cube", accept: "image/*" },
    {
      value: "cephalometric",
      label: t("Cephalometric"),
      icon: "fas fa-ruler-combined",
      accept: "image/*",
    },
    {
      value: "report",
      label: t("PDF Report"),
      icon: "fas fa-file-pdf",
      accept: "application/pdf",
    },
    {
      value: "consent",
      label: t("Consent Form"),
      icon: "fas fa-file-signature",
      accept: "application/pdf,image/*",
    },
    { value: "other", label: t("Other"), icon: "fas fa-file", accept: "*/*" },
  ];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError(t("Please select a file to upload"));
      return;
    }
    if (!title) {
      setError(t("Please enter a title"));
      return;
    }

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("customer_id", String(patientId)); // التأكد من إرسال المعرف كنص واضح
    formData.append("title", title);
    formData.append("file", file); // الملف الفعلي
    formData.append("file_type", fileType);
    formData.append("captured_at", capturedAt);
    if (toothNumber) formData.append("tooth_number", toothNumber);
    if (notes) formData.append("notes", notes);

    try {
      // إرسال الطلب مع ترك Axios يحدد الـ Boundary تلقائياً للملفات
      const response = await axios.post("/erp/patient-radiologies", formData, {
        headers: {
          // نترك المتصفح يضع multipart/form-data مع الـ boundary الفريد للملف
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Upload response:", response.data);

      // Reset form
      setFile(null);
      setTitle("");
      setToothNumber("");
      setFileType("xray");
      setNotes("");
      setError("");

      if (onUploadSuccess) onUploadSuccess();
      document.getElementById("radiology-file-input").value = "";
    } catch (err) {
      // طباعة تفصيلية لمعرفة الحقل المسبب للأزمة في الـ Console
      console.error("Upload error fully detailed:", err.response?.data);

      // إذا أرجع الباكيند مصفوفة أخطاء واضحة (Validation Errors)
      if (err.response?.data?.errors) {
        const validationErrors = Object.values(err.response.data.errors)
          .flat()
          .join(" | ");
        setError(validationErrors);
      } else {
        setError(
          err.response?.data?.message || t("Failed to upload radiology"),
        );
      }
    } finally {
      setUploading(false);
    }
  };

  // ✅ تحديد الـ accept بناءً على نوع الملف المختار
  const currentAccept =
    fileTypes.find((t) => t.value === fileType)?.accept || "*/*";

  return (
    <div className="radiology-uploader">
      <form onSubmit={handleSubmit}>
        <div
          className="upload-area"
          onClick={() =>
            document.getElementById("radiology-file-input").click()
          }
        >
          <input
            id="radiology-file-input"
            type="file"
            accept={currentAccept}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          {file ? (
            <div className="file-preview">
              <i className="fas fa-file-image"></i>
              <span>{file.name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          ) : (
            <div className="upload-placeholder">
              <i className="fas fa-cloud-upload-alt"></i>
              <p>{t("Click or drag file to upload")}</p>
              <small className="text-muted">
                {t("Supported: JPG, PNG, PDF")}
              </small>
            </div>
          )}
        </div>

        <div className="upload-form">
          <div className="form-group">
            <label>{t("Title")} *</label>
            <input
              type="text"
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("e.g., Pre-op X-Ray")}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t("File Type")}</label>
              <select
                className="form-select"
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
              >
                {fileTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>{t("Tooth Number")}</label>
              <input
                type="text"
                className="form-control"
                value={toothNumber}
                onChange={(e) => setToothNumber(e.target.value)}
                placeholder={t("e.g., 16, 24, 36")}
              />
            </div>

            <div className="form-group">
              <label>{t("Captured At")}</label>
              <input
                type="date"
                className="form-control"
                value={capturedAt}
                onChange={(e) => setCapturedAt(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>{t("Notes")}</label>
            <textarea
              className="form-control"
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("Additional notes about this image...")}
            />
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={uploading}
          >
            {uploading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                {t("Uploading...")}
              </>
            ) : (
              <>
                <i className="fas fa-upload me-2"></i>
                {t("Upload Radiology")}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
