self.port.on("alert", function(msg) {
	window.alert(msg);
});

self.port.on("select-query-results", function(results) {
	window.postMessage({action: "select-query-results", data: results}, "*");
});

window.addEventListener("message", function(evt) {
	var d = evt.data;
	switch(d.action) {
		case "connect":
			self.port.emit("connect", d.connectionString);
			break;
		case "disconnect":
			self.port.emit("disconnect", "");
			break;
		case "select-query":
			self.port.emit("select-query", d.query);	
			break;
		default:
			break;
	}
});
