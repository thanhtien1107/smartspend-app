# SmartSpend App

Ứng dụng quản lý chi tiêu SmartSpend với budget, báo cáo và AI insight rule-based.

## Chạy ứng dụng

1. Mở terminal trong `d:\SmartSpendingDocument\smartspend-app`
2. Chạy:
   ```powershell
   npm install
   npm start
   ```
3. Mở trình duyệt tại `http://localhost:4000`

## Tính năng hiện tại

- Quản lý chi tiêu: thêm, xem danh sách chi tiêu
- Phát hiện giao dịch trùng và cảnh báo chi tiêu bất thường
- Quản lý budget: cập nhật ngân sách theo tháng/tuần
- Goal tiết kiệm: tạo mục tiêu mới
- Dashboard hiển thị tổng chi tiêu, trạng thái budget, hạng mục lớn nhất
- Báo cáo đơn giản theo nhóm chi tiêu
- AI Chat rule-based trả lời gợi ý quản lý chi tiêu

## Scenario 1: Manage daily expenses and control spending

- Người dùng mở dashboard, thêm chi tiêu mới, và thấy hệ thống cập nhật tức thì.
- Nếu chi tiêu nhập vào trùng với giao dịch trước đó, hệ thống đề xuất xác nhận lại.
- Nếu giao dịch bất thường hoặc lớn hơn 25% budget, hệ thống cảnh báo trước khi lưu.
- Dashboard cập nhật lại tình trạng ngân sách và hiển thị cảnh báo khi sắp vượt hoặc vượt ngân sách.

## Scenario 2: Control monthly spending with category budgets

- Người dùng vào phần Budget và đặt ngân sách theo hạng mục.
- Hệ thống lưu budget cho từng category và theo dõi chi tiêu liên tục.
- Khi chi tiêu category đạt 70–80% ngân sách, hệ thống hiển thị cảnh báo thông minh.
- Hệ thống đưa ra đề xuất cá nhân hóa dựa trên thói quen chi tiêu.
- Nếu AI thiếu dữ liệu, hệ thống vẫn có cảnh báo rule-based cơ bản.

## Scenario 3: AI-driven financial analysis and decision support

- Người dùng mở phần Report để xem báo cáo và phân tích AI.
- Hệ thống hiển thị các hạng mục chi tiêu chính và dữ liệu tài chính quan trọng.
- Hệ thống phân tích thói quen chi tiêu, xác định nhóm chi tiêu lớn và giao dịch bất thường.
- Hệ thống tạo gợi ý hành động: giảm 15–20% chi tiêu ở nhóm tốn kém.
- Hệ thống dự báo tổng chi tiêu tháng nếu hành vi hiện tại tiếp tục.
- Nếu dữ liệu chưa đủ, hệ thống trả về báo cáo cơ bản thay vì phân tích nâng cao.

## Lưu ý

- Dữ liệu lưu trong `data/db.json`
- Mục quét hóa đơn chưa được triển khai theo yêu cầu

## Week 8 additions

- Database-oriented structure for report access:
  - JSON store now has `notifications`, `emailOutbox`, `reportExports`, and `debtCarryovers` collections.
  - Prisma schema was extended with `Notification`, `ReportExport`, and `DebtCarryover` models plus indexed transaction fields.
- Report export:
  - Backend endpoints: `/api/reports/export/pdf`, `/api/reports/export/excel`, `/api/reports/export/csv`.
  - Report page has buttons for PDF, Excel, and CSV export.
- Debt carry-over logic:
  - If spending exceeds the available budget in a budget period, the overflow becomes debt.
  - The debt is carried to the next period and reduces the next available budget.
  - Dashboard, Report, and AI insight data include debt fields.
- Budget overspending notification:
  - When a saved expense causes overspending, SmartSpend creates a customer notification.
  - Notifications are stored in `notifications`; simulated email records are stored in `emailOutbox` for demonstration.
