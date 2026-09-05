// =========================================================
// BloodLink — Offline Frontend Hackathon Prototype
// No backend, APIs, database, authentication or real AI.
// =========================================================

const state = {
  role: null,
  user: { name: "CityCare Hospital", contact: "demo@bloodlink.local" },
  currentPage: "dashboard",
  selectedMatch: null,
  request: null,
  notificationCount: 3,
  confirmed: false,
  resolved: false,
};

const bloodInventory = [
  {
    group: "A+",
    units: 18,
    expiry: "2 units expiring in 4 days",
    status: "available",
  },
  { group: "A-", units: 4, expiry: "Low stock", status: "low" },
  { group: "B+", units: 2, expiry: "Critical stock", status: "critical" },
  { group: "B-", units: 9, expiry: "Stable", status: "available" },
  { group: "AB+", units: 7, expiry: "Stable", status: "available" },
  { group: "AB-", units: 3, expiry: "Low stock", status: "low" },
  {
    group: "O+",
    units: 24,
    expiry: "3 units expiring in 2 days",
    status: "available",
  },
  { group: "O-", units: 1, expiry: "Critical stock", status: "critical" },
];

const donors = [
  {
    name: "Rahul",
    group: "O+",
    distance: "2.9 km",
    availability: "Available",
    verification: "Verified",
    cooldown: "Eligible",
  },
  {
    name: "Ayesha",
    group: "O+",
    distance: "4.2 km",
    availability: "Available",
    verification: "Verified",
    cooldown: "Eligible",
  },
  {
    name: "Arjun",
    group: "A+",
    distance: "3.6 km",
    availability: "Available",
    verification: "Verified",
    cooldown: "Eligible",
  },
  {
    name: "Maya",
    group: "B+",
    distance: "5.1 km",
    availability: "Available",
    verification: "Verified",
    cooldown: "Eligible",
  },
  {
    name: "Dev",
    group: "AB+",
    distance: "6.8 km",
    availability: "Available",
    verification: "Verified",
    cooldown: "Eligible",
  },
];

const bloodBanks = [
  {
    name: "CityCare Blood Bank",
    group: "O+",
    units: 8,
    distance: "2.4 km",
    score: 96,
  },
  {
    name: "LifeLine Blood Bank",
    group: "O+",
    units: 5,
    distance: "4.1 km",
    score: 89,
  },
  {
    name: "Verified Donor Network",
    group: "O+",
    units: 1,
    distance: "5.7 km",
    score: 82,
  },
];

const notifications = [
  {
    icon: "🚨",
    title: "Critical blood request received",
    text: "Demo request BL-1024 needs urgent coordination.",
    unread: true,
  },
  {
    icon: "🩸",
    title: "O+ units available nearby",
    text: "CityCare Blood Bank has simulated availability.",
    unread: true,
  },
  {
    icon: "✅",
    title: "CityCare Blood Bank confirmed request",
    text: "Confirmation is simulated for this prototype.",
    unread: false,
  },
  {
    icon: "⚠",
    title: "A+ inventory is low",
    text: "4 simulated units currently available.",
    unread: false,
  },
  {
    icon: "⏳",
    title: "3 units approaching expiry",
    text: "O+ units are flagged for expiry monitoring.",
    unread: false,
  },
];

const pageTitles = {
  dashboard: "Hospital Dashboard",
  emergency: "Emergency Blood Request",
  inventory: "Blood Inventory",
  matching: "Smart Matching",
  notifications: "Notifications",
  history: "Request History",
  donors: "Donor Network",
  admin: "Admin Dashboard",
};

const $ = (id) => document.getElementById(id);
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[c],
  );

function toast(title, text = "", type = "success") {
  const box = document.createElement("div");
  box.className = `toast ${type}`;
  box.innerHTML = `<div class="toast-icon">${type === "success" ? "✓" : "!"}</div><div><strong>${esc(title)}</strong><p>${esc(text)}</p></div>`;
  $("toastContainer").appendChild(box);
  setTimeout(() => box.remove(), 3400);
}

