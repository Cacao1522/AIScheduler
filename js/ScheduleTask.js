import express from "express";
import session from "express-session";
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
const port = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// app.use(cors()); // CORSを有効にする
app.use(
  cors({
    origin: [
      "http://localhost:5173", // ✅ クライアントのURLを指定
      "https://aischeduler-bqdagmcwh2g0bqfn.japaneast-01.azurewebsites.net/",
    ],
    credentials: true, // ✅ セッション維持のため必須
  })
);
// `dist` フォルダの静的ファイルを提供
//app.use(express.static(path.join(__dirname, "dist")));
app.use(express.static(path.join(__dirname, "wwwroot", "dist")));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === "production", // 本番環境なら true
      httpOnly: true,
      sameSite: "None",
    },
  })
);

// すべてのルートを `index.html` にリダイレクト
// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "dist", "index.html"));
// });
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "wwwroot", "dist", "index.html"));
});
// JSONスキーマ
const taskOutputSchema = {
  type: "object",
  properties: {
    tasks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          year: {
            type: "integer",
          },
          month: {
            type: "integer",
          },
          day: {
            type: "integer",
          },
          StartMinutes: {
            type: "integer",
          },
          EndMinutes: {
            type: "integer",
          },
        },
        required: ["year", "month", "day", "StartMinutes", "EndMinutes"],
        additionalProperties: false,
      },
    },
  },
  required: ["tasks"],
  additionalProperties: false,
};

const predictTaskTime = async (taskInput, OtherSchedule) => {
  //スケジュールがいくつあるか分からないので、map関数を使って文字列に変換
  const scheduleString = OtherSchedule.schedule
    .map((item) => {
      return `${item.year}/${item.month}/${item.day} ${item.startTime} - ${item.endTime}`;
    })
    .join(", ");

  //OpenAI APIの呼び出し
  const completion = await client.beta.chat.completions.parse({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant. Allocate the given task without overlapping with the existing schedule.",
      },
      {
        role: "user",
        content: `This task:${taskInput.title}, ${taskInput.description} is expected to take about ${taskInput.taskDuration} minutes. When should I start and how many minutes should I work?
        Do not schedule tasks between 0 mimutes and ${taskInput.noTaskUntilHour}mimutes.
        If a ${taskInput.taskDuration} minutes is more than 240 minutes, please split it and create break times in between.
        Please ensure the total of TaskDuration is ${taskInput.taskDuration}.
        Ensure the task does not overlap with these scheduled plans :${scheduleString}.
        Please output the start time in minutes (e.g., for 12:00, output 720).
        this period is from today's date:${taskInput.year}/${taskInput.month}/${taskInput.day} to the deadline:${taskInput.deadline.year}/${taskInput.deadline.month}/${taskInput.deadline.day}.`,
        //旧案
        // content: `
        //   This task:${taskInput.title}, ${taskInput.description} is expected to take about ${taskInput.taskDuration} minutes.
        //   Please allocate the task on days without any scheduled plans from today's date:${taskInput.year}/${taskInput.month}/${taskInput.day} to the deadline:${taskInput.deadline.year}/${taskInput.deadline.month}/${taskInput.deadline.day} .
        //   Ensure the task does not overlap with these scheduled plans :${scheduleString}.
        //   Please output the start time in minutes from midnight (e.g., for 12:00, output 720).
        //   Make sure to find time slots that are free.`,
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
  console.log(`サーバーが起動しました! http://localhost:${port}`);
});
const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
];
// Google API 設定
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI ||
    "https://aischeduler-bqdagmcwh2g0bqfn.japaneast-01.azurewebsites.net/auth/callback"
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
    // 🔹 セッションに保存
    req.session.accessToken = tokens.access_token;
    req.session.refreshToken = tokens.refresh_token;
    req.session.tokenExpiry =
      Date.now() +
      (tokens.expiry_date
        ? tokens.expiry_date - Date.now()
        : tokens.expires_in * 1000);
    // 🔹 トークンをフロントエンドに渡す
    // res.redirect(
    //   `http://localhost:5173?token=${tokens.access_token}&refreshToken=${
    //     tokens.refresh_token || ""
    //   }&expiry=${expiryTime}`
    // );
    res.redirect(
      "https://aischeduler-bqdagmcwh2g0bqfn.japaneast-01.azurewebsites.net"
    );
  } catch (error) {
    console.error("❌ 認証エラー:", error);
    res.send("認証に失敗しました");
  }
});

// 🔹 フロントエンドが `access_token` を取得する API
app.get("/get-token", (req, res) => {
  console.log("🔍 セッションの状態:", req.session);
  if (!req.session.accessToken) {
    return res.status(401).json({ error: "ログインが必要です" });
  }

  res.json({
    accessToken: req.session.accessToken,
    refreshToken: req.session.refreshToken,
    expiry: req.session.tokenExpiry,
  });
});

// 🔹 `refresh_token` を使って `access_token` を更新する API
app.post("/refresh-token", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(400).json({ error: "リフレッシュトークンがありません" });

  try {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await oauth2Client.refreshAccessToken();

    console.log("🔄 新しいアクセストークン:", credentials.access_token);
    res.json({
      accessToken: credentials.access_token,
      expiry: credentials.expiry_date,
    });
  } catch (error) {
    console.error("❌ トークンリフレッシュエラー:", error);
    res.status(500).json({ error: "トークンの更新に失敗しました" });
  }
});

// ログアウト時にセッションを削除
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("❌ セッション削除エラー:", err);
      return res.status(500).json({ error: "ログアウトに失敗しました" });
    }
    res.clearCookie("connect.sid"); // 🔹 セッションIDのクッキーを削除
    res.json({ message: "ログアウト成功" });
  });
});

// Google カレンダーに予定を追加
app.post("/addGoogleCalendar", async (req, res) => {
  const { token, event } = req.body;
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

app.post("/getGoogleCalendarEvents", async (req, res) => {
  const { token } = req.body;

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

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: pastSixMonth.toISOString(),
      timeMax: nextYear.toISOString(),
      maxResults: 100,
      singleEvents: true,
      orderBy: "startTime",
    });

    res.json({ events: response.data.items }); // 取得した予定をフロントエンドに返す
  } catch (error) {
    console.error("❌ Google カレンダーの予定取得エラー:", error);
    res.status(500).json({ error: error.message });
  }
});
