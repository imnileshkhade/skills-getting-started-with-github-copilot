document.addEventListener("DOMContentLoaded", () => {
  const activitiesListEl = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageEl = document.getElementById("message");

  function showMessage(text, type = "info") {
    messageEl.className = `message ${type}`;
    messageEl.textContent = text;
    messageEl.classList.remove("hidden");
    setTimeout(() => messageEl.classList.add("hidden"), 4000);
  }

  function createParticipantsSection(participants = []) {
    const container = document.createElement("div");
    container.className = "participants";

    const header = document.createElement("div");
    header.className = "participants-header";

    const title = document.createElement("span");
    title.textContent = "Participants";

    const countBadge = document.createElement("span");
    countBadge.className = "participant-count";
    countBadge.textContent = participants.length;

    header.appendChild(title);
    header.appendChild(countBadge);
    container.appendChild(header);

    if (!participants.length) {
      const none = document.createElement("div");
      none.className = "no-participants";
      none.textContent = "No participants yet — be the first!";
      container.appendChild(none);
      return container;
    }

    const ul = document.createElement("ul");
    ul.className = "participants-list";
    participants.forEach(email => {
      const li = document.createElement("li");
      li.textContent = email;
      ul.appendChild(li);
    });
    container.appendChild(ul);
    return container;
  }

  function renderActivities(activities) {
    activitiesListEl.innerHTML = "";
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

    Object.entries(activities).forEach(([name, info]) => {
      // populate select
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      activitySelect.appendChild(opt);

      // card
      const card = document.createElement("div");
      card.className = "activity-card";

      const title = document.createElement("h4");
      title.textContent = name;
      card.appendChild(title);

      const desc = document.createElement("p");
      desc.textContent = info.description;
      card.appendChild(desc);

      const sched = document.createElement("p");
      sched.innerHTML = `<strong>Schedule:</strong> ${info.schedule}`;
      card.appendChild(sched);

      // participants section
      const participantsSection = createParticipantsSection(info.participants || []);
      card.appendChild(participantsSection);

      activitiesListEl.appendChild(card);
    });
  }

  async function loadActivities() {
    activitiesListEl.innerHTML = "<p>Loading activities...</p>";
    try {
      const res = await fetch("/activities");
      if (!res.ok) throw new Error("Failed to load activities");
      const data = await res.json();
      renderActivities(data);
    } catch (err) {
      activitiesListEl.innerHTML = `<p class="error">Unable to load activities.</p>`;
      console.error(err);
    }
  }

  signupForm.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const email = document.getElementById("email").value.trim();
    const activityName = document.getElementById("activity").value;
    if (!email || !activityName) {
      showMessage("Please provide an email and select an activity.", "error");
      return;
    }

    try {
      const encodedName = encodeURIComponent(activityName);
      const encodedEmail = encodeURIComponent(email);
      const res = await fetch(`/activities/${encodedName}/signup?email=${encodedEmail}`, {
        method: "POST"
      });

      if (res.ok) {
        // update local UI: add participant to card and update count
        // Re-fetch activities to keep UI consistent and simple
        await loadActivities();
        showMessage(`Signed up ${email} for ${activityName}`, "success");
        signupForm.reset();
      } else {
        const err = await res.json().catch(() => ({}));
        showMessage(err.detail || "Failed to sign up", "error");
      }
    } catch (err) {
      console.error(err);
      showMessage("Network error when signing up", "error");
    }
  });

  // initial load
  loadActivities();
});
