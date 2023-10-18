const sign_in_btn = document.querySelector("#sign-in-btn");
const sign_up_btn = document.querySelector("#sign-up-btn");
const container = document.querySelector(".container");

sign_up_btn.addEventListener("click", () => {
  container.classList.add("sign-up-mode");
});

sign_in_btn.addEventListener("click", () => {
  container.classList.remove("sign-up-mode");
});

// DOM elements
// for the error message in sign in form
const signInForm = document.querySelector(".sign-in-form");
const passwordInput = signInForm.querySelector("input[name='loginPassword']");
const passwordIncorrectMessage = document.getElementById("password-incorrect");
// Function to show the password incorrect message
function showPasswordIncorrectMessage() {
  passwordInput.value = "";
  passwordIncorrectMessage.style.display = "block";
  setTimeout(() => {
    passwordIncorrectMessage.style.display = "none";
  }, 5000); // Hide the message after 5 seconds
}

signInForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const passwordIsIncorrect = false;

  if (passwordIsIncorrect) {
    showPasswordIncorrectMessage();
  } else {
    // if Password is correct, proceed with sign-in
    signInForm.submit();
  }
});

// for the error message in sign up form
document
  .querySelector(".sign-up-form")
  .addEventListener("submit", function (e) {
    const password = document.querySelector('input[name="password"]').value;
    const confirmPassword = document.querySelector(
      'input[name="cpassword"]'
    ).value;
    const confirmPasswordError = document.querySelector(
      "#confirmPasswordError"
    );

    if (password !== confirmPassword) {
      e.preventDefault(); // Preventing form submission

      // showing an error message on the sign-up form
      confirmPasswordError.textContent = "Passwords do not match";
      confirmPasswordError.style.color = "red";
    } else {
      // Clearing the error message if passwords match
      confirmPasswordError.textContent = "";
    }
  });