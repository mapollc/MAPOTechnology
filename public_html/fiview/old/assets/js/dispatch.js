var loading = '<div style="position:relative;width:100%;height:100%"><div style="position:absolute;text-align:center;top:50%;left:50%;transform:translate(-50%,-50%)"><img src="https://d3kcsn1y1fg3m9.cloudfront.net/images/fireloading.svg"></div></div>',
  dispatchers = [],
  jurisdictions = [],
  zones = [],
  incident_types = [],
  cur_inc_ids = [],
  cur_res_ids = [],
	cur_lids = [],
  dispatch_states = [],
  next_inc_num,
	reload_time = 10,
	mainTimer;

function timeAgo(t, w, c) {
  var val,
    d = Math.round(new Date().getTime() / 1000) - t,
    days = Math.floor(d / (3600 * 24)),
    hrs = Math.floor(d % (3600 * 24) / 3600),
    mins = Math.floor(d % 3600 / 60),
    secs = Math.floor(d % 60);
  return (days < 10 ? '0' : '') + days + ':' + (hrs < 10 ? '0' : '') + hrs + ':' + (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
}

function resourceStatus(s) {
  var r = '';
  switch (s) {
    case 'ava':
      r = 'Available';
      break;
    case 'enr':
      r = 'Enroute';
      break;
    case 'ons':
      r = 'On-Scene';
      break;
    case 'lea':
      r = 'Leaving Scene';
      break;
    case 'not':
      r = 'Notified';
      break;
    case 'avos':
      r = 'Available On-Scene';
      break;
    case 'com':
      r = 'Committed';
      break;
    case 'ins':
      r = 'In Service';
      break;
    case 'ous':
      r = 'Out of Service';
      break;
  }
  return r;
}

function timeEvents() {
    var ids = ['active_incidents', 'pending_incidents', 'resources'];
    var t = ['incident', 'incident', 'unit'];

    for (var i = 0; i < ids.length; i++) {
      var a = '#' + ids[i] + ' tbody tr',
        b = '#' + t[i] + 'Timer';

      $(a).each(function() {
			  if ($(this).attr('data-status') != 'ous') {
          var ts = $(this).attr('data-time');
          $(this).find(b).html((ts ? timeAgo(ts) : '--'));
				}
      });
    }
}

/* Pull configuration data for the dispatch agency to setup their CAD */
function initialize() {
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
      }
			
      for (var i = 0; i < r.response.jurisdiction.length; i++) {
        jurisdictions.push(r.response.jurisdiction[i].value);
      }
			
      for (var i = 0; i < r.response.dispatchers.length; i++) {
        dispatchers.push(r.response.dispatchers[i]);
      }
			
      for (var i = 0; i < r.response.states.length; i++) {
        dispatch_states.push(r.response.states[i]);
      }
      
			for (var i = 0; i < r.response.zone.length; i++) {
        zones.push(r.response.zone[i]);
        $('#units_filter_zone').append('<option value="' + r.response.zone[i] + '">' + r.response.zone[i] + '</option>');
        $('#active_filter_zone').append('<option value="' + r.response.zone[i] + '">' + r.response.zone[i] + '</option>');
        $('#pending_filter_zone').append('<option value="' + r.response.zone[i] + '">' + r.response.zone[i] + '</option>');
      }
			
			$('#shadow').hide();
  		$('#page_loading').hide();
    }
  });
	
  $('#modal #content').html(loading);
}

/* Default function to open modal */
function openModal(t, s) {
  $.ajax({
    url: host + 'ajax/forms/' + t,
    method: 'POST',
    dataType: 'html',
    success: function(a) {
      if (s == 1) {
        $('#modal').addClass('small');
      } else {
			  $('#modal').css('max-width', (s > 100 ? s : 805) + 'px');
			}
			
      $('#modal #content').html(a);
      $('#modal').show();
      $('#shadow').show();
    }
  });
}

/* Function to create a new incident */
function newIncident() {
  $.ajax({
    url: host + 'ajax/api/cad/numbering',
    method: 'POST',
    dataType: 'json',
    success: function(r) {
      openModal('incident/add?next=' + r.response.nextIncidentNum, 850);
    }
  });
}

