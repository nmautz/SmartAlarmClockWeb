
express = require('express');
app = express();
app.set('view engine', 'ejs');


app.get('/', function(req, res) {
    console.log("Serving index")
    res.render('index', {title: 'Hello World!'})
});

app.listen(3000);