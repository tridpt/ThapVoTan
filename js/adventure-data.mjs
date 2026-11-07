export const ELEMENTS = [
  {id:'earth',name:'Thổ',color:'#a8c68e',icon:'shield'},
  {id:'wind',name:'Phong',color:'#85d2b7',icon:'wind'},
  {id:'light',name:'Quang',color:'#e8cf92',icon:'star'},
  {id:'fire',name:'Hỏa',color:'#ef9f7c',icon:'flame'},
  {id:'shadow',name:'Ảnh',color:'#c2a0e0',icon:'moon'},
  {id:'ice',name:'Băng',color:'#96d9ed',icon:'snow'},
  {id:'thunder',name:'Lôi',color:'#b7b2ff',icon:'bolt'}
];
export const ELEMENT = Object.fromEntries(ELEMENTS.map(e=>[e.id,e]));
export const PETS = [
  {id:'mossling',name:'Mộc Linh',element:'earth',rarity:'R',shape:'turtle',title:'Mầm xanh trên mai đá',skill:'Mai rừng chở che',kind:'shield',cost:0,desc:'Tạo khiên cho mọi đồng đội còn sống.',hint:'Khiên kết hợp cộng hưởng Thổ và Gương hộ vệ.'},
  {id:'zephyr',name:'Vũ Linh',element:'wind',rarity:'SR',shape:'bird',title:'Đôi cánh của gió',skill:'Gió tiếp sức',kind:'energy',cost:18,desc:'Tiếp năng lượng cho mọi đồng đội còn sống.',hint:'Giúp cả đội dùng kỹ năng sớm hơn.'},
  {id:'stella',name:'Tinh Hươu',element:'light',rarity:'SR',shape:'deer',title:'Người dẫn đường dưới sao',skill:'Suối sao an lành',kind:'heal',cost:18,desc:'Hồi máu cho mọi đồng đội còn sống. Không hồi sinh.',hint:'Kết hợp cộng hưởng Quang và Chén suối nguồn.'},
  {id:'vermillion',name:'Hồng Vũ',element:'fire',rarity:'SSR',shape:'phoenix',title:'Phượng hoàng trong tàn lửa',skill:'Vũ điệu hỏa điểu',kind:'burn',cost:30,desc:'Đánh toàn bộ địch và thiêu đốt trong 2 lượt.',hint:'Thiêu đốt hưởng cộng hưởng Hỏa và kích nổ Hạt giống tro tàn.'},
  {id:'umbra',name:'Nguyệt Hồ',element:'shadow',rarity:'SSR',shape:'fox',title:'Chiếc đuôi giấu mặt trăng',skill:'Cắn trăng',kind:'drain',cost:30,desc:'Ưu tiên Hộ vệ còn bảo hộ, rồi địch ít máu nhất; hồi 30% sát thương gây ra cho đồng đội ít máu nhất còn sống.',hint:'Hút máu thực nhận; không hồi sinh người đã gục.'},
  {id:'nixie',name:'Tuyết Miêu',element:'ice',rarity:'SR',shape:'cat',title:'Bước chân trên băng mỏng',skill:'Dấu chân băng',kind:'freeze',cost:18,desc:'Ưu tiên Hộ vệ còn bảo hộ, rồi địch ít máu nhất; đánh và đóng băng trong lượt kế tiếp.',hint:'Đóng băng ngắt Địa chấn và sấm tụ lực; kết hợp Lăng kính băng.'},
  {id:'raiju',name:'Lôi Long',element:'thunder',rarity:'UR',shape:'dragon',title:'Rồng nhỏ giữa bão trời',skill:'Long lôi kích',kind:'strike',cost:45,desc:'Gây sát thương lớn, ưu tiên Hộ vệ còn bảo hộ rồi địch ít máu nhất.',hint:'Dồn sát thương để hạ mục tiêu trước khi chúng ra đòn.'}
];
export const PET = Object.fromEntries(PETS.map(p=>[p.id,p]));
export const PET_MAX_LEVEL=20;
export const DUNGEON_DIFFICULTIES = [
  {level:1,name:'Khám phá',scale:1,cores:4,daily:8,first:8,recommend:'Đội cấp 1–5'},
  {level:2,name:'Tinh anh',scale:1.85,cores:7,daily:12,first:12,recommend:'Đội cấp 8–15'},
  {level:3,name:'Ác mộng',scale:3,cores:10,daily:16,first:16,recommend:'Đội cấp 20+ / Có trang bị'}
];
export const DUNGEON_ROOMS=['battle','elite','boss'];
export const DUNGEONS = [
  {id:'earth',name:'Rừng đá thức giấc',bossId:'basalt',landmark:'CỔ THỤ / ĐÁ RÊU',desc:'Rễ xanh ôm lấy những tảng đá biết chuyển mình.'},
  {id:'wind',name:'Đảo gió lơ lửng',bossId:'groveheart',landmark:'THIÊN KHÔNG / GIÓ',desc:'Những cánh đảo nổi trên dòng khí cuộn không ngừng.'},
  {id:'light',name:'Thánh điện bình minh',bossId:'sunlion',landmark:'NHẬT QUANG / THÁNH ĐIỆN',desc:'Dưới mái vòm vàng, ánh sáng cũng có người canh giữ.'},
  {id:'fire',name:'Miệng núi lửa đỏ',bossId:'cinderwyrm',landmark:'DUNG NHAM / TRO TÀN',desc:'Một nhịp thở rực lửa vang lên dưới lòng đất.'},
  {id:'shadow',name:'Khu vườn nhật thực',bossId:'voidfox',landmark:'NGUYỆT ẢNH / GIẤC MỘNG',desc:'Mặt trăng nằm im trong những đóa hoa không bóng.'},
  {id:'ice',name:'Cung điện băng ngọc',bossId:'frostqueen',landmark:'BĂNG GIÁ / NGỌC LAM',desc:'Mỗi bước chân đánh thức một ký ức mùa đông.'},
  {id:'thunder',name:'Đỉnh trời giông tố',bossId:'stormwing',landmark:'LÔI VÂN / ĐỈNH TRỜI',desc:'Bên trên tầng mây, tiếng sấm gọi kẻ thách đấu.'}
].map(d=>({...d,element:ELEMENT[d.id].name,color:ELEMENT[d.id].color,icon:ELEMENT[d.id].icon}));
export const DUNGEON = Object.fromEntries(DUNGEONS.map(d=>[d.id,d]));
export const DUNGEON_BOSSES = [
  {id:'basalt',name:'Cổ Quy Thạch',element:'earth',shape:'turtle',title:'Cả khu rừng trên một chiếc mai',desc:'Tạo khiên bằng 14% máu tối đa rồi dùng Địa ba đánh cả đội. Kỹ năng gây sát thương phá lớp khiên này trước khi ra đòn.',signature:['Mai đá','Tạo khiên bằng 14% máu tối đa. Dùng kỹ năng gây sát thương để phá.'],surge:['Địa ba','Đánh cả đội bằng 90% tấn công.']},
  {id:'groveheart',name:'Đại Bằng Thiên Phong',element:'wind',shape:'bird',title:'Đôi cánh nâng những hòn đảo',desc:'Gió cắt đánh hai đồng đội rồi Bão cuốn đánh cả đội. Tạo khiên và hồi phục trước lượt bão.',signature:['Gió cắt','Đánh hai đồng đội còn sống, mỗi người chịu 65% tấn công.'],surge:['Bão cuốn','Đánh cả đội bằng 90% tấn công.']},
  {id:'sunlion',name:'Sư Vương Nhật Quang',element:'light',shape:'lion',title:'Ánh sáng không chịu lụi tắt',desc:'Hồi 8% máu tối đa rồi dùng Nhật quang đánh cả đội. Dồn kỹ năng sau lượt hồi để kết thúc trận.',signature:['Tái sinh bình minh','Hồi 8% máu tối đa của boss.'],surge:['Nhật quang','Đánh cả đội bằng 95% tấn công.']},
  {id:'cinderwyrm',name:'Hỏa Long Tro Tàn',element:'fire',shape:'dragon',title:'Trái tim nóng hơn lòng núi',desc:'Nanh lửa đánh mạnh một đồng đội rồi biển lửa quét toàn đội. Dùng hộ vệ, khiên và hồi máu để đi qua chuỗi đòn.',signature:['Nanh lửa','Đánh một đồng đội bằng 135% tấn công.'],surge:['Biển lửa','Đánh cả đội bằng 90% tấn công.']},
  {id:'voidfox',name:'Cửu Vĩ Hư Không',element:'shadow',shape:'fox',title:'Giấc mộng nuốt ánh trăng',desc:'Hút máu bằng 50% HP thực sự lấy đi rồi tự tạo khiên 10% máu tối đa. Khiên đồng đội làm giảm lượng máu boss hút được.',signature:['Cắn giấc mộng','Đánh một người và hồi 50% sát thương HP thực nhận.'],surge:['Màn đêm','Tạo khiên bằng 10% máu tối đa.']},
  {id:'frostqueen',name:'Bạch Miêu Băng Ngọc',element:'ice',shape:'cat',title:'Nữ vương của mùa đông câm lặng',desc:'Đòn băng rút 30 năng lượng của mục tiêu rồi Bão tuyết đánh cả đội. Dùng kỹ năng trước khi bị rút năng lượng.',signature:['Giá rét','Đánh một người bằng 90% tấn công, rút 30 năng lượng.'],surge:['Bão tuyết','Đánh cả đội bằng 80% tấn công.']},
  {id:'stormwing',name:'Lôi Long Thiên Đỉnh',element:'thunder',shape:'dragon',title:'Tiếng sấm đầu tiên của bầu trời',desc:'Tụ lôi một lượt rồi Thiên phạt đánh mạnh cả đội. Dùng hai kỹ năng gây sát thương khi boss tụ lực hoặc đóng băng để ngắt.',signature:['Tụ lôi','Chưa gây sát thương. Dùng 2 kỹ năng gây sát thương hoặc đóng băng để ngắt.'],surge:['Thiên phạt','Đánh cả đội bằng 140% tấn công.']}
].map(b=>({...b,color:ELEMENT[b.element].color,icon:ELEMENT[b.element].icon,phase:'Dưới 50% máu, mọi đòn đánh tăng 15% sát thương.',moves:{strike:['Canh giữ','Đánh một đồng đội bằng 100% tấn công.'],signature:b.signature,surge:b.surge,...(b.id==='stormwing'?{stunned:['Tán lôi','Boss đã bị ngắt, bỏ lượt này.']}: {})}}));
