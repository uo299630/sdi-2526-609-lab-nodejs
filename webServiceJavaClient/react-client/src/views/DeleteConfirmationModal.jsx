import React from "react";
import "../assets/DeleteConfirmationModal.css";

const DeleteConfirmationModal = ({ isOpen, songName, onConfirm, onCancel }) => {
  if (!isOpen || !songName) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Confirmar eliminación</h3>
        <p>
          ¿Estás seguro de que deseas eliminar la canción: <strong>{songName}</strong>?
        </p>
        <div className="modal-actions">
          <button 
            className="btn-confirm" 
            onClick={onConfirm}
            disabled={!songName}
          >
            Confirmar
          </button>
          <button className="btn-cancel" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
