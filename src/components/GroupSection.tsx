import React, { useState } from 'react';
import { Group, Student } from '../types';
import { Award, Users, PlusCircle, MinusCircle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GroupSectionProps {
  groups: Group[];
  students: Student[];
  onAdjustGroupScore: (groupId: string, points: number, reason: string, applyToAllMembers: boolean) => void;
}

const GROUP_THEMES: Record<string, { emoji: string; title: string; textAccent: string }> = {
  g1: { emoji: '🐝', title: '第一战队', textAccent: 'text-amber-400' },
  g2: { emoji: '🐺', title: '第二战队', textAccent: 'text-indigo-405' },
  g3: { emoji: '🛡️', title: '第三战队', textAccent: 'text-emerald-400' },
  g4: { emoji: '🔮', title: '第四战队', textAccent: 'text-rose-400' },
};

export default function GroupSection({ groups, students, onAdjustGroupScore }: GroupSectionProps) {
  const [batchActionGroup, setBatchActionGroup] = useState<string | null>(null);
  const [pointsInput, setPointsInput] = useState<string>('5');
  const [customReason, setCustomReason] = useState<string>('');
  const [applyToAll, setApplyToAll] = useState<boolean>(true); // Default to adding to everyone inside

  // Calculate scores: Group score = standalone score + sum of member scores
  const getGroupStats = (group: Group) => {
    const groupMembers = students.filter(s => s.groupId === group.id);
    const membersSum = groupMembers.reduce((sum, s) => sum + s.score, 0);
    const totalScore = membersSum + group.score;
    return {
      totalScore,
      membersCount: groupMembers.length
    };
  };

  const rankedGroups = [...groups].map(g => ({
    ...g,
    ...getGroupStats(g)
  }));

  const handleSubmitBatch = (groupId: string, type: 'add' | 'sub') => {
    const pts = parseInt(pointsInput, 10);
    if (isNaN(pts) || pts <= 0) {
      alert('请输入有效的正整数分数！');
      return;
    }
    const finalPoints = type === 'add' ? pts : -pts;
    const theme = GROUP_THEMES[groupId] || { emoji: '👥', title: '战队' };
    const defaultReason = `${theme.emoji}${type === 'add' ? '小组合作配合加分' : '小组违纪扣分'}`;
    const reason = customReason.trim() || defaultReason;

    onAdjustGroupScore(groupId, finalPoints, reason, applyToAll);
    setCustomReason('');
    setBatchActionGroup(null);
  };

  const selectPresetReason = (text: string, defaultPoints: number) => {
    setCustomReason(text);
    setPointsInput(Math.abs(defaultPoints).toString());
  };

  return (
    <div className="space-y-4">
      {/* Yellow glowing header */}
      <div className="flex items-center justify-between pb-2 border-b border-indigo-800">
        <h2 id="group-leaderboard-heading" className="text-base sm:text-lg font-black text-amber-400 text-glow-amber flex items-center gap-2 font-serif">
          <Award className="w-5 h-5 text-amber-500 animate-pulse" />
          <span>小组期末对战排行榜</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {rankedGroups.map((group) => {
          const theme = GROUP_THEMES[group.id] || { emoji: '👥', title: group.name, textAccent: 'text-indigo-400' };
          
          return (
            <div
              key={group.id}
              id={`group-card-${group.id}`}
              className="bg-indigo-950/45 border-2 border-indigo-850 rounded-2xl p-4 transition-all hover:bg-indigo-950/70 flex flex-col justify-between"
            >
              {/* Header Title & Essential Info */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl filter drop-shadow">{theme.emoji}</span>
                  <div>
                    <h3 className="font-extrabold text-sm text-indigo-100">{group.name}</h3>
                  </div>
                </div>

                {/* Score Stats & Members count ONLY */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">总积分</p>
                    <p className="text-base sm:text-lg font-black font-mono text-emerald-400">
                      {group.totalScore}
                    </p>
                  </div>
                  <div className="text-right border-l border-indigo-800 pl-4">
                    <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">成员数量</p>
                    <p className="text-base sm:text-lg font-black font-mono text-indigo-200 flex items-center justify-end gap-1">
                      <Users className="w-3.5 h-3.5 opacity-65 text-indigo-400" />
                      <span>{group.membersCount}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-3">
                <button
                  id={`btn-open-batch-${group.id}`}
                  onClick={() => {
                    setBatchActionGroup(batchActionGroup === group.id ? null : group.id);
                    setCustomReason('');
                  }}
                  className={`w-full flex items-center justify-center gap-1.5 text-xs font-black py-2 px-3 rounded-xl transition-all ${
                    batchActionGroup === group.id
                      ? 'bg-amber-400 text-indigo-950 border-b-4 border-amber-700 font-black'
                      : 'bg-indigo-900 hover:bg-indigo-805 text-indigo-100 hover:bg-indigo-800 border border-indigo-800/80 cursor-pointer'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>一键小组批量加减分</span>
                </button>
              </div>

              {/* Expandable Group Simultaneous Action Section */}
              <AnimatePresence>
                {batchActionGroup === group.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 pt-3 border-t border-dashed border-indigo-800 space-y-3">
                      <div className="bg-indigo-950 p-3 rounded-xl border border-indigo-850 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-indigo-200">
                            🌟 批量操作分数:
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              value={pointsInput}
                              onChange={(e) => setPointsInput(e.target.value)}
                              className="w-16 text-center font-black px-1.5 py-1 text-xs border border-indigo-800 rounded bg-indigo-900 text-amber-400 focus:outline-none focus:border-amber-400 font-mono"
                              min="1"
                              max="100"
                            />
                            <span className="text-xs text-indigo-400 font-medium">分</span>
                          </div>
                        </div>

                        {/* Quick increments */}
                        <div className="flex flex-wrap gap-1">
                          {[2, 3, 5, 10].map((val) => (
                            <button
                              key={val}
                              onClick={() => setPointsInput(val.toString())}
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded transition-all cursor-pointer ${
                                pointsInput === val.toString()
                                  ? 'bg-amber-400 text-indigo-950'
                                  : 'bg-indigo-900 text-indigo-300 hover:bg-indigo-800'
                              }`}
                            >
                              {val}分
                            </button>
                          ))}
                        </div>

                        {/* Mode toggles */}
                        <div className="bg-indigo-900/40 p-2.5 rounded-lg border border-indigo-850">
                          <p className="text-[10px] font-bold text-indigo-400 mb-1.5 uppercase tracking-wide">批量对象模式</p>
                          <div className="space-y-1.5">
                            <label className="flex items-center gap-2 cursor-pointer text-xs text-indigo-250 text-indigo-200">
                              <input
                                type="radio"
                                name={`apply_mode_${group.id}`}
                                checked={applyToAll === true}
                                onChange={() => setApplyToAll(true)}
                                className="accent-amber-500"
                              />
                              <span>给小组全员分别加减</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-xs text-indigo-250 text-indigo-200">
                              <input
                                type="radio"
                                name={`apply_mode_${group.id}`}
                                checked={applyToAll === false}
                                onChange={() => setApplyToAll(false)}
                                className="accent-amber-500"
                              />
                              <span>仅给小组团队单独积分加减</span>
                            </label>
                          </div>
                        </div>

                        {/* Reason */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-indigo-300 block">加减分说明理由:</label>
                          <input
                            type="text"
                            placeholder="如：阵营胜利、良好互动等"
                            value={customReason}
                            onChange={(e) => setCustomReason(e.target.value)}
                            className="w-full text-xs px-2 py-1.5 border border-indigo-800 rounded bg-indigo-900 text-indigo-100 placeholder:text-indigo-500 focus:outline-none focus:border-amber-405 focus:border-amber-400"
                          />
                        </div>

                        {/* Presets */}
                        <div className="space-y-1.5 pt-1">
                          <p className="text-[9px] font-bold text-indigo-400 uppercase">战斗模板理由:</p>
                          <div className="grid grid-cols-2 gap-1">
                            <button
                              onClick={() => selectPresetReason('【阵营胜利】团队决胜局胜利', 5)}
                              className="text-[9px] text-left truncate px-2 py-1 rounded bg-indigo-900 hover:bg-indigo-850 text-indigo-300 cursor-pointer"
                            >
                              阵营大胜 (+5)
                            </button>
                            <button
                              onClick={() => selectPresetReason('【发言优秀】全员极速合议发言', 2)}
                              className="text-[9px] text-left truncate px-2 py-1 rounded bg-indigo-900 hover:bg-indigo-850 text-indigo-300 cursor-pointer"
                            >
                              好发言 (+2)
                            </button>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-1.5 border-t border-indigo-800">
                          <button
                            id={`btn-batch-sub-${group.id}`}
                            onClick={() => handleSubmitBatch(group.id, 'sub')}
                            className="flex-1 flex items-center justify-center gap-1 text-xs font-black py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-900 text-rose-300 transition-all cursor-pointer"
                          >
                            <MinusCircle className="w-3.5 h-3.5" />
                            <span>批量扣分</span>
                          </button>
                          <button
                            id={`btn-batch-add-${group.id}`}
                            onClick={() => handleSubmitBatch(group.id, 'add')}
                            className="flex-1 flex items-center justify-center gap-1 text-xs font-black py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-505 hover:bg-emerald-500 text-white border-b-2 border-emerald-800 transition-all cursor-pointer"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>批量加分</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
