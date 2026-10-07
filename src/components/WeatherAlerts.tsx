import { useMemo, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  Bell,
  Check,
  Cloud,
  ChevronDown,
  ClipboardList,
  Clock3,
  CloudLightning,
  CloudRain,
  CloudSun,
  Droplets,
  MapPin,
  Plus,
  Search,
  Send,
  ShieldAlert,
  Sun,
  Thermometer,
  Wind,
  X,
} from 'lucide-react';
import './WeatherAlerts.css';

type AlertStatus = 'Draft' | 'Active' | 'Expired' | 'Acknowledged';
type AlertSeverity = 'High' | 'Moderate' | 'Low';
type AlertKind = 'Heavy rain' | 'Flooding' | 'Drought' | 'Crop-risk advisory' | 'Other';

interface WeatherAlert {
  id: string;
  title: string;
  type: AlertKind;
  locations: string;
  severity: AlertSeverity;
  issuedAt: string;
  expiresAt: string;
  source: string;
  sourceKind: 'Official source' | 'Staff-entered note';
  status: AlertStatus;
  action: string;
}

const dateTimeOffset = (days: number, hour: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const initialAlerts: WeatherAlert[] = [
  {
    id: 'WA-2026-003',
    title: 'Heavy rain preparedness reminder',
    type: 'Heavy rain',
    locations: 'Sample Barangay A, Sample Barangay B',
    severity: 'Moderate',
    issuedAt: dateTimeOffset(-1, 9),
    expiresAt: dateTimeOffset(2, 18),
    source: 'Sample admin note — no official warning feed connected',
    sourceKind: 'Staff-entered note',
    status: 'Active',
    action: 'Sample guidance: check drainage and secure farm tools. Confirm conditions with the appropriate local or official source.',
  },
  {
    id: 'WA-2026-002',
    title: 'Water conservation notice',
    type: 'Drought',
    locations: 'Sample Barangay C',
    severity: 'Low',
    issuedAt: dateTimeOffset(-4, 8),
    expiresAt: dateTimeOffset(-1, 18),
    source: 'Sample admin note — no official warning feed connected',
    sourceKind: 'Staff-entered note',
    status: 'Active',
    action: 'Sample notice: review water use and report irrigation concerns to the local agriculture office.',
  },
  {
    id: 'WA-2026-001',
    title: 'Flood readiness information',
    type: 'Flooding',
    locations: 'Sample Barangay A',
    severity: 'High',
    issuedAt: dateTimeOffset(-8, 14),
    expiresAt: dateTimeOffset(1, 12),
    source: 'Sample admin note — no official warning feed connected',
    sourceKind: 'Staff-entered note',
    status: 'Acknowledged',
    action: 'Sample guidance: follow local emergency instructions and avoid flooded roads or fields.',
  },
];

const alertTypes: AlertKind[] = ['Heavy rain', 'Flooding', 'Drought', 'Crop-risk advisory', 'Other'];
const severities: AlertSeverity[] = ['High', 'Moderate', 'Low'];
const statuses: AlertStatus[] = ['Draft', 'Active', 'Expired', 'Acknowledged'];
const allFilter = 'All';

function formatDateTime(value: string) {
  if (!value) return 'Not set';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Invalid date'
    : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function currentStatus(alert: WeatherAlert): AlertStatus {
  if (alert.status === 'Active' && new Date(alert.expiresAt).getTime() < Date.now()) return 'Expired';
  return alert.status;
}

function statusClass(status: AlertStatus) {
  return `weather-status weather-status--${status.toLowerCase().replaceAll(' ', '-')}`;
}

interface GeocodingLocation {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
  admin2?: string;
  admin3?: string;
  timezone?: string;
}

interface DailyForecast {
  date: string;
  weatherCode: number;
  temperatureMax: number;
  temperatureMin: number;
  precipitationProbability: number;
  precipitation: number;
  windSpeedMax: number;
}

interface LocalForecast {
  location: GeocodingLocation;
  fetchedAt: string;
  timezone: string;
  current: {
    time: string;
    temperature: number;
    feelsLike: number;
    precipitation: number;
    windSpeed: number;
    weatherCode: number;
  };
  daily: DailyForecast[];
}

interface GeocodingResponse {
  results?: GeocodingLocation[];
}

interface ForecastResponse {
  timezone?: string;
  current?: {
    time?: string;
    temperature_2m?: number;
    apparent_temperature?: number;
    precipitation?: number;
    wind_speed_10m?: number;
    weather_code?: number;
  };
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
    precipitation_sum?: number[];
    wind_speed_10m_max?: number[];
  };
}

function weatherDescription(code: number) {
  if (code === 0) return 'Clear sky';
  if (code === 1) return 'Mainly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Fog';
  if (code >= 51 && code <= 57) return 'Drizzle';
  if (code >= 61 && code <= 67) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Rain showers';
  if (code === 85 || code === 86) return 'Snow showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Conditions unavailable';
}

function WeatherConditionIcon({ code, size = 20 }: { code: number; size?: number }) {
  if (code >= 95) return <CloudLightning aria-hidden="true" size={size} />;
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return <CloudRain aria-hidden="true" size={size} />;
  }
  if (code === 2 || code === 3 || code === 45 || code === 48) {
    return <Cloud aria-hidden="true" size={size} />;
  }
  if (code === 0 || code === 1) return <Sun aria-hidden="true" size={size} />;
  return <CloudSun aria-hidden="true" size={size} />;
}

