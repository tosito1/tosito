import React, { useState } from 'react';
import MonthView from '../components/calendar/MonthView';
import TimelineView from '../components/calendar/TimelineView';
import { useAppContext } from '../context/AppContext';
import { isSameDay, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, CalendarDays, Clock, MapPin } from 'lucide-react';

const Calendar = () => {
  const { calendarEvents, scheduleBlocks } = useAppContext();
  const [activeTab, setActiveTab] = useState('month');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const dayEvents = calendarEvents.filter(e => isSameDay(new Date(e.date), selectedDate));

  return (
    <div style={{ maxWidth: 'var(--content-max-width)', margin: '0 auto', paddingBottom: 'var(--space-8)' }}>

      {/* Header */}
      <header className="animate-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-8)' }}>
        <div>
          <h1 className="page-header__title">Calendario</h1>
          <p className="page-header__subtitle">Organiza tu tiempo de forma inteligente</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
          <div className="tab-group">
            <button className={`tab-item ${activeTab === 'month' ? 'active' : ''}`} onClick={() => setActiveTab('month')}>
              <CalendarDays size={15} /> Mes
            </button>
            <button className={`tab-item ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => setActiveTab('timeline')}>
              <Clock size={15} /> Horario
            </button>
          </div>
          <button className="btn btn-primary" style={{ padding: '9px 16px', fontSize: '0.8125rem' }}>
            <Plus size={16} /> Evento
          </button>
        </div>
      </header>

      {activeTab === 'month' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-5)', alignItems: 'start' }}>

          {/* Calendar grid */}
          <div className="animate-in">
            <MonthView
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              events={calendarEvents}
            />
          </div>

          {/* Day detail sidebar */}
          <aside className="animate-in animate-in-delay-1">
            <div className="card" style={{ padding: 'var(--space-5)' }}>
              <div style={{ marginBottom: 'var(--space-5)' }}>
                <p className="text-caption">Seleccionado</p>
                <h3 style={{ marginTop: 'var(--space-1)', textTransform: 'capitalize' }}>
                  {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
                </h3>
              </div>
              <hr className="divider" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {dayEvents.length > 0 ? dayEvents.map(event => (
                  <div
                    key={event.id}
                    className="card card-interactive"
                    style={{
                      padding: 'var(--space-4)',
                      borderLeft: `3px solid ${event.category.color}`,
                      background: 'var(--bg-tertiary)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: event.category.color }}>
                        {event.category.emoji} {event.category.label}
                      </span>
                      <span className="badge badge-ghost" style={{ fontSize: '0.65rem' }}>{event.priority.label}</span>
                    </div>
                    <h4 style={{ marginTop: 'var(--space-2)', fontSize: '0.9375rem' }}>{event.title}</h4>
                    <p style={{ fontSize: '0.8125rem', marginTop: 4 }}>{event.description}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 'var(--space-3)' }}>
                      <Clock size={13} color="var(--text-muted)" />
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {event.startTime} — {event.endTime}
                      </span>
                    </div>
                  </div>
                )) : (
                  <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                    <CalendarDays size={28} className="empty-state__icon" style={{ margin: '0 auto var(--space-3)', opacity: 0.2 }} />
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Sin eventos este día</p>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      ) : (
        <div className="animate-in">
          <TimelineView
            selectedDate={selectedDate}
            events={calendarEvents}
            scheduleBlocks={scheduleBlocks}
          />
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          div[style*="gridTemplateColumns: 1fr 340px"] {
            display: flex !important;
            flex-direction: column !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Calendar;
