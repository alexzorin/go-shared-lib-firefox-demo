(function() {

var self = require("sdk/self");

var Chrome = require("chrome");
var ctypes = Chrome.Cu.import("resource://gre/modules/ctypes.jsm", null).ctypes;
var Servicves = Chrome.Cu.import("resource://gre/modules/Services.jsm");
var ResProtocolHandler = Services.io.getProtocolHandler("resource")
	.QueryInterface(Chrome.Ci.nsIResProtocolHandler);
var ChromeRegistry = Chrome.Cc["@mozilla.org/chrome/chrome-registry;1"]
	.getService(Chrome.Ci.nsIChromeRegistry);

var resolveToFile = function(uri) {
	switch (uri.scheme) {
		case "chrome":
			return resolveToFile(ChromeRegistry.convertChromeURL(uri));
		case "resource":
			return resolveToFile(Services.io.newURI(ResProtocolHandler.resolveURI(uri), null, null));
		case "file":
			return uri.QueryInterface(Chrome.Ci.nsIFileURL).file;
		default:
			throw new Error("Cannot resolve");
	}
}

var GoString = new ctypes.StructType("GoString", [
	{ "p": ctypes.char.ptr },
	{ "n": ctypes.int }
]);

var makeGoString = function(str) {
	var gs = new GoString();
	gs.p = ctypes.char.array()(str);
	gs.n = str.length;
	return gs;
};

var SelectQueryResult = new ctypes.StructType("SelectQuery_return", [
	{ "r0": GoString }, { "r1": GoString }
]);

var lib = ctypes.open(
	resolveToFile(Services.io.newURI(self.data.url("./go/firefox-mysql.so"), null, null)).path
);

var connect = lib.declare("Connect", ctypes.default_abi, GoString, GoString);
var disconnect = lib.declare("Disconnect", ctypes.default_abi, GoString);
var selectQuery = lib.declare("SelectQuery", ctypes.default_abi, SelectQueryResult, GoString);

module.exports = {
	Connect: function(connectionString) {
		return connect(makeGoString(connectionString)).p.readString();
	},
	Disconnect: function() {
		return disconnect().p.readString();
	},
	SelectQuery: function(qry) {
		var res = selectQuery(makeGoString(qry));
		if(!res.r1.p.isNull()) {
			return res.r1.p.readString();
		}
		return res.r0.p.readString();
	}
};

})();
