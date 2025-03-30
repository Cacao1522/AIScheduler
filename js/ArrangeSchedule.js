import { scheduleVariable } from "./popup.js";
// import {testResult, result} from "./main";
// const result = testResult;//テストの時に使う
const ButtonPopupResult = document.getElementById("ButtonPopupResult");
let adjustedData; // 調整するデータ

function setDisplayData(result) {
  adjustedData = result.tasks;
}

function displayData() {
  ButtonPopupResult.innerHTML = setInnerHTML();
  //attachEventListeners(); // イベントリスナーを追加
}

// データを整形
function setData() {
  const finalData = {
    tasks: [],
  };

  for (let i = 0; i < adjustedData.length; i++) {
    // const startHours = Math.floor(adjustedData[i].StartMinutes / 60);
    // const startMinutes = adjustedData[i].StartMinutes % 60;
    // const endHours = Math.floor(adjustedData[i].EndMinutes / 60);
    // const endMinutes = adjustedData[i].EndMinutes % 60;

    // finalData.tasks.push({
    //   date: new Date(
    //     adjustedData[i].year,
    //     adjustedData[i].month - 1,
    //     adjustedData[i].day,
    //     startHours,
    //     startMinutes
    //   ), // 開始時刻を含む
    //   endDate: new Date(
    //     adjustedData[i].year,
    //     adjustedData[i].month - 1,
    //     adjustedData[i].day,
    //     endHours,
    //     endMinutes
    //   ), // 終了時刻を含む
    //   isAllDay: judgmentAllDay(i),
    // });
    const startInput = document.getElementById(`task${i}startDateTime`).value;
    const endInput = document.getElementById(`task${i}endDateTime`).value;

    // `datetime-local` の値を Date オブジェクトに変換
    const startDate = new Date(startInput);
    const endDate = new Date(endInput);

    // `finalData` に格納
    finalData.tasks.push({
      id: adjustedData[i].id,
      start: startInput, // 開始時刻
      end: endInput, // 終了時刻
      isAllDay: judgmentAllDay(i),
    });
  }

  return finalData;
}

function setInnerHTML() {
  let HTMLcontent = `<div></div>`;
  const taskInput = scheduleVariable();
  for (let i = 0; i < adjustedData.length; i++) {
    const task = taskInput.tasks.find((t) => t.id === adjustedData[i].id);

    // 開始時刻を計算
    const startDate = new Date(adjustedData[i].start); // ISO 8601 形式の日付文字列を Date に変換
    const startMinutes = startDate.getHours() * 60 + startDate.getMinutes(); // 開始時刻の分単位（時間 * 60 + 分）

    // 終了時刻を計算
    const endDate = new Date(startDate.getTime() + adjustedData[i].dur * 60000);
    // 年月日を取得
    const endYear = endDate.getFullYear();
    const endMonth = String(endDate.getMonth() + 1).padStart(2, "0"); // 0埋め
    const endDay = String(endDate.getDate()).padStart(2, "0");

    // 時分を取得
    const endHours = String(endDate.getHours()).padStart(2, "0"); // 0埋め
    const endMinutes = String(endDate.getMinutes()).padStart(2, "0"); // 0埋め

    // YYYY-MM-DDTHH:MM 形式に整形
    const endDateTime = `${endYear}-${endMonth}-${endDay}T${endHours}:${endMinutes}`;

    HTMLcontent += `
      <div class="title">${task.title}</div>
      

        <div class="dateContainer">
          
        
          
          <div class="arrangeContainer">
            <input type="datetime-local" id="task${i}startDateTime" value="${adjustedData[i].start}" />
          </div>

          <div class="kara">〜</div>
          <div class="arrangeContainer">
            
            <input type="datetime-local" id="task${i}endDateTime" value="${endDateTime}" />
            
          </div>
        </div>

      <div class="border"></div>
      `;
  }
  return HTMLcontent;
}

