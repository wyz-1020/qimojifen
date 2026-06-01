import React, { useState } from 'react';
import { Student } from '../types';
import { Search, Filter, SlidersHorizontal, UserPlus, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MemberSectionProps {
  students: Student[];
  onAdjustMemberScore: (studentId: string, points: number, reason: string) => void;
  onUpdateStarRating?: (studentId: string, stars: number) => void;
}

interface PendingAction {
  studentId: string;
  type: 'add' | 'sub';
  value: string;
}

const GROUP_STYLES: Record<string, string> = {
  g1: 'border-amber-550/35 bg-amber-500/5 text-amber-400',
  g2: 'border-indigo-550/35 bg-indigo-500/5 text-indigo-400',
  g3: 'border-emerald-550/35 bg-emerald-500/5 text-emerald-400',
  g4: 'border-rose-550/35 bg-rose-500/5 text-rose-400'
};

export default function MemberSection({ students, onAdjustMemberScore }: MemberSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc' | 'alphabetical'>('desc');
  
  // Directly manage active inline interactive prompt per student card
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  // Filter and sort students
  const filteredStudents = students
    .filter((student) => {
      const matchSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const matchGroup = selectedGroup === 'all' || student.groupId === selectedGroup;
      return matchSearch && matchGroup;
    })
    .sort((a, b) => {
      if (sortOrder === 'desc') return b.score - a.score;
      if (sortOrder === 'asc') return a.score - b.score;
      return a.name.localeCompare(b.name, 'zh-CN');
    });

  // Global ranking pre-calculator
  const globalSorted = [...students].sort((a, b) => b.score - a.score);
  const getGlobalRank = (studentId: string) => {
    const idx = globalSorted.findIndex((s) => s.id === studentId);
    return idx >= 0 ? idx + 1 : 99;
  };

  // Score action submit processor
  const handleScoreSubmit = (studentId: string) => {
    if (!pendingAction) return;
    const pts = parseInt(pendingAction.value, 10);
    if (isNaN(pts) || pts <= 0) {
      alert('请输入有效的加减分数（正整数）！');
      return;
    }

    const finalPoints = pendingAction.type === 'add' ? pts : -pts;
    const reasonText = pendingAction.type === 'add' 
      ? `🔮 个人战绩追加 +${pts} 分` 
      : `🐺 个人战绩扣减分 -${pts} 分`;

    onAdjustMemberScore(studentId, finalPoints, reasonText);
    setPendingAction(null);
  };

  return (
    <div className="space-y-4">
      
      {/* Glowing Yellow Section Header */}
      <div className="flex items-center justify-between pb-2 border-b border-indigo-800">
        <h2 id="individual-scores-heading" className="text-base sm:text-lg font-black text-amber-400 text-glow-amber flex items-center gap-2 font-serif">
          <UserPlus className="w-5 h-5 text-amber-405 text-amber-405 text-amber-400 animate-pulse shrink-0" />
          <span>阵容勇士积分榜 (个人)</span>
        </h2>
        <span className="text-[10px] text-indigo-350 font-mono bg-indigo-950 px-2 py-0.5 rounded border border-indigo-850">
          符合 {filteredStudents.length} 人
        </span>
      </div>

      {/* Responsive Filter controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-indigo-950/60 p-2.5 rounded-2xl border border-indigo-850">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-indigo-400" />
          <input
            type="text"
            placeholder="姓名搜索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-2 py-1.5 border border-indigo-800 rounded-xl bg-indigo-900/40 text-indigo-100 placeholder:text-indigo-500 focus:outline-none focus:border-amber-400 font-sans"
          />
        </div>

        {/* Group filter selection */}
        <div className="flex items-center gap-1.5">
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="w-full text-xs py-1.5 px-2 border border-indigo-800 rounded-xl bg-indigo-900/40 text-indigo-100 focus:outline-none focus:border-amber-400"
          >
            <option value="all" className="bg-indigo-950 text-indigo-100">🔍 所有战队</option>
            <option value="g1" className="bg-indigo-950 text-indigo-100">🐝 第一战队</option>
            <option value="g2" className="bg-indigo-950 text-indigo-100">🐺 第二战队</option>
            <option value="g3" className="bg-indigo-950 text-indigo-100">🛡️ 第三战队</option>
            <option value="g4" className="bg-indigo-950 text-indigo-100">🔮 第四战队</option>
          </select>
        </div>

        {/* Sorting controls */}
        <div className="flex items-center gap-1.5">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="w-full text-xs py-1.5 px-2 border border-indigo-800 rounded-xl bg-indigo-900/40 text-indigo-100 focus:outline-none focus:border-amber-400 font-sans"
          >
            <option value="desc" className="bg-indigo-950 text-indigo-100">🔥 积分从高到低</option>
            <option value="asc" className="bg-indigo-950 text-indigo-100">📉 积分从低到高</option>
            <option value="alphabetical" className="bg-indigo-950 text-indigo-100">🔤 按首字母排序</option>
          </select>
        </div>
      </div>

      {/* Grid of Student Cards - Shrunk down to very compact cells */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5" id="students-grid-container">
        <AnimatePresence mode="popLayout">
          {filteredStudents.map((student) => {
            const globalRank = getGlobalRank(student.id);
            const style = GROUP_STYLES[student.groupId] || GROUP_STYLES.g1;
            const isPendingThisStudent = pendingAction?.studentId === student.id;

            return (
              <motion.div
                key={student.id}
                layoutId={`student-card-${student.id}`}
                className={`relative rounded-xl border p-2.5 flex flex-col justify-between transition-all duration-150 shadow-sm min-h-[105px] ${
                  isPendingThisStudent 
                    ? 'bg-indigo-900 border-amber-400 ring-1 ring-amber-400/40' 
                    : 'bg-indigo-950/45 border-indigo-850 hover:bg-indigo-950/85 hover:border-indigo-750'
                }`}
              >
                {/* Visual indicator corner flare */}
                <div className="absolute top-1 right-1 w-1 h-1 rounded-full bg-amber-400 opacity-20 animate-pulse" />

                {/* Info block: Name + Score */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-extrabold text-sm text-indigo-50 leading-tight truncate">
                      {student.name}
                    </span>
                    <span className="text-sm font-black font-mono text-amber-300 shrink-0 select-none">
                      {student.score}
                    </span>
                  </div>

                  {/* Team badge & rank badge (neat & tiny) */}
                  <div className="flex items-center justify-between text-[9px] font-mono leading-none pt-0.5">
                    <span className={`px-1 rounded border-b shrink-0 scale-95 origin-left tracking-wide ${style}`}>
                      {student.groupName.replace('组', '战队')}
                    </span>
                    <span className="text-indigo-400 font-bold shrink-0">
                      #{globalRank}名
                      {globalRank === 1 && ' 👑'}
                      {student.score >= 15 && ' 🔥'}
                    </span>
                  </div>
                </div>

                {/* Score Controls (+ and - symbols inline popup) */}
                <div className="mt-2 text-center shrink-0">
                  {!isPendingThisStudent ? (
                    <div className="flex items-center gap-1.5">
                      {/* Minus button trigger */}
                      <button
                        title="点击进行输入扣减"
                        onClick={() => setPendingAction({ studentId: student.id, type: 'sub', value: '' })}
                        className="flex-1 h-6 flex items-center justify-center font-extrabold text-xs rounded-md bg-rose-950/80 border border-rose-900 text-rose-350 hover:bg-rose-900 transition-colors cursor-pointer"
                      >
                        -
                      </button>
                      
                      {/* Plus button trigger */}
                      <button
                        title="点击进行输入奖励"
                        onClick={() => setPendingAction({ studentId: student.id, type: 'add', value: '' })}
                        className="flex-1 h-6 flex items-center justify-center font-extrabold text-xs rounded-md bg-emerald-950/80 border border-emerald-900 text-emerald-355 text-emerald-300 hover:bg-emerald-900 transition-all cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleScoreSubmit(student.id);
                      }}
                      className="flex items-center gap-1 leading-none h-6 shrink-0"
                    >
                      <input
                        type="number"
                        placeholder={pendingAction.type === 'add' ? '+几' : '-几'}
                        value={pendingAction.value}
                        onChange={(e) => setPendingAction({ ...pendingAction, value: e.target.value })}
                        className="w-12 h-6 text-center text-xs font-black border border-amber-400 rounded bg-indigo-950 text-amber-300 placeholder:text-indigo-500 focus:outline-none focus:ring-1 focus:ring-amber-400/40 font-mono"
                        autoFocus
                        min="1"
                        max="100"
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') setPendingAction(null);
                        }}
                      />
                      <button
                        type="submit"
                        className="h-6 w-5 rounded bg-emerald-500 hover:bg-emerald-400 text-indigo-950 text-[10px] font-black flex items-center justify-center cursor-pointer"
                        title="确定修改"
                      >
                        ✔
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingAction(null)}
                        className="h-6 w-5 rounded bg-indigo-800 hover:bg-indigo-750 text-indigo-300 text-[10px] font-black flex items-center justify-center cursor-pointer"
                        title="放弃修改"
                      >
                        ✘
                      </button>
                    </form>
                  )}
                </div>

              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-6 bg-indigo-950/40 rounded-2xl border border-indigo-850">
          <p className="text-indigo-400 text-xs">找不到相关的勇士名字 🔍</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedGroup('all');
            }}
            className="mt-2 text-xs text-amber-450 hover:underline text-amber-400 cursor-pointer"
          >
            清除搜索和过滤
          </button>
        </div>
      )}
    </div>
  );
}
