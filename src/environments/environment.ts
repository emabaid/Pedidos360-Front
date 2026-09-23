export const environment = {
  production: false,

  msal: {
    // App Registration del FRONTEND Angular
    clientId: 'ebf71beb-371f-4381-b372-af5b8b5d34cc',

    // Directory (tenant) ID del tenant utilizado en Microsoft Entra ID
    tenantId: 'a018a64b-37c3-42b0-a7b2-a6e50b7330a5',

    redirectUri: 'http://localhost:4200',

    // Scope expuesto por la App Registration de la API
    apiScope:
      'api://b1cb0637-0a06-45da-9404-4136890f007a/Pedidos.Read'
  },

  // Backend Spring Boot de la Sesión 3
  apiBaseUrl: 'http://localhost:8080'
};
