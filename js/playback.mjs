// Presentation never owns gameplay. Commit/save once, then show or skip the result.
export class BattlePlayback{
  constructor({schedule=setTimeout,unschedule=clearTimeout}={}){this.schedule=schedule;this.unschedule=unschedule;this.current=null;}
  get active(){return !!this.current;}
  cancel(){const token=this.current;if(!token)return;token.cancelled=true;try{token.interrupt?.();}finally{token.release();}}
  async run({commit,opening,start,impact,finish,interrupt}={}){
    if(this.active)return false;
    let release;const cancelled=new Promise(resolve=>release=resolve),token={cancelled:false,release,interrupt,timer:null};this.current=token;
    const wait=async ms=>{if(token.cancelled||ms<=0)return;await Promise.race([new Promise(resolve=>{token.timer=this.schedule(resolve,ms);}),cancelled]);this.unschedule(token.timer);token.timer=null;};
    try{
      const result=commit();
      if(!token.cancelled&&opening)await Promise.race([opening(result),cancelled]);
      if(!token.cancelled){const timing=start(result)||{duration:0,impact:0};await wait(timing.impact);if(!token.cancelled)impact?.(result);await wait(Math.max(0,timing.duration-timing.impact));}
      return true;
    }finally{this.unschedule(token.timer);this.current=null;finish?.();}
  }
}
