
import { useCallback, useEffect, useState } from "react";
import {
  Search,
  MapPin,
  Sun,
  Moon,
  Cloud,
  CloudSun,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  Droplets,
  Wind,
  Thermometer,
  Sunrise,
  Sunset,
  Eye,
  Gauge,
  Navigation,
  LoaderCircle,
  RefreshCw,
  Umbrella,
} from "lucide-react";

const weatherTypes = {
  0: { label: "Clear sky", icon: Sun },
  1: { label: "Mainly clear", icon: CloudSun },
  2: { label: "Partly cloudy", icon: CloudSun },
  3: { label: "Overcast", icon: Cloud },
  45: { label: "Foggy", icon: CloudFog },
  48: { label: "Depositing rime fog", icon: CloudFog },
  51: { label: "Light drizzle", icon: CloudRain },
  53: { label: "Moderate drizzle", icon: CloudRain },
  55: { label: "Dense drizzle", icon: CloudRain },
  56: { label: "Freezing drizzle", icon: CloudRain },
  57: { label: "Heavy freezing drizzle", icon: CloudRain },
  61: { label: "Slight rain", icon: CloudRain },
  63: { label: "Moderate rain", icon: CloudRain },
  65: { label: "Heavy rain", icon: CloudRain },
  66: { label: "Freezing rain", icon: CloudRain },
  67: { label: "Heavy freezing rain", icon: CloudRain },
  71: { label: "Slight snowfall", icon: CloudSnow },
  73: { label: "Moderate snowfall", icon: CloudSnow },
  75: { label: "Heavy snowfall", icon: CloudSnow },
  77: { label: "Snow grains", icon: CloudSnow },
  80: { label: "Rain showers", icon: CloudRain },
  81: { label: "Moderate showers", icon: CloudRain },
  82: { label: "Violent showers", icon: CloudRain },
  85: { label: "Snow showers", icon: CloudSnow },
  86: { label: "Heavy snow showers", icon: CloudSnow },
  95: { label: "Thunderstorm", icon: CloudLightning },
  96: { label: "Thunderstorm with hail", icon: CloudLightning },
  99: { label: "Heavy thunderstorm", icon: CloudLightning },
};

const getWeather = (code, isDay = 1) => {
  const weather = weatherTypes[code] || {
    label: "Unknown conditions",
    icon: Cloud,
  };

  if (code === 0 && !isDay) {
    return { label: "Clear night", icon: Moon };
  }

  if ((code === 1 || code === 2) && !isDay) {
    return { label: "Partly cloudy night", icon: CloudMoon };
  }

  return weather;
};

const getDayName = (date, options = { weekday: "short" }) =>
  new Date(`${date}T12:00:00`).toLocaleDateString("en-US", options);

const formatTime = (date) =>
  new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

const formatHour = (date) =>
  new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    hour12: true,
  });

function WeatherIcon({ code, isDay = 1, size = 32, className = "" }) {
  const { icon: Icon } = getWeather(code, isDay);

  return (
    <Icon
      size={size}
      strokeWidth={1.6}
      className={`weather-icon ${className}`}
    />
  );
}

