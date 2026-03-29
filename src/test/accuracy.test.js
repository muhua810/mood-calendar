/**
 * 情绪分析引擎准确率测试（91条人工标注语料）
 */
import { describe, it, expect, beforeAll } from 'vitest'

const TEST_SET = [
  { text: '今天彻底崩溃了，感觉活不下去了', label: 1 },
  { text: '万念俱灰，什么都不想做了', label: 1 },
  { text: '心碎了一地，太痛苦了', label: 1 },
  { text: '生不如死的感觉', label: 1 },
  { text: '完全绝望了，看不到任何希望', label: 1 },
  { text: '今天被所有人抛弃了，活着没意思', label: 1 },
  { text: '痛彻心扉，撕心裂肺', label: 1 },
  { text: '不想活了，活着好累好累', label: 1 },
  { text: '一切都完了，全完了', label: 1 },
  { text: '感觉人生到了尽头', label: 1 },
  { text: '今天的痛苦无法用语言形容', label: 1 },
  { text: '好像掉进了深渊爬不出来', label: 1 },
  { text: '哭了整整一夜，觉得自己好没用', label: 1 },
  { text: '今天是人生最黑暗的一天', label: 1 },
  { text: '今天有点累，工作压力很大', label: 2 },
  { text: '心情不太好，有些烦躁', label: 2 },
  { text: '被老师批评了，有点难过', label: 2 },
  { text: '和朋友发生了矛盾，心里不舒服', label: 2 },
  { text: '有点焦虑，担心明天的考试', label: 2 },
  { text: '想家了，有些孤独', label: 2 },
  { text: '今天状态不好，浑身没劲', label: 2 },
  { text: '感觉很疲惫，身心俱疲', label: 2 },
  { text: '今天有点丧，什么都不想做', label: 2 },
  { text: '心情有点down', label: 2 },
  { text: '今天被拒绝了，不太开心', label: 2 },
  { text: '最近压力好大，快撑不住了', label: 2 },
  { text: '今天很郁闷，不知道为什么', label: 2 },
  { text: '睡不着，失眠了', label: 2 },
  { text: '感觉好孤单，想找人说话', label: 2 },
  { text: '今天过得不太顺利', label: 2 },
  { text: '有点担心自己的未来', label: 2 },
  { text: '今天一切正常，没什么特别的', label: 3 },
  { text: '平淡的一天，就这样过吧', label: 3 },
  { text: '普通的一天，记录一下', label: 3 },
  { text: '今天没啥特别的事', label: 3 },
  { text: '平平平淡，也挺好的', label: 3 },
  { text: '一切如常，日子照旧', label: 3 },
  { text: '今天天气一般，心情也一般', label: 3 },
  { text: '照常上课下课，没什么变化', label: 3 },
  { text: '过得去吧，不好不坏', label: 3 },
  { text: '今天还行吧', label: 3 },
  { text: '马马虎虎的一天', label: 3 },
  { text: '无功无过', label: 3 },
  { text: '今天也是一天', label: 3 },
  { text: '还行', label: 3 },
  { text: '正常', label: 3 },
  { text: '今天天气不错，心情挺好的', label: 4 },
  { text: '工作顺利，效率很高', label: 4 },
  { text: '吃到了好吃的，满足', label: 4 },
  { text: '和朋友聊了天，感觉温暖', label: 4 },
  { text: '完成了今天的计划，有点小骄傲', label: 4 },
  { text: '今天被夸了，有点开心', label: 4 },
  { text: '学到了新东西，有进步', label: 4 },
  { text: '今天的课很有趣', label: 4 },
  { text: '今天心情不错', label: 4 },
  { text: '收到了好消息', label: 4 },
  { text: '今天状态不错，做事很顺利', label: 4 },
  { text: '感觉生活还挺美好的', label: 4 },
  { text: '和家人视频了，心里暖暖的', label: 4 },
  { text: '今天过得挺舒服的', label: 4 },
  { text: '一切都挺顺利的', label: 4 },
  { text: '今天项目终于完成了，成就感爆棚', label: 5 },
  { text: '收到了意外的好消息，太开心了', label: 5 },
  { text: '拿到了心仪的offer，激动到不行', label: 5 },
  { text: '比赛拿了第一名，太激动了', label: 5 },
  { text: '今天是最幸福的一天', label: 5 },
  { text: '表白成功了，太开心了', label: 5 },
  { text: '升职加薪了，开心', label: 5 },
  { text: '太开心了，忍不住想笑', label: 5 },
  { text: '开心到飞起', label: 5 },
  { text: '快乐到无法自拔', label: 5 },
  { text: '今天的快乐无法形容', label: 5 },
  { text: '今天简直太棒了', label: 5 },
  { text: '完美的一天，一切都在朝好的方向发展', label: 5 },
  { text: '今天特别有成就感，笑了一整天', label: 5 },
  { text: '不是不开心，就是有点累', label: 2 },
  { text: '虽然今天很累，但是很开心', label: 4 },
  { text: '虽然有好消息，但整体还是挺累的', label: 2 },
  { text: '没什么不好的，就是有点无聊', label: 3 },
  { text: '并不是很满意', label: 2 },
  { text: '好开心呢', label: 2, note: '反讽' },
  { text: '真是太棒了呢！！！', label: 2, note: '反讽' },
  { text: '呵呵', label: 2, note: '反讽' },
  { text: '今天 😊', label: 4 },
  { text: '好烦啊 😭', label: 2 },
  { text: '太爽了 🔥', label: 5 },
  { text: '唉 😔', label: 2 },
  { text: '一般般吧 😐', label: 3 },
  { text: '考试过了很开心，但是和朋友吵架了', label: 3 },
  { text: '今天被表扬了，不过工作太多了有点累', label: 3 },
  { text: '有点难过，但想想也没那么糟', label: 3 },
]

