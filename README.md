# Tháp Vô Tận

Game gacha roguelite dành cho Android, giao diện tiếng Việt, chơi đơn và hoạt động hoàn toàn offline. Bản **1.47.0** điều chỉnh nhịp 20 tầng đầu, giảm giá nâng cấp cấp thấp và thêm gợi ý chuẩn bị khi thua. Có màn tổng kết với MVP, thống kê và phần thưởng cả chuyến; tiết kiệm pin, giảm tải theo RAM/nhiệt, điều khiển cảm ứng, **Lời nguyền Tháp** với mùa cá nhân 14 ngày, độ thân thiết cho đủ 20 tướng, điểm danh 7 ngày, tẩy luyện trang bị, đội hình kèm bộ đồ, sổ thành tựu, phản công, đỡ đúng nhịp, dị biến, khế ước, thiên phú, triệu hồi định hướng và hai boss đột kích cho ba đội.

## Cài trên Android

File cài: **artifacts/ThapVoTan-1.47.0.apk**. Cài đè lên bản 1.0.0–1.46.0 để giữ tiến trình; không cần gỡ bản cũ.

Chép APK sang điện thoại rồi mở bằng ứng dụng Tệp để cài. Android 7.0 trở lên, với Android System WebView cập nhật. Đây là APK thử nghiệm được ký bằng debug key, chưa phát hành trên Google Play.

App không yêu cầu tài khoản, quyền Internet, quyền bộ nhớ, quảng cáo hay thanh toán. Chức năng nhập/xuất bản lưu sử dụng trình chọn tệp của Android.

## Cân bằng đầu game và gợi ý khi thua — 1.47

Chuyến **Tháp thường khởi hành mới** có đường tăng sức mạnh quái đều hơn trong 20 tầng đầu. Quái thứ ba ở tầng 3 có 55% HP / 50% sức đánh, tầng 4 có 80% / 75%, rồi về bình thường. Boss tầng 5 có 90% HP / 85% sức đánh so với đường tăng chỉ số mới; mức hỗ trợ thu hẹp dần, về 100% ở tầng 20. Từ tầng 21, chỉ số cơ bản trở lại công thức cũ. Cơ chế boss, độ hiếm, gacha, các chế độ khác và chuyến đã lưu trước cập nhật giữ luật hiện có.

Trận thắng Tháp thường mới nhận thêm một phần vàng vào mức gốc: +35 ở tầng 1, giảm dần về 0 ở tầng 25; boss, tinh anh và chúc phúc tăng vàng áp dụng như trước. Chỉ phát thưởng trong luồng thắng trận hiện có, không thêm nút nhận quà hoặc cộng lại khi mở tổng kết.

Giá nâng anh hùng ở **cấp hiện tại 1–10 giảm 40%**, cấp 11–19 giảm dần từ 36% còn 4%, cấp 20 trở lên giữ giá cũ. Màn chi tiết tướng hiện đúng giá và phần trăm giảm. Ba tướng từ cấp 1 lên cấp 3 tốn **573 vàng** thay vì 957; lên cấp 5 tốn **2.340** thay vì 3.903. Áp dụng cho tướng mọi độ hiếm, không hoàn vàng các nâng cấp cũ. Chỉ số chuyến đang chơi vẫn giữ nguyên lúc khởi hành.

Khi thua, **Chuẩn bị lần tới** hiển thị tối đa ba gợi ý từ trận cuối và tài khoản hiện tại: tướng hồi máu đã sở hữu, hộ vệ đang ở hàng sau, điểm thiên phú chưa dùng, giáp đầu boss còn nguyên, vũ khí còn trống hoặc trận kéo dài khi địch vẫn còn nhiều HP. Có nút mở chi tiết tướng, thiên phú, trang bị, đội hình hoặc cơ chế boss. Gợi ý không tự đổi đội, mặc đồ hoặc tiêu vàng. Tướng đang viễn chinh bị loại khỏi đề xuất, thử thách chỉ R giữ hạn chế, phòng thử không hiện gợi ý tài khoản thật. Thống kê cũ chưa đầy đủ không được dùng để kết luận thiếu sát thương; có thể mở phòng thử miễn phí.

Mô phỏng **150 cặp chuyến trước/sau** với năm cấu hình đội khởi đầu và 30 seed, không gacha hoặc tăng chỉ số giả. Với cách Auto, chọn nghỉ khi mất máu và ưu tiên chúc phúc chiến đấu cố định, cả hai bản đều vượt 20 tầng; vàng trung bình của cấu hình cấp 1 tăng từ **5.562** lên **6.145**. Đây là mô phỏng có chiến thuật cố định, không phải số liệu người chơi hoặc cam kết mọi đội đều thắng.

Save vẫn **v34**, khóa `thap-vo-tan-v1`; luật mới được chốt bằng `balanceRules: 1` chỉ ở chuyến Tháp thường mới. Bản lưu cũ không được gắn marker khi nhập, tiếp tục dùng cùng công thức và phần thưởng cũ cho tới chuyến tiếp theo. **1.626/1.626 kiểm thử đạt** (42 mới), **255 kiểm thử tập trung**, **103 module gốc / 104 kể vendor** đạt cú pháp. Chi tiết: `artifacts/QA-1.47.0.md`; kiểm chứng: `python artifacts/qa/verify-v1.47.py`. Chưa xác minh bố cục/cảm ứng hoặc chơi trên điện thoại thật.

## Tổng kết hành trình — 1.46

Khi kết thúc chuyến đi, màn kết quả có huy hiệu và màu riêng cho **chiến thắng / thất bại / rút lui**, hiệu ứng xuất hiện ngắn và hỗ trợ giảm chuyển động. Bảng tổng kết hiển thị sát thương HP thực mất, hồi máu hữu ích, lượng khiên đã tạo và số địch đã hạ. **Xem chi tiết trận** mở bảng từng tướng, linh thú và hiệu ứng chung; MVP vẫn tính theo tổng sát thương, hồi máu và khiên đã tạo. Đột kích ghi rõ MVP và thống kê của **đội hiện tại**; các báo cáo đội đã thắng vẫn ở phía trên.

Phần thưởng ghi đúng vàng, vé, tinh thạch, bụi rèn tích lũy cả chuyến, kể cả tinh anh và trang bị đổi thành bụi khi túi đầy. Có ấn săn boss, tinh hoa, lõi nguyên tố, vảy Hư Không và ấn sự kiện khi nhận được. Quà chiến dịch lần đầu, nhiệm vụ và mốc vẫn nhận ở nút tương ứng; mở tổng kết không phát thêm quà. Số địch đã hạ chỉ tăng sau khi địch chết hẳn; lính được boss gọi lại được tính riêng.

**Chơi lại cùng đội** ở tháp thường, thử thách tuần và sự kiện khôi phục đúng ba tướng cùng hàng trước/sau của chuyến vừa kết thúc. Chỉ số mới lấy từ tài khoản hiện tại; bắt đầu từ tầng 1, làm mới nâng cấp trong chuyến. Nếu tướng đang viễn chinh, thao tác bị chặn và giữ nguyên kết quả cũ. Các chế độ khác giữ nút chơi lại/chuẩn bị riêng, bổ sung đường về sảnh ở kết quả săn boss, chiến dịch và phó bản. Phòng thử vẫn tách biệt khỏi tài khoản thật.

Save vẫn **v34**, khóa `thap-vo-tan-v1`. Thống kê có ledger tùy chọn `report: {kills, shards, dust}`; bản lưu cũ không có ledger vẫn giữ nguyên dữ liệu và hiển thị lời nhắc thiếu lịch sử. Không suy đoán số địch hoặc tổng tài nguyên cũ. Chuyến khởi hành mới ghi đầy đủ.

**1.584/1.584 kiểm thử đạt** (45 mới), **228 kiểm thử tập trung**; **101 module gốc / 102 kể vendor** đạt cú pháp. Có 12 tình huống đối chiếu từng hành động với mã đóng trong APK 1.45 ở sáu chế độ. Giữ baseline 1.18 với 60 tình huống / 1.407 bản chụp. Chi tiết: `artifacts/QA-1.46.0.md`; kiểm chứng sau build: `python artifacts/qa/verify-v1.46.py`. Không mở trình duyệt/server/emulator hoặc cài lên điện thoại trong lần này; bố cục, WebGL và cảm ứng thật chưa được xác minh.

## Hiệu năng và cảm ứng Android — 1.45

Mở **Cài đặt → Tiết kiệm pin** để giới hạn trận ở **30 FPS**, giảm bóng/hạt, bỏ tải trước mô hình và rút gọn hoạt cảnh trong trận. Sảnh, bản đồ, xem tướng và màn chiến thắng giới hạn **15 FPS**; thời gian hành động/di chuyển giữ nguyên. Xem thử chiêu cuối chủ động vẫn dùng được khi máy chưa quá nóng. Cài đặt này nhớ riêng trên thiết bị, không nằm trong bản lưu tài khoản.

Khi bật **Hiệu năng tự động**, máy ít RAM bắt đầu nhẹ hơn: thiết bị low-RAM hoặc tối đa 2 GB dùng mức giảm 2, tối đa 3 GB dùng mức giảm 1. Khi Android bật tiết kiệm pin hoặc báo nóng từ mức vừa, game giảm bóng/hạt và giới hạn tối đa 30 FPS; mức nóng nghiêm trọng trở lên giới hạn 20 FPS. Các giới hạn hệ thống vẫn có hiệu lực khi tắt điều chỉnh FPS tự động. Thông tin thiết bị không khả dụng thì dùng cấu hình đã chọn. Không thêm quyền Android.

Trên màn hình rộng tối đa 700 px, khay lệnh có **ba nút chọn nhanh tướng**, năng lượng và trạng thái kỹ năng; nút **Mục tiêu** mở danh sách địch còn sống và giáp boss, có máu/độ bền cùng tác dụng khi phá. Chọn mục tiêu không mất lượt hay năng lượng. Chọn bộ phận được lưu như trước; cửa sổ cũ, địch đã gục và Auto không thể nhận lệnh chọn cũ. Dùng được trong phòng thử mà không ghi vào tài khoản thật.

Nút lệnh, công tắc cài đặt và nút điều khiển chính có vùng chạm 44–48 px trở lên. Khoảng chừa cuối trang đo theo chiều cao khay lệnh; màn hình thấp cho phép cuộn riêng khay. Giữ đồ họa dark fantasy hiện tại.

**1.539/1.539 kiểm thử đạt** (23 mới), **269 kiểm thử tập trung**; **101 module gốc / 102 kể vendor** đạt cú pháp. Android build và lint thành công, 112 tài nguyên APK khớp byte với nguồn. Save vẫn **v34**, logic game khớp byte với 1.44, giữ 2.691 tệp phát hành/QA và 46 APK cũ. Chi tiết: `artifacts/QA-1.45.0.md`; kiểm chứng: `python artifacts/qa/verify-v1.45.py`. Chưa đo pin/FPS/GPU, xác minh CSS/WebGL hay thử cảm ứng/sự kiện nhiệt trên điện thoại thật.

## Lời nguyền Tháp — 1.44

Mở **Lời nguyền Tháp** ở sảnh, trong **Chế độ** hoặc **Nhiệm vụ**. Mùa đầu chỉ bắt đầu khi chủ động mở sự kiện hoặc khởi hành. Mỗi mùa kéo dài **14 ngày theo lịch trên thiết bị**, sau đó tự chuyển sang mùa cá nhân tiếp theo; không cần mạng. Mỗi ngày có ba nhiệm vụ: thắng 2–3 trận sự kiện, dùng 3–4 kỹ năng và hạ boss cuối. Nhận lần lượt **25 / 25 / 50 Ấn hắc nguyệt**. Mốc tích lũy **50 / 150 / 300 / 600 / 1.000 ấn đã kiếm** tặng vàng, vé, bụi rèn và tinh thạch; tiêu ấn không giảm tiến độ mốc.

Hành trình riêng gồm **5 tầng**, có nhánh đánh thường/tinh anh, nghỉ chân hoặc kho báu, chúc phúc ngẫu nhiên và **Vua Nguyền Ấn** ở tầng cuối. Đội gợi ý cấp 5 trở lên. Mỗi thắng trận thường nhận **3 ấn**, tinh anh **5 ấn**, boss cuối **15 ấn**; có thể chơi lại không giới hạn. Không tăng kỷ lục tầng tháp thường. Luật được chốt khi khởi hành:

| Lời nguyền | Lợi thế | Đánh đổi |
| --- | --- | --- |
| Máu đổi quyền năng | Kỹ năng gây thêm 20% sát thương trực tiếp | Hồi máu của đội giảm 25%, kể cả nghỉ chân và Đèn dẫn hồn |
| Xiềng xích cổ thạch | Khiên +35%, đánh thường thêm 10 năng lượng | Địch thêm 20% máu |
| Tiếng gọi vực sâu | Kỹ năng thêm 25% sát thương trực tiếp, đầu trận thêm 15 năng lượng | Sát thương nhận thêm 15% |

Boss luân phiên đánh đơn, **Khắc nguyền** lấy 15 năng lượng của tướng còn sống rồi **Giáng nguyền** đánh cả đội và dựng khiên bằng 8% máu tối đa. Dưới nửa máu, chiêu quét mạnh hơn. Hai kỹ năng gây sát thương khi boss tụ lực, đóng băng hoặc phá vương miện đều ngắt chiêu. Đỡ đúng nhịp, phản công và bộ phận tay/lõi hoạt động như các trận boss khác.

**Chợ Hắc Nguyệt:** 40 ấn đổi 5 mảnh Astra hoặc Nyx, mỗi loại 12 lượt/mùa; đủ **60 mảnh** ghép SSR cấp 1. Đã sở hữu sẽ nhận một bản trùng thức tỉnh, giữ nguyên cấp, trang bị, thiên phú, bảo đảm triệu hồi và đội đang đánh. Có hai trang phục Rook/Aerin giá 250 ấn, Hào quang Hắc nguyệt giá 450 ấn, vé triệu hồi giá 30 ấn và 10 bụi rèn giá 25 ấn. Trang phục đã mở bằng mốc cũ không cần đổi lại. Hào quang bật/tắt riêng, dùng cùng trang phục và Thệ ước, có 4 lượt vẽ/tướng, không cộng chỉ số.

Sang mùa: nhiệm vụ, mốc thưởng và lượt đổi được làm mới; **ấn còn dư, mảnh tướng và ngoại hình giữ vĩnh viễn**. Quà chưa nhận của ngày/mùa cũ hết hạn. Chuyến đang dở giữ luật đã chốt và có thể hoàn thành, nhưng hết mùa sẽ không cộng ấn hoặc tiến độ cho mùa mới. Đồng hồ lùi khóa nhận/đổi quà đến ngày đã ghi nhận. Phòng thử không dùng thưởng hay tài nguyên sự kiện.

Save **v33 → v34** thêm ledger sự kiện rỗng, giữ khóa `thap-vo-tan-v1`, toàn bộ dữ liệu cũ và trận đang chơi. Xuất/nhập giữ mùa, quà đã nhận, mảnh, trang phục và luật chuyến đi. **1.516/1.516 kiểm thử đạt** (82 mới), **314 kiểm thử tập trung**, **98 module gốc / 99 kể vendor** đạt cú pháp. Giữ nguyên 2.569 tệp phát hành/QA cũ và baseline 60 tình huống / 1.407 bản chụp chiến đấu. Chi tiết: `artifacts/QA-1.44.0.md`; kiểm chứng: `python artifacts/qa/verify-v1.44.py`. Chưa xác minh bố cục CSS/WebGL, hiệu năng GPU hoặc cài/chơi trên điện thoại thật cho bản này.

## Độ thân thiết — 1.43

Mở **Anh hùng → chọn tướng → Thân thiết**. Mỗi chiến thắng tăng **4 điểm** cho ba tướng thực sự tham chiến, kể cả tướng đã gục; trận boss tăng **8 điểm**. Tính ở leo tháp, thử thách, chiến dịch, phó bản, săn boss và từng đội của đột kích. Phòng thử, rút lui, thua trận, nghỉ chân và kho báu không tăng điểm.

Tặng **Hoa hồng tro** giá **80 vàng** để nhận **20 điểm**. Nút hiển thị giá trước khi bấm, lưu ngay khi trả vàng và chặn phát lại cùng lượt xác nhận. Gần tối đa chỉ cộng phần còn thiếu; đủ 800 điểm thì không thể tặng thêm.

Năm mốc **Gặp gỡ 40 / Tin cậy 120 / Đồng hành 260 / Tri kỷ 480 / Thệ ước 800** mở lần lượt năm đoạn truyện riêng của mỗi tướng: tổng **100 đoạn ký ức**. Truyện chưa mở chỉ hiện tên mốc và yêu cầu. Mốc cuối mở danh hiệu riêng cùng hào quang Thệ ước. Chạm **Trang bị / Cất ngoại hình** để bật tắt, dùng cùng trang phục đang mặc ở hồ sơ, bộ sưu tập, sảnh, trận và màn chiến thắng. Hào quang có 2 lượt vẽ cho mỗi tướng, dừng chuyển động khi bật giảm chuyển động. Không cộng chỉ số chiến đấu.

Save **v32 → v33**, giữ khóa `thap-vo-tan-v1`. Tài khoản cũ bắt đầu với `bonds: {}`; điểm danh, kết quả tẩy luyện đang chờ, khóa trang bị, đội hình và trận đang dở giữ nguyên. Thân thiết tự lưu và đi cùng bản sao lưu xuất/nhập. **1.434/1.434 kiểm thử đạt** (49 mới), **95 module gốc / 96 kể vendor** đạt cú pháp. Chi tiết phát hành: `artifacts/QA-1.43.0.md`; kiểm chứng: `python artifacts/qa/verify-v1.43.py`. Chưa cài/chơi trên điện thoại thật.

## Điểm danh 7 ngày — 1.42

Mở **Nhiệm vụ & phần thưởng** để xem **Nhật ký hành trình / Điểm danh**. Bảy ngày có phần thưởng tăng dần: vàng, vé triệu hồi, bụi rèn và tinh thạch. Chạm **Nhận quà hôm nay** để nhận mốc đang mở; cùng ngày chỉ nhận một lần. Ngày được tính theo lịch cục bộ, không cần mạng.

Nếu bỏ lỡ ít nhất một ngày, lần trở lại kế tiếp bắt đầu lại từ Ngày 1. Sau Ngày 7, chuỗi quay vòng về Ngày 1. Nếu đồng hồ máy lùi trước lần điểm danh gần nhất, game khóa nút nhận để tránh phát thưởng sai. Đóng/mở app, xuất/nhập hoặc bấm lặp không tạo thêm quà. Vàng, vé, bụi và tinh thạch được kiểm tra giới hạn nguyên tử; Phòng thử không nhận thưởng và không đổi tài khoản thật.

Save **v31 → v32** thêm `loginRewards: {lastDay, streak, totalClaims}`. Tài khoản cũ nhận ledger rỗng, không được tự cộng thưởng. Kết quả tẩy luyện, đội hình, bộ đồ, khóa đồ, tài nguyên và hành trình giữ nguyên. **1.385/1.385 kiểm thử đạt** (39 mới), **92 module gốc / 93 kể vendor** đạt cú pháp, **103/103 tài nguyên APK** khớp nguồn, **43 APK cũ** giữ nguyên hash. Chi tiết: `artifacts/QA-1.42.0.md`; kiểm chứng: `python artifacts/qa/verify-v1.42.py`. Chưa cài/chơi trên điện thoại thật.

## Tẩy luyện trang bị — 1.41

Mở **Hội quán → Trang bị → chọn món → Tẩy luyện**. Chọn một dòng phụ, xem giá trị gốc, khoảng có thể nhận và phần cộng ở cấp trang bị hiện tại. Chỉ **Trả phí & tẩy luyện** mới trừ vàng và bụi rèn. Mọi số nguyên trong khoảng có cơ hội bằng nhau; kết quả có thể tăng, giảm hoặc bằng hiện tại. Loại chỉ số được giữ nguyên.

