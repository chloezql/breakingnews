import './StartPage.scss';

// Start page with Play button
export function StartPage() {
  const moveToNextStage = () => {
      console.log("move")
  }
  
  return (
    <div className="start-page">
      <div className="logo-container">
        <img 
          src="./breaking-news-logo.png" 
          alt="Breaking News" 
        />
      </div>
      <button 
        className="play-button"
        onClick={moveToNextStage}
      >
        <div className="play-text">PLAY</div>
      </button>
    </div>
  );
} 