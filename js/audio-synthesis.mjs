// Original procedural audio, generated locally. No downloads, permissions or gameplay randomness.
export const AUDIO_RATE=22050;
const TAU=Math.PI*2;
const clip=x=>Math.max(-.92,Math.min(.92,x));
const attacks={sword:[.22,950,150,.7],dagger:[.15,1500,260,.58],bow:[.2,440,100,.34],shield:[.29,155,48,.52],staff:[.38,320,720,.18],orb:[.42,180,880,.12],creature:[.25,90,42,.42]};
export function synthesizeCue(key,rate=AUDIO_RATE){
  const [kind,name,phase='impact']=key.split(':');
  if(kind==='music')return synthesizeMusic(name==='boss',rate);
  const profile=attacks[name]||attacks.creature;
  const duration=kind==='weapon'?(phase==='release'?profile[0]*.7:profile[0]):kind==='element'?.38:kind==='aid'?.48:kind==='break'?.42:kind==='ui'?(name==='summon'?.65:name==='win'?.58:.1):.25;
  const out=new Float32Array(Math.ceil(duration*rate));let seed=173;
  for(const c of key)seed=(Math.imul(seed,31)+c.charCodeAt(0))>>>0;
  let filtered=0;
  for(let i=0;i<out.length;i++){
    const t=i/rate,p=t/duration,attack=Math.min(1,t/.004),env=attack*(1-p)**2;
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=seed/2147483648-1;
    filtered+=.18*(noise-filtered);let value=0;
    if(kind==='weapon'){
      const [,high,low,n]=profile,release=phase==='release';
      const freq=release?high*.5+(low-high*.5)*p:high+(low-high)*p;
      const sweep=TAU*(release?high*.5*t+(low-high*.5)*t*t/(2*duration):high*t+(low-high)*t*t/(2*duration));
      const metal=Math.sin(sweep)*.45+Math.sin(sweep*2.71)*.18+Math.sin(sweep*4.13)*.08;
      if(name==='bow')value=release?(Math.sin(TAU*freq*t)*Math.exp(-t*26)*.6+(noise-filtered)*.2):filtered*.85+Math.sin(TAU*95*t)*.35;
      else if(name==='staff'||name==='orb')value=Math.sin(sweep)*.5+Math.sin(sweep*1.5)*.2+filtered*.3;
      else value=metal*(release?.15:.65)+(noise-filtered)*n*(release?.75:.5)+filtered*(name==='shield'?.9:.15);
      if(release&&(name==='sword'||name==='dagger'))value=(noise-filtered)*Math.sin(p*Math.PI)*.75;
      value*=env;
    }else if(kind==='element'){
      if(name==='Hỏa')value=(filtered*.9+Math.sin(TAU*(65*t-35*t*t))*.3)*env;
      else if(name==='Băng')value=([970,1430,2110].reduce((v,f)=>v+Math.sin(TAU*f*t),0)*.16+noise*.12)*env;
      else if(name==='Lôi')value=((noise-filtered)*.6+Math.sin(TAU*70*t)*.22)*env*(.5+.5*Math.sin(TAU*34*t)**2);
      else if(name==='Phong')value=filtered*1.2*env;
      else if(name==='Ảnh')value=(Math.sin(TAU*(180*t-95*t*t))*.4+filtered*.25)*env;
      else if(name==='Thổ')value=(Math.sin(TAU*(85*t-40*t*t))*.6+filtered*.5)*env;
      else value=(Math.sin(TAU*659.25*t)+Math.sin(TAU*987.77*t)*.4)*env*.35;
    }else if(kind==='aid'){
      value=[523.25,659.25,783.99].reduce((sum,f,j)=>sum+Math.sin(TAU*f*t)*Math.max(0,1-Math.abs(t-j*.07)/.35),0)*env*.25;
      if(name==='shield')value=value*.65+Math.sin(TAU*196*t)*env*.25;
    }else if(kind==='break')value=(noise*.3+filtered*.4+Math.sin(TAU*(210*t-170*t*t))*.4)*env;
    else{
      const notes=name==='summon'?[392,493.88,587.33,783.99]:name==='win'?[440,554.37,659.25]:[470];
      for(let j=0;j<notes.length;j++){const a=t-j*.1,life=Math.min(.25,duration-j*.1);if(a>=0&&a<life)value+=Math.sin(TAU*notes[j]*a)*Math.min(1,a/.006)*(1-a/life)**2*.3;}
    }
    out[i]=clip(value);
  }
  return {samples:out,rate,duration:out.length/rate};
}
function synthesizeMusic(boss,rate){
  const beat=boss?.5:.625,bars=4,seconds=beat*4*bars,out=new Float32Array(Math.round(seconds*rate));
  const roots=[73.4162,65.4064,58.2705,65.4064],minor=[1,1.189207,1.498307,2];
  for(let i=0;i<out.length;i++){
    const t=i/rate,local=t%(4*beat),bar=Math.min(3,Math.floor(t/(4*beat))),root=roots[bar],step=Math.floor(t/beat),u=(t%beat)/beat,barFade=Math.min(1,local/.04,(4*beat-local)/.04);
    // Gentle D-minor pad with a periodic envelope; the loop joins at silence.
    const fade=Math.min(1,t/.2,(seconds-t)/.2),pad=(Math.sin(TAU*root*t)+Math.sin(TAU*root*minor[1]*t)*.4+Math.sin(TAU*root*minor[2]*t)*.3)*.09;
    const note=root*2*minor[[0,2,1,2,3,2,1,2][step%8]],arp=Math.sin(TAU*note*t)*Math.sin(Math.PI*u)**2*(boss?.065:.045);
    const kick=boss?Math.sin(TAU*(48*u*beat+24*(1-Math.exp(-u*beat*30))))*Math.exp(-u*beat*22)*.16:0;
    const pulse=boss?Math.sin(TAU*root*.5*t)*(.5+.5*Math.cos(TAU*u))*.05:0;
    out[i]=clip(((pad+pulse)*barFade+arp+kick)*fade);
  }
  return {samples:out,rate,duration:out.length/rate};
}
