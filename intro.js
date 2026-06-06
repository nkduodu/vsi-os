/* ============================================================
   VSI INTRO SEQUENCE CONTROLLER
   Handles fade-out and activation of the main app shell
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const intro = document.getElementById("vsi-intro");
  const appShell = document.getElementById("app-shell");

  // Wait for intro animation to finish
  setTimeout(() => {
    intro.style.display = "none";
    if (appShell) appShell.style.display = "block";
  }, 3200); // matches CSS animation duration
});
