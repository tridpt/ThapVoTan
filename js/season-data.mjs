export const SEASON_DAYS=14;
export const SEASON_NAME='Lời nguyền Tháp';
export const SEASON_CURRENCY='Ấn hắc nguyệt';
export const SEASON_FLOORS=5;
export const SEASON_ROUTES=Object.freeze([
  Object.freeze(['battle','elite']),Object.freeze(['battle','elite']),
  Object.freeze(['rest','elite']),Object.freeze(['battle','treasure']),Object.freeze(['boss'])
]);
export const SEASON_CURSES=Object.freeze([
  Object.freeze({id:'blood',name:'Máu đổi quyền năng',icon:'drop',color:'#e5a095',benefit:'Kỹ năng gây thêm 20% sát thương',cost:'Mọi hồi máu của đội giảm 25%',skill:1.2,healing:.75,shield:1,enemyHp:1,incoming:1,energy:0,opening:0,hint:'Dùng khiên và dồn kỹ năng để vượt qua cái giá hồi phục.'}),
  Object.freeze({id:'iron',name:'Xiềng xích cổ thạch',icon:'shield',color:'#a0d6ce',benefit:'Khiên của đội +35% · Đánh thường +10 năng lượng',cost:'Địch có thêm 20% máu',skill:1,healing:1,shield:1.35,enemyHp:1.2,incoming:1,energy:10,opening:0,hint:'Mang hộ vệ, giữ khiên và xoay vòng kỹ năng để phá lớp máu dày.'}),
  Object.freeze({id:'void',name:'Tiếng gọi vực sâu',icon:'moon',color:'#bea6ec',benefit:'Kỹ năng gây thêm 25% sát thương · Đầu trận +15 năng lượng',cost:'Địch gây thêm 15% sát thương',skill:1.25,healing:1,shield:1,enemyHp:1,incoming:1.15,energy:0,opening:15,hint:'Giữ đóng băng, phá giáp đầu và đỡ đúng nhịp trước chiêu quét.'})
]);
export const SEASON_CURSE=Object.freeze(Object.fromEntries(SEASON_CURSES.map(c=>[c.id,c])));
const dayNames=['Cánh cổng nứt','Dấu chân tro','Lời thề đầu tiên','Đêm không trăng','Xiềng xích thức giấc','Bóng dưới tháp','Hắc nguyệt lên','Tàn lửa trở lại','Ký ức bị nguyền','Tiếng chuông vỡ','Đêm săn ấn','Vết nứt cuối','Trước ngôi báu','Bình minh giải nguyền'];
export const SEASON_DAILY=Object.freeze(dayNames.map((name,i)=>Object.freeze({day:i+1,name,missions:Object.freeze([
  Object.freeze({id:'battles',name:'Dọn đường nguyền',description:`Thắng ${i%3===2?3:2} trận trong Lời nguyền Tháp.`,metric:'battles',goal:i%3===2?3:2,seals:25,icon:'sword'}),
  Object.freeze({id:'skills',name:'Đánh thức quyền năng',description:`Dùng ${i%2===0?3:4} kỹ năng anh hùng trong sự kiện.`,metric:'skills',goal:i%2===0?3:4,seals:25,icon:'star'}),
  Object.freeze({id:'clears',name:'Phá ngai nguyền',description:'Hạ Vua Nguyền Ấn, hoàn thành một hành trình sự kiện.',metric:'clears',goal:1,seals:50,icon:'crown'})
])})));
export const SEASON_MILESTONES=Object.freeze([
  Object.freeze({id:'seal-50',goal:50,name:'Chạm vào lời nguyền',reward:Object.freeze({gold:300,tickets:2,dust:5,shards:0})}),
  Object.freeze({id:'seal-150',goal:150,name:'Người phá xiềng',reward:Object.freeze({gold:500,tickets:3,dust:8,shards:3})}),
  Object.freeze({id:'seal-300',goal:300,name:'Đi qua hắc nguyệt',reward:Object.freeze({gold:800,tickets:5,dust:12,shards:5})}),
  Object.freeze({id:'seal-600',goal:600,name:'Thách thức ngai vàng',reward:Object.freeze({gold:1200,tickets:6,dust:20,shards:8})}),
  Object.freeze({id:'seal-1000',goal:1000,name:'Kẻ hóa giải lời nguyền',reward:Object.freeze({gold:1800,tickets:10,dust:30,shards:12})})
]);
export const SEASON_FRAGMENT_HEROES=Object.freeze(['astra','nyx']);
export const SEASON_FRAGMENT_COST=60;
export const SEASON_COSMETICS=Object.freeze(['rook-guardian','aerin-moon','aura-eclipse']);
export const SEASON_SHOP=Object.freeze([
  Object.freeze({id:'astra-fragment',name:'Mảnh Astra ×5',description:'Ghép 60 mảnh để nhận Astra SSR hoặc một bản trùng.',kind:'fragment',hero:'astra',amount:5,cost:40,limit:12,icon:'star'}),
  Object.freeze({id:'nyx-fragment',name:'Mảnh Nyx ×5',description:'Ghép 60 mảnh để nhận Nyx SSR hoặc một bản trùng.',kind:'fragment',hero:'nyx',amount:5,cost:40,limit:12,icon:'moon'}),
  Object.freeze({id:'guardian-outfit',name:'Rook · Vệ thần',description:'Mở vĩnh viễn giáp ngọc, vương miện và đại khiên của Rook.',kind:'cosmetic',cosmetic:'rook-guardian',cost:250,limit:1,icon:'outfit'}),
  Object.freeze({id:'moon-outfit',name:'Aerin · Nguyệt ảnh',description:'Mở vĩnh viễn áo choàng đêm và cung trăng bạc của Aerin.',kind:'cosmetic',cosmetic:'aerin-moon',cost:250,limit:1,icon:'outfit'}),
  Object.freeze({id:'eclipse-aura',name:'Hào quang Hắc nguyệt',description:'Vòng ấn đỏ và tinh thạch tím cho toàn đội. Dùng cùng trang phục.',kind:'cosmetic',cosmetic:'aura-eclipse',cost:450,limit:1,icon:'crown'}),
  Object.freeze({id:'summon-ticket',name:'Vé triệu hồi ×1',description:'Dùng tại Cổng tinh tú thường trực.',kind:'resource',resource:'tickets',amount:1,cost:30,limit:10,icon:'ticket'}),
  Object.freeze({id:'forge-dust',name:'Bụi rèn ×10',description:'Nâng cấp và tẩy luyện trang bị trong Túi đồ.',kind:'resource',resource:'dust',amount:10,cost:25,limit:10,icon:'forge'})
]);
export const SEASON_ITEM=Object.freeze(Object.fromEntries(SEASON_SHOP.map(i=>[i.id,i])));
export const SEASON_BOSS=Object.freeze({id:'curse-king',name:'Vua Nguyền Ấn',title:'Ngai vàng dưới hắc nguyệt',icon:'crown',color:'#dba0c4',desc:'Khắc nguyền lấy 15 năng lượng của tướng còn sống, rồi Giáng nguyền đánh cả đội và tạo khiên 8% máu tối đa. Hai kỹ năng gây sát thương khi tụ lực, đóng băng hoặc phá giáp đầu sẽ ngắt chiêu.',phase:'Dưới 50% máu, Giáng nguyền mạnh hơn. Giáp lõi đã phá tăng 25% sát thương trực tiếp.',moves:Object.freeze({strike:Object.freeze(['Lưỡi ấn','Đánh một đồng đội.']),charge:Object.freeze(['Khắc nguyền','Lấy 15 năng lượng của tướng còn sống. Chuẩn bị Giáng nguyền.']),quake:Object.freeze(['Giáng nguyền','Đánh toàn đội và tạo khiên bằng 8% máu tối đa. Ngắt bằng hai kỹ năng hoặc đóng băng.']),stunned:Object.freeze(['Lời nguyền đứt đoạn','Boss đã bị ngắt và bỏ lượt kế tiếp.'])})});
