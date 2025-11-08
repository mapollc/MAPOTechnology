<?
if($_REQUEST[mode]=='edit'){
 $row = mysqli_fetch_assoc(mysqli_query($con, "SELECT * FROM $db.incidents WHERE aid = '$agency' AND id = '$_REQUEST[id]'"));
 $details = unserialize($row[details]);
 $status = unserialize($row[status]);
}
?>
<div class="modal-header">
<h2><?=($_REQUEST[mode]=='edit' ? 'Update' : 'Add')?> Incident<?=($_REQUEST[mode]=='edit' ? ' #'.date('Y', $row[reported]).'-'.$row[zone].'-'.str_pad($row[num], '0', 3, STR_PAD_LEFT) : '')?></h2><i class="fas fa-times" id="closeModal"></i>
</div>
<div class="inner-content">

<ul class="nav nav-tabs" id="incidentTabs" role="tablist">
 <li class="nav-item" role="presentation">
  <button class="nav-link active" id="incident-tab" data-bs-toggle="tab" data-bs-target="#incident" role="tab" aria-controls="incident" aria-selected="true">Incident</button>
 </li>
 <li class="nav-item" role="presentation">
  <button class="nav-link" id="fire-tab" data-bs-toggle="tab" data-bs-target="#fire" role="tab" aria-controls="fire" aria-selected="false">Details</button>
 </li>
</ul>

<div class="tab-content" id="incidentTabContent">
<div class="tab-pane fade show active" id="incident" role="tabpanel" aria-labelledby="incident-tab">

<form id="incident" action="" method="">
<input type="hidden" name="form_mode" value="<?=$_REQUEST[mode]?>">
<input type="hidden" name="id" value="<?=$_REQUEST[id]?>">

<div class="row form-head">
 <div class="col-md-4">Incident #</div>
 <div class="col-md-4">Incident Name</div>
 <div class="col-md-4">Incident Type</div>
</div>

<div class="row inner-block">
 <div class="col-md-4">
  <input type="text" class="form-control disabled" style="width:55px" name="year" value="<?=($row[reported] ? date('Y', $row[reported]) : date('Y'))?>">
  -
	<select name="juris" class="form-select" style="width:85px"<?=($row[zone] ? ' data-zone="'.$row[zone].'"' : '')?>></select>
  -
  <input type="text" class="form-control disabled" style="width:65px" name="inc" value="<?=($row[num] ? $row[num] : str_pad($_GET[next], 3, 0, STR_PAD_LEFT))?>">
 </div>
 <div class="col-md-4">
  <input type="text" class="form-control" name="name" placeholder="New" value="<?=$row[name]?>">
 </div>
 <div class="col-md-4">
  <select name="type" class="form-select"<?=($row[type] ? ' data-type="'.$row[type].'"' : '')?>></select>
 </div>
</div>

<div class="row form-head">
 <div class="col-md-3">Incident Date/Time</div>
 <div class="col-md-4">Initial Lat/Lon</div> 
 <div class="col-md-1">Township</div> 
 <div class="col-md-1">Range</div> 
 <div class="col-md-1">Section</div> 
 <div class="col-md-1">SubSec</div> 
</div>

<div class="row inner-block">
 <div class="col-md-3">
  <input type="text" name="date" class="form-control" style="width:100px" value="<?=($row[reported] ? date('m/d/Y', $row[reported]) : date('m/d/Y'))?>">
	<input type="text" name="time" class="form-control" style="width:60px" value="<?=($row[reported] ? date('H:i', $row[reported]) : date('H:i'))?>">
 </div>
 <div class="col-md-4">
  <input type="text" name="lat" class="form-control" style="width:100px" placeholder="45.32" value="<?=$row[lat]?>">
	<input type="text" name="lon" class="form-control" style="width:100px" placeholder="-118.1" value="<?=$row[lon]?>">
 </div>
 <div class="col-md-1">
  <input type="text" name="t" class="form-control" style="width:50px" placeholder="0N" value="<?=$details[t]?>"<?=(!$details[t] ? ' disabled' : '')?>>
 </div>
 <div class="col-md-1">
  <input type="text" name="r" class="form-control" style="width:50px" placeholder="0E" value="<?=$details[r]?>"<?=(!$details[r] ? ' disabled' : '')?>>
 </div>
 <div class="col-md-1">
  <input type="text" name="s" class="form-control" style="width:50px" placeholder="0" value="<?=$details[s]?>"<?=(!$details[s] ? ' disabled' : '')?>>
 </div>
 <div class="col-md-1">
  <input type="text" name="ss" class="form-control" style="width:60px" value="<?=$details[ss]?>">
 </div>
