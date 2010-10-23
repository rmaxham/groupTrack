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
    $('#createPerson').bind('pageAnimationStart', willShowCreatePerson);
	$('#expense .delete').click(clickedDeleteExpense);
	$('#name').change(changedNameInput);

    
    // -- configure the expenses panels
    $('#editExpense form').submit(createExpense);
    
	// -- configure the database
    gtdata = new GTData();
	gtdata.addPeopleChangedListener(peopleChanged);
	gtdata.addExpensesChangedListener(expensesChanged);
    gtdata.setupDb();
});

/////////////////////////////////////////////////////////////////////
// UTILITIES ///////////////////////////////////////////////////////

function dateString(date)
{
	if (typeof date != 'Date') {
		var tdate = new Date();
		tdate.setTime(parseFloat(date));
		date = tdate;
	}

	var hour = date.getHours();
	var apm = (hour < 12) ? 'AM' : 'PM';
	if (hour == 0)
		hour = 12;
	if (hour > 12)
		hour -= 12;
	var minutes = date.getMinutes();
	if (minutes < 10)
		minutes = '0' + minutes;
		
	var dayStr = ['Sun','Mon','Tues','Weds','Thurs','Fri','Sat'][date.getDay()];
		
	return dayStr + ' ' + (date.getMonth() + 1) + '-' + date.getDate() + '-' + date.getFullYear() + ' ' + hour + ':' + minutes + ' ' + apm;
}

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

function willShowCreatePerson() {
	var symbol = this.id;
	$('#name').val("");
	$('#symbol').val("");
}

//-------------------------------------------------------------------

function changedNameInput() {
	var val = $(this).val();
	if (val.length > 0)
		$('#symbol').val( val.charAt(0).toUpperCase() );
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

function clickedDeletePerson(id, name)
{
	var clickedEntry = $(this).parent();
	var id = clickedEntry.data('personId');
	var name = clickedEntry.find('.name').text();

	var result = confirm('are you sure you want to delete ' + name + ' (' + id + ')?');
	if (result) {
		gtdata.deletePerson(id);
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
		newEntryRow.find('.delete').click(clickedDeletePerson);
		
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
	$('.gttoggle').bind($.support.touch ? 'touchstart' : 'mousedown', gttoggleClicked);
}


/////////////////////////////////////////////////////////////////////
// EXPENSES ////////////////////////////////////////////////////////

function createExpense() {
	var record = {
		timestamp: new Date().getTime(),
		amount: parseFloat( $('#amount').val() ),
		desc: $('#desc').val(),
		payer: $('#payer').val(),
		recipients: '',
	};

	var recp = $('#recipients .gttoggle');
	for (var i=0; i < recp.length; i++)
	{
		if (recp[i].checked)
			record.recipients += recp[i].value;
	}
	
	if (record.desc.length == 0)
	{
		alert("description required");
		return;
	}
	
	if (isNaN(record.amount))
	{
		alert("valid amount required");
		return;
	}
	
	if (record.payer.length == 0)
	{
		alert("payer required");
		return;
	}

	if (record.recipients.length == 0)
	{
		alert("at least one recipient required");
		return;
	}
	
	gtdata.newExpense(record, createExpenseSuccess, createExpenseError);
}

//------------------------------------------------------------------

function createExpenseSuccess() {
	jQT.goBack();
}

//------------------------------------------------------------------

function createExpenseError(error) {
	alert('Failed to add expense - ' + error.message);
}

//------------------------------------------------------------------

function expensesChanged() {
	gtdata.getAllExpenses(loadExpenses);
}

//------------------------------------------------------------------

function loadExpenses(result)
{
	$('#expenses ul li:gt(0)').remove();

	for (var i = 0; i < result.rows.length; ++i) {
		var row = result.rows.item(i);
		
		var newEntryRow = $('#expenseTemplate').clone();
		newEntryRow.removeAttr('id');
		newEntryRow.removeAttr('style');
		newEntryRow.data('expenseId', row.id);
		newEntryRow.appendTo('#expenses ul');
		newEntryRow.find('.desc').text(row.desc);
	}
    $('#expenses li a').click(clickedExpense);
}

//------------------------------------------------------------------

function clickedExpense() {
	$('#expense h1').text(this.text);
	gtdata.getExpense($(this).parent().data('expenseId'), loadExpense);
}

//------------------------------------------------------------------

function loadExpense(result) {
	$('#expense .date').text( dateString( result.timestamp ) );
	$('#expense .desc').text( result.desc );
	$('#expense .amount').text( result.amount.toFixed(2) );
	$('#expense .payer').text( result.payer );
	$('#expense .recipients').text( result.recipients );
	$('#expense .delete').data( 'expenseId', result.id );
}

//------------------------------------------------------------------

function clickedDeleteExpense() {

	var expense = $(this).data('expenseId');
	
	var result = confirm('are you sure you want to delete this expense?');
	if (result)
	{
		gtdata.deleteExpense(expense);
		jQT.goBack();
	}
	
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

//------------------------------------------------------------------

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

