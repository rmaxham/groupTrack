(function(){
function GTData () {

	try {
		if (window.openDatabase) {
			this.db = openDatabase("GroupTrack2", "1.1", "GroupTrack Db 1.1", 200000);
			if (!this.db)
				alert("Failed to open the database on disk.  This is probably because the version was bad or there is not enough space left in this domain's quota");
		} else
			alert("Couldn't open the database.  Please try with a WebKit nightly with this feature enabled");
	} catch(err) {
		this.db = null;
		alert("Couldn't open the database.  The database may need upgrading or the upgrade failed somehow.");
	}

}

GTData.prototype = {

	db: null,
	peopleChangedListeners: [],
	expensesChangedListeners: [],
	
	setupDb: function ()
	{
		var self = this;
		// check existence of the people table and create if not
		this.db.transaction(function(tx) {
			tx.executeSql("SELECT COUNT(*) FROM GroupTrackPeople", [], function(result) {
				self.peopleChanged();
			}, function(tx, error) {
				tx.executeSql("CREATE TABLE GroupTrackPeople (id TEXT PRIMARY KEY UNIQUE, name TEXT)", [], function(result) { 
					self.peopleChanged(); 
				});
			});
		});
	
		// check existence of the expenses table and create if not
		this.db.transaction(function(tx) {
			tx.executeSql("SELECT COUNT(*) FROM GroupTrackExpenses", [], function(result) {
				self.expensesChanged(); 
			}, function(tx, error) {
				tx.executeSql("CREATE TABLE GroupTrackExpenses (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, desc TEXT, amount REAL, payer TEXT, recipients TEXT, timestamp REAL)", [], function(result) { 
					self.expensesChanged(); 
				});
			});
		});
	},

	addPeopleChangedListener: function (listener)
	{
		this.peopleChangedListeners.push(listener);
	},

	addExpensesChangedListener: function (listener)
	{
		this.expensesChangedListeners.push(listener);
	},

	newPerson: function(record, success_callback, error_callback)
	{
		var self = this;
		this.db.transaction(function (tx) 
		{
			tx.executeSql("INSERT INTO GroupTrackPeople (id, name) VALUES (?, ?)", [record.symbol, record.name]);
		}, function(error) {
			if (error_callback !== undefined)
				error_callback(error);
		}, function() {
			self.peopleChanged();
			if (success_callback !== undefined)
				success_callback();
		});
	},

	deletePerson: function (id)
	{
		var self = this;
		this.db.transaction(function(tx)
		{
			tx.executeSql("DELETE FROM GroupTrackPeople WHERE id = ?", [id]);
		}, function( error) {
			alert('Failed to delete person - ' + error.message);
		}, function() {
			self.peopleChanged();
		} );
	},

	getAllPeople: function (callback)
	{
		this.db.transaction(function(tx) {
			tx.executeSql("SELECT * FROM GroupTrackPeople", [], function(tx, result) {

				callback(result);
	
			}, function(error) {
				alert('Failed to retrieve people from database - ' + error.message);
				return;
			});
		});
	},

	newExpense: function (record, success_callback, error_callback)
	{
		var self = this;
		this.db.transaction(function (tx) 
		{
			tx.executeSql("INSERT INTO GroupTrackExpenses (desc, amount, payer, recipients, timestamp) VALUES (?, ?, ?, ?, ?)", 
														[record.desc, record.amount, record.payer, record.recipients, record.timestamp]);
		}, function(error) {
			if (error_callback !== undefined)
				error_callback(error);
		}, function() {
			self.expensesChanged();
			if (success_callback !== undefined)
				success_callback();
		});
	},
	
	deleteExpense: function (id)
	{
		var self = this;
		this.db.transaction(function(tx)
		{
			tx.executeSql("DELETE FROM GroupTrackExpenses WHERE id = ?", [id]);
		}, function( error) {
			alert('Failed to delete expense - ' + error.message);
		}, function() {
			self.expensesChanged();
		} );
	},
	
	getAllExpenses: function (callback)
	{
		this.db.transaction(function(tx) {
			tx.executeSql("SELECT * FROM GroupTrackExpenses", [], function(tx, result) {

				callback(result);
	
			}, function(error) {
				alert('Failed to retrieve expenses from database - ' + error.message);
				return;
			});
		});
	},

	getExpense: function (id, callback)
	{
		var item = null;
		this.db.transaction(function(tx) {
			tx.executeSql("SELECT * FROM GroupTrackExpenses WHERE id=?", [id], function(tx, result) {
				callback( result.rows.item(0) );
			}, function(error) {
				alert('Failed to retrieve expenses from database - ' + error.message);
				return;
			});
		});
	},

	// private methods, no need for a client to call these APIs
	
	peopleChanged: function ()
	{
		// notify interested parties that the people table has changed
		for (var i=0; i<this.peopleChangedListeners.length; i++)
		{
			this.peopleChangedListeners[i]();
		}
	},
	
	expensesChanged: function ()
	{
		// notify interested parties that the expenses table has changed
		for (var i=0; i<this.expensesChangedListeners.length; i++)
		{
			this.expensesChangedListeners[i]();
		}
	},
	
}

// Expose GTData to the world
window.GTData = GTData;
})();