</div>

<div class="row form-head">
 <div class="col-md-2">State</div>
 <div class="col-md-2">Start Acres</div>
 <div class="col-md-2">Current Acres</div>
 <div class="col-md-3">Zone</div>
 <div class="col-md-3">Dispatcher</div>
</div>

<div class="row inner-block">
 <div class="col-md-2">
  <select name="state" class="form-select"><option></option><?foreach($states_array as $k => $v){ echo '<option '.($details[state]==$k ? 'selected ' : '').'value="'.$k.'">'.$k.'</option>'; }?></select>
 </div>
 <div class="col-md-2"><input type="text" name="disc_acres" class="form-control" style="width:80px" value="<?=$details[disc_acres]?>" placeholder="0"></div>
 <div class="col-md-2"><input type="text" name="cur_acres" class="form-control" style="width:80px" value="<?=$details[cur_acres]?>" placeholder="0"></div>
 <div class="col-md-3"><select name="zone" class="form-select" data-zone="<?=$details[zone]?>"><option></option></select></div>
 <div class="col-md-3"><select name="dispatcher" class="form-select"<?echo ($row ? ' data-dispatcher="'.$row[dispatcher].'"' : ''); echo ($_SESSION[uid]!=$row[dispatcher] ? ' disabled' : '');?>></select>
 <?if($_SESSION[uid]!=$row[dispatcher]){echo '<input type="hidden" name="dispatcher" value="'.$row[dispatcher].'">';}?></div>
</div>

<div class="row form-head">
 <div class="col-md-8">Notes</div>
 <div class="col-md-4">Reporting Party</div>
</div>

<div class="row">
 <div class="col-md-8">
  <textarea name="notes" class="form-control" style="min-height:125px"><?=$details[notes]?></textarea>
 </div>
 <div class="col-md-4 stacked">
  <input type="text" class="form-control" name="rp" value="<?=$details[rp]?>" placeholder="Reporting Party">
	<input type="tel" class="form-control" name="rp_phone" value="<?=$details[rp_phone]?>" placeholder="Contact Phone #">
 </div>
</div>

<div class="row text-center">
 <div class="col py-3">
  <input type="submit" class="btn btn-primary" value="Save Incident"> &nbsp; 
  <input type="reset" class="btn btn-secondary" value="Start Over">
 </div>
</div>

</form>
</div>

<div class="tab-pane fade" id="fire" role="tabpanel" aria-labelledby="fire-tab">

<form id="incidentFireData" action="" method="post">

