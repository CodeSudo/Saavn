import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import toast, { Toaster } from 'react-hot-toast';

// --- MOCK DATA (No API/Firebase needed to see UI) ---
const MOCK_DATA = {
  trending: [
    { id: '1', name: 'Starboy', primaryArtists: 'The Weeknd', image: [{url:'https://i.scdn.co/image/ab67616d0000b2734718e28d24527d9774635ded'}] },
    { id: '2', name: 'Flowers', primaryArtists: 'Miley Cyrus', image: [{url:'https://i.scdn.co/image/ab67616d0000b273f429549123dbe8552764ba1d'}] },
    { id: '3', name: 'As It Was', primaryArtists: 'Harry Styles', image: [{url:'https://i.scdn.co/image/ab67616d0000b273b46f74097655d7f353ca6605'}] },
    { id: '4', name: 'Anti-Hero', primaryArtists: 'Taylor Swift', image: [{url:'https://i.scdn.co/image/ab67616d0000b273bb54dde5369e8c4b751209c7'}] },
    { id: '5', name: 'Rich Flex', primaryArtists: 'Drake, 21 Savage', image: [{url:'https://i.scdn.co/image/ab67616d0000b27302854a7060fccc1a163160cc'}] },
  ],
  charts: [
    { id: 'c1', name: 'Global Top 50', image: [{url:'https://charts-images.scdn.co/assets/locale_en/regional/weekly/region_global_default.jpg'}] },
    { id: 'c2', name: 'Viral Hits', image: [{url:'https://i.scdn.co/image/ab67706f00000002d6d48b11fd3b11da654c3519'}] },
  ],
  newAlbums: [
    { id: 'a1', name: 'Midnights', year: '2022', image: [{url:'https://i.scdn.co/image/ab67616d0000b273bb54dde5369e8c4b751209c7'}] },
    { id: 'a2', name: 'Harrys House', year: '2022', image: [{url:'https://i.scdn.co/image/ab67616d0000b273b46f74097655d7f353ca6605'}] },
  ]
};

const MOODS = [
  { id: 'm1', name: 'Party', color: '#e57373' },
  { id: 'm2', name: 'Romance', color: '#f06292' },
  { id: 'm3', name: 'Sad', color: '#ba68c8' },
  { id: 'm4', name: 'Workout', color: '#ffb74d' },
  { id: 'm5', name: 'Chill', color: '#4db6ac' },
  { id: 'm6', name: 'Retro', color: '#7986cb' },
];

// --- ICONS ---
const Icons = {
  Home: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>,
  Search: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Library: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  Play: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  Pause: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
  SkipFwd: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>,
  SkipBack: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>,
  Plus: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  List: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  Mic: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  Heart: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  Trash: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Shuffle: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>,
  Repeat: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>,
  RepeatOne: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/><text x="10" y="15" fontSize="8" fill="currentColor" style={{fontWeight:'bold'}}>1</text></svg>,
  Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
};

