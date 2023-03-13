
express = require('express');
app = express();
bodyParser = require('body-parser');

var SpotifyWebApi = require('spotify-web-api-node');




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