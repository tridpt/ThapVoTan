import {DUNGEON_BOSSES} from './adventure-data.mjs';
import {ARMORY_BASES} from './armory-data.mjs';

export const HEROES = [
  {id:'aerin',name:'Aerin',title:'Mũi tên của rừng',rarity:'SR',element:'Phong',role:'Xạ thủ',color:'#83bda4',hp:162,atk:37,def:9,skill:'Bão tên',desc:'Gây 145% sát thương lên toàn bộ địch.',kind:'aoe',weapon:'bow',hair:'#d7e4c7',skin:'#e9c6a2'},
  {id:'rook',name:'Rook',title:'Người giữ cổng',rarity:'R',element:'Thổ',role:'Hộ vệ',color:'#c5ac79',hp:242,atk:24,def:17,skill:'Thành trì',desc:'Gây 150% sát thương. Cả đội nhận khiên bằng 22% máu tối đa của Rook.',kind:'shield',weapon:'shield',hair:'#8c7b65',skin:'#c69779'},
  {id:'lumi',name:'Lumi',title:'Ánh sáng nhỏ',rarity:'R',element:'Quang',role:'Trị liệu',color:'#9bcbd0',hp:154,atk:27,def:9,skill:'Bình minh',desc:'Hồi 30% máu tối đa cho cả đội, kể cả đồng đội gục ngã.',kind:'heal',weapon:'staff',hair:'#e2ece6',skin:'#e8c2b1'},
  {id:'ember',name:'Ember',title:'Người nhóm lửa',rarity:'R',element:'Hỏa',role:'Pháp sư',color:'#df9074',hp:150,atk:36,def:7,skill:'Tàn lửa',desc:'Gây 230% sát thương và thiêu đốt mục tiêu trong 2 lượt.',kind:'burn',weapon:'staff',hair:'#bd604a',skin:'#e8b494'},
  {id:'kira',name:'Kira',title:'Bóng đêm lặng lẽ',rarity:'R',element:'Ảnh',role:'Sát thủ',color:'#b49fcf',hp:155,atk:35,def:8,skill:'Ám kích',desc:'Gây 290% sát thương lên một mục tiêu.',kind:'strike',weapon:'dagger',hair:'#4e405d',skin:'#d5b2a5'},
  {id:'bryn',name:'Bryn',title:'Lời thì thầm băng giá',rarity:'SR',element:'Băng',role:'Pháp sư',color:'#99c6e1',hp:171,atk:36,def:10,skill:'Đông cứng',desc:'Gây 200% sát thương và đóng băng mục tiêu trong lượt kế tiếp.',kind:'freeze',weapon:'staff',hair:'#e0e8f3',skin:'#e9c8b8'},
  {id:'raiden',name:'Raiden',title:'Lưỡi kiếm sấm',rarity:'SR',element:'Lôi',role:'Chiến binh',color:'#b4a5df',hp:202,atk:37,def:12,skill:'Lôi trảm',desc:'Gây 310% sát thương lên một mục tiêu.',kind:'strike',weapon:'sword',hair:'#47485f',skin:'#d5b397'},
  {id:'seraph',name:'Seraph',title:'Người dệt hy vọng',rarity:'SR',element:'Quang',role:'Trị liệu',color:'#e0c994',hp:179,atk:31,def:11,skill:'Thánh ca',desc:'Hồi 38% máu tối đa cho cả đội, kể cả đồng đội gục ngã.',kind:'heal',weapon:'staff',hair:'#e6cf92',skin:'#e9c7aa'},
  {id:'thorne',name:'Thorne',title:'Rễ của cổ thụ',rarity:'SR',element:'Thổ',role:'Hộ vệ',color:'#8ca990',hp:275,atk:28,def:19,skill:'Rừng bất diệt',desc:'Gây 180% sát thương. Cả đội nhận khiên bằng 28% máu tối đa của Thorne.',kind:'shield',weapon:'shield',hair:'#3e6151',skin:'#b89577'},
  {id:'astra',name:'Astra',title:'Người đánh thức sao trời',rarity:'SSR',element:'Quang',role:'Pháp sư',color:'#e3c58a',hp:202,atk:44,def:12,skill:'Thiên hà sụp đổ',desc:'Gây 190% sát thương lên toàn bộ địch.',kind:'aoe',weapon:'orb',hair:'#f0e1b5',skin:'#edcfb6'},
  {id:'nyx',name:'Nyx',title:'Nữ hoàng nhật thực',rarity:'SSR',element:'Ảnh',role:'Sát thủ',color:'#b7a1d9',hp:198,atk:47,def:11,skill:'Nhật thực',desc:'Gây 360% sát thương và hồi máu bằng 30% sát thương gây ra.',kind:'drain',weapon:'dagger',hair:'#d5c8ee',skin:'#dcc0c4'},
  {id:'kael',name:'Kael',title:'Ngọn lửa vĩnh cửu',rarity:'SSR',element:'Hỏa',role:'Chiến binh',color:'#dc9271',hp:240,atk:43,def:14,skill:'Phượng hoàng',desc:'Gây 170% sát thương lên toàn bộ địch và thiêu đốt trong 2 lượt.',kind:'inferno',weapon:'sword',hair:'#cc6e4c',skin:'#deb58e'},
  {id:'eira',name:'Eira',title:'Nữ tư tế cực quang',rarity:'UR',element:'Băng',role:'Trị liệu',color:'#8ee4ed',hp:208,atk:34,def:14,skill:'Suối cực quang',desc:'Hồi 42% máu tối đa cho cả đội, kể cả đồng đội gục ngã.',kind:'heal',ability:{heal:.42},weapon:'staff',hair:'#d9f5f4',skin:'#e8c6bb'},
  {id:'veyron',name:'Veyron',title:'Kỵ sĩ thiên lôi',rarity:'UR',element:'Lôi',role:'Chiến binh',color:'#8fc3ff',hp:235,atk:46,def:14,skill:'Thiên lôi giáng thế',desc:'Gây 205% sát thương lên toàn bộ địch.',kind:'aoe',ability:{mult:2.05},weapon:'sword',hair:'#435579',skin:'#cda78d'},
  {id:'solis',name:'Solis',title:'Hoàng đế mặt trời',rarity:'LR',element:'Hỏa',role:'Pháp sư',color:'#ffa867',hp:224,atk:49,def:14,skill:'Thái dương bùng nổ',desc:'Gây 195% sát thương toàn bộ địch; thiêu đốt bằng 35% tấn công mỗi lượt trong 2 lượt.',kind:'inferno',ability:{mult:1.95,burn:.35},weapon:'orb',hair:'#f5c77d',skin:'#d9a980'},
  {id:'selene',name:'Selene',title:'Nữ vương huyết nguyệt',rarity:'LR',element:'Ảnh',role:'Sát thủ',color:'#ff9fb3',hp:219,atk:50,def:13,skill:'Trăng máu',desc:'Gây 390% sát thương lên một mục tiêu và hồi máu bằng 35% sát thương gây ra.',kind:'drain',ability:{mult:3.9,drain:.35},weapon:'dagger',hair:'#e3b8d1',skin:'#dcc1bf'},
  {id:'orion',name:'Orion',title:'Hộ thần thiên giới',rarity:'MR',element:'Thổ',role:'Hộ vệ',color:'#c5a8ff',hp:310,atk:37,def:22,skill:'Thiên môn bất diệt',desc:'Gây 210% sát thương. Cả đội nhận khiên bằng 32% máu tối đa của Orion.',kind:'shield',ability:{mult:2.1,shield:.32},weapon:'shield',hair:'#e8e0fb',skin:'#c99f83'},
  {id:'lyra',name:'Lyra',title:'Khúc ca của tạo hóa',rarity:'MR',element:'Phong',role:'Pháp sư',color:'#c5b2ff',hp:233,atk:52,def:15,skill:'Bản giao hưởng sao',desc:'Gây 225% sát thương lên toàn bộ địch.',kind:'aoe',ability:{mult:2.25},weapon:'staff',hair:'#c9d2ef',skin:'#ebc9b7'},
  {id:'aion',name:'Aion',title:'Người dệt vũ trụ',rarity:'EX',element:'Quang',role:'Pháp sư',color:'#efe4b9',hp:242,atk:54,def:16,skill:'Khởi nguyên tinh vân',desc:'Gây 245% sát thương lên toàn bộ địch.',kind:'aoe',ability:{mult:2.45},weapon:'orb',hair:'#f4ebdb',skin:'#dfbc9f'},
  {id:'eclipse',name:'Eclipse',title:'Bên kia vĩnh hằng',rarity:'EX',element:'Ảnh',role:'Sát thủ',color:'#f3bbef',hp:238,atk:55,def:15,skill:'Chân trời sự kiện',desc:'Gây 440% sát thương lên một mục tiêu và hồi máu bằng 40% sát thương gây ra.',kind:'drain',ability:{mult:4.4,drain:.4},weapon:'dagger',hair:'#ede0fa',skin:'#d4b6ca'}
];
export const HERO = Object.fromEntries(HEROES.map(h=>[h.id,h]));
export const RARITY = {
  R:{rank:0,name:'Hiếm',color:'#9cacbb',accent:'#c8d6df',rate:75,gold:30,shards:1,effect:'Ánh sao bạc'},
  SR:{rank:1,name:'Sử thi',color:'#c3a5e4',accent:'#e5ceff',rate:20,gold:70,shards:4,effect:'Bụi sao tím'},
  SSR:{rank:2,name:'Huyền thoại',color:'#e1c17f',accent:'#fff1c9',rate:3,gold:180,shards:12,effect:'Vương miện hoàng kim'},
  UR:{rank:3,name:'Siêu việt',color:'#7bdce8',accent:'#c6f6ff',rate:1.2,gold:260,shards:18,effect:'Cực quang · Vòng phép kép'},
  LR:{rank:4,name:'Truyền thuyết',color:'#ffa17d',accent:'#ffd5a1',rate:.5,gold:380,shards:26,effect:'Nhật luân · Lửa thiên thể'},
  MR:{rank:5,name:'Thần thoại',color:'#c4a3ff',accent:'#ffbfe5',rate:.25,gold:550,shards:38,effect:'Thiên dực · Chòm sao chuyển động'},
  EX:{rank:6,name:'Khởi nguyên',color:'#f3e4b5',accent:'#b4eaff',rate:.05,gold:800,shards:55,effect:'Tinh vân · Quang phổ vĩnh hằng'}
};
export const RARITIES = Object.keys(RARITY);
export const HIGH_PITY = {UR:120,LR:240,MR:480,EX:960};
export const rarityRank = rarity=>RARITY[rarity].rank;
export const BLESSINGS = [
  {id:'might',name:'Lưỡi kiếm thức tỉnh',tag:'TẤN CÔNG',icon:'sword',desc:'Cả đội tăng 16% tấn công.',color:'#dfab78'},
  {id:'vitality',name:'Trái tim cổ thụ',tag:'SINH LỰC',icon:'heart',desc:'Tăng 18% máu tối đa và hồi thêm lượng máu tương ứng.',color:'#8ebda0'},
  {id:'armor',name:'Da của người khổng lồ',tag:'PHÒNG THỦ',icon:'shield',desc:'Cả đội nhận ít hơn 12% sát thương. Cộng dồn tối đa 60%.',color:'#9ebed0'},
  {id:'crit',name:'Mắt của đại bàng',tag:'CHÍ MẠNG',icon:'eye',desc:'Thêm 12% tỉ lệ chí mạng. Đòn chí mạng gây 160% sát thương.',color:'#d8c58d'},
  {id:'vamp',name:'Khế ước đỏ',tag:'HÚT MÁU',icon:'drop',desc:'Hồi máu bằng 10% sát thương gây ra.',color:'#d8929f'},
  {id:'flame',name:'Ngọn lửa lưu lạc',tag:'THIÊU ĐỐT',icon:'flame',desc:'Mọi đòn đánh thiêu đốt mục tiêu, gây thêm 10% tấn công trong 2 lượt.',color:'#e39e7c'},
  {id:'frost',name:'Mùa đông vĩnh hằng',tag:'KHỐNG CHẾ',icon:'snow',desc:'Mỗi đòn có 15% cơ hội đóng băng mục tiêu trong 1 lượt.',color:'#9ccddd'},
  {id:'renew',name:'Suối nguồn sự sống',tag:'HỒI PHỤC',icon:'leaf',desc:'Sau mỗi trận, cả đội hồi thêm 8% máu tối đa.',color:'#91c7ae'},
  {id:'barrier',name:'Người canh giấc mơ',tag:'LÁ CHẮN',icon:'shield',desc:'Đầu mỗi trận, mỗi anh hùng nhận khiên bằng 18% máu tối đa.',color:'#a7bbd9'},
  {id:'energy',name:'Nhịp đập tinh tú',tag:'NĂNG LƯỢNG',icon:'bolt',desc:'Mỗi đòn đánh thường tạo thêm 15 năng lượng.',color:'#c3afe1'},
  {id:'fortune',name:'Lời chúc của lữ khách',tag:'TÀI NGUYÊN',icon:'coin',desc:'Nhận thêm 25% vàng từ các trận chiến.',color:'#dbc38b'},
  {id:'execute',name:'Lời phán quyết',tag:'KẾT LIỄU',icon:'sword',desc:'Gây thêm 30% sát thương lên địch dưới 40% máu.',color:'#d59b9b'},
  {id:'focus',name:'Tĩnh lặng trước bão',tag:'KỸ NĂNG',icon:'star',desc:'Kỹ năng gây thêm 22% sát thương và hồi phục.',color:'#b8b1df'},
  {id:'courage',name:'Ý chí bất diệt',tag:'SINH TỒN',icon:'flame',desc:'Gây thêm 25% sát thương khi bản thân dưới 50% máu.',color:'#e0b08a'}
];
export const BLESSING = Object.fromEntries(BLESSINGS.map(b=>[b.id,b]));
export const NODES = {
  battle:{name:'Lối mòn cổ',type:'Chiến đấu',icon:'sword',desc:'Đánh bại những kẻ canh tháp.',reward:'Vàng + 1 chúc phúc',color:'#8cbeb1'},
  elite:{name:'Thử thách tinh anh',type:'Nguy hiểm',icon:'skull',desc:'Kẻ địch mạnh hơn. Phần thưởng xứng đáng.',reward:'Vàng ×2 + trang bị + chúc phúc',color:'#d99a8b'},
  rest:{name:'Đền nghỉ chân',type:'Hồi phục',icon:'camp',desc:'Cả đội hồi 35% máu, hồi sinh đồng đội.',reward:'Hồi phục + 1 chúc phúc',color:'#93bfd1'},
  treasure:{name:'Kho báu thất lạc',type:'Kho báu',icon:'chest',desc:'Một căn phòng yên tĩnh chứa đầy tài nguyên.',reward:'Trang bị + vàng + 1 vé',color:'#dcc28b'},
  event:{name:'Lữ khách bí ẩn',type:'Sự kiện',icon:'eye',desc:'Một giao kèo giữa lòng tháp. Bạn sẽ chọn gì?',reward:'Một lựa chọn bất ngờ',color:'#bea5d5'},
  boss:{name:'Người giữ tầng',type:'BOSS',icon:'crown',desc:'Vượt qua người canh giữ để mở hành trình mới.',reward:'3 vé + tinh thạch + chúc phúc',color:'#dba17c'}
};
export const REGIONS = [
  {name:'Di tích sương mờ',subtitle:'Những lời thì thầm đầu tiên',color:'#83bfae'},
  {name:'Thư viện lãng quên',subtitle:'Nơi ký ức vẫn còn thức',color:'#aaa0cc'},
  {name:'Thánh điện tro tàn',subtitle:'Phía sau ngọn lửa cuối cùng',color:'#d7a17e'},
  {name:'Vườn trăng tĩnh lặng',subtitle:'Dưới một bầu trời khác',color:'#90b7d1'}
];
export const META = [
  {id:'attack',name:'Ấn kiếm',desc:'Mỗi cấp tăng 4% tấn công cho mọi anh hùng.',icon:'sword',color:'#d8ae80'},
  {id:'health',name:'Ấn sinh mệnh',desc:'Mỗi cấp tăng 5% máu cho mọi anh hùng.',icon:'heart',color:'#90c3ac'},
  {id:'guard',name:'Ấn hộ mệnh',desc:'Mỗi cấp tăng 1 phòng thủ cho mọi anh hùng.',icon:'shield',color:'#9dbad0'}
];
export const MILESTONES = [3,5,10,15,20,30,40,50,75,100];
export const DAILY = [
  {id:'battles',name:'Bước chân người chinh phục',desc:'Thắng 5 trận chiến',goal:5,tickets:2,gold:250,icon:'sword'},
  {id:'summons',name:'Tiếng gọi từ tinh tú',desc:'Triệu hồi 3 anh hùng',goal:3,tickets:1,gold:150,icon:'star'},
  {id:'runs',name:'Một hành trình mới',desc:'Bắt đầu 1 chuyến leo tháp',goal:1,tickets:1,gold:200,icon:'tower'}
];

