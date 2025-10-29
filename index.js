/**
 * @typedef Party
 * @property {number} id
 * @property {string} name
 * @property {string} date
 * @property {string} description
 * @property {string} location
 */

/**
 * @typedef Guest
 * @property {number} id
 * @property {string} name
 */

/**
 * @typedef RSVP
 * @property {number} id
 * @property {number} eventId
 * @property {number} guestId
 */

const BASE = "https://fsa-crud-2aa9294fe819.herokuapp.com/api";
const COHORT = "2509-pt-mac";
const RESOURCE = "/events";
const API = `${BASE}/${COHORT}${RESOURCE}`;
const GUESTS_API = `${BASE}/${COHORT}/guests`;
const RSVPS_API = `${BASE}/${COHORT}/rsvps`;

let parties = [];
let selectedParty;
let guests = [];
let rsvps = [];

async function getParties() {
  try {
    const response = await fetch(API);
    const data = await response.json();
    parties = data.data;
  } catch (err) {
    console.error("Error fetching parties:", err);
  }
}

async function getParty(id) {
  try {
    const response = await fetch(`${API}/${id}`);
    const data = await response.json();
    selectedParty = data.data;
    render();
  } catch (err) {
    console.error("Error fetching party:", err);
  }
}

async function getGuestsAndRsvps() {
  try {
    const [guestsRes, rsvpsRes] = await Promise.all([
      fetch(GUESTS_API),
      fetch(RSVPS_API),
    ]);
    guests = (await guestsRes.json()).data;
    rsvps = (await rsvpsRes.json()).data;
  } catch (err) {
    console.error("Error fetching guests or RSVPs:", err);
  }
}

async function createParty(partyData) {
  try {
    const response = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partyData),
    });

    if (!response.ok) throw new Error("Failed to create party");

    await getParties();
    render();
  } catch (err) {
    console.error("Error creating party:", err);
  }
}

async function deleteParty(id) {
  try {
    const response = await fetch(`${API}/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete party");

    selectedParty = null;
    await getParties();
    render();
  } catch (err) {
    console.error("Error deleting party:", err);
  }
}

function PartyListItem(party) {
  const $li = document.createElement("li");
  const $a = document.createElement("a");
  $a.href = "#selected";
  $a.textContent = party.name;

  if (selectedParty && selectedParty.id === party.id) {
    $a.classList.add("selected");
  }

  $a.addEventListener("click", () => getParty(party.id));
  $li.appendChild($a);
  return $li;
}

function PartyList() {
  const $ul = document.createElement("ul");
  $ul.classList.add("lineup");

  parties.forEach((party) => {
    $ul.append(PartyListItem(party));
  });

  return $ul;
}

function PartyDetails() {
  const $div = document.createElement("div");
  $div.classList.add("party-details");

  if (!selectedParty) {
    const $p = document.createElement("p");
    $p.textContent = "Please select a party to learn details.";
    $div.appendChild($p);
    return $div;
  }

  const formattedDate = new Date(selectedParty.date).toLocaleDateString(
    undefined,
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  const partyRsvps = rsvps.filter((r) => r.eventId === selectedParty.id);
  const partyGuests = partyRsvps.map((r) =>
    guests.find((g) => g.id === r.guestId)
  );

  const $deleteBtn = document.createElement("button");
  $deleteBtn.textContent = "Delete This Party";
  $deleteBtn.style.backgroundColor = "#b30000";
  $deleteBtn.style.color = "white";
  $deleteBtn.style.padding = "6px 10px";
  $deleteBtn.style.border = "none";
  $deleteBtn.style.borderRadius = "4px";
  $deleteBtn.style.marginTop = "10px";

  $deleteBtn.addEventListener("click", () => {
    if (confirm(`Are you sure you want to delete "${selectedParty.name}"?`)) {
      deleteParty(selectedParty.id);
    }
  });

  $div.innerHTML = `
    <h3>${selectedParty.name}</h3>
    <p><strong>Date:</strong> ${formattedDate}</p>
    <p><strong>Location:</strong> ${selectedParty.location}</p>
    <p>${selectedParty.description}</p>
    <h4>Guests RSVP'd:</h4>
    ${
      partyGuests.length > 0
        ? `<ul>${partyGuests.map((g) => `<li>${g.name}</li>`).join("")}</ul>`
        : "<p>No guests have RSVP'd yet.</p>"
    }
  `;

  $div.appendChild($deleteBtn);
  return $div;
}

function AddPartyForm() {
  const $form = document.createElement("form");
  $form.classList.add("add-party-form");

  const $title = document.createElement("h3");
  $title.textContent = "Add a New Party";
  $form.appendChild($title);

  const fields = [
    { label: "Name", name: "name", type: "text" },
    { label: "Description", name: "description", type: "text" },
    { label: "Date", name: "date", type: "date" },
    { label: "Location", name: "location", type: "text" },
  ];

  fields.forEach((f) => {
    const $label = document.createElement("label");
    $label.textContent = f.label;
    const $input = document.createElement("input");
    $input.type = f.type;
    $input.name = f.name;
    $input.required = true;
    $label.appendChild($input);
    $form.appendChild($label);
    $form.appendChild(document.createElement("br"));
  });

  const $submit = document.createElement("button");
  $submit.textContent = "Add Party";
  $submit.type = "submit";
  $submit.style.marginTop = "10px";
  $form.appendChild($submit);

  $form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData($form);
    const name = formData.get("name");
    const description = formData.get("description");
    const date = formData.get("date");
    const location = formData.get("location");

    if (!name || !description || !date || !location)
      return alert("All fields are required.");

    const isoDate = new Date(date).toISOString();

    const newParty = { name, description, date: isoDate, location };
    await createParty(newParty);

    $form.reset();
  });

  return $form;
}

function render() {
  const $app = document.querySelector("#app");
  $app.innerHTML = `
    <h1>Party Planner Admin</h1>
    <main>
      <section>
        <h2>Upcoming Parties</h2>
        <PartyList></PartyList>
      </section>
      <section id="selected">
        <h2>Party Details</h2>
        <PartyDetails></PartyDetails>
      </section>
      <section id="add-party">
        <h2>Add a Party</h2>
        <AddPartyForm></AddPartyForm>
      </section>
    </main>
  `;

  $app.querySelector("PartyList").replaceWith(PartyList());
  $app.querySelector("PartyDetails").replaceWith(PartyDetails());
  $app.querySelector("AddPartyForm").replaceWith(AddPartyForm());
}

async function init() {
  await getGuestsAndRsvps();
  await getParties();
  render();
}

init();
