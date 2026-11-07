// Reserve the measured command tray, including callouts that extend above it.
export function commandSpace(rects,viewportHeight){
  if(!Number.isFinite(viewportHeight)||viewportHeight<=0)return null;
  const visible=rects.filter(r=>r&&[r.top,r.bottom,r.width,r.height].every(Number.isFinite)&&r.width>0&&r.height>0&&r.bottom>0&&r.top<viewportHeight);
  if(!visible.length)return null;
  return Math.ceil(Math.max(0,viewportHeight-Math.min(...visible.map(r=>r.top)))+16);
}
export class TouchLayout{
  constructor({document=globalThis.document,window=globalThis.window,ResizeObserver=globalThis.ResizeObserver}={}){
    this.document=document;this.window=window;this.shell=null;this.tray=null;
    this.update=()=>this.measure();this.observer=typeof ResizeObserver==='function'?new ResizeObserver(this.update):null;
    window?.addEventListener?.('resize',this.update);window?.visualViewport?.addEventListener?.('resize',this.update);
  }
  mount(){
    const shell=this.document?.querySelector('.game-shell'),tray=this.document?.querySelector('.combat-command');
    if(shell!==this.shell||tray!==this.tray){this.observer?.disconnect();this.shell?.style?.removeProperty('--command-space');this.shell=shell;this.tray=tray;this.space=null;if(tray)this.observer?.observe(tray);}
    this.measure();
  }
  measure(){
    if(!this.tray?.isConnected||!this.shell?.isConnected||!this.tray.getBoundingClientRect)return;
    const viewport=this.window?.visualViewport,height=viewport?viewport.height+(viewport.offsetTop||0):this.window?.innerHeight;
    const callouts=[...this.tray.querySelectorAll('.counter-control,.contract-skill-hint,.anomaly-action-hint')]
      .filter(e=>['absolute','fixed'].includes(this.window?.getComputedStyle?.(e)?.position));
    const rects=[this.tray,...callouts].map(e=>e.getBoundingClientRect());
    const space=commandSpace(rects,height);if(space!==null&&this.space!==space){this.shell.style.setProperty('--command-space',space+'px');this.space=space;}
  }
  dispose(){this.observer?.disconnect();this.window?.removeEventListener?.('resize',this.update);this.window?.visualViewport?.removeEventListener?.('resize',this.update);this.shell?.style?.removeProperty('--command-space');this.shell=this.tray=null;this.space=null;}
}