Sau khi quay, xem **Giữ cũ / Kết quả mới**, bảng sáu chỉ số của món đồ và, nếu đang mặc, bảng chỉ số ngoài trận của người mặc. **Giữ cũ** kết thúc lượt và giữ chỉ số; **Nhận mới** chỉ đổi giá trị của dòng đã chọn. Cả hai đều dùng phí lượt quay, không hoàn nguyên liệu. Giữ nguyên mã món, bậc, cấp, phẩm chất, bộ đồ, trấn phái, người mặc và các dòng phụ khác. Bộ trang bị và đội hình đã lưu tiếp tục tham chiếu đúng món, dùng chỉ số hiện tại.

Mỗi lần chỉ có một kết quả chờ chọn trong tài khoản. Có thể đóng bảng, dùng nút Quay lại, thoát game hoặc xuất/nhập bản lưu rồi chọn tiếp qua **Kết quả tẩy luyện đang chờ** ở kho. Chưa chọn xong thì chưa thể quay món khác; món đang chờ không thể nâng cấp, tiến hóa hoặc phân rã. Đồ khóa không bắt đầu tẩy luyện; nếu khóa sau khi quay vẫn được giữ cũ, phải mở khóa để nhận mới.

| Bậc | Vàng / lượt | Bụi rèn / lượt |
| --- | ---: | ---: |
| R | 80 | 2 |
| SR | 140 | 3 |
| SSR | 220 | 5 |
| UR | 340 | 8 |
| LR | 500 | 12 |
| MR | 720 | 18 |
| EX | 1.000 | 26 |

Chi phí phụ thuộc bậc trang bị. Khoảng quay phụ thuộc bậc và loại chỉ số, hiển thị trước khi trả phí; không dùng cấp đồ để quay lại nhiều lần miễn phí. Chỉ số cơ bản nhận tăng trưởng +12% mỗi cấp đồ, ba dòng đặc biệt +4% mỗi cấp theo cách tính trang bị hiện có. Trận đang chơi giữ chỉ số và RNG đã chốt; thay đổi áp dụng từ chuyến đi tiếp theo. Phòng thử dùng dữ liệu riêng và chặn tẩy luyện.

Save **v30 → v31** bổ sung `refining: {rolls: 0, pending: null}`. Kết quả chờ lưu món/dòng, chỉ số cũ/mới và dấu kiểm tra món; dữ liệu không khớp bị từ chối. Giữ khóa `thap-vo-tan-v1`, tài nguyên, khóa đồ, đội hình, bộ đồ, tiến trình và trận đang dở. Đã so sánh với engine trong APK phát hành 1.40 ở bảy trạng thái hành trình.

**1.346/1.346 kiểm thử đạt** (98 mới), **90 module gốc / 91 kể vendor** đạt cú pháp; **101/101 tài nguyên APK** khớp nguồn, **42 APK cũ** giữ nguyên hash. Chi tiết: `artifacts/QA-1.41.0.md`; kiểm chứng: `python artifacts/qa/verify-v1.41.py`. Chưa mở trình duyệt, server, emulator hoặc cài/chơi trên điện thoại thật.

## Đổi đội kèm bộ trang bị — 1.40

Mở **Anh hùng → Đội hình lưu nhanh**. Sắp xếp ba tướng, hàng trước/sau, chọn linh thú và mặc đồ rồi chạm **Lưu đội & bộ đồ**. Mỗi ô lưu đội ghi lại cả chín vị trí trang bị theo mã món; các bộ đồ riêng từng tướng vẫn độc lập. Ghi đè và xóa có bảng xác nhận. Ghi đè giữ tên đội; xóa đội lưu không xóa tướng, linh thú hoặc trang bị.

Chạm **Dùng đội** để xem đội hiện tại và đội sau khi đổi, linh thú, cộng hưởng, tổng ATK/HP/DEF ngoài trận và sáu chỉ số của từng tướng. Chí mạng, hút máu và hồi năng lượng trong bảng là phần cộng từ trang bị. Có chi tiết từng ô, hiệu ứng bộ 2–3 món và trấn phái trước/sau. Chỉ xác nhận mới đổi đội, bố trí, linh thú và các món hợp lệ cùng lúc.

Món đã phân rã, món do tướng khác đang mặc (kể cả trong đội sẽ dùng) hoặc vị trí đang mặc đồ khóa được cảnh báo và giữ món hiện tại ở ô đó. Các ô còn lại áp dụng đúng như bảng xem trước. Ô lưu trống sẽ tháo món chưa khóa. Không chuyển đồ tự động giữa các tướng. Cấp tướng, thiên phú và chỉ số món đồ dùng giá trị hiện tại. Phải kết thúc chuyến đang chơi và đưa tướng về từ viễn chinh trước khi áp dụng. Có thể xem trước và quản lý đội lưu trong chuyến; Phòng thử dùng dữ liệu riêng.

Save **v29 → v30** bổ sung `gear: null` cho từng đội lưu từ bản cũ: dùng đội cũ chỉ đổi tướng/hàng/linh thú và giữ trang bị hiện tại. Lưu lại đội để thêm bộ đồ. Bản mới dùng `gear: {hero: {weapon, armor, charm}}` với mã món và loại đồ, giữ cả mã món đã mất để cảnh báo. Giữ khóa `thap-vo-tan-v1`, đội hình, bộ đồ riêng từng tướng, khóa trang bị, RNG, trận đang dở và tài nguyên. Bộ đội và trang bị giữ qua đóng/mở app và xuất/nhập bản lưu.

Chi tiết kiểm tra: `artifacts/QA-1.40.0.md`; kiểm chứng APK: `python artifacts/qa/verify-v1.40.py`. Chưa mở trình duyệt, chạy CSS/WebGL hoặc cài/chơi trên điện thoại thật.

## Bộ trang bị của anh hùng — 1.39

Mở **Hội quán → Trang bị** và chọn tướng. Trong **Bộ trang bị của tướng**, chạm **Lưu bộ đang mặc** vào một trong ba ô Leo tháp, Săn boss hoặc Đột kích. Chạm tên để đổi tên (1–24 ký tự); **Lưu lại** để cập nhật ba món hiện tại; xóa ô lưu vẫn giữ trang bị. Lưu đè và xóa có bảng xác nhận trước khi thực hiện.

Chạm **Xem & mặc** để xem cả sáu chỉ số trước/sau, hiệu ứng bộ 2–3 món và trấn phái rồi xác nhận mặc. Game dùng cấp và chỉ số hiện tại của các món đã lưu. Món đã phân rã, món đang thuộc tướng khác hoặc ô đang khóa sẽ được báo rõ và giữ trang bị hiện tại; các ô còn lại đổi như bảng xem trước. Ô đã lưu trống sẽ tháo món chưa khóa. Trong chuyến đang chơi có thể quản lý bộ lưu; chỉ mặc lại sau khi kết thúc chuyến.

Save **v28 → v29** thêm `gearPresets: {}`. Giữ khóa trang bị, đội hình, RNG, hành trình và tài nguyên. Bộ đã đặt tên cùng mã món thiếu được giữ qua đóng/mở app và xuất/nhập bản lưu. Phòng thử dùng dữ liệu riêng.

**1.178/1.178 kiểm thử đạt** (62 mới), **87 module gốc / 88 kể vendor** đạt cú pháp. **98/98 tài nguyên APK** khớp nguồn; **40 APK cũ** giữ nguyên hash. Đã kiểm tra bảy trạng thái migration từ APK 1.38, lưu/đổi/xóa/tên, xác nhận cũ, đồ thiếu/tướng khác/khóa, giới hạn dữ liệu, bản lưu và handler thật trong DOM stub. Chưa chạy CSS/WebGL hoặc cài/chơi trên điện thoại thật. Chi tiết: `artifacts/QA-1.39.0.md`; kiểm chứng: `python artifacts/qa/verify-v1.39.py`.

## Trang bị nhanh thông minh — 1.38

Mở **Anh hùng → Kho đồ** rồi chọn một trong ba hướng xây tướng. Game chấm điểm từng món theo chỉ số, hiệu ứng, độ hiếm, cấp, chất lượng, trấn phái và bộ đồ; sau đó đề xuất cho ba ô vũ khí/giáp/phụ kiện. Ô chưa có món phù hợp vẫn để trống; đồ đang thuộc anh hùng khác và trấn phái không đúng chủ không được lấy tự động. Bảng xem trước hiển thị chỉ số hiện tại và chỉ số sau khi mặc, cùng bộ 2 món/3 món và trấn phái đang được tính.

Chạm **Xác nhận mặc bộ** để áp dụng cho chuyến đi kế tiếp. Trang bị đang khóa được giữ nguyên và không thể chuyển sang anh hùng khác, tháo hoặc phân rã cho tới khi mở khóa. Trang bị khóa vẫn được lưu qua tải lại và xuất/nhập bản lưu. Khi đang trong chuyến đi, hãy kết thúc chuyến trước rồi mới đổi bộ.

Save từ 1.37.0 hoặc cũ hơn được nâng lên **v28** với danh sách khóa rỗng; đội hình, hành trình, RNG và kho đồ hiện có vẫn được giữ nguyên.

## Sổ thành tựu dài hạn — 1.37

Mở **Nhiệm vụ → Sổ thành tựu dài hạn** để xem mười mục tiêu theo bốn bậc huy hiệu. Tiến độ được ghi tự động khi bạn chạm các tầng 10/30/50, hạ boss, phá giáp bộ phận, đỡ hoàn hảo, phản công, triệu hồi, mở rộng bộ sưu tập hoặc hoàn thành một chuyến đột kích đủ ba giai đoạn. Chạm **Nhận thưởng** khi thanh tiến độ đầy để nhận vàng, vé và tinh thạch; mỗi mục tiêu chỉ nhận một lần.

Thành tựu dùng các bộ đếm đơn điệu trong tài khoản nên giữ được qua đóng/mở game và xuất/nhập bản lưu. Save từ 1.36.0 hoặc cũ hơn được nâng lên **v27** với sổ mới trống; tiến trình cũ của tầng, triệu hồi và anh hùng vẫn tự tính vào các mục tiêu tương ứng. Phòng thử không cộng boss, bộ phận, đỡ hoàn hảo hay phản công vào tài khoản thật.

**1.116/1.116 kiểm tra đạt** (24 mới cho trang bị nhanh), **85 module gốc / 86 kể vendor** đạt cú pháp, **96/96 tài sản APK** khớp nguồn và các APK cũ giữ nguyên hash. Migration kiểm tra khóa trang bị, bộ đề xuất, giữ món yêu thích và chặn đổi bộ giữa chuyến đi. Chữ ký APK v2 cùng chứng thư bản trước. Kiểm tra UI dùng DOM stub; chưa chạy CSS/WebGL hoặc cài/chơi trên điện thoại thật. Chi tiết: `artifacts/QA-1.38.0.md`; kiểm chứng gói: `python artifacts/qa/verify-v1.38.py`.

## Phản công sau đỡ hoàn hảo — 1.36

Đỡ hoàn hảo một chiêu gây sát thương của boss để mở **một lần Phản công ở lượt kế tiếp**, nếu boss và đội vẫn còn sống sau cả lượt địch. Chạm nút **Phản công**, chọn tướng còn sống, mục tiêu và giáp boss rồi xác nhận. Tướng đã đánh thường vẫn phản công được. Hệ số sát thương 150% trước phòng thủ; không tốn lượt hoặc năng lượng, không tích liên kết và không tung tuyệt kỹ.

Có thể dùng bất kỳ lúc nào trong lượt đó; cơ hội hết hạn khi kết thúc lượt. Đóng bảng hoặc Quay lại vẫn giữ cơ hội. Auto bỏ qua phản công, bảng lệnh có nhắc rõ thời hạn. Đòn lao 3D, camera tiến gần và vệt vũ khí theo độ hiếm R → EX dùng ngân sách đồ họa hiện có; tắt hiệu ứng/giảm chuyển động giữ chỉ báo tĩnh.

Save **v26**, giữ khóa lưu/chữ ký APK. Cơ hội chưa dùng được giữ qua lưu/khôi phục; đòn đánh và thưởng được chốt trước hoạt cảnh để tránh xử lý hai lần. Bản cũ chỉ nâng phiên bản, không tạo cơ hội bù. **1.030/1.030 kiểm tra đạt** (45 mới), **94/94 tài sản APK** khớp nguồn, **37 APK cũ** và mọi archive giữ nguyên hash. Mô phỏng 96 hành trình qua 34.240 mốc lưu; 12 hành trình không dùng đỡ khớp engine 1.35 qua 4.376 bước. Đã xem tham chiếu hình học/phần mềm ngoại tuyến; chưa cài/chơi trên máy thật hoặc chạy CSS/WebGL. Chi tiết: `artifacts/QA-1.36.0.md`.

## Đỡ đòn đúng nhịp — 1.35

Khi **đánh tay**, kết thúc lượt trước chiêu mạnh của boss để mở vòng đỡ. Chạm **Đỡ đòn** khi vòng sáng/vạch thời gian vào vùng vàng: giảm **50% sát thương** chiêu đó trước khiên. Bấm ở giữa vùng vàng để đỡ hoàn hảo: mỗi tướng còn sống bị chiêu đó đánh trúng nhận thêm **15 năng lượng**, tối đa 100. Có phản hồi khiên 3D và rung nhẹ theo tùy chọn rung.

Mỗi chiêu chỉ thử một lần. Nhịp dài 1,8 giây, tâm ở 1,4 giây; khoảng đỡ ±180 ms, hoàn hảo ±65 ms, giữ nguyên ở 1×/2×. Auto bỏ qua đỡ đòn. Tắt tại **Cài đặt → Đỡ đòn đúng nhịp** để chơi như trước; lựa chọn nhớ riêng trên thiết bị. Giảm chuyển động/tắt hiệu ứng vẫn giữ vạch thời gian và hướng dẫn. Dùng được trong các chế độ có boss và trận đang dở, không cần khởi hành mới.

Bỏ qua, Quay lại, Escape, chuyển nền hoặc mở lại app giữa nhịp tính là bỏ lỡ, rồi xử lý lượt boss một lần. Không thử lại nhịp bằng cách thoát/mở game. Kết quả chiến đấu được lưu trước hoạt cảnh. Save **v25**, giữ khóa lưu và chữ ký APK; nếu không dùng đỡ thì luật, RNG và phần thưởng giữ nguyên.

**985/985 kiểm tra đạt** (61 mới), **81 module** đạt cú pháp; **92/92 tài sản APK** khớp nguồn và **36 APK cũ** giữ nguyên hash. Mô phỏng 72 hành trình, 25.695 mốc lưu và 188 lượt đỡ đang chờ; 12 chuyến engine 1.34 khớp qua 4.376 bước khi không dùng đỡ. Baseline 1.18 bất biến vẫn đạt đủ 60 kịch bản / 1.407 snapshot. Đã xem ảnh chỉ báo dựng gần đúng bằng phần mềm; chưa xác minh CSS, WebGL hoặc cài/chơi/nhịp bấm trên điện thoại thật. Chi tiết: `artifacts/QA-1.35.0.md`.

## Dị biến tháp — 1.34

Bắt đầu **chuyến Tháp thường mới** để chơi. Mỗi chặng 5 tầng, kể cả tầng boss, áp dụng một dị biến. Bản đồ báo trước luật hiện tại và chặng kế, màn chiến đấu hiển thị lợi ích/bất lợi; chạm biểu tượng thông tin để đọc chi tiết.

- **Huyết nguyệt:** đội và địch gây thêm 20% sát thương; hồi máu trong trận của cả hai bên giảm 25%. Hồi sinh, nghỉ chân và hồi phục sau trận giữ nguyên.
- **Sương hàn:** khiên mới của đội mạnh hơn 30%, đổi lại tướng còn sống mất 20 năng lượng lúc vào mỗi trận. Không nhân lại khiên đã có khi tải game.
- **Mạch mana:** đánh thường hồi thêm 15 năng lượng, tối đa 100; đổi lại mọi địch có thêm 20% máu. Bao gồm boss/tinh anh; bóng hầu, giáp bộ phận và hồi sinh theo trần máu đã tăng, không áp thêm lần nữa.

Thứ tự chốt khi khởi hành, giữ nguyên lúc lưu/khôi phục và luân phiên đủ ba loại trước khi lặp. Hiệu ứng kết hợp với chúc phúc, cổ vật, thiên phú và khế ước. Cảnh 3D đổi màu nền/sương/vòng sáng/thời tiết: trăng đỏ, tinh thể băng hoặc ấn mana tím; giảm hiệu ứng/chuyển động vẫn giữ chỉ báo tĩnh. Không cần tải tài nguyên mạng.

Save **v24**, giữ khóa lưu và chữ ký APK. Chuyến cũ từ 1.33 hoặc trước đó giữ nguyên luật tới cuối chuyến; bắt đầu hành trình mới để bật dị biến. Các chế độ thử thách, chiến dịch, phó bản, săn boss, đột kích và phòng thử giữ luật riêng.

**924/924 kiểm tra đạt** (64 mới), **79 module** đạt cú pháp; **90/90 tài sản APK** khớp nguồn và **35 APK cũ** giữ nguyên hash. Mô phỏng 216 chuyến với đủ sáu thứ tự dị biến, kiểm tra 81.975 mốc lưu; 18 chuyến engine 1.33 khớp qua 5.437 bước so sánh. Baseline 1.18 bất biến vẫn đạt đủ 60 kịch bản / 1.407 snapshot. Đã xem sáu ảnh hình học dựng ngoại tuyến; chưa xác minh CSS, WebGL hoặc cài/chơi/hiệu năng trên điện thoại thật. Chi tiết: `artifacts/QA-1.34.0.md`.

## Khế ước bóng tối — 1.33

Bắt đầu **chuyến Tháp thường mới**, hạ boss mỗi 5 tầng để mở giao ước. Xem chiến lợi phẩm đã trả → ký một khế ước hoặc bỏ qua → chọn cổ vật → chọn chúc phúc. Chạm **Xem trước khi ký** để đọc lợi ích, cái giá và xác nhận. Mỗi loại ký tối đa một lần; tối đa ba khế ước cùng có hiệu lực. Khi đã ký đủ ba, boss sau đi thẳng đến cổ vật.

- **Huyết chiến:** +25% mọi sát thương của đội, đổi lấy −15% máu tối đa. Bao gồm đòn đánh, kỹ năng, liên kết, linh thú, thiêu đốt, phản đòn và hiệu ứng phụ. Máu hiện tại chỉ bị hạ nếu vượt trần mới; người đã gục vẫn giữ 0 máu. Chúc phúc tăng máu sau đó dùng trần đã giảm.
- **Tham vọng:** +40% vàng trận đấu và kho báu, gồm thưởng tinh anh/chúc phúc tăng vàng. Đổi lại địch gây thêm 15% sát thương trước khi trừ khiên. Không tăng quà nhiệm vụ, triệu hồi hoặc viễn chinh; không tính lại phần thưởng boss vừa hạ. Tổng vàng thực nhận hiển thị trên chiến lợi phẩm và kết quả chuyến.
- **Đánh đổi sinh lực:** +30% sát thương, hồi máu và khiên của kỹ năng anh hùng, gồm hiệu ứng thức tỉnh/trấn phái. Trước mỗi lần dùng, mất 5% máu tối đa (làm tròn lên), xuyên khiên, luôn chừa ít nhất 1 máu. Kỹ năng diện rộng/đánh bồi chỉ trả một lần; thao tác không hợp lệ không mất máu. Liên kết, linh thú và nội tại trang bị không được tăng bởi khế ước này và không phải hiến máu; hút máu theo sát thương giữ nguyên tỷ lệ.

Các khế ước kết hợp với chúc phúc/cổ vật và chỉ áp dụng trong chuyến đó. Có khay biểu tượng để xem lại; kỹ năng hiển thị lượng máu sắp hiến. Auto dừng ở giao ước để người chơi tự quyết. Khế ước, lựa chọn chờ và phần thưởng đã trả giữ nguyên khi đóng/mở game; không tính lại chi phí hoặc phát lại thưởng.

Save **v23**, giữ khóa lưu và chữ ký APK. Chuyến đang dở từ 1.32 hoặc cũ hơn giữ luật/RNG/phần thưởng của nó đến hết chuyến; khởi hành mới để mở khế ước. Các chế độ thử thách, chiến dịch, phó bản, săn boss, đột kích và phòng thử giữ luật riêng.

