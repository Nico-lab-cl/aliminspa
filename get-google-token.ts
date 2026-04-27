import { google } from 'googleapis';
import * as readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

async function getAccessToken() {
    console.log('\n=== Obtener Refresh Token de Google Calendar ===\n');
    console.log('1. Ve a https://console.cloud.google.com/apis/credentials');
    console.log('2. Haz clic en "Crear credenciales" > "ID de cliente de OAuth"');
    console.log('3. Tipo de aplicación: "App de escritorio" (o "Desktop app")');
    console.log('4. Copia el ID de cliente y el Secreto de cliente.\n');

    rl.question('Pega tu GOOGLE_CLIENT_ID: ', (clientId) => {
        rl.question('Pega tu GOOGLE_CLIENT_SECRET: ', async (clientSecret) => {
            const oauth2Client = new google.auth.OAuth2(
                clientId.trim(),
                clientSecret.trim(),
                'urn:ietf:wg:oauth:2.0:oob' // Out of band redirect
            );

            const scopes = ['https://www.googleapis.com/auth/calendar'];

            const url = oauth2Client.generateAuthUrl({
                access_type: 'offline', // Muy importante para recibir el refresh_token
                scope: scopes,
                prompt: 'consent', // Fuerza a pedir permisos para asegurar que nos de el refresh_token
            });

            console.log('\n=============================================');
            console.log(' Abre esta URL en tu navegador e inicia sesión ');
            console.log(' con el correo: bienesraices@aliminspa.cl');
            console.log('=============================================\n');
            console.log(url);
            console.log('\n=============================================');

            rl.question('\nPega aquí el código que te dio Google: ', async (code) => {
                try {
                    const { tokens } = await oauth2Client.getToken(code.trim());
                    console.log('\n✅ ¡ÉXITO! Copia estos valores en tu archivo .env del VPS y local:\n');
                    console.log(`GOOGLE_CLIENT_ID="${clientId.trim()}"`);
                    console.log(`GOOGLE_CLIENT_SECRET="${clientSecret.trim()}"`);
                    console.log(`GOOGLE_REFRESH_TOKEN="${tokens.refresh_token}"`);
                    console.log('\n(Puedes borrar las variables de GOOGLE_SERVICE_ACCOUNT del .env)');
                } catch (error) {
                    console.error('Error al obtener el token:', error);
                } finally {
                    rl.close();
                }
            });
        });
    });
}

getAccessToken();