function App() {
  const [view, setView] = useState('app'); // Skip Auth for now
  const [tab, setTab] = useState('home');
  // FAKE USER to prevent crashes
  const [user, setUser] = useState({ email: 'user@aura.music', uid: 'demo-123' });
  
  // Data State
  const [homeData, setHomeData] = useState(MOCK_DATA);
  const [resSongs, setResSongs] = useState([]);
  const [history, setHistory] = useState(MOCK_DATA.trending);
  const [likedSongs, setLikedSongs] = useState(MOCK_DATA.trending.slice(0,2));
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Details & UI
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailsSongs, setDetailsSongs] = useState([]);
  const [showQueue, setShowQueue] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyricsText, setLyricsText] = useState("");
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [songToAdd, setSongToAdd] = useState(null);
  
  // Player
  const audioRef = useRef(new Audio());
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [queue, setQueue] = useState([]);
  const [qIndex, setQIndex] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [quality, setQuality] = useState('320kbps');
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('none'); 

  // Helpers
  const getImg = (i) => { if(Array.isArray(i)) return i[i.length-1]?.url || i[0]?.url; return i || "https://via.placeholder.com/150"; }
  const getName = (i) => i?.name || i?.title || "Unknown";
  const getDesc = (i) => i?.primaryArtists || i?.description || "";
  const isLiked = (id) => likedSongs.some(s => String(s.id) === String(id));
  const formatTime = (s) => { if(isNaN(s)) return "0:00"; const m=Math.floor(s/60), sc=Math.floor(s%60); return `${m}:${sc<10?'0'+sc:sc}`; };

  // --- MOCK DATA FETCHING (Replaces API for safety) ---
  const doSearch = async () => {
    if(!searchQuery) return;
    setTab('search');
    // Simulate API delay
    toast.success("Searching...");
    setTimeout(() => {
        // Return mock results based on query just to show UI
        setResSongs(MOCK_DATA.trending);
    }, 500);
  };

  const fetchLyrics = () => {
    if(!currentSong) return;
    setLyricsText("Lyrics feature is in demo mode.\n\nImagine real lyrics here for " + currentSong.name);
    setShowLyrics(true);
  };

  // --- PLAYER LOGIC ---
  const playSong = (list, idx) => {
    if(!list || !list[idx]) return;
    setQueue(list); setQIndex(idx);
    const s = list[idx];
    setCurrentSong(s);
    
    // Simulating Play without Real Audio URL to avoid errors
    setIsPlaying(true);
    setDuration(200); // Fake duration
    toast.success(`Playing: ${getName(s)}`);
  };

  const togglePlay = () => setIsPlaying(!isPlaying);

  const handleSeek = (e) => {
    const w = e.currentTarget.clientWidth;
    const x = e.nativeEvent.offsetX;
    const seekTo = (x / w) * duration;
    setProgress(seekTo);
  };

  const toggleShuffle = () => { setIsShuffle(!isShuffle); toast(!isShuffle ? 'Shuffle On' : 'Shuffle Off'); };
  const toggleRepeat = () => { toast('Repeat All'); };

  const removeFromQueue = (idx) => {
    const newQueue = queue.filter((_, i) => i !== idx);
    setQueue(newQueue);
  };

  // --- PLAYLIST & LIKE ---
  const toggleLike = (item) => {
    const liked = isLiked(item.id);
    if(liked) {
        setLikedSongs(likedSongs.filter(s=>String(s.id)!==String(item.id)));
        toast("Removed from Library");
    } else {
        setLikedSongs([...likedSongs, item]);
        toast.success("Added to Library");
    }
  };

  const createPlaylist = () => {
    if(!newPlaylistName.trim()) return;
    setUserPlaylists([...userPlaylists, { id: Date.now(), name: newPlaylistName, songs: [] }]);
    setNewPlaylistName(""); setShowPlaylistModal(false); toast.success("Playlist Created");
  };

  // --- NAVIGATION ---
  const handleCardClick = (item, type) => {
    if (type === 'song') { playSong([item], 0); }
    else if (type === 'playlist_custom') { setSelectedItem(item); setTab('details'); setDetailsSongs(item.songs || []); }
    else if (type === 'mood') {
        toast('Mood Selected: ' + item.name);
    }
    else {
      setSelectedItem(item); setTab('details'); 
      setDetailsSongs(MOCK_DATA.trending); // Show trending as details for demo
    }
  };

  // --- MOCK AUDIO TICKER ---
  useEffect(() => {
    let interval;
    if(isPlaying) {
        interval = setInterval(() => {
            setProgress(p => (p >= duration ? 0 : p + 1));
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  // --- RENDER ---
  return (
    <div className="app-layout">
        <Toaster position="top-center" toastOptions={{style:{background:'#333', color:'#fff'}}}/>

        {showLyrics && (
            <div className="lyrics-overlay">
                <button className="lyrics-close" style={{position:'absolute', top:20, right:20, background:'none', border:'none', color:'white', fontSize:'2rem'}} onClick={()=>setShowLyrics(false)}>✕</button>
                <div className="lyrics-content">{lyricsText}</div>
            </div>
        )}

        {showQueue && (
            <div className={`queue-sidebar ${showQueue?'open':''}`}>
                <div className="queue-header">
                    <span>Up Next</span>
                    <button onClick={()=>setShowQueue(false)} style={{background:'none',border:'none',color:'white',cursor:'pointer'}}>✕</button>
                </div>
                <div className="queue-list">
                    {queue.map((s, i) => (
                        <div key={i} className={`queue-item ${i===qIndex?'active':''}`}>
                            <img src={getImg(s.image)} alt="" onClick={()=>playSong(queue, i)}/>
                            <div style={{flex:1}} onClick={()=>playSong(queue, i)}>
                                <div style={{fontSize:'0.9rem', fontWeight:700, color:'white'}}>{getName(s)}</div>
                                <div style={{fontSize:'0.8rem', color:'#aaa'}}>{getDesc(s)}</div>
                            </div>
                            <button onClick={()=>removeFromQueue(i)} style={{background:'none',border:'none',color:'#666',cursor:'pointer'}}><Icons.Trash/></button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {showPlaylistModal && (
            <div className="modal-overlay">
                <div className="modal-box">
                    <h2>New Playlist</h2>
                    <input className="modal-input" placeholder="Playlist Name" value={newPlaylistName} onChange={e=>setNewPlaylistName(e.target.value)}/>
                    <div className="modal-actions">
                        <button className="btn-cancel" onClick={()=>setShowPlaylistModal(false)}>Cancel</button>
                        <button className="btn-confirm" onClick={createPlaylist}>Create</button>
                    </div>
                </div>
            </div>
        )}

        {/* SIDEBAR */}
        <div className="sidebar">
            <div className="brand">Aura.</div>
            <div className="nav-links">
                <div className={`nav-item ${tab==='home'?'active':''}`} onClick={()=>setTab('home')}><Icons.Home/> Home</div>
                <div className={`nav-item ${tab==='search'?'active':''}`} onClick={()=>setTab('search')}><Icons.Search/> Search</div>
                <div className={`nav-item ${tab==='library'?'active':''}`} onClick={()=>setTab('library')}><Icons.Library/> Library</div>
                <div className={`nav-item ${tab==='profile'?'active':''}`} onClick={()=>setTab('profile')}><span style={{fontSize:'1.2rem'}}>👤</span> Profile</div>
                
                <div className="nav-section-title">My Playlists</div>
                {userPlaylists.map(pl => (
                    <div key={pl.id} className={`nav-item ${selectedItem?.id===pl.id?'active':''}`} onClick={()=>handleCardClick(pl, 'playlist_custom')}>
                        <span style={{opacity:0.7}}>🎵</span> {pl.name}
                    </div>
                ))}
                <button className="btn-create-playlist" onClick={()=>setShowPlaylistModal(true)}>
                    <Icons.Plus/> Create Playlist
                </button>
            </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="main-content">
            <div className="header">
                <div className="search-box">
                    <Icons.Search/>
                    <input placeholder="Search songs, artists, albums..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&doSearch()}/>
                </div>
                <div className="user-pill" onClick={()=>setTab('profile')}>
                    <div className="avatar">{user.email[0].toUpperCase()}</div>
                </div>
            </div>

            <div className="scroll-area">
                {/* PROFILE VIEW */}
                {tab === 'profile' && (
                    <div className="profile-view">
                        <div className="profile-header">
                            <div className="profile-avatar-large">{user.email[0].toUpperCase()}</div>
                            <div className="profile-info">
                                <div className="profile-label">Profile</div>
                                <h1 className="profile-name">{user.email.split('@')[0]}</h1>
                                <button className="btn-logout" onClick={()=>{ toast.success("Logged Out (Demo)"); }}>Logout</button>
                            </div>
                        </div>
                        <div className="section-header">Your Library ({likedSongs.length})</div>
                        <div className="grid">
                            {likedSongs.map((s, i) => (
                                <div key={s.id} className="card" onClick={()=>playSong(likedSongs, i)}>
                                    <img src={getImg(s.image)} alt=""/>
                                    <h3>{getName(s)}</h3>
                                    <p>{getDesc(s)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* DETAILS */}
                {tab === 'details' && selectedItem && (
                    <div className="details-view">
                        <button className="btn-back" onClick={()=>setTab('home')}>
                            <Icons.Back /> Back
                        </button>
                        <div className="details-header">
                            <img className="details-art" src={getImg(selectedItem.image || selectedItem.songs?.[0]?.image)} alt=""/>
                            <div className="details-meta">
                                <h1>{getName(selectedItem)}</h1>
                                <p>{selectedItem.songs ? `${selectedItem.songs.length} Songs` : getDesc(selectedItem)}</p>
                                <button className="btn-play-all" onClick={()=>playSong(detailsSongs, 0)}>Play All</button>
                            </div>
                        </div>
                        <div className="track-list">
                            {detailsSongs.map((s, i) => (
                                <div key={i} className="track-row">
                                    <div style={{display:'flex', alignItems:'center', flex:1}} onClick={()=>playSong(detailsSongs, i)}>
                                        <span className="track-num">{i+1}</span>
                                        <img className="track-img" src={getImg(s.image)} alt=""/>
                                        <div className="track-info">
                                            <div className="track-title">{getName(s)}</div>
                                            <div className="track-artist">{getDesc(s)}</div>
                                        </div>
                                    </div>
                                    <div className="track-actions">
                                        <button className={`icon-action ${isLiked(s.id)?'liked':''}`} onClick={()=>toggleLike(s)}><Icons.Heart/></button>
                                        <button className="icon-action" onClick={()=>{setSongToAdd(s); setShowAddToPlaylistModal(true);}}><Icons.Plus/></button>
                                    </div>
                                    <div className="track-dur">2:30</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* SEARCH RESULTS */}
                {tab === 'search' && (
                    <div className="section">
                        <div className="section-header">Results</div>
                        <div className="grid">
                            {resSongs.map(s => (
                                <div key={s.id} className="card" onClick={()=>playSong(resSongs, resSongs.indexOf(s))}>
                                    <img src={getImg(s.image)} alt=""/>
                                    <h3>{getName(s)}</h3>
                                    <p>{getDesc(s)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* HOME */}
                {tab === 'home' && (
                    <>
                        <div className="hero">
                            <h1>Welcome Back</h1>
                            <p>Discover new music, fresh albums, and curated playlists.</p>
                        </div>

                        {/* Moods */}
                        <div className="section">
                            <div className="section-header">Moods</div>
                            <div className="horizontal-scroll">
                                {MOODS.map(m => (
                                    <div key={m.id} className="card" style={{minWidth:'160px', background:m.color, display:'flex', alignItems:'center', justifyContent:'center'}} onClick={()=>handleCardClick(m, 'mood')}>
                                        <h3 style={{fontSize:'1.2rem', color:'white', textAlign:'center'}}>{m.name}</h3>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Trending */}
                        <div className="section">
                            <div className="section-header">Trending Now</div>
                            <div className="horizontal-scroll">
                                {homeData.trending.map(s => (
                                    <div key={s.id} className="card" onClick={()=>playSong(homeData.trending, homeData.trending.indexOf(s))}>
                                        <img src={getImg(s.image)} alt=""/>
                                        <h3>{getName(s)}</h3>
                                        <p>{getDesc(s)}</p>
                                        <div className="card-actions">
                                            <button className={`btn-card-action ${isLiked(s.id)?'liked':''}`} onClick={(e)=>{e.stopPropagation(); toggleLike(s)}}><Icons.Heart/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Top Charts */}
                        <div className="section">
                            <div className="section-header">Top Charts</div>
                            <div className="horizontal-scroll">
                                {homeData.charts.map(p => (
                                    <div key={p.id} className="card" onClick={()=>handleCardClick(p, 'playlist')}>
                                        <img src={getImg(p.image)} alt=""/>
                                        <h3>{getName(p)}</h3>
                                        <p>Chart</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>

        {/* --- PLAYER BAR --- */}
        <div className={`player-bar ${currentSong ? 'visible' : ''}`} style={{transform: currentSong ? 'translateY(0)' : 'translateY(100%)', transition:'transform 0.3s'}}>
            {currentSong && (
                <>
                    <div className="mobile-progress-bar" style={{width: `${(progress/duration)*100}%`, display: 'none'}}></div> 
                    
                    <div className="p-track">
                        <img src={getImg(currentSong.image)} alt=""/>
                        <div style={{overflow: 'hidden'}}>
                            <h4 style={{fontSize:'0.9rem', color:'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{getName(currentSong)}</h4>
                            <p style={{fontSize:'0.8rem', color:'#aaa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{getDesc(currentSong)}</p>
                        </div>
                    </div>
                    <div className="p-center">
                        <div className="p-controls">
                            <button className={`btn-icon ${isShuffle?'active':''}`} onClick={toggleShuffle}><Icons.Shuffle/></button>
                            <button className="btn-icon" onClick={()=>playSong(queue, qIndex-1)}><Icons.SkipBack/></button>
                            <button className="btn-play" onClick={togglePlay}>{isPlaying ? <Icons.Pause/> : <Icons.Play/>}</button>
                            <button className="btn-icon" onClick={()=>playSong(queue, qIndex+1)}><Icons.SkipFwd/></button>
                            <button className={`btn-icon ${repeatMode!=='none'?'active':''}`} onClick={toggleRepeat}>
                                {repeatMode==='one' ? <Icons.RepeatOne/> : <Icons.Repeat/>}
                            </button>
                        </div>
                        <div className="progress-container">
                            <span>{formatTime(progress)}</span>
                            <div className="progress-rail" onClick={handleSeek}>
                                <div className="progress-fill" style={{width: `${(progress/duration)*100}%`}}></div>
                            </div>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>
                    <div className="p-right">
                        <button className={`btn-icon ${showLyrics?'active':''}`} onClick={fetchLyrics}><Icons.Mic/></button>
                        <button className={`btn-icon ${showQueue?'active':''}`} onClick={()=>setShowQueue(!showQueue)}><Icons.List/></button>
                    </div>

                    <div className="mobile-controls" style={{display:'none'}}> 
                       <button className="btn-play-mobile" onClick={togglePlay}>{isPlaying ? <Icons.Pause/> : <Icons.Play/>}</button>
                    </div>
                </>
            )}
        </div>

        {/* BOTTOM NAV */}
        <div className="bottom-nav">
            <div className={`nav-tab ${tab==='home'?'active':''}`} onClick={()=>setTab('home')}><Icons.Home/> Home</div>
            <div className={`nav-tab ${tab==='search'?'active':''}`} onClick={()=>setTab('search')}><Icons.Search/> Search</div>
            <div className={`nav-tab ${tab==='library'?'active':''}`} onClick={()=>setTab('library')}><Icons.Library/> Library</div>
            <div className={`nav-tab ${tab==='profile'?'active':''}`} onClick={()=>setTab('profile')}>👤 Profile</div>
        </div>
    </div>
  );
}

export default App;
