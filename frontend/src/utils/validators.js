// These mirror the backend's validation rules (UserDto + UserService) so we
// can show helpful live hints. The backend is still the source of truth —
// we never block submission purely on the client, we just guide the user.

const USERNAME_PATTERN = /^[a-zA-Z]+(?: [a-zA-Z]+)*(?:[0-9]+)?$/;

export function usernameLooksValid(userName) {
  return USERNAME_PATTERN.test(userName.trim());
}

const COMMON_PASSWORDS = new Set(["password", "123456", "password123", "admin", "qwerty"]);

export function getPasswordChecks(password) {
  return [
    { key: "length", label: "6-20 characters", met: password.length >= 6 && password.length <= 20 },
    { key: "upper", label: "Uppercase letter", met: /[A-Z]/.test(password) },
    { key: "lower", label: "Lowercase letter", met: /[a-z]/.test(password) },
    { key: "digit", label: "Number", met: /\d/.test(password) },
    { key: "special", label: "Special character (@$!%*?&)", met: /[@$!%*?&]/.test(password) },
    {
      key: "common",
      label: "Not a common password",
      met: password.length > 0 && !COMMON_PASSWORDS.has(password.toLowerCase()),
    },
    {
      key: "repeat",
      label: "No character repeated 5+ times in a row",
      met: password.length > 0 && !/(.)\1{4,}/.test(password),
    },
  ];
}
