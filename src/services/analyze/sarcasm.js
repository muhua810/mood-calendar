/**
 * 反讽/阴阳怪气检测模块
 * 覆盖更多中文网络反讽模式
 */

export const POSITIVE_SARCASM_WORDS = [
  '开心', '高兴', '棒', '好', '厉害', '优秀', '完美',
  '幸福', '美好', '快乐', '精彩', '太爽', '真香', '优秀',
  '不错', '可以', '成功', '赢', '赢麻',
]

export const SARCASM_PATTERNS = [
  // "呢"结尾 + 正面词 → 大概率反讽
  {
    test: (text) =>
      /呢[！!~～。.]*$/.test(text) &&
      POSITIVE_SARCASM_WORDS.some(w => text.includes(w)),
    flipTo: 'negative',
    label: '呢结尾+正面词',
  },
  // "呵呵"独立出现 → 反讽
  {
    test: (text) =>
      /呵呵[！!~～。.]*$/.test(text) || /^呵呵/.test(text),
    flipTo: 'negative',
    label: '呵呵',
  },
  // "真是太X了呢/啊/呀"结构 → 反讽
  {
    test: (text) =>
      /真是.{0,6}(好|棒|开心|高兴|厉害|优秀|完美|精彩|可以|不错)啊?[呢呀吧！!~～]+$/.test(text),
    flipTo: 'negative',
    label: '真是太X了呢',
  },
  // "好一个" + 正面词 → 反讽
  {
    test: (text) =>
      /好一个.{0,6}(开心|高兴|幸福|美好|优秀|厉害)/.test(text),
    flipTo: 'negative',
    label: '好一个',
  },
  // "哈哈" + 负面emoji → 反讽（笑哭）
  {
    test: (text) =>
      /哈哈/.test(text) && /😭|💀|🤡|😰|😅|🙂/.test(text),
    flipTo: 'negative',
    label: '哈哈+负面emoji',
  },
  // 纯粹一串"哈"或"笑"后跟负面词
  {
    test: (text) =>
      /^[哈嘻]{3,}/.test(text) && /了|完|死|没|不动/.test(text),
    flipTo: 'negative',
    label: '一串哈+负面词',
  },
  // "我可太X了" + 正面词 + 负面上下文
  {
    test: (text) =>
      /我可太/.test(text) && POSITIVE_SARCASM_WORDS.some(w => text.includes(w)) &&
      /又|还|还是|继续|还是得/.test(text),
    flipTo: 'negative',
    label: '我可太X了',
  },
  // 独立的"666" + 负面上下文
  {
    test: (text) =>
      /666/.test(text) && (/唉|烦|累|难|惨|崩|破防|emo/.test(text)),
    flipTo: 'negative',
    label: '666+负面',
  },
  // 正面词 + "哦呵呵/噢呵呵"结尾
  {
    test: (text) =>
      /[哦噢]呵{1,3}[。.~～！!]*$/.test(text),
    flipTo: 'negative',
    label: '哦呵呵结尾',
  },
  // "好的好的"重复 + 特定语气
  {
    test: (text) =>
      /好的好的/.test(text) && /[~～。.！!]{2,}$/.test(text),
    flipTo: 'negative',
    label: '好的好的+语气词',
  },
  // "真开心呢" / "真好呢" — 正面词 + 呢
  {
    test: (text) =>
      /^(真|真的|确实)(好|开心|棒|厉害|优秀|高兴)(啊|呀|呢|哦|噢)?[~～！!。.。]*$/.test(text) &&
      text.length <= 12,
    flipTo: 'negative',
    label: '短句正面+语气词',
  },
  // "笑死，..." 后面跟负面内容
  {
    test: (text) =>
      /^笑死[，,]/.test(text) && /难|累|烦|惨|崩|惨|完|寄/.test(text),
    flipTo: 'negative',
    label: '笑死+负面',
  },
  // 省略号 + 正面词（"好开心..."）
  {
    test: (text) =>
      /…{2,}|\.{4,}/.test(text) &&
      POSITIVE_SARCASM_WORDS.some(w => text.includes(w)),
    flipTo: 'negative',
    label: '省略号+正面词',
  },
]

/**
 * 检测反讽表达
 * @param {string} text
 * @returns {{ isSarcasm: boolean, flipTo: string|null, label: string|null }}
 */
export function detectSarcasm(text) {
  for (const pattern of SARCASM_PATTERNS) {
    if (pattern.test(text)) {
      return { isSarcasm: true, flipTo: pattern.flipTo, label: pattern.label }
    }
  }
  return { isSarcasm: false, flipTo: null, label: null }
}
