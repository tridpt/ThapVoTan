export const GEAR_SETS=[
  {id:'bastion',name:'Thành trì',color:'#a6d4be',icon:'shield',boss:'colossus',two:'Tăng 12% sinh lực tối đa.',three:'Sau kỹ năng, bản thân nhận khiên bằng 8% sinh lực tối đa.',hp:.12,shield:.08},
  {id:'ember',name:'Tro tàn',color:'#e7a17d',icon:'flame',boss:'ashknight',two:'Tăng 10% tấn công.',three:'Đòn đánh và kỹ năng gây thiêu đốt 2 lượt, bằng 12% ATK mỗi lượt.',atk:.10,burn:.12},
  {id:'bloodmoon',name:'Huyết nguyệt',color:'#d9a5d0',icon:'moon',boss:'moonwarden',two:'Tăng 8% tấn công.',three:'Hồi máu bằng 8% sát thương trực tiếp gây ra.',atk:.08,drain:.08},
  {id:'mirror',name:'Gương hộ vệ',color:'#b7b7eb',icon:'gem',boss:'archivist',two:'Tăng 4 phòng thủ.',three:'Phản 20% máu thực sự bị mất cho kẻ tấn công.',def:4,reflect:.20},
  {id:'void',name:'Hư Không',color:'#b9a4ef',icon:'moon',boss:'void-dragon',two:'Tăng 10% tấn công.',three:'Mỗi đòn trực tiếp tích 1 dấu trên địch; đủ 3 dấu nổ 80% ATK của người kích nổ. Cả đội dùng chung dấu.',atk:.10,void:.80}
];
export const GEAR_SET=Object.fromEntries(GEAR_SETS.map(s=>[s.id,s]));
const signatureData=[
  ['aerin','Lời thề lữ phong','mirror','energy',15,'Bản thân nhận thêm 15 năng lượng.'],
  ['rook','Cổng đá bình minh','bastion','teamShield',.06,'Cả đội nhận thêm khiên bằng 6% HP tối đa của Rook.'],
  ['lumi','Đèn dẫn bình minh','mirror','teamEnergy',8,'Mỗi đồng đội còn sống nhận 8 năng lượng.'],
  ['ember','Mồi lửa đầu tiên','ember','burn',.20,'Thiêu đốt mục tiêu 2 lượt, bằng 20% ATK mỗi lượt.'],
  ['kira','Song ảnh tĩnh lặng','bloodmoon','echo',.25,'Đánh bồi mục tiêu bằng 25% ATK.'],
  ['bryn','Tinh trượng đông miên','mirror','teamShield',.05,'Cả đội nhận thêm khiên bằng 5% HP tối đa của Bryn.'],
  ['raiden','Lôi kiếm ngân vang','ember','energy',20,'Bản thân nhận thêm 20 năng lượng.'],
  ['seraph','Thánh âm hy vọng','bastion','teamEnergy',10,'Mỗi đồng đội còn sống nhận 10 năng lượng.'],
  ['thorne','Mộc thuẫn trường sinh','bastion','teamHeal',.06,'Hồi thêm 6% HP tối đa cho từng đồng đội.'],
  ['astra','Thiên cầu sao rơi','mirror','echo',.30,'Đánh bồi mục tiêu bằng 30% ATK.'],
  ['nyx','Song nha nhật thực','bloodmoon','selfHeal',.12,'Hồi thêm 12% HP tối đa cho bản thân.'],
  ['kael','Phượng kiếm bất diệt','ember','burnAll',.18,'Thiêu đốt mọi địch còn sống 2 lượt, bằng 18% ATK mỗi lượt.'],
  ['eira','Trượng suối cực quang','mirror','teamShield',.07,'Cả đội nhận thêm khiên bằng 7% HP tối đa của Eira.'],
  ['veyron','Thiên lôi phán quyết','ember','echo',.32,'Đánh bồi mục tiêu bằng 32% ATK.'],
  ['solis','Thái dương chi tâm','ember','burnAll',.22,'Thiêu đốt mọi địch còn sống 2 lượt, bằng 22% ATK mỗi lượt.'],
  ['selene','Huyết nguyệt song nhận','bloodmoon','selfHeal',.14,'Hồi thêm 14% HP tối đa cho bản thân.'],
  ['orion','Thiên môn thánh thuẫn','bastion','teamEnergy',10,'Mỗi đồng đội còn sống nhận 10 năng lượng.'],
  ['lyra','Trượng hòa âm sáng thế','mirror','teamEnergy',8,'Mỗi đồng đội còn sống nhận 8 năng lượng.'],
  ['aion','Hạt giống khởi nguyên','bastion','teamShield',.08,'Cả đội nhận thêm khiên bằng 8% HP tối đa của Aion.'],
  ['eclipse','Song liêm vĩnh hằng','bloodmoon','echo',.35,'Đánh bồi mục tiêu bằng 35% ATK.']
];
export const SIGNATURES=Object.fromEntries(signatureData.map(([hero,name,set,effect,power,desc])=>[hero,{hero,name,set,effect,power,desc}]));
export const ARMORY_BASES=[
  ...GEAR_SETS.flatMap(s=>[['weapon','Vũ khí','sword'],['armor','Giáp','shield'],['charm','Ấn','gem']].map(([slot,label,icon])=>({id:`set-${s.id}-${slot}`,name:`${label} ${s.name.toLocaleLowerCase('vi')}`,slot,icon,set:s.id,crafted:true}))),
  ...Object.values(SIGNATURES).map(s=>({id:'signature-'+s.hero,name:s.name,slot:'weapon',icon:'star',set:s.set,hero:s.hero,crafted:true}))
];
export const HUNTS=[
  {id:'colossus',name:'Cự nhân cổ đại',material:'Ấn địa chấn',color:'#b9c99e',world:'forest'},
  {id:'archivist',name:'Người gác thư viện',material:'Ấn ký ức',color:'#c1b2e8',world:'sky'},
  {id:'ashknight',name:'Kỵ sĩ tro tàn',material:'Ấn tro lửa',color:'#e6a17e',world:'lava'},
  {id:'moonwarden',name:'Hộ thần mặt trăng',material:'Ấn nguyệt sắc',color:'#a7d7e8',world:'ice'}
];
export const HUNT=Object.fromEntries(HUNTS.map(h=>[h.id,h]));
export const HUNT_TIERS=[{name:'Khám phá',scale:1,marks:1,gold:90,essence:1},{name:'Tinh anh',scale:1.65,marks:2,gold:140,essence:2},{name:'Ác mộng',scale:2.6,marks:3,gold:220,essence:4}];

export const FORGE_SOURCES={...HUNT,'void-dragon':{id:'void-dragon',name:'Hắc Long Hư Không',material:'Vảy Hư Không',color:'#b9a4ef',world:'ruins',raid:true}};
