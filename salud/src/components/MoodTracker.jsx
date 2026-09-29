import React, { useState, useEffect } from 'react';
import { Smile } from 'lucide-react';
import toast from 'react-hot-toast';
import { saveMoodEntry, getMoodHistory } from '../lib/dataService';

const MOODS = [
  { id: 1, emoji: '😭', label: 'Fatal',    color: '#f7304a' },
  { id: 2, emoji: '😕', label: 'Mal',      color: '#f97316' },
  { id: 3, emoji: '😐', label: 'Normal',   color: '#f5a623' },
  { id: 4, emoji: '😊', label: 'Bien',     color: '#22d3a5' },
  { id: 5, emoji: '🤩', label: '¡Genial!', color: '#4f7dff' },
];

const todayStr = new Date().toISOString().split('T')[0];

const MoodTracker = ({ onMoodSaved }) => {
  const [selectedMood, setSelectedMood] = useState(null);
  const [history, setHistory] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const h = await getMoodHistory();
      setHistory(h);
      const todayEntry = h.find(e => e.date === todayStr);
      if (todayEntry?.mood) setSelectedMood(todayEntry.mood);
    };
    load();
  }, []);

  const handleSelect = async (moodId) => {
    if (saving) return;
    setSelectedMood(moodId);
    setSaving(true);
    await saveMoodEntry(todayStr, moodId);
    setSaving(false);

    // Update local history
    setHistory(prev => {
      const idx = prev.findIndex(e => e.date === todayStr);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], mood: moodId };
        return updated;
      }
      return [...prev, { date: todayStr, mood: moodId }];
    });

    const mood = MOODS.find(m => m.id === moodId);
    toast.success(`Ánimo guardado: ${mood.emoji} ${mood.label}`, { duration: 2000 });
    if (onMoodSaved) onMoodSaved(moodId);
  };

  const currentMoodDef = MOODS.find(m => m.id === selectedMood);

  return (
    <div className="glass-card mood-card">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Smile size={18} style={{ color: 'var(--accent-cyan)' }} />
          <h3 style={{ margin: 0, fontSize: '1rem' }}>¿Cómo estás hoy?</h3>
        </div>
        {currentMoodDef && (
          <span style={{
            fontSize: '0.8rem', fontWeight: 600,
            color: currentMoodDef.color,
            background: `${currentMoodDef.color}18`,
            border: `1px solid ${currentMoodDef.color}30`,
            padding: '2px 10px', borderRadius: 'var(--radius-full)',
          }}>
            {currentMoodDef.emoji} {currentMoodDef.label}
          </span>
        )}
      </div>

      {/* Mood Buttons */}
      <div className="mood-options">
        {MOODS.map(mood => (
          <button
            key={mood.id}
            className={`mood-btn${selectedMood === mood.id ? ' selected' : ''}`}
            onClick={() => handleSelect(mood.id)}
            title={mood.label}
            style={selectedMood === mood.id ? { borderColor: mood.color, color: mood.color, background: `${mood.color}18`, boxShadow: `0 0 20px ${mood.color}30` } : {}}
          >
            <span className="mood-emoji">{mood.emoji}</span>
            {mood.label}
          </button>
        ))}
      </div>

      {/* 14-Day History Timeline */}
      {history.length > 0 && (
        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Últimos 14 días
          </p>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end' }}>
            {history.map((entry, i) => {
              const mood = MOODS.find(m => m.id === entry.mood);
              const isToday = entry.date === todayStr;
              return (
                <div
                  key={entry.date}
                  title={`${entry.date}: ${mood ? mood.label : 'Sin registro'}`}
                  style={{
                    flex: 1,
                    height: mood ? `${(mood.id / 5) * 32 + 8}px` : '8px',
                    borderRadius: '4px',
                    background: mood ? mood.color : 'rgba(255,255,255,0.06)',
                    opacity: mood ? 1 : 0.4,
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    outline: isToday ? `2px solid white` : 'none',
                    outlineOffset: '1px',
                  }}
                >
                  {isToday && mood && (
                    <span style={{
                      position: 'absolute', top: '-22px', left: '50%',
                      transform: 'translateX(-50%)', fontSize: '14px',
                    }}>
                      {mood.emoji}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MoodTracker;
