const clickBtn = document.getElementById("clickBtn");
const popupWrapper = document.getElementById("popupWrapper");
const close = document.getElementById("close");
const Button = document.getElementById("Button");
const ButtonPopupWrapper = document.getElementById("ButtonPopupWrapper");
const ButtonClose = document.getElementById("ButtonClose");
const ButtonContainer = document.getElementById("ButtonContainer");
const taskTitle = document.getElementById("taskTitle");
const taskDiscription = document.getElementById("taskDiscription");
const taskDemand = document.getElementById("taskDemand");
const taskTime = document.getElementById("taskTime");
const taskDate = document.getElementById("taskDate");
const taskColor = document.getElementById("taskColor");
const colorPopupWrapper = document.getElementById("colorPopupWrapper");
const colorClose = document.getElementById("colorClose");
const colorPopupInside = document.getElementById("colorPopupInside");
const circles = document.getElementsByClassName("circles");
const locationPopupWrapper = document.getElementById("locationPopupWrapper");
const taskLocation = document.getElementById("taskLocation");
const location = document.getElementById("location");
const confirmButton = document.getElementById("confirmButton");

const taskContainer = document.getElementById("taskContainer");
const addTaskButton = document.getElementById("addTaskButton");
const nightTime = document.getElementById("nightTime");
const nightStart = document.getElementById("nightStart");
const nightEnd = document.getElementById("nightEnd");
let taskCount = 1;
let currentTaskColorDiv = null;

// ボタンをクリックしたときにポップアップを表示させる
clickBtn.addEventListener("click", () => {
  popupWrapper.style.display = "block";
});

// タスクの色をクリックしたときにポップアップを表示させる
taskColor.addEventListener("click", (event) => {
  currentTaskColorDiv = event.target;
  colorPopupWrapper.style.visibility = "visible";
  colorPopupWrapper.style.display = "block";
});

//　マップアイコンをクリックしたときにポップアップを表示させる
taskLocation.addEventListener("click", () => {
  locationPopupWrapper.style.visibility = "visible";
  locationPopupWrapper.style.display = "block";
});

// ポップアップの外側又は「x」のマークをクリックしたときポップアップを閉じる
popupWrapper.addEventListener("click", (e) => {
  if (e.target.id === popupWrapper.id || e.target.id === close.id) {
    popupWrapper.style.display = "none";
  }
});

// タスクの色のポップアップの外側又は「x」のマークをクリックしたときポップアップを閉じる
taskColor.addEventListener("click", function (e) {
  if (e.target.id === colorPopupWrapper.id || e.target.id === colorClose.id) {
    colorPopupWrapper.style.visibility = "hidden";
    console.log(colorPopupWrapper);
  }
});

// マップのポップアップの外側又は「x」のマークをクリックしたときポップアップを閉じる
taskLocation.addEventListener("click", function (e) {
  if (
    e.target.id === locationPopupWrapper.id ||
    e.target.id === locationClose.id
  ) {
    locationPopupWrapper.style.visibility = "hidden";
  }
});

//「x」のマークをクリックしたときポップアップを閉じる //タスク追加確認画面のポップアップの外側又は
ButtonContainer.addEventListener("click", function (e) {
  if (e.target.id === ButtonClose.id) {
    //e.target.id === ButtonPopupWrapper.id ||
    ButtonPopupWrapper.style.visibility = "hidden";
  }
});

//タスク追加確認画面の決定ボタンを押したときポップアップを閉じる
confirmButton.addEventListener("click", () => {
  ButtonPopupWrapper.style.visibility = "hidden";
  popupWrapper.style.display = "none";
});

// １０色の色のdivタグをクリックしたときに色を変更する
document.querySelectorAll(".circles").forEach((circles) => {
  circles.addEventListener("click", () => {
    //taskColor.style.backgroundColor = circles.dataset.color;
    if (
      currentTaskColorDiv &&
      currentTaskColorDiv.classList.contains("taskColor")
    ) {
      currentTaskColorDiv.style.backgroundColor = circles.dataset.color;
      setTimeout(() => {
        colorPopupWrapper.style.visibility = "hidden";
        colorPopupWrapper.style.display = "none";
      }, 50); // 50ms遅延
    }
  });
});

