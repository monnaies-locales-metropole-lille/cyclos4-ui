export const environment = {
  // This is the environment for development
  production: true,

  // The frontend bundled with Cyclos is not standalone: it allows redirects to the classic frontend
  standalone: true,

  // The API path / URL when in standalone mode
  apiUrl: window["env"]["apiUrl"]
};
