const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const SETTINGS_PATH = path.join(ROOT, "telegram-settings.json");
const DEFAULT_SEND_HOUR = 6;
const DEFAULT_LOCATION = "경기도 군포시 한세로 30 한세대학교";
const DEFAULT_LATITUDE = 37.34494;
const DEFAULT_LONGITUDE = 126.95336;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

const weatherProfiles = [
  {
    id: "sunny",
    label: "맑고 밝은 날씨",
    matches(weather) {
      return weather.code === 0 && weather.temperature >= 18;
    },
    queries: ["sunny day songs", "drive playlist official", "feel good kpop official", "spring sunshine music"],
    fallbackTracks: [
      ["NewJeans - Super Shy", "NewJeans", "ArmDp-zijuc"],
      ["Dua Lipa - Levitating", "Dua Lipa", "TUVcZfQe-Kw"],
      ["태연 - Weekend", "태연", "RmuL-BPFi2Q"],
      ["Surfaces - Sunday Best", "Surfaces", "1Cg6TQy7Gf0"],
      ["SEVENTEEN - _WORLD", "SEVENTEEN", "VCDWg0ljbFQ"],
      ["STAYC - Teddy Bear", "STAYC", "SxHmoifp0oQ"],
      ["볼빨간사춘기 - 여행", "볼빨간사춘기", "xRbPAVnqtcs"],
      ["NCT DREAM - Candy", "NCT DREAM", "zuoSn3ObMz4"],
      ["Red Velvet - Power Up", "Red Velvet", "aiHSVQy9xN8"],
      ["George Ezra - Shotgun", "George Ezra", "aAiVsqfbn5g"],
      ["10CM - 폰서트", "10CM", "k2pBOxgSxs0"],
      ["DAY6 - 한 페이지가 될 수 있게", "DAY6", "vnS_jn2uibs"]
    ]
  },
  {
    id: "rainy",
    label: "비 오는 감성 날씨",
    matches(weather) {
      return [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(weather.code);
    },
    queries: ["rainy day songs official", "비 오는 날 노래 official", "rainy night playlist", "k-rnb rainy songs"],
    fallbackTracks: [
      ["헤이즈 - 비도 오고 그래서", "헤이즈", "afxLaQiLu-o"],
      ["Epik High - 우산", "Epik High", "NIPtyAKxlRs"],
      ["Lauv - Paris in the Rain", "Lauv", "kOCkne-Bku4"],
      ["IU - Love poem", "IU", "OcVmaIlHZ1o"],
      ["백예린 - Square", "백예린", "4iFP_wd6QU8"],
      ["DEAN - instagram", "DEAN", "wKyMIrBClYw"],
      ["Colde - WA-R-R", "Colde", "m_jr3oFhQwQ"],
      ["검정치마 - Everything", "검정치마", "Aq_gsctWHtQ"],
      ["Joji - Slow Dancing in the Dark", "Joji", "K3Qzzggn--s"],
      ["offonoff - bath", "offonoff", "AXT42S2bs7k"],
      ["혁오 - Tomboy", "혁오", "pC6tPEaAiYU"],
      ["Sam Kim - Seattle", "Sam Kim", "Pxu1zHqh2g4"]
    ]
  },
  {
    id: "snowy",
    label: "차갑고 고요한 겨울 날씨",
    matches(weather) {
      return [71, 73, 75, 77, 85, 86].includes(weather.code) || weather.temperature <= 2;
    },
    queries: ["winter songs official", "첫눈 노래 official", "snowy day playlist", "korean winter songs"],
    fallbackTracks: [
      ["EXO - First Snow", "EXO", "h0b4nw7NDhA"],
      ["백아 - 첫사랑", "백아", "rboiHxBqdZk"],
      ["성시경 - 거리에서", "성시경", "ccLQ9QW6jN8"],
      ["Ariana Grande - Santa Tell Me", "Ariana Grande", "nlR0MkrRklg"],
      ["BTS - Spring Day", "BTS", "xEeFrLSkMm8"],
      ["DAY6 - You Were Beautiful", "DAY6", "BS7tz2rAOSA"],
      ["Mitski - My Love Mine All Mine", "Mitski", "vNf2lK4zVqk"],
      ["Laufey - From The Start", "Laufey", "lSD_L-xic9o"],
      ["AKMU - 어떻게 이별까지 사랑하겠어, 널 사랑하는 거지", "AKMU", "m3DZsBw5bnE"],
      ["Joji - Glimpse of Us", "Joji", "NgsWGfUlwJI"],
      ["폴킴 - 비", "폴킴", "r3x4I-kgEW4"],
      ["적재 - 별 보러 가자", "적재", "AZv6Cw0R2aQ"]
    ]
  },
  {
    id: "cloudy",
    label: "흐리고 부드러운 날씨",
    matches(weather) {
      return [1, 2, 3, 45, 48].includes(weather.code);
    },
    queries: ["cloudy day songs official", "흐린 날 감성 노래", "indie mellow songs", "late afternoon playlist"],
    fallbackTracks: [
      ["이소라 - 바람이 분다", "이소라", "OI6-D0VfQ8s"],
      ["SURL - Dry Flower", "SURL", "gnm7VTl96MM"],
      ["Men I Trust - Show Me How", "Men I Trust", "OZRYzH0Q0pU"],
      ["The 1975 - Somebody Else", "The 1975", "Bimd2nZirT4"],
      ["Wave to Earth - bad", "Wave to Earth", "6Q5xqNkCk7w"],
      ["Keshi - beside you", "Keshi", "uTuuz__8B1U"],
      ["HONNE - Day 1", "HONNE", "hWOB5QYcmh0"],
      ["Crush - Beautiful", "Crush", "W0cs6ciCt_k"],
      ["The Volunteers - Summer", "The Volunteers", "8uR1X6G9s4s"],
      ["OOHYO - Dandelion", "OOHYO", "qrXQ8d6mL5Y"],
      ["Phoenix - Lisztomania", "Phoenix", "4BJDNw7o6so"],
      ["FKJ - Ylang Ylang", "FKJ", "EfgAd6iHApE"]
    ]
  },
  {
    id: "windy",
    label: "바람이 강한 날씨",
    matches(weather) {
      return weather.windSpeed >= 20;
    },
    queries: ["walking playlist official", "windy day songs", "city pop drive songs", "산책 음악 official"],
    fallbackTracks: [
      ["OOHYO - Dandelion", "OOHYO", "qrXQ8d6mL5Y"],
      ["적재 - 별 보러 가자", "적재", "AZv6Cw0R2aQ"],
      ["Dayglow - Can I Call You Tonight?", "Dayglow", "hh1WeQxfCX0"],
      ["Phoenix - Lisztomania", "Phoenix", "4BJDNw7o6so"],
      ["Phum Viphurit - Lover Boy", "Phum Viphurit", "8HnLRrQ3RS4"],
      ["Post Malone - Circles", "Post Malone", "wXhTHyIgQ_U"],
      ["태연 - Weekend", "태연", "RmuL-BPFi2Q"],
      ["LE SSERAFIM - ANTIFRAGILE", "LE SSERAFIM", "pyf8cbqyfPs"],
      ["Stray Kids - MANIAC", "Stray Kids", "OvioeS1ZZ7o"],
      ["ITZY - WANNABE", "ITZY", "fE2h3lGlOsk"],
      ["DPR LIVE - Jasmine", "DPR LIVE", "Jg9NbDizoPM"],
      ["The Weeknd - Blinding Lights", "The Weeknd", "4NRXx6U8ABQ"]
    ]
  }
];

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function sendFile(response, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  fs.readFile(filePath, (error, data) => {
    if (error) {
      sendJson(response, 404, { error: "File not found" });
      return;
    }

    response.writeHead(200, { "Content-Type": contentType });
    response.end(data);
  });
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body too large"));
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function uniqueBy(items, getKey) {
  const seen = new Set();
  const result = [];
  items.forEach((item) => {
    const key = getKey(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  });
  return result;
}

function shuffleArray(items) {
  const cloned = [...items];
  for (let index = cloned.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [cloned[index], cloned[swapIndex]] = [cloned[swapIndex], cloned[index]];
  }
  return cloned;
}

function safeTitle(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value.runs)) return value.runs.map((item) => item.text).join("");
  return value.simpleText || "";
}

function extractInitialData(html) {
  const markers = ["var ytInitialData = ", "window[\"ytInitialData\"] = ", "ytInitialData = "];
  for (const marker of markers) {
    const startIndex = html.indexOf(marker);
    if (startIndex === -1) continue;
    let index = startIndex + marker.length;
    let depth = 0;
    let inString = false;
    let escaped = false;
    let started = false;
    for (; index < html.length; index += 1) {
      const char = html[index];
      if (!started) {
        if (char === "{") {
          started = true;
          depth = 1;
        }
        continue;
      }
      if (inString) {
        if (escaped) escaped = false;
        else if (char === "\\") escaped = true;
        else if (char === "\"") inString = false;
        continue;
      }
      if (char === "\"") {
        inString = true;
        continue;
      }
      if (char === "{") depth += 1;
      else if (char === "}") {
        depth -= 1;
        if (depth === 0) {
          return JSON.parse(html.slice(startIndex + marker.length, index + 1));
        }
      }
    }
  }
  throw new Error("ytInitialData not found");
}

function collectVideoRenderers(node, result = []) {
  if (!node || typeof node !== "object") return result;
  if (node.videoRenderer) result.push(node.videoRenderer);
  if (Array.isArray(node)) {
    node.forEach((item) => collectVideoRenderers(item, result));
    return result;
  }
  Object.values(node).forEach((value) => collectVideoRenderers(value, result));
  return result;
}

function parseVideosFromHtml(html, rankOffset) {
  const renderers = collectVideoRenderers(extractInitialData(html));
  return renderers.map((videoRenderer, index) => ({
    videoId: videoRenderer.videoId,
    title: safeTitle(videoRenderer.title),
    artist: safeTitle(videoRenderer.ownerText),
    lengthText: safeTitle(videoRenderer.lengthText),
    searchRank: rankOffset + index
  })).filter((item) => item.videoId && item.title);
}

function parseTimeLabelToSeconds(value) {
  if (!value) return 0;
  const parts = value.split(":").map(Number);
  if (parts.some(Number.isNaN)) return 0;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

function isLikelySong(video) {
  const title = (video.title || "").toLowerCase();
  const blockedWords = ["shorts", "reaction", "interview", "teaser", "trailer", "karaoke", "cover", "fancam", "fan cam", "playlist"];
  if (blockedWords.some((word) => title.includes(word))) return false;
  const duration = parseTimeLabelToSeconds(video.lengthText || "");
  return duration >= 100 && duration <= 540;
}

function scoreVideo(video, themeLabel) {
  const title = video.title.toLowerCase();
  let score = 20 - video.searchRank + Math.random() * 5;
  if (title.includes("official")) score += 3;
  if (title.includes("mv") || title.includes("music video")) score += 2;
  if (title.includes(themeLabel.split(" ")[0])) score += 1;
  return score;
}

async function searchYoutube(query, rankOffset) {
  const params = new URLSearchParams({
    search_query: query,
    sp: "EgIQAQ%253D%253D"
  });
  const response = await fetch(`https://www.youtube.com/results?${params.toString()}`, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7"
    }
  });
  if (!response.ok) {
    throw new Error(`YouTube request failed: ${response.status}`);
  }
  const html = await response.text();
  return parseVideosFromHtml(html, rankOffset);
}

