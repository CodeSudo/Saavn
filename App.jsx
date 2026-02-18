import React, { useState } from 'react';
import './App.css';

// SVG Icons
const Icons = {
  Home: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>,
  Search: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Library: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  Play: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  Pause: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
  SkipBack: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>,
  SkipFwd: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
};

// Mock Data
const MOCK_DATA = [
  { id: 1, title: "Midnight City", artist: "M83", img: "https://i.scdn.co/image/ab67616d0000b273b603a15233fb57c28c669250" },
  { id: 2, title: "Starboy", artist: "The Weeknd", img: "https://i.scdn.co/image/ab67616d0000b2734718e28d2452789697edd746" },
  { id: 3, title: "After Hours", artist: "The Weeknd", img: "https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36" },
  { id: 4, title: "Future Nostalgia", artist: "Dua Lipa", img: "https://i.scdn.co/image/ab67616d0000b273bd26ede1ae69327010d49d46" },
  { id: 5, title: "Astroworld", artist: "Travis Scott", img: "https://i.scdn.co/image/ab67616d0000b273072e9faef2ef7b6db63834a3" },
];

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [playing, setPlaying] = useState(false);

  return (
    <div className="app-layout">
      
      {/* DESKTOP SIDEBAR */}
      <div className="sidebar">
        <div className="brand">
          <div style={{width:30, height:30, background:'var(--primary)', borderRadius:8}}></div>
          Spotube
        </div>
        <div className="nav-links">
          <div className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
            <Icons.Home /> Home
          </div>
          <div className={`nav-item ${activeTab === 'search' ? 'active' : ''}`} onClick={() => setActiveTab('search')}>
            <Icons.Search /> Search
          </div>
          <div className={`nav-item ${activeTab === 'library' ? 'active' : ''}`} onClick={() => setActiveTab('library')}>
            <Icons.Library /> Library
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="main-content">
        
        {/* Header */}
        <div className="header">
          <div className="search-box">
            <Icons.Search />
            <input placeholder="What do you want to listen to?" />
          </div>
          <div style={{width:40, height:40, borderRadius:'50%', background:'#333', display:'flex', alignItems:'center', justifyContent:'center'}}>
            U
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="scroll-area">
          
          {/* Hero Banner */}
          {activeTab === 'home' && (
            <div className="hero">
              <div className="hero-text">
                <h1>Listen Your Way</h1>
                <p>Stream millions of songs, ad-free. The open-source client that respects your privacy.</p>
                <button className="btn-primary">Explore Now</button>
              </div>
            </div>
          )}

          {/* Section: Trending */}
          <div className="section-header">
            <div className="section-title">Trending Now</div>
          </div>
          <div className="horizontal-scroll">
            {MOCK_DATA.map((item) => (
              <div key={item.id} className="card">
                <img src={item.img} alt="" />
                <h3>{item.title}</h3>
                <p>{item.artist}</p>
              </div>
            ))}
          </div>

          {/* Section: Recently Played */}
          <div className="section-header" style={{marginTop: 40}}>
            <div className="section-title">Recently Played</div>
          </div>
          <div className="horizontal-scroll">
            {[...MOCK_DATA].reverse().map((item) => (
              <div key={item.id} className="card">
                <img src={item.img} alt="" />
                <h3>{item.title}</h3>
                <p>{item.artist}</p>
              </div>
            ))}
          </div>

        </div>

        {/* PLAYER BAR */}
        <div className="player-bar">
          <div className="p-track">
            <img src={MOCK_DATA[1].img} alt="" />
            <div>
              <h4 style={{fontSize: '0.9rem', color: 'white'}}>{MOCK_DATA[1].title}</h4>
              <p style={{fontSize: '0.8rem', color: '#aaa'}}>{MOCK_DATA[1].artist}</p>
            </div>
          </div>

          <div className="p-controls">
            <div className="p-buttons">
              <button className="btn-control"><Icons.SkipBack /></button>
              <button className="btn-play" onClick={() => setPlaying(!playing)}>
                {playing ? <Icons.Pause /> : <Icons.Play />}
              </button>
              <button className="btn-control"><Icons.SkipFwd /></button>
            </div>
            <div className="progress-bar">
              <div className="progress-fill"></div>
            </div>
          </div>

          <div className="p-right" style={{width: '30%', display: 'flex', justifyContent: 'flex-end'}}>
            <div style={{color: '#aaa', fontSize: '0.8rem'}}>3:45 / 4:20</div>
          </div>
        </div>

      </div>

      {/* MOBILE BOTTOM NAV */}
      <div className="bottom-nav">
        <div className={`nav-tab ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
          <Icons.Home /> Home
        </div>
        <div className={`nav-tab ${activeTab === 'search' ? 'active' : ''}`} onClick={() => setActiveTab('search')}>
          <Icons.Search /> Search
        </div>
        <div className={`nav-tab ${activeTab === 'library' ? 'active' : ''}`} onClick={() => setActiveTab('library')}>
          <Icons.Library /> Library
        </div>
      </div>

    </div>
  );
}

export default App;