**860/860 kiểm tra đạt** (66 mới), **77 module** đạt cú pháp; **88/88 tài sản APK** khớp nguồn, **34 APK cũ** giữ nguyên hash. Mô phỏng 320 chuyến với năm cách chọn, kiểm tra 35.072 mốc lưu; 16 chuyến engine 1.32 khớp qua 5.476 bước so sánh. Baseline 1.18 bất biến vẫn đạt đủ 60 kịch bản / 1.407 snapshot. Đã xem ba ấn ký SVG dựng ngoại tuyến; chưa xác minh bố cục CSS, WebGL, cài/chơi hoặc hiệu năng trên điện thoại thật. Chi tiết: `artifacts/QA-1.33.0.md`.

## Quái tinh anh — 1.32

Áp dụng khi bắt đầu **chuyến Tháp thường mới**, từ tầng 10 trong phòng không có boss. Tầng 10 là boss, nên lần gặp thực tế sớm nhất trên bản đồ thường là **tầng 11**. Phòng Tinh anh chắc chắn có một quái mang đặc tính; trận thường có **28%** cơ hội. Tối đa một con mỗi trận. Quái đó có thêm 25% máu, 12% sức đánh và 2 phòng thủ.

- **Cuồng nộ:** sức đánh tăng theo lượng máu đã mất, tối đa 60%. Dồn sát thương hoặc đóng băng để kết liễu.
- **Hộ vệ:** khiên đầu trận bằng 30% máu; còn sống và còn khiên thì đồng bọn giảm 35% mọi sát thương. Phá khiên hoặc hạ nó để tắt bảo hộ. Auto và linh thú đánh đơn ưu tiên Hộ vệ còn bảo hộ.
- **Tái sinh:** sống lại một lần với 40% máu, xóa thiêu đốt/đóng băng/dấu Hư Không. Mạng đầu chưa tính là tiêu diệt và chưa kích hoạt cổ vật khi hạ địch.

Thắng cả trận nhận thêm **80 + tầng × 4 vàng**, **3 + phần nguyên(tầng / 10) bụi rèn**, và chắc chắn một trang bị dùng tỉ lệ tốt hơn: SSR 8%, SR 62%, phần còn lại R; từ tầng 25 thêm UR 4%, từ tầng 50 thêm LR 1%, trừ vào phần R. Vàng trong màn thưởng đã gồm phần thêm. Kho đầy vẫn đổi trang bị thành bụi như trước. Không thưởng thêm khi thua hoặc rút lui.

Ba loại có giáp/vương miện/màu riêng, khiên Hộ vệ biến mất khi vỡ và lõi Tái sinh tối sau khi dùng mạng. Tắt hiệu ứng/giảm chuyển động vẫn giữ hình dáng và chỉ báo chiến thuật. Có nút xem cơ chế/khắc chế ngay trong trận và cảnh báo trước khi chọn lối.

Save **v22** tự nâng từ bản cũ, giữ khóa lưu và chữ ký APK. Chuyến đang chơi dở giữ luật sinh quái/RNG/phần thưởng cũ cho đến khi kết thúc; khởi hành chuyến mới để bật tinh anh. Thử thách, chiến dịch, phó bản, săn boss, đột kích và phòng thử giữ luật riêng.

**794/794 kiểm tra đạt**, **75 module** đạt cú pháp, **86/86 tài sản APK** khớp nguồn; **33 APK cũ** giữ nguyên hash. Có 54 kiểm tra mới, 360 trận mô phỏng so với 360 trận ở bản 1.31 và 15 góc nhìn mô hình/12 SVG dựng ngoại tuyến. Baseline chiến đấu 1.18 bất biến: 60 kịch bản, 1.407 ảnh chụp trạng thái. Chưa thử APK, CSS, WebGL hoặc FPS trên điện thoại thật. Xem `artifacts/QA-1.32.0.md`.

## Hiệu năng tự động — 1.31

Vào **Cài đặt → Hiệu năng tự động / Hiện FPS**. Tự động mặc định bật, FPS mặc định ẩn. Game đo các khung đã vẽ theo cửa sổ một giây, bỏ qua giai đoạn khởi động/chuẩn bị tài nguyên và đặt lại phép đo khi chuyển nền, mở menu hoặc đổi kích thước. FPS dưới 78% giới hạn trong hai cửa sổ liên tiếp sẽ giảm chất lượng từng bước, tối đa ba bước; các lần giảm cách nhau ít nhất sáu giây. FPS ổn định từ 93% giới hạn trở lên trong tám cửa sổ sẽ tăng lại một bước, cách lần đổi trước ít nhất 12 giây. Khựng ngắn hoặc thời gian ở nền không tự làm hạ chất lượng.

Tự động giảm độ phân giải, số hạt/thời tiết và bóng đổ trực tiếp trên cảnh hiện tại, giữ nguyên nhân vật/camera và nhịp chiến đấu. Mức Thấp/Vừa/Cao, công tắc bóng/hiệu ứng và giới hạn 30/60 FPS đã chọn luôn là mức trần. Tắt tự động khôi phục đúng mức đã chọn. Bộ giới hạn FPS bù nhịp cho màn hình 90/120 Hz. Hai tùy chọn mới nhớ riêng trên thiết bị, không thuộc tệp xuất bản lưu; save vẫn **v21**.

Mô hình đội đang chọn, linh thú và một số địch thông dụng được chuẩn bị trong các lượt rảnh, mỗi lượt một mô hình. Bộ nhớ hình học/vật liệu vẫn chia sẻ, còn khớp/chuyển động dùng từng bản riêng; shader được chuẩn bị trước khi API hỗ trợ. Âm thanh đội và nhạc trận/boss được tạo sẵn thành buffer sau thao tác người chơi, mỗi lượt rảnh một âm, không phát tiếng khi chuẩn bị. Bắt đầu hành động sẽ ngừng xếp việc chuẩn bị mới. Tạo ảnh thẻ cũng chạy từng ảnh trong các đợt có giới hạn; tối đa 96 ảnh cache và 32 buffer âm thanh.

Mở hộp thoại cài đặt/thông tin dừng cảnh phía sau; mô hình xem trước trong hộp thoại và chiêu cuối xem thử vẫn hoạt động. Chuyển app xuống nền dừng vẽ và ngừng lịch chuẩn bị mới, trở về lấy mẫu FPS lại. Shader đã bắt đầu biên dịch có thể hoàn tất rồi mới được giải phóng; không thể ngắt giữa chừng. Chuẩn bị tài nguyên nhằm giảm công việc ở lần dùng sau, không bảo đảm loại bỏ mọi khựng ở lần đầu.

**740/740 kiểm tra đạt**, **72 module** đạt cú pháp, **83/83 tài sản APK** khớp nguồn; **32 APK cũ** giữ nguyên hash. Có 23 kiểm tra mới và sáu kịch bản dùng mốc thời gian mô phỏng tại `artifacts/qa/performance-simulations-v1.31.json`. Luật chiến đấu, gacha, kinh tế và schema save giống từng byte với bản 1.30. Kiểm tra dùng Node/VM/Three.js với renderer/DOM/AudioContext giả lập; chưa đo FPS, nhiệt độ, pin, WebGL hoặc chơi APK trên điện thoại thật. Chi tiết tại `artifacts/QA-1.31.0.md`.

## Nhịp va chạm và âm thanh — 1.30

Đòn nặng khựng hình khoảng **28 ms**, chí mạng **55 ms**, phá giáp **60 ms**, kết liễu boss **70 ms** ở tốc độ 1×. Giữ tư thế tại thời điểm va chạm rồi bắt nhịp lại trong phần thu đòn; thời điểm kết thúc trình chiếu và trả quyền thao tác giữ nguyên. Tốc độ 2× rút ngắn nhịp khựng còn một nửa. Hồi máu/tạo khiên không khựng. Tắt **Hiệu ứng đầy đủ** hoặc bật giảm chuyển động của hệ thống sẽ bỏ hiệu ứng mới và nhịp khựng.

Kiếm/song đao có vệt chém ngắn tại mục tiêu; chạm giáp hoặc khiên tóe tia lửa vàng. Kỹ năng tấn công có hiệu ứng chạm theo bảy hệ: lửa bốc, tinh thể băng văng, nhánh sét, vòng gió, mảnh đá, tia sáng và vòng bóng tối. UR trở lên có thêm lớp, MR/EX có thêm mảnh; khung hình gọn giữ số lớp thấp. Hiệu ứng dùng chung giới hạn vật thể hiện có và được thu hồi khi hết thời gian/chuyển màn.

Âm thanh được tổng hợp ngay trên thiết bị: kiếm, song đao, cung, khiên, trượng, pháp cầu và đòn quái có tiếng phóng/chạm riêng. Tiếng chạm phát cùng số sát thương; hồi máu/tạo khiên có âm riêng. Nhạc trận nhẹ, nhạc boss có nhịp trầm nhanh hơn. Vào **Cài đặt → Nhạc chiến đấu** để bật/tắt riêng; **Âm thanh** tắt cả nhạc và hiệu ứng. Nhạc chỉ bắt đầu sau thao tác người chơi, dừng khi về sảnh/kết thúc trận hoặc chuyển app xuống nền. Lựa chọn nhạc nhớ riêng trên thiết bị, không thuộc tệp xuất bản lưu. Không tải nhạc từ mạng.

**717/717 kiểm tra**, **71 module** đạt cú pháp. Kiểm tra nhịp tiếp xúc, hành động thật, giảm chuyển động, 2×, hạn mức 20 nguồn âm/32 buffer, tắt tiếng, chuyển nền và lỗi âm thanh bằng Node/VM/Three.js. Luật chiến đấu, gacha, kinh tế và save v21 giữ nguyên từng byte với bản 1.29. Có **38 khung hình ngoại tuyến**, bảng ảnh/GIF và hai đoạn WAV mẫu trong `artifacts/qa/*v1.30*`. Đã xem bảng ảnh; đây là hình dựng phần mềm, chưa xác minh WebGL, âm thanh phát thực hoặc APK trên điện thoại. Xem `artifacts/QA-1.30.0.md`.

## Camera chiến đấu động — 1.29

Camera bám vị trí thực của tướng khi lao lên ra đòn. Chí mạng yêu cầu zoom thêm 7,5%; đòn kết liễu boss thêm 12%. Góc nhìn tự giới hạn để giữ các nhân vật đang hiển thị trong khung, kể cả tướng EX và cánh rồng. Va chạm có rung nhẹ tùy sức đòn; hồi máu hoặc tạo khiên không rung. Sau hành động, camera trở về chính xác góc toàn đội, không kéo dài thời gian chờ thao tác. Liên kết hai tướng dùng chung một nhịp camera.

Vào **Cài đặt → Camera chiến đấu động / Rung màn hình**. Hai lựa chọn mặc định bật; tắt camera vẫn nhớ lựa chọn rung trước đó. Rung màn hình độc lập với rung điện thoại. Tốc độ 2× rút ngắn cả nhịp camera. Tắt **Hiệu ứng đầy đủ** hoặc bật giảm chuyển động của hệ thống sẽ giữ góc tĩnh. Chuyển nền, đổi kích thước hoặc mở chiêu cuối hủy nhịp cũ. Các lựa chọn camera được lưu riêng trên thiết bị, không thuộc tệp xuất bản lưu.

**694/694 kiểm tra**, **68 module** đạt cú pháp. Nhãn và chọn mục tiêu được kiểm tra với vị trí/camera đang chuyển động bằng Three.js thật trong Node/VM. Luật chiến đấu, tỉ lệ gacha, kinh tế và save v21 giữ nguyên từng byte với bản 1.28. **79/79 tài sản APK** khớp nguồn, **30 APK cũ** giữ nguyên hash. Có 56 khung hình dựng ngoại tuyến và bảng so sánh/GIF tại `artifacts/qa/camera-*v1.29*`; ánh sáng mô phỏng, không phải ảnh chụp game/WebGL. Chưa thử bản 1.29 trên điện thoại thật hoặc đo FPS. Xem `artifacts/QA-1.29.0.md`.

## Chuyển động toàn thân — 1.28

Đủ 20 tướng và bốn trang phục có khớp hông, eo, đùi, gối và hai vạt áo choàng. Sáu lớp có dáng nghỉ riêng; ra đòn dùng chân trụ và xoay người. Xạ thủ kéo dây cung rồi thả khi tên bay. Bản đồ có động tác bước chân; chiêu cuối và màn thắng dùng cùng bộ khớp.

Trúng đòn giật lùi ra xa nguồn đánh. Tướng gục khụy gối rồi nằm trên sàn, không thể chọn qua mô hình; được Lumi/Seraph/Eira hồi sinh sẽ đứng dậy từ thời điểm hồi máu. Mở lại trận hoặc đổi đồ họa giữ đúng tướng đang gục. Trình chiếu chờ động tác ngã/đứng dậy kết thúc trước khi chuyển màn hoặc trả quyền thao tác. Tốc độ 2× và giảm hiệu ứng/chuyển động áp dụng cả các động tác mới.

**678/678 kiểm tra**, **67 module** đạt cú pháp. Tướng cơ bản có 44–68 mesh / 11.316–22.230 đỉnh, giữ giới hạn hình học hiện có; chưa đo FPS máy thật. Luật chiến đấu, tỉ lệ gacha, kinh tế và save v21 giữ nguyên từng byte với bản 1.27. Có 92 khung hình dựng ngoại tuyến cùng bảng ảnh/GIF trong `artifacts/qa/motion-*v1.28*`; ánh sáng mô phỏng, không phải ảnh chụp WebGL. Chưa thử APK trên điện thoại thật. Xem `artifacts/QA-1.28.0.md`.

## Tạo hình dark fantasy — 1.27

Đủ 20 tướng có giáp, mũ và phối màu riêng. Hộ vệ có vai rộng, giáp chồng lớp và đại khiên; sát thủ giáp gọn, mặt nạ và song đao; xạ thủ có mũ trùm, cung và bao tên; pháp sư/tư tế có áo choàng dài, giáp vai nhọn và quyền trượng/pháp khí. Đầu nhỏ hơn, khe mắt hẹp, giáp chân và giày có hình khối thay cho tạo hình chibi cũ.

SSR trở lên có vòng ấn đứt đoạn. UR thêm quỹ đạo phù văn; LR thêm mảnh sáng chuyển động; MR thêm cánh kim loại; EX có hai quỹ đạo phân đoạn độc lập. Bốn trang phục đã mở, vũ khí riêng và hiệu ứng bảy bậc trang bị tiếp tục dùng được. Tạo hình áp dụng ở sảnh, chân dung, triệu hồi, bản đồ, chiến đấu, chiêu cuối và màn thắng; ảnh SVG dự phòng cũng cùng phong cách.

**665/665 kiểm tra**, **66 module** đạt cú pháp. Mô hình tướng cơ bản dùng 34–59 mesh / 10.896–21.810 đỉnh, nằm trong giới hạn hiện có. Luật chiến đấu, tỉ lệ gacha, kinh tế và save v21 giống từng byte với bản 1.26; không cần chuyển dữ liệu. Có ảnh kiểm tra hình học dựng ngoại tuyến tại `artifacts/qa/dark-fantasy-preview.png`, `dark-fantasy-roster.png`, `dark-fantasy-before-after.png` và `dark-fantasy-skins.png`. Ánh sáng ảnh là mô phỏng, không phải ảnh chụp WebGL. Chưa thử trên điện thoại thật. Xem `artifacts/QA-1.27.0.md`.

## Hành trình tân thủ — 1.26

Tài khoản mới có thể chọn **Học và chơi ngay** hoặc **Tự khám phá** ở lời chào. Vào **Nhiệm vụ** hoặc **Cài đặt → Hướng dẫn và quà tân thủ** để bắt đầu/học tiếp. Hướng dẫn có chín bước: triệu hồi một tướng → xếp vào đội → mặc trang bị → khởi hành → chọn lối chiến đấu → chạm mục tiêu → đánh thường → kết thúc lượt → dùng kỹ năng khi đủ 100 năng lượng. Khung gợi ý đánh dấu nút thật; nút chỉ dẫn chỉ điều hướng/cuộn tới nút, không tiêu vé hoặc thao tác hộ. Bước học được lưu sau hành động thành công, trước hoạt cảnh.

Bỏ qua giữ nguyên bước đã học; trở lại tiếp tục đúng bước. Nếu đã ở trong trận thường, chọn mục tiêu sẽ nối phần khởi hành/chọn lối sang chiến đấu. Thua hoặc kết thúc trận sớm có thể học tiếp ở chuyến/trận sau. Đội hình đã chốt phải kết thúc hoặc rút lui trước khi đổi; đồ đang mặc có hướng dẫn tháo/mặc lại miễn phí. Các bước chiến đấu dùng Tháp thường; phòng thử không đổi hướng dẫn hoặc nhận quà.

Chuỗi năm nhiệm vụ nhận riêng **một lần cho mỗi bản lưu**, vẫn làm được khi bỏ qua hướng dẫn. Mục tiêu sau mở khi nhận quà mục tiêu trước; tài khoản cũ có tiến trình phù hợp cũng nhận được.

| Mục tiêu | Vé | Vàng |
| --- | --- | --- |
| Triệu hồi ít nhất 1 tướng | 2 | 150 |
| Mặc ít nhất 1 trang bị | 2 | 200 |
| Hoàn thành tầng 3 Tháp thường | 3 | 250 |
| Hoàn thành tầng 5 Tháp thường | 3 | 400 |
| Hoàn thành tầng 10 Tháp thường | 5 | 500 |
| Tổng | **15** | **1.500** |

Sau khi nhận đủ năm quà, chọn **Astra / Nyx / Kael**. Có xem mô hình và chiêu cuối trước khi xác nhận. Tướng mới nhận cấp 1, chưa thức tỉnh; nếu đã có, nhận **1 bản trùng + 12 tinh thạch + 180 vàng**, giữ cấp/thiên phú/thức tỉnh. Chỉ chọn một lần; đóng hoặc đổi hộp thoại hủy lựa chọn chưa xác nhận. Không đổi pity, vé, bảo đảm định hướng hay đội/chuyến đã chốt.

Save **v21** thêm tiến độ hướng dẫn, các quà đã nhận và SSR đã chọn; v20 thêm mặc định trống, giữ nguyên mọi trường cũ. Không tự bật hướng dẫn cho tài khoản đã qua lời chào. Nhập/xuất và tải lại giữ toàn bộ tiến độ. **665/665 bài kiểm tra**, **64 module** đạt cú pháp; 11 trạng thái v20 từ engine thực APK 1.25 và bản lưu v2 được kiểm tra, baseline chiến đấu 1.18 giữ 60 kịch bản/1.407 trạng thái. Chưa xác minh trực quan CSS/WebGL, cảm ứng hoặc chơi bản 1.26 trên điện thoại thật. Xem `artifacts/QA-1.26.0.md`.

## Triệu hồi định hướng — 1.25

Vào **Triệu hồi → Chọn mục tiêu**. Chạm một trong 20 anh hùng ở đủ bảy bậc để xem mô hình, xoay tướng, đọc kỹ năng hoặc xem chiêu cuối 3D, rồi chọn tướng để theo đuổi. Có thể chọn cả tướng đã sở hữu để kiếm bản trùng thức tỉnh.

Khi ra **đúng bậc của mục tiêu**, cơ hội ban đầu chia đều cho các tướng cùng bậc. Ví dụ Astra có 33,333% khi ra SSR (tỉ lệ cơ bản 1% mỗi lượt trước bảo đảm bậc hiếm). Nếu ra Nyx hoặc Kael, lần ra đúng SSR tiếp theo chắc chắn là Astra. Kết quả và bảo đảm được lưu trước hoạt cảnh, dùng chung cho quay ×1/×10; trong một đợt ×10 có thể vừa mở vừa dùng bảo đảm.

Bảo đảm mục tiêu lưu riêng cho **R / SR / SSR / UR / LR / MR / EX**. Đổi tướng cùng bậc sẽ chuyển bảo đảm sang tướng mới. Bỏ mục tiêu hoặc chọn bậc khác giữ lại tiến độ; khi không chọn mục tiêu, các lượt quay không tích hoặc tiêu hao bảo đảm mục tiêu. Kết quả bậc cao hơn vẫn được giữ nguyên và không tiêu hao bảo đảm ở bậc mục tiêu. Các mốc bảo đảm SR+, SSR+, UR+… hiện có tiếp tục hoạt động.

