var express = require("express");
var axios = require('axios');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const superchats = require("superchats");

var PermiteConexao = 'SIM';

const appWeb = express();
const server = require ('http').createServer(appWeb);
appWeb.use(express.static(__dirname + '/images'));
server.listen(3001, () => {
	console.log('Server WEB Image Rodando na porta 3001')
})


let app = {};

app['Server'] = express();
app['Server'].listen(3333, () => {
	console.log ("Server Principal Rodando Porta 3333");
});

app['Server'].get("/ConectaWhats", async (req, res, next) => {
	
	Cliente_ID = req.query.Cliente_ID;
	Cliente_Porta = req.query.Cliente_Porta;
	
	
	const detect = require('detect-port');
	
	detect(Cliente_Porta, (err, _port) => {
		if (err) {
			console.log(err);
		}

		if (Cliente_Porta == _port) {
			var Valida_StatusSession = 'NaoValidou';
	
			var arr = new Array();
			new superchats.create(
				Cliente_ID, {
					license: "asjdh-efddff734-sdsdf834-233272",
					retries: 5,
					logQr: false
				},
				(base64Qr, asciiQR, attempts, urlCode) => {
					console.log(asciiQR); // Optional to log the QR in the terminal
					//console.log(attempts); // Optional to log the QR in the terminal
					var matches = base64Qr.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
					response = {};

					if (matches.length !== 3) {
						return new Error('Invalid input string');
					}
					response.type = matches[1];
					response.data = new Buffer.from(matches[2], 'base64');

					var imageBuffer = response;
					require('fs').writeFile(
						//'image-' + id + '.png',
						'./images/' + Cliente_ID + '.png',
						imageBuffer['data'],
						'binary',
						function (err) {
							if (err != null) {
								console.log(err);
							}
						}
					);
				},
				(statusSession) => {
					arr.push(statusSession.response);
					if(arr[1]){
						if(Valida_StatusSession == 'NaoValidou'){
							if(arr[1] == "qrReadFail"){
								console.log("Nao Leu o QR CODE");
								var StatusConexao = "Não Leu o QR CODE";
								var RetornoStatus = { "Status": "Erro", "Descricao": StatusConexao, "Time": new Date().getTime()};
							}
							else if(arr[1] == "isLogged"){
								var StatusConexao = "Leu QR CODE";
								console.log("Leu QR CODE - Conectado");
								var RetornoStatus = { "Status": "Sucesso", "Descricao": StatusConexao, "Time": new Date().getTime()};
								//start(client,porta,id);
							}
							else if(arr[0] == "isLogged"){
								var StatusConexao = "Leu QR CODE";
								console.log("Leu QR CODE - Conectado");
								var RetornoStatus = { "Status": "Sucesso", "Descricao": StatusConexao, "Time": new Date().getTime()};
							}
							
							Valida_StatusSession = "Validou";
							res.json(RetornoStatus);
						}
						
					}
				}
			).then((client) => {
				if(PermiteConexao == 'SIM'){
					if(start(client,Cliente_Porta,Cliente_ID)){
						console.log("Entrou if");
					}else{
						console.log("Entrou Else");
						PermiteConexao = 'NAO';
					}
				}
				else{
					setTimeout(function(){
						start(client,Cliente_Porta,Cliente_ID)
					}, 5000);
					}
				
				
				})
			.catch((erro) => {
				console.log("Erro Catch Create = " + erro);
			});
		} 
		else {
			var RetornoStatus = { "Status": "Erro", "Descricao": "Porata em Uso", "Time": new Date().getTime()};
			res.json(RetornoStatus);
		}
	});
	

});

app['Server'].get("/TesteJson", async (req, res, next) => {
	var StatusConexao = "Leu QR CODE - Conectado";
	var myJSON = { "Status": StatusConexao};
	res.json(myJSON);
	
});


function start(client,porta,id) {
	
	
	console.log("PORTA => " + porta);
	
	console.log("Entrou Cliente Start");
	
	var http = require('http');
	var url = require("url");
	
	let server = {};
	
	server[id] = http.createServer(async function(req, res) {
		
		var parsedUrl = url.parse(req.url, true);
		var queryAsObject = parsedUrl.query;
		
		
		var json = JSON.stringify(queryAsObject);
		var mydata = JSON.parse(json);
		console.log("Acao-> " + mydata['Acao']);
		
		if(mydata['Acao'] == 'EnviaMensagem'){
			client.sendText(mydata['Numero'] + '@c.us', mydata['Mensagem'])
			.then((result) => {
				  res.end(JSON.stringify(queryAsObject));
			})
			.catch((erro) => {
			  console.error('Error Encontrado EnviaMensagem: ', erro); //return object error
			});
		}
		
		if(mydata['Acao'] == 'LogMensagem'){
			await client.getChatAllMessages(mydata['Numero'])
			.then((result) => {
				  res.end(JSON.stringify(result));
			})
			.catch((erro) => {
			  console.error('Error Encontrado LogMensagem: ', erro); //return object error
			});
		}
		
		if(mydata['Acao'] == 'FechaSessao'){
			var RetornoStatus = { "Status": "Sucesso", "Descricao": "Sessao Fechada", "Time": new Date().getTime()};
			res.end(JSON.stringify(RetornoStatus));
			server[id].shutdown(function(err) {
				if (err) {
					return console.log('shutdown failed', err.message);
				}
				console.log('Everything is cleanly shutdown.');
			});
		}
		
		//Link Exemplo = http://192.168.1.112:1010/?Acao=EnviaMensagem&Numero=553891379925&Mensagem=TesteSuper111

	});
	
	
	server[id] = require('http-shutdown')(server[id]);
	server[id].listen(porta);
	PermiteConexao = 'SIM';
	
	
}

