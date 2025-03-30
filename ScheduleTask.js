import express from "express";
// import session from "express-session";
import cookieParser from "cookie-parser";
import OpenAI from "openai";
import { google } from "googleapis";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config(); //.envの内容を読み込む

const apiKey = process.env.CHATGPT_KEY;
const client = new OpenAI({ apiKey: apiKey });

const app = express();
const port = process.env.PORT || 3000; //8080
const BASE_URL = //"http://localhost:5173";
  "https://aischeduler-bqdagmcwh2g0bqfn.japaneast-01.azurewebsites.net";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// app.use(cors()); // CORSを有効にする
app.use(
  cors({
    origin: `${BASE_URL}`,
    credentials: true, // クッキーを送受信するために必要
  })
);

// app.use(
//   session({
//     secret: process.env.SESSION_SECRET || "your-secret-key",
//     resave: false,
//     saveUninitialized: true,
//     cookie: {
//       secure: process.env.NODE_ENV === "production", // 本番環境なら true
//       httpOnly: true,
//       sameSite: "None",
//     },
//   })
// );

app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.join(__dirname, "dist")));

// JSONスキーマ
const taskOutputSchema = {
  type: "object",
  properties: {
    tasks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          // year: {
          //   type: "integer",
          // },
          // month: {
          //   type: "integer",
          // },
          // day: {
          //   type: "integer",
          // },
          // StartMinutes: {
          //   type: "integer",
          // },
          // EndMinutes: {
          //   type: "integer",
          // },
          id: {
            type: "integer",
          },
          start: {
            type: "string", // 開始時間（ISO 8601）
          },
          dur: {
            type: "integer", // 作業時間（分）
          },
        },
        required: ["id", "start", "dur"],
        //required: ["year", "month", "day", "StartMinutes", "EndMinutes"],
        additionalProperties: false,
      },
    },
  },
  required: ["tasks"],
  additionalProperties: false,
};

const predictTaskTime = async (taskInput, OtherSchedule) => {
  //スケジュールがいくつあるか分からないので、map関数を使って文字列に変換
  // 🔹 タスクの最も遅い期限を取得
  // const latestDeadline = taskInput.reduce((latest, task) => {
  //   return task.deadline > latest ? task.deadline : latest;
  // }, new Date());
  const latestDeadline = taskInput.tasks
    .map((task) => new Date(task.deadline)) // 文字列なら Date に変換
    .reduce(
      (latest, deadline) => (deadline > latest ? deadline : latest),
      new Date(0)
    );
  console.log("最も遅い期限:", latestDeadline);
  const now = new Date();
  const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000); // 日本時間に変換
  // 🔹 指定範囲内の予定だけを抽出
  const filteredEvents = OtherSchedule.filter((event) => {
    return (
      new Date(event.start) >= now && new Date(event.end) <= latestDeadline
    );
  });
  console.log("now:", jstNow);
  // const scheduleString = OtherSchedule.schedule
  //   .map((item) => {
  //     return `${item.year}/${item.month}/${item.day} ${item.startTime} - ${item.endTime}`;
  //   })
  //   .join(", ");
  // 🔹 スケジュールデータを文字列化
  const scheduleString = filteredEvents
    .map((event) => {
      const jstStart = new Date(
        new Date(event.start).getTime() + 9 * 60 * 60 * 1000
      );
      const jstEnd = new Date(
        new Date(event.end).getTime() + 9 * 60 * 60 * 1000
      );

      const startStr = jstStart
        .toISOString()
        .replace("T", " ")
        .substring(0, 16); // YYYY-MM-DD HH:mm
      const endStr = jstEnd.toISOString().replace("T", " ").substring(0, 16); // YYYY-MM-DD HH:mm

      return `${event.title}:${startStr} - ${endStr}`;
    })
    .join("\n");
  console.log("既存のスケジュール");
  console.log(scheduleString);
  const taskDetails = taskInput.tasks
    .map((task, index) => {
      const deadlineJST = new Date(task.deadline).toLocaleString("ja-JP", {
        timeZone: "Asia/Tokyo",
      });
      return `id:${index},title:${task.title || ""},desc:${
        task.description || ""
      },demand:${task.demand || ""},ddl:${deadlineJST},dur(minutes):${
        task.taskDuration
      },loc:${task.taskLocation || ""}`;
    })
    .join("\n");
  //OpenAI APIの呼び出し
  const completion = await client.beta.chat.completions.parse({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          //"You are a helpful assistant. Allocate the given task without overlapping with the existing schedule.",
          "あなたはスケジュールを整理し、適切な時間にタスクを割り当てるアシスタントです。指定されたタスクを、既存のスケジュールを考慮しながら、効率的に配置してください。",
      },
      {
        role: "user",
        // content: `This task:${taskInput.title}, ${taskInput.description} is expected to take about ${taskInput.taskDuration} minutes. When should I start and how many minutes should I work?
        // Do not schedule tasks between 0 mimutes and ${taskInput.noTaskUntilHour}mimutes.
        // If a ${taskInput.taskDuration} minutes is more than 240 minutes, please split it and create break times in between.
        // Please ensure the total of TaskDuration is ${taskInput.taskDuration}.
        // Ensure the task does not overlap with these scheduled plans :${scheduleString}.
        // Please output the start time in minutes (e.g., for 12:00, output 720).
        // this period is from today's date:${taskInput.year}/${taskInput.month}/${taskInput.day} to the deadline:${taskInput.deadline.year}/${taskInput.deadline.month}/${taskInput.deadline.day}.`,
        //旧案
        // content: `
        //   This task:${taskInput.title}, ${taskInput.description} is expected to take about ${taskInput.taskDuration} minutes.
        //   Please allocate the task on days without any scheduled plans from today's date:${taskInput.year}/${taskInput.month}/${taskInput.day} to the deadline:${taskInput.deadline.year}/${taskInput.deadline.month}/${taskInput.deadline.day} .
        //   Ensure the task does not overlap with these scheduled plans :${scheduleString}.
        //   Please output the start time in minutes from midnight (e.g., for 12:00, output 720).
        //   Make sure to find time slots that are free.`,
        content: `以下のタスクを、期限内に適切な時間に割り当ててください。

        【タスク一覧】
        ${taskDetails}

        【条件】  
        - 既存のスケジュールと重ならないようにする  
        - 1回の作業時間が240分を超える場合は分割し、適切に休憩を挟む   
        - タスクは現在時刻(${jstNow.toISOString()})以降に開始する
        ${
          taskInput.nightTime
            ? `- 深夜 (${taskInput.nightStart} - ${taskInput.nightEnd}) は作業しない`
            : ""
        }

        【既存のスケジュール】
        ${scheduleString}

        【出力形式】
        - タスクごとに以下のJSON形式
        - "id":入力値を使用
        - "start":YYYY-MM-DDTHH:mm の形式(ISO 8601)
        - "dur":タスクの所要時間（分）`,
      },
    ],
    // レスポンスの形式の指定
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "taskOutput",
        strict: true,
        schema: taskOutputSchema,
      },
    },
  });
  console.log(`【タスク一覧】
        ${taskDetails}

        【条件】  
        - 既存のスケジュールと重ならないようにする  
        - 1回の作業時間が240分を超える場合は分割し、適切に休憩を挟む   
        - タスクは現在時刻(${jstNow.toISOString()})以降に開始する
        ${
          taskInput.nightTime
            ? `- 深夜 (${taskInput.nightStart} - ${taskInput.nightEnd}) は作業しない`
            : ""
        }

        【既存のスケジュール】
        ${scheduleString}

        【出力形式】
        - タスクごとに以下のJSON形式
        - "id":入力値を使用
        - "start":YYYY-MM-DDTHH:mm の形式(ISO 8601)
        - "dur":タスクの所要時間（分）`);
  console.log("AIの回答");
  console.log(completion.choices[0].message.parsed);
  return completion.choices[0].message.parsed;
};

