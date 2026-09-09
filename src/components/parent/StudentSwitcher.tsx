"use client";

import React from "react";
import { UserCheck, ChevronDown, GraduationCap } from "lucide-react";

interface Student {
  id: string;
  fullName: string;
  nis: string;
  class?: { name: string };
}

interface StudentSwitcherProps {
  students: Student[];
  selectedStudentId: string;
  onSelect: (studentId: string) => void;
}

export function StudentSwitcher({
  students,
  selectedStudentId,
  onSelect,
}: StudentSwitcherProps) {
  if (!students || students.length === 0) return null;

  if (students.length === 1) {
    const s = students[0];
    return (
      <div className="flex items-center gap-2.5 bg-sky-50 text-sky-950 px-3.5 py-2 rounded-2xl border border-sky-200/80 shadow-sm">
        <div className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
          <GraduationCap className="w-4 h-4" />
        </div>
        <div className="text-left leading-tight min-w-0">
          <div className="text-xs font-bold truncate">{s.fullName}</div>
          <div className="text-[10px] text-sky-700 font-medium truncate">
            NIS: {s.nis} • Kelas {s.class?.name || "-"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative inline-block w-full sm:w-auto">
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200 overflow-x-auto max-w-full">
        {students.map((s) => {
          const isSelected = s.id === selectedStudentId;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isSelected
                  ? "bg-white text-sky-700 shadow-sm border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  isSelected ? "bg-sky-600 text-white" : "bg-slate-300 text-slate-700"
                }`}
              >
                {s.fullName.charAt(0)}
              </div>
              <div className="text-left">
                <span className="block leading-tight">{s.fullName}</span>
                <span className="block text-[9px] font-normal text-slate-500">
                  {s.class?.name || "Siswa"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
