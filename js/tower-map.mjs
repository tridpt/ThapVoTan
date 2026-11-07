// The map has its own immutable seed. Looking ahead never consumes combat/loot RNG.
const nodeId=(floor,lane)=>`${floor}:${lane}`;
export function starterTowerMap(seed){return {seed:(seed>>>0)||1234567,start:1,path:[]};}
export function towerSegment(map){
  let seed=(map.seed^Math.imul(map.start,0x9e3779b1))>>>0||1;
  const random=()=>{let x=seed|0;x^=x<<13;x^=x>>>17;x^=x<<5;seed=x>>>0;return seed/4294967296;};
  const shuffle=values=>{for(let i=values.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[values[i],values[j]]=[values[j],values[i]];}return values;};
  const rows=Array.from({length:5},(_,row)=>{
    const floor=map.start+row;
    const types=row===4?['boss']:floor===1?['battle','treasure','elite']:shuffle(['battle',row===2?'rest':random()<.5?'rest':'treasure',random()<.5?'elite':'event']);
    return types.map((type,index)=>({id:nodeId(floor,row===4?1:index),floor,row,lane:row===4?1:index,type}));
  });
  const edges=[];
  for(let row=0;row<4;row++){
    const next=rows[row+1],battle=next.find(n=>n.type==='battle');
    for(const from of rows[row]){
      if(next.length===1){edges.push({from:from.id,to:next[0].id});continue;}
      // Every branch keeps a battle option and two exits; same-lane bridges give every island an entrance.
      const lanes=new Set([from.lane,battle.lane]);
      if(lanes.size===1)lanes.add((from.lane+1+Math.floor(random()*2))%3);
      for(const lane of [...lanes].sort())edges.push({from:from.id,to:next[lane].id});
    }
  }
  return {start:map.start,end:map.start+4,rows,nodes:rows.flat(),edges};
}
function available(segment,map,offset){
  const row=segment.rows[offset]||[];
  if(offset===0)return row;
  const previous=map.path[offset-1];
  return row.filter(n=>segment.edges.some(e=>e.from===previous&&e.to===n.id));
}
export function towerMapView(run){
  if(!run?.map)return null;
  const map=run.map,segment=towerSegment(map),offset=run.floor-map.start,choices=available(segment,map,offset);
  const reachable=new Set(choices.map(n=>n.id));
  for(let row=offset;row<4;row++)for(const edge of segment.edges)if(reachable.has(edge.from))reachable.add(edge.to);
  return {...segment,choices,nodes:segment.nodes.map(n=>({...n,chosen:map.path.includes(n.id),status:n.floor<run.floor?(map.path.includes(n.id)?'done':'bypassed'):n.floor===run.floor?(choices.some(c=>c.id===n.id)?'available':'blocked'):reachable.has(n.id)?'future':'blocked',routeIndex:choices.findIndex(c=>c.id===n.id)})),path:[...map.path]};
}
export function towerMapRoutes(run){return towerMapView(run).choices.map(n=>n.type);}
export function advanceTowerMap(run){
  const start=Math.floor((run.floor-1)/5)*5+1;
  if(run.map.start!==start){run.map.start=start;run.map.path=[];}
  run.routes=towerMapRoutes(run);
}
export function commitTowerRoute(run,index){
  const view=towerMapView(run),offset=run.floor-run.map.start;
  if(!Number.isInteger(index)||run.map.path.length!==offset||view.choices.length!==run.routes.length||view.choices.some((n,i)=>n.type!==run.routes[i])||!view.choices[index])throw new Error('Lối đi trên bản đồ không còn khả dụng.');
  const node=view.choices[index];run.map.path.push(node.id);return node;
}
export function validateTowerMap(state){
  const run=state.run;if(!run)return;
  const map=run.map;
  if(map===null)return; // Journeys started before v14 keep their original routing for the whole run.
  const fail=()=>{throw new Error('Bản đồ hành trình không hợp lệ.');};
  if(!map||typeof map!=='object'||Array.isArray(map)||Object.keys(map).sort().join(',')!=='path,seed,start'||!Number.isInteger(map.seed)||map.seed<1||map.seed>0xffffffff||!Number.isInteger(map.start)||map.start!==Math.floor((run.floor-1)/5)*5+1||!Array.isArray(map.path)||map.path.length>5||run.mode!=='normal'||run.challenge||run.dungeon||run.campaign||run.hunt||run.training)fail();
  const segment=towerSegment(map),offset=run.floor-map.start;
  if(map.path.length<offset||map.path.length>offset+1||run.phase==='route'&&map.path.length!==offset||run.phase!=='route'&&run.phase!=='result'&&map.path.length!==offset+1||run.phase==='story')fail();
  for(const [row,id] of map.path.entries())if(typeof id!=='string'||!segment.rows[row].some(n=>n.id===id)||row>0&&!segment.edges.some(e=>e.from===map.path[row-1]&&e.to===id))fail();
  const choices=available(segment,map,offset);
  if(choices.length!==run.routes.length||choices.some((n,i)=>n.type!==run.routes[i]))fail();
  const selected=map.path.length===offset+1?segment.nodes.find(n=>n.id===map.path[offset]):null;
  if((selected?.type||null)!==run.node)fail();
  if(run.phase==='battle'&&!['battle','elite','boss'].includes(selected?.type)||run.phase==='event'&&selected?.type!=='event'||['relic','contract'].includes(run.phase)&&selected?.type!=='boss'||run.phase==='blessing'&&!['battle','elite','boss','rest','event'].includes(selected?.type))fail();
}