// function attachEventListeners() {
//   for (let i = 0; i < adjustedData.length; i++) {
//     // 年のボタン
//     document.getElementById(`task${i + 1}yearUpButton`).onclick = () =>
//       updateYear(i, 1);
//     document.getElementById(`task${i + 1}yearDownButton`).onclick = () =>
//       updateYear(i, -1);

//     // 月のボタン
//     document.getElementById(`task${i + 1}monthUpButton`).onclick = () =>
//       updateMonth(i, 1);
//     document.getElementById(`task${i + 1}monthDownButton`).onclick = () =>
//       updateMonth(i, -1);

//     // 日のボタン
//     document.getElementById(`task${i + 1}dayUpButton`).onclick = () =>
//       updateDay(i, 1);
//     document.getElementById(`task${i + 1}dayDownButton`).onclick = () =>
//       updateDay(i, -1);

//     // 開始時間のボタン
//     document.getElementById(`task${i + 1}startTimeUpButton`).onclick = () =>
//       updateStartTime(i, 15);
//     document.getElementById(`task${i + 1}startTimeDownButton`).onclick = () =>
//       updateStartTime(i, -15);

//     // 終了時間のボタン
//     document.getElementById(`task${i + 1}endTimeUpButton`).onclick = () =>
//       updateEndTime(i, 15);
//     document.getElementById(`task${i + 1}endTimeDownButton`).onclick = () =>
//       updateEndTime(i, -15);
//   }
// }

function updateYear(index, change) {
  adjustedData[index].year += change;
  displayData(); // データを再表示
}

function updateMonth(index, change) {
  adjustedData[index].month += change;
  if (adjustedData[index].month > 12) {
    adjustedData[index].month = 1;
  } else if (adjustedData[index].month < 1) {
    adjustedData[index].month = 12;
  }
  displayData(); // データを再表示
}

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getDaysInMonth(year, month) {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }
  const daysInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return daysInMonths[month - 1]; // monthは1から12なので、インデックスは月-1
}

function updateDay(index, change) {
  adjustedData[index].day += change;

  // 月の日数を考慮
  const daysInCurrentMonth = getDaysInMonth(
    adjustedData[index].year,
    adjustedData[index].month
  );

  if (adjustedData[index].day > daysInCurrentMonth) {
    adjustedData[index].day = 1; // 日を1日にリセット
  } else if (adjustedData[index].day < 1) {
    adjustedData[index].day = daysInCurrentMonth; // 月の日数にリセット
  }
  displayData(); // データを再表示
}

function updateStartTime(index, change) {
  adjustedData[index].StartMinutes += change; // 分単位で増減

  // 24時を超えた場合の処理
  if (adjustedData[index].StartMinutes >= 1440) {
    // 1440分 = 24時間
    adjustedData[index].StartMinutes -= 1440; // 24時間を引く
  } else if (adjustedData[index].StartMinutes < 0) {
    adjustedData[index].StartMinutes += 1440; // 24時間を加える
  }
  displayData(); // データを再表示
}

function updateEndTime(index, change) {
  adjustedData[index].EndMinutes += change; // 分単位で増減

  // 24時を超えた場合の処理
  if (adjustedData[index].EndMinutes >= 1440) {
    // 1440分 = 24時間
    adjustedData[index].EndMinutes -= 1440; // 24時間を引く
  } else if (adjustedData[index].EndMinutes < 0) {
    adjustedData[index].EndMinutes += 1440; // 24時間を加える
  }
  displayData(); // データを再表示
}

function timeUnit(totalminutes) {
  const hours = Math.floor(totalminutes / 60);
  const minutes = totalminutes % 60;
  return hours + "時" + minutes + "分";
}

function judgmentAllDay(index) {
  if (
    adjustedData[index].EndMinutes - adjustedData[index].StartMinutes ==
    1440
  ) {
    return true;
  } else {
    return false;
  }
}

export { setData, displayData, setDisplayData };
