// import {testResult, result} from "./main";
// const result = testResult;//テストの時に使う
const ButtonPopupResult = document.getElementById("ButtonPopupResult");
let adjustedData;// 調整するデータ

function setDisplayData(result) {
  adjustedData = result.tasks;
}

function displayData() {
  ButtonPopupResult.innerHTML = setInnerHTML();
  attachEventListeners(); // イベントリスナーを追加
}

// データを整形
function setData() {
  const finalData = {
    tasks: [],
  };

  for (let i = 0; i < adjustedData.length; i++) {
    const startHours = Math.floor(adjustedData[i].StartMinutes / 60);
    const startMinutes = adjustedData[i].StartMinutes % 60;
    const endHours = Math.floor(adjustedData[i].EndMinutes / 60);
    const endMinutes = adjustedData[i].EndMinutes % 60;

    finalData.tasks.push({
      date: new Date(adjustedData[i].year, adjustedData[i].month - 1, adjustedData[i].day, startHours, startMinutes), // 開始時刻を含む
      endDate: new Date(adjustedData[i].year, adjustedData[i].month - 1, adjustedData[i].day, endHours, endMinutes), // 終了時刻を含む
      isAllDay: judgmentAllDay(i),
    });
  }

  return finalData;
}

function setInnerHTML() {
  let HTMLcontent = `<div></div>`;
  for (let i = 0; i < adjustedData.length; i++) {
    HTMLcontent += `
      <div class="title">タスク${i + 1}回目</div>
      
      <div class="dateTimeContainer">
        <div class="dateContainer">
          <div class="arrangeContainer">
            <button id="task${i + 1}yearUpButton">▲</button>
            <div class="taskChild" id="task${i + 1}year">${
      adjustedData[i].year
    }年</div>
            <button id="task${i + 1}yearDownButton">▼</button>
          </div>
          <div class="arrangeContainer">
            <button id="task${i + 1}monthUpButton">▲</button>
            <div class="taskChild" id="task${i + 1}month">${
      adjustedData[i].month
    }月</div>
            <button id="task${i + 1}monthDownButton">▼</button>
          </div>
          <div class="arrangeContainer">
            <button id="task${i + 1}dayUpButton">▲</button>
            <div class="taskChild" id="task${i + 1}day">${
      adjustedData[i].day
    }日</div>
            <button id="task${i + 1}dayDownButton">▼</button>
          </div>
        </div>
        <div class="timeContainer">
          <div class="arrangeContainer">
            <button id="task${i + 1}startTimeUpButton">▲</button>
            <div class="taskChild" id="task${i + 1}startTime">${timeUnit(
      adjustedData[i].StartMinutes
    )}  </div>
            <button id="task${i + 1}startTimeDownButton">▼</button>
          </div>
          <div class="kara">〜</div>
          <div class="arrangeContainer">
            <button id="task${i + 1}endTimeUpButton">▲</button>
            <div class="taskChild" id="task${i + 1}endTime">${timeUnit(
      adjustedData[i].EndMinutes
    )}</div>
            <button id="task${i + 1}endTimeDownButton">▼</button>
          </div>
        </div>
      </div>
      <div class="border"></div>
      `;
  }
  return HTMLcontent;
}

function attachEventListeners() {
  for (let i = 0; i < adjustedData.length; i++) {
    // 年のボタン
    document.getElementById(`task${i + 1}yearUpButton`).onclick = () =>
      updateYear(i, 1);
    document.getElementById(`task${i + 1}yearDownButton`).onclick = () =>
      updateYear(i, -1);

    // 月のボタン
    document.getElementById(`task${i + 1}monthUpButton`).onclick = () =>
      updateMonth(i, 1);
    document.getElementById(`task${i + 1}monthDownButton`).onclick = () =>
      updateMonth(i, -1);

    // 日のボタン
    document.getElementById(`task${i + 1}dayUpButton`).onclick = () =>
      updateDay(i, 1);
    document.getElementById(`task${i + 1}dayDownButton`).onclick = () =>
      updateDay(i, -1);

    // 開始時間のボタン
    document.getElementById(`task${i + 1}startTimeUpButton`).onclick = () =>
      updateStartTime(i, 15);
    document.getElementById(`task${i + 1}startTimeDownButton`).onclick = () =>
      updateStartTime(i, -15);

    // 終了時間のボタン
    document.getElementById(`task${i + 1}endTimeUpButton`).onclick = () =>
      updateEndTime(i, 15);
    document.getElementById(`task${i + 1}endTimeDownButton`).onclick = () =>
      updateEndTime(i, -15);
  }
}

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