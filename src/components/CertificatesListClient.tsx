"use client";

import { useState, useMemo } from "react";
import StatusBadge from "@/components/StatusBadge";
import { SearchBar } from "@/components/SearchBar";
import { Pagination } from "@/components/Pagination";
import { DownloadIcon, XCircleIcon } from "@/components/Icons";
import { generateCertificatePDF } from "@/lib/pdf-generator";
import { useToast } from "@/components/Toast";

interface Certificate {
  id: string;
  firstname: string;
  lastname: string;
  middlename?: string;
  student_id: string;
  course?: string;
  year_level?: string;
  purpose: string;
  date_needed: string;
  status: string;
  created_at: string;
}

interface CertificatesListClientProps {
  certificates: Certificate[];
  isAdminOrNurse: boolean;
}

const ITEMS_PER_PAGE = 10;

export default function CertificatesListClient({ certificates, isAdminOrNurse }: CertificatesListClientProps) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const { addToast } = useToast();

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this certificate request?")) return;
    setCancellingId(id);
    try {
      const res = await fetch("/api/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, type: "certificate" }),
      });
      const data = await res.json();
      if (!res.ok) { addToast("error", data.error || "Failed to cancel"); setCancellingId(null); return; }
      addToast("success", "Certificate request cancelled");
      window.location.reload();
    } catch {
      addToast("error", "An unexpected error occurred");
    } finally {
      setCancellingId(null);
    }
  };

  const filtered = useMemo(() => {
    let result = certificates;

    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          `${c.firstname} ${c.lastname}`.toLowerCase().includes(q) ||
          c.student_id?.toLowerCase().includes(q) ||
          c.purpose?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [certificates, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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
          <SearchBar value={search} onChange={handleSearch} placeholder="Search by name, ID, or purpose..." />
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
        Showing {paginated.length} of {filtered.length} certificate{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {paginated.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-[15px]">
              {certificates.length === 0 ? "No certificates found" : "No results match your search"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Student ID</th>
                  <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Purpose</th>
                  <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Date Needed</th>
                  <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Created</th>
                  <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((cert) => (
                  <tr key={cert.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                    <td className="py-3 px-4 text-[14px] text-gray-700">{cert.firstname} {cert.lastname}</td>
                    <td className="py-3 px-4 text-[14px] text-gray-500">{cert.student_id || "N/A"}</td>
                    <td className="py-3 px-4 text-[14px] text-gray-500 max-w-[200px] truncate">{cert.purpose}</td>
                    <td className="py-3 px-4 text-[14px] text-gray-500">{new Date(cert.date_needed).toLocaleDateString()}</td>
                    <td className="py-3 px-4"><StatusBadge status={cert.status} /></td>
                    <td className="py-3 px-4 text-[14px] text-gray-400">{new Date(cert.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      {cert.status === "Approved" && (
                        <button
                          onClick={() => generateCertificatePDF(cert)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-[12px] font-medium border-none cursor-pointer hover:bg-primary/20 transition"
                          title="Download PDF"
                        >
                          <DownloadIcon size={14} /> PDF
                        </button>
                      )}
                      {!isAdminOrNurse && cert.status === "Pending" && (
                        <button onClick={() => handleCancel(cert.id)} disabled={cancellingId === cert.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[12px] font-medium border-none cursor-pointer hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed">
                          {cancellingId === cert.id ? <span className="inline-block w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full" style={{ animation: "spin 0.7s linear infinite" }} /> : <XCircleIcon size={14} />}
                          {cancellingId === cert.id ? "Cancelling..." : "Cancel"}
                        </button>
                      )}
                    </td>
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
