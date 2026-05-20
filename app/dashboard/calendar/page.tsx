"use client"
import React, { useState, useEffect } from "react";
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, 
  Loader2, RefreshCw, CheckCircle2, AlertCircle, ExternalLink, CalendarDays,
  Plus, Search, X
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

  // Search/Filter state
  const [searchTerm, setSearchTerm] = useState("");

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSummary, setNewSummary] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newStartTime, setNewStartTime] = useState("09:00");
  const [newEndDate, setNewEndDate] = useState("");
  const [newEndTime, setNewEndTime] = useState("10:00");
  const [submitting, setSubmitting] = useState(false);

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

  // Pre-fill dates when modal opens based on selectedDate
  useEffect(() => {
    if (isAddModalOpen && selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      setNewStartDate(dateString);
      setNewEndDate(dateString);
    }
  }, [isAddModalOpen, selectedDate]);

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

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSummary || !newStartDate || !newStartTime || !newEndDate || !newEndTime) {
      alert("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const startDateTime = new Date(`${newStartDate}T${newStartTime}`).toISOString();
      const endDateTime = new Date(`${newEndDate}T${newEndTime}`).toISOString();

      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: newSummary,
          description: newDescription,
          location: newLocation,
          start: startDateTime,
          end: endDateTime
        })
      });

      const data = await res.json();
      if (res.ok) {
        setIsAddModalOpen(false);
        setNewSummary("");
        setNewDescription("");
        setNewLocation("");
        fetchEvents(true);
      } else {
        alert(data.error || "Failed to create event.");
      }
    } catch (err) {
      alert("An unexpected error occurred while saving the event.");
    } finally {
      setSubmitting(false);
    }
  };

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
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
  const totalSlots = 42;
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

  // Filter events based on search term
  const filteredEvents = events.filter(e => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      e.summary?.toLowerCase().includes(s) ||
      e.description?.toLowerCase().includes(s) ||
      e.location?.toLowerCase().includes(s)
    );
  });

  // Get events on a specific day (using filtered set)
  const getEventsForDay = (date: Date) => {
    return filteredEvents.filter(e => {
      const eventDateStr = e.start.dateTime || e.start.date;
      if (!eventDateStr) return false;
      const eventDate = new Date(eventDateStr);
      return isSameDay(eventDate, date);
    });
  };

  const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  // Next upcoming event countdown calculation
  const getNextUpcomingEvent = () => {
    const now = new Date();
    const upcoming = events
      .filter(e => {
        const startStr = e.start.dateTime || e.start.date;
        if (!startStr) return false;
        const startDate = new Date(startStr);
        return startDate > now;
      })
      .sort((a, b) => {
        const t1 = new Date(a.start.dateTime || a.start.date || 0).getTime();
        const t2 = new Date(b.start.dateTime || b.start.date || 0).getTime();
        return t1 - t2;
      });

    return upcoming[0] || null;
  };

  const nextEvent = getNextUpcomingEvent();

  const getCountdownString = (event: GoogleEvent) => {
    const startStr = event.start.dateTime || event.start.date;
    if (!startStr) return "";
    const startDate = new Date(startStr);
    const diffMs = startDate.getTime() - Date.now();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 60) {
      return `in ${diffMins} min${diffMins > 1 ? "s" : ""}`;
    }
    if (diffHours < 24) {
      return `in ${diffHours} hour${diffHours > 1 ? "s" : ""}`;
    }
    const diffDays = Math.floor(diffHours / 24);
    return `in ${diffDays} day${diffDays > 1 ? "s" : ""}`;
  };

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
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
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
        <div className="flex flex-wrap items-center gap-2.5">
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
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
          >
            <Plus size={14} />
            Add Event
          </button>
        </div>
      </div>

      {/* Next Upcoming Event Alert */}
      {nextEvent && (
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl text-white">
              <Clock size={16} />
            </div>
            <div>
              <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest block">Upcoming Sync Meeting</span>
              <span className="text-xs font-bold text-slate-800">{nextEvent.summary}</span>
              <span className="text-xs text-slate-400 font-medium ml-2">({formatEventTime(nextEvent)})</span>
            </div>
          </div>
          <span className="text-[10px] font-black text-blue-700 bg-blue-100 px-3 py-1.5 rounded-xl uppercase tracking-wider">
            {getCountdownString(nextEvent)}
          </span>
        </div>
      )}

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
                      className={`relative min-h-[55px] sm:min-h-[85px] flex flex-col items-start justify-between p-2 rounded-xl transition-all border ${
                        isSelected 
                          ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100" 
                          : isToday
                            ? "bg-blue-50 text-blue-700 border-blue-100 font-bold"
                            : isCurrentMonth
                              ? "bg-slate-50/50 hover:bg-slate-50 text-slate-800 border-slate-100"
                              : "bg-white text-slate-300 border-transparent hover:bg-slate-50/30"
                      }`}
                    >
                      <div className="w-full flex items-center justify-between">
                        <span className="text-xs font-black">{date.getDate()}</span>
                        {hasEvents && (
                          <span className={`w-1.5 h-1.5 rounded-full sm:hidden ${isSelected ? "bg-white" : "bg-blue-600"} transition-all`} />
                        )}
                      </div>

                      {/* Event Chips for Desktop */}
                      {hasEvents && (
                        <div className="w-full space-y-1 mt-1 hidden sm:block">
                          {dayEvents.slice(0, 2).map((ev) => (
                            <div 
                              key={ev.id} 
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded truncate text-left ${
                                isSelected 
                                  ? "bg-blue-700 text-white" 
                                  : "bg-blue-50 text-blue-700 border border-blue-100/50"
                              }`}
                            >
                              {ev.summary}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className={`text-[8px] font-bold px-1.5 text-left ${
                              isSelected ? "text-blue-200" : "text-slate-400"
                            }`}>
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>
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

            {/* Event Search Bar */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-bold placeholder-slate-400"
              />
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={12} />
                </button>
              )}
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
                    {searchTerm ? "No events match your search query" : "No sync events scheduled on this day"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <CalendarIcon size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Add Calendar Event</h2>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                    Will be synced directly to your Google Calendar
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl border border-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddEvent} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lead Follow-up / Client Call"
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold placeholder-slate-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Details of the event or meeting notes..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium placeholder-slate-400 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Location / Meeting Link
                </label>
                <input
                  type="text"
                  placeholder="Google Meet Link or Address"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold placeholder-slate-400"
                />
              </div>

              {/* Start Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold"
                  />
                </div>
              </div>

              {/* End Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    End Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95"
                >
                  {submitting && <Loader2 size={13} className="animate-spin" />}
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
