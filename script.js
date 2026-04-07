document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('rsvpForm');
  const feedback = document.getElementById('rsvpFeedback');

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const attendance = document.getElementById('attendance').value;

    if (!fullName || !email || !attendance) {
      feedback.textContent = 'Please complete all required fields before submitting.';
      feedback.style.color = '#b85a5a';
      return;
    }

    feedback.style.color = '#4d6e44';
    feedback.textContent = `Thank you, ${fullName}! Your RSVP has been recorded. We look forward to celebrating together.`;
    form.reset();
  });
});
