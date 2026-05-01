//recuperer
const reponse =await fetch ('https://api.openagenda.com/v2/agendas/AGENDA_ID/events?key=API_KEY&limit=50');
const data =  await reponse.json();
const events = data.events;
//afficher chaque evenements
events.forEach(event => {
    console.log(event.title.fr);
    console.log(event.description.fr);
    console.log(event.start_date);
    console.log(event.end_date);
    console.log(event.location);
});