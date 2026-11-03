
import { useState } from "react";
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
            <small>Hardware integration pending</small>
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
              <span className="online-dot" /> Demo Environment
            </span>
            <button className="icon-btn"><Search /></button>
            <button className="icon-btn" onClick={() => navigate("Alerts & Reports")}>
              <Bell />
            </button>
          </div>
        </header>

        {active === "Overview" && <Overview navigate={navigate} />}
        {active === "Live Monitoring" && <LiveMonitoring />}
        {active === "Glacier Map" && <GlacierMap />}
        {active === "AI Prediction" && <Prediction />}
        {active === "Historical Data" && <HistoricalData />}
        {active === "Alerts & Reports" && <Alerts />}
      </main>
    </div>
  );
}

/* OVERVIEW */

function Overview({ navigate }) {
  return (
    <section className="dashboard">
      <PageHeading
        eyebrow="GLACIER OBSERVATION SYSTEM"
        title="Overview"
        subtitle="Monitor environmental conditions and glacier activity."
      />

      <LocationBanner />

      <SectionTitle
        title="Environmental Overview"
        subtitle="Latest illustrative sensor readings"
        right="Sample readings · Not live hardware data"
      />

      <div className="metrics-grid">
        <Metric icon={<Thermometer />} label="Air Temperature" value="-0.4" unit="°C" trend="Rising" />
        <Metric icon={<Droplets />} label="Humidity" value="72" unit="%" trend="Demo" />
        <Metric icon={<Waves />} label="Water Temperature" value="1.8" unit="°C" trend="Demo" />
        <Metric icon={<Mountain />} label="Surface Distance" value="16.28" unit="cm" trend="Stable" />
      </div>

      <div className="content-grid">
        <TemperatureChart />
        <RiskPanel navigate={navigate} />
      </div>

      <div className="bottom-grid">
        <Infrastructure />
        <RecentActivity />
      </div>

      <Footer />
    </section>
  );
}

/* LIVE MONITORING */

