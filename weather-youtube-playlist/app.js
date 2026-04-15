const DEFAULT_LOCATION = "경기도 군포시 한세로 30 한세대학교";
const DEFAULT_LATITUDE = 37.34494;
const DEFAULT_LONGITUDE = 126.95336;
const quickLocations = [DEFAULT_LOCATION, "군포", "안양", "수원", "성남", "서울", "제주"];

const locationInput = document.querySelector("#locationInput");
const quickTags = document.querySelector("#quickTags");
const detectButton = document.querySelector("#detectButton");
const recommendButton = document.querySelector("#recommendButton");
const statusMessage = document.querySelector("#statusMessage");
const weatherSummary = document.querySelector("#weatherSummary");
const weatherMeta = document.querySelector("#weatherMeta");
const moodSummary = document.querySelector("#moodSummary");
const artistSummary = document.querySelector("#artistSummary");
const playlistLabel = document.querySelector("#playlistLabel");
const playlistItems = document.querySelector("#playlistItems");
const youtubePlayer = document.querySelector("#youtubePlayer");
const openYoutubeButton = document.querySelector("#openYoutubeButton");
const copyPlaylistButton = document.querySelector("#copyPlaylistButton");

const telegramChatIdInput = document.querySelector("#telegramChatIdInput");
const telegramBotTokenInput = document.querySelector("#telegramBotTokenInput");
const telegramEnabledInput = document.querySelector("#telegramEnabledInput");
const saveTelegramButton = document.querySelector("#saveTelegramButton");
const sendTelegramNowButton = document.querySelector("#sendTelegramNowButton");
const telegramStatusMessage = document.querySelector("#telegramStatusMessage");

let currentPlaylist = [];
let currentPlaylistUrl = "";

function renderQuickTags() {
  quickLocations.forEach((value) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tag-button";
    button.textContent = value;
    button.addEventListener("click", () => {
      locationInput.value = value;
      generatePlaylist();
    });
    quickTags.appendChild(button);
  });
}

function buildWeatherText(weather) {
  return `${weather.location} · ${weather.description}`;
}

function buildWeatherMeta(weather) {
  return `기온 ${weather.temperature}°C · 체감 ${weather.apparentTemperature}°C · 강수 ${weather.precipitationProbability}% · 풍속 ${weather.windSpeed}km/h`;
}

function buildYoutubeEmbedUrl(tracks) {
  if (!tracks.length) {
    return "https://www.youtube.com/embed?rel=0";
  }

  const [first, ...rest] = tracks;
  const params = new URLSearchParams({ autoplay: "0", rel: "0", playsinline: "1" });
  if (rest.length) {
    params.set("playlist", rest.map((track) => track.videoId).join(","));
  }
  return `https://www.youtube.com/embed/${first.videoId}?${params.toString()}`;
}

function buildYoutubeWatchUrl(tracks) {
  if (!tracks.length) {
    return "";
  }

  const [first, ...rest] = tracks;
  const params = new URLSearchParams({ v: first.videoId });
  if (rest.length) {
    params.set("playlist", rest.map((track) => track.videoId).join(","));
  }
  return `https://www.youtube.com/watch?${params.toString()}`;
}

function renderPlaylist(payload) {
  const { weather, playlist } = payload;
  currentPlaylist = playlist.tracks;
  currentPlaylistUrl = buildYoutubeWatchUrl(playlist.tracks);

  weatherSummary.textContent = buildWeatherText(weather);
  weatherMeta.textContent = buildWeatherMeta(weather);
  moodSummary.textContent = playlist.theme;
  artistSummary.textContent = playlist.artists.join(", ");
  playlistLabel.textContent = `${playlist.tracks.length}곡 추천`;
  youtubePlayer.src = buildYoutubeEmbedUrl(playlist.tracks);
  playlistItems.innerHTML = "";

  playlist.tracks.forEach((track, index) => {
    const item = document.createElement("li");
    item.className = "playlist-item";
    item.innerHTML = `
      <span class="playlist-item-index">${index + 1}</span>
      <div>
        <strong class="playlist-item-title">${track.title}</strong>
        <span class="playlist-item-meta">${track.artist}</span>
      </div>
      <a class="playlist-item-link" href="https://www.youtube.com/watch?v=${track.videoId}" target="_blank" rel="noreferrer">열기</a>
    `;
    playlistItems.appendChild(item);
  });
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || "요청을 처리하지 못했습니다.");
  }
  return body;
}

