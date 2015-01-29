var request = require('request');
var cheerio = require('cheerio');
var async = require('async');
var _    = require('lodash');
var phantom = require('phantom');

var host = 'http://www.totalhealthandfitness.com/';
var user = '';
var pass = '';
var ids = [];
var range = 47254;

var loadPage = function(id, page, callback) {
	id = 118352 + id - 1;
	//console.log('loading id: ', id);

	page.open(host + 'printresistanceprogram.aspx?ProgramId=' + id, function(status) {
		page.evaluate(function() { return document.body }, function (result) {
			var data = page.evaluate(function() {
				return document.querySelector('#txtPassword');
			}, function(result) {
				if(result) {
					login(page, function(result) {
						delayLoadPage(page, host + 'printresistanceprogram.aspx?ProgramId=' + id, function() {
							parsePage(page, id, callback);
						});
					});
				} else {
					delayLoadPage(page, host + 'printresistanceprogram.aspx?ProgramId=' + id, function() {
						parsePage(page, id, callback);
					});
				}
			});
		});
	});
};

var parsePage = function(page, id, callback) {
	//console.log('\tparsing page');

	page.evaluate(function() {
		var el = document.querySelector('#form1 > div:nth-child(2) > div.container-fluid.reportheader > div > div.span6.resistprintheader > div:nth-child(1) > span:nth-child(3)');
		return el ? el.innerHTML : null;
	}, function(result) {
		if(result === "Trevor Clifton") {
			//console.log('\tSUCCESS');
			ids.push(id);
			console.log(ids);
		} else {
			//console.log('\tskip');
		}
		callback();
	});
};

var login = function(page, callback) {
	//console.log('\tlogging in');
	page.evaluate(new Function(
		"document.querySelector('#txtUsername').value = '" + user + "';" +
		"document.querySelector('#txtPassword').value = '" + pass + "';" +
		"document.querySelector('input[type=submit]').click();" +
		"document.querySelector('input[type=submit]');"
	), function() {
		setTimeout(callback, 2000);
	})
}

var delayLoadPage = function(page, url, callback) {
	var tries = 0;
	function redirect() {
		page.evaluate(
			new Function("window.location = '" + url + "'"),// + url + "'"),
			function() {
				setTimeout(testPage, 1000);
			});
	}

	function testPage() {
		page.evaluate(function() {
			return window.location.href;
		}, function(resp) {
			//console.log('\ttesting page', url, resp);

			if(resp === "http://www.totalhealthandfitness.com/Login.aspx") {
				login(page, redirect);
			}
			else if(resp !== url && tries < 1) {
				tries++;
				redirect();
			} else {
				callback();
			}
		});
	}

	redirect();
}

phantom.create(function(ph) {
	ph.createPage(function(page) {
		async.eachSeries(_.times(range), function(i, callback) {
			loadPage(i, page, callback);
		}, function(done) {
			console.log('done');
			console.log(ids);
		});
	});
});