<div class="row inner-block">
 <div class="col-md-6">
  <div class="row form-head">
   <div class="col">Fuels</div>
  </div>

  <div class="row inner-block"> 
	 <div class="col">
	  <div class="row d-flex flex-wrap">
  	 <?foreach($fuel_types as $f){
      echo '<div class="col-sm-3"><div class="form-check"><input type="checkbox" name="fuels[]" class="form-check-input" value="'.$f.'"'.(in_array($f, $details[fuels])===true ? ' checked' : '').'><label class="form-check-label">'.$f.'</label></div></div>';
  	 }?>
		</div>
   </div>
  </div>

  <div class="row form-head">
   <div class="col-md-6">Wind Dir/Speed</div>
   <div class="col-md-6">Aspect/Slope</div>
  </div>

  <div class="row inner-block"> 
   <div class="col-md-6">
	  <select name="wdir" class="form-select"<?=($details[wdir] ? ' data-wdir="'.$details[wdir].'"' : '')?> style="width:60px"><option></option><?=$directional?></select> @ 
		<input type="text" name="wspd" class="form-control" value="<?=$details[wspd]?>" style="width:50px"> mph</div>
   <div class="col-md-6">
	  <select name="aspect" class="form-select"<?=($details[aspect] ? ' data-aspect="'.$details[aspect].'"' : '')?> style="width:60px"><option></option><?=$directional?></select> / 
	  <input type="text" name="slope" class="form-control" value="<?=$details[slope]?>" style="width:50px">&deg;
	 </div>
  </div>
	
 </div>
 
 <div class="col-md-6"> 
  <div class="row form-head">
   <div class="col-md-4">Relative Location</div>
  </div>
	<div class="row inner-block">
   <div class="col"><input type="text" name="location" class="form-control" value="<?=$details[location]?>" placeholder="0 miles N of City, ST"<?=(!$details[location] ? ' disabled' : '')?>></div>
  </div>
	
	<div class="row form-head">
   <div class="col-md-4">Contain</div>
   <div class="col-md-4">Control</div>
   <div class="col-md-4">Out</div>
  </div>
	
	<div class="row inner-block">
   <div class="col-md-4">
	  <input type="text" class="form-control" name="contain_date" placeholder="<?=date('m/d/Y')?>" value="<?=($status ? date('m/d/Y', $status[contain]) : '')?>">
		<input type="text" class="form-control" name="contain_time" placeholder="<?=date('H:i')?>" value="<?=($status ? date('H:i', $status[contain]) : '')?>">
	 </div>
   <div class="col-md-4">
	  <input type="text" class="form-control" name="control_date" placeholder="<?=date('m/d/Y')?>" value="<?=($status ? date('m/d/Y', $status[control]) : '')?>">
		<input type="text" class="form-control" name="control_time" placeholder="<?=date('H:i')?>" value="<?=($status ? date('H:i', $status[control]) : '')?>">
	 </div>
   <div class="col-md-4">
	  <input type="text" class="form-control" name="out_date" placeholder="<?=date('m/d/Y')?>" value="<?=($status ? date('m/d/Y', $status[out]) : '')?>">
		<input type="text" class="form-control" name="out_time" placeholder="<?=date('H:i')?>" value="<?=($status ? date('H:i', $status[out]) : '')?>">
	 </div>
	</div>
 </div>
</div>

<div class="row form-head">
 <div class="col-md-4">Fire Cause</div>
 <div class="col-md-4">Cause (General)</div>
 <div class="col-md-4">Cause (Specific)</div>
</div>

<div class="row inner-block">
 <div class="col-md-4">
  <select name="fire_cause" class="form-select">
	 <option <?=($details[fire_cause]=='Unknown' ? 'selected ' : '')?>value="Unknown">Unknown</option>
	 <option <?=($details[fire_cause]=='Undetermined' ? 'selected ' : '')?>value="Undetermined">Undetermined</option>
	 <option <?=($details[fire_cause]=='Human' ? 'selected ' : '')?>value="Human">Human</option>
	 <option <?=($details[fire_cause]=='Natural' ? 'selected ' : '')?>value="Natural">Natural</option>
	</select>
 </div>
 <div class="col-md-4">
  <select name="fire_cause_general" data-value="<?=$details[fire_cause_general]?>" class="form-select" disabled><option>- Select -</option></select>
 </div>
 <div class="col-md-4">
  <select name="fire_cause_specific" data-value="<?=$details[fire_cause_specific]?>" class="form-select" disabled><option>- Select -</option></select>
 </div>
</div>

</form>

</div>
</div>

</div>

<script>
function fc (t) {
  var arr = (t.val() == 'Human' ? fireCauses.general.human : fireCauses.general.natural);
	
  for (var i = 0; i < arr.length; i++) {
		$('select[name=fire_cause_general]').append('<option ' + ($('select[name=fire_cause_general]').attr('data-value') == arr[i] ? 'selected ' : '') + 'value="' + arr[i] + '">' + arr[i] + '</option>');
	}
	
	$('select[name=fire_cause_general]').prop('disabled', false);
}

