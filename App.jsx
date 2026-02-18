import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import toast, { Toaster } from 'react-hot-toast';
import { auth, db } from './firebase'; 
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, addDoc, onSnapshot, query } from 'firebase/firestore';

const API_BASE = "https://saavn.sumit.co/api";

const MOODS = [
  { id: 'm1', name: 'Party', color: '#e57373', query: 'Party Hits' },
  { id: 'm2', name: 'Romance', color: '#f06292', query: 'Love Songs' },
  { id: 'm3', name: 'Sad', color: '#ba68c8', query: 'Sad Songs' },
  { id: 'm4', name: 'Workout', color: '#ffb74d', query: 'Gym Motivation' },
  { id: 'm5', name: 'Chill', color: '#4db6ac', query: 'Chill Lo-Fi' },
  { id: 'm6', name: 'Retro', color: '#7986cb', query: 'Retro Classics' },
];

const ICONS = {
  Home: () => <span>🏠</span>, Search: () => <span>🔍</span>, Library: () => <span>📚</span>,
  Play: () => <span>▶</span>, Pause: () => <span>⏸</span>, Next: () => <span>⏭</span>, Prev: () => <span>⏮</span>,
  Shuffle: () => <span>🔀</span>, Repeat: () => <span>🔁</span>, Mic: () => <span>🎤</span>, List: () => <span>📜</span>,
  Back: () => <span>⬅</span>, Logout: () => <span>🚪</span>, Plus: () => <span>➕</span>, Heart: () => <span>♥</span>
};