export const GEAR_SLOTS = {
  weapon:{name:'Vũ khí',icon:'sword',stat:'atk',base:8},
  armor:{name:'Giáp',icon:'shield',stat:'maxHp',base:42},
  charm:{name:'Phụ kiện',icon:'gem',stat:'def',base:4}
};
export const GEAR_BASES = [
  {id:'dawnblade',name:'Kiếm bình minh',slot:'weapon',icon:'sword'},
  {id:'moonstaff',name:'Trượng nguyệt sắc',slot:'weapon',icon:'star'},
  {id:'windbow',name:'Cung lữ phong',slot:'weapon',icon:'wind'},
  {id:'mossguard',name:'Giáp rêu cổ',slot:'armor',icon:'shield'},
  {id:'ashcloak',name:'Áo choàng tro',slot:'armor',icon:'flame'},
  {id:'frostmail',name:'Giáp sương bạc',slot:'armor',icon:'snow'},
  {id:'sunpendant',name:'Dây chuyền nhật quang',slot:'charm',icon:'gem'},
  {id:'oakring',name:'Nhẫn cổ thụ',slot:'charm',icon:'leaf'},
  {id:'nightseal',name:'Ấn đêm tĩnh',slot:'charm',icon:'moon'},
  ...ARMORY_BASES
];
export const GEAR_BASE = Object.fromEntries(GEAR_BASES.map(g=>[g.id,g]));
export const GEAR_RARITY = {
  R:{scale:1,dust:3,affixes:1,upgrade:1,dustExtra:0},
  SR:{scale:1.7,dust:8,affixes:2,upgrade:2,dustExtra:1},
  SSR:{scale:2.6,dust:20,affixes:2,upgrade:3,dustExtra:3},
  UR:{scale:3.5,dust:40,affixes:3,upgrade:4,dustExtra:5},
  LR:{scale:4.6,dust:75,affixes:4,upgrade:5,dustExtra:8},
  MR:{scale:5.9,dust:130,affixes:5,upgrade:6,dustExtra:12},
  EX:{scale:7.5,dust:220,affixes:5,upgrade:7,dustExtra:18}
};
export const STAT_NAMES = {atk:'Tấn công',maxHp:'Sinh lực',def:'Phòng thủ',crit:'Tỉ lệ chí mạng',drain:'Hút máu',energy:'Hồi năng lượng / đòn thường'};
export const RELICS = [
  {id:'mirror',name:'Gương hộ vệ',tag:'LÁ CHẮN → PHẢN ĐÒN',icon:'shield',color:'#a3bfdc',desc:'Khi khiên của đồng đội bị đánh vỡ, gây sát thương bằng 70% tấn công của họ lên kẻ vừa tấn công.',hint:'Kết hợp Rook, Thorne hoặc chúc phúc tạo khiên.'},
  {id:'spark',name:'Tàn sao thức tỉnh',tag:'HẠ GỤC → NĂNG LƯỢNG',icon:'bolt',color:'#d5bbeb',desc:'Mỗi khi một kẻ địch bị hạ, mọi đồng đội còn sống nhận 20 năng lượng.',hint:'Đánh diện rộng hoặc kích nổ thiêu đốt để dùng kỹ năng liên tục.'},
  {id:'chalice',name:'Chén suối nguồn',tag:'HỒI DƯ → LÁ CHẮN',icon:'drop',color:'#96d0bc',desc:'60% lượng hồi máu dư chuyển thành khiên, tới 40% máu tối đa. Không làm giảm khiên đang có.',hint:'Kết hợp Lumi, Seraph và Gương hộ vệ.'},
  {id:'cinder',name:'Hạt giống tro tàn',tag:'THIÊU ĐỐT → BÙNG NỔ',icon:'flame',color:'#e1a281',desc:'Kẻ địch đang cháy khi gục phát nổ, gây sát thương bằng 12% máu tối đa của nó lên các địch khác.',hint:'Kết hợp Ember, Kael hoặc chúc phúc Ngọn lửa lưu lạc.'},
  {id:'hourglass',name:'Đồng hồ rạn',tag:'KỸ NĂNG → NỐI NHỊP',icon:'clock',color:'#d8c890',desc:'Kỹ năng đầu tiên của đội trong mỗi vòng hoàn lại 35 năng lượng cho người dùng.',hint:'Ưu tiên kỹ năng cần dùng lại sớm nhất.'},
  {id:'lantern',name:'Đèn dẫn hồn',tag:'GỤC NGÃ → TRỞ LẠI',icon:'heart',color:'#a7c497',desc:'Một lần trong chuyến đi: đồng đội đầu tiên bị địch đánh gục tự hồi sinh với 30% máu tối đa.',hint:'Lượt hồi sinh được lưu kể cả khi đóng game.'},
  {id:'prism',name:'Lăng kính băng',tag:'ĐÓNG BĂNG → DỒN SÁT THƯƠNG',icon:'snow',color:'#9bcee1',desc:'Đánh kẻ địch đang đóng băng gây thêm 30% sát thương và tạo 20 năng lượng cho người đánh.',hint:'Dùng Bryn đóng băng rồi cho các đồng đội ra đòn.'},
  {id:'root',name:'Rễ trường sinh',tag:'KHỞI ĐẦU → HỒI PHỤC',icon:'leaf',color:'#9bc9a7',desc:'Đầu mỗi trận, cả đội hồi 12% máu tối đa (có hồi sinh) và nhận thêm 25 năng lượng.',hint:'Kết hợp Chén suối nguồn để bắt đầu trận với khiên.'}
];
export const RELIC = Object.fromEntries(RELICS.map(r=>[r.id,r]));
export const BOSSES = [
  {id:'colossus',name:'Cự nhân cổ đại',title:'Mặt đất cũng biết nổi giận',icon:'shield',color:'#d3b284',desc:'Tụ lực rồi dùng Địa chấn đánh cả đội. Đánh trúng boss bằng 2 kỹ năng khi tụ lực để ngắt chiêu, hoặc đóng băng boss.',phase:'Dưới 50% máu, Địa chấn mạnh hơn.',moves:{strike:['Nắm đấm đá','Đánh một đồng đội.'],charge:['Tụ lực','Chưa gây sát thương. Chuẩn bị Địa chấn.'],quake:['Địa chấn','Sắp đánh mạnh toàn đội! Dùng 2 kỹ năng hoặc đóng băng để ngắt.'],stunned:['Mất thăng bằng','Boss đã bị ngắt và bỏ lượt kế tiếp.']}},
  {id:'archivist',name:'Người gác thư viện',title:'Những trang sách không ngủ',icon:'eye',color:'#b8a6d9',desc:'Triệu hồi tối đa 2 bóng hầu. Khi còn bóng hầu, boss nhận ít hơn 35% sát thương. Ưu tiên hạ bóng hoặc dùng đòn diện rộng.',phase:'Dưới 50% máu, lập tức chuẩn bị gọi thêm bóng và tăng 20% sát thương.',moves:{summon:['Gọi bóng ký ức','Triệu hồi 2 bóng hầu; bóng mới không đánh ngay trong lượt này.'],volley:['Mưa ký ức','Đánh toàn đội.'],strike:['Trang sách sắc','Đánh một đồng đội.']}},
  {id:'ashknight',name:'Kỵ sĩ tro tàn',title:'Ngọn lửa dưới bộ giáp',icon:'flame',color:'#df9b7c',desc:'Luân phiên chém đơn, quét cả đội và Hút lửa. Khiên giảm sát thương thực nhận và lượng máu boss hút được.',phase:'Dưới 50% máu, tăng 25% sát thương và chuẩn bị Hút lửa.',moves:{strike:['Kiếm tro','Đánh một đồng đội.'],cleave:['Vòng lửa','Quét sát thương lên toàn đội.'],siphon:['Hút lửa','Đánh một người, hồi máu bằng 50% máu thực sự lấy đi.']}},
  {id:'moonwarden',name:'Hộ thần mặt trăng',title:'Sau vầng trăng bạc',icon:'moon',color:'#9dbfd9',desc:'Tạo khiên nguyệt sắc rồi tấn công cả đội. Kỹ năng gây sát thương phá khiên của boss trước khi ra đòn.',phase:'Dưới 50% máu, khiên tăng từ 18% lên 25% máu tối đa.',moves:{barrier:['Khiên nguyệt sắc','Tạo khiên cho bản thân. Dùng kỹ năng gây sát thương để phá.'],lunar:['Trăng rơi','Đánh toàn đội.'],strike:['Lưỡi liềm','Đánh một đồng đội.']}}
];
export const BOSS = Object.fromEntries([...BOSSES,...DUNGEON_BOSSES].map(b=>[b.id,b]));
export function bossForFloor(floor){return BOSSES[(Math.max(1,Math.floor(floor/5))-1)%BOSSES.length];}

