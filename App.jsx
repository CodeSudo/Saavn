import React, { useState, useRef, useEffect } from 'react';
import './App.css';
// Firebase
import { auth, db } from './firebase'; 
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

// API
const API_BASE = "https://saavn.sumit.co/api";

// Icons
const Icons = {
  Home: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>,
  Search: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Library: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  Play: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  Pause: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
  SkipBack: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>,
  SkipFwd: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
};

function App() {
  // Navigation & UI
  const [view, setView] = useState('loading'); 
  const [tab, setTab] = useState('home');   
  const [loading, setLoading] = useState(false);

  // User & Auth
  const [user, setUser] = useState(null);
  const [likedSongs, setLikedSongs] = useState([]);
  const [authMode, setAuthMode] = useState('login');
  const [authInput, setAuthInput] = useState({ email: '', password: '' });

  // Data
  const [searchQuery, setSearchQuery] = useState('');
  const [resSongs, setResSongs] = useState([]);
  const [resAlbums, setResAlbums] = useState([]);
  const [resPlaylists, setResPlaylists] = useState([]);
  
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

  // --- 1. HELPERS ---
  const getImg = (img) => {
    if (!img) return "https://via.placeholder.com/150";
    if (Array.isArray(img) && img.length > 0) return img[img.length - 1]?.url || img[0]?.url;
    return img;
  };
  const getName = (i) => i.name || i.title || "Unknown";
  const getDesc = (i) => i.primaryArtists || i.description || i.year || "";
  
  // FIXED: Ensure strict ID comparison
  const isLiked = (id) => user?.likedSongs?.some(s => String(s.id) === String(id));

  // --- 2. DATA FETCHING ---
  const fetchHome = async () => {
    setLoading(true);
    try {
      const [s, a, p] = await Promise.all([
        fetch(`${API_BASE}/search/songs?query=Top 50&limit=15`).then(r => r.json()).catch(()=>({})),
        fetch(`${API_BASE}/search/albums?query=New&limit=15`).then(r => r.json()).catch(()=>({})),
        fetch(`${API_BASE}/search/playlists?query=Hits&limit=15`).then(r => r.json()).catch(()=>({}))
      ]);
      if(s?.success) setTrendingSongs(s.data.results);
      if(a?.success) setNewAlbums(a.data.results);
      if(p?.success) setTopPlaylists(p.data.results);
    } catch(e) { console.error(e); } finally { setLoading(false); }
  };

  const doSearch = async () => {
    if(!searchQuery) { 
        setResSongs([]); setResAlbums([]); setResPlaylists([]); setTab('home'); return; 
    }
    setLoading(true); setTab('search');
    try {
      const [s, a, p] = await Promise.all([
        fetch(`${API_BASE}/search/songs?query=${encodeURIComponent(searchQuery)}`).then(r=>r.json()),
        fetch(`${API_BASE}/search/albums?query=${encodeURIComponent(searchQuery)}`).then(r=>r.json()),
        fetch(`${API_BASE}/search/playlists?query=${encodeURIComponent(searchQuery)}`).then(r=>r.json())
      ]);
      setResSongs(s.success ? s.data.results : []);
      setResAlbums(a.success ? a.data.results : []);
      setResPlaylists(p.success ? p.data.results : []);
    } catch(e) { console.error(e); } finally { setLoading(false); }
  };

  // --- 3. LOGIC (LIKES FIXED) ---
  const toggleLike = async (item) => {
    if(!user) return alert("Please Login");
    
    // 1. Check if already liked using strict string comparison
    const alreadyLiked = isLiked(item.id);
    const userRef = doc(db, "users", user.uid);

    try {
        if(alreadyLiked) {
            // UNLIKE: Remove the exact object from the array
            // We must find the exact object in the local array to pass to arrayRemove
            const itemToRemove = likedSongs.find(s => String(s.id) === String(item.id));
            
            if (itemToRemove) {
                // Optimistic UI Update
                const newLikes = likedSongs.filter(s => String(s.id) !== String(item.id));
                setLikedSongs(newLikes);
                
                // DB Update
                await updateDoc(userRef, { likedSongs: arrayRemove(itemToRemove) });
            }
        } else {
            // LIKE: Add to array
            // Sanitize data to ensure we don't save garbage
            const cleanItem = {
                id: String(item.id), // Force String ID
                name: item.name || item.title || "Unknown",
                primaryArtists: item.primaryArtists || item.description || "",
                image: item.image || [],
                downloadUrl: item.downloadUrl || [], // Important for playback
                duration: item.duration || 0
            };

            // Optimistic UI Update
            setLikedSongs([...likedSongs, cleanItem]);

            // DB Update
            await updateDoc(userRef, { likedSongs: arrayUnion(cleanItem) });
        }
    } catch(e) { 
        console.error("Like Error", e);
        // If error, revert UI (optional but good practice)
        // For simplicity we leave it, but a real app would fetch from DB again
    }
  };

  const handleCardClick = async (item, type) => {
    if (type === 'song') {
      playSong([item], 0);
    } else {
      setSelectedItem(item); setTab('details'); setLoading(true); setDetailsSongs([]);
      try {
        const endpoint = type === 'album' ? `${API_BASE}/albums?id=${item.id}` : `${API_BASE}/playlists?id=${item.id}`;
        const res = await fetch(endpoint);
        const data = await res.json();
        if(data.success && data.data.songs) setDetailsSongs(data.data.songs);
      } catch(e) { console.error(e); } finally { setLoading(false); }
    }
  };

  const playSong = (list, idx) => {
    if(!list || idx < 0 || !list[idx]) return;
    if(list !== queue) setQueue(list);
    setQIndex(idx);
    const s = list[idx];
    setCurrentSong(s);
    
    const url = s.downloadUrl?.find(u => u.quality === quality)?.url || s.downloadUrl?.[0]?.url;
    if(url) {
      if(audioRef.current.src !== url) {
        audioRef.current.src = url;
        audioRef.current.volume = volume;
        audioRef.current.play().catch(e=>console.error(e));
        setIsPlaying(true);
      } else {
        audioRef.current.play(); setIsPlaying(true);
      }
    } else alert("Audio Unavailable");
  };

  const togglePlay = () => {
    if(audioRef.current.paused) { audioRef.current.play(); setIsPlaying(true); }
    else { audioRef.current.pause(); setIsPlaying(false); }
  };

  // --- 4. AUTH & LIFECYCLE ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
        if(u) {
            setUser(u); setView('app'); fetchHome();
            try {
                const snap = await getDoc(doc(db, "users", u.uid));
                if(snap.exists()) setLikedSongs(snap.data().likedSongs || []);
                else await setDoc(doc(db, "users", u.uid), { email: u.email, likedSongs: [] });
            } catch {}
        } else { setUser(null); setView('auth'); }
    });
    return () => unsub();
  }, []);

  const handleAuth = async () => {
    try {
        if(authMode==='signup') {
            const c = await createUserWithEmailAndPassword(auth, authInput.email, authInput.password);
            await setDoc(doc(db, "users", c.user.uid), { email: authInput.email, likedSongs: [] });
        } else {
            await signInWithEmailAndPassword(auth, authInput.email, authInput.password);
        }
    } catch(e) { alert(e.message); }
  };

  useEffect(() => {
    const a = audioRef.current;
    const t = () => { setProgress(a.currentTime); setDuration(a.duration||0); };
    const e = () => playSong(queue, qIndex+1);
    a.addEventListener('timeupdate', t); a.addEventListener('ended', e);
    return () => { a.removeEventListener('timeupdate', t); a.removeEventListener('ended', e); };
  }, [queue, qIndex]);

  // --- RENDER ---
  if(view === 'loading') return <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background:'black', color:'white'}}>Loading...</div>;

  if(view === 'auth') return (
    <div className="auth-container">
        <div className="auth-box">
            <h1 style={{color:'var(--primary)', marginBottom:30}}>Spotube Clone</h1>
            <input className="auth-input" placeholder="Email" onChange={e=>setAuthInput({...authInput,email:e.target.value})}/>
            <input className="auth-input" type="password" placeholder="Password" onChange={e=>setAuthInput({...authInput,password:e.target.value})}/>
            <button className="auth-btn" onClick={handleAuth}>{authMode==='login'?'Login':'Sign Up'}</button>
            <p style={{marginTop:15, cursor:'pointer', color:'#aaa'}} onClick={()=>setAuthMode(authMode==='login'?'signup':'login')}>{authMode==='login'?'Create Account':'Have Account?'}</p>
        </div>
    </div>
  );

  return (
    <div className="app-layout">
        {/* SIDEBAR */}
        <div className="sidebar">
            <div className="brand">Spotube</div>
            <div className="nav-links">
                <div className={`nav-item ${tab==='home'?'active':''}`} onClick={()=>{setTab('home'); setSearchQuery('');}}>
                    <span className="nav-icon"><Icons.Home/></span> Home
                </div>
                <div className={`nav-item ${tab==='library'?'active':''}`} onClick={()=>setTab('library')}>
                    <span className="nav-icon"><Icons.Library/></span> Library
                </div>
            </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="main-content">
            <div className="header">
                <div className="search-box">
                    <Icons.Search/>
                    <input placeholder="Search songs, albums..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&doSearch()}/>
                </div>
                <div className="user-pill" onClick={()=>signOut(auth)}>
                    <div className="avatar">{user.email[0].toUpperCase()}</div>
                    <span style={{fontSize:'0.85rem', fontWeight:600}}>Logout</span>
                </div>
            </div>

            <div className="scroll-area">
                {loading && <div style={{textAlign:'center', padding:20, color:'#666'}}>Loading...</div>}

                {/* DETAILS PAGE */}
                {tab === 'details' && selectedItem && (
                    <div className="details-view">
                        <button className="btn-back" onClick={()=>setTab('home')}>← Back</button>
                        <div className="details-header">
                            <img className="details-art" src={getImg(selectedItem.image)} alt=""/>
                            <div className="details-meta">
                                <h1>{getName(selectedItem)}</h1>
                                <p>{getDesc(selectedItem)}</p>
                                <button className="btn-play-all" onClick={()=>playSong(detailsSongs, 0)}>Play All</button>
                            </div>
                        </div>
                        <div className="track-list">
                            {detailsSongs.map((s, i)=>(
                                <div key={s.id} className="track-row" onClick={()=>playSong(detailsSongs, i)}>
                                    <span className="track-num">{i+1}</span>
                                    <img className="track-img" src={getImg(s.image)} alt=""/>
                                    <div className="track-info">
                                        <div className="track-title">{getName(s)}</div>
                                        <div className="track-artist">{s.primaryArtists}</div>
                                    </div>
                                    {/* HEART IN DETAILS LIST */}
                                    <button 
                                        className={`btn-like-list ${isLiked(s.id)?'liked':''}`} 
                                        onClick={(e)=>{e.stopPropagation(); toggleLike(s);}}
                                    >♥</button>
                                    <span className="track-dur">{Math.floor(s.duration/60)}:{String(s.duration%60).padStart(2,'0')}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* SEARCH RESULTS */}
                {tab === 'search' && (
                    <>
                        {resSongs.length>0 && (
                            <div className="section">
                                <div className="section-header"><div className="section-title">Songs</div></div>
                                <div className="grid">
                                    {resSongs.map(i=>(
                                        <div key={i.id} className="card" onClick={()=>handleCardClick(i, 'song')}>
                                            <img src={getImg(i.image)} alt=""/>
                                            <h3>{getName(i)}</h3>
                                            <p>{i.primaryArtists}</p>
                                            <button 
                                                className={`card-heart ${isLiked(i.id)?'liked':''}`} 
                                                onClick={(e)=>{e.stopPropagation(); toggleLike(i)}}
                                            >♥</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {resAlbums.length>0 && (
                            <div className="section">
                                <div className="section-header"><div className="section-title">Albums</div></div>
                                <div className="horizontal-scroll">
                                    {resAlbums.map(i=>(
                                        <div key={i.id} className="card" onClick={()=>handleCardClick(i, 'album')}>
                                            <img src={getImg(i.image)} alt=""/>
                                            <h3>{getName(i)}</h3>
                                            <p>{i.year}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* HOME */}
                {tab === 'home' && (
                    <>
                        <div className="hero">
                            <h1>Welcome Back</h1>
                            <p>Discover new music, fresh albums, and curated playlists just for you.</p>
                        </div>
                        <div className="section">
                            <div className="section-header"><div className="section-title">Trending Songs</div></div>
                            <div className="horizontal-scroll">
                                {trendingSongs.map(i=>(
                                    <div key={i.id} className="card" onClick={()=>handleCardClick(i, 'song')}>
                                        <img src={getImg(i.image)} alt=""/>
                                        <h3>{getName(i)}</h3>
                                        <p>{i.primaryArtists}</p>
                                        {/* HEART IN CARD */}
                                        <button 
                                            className={`card-heart ${isLiked(i.id)?'liked':''}`} 
                                            onClick={(e)=>{e.stopPropagation(); toggleLike(i)}}
                                        >♥</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="section">
                            <div className="section-header"><div className="section-title">Fresh Albums</div></div>
                            <div className="horizontal-scroll">
                                {newAlbums.map(i=>(
                                    <div key={i.id} className="card" onClick={()=>handleCardClick(i, 'album')}>
                                        <img src={getImg(i.image)} alt=""/>
                                        <h3>{getName(i)}</h3>
                                        <p>{i.year}</p>
                                        {/* Note: Liking albums as whole objects can be messy, kept to songs mostly */}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* LIBRARY */}
                {tab === 'library' && (
                    <div className="section">
                        <div className="section-header"><div className="section-title">Liked Songs</div></div>
                        <div className="grid">
                            {likedSongs.map((i, idx)=>(
                                <div key={i.id} className="card" onClick={()=>playSong(likedSongs, idx)}>
                                    <img src={getImg(i.image)} alt=""/>
                                    <h3>{getName(i)}</h3>
                                    <p>{i.primaryArtists}</p>
                                    <button 
                                        className="card-heart liked" 
                                        onClick={(e)=>{e.stopPropagation(); toggleLike(i)}}
                                    >♥</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* BOTTOM NAV */}
        <div className="bottom-nav">
            <div className={`nav-tab ${tab==='home'?'active':''}`} onClick={()=>setTab('home')}>
                <Icons.Home/><span>Home</span>
            </div>
            <div className={`nav-tab ${tab==='search'?'active':''}`} onClick={()=>{setTab('search'); document.querySelector('.search-box input')?.focus()}}>
                <Icons.Search/><span>Search</span>
            </div>
            <div className={`nav-tab ${tab==='library'?'active':''}`} onClick={()=>setTab('library')}>
                <Icons.Library/><span>Library</span>
            </div>
        </div>

        {/* PLAYER BAR */}
        <div className={`player-bar ${currentSong ? 'visible' : ''}`}>
            {currentSong && (
                <>
                    <div className="p-track">
                        <img src={getImg(currentSong.image)} alt=""/>
                        <div className="p-info">
                            <h4>{getName(currentSong)}</h4>
                            <p>{getDesc(currentSong)}</p>
                        </div>
                    </div>
                    <div className="p-center">
                        <div className="p-controls">
                            <button className="btn-control" onClick={()=>playSong(queue, qIndex-1)}><Icons.SkipBack/></button>
                            <button className="btn-play" onClick={togglePlay}>{isPlaying ? <Icons.Pause/> : <Icons.Play/>}</button>
                            <button className="btn-control" onClick={()=>playSong(queue, qIndex+1)}><Icons.SkipFwd/></button>
                        </div>
                        <div className="progress-container">
                            <span className="time-text">{Math.floor(progress/60)}:{String(Math.floor(progress%60)).padStart(2,'0')}</span>
                            <div className="progress-rail" onClick={(e)=>{
                                const w = e.currentTarget.clientWidth;
                                const x = e.nativeEvent.offsetX;
                                audioRef.current.currentTime = (x/w)*duration;
                            }}>
                                <div className="progress-fill" style={{width:`${(progress/duration)*100}%`}}></div>
                            </div>
                            <span className="time-text">{Math.floor(duration/60)}:{String(Math.floor(duration%60)).padStart(2,'0')}</span>
                        </div>
                    </div>
                    <div className="p-right">
                        <input type="range" className="volume-slider" min="0" max="1" step="0.1" value={volume} onChange={(e)=>{setVolume(e.target.value); audioRef.current.volume=e.target.value}}/>
                        <select className="quality-select" value={quality} onChange={(e)=>{setQuality(e.target.value);}}>
                            <option value="320kbps">HQ</option>
                            <option value="160kbps">SQ</option>
                        </select>
                    </div>
                </>
            )}
        </div>
    </div>
  );
}

export default App;