function App() {
  const [view, setView] = useState('loading');
  const [tab, setTab] = useState('home');
  const [user, setUser] = useState(null);
  
  // Data
  const [homeData, setHomeData] = useState({ trending: [], charts: [], newAlbums: [], radio: [], topArtists: [] });
  const [resSongs, setResSongs] = useState([]);
  const [history, setHistory] = useState([]);
  const [likedSongs, setLikedSongs] = useState([]);
  const [userPlaylists, setUserPlaylists] = useState([]);
  
  // Player
  const audioRef = useRef(new Audio());
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [queue, setQueue] = useState([]);
  const [qIndex, setQIndex] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showQueue, setShowQueue] = useState(false);
  
  // Details
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailsSongs, setDetailsSongs] = useState([]);
  const [moodPlaylists, setMoodPlaylists] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [songToAdd, setSongToAdd] = useState(null);
  
  // Helpers
  const getImg = (i) => (Array.isArray(i) ? i[i.length-1]?.url : i) || "https://via.placeholder.com/150";
  const getName = (i) => i?.name || i?.title || "Unknown";
  const getDesc = (i) => i?.primaryArtists || i?.description || "";
  const formatTime = (s) => { if(isNaN(s)) return "0:00"; const m=Math.floor(s/60), sc=Math.floor(s%60); return `${m}:${sc<10?'0'+sc:sc}`; };

  // Fetching
  const fetchHome = async () => {
    try {
      const [trend, charts, albums, artists] = await Promise.all([
        fetch(`${API_BASE}/search/songs?query=Top 50&limit=10`).then(r=>r.json()).catch(()=>({})),
        fetch(`${API_BASE}/search/playlists?query=Top Charts&limit=10`).then(r=>r.json()).catch(()=>({})),
        fetch(`${API_BASE}/search/albums?query=New&limit=10`).then(r=>r.json()).catch(()=>({})),
        fetch(`${API_BASE}/search/artists?query=Top Artists&limit=10`).then(r=>r.json()).catch(()=>({}))
      ]);
      setHomeData({
        trending: trend?.data?.results || [], charts: charts?.data?.results || [],
        newAlbums: albums?.data?.results || [], topArtists: artists?.data?.results || []
      });
      setView('app');
    } catch(e) { console.error(e); }
  };

  const playSong = (list, idx) => {
    if(!list || !list[idx]) return;
    setQueue(list); setQIndex(idx);
    const s = list[idx];
    setCurrentSong(s);
    
    // History
    const newHist = [s, ...history.filter(h => h.id !== s.id)].slice(0, 15);
    setHistory(newHist);
    if(user) updateDoc(doc(db, "users", user.uid), { history: newHist }).catch(()=>{});
    else localStorage.setItem('musiq_history', JSON.stringify(newHist));

    const url = s.downloadUrl?.[s.downloadUrl.length-1]?.url || s.downloadUrl?.[0]?.url;
    if(url) { audioRef.current.src = url; audioRef.current.play(); setIsPlaying(true); }
  };

  const togglePlay = () => {
    if(audioRef.current.paused) { audioRef.current.play(); setIsPlaying(true); } 
    else { audioRef.current.pause(); setIsPlaying(false); }
  };

  // Auth & Effects
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if(u) {
        setUser(u); fetchHome();
        const snap = await getDoc(doc(db, "users", u.uid));
        if(snap.exists()) { setHistory(snap.data().history || []); setLikedSongs(snap.data().likedSongs || []); }
        else await setDoc(doc(db, "users", u.uid), { email: u.email, history: [], likedSongs: [] });
      } else {
        setUser(null); setView('auth');
        setHistory(JSON.parse(localStorage.getItem('musiq_history') || '[]'));
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const a = audioRef.current;
    const upd = () => { setProgress(a.currentTime); setDuration(a.duration||0); };
    const end = () => { if(qIndex < queue.length-1) playSong(queue, qIndex+1); else setIsPlaying(false); };
    a.addEventListener('timeupdate', upd); a.addEventListener('ended', end);
    return () => { a.removeEventListener('timeupdate', upd); a.removeEventListener('ended', end); };
  }, [queue, qIndex]);

  // Auth UI
  const [authMode, setAuthMode] = useState('login');
  const [authInput, setAuthInput] = useState({email:'', password:''});
  
  const handleAuth = async () => {
    const toastId = toast.loading("Processing...");
    try {
        if(authMode==='signup') {
            const c = await createUserWithEmailAndPassword(auth, authInput.email, authInput.password);
            await setDoc(doc(db, "users", c.user.uid), { email: authInput.email, likedSongs: [], history: [] });
        } else { await signInWithEmailAndPassword(auth, authInput.email, authInput.password); }
        toast.success("Success!", { id: toastId });
    } catch(e) { toast.error(e.message, { id: toastId }); }
  };

  if(view === 'auth') return (
    <div className="auth-container">
      <Toaster/>
      <div className="auth-box">
        <h1 className="brand">Aura.</h1>
        <input className="auth-input" placeholder="Email" onChange={e=>setAuthInput({...authInput,email:e.target.value})}/>
        <input className="auth-input" type="password" placeholder="Password" onChange={e=>setAuthInput({...authInput,password:e.target.value})}/>
        <button className="auth-btn" onClick={handleAuth}>{authMode==='login'?'Login':'Sign Up'}</button>
        <p style={{color:'#666', marginTop:20, cursor:'pointer'}} onClick={()=>setAuthMode(authMode==='login'?'signup':'login')}>{authMode==='login'?'Create Account':'Login'}</p>
      </div>
    </div>
  );

  return (
    <div className="app-layout">
      <Toaster position="top-center" toastOptions={{style:{background:'#333', color:'#fff'}}}/>
      
      {/* Sidebar */}
      <div className="sidebar">
        <div className="brand">Aura.</div>
        <div className={`nav-item ${tab==='home'?'active':''}`} onClick={()=>setTab('home')}><Icons.Home/> Home</div>
        <div className={`nav-item ${tab==='search'?'active':''}`} onClick={()=>setTab('search')}><Icons.Search/> Search</div>
        <div className={`nav-item ${tab==='library'?'active':''}`} onClick={()=>setTab('library')}><Icons.Library/> Library</div>
        <div className={`nav-item ${tab==='profile'?'active':''}`} onClick={()=>setTab('profile')}><span style={{fontSize:'1.2rem'}}>👤</span> Profile</div>
      </div>

      {/* Content */}
      <div className="main-content">
        <div className="header">
            <div className="search-box">
                <Icons.Search/>
                <input placeholder="Search..." onChange={async(e)=>{
                    if(e.target.value.length > 2) {
                        const res = await fetch(`${API_BASE}/search/songs?query=${e.target.value}`).then(r=>r.json());
                        setResSongs(res.data?.results || []); setTab('search');
                    }
                }}/>
            </div>
            {/* UPDATED: Clicking avatar goes to Profile tab */}
            <div className="user-pill" onClick={()=>setTab('profile')}>
                <div className="avatar">{user?.email?.[0].toUpperCase()}</div>
            </div>
        </div>

        <div className="scroll-area">
            {/* --- PROFILE TAB --- */}
            {tab === 'profile' && (
                <div className="profile-view">
                    <div className="profile-header">
                        <div className="profile-avatar-large">{user?.email?.[0].toUpperCase()}</div>
                        <div className="profile-info">
                            <div className="profile-label">Profile</div>
                            <h1 className="profile-name">{user?.email.split('@')[0]}</h1>
                            
                            <div className="profile-stats">
                                <div className="stat-box">
                                    <span className="stat-num">{likedSongs.length}</span>
                                    <span className="stat-label">Liked Songs</span>
                                </div>
                                <div className="stat-box">
                                    <span className="stat-num">{history.length}</span>
                                    <span className="stat-label">Recently Played</span>
                                </div>
                            </div>

                            <button className="btn-logout" onClick={()=>signOut(auth)}>
                                <Icons.Logout/> Logout
                            </button>
                        </div>
                    </div>

                    <div className="section-header">Your Liked Songs</div>
                    <div className="grid">
                        {likedSongs.map((s, i) => (
                            <div key={s.id} className="card" onClick={()=>playSong(likedSongs, i)}>
                                <img src={getImg(s.image)} alt=""/>
                                <h3>{getName(s)}</h3>
                                <p>{getDesc(s)}</p>
                            </div>
                        ))}
                        {likedSongs.length === 0 && <div style={{color:'#666', fontStyle:'italic'}}>No liked songs yet. Go explore!</div>}
                    </div>
                </div>
            )}

            {tab === 'home' && (
                <>
                    <div className="hero">
                        <h1>{homeData.trending[0] ? getName(homeData.trending[0]) : "Trending"}</h1>
                        <button style={{padding:'10px 20px', background:'white', border:'none', borderRadius:20, marginTop:10, cursor:'pointer'}} onClick={()=>playSong(homeData.trending, 0)}>Play Now</button>
                    </div>
                    <div style={{marginBottom:20, fontSize:'1.2rem', fontWeight:700}}>Top Charts</div>
                    <div className="horizontal-scroll">
                        {homeData.charts.map(item=>(<div key={item.id} className="card"><img src={getImg(item.image)} alt=""/><h3>{getName(item)}</h3></div>))}
                    </div>
                    {history.length > 0 && (
                        <>
                            <div style={{marginBottom:20, marginTop:30, fontSize:'1.2rem', fontWeight:700}}>Recently Played</div>
                            <div className="horizontal-scroll">
                                {history.map(item=>(<div key={item.id} className="card" onClick={()=>playSong(history, history.indexOf(item))}><img src={getImg(item.image)} alt=""/><h3>{getName(item)}</h3></div>))}
                            </div>
                        </>
                    )}
                </>
            )}

            {tab === 'search' && (
                <div className="grid">
                    {resSongs.map((s,i)=>(<div key={s.id} className="card" onClick={()=>playSong(resSongs, i)}><img src={getImg(s.image)} alt=""/><h3>{getName(s)}</h3></div>))}
                </div>
            )}
        </div>
      </div>

      {/* Player */}
      {currentSong && (
        <div className="player-bar">
            {/* Mobile Progress */}
            <div className="mobile-progress-bar" style={{width: `${(progress/duration)*100}%`, display: 'none'}}></div> 
            
            <div className="p-track">
                <img src={getImg(currentSong.image)} alt=""/>
                <div className="p-info">
                    <h4 style={{margin:0}}>{getName(currentSong)}</h4>
                    <p style={{margin:0, color:'#888', fontSize:'0.8rem'}}>{getDesc(currentSong)}</p>
                </div>
            </div>
            
            <div className="p-center">
                <div className="p-controls">
                    <button className="btn-icon" onClick={()=>playSong(queue, qIndex-1)}><Icons.Prev/></button>
                    <button className="btn-play" onClick={togglePlay}>{isPlaying?<Icons.Pause/>:<Icons.Play/>}</button>
                    <button className="btn-icon" onClick={()=>playSong(queue, qIndex+1)}><Icons.Next/></button>
                </div>
                <div className="progress-container">
                    <span>{formatTime(progress)}</span>
                    <div className="progress-rail" onClick={(e)=>{const w=e.currentTarget.clientWidth; const x=e.nativeEvent.offsetX; audioRef.current.currentTime=(x/w)*duration;}}>
                        <div className="progress-fill" style={{width: `${(progress/duration)*100}%`}}></div>
                    </div>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            <div className="p-right">
                <button className="btn-icon" onClick={()=>setShowQueue(!showQueue)}><Icons.List/></button>
            </div>

            {/* Mobile Controls Hook */}
            <div className="mobile-controls" style={{display:'none'}}>
               <button className="btn-play-mobile" onClick={togglePlay}>{isPlaying ? <Icons.Pause/> : <Icons.Play/>}</button>
            </div>
        </div>
      )}

      {/* Mobile Nav */}
      <div className="bottom-nav">
        <div className={`nav-tab ${tab==='home'?'active':''}`} onClick={()=>setTab('home')}><Icons.Home/> Home</div>
        <div className={`nav-tab ${tab==='search'?'active':''}`} onClick={()=>setTab('search')}><Icons.Search/> Search</div>
        <div className={`nav-tab ${tab==='profile'?'active':''}`} onClick={()=>setTab('profile')}><span style={{fontSize:'1.2rem'}}>👤</span> Profile</div>
      </div>
    </div>
  );
}

export default App;