export const AWAKENING = {
  aerin:{name:'Gió tiếp sức',desc:'Sau Bão tên, mọi đồng đội còn sống nhận 15 năng lượng.'},
  rook:{name:'Cổng thành bền bỉ',desc:'Sau Thành trì, Rook hồi 12% máu tối đa.'},
  lumi:{name:'Bình minh nối tiếp',desc:'Sau Bình minh, mọi đồng đội còn sống nhận 10 năng lượng.'},
  ember:{name:'Than hồng dai dẳng',desc:'Tàn lửa duy trì thiêu đốt trong 3 lượt thay vì 2.'},
  kira:{name:'Bóng săn đuổi',desc:'Ám kích gây thêm 25% sát thương lên mục tiêu dưới 50% máu.'},
  bryn:{name:'Hơi thở băng',desc:'Sau Đông cứng, cả đội còn sống nhận khiên bằng 8% máu tối đa của Bryn.'},
  raiden:{name:'Sấm hồi vang',desc:'Lôi trảm hoàn lại 25 năng lượng.'},
  seraph:{name:'Vầng sáng chở che',desc:'Sau Thánh ca, mỗi đồng đội còn sống nhận khiên bằng 8% máu tối đa của chính họ.'},
  thorne:{name:'Rễ hồi sinh lực',desc:'Sau Rừng bất diệt, mọi đồng đội còn sống hồi 8% máu tối đa.'},
  astra:{name:'Sao băng xuyên tháp',desc:'Thiên hà sụp đổ gây thêm 20% sát thương lên boss.'},
  nyx:{name:'Đêm nuốt ánh sáng',desc:'Nhật thực hồi máu bằng 50% sát thương thay vì 30%.'},
  kael:{name:'Lửa không tắt',desc:'Thiêu đốt từ Phượng hoàng tăng từ 30% lên 45% tấn công mỗi lượt.'},
  eira:{name:'Băng ngọc chở che',desc:'Sau Suối cực quang, mỗi đồng đội còn sống nhận khiên bằng 10% máu tối đa của chính họ.',trait:{teamShield:.1}},
  veyron:{name:'Sấm không dứt',desc:'Thiên lôi giáng thế hoàn lại 30 năng lượng.',trait:{energy:30}},
  solis:{name:'Mặt trời bất diệt',desc:'Thiêu đốt từ Thái dương bùng nổ kéo dài 3 lượt thay vì 2.',trait:{burnTurns:3}},
  selene:{name:'Lời thề huyết nguyệt',desc:'Sau Trăng máu, Selene nhận khiên bằng 18% máu tối đa của bản thân.',trait:{selfShield:.18}},
  orion:{name:'Thiên môn tiếp sức',desc:'Sau Thiên môn bất diệt, mọi đồng đội còn sống nhận 20 năng lượng.',trait:{teamEnergy:20}},
  lyra:{name:'Khúc ca tái sinh',desc:'Sau Bản giao hưởng sao, mọi đồng đội còn sống hồi 10% máu tối đa.',trait:{teamHeal:.1}},
  aion:{name:'Ngôi sao đầu tiên',desc:'Khởi nguyên tinh vân gây thêm 25% sát thương lên boss.',trait:{bossDamage:1.25}},
  eclipse:{name:'Khoảnh khắc ngừng trôi',desc:'Chân trời sự kiện đóng băng mục tiêu trong lượt kế tiếp.',trait:{freeze:1}}
};
export const RESONANCES = [
  {id:'fire',name:'Hỏa liên kết',element:'Hỏa',count:2,icon:'flame',color:'#dfa17f',desc:'Có 2 Hỏa: mọi hiệu ứng thiêu đốt gây thêm 35% sát thương.'},
  {id:'light',name:'Quang che chở',element:'Quang',count:2,icon:'star',color:'#e0c994',desc:'Có 2 Quang: mọi nguồn hồi máu tăng 20%.'},
  {id:'earth',name:'Thổ kiên định',element:'Thổ',count:2,icon:'shield',color:'#b6bb89',desc:'Có 2 Thổ: khiên từ kỹ năng, chúc phúc và cổ vật tăng 25%.'},
  {id:'shadow',name:'Ảnh truy kích',element:'Ảnh',count:2,icon:'moon',color:'#b8a1d9',desc:'Có 2 Ảnh: đòn đánh và kỹ năng gây thêm 20% sát thương lên địch dưới 40% máu.'},
  {id:'diverse',name:'Tam sắc đồng hành',count:3,icon:'gem',color:'#8fbfc3',desc:'Có 3 nguyên tố khác nhau: tăng 8% sát thương đòn đánh và kỹ năng; đầu trận thêm 10 năng lượng.'}
];
export const RESONANCE = Object.fromEntries(RESONANCES.map(r=>[r.id,r]));
export const TRIALS = [
  {id:'humble',name:'Huyền thoại bình dị',tag:'CHỈ ANH HÙNG R',rule:'rare',goal:10,milestones:[3,5,10],icon:'heroes',color:'#a5bcb2',desc:'Vượt 10 tầng bằng đội hình chỉ gồm anh hùng R. Cấp độ, trang bị và thức tỉnh vẫn có hiệu lực.',hint:'Rook, Ember và Lumi là một đội khởi đầu hợp lệ.'},
  {id:'iron',name:'Một mạng để đi xa',tag:'KHÔNG HỒI SINH',rule:'noRevive',goal:10,milestones:[3,5,10],icon:'heart',color:'#d8a19b',desc:'Vượt 10 tầng. Anh hùng đã gục không thể được hồi sinh bằng kỹ năng, đền nghỉ hay cổ vật.',hint:'Khiên và hồi máu sớm quan trọng hơn chờ đồng đội gục ngã.'},
  {id:'gauntlet',name:'Bốn người giữ tháp',tag:'CHUỖI 4 BOSS',rule:'bossrush',goal:4,milestones:[1,2,4],icon:'crown',color:'#d8bb83',desc:'Đối đầu liên tiếp Cự nhân, Thư viện, Kỵ sĩ và Hộ thần. Mỗi chặng là một boss, độ khó tăng dần.',hint:'Ba boss đầu vẫn cho cổ vật và chúc phúc để xây combo.'}
];
export const TRIAL = Object.fromEntries(TRIALS.map(t=>[t.id,t]));
export const TRIAL_REWARDS = [
  {tickets:1,gold:250,dust:5,shards:0},
  {tickets:3,gold:600,dust:10,shards:1},
  {tickets:5,gold:1000,dust:20,shards:3}
];