function initials(name) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((x) => x[0])
      .join("")
      .toUpperCase() || "BL"
  );
}

function showLogin() {
  $("loginPage").classList.remove("hidden");
  $("appPage").classList.add("hidden");
}

function showApp() {
  $("loginPage").classList.add("hidden");
  $("appPage").classList.remove("hidden");
  $("profileName").textContent = state.user.name;
  $("profileRole").textContent = roleLabel(state.role);
  $("profileAvatar").textContent = initials(state.user.name);
  if (state.role === "admin") $("topTitle").textContent = "Admin Dashboard";
  renderPage("dashboard");
}

function roleLabel(role) {
  return (
    {
      hospital: "Hospital",
      bloodbank: "Blood Bank",
      donor: "Donor",
      admin: "Admin",
    }[role] || "Demo User"
  );
}

function renderPage(page) {
  state.currentPage = page;
  document
    .querySelectorAll(".nav-item[data-page]")
    .forEach((b) => b.classList.toggle("active", b.dataset.page === page));
  if (state.role === "admin" && page === "dashboard")
    $("topTitle").textContent = "Admin Dashboard";
  else $("topTitle").textContent = pageTitles[page] || "BloodLink";
  const content = $("pageContent");
  if (state.role === "admin" && page === "dashboard")
    content.innerHTML = adminPage();
  else if (page === "dashboard") content.innerHTML = dashboardPage();
  else if (page === "emergency") content.innerHTML = emergencyPage();
  else if (page === "inventory") content.innerHTML = inventoryPage();
  else if (page === "matching") content.innerHTML = matchingPage();
  else if (page === "notifications") content.innerHTML = notificationsPage();
  else if (page === "history") content.innerHTML = historyPage();
  else if (page === "donors") content.innerHTML = donorsPage();
  bindDynamicButtons();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function statusLabel(s) {
  return s === "available" ? "Available" : s === "low" ? "Low" : "Critical";
}

function stats() {
  const total = bloodInventory.reduce((a, b) => a + b.units, 0);
  return {
    total,
    critical: bloodInventory.filter((x) => x.status === "critical").length,
    active: state.request && !state.resolved ? 1 : 0,
  };
}

function dashboardPage() {
  const s = stats();
  return `
  <div class="page-head"><div><div class="section-kicker">OVERVIEW</div><h1>Good afternoon, ${esc(state.user.name.split(" ")[0])}.</h1><p>Monitor simulated inventory and coordinate emergency requests from one place.</p></div><button class="btn btn-primary" data-action="open-request">+ Emergency Request</button></div>
  <div class="stats-grid">
    <div class="stat"><div class="stat-label">AVAILABLE BLOOD UNITS</div><div class="stat-value">${s.total}</div><div class="stat-foot good">● Simulated network stock</div></div>
    <div class="stat"><div class="stat-label">CRITICAL BLOOD GROUPS</div><div class="stat-value">${s.critical}</div><div class="stat-foot bad">● Needs attention</div></div>
    <div class="stat"><div class="stat-label">ACTIVE REQUESTS</div><div class="stat-value">${s.active}</div><div class="stat-foot ${s.active ? "warn" : "good"}">● ${s.active ? "Emergency coordination" : "No active requests"}</div></div>
    <div class="stat"><div class="stat-label">NEARBY RESOURCES</div><div class="stat-value">12</div><div class="stat-foot good">● Demo verified network</div></div>
  </div>
  <div class="section"><div class="section-title"><h3>Blood Inventory</h3><span>Simulated real-time inventory</span></div>
    <div class="inventory-grid">${bloodInventory.map((x) => `<div class="blood-card"><div class="blood-type">${x.group}</div><div class="units">${x.units} units</div><span class="status ${x.status}">${statusLabel(x.status)}</span></div>`).join("")}</div>
  </div>
  <div class="split">
    <div class="section request-hero"><div><div class="section-kicker">FAST RESPONSE</div><h2>Need blood urgently?</h2><p>Create an emergency request and the Demo Matching Engine will rank suitable simulated blood-bank and donor resources.</p></div><button class="btn btn-primary" data-action="open-request">Find Blood →</button></div>
    <div class="section"><div class="section-title"><h3>Recent Activity</h3><span>Today</span></div><div class="quick-list">
      <div class="quick-row"><div><strong>O+ inventory checked</strong><small>CityCare Blood Bank · 2 min ago</small></div><span class="pill">Verified</span></div>
      <div class="quick-row"><div><strong>A+ stock warning</strong><small>4 simulated units remaining</small></div><span class="pill">Low</span></div>
      <div class="quick-row"><div><strong>Network sync</strong><small>Prototype data refreshed</small></div><span class="pill">Demo</span></div>
    </div></div>
  </div>`;
}

function emergencyPage() {
  return `<div class="page-head"><div><div class="section-kicker">EMERGENCY REQUEST</div><h1>Create a Blood Request</h1><p>Start the demo workflow: request → match → notify → receive → resolve.</p></div></div>
  <div class="section" style="max-width:760px"><form id="inlineRequestForm"><div class="form-grid">
    <label>Blood Group<select id="iBloodGroup" required><option value="">Select blood group</option>${["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((x) => `<option>${x}</option>`).join("")}</select></label>
    <label>Units Required<input id="iUnits" type="number" min="1" max="50" value="2" required></label>
    <label>Priority<select id="iPriority"><option>Critical</option><option>Urgent</option><option>Normal</option></select></label>
    <label>Hospital / Location<input id="iLocation" value="${esc(state.user.name)} · Central Zone" required></label>
  </div><label>Additional Notes<textarea id="iNotes" placeholder="Optional demo notes"></textarea></label>
  <button class="btn btn-primary btn-wide" type="submit">Find Blood <span>→</span></button></form></div>
  <div class="section" style="max-width:760px"><div class="section-title"><h3>Demo workflow</h3><span>5 steps</span></div><div class="factor-row"><span class="factor">01 Request Created</span><span class="factor">02 Smart Match</span><span class="factor">03 Notify</span><span class="factor">04 Blood Received</span><span class="factor">05 Resolved</span></div></div>`;
}

function inventoryPage() {
  return `<div class="page-head"><div><div class="section-kicker">INVENTORY</div><h1>Blood Inventory</h1><p>Simulated stock visibility for all 8 blood groups.</p></div><span class="engine">SIMULATED DATA</span></div>
  <div class="section"><div class="inventory-grid">${bloodInventory.map((x) => `<div class="blood-card"><div class="blood-type">${x.group}</div><div class="units">${x.units} units</div><span class="status ${x.status}">${statusLabel(x.status)}</span><div style="font-size:8px;color:#6f7b8b;margin-top:9px;line-height:1.5">${x.expiry}</div></div>`).join("")}</div></div>
  <div class="section"><div class="section-title"><h3>Expiry Monitoring</h3><span class="expiry">⚠ Expiring Soon</span></div><table class="table"><thead><tr><th>Unit</th><th>Blood Group</th><th>Expiry</th><th>Action</th></tr></thead><tbody>
  <tr><td>#O245</td><td>O+</td><td class="expiry">2 days</td><td>Priority use</td></tr><tr><td>#O246</td><td>O+</td><td class="expiry">2 days</td><td>Priority use</td></tr><tr><td>#A182</td><td>A+</td><td class="expiry">4 days</td><td>Monitor</td></tr></tbody></table></div>`;
}

function getMatches() {
  const group = state.request?.group || "O+";
  const base = bloodBanks.map((x, i) => ({
    ...x,
    group: i === 0 || i === 1 ? group : group,
    type: i === 2 ? "Verified Donor" : "Blood Bank",
  }));
  return base;
}

function matchingPage() {
  if (!state.request)
    return `<div class="page-head"><div><div class="section-kicker">SMART MATCHING</div><h1>No active request</h1><p>Create an emergency request first.</p></div><button class="btn btn-primary" data-action="open-request">Create Request</button></div>`;
  if (!state.request.matchesReady)
    return `<div class="matching-wrap"><div class="page-head"><div><div class="section-kicker">DEMO MATCHING ENGINE</div><h1>Smart Matching</h1><p>Finding the most suitable verified resources...</p></div><span class="engine">DEMO MATCHING ENGINE</span></div><div class="section loading-box"><div><div class="loader"></div><strong>Ranking simulated resources</strong><div class="muted" style="font-size:10px">Checking compatibility, availability, distance & verification</div></div></div></div>`;
  const matches = getMatches();
  return `<div class="matching-wrap"><div class="page-head"><div><div class="section-kicker">SMART MATCHING</div><h1>Best Matches Found</h1><p>${state.request.group} · ${state.request.units} units · ${state.request.priority} priority</p></div><span class="engine">DEMO MATCHING ENGINE</span></div>
  <div class="match-list">${matches.map((m, i) => `<div class="match-card ${i === 0 ? "best" : ""}"><div><div class="match-top"><span class="rank">MATCH #${i + 1}</span><h3>${m.name}</h3><span class="verified">✓ Verified</span></div><div class="match-meta"><span>🩸 ${m.group}</span><span>▣ ${m.units} units available</span><span>⌖ ${m.distance}</span><span>● Available</span></div></div><div class="score">${m.score}%<small>match score</small></div></div>`).join("")}</div>
  <div class="why"><h3>Why this match?</h3><p>The demo ranking considers the request's blood group and priority alongside simulated availability, distance and verification status. This is a rules-based frontend simulation, not a real AI model.</p><div class="factor-row"><span class="factor">Blood compatibility</span><span class="factor">Availability</span><span class="factor">Distance</span><span class="factor">Verification</span><span class="factor">Priority</span></div></div>
  <button class="btn btn-primary" data-action="select-match" style="margin-top:16px">Select Best Match →</button></div>`;
}

function coordinationPage() {
  const r = state.request;
  const resource = state.selectedMatch || "CityCare Blood Bank";
  const steps = [
    ["Request Created", true],
    ["Matching Completed", true],
    ["Resource Found", true],
    ["Notification Sent", true],
    ["Blood Collection", state.confirmed],
    ["Request Resolved", state.resolved],
  ];
  return `<div class="matching-wrap"><div class="page-head"><div><div class="section-kicker">NOTIFY & COORDINATE</div><h1>Coordinate Resource</h1><p>Emergency Request #${r.id}</p></div><span class="engine">PROTOTYPE NOTIFICATION SERVICE</span></div>
  <div class="section"><div class="detail-grid"><div class="detail"><small>BLOOD GROUP</small><strong>${r.group}</strong></div><div class="detail"><small>UNITS REQUIRED</small><strong>${r.units}</strong></div><div class="detail"><small>PRIORITY</small><strong class="expiry">${r.priority}</strong></div><div class="detail"><small>SELECTED RESOURCE</small><strong>${esc(resource)}</strong></div></div>
  <div class="timeline">${steps.map((s, i) => `<div class="timeline-item ${s[1] ? "done" : i === 4 ? "current" : ""}"><div class="dot">${s[1] ? "✓" : ""}</div><span>${s[0]}</span></div>`).join("")}</div>
  <div class="notify-card"><div><h3>${state.confirmed ? "✓ CityCare Blood Bank has confirmed the request." : "CityCare Blood Bank has been notified."}</h3><p>${state.confirmed ? "Confirmation is simulated for this demo." : "Prototype notification service · No real message was sent."}</p></div>${!state.confirmed ? '<button class="btn btn-primary" data-action="confirm-resource">Simulate Confirmation</button>' : '<button class="btn btn-primary" data-action="go-resolve">Proceed to Blood Collection →</button>'}</div></div></div>`;
}

function resolvePage() {
  const r = state.request;
  if (!r) return dashboardPage();
  const steps = [
    "Request Created",
    "Resource Matched",
    "Resource Notified",
    "Resource Confirmed",
    "Blood Received",
    "Request Resolved",
  ];
  return `<div class="matching-wrap"><div class="page-head"><div><div class="section-kicker">FINAL STEP</div><h1>Blood Request Resolution</h1><p>Complete the simulated emergency workflow.</p></div></div>
  <div class="section"><div class="detail-grid"><div class="detail"><small>REQUEST ID</small><strong>#${r.id}</strong></div><div class="detail"><small>BLOOD GROUP</small><strong>${r.group}</strong></div><div class="detail"><small>UNITS</small><strong>${r.units}</strong></div><div class="detail"><small>MATCHED RESOURCE</small><strong>${esc(state.selectedMatch || "CityCare Blood Bank")}</strong></div></div>
  <div class="timeline">${steps.map((s, i) => `<div class="timeline-item ${state.resolved || i < 5 ? "done" : i === 5 ? "current" : ""}"><div class="dot">${state.resolved || i < 5 ? "✓" : ""}</div><span>${s}</span></div>`).join("")}</div>
  ${state.resolved ? `<div class="resolve-banner"><div class="check-circle">✓</div><h2>Emergency request successfully resolved.</h2><p>Request #${r.id} is marked RESOLVED in this prototype.</p><button class="btn btn-secondary" data-page="dashboard" style="margin-top:12px">Back to Dashboard</button></div>` : `<div class="notify-card"><div><h3>Blood collection is ready</h3><p>Confirm simulated receipt to resolve the emergency request.</p></div><button class="btn btn-primary" data-action="resolve">Confirm Blood Received</button></div>`}
  </div></div>`;
}

function notificationsPage() {
  return `<div class="page-head"><div><div class="section-kicker">ACTIVITY CENTER</div><h1>Notifications</h1><p>Simulated events from the BloodLink prototype network.</p></div><span class="engine">DEMO NOTIFICATIONS</span></div>
  <div class="section"><div class="notification-list">${notifications.map((n) => `<div class="notification ${n.unread ? "unread" : ""}"><div class="n-icon">${n.icon}</div><div><strong>${n.title}</strong><p>${n.text}</p></div></div>`).join("")}</div></div>`;
}

function historyPage() {
  const r = state.request;
  return `<div class="page-head"><div><div class="section-kicker">REQUEST HISTORY</div><h1>Request History</h1><p>Previously created demo requests.</p></div></div>
  <div class="section"><table class="table"><thead><tr><th>Request</th><th>Blood</th><th>Units</th><th>Priority</th><th>Status</th></tr></thead><tbody>
  ${r ? `<tr><td>#${r.id}</td><td>${r.group}</td><td>${r.units}</td><td class="expiry">${r.priority}</td><td><span class="status ${state.resolved ? "available" : "low"}">${state.resolved ? "Resolved" : "Active"}</span></td></tr>` : ""}
  <tr><td>#BL-1019</td><td>A+</td><td>2</td><td>Urgent</td><td><span class="status available">Resolved</span></td></tr>
  <tr><td>#BL-1014</td><td>B+</td><td>3</td><td>Normal</td><td><span class="status available">Resolved</span></td></tr>
  </tbody></table></div>`;
}

function donorsPage() {
  return `<div class="page-head"><div><div class="section-kicker">VERIFIED NETWORK</div><h1>Donor Management</h1><p>Fictional demo donor profiles — no real personal information.</p></div></div>
  <div class="donor-grid">${donors.map((d) => `<div class="donor-card"><div style="display:flex;justify-content:space-between;align-items:center"><h3>${d.name}</h3><span class="verified">✓ ${d.verification}</span></div><div class="donor-type">${d.group}</div><div class="donor-info"><div>Distance <strong>${d.distance}</strong></div><div>Availability <strong>${d.availability}</strong></div><div>Cooldown <strong>${d.cooldown}</strong></div></div></div>`).join("")}</div>
  <div class="notice">Final donation eligibility must be confirmed by medical staff. All donor names and data on this page are fictional demo records.</div>`;
}

function adminPage() {
  const total = stats().total;
  return `<div class="page-head"><div><div class="section-kicker">ADMIN CONSOLE</div><h1>System Overview</h1><p>High-level visibility across the simulated BloodLink network.</p></div><span class="engine">DEMO ADMIN</span></div>
  <div class="stats-grid"><div class="stat"><div class="stat-label">TOTAL BLOOD UNITS</div><div class="stat-value">${total}</div><div class="stat-foot good">● Network inventory</div></div><div class="stat"><div class="stat-label">CRITICAL STOCK</div><div class="stat-value">${bloodInventory.filter((x) => x.status === "critical").length}</div><div class="stat-foot bad">● Blood groups</div></div><div class="stat"><div class="stat-label">ACTIVE EMERGENCY REQUESTS</div><div class="stat-value">${stats().active}</div><div class="stat-foot warn">● Simulated</div></div><div class="stat"><div class="stat-label">VERIFIED DONORS</div><div class="stat-value">${donors.length}</div><div class="stat-foot good">● Demo profiles</div></div></div>
  <div class="admin-grid"><div class="section"><div class="section-title"><h3>Inventory Status</h3><span>8 blood groups</span></div><div class="bars">${[
    ["Available", 62],
    ["Low", 25],
    ["Critical", 13],
  ]
    .map(
      (x) =>
        `<div class="bar-line"><span>${x[0]}</span><div class="bar"><i style="width:${x[1]}%"></i></div><b>${x[1]}%</b></div>`,
    )
    .join("")}</div></div>
  <div class="section"><div class="section-title"><h3>Verified Network</h3><span>Demo entities</span></div><div class="bars">${[
    ["Blood Banks", 78],
    ["Donors", 62],
    ["Hospitals", 44],
  ]
    .map(
      (x) =>
        `<div class="bar-line"><span>${x[0]}</span><div class="bar"><i style="width:${x[1]}%"></i></div><b>${x[1]}%</b></div>`,
    )
    .join("")}</div></div></div>
  <div class="section"><div class="section-title"><h3>Emergency Requests</h3><span>Simulated</span></div><div class="factor-row"><span class="factor">Active: ${stats().active}</span><span class="factor">Resolved: 18</span><span class="factor">Today: 3</span></div></div>`;
}

function openRequest() {
  $("requestModal").classList.remove("hidden");
}
function closeModal(id) {
  $(id).classList.add("hidden");
}

function createRequest(data) {
  if (!data.group || !data.units || Number(data.units) < 1 || !data.location) {
    toast("Check the form", "Please complete the required fields.", "error");
    return;
  }
  state.request = {
    id: "BL-1024",
    group: data.group,
    units: Number(data.units),
    priority: data.priority,
    location: data.location,
    notes: data.notes,
    matchesReady: false,
  };
  state.resolved = false;
  state.confirmed = false;
  state.selectedMatch = null;
  closeModal("requestModal");
  toast(
    "Emergency request created",
    `#${state.request.id} · ${data.group} · ${data.units} units`,
  );
  renderPage("matching");
  setTimeout(() => {
    state.request.matchesReady = true;
    renderPage("matching");
    toast("Smart matching complete", "Top demo match scored 96%.");
  }, 1400);
}

