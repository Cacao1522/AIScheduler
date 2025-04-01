import { Calendar } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid"; // dayGrid プラグイン
import timeGridPlugin from "@fullcalendar/timegrid"; // timeGrid プラグイン
import InteractionPlugin from "@fullcalendar/interaction";

var calendarMonthEl = document.getElementById("calendar-month");
var calendarDayEl = document.getElementById("calendar-day");

const modal = document.getElementById("event-modal");
const modalPopupWrapper = document.getElementById("modalPopupWrapper");
const modalTitle = document.getElementById("modal-title");
const modalStart = document.getElementById("modal-start");
const modalEnd = document.getElementById("modal-end");
const modalDescription = document.getElementById("modal-description");
const modalLocation = document.getElementById("modal-location");
const modalClose = document.getElementById("modal-close");
const loginButton = document.getElementById("loginButton");
const logoutButton = document.getElementById("sign-out-button");
loginButton.style.display = "block";
logoutButton.style.display = "none";

function updateLoginButtonText() {
  if (window.innerWidth <= 1000) {
    loginButton.textContent = "ログイン";
  } else {
    loginButton.textContent = "Googleカレンダーと連携（ログイン）";
  }
}

// 初回実行
updateLoginButtonText();

// ウィンドウサイズ変更時に実行
window.addEventListener("resize", updateLoginButtonText);
modalClose.addEventListener("click", () => {
  modal.style.display = "none";
});
// modalPopupWrapper.addEventListener("click", () => {
//   modal.style.display = "none";
// });
// modal.addEventListener("click", (e) => {
//   console.log("modalPopupWrapper", e.target);
//   if (e.target === modal) {
//     // クリックしたのが背景（ラッパー）なら閉じる
//     modal.style.display = "none";
//   }
// });
// modalPopupWrapper.addEventListener("click", (e) => {
//   if (e.target !== modal || e.target === modalClose) {
//     modalPopupWrapper.style.display = "none";
//   }
// });
let calendarDisplay = "timeGridDay,timeGridWeek";
if (window.innerWidth <= 1000) {
  calendarDisplay = "timeGridDay,dayGridMonth";
}
// 日表示のカレンダー
var calendarDay = new Calendar(calendarDayEl, {
  plugins: [dayGridPlugin, timeGridPlugin, InteractionPlugin],
  initialView: "timeGridDay",
  allDaySlot: false, // 終日スロットを非表示
  nowIndicator: true,
  //height: "auto", // 高さを自動調整
  headerToolbar: {
    start: calendarDisplay, // 月・週表示
    center: "title",
    end: "prev,next today", // 「前月を表示」、「次月を表示」、「今日を表示」
  },
  eventClick: function (info) {
    modal.style.display = "block";
    modalTitle.textContent = info.event.title;
    modalStart.textContent = `開始: ${info.event.start.toLocaleString()}`;
    modalEnd.textContent = info.event.end
      ? `終了: ${info.event.end.toLocaleString()}`
      : "終了: なし";
    if (info.event.extendedProps.description) {
      modalDescription.innerHTML = `<span class="material-icons">description</span>  ${info.event.extendedProps.description}`;
    } else {
      modalDescription.textContent = "";
    }
    if (info.event.extendedProps.location) {
      modalLocation.innerHTML = `<span class="material-icons">place</span>  ${info.event.extendedProps.location}`;
    } else {
      modalLocation.textContent = "";
    }
  },
});

// 月表示のカレンダー
var calendarMonth = new Calendar(calendarMonthEl, {
  plugins: [dayGridPlugin, InteractionPlugin],
  initialView: "dayGridMonth",
  dayMaxEventRows: true,
  dayCellDidMount: async function (info) {
    // const holidays = await fetchHolidays();
    // const cellDate = info.date.toISOString().split("T")[0]; // "YYYY-MM-DD" 形式に変換
    const day = info.date.getDay(); // 曜日を取得（0: 日曜, 6: 土曜）
    const dayNumberEl = info.el.querySelector(".fc-daygrid-day-number"); // 日付部分だけ取得
    if (dayNumberEl) {
      if (day === 0) {
        // 🔹 日曜日 or 祝日は赤色
        dayNumberEl.style.color = "red";
      } else if (day === 6) {
        // 🔹 土曜日は青色
        dayNumberEl.style.color = "blue";
      }
    }
  },

  // カレンダー間の同期を取る場合、dateClickを使う
  dateClick: function (info) {
    calendarDay.gotoDate(info.dateStr);
  },
  eventClick: function (info) {
    modalPopupWrapper.style.display = "block";
    modal.style.display = "block";
    modalTitle.textContent = info.event.title;
    modalStart.textContent = `開始: ${info.event.start.toLocaleString()}`;
    modalEnd.textContent = info.event.end
      ? `終了: ${info.event.end.toLocaleString()}`
      : "終了: なし";
    if (info.event.extendedProps.description) {
      modalDescription.innerHTML = `<span class="material-icons">description</span> ${info.event.extendedProps.description}`;
    } else {
      modalDescription.textContent = "";
    }
    if (info.event.extendedProps.location) {
      modalLocation.innerHTML = `<span class="material-icons">place</span> ${info.event.extendedProps.location}`;
    } else {
      modalLocation.textContent = "";
    }
  },
});

const BASE_URL = //"http://localhost:3000";
  "https://aischeduler-bqdagmcwh2g0bqfn.japaneast-01.azurewebsites.net";