app.post("/predictTaskTime", async (req, res) => {
  const taskInput = req.body.taskInput;
  const OtherSchedule = req.body.OtherSchedule;
  try {
    const result = await predictTaskTime(taskInput, OtherSchedule);
    console.log(result);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("サーバーエラー");
  }
});

app.listen(port, () => {
  console.log(`サーバーが起動しました! ${BASE_URL}`);
});
const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
];
// Google API 設定
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || `${BASE_URL}/auth/callback`
);
app.get("/auth", (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES, // 🔹 修正したスコープを適用
    prompt: "consent",
  });
  res.redirect(authUrl);
});
// 🔹 Google OAuth 認証後のコールバック
app.get("/auth/callback", async (req, res) => {
  const code = req.query.code;

  if (!code) return res.send("認証コードがありません");

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    console.log("✅ 取得したアクセストークン:", tokens.access_token);
    console.log("✅ 取得したリフレッシュトークン:", tokens.refresh_token);
    const expiryTime =
      Date.now() +
      (tokens.expiry_date
        ? tokens.expiry_date - Date.now()
        : tokens.expires_in * 1000);
    const expiryDuration = tokens.expiry_date
      ? tokens.expiry_date - Date.now()
      : tokens.expires_in * 1000;

    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("accessToken", tokens.access_token, {
      httpOnly: true,
      secure: isProduction, // 本番環境では `true`（HTTPS 必須）
      sameSite: isProduction ? "None" : "Lax", // 本番環境では `None`、開発では `Lax`
      maxAge: expiryDuration,
    });

    res.cookie("refreshToken", tokens.refresh_token, {
      httpOnly: true,
      secure: isProduction, // 本番環境では `true`（HTTPS 必須）
      sameSite: isProduction ? "None" : "Lax", // 本番環境では `None`、開発では `Lax`
      maxAge: 60 * 60 * 24 * 30 * 1000, // 30日間
    });

    res.cookie("expiry", expiryTime, {
      httpOnly: true,
      secure: isProduction, // 本番環境では `true`（HTTPS 必須）
      sameSite: isProduction ? "None" : "Lax", // 本番環境では `None`、開発では `Lax`
      maxAge: expiryDuration,
    });

    res.redirect(`${BASE_URL}`);
  } catch (error) {
    console.error("❌ 認証エラー:", error);
    res.send("認証に失敗しました");
  }
});

