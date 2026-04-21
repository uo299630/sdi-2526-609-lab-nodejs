import { apiFetch } from "./ApiService";

export const searchSongs = async (term) => {
  if (!term || term.trim() === "") {
    throw new Error("El término de búsqueda no puede estar vacío");
  }
  
  const url = `http://localhost:8081/api/v1.0/search?term=${encodeURIComponent(term)}`;
  const data = await apiFetch(url, {
    method: "GET"
  });
  
  return data.songs || [];
};