Vào **Triệu hồi → Đổi tinh thạch** để mở trực tiếp một tướng chưa sở hữu. Tinh thạch nhận từ bản trùng và các hoạt động trong game, dùng chung với ấn ký/thức tỉnh. Cửa hàng hiển thị giá và số dư sau đổi trước khi xác nhận.

| Bậc | R | SR | SSR | UR | LR | MR | EX |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Tinh thạch | 25 | 100 | 300 | 600 | 1.000 | 1.800 | 3.000 |

Mỗi tướng chỉ đổi một lần, nhận cấp 1/chưa thức tỉnh. Đổi tướng giữ nguyên vé, bản trùng, đội hình, nhiệm vụ triệu hồi, mọi bộ đếm bảo đảm và các đội đã chốt trong chuyến đi. Đóng/mở app hoặc nhập/xuất bản lưu giữ cả mục tiêu, bảo đảm và lịch sử đổi. Nâng bản lưu v19 lên v20 thêm tiến độ định hướng trống, không nhận quà hồi tố và giữ nguyên tiến độ cũ.

**623/623 bài kiểm tra**, **62 module** đạt cú pháp. Quay không chọn mục tiêu được đối chiếu 1.000 lượt với engine thực từ APK 1.24, giữ nguyên kết quả, RNG và tài nguyên. Kiểm tra 21 trạng thái thực từ engine v16/v19, các kiểm tra v17/v18 và bản lưu v2; giữ baseline 1.18 với 60 kịch bản/1.407 trạng thái. Có kiểm tra handler UI và mô hình Three.js bằng Node/VM; chưa xác minh trực quan CSS/WebGL, cảm ứng hoặc chơi bản 1.25 trên điện thoại thật. Xem `artifacts/QA-1.25.0.md`.

## Hắc Long Hư Không — 1.24

Vào **Sảnh → Chế độ → Đột kích 3 đội → Hắc Long Hư Không**. Boss mở sau khi thắng **Thủ vệ Tam Ấn · Tinh anh**. Có thể xem trước boss và yêu cầu mở khóa ngay khi chưa đủ điều kiện. Dùng chung bản nháp 9 tướng với Tam Ấn; mỗi tướng chỉ ở một đội, chốt trang bị/thiên phú và chỉ số khi bắt đầu chuyến đi.

1. **Bẻ cánh hắc long:** khi cánh còn nguyên, giảm 60% mọi sát thương nhận và rồng không thể bị hạ. Nhắm **Tay / cánh** để bào giáp bằng sát thương trực tiếp trước giảm bảo hộ, kể cả lúc rồng chỉ còn 1 HP. Phá cánh ép rồng hạ đất, gỡ bảo hộ và giảm 20% sức đánh.
2. **Phá kết giới:** khi lõi còn nguyên, giảm 70% mọi sát thương và giữ lại ít nhất 1 HP. Nhắm **Lõi** để phá kết giới; sau khi phá, đòn trực tiếp được thêm 25% sát thương.
3. **Bình minh sau bão:** bắt đầu ở trạng thái cuồng nộ +25% sức đánh và tụ hắc lôi. Hai kỹ năng tấn công, đóng băng hoặc phá Đầu đều ngắt chiêu toàn đội. Kỹ năng chỉ hồi máu không tăng điểm ngắt.

Rồng có thân giáp đá đen, hai cánh chuyển động độc lập, sừng, đuôi và hạch sáng xanh/tím. Cánh gập khi hạ đất, kết giới biến mất khi lõi vỡ. Đấu trường **Đền Hắc Lôi** có cột gãy, mưa và sấm đổi sáng chậm. Tắt hiệu ứng hoặc bật giảm chuyển động sẽ dừng chuyển động thời tiết/sấm; có tranh SVG thay thế nếu 3D không khả dụng.

| Độ khó | Cấp gợi ý | Rương bảo đảm | Vảy Hư Không | Tinh hoa boss | Vàng |
| --- | --- | --- | --- | --- | --- |
| Khám phá | 30+ | 1 trang bị UR | 1 | 10 | 750 |
| Tinh anh | 50+ | 1 trang bị LR | 2 | 16 | 1.200 |
| Ác mộng | 70+ | 1 trang bị MR | 3 | 24 | 2.000 |

Thắng cả ba trận mới nhận thưởng, mở độ khó tiếp theo và ghi thành tích. Kho đầy tự đổi đồ thành bụi rèn, vẫn nhận vảy/vàng/Tinh hoa. Đóng/mở game hoặc rương không trả lại thưởng lần nữa. Thua/rút lui bắt đầu lại từ trận I và không mất tài nguyên. Có thể tiếp tục từng bước bàn giao đội sau khi mở lại app.

**Bộ Hư Không** tại **Xưởng chế tác** có vũ khí, giáp và ấn. Mỗi món cần **4 Vảy Hư Không + 150 vàng + 3 bụi**, phẩm chất 100%, bậc SSR và tiến hóa được theo hệ cũ. Hai món tăng **10% ATK**. Ba món: mỗi đòn trực tiếp của người mặc tích một dấu trên từng mục tiêu; đủ ba dấu gây nổ **80% ATK của người kích nổ** rồi xóa dấu. Các tướng dùng chung dấu trên cùng kẻ địch. Kỹ năng diện rộng tích riêng mỗi địch; liên kết tính một đòn mỗi người thi triển. Thiêu đốt, linh thú, phản sát thương và vụ nổ không tích thêm dấu. Sát thương nổ tôn trọng khiên/bảo hộ và thống kê chỉ ghi HP thực mất. Có thể thử miễn phí trong Phòng thử.

Hắc Long có **15 nhiệm vụ** cùng các mốc với Tam Ấn: thắng lần đầu, 5/15 chuyến, tổng ≤12 vòng và đủ 9 tướng còn trụ. Mỗi boss/độ khó có sổ quà/kỷ lục riêng; tổng cộng **30 phần thưởng**. Nút nhận mang đúng boss và mức khó đang hiển thị, kể cả khi chuyển màn hình. Quà nhiệm vụ nhận riêng với rương sau trận.

Bản lưu **v18 → v19** giữ nguyên Tam Ấn, các ví, đồ, RNG và toàn bộ chuyến đang dở; chỉ thêm sổ Hắc Long trống. v17 được nâng nhiệm vụ trước rồi thêm Hắc Long, các bản v1–v16 vẫn theo chuỗi nâng cấp có sẵn. Giữ khóa `thap-vo-tan-v1` và package/chữ ký để cài đè bản cũ.

**569/569 bài kiểm tra**, **60 module** đạt cú pháp; **720 mô phỏng** với đội R/SR theo chính sách Auto. Kiểm tra 17 trạng thái từ engine APK cũ v17/v18 và bản lưu v2 thực; giữ baseline 1.18 với 60 kịch bản / 1.407 trạng thái. **71/71 tài sản APK** khớp nguồn, **25 APK cũ** giữ nguyên hash. Chưa xác minh CSS/WebGL, cảm ứng hoặc chơi APK 1.24 trên điện thoại thật. Xem `artifacts/QA-1.24.0.md`.

## Nhiệm vụ Tam Ấn & quà lần đầu — 1.23

Vào **Sảnh → Chế độ → Đột kích 3 đội → Xem 5 nhiệm vụ**, hoặc mở **Nhiệm vụ → Quà lần đầu & thành tích đột kích**. Mỗi mức Khám phá / Tinh anh / Ác mộng có 5 mục tiêu độc lập, tổng cộng **15 phần thưởng một lần**, không đặt lại theo ngày hay tuần:

| Nhiệm vụ | Điều kiện ở đúng độ khó | Khám phá | Tinh anh | Ác mộng |
| --- | --- | --- | --- | --- |
| Phá Tam Ấn lần đầu | Thắng cả 3 giai đoạn lần đầu | 3 vé, 500 vàng, 4 Tinh hoa | 5 vé, 1.000 vàng, 8 Tinh hoa | 8 vé, 1.800 vàng, 14 Tinh hoa |
| Người giữ ấn | Hoàn thành 5 chuyến | 2 vé, 100 bụi | 3 vé, 180 bụi | 5 vé, 300 bụi |
| Chủ nhân Tam Ấn | Hoàn thành 15 chuyến | 4 vé, 8 Tinh hoa | 6 vé, 16 Tinh hoa | 10 vé, 28 Tinh hoa |
| Chớp nhoáng | Tổng 3 giai đoạn tối đa 12 vòng | 2 vé, 600 vàng | 3 vé, 1.000 vàng | 5 vé, 1.600 vàng |
| Vẹn nguyên | Mỗi đội còn đủ 3 tướng khi thắng, trong cùng một chuyến hoàn thành | 2 vé, 120 bụi | 3 vé, 200 bụi | 5 vé, 350 bụi |

**Vẹn nguyên có tính hồi sinh** trước khi trận thắng kết thúc. Chỉ thắng một/hai giai đoạn rồi rút lui hoặc thua không ghi thành tích nhiệm vụ. Hoàn thành một chuyến có thể đạt nhiều mục tiêu. Số lần thắng, kỷ lục tốt nhất và thành tích đủ đội được giữ qua các chuyến; cần tự đạt từng độ khó.

Quà nhiệm vụ **nhận riêng bằng nút Nhận thưởng**, hoặc **Nhận tất cả** cho các mục tiêu sẵn sàng ở độ khó đang xem. Không cần nhận quà trước để mở mục tiêu tiếp theo. Màn kết quả dẫn tới quà đang chờ; thanh Nhiệm vụ có chấm báo. Rương SSR/UR/LR, vàng và Tinh hoa tiêu chuẩn sau trận vẫn được trả như bản 1.22. Nhận quà nhiệm vụ không đổi đồ trong rương, RNG hoặc đội hình/trận đang dở. Kho đầy vẫn nhận các tài nguyên nhiệm vụ. Nếu một loại tài nguyên vượt giới hạn bản lưu, thao tác nhận không trừ/đánh dấu/cộng gì cho đến khi dùng bớt tài nguyên đó.

Bản lưu **v17 → v18** giữ các đội, kỷ lục và chuyến đang dở. Số lần thắng và kỷ lục cũ được tính cho nhiệm vụ mới; quà vẫn chờ người chơi nhận. Với Vẹn nguyên, chỉ công nhận từ báo cáo thắng cuối cùng đang lưu nếu cả ba đội đều còn 3 tướng. Các chuyến cũ không còn báo cáo sẽ cần đạt lại điều kiện này. Bản v1–v16 vẫn được nâng cấp theo chuỗi hiện có; giữ khóa `thap-vo-tan-v1`.

**512/512 bài kiểm tra**, **59 module** đạt cú pháp. Có 22 bài luật/migration/UI tĩnh và 4 bài handler mới; kiểm tra 9 trạng thái do engine APK 1.22 tạo ra, cùng bản lưu v2 thực. Giữ baseline chiến đấu 1.18 với 60 kịch bản / 1.407 trạng thái. Chưa xác minh trực quan CSS/WebGL hoặc chơi APK 1.23 trên điện thoại thật. Chi tiết ở `artifacts/QA-1.23.0.md`.

## Đột kích 3 đội — 1.22

Vào **Sảnh → Chế độ → Đột kích 3 đội**. Cần sở hữu ít nhất **9 anh hùng khác nhau** và đưa họ về từ viễn chinh. Chọn từng vị trí để xếp đội hoặc dùng **Tự xếp 3 đội**; chọn tướng đã xếp sẽ đổi chỗ hai vị trí. Mỗi đội có bố trí **1 trước–2 sau** hoặc **2 trước–1 sau** riêng. Đội hình ba người thông thường vẫn được lưu riêng.

Đối thủ **Thủ vệ Tam Ấn** có ba giai đoạn, mỗi đội chỉ đánh một giai đoạn:

1. **Phá giáp cổ thạch**, đấu trường rừng: giáp Lõi giảm 45% sát thương trực tiếp từ anh hùng. Nhắm Lõi để phá và mở điểm yếu +25% sát thương theo cơ chế phá giáp hiện có.
2. **Ngắt địa chấn**, đấu trường dung nham: boss bắt đầu tụ lực. Hai kỹ năng tấn công, đóng băng hoặc phá giáp Đầu có thể ngắt; địa chấn đánh toàn đội.
3. **Ấn triệu hồn**, thành trên mây: hai bóng hộ vệ giảm 35% sát thương boss nhận. Dọn lính, đánh boss và chú ý chu kỳ gọi lại lính ba lượt.

Mỗi đội vào trận **đầy máu, 100 năng lượng**, có cộng hưởng riêng và bắt đầu thanh liên kết từ 0; linh thú sẵn sàng lại đầu mỗi trận. Chốt chỉ số, thức tỉnh, trang bị và thiên phú của **cả 9 tướng từ lúc khởi hành**. Nâng/đổi trang bị, đổi linh thú hoặc đặt lại thiên phú giữa chuyến không viết lại các đội đang chờ. Chín tướng đều được giữ lại, không thể gửi đi viễn chinh cho đến khi kết thúc đột kích.

Sau giai đoạn I/II, xem đóng góp trận và chạm **Chuẩn bị đội tiếp theo → Đội tiếp theo xuất trận**. Đóng/mở app giữ đúng trận và bước bàn giao, không cần hoàn thành trong một lần chơi. Thua hoặc rút lui bắt đầu lại từ giai đoạn I, không trừ tài nguyên. Chỉ thắng cả ba mới nhận thưởng; chưa có thưởng rương cho giai đoạn lẻ. Có thể chơi lại miễn phí, không giới hạn lượt hoặc cần kết nối mạng.

| Độ khó | Cấp gợi ý | Rương bảo đảm | Tinh hoa boss | Vàng |
| --- | --- | --- | --- | --- |
| Khám phá | 10+ | 1 trang bị SSR | 4 | 350 |
| Tinh anh | 25+ | 1 trang bị UR | 8 | 650 |
| Ác mộng | 45+ | 1 trang bị LR | 14 | 1.000 |

Thắng mức trước mở mức kế tiếp. Rương sinh một món thường ở bậc đã ghi, thuộc tính/phẩm chất ngẫu nhiên theo hệ trang bị hiện có; không có bộ rèn hoặc trấn phái trong rương này. Kho đủ 120 món tự đổi món mới thành bụi rèn và vẫn nhận vàng/Tinh hoa. Thưởng được cộng/lưu trước hoạt cảnh, không cộng lại khi mở/đóng hoặc tải lại rương. Tinh hoa dùng chung với Săn boss để tiến hóa đồ. Kết quả ghi số vòng, tướng còn trụ, sát thương, hồi máu và khiên từng đội; kỷ lục theo **tổng số vòng thấp nhất của ba trận**, riêng cho từng độ khó.

Bản lưu **v16 → v17** thêm đội/kỷ lục đột kích trống và trường chế độ trung tính cho chuyến đang dở. Giữ khóa `thap-vo-tan-v1`, chỉ số, đồ, tài nguyên, RNG và tiến trình cũ; không cộng quà hồi tố. **486/486 bài kiểm tra**, **59 module** đạt cú pháp. Kiểm tra Node/VM/Three.js, 720 mô phỏng cân bằng với tướng R/SR, bản lưu cũ và tài sản APK. Chưa xác minh trực quan CSS/WebGL, cảm ứng hoặc chơi APK trên điện thoại thật. Chi tiết tại `artifacts/QA-1.22.0.md`.

## Trang bị cao cấp và tiến hóa — 1.21

Vào **Hội quán → Trang bị**, chọn anh hùng và một món đồ. Có đủ bảy bậc **R → SR → SSR → UR → LR → MR → EX**. R có 1 dòng phụ; SR/SSR có 2 dòng cơ bản. UR thêm 1 dòng đặc biệt, LR có 2, MR/EX có đủ 3 loại. Các dòng đặc biệt ngẫu nhiên gồm **chí mạng, hút máu và hồi năng lượng mỗi đòn thường**; nâng cấp tăng giá trị của chúng.

Mỗi anh hùng cộng tối đa **30% chí mạng, 20% hút máu và +25 năng lượng/đòn thường** từ đồ. Hút máu tính trên HP thực gây ra bởi đòn đánh/kỹ năng trực tiếp, không tính sát thương vào khiên hoặc vượt máu. Hiệu ứng bộ đồ và trấn phái vẫn có tác dụng cùng các dòng này. Chỉ số và ngoại hình trang bị được chốt khi khởi hành; thay/nâng/tiến hóa giữa chuyến chỉ áp dụng từ chuyến mới.

**Săn boss** ở mức Khám phá/Tinh anh/Ác mộng nhận chắc chắn **1/2/4 Tinh hoa boss** mỗi lần thắng. Dùng chung Tinh hoa của cả bốn boss để tiến hóa món đang có. Ấn riêng của từng boss vẫn dùng rèn bộ và trấn phái SSR như trước. Thất bại, rời trận hoặc phòng thử không cấp Tinh hoa; mở/đóng rương không cộng thưởng lần nữa.

| Tiến hóa | Cấp đồ cần | Vàng | Bụi rèn | Tinh hoa |
| --- | --- | --- | --- | --- |
| R → SR | +2 | 180 | 5 | 2 |
| SR → SSR | +3 | 360 | 10 | 4 |
| SSR → UR | +4 | 700 | 20 | 8 |
| UR → LR | +5 | 1.200 | 35 | 14 |
| LR → MR | +6 | 2.000 | 55 | 24 |
| MR → EX | +7 | 3.200 | 85 | 40 |

Tiến hóa giữ ID, cấp nâng, phẩm chất, người mặc, bộ và chủ trấn phái; tăng dòng cũ, bổ sung dòng còn thiếu. Xem trước đúng chỉ số sẽ nhận; dòng mới gắn với món đồ nên đóng/mở lại không quay lại kết quả. Nâng cấp vẫn tối đa +10. Bảng so sánh **Trước và sau khi mặc** tính toàn bộ chỉ số anh hùng, cả mốc kích hoạt bộ đồ và giới hạn thuộc tính đặc biệt.

Boss tầng **15+** mở cơ hội rơi UR, **40+** có LR, **60+** có MR. EX nhận bằng tiến hóa. Tinh anh từ tầng 25+ có cơ hội UR và từ 50+ có LR; kho báu/trận thường từ 25+ có cơ hội UR. Boss luôn SR trở lên. Đồ mới khi kho đủ 120 món vẫn tự đổi thành bụi rèn theo bậc.

Mô hình vũ khí tăng đá trang trí và vòng sáng theo bậc, giữ trang phục và trấn phái. Vũ khí SSR trở lên thêm vệt đánh; bản gọn giới hạn 2 lớp, giảm chuyển động/tắt hiệu ứng bỏ vệt. Ngoại hình theo đúng món đang xem hoặc trang bị đã chốt trong sảnh, trận, bản đồ, rương và hoạt cảnh chiêu cuối. Rương hỗ trợ cả bảy bậc, tối đa 84 hạt và 16 tia.

Bản lưu **v15 → v16**, cùng khóa `thap-vo-tan-v1`; không đổi đồ hoặc cấp và tài nguyên cũ. Chuyến đang dở nhận snapshot thuộc tính trung tính, không tính lại sức mạnh bằng đồ ở hội quán. Trận săn đã nhận quà trước cập nhật không được cấp bù Tinh hoa. Đã đạt **461/461 bài kiểm tra**, kiểm tra cú pháp **57 module** và đối chiếu **68 tài sản APK**. Bản lưu v2 đã lưu từ 1.1 cũng được kiểm tra nâng lên v16, giữ nguồn nguyên vẹn. Chưa xem trực quan CSS/WebGL hoặc thử điện thoại thật; xem `artifacts/QA-1.21.0.md`.

## Đủ 20 chiêu cuối 3D — 1.20

Thêm 12 storyboard, nâng tổng số chiêu cuối riêng từ 8 lên **20/20 anh hùng**:

| Anh hùng | Màn tung chiêu mới |
| --- | --- |
| Kira | Hai bóng sát thủ áp sát và chém chéo song đao |
| Bryn | Lồng tinh thể băng trồi lên quanh mục tiêu, ấn tuyết phía trên |
| Raiden | Sét giáng theo đường gấp khúc, kiếm quang bổ xuống |
| Seraph | Thánh ấn có cánh, nốt nhạc và cột sáng trên đồng đội |
| Thorne | Rễ cây uốn lên thành vòng hộ vệ quanh từng đồng đội |
| Astra | Vòng sao mở trên cao rồi thả mưa thiên thạch |
| Nyx | Mặt trời tối và vương miện, nhát chém cùng dòng hút máu |
| Kael | Đại kiếm lửa, hai quạt lông phượng và vệt chém diện rộng |
| Eira | Dải cực quang phía trên, suối băng và cột hồi phục |
| Veyron | Thương sét giáng trên từng địch và vòng điện xoay |
| Solis | Thái dương nhiều tia, quỹ đạo nhật quang và cột lửa |
| Selene | Trăng máu, hai lưỡi liềm bay và các dải hút sinh lực |

