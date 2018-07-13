var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.engine('html', require('ejs').renderFile);
app.use(express.static(__dirname + '/'));

var dot = require('dot-object')
var clientId = 'mqttjs_' + Math.random().toString(16).substr(2, 8)
var client =  require('mqtt').connect('mqtt://wirelesstech.online:1883', {
  keepalive: 10,
  clientId: clientId,
  protocolId: 'MQTT',
  protocolVersion: 4,
  reconnectPeriod: 1000,
  connectTimeout: 30 * 1000,
  username: 'xung',
  password: '1234567',
  rejectUnauthorized: false
});

function getdata( a, data) {
     //console.log(dot.pick(a,data));
     return dot.pick( a,data);
};

app.get('/', function(req, res){
  res.render('index');
});

io.on('connection', function (socket) {
  console.log("New connection");
    client.on('connect', function () {
         console.log('connected:' + clientId)
    });

    client.on('error', function (err) {
         console.log(err)
         client.end()
    });
    client.subscribe('application/+/device/+/rx', { qos: 0 })
    client.on('message', function (topic, message) {
         try {
         var parse_data = JSON.parse(message);
         socket.emit('sending_json_data', message);
         }
         catch(e) {
          return console.error(e);
         }

         var appName = getdata('applicationName', parse_data);
         var deviceName = getdata('deviceName', parse_data);
         var devEUI = getdata('devEUI', parse_data);
         var codeRate = getdata('txInfo.codeRate', parse_data);
         var phyPayload1 = getdata('data', parse_data);
         if(codeRate != null) {
               var raw_data = phyPayload1.toString();
               var buf = new Buffer(phyPayload1,'base64');
               var phyPayload2 = buf.toString();
               socket.emit('sending_payload', phyPayload2);
               }
             });

    client.on('close', function () {
         console.log(clientId + ' disconnected')
    });
})
http.listen(5050, function () {
  console.log("Server running");
});
