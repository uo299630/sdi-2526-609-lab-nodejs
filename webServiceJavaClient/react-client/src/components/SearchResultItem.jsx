import React from "react";
import "../assets/SearchResultItem.css";

const SearchResultItem = ({ song }) => {
  return (
    <div className="search-result-item">
      <div className="song-info">
        <h3>{song.title}</h3>
        <p><strong>Artista:</strong> {song.artist}</p>
        <p><strong>Álbum:</strong> {song.album}</p>
      </div>
      {song.previewUrl && (
        <div className="song-preview">
          <audio controls src={song.previewUrl}>
            Tu navegador no soporta el elemento de audio.
          </audio>
        </div>
      )}
    </div>
  );
};

export default SearchResultItem;
