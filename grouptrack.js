/////////////////////////////////////////////////////////////////////
// INITIALIZATION //////////////////////////////////////////////////

var jQT = $.jQTouch({
	icon: 'kilo.png',
	statusBar: 'black'
});
var gtdata;

//-------------------------------------------------------------------

$(document).ready(function(){
	// -- configure the settings panel
    $('#settings form').submit(saveSettings);
    $('#settings').bind('pageAnimationStart', loadSettings);

	// -- configure the people panels
    $('#createPerson form').submit(createPerson);
    $('#createPerson').bind('pageAnimationStart', createPersonWillShow);
    
	// -- configure the database
    gtdata = new GTData();
	gtdata.addPeopleChangedListener(peopleChanged);
	gtdata.addExpensesChangedListener(expensesChanged);
    gtdata.setupDb();
});

/////////////////////////////////////////////////////////////////////
// SETTINGS ////////////////////////////////////////////////////////

function saveSettings() {
    localStorage.gdocsurl = $('#gdocsurl').val();
    localStorage.username = $('#username').val();
    localStorage.password = $('#password').val();
    // TODO: verify this stuff works
    jQT.goBack();
}

//-------------------------------------------------------------------

function loadSettings() {
    $('#gdocsurl').val(localStorage.gdocsurl);
    $('#username').val(localStorage.username);
    $('#password').val("");
}

/////////////////////////////////////////////////////////////////////
// PEOPLE //////////////////////////////////////////////////////////

function createPersonWillShow() {
	var symbol = this.id;
	$('#name').val("");
	$('#symbol').val("");
}

//-------------------------------------------------------------------

function createPerson() {
	var record = { name: $('#name').val(),
				 symbol: $('#symbol').val() };

	record.symbol = record.symbol.toUpperCase();

	if (record.name.length == 0)
	{
		alert("name required");
		return;
	}
	
	if (record.symbol.length != 1)
	{
		alert('symbol must be one character');
		return;
	}
	
	gtdata.newPerson(record, createPersonSuccess, createPersonError);
}

//-------------------------------------------------------------------

function createPersonError(error) {
	if (error.message == 'constraint failed')
		alert('symbol must be unique');
	else
		alert('Failed to add person - ' + error.message);
}

//-------------------------------------------------------------------

function createPersonSuccess() {
	jQT.goBack();
}

//------------------------------------------------------------------

function deletePerson(id, name)
{
	var clickedEntry = $(this).parent();
	var id = clickedEntry.data('personId');
	var name = clickedEntry.find('.name').text();

	var result = confirm('are you sure you want to delete ' + name + ' (' + id + ')?');
	if (result) {
		gtdata.deletePerson(id);
		//clickedEntry.slideUp();
	}
}

//------------------------------------------------------------------

function peopleChanged() {
	gtdata.getAllPeople(loadPeople);
}

//------------------------------------------------------------------

function loadPeople(result) {
	
	$('#people ul li:gt(0)').remove();

	for (var i = 0; i < result.rows.length; ++i) {
		var row = result.rows.item(i);

		var newEntryRow = $('#personTemplate').clone();
		newEntryRow.removeAttr('id');
		newEntryRow.removeAttr('style');
		newEntryRow.data('personId', row.id);
		newEntryRow.appendTo('#people ul');
		newEntryRow.find('.name').text(row.name);
		newEntryRow.find('.symbol').text("(" + row.id + ")");
		newEntryRow.find('.delete').click(deletePerson);
	}
}


/////////////////////////////////////////////////////////////////////
// EXPENSES ////////////////////////////////////////////////////////

function expenseWillShow() {
	var symbol = this.id;
	$('#person h1').text(this.text);
}

function expensesChanged() {
}