Mỗi tướng mới có động tác thân người/tay cầm vũ khí riêng. Mô hình giữ ngoại hình và trấn phái hiện có. R/SR/SSR/UR/LR/MR/EX thêm lần lượt **0/1/2/3/4/5/6 lớp vòng sáng**, cùng **6/8/10/12/14/16/18 hạt** ở lớp hào quang; bản gọn dùng **3/4/5/6/7/8/9 hạt**. Các đạo cụ và hiệu ứng riêng của tướng nằm ngoài số hạt này. Camera tính cả nhân vật, vũ khí, phép và vòng quỹ đạo, bao gồm thiên môn/vòng phép MR/EX cũ trên màn hình hẹp.

Mở hồ sơ bất kỳ anh hùng nào → **Xem chiêu cuối 3D**, kể cả chưa sở hữu. Các nút **Bỏ qua**, Quay lại Android, tùy chọn hoạt cảnh, tốc độ **2×** và **Rút gọn chiêu khi Auto** tiếp tục hoạt động. Khi Auto rút gọn, 12 chiêu mới có phiên bản trong sân đấu, dùng vị trí đồng đội/địch thực; các vật thể bay đến mục tiêu đúng nhịp va chạm. Tắt hiệu ứng hoặc bật giảm chuyển động bỏ qua trình chiếu đầy đủ và giữ phản hồi ngắn.

Giữ bản lưu **v15** và khóa `thap-vo-tan-v1`, không cần migration. Engine, dữ liệu anh hùng/gacha và tài nguyên giữ nguyên byte so với APK 1.19. Đạt **432/432 bài kiểm tra**, **57 module** hợp lệ cú pháp; chưa vẽ CSS/WebGL hoặc thử trên điện thoại thật. Chi tiết tại `artifacts/QA-1.20.0.md`.

## Chiến thắng, rương và MVP 1.19

Sau trận thắng, boss đổ xuống và camera chuyển về đội hình ăn mừng. Tướng MVP đứng giữa; tướng còn gục nghỉ tại chỗ. Trang phục và trấn phái theo ngoại hình đang dùng. Chạm **Mở rương** sau boss hoặc **Xem chiến lợi phẩm** sau trận thường, rồi **Tiếp tục** để nhận lựa chọn cổ vật/chúc phúc hoặc về kết quả/hội thoại của chế độ đó. **Bỏ qua · Tiếp tục** và nút Quay lại Android bỏ toàn bộ phần trình diễn ngay.

Phần thưởng đã được cộng và lưu trước khi mở màn thắng. Rương chỉ trình bày chiến lợi phẩm: không có giao dịch nhận quà lần hai. Tắt app/mở lại giữ bước đang xem, kể cả đã mở rương hoặc đã tiếp tục. Săn boss ghi đúng vàng/ấn săn; phó bản có lõi nguyên tố thực đã nhận; phòng thử không cho tài nguyên. Quà chiến dịch lần đầu vẫn nhận riêng tại Chiến dịch. Kho đầy hiển thị món đã rơi và số bụi rèn đã tự chuyển.

Trang bị R/SR/SSR lần lượt có 1/2/3 vòng sáng, thêm hạt và tia sáng ở bậc cao; mô hình vật phẩm theo loại vũ khí/giáp/trang sức. Đây là ba bậc trang bị của bản 1.19; bản 1.21 mở rộng thành bảy bậc. Tốc độ 2× rút ngắn hoạt cảnh; giảm hiệu ứng/chuyển động giữ tư thế tĩnh và rương mở sẵn. Dùng chung renderer với các cảnh khác; không có WebGL vẫn có hình dự phòng và nút tiếp tục.

Bảng **MVP** ghi sát thương thực trừ máu, hồi máu thực nhận và lượng khiên tạo ra. Không tính sát thương vượt máu, sát thương vào khiên địch hoặc hồi máu dư vào hai cột đầu. Chén suối nguồn chuyển hồi dư thành khiên được ghi vào cột tạo khiên. Combo ghi riêng cho hai tướng, thiêu đốt theo nguồn tạo sức đốt mạnh nhất còn hiệu lực; DOT của combo chia theo sức đánh đóng góp. Linh thú và hiệu ứng chung có dòng riêng. MVP là tướng có tổng ba cột cao nhất, hòa điểm ưu tiên thứ tự đội hình. Hồi phục sau thắng/nghỉ chân không tăng thống kê trận. Màn kết quả chuyến đi có tổng đóng góp cả hành trình.

Bản lưu **v14 → v15**, cùng khóa `thap-vo-tan-v1`. Chuyến đang dở giữ nguyên chỉ số, RNG, kinh tế và phần thưởng, bắt đầu ghi thống kê từ lúc cập nhật và có chú thích thiếu dữ liệu trước đó. Không phát lại màn thắng cũ. Chuyến mới ghi đầy đủ từ đầu. Đã đạt 420/420 bài kiểm tra; 60 kịch bản với 1.407 trạng thái hành động khớp engine APK 1.18 về trận và tài nguyên. Chưa xác minh trực quan CSS/WebGL hoặc chơi trên điện thoại thật. Chi tiết tại `artifacts/QA-1.19.0.md`.

## Bản đồ tháp chia nhánh 1.18

Bắt đầu **Hành trình mới** trong Tháp vô tận để mở bản đồ 3D. Mỗi chặng gồm 5 tầng: bốn tầng có ba đảo và một cổng boss ở tầng cuối. Các đảo gồm chiến đấu, tinh anh, nghỉ chân, kho báu và sự kiện. Chạm một đảo hoặc tên đảo để xem rủi ro và phần thưởng; chạm **Đi đến tầng** để chốt lối đi.

Tầng đầu chặng có ba lối; từ tầng sau, chỉ hai đảo nối bằng cầu từ đảo vừa hoàn thành được mở. Mỗi nhánh luôn có một trận thường để tiếp tục. Cổng boss bắt buộc ở tầng 5/10/15…; thắng, nhận cổ vật/chúc phúc rồi mở chặng mới. Đền nghỉ hồi 35% máu và hồi sinh đồng đội theo luật tháp hiện có. Phần xem trước ghi đúng vàng/vé của kho báu, quà boss, máu từng tướng, tầng đã đi và những đảo khác nhánh.

Đội hình 3D đứng ở đảo đã chọn gần nhất; khi đi tiếp, đội di chuyển theo cầu tới đảo mới. Trang phục và trấn phái theo ngoại hình/tải trang bị đang dùng. Di chuyển 760 ms ở 1×, 380 ms ở 2×; đưa game ra nền kết thúc trình diễn. Tắt hiệu ứng hoặc bật giảm chuyển động thì chuyển vị trí ngay. Nếu bảng chi tiết nằm ngoài bản đồ trên điện thoại, game đưa bản đồ vào tầm nhìn để thấy đội di chuyển.

Kết quả lối đi và phần thưởng được tính, lưu **trước** chuyển động. Chạm liên tiếp bị chặn trong lúc di chuyển. Đóng app hoặc hủy trình diễn vẫn trở về đúng trận, chúc phúc, sự kiện hoặc tầng kế tiếp đã lưu; không nhận quà lần hai. Bản đồ dùng seed riêng và lưu đường đã chọn trong chặng; xem trước không tiêu RNG chiến đấu/chiến lợi phẩm. Đảo nổi, cầu và mô hình dùng chung renderer hiện có; đá/cầu lặp dùng instancing, tài nguyên riêng giải phóng khi đổi cảnh. WebGL không khả dụng vẫn có sơ đồ SVG và nút chọn đường.

Bản lưu **v13 → v14**, cùng khóa `thap-vo-tan-v1`. Chuyến bắt đầu từ bản cũ giữ lối đi dạng thẻ đến hết chuyến; bắt đầu chuyến mới để dùng bản đồ. Chiến dịch, phó bản, săn boss, thử thách tuần và phòng thử giữ hệ thống phòng hiện có. Luật đánh, tỉ lệ gacha và phần thưởng từng loại phòng giữ nguyên.

Đã kiểm tra luật, lưu/khôi phục, handler ứng dụng, camera/hình học Three.js và fallback với DOM/renderer giả. Chưa xác minh trực quan CSS/WebGL, cảm ứng hoặc hiệu năng trên điện thoại thật. Chi tiết tại `artifacts/QA-1.18.0.md`.

## Chiêu cuối 3D 1.17

Bốn anh hùng khởi đầu có chiêu 3D riêng ngay khi dùng kỹ năng ở 100 năng lượng:

| Anh hùng | Hoạt ảnh |
| --- | --- |
| Rook | Hạ khiên, dựng ba phiến thành lũy và ấn bảo hộ đồng đội |
| Aerin | Bật lên kéo cung, gọi mưa tên rơi vào mục tiêu |
| Lumi | Mở cánh ánh sáng, gọi hào quang và cột sáng hồi máu |
| Ember | Gọi phượng hoàng có cánh/đuôi bay theo mục tiêu, để lại vệt lửa |

Mô hình, vũ khí trấn phái và màu phép theo trang phục đang mặc. Mở **Xem chiêu cuối 3D** trong hồ sơ, xem hiệu ứng anh hùng hoặc tủ trang phục để xem miễn phí. Trong tủ, hoạt cảnh dùng bộ đang xem, kể cả bộ còn khóa; không mở khóa hoặc mặc bộ đó. Nguyên bản cũng xem được. Bốn chiêu MR/EX trước vẫn có sẵn.

Chạm **Bỏ qua**, Escape hoặc Quay lại Android để trở về trận. Tốc độ **2×** rút ngắn hoạt cảnh và hiệu ứng trong sân đấu. **Cài đặt → Hoạt cảnh kỹ năng 3D** bật/tắt hoạt cảnh trong trận; **Rút gọn chiêu khi Auto** mặc định bật. Auto rút gọn giữ thành lũy, mưa tên, cột sáng và phượng hoàng ngay trên sân đấu; tắt tùy chọn để Auto xem đầy đủ. Hai tùy chọn hoạt cảnh lưu riêng trên thiết bị, giữ qua mở lại app; không nằm trong JSON tài khoản.

Giảm hiệu ứng hoặc chế độ giảm chuyển động bỏ qua hoạt cảnh đầy đủ, kể cả xem trước, và giữ phản hồi chiến đấu ngắn. Tắt riêng **Hoạt cảnh kỹ năng 3D** vẫn cho phép xem trước nếu hiệu ứng đang bật. Đưa app ra nền, bỏ qua hoặc mất ngữ cảnh WebGL kết thúc trình chiếu và giải phóng cảnh. Kỹ năng/kết quả được tính và lưu một lần trước trình chiếu; không tiêu thêm năng lượng, nhân đôi sát thương hay phần thưởng khi bỏ qua.

Bản này giữ nguyên **v13** và khóa lưu `thap-vo-tan-v1`. Luật kỹ năng, chỉ số, gacha, mở khóa trang phục và tiến trình cũ giữ nguyên. Chưa xác minh bố cục CSS/WebGL và cảm ứng/độ mượt trên điện thoại thật; chi tiết tại `artifacts/QA-1.17.0.md`.

## Trang phục 3D 1.16

Mở **Trang phục** ở sảnh hoặc **Anh hùng → Tủ trang phục**. Mỗi bộ có mẫu giáp/vũ khí và đồ trang trí riêng, đồng thời giữ nguyên chỉ số anh hùng:

| Trang phục | Mở khóa miễn phí |
| --- | --- |
| Rook Vệ thần | Kỷ lục vượt tầng 5 |
| Aerin Nguyệt ảnh | Kỷ lục vượt tầng 10 |
| Lumi Bình minh | Thắng Cự nhân cổ đại 3 lần trong Săn boss |
| Ember Phượng hoàng | Thắng Kỵ sĩ tro tàn 3 lần trong Săn boss |

Tiến trình cũ được tính ngay. Săn boss ở mọi mức khó đều cộng một chiến thắng; phòng thử không tính. Chạm bộ bất kỳ để xem trước, kể cả bộ đang khóa; kéo nhân vật hoặc dùng nút xoay. Chọn **Mặc trang phục** khi đã mở, hoặc **Nguyên bản → Mặc trang phục** để đổi lại. Đổi đồ miễn phí, lưu tự động và có trong JSON xuất/nhập.

Có thể đổi trang phục khi đang leo tháp hoặc đánh boss. Ngoại hình là lựa chọn của tài khoản, áp dụng ở sảnh và trận khi trở lại; không sửa bản chốt đội hình, máu/năng lượng, lượt đã dùng, RNG hoặc tài nguyên. Đội lưu nhanh vẫn lưu đội hình/linh thú theo chức năng hiện có. Giảm hiệu ứng hoặc giảm chuyển động dừng cánh, vòng và hạt trang trí. Hình SVG dự phòng cũng có màu và dáng trang phục.

Bản lưu v12 chuyển sang **v13** cùng khóa `thap-vo-tan-v1`, chỉ thêm lựa chọn trang phục nguyên bản. Chuyến đang dở giữ nguyên. Chưa xác minh trực quan CSS/WebGL, cảm ứng và hiệu năng trên điện thoại thật cho 1.16; xem `artifacts/QA-1.16.0.md`.

## Đội hình chiến thuật 1.15

Mở **Anh hùng → Đội hình chiến thuật**, chọn **1 trước–2 sau** hoặc **2 trước–1 sau**. Nút **Đổi với** đổi chỗ hai tướng khác hàng; mở chi tiết anh hùng để chọn vị trí cụ thể. Đặt hộ vệ ra trước và pháp sư/trị liệu ở sau. Bố trí không tốn tài nguyên và được lưu cùng ba ô đội hình nhanh, linh thú và JSON xuất/nhập.

Đòn đơn thường ưu tiên người còn sống ở hàng trước. Khi còn ít nhất một tướng phía trước, hàng sau giảm **15% sát thương trực tiếp của địch**, áp dụng trước khi trừ khiên. Nếu tuyến đầu gục, che chắn mất ngay, kể cả giữa một đòn đánh toàn đội; hồi sinh tuyến đầu khôi phục che chắn. Hàng trước không nhận mức giảm này. Vị trí không tăng sát thương hoặc năng lượng của anh hùng.

**Xuyên hàng** ưu tiên hàng sau và bỏ qua che chắn: Bóng hầu khi có ý định xuyên hàng, chiêu riêng của Hỏa Long và Hút lửa của Kỵ sĩ tro tàn. Không còn người hàng sau thì đòn này đánh tuyến trước. Ý định địch, bảng báo chiêu boss và vòng báo 3D dùng cùng cách chọn mục tiêu với đòn thật. Giáp tay, thiên phú chống chịu, khiên, hút máu và phản đòn tiếp tục theo luật hiện có.

Sân đấu 3D và giao diện dự phòng thể hiện hai hàng; thẻ tướng ghi Trước/Sau và che chắn. Bố trí chốt khi khởi hành, giữ nguyên đến hết chuyến ở mọi chế độ. Chuyến cũ từ v11 giữ cách chọn mục tiêu, sát thương và vị trí phẳng cũ đến khi kết thúc; bắt đầu chuyến mới để dùng chiến thuật hàng. Phòng thử có lựa chọn bố trí riêng, không sửa chuyến thật.

## Combo liên kết 1.14

Trong trận, đòn thường của anh hùng tích **14 điểm**, kỹ năng tích **22 điểm** vào thanh chung, tối đa **100**. Mỗi hành động chỉ tích một lần, kể cả đánh diện rộng hoặc hồi máu. Linh thú, lượt địch, thiêu đốt và combo không tích điểm. Điểm giữ qua các tầng, đặt lại khi bắt đầu chuyến mới.

Đủ 100 điểm, chạm **Liên kết** trên thanh lệnh, chọn một trong ba cặp của đội rồi tung chiêu vào mục tiêu đang chọn. Cần hai tướng khác nhau còn sống; có thể dùng cả khi họ đã hành động. Combo tiêu hết thanh chung, **không tốn lượt hoặc năng lượng riêng**, tối đa một lần mỗi vòng. Một số combo còn tiếp năng lượng cho đội.

Cả bảy hệ đều phối hợp được: **21 cặp khác hệ và 7 cặp cùng hệ**. Bão lửa đánh toàn bộ địch và thiêu đốt, Bão tuyết đóng băng, Sốc nhiệt dồn sát thương, Thánh thành hồi máu và tạo khiên. Bảng chọn hiển thị đúng cặp hiện tại, sức mạnh, hiệu ứng và lý do chưa dùng được. Hồi máu/khiên chỉ tác động lên đồng đội còn sống.

Combo áp dụng thiên phú đã chốt, chúc phúc, trang bị chung, chí mạng, khiên địch và bộ phận boss đang chọn. Combo không kích hoạt đặc tính sau kỹ năng thường, đồng hồ trả năng lượng hoặc hiệu ứng trấn phái sau kỹ năng. Hai tướng đóng góp riêng vào sát thương và hỗ trợ. Phá lõi bằng đòn đầu có thể tăng sát thương đòn thứ hai.

Auto dùng linh thú theo luật sẵn có rồi chọn combo khi đủ điểm, ưu tiên theo số địch, đồng đội bị thương và chiêu boss. Phòng thử bắt đầu với thanh đầy để thử ngay, không sửa tài khoản thật. Hiệu ứng 3D cho hai luồng nguyên tố hội tụ rồi đánh mục tiêu; tuân theo tốc độ 2×, mức hiệu ứng và giảm chuyển động. Đóng app, về sảnh hoặc xuất/nhập vẫn giữ điểm và giới hạn combo trong vòng.

## Sảnh và điều hướng 1.13

Khi không có chuyến đi, mở app vào sảnh. Bản lưu đang có chuyến mở thẳng màn đang chơi để tiếp tục đúng đoạn; trong trận nhấn mũi tên **Về sảnh** để tạm dừng Auto và giữ cả đội hình, máu, năng lượng, mục tiêu giáp và lượt đã dùng. **Tiếp tục hành trình** trở lại chính chuyến đó. Nhấn Quay lại Android từ một màn chính về sảnh; từ sảnh tiếp tục dùng hành vi thoát hiện có. Thoát phòng thử vẫn khôi phục tài khoản thật trước khi về sảnh.

Tài nguyên trên thanh đầu là số thật, rút gọn khi lớn; chạm vé mở triệu hồi, chạm tinh thạch mở túi đồ/hội quán. Huy hiệu tháp mở Cài đặt. Chấm báo nhiệm vụ và viễn chinh dựa trên phần thưởng thực sự có thể nhận. Không có cấp tài khoản, thể lực hay sự kiện đếm ngược giả.

Sảnh dùng chung một canvas sống với trận và trang xem trước nhân vật, cùng mức chất lượng 3D/30–60 FPS hiện có. Giảm hiệu ứng dừng chuyển động trang trí của sảnh; giảm chuyển động theo hệ thống giữ cảnh đứng yên. Đưa app ra nền dừng vẽ. Nếu WebGL không khả dụng, cảnh SVG và các nút vẫn có sẵn. Đợt đổi giao diện 1.13 giữ định dạng v10; bản 1.14 chuyển sang v11 để lưu liên kết và 1.15 dùng v12 để lưu bố trí hàng, cùng khóa lưu.

## Có thể chơi gì?

