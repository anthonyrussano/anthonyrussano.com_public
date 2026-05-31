const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function initNavigation() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".primary-nav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  nav.addEventListener("click", () => {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  });
}

function initReveals() {
  const reveals = document.querySelectorAll(".reveal");
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    reveals.forEach((item) => item.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );
  reveals.forEach((item) => observer.observe(item));
}

function initProjectFilters() {
  const filters = document.querySelectorAll("[data-filter]");
  const projects = document.querySelectorAll("[data-category]");

  filters.forEach((filter) => {
    filter.addEventListener("click", () => {
      filters.forEach((item) => item.classList.remove("active"));
      filter.classList.add("active");
      projects.forEach((project) => {
        const categories = project.dataset.category.split(" ");
        project.hidden = filter.dataset.filter !== "all" && !categories.includes(filter.dataset.filter);
      });
    });
  });
}

function initNetworkCanvas() {
  if (prefersReducedMotion) return;
  const canvas = document.getElementById("network-canvas");
  const context = canvas.getContext("2d");
  let nodes = [];
  let width = 0;
  let height = 0;
  let animationFrame;

  function resize() {
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * scale);
    canvas.height = Math.floor(height * scale);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(scale, 0, 0, scale, 0, 0);
    const count = Math.min(66, Math.max(28, Math.floor(width / 19)));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.16,
      vy: (Math.random() - 0.5) * 0.16,
    }));
  }

  function draw() {
    context.clearRect(0, 0, width, height);
    nodes.forEach((node, index) => {
      node.x += node.vx;
      node.y += node.vy;
      if (node.x < 0 || node.x > width) node.vx *= -1;
      if (node.y < 0 || node.y > height) node.vy *= -1;

      context.beginPath();
      context.fillStyle = "rgba(155, 255, 176, 0.22)";
      context.arc(node.x, node.y, 1.35, 0, Math.PI * 2);
      context.fill();

      for (let nextIndex = index + 1; nextIndex < nodes.length; nextIndex += 1) {
        const next = nodes[nextIndex];
        const distance = Math.hypot(node.x - next.x, node.y - next.y);
        if (distance < 126) {
          context.beginPath();
          context.strokeStyle = `rgba(85, 214, 190, ${0.075 * (1 - distance / 126)})`;
          context.moveTo(node.x, node.y);
          context.lineTo(next.x, next.y);
          context.stroke();
        }
      }
    });
    animationFrame = requestAnimationFrame(draw);
  }

  resize();
  draw();
  window.addEventListener("resize", () => {
    cancelAnimationFrame(animationFrame);
    resize();
    draw();
  });
}

function renderPulse(payload) {
  const total = Number(payload.total || 0);
  const bars = document.getElementById("pulse-bars");
  document.getElementById("pulse-count").textContent = total;
  document.getElementById("panel-pulse-count").textContent = total;
  document.getElementById("pulse-edge").textContent = payload.edge || "EDGE";
  document.getElementById("edge-readout").textContent = payload.edge || "SYNC";

  bars.innerHTML = "";
  payload.topics.forEach((topic) => {
    const width = total ? Math.max(4, Math.round((topic.count / total) * 100)) : 0;
    const row = document.createElement("div");
    row.className = "pulse-row";
    row.innerHTML = `
      <span>${topic.label}</span>
      <span class="pulse-track"><i class="pulse-fill" style="width: ${width}%"></i></span>
      <b>${topic.count}</b>
    `;
    bars.append(row);
  });
}

async function loadPulse() {
  try {
    const response = await fetch("/api/pulse", { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("Pulse request failed");
    renderPulse(await response.json());
  } catch {
    document.getElementById("pulse-bars").innerHTML = "<p>Edge pulse is reconnecting...</p>";
    document.getElementById("signal-status").textContent = "Pulse service is reconnecting. Try again shortly.";
  }
}

function initSignals() {
  const buttons = document.querySelectorAll("[data-topic]");
  const status = document.getElementById("signal-status");
  const savedTopic = window.localStorage.getItem("network-pulse-topic");

  if (savedTopic) {
    buttons.forEach((button) => {
      button.disabled = true;
      button.classList.toggle("selected", button.dataset.topic === savedTopic);
    });
    status.textContent = "Signal received. Find me at Summit and continue the thread.";
  }

  buttons.forEach((button) => {
    button.addEventListener("click", async () => {
      if (window.localStorage.getItem("network-pulse-topic")) return;
      buttons.forEach((item) => { item.disabled = true; });
      status.textContent = "Transmitting anonymous signal...";

      try {
        const response = await fetch("/api/pulse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: button.dataset.topic }),
        });
        if (!response.ok) throw new Error("Signal request failed");

        window.localStorage.setItem("network-pulse-topic", button.dataset.topic);
        button.classList.add("selected");
        status.textContent = "Signal received. Find me at Summit and continue the thread.";
        renderPulse(await response.json());
      } catch {
        buttons.forEach((item) => { item.disabled = false; });
        status.textContent = "Signal could not be sent. Try again in a moment.";
      }
    });
  });
}

async function loadGitHubTelemetry() {
  try {
    const response = await fetch("/api/github", { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("GitHub request failed");
    const payload = await response.json();
    document.getElementById("repo-count").textContent = payload.publicRepos;
    document.getElementById("owned-repos").textContent = payload.ownedRepos;
    document.getElementById("github-followers").textContent = payload.followers;
  } catch {
    document.getElementById("repo-count").textContent = "100+";
    document.getElementById("owned-repos").textContent = "90+";
    document.getElementById("github-followers").textContent = "--";
  }
}

document.getElementById("current-year").textContent = new Date().getFullYear();
initNavigation();
initReveals();
initProjectFilters();
initNetworkCanvas();
initSignals();
loadPulse();
loadGitHubTelemetry();
