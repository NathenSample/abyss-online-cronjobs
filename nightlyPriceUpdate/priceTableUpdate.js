"use strict";
var mysql = require('mysql');
var request = require('then-request');
const [,,username,password,dbName] = process.argv;
console.log("**********");
console.log("Nightly price update CRON started");
console.log("Connecting to " + dbName + " with user " + username);
console.log("**********");

var con = mysql.createConnection({
  host: "localhost",
  user: username,
  password: password,
  database: dbName
});

function getItemIdsFromDb(callback){
	var itemIds = [];
	con.connect(function(err) {
	  if (err) throw err;
	  con.query("SELECT item_id FROM loot_items WHERE marketable = 1;", function (err, result, fields) {
	    if (err) throw err;
	    result.forEach(function(item, index, array){
	    	itemIds.push(item.item_id);
	    });
		callback(itemIds);
	  });
	});
}

function processItems(itemIds){
	console.log("Retrieved " + itemIds.length + " item IDs from the database");
	itemIds.forEach(function(itemId){
		getPricesAndUpdate(itemId);
	});
}

function getPricesAndUpdate(itemId){
	request('GET', "https://api.evemarketer.com/ec/marketstat/json?typeid=" + itemId  + "&usesystem=30000142", {headers: {"User-Agent": "ChristyCloud"}}).done(function (res) {
 		var responseBody = JSON.parse(res.getBody("UTF-8"));
 		update(itemId, responseBody[0].buy.max);
	});
}

function update(itemId, price){
	console.log("Update " + itemId + " with price " + price);
	con.query("UPDATE loot_items SET item_value = " + price + " WHERE item_id = " + itemId, function(err, result, fields) {
		if(err) throw err;
	});
}


getItemIdsFromDb(processItems);









