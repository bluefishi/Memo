//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------
//set mongodb
var mongo = process.env.VCAP_SERVICES;
var port = process.env.PORT || 3030;
var conn_str = "";
if (mongo) {
	var env = JSON.parse(mongo);
	if (env['mongodb-2.4']) {
		mongo = env['mongodb-2.4'][0]['credentials'];
		if (mongo.url) {
			conn_str = mongo.url;
		} else {
			console.log("No mongo found");
		}
	} else {
			conn_str = 'mongodb://localhost:27017';
		} 
} else {
		conn_str = 'mongodb://localhost:27017';
}

var MongoClient = require('mongodb').MongoClient;
var db;
MongoClient.connect(conn_str,function(err, database) {
	if(err) throw err;
	db = database;
});

// This application uses express as its web server
var express = require('express');

var routes = require('./routes');
var ejs = require('ejs');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var SessionStore = require("session-mongoose")(express);

//use mongodb to store session info
var store = new SessionStore({
	url: mongo.url,
	interval: 120000
});

// create a new express server
var app = express();

//environments 
app.set('views', __dirname + '/views');
app.engine('html', ejs.renderFile);
app.set('view engine', 'html');
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.cookieSession({secret : 'apple nodejs'}));
app.use(express.session({
	secret : 'apple nodejs',
	store: store,
	cookie: { maxAge: 900000 }
}));
app.use(function(req, res, next){
	res.locals.user = req.session.user;
	var err = req.session.error;
	delete req.session.error;
	res.locals.message = '';
	if (err) res.locals.message = '<div class="alert alert-error">' + err + '</div>';
	next();
});
app.use(app.router);
// serve the files out of ./public as our main files
app.use(express.static(path.join(__dirname + '/public')));

//add routes configuration
app.get('/', routes.index);
app.all('/login', notAuthentication);
app.get('/login', routes.login);
app.post('/login', routes.doLogin);
app.get('/logout', authentication);
app.get('/logout', routes.logout);
app.get('/home', authentication);
app.get('/home', routes.home);
app.get('/users', user.list);

// mongo function
app.get('/api/insertMessage', function (req, res) {
	var message = { 'message': 'Hello, Bluemix', 'ts': new Date()};
	if(db && db!== "null" && db!== "undefined") {
		db.collection('messages').insert(message, {safe:true},function(err){
			if(err){
				console.log(err.stack);
				res.write('mongodb message insert failed');
				res.end();
			}else{
				res.write('following messages have been inserted into database' + "\n" + JSON.stringify(message));
				res.end();
			}
		});
	}else{
		res.write('No mongo found');
		res.end();
	}
});

app.get('/api/render', function(req,res){
	if(db && db!== "null" && db !== "undefined"){
	db.collection('messages').find({},{limit:10,sort:[['_id','desc']]},function(err,cursor){
		if(err){
			console.log(err.stack);
			res.write('mongodb message list failed');
			res.end();
		}else{
			cursor.toArray(function(err,items){
				if(err){
					console.log(err.stack);
					res.write('mongodb cursor to array failed');
					res.end();
				}else{
				res.writeHead(200,{'Content-Type':'text/plain'});
				for(i=0;i<items.length;i++){
					res.write(JSON.stringify(items[i])+"\n");
				}
				res.end();
				}
			});
		}
	});
	}else{
	res.write('No mongo found');
	res.end();
}
});
					

//listen mongo port
http.createServer(app).listen(port, function(){
	console.log('Express server listening on port' + port);
});

function authentication(req, res, next){
	if(!req.session.user){
		req.session.error='请先登录';
		return res.redirect('/login');
	}
	next();
}
function notAuthentication(req, res, next){
	if(req.session.user){
		req.session.error='已登录';
		return res.redirect('/');
	}
	next();
}
