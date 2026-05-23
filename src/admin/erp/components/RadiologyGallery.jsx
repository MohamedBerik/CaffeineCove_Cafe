import { useState, useEffect } from "react";
import axios from "../../../services/axios";
import { useTranslation } from "react-i18next";

export default function RadiologyGallery({ patientId, refreshTrigger }) {
  const { t, i18n } = useTranslation();
  const [radiologies, setRadiologies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadRadiologies();
  }, [patientId, refreshTrigger]);

  const loadRadiologies = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `/erp/patient-radiologies?customer_id=${patientId}`,
      );
      console.log("Loaded radiologies:", res.data);
      setRadiologies(res.data.data || []);
    } catch (err) {
      console.error("Failed to load radiologies:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t("Are you sure you want to delete this image?")))
      return;

    setDeletingId(id);
    try {
      await axios.delete(`/erp/patient-radiologies/${id}`);
      setRadiologies(radiologies.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Failed to delete radiology:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const lang = i18n.language === "ar" ? "ar-EG" : "en-US";
      return new Date(dateString).toLocaleDateString(lang, {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const getFileTypeIcon = (type, fileUrl) => {
    if (fileUrl?.endsWith(".pdf")) {
      return "fas fa-file-pdf";
    }
    switch (type?.toLowerCase()) {
      case "panorama":
        return "fas fa-tooth";
      case "cbct":
        return "fas fa-cube";
      case "cephalometric":
        return "fas fa-ruler-combined";
      case "report":
        return "fas fa-file-pdf";
      case "consent":
        return "fas fa-file-signature";
      default:
        return "fas fa-x-ray";
    }
  };

  const isPdf = (fileUrl) => {
    return fileUrl && fileUrl.endsWith(".pdf");
  };

  if (loading) {
    return (
      <div className="radiology-loading">
        <div className="spinner-border text-primary" />
        <span>{t("Loading images...")}</span>
      </div>
    );
  }

  if (radiologies.length === 0) {
    return (
      <div className="radiology-empty">
        <i className="fas fa-x-ray"></i>
        <p>{t("No radiology images found")}</p>
        <p className="text-muted small">
          {t("Upload X-rays, Panorama, or CBCT images for this patient")}
        </p>
      </div>
    );
  }

  return (
    <div className="radiology-gallery">
      <div className="gallery-grid">
        {radiologies.map((rad) => (
          <div key={rad.id} className="gallery-item">
            <div
              className="gallery-image"
              onClick={() => setSelectedImage(rad)}
            >
              {rad.file_url.endsWith(".pdf") ? (
                <a
                  href={rad.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="pdf-link-card"
                >
                  <i className="fas fa-file-pdf"></i> {/* أيقونة PDF */}
                  <span>{rad.title} (اضغط لفتح الملف)</span>
                </a>
              ) : (
                <img src={rad.file_url} alt={rad.title} />
              )}
              <div className="gallery-overlay">
                <i className="fas fa-search-plus"></i>
              </div>
            </div>
            <div className="gallery-info">
              <div className="gallery-title">
                <i className={getFileTypeIcon(rad.file_type, rad.file_url)}></i>
                <span>{rad.title}</span>
              </div>
              <div className="gallery-meta">
                {rad.tooth_number && (
                  <span className="tooth-badge">
                    <i className="fas fa-tooth"></i> {rad.tooth_number}
                  </span>
                )}
                <span className="date-badge">
                  <i className="fas fa-calendar-alt"></i>{" "}
                  {formatDate(rad.captured_at)}
                </span>
              </div>
              {rad.notes && <div className="gallery-notes">{rad.notes}</div>}
              <button
                className="btn-delete"
                onClick={() => handleDelete(rad.id)}
                disabled={deletingId === rad.id}
              >
                {deletingId === rad.id ? (
                  <span className="spinner-border spinner-border-sm"></span>
                ) : (
                  <i className="fas fa-trash"></i>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && !isPdf(selectedImage.file_url) && (
        <div className="lightbox-modal" onClick={() => setSelectedImage(null)}>
          <div
            className="lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="lightbox-close"
              onClick={() => setSelectedImage(null)}
            >
              <i className="fas fa-times"></i>
            </button>
            <img src={selectedImage.file_url} alt={selectedImage.title} />
            <div className="lightbox-info">
              <h4>{selectedImage.title}</h4>
              <p>{selectedImage.notes}</p>
              <div className="lightbox-meta">
                <span>
                  <i className="fas fa-calendar"></i>{" "}
                  {formatDate(selectedImage.captured_at)}
                </span>
                {selectedImage.tooth_number && (
                  <span>
                    <i className="fas fa-tooth"></i> {t("Tooth")}{" "}
                    {selectedImage.tooth_number}
                  </span>
                )}
                <span>
                  <i className="fas fa-tag"></i>{" "}
                  {t(selectedImage.file_type || "X-Ray")}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