import { analyzeEmotion } from '../services/emotionAnalyzer'
import { statisticalAnalyze } from '../services/statisticalAnalyzer'

const RM = { very_negative: 1, negative: 2, neutral: 3, positive: 4, very_positive: 5 }
const LN = { 1: '非常低落', 2: '有点难过', 3: '一般般', 4: '心情不错', 5: '超级开心' }
const m2s = m => typeof m === 'number' ? m : (RM[m] || 3)

function metrics(rs) {
  const cs=[1,2,3,4,5], tp={}, fp={}, fn={}
  cs.forEach(c=>{tp[c]=0;fp[c]=0;fn[c]=0})
  let ex=0,tol=0,conf={}
  cs.forEach(a=>{conf[a]={};cs.forEach(b=>{conf[a][b]=0})})
  for(const r of rs){conf[r.a][r.p]++;if(r.a===r.p)ex++;if(Math.abs(r.a-r.p)<=1)tol++;if(r.p===r.a)tp[r.a]++;else{fp[r.p]++;fn[r.a]++}}
  const pc={}
  for(const c of cs){const p=tp[c]+fp[c]>0?tp[c]/(tp[c]+fp[c]):0;const rc=tp[c]+fn[c]>0?tp[c]/(tp[c]+fn[c]):0;const f=p+rc>0?2*p*rc/(p+rc):0;pc[c]={n:LN[c],p:+(p*100).toFixed(1),r:+(rc*100).toFixed(1),f:+(f*100).toFixed(1),s:rs.filter(r=>r.a===c).length}}
  const mp=cs.reduce((s,c)=>s+pc[c].p,0)/5,mr=cs.reduce((s,c)=>s+pc[c].r,0)/5,mf=cs.reduce((s,c)=>s+pc[c].f,0)/5
  return{t:rs.length,ex:+(ex/rs.length*100).toFixed(1),tol:+(tol/rs.length*100).toFixed(1),pc,ma:{p:+mp.toFixed(1),r:+mr.toFixed(1),f:+mf.toFixed(1)}}
}

describe('关键词引擎+降级链准确率',()=>{
  const rs=[]
  beforeAll(async()=>{
    for(const tc of TEST_SET){
      try{const r=await Promise.race([analyzeEmotion(tc.text),new Promise((_,rej)=>setTimeout(()=>rej(),500))]);rs.push({t:tc.text,a:tc.label,p:m2s(r.mood),m:r.method})}
      catch{const r=statisticalAnalyze(tc.text);rs.push({t:tc.text,a:tc.label,p:m2s(r.mood),m:'stat'})}
    }
  })
  it('整体',()=>{
    const bm={};for(const r of rs){(bm[r.m]=bm[r.m]||[]).push(r)}
    const m=metrics(rs)
    console.log(`\n完整降级链: 严格${m.ex}% 容忍±1${m.tol}% 宏F1${m.ma.f}%`)
    expect(m.ex).toBeGreaterThanOrEqual(70)
  })
})
