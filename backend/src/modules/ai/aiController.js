const { findCurrentUser } = require("../../utils/authUtils");
const {
  buildInsight,
  buildUserScopedData,
} = require("../../utils/financialUtils");

/**
 * @interface AiController
 * @description Exposes methods for AI chat and suggestions.
 */
function createAiController(dependencies) {
  const { loadData, env } = dependencies;
  const { OPENAI_API_KEY } = env;

  return {
    async getAiSuggestions(req, res) {
      const data = loadData();
      const user = findCurrentUser(req, loadData);
      const scopedData = buildUserScopedData(data, user);
      const { message } = req.body;
      const insight = buildInsight(scopedData, user);
      const summary = `Tổng chi tiêu: ${insight.totalExpense}đ, budget: ${scopedData.budget.amount}đ, nhóm chi tiêu lớn nhất: ${insight.topCategory}.`;
      const prompt = `Bạn là trợ lý tài chính. Dựa trên dữ liệu sau:\n${summary}\n\nHãy trả về gợi ý cụ thể cho người dùng:\n${message}`;

      if (!OPENAI_API_KEY) {
        return res.json({
          source: "rule-based",
          reply: `BOT: ${message}"\n- Hiện chưa cấu hình OpenAI. Gợi ý rule-based: ${insight.recommendations.slice(0, 3).join(" ")}`,
        });
      }

      try {
        const response = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: "gpt-3.5-turbo",
              messages: [
                {
                  role: "system",
                  content:
                    "Bạn là trợ lý tài chính cá nhân, trả lời ngắn gọn và rõ ràng.",
                },
                { role: "user", content: prompt },
              ],
              max_tokens: 250,
            }),
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          return res
            .status(502)
            .json({ error: "OpenAI request failed", details: errorText });
        }

        const payload = await response.json();
        const reply =
          payload.choices?.[0]?.message?.content || "Không có phản hồi từ AI.";
        res.json({ source: "openai", reply });
      } catch (error) {
        res
          .status(500)
          .json({ error: "AI service error", details: error.message });
      }
    },

    async chat(req, res) {
      try {
        const { message } = req.body;
        const data = loadData();
        const user = findCurrentUser(req, loadData);
        const scopedData = buildUserScopedData(data, user);
        const insight = buildInsight(scopedData, user);

        const summary = `
        Tổng chi tiêu: ${insight.totalExpense}đ
        Ngân sách: ${scopedData.budget.amount}đ
        Nhóm chi nhiều nhất: ${insight.topCategory}
        Trạng thái: ${insight.status}
        `;

        if (!OPENAI_API_KEY) {
          return res.json({
            reply:
              "Vui lòng cấu hình OPENAI_API_KEY để sử dụng tính năng chat AI.",
          });
        }

        const response = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: "gpt-4-turbo-preview", // fixed model name
              messages: [
                {
                  role: "system",
                  content: `Bạn là AI tài chính của SmartSpend.
                  Nhiệm vụ:
                  - Tư vấn quản lý chi tiêu
                  - Giúp tiết kiệm tiền
                  - Giải thích đơn giản
                  - Phù hợp sinh viên và nhân viên văn phòng
                  - Trả lời bằng tiếng Việt`,
                },
                { role: "system", content: summary },
                { role: "user", content: message },
              ],
              max_tokens: 300,
            }),
          },
        );

        const payload = await response.json();
        const reply =
          payload.choices?.[0]?.message?.content || "Không có phản hồi từ AI";
        res.json({ reply });
      } catch (error) {
        console.log(error);
        res.status(500).json({ error: "AI Chat Error" });
      }
    },
  };
}

module.exports = {
  createAiController,
};
