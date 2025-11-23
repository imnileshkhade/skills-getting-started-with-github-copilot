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

      const span = document.createElement("span");
      span.className = "participant-email";
      span.textContent = email;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "participant-delete";
      btn.title = `Unregister ${email}`;
      btn.innerHTML = `\u{1F5D1}`; // trash can emoji as icon

      // click handler will be attached later via event delegation in renderActivities
      li.appendChild(span);
      li.appendChild(btn);
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

      // Attach event listener for delete buttons (delegation scoped to this card)
      participantsSection.addEventListener("click", async (ev) => {
        const btn = ev.target.closest(".participant-delete");
        if (!btn) return;
        const li = btn.closest("li");
        if (!li) return;
        const emailSpan = li.querySelector(".participant-email");
        if (!emailSpan) return;
        const email = emailSpan.textContent.trim();

        if (!confirm(`Unregister ${email} from ${name}?`)) return;

        try {
          const res = await fetch(`/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(email)}`, {
            method: "DELETE"
          });

          if (res.ok) {
            await loadActivities();
            showMessage(`Unregistered ${email} from ${name}`, "success");
          } else {
            const err = await res.json().catch(() => ({}));
            showMessage(err.detail || "Failed to unregister", "error");
          }
        } catch (err) {
          console.error(err);
          showMessage("Network error when unregistering", "error");
        }
      });

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
