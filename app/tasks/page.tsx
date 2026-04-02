"use client";
import { useState } from "react";

interface Task { id: number; title: string; col: string; tag: "normal"|"urgent"|"medium"; }

const INIT_TASKS: Task[] = [
  { id: 1, title: "Review Q1 revenue reports", col: "todo", tag: "medium" },
  { id: 2, title: "Update creator onboarding flow", col: "todo", tag: "urgent" },
  { id: 3, title: "Set April goals for Board 1", col: "todo", tag: "normal" },
  { id: 4, title: "Audit inactive creators", col: "progress", tag: "urgent" },
  { id: 5, title: "Prepare agency performance deck", col: "progress", tag: "medium" },
  { id: 6, title: "Interview 3 new chatters", col: "progress", tag: "normal" },
  { id: 7, title: "Fix billing discrepancy — HEIST", col: "review", tag: "urgent" },
  { id: 8, title: "Creator spotlight content", col: "review", tag: "normal" },
  { id: 9, title: "February payouts reconciled", col: "done", tag: "normal" },
  { id: 10, title: "Training board KPI setup", col: "done", tag: "normal" },
];

const COLS = [
  { key: "todo", label: "To Do", color: "#a8a29e" },
  { key: "progress", label: "In Progress", color: "#60a5fa" },
  { key: "review", label: "Review", color: "#facc15" },
  { key: "done", label: "Done", color: "#4ade80" },
];

const TAG_STYLES = { normal: "bg-[#4ade80]/10 text-[#4ade80]", urgent: "bg-[#f87171]/10 text-[#f87171]", medium: "bg-[#facc15]/10 text-[#facc15]" };

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(INIT_TASKS);
  const [dragId, setDragId] = useState<number|null>(null);

  function addTask() {
    const title = prompt("Task title:");
    if (title) setTasks(prev => [...prev, { id: Date.now(), title, col: "todo", tag: "normal" }]);
  }

  function onDrop(colKey: string) {
    if (dragId === null) return;
    setTasks(prev => prev.map(t => t.id === dragId ? { ...t, col: colKey } : t));
    setDragId(null);
  }

  return (
    <>
      <div className="flex justify-between items-start mb-7">
        <div><h1 className="text-[26px] font-extrabold tracking-tight">Tasks</h1><p className="text-[13px] text-[#78716c] mt-1">Kanban board</p></div>
        <button onClick={addTask} className="px-4 py-2.5 rounded-lg bg-[#4ade80] text-[#0a0a0a] text-xs font-bold hover:brightness-110 transition">+ Add Task</button>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {COLS.map(col => {
          const items = tasks.filter(t => t.col === col.key);
          return (
            <div key={col.key} onDragOver={e => e.preventDefault()} onDrop={() => onDrop(col.key)} className="bg-[#161311] border border-white/[0.06] rounded-xl p-3.5">
              <div className="flex justify-between items-center px-1 py-2 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider" style={{color: col.color}}>{col.label}</span>
                <span className="bg-white/[0.06] rounded-full px-2 py-0.5 text-[10px] text-[#78716c] font-semibold">{items.length}</span>
              </div>
              {items.map(t => (
                <div key={t.id} draggable onDragStart={() => setDragId(t.id)} className="bg-[#1a1714] border border-white/[0.06] rounded-lg p-3.5 mb-2 cursor-grab hover:border-white/[0.12] hover:-translate-y-0.5 transition">
                  <div className="text-[12.5px] font-semibold mb-2">{t.title}</div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${TAG_STYLES[t.tag]}`}>{t.tag}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
}
