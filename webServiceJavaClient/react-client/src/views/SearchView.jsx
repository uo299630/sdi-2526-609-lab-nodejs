import React, { useState } from "react";
import SearchBar from "../components/SearchBar";
import SearchResultList from "../components/SearchResultList";
import SongToast from "./SongToast";
import { searchSongs } from "../services/SearchService";
import "../assets/SearchView.css";

const SearchView = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("error");

  const handleSearch = async (term) => {
    setLoading(true);
    setToastMessage("");
    setResults([]);
    
    try {
      const songs = await searchSongs(term);
      setResults(songs);
      if (songs.length === 0) {
        setToastMessage("No se encontraron canciones en iTunes.");
        setToastType("warning");
      }
    } catch (error) {
      setToastMessage(error.message);
      setToastType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-view">
      <h2>Buscador de Canciones (iTunes)</h2>
      <SongToast 
        message={toastMessage} 
        type={toastType} 
        onClose={() => setToastMessage("")} 
      />
      <SearchBar onSearch={handleSearch} />
      <SearchResultList results={results} loading={loading} />
    </div>
  );
};

export default SearchView;
