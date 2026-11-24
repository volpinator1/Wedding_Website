// RSVP form: validation, red highlighting, and confirmation popup.
// Make sure script.js no longer contains its own #rsvpForm handler.

// Paste your Apps Script Web app URL here (ends in /exec).
var RSVP_URL = "https://script.google.com/macros/s/AKfycbwx7909rsrtobkwwHIMqqG1oMMsPX_MVYr1dtxZqEMSDieSFAXwbmJVNDTcEhf5MWgyYw/exec";

var form = document.getElementById("rsvpForm");
var status = document.getElementById("formMessage");
var popup = document.getElementById("popup");
var popupTitle = document.getElementById("popupTitle");
var popupText = document.getElementById("popupText");
var popupClose = document.getElementById("popupClose");

// ----- popup -----
function showPopup(title, text) {
  popupTitle.textContent = title;
  popupText.textContent = text;
  popup.hidden = false;
  popupClose.focus();
}
function hidePopup() { popup.hidden = true; }

popupClose.addEventListener("click", hidePopup);
popup.addEventListener("click", function (e) { if (e.target === popup) hidePopup(); });
document.addEventListener("keydown", function (e) { if (e.key === "Escape") hidePopup(); });

// ----- error highlighting -----
function targetFor(field) {
  return field === "attending"
    ? form.querySelector(".radio-group")
    : form.elements[field];
}
function clearErrors() {
  form.querySelectorAll(".error").forEach(function (el) { el.classList.remove("error"); });
}
function flag(fields) {
  fields.forEach(function (f) {
    var el = targetFor(f);
    if (el) el.classList.add("error");
  });
}
// Clear a field's red state as soon as the person edits it.
["name", "email", "passkey", "guests"].forEach(function (f) {
  form.elements[f].addEventListener("input", function () { this.classList.remove("error"); });
});
form.querySelectorAll('input[name="attending"]').forEach(function (r) {
  r.addEventListener("change", function () {
    form.querySelector(".radio-group").classList.remove("error");
  });
});

// ----- submit -----
form.addEventListener("submit", function (e) {
  e.preventDefault();
  clearErrors();
  status.textContent = "";

  var picked = form.querySelector('input[name="attending"]:checked');
  var attending = picked ? picked.value : "";
  var guests = parseInt(form.elements.guests.value, 10);

  // Quick checks for missing info (the server re-checks everything, including the passkey).
  var bad = [];
  if (!form.elements.name.value.trim()) bad.push("name");
  if (!/^\S+@\S+$/.test(form.elements.email.value.trim())) bad.push("email");
  if (!form.elements.passkey.value.trim()) bad.push("passkey");
  if (!attending) bad.push("attending");
  if (attending !== "No" && !(guests >= 1)) bad.push("guests");
  if (bad.length) { flag(bad); return; }

  var button = form.querySelector("button[type='submit']");
  button.disabled = true;
  status.textContent = "Sending...";

  // URL-encoded body avoids a CORS preflight, which Apps Script doesn't support.
  fetch(RSVP_URL, { method: "POST", body: new URLSearchParams(new FormData(form)) })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      status.textContent = "";
      if (data.result === "ok") {
        if (attending === "Yes") {
          var n = data.guests || guests;
          showPopup(
            "RSVP received",
            "Thank you for reserving " + n + (n === 1 ? " spot" : " spots") +
            ", we're eager to see you there!"
          );
        } else {
          showPopup(
            "RSVP received",
            "We understand you can't attend. You'll be missed, and thank you for letting us know."
          );
        }
        form.reset();
      } else if (data.fields && data.fields.length) {
        flag(data.fields);
      } else {
        throw new Error(data.message || "Unknown error");
      }
    })
    .catch(function () {
      status.textContent = "";
      showPopup("Something went wrong", "We couldn't send your RSVP. Please try again in a moment.");
    })
    .then(function () { button.disabled = false; });
});
