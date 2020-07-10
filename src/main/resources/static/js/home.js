const QBLogin = document.getElementById("quickbook-login");
const QBSignUp = document.getElementById("quickbook-signup");

function launchPopup(path) {
  var win;
  var checkConnect;
  var parameters = "location=1,width=800,height=650";
  parameters +=
    ",left=" + (screen.width - 800) / 2 + ",top=" + (screen.height - 650) / 2;
  // Launch Popup
  win = window.open(path, "connectPopup", parameters);
}

QBLogin.addEventListener(
  "click",
  function () {
    launchPopup("connectToQuickbooks");
  },
  false
);

QBSignUp.addEventListener(
  "click",
  function () {
    window.open("https://quickbooks.intuit.com/", "_blank", "noopener")
  },
  false
)