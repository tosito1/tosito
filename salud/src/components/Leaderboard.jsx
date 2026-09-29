import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Medal, AlertCircle, Search, UserPlus, UserCheck, Eye, EyeOff } from 'lucide-react';
import { getLeaderboard, searchUsers, followUser, unfollowUser, getFollowingList } from '../lib/dataService';
import { auth } from '../lib/firebase';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import toast from 'react-hot-toast';

gsap.registerPlugin(useGSAP);

const Leaderboard = () => {
  const [activeTab, setActiveTab] = useState('global');
  const [globalUsers, setGlobalUsers] = useState([]);
  const [followingIds, setFollowingIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const containerRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const dbUsers = await getLeaderboard();
    setGlobalUsers(dbUsers);
    
    if (auth.currentUser) {
      const fList = await getFollowingList();
      setFollowingIds(fList);
    }
    setLoading(false);
  };

  const handleSearch = async (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.trim().length > 2) {
      const results = await searchUsers(q);
      setSearchResults(results);
    } else {
      setSearchResults(null);
    }
  };

  const toggleFollow = async (userId, isFollowing) => {
    if (isFollowing) {
      await unfollowUser(userId);
      setFollowingIds(prev => prev.filter(id => id !== userId));
      toast.success('Dejaste de seguir a este usuario');
    } else {
      await followUser(userId);
      setFollowingIds(prev => [...prev, userId]);
      toast.success('Ahora sigues a este usuario');
    }
  };

  useGSAP(() => {
    gsap.from(".gsap-header", { y: -20, opacity: 0, duration: 0.6, stagger: 0.1, ease: "power3.out" });
  }, { scope: containerRef });

  useGSAP(() => {
    if (!loading) {
      const items = gsap.utils.toArray(".gsap-list-item", listRef.current);
      if (items.length > 0) {
        gsap.fromTo(items, {
          x: -20, opacity: 0
        }, {
          x: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: "power2.out"
        });
      }
    }
  }, { scope: listRef, dependencies: [loading, activeTab, searchResults] });

  const renderUserList = (usersList) => {
    if (usersList.length === 0) {
      return <p className="text-center" style={{ color: 'var(--text-muted)', padding: '2rem 0' }}>No se encontraron usuarios.</p>;
    }

    return usersList.map((user, index) => {
      const isCurrentUser = auth.currentUser && user.id === auth.currentUser.uid;
      const isFollowing = followingIds.includes(user.id);
      
      return (
        <div 
          key={user.id} 
          className="flex items-center justify-between gsap-list-item" 
          style={{ 
            padding: '1rem', 
            borderBottom: index < usersList.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            background: isCurrentUser ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
            borderRadius: isCurrentUser ? 'var(--radius-sm)' : '0'
          }}
        >
          <div className="flex items-center gap-4 cursor-pointer hover:opacity-80" onClick={() => navigate(`/user/${user.id}`)}>
            {activeTab === 'global' && searchResults === null && (
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold', width: '2rem', textAlign: 'center', color: index < 3 ? 'var(--accent-warning)' : 'var(--text-muted)' }}>
                {index + 1}
              </span>
            )}
            {activeTab === 'global' && searchResults === null && index === 0 && <Medal color="var(--accent-warning)" size={20} />}
            
            <div className="flex-col">
              <span style={{ fontWeight: isCurrentUser ? 'bold' : 'normal', color: isCurrentUser ? 'var(--accent-primary)' : 'var(--text-main)' }}>
                {user.name}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {user.publicProfile ? <><Eye size={12} /> Perfil Público</> : <><EyeOff size={12} /> Perfil Privado</>}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <h3 style={{ margin: 0, color: user.score > 70 ? 'var(--accent-success)' : (user.score > 40 ? 'var(--accent-warning)' : 'var(--accent-danger)') }}>
              {Math.round(user.score)} pts
            </h3>
            
            {!isCurrentUser && auth.currentUser && (
              <button 
                onClick={() => toggleFollow(user.id, isFollowing)}
                className="btn-icon" 
                style={{ 
                  background: isFollowing ? 'rgba(255,255,255,0.1)' : 'var(--accent-primary)',
                  color: '#fff', padding: '0.5rem', borderRadius: '50%' 
                }}
                title={isFollowing ? 'Dejar de seguir' : 'Seguir'}
              >
                {isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
              </button>
            )}
          </div>
        </div>
      );
    });
  };

  const getDisplayedUsers = () => {
    if (searchResults !== null) return searchResults;
    if (activeTab === 'global') return globalUsers;
    
    // Friends tab logic
    return globalUsers.filter(u => followingIds.includes(u.id));
  };

  return (
    <div ref={containerRef} className="flex-col gap-6" style={{ maxWidth: '800px', margin: '0 auto', width: '100%', paddingBottom: '3rem' }}>
      
      <div className="flex justify-between items-center gsap-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className="flex items-center gap-2 m-0"><Trophy className="text-gradient" /> Ranking</h1>
        
        {/* Search Bar */}
        <div className="flex items-center" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 1rem' }}>
          <Search size={18} color="var(--text-muted)" style={{ marginRight: '8px' }} />
          <input 
            type="text" 
            placeholder="Buscar usuarios..." 
            value={searchQuery}
            onChange={handleSearch}
            style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', width: '200px' }}
          />
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex gsap-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <button 
          onClick={() => { setActiveTab('global'); setSearchQuery(''); setSearchResults(null); }}
          style={{ flex: 1, padding: '1rem', background: 'transparent', border: 'none', borderBottom: activeTab === 'global' ? '2px solid var(--accent-primary)' : '2px solid transparent', color: activeTab === 'global' ? 'var(--accent-primary)' : 'var(--text-muted)', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          🌍 Global
        </button>
        <button 
          onClick={() => { setActiveTab('friends'); setSearchQuery(''); setSearchResults(null); }}
          style={{ flex: 1, padding: '1rem', background: 'transparent', border: 'none', borderBottom: activeTab === 'friends' ? '2px solid var(--accent-primary)' : '2px solid transparent', color: activeTab === 'friends' ? 'var(--accent-primary)' : 'var(--text-muted)', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          👥 Siguiendo
        </button>
      </div>

      {!auth.currentUser && (
        <div className="glass-card flex items-center gap-4 gsap-header" style={{ background: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
          <AlertCircle color="var(--accent-warning)" />
          <div>
            <p style={{ margin: 0 }}>Para aparecer en el ranking y seguir a tus amigos necesitas <Link to="/auth" style={{ color: 'var(--accent-primary)' }}>iniciar sesión</Link>.</p>
          </div>
        </div>
      )}

      <div className="glass-card" ref={listRef}>
        {loading ? (
          <p className="text-center" style={{ color: 'var(--text-muted)', padding: '2rem 0' }}>Cargando datos sociales...</p>
        ) : (
          renderUserList(getDisplayedUsers())
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
