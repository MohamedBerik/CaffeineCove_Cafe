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
    { value: "xray", label: t("X-Ray") },
    { value: "panorama", label: t("Panorama") },
    { value: "cbct", label: t("CBCT") },
    { value: "cephalometric", label: t("Cephalometric") },
    { value: "other", label: t("Other") },
  ];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      setFile(selectedFile);
      setError("");
    } else {
      setError(t("Please select a valid image file"));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError(t("Please select an image file"));
      return;
    }
    if (!title) {
      setError(t("Please enter a title"));
      return;
    }

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("customer_id", patientId);
    formData.append("title", title);
    formData.append("file", file);
    formData.append("file_type", fileType);
    formData.append("captured_at", capturedAt);
    if (toothNumber) formData.append("tooth_number", toothNumber);
    if (notes) formData.append("notes", notes);

    try {
      await axios.post("/erp/patient-radiologies", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Reset form
      setFile(null);
      setTitle("");
      setToothNumber("");
      setFileType("xray");
      setNotes("");
      setError("");

      // Trigger refresh
      if (onUploadSuccess) onUploadSuccess();

      // Reset file input
      document.getElementById("radiology-file-input").value = "";
    } catch (err) {
      setError(err.response?.data?.message || t("Failed to upload radiology"));
    } finally {
      setUploading(false);
    }
  };

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
            accept="image/*"
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
              <p>{t("Click or drag image to upload")}</p>
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
              <label>{t("Image Type")}</label>
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
