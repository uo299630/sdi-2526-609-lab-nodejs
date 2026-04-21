import { useState } from "react";
import { apiFetch } from "../services/ApiService.js";
import SongToast from "./SongToast";
import "../assets/SongForm.css";

const SongForm = ({ onSongAdded }) => {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("");
  const [price, setPrice] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("error");

  const validateTitle = (value) => {
    if (!value || value.trim().length < 3) {
      return "El título debe tener al menos 3 caracteres";
    }
    if (value.trim().length > 40) {
      return "El título no puede superar los 40 caracteres";
    }
    return "";
  };

  const validateKind = (value) => {
    if (!value || value.trim().length < 3) {
      return "El género debe tener al menos 3 caracteres";
    }
    if (value.trim().length > 30) {
      return "El género no puede superar los 30 caracteres";
    }
    return "";
  };

  const validatePrice = (value) => {
    const numPrice = parseFloat(value);
    if (!value || isNaN(numPrice) || numPrice <= 0) {
      return "El precio debe ser un número positivo";
    }
    return "";
  };

  //const titleError = validateTitle(title);
  //const kindError = validateKind(kind);
  //const priceError = validatePrice(price);

  const isFormValid =
    !validateTitle(title) &&
    !validateKind(kind) &&
    !validatePrice(price) &&
    title.trim() !== "" &&
    kind.trim() !== "" &&
    price.trim() !== "";

  const handleSubmit = (e) => {
    e.preventDefault();
    setToastMessage("");

   /* if (!isFormValid) {
      setToastMessage("Completa correctamente todos los campos antes de enviar");
      setToastType("error");
      return;
    }*/

    apiFetch("http://localhost:8081/api/v1.0/songs", {
      method: "POST",
      body: JSON.stringify({
        title: title.trim(),
        kind: kind.trim(),
        price: parseFloat(price),
      }),
    })
      .then(() => {
        setTitle("");
        setKind("");
        setPrice("");
        setToastMessage("Canción añadida correctamente");
        setToastType("success");
        if (onSongAdded) {
          setTimeout(() => {
            onSongAdded();
          }, 1500);
        }
      })
      .catch((err) => {
        setToastMessage(err.message);
        setToastType("error");
      });
  };

  return (
    <div className="song-form-container">
      <h2>Añadir canción</h2>
      <SongToast
        message={toastMessage}
        type={toastType}
        onClose={() => setToastMessage("")}
      />
      <form onSubmit={handleSubmit} className="song-form">
        <div className="form-field">
          <input
            type="text"
            placeholder="Título (3-40 caracteres)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={title ? "input-error" : ""}
          />
        </div>

        <div className="form-field">
          <input
            type="text"
            placeholder="Género (3-30 caracteres)"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className={kind ? "input-error" : ""}
          />
        </div>

        <div className="form-field">
          <input
            type="number"
            placeholder="Precio (número positivo)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={price ? "input-error" : ""}
          />
        </div>

        <button type="submit" /*disabled={!isFormValid}*/>
          Añadir
        </button>
      </form>
    </div>
  );
};

export default SongForm;
