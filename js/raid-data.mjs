export const VOID_DRAGON={
  id:'void-dragon',name:'Hắc Long Hư Không',title:'Kẻ nuốt ánh bình minh',icon:'moon',color:'#b9a4ef',
  desc:'Phá cánh để ép hạ đất, phá lõi kết giới rồi chống đợt cuồng nộ.',
  phase:'Long huyết thức tỉnh, tăng 25% sức đánh.',
  moves:{strike:['Vuốt hư không','Đánh một tướng.'],charge:['Tụ hắc lôi','Chuẩn bị đánh cả đội. Hai kỹ năng tấn công hoặc đóng băng có thể ngắt.'],quake:['Bão hắc lôi','Đánh mạnh toàn đội.'],stunned:['Long thế đứt gãy','Bị ngắt chiêu, bỏ lượt kế tiếp.']}
};
export const VOID_RAID_TIERS=[
  {name:'Khám phá',scale:3.8,level:30,gold:750,essence:10,rarity:'UR',scales:1},
  {name:'Tinh anh',scale:6,level:50,gold:1200,essence:16,rarity:'LR',scales:2},
  {name:'Ác mộng',scale:9,level:70,gold:2000,essence:24,rarity:'MR',scales:3}
];
export const VOID_RAID_STAGES=[
  {name:'Bẻ cánh hắc long',icon:'wind',color:'#b9a4ef',world:'ruins',mechanic:'Khi Cánh còn nguyên, rồng giảm 60% sát thương nhận và không thể bị hạ. Đòn trực tiếp nhắm Cánh bào giáp bằng sát thương trước giảm. Phá Cánh ép rồng hạ đất.',tip:'Nhắm Tay / cánh trước. Cần đòn đánh hoặc kỹ năng trực tiếp để phá cánh.'},
  {name:'Phá kết giới',icon:'gem',color:'#90d7e8',world:'ruins',mechanic:'Khi Lõi còn nguyên, kết giới giảm 70% sát thương nhận và giữ rồng còn ít nhất 1 HP. Đòn trực tiếp nhắm Lõi bào giáp bằng sát thương trước giảm. Phá Lõi để dỡ kết giới.',tip:'Dồn đòn trực tiếp vào Lõi để phá kết giới, rồi tận dụng điểm yếu +25%.'},
  {name:'Bình minh sau bão',icon:'bolt',color:'#e2b27f',world:'ruins',mechanic:'Rồng cuồng nộ ngay đầu trận: +25% sức đánh và bắt đầu tụ hắc lôi. Dùng hai kỹ năng tấn công, đóng băng hoặc phá Đầu để ngắt đòn toàn đội.',tip:'Giữ kỹ năng để ngắt hắc lôi. Khiên và hồi máu giúp cả đội trụ qua cuồng nộ.'}
];
