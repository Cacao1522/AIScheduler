import { Calendar } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid"; // dayGrid プラグイン
import timeGridPlugin from "@fullcalendar/timegrid"; // timeGrid プラグイン
import InteractionPlugin from "@fullcalendar/interaction";

var calendarMonthEl = document.getElementById("calendar-month");
var calendarDayEl = document.getElementById("calendar-day");

const modal = document.getElementById("event-modal");
const modalTitle = document.getElementById("modal-title");
const modalStart = document.getElementById("modal-start");
const modalEnd = document.getElementById("modal-end");
const modalClose = document.getElementById("modal-close");

modalClose.addEventListener("click", () => {
  modal.style.display = "none";
});

// 日表示のカレンダー
var calendarDay = new Calendar(calendarDayEl, {
  plugins: [timeGridPlugin, InteractionPlugin],
  initialView: "timeGridDay",
  allDaySlot: false, // 終日スロットを非表示
  //height: "auto", // 高さを自動調整
  events: [
    { title: "イベント1", start: "2024-09-10T09:00:00" },
    { title: "イベント2", start: "2024-09-12T13:00:00" },
  ],
  eventClick: function (info) {
    modal.style.display = "block";
    modalTitle.textContent = info.event.title;
    modalStart.textContent = `開始: ${info.event.start.toLocaleString()}`;
    modalEnd.textContent = info.event.end
      ? `終了: ${info.event.end.toLocaleString()}`
      : "終了: なし";
  },
});

// 月表示のカレンダー
var calendarMonth = new Calendar(calendarMonthEl, {
  plugins: [dayGridPlugin, InteractionPlugin],
  initialView: "dayGridMonth",
  events: [
    { title: "イベント1", start: "2024-09-10" },
    { title: "イベント2", start: "2024-09-12" },
  ],
  // カレンダー間の同期を取る場合、dateClickを使う
  dateClick: function (info) {
    calendarDay.gotoDate(info.dateStr);
  },
  eventClick: function (info) {
    modal.style.display = "block";
    modalTitle.textContent = info.event.title;
    modalStart.textContent = `開始: ${info.event.start.toLocaleString()}`;
    modalEnd.textContent = info.event.end
      ? `終了: ${info.event.end.toLocaleString()}`
      : "終了: なし";
  },
});