/* Get dispatch log */
function getLog() {
  $.ajax({
	  url: host + 'ajax/api/cad/log',
		method: 'POST',
		data: {
		  agency: agency,
			today: 1
		},
		dataType: 'json',
		success: function(r) {
		  var l = '';
			
			if (r.response.log && r.response.log.length > 0) {
			  for (var i = 0; i < r.response.log.length; i++) {
				  var d = new Date(r.response.log[i].time*1000),
							t = (d.getMonth()+1) + '/' + d.getDate() + '/' + d.getFullYear().toString().substr(2, 2) + ' ' + (d.getHours() < 10 ? 0 : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? 0 : '') + d.getMinutes() + ':' + (d.getSeconds() < 10 ? 0 : '') + d.getSeconds();

          if (cur_lids.includes(r.response.log[i].lid) === false) {
  			    l += '<tr data-lid="' + r.response.log[i].lid + '"><td scope="col">' + t + '</td>';
  					if (r.response.log[i].action.f) {
  					  l += '<td scope="col">' + r.response.log[i].action.f.toUpperCase() + '</td><td scope="col">' + r.response.log[i].action.t.toUpperCase() + '</td>' +
  								 '<td scope="col">' + r.response.log[i].action.d + '</td>';
  					} else {
  					  l += '<td scope="col"></td><td scope="col"></td>' +
  								 '<td scope="col">' + r.response.log[i].action + '</td>';
  					}
  					
  					l += '</tr>';						
					}

					cur_lids.push(r.response.log[i].lid);
			  }
				
				$('#log tbody').prepend(l);
			}
		}
	});
}

/* Function to get this agency's resources */
function getResources() {
  $.ajax({
    url: host + 'ajax/api/cad/resources',
    method: 'POST',
    data: {
      agency: agency
    },
    dataType: 'json',
    success: function(r) {
      var u = '',
					inc_r = [];
      
			for (var i = 0; i < r.response.units.length; i++) {
        if (cur_res_ids.includes(r.response.units[i].unit) === false) {
          u += '<tr id="wildusaUnit" data-time="' + r.response.units[i].last_comm + '" data-zone="' + r.response.units[i].zone + '" data-status="' + r.response.units[i].status + '" data-unit="' + r.response.units[i].unit + '"' + (r.response.units[i].inc ? ' data-inc="' + r.response.units[i].inc + '"' : '') + '><td scope="col" style="width:30%">' + r.response.units[i].unit + '</td><td scope="col" style="width:25%">' + r.response.units[i].type + '</td><td scope="col" style="width:30%" class="status ' + r.response.units[i].status + '" title="' + resourceStatus(r.response.units[i].status) + (r.response.units[i].inc ? ' @ ' + r.response.units[i].inc : '') + '">' + resourceStatus(r.response.units[i].status) + '</td><td scope="col" id="unitTimer" style="width:15%"></td></tr>';
        } else {
				  var s = $('#resources tbody').find('tr[data-unit="' + r.response.units[i].unit + '"] td').eq(2).attr('class').split(' ');
					
				  $('#resources tbody').find('tr[data-unit="' + r.response.units[i].unit + '"]').attr('data-time', r.response.units[i].last_comm);
					
					if (r.response.units[i].status != s[1]) {
					  $('#resources tbody').find('tr[data-unit="' + r.response.units[i].unit + '"] td').eq(2).html(resourceStatus(r.response.units[i].status));
					  $('#resources tbody').find('tr[data-unit="' + r.response.units[i].unit + '"] td').eq(2).addClass(r.response.units[i].status).removeClass(s[1]);
						$('#resources tbody').find('tr[data-unit="' + r.response.units[i].unit + '"] td').eq(2).attr('title', resourceStatus(r.response.units[i].status) + (r.response.units[i].inc ? ' @ ' + r.response.units[i].inc : ''));
						$('#resources tbody').find('tr[data-unit="' + r.response.units[i].unit + '"] td').eq(2).attr('data-status', r.response.units[i].status);
						
						if (r.response.units[i].inc) {
						  $('#resources tbody').find('tr[data-unit="' + r.response.units[i].unit + '"] td').eq(2).attr('data-inc', r.response.units[i].inc);
						}
					}
					
					clearInterval(mainTimer);
					mainTimer = setInterval(timeEvents, 1000);
				}
				
				$('#active_incidents tbody tr').each(function() {
				  if ($(this).attr('data-num') == r.response.units[i].inc) {
					  inc_r.push($(this).attr('data-num') + '|' + r.response.units[i].status + '|' + r.response.units[i].unit);
					}
				});

        cur_res_ids.push(r.response.units[i].unit);
      }
			
			$('#active_incidents tbody tr').each(function() {
			  $(this).children().eq(3).html('');
			});
			
			for (var x = 0; x < inc_r.length; x++) {
			  var v = inc_r[x].split('|');
			  $('#active_incidents tbody').find('tr[data-num="' + v[0] + '"] td').eq(3).append('<div class="' + v[1] + '">' + v[2] + '</div>');
			}
      
			$('#resources tbody').append(u);
    }
  });
}

