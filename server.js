import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import Pusher from 'pusher';

const app = express();
app.use(cors());
app.use(bodyParser.json());

const pusher = new Pusher({
    appId: '1853712',
    key: 'c5dc5b55973c301f7482',
    secret: 'bc2a1ea90bafa639584f',
    cluster: 'sa1',
    useTLS: true
});

app.post('/send-whatsapp', (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).send('Mensagem não encontrada');
    }
    console.log('Mensagem WhatsApp:', message);
    res.status(200).send('Mensagem WhatsApp enviada com sucesso');
});

app.post('/pusher-event', (req, res) => {
    const { event, date, bookings } = req.body;
    if (event === 'booking-updated') {
        pusher.trigger('calendar-channel', 'booking-updated', { date, bookings });
        res.status(200).send('Evento Pusher enviado com sucesso');
    } else {
        res.status(400).send('Evento Pusher não reconhecido');
    }
});

// Exporta a aplicação para o Vercel
export default app;
