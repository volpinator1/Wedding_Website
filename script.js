document.getElementById("rsvpForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const message = document.getElementById("formMessage");
  message.innerText = "Thank you! Your RSVP has been recorded (demo only).";
});