const scheduleVariable = function () {
  // const today = new Date();
  // const taskInputDate = new Date(taskDate.value);
  // const taskInput = {
  //   year: today.getFullYear(),
  //   month: today.getMonth() + 1,
  //   day: today.getDate(),
  //   title: taskTitle.value,
  //   description: taskDiscription.value,
  //   deadline: {
  //     year: taskInputDate.getFullYear(),
  //     month: taskInputDate.getMonth() + 1,
  //     day: taskInputDate.getDate(),
  //   },
  //   taskDuration: taskTime.value,
  // };
  // return taskInput;
  const taskContainer = document.getElementById("taskContainer");
  const taskForms = taskContainer.querySelectorAll(".task-form");

  const allTasks = [];
  const today = new Date();
  const taskInputDate = new Date(taskDate.value);

  const firstTaskData = {
    id: 0,
    // {
    //   year: today.getFullYear(),
    //   month: today.getMonth() + 1,
    //   day: today.getDate(),
    // },
    title: taskTitle.value,
    description: taskDiscription.value,
    demand: taskDemand.value,
    deadline: taskInputDate,
    // {
    //   year: taskInputDate.getFullYear(),
    //   month: taskInputDate.getMonth() + 1,
    //   day: taskInputDate.getDate(),
    // },
    taskDuration: taskTime.value,
    taskColor: taskColor.style.backgroundColor || "blue", // デフォルトの色
    taskLocation: location.value || "", // デフォルトで空
  };

  allTasks.push(firstTaskData);

  taskForms.forEach((taskForm) => {
    const taskTitle = taskForm.querySelector(".taskTitle").value;
    const taskDescription = taskForm.querySelector(".taskDiscription").value;
    const taskDemand = taskForm.querySelector(".taskDemand").value;
    const taskInputDate = new Date(taskForm.querySelector(".taskDate").value);
    console.log(taskInputDate);
    const taskTime = taskForm.querySelector(".taskTime").value;
    const taskColor =
      taskForm.querySelector(".taskColor").style.backgroundColor;
    const taskLocation = taskForm.querySelector(".location").value;

    const taskData = {
      id: allTasks.length,
      title: taskTitle,
      description: taskDescription,
      demand: taskDemand,
      deadline: taskInputDate,
      taskDuration: taskTime,
      taskColor: taskColor || "blue", // デフォルトの色
      taskLocation: taskLocation || "", // デフォルトで空
    };

    allTasks.push(taskData);
  });
  const data = {
    tasks: allTasks,
    nightStart: nightStart.value,
    nightEnd: nightEnd.value,
    nightTime: nightTime.checked,
  };
  return data;
};

const taskInformations = function () {
  const informations = {
    // taskColor の値が空または null の場合、"blue" を設定（なぜか設定前だと値を取得しない）
    taskColor: taskColor.style.backgroundColor || "blue",
    taskTitle: taskTitle.value,
    taskDiscription: taskDiscription.value,
    taskLocation: location.value,
  };
  return informations;
};