async function geocodeLocation(location) {
  const params = new URLSearchParams({
    name: location,
    count: "1",
    language: "ko",
    countryCode: "KR"
  });
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`);
  if (!response.ok) throw new Error("지역 정보를 찾지 못했습니다.");
  const payload = await response.json();
  const result = payload.results?.[0];
  if (!result) throw new Error("입력한 지역의 좌표를 찾지 못했습니다.");
  return {
    latitude: result.latitude,
    longitude: result.longitude,
    location: [result.name, result.admin1].filter(Boolean).join(" ")
  };
}

async function fetchWeatherFromCoords(latitude, longitude) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation_probability",
    timezone: "Asia/Seoul"
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  if (!response.ok) throw new Error("날씨 정보를 가져오지 못했습니다.");
  const payload = await response.json();
  return payload.current;
}

function describeWeatherCode(code) {
  const labels = {
    0: "맑음",
    1: "대체로 맑음",
    2: "부분적으로 흐림",
    3: "흐림",
    45: "안개",
    48: "서리 안개",
    51: "약한 이슬비",
    53: "이슬비",
    55: "강한 이슬비",
    61: "약한 비",
    63: "비",
    65: "강한 비",
    71: "약한 눈",
    73: "눈",
    75: "강한 눈",
    77: "싸락눈",
    80: "소나기",
    81: "강한 소나기",
    82: "매우 강한 소나기",
    85: "약한 눈 소나기",
    86: "강한 눈 소나기",
    95: "뇌우"
  };
  return labels[code] || "변화가 많은 날씨";
}

function pickWeatherProfile(weather) {
  return weatherProfiles.find((profile) => profile.matches(weather)) || weatherProfiles[3];
}

function buildFallbackTracks(profile) {
  return shuffleArray(profile.fallbackTracks).slice(0, 12).map(([title, artist, videoId]) => ({ title, artist, videoId }));
}

async function buildPlaylistForWeather(weather) {
  const profile = pickWeatherProfile(weather);
  const searchResults = await Promise.all(
    profile.queries.map((query, index) => searchYoutube(query, index * 10).catch(() => []))
  );

  const candidates = uniqueBy(searchResults.flat(), (item) => item.videoId)
    .filter(isLikelySong)
    .map((video) => ({ ...video, score: scoreVideo(video, profile.label) }))
    .sort((a, b) => b.score - a.score);

  const artistCount = new Map();
  const chosen = [];
  candidates.forEach((video) => {
    if (chosen.length >= 12) return;
    const artistKey = (video.artist || "").toLowerCase();
    const count = artistCount.get(artistKey) || 0;
    if (count >= 2) return;
    artistCount.set(artistKey, count + 1);
    chosen.push({ title: video.title, artist: video.artist, videoId: video.videoId });
  });

  const merged = uniqueBy([...chosen, ...buildFallbackTracks(profile)], (track) => track.videoId).slice(0, 12);
  return {
    theme: profile.label,
    artists: [...new Set(merged.map((track) => track.artist))].slice(0, 5),
    tracks: merged
  };
}

async function resolveWeatherPayload(payload = {}) {
  const latitude = DEFAULT_LATITUDE;
  const longitude = DEFAULT_LONGITUDE;
  const resolvedLocation = DEFAULT_LOCATION;

  const current = await fetchWeatherFromCoords(latitude, longitude);
  const weather = {
    location: resolvedLocation || "현재 위치",
    temperature: current.temperature_2m,
    apparentTemperature: current.apparent_temperature,
    precipitationProbability: current.precipitation_probability ?? 0,
    windSpeed: current.wind_speed_10m,
    code: current.weather_code,
    description: describeWeatherCode(current.weather_code)
  };

  const playlist = await buildPlaylistForWeather(weather);
  return { weather, playlist };
}

function normalizeTelegramSettings(raw = {}) {
  return {
    chatId: typeof raw.chatId === "string" ? raw.chatId.trim() : "",
    botToken: typeof raw.botToken === "string" ? raw.botToken.trim() : "",
    location: typeof raw.location === "string" ? raw.location.trim() : DEFAULT_LOCATION,
    enabled: Boolean(raw.enabled),
    lastSentDate: typeof raw.lastSentDate === "string" ? raw.lastSentDate : ""
  };
}

function readTelegramSettings() {
  try {
    const raw = fs.readFileSync(SETTINGS_PATH, "utf8");
    return normalizeTelegramSettings(JSON.parse(raw));
  } catch {
    return normalizeTelegramSettings({});
  }
}

function writeTelegramSettings(settings) {
  const normalized = normalizeTelegramSettings(settings);
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(normalized, null, 2), "utf8");
  return normalized;
}

function validateTelegramSettings(settings, { requireEnabledFields = false } = {}) {
  if (!settings.chatId) {
    throw new Error("텔레그램 Chat ID를 입력해 주세요.");
  }
  if (!settings.botToken) {
    throw new Error("텔레그램 Bot Token을 입력해 주세요.");
  }
  if (requireEnabledFields && !settings.location) {
    throw new Error("자동 전송 지역을 입력해 주세요.");
  }
}

function getSeoulParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  const parts = formatter.formatToParts(date);
  const lookup = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return {
    year: lookup.year,
    month: lookup.month,
    day: lookup.day,
    hour: lookup.hour,
    minute: lookup.minute,
    second: lookup.second,
    dateKey: `${lookup.year}-${lookup.month}-${lookup.day}`
  };
}

function getNextRunLabel() {
  const now = getSeoulParts();
  const currentMinutes = Number(now.hour) * 60 + Number(now.minute);
  const sendMinutes = DEFAULT_SEND_HOUR * 60;
  const isTomorrow = currentMinutes >= sendMinutes;
  const base = new Date();
  base.setUTCDate(base.getUTCDate() + (isTomorrow ? 1 : 0));
  const dayParts = getSeoulParts(base);
  return `${dayParts.year}-${dayParts.month}-${dayParts.day} 06:00 (Asia/Seoul)`;
}

function buildTelegramMessage({ weather, playlist }) {
  const lines = [
    "오늘의 날씨 추천",
    "",
    `지역: ${weather.location}`,
    `날씨: ${weather.description}`,
    `기온: ${weather.temperature}°C (체감 ${weather.apparentTemperature}°C)`,
    `강수 확률: ${weather.precipitationProbability}%`,
    `풍속: ${weather.windSpeed}km/h`,
    "",
    `추천 테마: ${playlist.theme}`,
    "추천 곡:"
  ];

  playlist.tracks.slice(0, 8).forEach((track, index) => {
    lines.push(`${index + 1}. ${track.title} - ${track.artist}`);
  });

  const firstTrack = playlist.tracks[0];
  if (firstTrack) {
    lines.push("");
    lines.push(`유튜브 바로가기: https://www.youtube.com/watch?v=${firstTrack.videoId}`);
  }

  return lines.join("\n");
}

