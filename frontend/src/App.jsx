import { useState, useEffect } from "react";
const API_URL = (import.meta.env.VITE_API_URL || "http://172.27.210.55:8001").replace(/\/$/, "");
import {
  LayoutDashboard, Activity, Map, BrainCircuit,
  History, Bell, Settings, Thermometer, Droplets,
  Waves, Mountain, Menu, Search, ArrowUpRight,
  ArrowDownRight, Download, AlertTriangle, Cpu,
  Satellite, Clock, ShieldCheck, TrendingUp
} from "lucide-react";

import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from "recharts";

import "./App.css";

const readings = [
  { time: "08:00", air: -2.4, humidity: 62, water: 1.2 },
  { time: "09:00", air: -2.1, humidity: 64, water: 1.3 },
  { time: "10:00", air: -1.8, humidity: 63, water: 1.4 },
  { time: "11:00", air: -1.2, humidity: 67, water: 1.5 },
  { time: "12:00", air: -0.8, humidity: 69, water: 1.6 },
  { time: "13:00", air: -0.4, humidity: 72, water: 1.8 },
  { time: "14:00", air: 0.2, humidity: 70, water: 1.9 }
];

const navItems = [
  [LayoutDashboard, "Overview"],
  [Activity, "Live Monitoring"],
  [Map, "Glacier Map"],
  [BrainCircuit, "AI Prediction"],
  [History, "Historical Data"],
  [Bell, "Alerts & Reports"]
];

