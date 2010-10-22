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
    
    // -- configure the expenses panels
    $('#createExpense form').submit(createExpense);
    
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
	var payer = $('#payer');
	payer.find('option').remove();
	$('#recipients div:gt(0)').remove();
	var cols = $('#recipients td');

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
		
		var newOption = document.createElement('option');
		newOption.value = row.id;
		newOption.text = row.name;
		payer.append(newOption);
		
		var newRecipient = $('#recipientTemplate').clone();
		newRecipient.removeAttr('id');
		newRecipient.removeAttr('style');
		newRecipient.appendTo(cols[i % cols.length]);
		newRecipient.text(row.name);
		newRecipient.val(row.id);
		newRecipient.attr('id', 'recipient');
	}

	// hook up any gttoggle's we created to their handler
	$('.gttoggle').tap(gttoggleClicked);
}


/////////////////////////////////////////////////////////////////////
// EXPENSES ////////////////////////////////////////////////////////

function expenseWillShow() {
	var symbol = this.id;
	$('#person h1').text(this.text);
}

function createExpense() {
}

function expensesChanged() {
}

/////////////////////////////////////////////////////////////////////
// GROUP TRACK TOGGLE //////////////////////////////////////////////

function gttoggleClicked() {
	if (this.lastTapTime !== undefined) {
		var timeDiff = (new Date()).getTime() - this.lastTapTime;
		if (timeDiff < 300) {
			gttoggleDblClicked(this);
			return;
		}
	}

	if (this.checked) {
		$(this).removeClass('checked');
		this.checked = false;
	} else {
		$(this).addClass('checked');
		this.checked = true;
	}
	this.lastTapTime = (new Date()).getTime();
}

function gttoggleDblClicked(el) {
	var all = $(el).parent().parent().find('.gttoggle');
	if (!el.checked) {
		all.removeClass('checked');
		all.attr('checked', false);
	} else {
		all.addClass('checked');
		all.attr('checked', true);
	}
}