async function sendTelegramPlaylist(settings) {
  validateTelegramSettings(settings, { requireEnabledFields: true });
  const payload = await resolveWeatherPayload({
    latitude: DEFAULT_LATITUDE,
    longitude: DEFAULT_LONGITUDE,
    location: DEFAULT_LOCATION
  });
  const message = buildTelegramMessage(payload);

  const response = await fetch(`https://api.telegram.org/bot${settings.botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: settings.chatId,
      text: message
    })
  });

  const telegramResult = await response.json().catch(() => ({}));
  if (!response.ok || telegramResult.ok === false) {
    throw new Error(telegramResult.description || "텔레그램 전송에 실패했습니다.");
  }

  return payload;
}

async function handleWeatherPlaylist(request, response) {
  try {
    const body = await readRequestBody(request);
    const payload = JSON.parse(body || "{}");
    const result = await resolveWeatherPayload(payload);
    sendJson(response, 200, result);
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
}

function handleTelegramSettingsGet(response) {
  const settings = readTelegramSettings();
  sendJson(response, 200, {
    ...settings,
    nextRunLabel: getNextRunLabel()
  });
}

async function handleTelegramSettingsSave(request, response) {
  try {
    const body = await readRequestBody(request);
    const payload = JSON.parse(body || "{}");
    const settings = normalizeTelegramSettings(payload);
    if (settings.enabled) {
      validateTelegramSettings(settings, { requireEnabledFields: true });
    }
    writeTelegramSettings(settings);
    sendJson(response, 200, {
      ok: true,
      message: settings.enabled
        ? `자동 전송을 저장했습니다. 다음 전송 시각은 ${getNextRunLabel()}입니다.`
        : "텔레그램 설정을 저장했습니다. 자동 전송은 꺼져 있습니다."
    });
  } catch (error) {
    sendJson(response, 400, { error: error.message });
  }
}

async function handleTelegramSendNow(request, response) {
  try {
    const body = await readRequestBody(request);
    const payload = JSON.parse(body || "{}");
    const settings = normalizeTelegramSettings(payload);
    validateTelegramSettings(settings, { requireEnabledFields: true });
    await sendTelegramPlaylist(settings);
    sendJson(response, 200, {
      ok: true,
      message: "텔레그램으로 테스트 전송을 완료했습니다."
    });
  } catch (error) {
    sendJson(response, 400, { error: error.message });
  }
}

async function runScheduledTelegramJob() {
  const settings = readTelegramSettings();
  if (!settings.enabled) {
    return;
  }

  const now = getSeoulParts();
  if (Number(now.hour) !== DEFAULT_SEND_HOUR || Number(now.minute) !== 0) {
    return;
  }
  if (settings.lastSentDate === now.dateKey) {
    return;
  }

  try {
    await sendTelegramPlaylist(settings);
    writeTelegramSettings({
      ...settings,
      lastSentDate: now.dateKey
    });
    console.log(`[telegram] Scheduled message sent for ${now.dateKey}`);
  } catch (error) {
    console.error(`[telegram] Scheduled send failed: ${error.message}`);
  }
}

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === "POST" && requestUrl.pathname === "/api/weather-playlist") {
    handleWeatherPlaylist(request, response);
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/api/telegram-settings") {
    handleTelegramSettingsGet(response);
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/telegram-settings") {
    handleTelegramSettingsSave(request, response);
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/telegram-send-now") {
    handleTelegramSendNow(request, response);
    return;
  }

  if (request.method !== "GET") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  const pathname = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const resolvedPath = path.normalize(path.join(ROOT, pathname));
  if (!resolvedPath.startsWith(ROOT)) {
    sendJson(response, 403, { error: "Forbidden" });
    return;
  }
  sendFile(response, resolvedPath);
});

setInterval(() => {
  runScheduledTelegramJob().catch((error) => {
    console.error(`[telegram] Scheduler error: ${error.message}`);
  });
}, 30 * 1000);

server.listen(PORT, () => {
  console.log(`WeatherCast server listening on http://localhost:${PORT}`);
  console.log("[telegram] Scheduler enabled. Daily send time: 06:00 Asia/Seoul");
});
