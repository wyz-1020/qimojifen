export interface Student {
  id: string; // Unique ID to prevent collision (e.g. for the two Chen Xinyu)
  name: string;
  groupId: string;
  groupName: string;
  score: number;
  starRating?: number; // Optional fun rating
}

export interface Group {
  id: string;
  name: string;
  score: number; // Standalone group bonus score
  memberIds: string[];
}

export interface PointLog {
  id: string;
  timestamp: string; // ISO String
  targetType: 'individual' | 'group' | 'batch_individual';
  targetId: string; // Student ID or Group ID
  targetName: string; // Student name or Group name
  points: number;
  reason: string;
}

export const EXTREME_ROLES = {
  WEREWOLF: '狼人',
  SEER: '预言家',
  WITCH: '女巫',
  HUNTER: '猎人',
  VILLAGER: '平民',
  GUARD: '守卫',
} as const;