async function fetchJson(url) {
  const response = await fetch(url);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || "데이터를 불러오지 못했습니다.");
  }
  return body;
}

async function fetchPlaylist(payload) {
  return postJson("/api/weather-playlist", payload);
}

async function generatePlaylist(options = {}) {
  const payload = {
    latitude: DEFAULT_LATITUDE,
    longitude: DEFAULT_LONGITUDE,
    location: DEFAULT_LOCATION
  };

  locationInput.value = DEFAULT_LOCATION;

  statusMessage.textContent = "현재 날씨를 조회하고 유튜브 플레이리스트를 구성하는 중입니다...";

  try {
    const result = await fetchPlaylist(payload);
    renderPlaylist(result);
    statusMessage.textContent = `${result.weather.location}의 현재 날씨를 기준으로 유튜브 추천을 만들었습니다.`;
  } catch (error) {
    statusMessage.textContent = error.message;
  }
}

function handleCurrentLocation() {
  locationInput.value = DEFAULT_LOCATION;
  generatePlaylist();
}

async function loadTelegramSettings() {
  try {
    const settings = await fetchJson("/api/telegram-settings");
    telegramChatIdInput.value = settings.chatId || "";
    telegramBotTokenInput.value = settings.botToken || "";
    telegramEnabledInput.checked = Boolean(settings.enabled);

    if (settings.enabled) {
      telegramStatusMessage.textContent = `자동 전송이 켜져 있습니다. 다음 전송 시각: ${settings.nextRunLabel || "매일 06:00"}`;
    }
  } catch (error) {
    telegramStatusMessage.textContent = error.message;
  }
}

async function saveTelegramSettings() {
  const payload = {
    chatId: telegramChatIdInput.value.trim(),
    botToken: telegramBotTokenInput.value.trim(),
    location: DEFAULT_LOCATION,
    enabled: telegramEnabledInput.checked
  };

  telegramStatusMessage.textContent = "텔레그램 설정을 저장하는 중입니다...";

  try {
    const result = await postJson("/api/telegram-settings", payload);
    telegramStatusMessage.textContent = result.message;
  } catch (error) {
    telegramStatusMessage.textContent = error.message;
  }
}

async function sendTelegramNow() {
  const payload = {
    chatId: telegramChatIdInput.value.trim(),
    botToken: telegramBotTokenInput.value.trim(),
    location: DEFAULT_LOCATION
  };

  telegramStatusMessage.textContent = "텔레그램으로 테스트 전송하는 중입니다...";

  try {
    const result = await postJson("/api/telegram-send-now", payload);
    telegramStatusMessage.textContent = result.message;
  } catch (error) {
    telegramStatusMessage.textContent = error.message;
  }
}

recommendButton.addEventListener("click", () => generatePlaylist());
detectButton.addEventListener("click", handleCurrentLocation);
saveTelegramButton.addEventListener("click", saveTelegramSettings);
sendTelegramNowButton.addEventListener("click", sendTelegramNow);

openYoutubeButton.addEventListener("click", () => {
  if (currentPlaylistUrl) {
    window.open(currentPlaylistUrl, "_blank", "noopener,noreferrer");
  }
});

copyPlaylistButton.addEventListener("click", async () => {
  if (!currentPlaylist.length) {
    statusMessage.textContent = "먼저 추천을 받아야 목록을 복사할 수 있습니다.";
    return;
  }

  const text = currentPlaylist
    .map((track, index) => `${index + 1}. ${track.title} - ${track.artist}`)
    .join("\n");

  try {
    await navigator.clipboard.writeText(text);
    statusMessage.textContent = "플레이리스트를 클립보드에 복사했습니다.";
  } catch {
    statusMessage.textContent = "복사에 실패했습니다. 브라우저 권한을 확인해 주세요.";
  }
});

renderQuickTags();
locationInput.value = DEFAULT_LOCATION;
loadTelegramSettings();
