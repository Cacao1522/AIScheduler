export async function addEventToGoogleCalendar(eventData) {
  try {
    const event = {
      summary: eventData.title,
      description: eventData.description || "",
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

    // `token` を正しく取得する（前のコードには `token` がない）
    const token = localStorage.getItem("googleToken");
    if (!token) {
      console.error("Google のアクセストークンが見つかりません！");
      return;
    }

    const response = await fetch(
      "https://aischeduler-bqdagmcwh2g0bqfn.japaneast-01.azurewebsites.net/addGoogleCalendar",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, token }),
      }
    );

    const data = await response.json();
    console.log("Google カレンダーに予定を追加:", data);
  } catch (error) {
    console.error("Google カレンダーへの追加エラー:", error);
  }
}