// `access_token` が有効かどうかチェック
// リフレッシュトークンでアクセストークンを更新
app.get("/get-token", async (req, res) => {
  console.log("🔍 セッションの状態:", req.cookies.accessToken);

  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;
  const expiry = req.cookies.expiry ? parseInt(req.cookies.expiry, 10) : 0;
  const now = Date.now();

  if (accessToken && now < expiry) {
    // ✅ トークンが有効
    return res.json({ isValid: true });
  }

  if (!accessToken && !refreshToken) {
    // ❌ リフレッシュトークンがない → ログインが必要
    return res.json({ isValid: false, error: "リフレッシュトークンなし" });
  }

  try {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await oauth2Client.refreshAccessToken();

    console.log("🔄 新しいアクセストークン:", credentials.access_token);

    const expiryTime =
      Date.now() +
      (credentials.expiry_date
        ? credentials.expiry_date - Date.now()
        : credentials.expires_in * 1000);
    const expiryDuration = credentials.expiry_date
      ? credentials.expiry_date - Date.now()
      : credentials.expires_in * 1000;
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("accessToken", credentials.access_token, {
      httpOnly: true,
      secure: isProduction, // 本番環境では `true`（HTTPS 必須）
      sameSite: isProduction ? "None" : "Lax", // 本番環境では `None`、開発では `Lax`
      maxAge: expiryDuration,
    });
    res.cookie("expiry", expiryTime, {
      httpOnly: true,
      secure: isProduction, // 本番環境では `true`（HTTPS 必須）
      sameSite: isProduction ? "None" : "Lax", // 本番環境では `None`、開発では `Lax`
      maxAge: expiryDuration,
    });
    console.log("✅ アクセストークンの更新に成功");
    return res.json({ isValid: true }); // 🔹 トークンが更新されたので有効
  } catch (error) {
    console.error("❌ トークンリフレッシュエラー:", error);
    return res.json({ isValid: false, error: "アクセストークンの更新に失敗" });
  }
});

// ログアウト時にクッキーを削除
app.post("/logout", (req, res) => {
  console.log("クッキー削除");
  const isProduction = process.env.NODE_ENV === "production";
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "None" : "Lax",
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "None" : "Lax",
  });

  res.clearCookie("expiry", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "None" : "Lax",
  });
  res.json({ message: "ログアウト成功" });
});

// Google カレンダーに予定を追加
app.post("/addGoogleCalendar", async (req, res) => {
  const token = req.cookies.accessToken;
  const { event } = req.body;
  if (!token) {
    return res.status(400).json({ error: "アクセストークンがありません" });
  }

  try {
    oauth2Client.setCredentials({ access_token: token });
    const newToken = await oauth2Client.getAccessToken();

    if (!newToken) {
      return res
        .status(401)
        .json({ error: "新しいアクセストークンの取得に失敗しました" });
    }
    // Google カレンダー API
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });
    res.json({
      message: "予定をGoogle カレンダーに追加しました",
      data: response.data,
    });
  } catch (error) {
    console.error("Google カレンダー追加エラー:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/getGoogleCalendarEvents", async (req, res) => {
  const token = req.cookies.accessToken;

  if (!token) {
    return res.status(400).json({ error: "アクセストークンがありません" });
  }

  try {
    oauth2Client.setCredentials({ access_token: token });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const pastSixMonth = new Date();
    pastSixMonth.setMonth(pastSixMonth.getMonth() - 6);
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1); // 1年後

    // 既存の予定を取得
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: pastSixMonth.toISOString(),
      timeMax: nextYear.toISOString(),
      maxResults: 150,
      singleEvents: true,
      orderBy: "startTime",
    });

    // 祝日の日付を取得
    const response2 = await calendar.events.list({
      calendarId: "ja.japanese#holiday@group.v.calendar.google.com",
      timeMin: pastSixMonth.toISOString(),
      timeMax: nextYear.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });
    const holidayDates = response2.data.items.map((event) => event.start.date);

    res.json({ events: response.data.items, holidays: holidayDates }); // 取得した予定をフロントエンドに返す
  } catch (error) {
    console.error("❌ Google カレンダーの予定取得エラー:", error);
    res.status(500).json({ error: error.message });
  }
});
// 祝日情報を取得
app.get("/getHolidays", async (req, res) => {
  try {
    const API_KEY = process.env.GOOGLE_CALENDAR_KEY;
    if (!API_KEY) {
      throw new Error("APIキーが設定されていません");
    }
    const url = `https://www.googleapis.com/calendar/v3/calendars/ja.japanese%40holiday@group.v.calendar.google.com/events?key=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google APIエラー: ${response.statusText}`);
    }
    const data = await response.json();

    if (data.items) {
      const holidays = data.items.map((event) => event.start.date);
      return res.json({ holidays });
    }

    res.status(500).json({ error: "祝日情報が取得できませんでした" });
  } catch (error) {
    console.error("❌ 祝日取得エラー:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});