document.getElementById("addTaskButton").addEventListener("click", () => {
  // タスクコンテナを取得
  const taskContainer = document.getElementById("taskContainer");

  // 新しいタスクフォームの作成
  const newTaskForm = document.createElement("div");
  newTaskForm.classList.add("task-form");
  // **区切り線**
  const separator = document.createElement("hr");
  separator.classList.add("border");

  const inputContainer = document.createElement("div");
  inputContainer.classList.add("inputContainer");

  // **タスク名**
  const taskTitle = document.createElement("input");
  taskTitle.type = "text";
  taskTitle.placeholder = "タスクのタイトルを入力 *";
  taskTitle.classList.add("taskTitle");
  taskTitle.required = true; // 必須項目

  // **詳細**
  const taskDescription = document.createElement("textarea");
  taskDescription.placeholder = "タスクの詳細を入力";
  taskDescription.classList.add("taskDiscription");

  // **要望**
  const taskDemand = document.createElement("textarea");
  taskDemand.placeholder = "タスクの要望を入力";
  taskDemand.classList.add("taskDemand");

  // **期限**
  const taskDateDiscription = document.createElement("div");
  taskDateDiscription.textContent = "タスクの期限を入力 *";
  taskDateDiscription.classList.add("taskDateDiscription");
  const optionContainer = document.createElement("div");
  optionContainer.classList.add("optionContainer");
  const taskDate = document.createElement("input");
  taskDate.type = "datetime-local";
  taskDate.classList.add("taskDate");
  taskDate.required = true; // 必須項目

  // **時間**
  const taskTime = document.createElement("input");
  taskTime.type = "number";
  taskTime.placeholder = "所要時間(分)を入力 *";
  taskTime.classList.add("taskTime");
  taskTime.required = true; // 必須項目
  taskTime.min = 1; // 最小値

  // **色の選択**
  const taskColor = document.createElement("div");
  taskColor.classList.add("taskColor");
  taskColor.style.backgroundColor = "blue"; // 初期色
  taskColor.addEventListener("click", (event) => {
    currentTaskColorDiv = event.target;
    colorPopupWrapper.style.visibility = "visible";
    colorPopupWrapper.style.display = "block";
  });

  // **場所**
  const taskLocation = document.createElement("div");
  taskLocation.classList.add("taskLocation");
  const locationIcon = document.createElement("div");
  locationIcon.innerHTML =
    '<img src="public/img/場所のアイコン.jpg" alt="場所のアイコン">';
  locationIcon.src = "場所のアイコン.jpg";
  locationIcon.alt = "場所のアイコン";
  taskLocation.appendChild(locationIcon);
  // **場所の入力ポップアップ**
  const locationPopupWrapper = document.createElement("div");
  locationPopupWrapper.classList.add("locationPopupWrapper");
  locationPopupWrapper.style.visibility = "hidden";
  locationPopupWrapper.style.display = "none";

  // **ポップアップ内の要素**
  const locationPopupInside = document.createElement("div");
  locationPopupInside.classList.add("locationPopupInside");

  const locationClose = document.createElement("div");
  locationClose.textContent = "x";
  locationClose.classList.add("locationClose");

  const locationInput = document.createElement("textarea");
  locationInput.classList.add("location");
  locationInput.placeholder = "タスクをする場所を入力";

  // **ポップアップをタスクに追加**
  locationPopupInside.appendChild(locationClose);
  locationPopupInside.appendChild(locationInput);
  locationPopupWrapper.appendChild(locationPopupInside);
  taskLocation.appendChild(locationPopupWrapper);
  inputContainer.appendChild(taskTitle);
  inputContainer.appendChild(taskDescription);
  inputContainer.appendChild(taskDemand);
  optionContainer.appendChild(taskDate);
  optionContainer.appendChild(taskTime);
  optionContainer.appendChild(taskColor);
  optionContainer.appendChild(taskLocation);

  // クリックでポップアップを表示
  locationIcon.addEventListener("click", () => {
    locationPopupWrapper.style.visibility = "visible";
    locationPopupWrapper.style.display = "block";
  });

  // 「×」ボタンをクリックしたときにポップアップを閉じる
  locationClose.addEventListener("click", () => {
    locationPopupWrapper.style.visibility = "hidden";
    locationPopupWrapper.style.display = "none";
  });

  // ポップアップの外側をクリックしたときに閉じる
  locationPopupWrapper.addEventListener("click", (e) => {
    if (e.target === locationPopupWrapper) {
      locationPopupWrapper.style.visibility = "hidden";
      locationPopupWrapper.style.display = "none";
    }
  });
  // **閉じるボタン**
  locationClose.addEventListener("click", () => {
    console.log("閉じるボタンが押された");

    locationPopupWrapper.style.visibility = "hidden";
  });

  // **削除ボタン**
  const deleteButton = document.createElement("button");
  const deleteIcon = document.createElement("i");
  deleteIcon.classList.add("material-icons");
  deleteIcon.textContent = "delete";
  deleteButton.appendChild(deleteIcon);
  deleteButton.appendChild(document.createTextNode(" 削除"));
  deleteButton.classList.add("delete-task");
  deleteButton.addEventListener("click", () => {
    newTaskForm.remove();
    checkInput();
  });

  // **フォームを追加**
  newTaskForm.appendChild(separator);
  // newTaskForm.appendChild(taskTitle);
  // newTaskForm.appendChild(taskDescription);
  newTaskForm.appendChild(inputContainer);
  newTaskForm.appendChild(taskDateDiscription);
  // newTaskForm.appendChild(taskDate);
  // newTaskForm.appendChild(taskTime);
  // newTaskForm.appendChild(taskColor);
  // newTaskForm.appendChild(taskLocation);
  newTaskForm.appendChild(optionContainer);
  newTaskForm.appendChild(deleteButton);

  // **タスクコンテナに追加**
  taskContainer.appendChild(newTaskForm);

  // 各フィールドの入力内容をチェック
  checkInput();
  taskTitle.addEventListener("input", checkInput);
  taskDate.addEventListener("input", checkInput);
  taskTime.addEventListener("input", checkInput);
});

// バリデーションチェック
Button.disabled = true;

function checkInput() {
  const taskTitles = document.querySelectorAll(".taskTitle");
  const taskDates = document.querySelectorAll(".taskDate");
  const taskTimes = document.querySelectorAll(".taskTime");
  // すべてのタスクフォームを検証
  for (let i = 0; i < taskTitles.length; i++) {
    if (
      !taskTitles[i].value.trim() ||
      !taskDates[i].value ||
      taskTimes[i].value < 1
    ) {
      Button.disabled = true; // いずれかのフィールドが無効ならボタンを無効化
      return;
    }
  }

  Button.disabled = false; // すべてのタスクフォームが有効ならボタンを有効化
}

taskTitle.addEventListener("input", checkInput);
taskDate.addEventListener("input", checkInput);
taskTime.addEventListener("input", checkInput);
export { scheduleVariable, taskInformations };