function locationLabel(location: GeocodingLocation) {
  return [location.name, location.admin3, location.admin2, location.admin1, location.country]
    .filter((part, index, all): part is string => Boolean(part) && all.indexOf(part) === index)
    .join(', ');
}

function forecastSignals(forecast: LocalForecast) {
  const signals = forecast.daily.flatMap((day) => {
    const name = new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' });
    const items: { day: string; title: string; details: string; severity: 'High' | 'Moderate' }[] = [];
    if (day.weatherCode >= 95) {
      items.push({ day: name, title: 'Thunderstorm forecast', details: `Storm conditions forecast for ${name}.`, severity: 'High' });
    }
    if (day.precipitationProbability >= 80 && day.precipitation >= 20) {
      items.push({
        day: name,
        title: 'Heavy rainfall potential',
        details: `${day.precipitationProbability}% precipitation probability; ${day.precipitation.toFixed(1)} mm forecast.`,
        severity: 'High',
      });
    } else if (day.precipitationProbability >= 60) {
      items.push({
        day: name,
        title: 'Rain likely',
        details: `${day.precipitationProbability}% precipitation probability; ${day.precipitation.toFixed(1)} mm forecast.`,
        severity: 'Moderate',
      });
    }
    if (day.windSpeedMax >= 40) {
      items.push({ day: name, title: 'Strong winds', details: `Maximum wind forecast ${day.windSpeedMax.toFixed(0)} km/h.`, severity: 'High' });
    }
    if (day.temperatureMax >= 35) {
      items.push({ day: name, title: 'High temperature', details: `Maximum temperature forecast ${day.temperatureMax.toFixed(1)}°C.`, severity: 'High' });
    } else if (day.temperatureMax >= 33) {
      items.push({ day: name, title: 'Hot conditions', details: `Maximum temperature forecast ${day.temperatureMax.toFixed(1)}°C.`, severity: 'Moderate' });
    }
    return items;
  });
  return signals.slice(0, 5);
}

