var fireCauses = {"general":{"human":["Camping","Coal Seam","Debris Burning","Equipment","Firearms\/Weapons","Incendiary","Other Human Cause","Railroad","Smoking","Undetermined","Utilities"],"natural":["Lightning","Other Natural Cause","Volcanic"]},"specific":["Accident\/Derailment","Agricultural","Aircraft","Ammunition","Armor Piercing Incendiary\/Tracer Ammunition","Arson-Crime Concealment","Arson-Excitement","Arson-Extremism\/Terrorism","Arson-Profit","Arson-Retaliation","Arson-Vandalism","Ash Disposal","Barrel","Blasting","Bonfire","Brake Shoe Particle","Broadcast\/Prescribed Burn","Campfire","Catalyst Welding","Ceremonial\/Cultural","Cigar","Cigarette","Cooking","Cooking Fire","Cultural","Cutting\/Welding","Ditch\/Fence","Drug Operations","Drug Paraphernalia","Dump Burning","Dynamic Grid Failure","Electric Fences","Exhaust System Particle","Exploding Targets","Farming Equipment","Field Burning","Fire Play","Fireworks (Consumer or Personal Use)","Fireworks (Display or Professional Use)","Flares","Flue Sparks","Glass Refraction\/Magnification","Grazing Improvement","Habitat Improvement","Heavy Equipment","Home Outdoor Wood Burning Furnaces","Incendiary Ammunition","Incendiary Device","Incendiary Tracer Ammunition","Land Clearing","Lantern\/Catalytic Heater","Lighter","Logging Equipment","Match(s)","Military Ordinance","Motor Vehicle","Motor Vehicles","Mowing","Muzzle-loading Firearms","Not investigated","Oil and Gas Production","Origin and\/or Cause Not Identified","Origin Destroyed","Other, Known","Other, Unknown","Pipe","Portable Stove","Power Generation\/Transmission","Power Tools","Rail\/Track Grinding","Right-of-Way","Right-of-Way Maintenance","Small Engine Equipment","Smoke Out","Smoker\/Camp Stove","Smoking","Spontaneous Combustion","Starburst Ammunition","Steel Component Ammunition","Structure","Tracer Ammunition","Trash Burning","Under investigation","Warming","Wheel Bearing Failure","Wheel Slip\/Slide","Yard Debris"]};

$('tr').click(function(e) {
  if ($(this).attr('data-url')) {
    e.preventDefault();
	  window.location.href = window.location.href + '/' + $(this).attr('data-url');
	}
});

$(document).on('keyup', '[name^=rp_phone]', function() {
  var tel = $(this).val(),
    np = tel.replace(/[^\d]/g, "");

  $(this).val(np);

  if (np.length == 10) {
    var nprg = np.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
    $(this).val(nprg);
  }
});

$(function() {
  $('[data-toggle="tooltip"]').tooltip();
});

/* Get list of agencies by state */
$('#areas select#state').on('change', function () {
	$('#areas select#agency option, #areas select#unit option').each(function (){
	  if ($(this).val() != '- Select -') { 
		  $(this).remove();
		}
	});
	
	$.ajax({
	  url: host + 'ajax/api/areas/agency',
		method: 'POST',
		dataType: 'json',
		data: {
		  'state': $(this).val()
		},
		success: function(r) {
		  for (var i = 0; i < r.response.length; i++) {
			  $('#areas select#agency').append('<option value="' + r.response[i] + '">' + r.response[i] + '</option>');
			}
			
			$('#areas select#agency').prop('disabled', false);
		}
	});
});

/* Get list of units by state & agency */
$('#areas select#agency').on('change', function() {
	$('#areas select#unit option').each(function (){
	  if ($(this).val() != '- Select -') { 
		  $(this).remove();
		}
	});

	$.ajax({
	  url: host + 'ajax/api/areas/unit',
		method: 'POST',
		dataType: 'json',
		data: {
		  'state': $('#areas select#state').val(),
		  'agency': $(this).val()
		},
		success: function(r) {
		  for (var i = 0; i < r.response.length; i++) {
			  $('#areas select#unit').append('<option value="' + r.response[i][0] + '|' + r.response[i][1] + '">(' + r.response[i][0] + ') ' + r.response[i][1] + '</option>');
			}
			
			$('#areas select#unit').prop('disabled', false);
		}
	});
});

/* Close modal */
$(document).on('click', '[id^=closeModal]', function() {
  closeModal();
});

$('#close-modal').click(function() {
  $('#modal').hide().removeClass('small');
  $('#shadow').hide();
  $('#close-modal').hide();
});

$('.nav-menu ul li a').click(function() {
  $(this).attr('data-menu', 0);
  $('#menu-btn i').removeClass('fa-times').addClass('fa-bars');
  $('.nav-menu').animate({
    left: '-305px'
  }, 400);
});

$('#menu-btn').click(function() {
  if ($(this).attr('data-menu') == '0') {
    $(this).attr('data-menu', 1);
    $('#menu-btn i').removeClass('fa-bars').addClass('fa-times');
    $('.nav-menu').animate({
      left: '0'
    }, 400);
  } else {
    $(this).attr('data-menu', 0);
    $('#menu-btn i').removeClass('fa-times').addClass('fa-bars');
    $('.nav-menu').animate({
      left: '-305px'
    }, 400);
  }
});

/* Function to close modal */
function closeModal() {
  $('#modal').removeClass('small').css('max-width', '500px').hide();
  $('#modal #content').html(loading);
  $('#shadow').hide();
}