document.addEventListener("DOMContentLoaded", async function () {
  calendarMonth.render();
  calendarDay.render();
  const loginButton = document.getElementById("loginButton");
  const userNameElement = document.getElementById("userName");

  // ✅ サーバーに `httpOnly Cookie` からトークンを取得する
  try {
    const response = await fetch(
      "https://aischeduler-bqdagmcwh2g0bqfn.japaneast-01.azurewebsites.net/get-token",
      {
        method: "GET",
        credentials: "include", // ✅ クッキーを送る
      }
    );

    if (!response.ok) throw new Error("トークン取得に失敗しました");

    const data = await response.json();
    console.log("✅ 取得したトークン:", data);

    const now = Date.now();
    if (data.accessToken && data.expiry && now < data.expiry) {
      // アクセストークンの有効期限が切れていない
      console.log("✅ Google トークンを検出:", data.accessToken);
      userNameElement.textContent = "Google カレンダーと同期中...";
      await fetchGoogleCalendarEvents(data.accessToken); // Google カレンダーの予定を取得
      userNameElement.textContent = "Google カレンダーの予定取得成功";
    } else if (data.refreshToken) {
      // リフレッシュトークンを使ってアクセストークンを更新

      userNameElement.textContent = "Google カレンダーと同期中...";
      const response = await fetch(
        "https://aischeduler-bqdagmcwh2g0bqfn.japaneast-01.azurewebsites.net/refresh-token",
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: data.refreshToken }),
        }
      );

      if (!response.ok) throw new Error("アクセストークンの更新に失敗しました");

      const newData = await response.json();
      console.log("data", newData);
      console.log("✅ 新しいアクセストークン取得:", newData.accessToken);

      await fetchGoogleCalendarEvents(newData.accessToken); // Google カレンダーの予定を取得
      userNameElement.textContent = "Google カレンダーの予定取得成功";
    } else {
      console.log("🔹 Google トークンなし。ログインが必要です。");
      userNameElement.textContent = "ログインしてください";
    }
  } catch (error) {
    console.error("❌ トークン取得エラー:", error);
  }

  // ログインボタンクリック
  loginButton.addEventListener("click", () => {
    console.log("🔑 ログインボタンクリック");
    // バックエンド(ScheduleTask.mjs)でログイン処理→セッションに保存
    window.location.href =
      "https://aischeduler-bqdagmcwh2g0bqfn.japaneast-01.azurewebsites.net/auth";
  });

  // ユーザーのログアウト
  document
    .getElementById("sign-out-button")
    .addEventListener("click", async () => {
      console.log("🔑 ログアウトボタンクリック");
      try {
        // ローカルストレージからトークンを削除
        // localStorage.removeItem("googleToken"); // ✅ Google API トークンも削除
        // localStorage.removeItem("refreshToken");
        // localStorage.removeItem("expiryTime");

        // 🔹 サーバー側のセッションを削除
        await fetch(
          "https://aischeduler-bqdagmcwh2g0bqfn.japaneast-01.azurewebsites.net/logout",
          {
            method: "POST",
            credentials: "include", // セッションを送信
          }
        );
        // URLからクエリパラメータを削除
        //window.history.replaceState({}, document.title, "/");
        window.location.href = "https://accounts.google.com/logout";
        console.log("✅ ログアウトしました");
        window.location.reload(); // ページをリロード
      } catch (error) {
        console.error("❌ ログアウトエラー:", error);
      }
    });
});
// AIの回答をカレンダーに追加（main.jsで使用）
export function addEventToCalendar(taskData) {
  taskData.tasks.forEach((task, index) => {
    const eventId = `testEvent-${index}`;
    const startDate = new Date(task.date);
    const endDate = new Date(task.endDate);

    calendarMonth.addEvent({
      id: eventId,
      title: taskData.title,
      start: startDate,
      end: endDate,
      allDay: task.isAllDay,
      backgroundColor: taskData.color || "blue",
    });

    calendarDay.addEvent({
      id: eventId,
      title: taskData.title,
      start: startDate,
      end: endDate,
      allDay: task.isAllDay,
      backgroundColor: taskData.color || "blue",
    });
  });

  console.log("カレンダーにイベントを追加しました:", taskData);
}

// 🔹 Google カレンダーの予定を取得してカレンダーに追加
async function fetchGoogleCalendarEvents(googleToken) {
  if (!googleToken) {
    console.error("❌ Google トークンがありません。再ログインが必要です。");
    return;
  }

  try {
    const response = await fetch(
      "https://aischeduler-bqdagmcwh2g0bqfn.japaneast-01.azurewebsites.net/getGoogleCalendarEvents",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: googleToken }),
      }
    );

    const data = await response.json();
    if (data.events) {
      console.log("✅ Google カレンダーの予定取得:", data.events);
      data.events.forEach((event) => {
        calendarMonth.addEvent({
          id: event.id,
          title: event.summary,
          start: new Date(event.start.dateTime || event.start.date), // Google カレンダーの日付
          end: new Date(event.end.dateTime || event.end.date),
          allDay: !!event.start.date, // 終日イベントなら true
          backgroundColor: "#4285F4", // Google カレンダーの青色
        });
        calendarDay.addEvent({
          id: event.id,
          title: event.summary,
          start: new Date(event.start.dateTime || event.start.date),
          end: new Date(event.end.dateTime || event.end.date),
          allDay: !!event.start.date,
          backgroundColor: "#4285F4",
        });
      });
    }
  } catch (error) {
    console.error("❌ Google カレンダーの予定取得エラー:", error);
  }
}
