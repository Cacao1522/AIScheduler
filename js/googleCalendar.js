export async function addEventToGoogleCalendar(eventData) {
  try {
    const colorMap = {
      blue: "9", // 濃い青
      lightblue: "1", // 青
      green: "10", // 濃い緑
      lightgreen: "2", // 緑
      purple: "3", // 紫
      red: "11", // 濃い赤
      pink: "4", // 赤
      yellow: "5", // 黄
      orange: "6", // オレンジ
      cyan: "7", // シアン
      gray: "8", // 灰色
    };
    console.log("eventData", eventData);
    const event = {
      summary: eventData.title,
      description: eventData.description || "",
      location: eventData.location || "",
      colorId: colorMap[eventData.color.toLowerCase()] || "1", // 色名を colorId に変換
      start: {
        dateTime: new Date(eventData.start).toISOString(),
        timeZone: "Asia/Tokyo",
      },
      end: {
        dateTime: new Date(eventData.end).toISOString(),
        timeZone: "Asia/Tokyo",
      },
      reminders: { useDefault: true },
    };

    const response = await fetch(
      //"http://localhost:3000/addGoogleCalendar",
      "https://aischeduler-bqdagmcwh2g0bqfn.japaneast-01.azurewebsites.net/addGoogleCalendar",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event }),
        credentials: "include",
      }
    );

    const data = await response.json();
    console.log("Google カレンダーに予定を追加:", data);
  } catch (error) {
    console.error("Google カレンダーへの追加エラー:", error);
  }
}
