import React from 'react';
import { motion } from 'framer-motion';
import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import styles from './TimelineView.module.css';

const TimelineView = ({ selectedDate, events = [], scheduleBlocks = [] }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const dayOfWeek = selectedDate.getDay() === 0 ? 7 : selectedDate.getDay();
  const dayBlocks = scheduleBlocks.filter(b => b.daysOfWeek.includes(dayOfWeek));
  const dayEvents = events.filter(e => isSameDay(new Date(e.date), selectedDate));

  const timeToMinutes = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const getPx = (timeStr) => (timeToMinutes(timeStr) / 60) * 100;
  const getDurationPx = (s, e) => ((timeToMinutes(e) - timeToMinutes(s)) / 60) * 100;

  // Current time indicator
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentPx = (currentMinutes / 60) * 100;

  return (
    <div className={styles.container}>
      <motion.header
        className={styles.header}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <h3>{format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}</h3>
      </motion.header>

      <div className={styles.timelineWrapper}>
        <div className={styles.hoursColumn}>
          {hours.map(h => (
            <div key={h} className={styles.hourLabel}>
              {format(new Date().setHours(h, 0), 'HH:mm')}
            </div>
          ))}
        </div>

        <div className={styles.eventsGrid}>
          {hours.map(h => (
            <div key={h} className={styles.gridLine} />
          ))}

          {/* Current time line */}
          {isSameDay(now, selectedDate) && (
            <motion.div
              style={{
                position: 'absolute',
                left: 0, right: 0,
                top: currentPx,
                height: 2,
                background: 'var(--danger)',
                zIndex: 20,
                display: 'flex',
                alignItems: 'center',
              }}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: 'var(--danger)',
                  marginLeft: -5,
                  boxShadow: '0 0 8px var(--danger)',
                }}
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
          )}

          {/* Schedule blocks */}
          {dayBlocks.map((block, i) => (
            <motion.div
              key={block.id}
              className={styles.block}
              style={{
                top: `${getPx(block.startTime)}px`,
                height: `${getDurationPx(block.startTime, block.endTime)}px`,
                backgroundColor: `${block.color}18`,
                borderLeftColor: block.color,
              }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className={styles.blockLabel}>{block.title}</span>
            </motion.div>
          ))}

          {/* Events */}
          {dayEvents.map((event, i) => (
            <motion.div
              key={event.id}
              className={styles.event}
              style={{
                top: `${getPx(event.startTime)}px`,
                height: `${getDurationPx(event.startTime, event.endTime)}px`,
                borderLeftColor: event.category.color || 'var(--accent-primary)',
              }}
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 + i * 0.1, type: 'spring', stiffness: 200 }}
              whileHover={{ scale: 1.02, zIndex: 20, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
            >
              <div className={styles.eventContent}>
                <span className={styles.eventTime}>{event.startTime} - {event.endTime}</span>
                <span className={styles.eventTitle}>{event.title}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimelineView;
