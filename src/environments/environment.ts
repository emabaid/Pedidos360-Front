// Quita cualquier "/" final para que nunca se genere una doble barra
// al concatenar rutas como `${apiBaseUrl}/api/catalog` (esto causó un bug
// real: Chrome muestra un 404 por URL mal formada como si fuera un error
// de CORS, y hace perder horas buscando en el lugar equivocado).
function sinBarraFinal(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

export const environment = {
  production: false,

  msal: {
    // App Registration del FRONTEND Angular
    clientId: 'ebf71beb-371f-4381-b372-af5b8b5d34cc',

    // Directory (tenant) ID del tenant utilizado en Microsoft Entra ID
    tenantId: 'a018a64b-37c3-42b0-a7b2-a6e50b7330a5',

    redirectUri: 'https://184-194-239-38.sslip.io',

    // Scope expuesto por la App Registration de la API
    apiScope:
      'api://b1cb0637-0a06-45da-9404-4136890f007a/Pedidos.Read'
  },

  // Backend Spring Boot de la Sesión 3.
  // Puedes pegar esta URL CON o SIN "/" al final, da lo mismo (ver sinBarraFinal arriba).
  apiBaseUrl: sinBarraFinal('https://wg6dk4irfa.execute-api.us-east-1.amazonaws.com/prod')
};