- Màn chiến thắng với đội ăn mừng 3D, rương chiến lợi phẩm theo bậc trang bị và bảng MVP mỗi trận/tổng hành trình; có bỏ qua và giữ thưởng khi đóng app.
- Sảnh game với ba anh hùng 3D, tháp, cổng phép và rừng cổ; chạm nhân vật hoặc bảng tên để xem chi tiết. Nút **Vào tháp** bắt đầu chuyến; nếu đang đi dở, đổi thành **Tiếp tục hành trình**. Thanh dưới gồm Sảnh/Anh hùng/Triệu hồi/Túi đồ/Nhiệm vụ. Nút Chế độ và biểu tượng hai bên sảnh mở đủ các hoạt động.
- Màn anh hùng có thẻ theo độ hiếm, ảnh lớn và đội hình lưu nhanh thu gọn; màn triệu hồi đặt vé và nút quay ngay sau cổng. Trong trận, thanh đánh/kỹ năng/kết thúc lượt cố định dưới màn hình; nút mũi tên trái trên cùng về sảnh và giữ nguyên trận.
- Thiên phú cho đủ 20 anh hùng, mỗi người có điểm riêng theo cấp. Ba nhánh, chín nút, mỗi nút năm bậc; tăng chỉ số, chí mạng, giảm sát thương, hồi máu/khiên hoặc tiếp năng lượng cho đội. Có điều kiện mở và phí đặt lại bằng vàng, tự lưu trong JSON.
- Tích liên kết để hai anh hùng phối hợp tung một trong 28 combo nguyên tố, không tốn lượt. Thử ngay với thanh đầy trong phòng thử hoặc bật Auto để tự chọn cặp.
- Chọn đầu, tay/cánh hoặc lõi của cả 11 boss bằng thẻ điều khiển hoặc chạm giáp trong sân đấu 3D. Phá đầu ngắt chiêu và bỏ một lượt, phá tay giảm 20% sức đánh, phá giáp lõi tăng 25% sát thương trực tiếp từ anh hùng. Có thanh độ bền, giáp văng khi vỡ và tự động chọn bộ phận khi bật Auto.
- Vòng cảnh báo dưới đồng đội và nhãn mục tiêu phản ánh chiêu kế tiếp của boss; rung khi phá giáp, chí mạng hoặc chịu đòn mạnh, có nút tắt trong Cài đặt.
- Chiến dịch **Biên niên bình minh**: năm chương, 15 ải, bản đồ theo chương, hội thoại trước/sau mỗi ải và năm boss cuối chương. Tiến trình mở tuần tự, có quà vượt lần đầu và chơi lại không giới hạn.
- Ba ô lưu nhanh đội hình gồm ba anh hùng và linh thú; đặt tên, ghi đè, áp dụng hoặc xóa riêng từng ô.
- Đồ họa 3D Thấp/Vừa/Cao, giới hạn 30/60 FPS, bật/tắt bóng và giảm hiệu ứng; tự lưu theo bản lưu tài khoản.
- 20 anh hùng, 7 độ hiếm R/SR/SSR/UR/LR/MR/EX, 7 nguyên tố, kỹ năng trị liệu, lá chắn, sát thương diện rộng, đóng băng, thiêu đốt và hút máu.
- Mô hình 3D chibi cho 20 anh hùng, 7 linh thú, 7 boss nguyên tố và 4 boss tháp. Kéo hoặc dùng hai nút mũi tên trong trang chi tiết để xoay nhân vật; có thể chạm mô hình trong trận để chọn anh hùng/mục tiêu. Hiệu ứng trang sức tăng theo độ hiếm.
- Bốn đấu trường **Rừng cổ → Hang băng → Dung nham → Thành trên mây** đổi mỗi 10 tầng, lặp lại sau 40 tầng. Có cây/rễ/rêu và lá rơi, tinh thể/tuyết, đá núi lửa/tàn lửa, đảo nổi/mây trôi. Phó bản Thổ/Ảnh dùng rừng, Băng dùng hang băng, Hỏa dùng dung nham, Phong/Quang/Lôi dùng thành trên mây.
- Cả 11 boss có hình dạng giai đoạn II riêng: giáp nứt, trang sách bay, lửa, lưỡi trăng, cành lá, cánh, tia mặt trời, giáp rồng, đuôi hồ ly, vương miện băng hoặc sấm. Khi boss chuyển sang giai đoạn II ở mức 50% máu trở xuống, xuất hiện tên hình dạng, hào quang và nền đổi sắc; vòng báo tụ lực phản ánh chiêu kế tiếp. Hình dạng theo trạng thái chiến đấu đã lưu, giữ nguyên sau khi boss hồi máu hoặc mở lại app. Giảm chuyển động giữ hình dạng đứng yên.
- Sáu kiểu động tác theo kiếm, song dao, cung, trượng, pháp cầu và khiên; vũ khí theo tay khi chém/bắn/niệm phép. Cung có mũi tên 3D bay tới đúng thời điểm va chạm. Chuyển động đánh và số sát thương được phát theo thứ tự, hỗ trợ tốc độ 2×.
- Đủ 20 chiêu cuối 3D riêng cho mọi anh hùng, tư thế vũ khí và hào quang theo bảy bậc hiếm. Có xem trước miễn phí, bỏ qua, tốc độ 2×, tùy chọn hoạt cảnh và rút gọn Auto; tuân theo giảm hiệu ứng/chuyển động.
- Kết quả chiến đấu được tính và lưu một lần trước hoạt ảnh. Không nhận thêm sát thương/phần thưởng khi bỏ qua cảnh, chạm liên tiếp hoặc chuyển app ra nền. Tự động chiến đấu chờ hoạt ảnh xong, dừng khi app ở nền rồi tiếp tục khi trở lại.
- Hiệu ứng tăng dần: bụi sao, vương miện, vòng phép, nhật luân, thiên dực và tinh vân nhiều màu. Cổng triệu hồi, khung thẻ, hình nhân vật và hoạt ảnh kỹ năng dùng màu riêng theo bậc. Hỗ trợ giảm chuyển động theo cài đặt hệ thống.
- Trang Triệu hồi cho xem trước hiệu ứng cả bảy bậc mà không tốn vé; bộ lọc và chi tiết anh hùng hỗ trợ đầy đủ bậc mới.
- Đội hình 3 người; chiến đấu theo lượt với mục tiêu địch hiển thị trước, năng lượng và kỹ năng chủ động.
- Tự động chiến đấu, tốc độ 1×/2×, âm thanh hiệu ứng có thể tắt.
- Hành trình tháp mới có bản đồ chia nhánh 3D theo chặng 5 tầng, cầu nối giữa các đảo chiến đấu/tinh anh/nghỉ chân/kho báu/sự kiện, xem trước boss và lưu đường đã chọn. Chuyến cũ giữ lối đi dạng thẻ đến hết chuyến.
- Boss bắt buộc mỗi 5 tầng, luân phiên bốn loại với hai giai đoạn và chiêu kế tiếp được báo trước. Độ khó tăng theo tầng; trận quá dài có cơ chế tăng sát thương địch.
- 14 chúc phúc có thể cộng dồn trong chuyến đi. 4 chủ đề vùng đất luân phiên theo mỗi 10 tầng; tầng tháp tiếp tục tăng.
- Nâng cấp anh hùng đến cấp 100 và 3 ấn ký vĩnh viễn, mỗi ấn có 25 cấp. Nâng cấp có hiệu lực từ chuyến đi mới.
- Nhiệm vụ ngày theo đồng hồ thiết bị và phần thưởng cột mốc từ tầng 3 đến 100.
- Tự động lưu tài nguyên, đội hình, bộ đếm bảo đảm gacha và cả trận chiến đang diễn ra. Xuất/nhập JSON để giữ hoặc chuyển bản lưu.
- Kho 120 trang bị với 3 vị trí cho mỗi anh hùng: vũ khí, giáp, phụ kiện. Đồ R/SR/SSR có phẩm chất 85–115% và thuộc tính phụ ngẫu nhiên; nâng tới +10 bằng vàng và bụi rèn, hoặc phân rã đồ thừa. Đồ đang mặc phải tháo trước khi phân rã.
- Bốn bộ Thành trì/Tro tàn/Huyết nguyệt/Gương hộ vệ, hiệu ứng ở 2 và 3 món; 12 món bộ và 20 trấn phái chế tác SSR, phẩm chất 100%. Trấn phái dành riêng cho từng anh hùng, tăng 12% sức mạnh kỹ năng, thêm hiệu ứng sau kỹ năng và trang sức/vật thể sáng trên vũ khí 3D.
- Bốn chuyến săn boss độc lập, ba mức khó mở lần lượt; mỗi chiến thắng luôn cho 1/2/3 ấn boss để rèn đúng món đã chọn. Theo dõi công thức bằng thanh tiến độ, không có lượt rơi hụt và không dùng thể lực.
- Phòng thử cho dùng đủ 20 anh hùng kể cả chưa sở hữu, cùng cấp 1/20/50, thử bộ đồ/trấn phái và bốn boss. Có số sát thương, hồi phục, HP bị mất và khiên đã đỡ. Không tiêu hay trao tài nguyên thật; chuyến đi đang dở được giữ nguyên khi thoát hoặc đóng app.
- Viễn chinh cho tướng ngoài đội chính: chuyến 15 phút/2 giờ/8 giờ nhận vàng, bụi rèn và bốn loại ấn boss. Tướng đúng nguyên tố thêm 25% vàng/bụi. Ba ô mở ở tầng 0/10/25, có thu hồi sớm, nhận từng chuyến hoặc nhận tất cả; tiến độ tiếp tục offline.
- 8 cổ vật độc nhất có thể kết hợp với kỹ năng và chúc phúc: vỡ khiên phản đòn, hồi dư thành khiên, hạ địch tiếp năng lượng, thiêu đốt phát nổ, hoàn năng lượng kỹ năng, hồi sinh một lần, dồn sát thương lên địch đóng băng và hồi phục đầu trận.
- Thức tỉnh mỗi anh hùng tới 5★ bằng bản trùng; mỗi người có một đặc tính kỹ năng riêng. Bản trùng đã nhận ở các phiên bản trước vẫn dùng được.
- 5 cộng hưởng đội hình: 2 Hỏa, 2 Quang, 2 Thổ, 2 Ảnh hoặc 3 nguyên tố khác nhau.
- 3 thử thách có kỷ lục và quà tuần riêng: đội chỉ dùng R, không hồi sinh, chuỗi bốn boss. Có thể chơi lại miễn phí.
- 7 phó bản Thổ/Phong/Quang/Hỏa/Ảnh/Băng/Lôi, mỗi ải gồm trận thường → tinh anh → boss riêng, với 3 mức khó mở lần lượt. Anh hùng đúng hệ tăng 25% sát thương trực tiếp; linh thú đúng hệ tăng 25% sức mạnh hỗ trợ.
- 7 linh thú với kỹ năng khiên, năng lượng, hồi máu, thiêu đốt diện rộng, hút máu, đóng băng và sét đơn mục tiêu. Kết ước bằng lõi nguyên tố, nâng tới cấp 20 bằng lõi và vàng. Mộc Linh miễn phí cho cả người mới và bản lưu cũ.

Tài khoản mới có 800 vàng, 15 vé, 4 anh hùng (Rook, Aerin, Lumi, Ember), 3 trang bị R và 8 bụi rèn. Tài nguyên và trang bị nhặt trong chuyến đi được giữ lại kể cả khi thất bại. Chúc phúc và cổ vật kết thúc cùng chuyến đi.

## Cây thiên phú anh hùng

Mở **Anh hùng → chọn tướng đã sở hữu → Cây thiên phú**. Mỗi cấp từ cấp 2 nhận **1 điểm**, tối đa 99 điểm ở cấp 100. Điểm tính theo cấp của từng người, không dùng chung và không cần nhận thủ công. Anh hùng từ bản cũ nhận đủ điểm theo cấp hiện có; bản trùng và thức tỉnh không tạo thêm điểm. Nâng một bậc thiên phú chỉ tiêu điểm, không tiêu vàng.

Mỗi nhánh có ba nút nối tiếp, mỗi nút tối đa **5 bậc**. Nút đầu yêu cầu cấp 2, tốn **1 điểm/bậc**; nút hai yêu cầu cấp 10 và nút trước ít nhất 3/5, tốn **3 điểm/bậc**; nút cuối yêu cầu cấp 20 và nút trước ít nhất 3/5, tốn **5 điểm/bậc**. Có thể chia điểm giữa nhiều nhánh. Một nhánh tối đa tốn 45 điểm; cả cây cần 135 điểm, nên 99 điểm ở cấp tối đa vẫn cần chọn hướng.

| Nhánh | Nút đầu | Nút hai | Nút cuối |
| --- | --- | --- | --- |
| Sát thương | Vũ lực: +2% ATK/bậc | Khai phá: +2% sát thương trực tiếp/bậc | Tâm điểm: +2 điểm % chí mạng/bậc |
| Chống chịu | Sinh lực: +3% HP tối đa/bậc | Thiết giáp: +1 DEF/bậc | Bất khuất: giảm 2% sát thương đòn địch/bậc |
| Hỗ trợ | Khởi nhịp: +3 năng lượng đầu chuyến/bậc | Nuôi dưỡng: +4% hồi máu và khiên tạo ra/bậc | Tiếp lửa: dùng kỹ năng cho đồng đội khác còn sống +2 năng lượng/bậc |

ATK/HP nhân sau phần trang bị và bộ đồ; DEF cộng thẳng. Khai phá áp dụng sát thương trực tiếp trước phòng thủ, không nhân lại thiêu đốt, phản đòn, đánh bồi hoặc linh thú; tăng ATK vẫn ảnh hưởng những hiệu ứng dùng ATK như trước. Chí mạng vẫn giới hạn 80% khi cộng chúc phúc. Bất khuất áp dụng sau phòng thủ/chúc phúc giảm đòn và trước khi khiên hấp thụ; giữ mức sát thương tối thiểu như cũ.

Khởi nhịp tăng năng lượng lúc bắt đầu chuyến, không nhận lại khi mở app hay qua tầng; tăng năng lượng đầu trận thông thường vẫn tính riêng và tổng không vượt 100. Nuôi dưỡng dùng thiên phú của người tạo hồi máu/khiên, gồm kỹ năng, thức tỉnh, hút máu và trang bị; không tăng hỗ trợ của linh thú, đền nghỉ hoặc cổ vật tự kích hoạt. Hồi dư của Chén suối nguồn được chuyển thành khiên từ lượng hồi thực tế, không nhân thiên phú lần hai. Tiếp lửa kích hoạt một lần sau mỗi kỹ năng, không cho người thi triển, không cho đồng đội đã gục, và không kích hoạt bởi đòn thường/linh thú.

Chọn **Đặt lại**, xem phí rồi xác nhận để hoàn toàn bộ điểm đã dùng. Phí **150 vàng + 10 vàng × số điểm hoàn**; không có điểm đã dùng thì không thu phí. Không đủ vàng hoặc chạm lại sau khi đã hoàn sẽ không trừ thêm. Hủy giữ nguyên phân bổ.

Thiên phú được chốt cùng cấp/trang bị khi bắt đầu tháp, săn boss, phó bản, chiến dịch hoặc thử thách. Học thêm, lên cấp hay đặt lại giữa chuyến chỉ áp dụng từ chuyến tiếp theo; giữ nguyên HP, năng lượng, lượt và thiên phú chuyến đang chơi. Bản lưu cũ đang trong chuyến tiếp tục không có thiên phú cho đến khi khởi hành lại. Xuất/nhập JSON giữ cả phân bổ tài khoản và thiên phú đã chốt của chuyến. Phòng thử miễn phí dùng cấu hình không thiên phú, không sao chép hoặc sửa cây của tài khoản thật.

## Phá giáp boss và cảnh báo đòn

Trong trận boss mới, chạm một trong ba thẻ **Đầu / Tay, cánh / Lõi**, hoặc chạm trực tiếp miếng giáp trên mô hình 3D, rồi chọn anh hùng đánh thường hoặc dùng kỹ năng. Tên giáp riêng theo từng boss. Độ bền ban đầu lần lượt bằng 22% / 28% / 32% HP tối đa của boss, làm tròn thành số nguyên.

| Bộ phận bị phá | Hiệu lực đến hết trận |
| --- | --- |
| Đầu | Hủy chiêu đang chuẩn bị; boss bỏ lượt hành động kế tiếp một lần. |
| Tay / cánh | Giảm 20% sức đánh của boss trước khi tính phòng thủ; không giảm sức đánh lính triệu hồi. |
| Giáp lõi | Các đòn trực tiếp tiếp theo của anh hùng gây thêm 25% sát thương sau phòng thủ. |

Đòn vẫn trừ HP boss như bình thường, đồng thời trừ độ bền của bộ phận đã chọn bằng lượng HP thực sự gây ra; không tính thêm một lần sát thương HP. Khiên đỡ trước độ bền. Đòn đánh vào lính, hồi máu, thiêu đốt, linh thú, phản đòn và đánh bồi trấn phái không phá giáp. Kỹ năng diện rộng chỉ làm hao một bộ phận đã chọn khi mục tiêu chính là boss. Có thể tiếp tục nhắm bộ phận đã vỡ. Đòn phá đầu kết liễu boss không để lại lượt choáng chờ.

Giáp văng và biến mất khi vỡ, vòng sáng chỉ vị trí đang chọn; ở chế độ giảm chuyển động/hiệu ứng, giáp đổi trạng thái ngay. Vòng đỏ đánh dấu đồng đội sắp nhận đòn, vòng vàng báo tụ lực, đóng băng hoặc đã ngắt chiêu sẽ ẩn vòng. Cảnh báo dựa vào mục tiêu thật của chiêu kế tiếp, không đảm bảo đòn vẫn diễn ra nếu bạn ngắt chiêu/hạ boss trước đó. Giao diện thẻ và nhãn vẫn dùng được khi WebGL không khả dụng.

Auto ưu tiên đầu nếu còn nguyên và boss đang chuẩn bị chiêu nguy hiểm; những lúc khác phá lõi rồi tay rồi đầu. Tắt Auto để chọn bộ phận thủ công. Độ bền, bộ phận đang chọn và lượt choáng chờ được lưu cả khi đóng/mở app hoặc xuất/nhập JSON. Trận boss đang dở từ bản cũ giữ cơ chế cũ đến hết trận; trận boss mới có đủ bộ phận. Áp dụng cho tháp, săn boss, phó bản, chiến dịch, thử thách và phòng thử. Không có thêm tiền tệ hoặc phần thưởng phá giáp.

Mở **Cài đặt → Rung khi va chạm mạnh** để bật/tắt. Tùy chọn lưu riêng trên thiết bị bằng khóa `thap-vo-tan-haptics`, mặc định bật, không đi theo JSON bản lưu. Android dùng phản hồi hệ thống, tôn trọng cài đặt rung của máy và không yêu cầu thêm quyền. Chỉ rung khi phá giáp, chí mạng hoặc đòn địch làm mất ít nhất 20% HP tối đa của một anh hùng; có khoảng cách tối thiểu 120 ms và dừng khi app ẩn. Trình duyệt dùng `navigator.vibrate` nếu hỗ trợ; thiếu phần cứng/API không ảnh hưởng trận đấu.

## Chiến dịch Biên niên bình minh

Mở **Sảnh → Chiến dịch**, chọn chương rồi chạm một điểm trên bản đồ hoặc thẻ ải để chuẩn bị. Mỗi chương có ba ải mở lần lượt; mỗi ải có ba trận. Hai ải đầu đi qua trận thường → tinh anh → tinh anh; ải cuối gặp boss ở trận thứ ba. Sau hai trận đầu, chọn một chúc phúc. Đội hình, cấp, thức tỉnh, ấn ký, trang bị và linh thú của tài khoản đều có hiệu lực.

| Chương | Vùng đất | Boss cuối | Cấp đội gợi ý |
| --- | --- | --- | --- |
| Lời gọi dưới rễ cây | Rừng ký ức | Cự nhân cổ đại | 1–5 |
| Bức thư trong băng | Cung băng thất lạc | Nữ hoàng băng | 6–10 |
| Ngọn lửa trở về | Thung lũng tro đỏ | Kỵ sĩ tro tàn | 12–18 |
| Lời hứa bên kia mây | Quần đảo thiên không | Lôi Long | 20–25 |
| Bình minh không lặp lại | Đỉnh tháp nguyệt thực | Hộ thần mặt trăng | 28–35 |

Hội thoại có nút Tiếp tục/Bỏ qua. Đóng app ở bất kỳ câu nào sẽ giữ nguyên câu đang đọc. Khi thắng trận cuối, kết quả và tiến độ được lưu trước hội thoại kết thúc; đọc lại hoặc rời lúc đọc không trả thưởng lần nữa. Một thời điểm có một chuyến thật, dùng chung với tháp, săn boss, phó bản và thử thách.