$(function() {
  $('input[name=date]').datepicker();
  $('input[name=contain_date]').datepicker();
  $('input[name=control_date]').datepicker();
  $('input[name=out_date]').datepicker();

  $('select[name=wdir] option').each(function() {
	  if ($(this).val() == $('select[name=wdir]').attr('data-wdir')){
		  $(this).prop('selected', true)
		}
	});

  $('select[name=aspect] option').each(function() {
	  if ($(this).val() == $('select[name=aspect]').attr('data-aspect')){
		  $(this).prop('selected', true)
		}
	});
	
	if ($('select[name=fire_cause_general]').attr('data-value') != '') {
	  fc($('select[name=fire_cause'));
	  $('select[name=fire_cause_general]').prop('disabled', false);
	}

	if ($('select[name=fire_cause_specific]').attr('data-value') != '') {
	  $('select[name=fire_cause_specific]').prop('disabled', false);
	}
	
	for (var i = 0; i < fireCauses.specific.length; i++) {
		$('select[name=fire_cause_specific]').append('<option ' + ($('select[name=fire_cause_specific]').attr('data-value') == fireCauses.specific[i] ? 'selected ' : '') + 'value="' + fireCauses.specific[i] + '">' + fireCauses.specific[i] + '</option>');
	}
});
	
$('input[name=disc_acres]').on('blur', function() {
  $('input[name=cur_acres]').val($(this).val());
});

for(var i = 0; i < zones.length; i++) {
  $('select[name=zone]').append('<option ' + ($('select[name=zone]').attr('data-zone') == zones[i] ? 'selected ' : '') + 'value="' + zones[i] + '">' + zones[i] + '</option>');
}

for(var i = 0; i < jurisdictions.length; i++) {
  $('select[name=juris]').append('<option ' + ($('select[name=juris]').attr('data-zone') == jurisdictions[i] ? 'selected ' : '') + 'value="' + jurisdictions[i] + '">' + jurisdictions[i].substr(2, jurisdictions[i].length) + '</option>');
}

for(var i = 0; i < dispatchers.length; i++) {
  uid = ($('select[name=dispatcher]').attr('data-dispatcher') ? $('select[name=dispatcher]').attr('data-dispatcher') : uid);
  $('select[name=dispatcher]').append('<option ' + (uid == dispatchers[i].uid ? 'selected ' : '') + 'value="' + dispatchers[i].uid + '">' + dispatchers[i].name.last + ', ' + dispatchers[i].name.first + '</option>');
}

for(var i = 0; i < incident_types.length; i++) {
  $('select[name=type]').append('<option ' + ($('select[name=type]').attr('data-type') == incident_types[i] ? 'selected ' : '') + 'value="' + incident_types[i] + '">' + incident_types[i] + '</option>');
}

$('select[name=fire_cause]').on('change', function() {
  fc($(this));
});

$('select[name=fire_cause_general]').on('change', function() {
  $('select[name=fire_cause_specific]').prop('disabled', false);
});

$('input[name=lon').blur(function() {
  if ($('input[name=lon').val() != '') {
	  $.ajax({
		  url: 'https://www.fireweatheravalanche.org/api/geocode/trs?token=cd62b422f5f06384ff76db30894fa8b20dd1edf5&lat=' + $('input[name=lat]').val() + '&lon=' + $('input[name=lon]').val() + '&full=1&application=1',
			method: 'POST',
      success: function(d) {
			  $('select[name=state] option').each(function() {
				  if ($(this).val() == d.state) {
					  $(this).prop('selected', true);
					}
			  });
				$('input[name=t]').val(d.trs.all.T).prop('disabled', false);
				$('input[name=r]').val(d.trs.all.R).prop('disabled', false);
				$('input[name=s]').val(d.trs.all.S).prop('disabled', false);
				$('input[name=location]').val(d.geolocation.distance + ' miles ' + d.geolocation.bearing + ' of ' + d.city.city + ', ' + d.city.state_prefix).prop('disabled', false);
			}
		});
  }
});
</script>