function bindDynamicButtons() {
  document
    .querySelectorAll("[data-page]")
    .forEach((b) => (b.onclick = () => renderPage(b.dataset.page)));
  document
    .querySelectorAll('[data-action="open-request"]')
    .forEach((b) => (b.onclick = openRequest));
  document.querySelectorAll('[data-action="select-match"]').forEach(
    (b) =>
      (b.onclick = () => {
        state.selectedMatch = "CityCare Blood Bank";
        state.currentPage = "coordination";
        $("topTitle").textContent = "Notify & Coordinate";
        $("pageContent").innerHTML = coordinationPage();
        bindDynamicButtons();
      }),
  );
  document.querySelectorAll('[data-action="confirm-resource"]').forEach(
    (b) =>
      (b.onclick = () => {
        state.confirmed = true;
        toast(
          "Resource confirmed",
          "CityCare Blood Bank confirmation simulated.",
        );
        $("pageContent").innerHTML = coordinationPage();
        bindDynamicButtons();
      }),
  );
  document.querySelectorAll('[data-action="go-resolve"]').forEach(
    (b) =>
      (b.onclick = () => {
        state.currentPage = "resolve";
        $("topTitle").textContent = "Blood Request Resolution";
        $("pageContent").innerHTML = resolvePage();
        bindDynamicButtons();
      }),
  );
  document.querySelectorAll('[data-action="resolve"]').forEach(
    (b) =>
      (b.onclick = () => {
        state.resolved = true;
        state.notificationCount = Math.max(0, state.notificationCount - 1);
        $("navNotif").textContent = state.notificationCount;
        toast("Request resolved", "Emergency request successfully resolved.");
        $("topTitle").textContent = "Blood Request Resolution";
        $("pageContent").innerHTML = resolvePage();
        bindDynamicButtons();
      }),
  );
  const inline = $("inlineRequestForm");
  if (inline)
    inline.onsubmit = (e) => {
      e.preventDefault();
      createRequest({
        group: $("iBloodGroup").value,
        units: $("iUnits").value,
        priority: $("iPriority").value,
        location: $("iLocation").value,
        notes: $("iNotes").value,
      });
    };
}

