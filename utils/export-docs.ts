"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { StudentRow } from "@/types/domain";
import * as XLSX from "xlsx";

type StudentExportRow = StudentRow & { school?: string | null; className?: string | null };

export function exportStudentsCsv(rows: StudentExportRow[]): void {
  const header = [
    "F.I.Sh",
    "JSHSHIR",
    "Tugilgan sana",
    "Telefon",
    "Ota-ona telefon",
    "Status",
    "Manzil",
    "Maktab",
    "Sinf",
    "Gender",
  ];
  const lines = rows.map((r) =>
    [
      r.full_name,
      r.jshshir,
      r.birth_date ?? "",
      r.phone ?? "",
      r.parent_phone,
      r.status,
      r.address ?? "",
      r.school ?? "",
      r.className ?? "",
      r.gender,
    ].map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
  );
  const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `students-export-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportStudentsXlsx(rows: StudentExportRow[], filename?: string): void {
  const data = rows.map((r) => ({
    full_name: r.full_name,
    jshshir: r.jshshir,
    birth_date: r.birth_date,
    phone: r.phone,
    parent_phone: r.parent_phone,
    status: r.status,
    address: r.address,
    passport: r.passport,
    gender: r.gender,
    school: r.school,
    class: r.className,
  }));

  const sheet = XLSX.utils.json_to_sheet(data);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "students");
  XLSX.writeFile(book, filename ?? `students-${Date.now()}.xlsx`);
}

export function exportStudentsPdf(rows: StudentExportRow[], title: string): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  doc.setFontSize(13);
  doc.text(title, 14, 16);
  autoTable(doc, {
    head: [["F.I.Sh", "JSHSHIR", "Tugilgan", "Telefon", "Ota-ona", "Status", "Maktab", "Sinf"]],
    body: rows.map((r) => [
      r.full_name,
      r.jshshir,
      r.birth_date ?? "—",
      r.phone ?? "—",
      r.parent_phone,
      r.status,
      r.school ?? "—",
      r.className ?? "—",
    ]),
    startY: 22,
    styles: { fontSize: 7, cellPadding: 1 },
    theme: "striped",
  });
  doc.save(`students-report-${Date.now()}.pdf`);
}