Nhấn **Nhận quà** ở kết quả hoặc thẻ ải để lấy quà lần đầu; có thể nhận sau. Tổng quà của 15 ải là **10.350 vàng, 25 vé, 70 bụi rèn và 10 tinh thạch**, ngoài chiến lợi phẩm chiến đấu. Mỗi ải chỉ nhận quà lần đầu một lần. Chơi lại vẫn có vàng/trang bị/vé boss theo luật chiến đấu, không làm mất tiến độ các ải sau. Thua hoặc rời giữ chiến lợi phẩm đã kiếm nhưng chưa mở ải tiếp. Chiến dịch ghi tiến trình riêng; không tăng kỷ lục tháp, không trả ấn săn boss hoặc lõi phó bản.

Năm chương dùng lại bốn đấu trường 3D và các boss có sẵn, mỗi bản đồ chương có cảnh và địa danh riêng. Đây là tuyến truyện có kết thúc; tháp vô tận và các hoạt động khác tiếp tục sau chương cuối.

## Đội hình lưu nhanh và đồ họa

Mở **Anh hùng → Đội hình lưu nhanh** để mở bảng ba ô đội. Ba ô mặc định mang tên Leo tháp/Săn boss/Phó bản; sau khi lưu có thể sửa tên tối đa 24 ký tự. Lưu hoặc ghi đè ghi lại ba anh hùng, linh thú (kể cả không mang thú), bố trí hàng và chín ô trang bị hiện tại. Ghi đè/xóa cần xác nhận. Dùng đội mở bảng xem trước; chỉ xác nhận mới đổi cả đội, thú và các món hợp lệ. Món thiếu, đang thuộc tướng khác hoặc ô khóa được báo rõ và giữ món hiện tại. Cấp và chỉ số món dùng giá trị hiện tại. Đội cũ chưa lưu bộ đồ giữ đồ hiện tại cho đến khi lưu lại. Hoàn thành hoặc rời chuyến đang chơi trước khi áp dụng; tướng đang viễn chinh cần trở về và nhận quà/thu hồi trước.

Mở **Cài đặt → Đồ họa trên thiết bị**. Mặc định **Vừa, 30 FPS**, có bóng và hiệu ứng. Chọn chất lượng đặt lại bóng/hiệu ứng theo mức; có thể chỉnh riêng sau đó. Lựa chọn FPS được giữ khi đổi chất lượng.

| Chất lượng | Giới hạn tỉ lệ điểm ảnh | Bản đồ bóng | Giới hạn hiệu ứng chiến đấu |
| --- | ---: | ---: | ---: |
| Thấp | 1× | 256, mặc định tắt | 40, giảm còn 16 khi giảm hiệu ứng |
| Vừa | 1,35× | 512 | 96 |
| Cao | 2× | 1.024 | 160 |

Thấp dùng cảnh gọn, tắt khử răng cưa, bóng và hiệu ứng đầy đủ. Giảm hiệu ứng ẩn thời tiết/lá rơi, giảm hạt, dừng chuyển động trang trí và bỏ qua cảnh chiêu cuối tự động; xem trước hoạt cảnh cũng cần bật hiệu ứng. Giới hạn 30/60 FPS áp dụng cho vòng vẽ cảnh 3D; FPS thực tế phụ thuộc thiết bị. Thay tùy chọn dựng lại cảnh và giải phóng cảnh cũ, giữ nguyên HP, năng lượng, lượt và kết quả chiến đấu. Chế độ giảm chuyển động của hệ thống vẫn được tôn trọng. Tiến trình chiến dịch, ba ô đội hình và đồ họa đều có trong xuất/nhập JSON.

## Viễn chinh cho tướng dự bị

Mở **Sảnh → Viễn chinh**, hoặc thẻ Viễn chinh ở Anh hùng/Nhiệm vụ. Chọn ô trống, điểm đến và một anh hùng đã sở hữu ngoài đội chính. Người mới có Ember dự bị, có thể khởi hành ngay. Viễn chinh chạy song song với chuyến leo tháp/phó bản/săn boss.

| Điểm đến | Thời gian | Cần vượt tầng | Vàng cơ bản | Bụi rèn | Ấn bảo đảm | Hệ thưởng |
| --- | --- | ---: | ---: | ---: | --- | --- |
| Lối mòn sương | 15 phút | 0 | 60 | 1 | — | Phong |
| Mỏ đá cổ | 2 giờ | 3 | 320 | 5 | — | Thổ |
| Dấu chân cự nhân | 8 giờ | 5 | 1.000 | 12 | 2 Ấn địa chấn | Thổ |
| Thư viện thất lạc | 8 giờ | 5 | 1.000 | 12 | 2 Ấn ký ức | Quang |
| Miền tro tàn | 8 giờ | 5 | 1.000 | 12 | 2 Ấn tro lửa | Hỏa |
| Dưới vầng trăng | 8 giờ | 5 | 1.000 | 12 | 2 Ấn nguyệt sắc | Ảnh |

Tướng cùng hệ được thêm 25% vàng và bụi rèn, làm tròn xuống; số ấn giữ nguyên. Ví dụ Ember đi Miền tro tàn nhận **1.250 vàng, 15 bụi, 2 Ấn tro lửa**. Mọi bậc hiếm đều tham gia được; cấp, sao và trang bị không thay đổi thưởng. Giao diện cho xem số thực nhận trước khi khởi hành.

Ô 1 có ngay; ô 2 mở khi vượt tầng 10; ô 3 mở khi vượt tầng 25, tính theo kỷ lục tháp vô tận. Mỗi tướng chỉ đi một chuyến và chưa thể xếp vào đội chính, kể cả đã trở về nhưng chưa nhận thưởng. **Thu hồi tướng sớm** có bước xác nhận, trả tướng ngay và bỏ tiến độ, không cho thưởng. Khi đã hoàn tất, nhận thưởng để đưa tướng về. Phòng thử vẫn cho dùng tướng này trên bản sao riêng.

Thời gian dùng đồng hồ thiết bị và lưu mốc khởi hành/trở về. Đóng app không cần chạy nền hoặc Internet. Tiến độ đã quan sát/lưu không giảm khi lùi đồng hồ; game offline không xác minh giờ máy chủ. Mỗi lần cử chỉ nhận một lần, không tự lặp chuyến hoặc hết hạn thưởng khi vắng lâu. Đếm giờ cập nhật từng vị trí, không dựng lại trang/3D hoặc làm đóng hộp thoại. Chuyến hoàn tất được đánh dấu ở mục Anh hùng; có nút **Nhận tất cả**. Nếu tài nguyên đã chạm giới hạn bản lưu, giữ chuyến và thưởng cho đến khi dùng bớt tài nguyên. Xuất/nhập JSON giữ cả viễn chinh.

## Trang bị bộ, trấn phái và săn boss

Mở **Hội quán → Xưởng chế tác**. Chọn bộ đồ hoặc trấn phái của một anh hùng, nhấn **Đặt mục tiêu** để theo dõi nguyên liệu. Mỗi món bộ có ba vị trí vũ khí/giáp/phụ kiện; mỗi món chiếm một vị trí như đồ cũ. Trấn phái chiếm vị trí vũ khí, dùng được bởi đúng anh hùng và tính là một món của bộ ghi trên công thức.

| Bộ | 2 món | 3 món | Nguồn ấn |
| --- | --- | --- | --- |
| Thành trì | +12% HP tối đa | Sau kỹ năng, bản thân nhận khiên bằng 8% HP tối đa | Cự nhân cổ đại |
| Tro tàn | +10% ATK | Đánh thường/kỹ năng thiêu đốt 2 lượt, bằng 12% ATK/lượt | Kỵ sĩ tro tàn |
| Huyết nguyệt | +8% ATK | Hồi 8% sát thương trực tiếp đã gây ra | Hộ thần mặt trăng |
| Gương hộ vệ | +4 DEF | Phản 20% HP thực sự bị mất sau khi trừ khiên | Người gác thư viện |

| Loại công thức | Ấn đúng boss | Vàng | Bụi rèn |
| --- | ---: | ---: | ---: |
| Một món bộ SSR | 4 | 150 | 3 |
| Trấn phái SSR | 8 | 350 | 8 |

Đồ chế tác có phẩm chất 100%, hai thuộc tính phụ cố định và cấp +0; nâng tới +10 như đồ cũ. Trấn phái tăng 12% sức mạnh sát thương/hồi máu/khiên của kỹ năng, cộng thêm hiệu ứng riêng: Aerin hồi 15 năng lượng, Rook thêm khiên đội, Lumi tiếp năng lượng, Ember tăng thiêu đốt, Kira đánh bồi… Công thức hiển thị chính xác hiệu ứng của cả 20 anh hùng. Vũ khí có biến thể 3D theo loại vũ khí, màu/hoa văn riêng của từng người, theo tay trong động tác và xuất hiện trong cảnh chiêu cuối. Có thể xem và xoay mô hình trước khi rèn.

Phân rã đồ thừa ở **Trang bị** để lấy bụi rèn. Khi kho đủ 120 món, chế tác bị chặn và giữ nguyên nguyên liệu. Chỉ được giữ một trấn phái của mỗi anh hùng trong kho; có thể rèn lại sau khi phân rã. Mục tiêu tự xóa khi đã rèn xong. Chỉ số và hiệu ứng bộ/trấn phái được chốt khi khởi hành; thay đồ giữa chuyến áp dụng từ chuyến sau.

Mở **Tháp → Săn boss**, chọn một trong bốn boss rồi chọn mức khó:

| Mức | Ấn bảo đảm mỗi lần thắng | Vàng |
| --- | ---: | ---: |
| Khám phá | 1 | 90 |
| Tinh anh | 2 | 140 |
| Ác mộng | 3 | 220 |

Thắng mức trước mở mức tiếp theo, riêng cho từng boss. Mỗi chuyến săn là một trận với đầy đủ hai giai đoạn, có linh thú/cộng hưởng/trang bị. Bốn lần thắng Khám phá đủ ấn cho một món bộ; tám lần đủ cho trấn phái. Thua hoặc rời chuyến không cho ấn; không mất phí. Săn boss không tăng kỷ lục tầng, không cho vé/tinh thạch/đồ ngẫu nhiên/cổ vật; chiến thắng vẫn tính nhiệm vụ chiến đấu ngày. Một thời điểm có một chuyến thật; phòng thử có thể dùng khi chuyến thật đang dở.

## Phòng thử đội hình

Mở **Anh hùng → Phòng thử đội hình miễn phí** hoặc **Tháp → Phòng thử**. Chọn ba anh hùng trong toàn bộ bộ sưu tập, cấp 1/20/50, bộ đồ, có/không trấn phái, boss và mức khó. Ba anh hùng cùng cấp, 0★, không ấn ký/linh thú; cộng hưởng theo đội đã chọn. Bắt đầu với 100 năng lượng để thử kỹ năng ngay.

Bộ thử áp dụng ba món SSR +0 cho mỗi người; trấn phái thay vị trí vũ khí. Nếu trấn phái khác bộ đã chọn, nhân vật có hai món bộ giáp/phụ kiện và một món bộ trấn phái. Số liệu ghi lượng HP thực sự gây ra/hồi phục/bị mất và lượng sát thương khiên đã đỡ, gồm cả hiệu ứng hút máu/thiêu đốt/phản đòn. Thử lại giữ cấu hình và seed để so sánh.

Phòng thử chạy trên bản sao riêng trong RAM, không ghi vào khóa lưu thật và không cho xuất bản lưu thử. Thoát, điều hướng sang trang khác hoặc nhấn Quay lại Android để trở về tiến trình thật. Đóng app giữa bài thử bỏ bài thử và mở lại chuyến thật đã lưu. Không nhận quà hoặc sở hữu các anh hùng/trang bị thử trong tài khoản thật.

## Phó bản nguyên tố và linh thú

Mở **Tháp → Phó bản** để chọn 1 trong 7 nguyên tố. Mỗi chuyến đi vượt 3 phòng, nhận một chúc phúc sau hai trận đầu và kết thúc sau boss. Chọn đội trước khi vào; một thời điểm có một chuyến đi. Có thể chơi lại không giới hạn, không dùng thể lực. Kỷ lục phó bản tách riêng tháp và thử thách tuần.

| Mức khó | Lõi mỗi lần | Thêm lần đầu mỗi ngày | Thêm lần đầu chinh phục | Tổng lần đầu |
| --- | ---: | ---: | ---: | ---: |
| Khám phá | 4 | 8 | 8 | 20 |
| Tinh anh | 7 | 12 | 12 | 31 |
| Ác mộng | 10 | 16 | 16 | 42 |

Lõi tự cộng khi hạ boss cuối. Quà ngày riêng cho từng hệ/mức khó theo ngày thiết bị, chốt tại lúc khởi hành; lưu 14 ngày gần nhất. Vàng, vé và đồ chiến đấu vẫn được giữ nếu rời hoặc thua; lõi chỉ nhận khi hoàn thành 3 phòng. Boss cho 3 vé và đồ tối thiểu SR.

Mở **Anh hùng → Thú đồng hành**. Bảy thú: Mộc Linh (Thổ/khiên, miễn phí), Vũ Linh (Phong/năng lượng, 18 lõi), Tinh Hươu (Quang/hồi máu, 18), Hồng Vũ (Hỏa/thiêu đốt, 30), Nguyệt Hồ (Ảnh/hút máu, 30), Tuyết Miêu (Băng/đóng băng, 18), Lôi Long (Lôi/sét, 45). Thú dùng lõi đúng hệ; nâng từ cấp L tốn `2 + floor(L/3)` lõi và `70 + 35×L` vàng, tối đa cấp 20.

Chọn một thú trước chuyến đi. Trong trận, chạm kỹ năng thú để hỗ trợ, độc lập lượt và năng lượng anh hùng; sẵn sàng vòng 1 và hồi sau 3 vòng. Tự động chiến đấu cũng dùng thú khi phù hợp. Thú không hồi sinh người đã gục. Cấp và lựa chọn được chốt khi khởi hành; đổi/nâng giữa chuyến áp dụng từ chuyến sau. Thử thách tuần chỉ dùng đội anh hùng.

## Thức tỉnh và cộng hưởng

Mở **Anh hùng → chọn nhân vật → Thức tỉnh anh hùng**. Giao diện cho biết bản trùng còn lại, chi phí vàng, chỉ số trước/sau và các mốc kỹ năng. Không tiêu tinh thạch để thức tỉnh.

| Bậc mới | Bản trùng | Vàng | Mốc mở khóa |
| --- | ---: | ---: | --- |
| 1★ | 1 | 250 | Đặc tính riêng của anh hùng |
| 2★ | 1 | 500 | Tăng chỉ số |
| 3★ | 2 | 1.000 | Thêm 15% sức mạnh kỹ năng: sát thương, hồi máu, khiên |
| 4★ | 2 | 1.800 | Tăng chỉ số |
| 5★ | 3 | 3.000 | Đòn thường tạo thêm 15 năng lượng |

Mỗi sao tăng 6% HP và ATK trước trang bị, cộng thêm 1 DEF. Tổng chi phí 5★ là 9 bản trùng và 6.550 vàng. Ví dụ: Rook 1★ tự hồi 12% máu sau khi tạo khiên; Lumi 1★ tiếp 10 năng lượng cho cả đội sau hồi máu; Ember 1★ duy trì thiêu đốt 3 lượt. Cả 20 anh hùng có đặc tính riêng được mô tả trong màn thức tỉnh.

| Đội hình | Cộng hưởng |
| --- | --- |
| 2 Hỏa | Thiêu đốt tăng 35% sát thương |
| 2 Quang | Mọi nguồn hồi máu tăng 20% |
| 2 Thổ | Khiên đồng đội tạo ra tăng 25%; giới hạn 40% HP của Chén suối nguồn vẫn được giữ |
| 2 Ảnh | Đòn đánh/kỹ năng tăng 20% sát thương lên địch dưới 40% HP |
| 3 hệ khác nhau | Đòn đánh/kỹ năng tăng 8% sát thương; đầu trận thêm 10 năng lượng |

Đội hình hiển thị cộng hưởng và tiến độ của cả năm công thức. Thức tỉnh và cộng hưởng được chốt khi khởi hành, giữ hiệu lực kể cả khi đồng đội gục. Nâng sao trong chuyến đi áp dụng ở chuyến tiếp theo.

## Tháp thử thách tuần

Mở **Tháp → Thử thách tuần**. Mỗi lần chỉ có một chuyến đi, dùng chung bộ sưu tập và trang bị với tháp vô tận.

- **Huyền thoại bình dị:** chỉ dùng 3 anh hùng R, vượt 10 tầng. Rook, Ember và Lumi là đội hợp lệ ngay từ đầu. Nhận quà ở tầng 3, 5, 10.
- **Một mạng để đi xa:** vượt 10 tầng, không thể hồi sinh bằng bất kỳ nguồn nào, kể cả chúc phúc tăng sinh lực, đền nghỉ, kỹ năng và cổ vật. Đèn dẫn hồn không xuất hiện trong lựa chọn cổ vật. Nhận quà ở tầng 3, 5, 10.
- **Bốn người giữ tháp:** 4 chặng liên tiếp lần lượt gặp Cự nhân, Người gác thư viện, Kỵ sĩ tro tàn và Hộ thần mặt trăng. Nhận quà ở chặng 1, 2, 4. Ba boss đầu cho cổ vật rồi chúc phúc; thắng boss cuối kết thúc chuyến đi ngay.

Mỗi thử thách có 3 mốc quà, tổng cộng **9 vé, 1.850 vàng, 35 bụi rèn và 4 tinh thạch mỗi tuần**, ngoài chiến lợi phẩm chiến đấu. Nhấn Nhận ở từng mốc đã đạt; chơi lại không nhận lặp quà đã lĩnh. Kỷ lục thử thách không tăng kỷ lục hoặc mở cột mốc tháp vô tận.

Tuần bắt đầu lúc 00:00 thứ Hai theo đồng hồ thiết bị. Seed thay đổi theo tuần và loại thử thách. Chuyến đang dở giữ nguyên tuần và luật khi qua thời điểm làm mới; có thể xem lại tuần cũ để lĩnh quà. Lưu tối đa 12 tuần gần nhất, giữ tuần của chuyến đang chơi. Đây là chế độ offline theo đồng hồ máy, không có bảng xếp hạng trực tuyến.

## Trang bị, cổ vật và boss

Mở **Hội quán → Trang bị**, chọn anh hùng rồi chạm một món trong kho để so sánh chỉ số, mặc, tháo, nâng hoặc phân rã. Tất cả anh hùng có thể dùng mọi loại đồ; mỗi món chỉ có một người mặc. Đổi đồ và nâng cấp không thay đổi các chỉ số đã chốt trong chuyến đi hiện tại.

Kho báu và tinh anh luôn rơi một món; trận thường có 25% cơ hội rơi đồ. Boss luôn rơi ít nhất SR, thêm vé, tinh thạch, một lựa chọn cổ vật rồi một lựa chọn chúc phúc. Khi có đủ cả 8 cổ vật, các boss tiếp theo tiếp tục cho trang bị và chúc phúc. Đồ mới khi kho đủ 120 món được tự đổi thành bụi rèn, không xóa món đang có.

- **Cự nhân cổ đại:** đánh đơn → tụ lực → Địa chấn toàn đội. Hai kỹ năng gây sát thương trúng boss trong lúc tụ lực sẽ ngắt chiêu; đóng băng cũng ngắt được. Dưới 50% máu, Địa chấn mạnh hơn.
- **Người gác thư viện:** gọi tối đa hai bóng hầu. Boss giảm 35% sát thương khi còn bóng; các bóng mới chờ đến lượt sau mới đánh. Giai đoạn II tăng sát thương và chuẩn bị triệu hồi lại.
- **Kỵ sĩ tro tàn:** đánh đơn, quét toàn đội và hút máu theo máu thực sự lấy đi. Dùng khiên để hạn chế hút máu; giai đoạn II tăng sát thương 25%.
- **Hộ thần mặt trăng:** tạo khiên và đánh toàn đội. Kỹ năng gây sát thương phá khiên trước khi ra đòn; giai đoạn II tạo khiên dày hơn.

