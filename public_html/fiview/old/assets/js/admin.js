var pn = window.location.pathname,
		pg = window.location.pathname.split('/'),
		incident_types = [],
		jurisdictions = [],
		dispatch_states = [],
		zones = [];

$('#add-itype').on('click', function() {
  var x = 0;
	$('.incident_type').each(function() {
	  x++;
	});
  
	var l = '<div class="row incident_type" data-id="w' + (x + 1) + '"><div class="col-md-4"><input type="text" name="type[]" class="form-control" style="max-width:400px" placeholder="Incident Type" value=""></div>' +
 					'<div class="col-md-8"><a class="btn btn-sm btn-danger" id="remove-itype" data-id="' + (x + 1) + '"><i class="fas fa-trash-alt"></i> Remove</a></div></div>';

  $('#incident_types').html($('#incident_types').html() + l);
});

$(document).on('click', '[id^=remove-itype]', function(e) {
  var w = 'w' + $(this).attr('data-id');
	console.log('yes');
	$('.incident_type').each(function() {
	  if (w == $(this).attr('data-id')) {
		  $(this).remove();
		}
	});
});
		
function data() {
  $.ajax({
    url: host + 'ajax/api/cad/config',
    method: 'POST',
    data: {
      agency: agency
    },
    dataType: 'json',
    success: function(r) {
      for (var i = 0; i < r.response.incident.length; i++) {
        incident_types.push(r.response.incident[i]);
				$('select[name=default_incident]').append('<option ' + ($('select[name=default_incident]').attr('data-selected') == r.response.incident[i] ? 'selected ' : '') + 'value="' + r.response.incident[i] + '">' + r.response.incident[i] + '</option>');
      }
			
      for (var i = 0; i < r.response.jurisdiction.length; i++) {
        jurisdictions.push(r.response.jurisdiction[i].value);
				$('select[name=default_jurisdiction]').append('<option ' + ($('select[name=default_jurisdiction]').attr('data-selected') == r.response.jurisdiction[i].value ? 'selected ' : '') + 'value="' + r.response.jurisdiction[i].value + '">' + r.response.jurisdiction[i].value + '</option>');
      }
			
      for (var i = 0; i < r.response.states.length; i++) {
        dispatch_states.push(r.response.states[i]);
      }
      
			for (var i = 0; i < r.response.zone.length; i++) {
        zones.push(r.response.zone[i]);
				$('select[name=default_zone]').append('<option ' + ($('select[name=default_zone]').attr('data-selected') == r.response.zone[i] ? 'selected ' : '') + 'value="' + r.response.zone[i] + '">' + r.response.zone[i] + '</option>');
      }

    }
  });
}

$(document).ready(function() {
  if (pg[3] == 'admin' && pg[4] == 'cad') {
	  data();
  }
});