/* Funciton get the agencies current incidents */
function getIncidents() {
  var a = p = '';
  $.ajax({
    url: host + 'ajax/api/cad/incidents',
    method: 'POST',
    data: {
      agency: agency
    },
    dataType: 'json',
    success: function(r) {
		  if (r.response.active && r.response.active.length > 0) {
        for (var i = 0; i < r.response.active.length; i++) {
          if (cur_inc_ids.includes(r.response.active[i].id) === false) {
  				  var num = r.response.active[i].jurisdiction.substr(2, r.response.active[i].jurisdiction.length) + '-' + r.response.active[i].num;
            a += '<tr id="wildusaIncident" data-id="' + r.response.active[i].id + '" data-num="' + num + '" data-zone="' + r.response.active[i].zone + '" data-time="' + r.response.active[i].reported + '"><td scope="col">' + num + '</td><td scope="col">' + r.response.active[i].name + '</td><td scope="col">' + r.response.active[i].type + '</td><td scope="col" class="resources"></td><td scope="col" id="incidentTimer"></td></tr>';

            cur_inc_ids.push(r.response.active[i].id);
          }
        }
			}
      
		  if (r.response.pending && r.response.pending.length > 0) {
  			for (var i = 0; i < r.response.pending.length; i++) {
          if (cur_inc_ids.includes(r.response.pending[i].id) === false) {
  				  var num = r.response.pending[i].jurisdiction.substr(2, r.response.pending[i].jurisdiction.length) + '-' + r.response.pending[i].num;
            p += '<tr id="wildusaIncident" data-id="' + r.response.pending[i].id + '" data-num="' + num + '" data-zone="' + r.response.pending[i].zone + '" data-time="' + r.response.pending[i].reported + '"><td scope="col">' + num + '</td><td scope="col">' + r.response.pending[i].name + '</td><td scope="col">' + r.response.pending[i].type + '</td><td scope="col" class="resources"></td><td scope="col" id="incidentTimer"></td></tr>';
          
            cur_inc_ids.push(r.response.pending[i].id);
					}
        }
			}
						
      $('#active_incidents tbody').append(a);
      $('#pending_incidents tbody').append(p);
    }
  });
}

/* Open command line */
function cmd() {
  openModal('cmdline', 1);
}

/* Run these functions on page load*/
$(window).on('load', function() {
  $('#shadow').show();
  $('#page_loading').show();

  initialize();
  getIncidents();
  getResources();
	getLog();
	
  setInterval(function() {
    getIncidents();
    getResources();
		getLog();
  }, (reload_time * 1000));

	mainTimer = setInterval(timeEvents, 1000);
});

/* Keyboard shortcut CAD functions*/
$(document).keyup(function(e) {
  e.preventDefault();
  e.stopPropagation();

  if (e.keyCode === 27) {
    closeModal();
  }

	if (window.location.pathname.split('/')[3] == 'dispatch') {
    if ($('#modal').is(':visible') === false) {
      if (e.keyCode === 78) {
        newIncident();
      } else if (e.keyCode === 67) {
        cmd();
      }
    }
	}
});

/* Click functions */
$('#dispatch_map').click(function() {
  window.open(host + 'agency/' + agency + '/map/view');
});

$('#cmd').click(function() {
  cmd();
});

$('#unit-status').click(function() {
  openModal('assign?no_inc=1', 1);
});

$(document).on('click', '[id^=newInc]', function() {
  newIncident();
});

$(document).on('click', '[id^=wildusaIncident]', function() {
  openModal('incident/edit?id=' + $(this).attr('data-id'));
});

$(document).on('click', '[id^=wildusaUnit]', function() {
  openModal('assign?unit=' + $(this).attr('data-unit') + ($(this).attr('data-inc') ? '&inc=' + $(this).attr('data-inc') : ''), 1);
});

/* Filter resources based on the zone they're assigned to */
$(document).on('change', '[id^=units_filter_zone]', function() {
  var z = $(this).val();
	
	$('#resources tbody tr').each(function() {
	  if (z == 'All') {
		  $(this).removeClass('filter-hide');
		} else {
  	  if ($(this).attr('data-zone') != z) {
  		  $(this).addClass('filter-hide');
  		} else {
  		  $(this).removeClass('filter-hide');
  		}
		}
	});
});

