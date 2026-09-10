import jsPDF from "jspdf";

export function generateCertificatePDF(cert: {
  firstname: string;
  lastname: string;
  middlename?: string;
  student_id: string;
  course?: string;
  year_level?: string;
  purpose: string;
  date_needed: string;
  created_at: string;
}) {
  const doc = new jsPDF("landscape", "mm", "a4");
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // Background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, width, height, "F");

  // Border
  doc.setDrawColor(46, 139, 87);
  doc.setLineWidth(3);
  doc.rect(10, 10, width - 20, height - 20);

  // Inner border
  doc.setDrawColor(46, 139, 87, 0.3);
  doc.setLineWidth(0.5);
  doc.rect(14, 14, width - 28, height - 28);

  // Header decoration line
  doc.setDrawColor(46, 139, 87);
  doc.setLineWidth(1);
  doc.line(60, 55, width - 60, 55);

  // Institution name
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text("ISPSC - Medical Clinic", width / 2, 38, { align: "center" });

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(32);
  doc.setTextColor(46, 139, 87);
  doc.text("MEDISCHED CERT", width / 2, 50, { align: "center" });

  // Certificate label
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(26, 26, 46);
  doc.text("CERTIFICATION", width / 2, 75, { align: "center" });

  // Body text
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  doc.text("This is to certify that", width / 2, 100, { align: "center" });

  // Student name
  const fullName = cert.middlename
    ? `${cert.lastname}, ${cert.firstname} ${cert.middlename}`
    : `${cert.lastname}, ${cert.firstname}`;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(26, 26, 46);
  doc.text(fullName.toUpperCase(), width / 2, 115, { align: "center" });

  // Underline for name
  const nameWidth = doc.getTextWidth(fullName.toUpperCase());
  doc.setDrawColor(46, 139, 87);
  doc.setLineWidth(0.5);
  doc.line((width - nameWidth) / 2 - 5, 118, (width + nameWidth) / 2 + 5, 118);

  // Details
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);

  const details = [
    `Student ID: ${cert.student_id}`,
    cert.course ? `Course: ${cert.course}${cert.year_level ? ` - ${cert.year_level}` : ""}` : "",
    `Purpose: ${cert.purpose}`,
  ].filter(Boolean);

  let y = 135;
  details.forEach((line) => {
    doc.text(line, width / 2, y, { align: "center" });
    y += 8;
  });

  // Certification statement
  doc.setFont("helvetica", "italic");
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `This certificate is issued upon request of the above-named student for whatever`,
    width / 2,
    y + 10,
    { align: "center" }
  );
  doc.text("legal purpose it may serve.", width / 2, y + 18, { align: "center" });

  // Date issued
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  const issuedDate = new Date(cert.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text(`Issued: ${issuedDate}`, width / 2, y + 32, { align: "center" });

  // Signature line
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.3);
  doc.line(width / 2 - 40, height - 38, width / 2 + 40, height - 38);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Clinic Administrator", width / 2, height - 33, { align: "center" });
  doc.text("MEDISCHED CERT System", width / 2, height - 28, { align: "center" });

  // Certificate ID at bottom
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.text(`Certificate ID: ${cert.student_id}-${Date.now()}`, width / 2, height - 15, { align: "center" });

  // Download
  const filename = `Certificate_${cert.lastname}_${cert.firstname}_${cert.student_id}.pdf`;
  doc.save(filename);
}
