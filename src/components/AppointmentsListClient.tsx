"use client";

import { useState, useMemo } from "react";
import StatusBadge from "@/components/StatusBadge";
import { SearchBar } from "@/components/SearchBar";
import { Pagination } from "@/components/Pagination";

interface Appointment {
  id: string;
  firstname: string;
  lastname: string;
  student_id: string;
  course: string;
  appointment_date: string;
  purpose: string;
  status: string;
  created_at: string;
}

interface AppointmentsListClientProps {
  appointments: Appointment[];
  isAdminOrNurse: boolean;
}

const ITEMS_PER_PAGE = 10;

export default function AppointmentsListClient({ appointments, isAdminOrNurse }: AppointmentsListClientProps) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    let result = appointments;

    // Filter by status
    if (statusFilter !== "all") {
      result = result.filter((a) => a.status === statusFilter);
    }

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          `${a.firstname} ${a.lastname}`.toLowerCase().includes(q) ||
          a.student_id?.toLowerCase().includes(q) ||
          a.course?.toLowerCase().includes(q) ||
          a.purpose?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [appointments, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when search/filter changes
  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  return (
    <>
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <SearchBar value={search} onChange={handleSearch} placeholder="Search by name, ID, course, or purpose..." />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-lg text-[14px] bg-white text-gray-600 outline-none focus:border-primary cursor-pointer"
        >
          <option value="all">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Completed">Completed</option>
          <option value="Rejected">Rejected</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Results count */}
      <p className="text-[13px] text-gray-400 mb-3">
        Showing {paginated.length} of {filtered.length} appointment{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {paginated.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-[15px]">
              {appointments.length === 0 ? "No appointments found" : "No results match your search"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Student ID</th>
                  <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Course</th>
                  <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Purpose</th>
                  <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Created</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((appt) => (
                  <tr key={appt.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                    <td className="py-3 px-4 text-[14px] text-gray-700">{appt.firstname} {appt.lastname}</td>
                    <td className="py-3 px-4 text-[14px] text-gray-500">{appt.student_id || "N/A"}</td>
                    <td className="py-3 px-4 text-[14px] text-gray-500">{appt.course || "N/A"}</td>
                    <td className="py-3 px-4 text-[14px] text-gray-500">{new Date(appt.appointment_date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-[14px] text-gray-500 max-w-[200px] truncate">{appt.purpose}</td>
                    <td className="py-3 px-4"><StatusBadge status={appt.status} /></td>
                    <td className="py-3 px-4 text-[14px] text-gray-400">{new Date(appt.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </>
  );
}