Bản lưu 1.0–1.16 được chuyển sang định dạng v13 tự động, giữ nguyên tài nguyên, bản trùng, bảo đảm cũ, trang bị, cổ vật, đội hình, máu, năng lượng và lượt đã dùng. Bước v6 → v7 chỉ thêm ba ô viễn chinh trống. Bước v7 → v8 thêm tiến trình chiến dịch trống, ba ô đội hình trống và đồ họa mặc định Vừa/30 FPS; giữ âm thanh/tốc độ và gắn campaign=null vào chuyến cũ. Bước v8 → v9 thêm parts=null cho boss cũ nếu chưa có trường này, để trận đang dở giữ nguyên luật và chiêu chờ; trận boss mới tạo ba bộ phận. Bước v9 → v10 thêm bản đồ thiên phú trống, cấp hiện tại quyết định số điểm có thể dùng, và talents=null cho từng anh hùng trong chuyến cũ; không đổi chỉ số hoặc hành động đang chờ. Bước v10 → v11 thêm thanh liên kết 0 điểm/0 lần dùng và cờ chưa dùng combo cho trận đang có; giữ nguyên RNG, giáp boss và toàn bộ trạng thái cũ. Bước v11 → v12 thêm bố trí 1 trước–2 sau vào tài khoản và đội lưu nhanh; chuyến đang dở nhận formation=null để giữ luật chiến đấu cũ. Bước v12 → v13 thêm lựa chọn trang phục nguyên bản vào tài khoản, giữ nguyên toàn bộ chuyến. Bản 1.17 giữ v13. Các bước không cộng tài nguyên hoặc sửa HP/lượt/trang bị chuyến đang chơi. Tổng số lần quay cũ được tính vào từng bảo đảm UR/LR/MR/EX, giới hạn ở mốc trừ một: nếu đã đủ mốc thì còn một lượt để nhận. Việc đọc lại bản lưu không cộng thêm lượt hay tài nguyên. Bản 1.0 nhận quà trang bị khởi đầu một lần. Chuyến từ 1.0/1.1 giữ trạng thái cũ và chưa thêm thức tỉnh/cộng hưởng; sức mạnh mới áp dụng khi khởi hành lại. Trận boss từ bản 1.0 giữ luật cũ đến khi kết thúc. Mỗi bản lưu cũ nhận Mộc Linh cấp 1 một lần; trận đang dở chưa có linh thú, bắt đầu chuyến mới để thú đi cùng. Khóa lưu vẫn là `thap-vo-tan-v1`. Bản lưu v12 cần app 1.15.0 trở lên.

## Triệu hồi

| Bậc | Tên | Tỉ lệ cơ bản | Bảo đảm tối đa | Bản trùng: tinh thạch / vàng |
| --- | --- | ---: | --- | ---: |
| EX | Khởi nguyên | 0,05% | 960 lượt có EX | 55 / 800 |
| MR | Thần thoại | 0,25% | 480 lượt có MR+ | 38 / 550 |
| LR | Truyền thuyết | 0,5% | 240 lượt có LR+ | 26 / 380 |
| UR | Siêu việt | 1,2% | 120 lượt có UR+ | 18 / 260 |
| SSR | Huyền thoại | 3% | 50 lượt có SSR+ | 12 / 180 |
| SR | Sử thi | 20% | 10 lượt có SR+ | 4 / 70 |
| R | Hiếm | 75% | — | 1 / 30 |

Tỉ lệ trước bảo đảm cộng đủ 100%; các anh hùng cùng bậc có cơ hội bằng nhau. Các bộ đếm dùng chung giữa quay ×1 và ×10. Mỗi lượt tăng mọi bộ đếm; nhận bậc cao đặt lại bảo đảm của bậc đó và các bậc thấp hơn. Khi nhiều mốc cùng đến hạn, áp dụng mốc cao nhất; bảo đảm luôn giữ kết quả tự nhiên cao hơn. Bản trùng còn giữ một bản đúng nhân vật để thức tỉnh.

Tám anh hùng mới: **Eira, Veyron (UR); Solis, Selene (LR); Orion, Lyra (MR); Aion, Eclipse (EX)**. Kỹ năng và đặc tính 1★ tương tác với cộng hưởng và cổ vật hiện có. Trang bị tiếp tục dùng ba bậc R/SR/SSR.

- Kiếm vé từ boss, kho báu, sự kiện, nhiệm vụ ngày và cột mốc. Game không có cửa hàng tiền thật.

## Chạy bản trình duyệt

Yêu cầu Node.js 20+; không cần cài thư viện npm.

```powershell
npm.cmd start
```

Mở http://localhost:4178. Tiến trình trình duyệt và APK được lưu riêng; có thể chuyển bằng xuất/nhập bản lưu.

## Build APK

Cần JDK 17, Android SDK platform 35 và build-tools 35. Gradle wrapper 8.9 và Android Gradle Plugin 8.5.2 được dùng để build ứng dụng Java WebView, đóng gói toàn bộ nội dung game trong APK.

```powershell
npm.cmd run build:android
```

Hoặc chỉ định SDK/JDK:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/build-android.ps1 -JdkPath 'C:\path\to\jdk-17' -SdkPath 'C:\path\to\Android\Sdk'
```

Kết quả nằm ở `artifacts/ThapVoTan-1.39.0.apk`, kèm tệp `.sha256`. Tên bản cài được lấy từ `package.json`. Cài bản cập nhật bằng cùng chữ ký để giữ dữ liệu. Xuất bản lưu trước khi gỡ app. Khi phát hành chính thức cần release keystore riêng và quy trình ký release.

## Kiểm tra

```powershell
npm.cmd test
```

486 bài kiểm tra bao gồm tài nguyên, gacha bảy bậc/bảo đảm, kỹ năng/thức tỉnh đủ 20 anh hùng, chuyển bản lưu cũ sang v17, đột kích 3 đội, trang phục 3D, hàng trước/sau, cây thiên phú, combo liên kết, trang bị/bốn bộ/20 trấn phái, tám cổ vật, boss, cộng hưởng, thử thách, 21 ải nguyên tố, linh thú, viễn chinh, dữ liệu nhập và mô hình 3D. Kiểm tra 10.000 mẫu phân tầng, 960 lượt xui nhất vẫn có EX, quay ×1/×10 cùng seed cho cùng kết quả. Kiểm tra camera/vũ khí/chiêu cuối, đủ 11 hình dạng boss, bốn vùng đất, trình tự đòn/va chạm, tốc độ 2×, hủy hoạt ảnh không tính lại kết quả và giải phóng tài nguyên.

21 bài mới của 1.12 kiểm tra điểm theo cấp cho từng tướng, chín nút/ba nhánh, điều kiện/cấp/bậc/giá điểm, đủ 20 anh hùng, tác động chiến đấu của cả ba nhánh, phối hợp trang bị/thức tỉnh, giới hạn chí mạng/năng lượng, đặt lại một lần/thiếu vàng/hủy, chuyển v9 → v10 và giữ trận đang dở, mọi chế độ chơi, bản lưu sai, phòng thử và roundtrip xuất/nhập. Handler giao diện thật chạy trong Node VM với DOM/storage/bridge stub. Toàn bộ kiểm tra trước về chiến dịch, gacha, boss 3D/phá giáp, đồ họa và Auto vẫn được giữ. Mô phỏng cân bằng 1.200 chuyến của 1.10 ở `artifacts/qa/campaign-balance-v1.10.json` là dữ liệu lịch sử trước phá giáp và thiên phú. Bản 1.12 chưa kiểm tra trực quan trong trình duyệt hoặc cài/chơi trên Android thật; chưa đo FPS, nhiệt, pin hay rung thực tế. Chi tiết trong `artifacts/QA.md`.

## Cấu trúc

- `js/data.mjs`: anh hùng, kỹ năng, chúc phúc, các lối đi và phần thưởng.
- `js/engine.mjs`: luật chơi và kiểm tra bản lưu; không phụ thuộc DOM.
- `js/raids.mjs`, `js/raid-ui.mjs`: ba đội/chín tướng, điều kiện, snapshot, bàn giao ba phong ấn, rương một lần, kỷ lục, 15 nhiệm vụ/thưởng lần đầu và kiểm tra bản lưu v18.
- `js/equipment.mjs`: rơi đồ, thuộc tính, mặc/tháo, nâng cấp, phân rã và kiểm tra kho.
- `js/gear-presets.mjs`, `js/gear-presets-ui.mjs`: ba bộ đồ theo từng anh hùng, tên riêng, lưu/xóa/xem/mặc, giữ món khóa và báo đồ thiếu hoặc tướng khác đang dùng.
- `js/armory-data.mjs`: bốn bộ đồ, 32 công thức, 20 trấn phái, boss săn và các mức khó.
- `js/armory.mjs`: nguyên liệu, chế tác, mục tiêu, hiệu ứng bộ, phần thưởng săn và kiểm tra dữ liệu v6.
- `js/armory-ui.mjs`: xưởng chế tác, tiến độ mục tiêu, săn boss và cấu hình/kết quả phòng thử.
- `js/expeditions.mjs`: sáu điểm đến, điều kiện dự bị/ô, tiến độ offline, thu hồi, thưởng một lần và kiểm tra dữ liệu v7.
- `js/expeditions-ui.mjs`: chọn chuyến/tướng/ô, xem trước thưởng, đếm giờ và trạng thái trở về.
- `js/campaign-data.mjs`, `js/campaign.mjs`: năm chương, hội thoại, 15 ải, mở khóa, quà một lần và kiểm tra dữ liệu v8.
- `js/campaign-ui.mjs`: bản đồ chương, thẻ ải, hội thoại tiếp tục được và kết quả.
- `js/preferences.mjs`, `js/preferences-ui.mjs`, `js/team-loadouts-ui.mjs`: ba đội lưu cả tướng/hàng/linh thú/chín ô đồ, xem trước và đổi cùng lúc, cùng cấu hình chất lượng/FPS/bóng/hiệu ứng.
- `js/expansion-ui.mjs`: hội quán trang bị, so sánh chỉ số, cổ vật và báo chiêu boss.
- `js/progression.mjs`: thức tỉnh, cộng hưởng, tuần thử thách, nhật ký và quà mốc.
- `js/progression-ui.mjs`: giao diện thức tỉnh, công thức cộng hưởng, các tháp thử thách và tiến trình boss.
- `js/talents.mjs`, `js/talents-ui.mjs`: điểm theo cấp, ba nhánh/chín nút, điều kiện, hiệu ứng chiến đấu, đặt lại bằng vàng, bản chốt và kiểm tra bản lưu v10.
- `js/skins.mjs`, `js/skins-ui.mjs`, `js/skins3d.mjs`: bốn trang phục, mốc mở khóa, mặc/xem trước, kiểm tra v13 và giáp/vũ khí/cánh/vòng 3D.
- `js/formation.mjs`, `js/formation-ui.mjs`: bố trí hàng, chọn mục tiêu, che chắn/xuyên hàng, tọa độ 3D, đổi hàng và kiểm tra bản lưu v12.
- `js/links.mjs`, `js/links-ui.mjs`, `js/links3d.mjs`: 28 combo nguyên tố, thanh chung, chọn cặp, gợi ý Auto, kiểm tra dữ liệu v11 và hiệu ứng phối hợp 3D.
- `js/rarity-ui.mjs`: xem trước bảy bậc, bộ đếm bảo đảm cao, cổng triệu hồi và hiệu ứng kỹ năng.
- `js/art.mjs`: hình vẽ nhân vật, tháp, quái và biểu tượng SVG gốc.
- `js/models3d.mjs`: tạo mô hình khối, gộp hình học và cache vật liệu cho thiết bị di động.
- `js/worlds3d.mjs`: chọn vùng theo tầng/nguyên tố, bốn đấu trường, thời tiết và chuyển sắc khi boss vào giai đoạn II.
- `js/boss3d.mjs`: hình dạng giai đoạn II riêng cho 11 boss, hào quang và báo tụ lực theo trạng thái chiến đấu.
- `js/boss-parts.mjs`, `js/boss-parts-ui.mjs`: độ bền, chọn/phá bộ phận, ngắt chiêu, giảm sức đánh, lộ lõi, cảnh báo mục tiêu và kiểm tra bản lưu v9.
- `js/boss-parts3d.mjs`: giáp rời/vòng chọn, nhận chạm bằng tia, vị trí va chạm và vòng báo dưới đồng đội.
- `js/haptics.mjs`: tùy chọn rung riêng thiết bị, bridge Android và dự phòng trình duyệt.
- `js/visuals3d.mjs`: sân đấu 3D, ánh sáng/bóng, ảnh thẻ, xoay mô hình và điều phối hiệu ứng.
- `js/effects3d.mjs`: vệt phép, xung kích, hạt va chạm/hồi máu, giới hạn và giải phóng hiệu ứng.
- `js/combat3d.mjs`: tư thế tay/vũ khí, bước lao, xoay theo mục tiêu và thời điểm bắn/va chạm theo vũ khí.
- `js/ultimate-data.mjs`, `js/ultimate3d.mjs`: 20 định nghĩa/cảnh chiêu cuối, trang phục/trấn phái, tốc độ và camera theo hình nhân vật/đạo cụ.
- `js/hero-ultimates3d.mjs`, `js/expanded-ultimates3d.mjs`, `js/hero-skills3d.mjs`: 16 storyboard khởi đầu/mới dùng chung cho hoạt cảnh và hiệu ứng ngắn trong sân đấu; tư thế riêng, hào quang theo bậc và giải phóng qua VFX pool.
- `js/playback.mjs`: tính/lưu một lần, phát trình tự, hủy khi ẩn và mở khóa thao tác sau hoạt ảnh.
- `js/contracts.mjs`, `js/contracts-ui.mjs`: quy tắc khế ước, lựa chọn sau boss, xem trước chi phí và khay theo dõi trong chuyến.
- `js/onboarding.mjs`, `js/onboarding-ui.mjs`: hướng dẫn theo thao tác thật, đánh dấu nút và chuỗi quà tân thủ/SSR tự chọn.
- `js/app.mjs`, `styles.css`: giao diện cảm ứng responsive, hiệu ứng, âm thanh, lưu và xuất/nhập.
- `android/`: ứng dụng Android và Gradle wrapper. Nội dung được phục vụ từ origin nội bộ, chặn điều hướng ra ngoài.

Bản này tập trung vào vòng chơi offline. Đồ họa 3D dùng Three.js 0.160.1 đóng gói sẵn, không tải thư viện hay mô hình từ mạng. Chỉ một cảnh sống và một bộ tạo ảnh thẻ được dùng lại; giảm độ phân giải/bóng và số hạt trên màn hình nhỏ, dừng khi app ẩn hoặc sân đấu/mô hình cuộn khỏi màn hình. Hiệu ứng chiến đấu có giới hạn số lượng và giải phóng vật liệu riêng khi kết thúc. Hình học tĩnh của bốn vùng được gộp theo vật liệu và lưu cache; thời tiết và bộ đệm lá riêng được giải phóng khi đổi cảnh. Nếu WebGL không khả dụng hoặc mất ngữ cảnh, giao diện hình vẽ gốc vẫn cho phép chiến đấu. Chế độ giảm chuyển động dừng chuyển động chờ/thời tiết và chỉ vẽ lại khi cần. Bản 1.16 dùng v13 cho ngoại hình tài khoản; bản chốt chuyến giữ nguyên. Bản 1.15 dùng v12 để giữ bố trí tài khoản, đội lưu nhanh và từng chuyến. Bản 1.14 dùng v11 để giữ điểm liên kết và lần dùng combo trong vòng. Bản 1.12 dùng định dạng lưu v10 để giữ phân bổ thiên phú và bản chốt từng chuyến. Bản 1.11 dùng v9 để giữ độ bền và lượt choáng của bộ phận boss. Bản 1.10 dùng v8 để giữ chiến dịch, đội hình lưu nhanh và tùy chọn đồ họa. Bản 1.9 dùng v7 để giữ thêm viễn chinh. Bản lưu v5 tiếp tục qua v6 để giữ xưởng rèn, săn boss và hiệu ứng trang bị đã chốt rồi qua v7/v8/v9/v10/v11/v12; mỗi bước chỉ chạy một lần, không cộng tài nguyên và không áp dụng bộ đồ mới vào chuyến đang dở.

Quái và vùng đất có số mẫu giới hạn rồi tăng độ khó; chưa có PvP, máy chủ, đồng bộ đám mây hoặc sự kiện trực tuyến. Font Be Vietnam Pro và Lora có giấy phép SIL OFL trong `assets/fonts/`; Three.js có giấy phép MIT tại `assets/Three-LICENSE.txt`.

Kiểm tra riêng 1.13: sảnh → đủ hoạt động → bắt đầu/tiếp tục chuyến, trở về từ phòng thử, quay về sảnh giữa Auto, khôi phục sau xem trước nhân vật, đổi chất lượng và giải phóng cảnh, giảm chuyển động/đưa app ra nền, chọn nhân vật bằng raycaster và camera cho đủ 20 anh hùng. 39 module đạt kiểm tra cú pháp; 50 tài sản trong APK trùng nguồn. Chi tiết tại `artifacts/QA-1.13.0.md`. Kiểm tra này chạy offline bằng Node/Three.js thật với DOM/renderer giả; chưa xác minh bố cục CSS, WebGL hoặc hiệu năng trên trình duyệt/điện thoại thật.

Kiểm tra riêng 1.14: thêm 28 bài về đủ 28 combo, tích/tiêu điểm, giới hạn mỗi vòng, đảo thứ tự cặp, hồi máu/khiên/thiên phú, phá giáp đủ 11 boss, thưởng một lần, Auto, phòng thử, bản lưu cũ và xuất/nhập. Kiểm tra hiệu ứng bằng Three.js thật với renderer giả: hội tụ, va chạm, tốc độ 2×, giới hạn hạt, giảm chuyển động và giải phóng tài nguyên. 42 module đạt kiểm tra cú pháp; 53 tài sản APK trùng nguồn. Log và giới hạn kiểm tra tại `artifacts/QA-1.14.0.md`. Chưa xác minh giao diện CSS/WebGL hoặc chơi trên điện thoại thật cho bản này.

Kiểm tra riêng 1.15: thêm 20 bài về bố trí/đổi hàng, ưu tiên mục tiêu sống, che chắn trước khi trừ khiên, tuyến đầu gục/hồi sinh, xuyên hàng và hút máu boss, mọi chế độ, đội lưu nhanh, phòng thử, chuyển v11 → v12 ở bảy pha, dữ liệu sai và xuất/nhập. Controller 3D thật với renderer giả kiểm tra hai hàng, vòng báo trùng vị trí, camera dọc/ngang và khôi phục chuyến cũ. 325/325 bài đạt; 44 module đạt cú pháp, 55 tài sản APK trùng nguồn. Chi tiết tại `artifacts/QA-1.15.0.md`. Chưa xác minh bố cục CSS/WebGL, cảm ứng hoặc độ mượt trên điện thoại thật cho bản này.

Kiểm tra riêng 1.16: thêm 20 bài về mốc tầng, chiến thắng săn boss thật, phòng thử/rút lui, chỉ thay ngoại hình, v12 → v13 ở bảy pha, dữ liệu sai, xuất/nhập, điều hướng và đổi đồ giữa trận. Three.js thật kiểm tra dáng giáp/vũ khí, cache nguyên bản/trang phục/trấn phái, hoạt ảnh độc lập, giảm hiệu ứng/chuyển động, giải phóng cảnh và camera dọc/ngang. **345/345** bài đạt; **47** module đạt cú pháp; **58/58** tài sản APK trùng nguồn. Chi tiết và giới hạn tại `artifacts/QA-1.16.0.md`.

Kiểm tra riêng 1.17: thêm 21 bài về bốn storyboard, tư thế riêng, trang phục/trấn phái, camera dọc/ngang có đạo cụ, giới hạn hình học/bản gọn, cùng pha ở 2×, bộ nhớ/hoạt ảnh độc lập, mục tiêu hỗ trợ/sát thương thật, pool hiệu ứng có giới hạn, giữ kết quả/RNG, xem trước bộ khóa/nguyên bản, Auto/cài đặt và hủy/bỏ qua/nền/lỗi renderer. Kiểm tra handler thật xác nhận kỹ năng lưu trước trình chiếu, không lặp thao tác và không đổi kết quả khi hủy. **366/366** bài đạt; **50** module đạt cú pháp, **61/61** tài sản APK trùng nguồn. Luật chiến đấu và bản lưu v13 giữ nguyên byte so với 1.16. Chi tiết/giới hạn ở `artifacts/QA-1.17.0.md`.