function App() {
  const [active, setActive] = useState("Overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [sensorData, setSensorData] = useState(null);  
  const [sensorHistory, setSensorHistory] = useState([]);
  const [apiError, setApiError] = useState("");

useEffect(() => {
  const fetchSensorData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/sensors`);

      if (!response.ok) {
        throw new Error("Backend API unavailable");
      }

      const result = await response.json();

      if (result.readings && result.readings.length > 0) {
        setSensorData(result.readings[0]);
        setSensorHistory(result.readings);
        setApiError("");
      } else {
        setApiError("No sensor readings available");
      }
    } catch (error) {
      setApiError(error.message);
    }
  };

  fetchSensorData();

  const interval = setInterval(fetchSensorData, 5000);

  return () => clearInterval(interval);
}, []);


  const navigate = (page) => {
    setActive(page);
    setMenuOpen(false);
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-icon"><Mountain size={25} /></div>
          <div>
            <h2>GLACIERA</h2>
            <span>CLIMATE INTELLIGENCE</span>
          </div>
        </div>

        <p className="nav-label">WORKSPACE</p>

        <nav>
          {navItems.map(([Icon, label]) => (
            <button
              key={label}
              className={`nav-item ${active === label ? "selected" : ""}`}
              onClick={() => navigate(label)}
            >
              <Icon size={19} />
              <span>{label}</span>
              {label === "Alerts & Reports" && <i className="alert-dot" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="system-card">
            <span className="online-dot" />
            SYSTEM STATUS
            <strong>Dashboard Available</strong>
            <small>
              {sensorHistory.length > 0
                ? "ESP32 Connected"
                : "Waiting for sensors"}
            </small>
          </div>

          <button className="nav-item">
            <Settings size={19} /> Settings
          </button>

          <div className="profile">
            <div className="avatar">GR</div>
            <div>
              <strong>Glacier Research</strong>
              <small>Research Console</small>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
            <Menu />
          </button>

          <div className="breadcrumb">
            Workspace / <strong>{active}</strong>
          </div>

          <div className="top-actions">
            <span className="connection">
              <span className="online-dot" />
              {apiError
                ? "Backend Offline"
                : sensorHistory.length > 0
                  ? "Live ESP32 Connected"
                  : "Connecting..."}
            </span>
            <button className="icon-btn"><Search /></button>
            <button className="icon-btn" onClick={() => navigate("Alerts & Reports")}>
              <Bell />
            </button>
          </div>
        </header>

        {active === "Overview" && (
          <Overview
           navigate={navigate}
           sensorData={sensorData}
           sensorHistory={sensorHistory}
           apiError={apiError}
          />
        )}

        {active === "Live Monitoring" && (
          <LiveMonitoring
            sensorData={sensorHistory}
            apiError={apiError}
          />
        )}
        {active === "Glacier Map" && <GlacierMap />}
        {active === "AI Prediction" && <Prediction />}
        {active === "Historical Data" && (
          <HistoricalData sensorHistory={sensorHistory} />
        )}
        {active === "Alerts & Reports" && (
          <Alerts sensorHistory={sensorHistory} apiError={apiError} />
        )}
      </main>
    </div>
  );
}

/* OVERVIEW */

function Overview({ navigate, sensorData, sensorHistory = [], apiError }) {
  return (
    <section className="dashboard">
      <PageHeading
        eyebrow="GLACIER OBSERVATION SYSTEM"
        title="Overview"
        subtitle="Monitor environmental conditions and glacier activity."
      />

      <LocationBanner hasLiveData={Boolean(sensorData)} />

      <SectionTitle
        title="Environmental Overview"
        subtitle="Latest ESP32 sensor readings"
        right={apiError || "Live hardware data · Refreshing every 5 seconds"}
      />

      <div className="metrics-grid">
        <Metric icon={<Thermometer />} label="Air Temperature"
          value={sensorData?.air_temperature != null ? Number(sensorData.air_temperature).toFixed(1) : "--"}
          unit="°C" trend="ESP32 Live" />

        <Metric icon={<Droplets />} label="Humidity"
          value={sensorData?.humidity != null ? Number(sensorData.humidity).toFixed(1) : "--"}
          unit="%" trend="ESP32 Live" />

        <Metric icon={<Waves />} label="Water Temperature"
          value={sensorData?.water_temperature != null ? Number(sensorData.water_temperature).toFixed(1) : "--"}
          unit="°C" trend="ESP32 Live" />

        <Metric icon={<Mountain />} label="Surface Distance"
          value={sensorData?.distance != null && Number(sensorData.distance) >= 0 ? Number(sensorData.distance).toFixed(1) : "--"}
          unit="cm" trend="ESP32 Live" /> 
      </div>

      <div className="content-grid">
        <TemperatureChart sensorHistory={sensorHistory} />
        <RiskPanel navigate={navigate} sensorHistory={sensorHistory} />
      </div>

      <div className="bottom-grid">
        <Infrastructure sensorHistory={sensorHistory} />
        <RecentActivity sensorHistory={sensorHistory} />
      </div>

      <Footer />
    </section>
  );
}

/* LIVE MONITORING */


function LiveMonitoring({ sensorData, apiError }) {
  const readings = sensorData || [];
  const latest = readings[0];

  const formatTime = (value) => {
    if (!value) return "N/A";
    return new Date(value).toLocaleString();
  };

  const downloadCSV = () => {
    const csv = [
      "Time,Air Temperature,Humidity,Water Temperature,Distance,Status",
      ...readings.map((r) =>
        [
          formatTime(r.created_at),
          r.air_temperature,
          r.humidity,
          r.water_temperature,
          r.distance,
          r.status
        ].join(",")
      )
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "glaciera-sensor-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="dashboard">
      <PageHeading
        eyebrow="ENVIRONMENTAL SENSOR NETWORK"
        title="Live Monitoring"
        subtitle="Real-time environmental readings from ESP32."
      />

      <LocationBanner />

      <div className="section-title">
        <h2>Current Sensor Readings</h2>
        <button className="download-btn" onClick={downloadCSV}>
          <Download size={15} /> Download CSV
        </button>
      </div>

      {apiError && (
        <p className="demo-notice">
          Backend connection: {apiError}
        </p>
      )}

      {!latest && (
        <p className="demo-notice">
          Waiting for ESP32 sensor readings...
        </p>
      )}

      {latest && (
        <>
          <p className="demo-notice">
            LIVE ESP32 DATA · Last update: {formatTime(latest.created_at)}
          </p>

          <div className="metrics-grid">
            <Metric
              icon={<Thermometer />}
              label="Air Temperature"
              value={latest.air_temperature != null
                ? Number(latest.air_temperature).toFixed(1) : "--"}
              unit="°C"
              trend="ESP32"
            />

            <Metric
              icon={<Droplets />}
              label="Humidity"
              value={latest.humidity != null
                ? Number(latest.humidity).toFixed(1) : "--"}
              unit="%"
              trend="ESP32"
            />

            <Metric
              icon={<Waves />}
              label="Water Temperature"
              value={latest.water_temperature != null
                ? Number(latest.water_temperature).toFixed(1) : "--"}
              unit="°C"
              trend="ESP32"
            />

            <Metric
              icon={<Mountain />}
              label="Ultrasonic Distance"
              value={latest.distance != null && Number(latest.distance) >= 0
                ? Number(latest.distance).toFixed(1) : "--"}
              unit="cm"
              trend="ESP32"
            />
          </div>

          <div className="panel chart-panel">
            <div className="panel-heading">
              <div>
                <h3>Environmental Temperature Trends</h3>
                <p>Actual air and water temperature observations</p>
              </div>
              <span className="chart-tag">LIVE DATA</span>
            </div>

            <div className="chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[...readings].reverse()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9edf1" />
                  <XAxis
                    dataKey="created_at"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleTimeString()
                    }
                  />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="air_temperature"
                    name="Air °C"
                    stroke="#438eb5"
                    fill="#438eb5"
                    fillOpacity={0.12}
                  />
                  <Area
                    type="monotone"
                    dataKey="water_temperature"
                    name="Water °C"
                    stroke="#49a58c"
                    fill="#49a58c"
                    fillOpacity={0.10}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel table-panel">
            <div className="panel-heading">
              <div>
                <h3>Sensor Observation History</h3>
                <p>Records received from ESP32 and stored in database</p>
              </div>
            </div>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Air °C</th>
                    <th>Humidity</th>
                    <th>Water °C</th>
                    <th>Distance cm</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {readings.map((r) => (
                    <tr key={r.id}>
                      <td>{formatTime(r.created_at)}</td>
                      <td>{r.air_temperature ?? "--"}</td>
                      <td>{r.humidity ?? "--"}%</td>
                      <td>{r.water_temperature ?? "--"}</td>
                      <td>
                        {r.distance != null && Number(r.distance) >= 0
                          ? r.distance : "--"}
                      </td>
                      <td>{r.status || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <Footer />
    </section>
  );
}


/* GLACIER MAP */

function GlacierMap({ sensorData }) {
  const lat = Number(sensorData?.latitude);
  const lon = Number(sensorData?.longitude);
  const hasFix = Number.isFinite(lat) && Number.isFinite(lon) &&
    (lat !== 0 || lon !== 0) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;

  const mapSrc = hasFix
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.08}%2C${lat - 0.05}%2C${lon + 0.08}%2C${lat + 0.05}&layer=mapnik&marker=${lat}%2C${lon}`
    : "https://www.openstreetmap.org/export/embed.html?bbox=78.5%2C30.0%2C82.5%2C33.5&layer=mapnik";

  return (
    <section className="dashboard">
      <PageHeading
        eyebrow="GEOSPATIAL MONITORING"
        title="Glacier Map"
        subtitle="Geographic view of the monitoring station."
      />
      <div className="panel map-panel">
        <div className="panel-heading">
          <div>
            <h3>{hasFix ? "ESP32 GPS Station" : "Himalayan Reference Region"}</h3>
            <p>{hasFix ? "Map centered on the latest GPS coordinates" : "Reference map · GPS fix not available"}</p>
          </div>
          <span className="chart-tag">{hasFix ? "GPS FIX" : "REFERENCE MAP"}</span>
        </div>
        <iframe title="Glacier monitoring map" src={mapSrc} loading="lazy" />
        <p className="map-note">
          {hasFix
            ? `Latest coordinates: ${lat.toFixed(6)}, ${lon.toFixed(6)}`
            : "The reference map is shown until the NEO-6M module provides a valid location fix."}
        </p>
      </div>
      <div className="panel map-details">
        <h3>Monitoring Station</h3>
        <p><strong>Region:</strong> Himalayan observation reference</p>
        <p><strong>GPS coordinates:</strong> {hasFix ? `${lat.toFixed(6)}, ${lon.toFixed(6)}` : "Waiting for GPS fix"}</p>
        <p><strong>Latest air temperature:</strong> {sensorData?.air_temperature ?? "--"} °C</p>
        <p><strong>Station connectivity:</strong> {sensorData ? "ESP32 data received" : "Waiting for sensor data"}</p>
      </div>
      <Footer />
    </section>
  );
}

/* AI PREDICTION */

function Prediction({ sensorHistory = [], apiError }) {
  const valid = sensorHistory.filter(r => Number.isFinite(Number(r.air_temperature)));
  const latest = valid[0];
  const previous = valid.length > 1 ? valid[1] : null;
  const temp = latest ? Number(latest.air_temperature) : null;
  const humidity = latest && latest.humidity != null ? Number(latest.humidity) : null;
  const water = latest && latest.water_temperature != null ? Number(latest.water_temperature) : null;
  const delta = latest && previous ? temp - Number(previous.air_temperature) : 0;
  const trend = !latest ? "Unavailable" : delta > 0.2 ? "Rising" : delta < -0.2 ? "Falling" : "Stable";

  // Transparent rule-based prototype score; not a trained or validated glacier model.
  const score = latest
    ? Math.max(0, Math.min(100,
        Math.round(
          Math.max(0, temp) * 4 +
          Math.max(0, (humidity ?? 0) - 60) * 0.35 +
          Math.max(0, water ?? 0) * 2 +
          Math.max(0, delta) * 8
        )))
    : null;

  const level = score == null ? "NO DATA" : score >= 65 ? "HIGH INDICATOR" : score >= 30 ? "MODERATE INDICATOR" : "LOW INDICATOR";
  const advice = !latest
    ? "Connect the ESP32 and collect sensor readings to generate a rule-based indicator."
    : score >= 65
      ? "Review rising temperature and water-temperature readings. Verify sensors and inspect the site."
      : score >= 30
        ? "Continue monitoring trends and compare readings across multiple observation periods."
        : "Continue routine monitoring. A low indicator does not confirm that the glacier is safe.";

  return (
    <section className="dashboard">
      <PageHeading
        eyebrow="CLIMATE INTELLIGENCE ENGINE"
        title="AI Prediction"
        subtitle="Live-data-based, rule-driven glacier condition indicator."
      />
      <div className="demo-notice">
        PROTOTYPE ANALYTICS — This transparent rule-based indicator is not a trained or scientifically validated glacier-melt prediction model.
        {apiError ? ` Backend: ${apiError}` : ""}
      </div>
      <div className="metrics-grid">
        <Metric icon={<TrendingUp />} label="Risk Indicator" value={score == null ? "--" : score} unit="/100" trend={level} />
        <Metric icon={<Thermometer />} label="Air Temperature Trend" value={trend} unit="" trend="Latest vs previous reading" />
        <Metric icon={<Droplets />} label="Humidity" value={humidity == null ? "--" : humidity.toFixed(1)} unit="%" trend="Latest sensor reading" />
        <Metric icon={<Waves />} label="Water Temperature" value={water == null ? "--" : water.toFixed(1)} unit="°C" trend="Latest sensor reading" />
      </div>
      <div className="content-grid">
        <div className="panel">
          <div className="panel-heading">
            <div><h3>Current Risk Indicator</h3><p>Calculated from the latest available sensor readings</p></div>
            <span className="chart-tag">{level}</span>
          </div>
          <div className="risk-score">{score == null ? "--" : score}<span>/100</span></div>
          <div className="risk-level">{level}</div>
          <div className="risk-bar"><span style={{ width: `${score ?? 0}%` }} /></div>
          <p className="risk-description">{advice}</p>
          <p className="risk-description">Inputs: air temperature, humidity, water temperature and change from the previous air-temperature reading.</p>
        </div>
        <div className="panel">
          <div className="panel-heading">
            <div><h3>Analysis Pipeline</h3><p>Live prototype processing status</p></div>
          </div>
          {[
            ["Sensor data collection", latest ? "Available" : "Waiting"],
            ["Data quality validation", valid.length ? "Readings received" : "Waiting"],
            ["Feature extraction", latest ? "Calculated" : "Waiting"],
            ["Rule-based indicator", score == null ? "Waiting" : "Calculated"],
            ["Scientific ML validation", "Not trained"]
          ].map(([item, status], i) => (
            <div className="device-row" key={item}>
              <strong>{i + 1}. {item}</strong>
              <span className={status === "Not trained" || status === "Waiting" ? "pending" : "chart-tag"}>{status}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="panel table-panel">
        <div className="panel-heading">
          <div><h3>Recent Analysis Inputs</h3><p>Latest stored ESP32 observations</p></div>
        </div>
        <ObservationTable sensorHistory={sensorHistory.slice(0, 10)} />
      </div>
      <Footer />
    </section>
  );
}

/* HISTORICAL DATA */

function HistoricalData({ sensorHistory = [] }) {
  const rows = [...sensorHistory].reverse();
  const downloadHistory = () => {
    const csv = [
      "Time,Air Temperature,Humidity,Water Temperature,Distance,Latitude,Longitude,Status",
      ...rows.map(r => [
        r.created_at, r.air_temperature, r.humidity, r.water_temperature,
        r.distance, r.latitude, r.longitude, r.status
      ].map(v => `"${v ?? ""}"`).join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "glaciera-historical-data.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="dashboard">
      <PageHeading
        eyebrow="OBSERVATION ARCHIVE"
        title="Historical Data"
        subtitle="Explore sensor observations stored by the backend database."
      />
      <div className="section-title">
        <div><h2>Stored Sensor Records</h2><p>{sensorHistory.length} records currently returned by the API</p></div>
        <button className="download-btn" onClick={downloadHistory} disabled={!sensorHistory.length}>
          <Download size={15} /> Export CSV
        </button>
      </div>
      {!sensorHistory.length && <div className="demo-notice">No historical readings are available yet. Start the ESP32 and backend to collect records.</div>}
      {sensorHistory.length > 0 && (
        <>
          <div className="panel chart-panel">
            <div className="panel-heading">
              <div><h3>Historical Temperature Trend</h3><p>Air and water temperature from database records</p></div>
              <span className="chart-tag">DATABASE</span>
            </div>
            <div className="chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={rows.map(r => ({
                  time: new Date(r.created_at).toLocaleTimeString(),
                  air: Number(r.air_temperature),
                  water: r.water_temperature == null ? null : Number(r.water_temperature)
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9edf1" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="air" name="Air °C" stroke="#438eb5" fill="#438eb5" fillOpacity={0.12} />
                  <Area type="monotone" dataKey="water" name="Water °C" stroke="#49a58c" fill="#49a58c" fillOpacity={0.10} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="panel table-panel">
            <div className="panel-heading"><div><h3>Archived Observations</h3><p>Newest records first</p></div></div>
            <ObservationTable sensorHistory={sensorHistory} />
          </div>
        </>
      )}
      <Footer />
    </section>
  );
}

/* ALERTS */

function Alerts({ sensorHistory = [], apiError }) {
  const latest = sensorHistory[0];
  const temp = latest?.air_temperature == null ? null : Number(latest.air_temperature);
  const gpsValid = latest && Number.isFinite(Number(latest.latitude)) &&
    Number.isFinite(Number(latest.longitude)) &&
    (Number(latest.latitude) !== 0 || Number(latest.longitude) !== 0);

  const alerts = [
    {
      title: "Air temperature threshold",
      desc: temp == null ? "Waiting for a valid temperature reading." :
        temp > 10 ? `High temperature indicator: ${temp.toFixed(1)} °C (prototype threshold > 10 °C).` :
        `Temperature is ${temp.toFixed(1)} °C; no high-temperature threshold is currently crossed.`,
      status: temp == null ? "Pending" : temp > 10 ? "Warning" : "Normal"
    },
    {
      title: "GPS location",
      desc: gpsValid ? `GPS coordinates received: ${latest.latitude}, ${latest.longitude}.` : "No valid GPS coordinates received; map is using its reference region.",
      status: gpsValid ? "Connected" : "Pending"
    },
    {
      title: "ESP32 / backend connection",
      desc: apiError || (latest ? `Latest sensor record received at ${latest.created_at}.` : "Waiting for sensor data from ESP32."),
      status: apiError ? "Offline" : latest ? "Connected" : "Pending"
    },
    {
      title: "Sensor data quality",
      desc: latest ? `Latest record status: ${latest.status || "Not provided"}. Check any missing or invalid sensor values.` : "No sensor record available to validate.",
      status: latest ? "Review" : "Pending"
    },
    {
      title: "AI prediction model",
      desc: "Rule-based prototype indicator is available on the AI Prediction page; a trained and validated model is not yet available.",
      status: "Prototype"
    }
  ];

  const warningCount = alerts.filter(a => ["Warning", "Offline"].includes(a.status)).length;

  return (
    <section className="dashboard">
      <PageHeading
        eyebrow="SYSTEM NOTIFICATIONS"
        title="Alerts & Reports"
        subtitle="Live checks based on the latest ESP32 readings and API connection."
      />
      <div className="section-title">
        <div><h2>System Event Centre</h2><p>{warningCount} warning/offline condition(s) detected</p></div>
      </div>
      <div className="panel">
        {alerts.map(alert => (
          <div className="alert-row" key={alert.title}>
            <div className="alert-icon"><AlertTriangle size={19} /></div>
            <div className="alert-content"><strong>{alert.title}</strong><p>{alert.desc}</p></div>
            <span className={["Warning", "Offline"].includes(alert.status) ? "pending" : "chart-tag"}>{alert.status}</span>
          </div>
        ))}
      </div>
      <div className="demo-notice" style={{ marginTop: 18 }}>
        Alerts are evaluated in the browser from the latest records returned by the API. They are monitoring indicators, not certified glacier safety warnings.
      </div>
      <Footer />
    </section>
  );
}

/* REUSABLE COMPONENTS */

function PageHeading({ eyebrow, title, subtitle }) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="subheading">{subtitle}</p>
      </div>
      <div className="date-chip">Research Console</div>
    </div>
  );
}

function LocationBanner({ hasLiveData }) {
  return (
    <div className="location-banner">
      <div className="location-image">
        <Mountain size={37} />
      </div>
      <div className="location-info">
        <span>MONITORING REGION</span>
        <h3>Himalayan Glacier Observatory</h3>
        <p>High-altitude environmental monitoring station</p>
      </div>
      <div className="station-status">
        {hasLiveData ? "LIVE DATA" : "DEMO DATA"}
      </div>
    </div>
  );
}

function SectionTitle({ title, subtitle, right }) {
  return (
    <div className="section-title">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <span className="updated">{right}</span>
    </div>
  );
}

function Metric({ icon, label, value, unit, trend }) {
  return (
    <div className="metric-card">
      <div className="metric-top">
        <span className="metric-icon">{icon}</span>
        <span className="metric-trend">{trend}</span>
      </div>
      <p>{label}</p>
      <div className="metric-value">{value}<span>{unit}</span></div>
    </div>
  );
}

function TemperatureChart({ sensorHistory = [] }) {
  return (
    <div className="panel chart-panel">
      <div className="panel-heading">
        <div>
          <h3>Temperature Analysis</h3>
          <p>Air temperature over the observation period</p>
        </div>
        <span className="chart-tag">LIVE DATA</span>
      </div>
      <div className="chart">
        <ResponsiveContainer width="100%" height="100%">
          <>
          <AreaChart
            data={[...sensorHistory].reverse().map((r) => ({
              time: new Date(r.created_at).toLocaleTimeString(),
              air: Number(r.air_temperature),
              water: Number(r.water_temperature)
            }))}
          >
            <defs>
              <linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#438eb5" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#438eb5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e9edf1" />
            <XAxis dataKey="time" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Area type="monotone" dataKey="air" name="Temperature °C"
              stroke="#438eb5" fill="url(#tempFill)" strokeWidth={2.5} />
          </AreaChart>
          </>
          </ResponsiveContainer>
      </div>
    </div>
  );
}

function RiskPanel({ navigate, sensorHistory = [] }) {
  const latest = sensorHistory[0];
  const temp = latest?.air_temperature == null ? null : Number(latest.air_temperature);
  const humidity = latest?.humidity == null ? 0 : Number(latest.humidity);
  const water = latest?.water_temperature == null ? 0 : Number(latest.water_temperature);
  const score = latest
    ? Math.max(0, Math.min(100, Math.round(Math.max(0, temp) * 4 + Math.max(0, humidity - 60) * 0.35 + Math.max(0, water) * 2)))
    : null;
  const level = score == null ? "AWAITING DATA" : score >= 65 ? "HIGH INDICATOR" : score >= 30 ? "MODERATE INDICATOR" : "LOW INDICATOR";

  return (
    <div className="panel risk-panel">
      <div className="panel-heading"><div><h3>Glacier Risk Indicator</h3><p>Rule-based prototype using latest readings</p></div></div>
      <div className="risk-score">{score == null ? "--" : score}<span>/100</span></div>
      <div className="risk-level">{level}</div>
      <div className="risk-bar"><span style={{ width: `${score ?? 0}%` }} /></div>
      <p className="risk-description">This is an experimental indicator, not a trained or validated glacier prediction model.</p>
      <button className="text-link" onClick={() => navigate("AI Prediction")}>Explore AI analysis <ArrowUpRight size={16} /></button>
    </div>
  );
}

function Infrastructure({ sensorHistory = [] }) {
  const latest = sensorHistory[0];

  const esp32Online = Boolean(latest);

  const devices = [
    {
      name: "ESP32 Controller",
      desc: "Hardware controller",
      connected: esp32Online
    },
    {
      name: "DHT22 Sensor",
      desc: "Temperature and humidity",
      connected: latest?.air_temperature != null &&
                 latest?.humidity != null
    },
    {
      name: "DS18B20 Sensor",
      desc: "Water temperature",
      connected: latest?.water_temperature != null
    },
    {
      name: "GPS Module",
      desc: "Location tracking",
      connected: latest?.latitude != null &&
                 latest?.longitude != null &&
                 (Number(latest.latitude) !== 0 ||
                  Number(latest.longitude) !== 0)
    }
  ];

  return (
    <div className="panel">
      <div className="panel-heading">
        <div>
          <h3>Monitoring Infrastructure</h3>
          <p>Live device status from ESP32 data</p>
        </div>
      </div>

      {devices.map((device) => (
        <div className="device-row" key={device.name}>
          <div>
            <strong>{device.name}</strong>
            <small>{device.desc}</small>
          </div>

          <span className={device.connected ? "online-dot" : "pending"}>
            {device.connected ? "Connected" : "Waiting"}
          </span>
        </div>
      ))}
    </div>
  );
}


function RecentActivity({ sensorHistory = [] }) {
  const latest = sensorHistory[0];
  return (
    <div className="panel">
      <div className="panel-heading"><div><h3>Recent Activity</h3><p>Latest system events</p></div></div>
      <ActivityItem title="Dashboard initialized" desc="GLACIERA monitoring console loaded" color="blue" />
      <ActivityItem title="ESP32 sensor stream" desc={latest ? `Latest record: ${new Date(latest.created_at).toLocaleString()}` : "Waiting for sensor connection"} color={latest ? "blue" : "grey"} />
      <ActivityItem title="AI analysis" desc={latest ? "Rule-based indicator can be calculated from sensor readings" : "Waiting for sensor readings"} color={latest ? "blue" : "grey"} />
    </div>
  );
}

function ActivityItem({ title, desc, color }) {
  return (
    <div className="activity-item">
      <span className={`activity-marker ${color}`} />
      <div><strong>{title}</strong><small>{desc}</small></div>
    </div>
  );
}

function ObservationTable({ sensorHistory = [] }) {
  const rows = sensorHistory;
  const formatTime = value => value ? new Date(value).toLocaleString() : "N/A";
  if (!rows.length) return <p className="map-note">No stored observations available.</p>;

  return (
    <div className="table-scroll">
      <table>
        <thead><tr>
          <th>Time</th><th>Air °C</th><th>Humidity</th><th>Water °C</th><th>Distance cm</th><th>Status</th>
        </tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{formatTime(r.created_at)}</td>
              <td>{r.air_temperature ?? "--"}</td>
              <td>{r.humidity == null ? "--" : `${r.humidity}%`}</td>
              <td>{r.water_temperature ?? "--"}</td>
              <td>{r.distance != null && Number(r.distance) >= 0 ? r.distance : "--"}</td>
              <td>{r.status || "N/A"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Footer() {
  return (
    <footer>
      GLACIERA © 2026 · AI-POWERED GLACIER INTELLIGENCE
      <span>Observe. Analyze. Predict.</span>
    </footer>
  );
}

export default App;
