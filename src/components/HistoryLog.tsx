import React, { useState } from 'react';
import { PointLog } from '../types';
import { History, Search, Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HistoryLogProps {
  logs: PointLog[];
  onUndoLog: (logId: string) => void;
  onClearLogs: () => void;
}

export default function HistoryLog({ logs, onUndoLog, onClearLogs }: HistoryLogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const filteredLogs = logs
    .filter((log) => {
      const matchTarget = log.targetName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchReason = log.reason.toLowerCase().includes(searchQuery.toLowerCase());
      return matchTarget || matchReason;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-4">
      {/* Log Header */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
        <h2 id="history-logs-heading" className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <History className="w-5 h-5 text-gray-500" />
          <span>作战事件流水记录表 (实时)</span>
        </h2>
        {logs.length > 0 && (
          <button
            id="btn-trigger-clear-logs"
            onClick={() => setShowClearConfirm(true)}
            className="text-xs font-bold text-red-500 hover:text-red-650 hover:underline flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>清空全部流水</span>
          </button>
        )}
      </div>

      {/* Clear Confirmation Banner */}
      {showClearConfirm && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-float">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-red-800 dark:text-red-400">
                警告：确定要清空全部的加减分事件流水吗？
              </p>
              <p className="text-[10px] text-red-600 dark:text-red-400 mt-0.5">
                此造就的操作仅清除日志，已增减的学生和小组分数不会被重置。若要全部重设归零，请使用顶部 “重置全班积分” 按钮。
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              id="btn-cancel-clear-logs"
              onClick={() => setShowClearConfirm(false)}
              className="text-xs font-bold px-3 py-1.5 border border-gray-350 dark:border-gray-800 text-gray-600 bg-white hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-300 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              id="btn-confirm-clear-logs"
              onClick={() => {
                onClearLogs();
                setShowClearConfirm(false);
              }}
              className="text-xs font-bold px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              确定清空
            </button>
          </div>
        </div>
      )}

      {/* Log Actions Filter */}
      {logs.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            id="search-logs-input"
            placeholder="搜索流水的学生名字 / 小组 / 加分原因..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 focused:bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
          />
        </div>
      )}

      {/* Scrollable logs list */}
      <div className="max-h-96 overflow-y-auto space-y-2 border border-gray-100 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-900/40 p-1">
        <AnimatePresence initial={false}>
          {filteredLogs.map((log) => {
            const isPositive = log.points >= 0;
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/20 hover:bg-gray-50 transition-colors gap-3"
              >
                {/* Info block */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1 text-xs">
                    {/* Timestamp */}
                    <span className="font-mono text-[10px] text-gray-400 select-none">
                      {formatTime(log.timestamp)}
                    </span>

                    {/* Operational Category indicator */}
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      log.targetType === 'group'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30'
                        : log.targetType === 'batch_individual'
                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30'
                        : 'bg-stone-100 text-stone-700 dark:bg-gray-800'
                    }`}>
                      {log.targetType === 'group' ? '小组' : log.targetType === 'batch_individual' ? '小组全员' : '成员'}
                    </span>

                    {/* Target Name */}
                    <span className="font-bold text-gray-800 dark:text-gray-200">
                      {log.targetName}
                    </span>
                  </div>

                  {/* Reason text */}
                  <p className="text-[11px] text-gray-600 dark:text-gray-400 font-medium">
                    {log.reason}
                  </p>
                </div>

                {/* Score & Revert Block */}
                <div className="flex items-center gap-3 select-none flex-shrink-0">
                  <span className={`font-mono text-base font-black px-2.5 py-1 rounded-lg ${
                    isPositive
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'bg-red-50 text-red-500 dark:bg-red-950/40'
                  }`}>
                    {isPositive ? `+${log.points}` : log.points}分
                  </span>

                  {/* Undo Button */}
                  <button
                    id={`btn-undo-log-${log.id}`}
                    onClick={() => onUndoLog(log.id)}
                    className="p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-500 hover:text-indigo-600 hover:border-indigo-250 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 dark:hover:text-indigo-400 transition-all flex items-center gap-1"
                    title="撤销此项加减分，返还分值"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold hidden sm:inline">撤销</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredLogs.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-xs">
            {logs.length === 0 ? '暂无任何加减分流水事件记账' : '没有过滤到匹配的加分记录流水 🔍'}
          </div>
        )}
      </div>
    </div>
  );
}
