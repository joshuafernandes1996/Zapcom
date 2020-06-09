function launchPopup(path) {
  var win;
  var checkConnect;
  var parameters = "location=1,width=800,height=650";
  parameters +=
    ",left=" + (screen.width - 800) / 2 + ",top=" + (screen.height - 650) / 2;
  // Launch Popup
  win = window.open(path, "connectPopup", parameters);
}
document.getElementById("quickbook-login").addEventListener(
  "click",
  function () {
    launchPopup("connectToQuickbooks");
  },
  false
);
