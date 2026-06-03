import { Student, Group } from '../types';

export const INITIAL_GROUPS_RAW = [
  {
    id: 'g1',
    name: '第一战队',
    members: ['徐悦涵', '毛忆源', '楚子佑', '蒋欣妍', '章艺文', '林沐宇', '刘荣俊', '陈梦璐', '陈昕瑜', '邵颐宸']
  },
  {
    id: 'g2',
    name: '第二战队',
    members: ['白雨莹', '叶纯熙', '余亦洧', '林佳悦', '鄢伊晨', '何诺一', '尚泽', '劳若逸', '王宇妍', '刘时雨']
  },
  {
    id: 'g3',
    name: '第三战队',
    members: ['尹泓胜', '胡梓峻', '苏湘文', '孙沐瑶', '楼夏汐', '吴定韩', '陈钰崑', '朱张依', '李梓嫣', '陈宇杭']
  },
  {
    id: 'g4',
    name: '第四战队',
    members: ['包容', '阎萌', '姜雨果', '朱予墨', '沈路菲', '施承果', '陈亨昊', '胡嘉纹', '韦一阳']
  }
];

export function getInitialData(): { students: Student[]; groups: Group[] } {
  const students: Student[] = [];
  const groups: Group[] = [];

  INITIAL_GROUPS_RAW.forEach((groupData) => {
    const memberIds: string[] = [];

    groupData.members.forEach((memberName, index) => {
      // Create a truly unique ID using group ID and index to differentiate duplicate names like 陈昕瑜
      const studentId = `student_${groupData.id}_${index + 1}`;
      memberIds.push(studentId);

      students.push({
        id: studentId,
        name: memberName.trim(),
        groupId: groupData.id,
        groupName: groupData.name,
        score: 0,
        starRating: 0
      });
    });

    groups.push({
      id: groupData.id,
      name: groupData.name,
      score: 0, // Standalone group bonus points
      memberIds
    });
  });

  return { students, groups };
}

export interface PresetReason {
  text: string;
  points: number;
  type: 'bonus' | 'penalty';
}

export const PRESET_REASONS: PresetReason[] = [
  // Good behavior/Victory (Werewolf themed)
  { text: '【狼人自爆】精妙战术，成功抗推好人', points: 3, type: 'bonus' },
  { text: '【预言家】悍跳发言，成功拿到警徽', points: 3, type: 'bonus' },
  { text: '【女巫】灵性洒毒，精准射杀危险分子', points: 4, type: 'bonus' },
  { text: '【猎人】硬气自证，开枪带走狼人', points: 3, type: 'bonus' },
  { text: '【平民表水】完美自证，逻辑严丝合缝', points: 2, type: 'bonus' },
  { text: '【胜利】狼人成功屠城/屠边胜利', points: 5, type: 'bonus' },
  { text: '【胜利】好人阵营成功放逐全部狼人', points: 5, type: 'bonus' },
  { text: '【发言优秀】逻辑严密，带动小组节奏', points: 2, type: 'bonus' },
  { text: '【课堂贡献】主动回答问题，思维敏捷', points: 2, type: 'bonus' },
  { text: '【表现突出】获得本局 MVP / 最佳辩手', points: 4, type: 'bonus' },

  // Warnings/Penalty
  { text: '【神职】盲目带节奏，带错神职/平民', points: -2, type: 'penalty' },
  { text: '【平民】无故倒钩，给好人添乱暴民行为', points: -2, type: 'penalty' },
  { text: '【违规发言】场外透露身份或作弊嫌疑', points: -3, type: 'penalty' },
  { text: '【交头接耳】游戏静音期窃窃私语影响秩序', points: -2, type: 'penalty' },
  { text: '【未做准备】轮到发言时弃麦/未及准备', points: -1, type: 'penalty' },
  { text: '【纪律扣分】小组讨论无序，被警告扣分', points: -2, type: 'penalty' }
];