function LiveMonitoring() {
  const latest = readings[readings.length - 1];

  const downloadCSV = () => {
    const csv = [
      "Time,Air Temperature,Humidity,Water Temperature",
      ...readings.map(r =>
        `${r.time},${r.air},${r.humidity},${r.water}`
      )
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
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
        subtitle="Environmental observations from the monitoring station."
      />

      <LocationBanner />

      <div className="section-title">
        <h2>Current Sensor Readings</h2>
        <button className="download-btn" onClick={downloadCSV}>
          <Download size={15} /> Download CSV
        </button>
      </div>

      <p className="demo-notice">
        DEMO DATA — These readings are illustrative, not live ESP32 readings.
      </p>

      <div className="metrics-grid">
        <Metric icon={<Thermometer />} label="Air Temperature" value={latest.air.toFixed(1)} unit="°C" trend="Demo" />
        <Metric icon={<Droplets />} label="Humidity" value={latest.humidity} unit="%" trend="Demo" />
        <Metric icon={<Waves />} label="Water Temperature" value={latest.water.toFixed(1)} unit="°C" trend="Demo" />
        <Metric icon={<Mountain />} label="Ultrasonic Distance" value="16.28" unit="cm" trend="Demo" />
      </div>

      <div className="panel chart-panel">
        <div className="panel-heading">
          <div>
            <h3>Environmental Temperature Trends</h3>
            <p>Air and water temperature observations</p>
          </div>
          <span className="chart-tag">SAMPLE DATA</span>
        </div>

        <div className="chart">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={readings}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e9edf1" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="air" name="Air °C"
                stroke="#438eb5" fill="#438eb5" fillOpacity={0.12} />
              <Area type="monotone" dataKey="water" name="Water °C"
                stroke="#49a58c" fill="#49a58c" fillOpacity={0.10} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="panel table-panel">
        <div className="panel-heading">
          <div>
            <h3>Sensor Observation History</h3>
            <p>Illustrative records for testing the interface</p>
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
              </tr>
            </thead>
            <tbody>
              {readings.map(r => (
                <tr key={r.time}>
                  <td>{r.time}</td>
                  <td>{r.air.toFixed(1)}</td>
                  <td>{r.humidity}%</td>
                  <td>{r.water.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Footer />
    </section>
  );
}

/* GLACIER MAP */

function GlacierMap() {
  return (
    <section className="dashboard">
      <PageHeading
        eyebrow="GEOSPATIAL MONITORING"
        title="Glacier Map"
        subtitle="Geographic view of glacier observation regions."
      />

      <div className="panel map-panel">
        <div className="panel-heading">
          <div>
            <h3>Himalayan Region</h3>
            <p>OpenStreetMap geographic reference</p>
          </div>
          <span className="chart-tag">MAP VIEW</span>
        </div>

        <iframe
          title="Himalayan Glacier Map"
          src="https://www.openstreetmap.org/export/embed.html?bbox=78.5%2C30.0%2C82.5%2C33.5&layer=mapnik"
          loading="lazy"
        />

        <p className="map-note">
          GPS station integration pending · Reference map only
        </p>
      </div>

      <div className="panel map-details">
        <h3>Monitoring Station</h3>
        <p><strong>Region:</strong> Himalayan observation area</p>
        <p><strong>GPS coordinates:</strong> Awaiting ESP32 GPS fix</p>
        <p><strong>Station status:</strong> Demo environment</p>
      </div>

      <Footer />
    </section>
  );
}

/* AI PREDICTION */

function Prediction() {
  return (
    <section className="dashboard">
      <PageHeading
        eyebrow="CLIMATE INTELLIGENCE ENGINE"
        title="AI Prediction"
        subtitle="Glacier condition analysis and melting risk assessment."
      />

      <div className="panel prediction-intro">
        <div className="prediction-icon"><BrainCircuit size={30} /></div>
        <div>
          <h3>Glacier Melting Intelligence</h3>
          <p>AI model integration is planned. The following values are illustrative only.</p>
        </div>
      </div>

      <div className="metrics-grid">
        <Metric icon={<TrendingUp />} label="Illustrative Risk Score" value="32" unit="/100" trend="Demo" />
        <Metric icon={<Thermometer />} label="Temperature Trend" value="Rising" unit="" trend="Demo" />
        <Metric icon={<ShieldCheck />} label="Model Confidence" value="N/A" unit="" trend="Not trained" />
        <Metric icon={<Clock />} label="Forecast Horizon" value="N/A" unit="" trend="Pending" />
      </div>

      <div className="content-grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <h3>Risk Assessment</h3>
              <p>Demonstration visualization</p>
            </div>
          </div>
          <div className="risk-score">32<span>/100</span></div>
          <div className="risk-level">ILLUSTRATIVE MODERATE RISK</div>
          <div className="risk-bar"><span /></div>
          <p className="risk-description">
            This score is not generated by a trained AI model and must not be
            treated as an actual glacier safety assessment.
          </p>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <h3>Prediction Pipeline</h3>
              <p>Planned AI workflow</p>
            </div>
          </div>
          {[
            "Sensor data collection",
            "Data quality validation",
            "Feature extraction",
            "ML model inference",
            "Risk report generation"
          ].map((item, i) => (
            <div className="device-row" key={item}>
              <strong>{i + 1}. {item}</strong>
              <span className="pending">Planned</span>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </section>
  );
}

/* HISTORICAL DATA */

function HistoricalData() {
  return (
    <section className="dashboard">
      <PageHeading
        eyebrow="OBSERVATION ARCHIVE"
        title="Historical Data"
        subtitle="Explore historical environmental observations."
      />

      <div className="demo-notice">
        DEMONSTRATION RECORDS — Database integration pending.
      </div>

      <div className="panel chart-panel">
        <div className="panel-heading">
          <div>
            <h3>Historical Temperature Trend</h3>
            <p>Illustrative observation period</p>
          </div>
          <span className="chart-tag">SAMPLE</span>
        </div>

        <div className="chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={readings}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e9edf1" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="air" name="Air °C" fill="#438eb5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="panel table-panel">
        <h3>Archived Observations</h3>
        <ObservationTable />
      </div>

      <Footer />
    </section>
  );
}

/* ALERTS */

function Alerts() {
  const alerts = [
    ["Temperature monitoring", "Threshold monitoring will use actual sensor readings after integration.", "Pending"],
    ["GPS connection", "Waiting for a valid GPS fix from the NEO-6M module.", "Pending"],
    ["Sensor connectivity", "ESP32 data connection is not yet integrated.", "Pending"],
    ["AI prediction", "Prediction alerts require a trained and validated model.", "Pending"]
  ];

  return (
    <section className="dashboard">
      <PageHeading
        eyebrow="SYSTEM NOTIFICATIONS"
        title="Alerts & Reports"
        subtitle="Review monitoring events and system notifications."
      />

      <div className="demo-notice">
        No verified live alerts are available in the demo environment.
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h3>System Event Centre</h3>
            <p>Integration and monitoring checklist</p>
          </div>
        </div>

        {alerts.map(([title, desc, status]) => (
          <div className="alert-row" key={title}>
            <div className="alert-icon"><AlertTriangle size={19} /></div>
            <div className="alert-content">
              <strong>{title}</strong>
              <p>{desc}</p>
            </div>
            <span className="pending">{status}</span>
          </div>
        ))}
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

function LocationBanner() {
  return (
    <div className="location-banner">
      <div className="location-image"><Mountain size={37} /></div>
      <div className="location-info">
        <span>MONITORING REGION</span>
        <h3>Himalayan Glacier Observatory</h3>
        <p>High-altitude environmental monitoring station</p>
      </div>
      <div className="station-status">DEMO DATA</div>
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

function TemperatureChart() {
  return (
    <div className="panel chart-panel">
      <div className="panel-heading">
        <div>
          <h3>Temperature Analysis</h3>
          <p>Air temperature over the observation period</p>
        </div>
        <span className="chart-tag">SAMPLE DATA</span>
      </div>
      <div className="chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={readings}>
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
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function RiskPanel({ navigate }) {
  return (
    <div className="panel risk-panel">
      <div className="panel-heading">
        <div>
          <h3>Glacier Risk Assessment</h3>
          <p>Illustrative assessment</p>
        </div>
      </div>
      <div className="risk-score">32<span>/100</span></div>
      <div className="risk-level">DEMO RISK SCORE</div>
      <div className="risk-bar"><span /></div>
      <p className="risk-description">
        This score is illustrative, not generated by a trained prediction model.
      </p>
      <button className="text-link" onClick={() => navigate("AI Prediction")}>
        Explore AI prediction <ArrowUpRight size={16} />
      </button>
    </div>
  );
}

function Infrastructure() {
  const devices = [
    ["ESP32 Controller", "Hardware"],
    ["DHT22 Sensor", "Temperature and humidity"],
    ["DS18B20 Sensor", "Water temperature"],
    ["GPS Module", "Location tracking"]
  ];

  return (
    <div className="panel">
      <div className="panel-heading">
        <div>
          <h3>Monitoring Infrastructure</h3>
          <p>Device integration status</p>
        </div>
      </div>
      {devices.map(([name, desc]) => (
        <div className="device-row" key={name}>
          <div><strong>{name}</strong><small>{desc}</small></div>
          <span className="pending">Pending</span>
        </div>
      ))}
    </div>
  );
}

function RecentActivity() {
  return (
    <div className="panel">
      <div className="panel-heading">
        <div>
          <h3>Recent Activity</h3>
          <p>System event log</p>
        </div>
      </div>
      <ActivityItem title="Dashboard initialized" desc="Demo environment loaded" color="blue" />
      <ActivityItem title="Sensor integration" desc="Awaiting ESP32 connection" color="grey" />
      <ActivityItem title="AI prediction module" desc="Awaiting model integration" color="grey" />
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

function ObservationTable() {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Air °C</th>
            <th>Humidity</th>
            <th>Water °C</th>
          </tr>
        </thead>
        <tbody>
          {readings.map(r => (
            <tr key={r.time}>
              <td>{r.time}</td>
              <td>{r.air.toFixed(1)}</td>
              <td>{r.humidity}%</td>
              <td>{r.water.toFixed(1)}</td>
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
