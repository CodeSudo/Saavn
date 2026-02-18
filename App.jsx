import React, { useState } from 'react';
import './App.css';

import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import { auth, db } from './firebase'; 
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove 
} from 'firebase/firestore';

const API_BASE = "https://saavn.sumit.co/api";

function App() {
  // Navigation
  const [view, setView] = useState('loading'); 
  const [tab, setTab] = useState('home');   
  const [loading, setLoading] = useState(false);

  // User
  const [user, setUser] = useState(null);
  const [likedSongs, setLikedSongs] = useState([]);
  const [authMode, setAuthMode] = useState('login');
  const [authInput, setAuthInput] = useState({ email: '', password: '' });

  // Search Data
  const [searchQuery, setSearchQuery] = useState('');
  const [resSongs, setResSongs] = useState([]);
  const [resAlbums, setResAlbums] = useState([]);
  const [resArtists, setResArtists] = useState([]);
  const [resPlaylists, setResPlaylists] = useState([]);

  // Homepage Data
  const [trendingSongs, setTrendingSongs] = useState([]);
  const [newAlbums, setNewAlbums] = useState([]);
  const [topPlaylists, setTopPlaylists] = useState([]);

  // Details Page
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailsSongs, setDetailsSongs] = useState([]);

  // Player
  const audioRef = useRef(new Audio());
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [queue, setQueue] = useState([]);
  const [qIndex, setQIndex] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [quality, setQuality] = useState('320kbps');
  const [volume, setVolume] = useState(1);

  // ==============================
  // 1. HELPERS
  // ==============================
  const getImg = (img) => {
    if (!img) return "https://via.placeholder.com/150";
    if (Array.isArray(img) && img.length > 0) {
      return img[img.length - 1]?.url || img[0]?.url;
    }
    return img;
  };

  const getName = (item) => item.name || item.title || "Unknown";
  const getDesc = (item) => item.primaryArtists || item.description || item.year || item.role || "";
  const isLiked = (id) => user?.likedSongs?.some(s => s.id === id);

  // ==============================
  // 2. DATA FETCHING
  // ==============================
  const fetchHomepageData = async () => {
    setLoading(true);
    try {
      const [songs, albums, playlists] = await Promise.all([
        fetch(`${API_BASE}/search/songs?query=Top 50&limit=15`).then(r => r.json()).catch(()=>({success:false})),
        fetch(`${API_BASE}/search/albums?query=New&limit=15`).then(r => r.json()).catch(()=>({success:false})),
        fetch(`${API_BASE}/search/playlists?query=Hits&limit=15`).then(r => r.json()).catch(()=>({success:false}))
      ]);

      if(songs?.success && songs?.data?.results) setTrendingSongs(songs.data.results);
      if(albums?.success && albums?.data?.results) setNewAlbums(albums.data.results);
      if(playlists?.success && playlists?.data?.results) setTopPlaylists(playlists.data.results);

    } catch (e) { console.error("Home data error", e); } 
    finally { setLoading(false); }
  };

  const doSearch = async () => {
    if (!searchQuery) { 
        setResSongs([]); setResAlbums([]); setResArtists([]); setResPlaylists([]);
        setTab('home'); // Go back to home if query empty
        return; 
    }
    setLoading(true); setTab('search_results');
    
    try {
      const [s, a, ar, p] = await Promise.all([
        fetch(`${API_BASE}/search/songs?query=${encodeURIComponent(searchQuery)}`).then(r => r.json()),
        fetch(`${API_BASE}/search/albums?query=${encodeURIComponent(searchQuery)}`).then(r => r.json()),
        fetch(`${API_BASE}/search/artists?query=${encodeURIComponent(searchQuery)}`).then(r => r.json()),
        fetch(`${API_BASE}/search/playlists?query=${encodeURIComponent(searchQuery)}`).then(r => r.json())
      ]);

      setResSongs(s.success ? s.data.results : []);
      setResAlbums(a.success ? a.data.results : []);
      setResArtists(ar.success ? ar.data.results : []);
      setResPlaylists(p.success ? p.data.results : []);

    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  // ==============================
  // 3. LOGIC (Details & Play)
  // ==============================
  const handleCardClick = async (item, type) => {
    if (type === 'song') {
      playSong([item], 0);
    } else {
      // Open Details Page
      setSelectedItem(item);
      setTab('details');
      setLoading(true);
      setDetailsSongs([]); 

      try {
        let endpoint = '';
        if (type === 'album') endpoint = `${API_BASE}/albums?id=${item.id}`;
        else if (type === 'playlist') endpoint = `${API_BASE}/playlists?id=${item.id}`;
        else if (type === 'artist') endpoint = `${API_BASE}/artists?id=${item.id}`;
        
        const res = await fetch(endpoint);
        const data = await res.json();
        
        if (data.success) {
           if (data.data.songs) setDetailsSongs(data.data.songs);
           else if (data.data.topSongs) setDetailsSongs(data.data.topSongs); 
           else setDetailsSongs([]);
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
  };

  const playSong = (list, idx) => {
    if (!list || idx < 0 || idx >= list.length) return;
    if (list !== queue) setQueue(list);
    setQIndex(idx);
    const song = list[idx];
    setCurrentSong(song);
    
    if (!song.downloadUrl) return alert("Audio unavailable");

    let match = song.downloadUrl.find(u => u.quality === quality);
    let url = match ? match.url : (song.downloadUrl[song.downloadUrl.length - 1]?.url || song.downloadUrl[0]?.url);
    
    if (audioRef.current.src !== url) {
      audioRef.current.src = url;
      audioRef.current.volume = volume;
      audioRef.current.play().then(()=>setIsPlaying(true)).catch(e=>console.error(e));
    } else {
      audioRef.current.play(); setIsPlaying(true);
    }
  };

  const toggleLike = async (song) => {
    if (!user) return;
    const liked = isLiked(song.id);
    let newLikes = liked ? likedSongs.filter(s => s.id !== song.id) : [...likedSongs, song];
    setLikedSongs(newLikes);
    
    const ref = doc(db, "users", user.uid);
    try {
      if (liked) await updateDoc(ref, { likedSongs: arrayRemove(song) });
      else await updateDoc(ref, { likedSongs: arrayUnion(song) });
    } catch (e) { console.error(e); }
  };

  const togglePlay = () => {
    if (audioRef.current.paused) { audioRef.current.play(); setIsPlaying(true); }
    else { audioRef.current.pause(); setIsPlaying(false); }
  };

  const handleQualityChange = (newQ) => {
    setQuality(newQ);
    if (currentSong && currentSong.downloadUrl) {
        const t = audioRef.current.currentTime;
        let match = currentSong.downloadUrl.find(u => u.quality === newQ);
        let url = match ? match.url : currentSong.downloadUrl[currentSong.downloadUrl.length - 1].url;
        if (audioRef.current.src !== url) {
            audioRef.current.src = url;
            audioRef.current.currentTime = t;
            if (isPlaying) audioRef.current.play();
        }
    }
  };

  // ==============================
  // 4. AUTH
  // ==============================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setView('app');
        fetchHomepageData();
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) setLikedSongs(docSnap.data().likedSongs || []);
          else await setDoc(docRef, { email: currentUser.email, likedSongs: [] });
        } catch (err) { console.error(err); }
      } else {
        setUser(null); setLikedSongs([]); setView('auth');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAuth = async () => {
    if (!authInput.email || !authInput.password) return alert("Fill all fields");
    try {
      if (authMode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, authInput.email, authInput.password);
        await setDoc(doc(db, "users", cred.user.uid), { email: authInput.email, likedSongs: [] });
      } else {
        await signInWithEmailAndPassword(auth, authInput.email, authInput.password);
      }
    } catch (e) { alert(e.message); }
  };

  const logout = async () => {
    await signOut(auth);
    audioRef.current.pause(); setIsPlaying(false); setCurrentSong(null);
  };

  // Lifecycle
  useEffect(() => {
    const a = audioRef.current;
    const time = () => { setProgress(a.currentTime); setDuration(a.duration||0); };
    const end = () => playSong(queue, qIndex+1);
    a.addEventListener('timeupdate', time);
    a.addEventListener('ended', end);
    return () => { a.removeEventListener('timeupdate', time); a.removeEventListener('ended', end); };
  }, [queue, qIndex]);


  // ==============================
  // 5. RENDER
  // ==============================
  if (view === 'loading') return <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background:'#000', color:'white'}}>Loading...</div>;

  if (view === 'auth') {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <h1 className="logo" style={{fontSize:'3rem', marginBottom:'20px'}}>Musiq.</h1>
          <input placeholder="Email" type="email" value={authInput.email} onChange={e=>setAuthInput({...authInput,email:e.target.value})} className="auth-input"/>
          <input type="password" placeholder="Password" value={authInput.password} onChange={e=>setAuthInput({...authInput,password:e.target.value})} className="auth-input"/>
          <button className="auth-btn" onClick={handleAuth}>{authMode==='login'?'Sign In':'Sign Up'}</button>
          <p style={{color:'#666', marginTop:'15px', cursor:'pointer'}} onClick={()=>setAuthMode(authMode==='login'?'signup':'login')}>
            {authMode==='login'?'Create Account':'Have Account?'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo">Musiq.</div>
        <div className={`nav-item ${tab==='home'?'active':''}`} onClick={()=>{setTab('home'); setSearchQuery(''); setResSongs([]);}}>
          <span>🏠</span> Home
        </div>
        <div className={`nav-item ${tab==='library'?'active':''}`} onClick={()=>setTab('library')}>
          <span>❤️</span> Liked Songs
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="header">
          <div className="search-bar">
            <span>🔍</span>
            <input 
              placeholder="Search songs, artists, albums..." 
              value={searchQuery}
              onChange={e=>setSearchQuery(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&doSearch()}
            />
          </div>
          <div className="user-pill" onClick={logout}>
            <div className="avatar">{user?.email ? user.email[0].toUpperCase() : 'U'}</div>
            <span style={{fontSize:'0.9rem', color:'#aaa', marginLeft:'10px'}}>Logout</span>
          </div>
        </div>

        <div className="scroll-area">
          {loading && <div style={{textAlign:'center', padding:'20px', color:'#555'}}>Loading...</div>}

          {/* DETAILS PAGE */}
          {tab === 'details' && selectedItem && (
             <div className="details-view">
               <button className="btn-back" onClick={() => setTab('home')} style={{marginBottom:'20px', background:'rgba(255,255,255,0.1)', border:'none', color:'white', padding:'8px 16px', borderRadius:'20px', cursor:'pointer'}}>← Back</button>
               <div className="details-header">
                  <img src={getImg(selectedItem.image)} alt="" className="details-img"/>
                  <div className="details-info">
                     <h1>{getName(selectedItem)}</h1>
                     <p>{getDesc(selectedItem)}</p>
                     <div className="action-buttons">
                        <button className="btn-play-all" onClick={() => playSong(detailsSongs, 0)}>▶ Play All</button>
                     </div>
                  </div>
               </div>
               
               <div className="details-songs">
                  {detailsSongs.map((song, idx) => (
                     <div key={song.id} className="song-row" onClick={() => playSong(detailsSongs, idx)}>
                        <span className="song-num">{idx + 1}</span>
                        <img src={getImg(song.image)} alt="" />
                        <div className="song-meta">
                           <h4>{getName(song)}</h4>
                           <p>{song.primaryArtists}</p>
                        </div>
                        {/* 🔴 LIKE BUTTON INSIDE ALBUM LIST */}
                        <div 
                          className={`card-heart ${isLiked(song.id)?'liked':''}`} 
                          style={{position:'static', opacity:1, margin:'0 15px', background:'transparent', fontSize:'1.2rem'}}
                          onClick={(e)=>{e.stopPropagation(); toggleLike(song)}}
                        >
                          ♥
                        </div>
                        <span className="song-dur">{Math.floor(song.duration/60)}:{String(song.duration%60).padStart(2, '0')}</span>
                     </div>
                  ))}
               </div>
             </div>
          )}

          {/* SEARCH RESULTS VIEW */}
          {tab === 'search_results' && (
             <>
                {/* 1. Songs Results */}
                {resSongs.length > 0 && (
                  <div className="section">
                    <div className="section-header"><div className="section-title">Songs</div></div>
                    <div className="grid">
                        {resSongs.map((item) => (
                          <div key={item.id} className="card" onClick={()=>handleCardClick(item, 'song')}>
                            <img src={getImg(item.image)} alt=""/>
                            <h3>{getName(item)}</h3>
                            <p>{item.primaryArtists}</p>
                            <div className={`card-heart ${isLiked(item.id)?'liked':''}`} onClick={(e)=>{e.stopPropagation(); toggleLike(item)}}>♥</div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* 2. Albums Results */}
                {resAlbums.length > 0 && (
                  <div className="section">
                    <div className="section-header"><div className="section-title">Albums</div></div>
                    <div className="horizontal-scroll">
                        {resAlbums.map((item) => (
                          <div key={item.id} className="card" onClick={()=>handleCardClick(item, 'album')}>
                            <img src={getImg(item.image)} alt=""/>
                            <h3>{getName(item)}</h3>
                            <p>{item.year} • Album</p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
             </>
          )}

          {/* HOMEPAGE VIEW */}
          {tab === 'home' && (
            <>
              <div className="section">
                <div className="section-header">
                    <div className="section-title">Trending Songs</div>
                </div>
                <div className="horizontal-scroll">
                    {trendingSongs.map((item) => (
                      <div key={item.id} className="card" onClick={()=>handleCardClick(item, 'song')}>
                        <img src={getImg(item.image)} alt=""/>
                        <h3>{getName(item)}</h3>
                        <p>{item.primaryArtists}</p>
                        <div className={`card-heart ${isLiked(item.id)?'liked':''}`} onClick={(e)=>{e.stopPropagation(); toggleLike(item)}}>♥</div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="section">
                <div className="section-header">
                    <div className="section-title">New Albums</div>
                </div>
                <div className="horizontal-scroll">
                    {newAlbums.map((item) => (
                      <div key={item.id} className="card" onClick={()=>handleCardClick(item, 'album')}>
                        <img src={getImg(item.image)} alt=""/>
                        <h3>{getName(item)}</h3>
                        <p>{item.year}</p>
                      </div>
                    ))}
                </div>
              </div>

              <div className="section">
                <div className="section-header">
                    <div className="section-title">Top Playlists</div>
                </div>
                <div className="horizontal-scroll">
                    {topPlaylists.map((item) => (
                      <div key={item.id} className="card" onClick={()=>handleCardClick(item, 'playlist')}>
                        <img src={getImg(item.image)} alt=""/>
                        <h3>{getName(item)}</h3>
                        <p>{item.language}</p>
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}

          {/* LIBRARY */}
          {tab === 'library' && (
            <>
              <h2>Liked Songs</h2>
              {likedSongs.length === 0 ? <p style={{color:'#666'}}>No songs liked yet.</p> : (
                 <div className="grid">
                    {likedSongs.map((item, idx) => (
                      <div key={item.id} className="card" onClick={()=>playSong(likedSongs, idx)}>
                        <img src={getImg(item.image)} alt=""/>
                        <h3>{getName(item)}</h3>
                        <p>{item.primaryArtists}</p>
                        <div className="card-heart liked" onClick={(e)=>{e.stopPropagation(); toggleLike(item)}}>♥</div>
                      </div>
                    ))}
                 </div>
              )}
            </>
          )}
        </div>

        {/* Player Bar */}
        <div className={`player-bar ${currentSong ? 'visible' : ''}`}>
          {currentSong && (
            <>
              <div className="p-left">
                <img src={getImg(currentSong.image)} alt=""/>
                <div>
                   <h4 style={{color:'white', fontSize:'0.95rem'}}>{getName(currentSong)}</h4>
                   <p style={{color:'#888', fontSize:'0.8rem'}}>{currentSong.primaryArtists}</p>
                </div>
              </div>
              
              <div className="p-center">
                 <div className="p-controls">
                    <span style={{color:'#aaa', cursor:'pointer'}} onClick={()=>playSong(queue, qIndex-1)}>⏮</span>
                    <div className="btn-play" onClick={togglePlay}>{isPlaying ? "||" : "▶"}</div>
                    <span style={{color:'#aaa', cursor:'pointer'}} onClick={()=>playSong(queue, qIndex+1)}>⏭</span>
                 </div>
                 <div className="progress-rail" onClick={(e)=>{
                    const w = e.currentTarget.clientWidth;
                    const x = e.nativeEvent.offsetX;
                    audioRef.current.currentTime = (x/w)*duration;
                 }}>
                    <div className="progress-fill" style={{width: `${(progress/duration)*100}%`}}></div>
                 </div>
              </div>

              <div className="p-right">
                 <span style={{fontSize:'0.8rem', color:'#aaa'}}>🔊</span>
                 <input 
                    type="range" min="0" max="1" step="0.05" 
                    value={volume} onChange={(e)=>{setVolume(e.target.value); audioRef.current.volume=e.target.value}}
                    className="volume-slider"
                 />
                 <select className="quality-select" value={quality} onChange={(e)=>handleQualityChange(e.target.value)}>
                    <option value="320kbps">320kbps</option>
                    <option value="160kbps">160kbps</option>
                 </select>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

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