function App() {
  const [cityInput, setCityInput] = useState("");
  const [city, setCity] = useState({
    name: "Herat",
    country: "Afghanistan",
    latitude: 34.3529,
    longitude: 62.204,
  });
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadWeather = useCallback(async (selectedCity) => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        latitude: selectedCity.latitude,
        longitude: selectedCity.longitude,
        current:
          "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m",
        hourly: "temperature_2m,weather_code",
        daily:
          "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset",
        timezone: "auto",
        forecast_days: "5",
      });

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?${params}`
      );

      if (!response.ok) {
        throw new Error("Unable to retrieve weather data.");
      }

      const data = await response.json();

      if (!data.current || !data.daily || !data.hourly) {
        throw new Error("Weather data is incomplete. Please try again.");
      }

      setWeather(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(
        err.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWeather(city);
  }, [city, loadWeather]);

  const handleSearch = async (event) => {
    event.preventDefault();

    const query = cityInput.trim();

    if (!query) {
      setError("Please enter a city name.");
      return;
    }

    setSearching(true);
    setError("");

    try {
      const params = new URLSearchParams({
        name: query,
        count: "10",
        language: "en",
        format: "json",
      });

      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?${params}`
      );

      if (!response.ok) {
        throw new Error("City search failed. Please try again.");
      }

      const data = await response.json();

      if (!data.results?.length) {
        throw new Error(
          "City not found. Check the spelling and try again."
        );
      }

      const result = data.results[0];

      const selectedCity = {
        name: result.name,
        country: result.country || result.admin1 || "Unknown location",
        latitude: result.latitude,
        longitude: result.longitude,
      };

      setCityInput("");
      setCity(selectedCity);
      await loadWeather(selectedCity);
    } catch (err) {
      setError(err.message || "Unable to find this city.");
    } finally {
      setSearching(false);
    }
  };

  const current = weather?.current;
  const daily = weather?.daily;
  const hourly = weather?.hourly;

  const currentCondition = current
    ? getWeather(current.weather_code, current.is_day)
    : null;

  const currentHourIndex = hourly
    ? Math.max(
        0,
        hourly.time.findIndex((time) => time >= current.time)
      )
    : 0;

  const nextHours = hourly
    ? Array.from({ length: 8 }, (_, index) => {
        const hourIndex = currentHourIndex + index;

        if (hourIndex >= hourly.time.length) {
          return null;
        }

        return {
          time: hourly.time[hourIndex],
          temperature: hourly.temperature_2m[hourIndex],
          code: hourly.weather_code[hourIndex],
        };
      }).filter(Boolean)
    : [];

  const temperature = (value) => `${Math.round(value)}°`;

  return (
    <div className="weather-app relative min-h-screen overflow-hidden bg-[#090e1c] text-white selection:bg-violet-400/30">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="ambient ambient-three" />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-9 lg:px-10">
        <header className="enter mb-9 flex flex-col gap-6 sm:mb-12 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-500/15 text-violet-300 shadow-lg shadow-violet-950/20">
              <CloudSun size={28} strokeWidth={1.7} />
            </div>

            <div>
              <h1 className="text-xl font-extrabold tracking-tight">
                Atmos<span className="text-violet-400">.</span>
              </h1>
              <p className="text-xs text-slate-500">
                Weather, beautifully simple
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSearch}
            className="flex w-full max-w-md items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] p-1.5 shadow-lg shadow-black/10 sm:w-[380px]"
          >
            <Search size={19} className="ml-3 shrink-0 text-slate-400" />

            <input
              type="text"
              value={cityInput}
              onChange={(event) => setCityInput(event.target.value)}
              placeholder="Search any city..."
              aria-label="Search city"
              className="search-input min-w-0 flex-1 border-0 bg-transparent px-1 py-3 text-sm text-white placeholder:text-slate-500"
            />

            <button
              type="submit"
              disabled={searching}
              className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {searching ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                "Search"
              )}
            </button>
          </form>
        </header>

        {error && (
          <div
            role="alert"
            className="enter mb-6 flex items-center justify-between gap-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
              className="shrink-0 text-rose-200/70 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {loading && !weather ? (
          <div className="glass flex min-h-[440px] flex-col items-center justify-center rounded-[32px]">
            <LoaderCircle
              size={42}
              className="mb-5 animate-spin text-violet-400"
            />
            <p className="text-sm font-medium text-slate-300">
              Gathering weather data...
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Connecting to the forecast service
            </p>
          </div>
        ) : weather ? (
          <main className="space-y-6">
            <section className="enter relative overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-br from-[#211d45]/90 via-[#171b36]/90 to-[#101b30]/90 p-6 shadow-2xl shadow-black/20 sm:rounded-[36px] sm:p-10 lg:p-12">
              <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-sky-400/[0.08] blur-3xl" />

              <div className="relative grid items-center gap-8 md:grid-cols-[1.15fr_.85fr]">
                <div>
                  <div className="mb-7 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-3 py-2 text-xs text-slate-300">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.6)]" />
                      Current weather
                    </span>

                    {lastUpdated && (
                      <span className="text-xs text-slate-500">
                        Updated{" "}
                        {lastUpdated.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>

                  <div className="mb-2 flex items-center gap-2 text-slate-300">
                    <MapPin size={17} className="text-violet-400" />
                    <span className="text-sm">
                      {city.name}, {city.country}
                    </span>
                  </div>

                  <p className="mb-1 text-sm text-slate-500">
                    {getDayName(current.time.slice(0, 10), {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>

                  <div className="flex items-center gap-2 sm:gap-4">
                    <h2 className="text-[82px] font-semibold leading-none tracking-[-.08em] sm:text-[112px]">
                      {temperature(current.temperature_2m)}
                    </h2>

                    <div className="flex flex-col gap-2 pb-2">
                      <div className="flex items-center gap-2 text-orange-200">
                        <Thermometer size={17} />
                        <span className="text-sm">
                          Feels {temperature(current.apparent_temperature)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        Celsius · °C
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-3">
                    <WeatherIcon
                      code={current.weather_code}
                      isDay={current.is_day}
                      size={31}
                      className={
                        current.weather_code <= 2
                          ? "sun-glow text-orange-200"
                          : "rain-glow text-sky-200"
                      }
                    />
                    <div>
                      <p className="font-semibold text-white">
                        {currentCondition.label}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {current.precipitation > 0
                          ? `${current.precipitation} mm precipitation`
                          : "Have a great day ahead"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative flex min-h-[230px] items-center justify-center md:min-h-[300px]">
                  <div className="absolute h-56 w-56 rounded-full border border-white/[0.06] sm:h-72 sm:w-72" />
                  <div className="absolute h-44 w-44 rounded-full border border-white/[0.06] sm:h-56 sm:w-56" />
                  <div className="absolute h-32 w-32 rounded-full bg-violet-400/[0.08] blur-2xl sm:h-44 sm:w-44" />

                  <WeatherIcon
                    code={current.weather_code}
                    isDay={current.is_day}
                    size={145}
                    className={`relative ${
                      current.weather_code <= 2
                        ? "sun-glow text-orange-200"
                        : "rain-glow text-sky-200"
                    }`}
                  />

                  <div className="absolute bottom-0 right-0 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-md">
                    <div className="mb-1 flex items-center gap-2 text-slate-400">
                      <Wind size={14} />
                      <span className="text-xs">Wind speed</span>
                    </div>
                    <p className="text-lg font-semibold">
                      {Math.round(current.wind_speed_10m)}{" "}
                      <span className="text-xs font-normal text-slate-400">
                        km/h
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative mt-9 grid grid-cols-2 gap-3 border-t border-white/[0.08] pt-6 sm:grid-cols-4 sm:gap-4">
                {[
                  {
                    label: "Humidity",
                    value: `${current.relative_humidity_2m}%`,
                    icon: Droplets,
                    color: "text-sky-300",
                  },
                  {
                    label: "Feels like",
                    value: temperature(current.apparent_temperature),
                    icon: Thermometer,
                    color: "text-orange-200",
                  },
                  {
                    label: "Precipitation",
                    value: `${current.precipitation} mm`,
                    icon: Umbrella,
                    color: "text-indigo-300",
                  },
                  {
                    label: "Wind speed",
                    value: `${Math.round(current.wind_speed_10m)} km/h`,
                    icon: Wind,
                    color: "text-emerald-300",
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 transition hover:bg-white/[0.05] sm:p-5"
                    >
                      <Icon size={20} className={`${item.color} mb-4`} />
                      <p className="text-lg font-semibold sm:text-xl">
                        {item.value}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <div className="glass weather-card enter delay-one min-w-0 rounded-[28px] p-5 sm:p-7">
                <div className="mb-7 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold tracking-tight">
                      Hourly forecast
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Weather throughout the day
                    </p>
                  </div>

                  <div className="rounded-xl bg-violet-400/10 p-2.5 text-violet-300">
                    <Sun size={20} />
                  </div>
                </div>

                <div className="hour-scroll flex gap-3 overflow-x-auto pb-3">
                  {nextHours.map((hour, index) => (
                    <div
                      key={hour.time}
                      className={`flex min-w-[82px] flex-1 flex-col items-center rounded-2xl px-3 py-5 transition ${
                        index === 0
                          ? "border border-violet-400/25 bg-violet-500/15"
                          : "border border-white/[0.045] bg-white/[0.025] hover:bg-white/[0.06]"
                      }`}
                    >
                      <span className="text-xs text-slate-400">
                        {index === 0 ? "Now" : formatHour(hour.time)}
                      </span>

                      <WeatherIcon
                        code={hour.code}
                        isDay={
                          new Date(hour.time).getHours() >= 6 &&
                          new Date(hour.time).getHours() < 19
                            ? 1
                            : 0
                        }
                        size={27}
                        className="my-5 text-sky-200"
                      />

                      <span className="text-lg font-semibold">
                        {temperature(hour.temperature)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass weather-card enter delay-two rounded-[28px] p-5 sm:p-7">
                <div className="mb-6">
                  <h3 className="font-semibold tracking-tight">
                    Sun & daylight
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Today's solar schedule
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 rounded-2xl border border-white/[0.05] bg-white/[0.025] p-4">
                    <div className="rounded-xl bg-orange-300/10 p-3 text-orange-200">
                      <Sunrise size={23} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">Sunrise</p>
                      <p className="mt-1 font-semibold">
                        {formatTime(daily.sunrise[0])}
                      </p>
                    </div>
                    <Sun size={22} className="text-orange-200/60" />
                  </div>

                  <div className="flex items-center gap-4 rounded-2xl border border-white/[0.05] bg-white/[0.025] p-4">
                    <div className="rounded-xl bg-indigo-300/10 p-3 text-indigo-200">
                      <Sunset size={23} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">Sunset</p>
                      <p className="mt-1 font-semibold">
                        {formatTime(daily.sunset[0])}
                      </p>
                    </div>
                    <Moon size={22} className="text-indigo-200/60" />
                  </div>
                </div>
              </div>
            </section>

            <section className="glass enter delay-three rounded-[28px] p-5 sm:p-7">
              <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold tracking-tight">
                    5-day forecast
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    A look at the days ahead
                  </p>
                </div>

                <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-xs text-slate-400">
                  Next 5 days
                </span>
              </div>

              <div className="space-y-2">
                {daily.time.map((date, index) => {
                  const dayWeather = getWeather(daily.weather_code[index]);

                  return (
                    <div
                      key={date}
                      className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl border border-transparent px-3 py-4 transition hover:border-white/[0.07] hover:bg-white/[0.035] sm:grid-cols-[1fr_1fr_1fr]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-11 text-sm font-medium">
                          {index === 0 ? "Today" : getDayName(date)}
                        </span>

                        <WeatherIcon
                          code={daily.weather_code[index]}
                          size={25}
                          className={
                            daily.weather_code[index] <= 2
                              ? "text-orange-200"
                              : "text-sky-200"
                          }
                        />

                        <span className="hidden text-xs text-slate-400 sm:inline">
                          {dayWeather.label}
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-3 text-sm">
                        <span className="font-semibold">
                          {temperature(daily.temperature_2m_max[index])}
                        </span>

                        <div className="h-1.5 w-12 overflow-hidden rounded-full bg-white/10 sm:w-20">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-sky-400 to-violet-400"
                            style={{
                              width: `${
                                Math.max(
                                  12,
                                  Math.min(
                                    100,
                                    ((daily.temperature_2m_max[index] -
                                      daily.temperature_2m_min[index] +
                                      10) /
                                      30) *
                                      100
                                  )
                                )
                              }%`,
                            }}
                          />
                        </div>

                        <span className="text-slate-500">
                          {temperature(daily.temperature_2m_min[index])}
                        </span>
                      </div>

                      <span className="hidden text-right text-xs text-slate-500 sm:block">
                        {index === 0 ? "Current day" : "Daily outlook"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            <footer className="enter delay-four flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] py-6 text-center sm:flex-row sm:text-left">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                <CloudSun size={20} className="text-violet-400" />
                Atmos<span className="text-violet-400">.</span>
              </div>

              <p className="text-xs text-slate-500">
                Weather data provided by Open-Meteo
              </p>

              <button
                type="button"
                onClick={() => loadWeather(city)}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-xs font-medium text-slate-300 transition hover:border-violet-400/40 hover:bg-violet-400/10 disabled:opacity-50"
              >
                <RefreshCw
                  size={14}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh weather
              </button>
            </footer>
          </main>
        ) : (
          <div className="glass flex min-h-[350px] flex-col items-center justify-center rounded-[30px] p-8 text-center">
            <Cloud size={48} className="mb-5 text-slate-500" />
            <h2 className="text-xl font-semibold">Weather unavailable</h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-slate-400">
              Check your internet connection and try loading the weather again.
            </p>
            <button
              type="button"
              onClick={() => loadWeather(city)}
              className="mt-6 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold transition hover:bg-violet-500"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
