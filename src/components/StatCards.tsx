import React from 'react';
import { Student, Group } from '../types';
import { Trophy, Landmark } from 'lucide-react';

interface StatCardsProps {
  students: Student[];
  groups: Group[];
}

export default function StatCards({ students, groups }: StatCardsProps) {
  // Sort students for rankings (individual honors)
  const sortedStudents = [...students].sort((a, b) => b.score - a.score);

  // Group Total Score Calculator
  const getGroupTotalScore = (group: Group) => {
    const groupMembers = students.filter(s => s.groupId === group.id);
    const membersSum = groupMembers.reduce((sum, s) => sum + s.score, 0);
    return membersSum + group.score;
  };

  const groupStats = groups.map(g => ({
    ...g,
    total: getGroupTotalScore(g),
    memberCount: students.filter(s => s.groupId === g.id).length
  })).sort((a, b) => b.total - a.total);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="top-stats-container">
      {/* Left Half: 个人积分名次 */}
      <div className="bg-indigo-900 border-2 border-indigo-850 rounded-3xl p-5 shadow-xl flex flex-col h-[280px]">
        <div className="flex items-center justify-between mb-3 border-b border-indigo-800 pb-2 shrink-0">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400 shrink-0 animate-bounce" />
            <h3 className="text-base font-black text-amber-400 tracking-wider font-serif text-glow-amber">
              🏆 个人战绩荣耀风云榜
            </h3>
          </div>
          <span className="text-[10px] text-indigo-300 font-mono">共 {students.length} 名勇士</span>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
          {sortedStudents.map((student, index) => {
            const rank = index + 1;
            const isTop3 = rank <= 3;
            return (
              <div 
                key={student.id} 
                className={`flex items-center justify-between px-3 py-1.5 rounded-xl transition-all duration-150 ${
                  isTop3 
                    ? 'bg-amber-400/10 border border-amber-400/30' 
                    : 'bg-indigo-950/40 border border-indigo-850/60 hover:bg-indigo-950/70'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`w-5 h-5 flex items-center justify-center text-[10px] font-black rounded-full shrink-0 ${
                    rank === 1 ? 'bg-amber-400 text-indigo-950' :
                    rank === 2 ? 'bg-slate-300 text-indigo-950' :
                    rank === 3 ? 'bg-amber-700 text-white' :
                    'bg-indigo-800 text-indigo-300'
                  }`}>
                    {rank}
                  </span>
                  <span className="font-extrabold text-sm text-indigo-100 truncate">{student.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-850 truncate">
                    {student.groupName}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0 font-mono">
                  <span className={`text-sm font-black ${isTop3 ? 'text-amber-400 text-glow-amber' : 'text-indigo-200'}`}>
                    {student.score}
                  </span>
                  <span className="text-[9px] text-indigo-400">分</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Half: 各个小组总积分 */}
      <div className="bg-indigo-900 border-2 border-indigo-850 rounded-3xl p-5 shadow-xl flex flex-col h-[280px]">
        <div className="flex items-center justify-between mb-3 border-b border-indigo-800 pb-2 shrink-0">
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-emerald-400 shrink-0" />
            <h3 className="text-base font-black text-amber-400 tracking-wider font-serif text-glow-amber">
              🏰 战队总积分对决榜
            </h3>
          </div>
          <span className="text-[10px] text-indigo-300 font-mono">第几战队联名对决</span>
        </div>

        <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
          {groupStats.map((group, index) => {
            const rank = index + 1;
            const progressPercentage = Math.min(100, Math.max(8, (group.total / (groupStats[0]?.total || 1)) * 100));
            return (
              <div 
                key={group.id} 
                className="bg-indigo-950/50 border border-indigo-850 px-3 py-2 rounded-xl flex flex-col justify-between transition-all hover:bg-indigo-950/80"
              >
                <div className="flex items-center justify-between gap-1 w-full min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`w-4 w-4 flex items-center justify-center text-[10px] font-black rounded-full shrink-0 ${
                      rank === 1 ? 'bg-amber-400 text-indigo-950' : 'bg-indigo-800 text-indigo-300'
                    }`}>
                      {rank}
                    </span>
                    <span className="font-extrabold text-xs text-indigo-100 truncate">{group.name}</span>
                  </div>
                  <span className="text-[8px] text-indigo-400 font-mono bg-indigo-950 px-1 py-0.5 rounded border border-indigo-900 shrink-0">
                    {group.memberCount}人
                  </span>
                </div>

                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-[8px] text-indigo-400 font-bold uppercase">总积分</span>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-xl font-black font-mono text-emerald-450 text-emerald-400 leading-none">
                      {group.total}
                    </span>
                    <span className="text-[8px] text-indigo-400">分</span>
                  </div>
                </div>

                {/* Progress bar visualizer */}
                <div className="w-full h-1.5 bg-indigo-950 rounded-full overflow-hidden border border-indigo-900 mt-1">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                      rank === 1 ? 'bg-gradient-to-r from-amber-500 to-amber-300' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    }`}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
