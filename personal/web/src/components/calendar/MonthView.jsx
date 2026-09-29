import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './MonthView.module.css';

const MonthView = ({ selectedDate, onDateSelect, events = [] }) => {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  const daysHeader = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const monthKey = currentMonth.toISOString().slice(0, 7);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const getEventsForDay = (day) => events.filter(e => isSameDay(new Date(e.date), day));

  return (
    <div className={styles.container}>
      <motion.header
        className={styles.header}
        layout
      >
        <h2>{format(currentMonth, 'MMMM yyyy', { locale: es })}</h2>
        <div className={styles.nav}>
          <motion.button
            onClick={prevMonth}
            className="btn-icon"
            whileHover={{ scale: 1.1, x: -2 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronLeft size={18} />
          </motion.button>
          <motion.button
            onClick={() => setCurrentMonth(new Date())}
            className="btn btn-secondary"
            style={{ padding: '6px 14px', fontSize: '0.8125rem' }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            Hoy
          </motion.button>
          <motion.button
            onClick={nextMonth}
            className="btn-icon"
            whileHover={{ scale: 1.1, x: 2 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronRight size={18} />
          </motion.button>
        </div>
      </motion.header>

      {/* Day-of-week labels */}
      <div className={styles.grid}>
        {daysHeader.map(day => (
          <div key={day} className={styles.dayHeader}>{day}</div>
        ))}

        {/* Calendar cells with stagger wave per month change */}
        <AnimatePresence mode="wait">
          <motion.div
            key={monthKey}
            style={{ display: 'contents' }}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            {calendarDays.map((day, i) => {
              const dayEvents = getEventsForDay(day);
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isToday = isSameDay(day, new Date());

              return (
                <motion.div
                  key={day.toISOString()}
                  className={`${styles.cell} ${!isCurrentMonth ? styles.disabled : ''} ${isSelected ? styles.selected : ''} ${isToday ? styles.today : ''}`}
                  onClick={() => isCurrentMonth && onDateSelect(day)}
                  variants={{
                    hidden: { opacity: 0, scale: 0.88 },
                    show: {
                      opacity: 1,
                      scale: 1,
                      transition: {
                        duration: 0.35,
                        delay: i * 0.012,
                        ease: [0.34, 1.56, 0.64, 1],
                      },
                    },
                    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.15 } },
                  }}
                  whileHover={isCurrentMonth ? { scale: 1.06, zIndex: 10 } : {}}
                  whileTap={isCurrentMonth ? { scale: 0.95 } : {}}
                  layout
                >
                  <motion.span
                    className={styles.dayNumber}
                    animate={isToday
                      ? { boxShadow: ['0 0 0px rgba(129,140,248,0)', '0 0 14px rgba(129,140,248,0.5)', '0 0 0px rgba(129,140,248,0)'] }
                      : {}
                    }
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    {format(day, 'd')}
                  </motion.span>

                  <div className={styles.eventDots}>
                    {dayEvents.slice(0, 3).map((e, idx) => (
                      <motion.span
                        key={idx}
                        className={styles.dot}
                        style={{ backgroundColor: e.category.color || 'var(--accent-primary)' }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3 + idx * 0.05, type: 'spring', stiffness: 400 }}
                      />
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MonthView;
