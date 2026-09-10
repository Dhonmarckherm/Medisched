"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/Icons";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function CalendarPage() {
  const [user, setUser] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      const { data: dbUser } = await supabase.from("users").select("*").eq("auth_id", authUser.id).single();
      setUser(dbUser);

      const isAdminOrNurse = dbUser?.role === "admin" || dbUser?.role === "nurse";
      let query = supabase.from("appointments").select("*").order("appointment_date", { ascending: true });
      if (!isAdminOrNurse) query = query.eq("user_id", dbUser.id);
      const { data } = await query;
      setAppointments(data || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [year, month]);

  const getAppointmentsForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return appointments.filter((a) => a.appointment_date === dateStr);
  };

  const selectedAppts = useMemo(() => {
    if (!selectedDate) return [];
    return appointments.filter((a) => a.appointment_date === selectedDate);
  }, [selectedDate, appointments]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => {
    setCurrentDate(new Date());
    const today = new Date();
    setSelectedDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`);
  };

  const todayStr = (() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  })();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8faf9" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 text-[14px]">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#f8faf9" }}>
      <Navbar user={user} />
      <main className="pt-[100px] pb-10 w-[90%] max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[28px] font-bold text-[#1a1a2e]">Appointment Calendar</h1>
          <p className="text-gray-400 text-[14px] mt-1">Visual overview of all scheduled appointments</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 overflow-hidden">
            {/* Calendar Navigation */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <button onClick={prevMonth} className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center bg-white cursor-pointer hover:bg-gray-50 transition">
                <ChevronLeftIcon size={18} className="text-gray-500" />
              </button>
              <div className="flex items-center gap-3">
                <h2 className="text-[18px] font-bold text-[#1a1a2e]">
                  {MONTHS[month]} {year}
                </h2>
                <button onClick={goToday} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[12px] font-medium border-none cursor-pointer hover:bg-primary/20 transition">
                  Today
                </button>
              </div>
              <button onClick={nextMonth} className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center bg-white cursor-pointer hover:bg-gray-50 transition">
                <ChevronRightIcon size={18} className="text-gray-500" />
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-gray-100">
              {DAYS.map((d) => (
                <div key={d} className="py-3 text-center text-[12px] font-semibold text-gray-400 uppercase tracking-wide">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="min-h-[80px] border-b border-r border-gray-50 bg-gray-50/30" />;
                }
                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const dayAppts = getAppointmentsForDate(day);
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;

                return (
                  <div
                    key={day}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`min-h-[80px] border-b border-r border-gray-50 p-1.5 cursor-pointer transition-all duration-150 ${
                      isSelected ? "bg-primary/5 ring-2 ring-primary/30 ring-inset" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className={`w-7 h-7 flex items-center justify-center rounded-full text-[13px] font-medium mb-0.5 ${
                      isToday ? "bg-primary text-white" : "text-gray-600"
                    }`}>
                      {day}
                    </div>
                    {dayAppts.length > 0 && (
                      <div className="space-y-0.5">
                        {dayAppts.slice(0, 2).map((a) => (
                          <div
                            key={a.id}
                            className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium ${
                              a.status === "Approved" ? "bg-emerald-100 text-emerald-700" :
                              a.status === "Rejected" ? "bg-red-100 text-red-700" :
                              "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {a.firstname} {a.lastname?.charAt(0)}.
                          </div>
                        ))}
                        {dayAppts.length > 2 && (
                          <div className="text-[10px] text-gray-400 font-medium px-1.5">
                            +{dayAppts.length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Date Details */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden h-fit">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-[15px] font-semibold text-[#1a1a2e] flex items-center gap-2">
                <CalendarIcon size={18} className="text-primary" />
                {selectedDate ? new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : "Select a date"}
              </h3>
            </div>
            <div className="p-5">
              {!selectedDate ? (
                <div className="text-center py-8">
                  <CalendarIcon className="text-gray-200 mx-auto mb-3" size={40} />
                  <p className="text-gray-400 text-[13px]">Click a date to view appointments</p>
                </div>
              ) : selectedAppts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-[13px]">No appointments on this date</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedAppts.map((appt) => (
                    <div key={appt.id} className="p-3 rounded-xl border border-gray-100 hover:border-primary/20 transition">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-[14px] font-semibold text-[#1a1a2e]">
                          {appt.firstname} {appt.lastname}
                        </p>
                        <StatusBadge status={appt.status} />
                      </div>
                      <div className="space-y-1 text-[12px] text-gray-500">
                        <p><span className="font-medium text-gray-600">ID:</span> {appt.student_id}</p>
                        <p><span className="font-medium text-gray-600">Course:</span> {appt.course || "N/A"} {appt.year_level ? `- ${appt.year_level}` : ""}</p>
                        <p><span className="font-medium text-gray-600">Purpose:</span> {appt.purpose}</p>
                        {appt.remarks && (
                          <p><span className="font-medium text-gray-600">Remarks:</span> {appt.remarks}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
