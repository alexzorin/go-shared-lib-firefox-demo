var self = require('sdk/self');

var goLib = require("./ctypes_loader");

var buttons = require("sdk/ui/button/action");
var tabs = require("sdk/tabs");

var registerHandlers = function(worker) {
	worker.port.on("connect", function(connectionString) {
		worker.port.emit("alert", goLib.Connect(connectionString));
	});
	worker.port.on("disconnect", function() {
		worker.port.emit("alert", goLib.Disconnect());
	});
	worker.port.on("select-query", function(qry) {
		worker.port.emit("select-query-results", goLib.SelectQuery(qry));
	});
}

var button = buttons.ActionButton({
	id: "firefoxmysql-link",
	label: "Open MySQL Admin for Firefox",
	icon: {
		"16": "./icon-16.png",
		"32": "./icon-32.png",
		"64": "./icon-64.png",
	},
	onClick: function(state) {
		var tab = tabs.open({
			url: self.data.url("addon-window.html"),
			onReady: function(t) {
				var worker = t.attach({
					contentScriptFile: [
						self.data.url("addon-script.js")
					]
				});
				registerHandlers(worker);
			}
		});
	}
});