document.querySelectorAll(".role-card").forEach((card) => {
  card.onclick = () => {
    document
      .querySelectorAll(".role-card")
      .forEach((c) => c.classList.remove("selected"));
    card.classList.add("selected");
    state.role = card.dataset.role;
    $("roleGrid").classList.add("hidden");
    $("loginForm").classList.remove("hidden");
    $("loginName").value = {
      hospital: "CityCare Hospital",
      bloodbank: "CityCare Blood Bank",
      donor: "Demo Donor",
      admin: "BloodLink Admin",
    }[state.role];
  };
});

$("changeRole").onclick = () => {
  $("loginForm").classList.add("hidden");
  $("roleGrid").classList.remove("hidden");
  document
    .querySelectorAll(".role-card")
    .forEach((c) => c.classList.remove("selected"));
};
$("loginForm").onsubmit = (e) => {
  e.preventDefault();
  state.user.name = $("loginName").value.trim() || "Demo User";
  state.user.contact = $("loginContact").value.trim() || "demo@bloodlink.local";
  showApp();
  toast("Demo login successful", `Welcome, ${state.user.name}.`);
};
$("requestForm").onsubmit = (e) => {
  e.preventDefault();
  createRequest({
    group: $("bloodGroup").value,
    units: $("unitsRequired").value,
    priority: $("priority").value,
    location: $("requestLocation").value,
    notes: $("requestNotes").value,
  });
};
document
  .querySelectorAll("[data-close]")
  .forEach((b) => (b.onclick = () => closeModal(b.dataset.close)));
$("requestModal").onclick = (e) => {
  if (e.target === $("requestModal")) closeModal("requestModal");
};
$("logoutBtn").onclick = () => {
  state.role = null;
  state.request = null;
  state.resolved = false;
  state.confirmed = false;
  showLogin();
  toast("Logged out", "Demo session ended.");
};
$("notifBtn").onclick = () => renderPage("notifications");
$("mobileMenu").onclick = () => $("sidebar").classList.toggle("open");
document.addEventListener("click", (e) => {
  const nav = e.target.closest(".nav-item[data-page]");
  if (nav) $("sidebar").classList.remove("open");
});

// Allow navigation to coordination/resolution without exposing extra sidebar items.
const originalRenderPage = renderPage;
renderPage = function (page) {
  if (page === "coordination") {
    $("topTitle").textContent = "Notify & Coordinate";
    $("pageContent").innerHTML = coordinationPage();
    bindDynamicButtons();
    return;
  }
  if (page === "resolve") {
    $("topTitle").textContent = "Blood Request Resolution";
    $("pageContent").innerHTML = resolvePage();
    bindDynamicButtons();
    return;
  }
  originalRenderPage(page);
};

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal("requestModal");
});
