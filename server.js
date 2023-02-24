
express = require('express');
app = express();
bodyParser = require('body-parser');

app.set('view engine', 'ejs');

// configure the app to use bodyParser()
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(express.json());
alarm = {

    time: {
        hour: 7,
        minute: 30,
        meridium: "AM"
    },

    song: {
        name: "To Pimp a Butterfly",
        artist: "Kendrick Lamar",
        cover_src: "https://media.timeout.com/images/102187439/image.jpg"
    }


}


app.get('/', function(req, res) {
    console.log("Serving index")
    res.render('index', {title: 'Hello World!'})
});

app.post('/update_server', (req, res)=>{

    console.log("Updating server")
    alarm = req.body
    res.send("Alarm updated")


})

app.post('/update_client', (req, res)=>{

    console.log("Updating client")
    res.send(alarm)

})

app.listen(3000);