function WeatherLookup() {
  const [query, setQuery] = useState('');
  const [locations, setLocations] = useState<GeocodingLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<GeocodingLocation | null>(null);
  const [forecast, setForecast] = useState<LocalForecast | null>(null);
  const [loading, setLoading] = useState<'search' | 'forecast' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const searchLocation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const searchTerm = query.trim();
    if (searchTerm.length < 2) {
      setError('Enter at least two characters for a town, municipality, or city.');
      return;
    }
    setLoading('search');
    setError(null);
    setLocations([]);
    setSelectedLocation(null);
    setForecast(null);
    try {
      const params = new URLSearchParams({
        name: searchTerm,
        count: '5',
        language: 'en',
        format: 'json',
        countryCode: 'PH',
      });
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
      if (!response.ok) throw new Error(`Location search failed (${response.status}). Try again.`);
      const data: GeocodingResponse = await response.json();
      if (!data.results?.length) {
        setError('No matching Philippine place was found. Search a municipality, town, or city name.');
        return;
      }
      setLocations(data.results);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not search locations. Check your connection and try again.');
    } finally {
      setLoading(null);
    }
  };

  const loadForecast = async (location: GeocodingLocation) => {
    setSelectedLocation(location);
    setForecast(null);
    setLoading('forecast');
    setError(null);
    try {
      const params = new URLSearchParams({
        latitude: String(location.latitude),
        longitude: String(location.longitude),
        current: 'temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max',
        timezone: 'auto',
        forecast_days: '7',
      });
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
      if (!response.ok) throw new Error(`Forecast request failed (${response.status}). Try again.`);
      const data: ForecastResponse = await response.json();
      const current = data.current;
      const daily = data.daily;
      if (
        !current ||
        !daily?.time ||
        !daily.weather_code ||
        !daily.temperature_2m_max ||
        !daily.temperature_2m_min ||
        !daily.precipitation_probability_max ||
        !daily.precipitation_sum ||
        !daily.wind_speed_10m_max ||
        typeof current.temperature_2m !== 'number' ||
        typeof current.apparent_temperature !== 'number' ||
        typeof current.precipitation !== 'number' ||
        typeof current.weather_code !== 'number' ||
        typeof current.wind_speed_10m !== 'number'
      ) {
        throw new Error('The forecast provider returned incomplete weather data for this location.');
      }
      setForecast({
        location,
        fetchedAt: new Date().toISOString(),
        timezone: data.timezone ?? location.timezone ?? 'Local time',
        current: {
          time: current.time ?? new Date().toISOString(),
          temperature: current.temperature_2m,
          feelsLike: current.apparent_temperature,
          precipitation: current.precipitation,
          windSpeed: current.wind_speed_10m,
          weatherCode: current.weather_code,
        },
        daily: daily.time.map((date, index) => ({
          date,
          weatherCode: daily.weather_code?.[index] ?? -1,
          temperatureMax: daily.temperature_2m_max?.[index] ?? 0,
          temperatureMin: daily.temperature_2m_min?.[index] ?? 0,
          precipitationProbability: daily.precipitation_probability_max?.[index] ?? 0,
          precipitation: daily.precipitation_sum?.[index] ?? 0,
          windSpeedMax: daily.wind_speed_10m_max?.[index] ?? 0,
        })),
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not load the forecast. Check your connection and try again.');
    } finally {
      setLoading(null);
    }
  };

  const signals = forecast ? forecastSignals(forecast) : [];

  return (
    <section aria-labelledby="weather-local-heading" className="weather-local-card">
      <header className="weather-local-header">
        <div>
          <p className="weather-eyebrow">LOCATION-BASED FORECAST</p>
          <h2 id="weather-local-heading">Check conditions near farmers</h2>
          <p>Search a municipality or town to check current conditions and the 7-day forecast for its approximate center.</p>
        </div>
        <span className="weather-local-icon"><CloudSun size={21} /></span>
      </header>

      <form className="weather-location-search" onSubmit={searchLocation}>
        <label htmlFor="weather-location-query">Philippine municipality, town, or city</label>
        <div className="weather-location-input-row">
          <div className="weather-location-input">
            <Search aria-hidden="true" size={16} />
            <input
              id="weather-location-query"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="For example, Odiongan or Romblon"
              value={query}
            />
          </div>
          <button className="weather-button weather-button--primary" disabled={loading !== null} type="submit">
            {loading === 'search' ? 'Searching...' : 'Find location'}
          </button>
        </div>
        <p className="weather-location-privacy">Search uses a town/municipality only—do not enter a farmer's name, home address, or exact farm coordinates.</p>
      </form>

      {error && <p className="weather-lookup-error" role="alert"><AlertTriangle size={15} />{error}</p>}

      {locations.length > 0 && (
        <div aria-label="Matching locations" className="weather-location-results">
          <p>Select the correct municipality from the matching places:</p>
          {locations.map((location, index) => (
            <button
              aria-pressed={selectedLocation?.id === location.id}
              className={`weather-location-result${selectedLocation?.id === location.id ? ' weather-location-result--selected' : ''}`}
              disabled={loading !== null}
              key={location.id}
              onClick={() => loadForecast(location)}
              style={{ animationDelay: `${index * 45}ms` }}
              type="button"
            >
              <MapPin size={15} />
              <span>{locationLabel(location)}</span>
              <small>{location.latitude.toFixed(2)}, {location.longitude.toFixed(2)} · approximate area center</small>
            </button>
          ))}
        </div>
      )}

      {loading === 'forecast' && (
        <p className="weather-loading" role="status">
          <span aria-hidden="true" className="weather-loading-spinner" />
          Loading forecast for the selected municipality…
        </p>
      )}

      {forecast && (
        <div aria-live="polite" className="weather-forecast">
          <header className="weather-forecast-header">
            <div>
              <span className="weather-forecast-location"><MapPin size={15} /> {locationLabel(forecast.location)}</span>
              <p>Forecast for the municipality center · {forecast.timezone}</p>
            </div>
            <a href="https://open-meteo.com/" rel="noreferrer" target="_blank">Open-Meteo data ↗</a>
          </header>

          <div className="weather-current-conditions">
            <div className="weather-current-main">
              <WeatherConditionIcon code={forecast.current.weatherCode} size={34} />
              <div><span>Current conditions</span><strong>{forecast.current.temperature.toFixed(1)}°C</strong><span>{weatherDescription(forecast.current.weatherCode)}</span></div>
            </div>
            <div className="weather-current-metric"><Thermometer size={16} /><span>Feels like</span><strong>{forecast.current.feelsLike.toFixed(1)}°C</strong></div>
            <div className="weather-current-metric"><Droplets size={16} /><span>Precipitation now</span><strong>{forecast.current.precipitation.toFixed(1)} mm</strong></div>
            <div className="weather-current-metric"><Wind size={16} /><span>Wind</span><strong>{forecast.current.windSpeed.toFixed(1)} km/h</strong></div>
          </div>

          <section className="weather-risk-panel">
            <header>
              <AlertTriangle size={16} />
              <h3>Forecast risk indicators</h3>
              <span>Automated guidance · not an official warning</span>
              <a href="https://www.pagasa.dost.gov.ph/" rel="noreferrer" target="_blank">Verify official advisories at PAGASA ↗</a>
            </header>
            {signals.length ? (
              <ul>
                {signals.map((signal, index) => (
                  <li
                    className={`weather-risk-item weather-risk-item--${signal.severity.toLowerCase()}`}
                    key={`${signal.day}-${signal.title}-${index}`}
                    style={{ animationDelay: `${index * 45}ms` }}
                  >
                    <span>{signal.severity}</span><strong>{signal.title} · {signal.day}</strong><small>{signal.details}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="weather-no-risk">No configured rain, storm, wind, or heat thresholds were reached in this forecast. This does not guarantee safe conditions; check official local advisories.</p>
            )}
          </section>

          <section className="weather-daily-section">
            <header className="weather-daily-heading">
              <div><h3>7-day outlook</h3><p>Daily forecast · local time</p></div>
              <span>Swipe to see all days</span>
            </header>
            <div className="weather-daily-grid">
              {forecast.daily.map((day, index) => (
                <article
                  className={`weather-daily-day${index === 0 ? ' weather-daily-day--today' : ''}`}
                  key={day.date}
                  style={{ animationDelay: `${index * 65}ms` }}
                >
                  <span className="weather-daily-date">
                    {index === 0 ? 'Today' : new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' })}
                    <small>{new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</small>
                  </span>
                  <WeatherConditionIcon code={day.weatherCode} size={23} />
                  <strong className="weather-daily-condition">{weatherDescription(day.weatherCode)}</strong>
                  <div className="weather-daily-temps">{day.temperatureMax.toFixed(0)}° <span>/ {day.temperatureMin.toFixed(0)}°</span></div>
                  <small className="weather-daily-rain"><Droplets size={12} /> {day.precipitationProbability}% <span>·</span> {day.precipitation.toFixed(1)} mm</small>
                  <small className="weather-daily-wind"><Wind size={12} /> {day.windSpeedMax.toFixed(0)} km/h</small>
                </article>
              ))}
            </div>
          </section>
          <footer className="weather-forecast-source">
            Source: <a href="https://open-meteo.com/" rel="noreferrer" target="_blank">Open-Meteo forecast API</a> · Retrieved {formatDateTime(forecast.fetchedAt)}.
            Forecasts are model guidance for the approximate municipality center, not barangay-level measurements or official warnings.
          </footer>
        </div>
      )}
    </section>
  );
}

interface AlertFormProps {
  alert: WeatherAlert | null;
  onClose: () => void;
  onSave: (alert: WeatherAlert) => void;
}

function AlertForm({ alert, onClose, onSave }: AlertFormProps) {
  const [title, setTitle] = useState(alert?.title ?? '');
  const [type, setType] = useState<AlertKind>(alert?.type ?? 'Heavy rain');
  const [locations, setLocations] = useState(alert?.locations ?? '');
  const [severity, setSeverity] = useState<AlertSeverity>(alert?.severity ?? 'Moderate');
  const [issuedAt, setIssuedAt] = useState(alert?.issuedAt ?? dateTimeOffset(0, new Date().getHours() + 1));
  const [expiresAt, setExpiresAt] = useState(alert?.expiresAt ?? dateTimeOffset(1, 18));
  const [source, setSource] = useState(alert?.source ?? '');
  const [action, setAction] = useState(alert?.action ?? '');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave({
      id: alert?.id ?? '',
      title: title.trim(),
      type,
      locations: locations.trim(),
      severity,
      issuedAt,
      expiresAt,
      source: source.trim(),
      sourceKind: 'Staff-entered note',
      status: alert?.status ?? 'Draft',
      action: action.trim(),
    });
  };

  return (
    <div className="weather-modal-backdrop" onMouseDown={onClose}>
      <section
        aria-labelledby="weather-form-title"
        aria-modal="true"
        className="weather-modal"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="weather-modal-header">
          <div>
            <p className="weather-eyebrow">STAFF-ENTERED SAMPLE NOTICE</p>
            <h2 id="weather-form-title">{alert ? 'Edit draft notice' : 'Create draft notice'}</h2>
          </div>
          <button aria-label="Close form" className="weather-icon-button" onClick={onClose} type="button"><X size={19} /></button>
        </header>
        <div className="weather-form-notice">
          <AlertTriangle size={16} />
          <p>No official warning feed is connected. This form creates a staff-entered note only; verify information with an authoritative source before publishing.</p>
        </div>
        <form className="weather-form" onSubmit={submit}>
          <label className="weather-form-full">
            Notice title
            <input autoFocus maxLength={100} onChange={(event) => setTitle(event.target.value)} required value={title} />
          </label>
          <label>
            Alert type
            <select onChange={(event) => setType(event.target.value as AlertKind)} value={type}>
              {alertTypes.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label>
            Severity
            <select onChange={(event) => setSeverity(event.target.value as AlertSeverity)} value={severity}>
              {severities.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="weather-form-full">
            Covered locations
            <input onChange={(event) => setLocations(event.target.value)} placeholder="Barangay or area names" required value={locations} />
          </label>
          <label>
            Issue time
            <input onChange={(event) => setIssuedAt(event.target.value)} required type="datetime-local" value={issuedAt} />
          </label>
          <label>
            Expiry time
            <input min={issuedAt} onChange={(event) => setExpiresAt(event.target.value)} required type="datetime-local" value={expiresAt} />
          </label>
          <label className="weather-form-full">
            Information source
            <input onChange={(event) => setSource(event.target.value)} placeholder="Source name or staff note basis" required value={source} />
          </label>
          <label className="weather-form-full">
            Guidance for farmers
            <textarea onChange={(event) => setAction(event.target.value)} required rows={3} value={action} />
          </label>
          <p className="weather-source-reminder">This will be labeled “Staff-entered note.” Official source data cannot be selected until a verified feed is configured.</p>
          <footer className="weather-modal-actions">
            <button className="weather-button weather-button--secondary" onClick={onClose} type="button">Cancel</button>
            <button className="weather-button weather-button--primary" type="submit"><Check size={15} /> Save draft</button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function PublishConfirmation({ alert, onCancel, onConfirm }: { alert: WeatherAlert; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="weather-modal-backdrop" onMouseDown={onCancel}>
      <section
        aria-labelledby="publish-confirm-title"
        aria-modal="true"
        className="weather-confirm-modal"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <span className="weather-confirm-icon"><Bell size={20} /></span>
        <h2 id="publish-confirm-title">Publish this notice?</h2>
        <p><strong>{alert.title}</strong> will be marked active for {alert.locations} until {formatDateTime(alert.expiresAt)}.</p>
        <div className="weather-confirm-source">
          <AlertTriangle size={16} />
          <span>It will be clearly labeled as a staff-entered note, not an official forecast.</span>
        </div>
        <footer className="weather-modal-actions">
          <button className="weather-button weather-button--secondary" onClick={onCancel} type="button">Cancel</button>
          <button className="weather-button weather-button--primary" onClick={onConfirm} type="button"><Send size={15} /> Confirm publish</button>
        </footer>
      </section>
    </div>
  );
}

const WeatherAlerts = () => {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(allFilter);
  const [typeFilter, setTypeFilter] = useState(allFilter);
  const [severityFilter, setSeverityFilter] = useState(allFilter);
  const [formAlert, setFormAlert] = useState<WeatherAlert | null | undefined>(undefined);
  const [publishAlertId, setPublishAlertId] = useState<string | null>(null);

  const filteredAlerts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return alerts.filter((alert) => {
      const status = currentStatus(alert);
      const matchesSearch = !query || [alert.title, alert.locations, alert.type, alert.source].some((item) => item.toLowerCase().includes(query));
      return (
        matchesSearch &&
        (statusFilter === allFilter || status === statusFilter) &&
        (typeFilter === allFilter || alert.type === typeFilter) &&
        (severityFilter === allFilter || alert.severity === severityFilter)
      );
    }).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  }, [alerts, search, severityFilter, statusFilter, typeFilter]);

  const activeCount = alerts.filter((alert) => currentStatus(alert) === 'Active').length;
  const draftCount = alerts.filter((alert) => currentStatus(alert) === 'Draft').length;
  const expiredCount = alerts.filter((alert) => currentStatus(alert) === 'Expired').length;

  const saveAlert = (alert: WeatherAlert) => {
    if (alert.id) {
      setAlerts((current) => current.map((item) => item.id === alert.id ? alert : item));
    } else {
      const nextNumber = Math.max(0, ...alerts.map((item) => Number(item.id.slice(-3)))) + 1;
      setAlerts((current) => [...current, { ...alert, id: `WA-2026-${String(nextNumber).padStart(3, '0')}` }]);
    }
    setFormAlert(undefined);
  };

  const publishAlert = () => {
    if (!publishAlertId) return;
    setAlerts((current) => current.map((alert) => alert.id === publishAlertId ? { ...alert, status: 'Active' } : alert));
    setPublishAlertId(null);
  };

  const acknowledgeAlert = (id: string) => {
    setAlerts((current) => current.map((alert) => alert.id === id ? { ...alert, status: 'Acknowledged' } : alert));
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter(allFilter);
    setTypeFilter(allFilter);
    setSeverityFilter(allFilter);
  };

  return (
    <main className="weather-page">
      <header className="weather-page-heading">
        <div>
          <p className="weather-eyebrow">CONDITIONS &amp; FARMER GUIDANCE</p>
          <h1>Weather &amp; Alerts</h1>
          <p className="weather-page-description">Review advisories and share timely, location-specific guidance with farmers.</p>
        </div>
        <button className="weather-button weather-button--primary" onClick={() => setFormAlert(null)} type="button">
          <Plus size={16} /> Create notice
        </button>
      </header>

      <div className="weather-demo-notice">
        <ShieldAlert size={17} />
        <p><strong>Forecast guidance is not an official warning.</strong> Use the location lookup below for model-based outlooks; existing notices are fictional staff-entered samples.</p>
      </div>

      <WeatherLookup />

      <section aria-label="Weather notice summary" className="weather-summary">
        <article><span className="weather-summary-icon weather-summary-icon--active"><CloudRain size={18} /></span><div><span>Active</span><strong>{activeCount}</strong><small>sample notices</small></div></article>
        <article><span className="weather-summary-icon weather-summary-icon--draft"><ClipboardList size={18} /></span><div><span>Drafts</span><strong>{draftCount}</strong><small>not published</small></div></article>
        <article><span className="weather-summary-icon weather-summary-icon--expired"><Clock3 size={18} /></span><div><span>Expired</span><strong>{expiredCount}</strong><small>past expiry time</small></div></article>
        <article><span className="weather-summary-icon weather-summary-icon--all"><Bell size={18} /></span><div><span>Total notices</span><strong>{alerts.length}</strong><small>sample records</small></div></article>
      </section>

      <section aria-label="Weather notices" className="weather-notices-card">
        <header className="weather-notices-header">
          <div><h2>Alert &amp; notice list</h2><p>{filteredAlerts.length} of {alerts.length} sample notices</p></div>
          <span className="weather-list-label"><AlertTriangle size={14} /> Staff review</span>
        </header>
        <div className="weather-filters">
          <label className="weather-search">
            <Search aria-hidden="true" size={16} />
            <input aria-label="Search weather notices" onChange={(event) => setSearch(event.target.value)} placeholder="Search title, type, location..." value={search} />
          </label>
          <label className="weather-filter"><span>Status</span><div><select onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}><option value={allFilter}>All statuses</option>{statuses.map((item) => <option key={item} value={item}>{item}</option>)}</select><ChevronDown size={14} /></div></label>
          <label className="weather-filter"><span>Type</span><div><select onChange={(event) => setTypeFilter(event.target.value)} value={typeFilter}><option value={allFilter}>All types</option>{alertTypes.map((item) => <option key={item} value={item}>{item}</option>)}</select><ChevronDown size={14} /></div></label>
          <label className="weather-filter"><span>Severity</span><div><select onChange={(event) => setSeverityFilter(event.target.value)} value={severityFilter}><option value={allFilter}>All levels</option>{severities.map((item) => <option key={item} value={item}>{item}</option>)}</select><ChevronDown size={14} /></div></label>
          <button className="weather-clear-filters" onClick={clearFilters} type="button">Clear filters</button>
        </div>

        <div className="weather-alert-list">
          {filteredAlerts.map((alert, index) => {
            const status = currentStatus(alert);
            return (
              <article
                className={`weather-alert-card${status === 'Active' ? ' weather-alert-card--active' : ''}`}
                key={alert.id}
                style={{ animationDelay: `${Math.min(index, 5) * 45}ms` }}
              >
                <div className={`weather-alert-symbol weather-alert-symbol--${alert.severity.toLowerCase()}`}>
                  {alert.type === 'Heavy rain' || alert.type === 'Flooding' ? <CloudRain size={19} /> : <AlertTriangle size={19} />}
                </div>
                <div className="weather-alert-main">
                  <div className="weather-alert-title-row">
                    <div><span className="weather-alert-id">{alert.id}</span><h3>{alert.title}</h3></div>
                    <span className={statusClass(status)}>{status}</span>
                  </div>
                  <div className="weather-alert-tags">
                    <span className={`weather-severity weather-severity--${alert.severity.toLowerCase()}`}>{alert.severity}</span>
                    <span className="weather-type-tag">{alert.type}</span>
                    <span className={`weather-source-tag${alert.sourceKind === 'Official source' ? ' weather-source-tag--official' : ''}`}>
                      {alert.sourceKind}
                    </span>
                  </div>
                  <div className="weather-alert-meta">
                    <span><MapPin size={13} /> {alert.locations}</span>
                    <span><Clock3 size={13} /> Issued {formatDateTime(alert.issuedAt)}</span>
                    <span><Clock3 size={13} /> Expires {formatDateTime(alert.expiresAt)}</span>
                  </div>
                  <p className="weather-alert-action">{alert.action}</p>
                  <p className="weather-alert-source">Source: {alert.source}</p>
                  <div className="weather-alert-actions">
                    {status === 'Draft' && (
                      <>
                        <button className="weather-action-link" onClick={() => setFormAlert(alert)} type="button">Edit draft</button>
                        <button className="weather-button weather-button--primary weather-button--small" onClick={() => setPublishAlertId(alert.id)} type="button"><Send size={13} /> Publish</button>
                      </>
                    )}
                    {status === 'Active' && (
                      <button className="weather-button weather-button--secondary weather-button--small" onClick={() => acknowledgeAlert(alert.id)} type="button"><Check size={13} /> Mark acknowledged</button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
          {filteredAlerts.length === 0 && <p className="weather-empty">No notices match these search and filters.</p>}
        </div>
      </section>

      <p className="weather-footnote">Sample notices do not represent current or official weather conditions. Verify data sources and wording before sharing time-sensitive guidance.</p>

      {formAlert !== undefined && <AlertForm alert={formAlert} onClose={() => setFormAlert(undefined)} onSave={saveAlert} />}
      {publishAlertId && (
        <PublishConfirmation
          alert={alerts.find((alert) => alert.id === publishAlertId)!}
          onCancel={() => setPublishAlertId(null)}
          onConfirm={publishAlert}
        />
      )}
    </main>
  );
};

export default WeatherAlerts;
