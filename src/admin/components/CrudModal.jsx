import CrudForm from "./CrudForm";

const CrudModal = ({
  isOpen,
  title,
  fields,
  formData,
  onChange,
  onSubmit,
  onClose,
  loading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3>{title}</h3>

        <CrudForm
          fields={fields}
          formData={formData}
          onChange={onChange}
          onSubmit={onSubmit}
          loading={loading}
        />

        <button className="close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default CrudModal;
