import React, { useState, useEffect, useRef } from 'react';
import { Student, Group, PointLog } from './types';
import { getInitialData } from './data/initialData';
import StatCards from './components/StatCards';
import GroupSection from './components/GroupSection';
import MemberSection from './components/MemberSection';
import HistoryLog from './components/HistoryLog';
import { 
  Download, 
  Upload, 
  RotateCcw, 
  Sparkles, 
  Flame, 
  AlertTriangle, 
  Info,
  Calendar,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';

const STORAGE_KEYS = {
  STUDENTS: 'werewolf_war_students',
  GROUPS: 'werewolf_war_groups',
  LOGS: 'werewolf_war_logs'
};

export default function App() {
  // 1. Core State
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [logs, setLogs] = useState<PointLog[]>([]);

  // 2. UI Action State
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [showInfoOverlay, setShowInfoOverlay] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 3. Hydrate state from localStorage or initial dataset
  useEffect(() => {
    const cachedStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    const cachedGroups = localStorage.getItem(STORAGE_KEYS.GROUPS);
    const cachedLogs = localStorage.getItem(STORAGE_KEYS.LOGS);

    if (cachedStudents && cachedGroups) {
      try {
        const parsedStudents: Student[] = JSON.parse(cachedStudents);
        const parsedGroups: Group[] = JSON.parse(cachedGroups);
        const parsedLogs = cachedLogs ? JSON.parse(cachedLogs) : [];

        // Synchronize roster from getInitialData() to preserve scores for existing students
        const { students: freshStudents, groups: freshGroups } = getInitialData();
        
        const synchronizedStudents = freshStudents.map((freshStudent) => {
          const existing = parsedStudents.find(
            (ps) => ps.name.trim() === freshStudent.name.trim() && ps.groupId === freshStudent.groupId
          );
          
          let score = freshStudent.score;
          let starRating = freshStudent.starRating;
          
          if (existing) {
            score = existing.score;
            starRating = existing.starRating;
          } else if (freshStudent.name === '沈路菲') {
            // Map previous "沈璐菲" under group 4 to "沈路菲" to retain score
            const oldLufei = parsedStudents.find(
              (ps) => (ps.name.trim() === '沈璐菲' || ps.name.trim() === '沈路菲') && ps.groupId === 'g4'
            );
            if (oldLufei) {
              score = oldLufei.score;
              starRating = oldLufei.starRating;
            }
          }
          
          return {
            ...freshStudent,
            score,
            starRating
          };
        });

        const synchronizedGroups = freshGroups.map((freshGroup) => {
          const existingGroup = parsedGroups.find((g) => g.id === freshGroup.id);
          return {
            ...freshGroup,
            score: existingGroup ? existingGroup.score : freshGroup.score
          };
        });

        setStudents(synchronizedStudents);
        setGroups(synchronizedGroups);
        setLogs(parsedLogs);
        saveToStorage(synchronizedStudents, synchronizedGroups, parsedLogs);
      } catch (e) {
        console.error('Error parsing cached data, restoring default...', e);
        bootstrapDefault();
      }
    } else {
      bootstrapDefault();
    }
  }, []);

  const bootstrapDefault = () => {
    const { students: defStudents, groups: defGroups } = getInitialData();
    setStudents(defStudents);
    setGroups(defGroups);
    setLogs([]);
    saveToStorage(defStudents, defGroups, []);
  };

  const saveToStorage = (updatedStudents: Student[], updatedGroups: Group[], updatedLogs: PointLog[]) => {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(updatedStudents));
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(updatedGroups));
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updatedLogs));
  };

  // 4. Toast notifications logic
  const triggerNotification = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ text, type });
    const timer = setTimeout(() => {
      setNotification(null);
    }, 4000);
    return () => clearTimeout(timer);
  };

  // 5. Scoring Mutation Logic: Individual
  const handleAdjustMemberScore = (studentId: string, points: number, reason: string) => {
    const targetIdx = students.findIndex(s => s.id === studentId);
    if (targetIdx === -1) return;

    const copyStudents = [...students];
    const student = copyStudents[targetIdx];
    const originalScore = student.score;
    const newScore = originalScore + points;
    student.score = newScore;

    // Create log
    const newLog: PointLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      targetType: 'individual',
      targetId: student.id,
      targetName: `${student.name} (${student.groupName})`,
      points,
      reason
    };

    const nextLogs = [newLog, ...logs];
    setStudents(copyStudents);
    setLogs(nextLogs);
    saveToStorage(copyStudents, groups, nextLogs);

    triggerNotification(
      `已对 [${student.name}] ${points > 0 ? '＋' : '－'}${Math.abs(points)}分！原因：${reason}`,
      points > 0 ? 'success' : 'info'
    );
  };

  // 6. Scoring Mutation Logic: Group simultaneous batch action
  const handleAdjustGroupScore = (groupId: string, points: number, reason: string, applyToAllMembers: boolean) => {
    const groupIdx = groups.findIndex(g => g.id === groupId);
    if (groupIdx === -1) return;

    const copyGroups = [...groups];
    const targetGroup = copyGroups[groupIdx];

    let copyStudents = [...students];
    const groupMembers = copyStudents.filter(s => s.groupId === groupId);

    if (applyToAllMembers) {
      // Add points to every single member inside this group
      copyStudents = copyStudents.map((student) => {
        if (student.groupId === groupId) {
          return {
            ...student,
            score: student.score + points
          };
        }
        return student;
      });

      // Log this batch action
      const newLog: PointLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        timestamp: new Date().toISOString(),
        targetType: 'batch_individual',
        targetId: groupId,
        targetName: targetGroup.name,
        points,
        reason: `${reason} (同组 ${groupMembers.length} 人分别${points > 0 ? '奖励' : '扣减'} ${Math.abs(points)} 分)`
      };

      const nextLogs = [newLog, ...logs];
      setStudents(copyStudents);
      setLogs(nextLogs);
      saveToStorage(copyStudents, copyGroups, nextLogs);

      triggerNotification(
        `一键批量加分：[${targetGroup.name}] 全体成员统一 ${points > 0 ? '＋' : '－'}${Math.abs(points)}分！`,
        'success'
      );
    } else {
      // Just adjust the standalone group bonus
      targetGroup.score += points;

      const newLog: PointLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        timestamp: new Date().toISOString(),
        targetType: 'group',
        targetId: groupId,
        targetName: targetGroup.name,
        points,
        reason: `${reason} (仅增加小组团队星级积分)`
      };

      const nextLogs = [newLog, ...logs];
      setGroups(copyGroups);
      setLogs(nextLogs);
      saveToStorage(copyStudents, copyGroups, nextLogs);

      triggerNotification(
        `独立增减小组积分：[${targetGroup.name}] 团队单独分值 ${points > 0 ? '＋' : '－'}${Math.abs(points)}分！`,
        'success'
      );
    }
  };

  // 7. Revert / Undo a past scoring event
  const handleUndoLog = (logId: string) => {
    const logIdx = logs.findIndex(l => l.id === logId);
    if (logIdx === -1) return;

    const logToRevert = logs[logIdx];
    let copyStudents = [...students];
    let copyGroups = [...groups];

    const reversePoints = -logToRevert.points;

    if (logToRevert.targetType === 'individual') {
      // Undo individual student score alterations
      copyStudents = copyStudents.map((s) => {
        if (s.id === logToRevert.targetId) {
          return { ...s, score: Math.max(0, s.score + reversePoints) }; // Protect negative floor
        }
        return s;
      });
    } else if (logToRevert.targetType === 'group') {
      // Undo group standalone bonus points
      copyGroups = copyGroups.map((g) => {
        if (g.id === logToRevert.targetId) {
          return { ...g, score: Math.max(0, g.score + reversePoints) };
        }
        return g;
      });
    } else if (logToRevert.targetType === 'batch_individual') {
      // Undo points for EVERY student in that group
      copyStudents = copyStudents.map((s) => {
        if (s.groupId === logToRevert.targetId) {
          return { ...s, score: Math.max(0, s.score + reversePoints) };
        }
        return s;
      });
    }

    // Filter out the reverted log item
    const nextLogs = logs.filter(l => l.id !== logId);

    setStudents(copyStudents);
    setGroups(copyGroups);
    setLogs(nextLogs);
    saveToStorage(copyStudents, copyGroups, nextLogs);

    triggerNotification(`成功进行一键撤销！退还或扣除 [${logToRevert.targetName}] 原先增减的 ${logToRevert.points} 积分！`, 'info');
  };

  // 8. Re-zeroing database bootstrap
  const handleResetAll = () => {
    bootstrapDefault();
    setIsResetConfirmOpen(false);
    triggerNotification('已清除所有作战状态，成员、小组积分全部成功重置归零！', 'error');
  };

  // 9. JSON File Export tool
  const handleExportData = () => {
    const payload = {
      exportTime: new Date().toISOString(),
      appName: '小蜜蜂期末作战之狼人杀',
      students,
      groups,
      logs
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `小蜜蜂狼人杀作战得分备份_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    triggerNotification('作战数据成功导出备份为本地 JSON 文件！', 'success');
  };

  // 10. JSON File Import parser
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = e.target.files;
    if (!files || files.length === 0) return;

    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.students && Array.isArray(parsed.students) && parsed.groups && Array.isArray(parsed.groups)) {
          setStudents(parsed.students);
          setGroups(parsed.groups);
          setLogs(parsed.logs || []);
          saveToStorage(parsed.students, parsed.groups, parsed.logs || []);
          triggerNotification('💡 备份数据已导入，期末战况状态瞬间恢复完成！', 'success');
        } else {
          alert('导入失败：该 JSON 数据格式无效，不属于此款积分类软件！');
        }
      } catch (err) {
        alert('文件解析失败，请确保您选择的是之前导出的 .json 备用档案！');
      }
    };
    fileReader.readAsText(files[0]);
    // Clear value to allow picking same file again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-indigo-950 font-sans text-indigo-150 flex flex-col justify-between selection:bg-amber-400 selection:text-indigo-950 pb-10">
      
      {/* 🚀 Top Announcement and Toast Banner */}
      <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full space-y-2 pointer-events-none">
        {notification && (
          <div 
            id="toast-notification"
            className={`p-4 rounded-xl shadow-2xl border-2 text-xs font-black flex items-center gap-3.5 animate-float pointer-events-auto bg-indigo-900 text-white ${
              notification.type === 'success' 
                ? 'border-emerald-500 shadow-emerald-950/50' 
                : notification.type === 'error'
                ? 'border-rose-500 shadow-rose-950/50'
                : 'border-amber-400 shadow-amber-950/50'
            }`}
          >
            <div className={`h-3 w-3 rounded-full shrink-0 ${
              notification.type === 'success' ? 'bg-emerald-400 animate-pulse' : notification.type === 'error' ? 'bg-rose-500 animate-pulse' : 'bg-amber-400 animate-pulse'
            }`} />
            <div className="flex-1 leading-normal text-[11px]">{notification.text}</div>
          </div>
        )}
      </div>

      {/* 💎 App Branding & Settings Header (Vibrant Palette gaming status layout) */}
      <header id="top-branding-header" className="bg-indigo-900/95 sticky top-0 z-40 backdrop-blur border-b-4 border-amber-400 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo Title */}
          <div className="flex items-center gap-3.5 text-center md:text-left">
            <span className="text-4xl filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)] animate-bounce inline-block select-none">🐝</span>
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-amber-400 tracking-wider font-serif text-glow-amber">
                  小蜜蜂“期末作战之狼人杀”
                </h1>
                <span className="bg-rose-500 text-white font-mono font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-md select-none border border-b-2 border-rose-700">
                  SYSTEM PRO
                </span>
              </div>
              <p className="text-xs font-bold text-indigo-300 leading-normal mt-1">
                实时记录小组与组员贡献 · 班级荣誉积分排行榜
              </p>
            </div>
          </div>

          {/* Quick utility controls */}
          <div className="flex items-center gap-2 flex-wrap select-none justify-center">
            {/* Show instructions trigger */}
            <button
              onClick={() => setShowInfoOverlay(!showInfoOverlay)}
              className="text-xs font-bold px-3 py-2 bg-indigo-850 hover:bg-indigo-800 text-amber-300 border border-indigo-700/80 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              title="查看玩法与规则计分说明"
            >
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span>记分说明</span>
            </button>

            {/* Export data */}
            <button
              id="btn-export-backup"
              onClick={handleExportData}
              className="text-xs font-bold px-3 py-2 bg-indigo-850 hover:bg-indigo-800 border border-indigo-700/80 rounded-xl text-indigo-100 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="导出当前全班积分流水为JSON备份，防止丢失"
            >
              <Download className="w-3.5 h-3.5 text-indigo-300" />
              <span className="hidden sm:inline">导出备份</span>
            </button>

            {/* Import data mock input */}
            <label
              htmlFor="upload-data-input"
              className="text-xs font-bold px-3 py-2 bg-indigo-850 hover:bg-indigo-800 border border-indigo-700/80 rounded-xl text-indigo-100 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              title="自选之前的 JSON 备份档案，一键恢复先前的分数状态"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-300" />
              <span className="hidden sm:inline">导入恢复</span>
            </label>
            <input
              ref={fileInputRef}
              id="upload-data-input"
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="hidden"
            />

            {/* Reset class scores with modal trigger */}
            <button
              id="btn-trigger-reset-app"
              onClick={() => setIsResetConfirmOpen(true)}
              className="text-xs font-extrabold px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-all border-b-4 border-rose-800 flex items-center gap-1 font-sans cursor-pointer active:translate-y-0.5"
              title="将全班所有人、小组成分分数全部归零"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重置全班积分</span>
            </button>
          </div>
        </div>
      </header>

      {/* 🔮 Info Tutorial section */}
      {showInfoOverlay && (
        <div className="bg-indigo-900 border-b-4 border-indigo-800">
          <div className="max-w-7xl mx-auto px-4 py-5 flex items-start gap-3.5">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
            <div className="text-xs leading-relaxed text-indigo-100">
              <strong className="font-extrabold block text-sm text-amber-300 mb-1.5">🎮 《小蜜蜂“期末作战之狼人杀”》战局专属规则：</strong>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <div className="bg-indigo-950/65 p-3 rounded-xl border border-indigo-800">
                  <p className="font-bold text-amber-400 mb-1">💡 1. 个人极速加减</p>
                  <p className="text-indigo-200">点击组员卡片的快速闪电加减分，为神职、平民分别给予奖励分（+1 / +2 / +5）；或对狼人的胡乱砸票爆人发言等警告扣分。</p>
                </div>
                <div className="bg-indigo-950/65 p-3 rounded-xl border border-indigo-800">
                  <p className="font-bold text-emerald-400 mb-1">👥 2. 一键小组批量</p>
                  <p className="text-indigo-200">老师若判定某阵营或者狼人玩家取得重大胜利，可在对应的小组卡片下一键批量追加多名组员的战斗贡献，超级高效！</p>
                </div>
                <div className="bg-indigo-950/65 p-3 rounded-xl border border-indigo-800">
                  <p className="font-bold text-rose-400 mb-1">🛡️ 3. 独立小组星值</p>
                  <p className="text-indigo-200">不改变个人分数，也可以单单设定调整“小组累积积分”，只改变该组团队总荣誉值，适应各种多元玩法需求！</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ⚠️ Reset Core Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 bg-indigo-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm select-none">
          <div className="bg-indigo-900 border-2 border-amber-400 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-[0_0_50px_rgba(0,0,0,0.7)] animate-float">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 bg-rose-500/20 text-rose-400 flex items-center justify-center rounded-2xl shrink-0 border border-rose-550">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-black text-amber-400 text-lg uppercase tracking-wider text-glow-amber">警告：重置全班积分</h3>
                <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">DANGER! CLEANING PRESET DATA</p>
              </div>
            </div>

            <p className="text-xs text-indigo-150 leading-relaxed bg-indigo-950/60 p-3.5 rounded-xl border border-indigo-800">
              此操作将导致<strong>不可逆</strong>的数据清除！全班 4 个阵营/小组的积分和 39 名勇士的所有个人累积点数将全部被<strong>强制归零重置</strong>，以往所有的得分事件日志也会被清空。建议先点击「导出备份」！
            </p>

            <div className="flex items-center gap-3 pt-2 justify-end">
              <button
                id="btn-cancel-reset"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 border-b-4 border-indigo-950 border-2 border-indigo-700 bg-indigo-850 hover:bg-indigo-800 text-indigo-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                我不重设了 (取消)
              </button>
              <button
                id="btn-confirm-reset"
                onClick={handleResetAll}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl border-b-4 border-rose-800 shadow-md transition-all cursor-pointer"
              >
                确认彻底重置 (全部归零)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📊 Main Work Canvas */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6 flex-1 w-full animate-fadeIn" id="main-content-canvas">
        
        {/* Row 1: Aggregated Stat metrics */}
        <StatCards students={students} groups={groups} />

        {/* Row 2: Group Final Showdown Leaderboard (4-Grid / 2x2 Layout) */}
        <section id="group-column-container" className="bg-indigo-900 border-2 border-indigo-800/80 p-5 rounded-3xl space-y-6 shadow-2xl" aria-labelledby="group-leaderboard-heading">
          <GroupSection 
            groups={groups} 
            students={students} 
            onAdjustGroupScore={handleAdjustGroupScore} 
          />
        </section>

        {/* Row 3: Individual Hero Score Leaderboard (5-Cells-Per-Row Layout) */}
        <section id="student-column-container" className="bg-indigo-900 border-2 border-indigo-800/80 p-5 rounded-3xl space-y-6 shadow-2xl" aria-labelledby="individual-scores-heading">
          <MemberSection 
            students={students} 
            onAdjustMemberScore={handleAdjustMemberScore}
          />
        </section>

        {/* Row 3: Action Audit History Logs */}
        <section id="logs-column-container" className="bg-indigo-900 border-2 border-indigo-800/80 p-5 rounded-3xl shadow-2xl" aria-labelledby="history-logs-heading">
          <HistoryLog 
            logs={logs} 
            onUndoLog={handleUndoLog} 
            onClearLogs={() => {
              setLogs([]);
              saveToStorage(students, groups, []);
              triggerNotification('流水记账表格已清空，原有得分并不会发生变化！', 'info');
            }}
          />
        </section>

      </main>

      {/* 🛡️ Humane Footer notice (Free of margin clutter, system coordinates) */}
      <footer className="max-w-7xl mx-auto px-4 pt-6 border-t border-indigo-800/80 flex flex-col md:flex-row items-center justify-between gap-3 select-none text-indigo-300 w-full" id="footer-branding-info">
        <p className="text-[11px] text-center md:text-left font-semibold">
          🐝 小蜜蜂“期末作战之狼人杀”课程积分追踪盘 · 适合大中小学合作探究学习及游戏大作战记分
        </p>
        <p className="text-[11px] font-mono tracking-wider text-amber-400 bg-indigo-900 px-3 py-1.5 rounded-xl border border-indigo-800">
          🔥 2026-06-01 · 期末游戏巅峰荣誉排行榜
        </p>
      </footer>

    </div>
  );
}