document.addEventListener("DOMContentLoaded", async function () {
  if (window.innerWidth >= 1000) {
    calendarMonth.render();
  }
  calendarDay.render();
  const loginButton = document.getElementById("loginButton");

  // トークンを取得が有効かチェック→有効ならカレンダーの予定を取得
  try {
    const response = await fetch(`${BASE_URL}/get-token`, {
      method: "GET",
      credentials: "include", // ✅ クッキーを送る
    });

    if (!response.ok) throw new Error("トークン取得に失敗しました");

    const data = await response.json();
    console.log("✅ トークンチェック結果:", data);

    if (data.isValid) {
      console.log("✅ Google トークンが有効");
      await fetchGoogleCalendarEvents();
    } else {
      console.log("🔹 Google トークンが無効。ログインが必要です。");
    }
  } catch (error) {
    console.error("❌ トークンチェックエラー:", error);
  }

  // ログインボタンクリック
  loginButton.addEventListener("click", () => {
    console.log("🔑 ログインボタンクリック");
    // バックエンド(ScheduleTask.js)でログイン処理→セッションに保存
    window.location.href = `${BASE_URL}/auth`;
  });

  // ユーザーのログアウト
  document
    .getElementById("sign-out-button")
    .addEventListener("click", async () => {
      try {
        // 🔹 サーバー側のクッキーを削除
        await fetch(`${BASE_URL}/logout`, {
          method: "POST",
          credentials: "include",
        });
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
  taskData.forEach((task, index) => {
    const eventId = `testEvent-${index}`;
    const startDate = new Date(task.start);
    const endDate = new Date(task.end);

    calendarMonth.addEvent({
      id: eventId,
      title: task.title,
      start: startDate,
      end: endDate,
      allDay: task.isAllDay,
      backgroundColor: task.color || "blue",
      description: task.description || "",
      location: task.location || "",
    });

    calendarDay.addEvent({
      id: eventId,
      title: task.title,
      start: startDate,
      end: endDate,
      allDay: task.isAllDay,
      backgroundColor: task.color || "blue",
      description: task.description || "",
      location: task.location || "",
    });
  });

  console.log("カレンダーにイベントを追加しました:", taskData);
}

const colorMap = {
  1: "#a4bdfc", // ライトブルー
  2: "#7ae7bf", // ライトグリーン
  3: "#dbadff", // ラベンダー
  4: "#ff887c", // サーモンピンク
  5: "#fbd75b", // イエロー
  6: "#ffb878", // オレンジ
  7: "#46d6db", // シアン
  8: "#e1e1e1", // グレー
  9: "#5484ed", // ブルー
  10: "#51b749", // グリーン
  11: "#dc2127", // レッド
};
export const googleCalendarData = [];
// 🔹 Google カレンダーの予定を取得してカレンダーに追加
async function fetchGoogleCalendarEvents() {
  loginButton.style.display = "none";
  logoutButton.style.display = "block";
  try {
    const response = await fetch(`${BASE_URL}/getGoogleCalendarEvents`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json();

    calendarMonth = new Calendar(calendarMonthEl, {
      plugins: [dayGridPlugin, InteractionPlugin],
      initialView: "dayGridMonth",
      dayMaxEventRows: true,
      dayCellDidMount: async function (info) {
        const holidayDates = data.holidays.map((date) => {
          const jstDate = new Date(date);
          jstDate.setMinutes(
            jstDate.getMinutes() + jstDate.getTimezoneOffset()
          ); // JST補正
          return jstDate.toISOString().split("T")[0];
        });
        const cellDate = info.date.toISOString().split("T")[0]; // "YYYY-MM-DD" 形式に変換
        const dayNumberEl = info.el.querySelector(".fc-daygrid-day-number");
        const day = info.date.getDay();
        if (dayNumberEl) {
          if (day === 0 || holidayDates.includes(cellDate)) {
            // 🔹 日曜日 or 祝日は赤色
            dayNumberEl.style.color = "red";
          } else if (day === 6) {
            // 🔹 土曜日は青色
            dayNumberEl.style.color = "blue";
          }
        }
      },
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
        if (info.event.extendedProps.description) {
          modalDescription.innerHTML = `<span class="material-icons">description</span> ${info.event.extendedProps.description}`;
        } else {
          modalDescription.textContent = "";
        }
        if (info.event.extendedProps.location) {
          modalLocation.innerHTML = `<span class="material-icons">place</span> ${info.event.extendedProps.location}`;
        } else {
          modalLocation.textContent = "";
        }
      },
    });

    if (data.events) {
      console.log("✅ Google カレンダーの予定取得:", data.events);
      data.events.forEach((event) => {
        calendarMonth.addEvent({
          id: event.id,
          title: event.summary,
          start: new Date(event.start.dateTime || event.start.date), // Google カレンダーの日付
          end: new Date(event.end.dateTime || event.end.date),
          allDay: !!event.start.date, // 終日イベントなら true
          backgroundColor: colorMap[event.colorId] || "#4285F4", // Google カレンダーの青色
          location: event.location || "",
          description: event.description || "",
        });
        calendarDay.addEvent({
          id: event.id,
          title: event.summary,
          start: new Date(event.start.dateTime || event.start.date),
          end: new Date(event.end.dateTime || event.end.date),
          allDay: !!event.start.date,
          backgroundColor: colorMap[event.colorId] || "#4285F4",
          location: event.location || "",
          description: event.description || "",
        });
        // 既存のスケジュールを取得
        googleCalendarData.push({
          title: event.summary,
          start: event.start.dateTime
            ? new Date(event.start.dateTime)
            : new Date(event.start.date),
          end: event.end.dateTime
            ? new Date(event.end.dateTime)
            : new Date(event.end.date),
        });
      });
    }
    if (window.innerWidth >= 1000) {
      calendarMonth.render();
    }
  } catch (error) {
    console.error("❌ Google カレンダーの予定取得エラー:", error);
  }
}