/* Filter resources based on their current status */
$(document).on('change', '[id^=filter_status]', function() {
  var z = $(this).val();
	
	$('#resources tbody tr').each(function() {
	  if (z == 'All') {
		  $(this).removeClass('filter-hide');
		} else {
  	  if ($(this).attr('data-status') != z.toLowerCase()) {
  		  $(this).addClass('filter-hide');
  		} else {
  		  $(this).removeClass('filter-hide');
  		}
		}
	});
});

/* Filter active incidents based on the fire's zone */
$(document).on('change', '[id^=active_filter_zone]', function() {
  var z = $(this).val();
	
	$('#active_incidents tbody tr').each(function() {
	  if (z == 'All') {
		  $(this).removeClass('filter-hide');
		} else {
  	  if ($(this).attr('data-zone').toLowerCase() != z.toLowerCase()) {
  		  $(this).addClass('filter-hide');
  		} else {
  		  $(this).removeClass('filter-hide');
  		}
		}
	});
});

/* Filter pending incidents based on the fire's zone */
$(document).on('change', '[id^=pending_filter_zone]', function() {
  var z = $(this).val();
	
	$('#pending_incidents tbody tr').each(function() {
	  if (z == 'All') {
		  $(this).removeClass('filter-hide');
		} else {
  	  if ($(this).attr('data-zone').toLowerCase() != z.toLowerCase()) {
  		  $(this).addClass('filter-hide');
  		} else {
  		  $(this).removeClass('filter-hide');
  		}
		}
	});
});

/* Command line function */
$(document).on('submit', '[id^=command_line]', function(e) {
  e.preventDefault();
	
	if ($('form#command_line input[name=command]').val() == '') {
	  $('#modal #cmdlineerror').show();
	} else {
  	$.ajax({
  	  url: host + 'ajax/api/forms/command',
  		method: 'POST',
  		dataType: 'json',
  		data: $(this).serialize(),
  		success: function() {
  		  closeModal();
  		}
  	});
	}
});

/* Functions to process form submissions */
$(document).on('submit', '[id^=incident]', function(e) {
  e.preventDefault();
  e.stopPropagation();

  var req = [];

  $.ajax({
    url: host + 'ajax/api/forms/incident/' + $(this).serializeArray()[0].value,
    method: 'POST',
    data: $(this).serialize() + '&' + $('#incidentFireData').serialize(),
    success: function(r) {
      if (r.return.response == 1) {
				$('.modal-header').after('<div class="alert alert-danger">This incident number already exists.</div>');
      } else {
        closeModal();

        $('#active_incidents tbody tr').each(function() {
          $(this).remove()
        });

        $('#pending_incidents tbody tr').each(function() {
          $(this).remove()
        });

        cur_inc_ids = [];

				/* Refresh incident list */
        getIncidents();
      }
    }
  });
});

/* Function to submit resource assignment and status change */
$(document).on('submit', '[id^=assign_resource]', function(e) {
  e.preventDefault();
	e.stopPropagation();

  var a = $('#assign_resource select[name=active_incidents] option:selected').val(),
      p = $('#assign_resource select[name=pending_incidents] option:selected').val(),
      s = $('#assign_resource select[name=status] option:selected').val(),
      u = $('#assign_resource select[name=unit] option:selected').val(),
			msg = '';
			
	/*if (a == '- Choose -' && p == '- Choose -' && $('#assign_resource input[name=no_inc]').val() != 1) {
	  msg = 'You must choose an incident to assign a resource to.';
	} else if (a != '- Choose -' && p != '- Choose -' && $('#assign_resource input[name=no_inc]').val() != 1) {
	  msg = 'You cannot choose an active & pending incident.';
	} else*/ if (!s) {
	  msg = 'You must assign this resource a status.';
	} else if (!u && $('#assign_resource input[name=no_inc]').val() == 1) {
	  msg = 'You must choose a resource to assign.';
	} else {
	  $('#ar_msg').remove();
    $.ajax({
      url: host + 'ajax/api/forms/resource/assign',
      method: 'POST',
      data: $(this).serialize(),
      success: function(r) {
			  if (r.return.response == 'success') {
				  getIncidents();
				  getResources();
					closeModal();
				}
			}
		});
	}
	
	if (msg) {
	  if ($('#ar_msg').length == 0) {
		  $(this).prepend('<div id="ar_msg" class="alert alert-danger p-1 text-center">' + msg + '</div>');
		} else {
		  $('#ar_msg').html(msg);
		}
	}
});