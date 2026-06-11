import { google } from 'googleapis'

/**
 * Creates a Google Calendar event with Google Meet for a booking.
 * 
 * Requirements:
 * 1. Create a Google Cloud project at https://console.cloud.google.com
 * 2. Enable "Google Calendar API"
 * 3. Create a Service Account and download the JSON key
 * 4. Set environment variables for OAuth2 (Recommended):
 *    - GOOGLE_CALENDAR_ID: bienesraices@aliminspa.cl
 *    - GOOGLE_CLIENT_ID: Your OAuth2 Client ID
 *    - GOOGLE_CLIENT_SECRET: Your OAuth2 Client Secret
 *    - GOOGLE_REFRESH_TOKEN: The offline refresh token
 */

function getCalendarClient() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (clientId && clientSecret && refreshToken) {
        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
        oauth2Client.setCredentials({ refresh_token: refreshToken });
        return google.calendar({ version: 'v3', auth: oauth2Client });
    }

    // Fallback to Service Account
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!email || !privateKey) {
        console.warn('Google Calendar credentials not configured. Skipping calendar event.');
        return null;
    }

    const auth = new google.auth.JWT({
        email,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    return google.calendar({ version: 'v3', auth });
}

export async function createCalendarEvent(params: {
    nombre: string
    email: string
    celular: string
    proyecto: string
    fecha: string // ISO date string
    hora: string  // "16:00" format
}): Promise<{ meetLink: string | null; eventId: string | null }> {
    const calendar = getCalendarClient()
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary'

    if (!calendar) {
        return { meetLink: null, eventId: null }
    }

    const { nombre, email, celular, proyecto, fecha, hora } = params

    // Build start/end times in Chile timezone
    const [h] = hora.split(':').map(Number)
    const dateObj = new Date(fecha)
    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const day = String(dateObj.getDate()).padStart(2, '0')
    const startTime = `${year}-${month}-${day}T${String(h).padStart(2, '0')}:00:00`
    const endTime = `${year}-${month}-${day}T${String(h + 1).padStart(2, '0')}:00:00`

    try {
        const event = await calendar.events.insert({
            calendarId,
            conferenceDataVersion: 1, // Required to create Google Meet
            sendUpdates: 'all', // Send email invitations to attendees
            requestBody: {
                summary: `Visita ${proyecto} — ${nombre}`,
                description: [
                    `🏡 Visita agendada al proyecto ${proyecto}`,
                    ``,
                    `📋 Datos del visitante:`,
                    `• Nombre: ${nombre}`,
                    `• Email: ${email}`,
                    `• Celular: ${celular}`,
                    ``,
                    `📍 Ubicación: El Tabo, Región de Valparaíso, Chile`,
                    ``,
                    `Alimin Inmobiliaria — aliminspa.cl`,
                ].join('\n'),
                location: 'El Tabo, Región de Valparaíso, Chile',
                start: {
                    dateTime: startTime,
                    timeZone: 'America/Santiago',
                },
                end: {
                    dateTime: endTime,
                    timeZone: 'America/Santiago',
                },
                attendees: [
                    { email, displayName: nombre }, // The visitor
                    { email: process.env.GOOGLE_CALENDAR_ID || 'bienesraices@aliminspa.cl' }, // The business
                ],
                conferenceData: {
                    createRequest: {
                        requestId: `booking-${Date.now()}`,
                        conferenceSolutionKey: {
                            type: 'hangoutsMeet',
                        },
                    },
                },
                reminders: {
                    useDefault: false,
                    overrides: [
                        { method: 'email', minutes: 60 },    // 1 hour before
                        { method: 'popup', minutes: 30 },    // 30 min before
                        { method: 'email', minutes: 1440 },  // 1 day before
                    ],
                },
            },
        })

        const meetLink = event.data.conferenceData?.entryPoints?.find(
            (ep) => ep.entryPointType === 'video'
        )?.uri || event.data.hangoutLink || null

        return {
            meetLink,
            eventId: event.data.id || null,
        }
    } catch (error: any) {
        console.error('Error creating Google Calendar event:', {
            message: error.message,
            status: error.code,
            errors: error.errors,
        })
        return { meetLink: null, eventId: null }
    }
}
