var http    = require('http'),
    express = require('express'),
    path    = require('path'),
    fs      = require('fs'),
    _       = require('underscore'),
    bodyp   = require('body-parser'),
    bs      = require('binaryjs'),
    ws      = require('ws');

exports.app = express();
exports.app.use('/js', express.static(path.join(__dirname, '../public/js')));
exports.app.use('/images', express.static(path.join(__dirname, '../public/images')));
exports.app.use('/css', express.static(path.join(__dirname, '../public/css')));
exports.app.set('views', path.join(__dirname, '../public/views'));
exports.app.use(bodyp.json());
exports.app.use(bodyp.urlencoded({extended:true}));

exports.app.get('/', function(req, res){
  res.render(path.join(__dirname, '../public/views/index.jade'), {gen: generatePack()});
});

exports.app.get('/js/wrld.js', function(req, res){
  //res.sendFile(path.join(__dirname, 'wrld.js/dist/wrld.js'));
});
exports.app.get('/js/jquery.min.js', function(req, res){
  res.sendFile(path.join(__dirname, '../node_modules/jquery/dist/jquery.min.js'));
});
exports.app.get('/js/underscore.min.js', function(req, res){
  res.sendFile(path.join(__dirname, '../node_modules/underscore/underscore-min.js'));
});
exports.app.get('/js/binary.min.js', function(req, res){
  res.sendFile(path.join(__dirname, '../node_modules/binaryjs/dist/binary.min.js'));
});

exports.server = http.createServer(exports.app);

exports.server.listen(1500);

exports.bs = bs.BinaryServer({server: exports.server, path: '/computation'});

exports.bs.on('connection', function(client) {
  console.log('ALERT: New Binary Connection');

  client.on('stream', function(stream, meta) {
    console.log('ALERT: New Stream');
    var buf = new Buffer(0);
    stream.on('data', function(thing){
      buf = Buffer.concat([buf, thing]);
    })

    stream.on('end', function() {
      console.log('ALERT: Audio Received')
      exports.bscallback(buf);
      buf = new Buffer(0);
    });
  });
});

exports.wss = new ws.Server({port: 3000});

exports.wssconns = [];
exports.wss.on('connection', function(client) {
  console.log('ALERT: New Websocket Connection');
  exports.wssconns.push(client);
  client.on('close', function(){
    exports.wssconns.splice(exports.wssconns.indexOf(client), 1);
    console.log("ALERT: Websocket Disconnected");
  })
});

var jqueryfile = 'jquery.min.js';
var underscorefile = 'underscore.min.js';
var binaryfile = 'binary.min.js';
var jspath = '../public/js';
var generatePack = function() {
  return {
    'keys': function(){
      return "<script>"+loadKeys()+"</script>";
    },
    'js': function(){
      try{
        exports.js = fs.readdirSync(path.join(__dirname, jspath));
      }catch(err){
        console.log("ERROR: Express Static JS Paths Don't Exist");
      }
      var ret = "";
      //attaching jquery and underscore
      ret += "<script src='"+path.join('js', jqueryfile)+"'type='text/javascript'></script>";
      ret += "<script src='"+path.join('js', underscorefile)+"'type='text/javascript'></script>";
      ret += "<script src='"+path.join('js', binaryfile)+"'type='text/javascript'></script>";
      _.each(exports.js, function(el){
        ret += "<script src='"+path.join('js', el)+"'type='text/javascript'></script>";
      })
      return ret;
    }
  }
}

var loadKeys = function() {
  try{
    delete require.cache[require.resolve('../KeyConfig.json')];
    var config = require('../KeyConfig.json');
  }catch(error){
    console.log("ERROR: No API Key Config Found. look in the chat or ask matt");
    var config = {};
  }
  var keys = {
    WrldKey: config.Wrld || "",
    GoogleKey: config.Google || ""
  }
  var total = ""
  Object.keys(keys).forEach(function(key){
    total+="var "+key+"=\""+keys[key]+"\";"
  });
  return total;
}