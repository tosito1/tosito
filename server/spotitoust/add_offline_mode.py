import re

def main():
    with open('src/App.jsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Imports
    import_lucide_old = r"ArrowLeft, Tv, ChevronDown, ChevronLeft, ChevronRight, ListMusic, ListPlus, MoreHorizontal, Plus, Music, Menu, Sparkles, Clock, Shuffle, User\n\} from 'lucide-react';"
    import_lucide_new = """ArrowLeft, Tv, ChevronDown, ChevronLeft, ChevronRight, ListMusic, ListPlus, MoreHorizontal, Plus, Music, Menu, Sparkles, Clock, Shuffle, User, Download, CheckCircle, Loader
} from 'lucide-react';
import localforage from 'localforage';"""
    content = re.sub(import_lucide_old, import_lucide_new, content)

    # 2. Add state downloadedTracks and downloadingTracks inside App component
    state_injection = """  const [customUser, setCustomUser] = useState(null);
  const [downloadedTracks, setDownloadedTracks] = useState(new Set());
  const [downloadingTracks, setDownloadingTracks] = useState(new Set());

  // Init localforage downloaded tracks
  useEffect(() => {
    localforage.keys().then(keys => {
      const trackIds = keys.filter(k => k.startsWith('track_')).map(k => k.replace('track_', ''));
      setDownloadedTracks(new Set(trackIds));
    }).catch(e => console.error("Error loading localforage keys:", e));
  }, []);

  const downloadTrack = async (e, track) => {
    e.stopPropagation();
    if (downloadedTracks.has(track.id)) return; // already downloaded
    
    setDownloadingTracks(prev => new Set(prev).add(track.id));
    showNotification(`Descargando "${track.title}"...`);
    
    try {
      const freeStreamUrl = await resolveFreeAudioStream(track.title, track.artist);
      const response = await fetch(freeStreamUrl);
      if (!response.ok) throw new Error("Failed to fetch audio blob");
      const blob = await response.blob();
      
      await localforage.setItem(`track_${track.id}`, blob);
      
      setDownloadedTracks(prev => {
        const next = new Set(prev);
        next.add(track.id);
        return next;
      });
      showNotification(`"${track.title}" guardada para modo offline`);
    } catch (err) {
      console.error("Error downloading track:", err);
      showNotification(`Error al descargar "${track.title}"`);
    } finally {
      setDownloadingTracks(prev => {
        const next = new Set(prev);
        next.delete(track.id);
        return next;
      });
    }
  };"""
    content = content.replace("  const [customUser, setCustomUser] = useState(null);", state_injection)

    # 3. Update playTrack to check offline cache
    playtrack_old = """  try {
    const freeStreamUrl = await resolveFreeAudioStream(track.title, track.artist);
    audioRef.current.src = freeStreamUrl;
    await audioRef.current.play();
    setIsPlaying(true);
  } catch (e) {"""
    
    playtrack_new = """  try {
    // Check if downloaded in localforage
    const cachedBlob = await localforage.getItem(`track_${track.id}`);
    if (cachedBlob) {
      const objectUrl = URL.createObjectURL(cachedBlob);
      audioRef.current.src = objectUrl;
      await audioRef.current.play();
      setIsPlaying(true);
      showNotification("Reproduciendo archivo local (Offline)");
      setIsResolvingAudio(false);
      return;
    }

    const freeStreamUrl = await resolveFreeAudioStream(track.title, track.artist);
    audioRef.current.src = freeStreamUrl;
    await audioRef.current.play();
    setIsPlaying(true);
  } catch (e) {"""
    content = content.replace(playtrack_old, playtrack_new)

    # 4. Add download button to TrackList
    # Note: TrackList is defined inside App (which has access to downloadTrack, downloadedTracks, downloadingTracks)
    tracklist_old = """                <button onClick={(e)=> handleContextMenu(e, track)} className="p-3 text-gray-400 hover:text-white
                    md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="w-5 h-5" />
                </button>
            </div>
            );"""
            
    tracklist_new = """                <div className="flex items-center md:opacity-0 group-hover:opacity-100 transition-opacity">
                    {downloadedTracks.has(track.id) ? (
                        <div className="p-3 text-[#1db954]" title="Descargado">
                            <CheckCircle className="w-5 h-5 fill-[#1db954] text-black" />
                        </div>
                    ) : downloadingTracks.has(track.id) ? (
                        <div className="p-3 text-[#1db954]">
                            <Loader className="w-5 h-5 animate-spin" />
                        </div>
                    ) : (
                        <button onClick={(e) => downloadTrack(e, track)} className="p-3 text-gray-400 hover:text-white" title="Descargar">
                            <Download className="w-5 h-5" />
                        </button>
                    )}
                    <button onClick={(e)=> handleContextMenu(e, track)} className="p-3 text-gray-400 hover:text-white">
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                </div>
            </div>
            );"""
    content = content.replace(tracklist_old, tracklist_new)

    with open('src/App.jsx', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    main()
