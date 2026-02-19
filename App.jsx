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
  Radio: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></svg>,
  Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
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
  
  // Auth
  const [authMode, setAuthMode] = useState('login');
  const [authInput, setAuthInput] = useState({ email: '', password: '' });

  // Helpers
  const getImg = (i) => { if(Array.isArray(i)) return i[i.length-1]?.url || i[0]?.url; return i || "https://via.placeholder.com/150"; }
  const getName = (i) => i?.name || i?.title || "Unknown";
  const getDesc = (i) => i?.primaryArtists || i?.description || "";
  const formatTime = (s) => { if(isNaN(s)) return "0:00"; const m=Math.floor(s/60), sc=Math.floor(s%60); return `${m}:${sc<10?'0'+sc:sc}`; };

  // Fetching
  const fetchHome = async () => {
    try {
      const [trend, charts, albums, artists] = await Promise.all([
        fetch(`${API_BASE}/search/songs?query=Top 50&limit=15`).then(r=>r.json()).catch(()=>({})),
        fetch(`${API_BASE}/search/playlists?query=Top Charts&limit=15`).then(r=>r.json()).catch(()=>({})),
        fetch(`${API_BASE}/search/albums?query=New&limit=15`).then(r=>r.json()).catch(()=>({})),
        fetch(`${API_BASE}/search/artists?query=Top Artists&limit=15`).then(r=>r.json()).catch(()=>({}))
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

  const handleSeek = (e) => {
    const w = e.currentTarget.clientWidth;
    const x = e.nativeEvent.offsetX;
    const seekTo = (x / w) * duration;
    audioRef.current.currentTime = seekTo;
    setProgress(seekTo);
  };

  const toggleShuffle = () => { toast('Shuffle On'); };
  const toggleRepeat = () => { toast('Repeat All'); };

  const handleCardClick = async (item, type) => {
    if (type === 'song') { playSong([item], 0); }
    else if (type === 'playlist_custom') { setSelectedItem(item); setTab('details'); setDetailsSongs(item.songs || []); }
    else if (type === 'mood') {
        setTab('mood'); setSelectedItem(item);
        const res = await fetch(`${API_BASE}/search/playlists?query=${encodeURIComponent(item.query)}`).then(r=>r.json());
        setMoodPlaylists(res?.data?.results || []);
    }
    else {
      setSelectedItem(item); setTab('details'); setDetailsSongs([]);
      let url = type === 'album' ? `${API_BASE}/albums?id=${item.id}` : type === 'artist' ? `${API_BASE}/artists?id=${item.id}` : `${API_BASE}/playlists?id=${item.id}`;
      const res = await fetch(url).then(r=>r.json());
      setDetailsSongs(res.data?.songs || res.data?.topSongs || []);
    }
  };

  const doSearch = async () => {
    if(!searchQuery) return;
    setTab('search');
    const res = await fetch(`${API_BASE}/search/songs?query=${encodeURIComponent(searchQuery)}`).then(r=>r.json());
    setResSongs(res?.data?.results || []);
  };

  const toggleLike = async (item) => {
    if(!user) return toast.error("Please Login");
    const liked = isLiked(item.id);
    const userRef = doc(db, "users", user.uid);
    if(liked) {
        setLikedSongs(likedSongs.filter(s=>String(s.id)!==String(item.id)));
        await updateDoc(userRef, { likedSongs: arrayRemove(item) });
    } else {
        const clean = { id: String(item.id), name: getName(item), primaryArtists: getDesc(item), image: item.image||[], downloadUrl: item.downloadUrl||[], duration: item.duration||0 };
        setLikedSongs([...likedSongs, clean]);
        await updateDoc(userRef, { likedSongs: arrayUnion(clean) });
    }
  };

  // Auth & Effects
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if(u) {
        setUser(u); setView('app'); fetchHome();
        try {
            const snap = await getDoc(doc(db, "users", u.uid));
            if(snap.exists()) { setHistory(snap.data().history || []); setLikedSongs(snap.data().likedSongs || []); }
            else await setDoc(doc(db, "users", u.uid), { email: u.email, history: [], likedSongs: [] });
            const q = query(collection(db, `users/${u.uid}/playlists`));
            onSnapshot(q, (snapshot) => setUserPlaylists(snapshot.docs.map(d => ({id: d.id, ...d.data()}))));
        } catch {}
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

  const handleAuth = async () => {
    try {
        if(authMode==='signup') {
            const c = await createUserWithEmailAndPassword(auth, authInput.email, authInput.password);
            await setDoc(doc(db, "users", c.user.uid), { email: authInput.email, likedSongs: [], history: [] });
        } else { await signInWithEmailAndPassword(auth, authInput.email, authInput.password); }
    } catch(e) { toast.error(e.message); }
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
        <div className={`nav-item ${tab==='profile'?'active':''}`} onClick={()=>setTab('profile')}>👤 Profile</div>
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
            <div className="user-pill" onClick={()=>setTab('profile')}>
                <div className="avatar">{user?.email?.[0].toUpperCase()}</div>
            </div>
        </div>

        <div className="scroll-area">
            {tab === 'profile' && (
                <div className="profile-view">
                    <div className="profile-header">
                        <div className="profile-avatar-large">{user?.email?.[0].toUpperCase()}</div>
                        <div>
                            <h1>{user?.email.split('@')[0]}</h1>
                            <button className="btn-logout" onClick={()=>signOut(auth)}>Logout</button>
                        </div>
                    </div>
                    <div className="section-header">Your Library ({likedSongs.length})</div>
                    <div className="grid">
                        {likedSongs.map((s, i) => (
                            <div key={s.id} className="card" onClick={()=>playSong(likedSongs, i)}>
                                <img src={getImg(s.image)} alt=""/>
                                <h3>{getName(s)}</h3>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {tab === 'home' && (
                <>
                    <div className="hero">
                        <h1>{homeData.trending[0] ? getName(homeData.trending[0]) : "Trending"}</h1>
                        <button style={{padding:'10px 20px', background:'white', border:'none', borderRadius:20, marginTop:10, cursor:'pointer'}} onClick={()=>playSong(homeData.trending, 0)}>Play Now</button>
                    </div>
                    
                    <div className="section-header">Moods</div>
                    <div className="horizontal-scroll">
                        {MOODS.map(m=><div key={m.id} className="card" style={{background:m.color, minWidth:160, display:'flex', alignItems:'center', justifyContent:'center'}} onClick={()=>handleCardClick(m, 'mood')}><h3>{m.name}</h3></div>)}
                    </div>

                    <div className="section-header" style={{marginTop:30}}>Top Charts</div>
                    <div className="horizontal-scroll">
                        {homeData.charts.map(item=>(<div key={item.id} className="card" onClick={()=>handleCardClick(item, 'playlist')}><img src={getImg(item.image)} alt=""/><h3>{getName(item)}</h3></div>))}
                    </div>

                    <div className="section-header" style={{marginTop:30}}>Top Artists</div>
                    <div className="horizontal-scroll">
                        {homeData.topArtists.map(item=>(<div key={item.id} className="card" onClick={()=>handleCardClick(item, 'artist')}><img src={getImg(item.image)} style={{borderRadius:'50%'}} alt=""/><h3>{getName(item)}</h3></div>))}
                    </div>
                </>
            )}

            {tab === 'search' && (
                <div className="grid">
                    {resSongs.map((s,i)=>(<div key={s.id} className="card" onClick={()=>playSong(resSongs, i)}><img src={getImg(s.image)} alt=""/><h3>{getName(s)}</h3></div>))}
                </div>
            )}

            {(tab === 'details' || tab === 'mood') && selectedItem && (
                <div className="details-view">
                    <button className="btn-back" onClick={()=>setTab('home')}><Icons.Back/> Back</button>
                    <div style={{marginBottom:30}}>
                        <h1>{selectedItem.name}</h1>
                        <button className="btn-play" style={{width:'auto', padding:'10px 30px', borderRadius:30}} onClick={()=>playSong(tab==='mood'?moodPlaylists:detailsSongs, 0)}>Play All</button>
                    </div>
                    <div className="track-list">
                        {(tab==='mood'?moodPlaylists:detailsSongs).map((s,i)=>(
                            <div key={i} className="track-row" onClick={tab==='mood' ? ()=>handleCardClick(s, 'playlist') : ()=>playSong(detailsSongs, i)}>
                                <img src={getImg(s.image)} alt=""/>
                                <div style={{flex:1}}>
                                    <div style={{fontWeight:'bold'}}>{getName(s)}</div>
                                    <div style={{color:'#888', fontSize:'0.8rem'}}>{getDesc(s)}</div>
                                </div>
                                <button className={`icon-action ${isLiked(s.id)?'liked':''}`} onClick={(e)=>{e.stopPropagation(); toggleLike(s)}}><Icons.Heart/></button>
                            </div>
                        ))}
                    </div>
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
        <div className={`nav-tab ${tab==='profile'?'active':''}`} onClick={()=>setTab('profile')}>👤 Profile</div>
      </div>
    </div>
  );
}

export default App;
