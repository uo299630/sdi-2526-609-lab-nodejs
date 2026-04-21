import React from "react";
import SearchResultItem from "./SearchResultItem";
import "../assets/SearchResultList.css";

const SearchResultList = ({ results, loading }) => {
  if (loading) return <p className="search-status">Buscando canciones...</p>;
  if (!results || results.length === 0) return null;

  return (
    <div className="search-result-list">
      {results.map((song, index) => (
        <SearchResultItem key={index} song={song} />
      ))}
    </div>
  );
};

export default SearchResultList;
