import { scheduleVariable, taskInformations } from "./popup.js";
import { setData, displayData, setDisplayData } from "./ArrangeSchedule.js";
import { addEventToCalendar } from "./calendar.js";
import { addEventToGoogleCalendar } from "./googleCalendar.js";

const Button = document.getElementById("Button");
const ButtonPopupWrapper = document.getElementById("ButtonPopupWrapper");
const confirmButton = document.getElementById("confirmButton");
let result;
let finalResult;

Button.addEventListener("click", async () => {
  const taskInput = scheduleVariable();
  console.log(taskInput);
  let result;
  try {
    const response = await fetch(
      "https://aischeduler-bqdagmcwh2g0bqfn.japaneast-01.azurewebsites.net/predictTaskTime",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskInput: taskInput,
          OtherSchedule: otherSchedule, //  連携できてない
        }),
      }
    );
    if (!response.ok) {
      const errorDetail = await response.text();
      throw new Error(
        `エラー：${response.status} ${response.statusText}\n${errorDetail}`
      );
    }
    result = await response.json();
  } catch {
    result = testFinalResult;
  }

  //await addEventToGoogleCalendar(taskData);
  ButtonPopupWrapper.style.visibility = "visible";
  ButtonPopupWrapper.style.display = "block";
  setDisplayData(result);
  displayData();
  // } catch (error) {
  //   console.error(error);
  // }
});

// 最終的なデータの形を作る関数
function createfinalJSON() {
  finalResult = setData();
  const Information = taskInformations();

  finalResult.title = Information.taskTitle;
  finalResult.discription = Information.taskDiscription;
  finalResult.color = Information.taskColor;
  finalResult.location = Information.taskLocation;
  console.log(finalResult);
  return finalResult;
}

// 決定ボタンを押したときに最終的なデータの形を作る
confirmButton.addEventListener("click", async () => {
  finalResult = createfinalJSON(); // 関数を呼び出して情報を出力
  addEventToCalendar(finalResult);
  console.log(finalResult);
  console.log(finalResult.tasks);

  //await addEventsToFirestore(finalResult);
  finalResult.tasks.forEach(async (task) => {
    const taskData = {
      title: finalResult.title || "未設定のタイトル",
      description: finalResult.description || "",
      start: task.date || new Date(),
      end: task.endDate || new Date(),
      allDay: task.isAllDay ?? false,
      backgroundColor: finalResult.color || "blue",
    };

    // Firestore に追加後、Google カレンダーにも追加
    await addEventToGoogleCalendar(taskData);
  });
});

export { result, testResult, finalResult, testFinalResult };

//最終的なデータの形（テスト）
const testFinalResult = {
  tasks: [
    {
      date: new Date(2024, 8, 14, 10, 0),
      endDate: new Date(2024, 8, 14, 11, 0),
      isAllDay: false,
    },
    {
      date: new Date(2024, 8, 14, 12, 0),
      endDate: new Date(2024, 8, 14, 13, 0),
      isAllDay: false,
    },
  ],
  title: "新しいプロジェクトの計画",
  description: "プロジェクトの初期計画を立てる。",
  color: "blue",
  location: "東京",
};

// テスト用出力データ
const testResult = {
  tasks: [
    {
      year: 2024,
      month: 9,
      day: 14,
      StartMinutes: 660,
      EndMinutes: 720,
    },
    {
      year: 2024,
      month: 9,
      day: 14,
      StartMinutes: 780,
      EndMinutes: 840,
    },
  ],
};

//テスト用データ(すでにある予定)
const otherSchedule = {
  schedule: [
    {
      year: 2024,
      month: 9,
      day: 14,
      startTime: 600,
      endTime: 660,
    },
    {
      year: 2024,
      month: 9,
      day: 15,
      startTime: 720,
      endTime: 780,
    },
  ],
};
//テスト用データ
const taskInput = {
  year: 2024,
  month: 9,
  day: 14,
  title: "新しいプロジェクトの計画",
  description: "プロジェクトの初期計画を立てる。",
  taskDuration: 120,
  deadline: {
    year: 2024,
    month: 10,
    day: 15,
  },
};
