
express = require('express');
app = express();
bodyParser = require('body-parser');

var SpotifyWebApi = require('spotify-web-api-node');




//Get auth code 
var scopes = ['user-read-private', 'user-read-email'],
  clientId = 'dd52c3df12c84d46ad74c1714fef2dd7',
  state = 'user-read-playback-state';

var spotifyApi = new SpotifyWebApi({
    clientId: 'dd52c3df12c84d46ad74c1714fef2dd7',
    clientSecret: '88809c501e8b4311bad38a7bd4c58f61',
    redirectUri: 'http://localhost:8888/callback'

});

app.get('/login', (req, res) => {
    let auth_login_url = spotifyApi.createAuthorizeURL(scopes)
    console.log("Login URL: "+  auth_login_url)
    res.statusCode = 307
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
        hour: 7,
        min: 30,
        meridium: "AM"
    },

    song: {
        name: "To Pimp a Butterfly",
        artist: "Kendrick Lamar",
        cover_src: "https://media.timeout.com/images/102187439/image.jpg"
    }


}

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
        res.statusCode = 307
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
    }, expires_in * .9);


    })
    .catch(error => {
    console.error('Error getting Tokens:', error);
    res.send(`Error getting Tokens: ${error}`);
    });

    res.statusCode = 307
    res.redirect('/')

});

app.get('/', (req, res) => {
    if(!spotify_is_init){
        res.statusCode = 307
        res.redirect('/login')
        return;
    }
    console.log("Serving index")
    res.render('index')
});

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