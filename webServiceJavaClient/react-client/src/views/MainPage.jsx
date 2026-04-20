import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CardComponent from "../components/CardComponent";
import AddSongForm from "./AddSongForm";
import SongDetails from "./SongDetails";
import "../assets/MainPage.css";

const MainPage = () => {
  const [view, setView] = useState("songs");
  const [selectedSongId, setSelectedSongId] = useState(null);

  return (
    <div className="page">
      <Header onChangeView={setView} />
      <main className="content">
        {view === "songs" && (
          <CardComponent
            onSelectSong={(id) => {
              setSelectedSongId(id);
              setView("details");
            }}
          />
        )}
        {view === "details" && (
          <SongDetails
            songId={selectedSongId}
            onBack={() => setView("songs")}
            onDeleted={() => setView("songs")}
          />
        )}
        {view === "add" && (
          <AddSongForm onSongAdded={() => setView("songs")} />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MainPage;
