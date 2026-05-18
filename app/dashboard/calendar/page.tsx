"use client"
import React, { useState, useEffect } from "react";
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, 
  Loader2, RefreshCw, CheckCircle2, AlertCircle, ExternalLink, CalendarDays
} from "lucide-react";

interface GoogleEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  htmlLink?: string;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<GoogleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Month navigation state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const fetchEvents = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    
    try {
      const res = await fetch("/api/calendar");
      const data = await res.json();
      if (res.ok && data.events) {
        setEvents(data.events);
        setError(null);
      } else {
        setError(data.error || "Failed to fetch calendar events");
      }
    } catch (err) {
      setError("An unexpected error occurred while loading your calendar.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  // Get first day of the month (0 = Sunday, 1 = Monday, etc.)
  const firstDayIndex = new Date(year, month, 1).getDay();

  // Get total days in current month
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Get total days in previous month
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const days: { date: Date; isCurrentMonth: boolean; isToday: boolean }[] = [];

  // Padding days from previous month
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = prevMonthTotalDays - i;
    const d = new Date(year, month - 1, day);
    days.push({
      date: d,
      isCurrentMonth: false,
      isToday: isSameDay(d, new Date()),
    });
  }

  // Days of current month
  for (let i = 1; i <= totalDays; i++) {
    const d = new Date(year, month, i);
    days.push({
      date: d,
      isCurrentMonth: true,
      isToday: isSameDay(d, new Date()),
    });
  }

  // Padding days from next month
  const totalSlots = 42; // 6 rows of 7 days
  const nextMonthPadding = totalSlots - days.length;
  for (let i = 1; i <= nextMonthPadding; i++) {
    const d = new Date(year, month + 1, i);
    days.push({
      date: d,
      isCurrentMonth: false,
      isToday: isSameDay(d, new Date()),
    });
  }

  function isSameDay(d1: Date, d2: Date) {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  // Helper to format start/end time
  const formatEventTime = (event: GoogleEvent) => {
    if (event.start.date) {
      return "All Day";
    }
    if (event.start.dateTime) {
      const start = new Date(event.start.dateTime);
      const end = event.end.dateTime ? new Date(event.end.dateTime) : null;
      
      const formatTime = (d: Date) => {
        return d.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
      };
      
      return end 
        ? `${formatTime(start)} - ${formatTime(end)}`
        : formatTime(start);
    }
    return "";
  };

  // Get events on a specific day
  const getEventsForDay = (date: Date) => {
    return events.filter(e => {
      const eventDateStr = e.start.dateTime || e.start.date;
      if (!eventDateStr) return false;
      const eventDate = new Date(eventDateStr);
      return isSameDay(eventDate, date);
    });
  };

  const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] animate-pulse">
          Loading Calendar Events...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarIcon className="text-blue-600 w-5 h-5" />
            Google Calendar
          </h1>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">
            View and manage synchronized meetings and follow-ups
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-100 rounded-xl text-green-700">
            <CheckCircle2 size={13} className="text-green-600" />
            <span className="text-[10px] font-black uppercase tracking-wider">Sync Active</span>
          </div>
          <button
            onClick={() => fetchEvents(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all active:scale-[0.98]"
          >
            <RefreshCw size={13} className={`text-slate-500 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center bg-white border border-red-100 p-8 rounded-2xl shadow-sm text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
          <h3 className="text-slate-800 font-black text-sm uppercase tracking-wider">Google Calendar Sync Error</h3>
          <p className="text-slate-400 text-xs mt-1 max-w-md">{error}</p>
          <button
            onClick={() => fetchEvents()}
            className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-95"
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Month Card */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
            <div>
              {/* Month Header Navigation */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-black text-slate-800 tracking-tight">
                  {monthNames[month]} {year}
                </h2>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePrevMonth}
                    className="p-2 hover:bg-slate-50 rounded-xl border border-slate-100 transition-colors text-slate-600"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={handleToday}
                    className="px-3 py-2 hover:bg-slate-50 text-[10px] font-black uppercase tracking-wider rounded-xl border border-slate-100 transition-colors text-slate-600"
                  >
                    Today
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="p-2 hover:bg-slate-50 rounded-xl border border-slate-100 transition-colors text-slate-600"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 gap-2 text-center mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                  <span key={day} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {day}
                  </span>
                ))}
              </div>

              {/* Monthly Days Grid */}
              <div className="grid grid-cols-7 gap-2">
                {days.map(({ date, isCurrentMonth, isToday }, idx) => {
                  const isSelected = selectedDate && isSameDay(date, selectedDate);
                  const dayEvents = getEventsForDay(date);
                  const hasEvents = dayEvents.length > 0;

                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedDate(date)}
                      className={`relative aspect-square flex flex-col items-center justify-between p-2 rounded-xl transition-all border ${
                        isSelected 
                          ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100" 
                          : isToday
                            ? "bg-blue-50 text-blue-700 border-blue-100 font-bold"
                            : isCurrentMonth
                              ? "bg-slate-50/50 hover:bg-slate-50 text-slate-800 border-slate-100"
                              : "bg-white text-slate-300 border-transparent hover:bg-slate-50/30"
                      }`}
                    >
                      <span className="text-xs font-black">{date.getDate()}</span>
                      {hasEvents && (
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-blue-600"} transition-all`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="border-t border-slate-100 pt-4 mt-6 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <span>Total Synced Events: {events.length}</span>
              <span>Primary Calendar</span>
            </div>
          </div>

          {/* Day Event Details Column */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col">
            <div className="border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Events for
              </h3>
              <h2 className="text-base font-black text-slate-800 mt-1">
                {selectedDate?.toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric"
                })}
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[400px]">
              {selectedDayEvents.length > 0 ? (
                selectedDayEvents.map(event => (
                  <div 
                    key={event.id}
                    className="p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-slate-200 transition-all group flex flex-col justify-between h-full"
                  >
                    <div>
                      <h4 className="text-xs font-black text-slate-800 leading-snug group-hover:text-blue-600 transition-colors">
                        {event.summary}
                      </h4>
                      {event.description && (
                        <p className="text-[11px] text-slate-400 font-medium mt-1.5 line-clamp-3">
                          {event.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="mt-3 space-y-1.5 border-t border-slate-200/50 pt-2.5">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Clock size={11} className="text-slate-400" />
                        <span className="text-[10px] font-bold">{formatEventTime(event)}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <MapPin size={11} className="text-slate-400 shrink-0" />
                          <span className="text-[10px] font-bold truncate max-w-[190px]">{event.location}</span>
                        </div>
                      )}
                      {event.htmlLink && (
                        <a
                          href={event.htmlLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-2 text-blue-600 hover:text-blue-700 text-[10px] font-black uppercase tracking-wider transition-colors"
                        >
                          View in Google Calendar
                          <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CalendarDays className="w-12 h-12 text-slate-200 mb-3" />
                  <h4 className="text-slate-700 font-black text-xs uppercase tracking-wider">No Scheduled Events</h4>
                  <p className="text-slate-400 text-[10px] mt-1 max-w-[180px]">
                    No sync events scheduled on this day
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
