import type { AttributeKey } from './types';

export interface AttributeDef {
  key: AttributeKey;
  /** 滴答清单里对应的标签名（必须一字不差） */
  tag: string;
  label: string;
  icon: string;
  color: string;
  description: string;
}

export const ATTRIBUTES: AttributeDef[] = [
  { key: 'charm',        tag: '魅力', label: '魅力', icon: '💖', color: '#ff5f9e', description: '社交与感染力' },
  { key: 'intelligence', tag: '智力', label: '智力', icon: '🧠', color: '#4da3ff', description: '学识与思考' },
  { key: 'stamina',      tag: '体力', label: '体力', icon: '⚡', color: '#3ecf8e', description: '身体与精力' },
  { key: 'spirit',       tag: '精神', label: '精神', icon: '✨', color: '#ffc94d', description: '意志与心态' },
];
