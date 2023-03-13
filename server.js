
express = require('express');
app = express();
bodyParser = require('body-parser');

var SpotifyWebApi = require('spotify-web-api-node');
const fs = require('fs');

const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content =  fs.readFileSync(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file compatible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content =  fs.readFileSync(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  fs.writeFileSync(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

/**
 * Lists the next 10 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function listEvents(auth) {
  const calendar = google.calendar({version: 'v3', auth});
  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  });
  const events = res.data.items;
  if (!events || events.length === 0) {
    console.log('No upcoming events found.');
    return;
  }
  console.log('Upcoming 10 events:');
  events.map((event, i) => {
    const start = event.start.dateTime || event.start.date;
    console.log(`${start} - ${event.summary}`);
  });
}

async function getCalendarEvents(auth, callback) {
    const calendar = google.calendar({version: 'v3', auth});
    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 1,
      singleEvents: true,
      orderBy: 'startTime',
    });
    const events = res.data.items;
    if (!events || events.length === 0) {
      console.log('No upcoming events found.');
      return;
    }
    console.log('Upcoming 10 events:');
    events.map((event, i) => {
      const start = event.start.dateTime || event.start.date;
      console.log(`${start} - ${event.summary}`);
      callback(`${start} - ${event.summary}`)
    });
  }






//Get auth code 
var scopes = ['user-read-private', 'user-read-email', 'app-remote-control', 'streaming', 'user-read-playback-state', 'user-modify-playback-state', 'user-read-currently-playing'],
  clientId = 'dd52c3df12c84d46ad74c1714fef2dd7',
  state = 'user-read-playback-state';

var spotifyApi = new SpotifyWebApi({
    clientId: 'dd52c3df12c84d46ad74c1714fef2dd7',
    clientSecret: '88809c501e8b4311bad38a7bd4c58f61',
    redirectUri: 'http://nenemac.local:8888/callback'

});

app.get('/login', (req, res) => {
    let auth_login_url = spotifyApi.createAuthorizeURL(scopes)
    console.log("Login URL: "+  auth_login_url)
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.redirect(auth_login_url);
});



app.get('/next_calendar_event', (req, res) => {

    authorize().then((auth) => {

        getCalendarEvents(auth, (data)=>{
            console.log(`Sending data: ${data}`)
            res.send(data)


        })


    }).catch((err) => {
        console.error('Error loading client secret file:', err);
    })


});


app.set('view engine', 'ejs');

//use public folder
app.use(express.static('public'));

// configure the app to use bodyParser()
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(express.json());
alarm = {

    enabled: false,

    time: {
        hour: 8,
        min: 45,
        meridium: "PM"
    },

    song: {
        name: "To Pimp a Butterfly",
        artist: "Kendrick Lamar",
        cover_src: "https://media.timeout.com/images/102187439/image.jpg"
    }


}
alarm_playing = false

function play_alarm(){
    alarm_playing = true
    console.log("Alarm time!")
    if(spotify_is_init){
        spotifyApi.play({
            "uris": [alarm.song.uri]
        })
        .then(function() {
            console.log('Playing song!');
        }, function(err) {
            console.log('Something went wrong!', err);
        });
    }else{
        console.log("Spotify not init")
        console.log("Backup Alarm!")
    }
}
alarm_interval = setInterval(() => {

    console.log("Checking alarm")
    let now = new Date()
    let hour = now.getHours()
    let min = now.getMinutes()
    let meridium = "AM"
    if(hour > 12){
        hour = hour - 12
        meridium = "PM"
    }

    if(hour == alarm.time.hour && min == alarm.time.min && meridium == alarm.time.meridium){
        
        if(!alarm_playing){
            play_alarm()
        }else{
            console.log("Alarm Already Playing!!")
        }

    }else{
        alarm_playing = false
    }
    


}, 1000);


var spotify_is_init = false;
app.get('/callback', function(req, res) {


    const error = req.query.error;
    const code = req.query.code;
    const state = req.query.state;
 
    if (error) {
      console.error('Callback Error:', error);
      res.send(`Callback Error: ${error}`);
      return;
    }

    if(spotify_is_init){
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.redirect('/')
        return;
    }

    console.log("init spotify with code: " + code)

    spotify_is_init = true;
    spotifyApi
    .authorizationCodeGrant(code)
    .then(data => {
    const access_token = data.body['access_token'];
    const refresh_token = data.body['refresh_token'];
    const expires_in = data.body['expires_in'];
    console.log("acces token granted")
    spotifyApi.setAccessToken(access_token);
    spotifyApi.setRefreshToken(refresh_token);

    //refreshes the access token once 90% of its time has been used
    setInterval(async () => {
        const data = await spotifyApi.refreshAccessToken();
        const access_token = data.body['access_token'];
        // console.log('The access token has been refreshed!');
        // console.log('access_token:', access_token);
        spotifyApi.setAccessToken(access_token);
        console.log("access token refreshed")
    }, expires_in * .9 * 60*60);

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.redirect('/')


    })
    .catch(error => {
    console.error('Error getting Tokens:', error);
    res.send(`Error getting Tokens: ${error}`);
    });



});

app.get('/', (req, res) => {
    if(!spotify_is_init){
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.redirect('/login')
        return;
    }
    console.log("Serving index")
    res.render('index')
});

app.get('/play_alarm', (req, res) => {
    console.log("Playing alarm")
    play_alarm()
    res.send("Attempting to play alarm")


})

app.get('/get_devices', (req, res) => {


    spotifyApi.getMyDevices()
  .then(function(data) {
    let availableDevices = data.body.devices;
    res.send(availableDevices);
  }, function(err) {
    res.send('Something went wrong!', err);
  });

})



app.post("/search_song", (req, res) => {

    let search_string = req.body.search_string
    console.log(req.body)
    console.log("Searching for song: " + search_string)

    spotifyApi.searchTracks(search_string)
    .then(function(data) {
        console.log(`Search by "${search_string}"`, data.body);
        res.send(data.body)
    }, function(err) {
        console.error(err);
        res.send(err)
    });


})

app.post('/update_server', (req, res)=>{

    console.log("Updating server")
    alarm = req.body
    console.log(alarm.song.uri)
    res.send("Alarm updated")


})

app.post('/update_client', (req, res)=>{

    console.log("Updating client")
    res.send(alarm)

})

app.listen(8888);