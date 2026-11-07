export class FakeAudioContext{
  constructor(){this.state='suspended';this.currentTime=3;this.destination={};this.sources=[];this.buffers=[];this.gains=[];this.resumes=0;this.suspends=0;}
  createGain(){const gain={gain:{value:1},connect(){},disconnect(){this.disconnected=true;}};this.gains.push(gain);return gain;}
  createBuffer(channels,length,rate){const data=new Float32Array(length),buffer={numberOfChannels:channels,length,sampleRate:rate,duration:length/rate,getChannelData:()=>data};this.buffers.push(buffer);return buffer;}
  createBufferSource(){const source={playbackRate:{value:1},connect(){},disconnect(){this.disconnected=true;},start(at){this.started=at;},stop(){this.stopped=true;this.onended?.();}};this.sources.push(source);return source;}
  resume(){this.resumes++;this.state='running';return Promise.resolve();}
  suspend(){this.suspends++;this.state='suspended';return Promise.resolve();}
  close(){this.state='closed';return Promise.resolve();}
}
